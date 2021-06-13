const i18n = require('i18n');

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
                push_type: 0,
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
                push_type: 1,
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
                push_type: 2,
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
                push_type: 3,
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

            const push = new PushNotifications(settings);

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
            push.send(regTokens, data, (error, result) => {
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
        "LOW_RATING": 3
    }

    return pushType[name];
}