createNewClassifierQueue = function(userId){
	if(typeof userId === 'string'){
		console.log('QUE NEW: create classifyingQueue for ' + userId);
		var classifyingQueue = new PowerQueue({
			maxProcessing: 1,
			autostart: true,
			debug: false,
			name: userId,
			reactive: true
		});

		classifyingQueue.taskHandler = classifyHeartbeatTask;

		classifyingQueues.push(classifyingQueue);
	}
}