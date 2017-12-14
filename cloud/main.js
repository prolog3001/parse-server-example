// Parse.Cloud.beforeSave(Parse.Installation, function(request, response) {
//     //Parse.Cloud.useMasterKey();
	
//     var androidId = request.object.get("androidId");
//     if (androidId == null || androidId == "") {
//         console.warn("No androidId found, save and exit");
//         response.success();
//     }
//     var query = new Parse.Query(Parse.Installation);
//     query.equalTo("androidId", androidId);
//     query.addAscending("createdAt");
//     query.find({useMasterKey: true}).then(function(results) {
//         for (var i = 0; i < results.length; ++i) {
//             console.warn("iterating over Installations with androidId= "+ androidId);
//             if (results[i].get("installationId") != request.object.get("installationId")) {
//                 console.warn("Installation["+i+"] and the request have different installationId values. Try to delete. [installationId:" + results[i].get("installationId") + "]");
//                 results[i].destroy().then(function() {
//                     console.warn("Installation["+i+"] has been deleted");
//                 },
//                 function() {
//                     console.warn("Error: Installation["+i+"] could not be deleted");
//                 });
//             } else {
//                 console.warn("Installation["+i+"] and the request has the same installationId value. Ignore. [installationId:" + results[i].get("installationId") + "]");
//             }
//         }
//         console.warn("Finished iterating over Installations. A new Installation will be saved now...");
//         response.success();
//     },
//     function(error) {
//         response.error("Error: Can't query for Installation objects.");
//     });
// });

Parse.Cloud.define('sendAlertToSessionSubscribers', function(request, response) {
    // request has 2 parameters: params passed by the client and the authorized user
    var params = request.params;
    var user = request.user;

    //Parsing Json for iOS Platforms
    var alert = "Reminder - ";
    var push_titleDate = "Tomorrow, the ";
    var push_titleTime = " at ";
    var push_type = 1;
    var message_object_id = "";
    var push_notification_id = -1;

    var dictUsersToSessions = {};
    var dictJsonToSessions = {};
//     var promiseArray = [];

    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    console.log("#### Send alert notifications to users who asked for it");

    //Filter only users with thier ids in it
    var alertQuery = new Parse.Query("Alert");
    alertQuery.include("session")
    alertQuery.equalTo("notified", false);
    alertQuery.find({
        success: function(alerts) {
            if (alerts.length == 0) {
                response.success('No aLerts to notify..');
            }

            var alertsClone = alerts.slice(0);
            console.log("Found Alerts - " + alerts.length);
            for (var i = 0; i < alerts.length; i++) {
	    	var date1 = new Date();
		var date2 = new Date(alerts[i].get("session").get("date").getTime());
		var timeDiff = Math.abs(date2.getTime() - date1.getTime());
		var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
//                 var daysDiff = dateDiffInDays(new Date(), alerts[i].get("session").get("date"));
                console.log("#### difference between session and now - " + diffDays);
                if (diffDays > 1) {
                    continue;
                }

		var keysOfDictUsersToSessions = Object.keys(dictUsersToSessions);
                var sessionId = alerts[i].get("session").id;
		var indexOfSessionId = keysOfDictUsersToSessions.indexOf(sessionId);
                console.log("#### Index of sessionId - " + indexOfSessionId);
		if(indexOfSessionId >= 0) {
                    continue;
                }    
		
                var userIdsWithThatSession = [];
		var count = 0;
                for (var j = 0; j < alertsClone.length; j++) {
                    if (sessionId == alertsClone[j].get("session").id) {
                        userIdsWithThatSession[count] = alertsClone[j].get("user").id;
			count++;
                        console.log("#### Session Id of Session with Related Users " + sessionId);
                        console.log("#### User Id of User Related to Session " + alertsClone[j].get("user").id);
                    }
                }
                alerts[i].set("notified", true);
                dictUsersToSessions[String(sessionId)] = userIdsWithThatSession;
                console.log("#### Session Id of Session in Alert " + sessionId);
                console.log("#### User Ids of Related Users " + userIdsWithThatSession.length);

                var date = alerts[i].get("session").get("date");
                var day = date.getDate();
                var monthIndex = date.getMonth();
                var year = date.getFullYear();

                var pushTitle = push_titleDate + day + ' ' + monthNames[monthIndex] + ' ' + year +
                    push_titleTime + date.getHours() + ":" + date.getMinutes();

                var pushAlert = alert + alerts[i].get("session").get("title");

                var customJsonOfSession = {
                    alert: pushAlert,
                    session_alert: pushAlert,
                    push_title: pushTitle,
                    push_type: push_type,
                    message_object_id: message_object_id,
                    push_notification_id: push_notification_id,
                    push_object_id: sessionId,
                    push_badge: "Increment"
                };

                var jsonOfSession = {
                    alert: pushAlert,
                    session_alert: pushAlert,
                    push_title: pushTitle,
                    push_type: push_type,
                    headings: {
                        en: pushTitle,
                    },
                    message_object_id: message_object_id,
                    push_notification_id: push_notification_id,
                    push_object_id: sessionId,
                    badge: 1,
                    custom: customJsonOfSession
                };
                dictJsonToSessions[String(sessionId)] = jsonOfSession;
                console.log("#### Session Json " + jsonOfSession);

                var userQuery = new Parse.Query(Parse.User);
                userQuery.containedIn("objectId", dictUsersToSessions[String(sessionId)]);

                var pushQuery = new Parse.Query(Parse.Installation);
                pushQuery.matchesQuery('user', userQuery);

//                 var promise = new Parse.Promise();
//                 Parse.Push.send({
//                     where: pushQuery,
//                     data: dictJsonToSessions[String(sessionId)]
//                 }, {
//                     useMasterKey: true,
//                     success: function() {
//                         console.log("#### PUSH OK");
//                     },
//                     error: function(error) {
//                         console.log("#### PUSH ERROR" + error.message);
//                     }
//                 }).then(function(result) {
//                     //Marks this promise as fulfilled, 
//                     //firing any callbacks waiting on it.
//                     promise.resolve(result);
//                 }, function(error) {
//                     //Marks this promise as fulfilled, 
//                     //firing any callbacks waiting on it.
//                     promise.reject(error);
//                 });
//                 promiseArray.push(promise);
//             }
                Parse.Push.send({
                    where: pushQuery,
                    data: dictJsonToSessions[String(sessionId)]
                }, {
                    useMasterKey: true,
                    success: function() {
                        console.log("#### PUSH OK");
                    },
                    error: function(error) {
                        console.log("#### PUSH ERROR" + error.message);
		    }
	    	});
            }

//             Parse.Promise.when(promiseArray).then(function(result) {
//                 console.log("success promise!!")
//                 Parse.Object.saveAll(alerts, {
//                     useMasterKey: true,
//                     success: function(list) {
//                         console.log("#### Alerts Saved");
//                         status.success("success promise!!");
//                         response.success('Alerts Saved');
//                     },
//                     error: function(error) {
//                         console.log("wasnt able to save Alert Objects Table because  " + error.code);
//                         response.error('wasnt able to save Alert Objects Table');
//                     }
//                 });
//             }, function(error) {
//                 console.error("Promise Error: " + error.message);
//                 status.error(error);
//             });

                Parse.Object.saveAll(alerts, {
                    useMasterKey: true,
                    success: function(list) {
                        console.log("#### Alerts Saved");
                        status.success("success promise!!");
                        response.success('Alerts Saved');
                    },
                    error: function(error) {
                        console.log("wasnt able to save Alert Objects Table because  " + error.code);
                        response.error('wasnt able to save Alert Objects Table');
                    }
                });

        },
        error: function(error) {
            response.error(error);
        },
    });

    function dateDiffInDays(a, b) {
        // Discard the time and time-zone information.
        var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

        return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }
});

