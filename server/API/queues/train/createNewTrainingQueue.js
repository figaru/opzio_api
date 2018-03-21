createNewTrainingQueue = function(userId){
	if(typeof userId === 'string'){
		console.log('QUE NEW: create trainingQueue for ' + userId);
		var trainingQueue = new PowerQueue({
			maxProcessing: 1,
			autostart: true,
			debug: false,
			name: userId,
			reactive: true
		});

		trainingQueue.taskHandler = trainUserLogTask;

		trainingQueues.push(trainingQueue);
	}
}