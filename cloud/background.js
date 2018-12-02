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
      for (var i = 0; i < orderSummaries.length; ++i) {
        try {
          if (!orderSummaries[i] || orderSummaries[i] === null || orderSummaries[i] === undefined) {
            console.log("orderSummary is null..");
            continue;
          }

          var itemOrders = orderSummaries[i].get("item_orders");
          orderSummaries[i].remove("item_orders_in_progress");
          orderSummaries[i].remove("item_orders_ready");
          orderSummaries[i].remove("item_orders_delivered");
          orderSummaries[i].set("item_orders_delivered", itemOrders);
          orderSummaries[i].set("paid", true);
        } catch (error) {
          console.error(error);
        }
      }

      if (orderSummaries.length > 0) {
        console.log("Try to save all - " + orderSummaries.length);
        for(var i=0 ; i<orderSummaries.length ; i++){
          console.log("Try to save - " + orderSummaries[i]);
        }

        Parse.Object.saveAll(orderSummaries, {
          useMasterKey: true,
          success: function (editedOrderSummaries) {
            console.log("#### Saved Order Summary Array  " + orderSummaries.length);
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
