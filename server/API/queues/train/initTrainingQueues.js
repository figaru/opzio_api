//Creates a classifying queue for every user in the system to classify newly inserted heartbeats
initTrainingQueues = function(){
	var queuesList = [];
	var users = Meteor.users.find({active:true}).fetch();
	var queueId = 0;
	
	_.each(users, function(user, key){
		var trainingQueue = new PowerQueue({
			maxProcessing: 1,
			autostart: true,
			debug: false,
			name: user._id,
			reactive: true
		});
		
		trainingQueue.taskHandler = trainUserLogTask;

		queueId++;
		queuesList.push(trainingQueue);
	});

	console.log('* QUE: Created ' + queueId + ' training queues');

	return queuesList;
};