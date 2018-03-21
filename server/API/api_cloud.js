//api cloud endpoint
//AppCloud.js required

import { AppCloud } from './AppCloud.js';

//variable used for UserJobsScheduler
var appCloud = new AppCloud();


Api.addRoute("app/", {
	get:{
		action: function(){
			//console.log(this.request);

			return "ok";
		}
	}
});


Api.addRoute("app/log", {
	post:{
		action: function(){
			this.response = resData("OK");

			try{
				appCloud.validateAccess(this.request.headers);

				//Normalize heartbeat structure to be consumed (object structure is diferent from code, browser, operative_system)
				//type exception if data not in Body -> this.request.body
				var heartbeat = cleanHeartbeat(this.request);

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

							//Add data to queue task processor
							addHeartbeatTask(data);

						}
					}
					//Handle if no user matches the token
					//TODO: see if a user is being impersonated? Check if user is inactive but still using plugin? For now send Admins an email
					else{

						/*console.log('** QUEUE ERR IN processHeartbeatTask: received heartbeat with no user associated to token')
						
						Email.send({
							to: 'lawbraun.almeida@gmail.com',
							from: 'webmaster@opz.io',
							subject: 'OPZ_API QUEUE ERROR: in processHeartbeatTask',
							html: 'When: '+moment().format('DD @ HH:mm')+'<br><h2>ERR IN processHeartbeatTask: received heartbeat with no user associated to token</h2>'
						});*/
					}
				}
			}catch(e){
				//console.log(e);
				this.response = resError(e);
			}

			return this.response;
		}
	}
});


Api.addRoute("app/auth/valid", {
	get:{
		action:function(){
			this.response = false;

			try{
				appCloud.validateAccess(this.request.headers);
				this.response = true;
			}catch(e){
				this.response = false;
			}

			return this.response;
		}
	}
});



Api.addRoute("app/user", {
	get:{
		action:function(){
			//var response;
			try{

				if(appCloud.validateAccess(this.request.headers)){
					//make sure headers exist and are valid
					var user = Meteor.users.findOne({_id: this.request.headers['x-user-id']});

					//log sync request
					//console.log('SYNC: Synchronizing plugin settings for ' + user.profile.firstName + ' ' + user.profile.lastName +' @'+moment().format('HH:mm:ss'));
					
					//get user organisation
					var organization = Organizations.findOne({_id: user.profile.organization }).name;

					var d = new Date();
					d.setHours(0,0,0,0);

					var d2 = new Date();
					d2.setHours(24,0,0,0);

					var res = UserLogs.aggregate([
						{
							$match:{
								user: user._id,
								createDate:{
									$gte: new Date(d),
									$lt: new Date(d2),
								},
								//Only get logs with +1 second of time.
								totalTime:{
									$gt: 5
								},
							}
						},
                        {
                                $group:{
                                        _id: "total",
                                        total: {$sum: '$totalTime'}
                                }
                        },
					]);

					var resTotal = UserLogs.aggregate([
						{
							$match:{
								user: user._id,
								//Only get logs with +1 second of time.
								totalTime:{
									$gt: 5
								},
							}
						},
                        {
                            $group:{
                                    _id: "total",
                                    total: {$sum: '$totalTime'}
                            }
                        },
					]);


					var tToday = 0;
					var tTime = 0;

					if(typeof res[0] == "undefined"){
						tToday = 0;
					}else{
						tToday = res[0].total;
					}

					if(typeof resTotal[0] == "undefined"){
						tTime = 0;
					}else{
						tTime = resTotal[0].total;
					}


					let data = {
						name: user.profile.firstName + ' ' + user.profile.lastName,
						company: organization,
						token: user.profile.token,
						workableWeekDays: user.workableWeekDays,
						workableHours: user.workableHours,
						trackers: user.trackers,
						totalTime: tTime,
						totalToday: tToday
					}

					this.response = resData(data);
				}

			}catch(e){
				//console.log(e);
				this.response = resError(e);
			}

			return this.response;
		}
	}
});

Api.addRoute("app/auth", {
	post:{
		action:function(){
			var params = getRequestData(this.request);

			//console.log(params);
			try{
				//###################################################
				//App cloud auth data
				//###################################################
				var data = appCloud.authApp(params);

				//console.log("Authenticated.");

			
				this.response = resData(data);
			}catch(e){
				this.response = resError(e);
			}

			return this.response;
		}
	}
});

Api.addRoute("app/data", {
	get:{
		action: function(){
			try{

				if(appCloud.validateAccess(this.request.headers)){
				 	this.response = resData(appCloud.getAppData(this.request.headers['x-user-id'], 
						this.request.headers['x-app-id']));
				}

			}catch(e){
				//console.log(e);
				this.response = resError(e);
			}

			return this.response;
		}
	},
	post: {
		action: function(){
			try{

				if(appCloud.validateAccess(this.request.headers)){
					var params = appCloud.getRequestData(this.request);
					
					this.response = appCloud.setAppData(this.request.headers['x-user-id'], 
						this.request.headers['x-app-id'], params);
				}

			}catch(e){
				//console.log(e);
				this.response = resError(e);
			}

			return this.response;
		}
	}
});

Api.addRoute("app/data/check", {
	get:{
		action: function(){
			//console.log("PINGING FOR CHANGES");

			this.response = false;

			if (typeof this.request.headers['x-user-id'] === 'undefined', 
				this.request.headers['x-v-id'] === 'undefined',
				this.request.headers['x-app-id'] === 'undefined'){

				//throw new Meteor.Error(400, 'Incorrect parameters');

				return this.response;
			}
				
			//console.log("version check..");
			//console.log(this.request.headers['x-user-id']);
			//console.log(this.request.headers['x-v-id'] );
			//console.log(this.request.headers['x-app-id']);

			var exists = UserAppsChange.findOne({user_id: this.request.headers['x-user-id'], app_id: this.request.headers['x-app-id']});

			//console.log(exists);

			if(!exists)
				return this.response;

			//console.log(exists);

			if(exists.vid > parseInt(this.request.headers['x-v-id'])){
				this.response = true;
			}

			return this.response;
		}
	},
});

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