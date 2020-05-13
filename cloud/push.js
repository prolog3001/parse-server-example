const utils = require('./utils.js');

module.exports = {
    pushLowOrders: (request) => {
        return pushLowOrders(request);
    },
    pushReadyOrders: (request) => {
        return pushReadyOrders(request);
    },
    pushLowItems: (request) => {
        return pushLowItems(request);
    },
    pushLowRating: (request) => {
        return pushLowRating(request);
    }
};

//Business low orders push
async function pushLowOrders(request) {
    console.log('pushLowOrders');

    var users = request.params.userTokens;

    var pushTitle = i18n.__({phrase: "LOW_ORDERS", locale: "en"});

    var pushAlert = pushTitle;

    var pushData = {
        alert: pushAlert,
        session_alert: pushAlert,
        push_title: pushTitle,
        push_type: 0,
        push_object_id: params.business_id,
        push_badge: "Increment"
    };

    sendPushNoAdapter(users,pushData)

}

//All Orders Ready push
async function pushReadyOrders(request) {
    console.log('pushReadyOrders');

    var users = request.params.userTokens;

    var pushTitle = i18n.__({phrase: "READY_ORDERS", locale: "en"});
    pushTitle.replace("business_name", params.business_name);
    pushTitle.replace("order_id", params.order_id);
    pushTitle.replace("order_method", params.order_method);

    var pushAlert = pushTitle;

    var pushData = {
        alert: pushAlert,
        session_alert: pushAlert,
        push_title: pushTitle,
        push_type: 0,
        push_object_id: params.order_id,
        push_badge: "Increment"
    };

    sendPushNoAdapter(users,pushData)

}

//Low Units push
async function pushLowItems(request) {
    console.log('pushLowItems');

    var users = request.params.userTokens;

    var pushTitle = i18n.__({phrase: "LOW_ITEMS", locale: "en"});
    pushTitle.replace("item_name", params.item_name);

    var pushAlert = pushTitle;

    var pushData = {
        alert: pushAlert,
        session_alert: pushAlert,
        push_title: pushTitle,
        push_type: 0,
        push_object_id: params.item_id,
        push_badge: "Increment"
    };

    sendPushNoAdapter(users,pushData)

}

//Low Rating push
async function pushLowRating(request) {
    console.log('pushLowRating');

    var users = request.params.userTokens;

    var pushTitle = i18n.__({phrase: "LOW_RATING", locale: "en"});
    pushTitle.replace("star_number", params.star_number);

    var pushAlert = pushTitle;

    var pushData = {
        alert: pushAlert,
        session_alert: pushAlert,
        push_title: pushTitle,
        push_type: 0,
        push_object_id: params.order_id,
        push_badge: "Increment"
    };

    sendPushNoAdapter(users,pushData)

}

function sendPushNoAdapter(users, messageData, response) {
    console.log("sendPushNoAdapter");
    console.log("users",users);
    console.log("users length before remove Duplicates",users.length);
    try {
        users = utils.removeDuplicatesByKey("id", users)
        console.log("users length after remove Duplicates",users.length);
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

        console.log("Push data",data);
        push.send(regTokens, data, (err, result) => {
            if (err) {
                console.log(err);
                console.log(JSON.stringify(err));

                if (response)
                    response.error();
            } else {
                console.log("PUSH OK");
                console.log(JSON.stringify(result));
                // console.log("result", result);
                if (response)
                    response.success('sent push succesfully');
            }
        });
    } catch (eee) {
        console.log(eee);
    }
}