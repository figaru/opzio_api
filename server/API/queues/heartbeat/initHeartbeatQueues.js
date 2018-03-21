//Creates a heartbeat processing queue for every user in the system
initHeartbeatQueues = function(){
	var queuesList = [];
	var users = Meteor.users.find({active:true}).fetch();
	var queueId = 0;
	
	_.each(users, function(user, key){
		var heartbeatQueue = new PowerQueue({
			maxProcessing: 1,
			autostart: true,
			debug: false,
			name: user._id,
			reactive: true
		});
		
		heartbeatQueue.taskHandler = processHeartbeatTask;

		heartbeatQueue.errorHandler = function(data, task){
			console.log('QUE ERR: Heartbeat handling error..')
			console.log(data);
			console.log(task);
		};

		queueId++;
		queuesList.push(heartbeatQueue);
	});

	console.log('* QUE: Created ' + queueId + ' heartbeat queues');

	return queuesList;
};

//Add the heartbeat to the respective user's queue
addHeartbeatTask = function(data){
	if(typeof data.user._id !== 'undefined'){
		var heartbeatQueue = _.find(heartbeatQueues, function(queue) { 
			return queue.title == data.user._id
		});
		
		if(typeof heartbeatQueue !== 'undefined'){
			data['queue'] = heartbeatQueue;

			try{
				/*
				if(data.user._id === 'ov7wgeBLkbvwfXgA3'){
					console.log('-- ADD TASK for [' + data.user.profile.firstName +'] Q:'+ heartbeatQueue.length() + '/' + heartbeatQueue.total() +', ' + heartbeatQueue.progress() + '%');
				}
				*/
				heartbeatQueue.add(data);
			}
			catch(err){
				console.log('**QUE ERR: Unable to process heartbeatTask for user ' + data.user.profile.firstName + ' - ' + data.user._id);
				console.log(err);

				Email.send({
					to: 'lawbraun.almeida@gmail.com',
					from: 'webmaster@opz.io',
					subject: 'OPZ_API QUEUE ERROR: Unable to process heartbeatTask',
					html: 'When: '+moment().format('DD @ HH:mm')+'<br><h2>'+ err +'</h2>'
				});
			}
		}
		else{
			console.log('**QUE ERR: Queue heartbeatQueue not found for user '+ data.user._id);
		}
	}
	else{
		console.log('**QUE ERR: Error, you must pass a user ID to create a queue.');
	}
}