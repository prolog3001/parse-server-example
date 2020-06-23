var PaymentRequestController = require('./PaymentRequestController');
var RegisterTeacherController = require('./RegisterTeacherController');

module.exports = function (app) {
  app.get('/', function(req, res) {
    res.status(200);//.send('I dream of killing some ZOMBIES!');
  });

  app.post('/api/payment-request/success', PaymentRequestController);
  app.post('/api/register-teacher/success', RegisterTeacherController);

  //WEBHOOK callback url: https://digidine-server.herokuapp.com/parse/api/payment-request/success
}