Parse.Cloud.define('removeTeacherFromStudio', function(request, response) {

    var params = request.params;
    var studio = new Parse.User({
        id: params.studioId
    }); //id of studio
    var teacher = new Parse.User({
        id: params.userToRemoveId
    }); //id of teacher

    var relation = studio.relation("associated_teachers");
    relation.remove(teacher);

    studio.save(null, {useMasterKey: true,
        success: function() {
            response.success("Teacher was removed from studio");
        },
        error: function(error) {
            response.error("Error saving message" + error.code);
        }
    });
});

Parse.Cloud.define('addStudentToRequestedUserRelation', function(request, response) {
    var params = request.params;
    var teacher = new Parse.User({
        id: params.teacherId //id of teacher
    });
    var student = new Parse.User({
        id: params.studentId //id of student
    })

    var relation = teacher.relation("requested_students");
    relation.add(student);

    teacher.save(null, {useMasterKey: true,
        success: function() {
            response.success("Student was saved to relation");
        },
        error: function(error) {
            response.error("Error saving student" + error.code);
        }
    });
});

Parse.Cloud.define('addMessageToUserRelationMessages', function(request, response) {

    var Message = Parse.Object.extend("Message");
    var params = request.params;
    var chatOwner = new Parse.User({
        id: params.chatOwnerId
    }); //id of user sent the message
    var message = Message.createWithoutData(params.messageId); //id of new message

    var relation = chatOwner.relation("messages");
    relation.add(message);

    chatOwner.save(null, {useMasterKey: true,
        success: function() {
            response.success("Message was saved to relation");
        },
        error: function(error) {
            response.error("Error saving message" + error.code);
        }
    });
});

