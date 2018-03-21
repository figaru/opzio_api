//this is the App Cloud plugin
//works in conjunction with api_cloud.js

var appObject = {
	app_id: "",
	app: "",
	parent_app_id: "",
	auth: {
		token: "",
		when: ""
	},
	child_app: [],
	data: {},
	settings: [],
	vid: 1
}

var appChildObject = {
	app_id: "",
	app: "",
	settings: [],
	vid: 1
}

export class AppCloud{
	constructor(){
		console.log("App Cloud Started");
	}
};


AppCloud.prototype.test = function(){
	//console.log("this is a test cloud");
}

//###################################################
//	Cloud authentication
//###################################################
/* Register app auth token -> create if needed */
AppCloud.prototype.authApp = function(params){
	if(!params.user || !params.pass || !params.app_id || !params.app)
		throw new Meteor.Error(400, 'Invalid input parameters');

	// Retrieve the user from the database
	var user = Meteor.users.findOne({'emails.address': params.user});

	if(!user)
		throw new Meteor.Error(400, 'Account does not exist');

	//Authenticate the user's password
	var passwordVerification = Accounts._checkPassword(user, params.pass)
	if(passwordVerification.error)
		throw new Meteor.Error(400, 'Incorrect password');

  	//Add a new auth token to the user's account
	var authToken = Accounts._generateStampedLoginToken();

	var auth_token = authToken.token;
	var	app_id = params.app_id;
	var	when = authToken.when;

	//console.log("Authenticating App -> Cloud");
	
	//check if user has cloud app data 
	var app = UserApps.findOne({user: user._id, app_id: app_id});

	if(!app){
		//user dosent exist -> create
		UserApps.insert({user: user._id, app: app, app_id: app_id, auth_token: auth_token, when: when, createdAt: new Date(),vid: 1}); 
	}else{
		//when looping check if an app auth data update
		//console.log("updated app auth data");
		UserApps.update({_id: app._id},
		{
			$set: {
				'app_id': app_id,
				'auth_token': auth_token,
				'when': when,
				"lastUpdate": new Date(),
			},
			$inc:{
		    	'vid': 1
		  	}
		});
	}

	return {auth_token: auth_token, user_id: user._id};

}


//###################################################
//	Cloud App Data -> SET / GET
//###################################################
/* Register app auth token -> create if needed */
AppCloud.prototype.getAppData = function(userid, appid){
	//console.log("Getting app data -> Cloud");
	//console.log(userid);
	//console.log(appid);

	//check if user has cloud app data 
	var user = UserApps.findOne({user: userid, app_id: appid});

	//console.log(user);
	//refuse if user not returned -> wrong data supplied
	if(!user)
		throw new Meteor.Error(400, 'Unauthorized');
	

	return user.data;
}
AppCloud.prototype.setAppData = function(userid, appid, data){
	//console.log("Setting App data -> Cloud");

	//console.log(data);

	//check if user has cloud app data 
	var userApp = UserApps.findOne({user: userid, app_id: appid});

	//console.log(data.programs);

	//refuse if user not returned -> wrong data supplied
	if(!userApp)
		throw new Meteor.Error(400, 'Unauthorized');

	//before update -> update vid
	data.vid = data.vid + 1;

	UserApps.update({_id: userApp._id, },
	{
		$set: {
			"data": data,
			"lastUpdate": new Date(),
		},
		$inc:{
	    	'vid': 1
	  	}
	});

	return "app data updated";
		
}


//###################################################
//	Cloud User Access Validation
//###################################################
/* validate app auth token -> return app settings */
AppCloud.prototype.validateAccess = function(headers){
	//console.log("Validate App Access -> Cloud");
	//authentication headers exist
	if (typeof headers['x-auth-token'] === 'undefined' || typeof headers['x-user-id'] === 'undefined' || typeof headers['x-app-id'] === 'undefined')
		throw new Meteor.Error(400, 'Unauthorized');

	var userId = headers['x-user-id'];
	var authToken = headers['x-auth-token'];
	var appId = headers['x-app-id'];

	var user = UserApps.findOne({user: userId, auth_token: authToken, app_id: appId});
	//refuse if user not returned -> wrong data supplied
	if(!user)
		throw new Meteor.Error(400, 'Unauthorized');

	/*//when looping check if an app auth data updated
	var isValid = false;

	//loop and update if app_id exists
	for(var i = 0; i < user.apps.length; i++){
		if(user.apps[i].app_id === appId && user.apps[i].auth.token === authToken){
			isValid = true;
		}
	}

	if(!isValid)
		throw new Meteor.Error(400, 'Unauthorized');*/

	//return user object
	return user;
	
}

AppCloud.prototype.validateHeaders = function(headers){
	if (typeof headers['x-auth-token'] === 'undefined' || typeof headers['x-user-id'] === 'undefined' || typeof headers['x-app-id'] === 'undefined')
		throw new Meteor.Error(400, 'Unauthorized');
}

AppCloud.prototype.getRequestData = function(request){
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