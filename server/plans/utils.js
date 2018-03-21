hasCompletedMainIntro = function(userId){
	if(typeof userId !== 'undefined'){
		var user = Meteor.users.findOne({_id: userId });

		if(user.mainIntro.installPlugins && user.mainIntro.createProjects){
			
			var orgProfile = OrganizationProfile.findOne({ organization: user.profile.organization });
			
			if(typeof orgProfile !== 'undefined'){
				if(orgProfile.plan.type === 'single'){
					//If is single user, we don't care about inviting other users, therefore set completed as true
					Meteor.users.update({
						_id: userId
					},
					{
						$set:{
							'mainIntro.show': false,
							'mainIntro.completed': true
						}
					});
				}
				else{
					//Check if user invited any team member
					if(user.mainIntro.inviteTeam){
						Meteor.users.update({
							_id: userId
						},
						{
							$set:{
								'mainIntro.show': false,
								'mainIntro.completed': true
							}
						});
					}
				}
			}
		}
	}
};