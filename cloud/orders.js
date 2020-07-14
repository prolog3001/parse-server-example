module.exports = {
  forceOrderedOpenedOrders: function (request, response) {
    forceOrderedOpenedOrders(request, response);
  },
  forceProgressOpenedOrders: function (request, response) {
    forceProgressOpenedOrders(request, response);
  },
  forceReadyOpenedOrders: function (request, response) {
    forceReadyOpenedOrders(request, response);
  },
  forceDeliverOpenedOrders: function (request, response) {
    forceDeliverOpenedOrders(request, response);
  },
  forcePayOpenedOrders: function (request, response) {
    forcePayOpenedOrders(request, response);
  },
  forceCloseOpenedOrders: function (request, response) {
    forceCloseOpenedOrders(request, response);
  }
};

async function forceOrderedOpenedOrders(request, response) {
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var Business = Parse.Object.extend("Business");
  var business = new Business({
    id: request.params.businessId
  });

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.equalTo("business", business);
  if (request.params.orderSummaryId) {
    openedOrdersQuery.equalTo("objectId", request.params.orderSummaryId);
  }
  openedOrdersQuery.greaterThanOrEqualTo("createdAt", oneWeekAgo);
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders_in_progress");
  openedOrdersQuery.include("item_orders_ready");
  openedOrdersQuery.include("item_orders_delivered");
  openedOrdersQuery.limit(1000);
  openedOrdersQuery.find({
    useMasterKey: true,
    success: function (orderSummaries) {
      console.log("#### Orders to Ordered " + orderSummaries.length);
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
              specificOrderDish.unset("started");
              specificOrderDish.unset("ready");
              specificOrderDish.unset("delivered");
            }

            orderSummaries[i].unset("item_orders_in_progress");
            orderSummaries[i].unset("item_orders_ready");
            orderSummaries[i].unset("item_orders_delivered");
            orderSummaries[i].set("item_orders_in_progress", []);
            orderSummaries[i].set("item_orders_ready", []);
            orderSummaries[i].set("item_orders_delivered", []);
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

          clonedOrderSummary.push(orderSummaries[i]);
        } catch (error) {
          console.error(error);
        }
      }

      if (clonedOrderSummary.length > 0) {
        console.log("Try to save all - " + clonedOrderSummary.length);
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

async function forceProgressOpenedOrders(request, response) {
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var Business = Parse.Object.extend("Business");
  var business = new Business({
    id: request.params.businessId
  });

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.equalTo("business", business);
  if (request.params.orderSummaryId) {
    openedOrdersQuery.equalTo("objectId", request.params.orderSummaryId);
  }
  openedOrdersQuery.greaterThanOrEqualTo("createdAt", oneWeekAgo);
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders_in_progress");
  openedOrdersQuery.include("item_orders_ready");
  openedOrdersQuery.include("item_orders_delivered");
  openedOrdersQuery.limit(1000);
  openedOrdersQuery.find({
    useMasterKey: true,
    success: function (orderSummaries) {
      console.log("#### Orders to Progress " + orderSummaries.length);
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
              specificOrderDish.set("started", new Date());
              specificOrderDish.unset("ready");
              specificOrderDish.unset("delivered");
            }

            orderSummaries[i].unset("item_orders_in_progress");
            orderSummaries[i].unset("item_orders_ready");
            orderSummaries[i].unset("item_orders_delivered");
            orderSummaries[i].set("item_orders_in_progress", itemOrders);
            orderSummaries[i].set("item_orders_ready", []);
            orderSummaries[i].set("item_orders_delivered", []);
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

          clonedOrderSummary.push(orderSummaries[i]);
        } catch (error) {
          console.error(error);
        }
      }

      if (clonedOrderSummary.length > 0) {
        console.log("Try to save all - " + clonedOrderSummary.length);
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

async function forceReadyOpenedOrders(request, response) {
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var Business = Parse.Object.extend("Business");
  var business = new Business({
    id: request.params.businessId
  });

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.equalTo("business", business);
  if (request.params.orderSummaryId) {
    openedOrdersQuery.equalTo("objectId", request.params.orderSummaryId);
  }
  openedOrdersQuery.greaterThanOrEqualTo("createdAt", oneWeekAgo);
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders_in_progress");
  openedOrdersQuery.include("item_orders_ready");
  openedOrdersQuery.include("item_orders_delivered");
  openedOrdersQuery.limit(1000);
  openedOrdersQuery.find({
    useMasterKey: true,
    success: function (orderSummaries) {
      console.log("#### Orders to Close " + orderSummaries.length);
      // console.log("#### Orders to Ready " + JSON.stringify(orderSummaries));

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
              specificOrderDish.set("started", new Date());
              specificOrderDish.set("ready", new Date());
              specificOrderDish.unset("delivered");
            }

            orderSummaries[i].unset("item_orders_in_progress");
            orderSummaries[i].unset("item_orders_ready");
            orderSummaries[i].unset("item_orders_delivered");
            orderSummaries[i].set("item_orders_in_progress", []);
            orderSummaries[i].set("item_orders_ready", itemOrders);
            orderSummaries[i].set("item_orders_delivered", []);
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

          clonedOrderSummary.push(orderSummaries[i]);
        } catch (error) {
          console.error(error);
        }
      }

      if (clonedOrderSummary.length > 0) {
        console.log("Try to save all - " + clonedOrderSummary.length);
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

async function forceDeliverOpenedOrders(request, response) {
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var Business = Parse.Object.extend("Business");
  var business = new Business({
    id: request.params.businessId
  });

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.equalTo("business", business);
  if (request.params.orderSummaryId) {
    openedOrdersQuery.equalTo("objectId", request.params.orderSummaryId);
  }
  openedOrdersQuery.greaterThanOrEqualTo("createdAt", oneWeekAgo);
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders_in_progress");
  openedOrdersQuery.include("item_orders_ready");
  openedOrdersQuery.include("item_orders_delivered");
  openedOrdersQuery.limit(1000);
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

          clonedOrderSummary.push(orderSummaries[i]);
        } catch (error) {
          console.error(error);
        }
      }

      if (clonedOrderSummary.length > 0) {
        console.log("Try to save all - " + clonedOrderSummary.length);
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

async function forcePayOpenedOrders(request, response) {
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var Business = Parse.Object.extend("Business");
  var business = new Business({
    id: request.params.businessId
  });

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.equalTo("business", business);
  if (request.params.orderSummaryId) {
    openedOrdersQuery.equalTo("objectId", request.params.orderSummaryId);
  }
  openedOrdersQuery.greaterThanOrEqualTo("createdAt", oneWeekAgo);
  openedOrdersQuery.notEqualTo("paid", true);
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders_in_progress");
  openedOrdersQuery.include("item_orders_ready");
  openedOrdersQuery.include("item_orders_delivered");
  openedOrdersQuery.limit(1000);
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

          orderSummaries[i].set("paid", true);
          orderSummaries[i].set("discount", 100);

          clonedOrderSummary.push(orderSummaries[i]);
        } catch (error) {
          console.error(error);
        }
      }

      if (clonedOrderSummary.length > 0) {
        console.log("Try to save all - " + clonedOrderSummary.length);
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

async function forceCloseOpenedOrders(request, response) {
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  var Business = Parse.Object.extend("Business");
  var business = new Business({
    id: request.params.businessId
  });

  var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
  openedOrdersQuery.equalTo("business", business);
  if (request.params.orderSummaryId) {
    openedOrdersQuery.equalTo("objectId", request.params.orderSummaryId);
  }
  openedOrdersQuery.greaterThanOrEqualTo("createdAt", oneWeekAgo);
  // openedOrdersQuery.notEqualTo("paid", true);
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders");
  openedOrdersQuery.include("item_orders_in_progress");
  openedOrdersQuery.include("item_orders_ready");
  openedOrdersQuery.include("item_orders_delivered");
  openedOrdersQuery.limit(500);
  openedOrdersQuery.find({
    useMasterKey: true,
    success: async function (orderSummaries) {
      console.log("#### Orders to Close " + orderSummaries.length);
      // console.log("#### Orders to Close " + JSON.stringify(orderSummaries));

      if (request.params.markDelivered) {
        await forceDeliverOpenedOrders(request, response);
        console.log("#### Orders marked as delivered");
      }

      var clonedOrderSummary = [];

      for (var i = 0; i < orderSummaries.length; i++) {
        try {
          if (!orderSummaries[i] || orderSummaries[i] === null || orderSummaries[i] === undefined) {
            console.log("orderSummary is null..");
            continue;
          }

          if (orderSummaries[i].get("closed_by_admin") || orderSummaries[i].get("closed_by_waiter")) {
            console.log("orderSummary is closed already..");
            continue;
          }

          if (request.params.byAdmin) {
            orderSummaries[i].set("closed_by_admin", true);
          } else {
            orderSummaries[i].set("closed_by_waiter", true);
          }

          if (!orderSummaries[i].get("paid")) {
            orderSummaries[i].set("paid", true);
            orderSummaries[i].set("discount", 100);
          }
          // orderSummaries[i].set("rated", true);

          clonedOrderSummary.push(orderSummaries[i]);
        } catch (error) {
          console.error(error);
        }
      }

      if (clonedOrderSummary.length > 0) {
        console.log("Try to save all - " + clonedOrderSummary.length);
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
