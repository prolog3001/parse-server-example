var push = require('./push.js');
var i18n = require('i18n');
var utils = require('./utils.js');
const axios = require('axios');
var request = require("request");
var http = require("https");
var moment = require('moment');
var sgMail = require('@sendgrid/mail')

const WELCOME_TEMPLATE_TYPES = {
  Welcome_Admin: 'd-d0429d0016c041009bef1389a8ee215a',
  Welcome_Planner: 'd-d0429d0016c041009bef1389a8ee215a',
  Welcome_Client: 'd-d0429d0016c041009bef1389a8ee215a'
}

const CONTACT_TYPES = {
  Users_Admin: '13bce981-1bec-46f4-8bed-33fe99c64c26',
  Users_Planner: '9e0ae9bd-e366-480c-b91a-a0d6a1f0f4f2',
  Users_Client: '322fb624-e73a-4bd5-b0c5-c62b30fd0366'
}

module.exports = {
  reportDaily,
  addUserToMailingList,
  sendNewUserEmail,
  sendNewHostEmail: function (request, response) {
    sendNewHostEmail(request, response);
  },
  sendNewsletter: function (request, response) {
    sendNewsletter(request, response);
  },
  sendBulkEmail: function (request, response) {
    sendBulkEmail(request, response);
  },
  sendTestEmail: function (request, response) {
    sendTestEmail(request, response);
  },
  CONTACT_TYPES
};

async function reportDaily() {
  try {
    console.error('Daily Email Check', global.lastSentDailyReportEmail)
    
    if (!global.lastSentDailyReportEmail ||
      !moment(global.lastSentDailyReportEmail).isSame(new Date(), 'day')) {
        console.log('Daily Email Not Same Day, Needs to Send Today')

        global.lastSentDailyReportEmail = new Date();
      var oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      var businessesFromLastDayQuery = new Parse.Query("Business");
      businessesFromLastDayQuery.greaterThanOrEqualTo("createdAt", oneDayAgo);
      businessesFromLastDayQuery.limit(10000);
      var businesses = await businessesFromLastDayQuery.find({ useMasterKey: true });
      console.log('Daily Email businesses:', businesses.length)

      var usersFromLastDayQuery = new Parse.Query("_User");
      usersFromLastDayQuery.greaterThanOrEqualTo("createdAt", oneDayAgo);
      usersFromLastDayQuery.limit(10000);
      var users = await usersFromLastDayQuery.find({ useMasterKey: true });
      console.log('Daily Email users:', users.length)

      var openedOrdersQuery = new Parse.Query("RestaurantOrderSummary");
      openedOrdersQuery.greaterThanOrEqualTo("createdAt", oneDayAgo);
      openedOrdersQuery.limit(10000);
      var orders = await openedOrdersQuery.find({ useMasterKey: true });
      console.log('Daily Email orders:', orders.length)

      var purchasesQuery = new Parse.Query("Purchase");
      purchasesQuery.greaterThanOrEqualTo("createdAt", oneDayAgo);
      purchasesQuery.limit(10000);
      var purchases = await purchasesQuery.find({ useMasterKey: true });
      console.log('Daily Email purchases:', purchases.length)

      var params = {};
      var fromEmail = "info@dreamdiner.io";
      var fromName = "DreamDiner";
      var fromString = fromName + " <" + fromEmail + ">";

      var toString = "DreamDiner Team" + " <" + process.env.MAILGUN_TEST_EMAIL + ">"

      var emailSubject = "Daily Dreamdiner System Report";

      var fs = require('fs');
      var emailBody = fs.readFileSync('cloud/HTML/User Actions/email_dailymail.html', "utf-8");
      emailBody = utils.replaceAll(emailBody, "date", moment(oneDayAgo).format('MM/DD/YYYY'));
      emailBody = utils.replaceAll(emailBody, "businesses", businesses ? businesses.length : 0);
      emailBody = utils.replaceAll(emailBody, "users", users ? users.length : 0);
      emailBody = utils.replaceAll(emailBody, "orders", orders ? orders.length : 0);
      emailBody = utils.replaceAll(emailBody, "purchases", purchases ? purchases.length : 0);

      // var sendAt = moment(new Date()).set('hour', 7).set('minute', 31);
      var sendAt = moment(new Date()).set('hour', 23);

      var data = {
        from: fromString,
        to: process.env.MAILGUN_TEST_EMAIL,
        subject: emailSubject,
        html: emailBody,
        send_at: sendAt.unix()
      };

      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      sgMail.send(data)
        .then(() => {
          console.log('Daily Email will be sent at: ' + sendAt.unix())
        }).catch((error) => {
          console.error('Daily Email', error)
        })
    } else{
      console.error('Daily Email sent already')
    }
  } catch (error) {
    console.error('Daily Email', error)
  }
}

