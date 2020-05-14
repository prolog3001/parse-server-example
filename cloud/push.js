const i18n = require('i18n');

module.exports = {
    pushLowOrders: (request, response) => {
        return pushLowOrders(request);
    },
    pushReadyOrders: (request, response) => {
        return pushReadyOrders(request, response);
    },
    pushLowItems: (request, response) => {
        return pushLowItems(request, response);
    },
    pushLowRating: (request, response) => {
        return pushLowRating(request, response);
    }
};

//Business low orders push
async function pushLowOrders(request, response) {
    try {
        console.log('pushLowOrders');
        console.log("request.params", request.params);

        var users = request.params.userTokens;

        var pushTitle = i18n.__({ phrase: "LOW_ORDERS_TITLE", locale: "en" });

        var pushAlert = i18n.__({ phrase: "LOW_ORDERS", locale: "en" });

        var pushData = {
            alert: pushAlert,
            session_alert: pushAlert,
            push_title: pushTitle,
            push_type: 0,
            push_object_id: request.params.business_id,
            push_badge: "Increment"
        };

        setInterval(function () {
          if (response)
            response.success();
          return new Parse.Query("Business");
        }, 5000); //5 * 1000)

        return sendPushNoAdapter(users, pushData, response);
    } catch (error) {
        console.log('error', error);
    }
}

//All Orders Ready push
async function pushReadyOrders(request, response) {
    try {
        console.log('pushReadyOrders');
        console.log("request.params", request.params);

        var users = request.params.userTokens;

        var pushTitle = i18n.__({ phrase: "READY_ORDERS_TITLE", locale: "en" });
        pushTitle.replace("business_name", request.params.business_name);
        pushTitle.replace("order_id", request.params.order_id);
        pushTitle.replace("order_method", request.params.order_method);

        var pushAlert = i18n.__({ phrase: "READY_ORDERS", locale: "en" });
        pushTitle.replace("business_name", request.params.business_name);
        pushTitle.replace("order_id", request.params.order_id);
        pushTitle.replace("order_method", request.params.order_method);

        var pushData = {
            alert: pushAlert,
            session_alert: pushAlert,
            push_title: pushTitle,
            push_type: 0,
            push_object_id: request.params.order_id,
            push_badge: "Increment"
        };

        setInterval(function () {
          if (response)
            response.success();
          return new Parse.Query("Business");
        }, 5000); //5 * 1000)

        return sendPushNoAdapter(users, pushData, response);
    } catch (error) {
        console.log('error', error);
    }
}

//Low Units push
async function pushLowItems(request, response) {
    try {
        console.log('pushLowItems');
        console.log("request.params", request.params);

        var users = request.params.userTokens;

        var pushTitle = i18n.__({ phrase: "LOW_ITEMS_TITLE", locale: "en" });
        pushTitle.replace("item_name", request.params.item_name);

        var pushAlert = i18n.__({ phrase: "LOW_ITEMS", locale: "en" });
        pushTitle.replace("item_name", request.params.item_name);

        var pushData = {
            alert: pushAlert,
            session_alert: pushAlert,
            push_title: pushTitle,
            push_type: 0,
            push_object_id: request.params.item_id,
            push_badge: "Increment"
        };

        setInterval(function () {
          if (response)
            response.success();
          return new Parse.Query("Business");
        }, 5000); //5 * 1000)

        return sendPushNoAdapter(users, pushData, response);
    } catch (error) {
        console.log('error', error);
    }
}

//Low Rating push
async function pushLowRating(request, response) {
    try {
        console.log('pushLowRating');
        console.log("request.params", request.params);

        var users = request.params.userTokens;

        var pushTitle = i18n.__({ phrase: "LOW_RATING_TITLE", locale: "en" });
        pushTitle.replace("star_number", request.params.star_number);

        var pushAlert = i18n.__({ phrase: "LOW_RATING", locale: "en" });
        pushTitle.replace("star_number", request.params.star_number);

        var pushData = {
            alert: pushAlert,
            session_alert: pushAlert,
            push_title: pushTitle,
            push_type: 0,
            push_object_id: request.params.order_id,
            push_badge: "Increment"
        };

        setInterval(function () {
          if (response)
            response.success();
          return new Parse.Query("Business");
        }, 5000); //5 * 1000)

        return sendPushNoAdapter(users, pushData, response);
    } catch (error) {
        console.log('error', error);
    }
}

function sendPushNoAdapter(users, messageData, response) {
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

                    reject(error);
                } else {
                    console.log("PUSH OK");
                    console.log(JSON.stringify(result));
                    // console.log("result", result);
                    resolve('sent push succesfully');
                }
            });
            resolve('sent push succesfully');
        } catch (eee) {
            console.log(eee);
            reject(eee);
        }
    });
}