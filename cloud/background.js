var push = require('./push.js');
var i18n = require('i18n');

module.exports = {
  deleteTATables: function (request, response) {
    deleteTATables(request, response);
  },
  closeOpenedOrders: function (request, response) {
    closeOpenedOrders(request, response);
  },
  ordersPushTest: function (request, response) {
    ordersPushTest(request, response);
  },
  readyPushTest: function (request, response) {
    readyPushTest(request, response);
  },
  itemsPushTest: function (request, response) {
    itemsPushTest(request, response);
  },
  ratePushTest: function (request, response) {
    ratePushTest(request, response);
  }
};

function deleteTATables(request, response) {
  var then = new Date();
  then.setHours(then.getHours() - 12);

  var taTablesQuery = new Parse.Query("Table");
  taTablesQuery.equalTo("title", "TA");
  taTablesQuery.notEqualTo("seats", -1);
  taTablesQuery.limit(1000);
  taTablesQuery.find({
    useMasterKey: true,
    success: function (tables) {
      console.log("#### Tables to Close " + tables.length);

      if (tables.length > 0) {
        console.log("Try to delete all TA tables- " + tables.length);

        Parse.Object.destroyAll(tables, {
          useMasterKey: true,
          success: function (result) {
            console.log("#### Deleted all TA tables");
            response.success("Deleted all TA tables");
          },
          error: function (error) {
            console.log("Wasnt able to delete  " + error);
            response.error("Wasnt able to delete  " + error);
          }
        });
      } else {
        console.log("#### We have NO TA tables from past week");
        response.error('We have NO TA tables from past week');
      }
    },
    error: function () {
      response.error('Wasnt able to find TA tables');
    }
  });
}

function closeOpenedOrders(request, response) {
  var then = new Date();
  then.setHours(then.getHours() - 12);

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.lessThanOrEqualTo("createdAt", then);
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders_in_progress");
  openedOrdersQuery.include("item_orders_ready");
  openedOrdersQuery.include("item_orders_delivered");
  openedOrdersQuery.notEqualTo("paid", true);
  openedOrdersQuery.limit(100);
  openedOrdersQuery.find({
    useMasterKey: true,
    success: function (orderSummaries) {
      console.log("#### Orders to Close " + orderSummaries.length);
      // console.log("#### Orders to Close " + JSON.stringify(orderSummaries));

      var clonedOrderSummary = [];

      for (var i = 0; i < orderSummaries.length; i++) {
        try {
          if (!orderSummaries[i] || orderSummaries[i] === null || orderSummaries[i] === undefined) {
            console.log("orderSummary is null..");
            continue;
          }

          var itemOrders = orderSummaries[i].get("item_orders");

          if (itemOrders && itemOrders.length) {

            for (var j = 0; j < itemOrders.length; j++) {
              var specificOrderDish = itemOrders[j];
              if (!specificOrderDish.get("started"))
                specificOrderDish.set("started", new Date());

              if (!specificOrderDish.get("ready"))
                specificOrderDish.set("ready", new Date());

              specificOrderDish.set("delivered", new Date());
            }

            orderSummaries[i].unset("item_orders_in_progress");
            orderSummaries[i].unset("item_orders_ready");
            orderSummaries[i].unset("item_orders_delivered");
            orderSummaries[i].set("item_orders_in_progress", []);
            orderSummaries[i].set("item_orders_ready", []);
            orderSummaries[i].set("item_orders_delivered", itemOrders);
          } else {
            orderSummaries[i].unset("item_orders");
            orderSummaries[i].unset("item_orders_in_progress");
            orderSummaries[i].unset("item_orders_ready");
            orderSummaries[i].unset("item_orders_delivered");
            orderSummaries[i].set("item_orders", []);
            orderSummaries[i].set("item_orders_in_progress", []);
            orderSummaries[i].set("item_orders_ready", []);
            orderSummaries[i].set("item_orders_delivered", []);
          }

          orderSummaries[i].set("paid", true);
          orderSummaries[i].set("rated", true);

          clonedOrderSummary.push(orderSummaries[i]);
        } catch (error) {
          console.error(error);
        }
      }

      if (clonedOrderSummary.length > 0) {
        console.log("Try to save all - " + clonedOrderSummary.length);
        // for(var i=0 ; i<orderSummaries.length ; i++){
        //   console.log("Try to save - " + JSON.stringify(orderSummaries[i]));
        // }

        Parse.Object.saveAll(clonedOrderSummary, {
          useMasterKey: true,
          success: function (clonedOrderSummary) {
            console.log("#### Saved Order Summary Array  " + clonedOrderSummary.length);
            response.success("Saved Order Summary Array  " + clonedOrderSummary.length);
          },
          error: function (error) {
            console.log("Wasnt able to save  " + error);
            response.error('Wasnt able to find opened orders');
          }
        });
      } else {
        console.log("#### We have NO opened orders from 12 hours back or more");
        response.error('We have NO opened orders from 12 hours back or more');
      }
    },
    error: function () {
      response.error('Wasnt able to find opened orders');
    }
  });
}

