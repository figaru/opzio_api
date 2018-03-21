Meteor.methods({
	'trainBayesClassifier': function(){
		var query = {
			type:'browser',
			validated: true,
			usedForTraining: false,
			matchedProjects: { $not: {$size: 0} },
			domain:{ '$nin': ['New Tab', 'newtab', ''] },
			pageTitle:{ '$nin': ['New Tab', 'newtab', ''] }
		};

		var records = UserLogs.aggregate([
			{
				$match: query
			},
			{
				$project:{
					_id: '$_id',
					domain: '$domain',
					pageTitle: '$pageTitle',
					uri: '$uri',
					matchedProjects: '$matchedProjects',
					createDate: '$createDate'
				}
			},
			/*
				The following 2 pipelines (unwind & project) won't be necessary after we stop
				saving multiple matched projects in an array.
				Saving will be directly done on variable.
			*/
			{
			    $unwind: '$matchedProjects'
			},
			{
			    $project:{
			    	_id: '$_id',
			        domain: '$domain',
			        pageTitle: '$pageTitle',
			        uri: '$uri',
			        matchedProject: '$matchedProjects.project',
			        createDate: '$createDate'
			    }
			},
			/* 
				We're interested in grouping to process all matched labels
				(projects) to an array so we don't have to iterate the
				records to retrieve these
			*/
			{
				$group:{
					_id: null,
					logs:{
						$push:{
							_id: '$_id',
							domain: '$domain',
							pageTitle: '$pageTitle',
							uri: '$uri',
							matchedProject: '$matchedProject',
							createDate: '$createDate'
						}
					},
					labels:{
						$addToSet: '$matchedProject'
					}
				}
			},
			{
			    $unwind: '$logs'
			},
			{
			    $project:{
			        _id: '$logs._id',
			        domain: '$logs.domain',
			        pageTitle: '$logs.pageTitle',
			        uri: '$logs.uri',
			        matchedProject: '$logs.matchedProject',
			        createDate: '$logs.createDate',
			        labels: '$labels'
			    }
			},
			{
			    $sort:{
			        createDate: -1
			    }
			}
		]);

		// Finally, train classifier
		var classifier = new Classifier(records);

		var trainingSet = classifier.train();

		return 200;

	},
});