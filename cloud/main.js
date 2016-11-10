Parse.Cloud.define('oneSignalPush', function(request, response) {
    var promise = new Parse.Promise();
    var params = request.params;

    var custom = params.custom; //JSON string of push
    var users = params.attenders; //ids of relevant users
    console.log("#### Push Data " + custom);

    var jsonObject = JSON.parse(custom);
    var alert = jsonObject.alert;
    var session_alert = jsonObject.session_alert;
    var push_title = jsonObject.push_title;
    var push_type = jsonObject.push_type;
    var message_object_id = jsonObject.message_object_id;
    var push_notification_id = jsonObject.push_notification_id;
    var push_object_id = jsonObject.push_object_id;
    console.log("#### Push Type " + push_type);

    var pushTagKey = "session_changed_push"; //Default
    var pushTagRelation = "="; //Default
    var pushTagValue = "true"; //Default
    switch (push_type) {
        case 0:
            pushTagKey = "session_changed_push";
            console.log("#### session_changed_push");
            break;
        case 1:
            pushTagKey = "user_followed_push";
            console.log("#### user_followed_push");
            break;
        case 2:
            pushTagKey = "session_attender_push";
            console.log("#### session_attender_push");
            break;
        case 3:
            pushTagKey = "new_follower_push";
            console.log("#### new_follower_push");
            break;
        case 4:
            //NOTHING TO FILTER
            console.log("#### session_deleted_push");
            break;
        case 5:
            pushTagKey = "session_message_push";
            console.log("#### session_message_push");
            break;
        default:
            pushTagKey = "session_changed_push";
            console.log("#### session_changed_push");
            break;
    }

    var jsonBody = {
        app_id: process.env.ONE_SIGNAL_APP_ID,
        included_segments: ["All"],
        contents: {
            en: alert,
        },
        headings: {
            en: push_title,
        },
        data: {
            custom: custom,
        },
        tags: [{
            "key": pushTagKey,
            "relation": pushTagRelation,
            "value": pushTagValue
        }]
    };

    Parse.Cloud.httpRequest({
        method: "POST",
        url: "https://onesignal.com/api/v1/notifications",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Authorization": "Basic " + process.env.ONE_SIGNAL_REST_API_KEY
        },
        body: JSON.stringify(jsonBody)
    }).then(function(httpResponse) {
            promise.resolve(httpResponse)
        },
        function(httpResponse) {
            promise.reject(httpResponse);
        });

    return promise;
});

Parse.Cloud.define('addMessageToUserRelationMessages', function(request, response) {

    var Message = Parse.Object.extend("Message");
    var params = request.params;
    var chatOwner = new Parse.User({id:params.chatOwnerId}); //id of user sent the message
    var message = Message.createWithoutData(params.messageId); //id of new message
   
    var relation = chatOwner.relation("messages");
    relation.add(message);

    chatOwner.save(null, {
        success:function(){
        	response.success("Message was saved to relation");
        },
        error:function(error){
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
            custom: custom
        }
    }, {
        success: function() {
            console.log("#### PUSH OK");
        },
        error: function(error) {
            console.log("#### PUSH ERROR" + error.message);
        },
        useMasterKey: true
    });

    response.success('success');
});