Parse.Cloud.define('pushChannelMedidate', function(request, response) {

    // request has 2 parameters: params passed by the client and the authorized user
    var params = request.params;
    var user = request.user;

    var custom = params.custom; //JSON string of push
    var users = params.attenders; //ids of relevant users
    console.log("#### Push Data " + custom);

    //Parsing Json for iOS Platforms
    var jsonObject = JSON.parse(custom);
    var alert = jsonObject.alert;
    var session_alert = jsonObject.session_alert;
    var push_title = jsonObject.push_title;
    var push_type = jsonObject.push_type;
    var message_object_id = jsonObject.message_object_id;
    var push_notification_id = jsonObject.push_notification_id;
    var push_object_id = jsonObject.push_object_id;

    console.log("#### Push Type " + push_type);

    //Filter only users with thier ids in it
    var userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn("objectId", users);
    for (var i = 0; i < users.length; i++) {
        console.log("#### User Id Before Filtering " + users[i]);
    }

    var pushQuery = new Parse.Query(Parse.Installation);
    switch (push_type) {
        case 0:
            pushQuery.equalTo("session_changed_push", true);
            console.log("#### session_changed_push");
            break;
        case 1:
            pushQuery.equalTo("user_followed_push", true);
            console.log("#### user_followed_push");
            break;
        case 2:
            pushQuery.equalTo("session_attender_push", true);
            console.log("#### session_attender_push");
            break;
        case 3:
            pushQuery.equalTo("new_follower_push", true);
            console.log("#### new_follower_push");
            break;
        case 4:
            //NOTHING TO FILTER
            console.log("#### session_deleted_push");
            break;
        case 5:
            pushQuery.equalTo("session_message_push", true);
            console.log("#### session_message_push");
            break;
        case 6:
            pushQuery.equalTo("session_message_push", true);
            console.log("#### session_message_push");
            break;
        case 10:
            pushQuery.equalTo("session_message_push", true);
            console.log("#### session_message_push");
            break;
        case 11:
            pushQuery.equalTo("session_near_push", true);
            console.log("#### session_near_push");
            break;
        case 12:
            pushQuery.equalTo("session_invitation_push", true);
            console.log("#### session_invitation_push");
            break;
        case 13:
            pushQuery.equalTo("session_location_invitation_push", true);
            console.log("#### session_location_invitation_push");
            break;
        case 14:
//             pushQuery.equalTo("session_location_invitation_push", true);
            console.log("#### session_location_invitation_push");
            break;
	case 15:
            pushQuery.equalTo("user_looking_for_partner_push", true);
            console.log("#### user_looking_for_partner_push");
            break;
        default:
            pushQuery.equalTo("session_changed_push", true);
            console.log("#### session_changed_push");
            break;
    }
    pushQuery.matchesQuery('user', userQuery);

    // Note that useMasterKey is necessary for Push notifications to succeed.
    Parse.Push.send({
        where: pushQuery,
        data: {
            alert: alert,
            session_alert: session_alert,
            push_title: push_title,
            push_type: push_type,
            headings: {
                en: push_title,
            },
            message_object_id: message_object_id,
            push_notification_id: push_notification_id,
            push_object_id: push_object_id,
            badge: 1,
            custom: custom
        }
    }, {
	useMasterKey: true,
        success: function() {
            console.log("#### PUSH OK");
        },
        error: function(error) {
            console.log("#### PUSH ERROR" + error.message);
        },
    });

    response.success('success');
});

Parse.Cloud.define('saveAndroidUserDeviceToken', function(request, response) {
//     Parse.Cloud.useMasterKey();
    var params = request.params;
    var user = request.user;
    var token = params.token; //GCM TOKEN
    var installation = params.installation; //ids of relevant users
    console.log("#### Installation Id To Save Token " + installation[0]);
    console.log("#### User GCM Token " + token);

    var installationQuery = new Parse.Query(Parse.Installation);
    installationQuery.equalTo('objectId', installation[0]);
    installationQuery.find({
	useMasterKey: true,
        success: function(installations) {
            console.log("#### Successfully retrieved Installation" + installations.length);
            var userInstallation = installations[0];
            userInstallation.set("deviceToken", token);
            userInstallation.save(null, {useMasterKey: true,
                success: function(listing) {
                    console.log("#### Saved Token");
                    response.success('success');
                },
                error: function(error) {
                    console.log("#### Did Not Save Token...");
                    response.error(error);
                }
            });
        },
        error: function(error) {
            console.log("#### Error: " + error.code + " " + error.message);
            response.error(error);
        },
    });
});

Parse.Cloud.define('saveUserRate', function(request, response) {
//     Parse.Cloud.useMasterKey();

    var params = request.params;
    var userId = params.userId;
    var rate = params.rate;

    console.log("Put User Rating - " + rate);
    console.log("On User - " + userId);
    var query = new Parse.Query(Parse.User);
    query.equalTo('objectId', userId);
    query.first({
	useMasterKey: true,
        success: function(object) {
            object.set("rate", rate);
            object.save(null,{useMasterKey: true});
            response.success("Success");
        },
        error: function(error) {
            alert("Error: " + error.code + " " + error.message);
            response.error("Error");
        },
    });
});

