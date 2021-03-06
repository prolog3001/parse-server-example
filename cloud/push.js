const i18n = require('i18n');
var moment = require('moment');

module.exports = {
    pushNewPlannerOrder: (request, response) => {
        return pushNewPlannerOrder(request, response);
    },
    pushPlannerOrderChanged: (request, response) => {
        return pushPlannerOrderChanged(request, response);
    },
    pushPlannerOrderCancelled: (request, response) => {
        return pushPlannerOrderCancelled(request, response);
    },
    pushLowOrders: (request, response) => {
        return pushLowOrders(request, response);
    },
    pushReadyOrders: (request, response) => {
        return pushReadyOrders(request, response);
    },
    pushLowItems: (request, response) => {
        return pushLowItems(request, response);
    },
    pushLowRating: (request, response) => {
        return pushLowRating(request, response);
    },
    getPushType
};

//Planner new order
async function pushNewPlannerOrder(params, response) {
    return new Promise((resolve, reject) => {
        try {
            console.log('pushNewPlannerOrder');
            console.log("params", params);

            var users = params.userTokens;

            var pushTitle = i18n.__({ phrase: "PLANNER_NEW_ORDER_TITLE", locale: "en" });
            pushTitle = pushTitle.replace("admin_name", params["admin_name"]);

            var pushAlert = i18n.__({ phrase: "PLANNER_PUSH_ORDER", locale: "en" });
            pushAlert = pushAlert.replace("user_name", params["user_name"] ? params["user_name"] : "Client");
            pushAlert = pushAlert.replace("table_name", params["table_name"] ? params["table_name"] : "Table");
            pushAlert = pushAlert.replace("order_date", params["order_date"] ? params["order_date"] : "01/01/2001");
            pushAlert = pushAlert.replace("order_time", params["order_time"] ? params["order_time"] : "23:24");

            if(params["order_remark"])
            pushAlert = pushAlert.replace("order_remark", params["order_remark"]);
            else
            pushAlert = pushAlert.replace("*order_remark", "");

            var pushData = {
                alert: pushAlert,
                session_alert: pushAlert,
                push_title: pushTitle,
                push_type: getPushType("PLANNER_NEW_ORDER"),
                push_business_id: params.business_id,
                push_object_id: params.business_id,
                push_badge: "Increment"
            };
            sendPushNoAdapter(users, pushData, response);
            resolve();
        } catch (error) {
            console.log('error', error);
            reject(error);
        }
    });
}

//Planner changed order
async function pushPlannerOrderChanged(params, response) {
    return new Promise((resolve, reject) => {
        try {
            console.log('pushPlannerOrderChanged');
            console.log("params", params);

            var users = params.userTokens;

            var pushTitle = i18n.__({ phrase: "PLANNER_CHANGED_ORDER_TITLE", locale: "en" });
            pushTitle = pushTitle.replace("admin_name", params["admin_name"]);

            var pushAlert = i18n.__({ phrase: "PLANNER_PUSH_ORDER", locale: "en" });
            pushAlert = pushAlert.replace("user_name", params["user_name"] ? params["user_name"] : "Client");
            pushAlert = pushAlert.replace("table_name", params["table_name"] ? params["table_name"] : "Table");
            pushAlert = pushAlert.replace("order_date", params["order_date"] ? params["order_date"] : "01/01/2001");
            pushAlert = pushAlert.replace("order_time", params["order_time"] ? params["order_time"] : "23:24");

            if(params["order_remark"])
            pushAlert = pushAlert.replace("order_remark", params["order_remark"]);
            else
            pushAlert = pushAlert.replace("*order_remark", "");


            var pushData = {
                alert: pushAlert,
                session_alert: pushAlert,
                push_title: pushTitle,
                push_type: getPushType("PLANNER_CHANGED_ORDER"),
                push_business_id: params.business_id,
                push_object_id: params.business_id,
                push_badge: "Increment"
            };
            sendPushNoAdapter(users, pushData, response);
            resolve();
        } catch (error) {
            console.log('error', error);
            reject(error);
        }
    });
}

