const utils = require('./utils.js');

module.exports = {
    pushOutOfStock: (request) => {
        return pushOutOfStock(request);
    }
};

async function pushOutOfStock(request) {
    console.log('pushOutOfStock');

    let objectId = request.params.suggesterObjectId
    let item = await utils.getObjectById('RestaurantItem', objectId);

    var users = [];

    var pushTitle = item.get('title') + ' is almost out of stock';

    var pushAlert = 'Time to restock inventory..';

    var pushData = {
        alert: pushAlert,
        session_alert: pushAlert,
        push_title: pushTitle,
        push_type: 0,
        push_object_id: item.id,
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
            console.log("The users", users[i].id);
            if (users[i].get("fcm_token")) {
                console.log("fcm_token", users[i].get("fcm_token"));
                regTokens.push(users[i].get("fcm_token"));
            }
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