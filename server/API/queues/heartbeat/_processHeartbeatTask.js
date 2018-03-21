/*
	-- processHeartbeatTask --

	Function exectued by userLogsQueue's taskHandler, called in _heartbeats_api.js
	
	It is responsible for several actions, namely:
		- make sure we have two heartbeats to calculate diference
		- make sure the heartbeats are valid between themselves (specially to handle network latency inreceiving the heartbeats)
		- calculate time diference
		- insert/update (by upserting) the heartbeat's data

	NOTE: we don't call the classifying queue task here. It is done through a database insert hook, found in /server/collections.js
	
	Receives an object data containing:
		receivedHeartbeat (object) - normalized data from the incoming heartbeat;
		userToken (string) - isolated user token;
		user (object) - user record from the database;
		queue (object - the queue processing this task (used simply to update system metrics);

*/
processHeartbeatTask = function(data, next){
	var receivedHeartbeat = data.receivedHeartbeat,
		userToken = receivedHeartbeat.token,
		user = data.user,
		queue = data.queue;


	//Get the currently saved heartbeat (it is the "old" heartbeat regarding the one we just received)
	var oldHeartbeat = Heartbeats.findOne({ 'owner': userToken },{ sort:{ createdAt: -1 } });		

	//################################################
	//
	//	HEARTBEAT PROCESSING FLOW STARTS HERE
	//
	//################################################

	// We can only calculate time diference once we have two heartbeats. 
	// If we don't have any (i.e. first time we get one) then we insert it an skip the processing.
	if(typeof(oldHeartbeat) !== 'undefined'){
		
		//****
		// #1 - Validate heartbeats
		// If received and previous heartbeats are valid then  we can proceed to process them.
		if(validHeartbeats(oldHeartbeat, receivedHeartbeat)){
			//console.log('-- START PROCESSING ['+ oldHeartbeat.type +'] @'+moment().format('HH:mm:ss') + ' for [' + user.profile.firstName + '] received on ' + moment(oldHeartbeat.createDate).format('HH:mm:ss') + ' Q:' + queue.length() + '/' + queue.total() +', ' + queue.progress());
			
			//****
			// #2 - Replace the old heartbeat with the received one.
			// At any given point there should only be one existing heartbeat document for each user in the system.
			Heartbeats.upsert({ 'owner': userToken },{
				$set:{
					'createDate': new Date(),
					'type': receivedHeartbeat.type,
					'data': receivedHeartbeat.data,
				}
			});


			//****
			// #3 - Calculate time difference between heartbeats
			
			// 	WARNING:
			//	For now we are not doing anything regarding the rate at which heartbeats are received.
			//	Ex it shouldn't be possible to receive 6 or 10 heartbeats per second for a single user (something is wrong)
			//	So we should be able to handle that accordingly, which we aren't for now (it will jam the queues of that user, and possibly of all users)

			//  TODO:
			// 	Find a way to implement a security threshold for abnormal receiving rate of heartbeats (like a D.O.S.), ex: 
			//		- Ignore diferences under x milliseconds? -> possible spam/DOS requests? 
			//	 	- determine the normal pattern for a human, figure out when it may be a bot or so?
			var dif = getTimeDifference(receivedHeartbeat, oldHeartbeat);

			//****
			// #4 - Build a current hour ISO string for current hour.
			// we use as a shorthand for match queries when aggregating userLogs.
			var currentHour = moment().utc().startOf('hour').toISOString();


			//****
			// #5 - Build match pipeline for upsert query.
			// We try to find an exact userLog match based on this query.
			// If we find, upsert will update the time of the log, if not it will create
			// a new one based on the updatePipeline build in step #6
			var matchQuery = {
				'user': user._id,
				'organization': user.profile.organization,
				'logHour': {
					$gte: new Date(currentHour)
				},
				'uri': oldHeartbeat.data.uri,
				'domain': oldHeartbeat.data.domain,
				'pageTitle': oldHeartbeat.data.pageTitle,
			}

			//****
			// #6 - Prepare the update pipeline for the hourLog
			// Depending on the heartbeat type we need to tweak a bit the update
			// object we pass to our upsert DB call and handle code heartbeats diferently (see below).
			switch(oldHeartbeat.type){
				//Process browser, operative_system or "others" (default).
				//The calssification for these is left to the classifying queue.
				default:
				case 'browser':
				case 'operative_system':
					var updatePipeline = {
						'$set':{
							'updateDate': new Date()
						},
						'$setOnInsert':{
							'createDate': new Date(),
							'logHour': new Date(currentHour),
							'project': '',
							'matchedProjects': [],
							'private': true,
							'validated': false,
							'usedForTraining': false,
							'classified': false,
							'type': oldHeartbeat.type,
							'relatedLog': '',
							'totalTime': 0,
							'idleTime': 0
							//'viewable': true
						}
					}
					break;
					//End browser/OS switch case

				//Process code heartbeats.
				// Code heartbeats have the particularity that we can produce a project match right in this queue
				// instead of moving to the classifying queue because we (should) have a git name to perform a direct match.
				// If so, we must then manipulate the update pipeline accordingly.
				case 'code':
					console.log('treat code heartbeat')
					//By default we assume this userLog is to be private and non-validated.
					//We later change it down stream is necessary.
					var private = true;
					var validated = false;

					//Make sure the heartbeat is giving us a project to match against
					if(typeof oldHeartbeat.data.project !== 'undefined'){
						
						//Get a project from the DB
						var projectFromDB = Projects.findOne({ 'gitName': oldHeartbeat.data.project });


						if(typeof projectFromDB !== 'undefined'){
							
							//We must handle the case where there is a null
							//If gitName is null, we set the project as the user's "Unknown" project
							//Otherwise use gitname and set validated as true
							
							if(projectFromDB.gitName !== null){
								validated = true
								var project = {
									'_id': projectFromDB._id,
									'name': projectFromDB.name,
									'matchType': 'exact_gitname', //Set match type
									'score': 1 //Set perfect score of 1
								};
							}
							//If no match, associate to user's "personal" project
							else{
								projectFromDB = Projects.findOne({ 'owner': { $in: [user._id] }, type: 'personal' });
								var project = {
									'_id': projectFromDB._id,
									'name': projectFromDB.name,
									'matchType': 'no_gitname', //Set match type
									'score': 1 //Set perfect score of 1
								};
							}

							//Update project global(public) update date
							Projects.update({
								'_id': projectFromDB._id,
							},{ $set:{ 'updateDate': new Date() } });

							//Update user specific update date (this info is used for classification purposes [for browsing/OS heartbeats])
							LastTouchedProject.upsert({
								user: user._id,
								project: projectFromDB._id
							},{ $set:{ 'updateDate': new Date() } });

							//Change visibility permission accordingly
							if(projectFromDB.visibility >= 0){
								private = false;
							}
						}
						//In case the plugin is sending us data for the project name 
						//but the project hasn't been created in the system, keep record of heartbeatName
						//but associate to Personal project
						else{
							//console.log('no project found for ' + oldHeartbeat.data.project)
							
							projectFromDB = Projects.findOne({ 'owner': { $in: [user._id] }, type: 'personal' });

							var project = {
								'_id': projectFromDB._id,
								'name': projectFromDB.name,
								'heartbeatName': oldHeartbeat.data.project,
								'matchType': 'no_system_project', //Set match type
								'score': 0.1 //Set a default score of 0.1 as we don't know the project
							};
						}
					}
					//For some reason heartbeat has no project name
					//assign to Personal
					else{
						projectFromDB = Projects.findOne({ 'owner': { $in: [user._id] }, type: 'personal' });

						var project = {
							'_id': projectFromDB._id,
							'name': projectFromDB.name,
							'matchType': 'no_gitname', //Set match type
							'score': 0.1 //Set a default score of 0.1 as we don't know the project
						};
					}

					if(project['matchType'] === 'exact_gitname' && project._id !== '' && typeof project._id !== 'undefined'){
						var classified = true;
					}
					else{
						var classified = false;	
					}

					var updatePipeline = {
						'$set':{
							'updateDate': new Date()
						},
						'$setOnInsert':{
							'createDate': new Date(),
							'logHour': new Date(currentHour),
							'project': project,
							'matchedProjects': [],
							'private': private,
							'validated': validated,
							'classified': classified,
							'usedForTraining': false,
							'type': oldHeartbeat.type,
							'relatedLog': '',
							'totalTime': 0,
							'idleTime': 0
							//'viewable': true
						}
					}
					break;
					//End code switch case
					
			}
			
			//****
			// #7 - Add to the updatePipeline the time diference
			// Depending if the time dif is under or above what is considered work/idle time
			// we update either totalTime (work time) or idleTime.
			//-- For now idle time is all above 2mins & 30sec (150 seconds)

			// TODO:
			//	- alow user to set what's his own personal idle time

			if(dif <= 150){
				updatePipeline['$inc'] = { 'totalTime': dif };
			}
			else{
				updatePipeline['$inc'] = { 'idleTime': dif };
			}

			
			//****
			// #8 - Actual upsert/insert of the user log
			//	NOTE: This is the end of the heartbeat processing. 
			// Again, we don't call the classifying queue task here. 
			// It is done through a database insert hook, found in /server/collections.js
			UserLogs.upsert(
				matchQuery,
				updatePipeline
			);
			
			//****
			// #9 - Update user request metrics
			/*
			Meteor.users.update({ _id: user._id, },{
				$inc:{ 'requests': 1, },
				$set:{ 'updateDate': new Date(moment().utc().toISOString()) }
			});
			*/

			//****
			// #10 - Update heartbeats queue processing system metrics (for admin)
			var queueData = {
				length: queue.length(),
				total: queue.total(),
				progress: queue.progress()
			}

			Meteor.call('updateQueueStatus', user._id, queueData);

			//################################################
			//
			//	SUCCESSFULY FINISHED PROCESSING HEARTBEAT
			//
			//################################################

			//console.log('-- FINISHED ['+ oldHeartbeat.type +'] for [' + user.profile.firstName + '] received on ' + moment(oldHeartbeat.createDate).format('HH:mm:ss') +' Q:' + queue.processing() +'/' + queue.length() + '/' + queue.total() +', ' + queue.progress() + '%' + ' E:'+queue.errors());
			
		}
		//In case the heartbeat is invalid, we upsert the received one 
		// to make sure there's no duplicate documents for some reason
		else{
			//console.log('INVALID HEARTBEATS FOR ' + data.user._id)
			Heartbeats.upsert({ 'owner': userToken },{
				$set:{
					'createDate': new Date(),
					'type': receivedHeartbeat.type,
					'data': receivedHeartbeat.data,
				}
			});
		}
	}
	//Insert the received heartbeat if none previous one is available.
	//We use upsert to make sure that if for some reason there would be another heartbeat
	//for this owner, we would override and avoid duplicating them in the collection.
	else{
		//console.log('OLD HEARTBEAT UNDEFINED FOR ' + user.profile.firstName);
		Heartbeats.upsert({
			'owner': userToken 
		},{
			$set:{
				'createDate': new Date(),
				'type': receivedHeartbeat.type,
				'data': receivedHeartbeat.data,
			}
		});
	}

	//Move to next task in queue
	next();
};