Parse.Cloud.define('refreshRecurringSessions', function (request, response) {
    //     Parse.Cloud.useMasterKey();

    var newRecurringSessionsArray = [];
    var dictNewAndEditedPlan = {}; // create an empty dictionary for use in planSession and alert replacepent
    var dictNewAndEditedAlert = {}; // create an empty dictionary for use in alert replacepent
    var excludeMinusOccurences = [0, -1, -2, -3];
    var then = new Date();
    then.setHours(then.getHours() - 1);

    var pushQuery = new Parse.Query("MSession");
    pushQuery.lessThanOrEqualTo("date", then);
    pushQuery.notContainedIn("occurrence", excludeMinusOccurences);
    pushQuery.limit(1000);
    pushQuery.find({
        useMasterKey: true,
        success: function (results) {
            //console.log("#### Sessions to Reoccurre " + results.length);

            //var sum = 0;
            for (var i = 0; i < results.length; ++i) {
                console.log("Entered Loop");
                var newSession = results[i].clone();
                console.log("Cloned Session for Editing");
                newSession.set("attenders_count", 0);
                var dailyDaysArray = newSession.get("session_occurrence_days");
                if (dailyDaysArray != null) {
                    console.log("dailyDaysArray - " + dailyDaysArray.length);
                } else {
                    console.log("No dailyDaysArray");
                }

                var date = new Date(newSession.get("date").getTime());
                var previousDate = new Date(newSession.get("date").getTime());
                console.log("Got Old Date - " + previousDate);

                switch (newSession.get("occurrence")) {
                case 1:
                    do {
                        if (dailyDaysArray != null && dailyDaysArray != undefined && dailyDaysArray[0] !== 0) {
                            console.log("This Daily has sessions days and   " + dailyDaysArray);
                            do {
                                date.setDate(date.getDate() + 1);
                                console.log("Got Old Date Hours - " + previousDate.getHours());
                                console.log("Got Old Date Minutes - " + previousDate.getMinutes());
                                date.setHours(previousDate.getHours());
                                date.setMinutes(previousDate.getMinutes());
                                var dayNumber = date.getDay() + 1;
                                console.log("does day exists:   " + dailyDaysArray.indexOf(dayNumber));
                            } while (dailyDaysArray.indexOf(dayNumber) === -1)
                        } else {
                            console.log("NO DAYS DEFINED OR WEEKLY");
                            date.setDate(date.getDate() + 1);
                            date.setHours(previousDate.getHours());
                            date.setMinutes(previousDate.getMinutes());
                        }
                        //date.setDate(previousDate.getDate() + 1);
                    } while (date <= then);
                    console.log("New Date - " + date);
                    break;

                case 2:
                    do {
                        //  date.setHours(previousDate.getHours() + 7 * 24);
                        date.setDate(date.getDate() + 7);
                        date.setHours(previousDate.getHours());
                        date.setMinutes(previousDate.getMinutes());
                    } while (date <= then);
                    console.log("New Date - " + date);
                    break;

                case 3:
                    //  date.setHours(previousDate.getHours() + 4 * 7 * 24);
                    date.addMonths(1);
                    date.setHours(previousDate.getHours());
                    date.setMinutes(previousDate.getMinutes());
                    console.log("New Date - " + date);
                    break;
                default:
                    ;
                }
                newSession.set("date", date);
                newSession.set("day", date.getDay() + 1);
                results[i].set("occurrence", -1 * results[i].get("occurrence"));

                newRecurringSessionsArray.push(newSession);
                console.log("Changed a Session - " + i);
            }
            if (newRecurringSessionsArray.length > 0 && results.length > 0) {
                console.log("Try to save all - " + newRecurringSessionsArray.length);
                Parse.Object.saveAll(newRecurringSessionsArray, {
                    useMasterKey: true,
                    success: function (newSessionList) {
                        console.log("Saved newRecurringSessionsArray");
                        Parse.Object.saveAll(results, {
                            useMasterKey: true,
                            success: function (editedSessionList) {
                                console.log("#### Saving New Recurring Sessions Array  " + newRecurringSessionsArray.length);
                                console.log("#### Saving Edited Recurring Sessions Array  " + results.length);

                                var planSessionQuery = new Parse.Query("PlanSessionRelation");
                                planSessionQuery.containedIn("session", results);
                                planSessionQuery.include("session");
                                planSessionQuery.limit(1000);
                                planSessionQuery.find({
                                    useMasterKey: true,
                                    success: function (planSessions) {
                                        if (planSessions != null && planSessions.length > 0) {
                                            for (var i = 0; i < results.length; i++) {
                                                var newSessionForPlan = newRecurringSessionsArray[i];
                                                var editedSessionObjectId = results[i].id;
                                                console.log("#### Add Element to Dictionary - " + editedSessionObjectId);
                                                console.log("#### Title of new session - " + newSessionForPlan.get("title"));
                                                console.log("#### Id of new session - " + newSessionForPlan.id);
                                                dictNewAndEditedPlan[String(editedSessionObjectId)] = newSessionForPlan;
                                            }
                                            console.log("#### Succesfully created dictionary...");

                                            console.log("#### Plan Sessions Array  " + planSessions.length);
                                            for (var i = 0; i < planSessions.length; i++) {
                                                var sessionToBeReplaced = new Parse.Object({
                                                    id: planSessions[i].get("session").id
                                                });
                                                var sessionToBeReplacedObjectId = sessionToBeReplaced.id;
                                                console.log("#### Session ObjectId to be replaced in plan - " + sessionToBeReplacedObjectId);

                                                var sessionToReplaceObject = dictNewAndEditedPlan[String(sessionToBeReplacedObjectId)];
                                                console.log("#### Session ObjectId to replace in plan - " + sessionToReplaceObject.id);

                                                planSessions[i].set("session", sessionToReplaceObject);
                                                console.log("#### Session added to plan");
                                            }

                                            Parse.Object.saveAll(planSessions, {
                                                useMasterKey: true,
                                                success: function (list) {
                                                    console.log("#### planSessions Saved");
                                                    //response.success('success');


                                                    console.log("#### Start alert query");
                                                    var alertQuery = new Parse.Query("Alert");
                                                    alertQuery.containedIn("session", results);
                                                    alertQuery.include("session");
                                                    alertQuery.limit(1000);
                                                    alertQuery.find({
                                                        useMasterKey: true,
                                                        success: function (alerts) {
                                                            if (alerts != null && alerts.length > 0) {
                                                                for (var i = 0; i < results.length; i++) {
                                                                    var newSessionForAlert = newRecurringSessionsArray[i];
                                                                    var editedSessionObjectId = results[i].id;
                                                                    console.log("#### Add Element to Dictionary - " + editedSessionObjectId);
                                                                    console.log("#### Title of new session - " + newSessionForAlert.get("title"));
                                                                    console.log("#### Id of new session - " + newSessionForAlert.id);
                                                                    dictNewAndEditedAlert[String(editedSessionObjectId)] = newSessionForAlert;
                                                                }
                                                                console.log("#### Succesfully created dictionary...");

                                                                console.log("#### Alerts Array  " + alerts.length);
                                                                for (var i = 0; i < alerts.length; i++) {
                                                                    var sessionToBeReplaced = new Parse.Object({
                                                                        id: alerts[i].get("session").id
                                                                    });
                                                                    var sessionToBeReplacedObjectId = sessionToBeReplaced.id;
                                                                    console.log("#### Session ObjectId to be replaced in alert - " + sessionToBeReplacedObjectId);

                                                                    var sessionToReplaceObject = dictNewAndEditedAlert[String(sessionToBeReplacedObjectId)];
                                                                    console.log("#### Session ObjectId to replace in alert - " + sessionToReplaceObject.id);

                                                                    alerts[i].set("session", sessionToReplaceObject);
                                                                    alerts[i].set("notified", false);
                                                                    console.log("#### Session added to plan");
                                                                }

                                                                Parse.Object.saveAll(alerts, {
                                                                    useMasterKey: true,
                                                                    success: function (list) {
                                                                        console.log("#### alerts Saved");
                                                                        response.success('success');
                                                                    },
                                                                    error: function (error) {
                                                                        console.log("wasnt able to save Alert Objects Table because  " + error.code);
                                                                        response.error('wasnt able to save Alert Objects Table');
                                                                    }
                                                                });
                                                            } else {
                                                                response.success('No alerts to update');
                                                            }
                                                        },
                                                        error: function (error) {
                                                            console.log("wasnt able to find Alert Objects Table because  " + error.code);
                                                            response.error('wasnt able to find Alert Objects Table');
                                                        }
                                                    });
                                                },
                                                error: function (error) {
                                                    console.log("wasnt able to save new Sessions to PlanSessionRelation Table because  " + error.code);
                                                    response.error('wasnt able to save new Sessions to PlanSessionRelation Table');
                                                }
                                            });
                                        } else {
                                            //response.success('success');
                                            console.log('No plans to update');


                                            console.log("#### Start alert query");
                                            var alertQuery = new Parse.Query("Alert");
                                            alertQuery.containedIn("session", results);
                                            alertQuery.include("session");
                                            alertQuery.limit(1000);
                                            alertQuery.find({
                                                useMasterKey: true,
                                                success: function (alerts) {
                                                    if (alerts != null && alerts.length > 0) {
                                                        for (var i = 0; i < results.length; i++) {
                                                            var newSessionForAlert = newRecurringSessionsArray[i];
                                                            var editedSessionObjectId = results[i].id;
                                                            console.log("#### Add Element to Dictionary - " + editedSessionObjectId);
                                                            console.log("#### Title of new session - " + newSessionForAlert.get("title"));
                                                            console.log("#### Id of new session - " + newSessionForAlert.id);
                                                            dictNewAndEditedAlert[String(editedSessionObjectId)] = newSessionForAlert;
                                                        }
                                                        console.log("#### Succesfully created dictionary...");

                                                        console.log("#### Alerts Array  " + alerts.length);
                                                        for (var i = 0; i < alerts.length; i++) {
                                                            var sessionToBeReplaced = new Parse.Object({
                                                                id: alerts[i].get("session").id
                                                            });
                                                            var sessionToBeReplacedObjectId = sessionToBeReplaced.id;
                                                            console.log("#### Session ObjectId to be replaced in alert - " + sessionToBeReplacedObjectId);

                                                            var sessionToReplaceObject = dictNewAndEditedAlert[String(sessionToBeReplacedObjectId)];
                                                            console.log("#### Session ObjectId to replace in alert - " + sessionToReplaceObject.id);

                                                            alerts[i].set("session", sessionToReplaceObject);
                                                            alerts[i].set("notified", false);
                                                            console.log("#### Session added to plan");
                                                        }

                                                        Parse.Object.saveAll(alerts, {
                                                            useMasterKey: true,
                                                            success: function (list) {
                                                                console.log("#### alerts Saved");
                                                                response.success('success');
                                                            },
                                                            error: function (error) {
                                                                console.log("wasnt able to save Alert Objects Table because  " + error.code);
                                                                response.error('wasnt able to save Alert Objects Table');
                                                            }
                                                        });
                                                    } else {
                                                        response.success('No alerts to update');
                                                    }
                                                },
                                                error: function (error) {
                                                    console.log("wasnt able to find Alert Objects Table because  " + error.code);
                                                    response.error('wasnt able to find Alert Objects Table');
                                                }
                                            });
                                        }
                                    },
                                    error: function (error) {
                                        console.log("wasnt able to find PlanSessionRelation Table because  " + error.code);
                                        response.error('wasnt able to find PlanSessionRelation Table');
                                    }
                                });
                            },
                            error: function (error) {
                                console.log("wasnt able to save  " + error.code);
                                response.error('Wasnt able to save Old Recurring Sessions');
                            }
                        });
                    },
                    error: function (error) {
                        console.log("wasnt able to save  " + error.code);
                        response.error('Wasnt able to save New Recurring Sessions');
                    }
                });
            } else {
                console.log("#### NO New Recurring Sessions to Re-Occure");
                response.success('success');
            }
        },
        error: function () {
            response.error('Wasnt able to find Recurring Sessions');
        }
    });

    Date.isLeapYear = function (year) {
        return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
    };

    Date.getDaysInMonth = function (year, month) {
        return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    };

    Date.prototype.isLeapYear = function () {
        return Date.isLeapYear(this.getFullYear());
    };

    Date.prototype.getDaysInMonth = function () {
        return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
    };

    Date.prototype.addMonths = function (value) {
        var n = this.getDate();
        this.setDate(1);
        this.setMonth(this.getMonth() + value);
        this.setDate(Math.min(n, this.getDaysInMonth()));
        return this;
    };

});

