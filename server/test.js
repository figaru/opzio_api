Meteor.methods({
	'testQueue': function(userId){
		console.log('Invoque stuff to test');
	},
	'classifyMethod': function(data){
		//console.log('Inside classifyMethod')
		classifyHeartbeatTask(data);
	}
});