function addUserToMailingList(user, type) {
  try {
    var listIds = [];

    if (!user || !user.email) {
      console.log('addUserToMailingList', 'dummy user')
      user = {
        email: "matandahan@gmail.com",
        name: 'Matan'
      }
    }

    if (!type || !type.length)
      type = CONTACT_TYPES['Users_Planner'];

    listIds.push(type)

    console.log('addUserToMailingList user', user)

    var email = (user.email ? user.email : user.get('email'));
    var name = (user.name ? user.name : user.get('name'));

    console.log('addUserToMailingList', email)
    console.log('addUserToMailingList', name)

    var auth = "Bearer " + process.env.SENDGRID_API_KEY;
    // console.log('addUserToMailingList auth', auth)

    var options = {
      method: 'PUT',
      url: 'https://api.sendgrid.com/v3/marketing/contacts',
      headers:
      {
        'content-type': 'application/json',
        authorization: auth
      },
      body:
      {
        list_ids: listIds,
        contacts:
          [
            {
              'email': email,
              'first_name': name
            }
          ]
      },
      json: true
    };
    // console.log('addUserToMailingList options', options)

    request(options, function (error, response, body) {
      if (error) {
        console.log('addUserToMailingList error', error)
      }

      console.log('addUserToMailingList success', body);
    });
  } catch (error) {
    console.error('addUserToMailingList', error)
  }
}