Parse.Cloud.define("sendEmail", function(request, response) {

    console.log("sendEmail " + new Date());
    var mailTag = request.params.tag; //tag of email if needed (fro unsubscribers)

    var emailType = request.params.emailType;

    var emailBody = request.params.emailBody;
    var emailSubject = request.params.emailSubject;
    var fromName = request.params.fromName;
    var studentEmail = request.params.studentEmail;
    var fromEmail = "no-reply@medidatewith.me";
    var bccEmail = "contact@medidateapp.com";

    var toEmail = request.params.toEmail;
    var toName = request.params.toName;
    var toId = request.params.toId;

    var sessionDate = request.params.sessionDate;
    var sessionTitle = request.params.sessionTitle;
    var sessionPrice = request.params.sessionPrice;
    var sessionCreator = request.params.sessionCreator;
    var paidTitle = request.params.paidTitle;
    var paidPrice = request.params.paidPrice;
    var deepLink = request.params.sessionDeepLink;

    var studentReason = request.params.studentReason;

    var data;

    var fromString = fromName + " <" + fromEmail + ">";
    var fromStudentString = fromName + " <" + studentEmail + ">";
    var toString = toName + " <" + toEmail + ">"

    switch (emailType) {
        //Invite Friend
        case 0:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("Your friend", fromName);
            emailBody = emailBody.replace("Your friend", fromName);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email: Invite Friend");
            break;
            //Registered Seller
        case 1:
            emailBody = emailBody.replace("user_name", toName);
            emailBody = emailBody.replace("user_name", toName);
            data = {
                from: fromString,
                to: toString,
                bcc: bccEmail,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email: Registered Seller");
            break;
            //Paid
        case 2:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("session_price", sessionPrice);
            emailBody = emailBody.replace("session_date", sessionDate);
            emailBody = emailBody.replace("session_creator", sessionCreator);
            emailBody = emailBody.replace("session_title", sessionTitle);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email:Paid");
            break;
            //Payment Received
        case 3:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("session_price", sessionPrice);
            emailBody = emailBody.replace("session_date", sessionDate);
            emailBody = emailBody.replace("session_title", sessionTitle);
            emailBody = emailBody.replace("session_attender", fromName);
            emailBody = emailBody.replace("session_price", sessionPrice);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email: Payment Received");
            break;
            //Request Refund
        case 4:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("student_name", fromName);
            emailBody = emailBody.replace("student_name", fromName);
            emailBody = emailBody.replace("student_email", studentEmail);
            emailBody = emailBody.replace("session_date", sessionDate);
            emailBody = emailBody.replace("session_title", sessionTitle);
            emailBody = emailBody.replace("student_reason", studentReason);
            data = {
                from: fromString,
                to: toString,
                bcc: bccEmail,
                subject: emailSubject,
                h: "Reply-To" + fromStudentString,
                html: emailBody
            };
            console.log("#### Email:Request Refund");
            break;
            //Refunded
        case 5:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("session_date", sessionDate);
            emailBody = emailBody.replace("session_title", sessionTitle);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email: Refunded");
            break;
            //Invite to Session
        case 6:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("user_email_address", toEmail);
            emailBody = emailBody.replace("session_title", sessionTitle);
            emailBody = emailBody.replace("mailgun_api_key", process.env.MAILGUN_KEY);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody,
                "o:tag": mailTag
            };
            console.log("#### Email: Invitation to Session Sent");
            break;
            //New Attender to Session
        case 7:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("user_email_address", toEmail);
            emailBody = emailBody.replace("session_title", sessionTitle);
            emailBody = emailBody.replace("mailgun_api_key", process.env.MAILGUN_KEY);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody,
                "o:tag": mailTag
            };
            console.log("#### Email: Invitation to Session Sent");
            break;
            //Won Campaign
        case 8:
            emailBody = emailBody.replace("Congratulations", "Congratulations" + " " + toName);
            data = {
                from: fromString,
                to: toString,
                bcc: bccEmail,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email: Winning Campaign");
            break;
            //Advanced Paid
        case 9:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("teacher_title", paidTitle);
            emailBody = emailBody.replace("paid_price", paidPrice);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email:Advanced Paid");
            break;
            //Teacher Payment Received
        case 10:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("student_title", paidTitle);
            emailBody = emailBody.replace("paid_price", paidPrice);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email: Teacher Payment Received");
            break;

            //Punch Ticket Paid
        case 11:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("teacher_title", paidTitle);
            emailBody = emailBody.replace("paid_price", paidPrice);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email:Advanced Paid");
            break;
            //Teacher Punch Ticket Payment Received
        case 12:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("student_title", paidTitle);
            emailBody = emailBody.replace("paid_price", paidPrice);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email: Teacher Payment Received");
            break;

            //Registered Membership
        case 13:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("teacher_title", paidTitle);
            emailBody = emailBody.replace("paid_price", paidPrice);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email:Advanced Paid");
            break;
            //Teacher Registered Membership of Student
        case 14:
            emailBody = emailBody.replace("Hi,", "Hi " + toName + ",");
            emailBody = emailBody.replace("student_title", paidTitle);
            emailBody = emailBody.replace("paid_price", paidPrice);
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
            console.log("#### Email: Teacher Payment Received");
            break;
        //Send User an Email About New Message in his Private Box
        case 15:
            data = {
                from: fromString,
                to: toString,
                subject: emailSubject,
                html: emailBody
            };
	    var query = new Parse.Query(Parse.User);
		query.get(toId, {
		    useMasterKey: true,
		    success: function (user) {
			user.save(null, {useMasterKey: true,
			    success: function (savedUserObject) {
            			console.log("#### Email:Sending message to user and updating user");
			    },
			    error: function(error) {
				console.log('Failed to save user: ' + error.message);
			    }
			});
		    },
		    error: function (error) {
			console.log(error);
		    }
		});
            console.log("#### Email: User had no interaction with Medidate for over a week");
            break;
        default:
            console.log("#### NO TYPE");
            return;
            break;
    }

    var simpleMailgunAdapter = require('mailgun-js')({
        apiKey: process.env.MAILGUN_KEY || '',
        domain: process.env.DOMAIN || 'medidatewith.me'
    });
    simpleMailgunAdapter.messages().send(data, function(error, body) {
        if (error) {
            console.log("got an error in sendEmail: " + error);
            response.error(err);
        } else {
            console.log("email sent to " + toEmail + " " + new Date());
            response.success("Email sent!");
        }
    });
});

