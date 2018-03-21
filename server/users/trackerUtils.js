updateUserTracker = function(user, heartbeat){

	var valid = true;
	
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

			var trackerSetting = userObj.trackers.filter(function( obj ) {
				return obj.tracker === heartbeat.type;
			});

			if(trackerSetting.length > 0){
				if(trackerSetting[0].active){
					Meteor.users.update({
						_id: user._id,
						'trackers.tracker': heartbeat.type,
					},
					{
						$set:{
							'trackers.$.updateDate': new Date(),
						}
					});
				}
				else{
					valid = false;
				}
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
							'createDate': new Date(),
							'active': true
						}
					}
				});
			}

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
						'createDate': new Date(),
						'active': true
					}
				}
			});
		}
	}

	return valid;
};
