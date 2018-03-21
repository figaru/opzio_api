//Service Metrics related methods
Meteor.methods({
	//Pushes information on the service 
	//to the respective document.
	'updateServiceStatus': function(status, lastDate){
		if(typeof lastDate === 'undefined'){
			var date = new Date();
		}
		else{
			var date = lastDate;
		}

		Meteor.defer(function(){
			var mDate = moment(date);
			var hour = parseInt(mDate.format('H'));
			var dayOfYear = parseInt(mDate.format('DDD'));
			var year = parseInt(mDate.format('YYYY'));
			
			ServiceMetrics.update({
				'hour': hour,
				'dayOfYear': dayOfYear,
				'year': year
			},
			{
				'$addToSet':{
					'service_status': {
						'status': status,
						'eventDate': date
					}
				}
			},
			{
				upsert: true
			});
		});
	},
	'updateQueueStatus': function(user, queueData){
		this.unblock();
		QueueMetrics.upsert({
			user: user
		},{
			'$setOnInsert':{
				createDate: new Date(),
			},
			'$set':{
				updateDate: new Date(),
				length: queueData.length,
				total: queueData.total,
				progress: queueData.progress
			}
		});
		//Meteor.defer(function(){
		//});
	},
	'resetQueueMetrics': function(){
		QueueMetrics.remove();
		initQueueMetrics();
	},
	'system.forceLogout': function(){
		clientWorker.call('forceUsersLogout');
	},
	'system.updateProjectOwner': function(oldUserId, newUserId){
		console.log('update project owner/team');

		var oldId = oldUserId;
		var newId = newUserId;

		var userProjects = Projects.find({
			owner:{
	            $in: [oldId]
	        }
		}).fetch();

		for(var i=0; userProjects.length > i; i++){
			//console.log('project: ' + userProjects[i]._id)
			var team = userProjects[i].team;
			//console.log(team)
			var newTeam = [];

			for(var j=0; j < team.length; j++){

				if(team[j].user === oldId){
					newTeam.push({
						user: newId,
						role: team[j].role,
					});
				}
				else{
					newTeam.push({
						user: team[j].user,
						role: team[j].role,
					});
				}

			}


			Projects.update({
				_id: userProjects[i]._id
			},
			{
				$set:{
					owner: [newId],
					team: newTeam
				}
			});
			console.log('updated project ' + userProjects[i]._id)
		}
	}
});