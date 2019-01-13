module.exports = {
  closeOpenedOrders: function (request, response) {
    closeOpenedOrders(request, response);
  }
};

function closeOpenedOrders(request, response) {
  var then = new Date();
  then.setHours(then.getHours() - 24);

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.lessThanOrEqualTo("updatedAt", then);
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

          var itemOrders = orderSummaries[i].get("item_orders");
          if(itemOrders && itemOrders.length){
            orderSummaries[i].set("item_orders_in_progress", itemOrders);
            orderSummaries[i].set("item_orders_ready", itemOrders);
            orderSummaries[i].set("item_orders_delivered", itemOrders);
          } else{
            orderSummaries[i].remove("item_orders", itemOrders);
            orderSummaries[i].remove("item_orders_in_progress", itemOrders);
            orderSummaries[i].remove("item_orders_ready", itemOrders);
            orderSummaries[i].remove("item_orders_delivered", itemOrders);
            orderSummaries[i].set("item_orders", []);
            orderSummaries[i].set("item_orders_delivered", []);
          }
          orderSummaries[i].set("paid", true);

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
          },
          error: function (error) {
            console.log("wasnt able to save  " + error);
            response.error('Wasnt able to find opened orders');
          }
        });
      } else {
        console.log("#### We have NO opened orders from 12 hours back or more");
      }
    },
    error: function () {
      response.error('Wasnt able to find opened orders');
    }
  });
}
