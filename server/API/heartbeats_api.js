//***************
// -- Main API Entry Endpoint --

// This is the entry API endpoint that receives all incoming heartbeat requests from all users.
// It is responsible for:
//	- doing a quick validation & cleaning of the incoming heartbeat;
//	- update user trackers info;
//	- dispatch the hearteat data to be consumed by its respective queue;

//***************
Router.route(
	'/v1/logs', 
	function () {
		const request = this.request;
		let response = this.response;

		//Normalize heartbeat structure to be consumed (object structure is diferent from code, browser, operative_system)
		var heartbeat = cleanHeartbeat(request);

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
		response.end('OK'); 
	}, 
	{ where: 'server' }
);