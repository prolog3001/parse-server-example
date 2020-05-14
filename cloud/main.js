var users = require('./users.js');
var utils = require('./utils.js');
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
Parse.Cloud.job("ordersPushTest", background.ordersPushTest);
Parse.Cloud.job("readyPushTest", background.readyPushTest);
Parse.Cloud.job("itemsPushTest", background.itemsPushTest);
Parse.Cloud.job("ratePushTest", background.ratePushTest);

Parse.Cloud.define("closeOpenedOrders", background.closeOpenedOrders);
Parse.Cloud.job("closeOpenedOrders", background.closeOpenedOrders);

//Business low orders count
Parse.Cloud.afterSave("RestaurantOrderSummary", function (request) {
    if (request.object.existed() === false) {
        var orderSummaryPointer = request.object;
        console.log("Object Type", orderSummaryPointer.className);

        var businessQuery = new Parse.Query("Business");
        businessQuery.equalTo("objectId", orderSummaryPointer.get("business").id);
        businessQuery.include("admin");

        businessQuery.find({
            useMasterKey: true,
            success: async function (businesses) {
                console.log("Found Business" + businesses.length);
                var business = businesses[0];

                if (business) {
                    var min = business.get("orders_accumulate_min") > 0 ? order.get("orders_accumulate_min") : 50;
                    business.increment("orders_accumulate", -1);

                    if (business.get("orders_accumulate") == min) {
                        //PUSH Low Orders

                        setInterval(function () {
                            return businessQuery;
                        }, 10000); //10 * 1000)

                        var params = {};
                        params["userTokens"] = [business.get("admin").get("fcm_token")];
                        params["business_id"] = business.id;

                        Parse.Cloud.run('pushLowOrders', params, {
                            success: function (result) {
                                try {
                                    business.save(null, { useMasterKey: true })
                                        .then(function (result) {
                                            console.log("sent low orders push");
                                            console.log("Success saving after order decrement", result);
                                            return result;
                                        }, function (error) {
                                            console.log("Error", error);
                                        });
                                } catch (error) {
                                    console.error(error);
                                    return error;
                                }
                            },
                            error: function (error) {
                                console.log('error', error);
                                return error;
                            }
                        });
                    }
                } else {
                    console.log("Not business or dont need changes");
                    return;
                }
            },

            error: function (error) {
                console.log("Query Error", error);
                return error;
            }
        });
    } else {
        var orderSummaryPointer = request.object;
        console.log("Object Type", orderSummaryPointer.className);
        console.log("Maybe notify user on ready items");

        var restaurantOrderSummaryQuery = new Parse.Query("RestaurantOrderSummary");
        restaurantOrderSummaryQuery.equalTo("objectId", orderSummaryPointer.id);
        restaurantOrderSummaryQuery.include("business");
        restaurantOrderSummaryQuery.include("client");
        restaurantOrderSummaryQuery.include("item_orders");
        restaurantOrderSummaryQuery.include("item_orders_ready");

        restaurantOrderSummaryQuery.find({
            useMasterKey: true,
            success: async function (orderSummaries) {
                console.log("Found orderSummaries" + orderSummaries.length);
                var orderSummary = orderSummaries[0];

                if (orderSummary) {
                    if (orderSummary.get("item_orders") &&
                        orderSummary.get("item_orders_ready") &&
                        orderSummary.get("item_orders").length == orderSummary.get("item_orders_ready").length &&
                        !orderSummary.get("notified_client")) {
                        //PUSH All Orders Ready

                        setInterval(function () {
                            return restaurantOrderSummaryQuery;
                        }, 10000); //10 * 1000)

                        orderSummary.set("notified_client", true)
                        orderSummary.save(null, { useMasterKey: true })
                            .then(function (result) {
                                console.log("Success saving after order push", result);

                                var orderMethod = orderSummary.get("take_away") ? (orderSummary.get("address") ?
                                    i18n.__({ phrase: "DELIVERY", locale: "en" }) :
                                    i18n.__({ phrase: "TA", locale: "en" })) :
                                    i18n.__({ phrase: "TA", locale: "en" })

                                var userIds = [];
                                userIds.push(business.get("admin").get("fcm_token"));
                                userIds.push(restaurantOrderSummaryQuery.get("client").get("fcm_token"));

                                var params = {};
                                params["userTokens"] = userIds;
                                params["business_name"] = orderSummary.get("business").get("title");
                                params["order_id"] = orderSummary.id;
                                params["order_method"] = orderMethod;

                                Parse.Cloud.run('pushReadyOrders', params, {
                                    success: function (result) {
                                        try {
                                            console.log("sent ready order push");
                                            return result;
                                        } catch (error) {
                                            console.error(error);
                                            return error;
                                        }
                                    },
                                    error: function (error) {
                                        console.log('error', error);
                                        return error;
                                    }
                                });
                            }, function (error) {
                                console.log("Error", error);
                                return error;
                            });
                    }
                } else {
                    console.log("Not RestaurantOrderSummary or dont need changes");
                    return
                }
            },

            error: function (error) {
                console.log("Query Error", error);
                return error;
            }
        });
    }
})