async function ordersPushTest(request, response) {
  try {
    var params = {};
    params["userTokens"] = ["dX6K0km_Ao0:APA91bHZINjdqtEeU5qbuPuP90PT0mPXNMDw8b4XYX1oT-1gmJB_bdQLltVjkVTBxKuOTixeUQa4q1UtS9RihU90a15kQexNr3UzRAXW9v4kZ46hGzR6z959W0wCPhD7BXT4LZD31I8T"];
    params["business_id"] = "OUPcvgIZAn";

    return await push.pushLowOrders(params);
  } catch (error) {
    console.log(error);
    if (response)
      response.error(error);
    return error;
  }
}

async function readyPushTest(request, response) {
  try {
    var orderMethod = i18n.__({ phrase: "DELIVERY", locale: "en" });

    var userIds = [];
    userIds.push("dX6K0km_Ao0:APA91bHZINjdqtEeU5qbuPuP90PT0mPXNMDw8b4XYX1oT-1gmJB_bdQLltVjkVTBxKuOTixeUQa4q1UtS9RihU90a15kQexNr3UzRAXW9v4kZ46hGzR6z959W0wCPhD7BXT4LZD31I8T");
    userIds.push("cFmwVPOqeAY:APA91bEDLql7rU5AoS1_6eTkU-C_rIDoDW3ODGJTz8_JEsjqnVPVJr5Rl3Q9HNZfFstBuaVBmUdUpwr82lbNs87LBjWDy8_rB3j5ZNJPbFL246-_tezTusoytTl2y707V4PFWMiA-WHr");

    var params = {};
    params["userTokens"] = userIds;
    params["business_name"] = "TEST BUSINESS NAME";   
    params["order_id"] = "npt2mC7QJA";
    params["order_method"] = orderMethod;
    params["business_id"] = "OUPcvgIZAn";

    return await push.pushReadyOrders(params);
  } catch (error) {
    console.log(error);
    if (response)
      response.error(error);
    return error;
  }
}

async function itemsPushTest(request, response) {
  try {
    var params = {};
    params["userTokens"] = ["dX6K0km_Ao0:APA91bHZINjdqtEeU5qbuPuP90PT0mPXNMDw8b4XYX1oT-1gmJB_bdQLltVjkVTBxKuOTixeUQa4q1UtS9RihU90a15kQexNr3UzRAXW9v4kZ46hGzR6z959W0wCPhD7BXT4LZD31I8T"];
    params["item_name"] = "TEST ITEM NAME";
    params["item_id"] = "0Cl1cNELHf";
    params["business_id"] = "OUPcvgIZAn";

    return await push.pushLowItems(params);
  } catch (error) {
    console.log(error);
    if (response)
      response.error(error);
    return error;
  }
}

async function ratePushTest(request, response) {
  try {
    var params = {};
    params["userTokens"] = ["dX6K0km_Ao0:APA91bHZINjdqtEeU5qbuPuP90PT0mPXNMDw8b4XYX1oT-1gmJB_bdQLltVjkVTBxKuOTixeUQa4q1UtS9RihU90a15kQexNr3UzRAXW9v4kZ46hGzR6z959W0wCPhD7BXT4LZD31I8T"];
    params["star_number"] = 2;
    params["order_id"] = "npt2mC7QJA";
    params["business_id"] = "OUPcvgIZAn";

    return await push.pushLowRating(params);
  } catch (error) {
    console.log(error);
    if (response)
      response.error(error);
    return error;
  }
}
