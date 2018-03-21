Meteor.methods({
	'createUserPersonalProjects': function(){
		var users = Meteor.users.find().fetch();

		_.each(users, function(val, k){
			console.log('checking for ' + val.profile.firstName)
			var existsProject = Projects.findOne({
				owner: {
					$in: [val._id]
				},
				type: 'personal'
			});

			if(typeof existsProject === 'undefined'){
				console.log('create for ' + val.profile.firstName);
				Projects.insert({
					name: 'Personal',
					gitName: '',
					type : 'personal',
				    totalTime : 0,
				    plannedTime : 0,
				    budget : 0,
				    owner : [ 
				        val._id
				    ],
				    team : [ 
				        {
				            user : val._id,
				            role : 'owner'
				        }
				    ],
				    visibility : 0,
				    lastUser : val._id,
				    valuePerHour : 0,
				    organization : val.profile.organization,
				    useForCategorization : true,
				    externalServices : [],
				    createDate : new Date(val.createdAt),
				    updateDate : new Date(),
				    trained : false,
				    classProbability : [],
				})
			}

		})

	},
	//Deprec!
	'migrateUserLogs': function(userId){

		//this.unblock();

		if(typeof userId !== 'undefined'){
			var users = Meteor.users.find({ _id: userId }).fetch();
		}
		else{ 
			var users = Meteor.users.find().fetch();
		}

		var count = users.length;
		var counter = 1;
		console.log('migrating ' + count + ' users');

		_.each(users, function(user, key){
			Meteor.call('migrateUser', user, function(err, data){
				if(!err){
					console.log('Finished processing ' + counter +'/'+ count +' -> ' + user.profile.firstName + ' ' + user.profile.lastName);
					counter+=1;
				}
			});
		});

		console.log('dispached ' + users.length + ' users');
	},
	'migrateUser': function(userId){
		this.unblock();
		let user = Meteor.users.findOne({_id:userId});
		//console.log('Migrating ' + user.profile.firstName + ' ' + user.profile.lastName + ' ....');
		var logs = UserHourLogs.find({'user':user._id},{sort:{'date.year': 1, 'updatedOn': 1}}).fetch();

		var years = [];
		var months = [];

		logs.forEach(function(log){
			if (years.indexOf(log.date.year) === -1) { years.push(log.date.year); }
			if (months.indexOf(log.date.month) === -1) { months.push(log.date.month); }
		});

		insertBrowserLogs(user._id, years, months);
		insertCodeLogs(user._id, years, months);

		console.log('FINISHED user ' + user.profile.firstName);
	},
	'migrateProjects': function(){
		console.log('Migrating project structure...')
		var projects = Projects.find({
			gitName: { $nin: ['null', '']}
		},
		{
			$sort: {
				name: 1
			}
		}).fetch();


		ProjectHourLogs.update({},{ $rename: {'createdAt':'createdOn'} }, {multi: true});
		Projects.update({},{ $unset: {'createDate':''} }, { multi: true });

		//for(var i = 0; i < 50; i++){
		for(var i = 0; i < projects.length; i++){
			var p = projects[i];
			var projectId = p._id;

			//########################
			//Determine project create date
			var createDate = moment().utc().toDate();
			var userHourLog = UserHourLogs.find({ 'projects.project': projectId },
			{
				sort:{ 'date.year': 1, 'date.hour': 1 }
			}).fetch()[0];

			var projectHourLog = ProjectHourLogs.find({ project: projectId },
			{
				sort:{ 'date.year': 1, 'date.hour': 1 }
			}).fetch()[0];


			//Determine whether oldest date is from userHourLogs or projectHourLogs
			if(typeof(userHourLog) !== 'undefined'){
				if(moment(userHourLog.createdOn).isBefore(createDate)){ createDate = moment(userHourLog.createdOn).toDate(); }
			}
			if(typeof(projectHourLog) !== 'undefined'){
				if(moment(projectHourLog.createdOn).isBefore(createDate)){ createDate = moment(projectHourLog.createdOn).toDate(); }
			}
			//If date wasn't set (i.e. no logs were found, set as beggining of year)
			if(moment().utc().isSame(createDate, 'day')){ createDate = moment().startOf('year').toDate(); };


			//########################
			//Change structure of team
			var team = [];
			if(p.team.length > 0){
				_.each(p.team, function(u, key){
					team.push({
						'user': u.user,
						'role': 'member'
					});
				});
			};
			//Set update date
			if(typeof p.updatedOn === 'undefined'){
				console.log('undefined updatedOn for ' + projectId)
				var updateDate = createDate;
			}
			else{
				var updateDate = p.updatedOn;	
			}

			var codeName = minifyProjectName(p, false)
			if(codeName.duplicate){
				//console.log('HAS DUPLICATE, TRY VARIATION')
				while(codeName.duplicate){
					codeName = minifyProjectName(p, true)	
				}
			}
			console.log('update project ' + p.name + ' to ' + codeName.codeName)
			
			//Update project
			Projects.update({ _id:projectId },
			{
				$set:{
					createDate: createDate,
					codeCreateDate: createDate,
					updateDate: updateDate,
					codeName: codeName.codeName,
					team: team,
					trained: false,
					classProbability: 0.001,
					words: [],
					wordStats:{
						totalWordCount: 0,
						uniqueWordCount: 0,
						documents: 0,
					},
					useForCategorization : true,
					matchingWords : [],
					excludingWords : [],
				}
			});

		}//End of projects loop

		//Remove updatedOn field (got replaced with updateDate)
		Projects.update({},{ $unset: {'updatedOn':''} }, {multi: true});
		
		console.log('Migrated ' + projects.length + ' projects');
	},

	'initialBayesTraining': function(){
		
		UserLogs.update({},{$set:{usedForTraining:false}},{multi:true});

		ProjectWordsStats.remove({});

		var query = {
			type:'browser',
			validated: true,
			usedForTraining: false,
			matchedProjects: { $not: {$size: 0} },
			domain:{ '$nin': ['New Tab', 'newtab', ''] },
			pageTitle:{ '$nin': ['New Tab', 'newtab', ''] }
		};
		console.log('Fetching records ...')
		var records = UserLogs.aggregate([
			{
				$match: query
			},
			{
				$project:{
					_id: '$_id',
					user: '$user',
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
			    	user: '$user',
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
							user: '$user',
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
			        user: '$logs.user',
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

		console.log('Deleting ṽocabulary and probabilities..')
		VocabularyStats.remove({});
		
		Projects.update({ /*_id:{ '$in': records[0].labels }*/ },
		{ $set:{
			trained: false,
			classProbability: [],
		}},
		{ multi: true });

		var trainingSet = [];
		// Finally, train classifier
		if(typeof records !== undefined && records.length > 0){

			var classifier = new Classifier(records);
			classifier.getTrainingSample(1)
			trainingSet = classifier.train();
			console.log('finished training!');
		}
		
		
		return {
			'trainingSet': trainingSet,
			'labels': records[0].labels,
			'totalWords': VocabularyStats.find().count()
		};

	},
	'testDomainCategorization': function(logId){
		var userHourLogs = UserHourLogs.findOne({
			_id: logId
		});

		var classifier = new Classifier([userHourLogs]);

		var matchedProjects = classifier.classify();

		console.log('classification:')
		console.log(matchedProjects)
	},
	'minifyProjectNames': function(){
		var projects = Projects.find().fetch();
		var count = 0;
		for(var i=count; i<projects.length; i++){
			var codeName = minifyProjectName(projects[i], false)
			if(codeName.duplicate){
				//console.log('HAS DUPLICATE, TRY VARIATION')
				while(codeName.duplicate){
					codeName = minifyProjectName(projects[i], true);
				}
			}
			console.log('set project ' + projects[i].name + ' to ' + codeName.codeName)
			Projects.update({
				_id: projects[i]._id,
			},
			{
				$set:{
					codeName: codeName.codeName
				}
			});
			count = i;
		}
		console.log('FINISHED: set ' + count + ' projects');
	}
});

/***
	MIGRATION UTILS
***/

insertCodeLogs = function(userId, years, months){
	var combinations = new Array();
	var user = Meteor.users.findOne({_id:userId});
	var userName = user.profile.firstName + user.profile.lastName;

	years.sort()
	months.sort()

	var totalInsertions = 0;

	for(var z=0; z<years.length; z++){
		for(var j=0; j<months.length; j++){
			var insertions = 0;
			var noURI = 0;
			var hasURI = 0;
			var noProject = 0;
			var hasProject = 0;
			var validatedCount = 0;
			var userHourLogs = UserHourLogs.aggregate([
				{
					'$match': {
						'user': userId,
						'date.month': months[j],
						'date.year': years[z],
						/*
						$or:[
							{'date.month': '1'},
							{'date.month': '2'},
							{'date.month': '3'},
						]
						*/
					}
				},
				{
				    $unwind: '$projects'
				},
				{
				    '$project':{
				        _id: '$projects.project',
				        createdOn: '$createdOn',
				        user: '$user',
				        organization: '$organization',
				        hour: {'$hour': '$createdOn'},
				        totalTime: '$projects.totalTime'
				    }
				}
			]);

			for(var i = 0; i<userHourLogs.length; i++){

				totalInsertions+=1;
				
				var pageTitle = '';
				var uri = '';
				var private = true;
				var project = {};
		
				var currentHour = moment(userHourLogs[i].createdOn).utc().startOf('hour').toDate();

				var existProject = Projects.findOne({_id: userHourLogs[i]._id});

				//Only insert logs whose project hasn't been deleted (still exists)
				if(typeof existProject !== 'undefined'){
					project = {
						_id: existProject._id,
						name: existProject.name,
						match_type: 'exact_gitname',
						score: 1
					};

					if(existProject.visibility >= 1){ private = false; }

					//Add user to project team if not present
					var projectObj = Projects.findOne({ _id: project, 'team.user': userId });
					if(typeof project === 'undefined'){
						
						Projects.update({
							_id: project
						},{
							$addToSet:{
								team:{
									user: userId,
									role: 'member'
								}
							}
						})				
					}
				}
				//Project doesn't exists, assign to user's "personal" project
				else{
					var personalProject = Projects.findOne({
						owner:{
							$in: [userId]
						},
						type: 'personal'
					});

					project = {
						_id: personalProject._id,
						name: personalProject.name,
						match_type: 'exact_gitname',
						score: 1
					};					
				}

				UserLogs.insert({
					'user': userHourLogs[i].user,
					'organization': userHourLogs[i].organization,
					'createDate':  moment(userHourLogs[i].createdOn).utc().toDate(),
					'logHour': currentHour,
					'updateDate': userHourLogs[i].createdOn,
					'totalTime': userHourLogs[i].totalTime,
					'uri': uri,
					'pageTitle': pageTitle,
					'project': project,
					'matchedProjects': [],
					'validated': true,
					'private': private,
					'type': 'code',
				});

				console.log('insert ' + totalInsertions + ' code logs');


			}//End insert loop
		}
	}
	return totalInsertions;
}

insertBrowserLogs = function(userId, years, months){
	var combinations = new Array();
	var user = Meteor.users.findOne({_id:userId});
	var userName = user.profile.firstName + user.profile.lastName;

	years.sort()
	months.sort()

	var totalInsertions = 0;

	for(var z=0; z<years.length; z++){
		for(var j=0; j<months.length; j++){
			var userHourLogs = UserHourLogs.aggregate([
				{
					'$match': {
						'user': userId,
						'date.month': months[j],
						'date.year': years[z],
					}
				},
				{
			        '$unwind': '$domains'
			    },
			    {
			        '$project':{
			            _id: '$domains.domain',
			            createdOn: '$createdOn',
			            user: '$user',
			            organization: '$organization',
			            url: '$domains.url',
			            pageTitle: '$domains.pageTitle',
			            hour: {'$hour': '$createdOn'},
			            project: '$domains.project',
			            score: '$domains.score',
			            validated: '$domains.validated',
			            totalTime: '$domains.totalTime'
			        }
			    }
			]);

			for(var i = 0; i<userHourLogs.length; i++){

				if(userHourLogs[i]._id !== 'newtab' && userHourLogs[i]._id !== '' && userHourLogs[i]._id !== ' '){
					totalInsertions += 1;

					var hasDomain = Domains.findOne({ domain: userHourLogs[i]._id });
					var private = true;
					var project = {};
					var matchedProjects = [];

					if(typeof hasDomain !== 'undefined'){
						var category = DomainCategories.findOne({ _id: hasDomain.category });
					}
					else{
						var category = DomainCategories.findOne({ category: 'unknown' });
					}

					//console.log('set ' + userHourLogs[i]._id + ' as ' + category.label)


					if(typeof(userHourLogs[i].project) === 'string'){
						var existProject = Projects.findOne({ _id: userHourLogs[i].project });
						//If project exists
						if(typeof existProject !== 'undefined'){
							
							if(typeof(userHourLogs[i].score) !== 'string'){
								var score = 0;
							}
							else{
								var score = userHourLogs[i].score;
							}

							project = {
								_id: existProject._id,
								name: existProject.name,
								match_type: 'classifier',
								score: score
							};
						}
						else{
							var personalProject = Projects.findOne({
								owner:{
									$in: [userId]
								},
								type: 'personal'
							});

							project = {
								_id: personalProject._id,
								name: personalProject.name,
								match_type: 'exact_gitname',
								score: 1
							};	
						}
					}
					if(typeof(userHourLogs[i].pageTitle) !== 'string'){ var pageTitle = ''; }
					else{ var pageTitle = userHourLogs[i].pageTitle; }

					if(typeof(userHourLogs[i].url) !== 'string'){ var uri = ''; }
					else{ var uri = userHourLogs[i].url; }

					if(userHourLogs[i].validated === true && project !== ''){
						var private = false; 
					}
					else if(userHourLogs[i].validated === false && project !== ''){
						var private = false; 
					}

					var createDate = moment(userHourLogs[i].createdOn).utc().toDate();
					var logHour = moment(userHourLogs[i].createdOn).utc().startOf('hour').toDate();

					UserLogs.insert({
						'user': userId,
						'organization': userHourLogs[i].organization,
						'createDate': createDate,
						'logHour': logHour,
						'updateDate': userHourLogs[i].createdOn,
						'totalTime': userHourLogs[i].totalTime,
						'domain': userHourLogs[i]._id,
						'uri': uri,
						'category': category,
						'pageTitle': pageTitle,
						'project': project,
						'matchedProjects': matchedProjects,
						'validated': userHourLogs[i].validated,
						'private': private,
						'type': 'browser',
						'usedForTraining': false,
					});
					
					console.log('insert ' + totalInsertions + ' browser logs');
				}
			}//End insert loop
			/*
			{
				console.log('*** 0 insertions for ' + months[j] + '/' + years[z]);
			}
			*/
		}
	}
}

minifyProjectName = function(project, applyVariation){
	if(typeof project.name !== 'undefined'){

		var codeName = '';
		
		if(project.type === 'personal'){
			codeName = 'PER';
			return {
				codeName: codeName,
				duplicate: false
			}
		}

		var duplicate = false;

		//Trim name
		var newName = project.name.replace( new RegExp("[-_]","gm")," "); //Remplace symbols by spaces
		newName = newName.replace(/[^\w\s]/gim, ''); //Remove all non alpha characters
		newName = newName.replace( new RegExp("[0-9]","g"),"").replace(".",""); //Remove digits and dots


		//Split to words where camelcase
		//Adds a whitespace before each Capital letter, including single words like Word. 
		// )
		newName = newName.replace(/([A-Z](?=[a-z]))/g, ' $1');

		//Convert multiple white spaces to one only
		newName = newName.replace(/\s+/g, " ");

		//Remove leading/trailing whitespaces
		newName = newName.replace(/^\s+|\s+$/g, "");
		newName.trim()
		
		//##########
		//Actual name building
		//##########

		//check if name is smaller or equal to 3
		if(newName.length <= 3){
			console.log('smaller than 3, no variation')
			if(!applyVariation){
				codeName = newName.toUpperCase();
			}
			else{
				console.log('smaller than 3, with variation')
				//Randomize order of indexes (very stupid, but hey..)
				var indexes = [];
				while(indexes.length <= 2){
					var randIndex = Math.floor(Math.random() * (newName.length));
					indexes.push(randIndex);
				}
				console.log('got '+ indexes.length +' possible indexes')
				var firstLetter = newName[ indexes[0] ];
				var middleLetter = newName[ indexes[1] ];
				var lastLetter = newName[ indexes[2] ];
				console.log(firstLetter + ' - '+ middleLetter + ' - '+ lastLetter)

				codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();
			}
		}
		//Otherwise minify into a code name
		else{
			var splitName = newName.split(' ');
			//console.log(splitName.length)

			if(splitName.length === 1){
				//Check if we want simple of variation
				if(!applyVariation){
					//console.log('1 word, no variation')
					var firstLetter = newName[0];
					var index = Math.floor(Math.round(newName.length / 2));
					//console.log(index)
					var middleLetter = newName[index];
					var lastLetter = newName[newName.length - 1];
					codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();
				}
				else{					//Get random index val
					var indexes = [];
					while(indexes.length <= 2){
						var randIndex = Math.floor(Math.random() * (newName.length));
						indexes.push(randIndex);
					}
					console.log('got '+ indexes.length +' possible indexes')
					var firstLetter = newName[ indexes[0] ];
					var middleLetter = newName[ indexes[1] ];
					var lastLetter = newName[ indexes[2] ];
					console.log(firstLetter + ' - '+ middleLetter + ' - '+ lastLetter)
					
					codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();
				}
			}

			if(splitName.length === 2){
				var firstWord = splitName[0];
				var secondWord = splitName[1];

				if(firstWord.length === 1){
					console.log('2 words A, no variation')
					if(secondWord.length > 2){
						var firstLetter = firstWord[0];
						var middleLetter = secondWord[Math.floor(Math.round(secondWord.length / 2))];
						var lastLetter = secondWord[secondWord.length - 1];

						codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();	

					}
					else if(secondWord.length === 2){
						cons
						var firstLetter = firstWord[0];

						codeName = (''+firstLetter + secondWord).toUpperCase();	
					}else{
						var randNumber = Math.floor(Math.random() * 9);
						codeName = (''+firstWord[0] + secondWord[0] + parseInt(randNumber)).toUpperCase();							
					}
				}

				else if(firstWord.length > 1 && firstWord.length <= 2){

					//Join first word with first letter of second word
					if(!applyVariation){
						console.log('2 words B, no variation')
						var lastLetter = splitName[1][0]

						codeName = (''+ firstWord + lastLetter).toUpperCase();	
					}
					else{
						console.log('2 words B, with variation')
						// var randDivider = Math.floor(Math.random() * secondWord.length);
						// var firstLetter = firstWord[0];
						// var middleLetter = secondWord[Math.floor(Math.round(secondWord.length / randDivider))];
						// var lastLetter = secondWord[secondWord.length];

						var indexes = [];
						while(indexes.length <= 2){
							var randIndex = Math.floor(Math.random() * (newName.length -1));
							indexes.push(randIndex);
						}
						console.log('got '+ indexes.length +' possible indexes')
						var firstLetter = newName[ indexes[0] ];
						var middleLetter = newName[ indexes[1] ];
						var lastLetter = newName[ indexes[2] ];
						console.log(firstLetter + ' - '+ middleLetter + ' - '+ lastLetter)

						codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();	
					}
				}
				//Get middle letter from first word
				else{
					if(!applyVariation){
						console.log('2 words C, no variation')
						var firstLetter = firstWord[0]

						var middleLetter = firstWord[Math.floor(Math.round(firstWord.length / firstWord.length))]
						var lastLetter = secondWord[0]

						codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();	
					}
					else{
						console.log('2 words C, with variation')
						var indexes = [];
						while(indexes.length <= 2){
							var randIndex = Math.floor(Math.random() * (newName.length -1));
							indexes.push(randIndex);
						}
						console.log('got '+ indexes.length +' possible indexes')
						var firstLetter = newName[ indexes[0] ];
						var middleLetter = newName[ indexes[1] ];
						var lastLetter = newName[ indexes[2] ];
						console.log(firstLetter + ' - '+ middleLetter + ' - '+ lastLetter)

						codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();	
					}
					
				}

			}
			
			if(splitName.length >= 3){

				var firstWord = splitName[0];
				var secondWord = splitName[1];
				var thirdWord = splitName[2];

				if(!applyVariation){
					//console.log('3 words A, no variation')
					var firstLetter = firstWord[0]
					var middleLetter = secondWord[0]
					var lastLetter = thirdWord[0]	
					
					codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();
				}
				else{
					//console.log('3 words A, with variation')
					var firstLetter = firstWord[Math.round(firstWord.length / 2)];
					var middleLetter = firstWord[Math.floor(Math.random() * secondWord.length)];
					var lastLetter = thirdWord[Math.round(thirdWord.length / 2)];	
					
					codeName = (''+firstLetter + middleLetter + lastLetter).toUpperCase();
				}
			}


		}
		
		//Verify code name is not empty
		if(codeName.length <= 0){
			//console.log('EMPTY CODENAME ' + project.name)
			if(!applyVariation){
				codeName = (''+project.name[0] + project.name[1] + project.name[2]).toUpperCase();
			}
			else{
				codeName = '';
				for(var i = 0; i <= 2; i++){
					var index = Math.floor(Math.random() * newName.length);
					codeName = codeName + newName[index];
				}
				codeName = codeName.toUpperCase();
			}
		}

		//Check for duplicates

		var existingProject = Projects.findOne({
			type: { $exists: false },
			codeName:codeName,
			organization: project.organization
		});

		if(typeof existingProject !== 'undefined'){
			console.log('duplicate project ' + newName + '('+ codeName +') with ' + existingProject.name + '('+ existingProject.codeName +')')
			duplicate = true;
		}

		if(codeName.length > 3){
			duplicate = true;
			console.log('error on codename for ' + project.name + '('+ codeName +')');
		}

		/*if(minifiedNames.indexOf(codeName) > 0){
			duplicate = true;
			//console.log(minifiedNames.indexOf(codeName))
		}*/
		
		//console.log(project.name + ' -> ' + newName +' -> ' + codeName);

		return {
			codeName: codeName,
			duplicate: duplicate
		}
	}
}