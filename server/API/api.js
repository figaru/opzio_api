var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

// Global API configuration
Api = new Restivus({
	apiPath: "",
	defaultHeaders: {
      'Content-Type': 'application/json',
    },
    onLoggedIn: function () {
      //console.log(this.user.username + ' (' + this.userId + ') logged in');
    },
    onLoggedOut: function () {
      //console.log(this.user.username + ' (' + this.userId + ') logged out');
    },
    prettyJson: true,
    //useDefaultAuth: true,
    version: 'v1'
});

Api.addRoute("ping", {
	get:{
		action: function(){
			//console.log(this.request);

			return "ok";
		}
	}
});


Api.addRoute("unique", {
	get:{
		action: function(){
			//console.log(this.request.headers);

			this.response = resData({app_id: guid()});

			return this.response;
		}
	}
});

Api.addRoute("logout", {
	get:{
		action: function(){
			//new plugin
			//if new plugin -> use new valdiation
			try{
				//make sure headers exist and are valid
				var user = authRequired(this.request.headers);
				//set response data object
				this.response = resData();
			}catch(e){
				this.response = resError(e);
			}

			return this.response;
		}
	}
});

function logout(headers){
	var user = authRequired(headers);

	Meteor.users.update({
  		_id: user._id
  	},
	{
		$set: {
			'services.resume.loginTokens': []
		}
	});


}

Api.addRoute("logs",{
	post: {action: function(){ return logs(this); }},
	get: {action:  function(){ return logs(this); }}
});

function logs(self){
	//console.log(self.request);
	//check if old plugin
	if(isOldPlugin(self.request.headers)){
		//console.log("Using old plugin - HEARTBEAT");
		//run the old endpoint function
		var res = oldLogsRoot(self)
		return res;
	}else{
		//new plugin
		//if new plugin -> use new valdiation
		try{
			//make sure headers exist and are valid
			var user = authRequired(self.request.headers);

			//log
			var res = oldLogsRoot(self);

			//set response data object
			self.response = resData();
		}catch(e){
			self.response = resError(e);
		}
	}

	return self.response;
}

Api.addRoute("auth",{
	post: {action: function(){ return auth(this); }},
	get: {action:  function(){ return auth(this); }}
});

function auth(self){
	//check if old plugin
	if(isOldPlugin(self.request.headers)){
		//console.log("Using old plugin - Authenticating");
		//run the old endpoint function
		var res = oldAuth(self);
		return res;
	}

	//console.log("Authenticating new plugin login");

	//console.log(self.request.headers);

	//console.log(this.request);
	var params = getRequestData(self.request)

	try{
		//console.log(params);

		let data = authenticate(params.user, params.pass, params.app_id, params.app);

		//console.log(data);

		self.response = resData(data);
	}catch(e){
		self.response = resError(e);
	}

	//console.log(self.response);

	return self.response;
}

