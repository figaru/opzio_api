trainUserLogTask = function(data, next){
	//console.log('in trainUserLogTask');

	var queue = data.queue;
	
	var classifier = new Classifier(data.userLog);
	
	classifier.train();
	
	/*
	var trainedLog = UserLogs.findOne({
		_id: data.userLog._id
	});
	*/
	next();
};