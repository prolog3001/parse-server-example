var push = require('./push.js');
var i18n = require('i18n');

module.exports = {
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

function closeOpenedOrders(request, response) {
  var then = new Date();
  then.setHours(then.getHours() - 12);

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.lessThanOrEqualTo("createdAt", then);
  openedOrdersQuery.exists("item_orders");
  openedOrdersQuery.include("item_orders");
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

          if (orderSummaries[i].get("item_orders_delivered") &&
            orderSummaries[i].get("item_orders_delivered").length == orderSummaries[i].get("item_orders").length) {
            console.log("orderSummary is already finished..");
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

async function ordersPushTest() {
  try {
    var params = {};
    params["userTokens"] = ["dX6K0km_Ao0:APA91bHZINjdqtEeU5qbuPuP90PT0mPXNMDw8b4XYX1oT-1gmJB_bdQLltVjkVTBxKuOTixeUQa4q1UtS9RihU90a15kQexNr3UzRAXW9v4kZ46hGzR6z959W0wCPhD7BXT4LZD31I8T"];
    params["business_id"] = "OUPcvgIZAn";
    Parse.Cloud.run('pushLowOrders', params, {
      success: function (result) {
          try{
              
          }catch (error) {
              console.error(error);
          }
      },
      error: function (error) {
          console.log('error', error);
      }
  });
  } catch (error) {
    console.log(error);
  }
}

async function readyPushTest(request) {
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
    Parse.Cloud.run('pushReadyOrders', params, {
      success: function (result) {
          try{
              
          }catch (error) {
              console.error(error);
          }
      },
      error: function (error) {
          console.log('error', error);
      }
  });
  } catch (error) {
    console.log(error);
  }
}

async function itemsPushTest() {
  try {
    var params = {};
    params["userTokens"] = ["dX6K0km_Ao0:APA91bHZINjdqtEeU5qbuPuP90PT0mPXNMDw8b4XYX1oT-1gmJB_bdQLltVjkVTBxKuOTixeUQa4q1UtS9RihU90a15kQexNr3UzRAXW9v4kZ46hGzR6z959W0wCPhD7BXT4LZD31I8T"];
    params["item_name"] = "TEST ITEM NAME";
    params["item_id"] = "0Cl1cNELHf";
    Parse.Cloud.run('pushLowItems', params, {
      success: function (result) {
          try{
              
          }catch (error) {
              console.error(error);
          }
      },
      error: function (error) {
          console.log('error', error);
      }
  });
  } catch (error) {
    console.log(error);
  }
}

async function ratePushTest() {
  try {
    var params = {};
    params["userTokens"] = ["dX6K0km_Ao0:APA91bHZINjdqtEeU5qbuPuP90PT0mPXNMDw8b4XYX1oT-1gmJB_bdQLltVjkVTBxKuOTixeUQa4q1UtS9RihU90a15kQexNr3UzRAXW9v4kZ46hGzR6z959W0wCPhD7BXT4LZD31I8T"];
    params["star_number"] = 2;
    params["order_id"] = "npt2mC7QJA";
    Parse.Cloud.run('pushLowRating', params, {
      success: function (result) {
          try{
              
          }catch (error) {
              console.error(error);
          }
      },
      error: function (error) {
          console.log('error', error);
      }
  });
  } catch (error) {
    console.log(error);
  }
}
