var users = require('./users.js');
var utils = require('./utils.js');
var orders = require('./orders.js');
var push = require('./push.js');
var tables = require('./tables.js');
var background = require('./background.js');
var i18n = require('i18n');

Parse.Cloud.define("sendVerificationCode", users.sendVerificationCode);
Parse.Cloud.job("sendVerificationCode", users.sendVerificationCode);

Parse.Cloud.define("sendTableOrderSMS", users.sendTableOrderSMS);
Parse.Cloud.job("sendTableOrderSMS", users.sendTableOrderSMS);

Parse.Cloud.define("blockUser", users.blockUser);
Parse.Cloud.define("unBlockUser", users.unBlockUser);
Parse.Cloud.define("getFullUsersFromIds", users.getFullUsersFromIds);
Parse.Cloud.define("getFullUserInstallationsFromIds", users.getFullUserInstallationsFromIds);
Parse.Cloud.define("createNewUser", users.createNewUser);
Parse.Cloud.define("saveUserSellerIdByEmail", users.saveUserSellerIdByEmail);
Parse.Cloud.define("saveAndroidUserDeviceToken", users.saveAndroidUserDeviceToken);
Parse.Cloud.define("createPaymentRequest", users.createPaymentRequest);
Parse.Cloud.define("paymentRequestSettled", users.paymentRequestSettled);
Parse.Cloud.define("blockUser", users.blockUser);
Parse.Cloud.define("unBlockUser", users.unBlockUser);

Parse.Cloud.define("sendSMS", utils.sendSMS);
Parse.Cloud.define("uploadImage", utils.uploadImage);
Parse.Cloud.define("dateDSTPresenter", utils.dateDSTPresenter);
Parse.Cloud.define("dateDSTBeforeSessionSave", utils.dateDSTBeforeSessionSave);
Parse.Cloud.define("getRegaxCurrencySign", utils.getRegaxCurrencySign);
Parse.Cloud.define("replaceAll", utils.replaceAll);

Parse.Cloud.define("pushLowOrders", push.pushLowOrders);
Parse.Cloud.define("pushReadyOrders", push.pushReadyOrders);
Parse.Cloud.define("pushLowItems", push.pushLowItems);
Parse.Cloud.define("pushLowRating", push.pushLowRating);

Parse.Cloud.define("forceCloseOpenedOrders", orders.forceCloseOpenedOrders);
Parse.Cloud.define("forcePayOpenedOrders", orders.forcePayOpenedOrders);

Parse.Cloud.job("ordersPushTest", background.ordersPushTest);
Parse.Cloud.job("readyPushTest", background.readyPushTest);
Parse.Cloud.job("itemsPushTest", background.itemsPushTest);
Parse.Cloud.job("ratePushTest", background.ratePushTest);

Parse.Cloud.define("closeOpenedOrders", background.closeOpenedOrders);
Parse.Cloud.job("closeOpenedOrders", background.closeOpenedOrders);

//Business low orders count
Parse.Cloud.afterSave("RestaurantOrderSummary", async function (request) {
    var orderSummaryPointer = request.object;
    console.log("Object Type", orderSummaryPointer.className);

    var restaurantOrderSummaryQuery = new Parse.Query("RestaurantOrderSummary");
    restaurantOrderSummaryQuery.equalTo("objectId", orderSummaryPointer.id);
    restaurantOrderSummaryQuery.include("business");
    restaurantOrderSummaryQuery.include("business.admin");
    restaurantOrderSummaryQuery.include("client");
    restaurantOrderSummaryQuery.include("item_orders");
    restaurantOrderSummaryQuery.include("item_orders_ready");

    restaurantOrderSummaryQuery.find({
        useMasterKey: true,
        success: async function (orderSummaries) {
            try {
                console.log("Found orderSummaries" + orderSummaries.length);
                var orderSummary = orderSummaries[0];

                if (orderSummary) {
                    var business = orderSummary.get("business");

                    if (request.object.existed() === false && business) {
                        console.log("New orderSummary object", orderSummary);

                        var min = business.get("orders_accumulate_min") > 0 ? business.get("orders_accumulate_min") : 50;
                        business.increment("orders_accumulate", -1);
                        business.save(null, { useMasterKey: true })
                            .then(function (result) {
                                console.log("Success saving after order decrement", result);

                                if (business.get("orders_accumulate") == min) {
                                    //PUSH Low Orders
                                    console.log("sent low orders push");

                                    var params = {};
                                    params["userTokens"] = [business.get("admin").get("fcm_token")];
                                    params["business_id"] = business.id;
                                    await push.pushLowOrders(params);
                                }
                            }, function (error) {
                                console.log("Error", error);
                            });
                    }

                    if (!orderSummary.get("notified_client") &&
                        orderSummary.get("item_orders") &&
                        orderSummary.get("item_orders_ready") &&
                        orderSummary.get("item_orders").length == orderSummary.get("item_orders_ready").length) {

                        //PUSH All Orders Ready
                        console.log("Notify on ready items");
                        orderSummary.set("notified_client", true)

                        await orderSummary.save(null, { useMasterKey: true })
                            .then(async function (orderSummaryFromServer) {
                                try {
                                    console.log("Success saving after order push", result);

                                    var orderMethod = orderSummaryFromServer.get("take_away") ? (orderSummaryFromServer.get("address") ?
                                        i18n.__({ phrase: "DELIVERY", locale: "en" }) :
                                        i18n.__({ phrase: "TA", locale: "en" })) :
                                        i18n.__({ phrase: "TA", locale: "en" })

                                    var userIds = [];
                                    userIds.push(business.get("admin").get("fcm_token"));
                                    userIds.push(restaurantOrderSummaryQuery.get("client").get("fcm_token"));

                                    var params = {};
                                    params["userTokens"] = userIds;
                                    params["business_name"] = orderSummaryFromServer.get("business").get("title");
                                    params["order_id"] = orderSummaryFromServer.id;
                                    params["order_method"] = orderMethod;
                                    params["business_id"] = orderSummaryFromServer.get("business").id;
                                    return await push.pushReadyOrders(params);

                                } catch (error) {
                                    console.log("Error", error);
                                    return error;
                                }
                            }, function (error) {
                                console.log("Error", error);
                                return error;
                            });
                    } else if (!orderSummary.get("notified_client")) {
                        console.log("Ready and Ordered are not the same size");
                        return;
                    } else if (orderSummary.get("notified_client")) {
                        console.log("Already notified on order summary");
                        return;
                    }
                } else {
                    console.log("Not order summary or dont need changes");
                    return;
                }

            } catch (error) {
                console.log("error", error);
                return error;
            }
        },

        error: function (error) {
            console.log("Query Error", error);
            return error;
        }
    });
})

