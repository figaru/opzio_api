Meteor.methods({
	'trainProjectsRemoteCall': function(userLog){
		this.unblock();
		//console.log('RECEIVED REMOTE CALL TO TRAIN!');

		//console.log(userLog);

		var userId = userLog.user;

		var trainingQueue = _.find(trainingQueues, function(queue) { return queue.title == userId });

		if(typeof trainingQueue !== 'undefined'){
			var data = {
				'user': userId,
				'userLog': userLog,
			};

			data['queue'] = trainingQueue;
			
			//console.log('add task to training queue')

			trainingQueue.add(data);
		}
		else{
			console.log('*QUE ERR: Training queue not found for user '+ userId);
		}
	},
});