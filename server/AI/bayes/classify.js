/*
	-- Classify Function --

	Function called upon userLog document insert hook, called in server/collections.js
	
	It is responsible for several actions, namely:
		- classifying the userLog
	
	Receives an object data containing:
		userId (string) - user id who's this classification is for;
		userLog (array) - the document to be classified (object) within an array of length 1 (legacy: we could pass an array of several logs to be classified at once);
		queue (object) - the queue processing the classification task;

*/
Classifier.prototype.classify = function(){
	//console.log('\n_-_-__-_-__-_-__-_-__-_-_ CLASSIFYING _-_-__-_-__-_-__-_-__-_-_')

	let data = this.data;
	var proceedToClassification = true;

	//console.log(data);

	if(typeof data === 'undefined' || !isArray(data) || data.length === 0 || data === null){
		console.log('we want a non empty array!')
		return;
	};

	data = data[0];

	
	if( (data.domain === '' && data.pageTitle === '' && data.uri === '') || (data.domain === '' && data.pageTitle === '' && data.uri === '') ){
		//console.log('CLASS: Skip classification for data:')
		//console.log(data)
		return;
	}

	var userObj = Meteor.users.findOne({ _id: data.user });
	var organizationId = userObj.profile.organization;
	var domainRule = false;

	//By default set domainCategory as other
	var domainCategory = DomainCategories.findOne({category:'other'});

	//console.log('classify userLog for ' + data.domain + ' <-> ' + data.pageTitle)

	//******************
	//
	//	GET EXISTING CLASSIFICATION RULES
	//
	//	For browser & OS heartbeats type, check if there's an existing rule
	//	in the system. This can avoid going donw the actual classification algorithm if applicable.
	//
	//******************

	switch(data.type){
		case 'code':
			domainCategory = DomainCategories.findOne({category:'development'});
			break;

		case 'browser':
		case 'operative_system':
			
			/*****
				Try to get a specific rule for this log
			*****/
			domainRule = DomainRules.findOne({
				'user': userObj._id,
				'uri': data.uri,
				'pageTitle': data.pageTitle,
				'default': false
			});
			//If we have a specific rule for this log, use it
			if(typeof domainRule !== 'undefined'){
				//console.log('FOUND SPECIFIC userLog rule ');
				//console.log(domainRule._id);

				if(domainRule.classifyRules.setProject){
					
					proceedToClassification = false;

					var classMatching = [{
						"_id" : domainRule.project._id,
						"name" : domainRule.project.name,
						"matchType" : "rule",
						"score" : 1
					}];

				}

			}
			/*****
				If no specific rule is found, get or create a default one
				based on system
			*****/
			else{
				//console.log('NO SPECIFIC RULE exists. Get or create default rule.');
				//Try to get a system default domainRule

				//Try to get a default rule for this domain/app
				domainRule = DomainRules.findOne({
					'user': userObj._id,
					'domain': data.domain,
					'default': true
				});

				
				if(typeof domainRule !== 'undefined'){
					//console.log('FOUND DEFAULT DOMAIN RULE. Create from it.');
					//console.log(domainRule._id);

					//var newRuleData = _createDefaultUserDomainRule(userObj, data.domain, data.pageTitle, data.uri, domainCategory, false, defaultRule);

					//var newDomainRuleID = DomainRules.insert(newRuleData);
					//domainRule = DomainRules.findOne({ _id: newDomainRuleID });

					//console.log('created')
					//console.log(domainRule)

					if(domainRule.classifyRules.setProject){
						
						proceedToClassification = false;

						var classMatching = [{
							"_id" : domainRule.project._id,
							"name" : domainRule.project.name,
							"matchType" : "rule",
							"score" : 1
						}];
					}
				}
				else{
					//console.log('NO DEFAULT RULE! Create one from scratch!');
					
					var systemRule = DomainRules.findOne({
						user: 'root',
						domain: data.domain
					});

					//Get a default system rule (premade assumptions on the category of sources)
					//and create a rule for this source accordingly
					if(typeof systemRule !== 'undefined'){
						//console.log('DEFAULT SYSTEM RULE exists for ' + data.domain);

						domainCategory = DomainCategories.findOne({ _id: systemRule.category._id });

						//console.log('CREATE NEW DEFAULT RULE USING SYSTEM RULE & CATEGORY');

						var newRuleData = _createDefaultUserDomainRule(userObj, data.domain, data.pageTitle, data.uri, domainCategory, true, systemRule);

						//console.log(newRuleData);

						//console.log('>> Using category: ')
						//console.log(newRuleData.category)

						//console.log('>> Using project: ')
						//console.log(newRuleData.project)

						var newDomainRuleID = DomainRules.insert(newRuleData);
						domainRule = DomainRules.findOne({ _id: newDomainRuleID });

						if(newRuleData.classifyRules.setProject){
							
							proceedToClassification = false;

							var classMatching = [{
								"_id" : domainRule.project._id,
								"name" : domainRule.project.name,
								"matchType" : "rule",
								"score" : 1
							}];

						}

					}
					//If a default rule is found, use it accordingly
					else{
						//console.log('NO SYSTEM RULE FOUND for ' + data.domain +'\n   > Create one based on other category & classify project');

						if(data.type === 'browser'){
							//console.log('>> Using category: ')
							//console.log(domainCategory)
						}

						if(data.type === ' operative_system'){
							var applicationCategory = DomainCategories.findOne({
								applications:{
									//In this case "domain" holds the Application name in use (i.e. Word, slack, etc)
									$in: [data.domain.toLowerCase()]
								}
							});
							//Override default category if we have any
							if(typeof applicationCategory !== 'undefined'){
								domainCategory = {
									'_id': applicationCategory._id,
									'category': applicationCategory.category,
									'value': applicationCategory.value,
									'label': applicationCategory.label,
									'private': applicationCategory.private,
								}
							}
						}

						var newRuleData = _createDefaultUserDomainRule(userObj, data.domain, data.pageTitle, data.uri, domainCategory, true);

						var newDomainRuleID = DomainRules.insert(newRuleData);
						domainRule = DomainRules.findOne({ _id: newDomainRuleID });

						if(newRuleData.classifyRules.setProject){
							
							proceedToClassification = false;

							var classMatching = [{
								"_id" : domainRule.project._id,
								"name" : domainRule.project.name,
								"matchType" : "rule",
								"score" : 1
							}];

						}

					}	
				}
			}

			break;
	}
	
	if(proceedToClassification === false){
		//console.log('\n\n>>NO CLASSIFICATION PERFORMED!\n\n');

		return {
			'matchedProjects': classMatching,
			'defaultCategory': domainCategory,
			'domainRule': domainRule,
		};
	}

	//console.log('\n\n<<PROCEEDING>> TO CLASSIFICATION!\n\n');


	//******************
	//
	//	ACTUAL USER LOG CLASSIFICATION STARTS HERE
	//
	//	In case no existing domain rule is found for the data of this userLog
	//	proceed to the classification of the log.
	//
	//******************


	var	normalized_domain = data.domain.normal();
	normalized_domain = normalized_domain.cleanDomain();
	//console.log('DOMAIN: ' + normalized_domain)
	//Get known label
	var knownLabel = data.project;
	
	//Remove unwanted characters and normalize string from Page Title (pt)
	if(typeof data.pageTitle !== 'undefined' && data.pageTitle !== '' && data.pageTitle !== null){
		var pt = data.pageTitle.cleanString(),
			normalized_pt = pt.normal();
	}
	else{
		var normalized_pt = '';
	}
	//Remove unwanted characters and normalize string from URI
	if(typeof data.uri !== 'undefined' && data.uri !== '' && data.uri !== null){
		var uri = data.uri.cleanURI(),
			normalized_uri = uri.cleanString(),
			normalized_uri = normalized_uri.normal();
	}
	else{
		var normalized_uri = '';
	}

	//Join strings for later treatment
	var testWords = normalized_pt + ' ' + normalized_uri + ' ' + normalized_domain;
	//Remove stop words
	testWords = testWords.removeStopWords();
	//Split into array of individual words
	testWords = testWords.splitWords();
	
	var originalTestWords = testWords.slice();

	//console.log('testWords > ' + testWords.length)
	//console.log(testWords)
	//console.log('originalTestWords size > ' + originalTestWords.length)


	//Get all projects of a certain user and create classMatching array for every project

	var classMatching = [];
	var matchProjectIDs = []; //Store the ID of projects we want to get words from
	
	//If user is admin, can categorize to any project
	if(isAdmin(userObj._id)){
		var matchQuery = {
			'organization': organizationId,
			//TODO: MUST ALSO IGNORE ARCHIVED PROJECTS
			'useForCategorization': true,
			'$or': [
				{ 'owner': {'$in': [data.user] } },
				{ 'visibility': 2 },
				{ 'visibility': 1 },
				{ '$and': [
					{'visibility': 0 }, 
					{'team.user': data.user}
				]},
			],
			'name':{
		        $nin: ['Unknown', '', ' ']
		    }	
		}
	}
	//Otherwise only get projects where user is in team
	else{
		var matchQuery = {
			'organization': organizationId,
			//Also: ignore non classifiable projects & archived projects
		    'useForCategorization': true,
			'$or': [
			    { 'owner': {'$in': [data.user] } },
			    { 'visibility': 2 },
			    { '$and': [
			    	{'visibility': 1 },
			    	{ 'team.user': data.user }
			    ]},
			    { '$and': [
					{ 'visibility': 0 },
					{ 'team.user': data.user }
		    	]},
			],
		    'name':{
		        $nin: ['Unknown', '', ' ']
		    }
		}
	}


	//All projects that we'll want to classify against
	var userProjects = Projects.find(
		matchQuery,
		{
			sort:{
				updateDate: -1
			}
		}).fetch();

	//Store a reference for the user's classProbability per project
	var classProbReference = {};

	for(var i=0; i<userProjects.length; i++){
		var classProbability = 0.001; //Default class probability to 0.001. Later, override if > 0
		matchProjectIDs.push(userProjects[i]._id);

		//Get user's probability for project
		var userClassProb = Projects.findOne({
			_id: userProjects[i]._id,
			'classProbability.user': userObj._id
		});

		//Set user's class probability, otherwise it's default 0.001
		if(typeof userClassProb !== 'undefined'){
			//console.log('set user specific classProb');
			classProbability = userClassProb['classProbability'].filter(function( obj ) { return obj.user == userObj._id; });
			classProbability = classProbability[0].probability;
		}

		classProbReference[userProjects[i]._id] = classProbability;

		//We get the user's specific update date to avoid having a 
		//single update date for every user.
		let userUpdateDate = LastTouchedProject.findOne({
			user: data.user,
			project: userProjects[i]._id
		});
		//If none is found, use the project's global updateDate
		if(typeof userUpdateDate === 'undefined'){
			//console.log('has no user specific update date')
			var updateDate = false;
		}
		else{
			//console.log('specific update date for user ' + data.user + ' -> ' + userUpdateDate.updateDate)
			var updateDate = userUpdateDate.updateDate;
		}

		classMatching.push({
			'class': userProjects[i]._id,
			'name': userProjects[i].name,
			'updateDate': updateDate,
			'gitName': userProjects[i].gitName,
			'words': [],
			'classProbability': classProbReference[userProjects[i]._id],
			'f_prob': 0,
			's_prob': 0,
			'w_prob': 0,
			'p_prob': 0,
		});
	}//END userProjects LOOP

	//console.log('got total of '+ userProjects.length +' projects for ' + data.user);

	//console.log(matchProjectIDs)
	
	//Retrieve all projects that have the identified words (we don't want projects where that word has never been classified WE DONT?)

	var classes = ProjectWordsStats.find({
    	'user': userObj._id,
    	'project':{
    		$in: matchProjectIDs
    	}
    }).fetch();

    //console.log('got total of '+ classes.length +' classes ');

	if(classes.length > 0){
		//console.log('got ' + classes.length + ' classes')
		//#########################
		//	CALCULATE FULL PROBABILITY (FULL -> USING ALL TEST WORDS, 
		//	INCLUDING THOSE THAT REPEAT ON MULTIPLE PROJECTS)
		//#########################
		for(var c=0; c<classes.length; c++){
		
			let classProbability = classProbReference[ classes[c].project ];
			var p = 1;
			//console.log('for ' + classes[c].project + ' with classProbability of ' + classProbability + ', ' + testWords.length + ' test words');
			
			//FULL PROB
			//Calculate probability for all test words
			for(var w=0; w<classes[c].words.length; w++){
				for(var t=0; t<testWords.length; t++){
					if(classes[c].words[w].word === testWords[t]){ p = p * classes[c].words[w].prob; }
				}
			}
			//p = 1 - (classProbability * p);
			p = 1 - (classProbability * p);

			//Find project, update f_prob and words with calculated value and replace from array
			var index = classMatching.findIndex(obj => obj.class === classes[c].project);
			var tmpObj = classMatching[index];

			tmpObj['f_prob'] = p;
			tmpObj['words'] = classes[c].words;

			//Replace from classMatching
			classMatching.splice(index, 1);
			classMatching.push(tmpObj);
		}//End f_prob FOR cycle

		//#########################
		//	CALCULATE SIMPLE PROBABILITY (USING ONLY WORDS THAT ARE UNIQUE FOR EACH PROJECT. THESE MAY BE EMPTY)
		//#########################
		//FIRST remove repeating words (found in other projects) from testWords object and recalculate probability (s_prob) with new string.
		var repeatingWords = ProjectWordsStats.aggregate([
			{ 
				$match:{
					'user': userObj._id,
					'project':{
						$in: matchProjectIDs
					}
				} 
			},
			{ $unwind: '$words' },
			//Group by word to get count
			{
			    $group:{
			        _id: '$words.word',
			        count:{
			            $sum: 1
			        }
			    }
			},
			{  $sort:{ count: -1  } },
			//Only get those who's count is = 0
			{
			    $match:{
			        count:{ $gt: 1 }
			    }
			},
			//Group into array
			{
			    $group:{
			        _id: null,
			        words:{
			            $addToSet: '$_id'
			        }
			    }
			}
		]);
		if(repeatingWords.length > 0 && repeatingWords[0].words.length > 0){
			//console.log('got '+ repeatingWords[0].words.length +' repeatingWords');
			repeatingWords = repeatingWords[0].words;
			for(var i=0; i<repeatingWords.length; i++){
				
				for(var j=0; j<testWords.length; j++){
					
					if(repeatingWords[i] === testWords[j]){
						
						//console.log('remove ' + testWords[j])
						testWords.splice(j, 1);

					}
				}

			}
		}

		//###
		//	Actual s_prob calculation
		//###
		for(var c=0; c<classes.length; c++){
			let classProbability = classProbReference[ classes[c].project ];

			var p = 1;
			//console.log('for ' + classes[c]._id + ' with classProbability of ' + classProbability)
			if(testWords.length > 0){
				for(var w=0; w<classes[c].words.length; w++){
					for(var t=0; t<testWords.length; t++){
						if(classes[c].words[w].word === testWords[t]){ 
							p = p * classes[c].words[w].prob; 
						}
					}
				}
			}
			p = classProbability * p;
			
			var index = classMatching.findIndex(obj => obj.class === classes[c].project);
			var tmpObj = classMatching[index];
			//tmpObj['prob_2'] = p;
			

			//s_prob = f_prob times the mean of f_prob and s_prob 
			var p_mean = (tmpObj['f_prob'] + p) / 2
			//tmpObj['s_prob'] = 1 - (tmpObj['f_prob'] * p_mean);
			//tmpObj['s_prob'] = 1 - tmpObj['f_prob'];
			tmpObj['s_prob'] = 1 - p;
			
			// if(tmpObj['prob'] > tmpObj['p_prob']){
			// 	tmpObj['prob'] = tmpObj['p_prob']
			// }

			//Replace from classMatching object array
			classMatching.splice(index, 1);
			classMatching.push(tmpObj);
		}//End s_prob FOR Cycle

	}

	//console.log('For ' + userObj.profile.firstName +': '+ userProjects.length +' projects, ' + classes.length + ' classes, classMatching: ' + classMatching.length+ ' (URI '+ data.uri+')');

	if(classMatching.length > 0){
		//### Get scores for words similarities
		//originalTestWords contain all words, including those found in multiple projects
		//testWords contain non repeating words
		//classMatching = wordSimilarityMatch(classMatching, originalTestWords);
		classMatching = wordSimilarityMatch(classMatching, testWords);

		//console.log('classMatching: ' + classMatching.length);
			
		//Calculate total score, mean, and total score * class probability
		for(var i=0; i<classMatching.length; i++){
			//console.log('-------------------------------------------------------')
			//console.log('FOR>>>>  ' + classMatching[i].name)
			//console.log(classMatching[i])

			//Use weight so that score is never 0, therefore division is never -Infinite
			var weight = 0.1;
			//Get total score by summing all probabilities
			var probabilityAvg = ( weight 
				+ classMatching[i].f_prob 
				+ classMatching[i].s_prob 
				+ classMatching[i].e_score 
				+ classMatching[i].s_score 
				+ classMatching[i].t_score
				+ classMatching[i].w_score ) / 7;

			//We'll use this score to then influence the optimal match
			var similarityScoreAvg = (classMatching[i].e_score + classMatching[i].s_score + classMatching[i].t_score) / 3;

			//Don't let the avg be 0 (in case scores are all 0) otherwise, when subtracting from 1, 
			//result would be 0 and X^0 = 1 (too high of a score). Instead, set as -0.1, so when doing
			// 1 - (-0.1) = 1.1, X^1.1 will decrease ("devaluate") the score value.
			if(similarityScoreAvg === 0) similarityScoreAvg = -0.1;
			classMatching[i].similarityScoreAvg = similarityScoreAvg;

			//Finally, factor probabilityAvg by multiplying it by (1 + class probability)
			var score = probabilityAvg * (1 + classMatching[i].classProbability);
			classMatching[i].probabilityScore = score;
			classMatching[i].probabilityAvg = probabilityAvg;
			
			//console.log('### DATA RES ###')
			//console.log('classMatching[i].probabilityAvg->   ' + probabilityAvg);
			//console.log('classMatching[i].classProbability-> ' + classMatching[i].classProbability);

		}

		//If multiple matches were found, determine top 5
		classMatching = _determineOptimalMatch(classMatching);
	}

	//console.log('-- CLASSIF. RESULT  for ' + userObj.profile.firstName);
	//console.log(classMatching[0]);

	//console.log('CLASS: return results for ' + userObj.profile.firstName)

	return {
		'matchedProjects': classMatching,
		'defaultCategory': domainCategory,
		'domainRule': domainRule,
		//'testWords': testWords,
	};
};