Parse.Cloud.define("userJoinedFromSiteMail", function(request, response) {

    console.log("sendEmail " + new Date());
    var emailBody = "User With Email:" + request.params.email + " Have Just Joined Using Medidate Site :)";
    var emailSubject = "A New User Through the Site";
    var fromName = "Medidate Website";
    var fromEmail = "no-reply@medidatewith.me";
    var toEmail = "contact@appums.com";

    var data;

    var fromString = fromName + " <" + fromEmail + ">";
    var toString = "Ophir and Matan" + " <" + toEmail + ">"

    emailBody = emailBody.replace("Hi,", "Hi " + "Ophir and Matan" + ",");
    emailBody = emailBody.replace("Your friend", fromName);
    emailBody = emailBody.replace("Your friend", fromName);
    data = {
        from: fromString,
        to: toString,
        subject: emailSubject,
        text: emailBody
    };
    console.log("#### Email: User Joined Through Site");

    var simpleMailgunAdapter = require('mailgun-js')({
        apiKey: process.env.MAILGUN_KEY || '',
        domain: process.env.DOMAIN || 'medidatewith.me'
    });
    simpleMailgunAdapter.messages().send(data, function(error, body) {
        if (error) {
            console.log("got an error in sendEmail: " + error);
            response.error(err);
        } else {
            console.log("email sent to " + toEmail + " " + new Date());
            response.success("Email sent!");
        }
    });
});

