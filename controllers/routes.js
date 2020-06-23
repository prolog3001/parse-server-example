var PaymentRequestController = require('./PaymentRequestController');
var RegisterBusinessController = require('./RegisterBusinessController');

module.exports = function (app) {
  app.get('/', function(req, res) {
    res.status(200);//.send('I dream of killing some ZOMBIES!');
  });

  app.post('/api/payment-request/success', PaymentRequestController);
  app.post('/api/register-business/success', RegisterBusinessController);

  //WEBHOOK callback url: https://digidine-server.herokuapp.com/parse/api/register-business/success
}
