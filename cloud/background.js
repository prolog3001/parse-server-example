module.exports = {
  closeOpenedOrders: function (request, response) {
    closeOpenedOrders(request, response);
  }
};

function closeOpenedOrders(request, response) {
  var newRecurringSessionsArray = [];
  var excludeMinusOccurences = [0, -1, -2, -3];
  var then = new Date();
  then.setHours(then.getHours() - 1);

  var sessionsQuery = new Parse.Query("MSession");
  sessionsQuery.lessThanOrEqualTo("date", then);
  sessionsQuery.notContainedIn("occurrence", excludeMinusOccurences);

  sessionsQuery.notEqualTo("canceled", true);
  sessionsQuery.exists("occurrence");
  sessionsQuery.limit(1000);

  sessionsQuery.find({
    useMasterKey: true,
    success: function (sessionsToUpdate) {
      console.log("#### Sessions to Reoccurre " + sessionsToUpdate.length);
      for (var i = 0; i < sessionsToUpdate.length; ++i) {
        try {
          if (!sessionsToUpdate[i] || sessionsToUpdate[i] === null || sessionsToUpdate[i] === undefined) {
            console.log("Session is null..");
            continue;
          }

          var newSession = sessionsToUpdate[i].clone();
          newSession.set("attenders_count", 0);

          var dailyDaysArray = [];
          dailyDaysArray = newSession.get("session_occurrence_days");

          var date = newSession.get("date")
          var timezone = geoTz(newSession.get("location").latitude, newSession.get("location").longitude);

          switch (newSession.get("occurrence")) {
            case 1:
            do {
              if (dailyDaysArray !== null && dailyDaysArray != undefined && dailyDaysArray[0] !== 0) {
                do {
                  date = moment.tz(date, timezone).add(1, 'days').toDate();
                  var dayNumber = date.getDay() + 1;
                } while (dailyDaysArray.indexOf(dayNumber) === -1)
              } else {
                date = moment.tz(date, timezone).add(1, 'days').toDate();
              }
            } while (date <= then);
            break;

            case 2:
            do {
              date = moment.tz(date, timezone).add(1, 'weeks').toDate();
            } while (date <= then);
            break;

            case 3:
            date = moment.tz(date, timezone).add(4, 'weeks').toDate();
            break;
            default:
            ;
          }
          newSession.set("date", date);
          newSession.set("day", date.getDay() + 1);
          sessionsToUpdate[i].set("occurrence", -1 * sessionsToUpdate[i].get("occurrence"));

          newRecurringSessionsArray.push(newSession);
        } catch (error) {
          console.error(error);
        }
      }

      if (newRecurringSessionsArray.length > 0 && sessionsToUpdate.length > 0) {
        console.log("Try to save all - " + newRecurringSessionsArray.length);
        Parse.Object.saveAll(newRecurringSessionsArray, {
          useMasterKey: true,
          success: function (newSessionList) {
            console.log("Saved newRecurringSessionsArray");
            Parse.Object.saveAll(sessionsToUpdate, {
              useMasterKey: true,
              success: function (editedSessionList) {
                console.log("#### Saving New Recurring Sessions Array  " + newRecurringSessionsArray.length);
                console.log("#### Saving Edited Recurring Sessions Array  " + sessionsToUpdate.length);
                updatePlanSessionRelationWithUpdatedSessions(response, sessionsToUpdate, newRecurringSessionsArray);
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
        console.log("#### NO New Recurring Sessions to Re-Occure, try send push anyway");
        push.sendAlertToSessionSubscribers();
      }
    },
    error: function () {
      response.error('Wasnt able to find Recurring Sessions');
    }
  });
}