Parse.Cloud.define('saveQualificationsToIndex', function(request, response) {
//     Parse.Cloud.useMasterKey();
    console.log("saveQualificationsToIndex");

    var qualifications = ['', 'Practitioner', 'Instructor', 'Teacher', 'Master', 'Studio'];
    var query = new Parse.Query(Parse.User);
    query.exists('qualification');
    query.limit(1000);
    query.find({
        success: function(users) {
            console.log("Found..." + users.length);
            for (var i = 0; i < users.length; i++) {
                for (var j = 0; j < qualifications.length; j++) {
                    if (users[i].get('qualification') == (qualifications[j])) {
                        users[i].set("qualifications", j);
                        console.log("Qualification index - " + j);
                        break;
                    }
                }
            }
            Parse.Object.saveAll(users, {
		useMasterKey: true,
                success: function(list) {
                    console.log("Saved all users and qualifications - " + users.length);
                },
                error: function(error) {
                    console.log("Error saving all users and qualifications..");
                },
            });
            response.success("Success");
        },

        error: function(error) {
            response.error(error);
        },
    });
});

Parse.Cloud.define('saveGenderToIndex', function(request, response) {
//     Parse.Cloud.useMasterKey();
    console.log("saveGenderToIndex");

    var genders = ['Male', 'Female'];
    var query = new Parse.Query(Parse.User);
    query.exists('sex');
    query.limit(1000);
    query.find({
        success: function(users) {
            console.log("Found..." + users.length);
            for (var i = 0; i < users.length; i++) {
                for (var j = 0; j < qualifications.length; j++) {
                    if (users[i].get('sex') == (genders[j])) {
                        users[i].set("gender", j);
                        console.log("Gender index - " + j);
                        break;
                    }
                }
            }
            Parse.Object.saveAll(users, {
		useMasterKey: true,
                success: function(list) {
                    console.log("Saved all users and genders - " + users.length);
                },
                error: function(error) {
                    console.log("Error saving all users and genders..");
                },
            });
            response.success("Success");
        },

        error: function(error) {
            response.error(error);
        },
    });
});

