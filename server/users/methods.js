Meteor.methods({
	//Check whether user has any tracker (hasTrackers as true)
	'users.updateUserTracker': function(user, heartbeat){
		this.unblock();
		if(!user.profile.hasTracker){
			console.log('update trackers for ' + user._id)
			Meteor.users.update({
				_id: user._id
			},
			{
				$set:{
					'profile.hasTracker': true
				}
			});
		}
		else{
			var userObj = Meteor.users.findOne({
				_id: user._id,
				'trackers.tracker': heartbeat.type,
			});
			if(typeof userObj !== 'undefined'){
				Meteor.users.update({
					_id: user._id,
					'trackers.tracker': heartbeat.type,
				},
				{
					$set:{
						'trackers.$.updateDate': new Date(),
						'trackers.$.active': true
					}
				});
			}
			else{
				Meteor.users.update({
					_id: user._id,
				},
				{
					$push:{
						'trackers':{
							'tracker':	heartbeat.type,
							'updateDate': new Date(),
							'active': true
						}
					}
				});
			}
		}
	},
});