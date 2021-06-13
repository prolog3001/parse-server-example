
var push = require('./push.js');

module.exports = {
  plannerOrderPushAction: function (user, order, action) {
    plannerOrderPushAction(user, order, action);
  }
};

function plannerOrderPushAction(user, order, action) {
  console.log("plannerOrderPushAction");
  console.log("plannerOrderPushAction user", user);
  console.log("plannerOrderPushAction order", order);
  console.log("plannerOrderPushAction action", action);

  var orderQuery = new Parse.Query("Order");
  orderQuery.equalTo("objectId", order.id);
  orderQuery.include("business");
  orderQuery.include("business.admin");
  orderQuery.include("business.admin.sub_admins");

  orderQuery.find({
    useMasterKey: true,
    success: async function (orders) {
      try {
        console.log("Found orders: " + orders.length);
        var order = orders[0];

        if (order && order.className == "Order") {
          var params = {};
          params["userTokens"] = [];

          if (!user || user.id != order.get("business").get("admin").id)
            params["userTokens"].push(order.get("business").get("admin").get("fcm_token"));

          var subAdmins = order.get("business").get("admin").get("sub_admins");
          if (subAdmins && subAdmins.length) {
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
              return await push.pushNewPlannerOrder(params);
            case "changed":
              console.log("plannerOrderPushAction changed");
              return await push.pushPlannerOrderChanged(params);
            case "cancelled":
              console.log("plannerOrderPushAction cancelled");
              return await push.pushPlannerOrderCancelled(params);

            default:
              break;
          }
        } else {
          console.log("Not order or dont need changes");
          return;
        }
      } catch (error) {
        console.log("error", error);
        return error;
      }
    }, error: function (error) {
      console.log("Query Error", error);
      return error;
    }
  });
}
