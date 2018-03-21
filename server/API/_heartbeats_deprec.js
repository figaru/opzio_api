//API endpoint for heartbeats
/*
Router.route(
	'/v1/logs', 
	function () {
		const request = this.request;
		let response = this.response;

		//console.log('!! NEW PING !!')
		//console.log(request)
		// console.log(request.body)
		
		var heartbeat = cleanHeartbeat(request);

		if(typeof(heartbeat) !== 'undefined' && typeof(heartbeat) === 'object' && typeof(heartbeat['token']) !== 'undefined'){
			
			var user = Meteor.users.findOne({'profile.token':heartbeat.token});
			if(typeof user !== 'undefined'){
				//console.log('PING for '+ user.profile.firstName + ' '+ user.profile.lastName +'!')
				
				//Get or Update user tracking settings, then pass to queue accordingly
				var proceed = updateUserTracker(user, heartbeat);
				if(proceed){
					var data = {
						'receivedHeartbeat': heartbeat,
						'user': user,
					};
					addHeartbeatTask(data);
				}
			}

			
		}
		
		// else{
		// 	console.log('IGNORED @'+moment().format('HH:mm:ss'));
		// 	console.log(heartbeat)
		// }
		
		response.end('OK'); //Right now we always send 200 OK code. It should be able to handle cases where there was an error in method
	}, 
	{ where: 'server' }
);
*/