//Item Low Quantity
Parse.Cloud.afterSave("RestaurantOrder", function (request) {
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
                console.log("Found orders: " + orders.length);
                var order = orders[0];

                if (order && order.className == "RestaurantOrder" &&
                    order.get("restaurant_item")) {

                    if (order.get("restaurant_item").get("units") > 0) {
                        if (order.get("restaurant_item").get("units") == order.get("restaurant_item").get("alert_at_units") - 1) {
                            //PUSH Low Units

                            setInterval(function () {
                                return orderQuery;
                            }, 10000); //10 * 1000)

                            order.get("restaurant_item").increment("units", -1);
                            order.get("restaurant_item").save(null, { useMasterKey: true })
                                .then(function (result) {
                                    console.log("Success saving after units and orders count", result);

                                    var params = {};
                                    params["userTokens"] = [business.get("admin").get("fcm_token")];
                                    params["item_name"] = order.get("restaurant_item").get("title");
                                    params["item_id"] = order.get("restaurant_item").id;

                                    Parse.Cloud.run('pushLowItems', params, {
                                        success: function (result) {
                                            try {
                                                console.log("sent low items push");
                                                return result;
                                            } catch (error) {
                                                console.error(error);
                                                return error;
                                            }
                                        },
                                        error: function (error) {
                                            console.log('error', error);
                                            return error;
                                        }
                                    });
                                }, function (error) {
                                    console.log("Error", error);
                                    return error;
                                });
                        }

                    }
                } else {
                    console.log("Not order or dont need changes");
                    return;
                }
            }, error: function (error) {
                console.log("Query Error", error);
                return error;
            }
        });
    }
})

//Waiter Low Rating
Parse.Cloud.afterSave("Rating", function (request) {
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
                console.log("Found ratings: " + ratings.length);
                var rating = ratings[0];

                if (rating && rating.className == "Rating" &&
                    rating.get("restaurant_order_summary") &&
                    rating.get("restaurant_order_summary").get("waiter")) {

                    if (rating.get("waiter_rating") <= 2) {
                        //PUSH Low Rating

                        setInterval(function() {
                            return ratingQuery;
                        }, 10000); //10 * 1000)

                        var params = {};
                        params["userTokens"] = [business.get("admin").get("fcm_token")];
                        params["star_number"] = order.get("waiter_rating");
                        params["order_id"] = rating.get("restaurant_order_summary").id;

                        Parse.Cloud.run('pushLowRating', params, {
                            success: function (result) {
                                try {
                                    console.log("sent low rating push");
                                    return result;
                                } catch (error) {
                                    console.error(error);
                                    return error;
                                }
                            },
                            error: function (error) {
                                console.log('error', error);
                                return error;
                            }
                        });
                    }
                } else {
                    console.log("Not order or dont need changes");
                    return;
                }
            }, error: function (error) {
                console.log("Query Error", error);
                return error;
            }
        });
    }
})

Parse.Cloud.afterSave("Table", function (request) {
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
