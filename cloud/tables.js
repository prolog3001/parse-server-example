module.exports = {
  sendSomething: function (request, response) {
    sendSomething(request, response);
  }
};

function sendSomething(request, response) {
  var verificationCode = Math.floor(Math.random() * 899999 + 100000);

  const from = 'DigiDine'
  const to = request.params ? request.params.phoneNumber ? request.params.phoneNumber : "+972526677877" : "972526677877"
  const text = "Your verification code is " + verificationCode

  console.log("Send verification to", to);
  console.log("Send verification from", from);
  console.log("Send verification text", text);

  Parse.Cloud.run("sendSMS", {
    to,
    from,
    text
  })
  .then(function(result) {
    console.log("result :" + JSON.stringify(result))
    response.success(verificationCode);
  }, function(error) {
    response.error(error);
  });
  return;
}
