initQueueMetrics = function(){
	var users = Meteor.users.find({ active:true }).fetch();
	var i = 0;

	QueueMetrics.remove();
	
	for(i; i<users.length; i++){
		QueueMetrics.upsert({
			user: users[i]._id
		},{
			$set:{
				createDate: new Date(),
				updateDate: new Date(),
				length: 0,
				total: 0,
				progress: 0,
			}
		});
	}

	console.log('* QUE: created ' + i +' metric queues collections');
}