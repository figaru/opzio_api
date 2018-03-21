Meteor.methods({
	'user.initUserQueues': function(userId){
		check(userId, String);

		//Heartbeat queue
		createNewHeartbeatQueue(userId);

		createNewClassifierQueue(userId);

		createNewTrainingQueue(userId);
	}
});