function oldAuth(self){
	var response = {};
    var res = self.response;
	var req = self.request;

	try{
		var email = req.query.user;
		var password = req.query.pass;
	}
	catch(err){
		//console.log('**ERR AUTH: retrieving plugin user credentials.');
		//console.log(req.query);
		var resp = JSON.stringify({
			tag: "login",
			success: 0,
			error: 1,
			error_msg: "Unable to retrieve credentials."
		});

		return resp;
	}

	if(typeof email === 'string' && typeof password === 'string'){
		try {
		    if (ApiPassword.validate({email: email, password: password})) {
		      	//console.log('Authenticating ' + email);


		      	var user = Meteor.users.findOne({ "emails.address" : email });
		      	
		      	var hashStampedToken = Accounts._generateStampedLoginToken();

		      	Meteor.users.update({
		      		_id: user._id
		      	},
				{
					$push: {
						'services.resume.loginTokens': hashStampedToken
					}
				});

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

	return response;
}


Api.addRoute('sync', {
	get:{
		action:function(){
			//check if old plugin
			if(isOldPlugin(this.request.headers)){
				//console.log("Using old plugin - Synchronizing");
				//run the old endpoint function
				var res = oldSync(this);
				return res;
			}

			//console.log("Synchronizing new plugin sync");

			//console.log(this.request.headers);

			//var response;
			try{

				if(appCloud.validateAccess(this.request.headers)){
					//make sure headers exist and are valid
					var user = Meteor.users.findOne({_id: this.request.headers['x-user-id']});
					//log sync request
					//console.log('New SYNC: Synchronizing plugin settings for ' + user.profile.firstName + ' ' + user.profile.lastName +' @'+moment().format('HH:mm:ss'));
					
					//get user organisation
					var organization = Organizations.findOne({_id: user.profile.organization }).name;

					let data = {
						name: user.profile.firstName + ' ' + user.profile.lastName,
						company: organization,
						token: user.profile.token,
						workableWeekDays: user.workableWeekDays,
						workableHours: user.workableHours,
					}

					this.response = resData(data);
				}

			}catch(e){
				//console.log(e);
				this.response = resError(e);
			}


			return this.response;
		}
	},
});

function oldSync(self){
	var response = {};
        var res = self.response;
		var req = self.request;

		try {
			if (typeof req.headers['x-auth-token'] !== 'undefined' && typeof req.headers['x-user-id'] !== 'undefined') {
				var userId = req.headers['x-user-id'];
				var authToken = req.headers['x-auth-token'];

				var user = Meteor.users.findOne({
					_id: userId,
					'services.resume.loginTokens.token': authToken
				});
				
				var userName = user.profile.firstName + ' ' + user.profile.lastName;

				console.log('SYNC Old Plugins: Synchronizing plugin settings for ' + userName +' @'+moment().format('HH:mm:ss'));

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
			//console.log(err)
			response = {
				status: "error",
				message: "Unknown error synchronizing user data.",
				error: true,
				data: { }
			};
		}

		//var final = JSON.stringify(response);

		//Right now we always send 200 OK code.
		return response;
}

// Generates: POST on /api/users and GET, DELETE /api/users/:id for
// Meteor.users collection
Api.addCollection(Meteor.users, {
	excludedEndpoints: ['getAll', 'put'],
	routeOptions: {
	  authRequired: true
	},
	endpoints: {
	  post: {
	    authRequired: false
	  },
	  delete: {
	    roleRequired: 'admin'
	  }
	}
});

function isOldPlugin(headers){
	if(!headers["x-app-id"])
		return true;

	return false;
}

function oldLogsRoot(req){
	const request = req.request;
	let response = req.response;

	//console.log(request);

	/*if(Object.keys(request.body).length === 0){
		request.body = request.query;
		request.body.data = JSON.parse(request.body.data);
	}*/

	//console.log(request.body);

	var data = getRequestData(request);

	request.body = data;
	request.query = data;

	//request.body.data = JSON.parse(request.)
	/*try{
		request.body.time = new Date( parseInt(request.body.time) ).getTime();
	}catch(e){

	}*/

	console.log(request.body);

	//Normalize heartbeat structure to be consumed (object structure is diferent from code, browser, operative_system)
	var heartbeat = cleanHeartbeat(request);

	//console.log(heartbeat);

	if(typeof(heartbeat) !== 'undefined' && typeof(heartbeat) === 'object' && typeof(heartbeat['token']) !== 'undefined'){
		
		//Get user based on received token
		//TODO: get user that is also set as active (not deleted or deactivated by organization admin)
		var user = Meteor.users.findOne({
			'profile.token':heartbeat.token
		});
		
		//Ensure we have a user
		if(typeof user !== 'undefined'){
			
			//Get or Update user tracking settings, then pass to queue accordingly
			var proceed = updateUserTracker(user, heartbeat);
			
			//Heartbeat may be unable to be processed because user turned off the "active" setting of a plugin 
			if(proceed){
				var data = {
					'receivedHeartbeat': heartbeat,
					'user': user,
				};
				
				//console.log('-- PING ['+ heartbeat.type +'] for ' + user.profile.firstName + ' on ' + moment.unix(heartbeat.data.time).format('HH:mm:ss'));
				
				//Add data to queue task processor
				addHeartbeatTask(data);
			}
		}
		//Handle if no user matches the token
		//TODO: see if a user is being impersonated? Check if user is inactive but still using plugin? For now send Admins an email
		else{

			console.log('** QUEUE ERR IN processHeartbeatTask: received heartbeat with no user associated to token')
			
			Email.send({
				to: 'lawbraun.almeida@gmail.com',
				from: 'webmaster@opz.io',
				subject: 'OPZ_API QUEUE ERROR: in processHeartbeatTask',
				html: 'When: '+moment().format('DD @ HH:mm')+'<br><h2>ERR IN processHeartbeatTask: received heartbeat with no user associated to token</h2>'
			});
		}
	}
	//Right now we always send 200 OK code. It should be able to handle cases where there was an error in method, but since it's async we can't return it
	return "OK";
}

function getRequestData(request){
	if(isEmpty(request.query)){
		if(isEmpty(request.body)){
			throw new Meteor.Error(400, 'Incorrect input parameters');
		}else{
			return request.body;
		}
	}else{
		return request.query;
	}
}

function isEmpty(obj) {
	for(var key in obj) {
	    if(obj.hasOwnProperty(key))
	        return false;
	}
	return true;
}

function authenticate(user, password, appId, app){
	if(!user || !password || !appId || !app)
    	throw new Meteor.Error(400, 'Invalid input parameters');

	/*# Validate the login input types
	check user, userValidator
	check password, passwordValidator*/

	// Retrieve the user from the database
	var authenticatingUser = Meteor.users.findOne({'emails.address': user});

	//console.log(authenticatingUser);

	if(!authenticatingUser)
		throw new Meteor.Error(400, 'Account does not exist');
	/*if(!authenticatingUser.services?.password)
		throw new Meteor.Error 401, 'Unauthorized'*/

	//Authenticate the user's password
	var passwordVerification = Accounts._checkPassword(authenticatingUser, password)
	if(passwordVerification.error)
		throw new Meteor.Error(400, 'Incorrect password');

  	//Add a new auth token to the user's account
	var authToken = Accounts._generateStampedLoginToken();

	var authData = {
		token: authToken.token,
		app_id: appId,
		when: authToken.when
	}
	//var hashedToken = Accounts._hashLoginToken(authToken.token);
	//Accounts._insertHashedLoginToken(authenticatingUser._id, {hashedToken});

	Meteor.users.update({
  		_id: authenticatingUser._id
  	},
	{
		$push: {
			'services.resume.loginTokens': authData
		}
	});


	//###################################################
	//App cloud auth data
	//###################################################
	appCloud.authApp(authenticatingUser, appId, authToken.token, authToken.when, app);

	//console.log("Authenticated.");

	return {auth_token: authToken.token, user_id: authenticatingUser._id}
}

function validateHeaders(headers){
	//console.log(headers);
	//authentication headers exist
	if (typeof headers['x-auth-token'] === 'undefined' || typeof headers['x-user-id'] === 'undefined' || typeof headers['x-app-id'] === 'undefined')
		throw new Meteor.Error(400, 'Unauthorized');
}

function authRequired(headers){
	validateHeaders(headers);

	var userId = headers['x-user-id'];
	var authToken = headers['x-auth-token'];
	var appId= headers['x-app-id'];

	var user = Meteor.users.findOne({
		_id: userId,
		'services.resume.loginTokens.token': authToken,
		'services.resume.loginTokens.app_id': appId,
	});

	//refuse if user not returned -> wrong data supplied
	if(!user)
		throw new Meteor.Error(400, 'Unauthorized');

	//return user object
	return user;
}

//respose functions
function resData(data){
	if(!data)
		return {statusCode: 200, status: "success", data: "OK"};

	return {
    	statusCode: 200,
    	status: "success",
		data: data
    };
}

function resError(e){
	return {
    	statusCode: e.error,
    	status: "failed",
		reason: e.reason, 
		message: e.message
    };
}

function encode(data){
    if(typeof data === "object")
        data = JSON.stringify(data);

    data = Base64.encode(data);

    return data;
  }

  function decode(data){
      if(data){
        data = Base64.decode(data);

        try{
          data = JSON.parse(data);
        }catch(e){ /*ignore*/ }
      }

      return data;
  }

function guid() {
    // RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
    // pseudo-random numbers.
    // The algorithm is as follows:
    //     Set the two most significant bits (bits 6 and 7) of the
    //        clock_seq_hi_and_reserved to zero and one, respectively.
    //     Set the four most significant bits (bits 12 through 15) of the
    //        time_hi_and_version field to the 4-bit version number from
    //        Section 4.1.3. Version4 
    //     Set all the other bits to randomly (or pseudo-randomly) chosen
    //     values.
    // UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
    // time-low               = 4hexOctet
    // time-mid               = 2hexOctet
    // time-high-and-version  = 2hexOctet
    // clock-seq-and-reserved = hexOctet: 
    // clock-seq-low          = hexOctet
    // node                   = 6hexOctet
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
    // y values are 8, 9, A, B
    var guidHolder = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    var hex = '0123456789abcdef';
    var r = 0;
    var guidResponse = "";
    for (var i = 0; i < 36; i++) {
        if (guidHolder[i] !== '-' && guidHolder[i] !== '4') {
            // each x and y needs to be random
            r = Math.random() * 16 | 0;
        }

        if (guidHolder[i] === 'x') {
            guidResponse += hex[r];
        } else if (guidHolder[i] === 'y') {
            // clock-seq-and-reserved first hex is filtered and remaining hex values are random
            r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
            r |= 0x8; // set pos 3 to 1 as 1???
            guidResponse += hex[r];
        } else {
            guidResponse += guidHolder[i];
        }
    }

    return guidResponse;
};