async function sendNewUserEmail(user, type) {
  try {
    if ((user.name && user.email) || (user.get("name") && user.get("email"))) {

      console.log("sendNewUserEmail name: " + (user.name ? user.name : user.get("name")));
      console.log("sendNewUserEmail email: " + (user.email ? user.email : user.get("email")));

      var listIds = [];

      if (!type || !type.length)
        type = WELCOME_TEMPLATE_TYPES['Welcome_Planner'];

      listIds.push(type)

      if (!user || !user.email) {
        console.log('addUserToMailingList', 'dummy user')
        user = {
          email: "matandahan@gmail.com",
          name: 'Matan'
        }
      }


      var fromEmail = "info@dreamdiner.io";
      // var fromName = "DreamDiner";
      // var fromString = fromName + " <" + fromEmail + ">";

      // var toString = user.get("name") + " <" + user.get("email") + ">"

      // var emailSubject = "Welcome to DreamDiner";

      // var fs = require('fs');
      // var emailBody = fs.readFileSync('cloud/HTML/User Actions/email_welcome.html', "utf-8");
      // emailBody = utils.replaceAll(emailBody, "admin_name", user.get("name"));
      // emailBody = utils.replaceAll(emailBody, "admin_email", user.get("email"));

      // var data = {
      //   from: fromString,
      //   to: toString,
      //   subject: emailSubject,
      //   html: emailBody
      // };

      var data = {
        "from": {
          "email": fromEmail
        },
        "personalizations": [
          {
            "to": [
              {
                "email": user.email ? user.email : user.get("email")
              }
            ],
            "dynamic_template_data": {
              "items": [
                {
                  "name": user.name ? user.name : user.get("name"),
                }
              ],
              "name": user.name ? user.name : user.get("name")
            }
          }
        ],
        "template_id": listIds
      };
      console.log("sendNewUserEmail", data);

      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      sgMail.send(data)
        .then(() => {
          console.log('Email sent')
        }).catch((error) => {
          console.error(error)
        })
    } else {
      console.log("New User has NO email and name");
    }
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function sendNewHostEmail(request, response) {
  try {
    var params = request.params;

    var user = await utils.getObjectById('User', params.userId);
    console.log("New User id: " + user.id);
    console.log("New User name: " + user.get("name"));
    console.log("New User email: " + user.get("email"));

    if (user.get("name") && user.get("name").length > 0 &&
      user.get("email") && user.get("email").length > 0) {

      console.log("New Host has email and name");

      var fromEmail = "info@dreamdiner.io";
      var fromName = "DreamDiner";
      var fromString = fromName + " <" + fromEmail + ">";

      var toString = user.get("name") + " <" + user.get("email") + ">"

      var emailSubject = "Welcome to the Table Planner";

      var fs = require('fs');
      var emailBody = fs.readFileSync('cloud/HTML/User Actions/email_host_added.html', "utf-8");
      emailBody = utils.replaceAll(emailBody, "admin_name", user.get("name"));

      var data = {
        from: fromString,
        to: toString,
        subject: emailSubject,
        html: emailBody
      };

      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      sgMail.send(data)
        .then(() => {
          console.log('Email sent')
        }).catch((error) => {
          console.error(error)
        })
    } else {
      console.log("New User has NO email and name");
    }
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function sendNewsletter(request, response) {
  try {
    var fs = require('fs');
    var emailBody = fs.readFileSync('cloud/HTML/User Actions/email_newsletter.html', "utf-8");

    var userQuery = new Parse.Query(Parse.User);
    userQuery.exists("business");
    userQuery.exists("email");
    userQuery.notEqualTo("blocked", true);

    //DEBUG ONLY
    userQuery.equalTo("email", process.env.MAILGUN_TEST_EMAIL);
    userQuery.limit(1);

    userQuery.find({
      useMasterKey: true,
      success: function (users) {
        console.log("Found..." + users.length);
        sendBulkEmail("Test Newsletter", emailBody, users);
        if (response)
          response.success("Newsletter Sent");
        else
          return;
      },

      error: function (error) {
        if (response)
          response.error(error);
        else
          return error;
      }
    });
  } catch (error) {
    console.log(error);
    if (response)
      response.error(error);
    else
      return error;
  }
}

async function sendBulkEmail(emailSubject, emailBody, users) {
  try {
    // console.log("sendBulkEmail..." + emailBody);
    if (!users || users.length == 0) {
      console.log("sendBulkEmail dummy");
      // return;
    } else {
      console.log("sendBulkEmail..." + users.length);
    }

    var fromEmail = "info@dreamdiner.io";
    var fromName = "DreamDiner";

    var recipients = [];

    if (!emailSubject || !emailSubject.length) {
      emailSubject = "Welcome to DreamDiner";
    }

    if (!emailBody || !emailBody.length) {
      var fs = require('fs');
      emailBody = fs.readFileSync('cloud/HTML/User Actions/email_welcome.html', "utf-8");
      emailBody = utils.replaceAll(emailBody, "admin_name", "DreamDiner Test");
    }

    if (!users || !users.length) {
      recipients.push('matan1@mailinator.com')
      recipients.push('matan2@mailinator.com')
      recipients.push('matan3@mailinator.com')
      recipients.push('matan4@mailinator.com')
    } else {
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var recepient = user.get("email");
        recipients.push(recepient);
      }
    }

    console.log("bulk email fromEmail", fromEmail);
    console.log("bulk email recipients", recipients);
    console.log("bulk email emailSubject", emailSubject);
    var data = {
      from: fromEmail,
      to: recipients,
      subject: emailSubject,
      html: emailBody
    };
    console.log("bulk email data", data);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    sgMail.sendMultiple(data)
      .then(() => {
        console.log("bulk email sent");
      }).catch((error) => {
        console.log("got an error in sendBulkEmail: " + error);
      })
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function sendTestEmail(request, response) {
  try {
    var params = {};
    var fromEmail = "info@dreamdiner.io";
    var fromName = "DreamDiner";
    var fromString = fromName + " <" + fromEmail + ">";

    var toString = "DreamDiner Test" + " <" + process.env.MAILGUN_TEST_EMAIL + ">"

    var emailSubject = "Welcome to DreamDiner";

    var fs = require('fs');
    var emailBody = fs.readFileSync('cloud/HTML/User Actions/email_welcome.html', "utf-8");
    emailBody = utils.replaceAll(emailBody, "admin_name", "DreamDiner Test");

    var data = {
      from: fromString,
      to: process.env.MAILGUN_TEST_EMAIL,
      subject: emailSubject,
      html: emailBody
    };

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    sgMail.send(data)
      .then(() => {
        console.log('Email sent')
      }).catch((error) => {
        console.error(error)
      })
  } catch (error) {
    console.log(error);
    return error;
  }
}
