Meteor.methods({
	'getUserData': function(userId){
		var user = Meteor.users.findOne({
			_id: userId
		});
		
		return user;
	}
});