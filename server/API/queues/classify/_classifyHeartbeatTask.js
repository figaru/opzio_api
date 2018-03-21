/*
	-- classifyHeartbeatTask --

	The classifying queue task function, called upon userLog document insert hook, called in server/collections.js
	
	It is responsible for several actions, namely:
		- classifying the userLog
		- update the userLog document accordingly

	
	
	Receives an object data containing:
		userId (string) - user id who's this classification is for;
		userLog (object) - the document to be classified;
		queue (object) - the queue processing the classification task;

*/
classifyHeartbeatTask = function(data, next){
	//console.log('INSIDE classifyHeartbeatTask!')

	//By default, set private. Change downstream accordingly
	var isPrivate = true;
	var isValid = false;

	// Instantiate a new classifier
	// located under /server/AI/bayes
	var classifier = new Classifier([data.userLog]);

	// Call classify function which the classification algorithm lives
	var classifierResults = classifier.classify();

	//console.log('------------- finished classification -------------\n')

	//console.log(classifierResults.domainRule)

	
	/*
		IF we get a domain rule, we must update this userLog accordingly
		to what is set in this rule.
	*/
	if(classifierResults.domainRule !== false && typeof classifierResults.domainRule !== 'undefined'){
		//console.log('we got a domain rule. use it to set stuff')
		//console.log(classifierResults.domainRule)
		var category = classifierResults.domainRule.category;
		
		//Change privacy
		if(classifierResults.domainRule.classifyRules.setPrivacy){
			//console.log('use rule privacy')
			isPrivate = classifierResults.domainRule.private;
		}

		//Change validation
		if(classifierResults.domainRule.classifyRules.setValidated){
			//console.log('use rule validation')
			isValid = classifierResults.domainRule.validated;
		}

	}
	else{
		
		var category = classifierResults.defaultCategory;
		
		//Get the default category
		isPrivate = classifierResults.defaultCategory.private;

		//isValid will by default is false
	}

	//console.log('SET PRIVACY AS ' + isPrivate)
	//console.log('SET VALIDATION AS ' + isValid)
	//console.log('SET CATEGORY AS ' + category.label)

	//console.log('--------------------------------\n\n')

	//console.log('QTask: Got classifierResults for ' + data.userLog.user)
	//console.log('QTask: ' + data.userLog.user +' matchedProjects: ' + classifierResults.matchedProjects.length)

	//Update the document in case we have at least one project
	if(classifierResults.matchedProjects.length > 0){


		//As matchedProjects is an array ordered from most likely to least likely,
		//we set item 0 as being the chosen match, and the remaining are saved in
		//matchedProjects for record/future use purposes
		var selectedProject = classifierResults.matchedProjects[0];
		var remainingProjects = classifierResults.matchedProjects.splice(1, classifierResults.matchedProjects.length)


		//console.log('setting the project')
		//console.log(selectedProject)

		// Note that this document already exists, it just hasn't been classified up until now
		UserLogs.update({
			_id: data.userLog._id
		},{
			$set:{
				project: selectedProject,
				classified: true,
				private: isPrivate,
				validated: isValid,
				category: category,
				matchedProjects: remainingProjects
			}
		});
	}
	// In case the classifier doesn't return any match array, 
	// set the project as being the user's "personal" project
	// and set category as "other"
	else{
		var projectObj = Projects.findOne({
			owner:{
				$in: [ data.userLog.user ]
			},
			type: 'personal',
		});

		var domainCateory = DomainCategories.findOne({
			category: 'other'
		});

		UserLogs.update({
			_id: data.userLog._id
		},{
			$set:{
				project: {
					_id: projectObj._id,
					name: projectObj.name,
					match_type: 'classifier_empty',
					score: 0.5
				},
				classified: true,
				private: isPrivate,
				validated: isValid,
				category: domainCateory,
				matchedProjects: []
			}
		});
	}
	next();
}