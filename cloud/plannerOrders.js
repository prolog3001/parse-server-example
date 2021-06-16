
var push = require('./push.js');
var utils = require('./utils.js');
var moment = require('moment-timezone');


module.exports = {
  plannerOrderPushQuery: function (user, order, action) {
    plannerOrderPushQuery(user, order, action);
  },
  plannerOrderPushAction: function (user, order, action) {
    plannerOrderPushAction(user, order, action);
  }
};

async function plannerOrderPushQuery(user, order, action) {
  console.log("plannerOrderPushQuery");
  return new Promise(async (resolve, reject) => {
    console.log("plannerOrderPushQuery user", user);
    console.log("plannerOrderPushQuery order", order);
    console.log("plannerOrderPushQuery action", action);

    var orderQuery = new Parse.Query("Order");
    orderQuery.equalTo("objectId", order.id);
    orderQuery.include("business");
    orderQuery.include("table");
    orderQuery.include("business.admin");
    orderQuery.include("business.admin.sub_admins");

    orderQuery.find({
      useMasterKey: true,
      success: async function (orders) {
        try {
          console.log("Found orders: " + orders.length);
          var order = orders[0];

          await plannerOrderPushAction(user, order, action)
          resolve();
        } catch (error) {
          console.log("error", error);
          reject(error);
        }
      }, error: function (error) {
        console.log("Query Error", error);
        reject(error);
      }
    });
  });
}

async function plannerOrderPushAction(user, order, action) {
  console.log("plannerOrderPushAction");
  return new Promise(async (resolve, reject) => {
    try {
      if (order && order.className == "Order") {
        var time = moment(order.get("start_time"))
        console.log("time old", time.format('HH:mm'));

        if (order.get("business").get("location") &&
          order.get("business").get("location").latitude &&
          order.get("business").get("location").longitude) {
          var timezone = geoTz(
            order.get("business").get("location").latitude,
            order.get("business").get("location").longitude
          );
          console.log("timezone", timezone);
          time = moment.tz(time, timezone);
          console.log("time new", time.format('HH:mm'));
        }

        var params = {};
        params["admin_name"] = user ? user.get("name") : "User";
        params["user_name"] = order.get("name");
        params["table_name"] = order.get("table").get("title");
        params["order_date"] = moment(order.get("date")).format('DD/MM/YYYY');
        params["order_time"] = time.format('HH:mm');
        params["order_remark"] = order.get("note");

        params["userTokens"] = [];

        if (!user || user.id != order.get("business").get("admin").id)
          params["userTokens"].push(order.get("business").get("admin").get("fcm_token"));

        var subAdmins = await utils.getObjectsInRelation(order.get("business")
          .get("admin").get("sub_admins"));

        if (subAdmins && subAdmins.length) {
          console.log("plannerOrderPushAction subAdmins", subAdmins.length);
          for (var subAdmin of subAdmins) {
            if (subAdmin.get("fcm_token") && (!user || user.id != subAdmin.id))
              params["userTokens"].push(subAdmin.get("fcm_token"));
          }
        }

        params["order_id"] = order.id;
        params["business_id"] = order.get("business").id;

        switch (action) {
          case "new":
            console.log("plannerOrderPushAction new");
            await push.pushNewPlannerOrder(params);
            break;
          case "changed":
            console.log("plannerOrderPushAction changed");
            await push.pushPlannerOrderChanged(params);
            break;
          case "cancelled":
            console.log("plannerOrderPushAction cancelled");
            await push.pushPlannerOrderCancelled(params);
            break;
          default:
            break;
        }
        resolve();

      } else {
        console.log("Not order or dont need changes");
        reject();
      }
    } catch (error) {
      console.log("error", error);
      reject(error);
    }
  });
}