//Planner deleted order
async function pushPlannerOrderCancelled(params, response) {
    return new Promise((resolve, reject) => {
        try {
            console.log('pushPlannerOrderCancelled');
            console.log("params", params);

            var users = params.userTokens;

            var pushTitle = i18n.__({ phrase: "PLANNER_CANCELLED_ORDER_TITLE", locale: "en" });
            pushTitle = pushTitle.replace("admin_name", params["admin_name"]);

            var pushAlert = i18n.__({ phrase: "PLANNER_PUSH_ORDER", locale: "en" });
            pushAlert = pushAlert.replace("user_name", params["user_name"] ? params["user_name"] : "Client");
            pushAlert = pushAlert.replace("table_name", params["table_name"] ? params["table_name"] : "Table");
            pushAlert = pushAlert.replace("order_date", params["order_date"] ? params["order_date"] : "01/01/2001");
            pushAlert = pushAlert.replace("order_time", params["order_time"] ? params["order_time"] : "23:24");

            if(params["order_remark"])
            pushAlert = pushAlert.replace("order_remark", params["order_remark"]);
            else
            pushAlert = pushAlert.replace("*order_remark", "");

            var pushData = {
                alert: pushAlert,
                session_alert: pushAlert,
                push_title: pushTitle,
                push_type: getPushType("PLANNER_CANCELLED_ORDER"),
                push_business_id: params.business_id,
                push_object_id: params.business_id,
                push_badge: "Increment"
            };
            sendPushNoAdapter(users, pushData, response);
            resolve();
        } catch (error) {
            console.log('error', error);
            reject(error);
        }
    });
}

//Business low orders push
async function pushLowOrders(params, response) {
    return new Promise((resolve, reject) => {
        try {
            console.log('pushLowOrders');
            console.log("params", params);

            var users = params.userTokens;

            var pushTitle = i18n.__({ phrase: "LOW_ORDERS_TITLE", locale: "en" });

            var pushAlert = i18n.__({ phrase: "LOW_ORDERS", locale: "en" });

            var pushData = {
                alert: pushAlert,
                session_alert: pushAlert,
                push_title: pushTitle,
                push_type: getPushType("LOW_ORDERS"),
                push_business_id: params.business_id,
                push_object_id: params.business_id,
                push_badge: "Increment"
            };
            sendPushNoAdapter(users, pushData, response);
            resolve();
        } catch (error) {
            console.log('error', error);
            reject(error);
        }
    });
}

//All Orders Ready push
async function pushReadyOrders(params, response) {
    return new Promise((resolve, reject) => {
        try {
            console.log('pushReadyOrders');
            console.log("params", params);

            var users = params.userTokens;

            var pushTitle = i18n.__({ phrase: "READY_ORDERS_TITLE", locale: "en" });
            pushTitle = pushTitle.replace("business_name", params.business_name);
            pushTitle = pushTitle.replace("order_id", params.order_id);
            pushTitle = pushTitle.replace("order_method", params.order_method);

            var pushAlert = i18n.__({ phrase: "READY_ORDERS", locale: "en" });
            pushAlert = pushAlert.replace("business_name", params.business_name);
            pushAlert = pushAlert.replace("order_id", params.order_id);
            pushAlert = pushAlert.replace("order_method", params.order_method);

            var pushData = {
                alert: pushAlert,
                session_alert: pushAlert,
                push_title: pushTitle,
                push_business_id: params.business_id,
                push_type: getPushType("READY_ORDERS"),
                push_object_id: params.order_id,
                push_badge: "Increment"
            };
            sendPushNoAdapter(users, pushData, response);
            resolve();
        } catch (error) {
            console.log('error', error);
            reject(error);
        }
    });
}