Parse.Cloud.define('saveAndroidUserDeviceToken', function(request, response) {
    Parse.Cloud.useMasterKey();
    var params = request.params;
    var user = request.user;
    var token = params.token; //GCM TOKEN
    var installation = params.installation; //ids of relevant users
    console.log("#### Installation Id To Save Token " + installation[0]);
    console.log("#### User GCM Token " + token);

    var installationQuery = new Parse.Query(Parse.Installation);
    installationQuery.equalTo('objectId', installation[0]);
    installationQuery.find({
        success: function(installations) {
            console.log("#### Successfully retrieved Installation" + installations.length);
            var userInstallation = installations[0];
            userInstallation.set("deviceToken", token);
            userInstallation.save(null, {
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
        }
    });
});

Parse.Cloud.define('refreshRecurringSessions', function(request, response) {

    var excludeMinusOccurences = [0, -1, -2, -3];
    var then = new Date();
    then.setHours(then.getHours() - 1);

    var pushQuery = new Parse.Query("MSession");
    pushQuery.lessThanOrEqualTo("date", then);
    pushQuery.notContainedIn("occurrence", excludeMinusOccurences);
    pushQuery.limit(1000);
    pushQuery.find({
        success: function(results) {
            console.log("#### Sessions to Reoccurre " + results.length);
            var newRecurringSessionsArray = new Array(results.length);
            var edittedRecurringSessionsArray = new Array(results.length);

            //var sum = 0;
            for (var i = 0; i < results.length; ++i) {
                var newSession = results[i].clone();
                newSession.set("attenders_count", 0);
                var dailyDaysArray = newSession.get("session_occurrence_days");
                
                var date = new Date(newSession.get("date").getTime());
                switch (newSession.get("occurrence")) {
                    case 1:
                        do {
                            if(dailyDaysArray !== null && dailyDaysArray !== undefined && dailyDaysArray[0]!== 0)
                	    {
                	    	console.log("This Daily has sessions days and   " + dailyDaysArray);
                	    	do{
                	    	    date.setDate(date.getDate() + 1);
	                	    var dayNumber = date.getDay() + 1;
	                	    console.log("does day exists:   " + dailyDaysArray.indexOf(dayNumber));
                	    	}while(dailyDaysArray.indexOf(dayNumber) === -1)
                	    }else
                	    {
                	    	console.log("NO DAYS DEFINED OR WEEKLY");
                	    	date.setDate(date.getDate() + 1);
                	    }
                	    //date.setDate(date.getDate() + 1);
                        } while (date <= then);
                        break;

                    case 2:
                        do {
                            //  date.setHours(then.getHours() + 7 * 24);
                            date.setDate(date.getDate() + 7);
                        } while (date <= then);
                        break;

                    case 3:
                        //  date.setHours(then.getHours() + 4 * 7 * 24);
                        date.addMonths(1);
                        break;
                    default:
                        ;
                }
                newSession.set("date", date);
                newSession.set("day", date.getDay() + 1);
                results[i].set("occurrence", -1 * results[i].get("occurrence"));

                newRecurringSessionsArray.push(newSession);
                edittedRecurringSessionsArray.push(results[i]);
            }
            if (newRecurringSessionsArray.length > 0 && edittedRecurringSessionsArray.length > 0) {
                Parse.Object.saveAll(newRecurringSessionsArray, {
                    success: function(list) {
                        console.log("#### Saving New Recurring Sessions Array  " + newRecurringSessionsArray.length);
                        Parse.Object.saveAll(edittedRecurringSessionsArray, {
                            success: function(list) {
                                console.log("#### Saving Edited Recurring Sessions Array  " + edittedRecurringSessionsArray.length);
                                response.success('success');
                            },
                            error: function(error) {
                            	console.log("wasnt able to save  " + error.code);
                                response.error('Wasnt able to save Old Recurring Sessions');
                            },
                        });
                    },
                    error: function(error) {
                    	console.log("wasnt able to save  " + error.code);
                        response.error('Wasnt able to save New Recurring Sessions');
                    },
                });
            }
            response.success('success');
        },
        error: function() {
            response.error('Wasnt able to find Recurring Sessions');
        }
    });
    response.success('Saved Reoccurred Sessions');

    Date.isLeapYear = function(year) {
        return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
    };

    Date.getDaysInMonth = function(year, month) {
        return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    };

    Date.prototype.isLeapYear = function() {
        return Date.isLeapYear(this.getFullYear());
    };

    Date.prototype.getDaysInMonth = function() {
        return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
    };

    Date.prototype.addMonths = function(value) {
        var n = this.getDate();
        this.setDate(1);
        this.setMonth(this.getMonth() + value);
        this.setDate(Math.min(n, this.getDaysInMonth()));
        return this;
    };

});

Parse.Cloud.define("sendEmail", function(request, response) {

    console.log("sendEmail " + new Date());
    var emailType = request.params.emailType;
    
    var emailBody = request.params.emailBody;
    var emailSubject = request.params.emailSubject;
    var fromName = request.params.fromName;
    var studentEmail = request.params.studentEmail;
    var fromEmail = "no-reply@medidatewith.me";
    var bccEmail = "contact@medidateapp.com";
    
    var toEmail = request.params.toEmail;
    var toName = request.params.toName;
    
    var sessionDate = request.params.sessionDate;
    var sessionTitle = request.params.sessionTitle;
    var sessionPrice = request.params.sessionPrice;
    var sessionCreator = request.params.sessionCreator;
    
    var studentReason = request.params.studentReason;
    
    var data;
    
    var fromString = fromName + " <"+fromEmail+">";
    var fromStudentString = fromName + " <"+studentEmail+">";
    var toString = toName + " <"+toEmail+">"
    
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
        default:
            console.log("#### NO TYPE");
            return;
            break;
    }

    var simpleMailgunAdapter = require('mailgun-js')({apiKey: process.env.MAILGUN_KEY || '', domain: process.env.DOMAIN || 'medidatewith.me'});
    simpleMailgunAdapter.messages().send(data, function (error, body) {
        if (error) {
            console.log("got an error in sendEmail: " + error);
            response.error(err);
        }else {
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
    
    var fromString = fromName + " <"+fromEmail+">";
    var toString = "Ophir and Matan" + " <"+toEmail+">"
    
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

    var simpleMailgunAdapter = require('mailgun-js')({apiKey: process.env.MAILGUN_KEY || '', domain: process.env.DOMAIN || 'medidatewith.me'});
    simpleMailgunAdapter.messages().send(data, function (error, body) {
        if (error) {
            console.log("got an error in sendEmail: " + error);
            response.error(err);
        }else {
            console.log("email sent to " + toEmail + " " + new Date());
            response.success("Email sent!");
        }
    });
});