Parse.Cloud.define('getFullUsersFromIds', function(request, response) {
    //Parse.Cloud.useMasterKey(); //This is for the old server
    // request has 2 parameters: params passed by the client and the authorized user
    var params = request.params;

    var users = params.userIds; //ids of relevant users

    //Filter only users with thier ids in it
    var userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn("objectId", users);
    for (var i = 0; i < users.length; i++) {
        console.log("#### User Id Before Filtering " + users[i]);
    }
    userQuery.find({
	useMasterKey: true,//This is for the new version
        success: function(users) {
            console.log("Found..." + users.length);
	    var emailsArray = []; 
            for (var i = 0; i < users.length; i++) {
		emailsArray[i] = users[i].get("email");
	    }
            response.success(users);
            //response.success(emailsArray);
        },

        error: function(error) {
            response.error(error);
        }
    });
});

Parse.Cloud.define('getFullUserInstallationsFromIds', function(request, response) {
    //Parse.Cloud.useMasterKey();

    var params = request.params;
    var users = params.userIds; //ids of relevant users

    var query = new Parse.Query(Parse.Installation);
    query.containedIn("user", users);
    query.descending('updatedAt')
    query.find({
        useMasterKey: true, //This is for the new version
        success: function(results) {
            for (var i = 0; i < results.length; i++) {
                console.log("iterating over Installations");
            }
            console.log("Finished iterating over Installations");
            response.success(results);
        },
        error: function(error) {
            response.error(error);
        }
    });
});
