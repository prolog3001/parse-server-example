SendPushToRelevantUsersvar utils = require('./utils.js');
const geoTz = require('geo-tz');
const moment = require('moment-timezone');
const fs = require('fs');

module.exports = {
    sendPushNotification: function(request, response) {
        sendPushNotification(request, response);
    },
    createPushJson: function(request, response) {
        createPushJson(request, response);
    },
    pushObjectSave: function(request, response) {
        pushObjectSave(request, response);
    },
    getPushType: function(request, response) {
        getPushType(request, response);
    },
    sendPushToRelevantUsers: function(request, response) {
        sendPushToRelevantUsers(request, response);
    }
};

//First Step
function sendPushNotification(request, response) {
    var params = request.params;
    var creatorOfPushId = params.creatorOfPushId;
    var creatorOfPushFullName = params.creatorOfPushFullName;
    var attenderIdsList = params.attenderIdsList;
    var pushObjectId = params.pushObjectId;
    var messageId = params.messageId;
    var messageText = params.messageText;
    var titleOrName = params.titleOrName;
    var pushType = params.pushType;

    createPushJson(response, creatorOfPushId, creatorOfPushFullName, pushObjectId, messageId,
        titleOrName, "", pushType, attenderIdsList, null);
}

//Second Step
function createPushJson(response, creatorOfPushId,
    creatorOfPushFullName, pushObjectId,
    extraString, titleOrName,
    messageText, pushType,
    attenderIdsList, notification) {

    var pushDataJson = {
        alert: "",
        session_alert: "",
        push_title: "",
        push_object_id: "",
        push_type: "",
        push_message_object_id: "",
        push_badge: "Increment"
    }

    //FOR THE IOS PUSH PROBLEM, alertData is received as title in Android and titleData is the data of the push
    var alertData = "";
    var titleData = "";
    try {
        if (pushType === getPushType("SESSION_CHANGED")) {
            alertData = titleOrName + " " + "was Modified";
            titleData = "Session" +
                " \"" + titleOrName + "\" " + "was Modified";
        } else if (pushType === getPushType("SESSION_CREATED")) {
            alertData = titleOrName + " " + "was Created";
            titleData = "Session" +
                " \"" + titleOrName + "\" " + "was Created by" + " " + creatorOfPushFullName;
        } else if (pushType === getPushType("SESSION_NEW_ATTENDER")) {
            alertData = "New Attender" - +" " + creatorOfPushFullName;
            titleData = "Session" +
                " \"" + titleOrName + "\" " + "Has New Attender";
        } else if (pushType == getPushType("SESSION_NEW_FOLLOWER")) {
            alertData = "New Follower -" + " " + creatorOfPushFullName;
            titleData = creatorOfPushFullName + " " + "is Now Following You";
            pushObjectId = creatorOfPushId;
        } else if (pushType === getPushType("SESSION_DELETED")) {
            alertData = titleOrName + " " + "was Deleted";
            titleData = "Session" +
                " \"" + titleOrName + "\" " + "was Deleted";
        } else if (pushType === getPushType("SESSION_CHAT_PUSH")) {
            alertData = "New Messages in" + " \"" + titleOrName + "\"";
            titleData = messageText;
        } else if (pushType === getPushType("FOLLOWERS_CHAT_PUSH")) {
            alertData = "New Messages in" + " " + titleOrName;
            titleData = messageText;
        } else if (pushType === getPushType("REFUND_REQUESTED_PUSH")) {
            alertData = "Refund Requested - CHECK YOUR EMAIL";
            titleData = titleOrName + " " + "Requested a Refund, Check Your Email(Inbox / Junk)";
        } else if (pushType === getPushType("REFUNDED_PUSH")) {
            alertData = "Refund Accepted";
            titleData = "You have been refunded for" + " \"" + titleOrName + "\"";
        } else if (pushType == getPushType("REFUNDED_DELETED_PUSH")) {
            alertData = "Refund Accepted";
            titleData = "Session" + " " +
                "\"" + titleOrName + "\" " + "was Deleted and You\'ve been Refunded";
        } else if (pushType === getPushType("PRIVATE_CHAT_PUSH")) {
            alertData = "Conversation with" + " " + titleOrName;
            titleData = messageText;
        } else if (pushType === getPushType("NEARBY_USERS_PUSH")) {
            alertData = "A " + "Session" +
                " " + "was Created Near You";
            titleData = "Session" + " \"" + titleOrName + "\" ";
        } else if (pushType === getPushType("INVITE_USERS_PUSH")) {
            alertData = "You are Invited to" + " \"" + titleOrName + "\"";
            titleData = creatorOfPushFullName + " " + "Invites You to" + " \"" + titleOrName + "\"";
        } else if (pushType === getPushType("LOCATION_INVITE_USERS_PUSH")) {
            alertData = "You are Invited to" + " a " +
                "Session" + " " +
                "at" + " " + extraString;
            titleData = "Session" + " \"" + titleOrName + "\" ";
        } else if (pushType === getPushType("STUDIO_INVITE_TEACHER_PUSH")) {
            alertData = "You were added as an Instructor to -" + " \"" + titleOrName + "\"";
            titleData = "A Studio Owner -" + " \"" + creatorOfPushFullName + "\" " +
                "Added You as Their Instructor";
        } else if (pushType === getPushType("RELEVANT_PARTNER_UP")) {
            alertData = titleOrName + " " + "is Near you and Looking for Someone to Practice with";
            titleData = "A Nearby Practitioner with Common Interests -" + " " + creatorOfPushFullName + " " +
                "is Looking for Someone to Practice with";
        } else if (pushType === getPushType("STUDIO_CHAT_PUSH")) {
            alertData = "New Messages in" + " \"" + titleOrName + "\"";
            titleData = messageText;
        }

        if (pushType == getPushType("SESSION_CHAT_PUSH") ||
            pushType == getPushType("FOLLOWERS_CHAT_PUSH") ||
            pushType == getPushType("PRIVATE_CHAT_PUSH") ||
            pushType == getPushType("STUDIO_CHAT_PUSH")) {
            pushDataJson["alert"] = titleData;
        } else {
            pushDataJson["alert"] = alertData;
        }

        pushDataJson["session_alert"] = alertData;
        pushDataJson["push_title"] = titleData;
        pushDataJson["push_object_id"] = pushObjectId;
        pushDataJson["push_type"] = pushType;
        pushDataJson["push_message_object_id"] = extraString;
        pushDataJson["push_badge"] = "Increment";
        console.log("Json To Push - " + JSON.stringify(pushDataJson, null, 2));

        pushObjectSave(response, pushDataJson, pushType, attenderIdsList, notification);
    } catch (error) {
        console.log(error);
        response.error(error);
    }
}

