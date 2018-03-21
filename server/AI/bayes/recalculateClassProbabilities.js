recalculateClassProbabilities = function(userId, excludeLabel, totalDocumentsCount){
	//console.log('trained label: '+excludeLabel + ', total docs: ' + totalDocumentsCount);
	var projectWordStats = ProjectWordsStats.find({
		user: userId,
		project:{
			$ne: excludeLabel
		}
	}).fetch();

	if(projectWordStats.length > 0){
		for(var i=0; i<projectWordStats.length; i++){

			var statObj = projectWordStats[i];

			var prevClassProb = statObj['classProbability'];

			var classProbability = statObj['wordStats']['documents'] / totalDocumentsCount;

			//console.log('change from '+ prevClassProb +' to '+ classProbability +' for ' + getProjectFromID(statObj['project']));

			//Update probability on word stat
			
			ProjectWordsStats.update({
				_id: projectWordStats[i]._id,
			},
			{
				$set:{
					classProbability: classProbability
				}
			});

			//Set probability of project for specific user (only trained projects)
			Projects.update({
				_id: statObj['project'],
				trained: true,
				'classProbability.user': userId
			},
			{
				$set:{
					'classProbability.$.probability': classProbability,
				}
			});
		}
	}
	//console.log('----- Finished recalculating probs -----')
};