createNewHeartbeatQueue = function(userId){
	if(typeof userId === 'string'){
		console.log('QUE NEW: create heartbeatsQueue for ' + userId);
		
		var heartbeatQueue = new PowerQueue({
			maxProcessing: 1,
			autostart: true,
			debug: false,
			name: userId,
			reactive: true
		});

		heartbeatQueue.taskHandler = processHeartbeatTask;

		heartbeatQueues.push(heartbeatQueue);
	}
}