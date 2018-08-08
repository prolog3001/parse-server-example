const axios = require('axios');

const PAYME_URL = process.env.PAYME_URL;
const PAYME_CLIENT_KEY = process.env.PAYME_KEY;
const MERCHANT_FEE = process.env.MERCHANT_FEE_PERC

const REGISTER_TEACHER_DEFAULT_PARAMS = {
	seller_person_business_type: 1319,
	market_fee: MERCHANT_FEE
};

var Payme = class Payme {
	constructor(props) {
		this.baseURL = PAYME_URL;
		this.props = props;
	}

	getBaseParams() {
		var baseParams = {
			payme_client_key: PAYME_CLIENT_KEY
		}

		return baseParams;
	}

	save(endpoint, params, callback) {
		var url = this.baseURL + '/api/' + endpoint;
		var p = {...params, ...this.getBaseParams()};
		console.log('sending request to ', url);
		console.log('with params', p);
		axios.post(url, p)
		.then(function (res) {
			console.log('SAVE SUCCESS')
			callback(null, res.data);
		})
		.catch(function (error) {
			console.log('SAVE ERROR', error)
			callback((error.response && error.response.data) ? error.response.data : error);
		});
	}

	updateUserById(userId, props, callback) {
		console.log('updateUserById', userId);
		if (!userId) {
			callback('Must provide userId');
			return;
		}

		var query = new Parse.Query(Parse.User);
		query.equalTo('objectId', userId);
		query.include("preferences");
		query.find({
			success: function (users) {
				var user = users[0];

				if (!user) {
					console.log('user not found');
					callback('User not found')
					return;
				}

				var userPreferencesPropsToUpdate;
				if(user.get("preferences"))
				{
					console.log('Reached 1');
					userPreferencesPropsToUpdate = {
						payment_service_fee_percent: 2.1,
						payment_service_fee_cents: 120,
						merchant_fee_percent:2
					};
				}else {
					console.log('Reached 2');
					userPreferencesPropsToUpdate = {
						session_email_invite: true,
						together_email_invite: true,
						session_email_joined: true,
						language: "he",
						payment_service_fee_percent: 2.1,
						payment_service_fee_cents: 120,
						merchant_fee_percent:2
					};
				}
				try {
					saveToUserPreferences(userPreferencesPropsToUpdate,user);
				} catch (error) {
						console.log('Error 1' + error);
				}

				user.set(props);
				user.save(null, {
					useMasterKey: true,
					success: function(user) {
						console.log('success update user')
						callback(null, user);
					},
					error: function(user, error) {
						console.log('Failed to update object, with error code: ' + error.message);
						callback(error, null);
					}
				});
			},
			error: function (err) {
				console.log('error finding user');
				callback(err)
			}
		})
	}



	registerTeacher(params, callback) {
		var userId = params.userId;
		delete params.userId;
		console.log('registerTeacher');
		this.save('create-seller', {...REGISTER_TEACHER_DEFAULT_PARAMS, ...params}, (err, res) => {
			if (err) {
				callback(err);
				return;
			}

			this.updateUserById(userId, {
				payme_seller_id: res.seller_payme_id,
				payme_seller_secret: res.seller_payme_secret
			}, (userUpdateErr, userUpdateRes) => {
				if (userUpdateErr) {
					console.log('error updateUserById', userUpdateErr);
					callback(userUpdateErr);
					return;
				} else{

					//emalType 1
					console.log('finished updateUserById');
					console.log('try sendTeacherRegisteredEmail');
					this.sendTeacherRegisteredEmail({userId : userId}, callback, userUpdateRes);
				}
			});
		})
	}

	updateSellerFiles(params, callback) {
		var finalParams = {...REGISTER_TEACHER_DEFAULT_PARAMS, ...params};
		delete finalParams.market_fee;
		console.log('updateSellerFiles', finalParams)
		this.save('update-seller-files', finalParams, (err, res) => {
			if (err) {
				console.log('updateSellerFiles ERROR', err)
				callback(err);
				return;
			}
			console.log('updated seller files')

			if (callback) {
				callback(null, res);
			}
		})
	}

	getSeller(params, callback) {
		this.save('get-sellers', {}, (err, res) => {
			if (err) {
				callback(err);
				return;
			}
			var data = res.items.length ? res.items[0] : {};
			callback(null, data);
		})
	}

	sendTeacherRegisteredEmail(params, callback, userUpdateRes) {
		console.log('sendTeacherRegisteredEmail');
		var userIds = [];
		userIds.push(params.userId);

		try{
			Parse.Cloud.run('getFullUsersFromIds', {userIds : userIds}, {
				success: function (fullUsers) {
					try{
						var receiver = fullUsers[0];
						console.log('sendTeacherRegisteredEmail - ' + receiver.get("email"));

						var emailParams = {
							emailType : 1,
							fromName : "Medidate",
							fromEmail : "no-reply@medidatewith.me",
							toName : receiver.get("first_name"),
							toEmail : receiver.get("email")
						}

						console.log("sendEmail");
						sendEmail(emailParams, callback, userUpdateRes);
					}catch (error) {
						console.error(error);
					}
				},
				error: function (error) {
					console.log('error', error);
				}
			});
		}catch (error) {
			console.error(error);
		}
	}
}

function sendEmail(emailParams, callback, userUpdateRes){
	console.log('try sendEmail');
	try{
		console.log("sendEmail " + JSON.stringify(emailParams));
		Parse.Cloud.run('sendEmailsToUsers', emailParams, {
			success: function (result) {
				console.log('success sendEmailsToUsers');

				if(callback != null){
					callback(null, userUpdateRes);
				}
			},
			error: function (error) {
				console.log('error', error);
			}
		});
	}catch (error) {
		console.error(error);
	}
}

function saveToUserPreferences(props, user) {
	try {
		var UserPreferences;
		var userPreferences;
		console.log('Trying to save user preferences - ', props);
		if (user.get('preferences')) {
			userPreferences = user.get('preferences');
			console.log('preferences exist');
		} else {
			UserPreferences = Parse.Object.extend('UserPreferences');
			userPreferences = new UserPreferences();
			console.log('preferences does not exist');
		}

		userPreferences.save(props, {
			success: (userPreferences) => {
				user.set({preferences: userPreferences});
				user.save(null, {
					success: function(user) {
						console.log('successfully saved the preferences to the user')
					},
					error: function(user, error) {
						console.log('Failed to update object, with error code: ' + error.message);
					}
				});
			},
			error: function(error) {
				console.log('Failed to update object, with error code: ' + error.message);
			}
		});
	} catch (error) {
			console.log('Error ' + error);
	}
}

// Functions Exposed to API
var exposedFunctions = ['getSeller', 'updateSellerFiles', 'registerTeacher'];

function exposeToApi(functionName, request, response) {
	var { params } = request;

	console.log('PAYME FUNCTION: ' + functionName);
	console.log('PAYME FUNCTION PARAMS: ', params);

	new Payme()[functionName](params, (err, res) => {
		if (err) {
			console.log('PAYME FUNCTION ERR:', err)
			response.error(err);
			return;
		}
		console.log('PAYME FUNCTION SUCCESS')
		response.success(res);
	});
}

var exps = {};
exposedFunctions.forEach((functionName) => {
	exps[functionName] = function (request, response) {
		exposeToApi(functionName, request, response);
	}
});

module.exports = exps;
