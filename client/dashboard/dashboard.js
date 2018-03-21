Template.dashboard.events({
	'click #resetMetrics': function(){
		Meteor.call('resetQueueMetrics');
	},
	'click #logoutUsers': function(){
		Meteor.call('system.forceLogout');
	}
	
});