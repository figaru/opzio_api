triggerPublications = function(){
	Meteor.publish('users', function(){
		if(typeof this.connection.id !== 'undefined'){
			Meteor.setTimeout(function(){
				if(__meteor_runtime_config__.REMOTE_CONNECTION === false){
					console('*WAR: stop users publication');
					this.stop();
				}
			},1000)
		}
		return Meteor.users.find();
	});	

	Meteor.publish('queueMetrics', function(){
		return QueueMetrics.find();
	});
};