//third Step
function pushObjectSave(response, pushDataJson,
    pushType, attenderIdsList,
    notification) {
    try {
        //If this is a new notification
        if (notification === undefined || notification === null) {
            //Save notification to parse Notifications Table
            var Notification = Parse.Object.extend("Notification");
            var notification = new Notification();
            notification.set("push_title",
                pushDataJson["push_title"]); //Title is more informative..
            notification.set("session_alert",
                pushDataJson["session_alert"]);
            notification.set("push_object_id",
                pushDataJson["push_object_id"]);
            notification.set("push_type", pushType);
        }

        var notifiedUsersRelation = notification.relation("notified_users");
        console.log("Add to notification - " + attenderIdsList.length);
        for (var i = 0; i < attenderIdsList.length; i++) {
            var userToNotify = Parse.User.createWithoutData(attenderIdsList[i]);
            notifiedUsersRelation.add(userToNotify);
            console.log("Send to - " + userToNotify.id);
        }

        //Final instance of the notification to get it's id inside the saving
        notification.save(null, {
            useMasterKey: true,
            success: function(savedUserObject) {
                try {
                    pushDataJson["push_notification_id"] = notification.id;
                    actualPushSending(response, attenderIdsList, pushDataJson, pushType);
                } catch (error) {
                    console.log(error);
                    actualPushSending(response, attenderIdsList, pushDataJson, pushType);
                }
            },
            error: function(error) {
                console.log('Failed to save notification: ' + error.message);
                actualPushSending(response, attenderIdsList, pushDataJson, pushType);
            }
        });
    } catch (error) {
        console.log(error);
        response.error(error);
    }
}