//Low Units push
async function pushLowItems(params, response) {
    return new Promise((resolve, reject) => {
        try {
            console.log('pushLowItems');
            console.log("params", params);

            var users = params.userTokens;

            var pushTitle = i18n.__({ phrase: "LOW_ITEMS_TITLE", locale: "en" });
            pushTitle = pushTitle.replace("item_name", params.item_name);

            var pushAlert = i18n.__({ phrase: "LOW_ITEMS", locale: "en" });
            pushAlert = pushAlert.replace("item_name", params.item_name);

            var pushData = {
                alert: pushAlert,
                session_alert: pushAlert,
                push_title: pushTitle,
                push_business_id: params.business_id,
                push_type: getPushType("LOW_ITEMS"),
                push_object_id: params.item_id,
                push_badge: "Increment"
            };
            sendPushNoAdapter(users, pushData, response);
            resolve();
        } catch (error) {
            console.log('error', error);
            reject(error);
        }
    });
}

//Low Rating push
async function pushLowRating(params, response) {
    return new Promise((resolve, reject) => {
        try {
            console.log('pushLowRating');
            console.log("params", params);

            var users = params.userTokens;

            var pushTitle = i18n.__({ phrase: "LOW_RATING_TITLE", locale: "en" });
            pushTitle = pushTitle.replace("star_number", params.star_number);

            var pushAlert = i18n.__({ phrase: "LOW_RATING", locale: "en" });
            pushAlert = pushAlert.replace("star_number", params.star_number);

            var pushData = {
                alert: pushAlert,
                session_alert: pushAlert,
                push_title: pushTitle,
                push_business_id: params.business_id,
                push_type: getPushType("LOW_RATING"),
                push_object_id: params.order_id,
                push_badge: "Increment"
            };
            sendPushNoAdapter(users, pushData, response);
            resolve();
        } catch (error) {
            console.log('error', error);
            reject(error);
        }
    });
}

async function sendPushNoAdapter(users, messageData, response) {
    return new Promise((resolve, reject) => {
        try {
            console.log("sendPushNoAdapter");
            console.log("users", users);
            console.log("users length before remove Duplicates", users.length);

            // users = utils.removeDuplicatesByKey("id", users)
            console.log("users length after remove Duplicates", users.length);
            var p8 = "cloud/config/prod/key.p8";
            var PushNotifications = require('node-pushnotifications');

            const settings = {
                gcm: {
                    id: process.env.GCM_API_KEY,
                    phonegap: false, // phonegap compatibility mode, see below (defaults to false)
                },
                isAlwaysUseFCM: false // true all messages will be sent through node-gcm (which actually uses FCM)
            };

            const pushnotifications = new PushNotifications(settings);

            var regTokens = [];
            for (var i = 0; i < users.length; i++) {
                console.log("fcm_token", users[i]);
                regTokens.push(users[i]);
            }

            const data = {
                title: messageData.push_title, // REQUIRED for Android
                topic: process.env.IOS_PUSH_BUNDLEID, // REQUIRED for iOS (apn and gcm)
                body: messageData.session_alert,
                sound: "default",
                custom: messageData
            }

            console.log("Push data", data);
            pushnotifications.send(regTokens, data, (error, result) => {
                if (error) {
                    console.log(JSON.stringify(error));
                } else {
                    console.log("PUSH OK");
                    console.log(JSON.stringify(result));
                    // console.log("result", result);
                }
            });
            resolve('sent push succesfully');
        } catch (eee) {
            console.log(eee);
            reject(eee);
        }
    });
}

function getPushType(name) {
    
    var pushType = {
        "LOW_ORDERS": 0,
        "READY_ORDERS": 1,
        "LOW_ITEMS": 2,
        "LOW_RATING": 3,
        "PLANNER_NEW_ORDER": 4,
        "PLANNER_CHANGED_ORDER": 5,
        "PLANNER_CANCELLED_ORDER": 6
    }

    return pushType[name];
}