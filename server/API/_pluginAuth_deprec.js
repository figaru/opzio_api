/*
Router.route(
	'/v1/auth', 
	function () {
        var response = {};
        var res = this.response;
		var req = this.request;

		Meteor.setTimeout(function(){ 
			try{
				var email = req.query.user;
				var password = req.query.pass;
			}
			catch(err){
				console.log('**ERR AUTH: retrieving plugin user credentials.');
				console.log(req.query);
				var resp = JSON.stringify({
					tag: "login",
					success: 0,
					error: 1,
					error_msg: "Unable to retrieve credentials."
				});
				
				res.end(resp);

				return;
			}

			if(typeof email === 'string' && typeof password === 'string'){
				try {
				    if (ApiPassword.validate({email: email, password: password})) {
				      	console.log('Authenticating ' + email);


				      	var user = Meteor.users.findOne({ "emails.address" : email });
				      	
				      	var hashStampedToken = Accounts._generateStampedLoginToken();

				      	Meteor.users.update({
				      		_id: user._id
				      	},
						{
							$push: {
								'services.resume.loginTokens': hashStampedToken
							},
							$set:{
								'profile.hasTracker': true
							}
						});

						hasCompletedMainIntro(user._id);

				      	response = {
					        error: false,
						    authToken: hashStampedToken.token,
						    session: user.profile.token,
						    userId: user._id
					    };
				    } else {
				      	response = {
						    tag: "login",
						    success: 0,
						    error: 1,
						    error_msg: "Login credentials are incorrect."
						}
				    }
				} catch (exc) {
				  		//console.log(exc.message);
				  		response = {
						    tag: "login",
						    success: 0,
						    error: 1,
						    error_msg: "User not found for given credentials."
						}
				  // 'User is not found', 'User has no password set', etc
				}
			}
			else{
		  		response = {
				    tag: "login",
				    success: 0,
				    error: 1,
				    error_msg: "Unable to retrieve credentals."
				}
			}

			var final = JSON.stringify(response);

			res.end(final);

		}, 200);

	}, 
	{
		where: 'server'
	}
);

Router.route(
	'/v1/sync', 
	function () {
        var response = {};
        var res = this.response;
		var req = this.request;

		Meteor.setTimeout(function(){ 
			try {
				if (typeof req.headers['x-auth-token'] !== 'undefined' && typeof req.headers['x-user-id'] !== 'undefined') {
					var userId = req.headers['x-user-id'];
					var authToken = req.headers['x-auth-token'];

					var user = Meteor.users.findOne({
						_id: userId,
						'services.resume.loginTokens.token': authToken
					});
					
					var userName = user.profile.firstName + ' ' + user.profile.lastName;

					console.log('SYNC: Synchronizing plugin settings for ' + userName +' @'+moment().format('HH:mm:ss'));

					var organization = Organizations.findOne({_id: user.profile.organization }).name;

					if(typeof user !== 'undefined'){
						response = {
							status: "success",
							message: "Sync successful",
							error: false,
							data: {
								name: userName,
								company: organization,
								token: user.profile.token,
								workableWeekDays: user.workableWeekDays,
								workableHours: user.workableHours,
							}
						};
					}
					else{
						response = {
							status: "error",
							message: "Couldn\'t authenticate user with current token. Try login in again.",
							error: true,
							data: { }
						};
					}


				}
				else{
					response = {
						status: "error",
						message: "Sync credentials not found in header.",
						error: true,
						data: { }
					};
				}
			} catch (err) {
				console.log(err)
				response = {
					status: "error",
					message: "Unknown error synchronizing user data.",
					error: true,
					data: { }
				};
			}

			var final = JSON.stringify(response);

			//Right now we always send 200 OK code.
			res.end(final);

		}, 200);

	}, 
	{
		where: 'server'
	}
);
*/