//Item Low Quantity
Parse.Cloud.afterSave("RestaurantOrder", async function (request) {
    if (request.object.existed() === false) {
        var orderPointer = request.object;
        console.log("Object Type", orderPointer.className);

        var orderQuery = new Parse.Query("RestaurantOrder");
        orderQuery.equalTo("objectId", orderPointer.id);
        orderQuery.include("business");
        orderQuery.include("business.admin");
        orderQuery.include("restaurant_item");

        orderQuery.find({
            useMasterKey: true,
            success: async function (orders) {
                try {
                    console.log("Found orders: " + orders.length);
                    var order = orders[0];

                    if (order && order.className == "RestaurantOrder" &&
                        order.get("restaurant_item")) {

                        if (order.get("restaurant_item").get("units") > 0) {
                            order.get("restaurant_item").increment("units", -1);
                            await order.get("restaurant_item").save(null, { useMasterKey: true })
                                .then(async function (result) {
                                    try {
                                        console.log("Success saving after units and orders count", result);

                                        if (order.get("restaurant_item").get("units") == order.get("restaurant_item").get("alert_at_units")) {
                                            //PUSH Low Units
                                            var params = {};
                                            params["userTokens"] = [order.get("business").get("admin").get("fcm_token")];
                                            params["item_name"] = order.get("restaurant_item").get("title");
                                            params["item_id"] = order.get("restaurant_item").id;
                                            params["business_id"] = order.get("business").id;

                                            return await push.pushLowItems(params);
                                        } else {
                                            return;
                                        }
                                    } catch (error) {
                                        console.log("error", error);
                                        return error;
                                    }
                                }, function (error) {
                                    console.log("error", error);
                                    return error;
                                });

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
})

//Waiter Low Rating
Parse.Cloud.afterSave("Rating", async function (request) {
    if (request.object.existed() === false) {
        var rating = request.object;
        console.log("Object Type", rating.className);

        var ratingQuery = new Parse.Query("Rating");
        ratingQuery.equalTo("objectId", rating.id);
        ratingQuery.include("business");
        ratingQuery.include("business.admin");
        ratingQuery.include("restaurant_order_summary.waiter");

        ratingQuery.find({
            useMasterKey: true,
            success: async function (ratings) {
                try {
                    console.log("Found ratings: " + ratings.length);
                    var rating = ratings[0];

                    if (rating && rating.className == "Rating" &&
                        rating.get("restaurant_order_summary") &&
                        rating.get("restaurant_order_summary").get("waiter")) {

                        if (rating.get("waiter_rating") <= 2) {
                            //PUSH Low Rating
                            var params = {};
                            params["userTokens"] = [business.get("admin").get("fcm_token")];
                            params["star_number"] = rating.get("waiter_rating");
                            params["order_id"] = rating.get("restaurant_order_summary").id;
                            params["business_id"] = rating.get("business").id;

                            return await push.pushLowRating(params);
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
})

Parse.Cloud.afterSave("Table", async function (request) {
    if (request.object.existed() === false) {
        // It's a new object 
        var table = request.object;
        console.log("Object Type", table.className);
        console.log("Object Title", table.get("title"));

        if (table &&
            table.get("title") == "TA") {
            table.destroy({
                success: function (result) {
                    log('success destroy', result)
                    return result;
                },
                error: function (error) {
                    log('Failed to destroy object, with error code: ' + error.message);
                    return error;
                }
            });
        } else {
            console.log("Not Table or dont need changes");
            return;
        }
    } else {
        // It's an existing object
        return;
    }
})