//Fourth Step
function actualPushSending(response, attenderIdsList, pushDataJson, pushType) {

    for (var i = 0; i < attenderIdsList.length; i++) {
        console.log("actualPushSending", "to: " + attenderIdsList[i]);
    }

    Parse.Cloud.run("sendPushToRelevantUsers", {
            custom: pushDataJson,
            attenderIdsList: attenderIdsList
        })
        .then(function(result) {
            console.log("result :" + JSON.stringify(result))
            response.success(result);
        }, function(error) {
            response.error(error);
        });
}

//Fifth Step
function sendPushToRelevantUsers(request, response) {

    var params = request.params;

    var custom = params.custom; //JSON string of push
    var attenderIdsList = !params.attenderIdsList ? params.attenders : params.attenderIdsList; //ids of relevant users

    console.log("sendPushToRelevantUsers", "data: " + JSON.stringify(custom));

    //Parsing Json for iOS Platforms
    var pushData;
    try {
        pushData = JSON.parse(custom);
    } catch (error) {
        pushData = JSON.parse(JSON.stringify(custom));
    }

    var alert = pushData.alert;
    var session_alert = pushData.session_alert;
    var push_title = pushData.push_title;
    var push_type = pushData.push_type;
    var message_object_id = pushData.message_object_id;
    var push_notification_id = pushData.push_notification_id;
    var push_object_id = pushData.push_object_id;

    console.log("sendPushToRelevantUsers", "Push Type " + push_type);

    //Filter only users with thier ids in it
    var userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn("objectId", attenderIdsList);

    var pushJSON = JSON.stringify(pushData);
    pushData["custom"] = pushJSON;
    console.log("sendPushToRelevantUsers", pushData);

    userQuery.find({
        useMasterKey: true, //This is for the new version
        success: function(users) {
            console.log("sendPushToRelevantUsers", "actual users to send push to: " + users.length);
            if (users.length > 0) {

                console.log("sendPushToRelevantUsers", "actual user to send push to: " + usersPreferences.length);
                if (users.length > 0) {
                    sendPush(users, pushData, response);
                    if (!response)
                        return;
                } else {
                    console.log("sendPushToRelevantUsers", "NO user to send push to");
                    if (response)
                        response.success('no user so no push needed');
                    else
                        return;
                }
            } else {
                console.log("sendPushToRelevantUsers", "NO users to send push to");
                if (response)
                    response.success('no users so no push needed');
                else
                    return;
            }
        },
        error: function(error) {
            console.log(error);
            if (response)
                response.error(error);
            else
                return;
        }
    });
}

function sendPush(objects, messageData, response) {
    console.log("sendPush");
    try {
        utils.removeDuplicatesByKey("objectId", objects)
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
        for (var i = 0; i < objects.length; i++) {
            console.log("objects", objects[i].id);
            if (objects[i].get("device_token")) {
                console.log("device_token", objects[i].get("device_token"));
                regTokens.push(objects[i].get("device_token"));
            }
        }

        const data = {
            title: messageData.push_title, // REQUIRED for Android
            topic: process.env.IOS_PUSH_BUNDLEID, // REQUIRED for iOS (apn and gcm)
            body: messageData.session_alert,
            custom: messageData
        }

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

function getPushType(name) {
    var pushType = {
        "CLIENT_DISH_STARTED": 0,
        "CLIENT_DISH_READY": 1,
        "CLIENT_DISH_DELIVERED": 2,
        "CLIENT_ORDER_MARKED_PAID": 3,
        "CLIENT_ORDER_CLOSED": 4
    }

    return pushType[name];
}
