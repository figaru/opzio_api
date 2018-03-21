//Creates a classifying queue for every user in the system to classify newly inserted heartbeats
initClassifierQueues = function(){
	var queuesList = [];
	var users = Meteor.users.find({active:true}).fetch();
	var queueId = 0;
	
	_.each(users, function(user, key){
		var classifyingQueue = new PowerQueue({
			maxProcessing: 1,
			autostart: true,
			debug: false,
			name: user._id,
			reactive: true
		});
		
		classifyingQueue.taskHandler = classifyHeartbeatTask;

		queueId++;
		queuesList.push(classifyingQueue);
	});

	console.log('* QUE: Created ' + queueId + ' classifying queues');

	return queuesList;
};