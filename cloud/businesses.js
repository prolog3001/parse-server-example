
module.exports = {
  addCreditsToBusinesses: function (request, response) {
    addCreditsToBusinesses(request, response);
  }
};

function addCreditsToBusinesses(request, response) {
  console.log("addCreditsToBusinesses");

  var params = request.params;

  var businessIds = params.businessIds;

  var businessQuery = new Parse.Query("Business");

  if (businessIds && businessIds.length > 0) {
    businessQuery.containedIn("objectId", businessIds);
    businessQuery.limit(businessIds.length);
  } else {
    //DEBUG ONLY
    // businessQuery.equalTo("objectId", "OUPcvgIZAn");
    // businessQuery.limit(1);

    businessQuery.limit(10000);
  }

  businessQuery.exists("admin");
  businessQuery.equalTo((params.creditType || "orders_accumulate"), 0);
  businessQuery.find({
    useMasterKey: true,
    success: function (businesses) {
      console.log("Found..." + businesses.length);

      for (var i = 0; i < businesses.length; i++) {
        var business = businesses[i];
        if (business)
          business.increment((params.creditType || "orders_accumulate"), (params.credits || 25));
      }

      console.log("Save businesses..." + businesses.length);
      Parse.Object.saveAll(businesses, {
        useMasterKey: true,
        success: function (updatedBusinesses) {
          console.log("#### Saved businesses  " + updatedBusinesses.length);
          response.success("added credits to businesses");
        },
        error: function (error) {
          console.log("Wasnt able to save  " + error);
          response.success(error);
        }
      });
    },

    error: function (error) {
      response.error(error);
    }
  });
}
