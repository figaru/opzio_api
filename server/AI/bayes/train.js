//Naive Bayes Classifier that accepts an array of validated userLogs
Classifier.prototype.train = function(){
	let userLog = this.data;
	let userId = userLog.user;
	let userObj = Meteor.users.findOne({ _id: userId });
	let organizationId = userObj.profile.organization;

	//console.log('training log ' + userLog._id);

	if(typeof userLog === 'undefined' || userLog === null) return;

	//console.log('getting total logs...');
	var totalDocumentsCount = UserLogs.find({
		user: userId,
		validated:true
	}).count();

	//console.log('got ' + totalDocumentsCount)

	if(totalDocumentsCount === 0){ totalDocumentsCount = 1 }

	//Remove unwanted characters and normalize string from domain
	if(typeof userLog.domain !== 'undefined' && userLog.domain !== ''){
		var domain = userLog.domain.cleanDomain(),
			normalized_domain = domain.normal();
	}
	else{
		var normalized_domain = '';
	}

	//Get current label
	var label = userLog.project._id;
	//console.log('LABEL IS ' + label)


	//Remove unwanted characters and normalize string from Page Title (pt)
	if(typeof userLog.pageTitle !== 'undefined' && userLog.pageTitle !== ''){
		var pt = userLog.pageTitle.cleanString(),
			normalized_pt = pt.normal();
	}
	else{
		var normalized_pt = '';
	}

	//Remove unwanted characters and normalize string from URI
	if(typeof userLog.uri !== 'undefined' && userLog.uri !== ''){
		var uri = userLog.uri.cleanURI(),
			normalized_uri = uri.cleanString(),
			normalized_uri = normalized_uri.normal();
	}
	else{
		var normalized_uri = '';
	}

	//Join strings for later treatment
	var words = normalized_pt + ' ' + normalized_uri + ' ' + normalized_domain;

	//Ignore this log if words is empty string
	if(words.length === 0 || words === ''){
		//console.log('Empty words to analyse..')
		return;
	}

	//Remove stop words
	words = words.removeStopWords();

	//Split into array of individual words
	words = words.splitWords();

	//####
	//	Populate our labelData object with their respective data
	//####
	var projectWordRecord = ProjectWordsStats.findOne({
		user: userId,
		project: label
	});

	if(typeof projectWordRecord === 'undefined'){
		//console.log('create NEW projectWordRecord')
		var newObjId = ProjectWordsStats.insert({
			user: userId,
			project: label,
			words: [],
			wordStats: {
				'totalWordCount': 0,
				'documents': 0,
			},
		});
		projectWordRecord = ProjectWordsStats.findOne({
			_id: newObjId
		})
	}
	
	var projectWords = projectWordRecord.words;
	var projectWordStats = projectWordRecord.wordStats;

	//Update number of documents used to train this specific label (project)
	projectWordStats['documents'] += 1;

	//Iterate words
	for(var j=0; j<words.length;j++){
		
		//Get total numbe of words in vocabulary
		//var totalVocabulary = VocabularyStats.find({ organization: organizationId }).count();
		var totalVocabulary = ProjectWordsStats.aggregate([
			{
			    $match:{
			    	user: userId
			    }
			},
			{
			    $group:{
			        _id: '$user',
			        count: {
			            $sum: '$wordStats.totalWordCount'
			        }
			    }
			}
		])[0].count;

		//Fetch record object and determine its index
		var matchedWord = projectWordRecord['words'].filter(function( obj ) { return obj.word == words[j]; });
		var index = projectWordRecord['words'].findIndex(obj => obj.word==words[j]);
		
		//Increase total word count metric regardless of word
		projectWordStats['totalWordCount'] = projectWordStats['totalWordCount'] + 1;

		//Store matched word object
		if(matchedWord.length === 0){
			var wordObj = {
				'word': words[j],
				'prob': 0, 
				'count': 1
			}
			projectWords.push(wordObj);

		}
		else{
			var wordObj = matchedWord[0];
			//Increase its count
			wordObj['count'] += 1;
			//Replace updated word object from projectWords array using index
			projectWords[index] = wordObj
		}

		//Calculate probability for current words[j]
		var wordProb = (wordObj['count'] + 1) / ( projectWordStats['totalWordCount'] + totalVocabulary);
	}
	
	//#####
	//	While sorting, RECALCULATE PROBABILITY for 
	//	each word for current project
	//#####
	var sortedWords = projectWords.sort(function(a,b){
		a.prob = a.count / projectWordStats['totalWordCount'];
		b.prob = b.count / projectWordStats['totalWordCount'];
		return b.count - a.count;
	});
	
	//console.log('for ' + project.name + ' P= '+ projectWordStats['documents'] +'/'+ totalDocumentsCount +' = ' + (projectWordStats['documents'] / totalDocumentsCount));

	var classProbability = projectWordStats['documents'] / totalDocumentsCount;

	//console.log('classProbability: ' + classProbability)
	//Force probabilit to one in case it goes above 1
	//A BUG THAT HAPPENS INITIALLY WHEN ALL CLASSIFICATION IS TO THE SAME PROJECT
	//AND NO OTHER PROJECT HAS BEEN CLASSIFIED
	if(classProbability > 1){ classProbability = 1; }

	//Update projectWordRecord with updated words & stats
	ProjectWordsStats.update({ 
		project: label,
		user: userId,
	},
	{
		$set:{
			classProbability: classProbability,
			words: sortedWords,
			wordStats: projectWordStats
		}
	});

	//Update project as trained 

	var userProjectProb = Projects.findOne({
		_id: label,
		'classProbability.user': userId
	});

	if(typeof userProjectProb !== 'undefined'){
		Projects.update({
			_id: label,
			'classProbability.user': userId
		},
		{
			$set:{
				'classProbability.$.probability': classProbability,
				'trained': true
			}
		});
	}
	else{
		Projects.update({
			_id: label,
		},
		{
			$push:{
				'classProbability': {
					'user': userId,
					'probability': classProbability
				}
			},
			$set:{ 'trained': true }
		});
	}

	//Recalculate probability for rest of the projects
	Meteor.defer(function(){
		recalculateClassProbabilities(userId, label, totalDocumentsCount)
	});

	//Specify that we have used this userLog for training
	UserLogs.update({
		_id: userLog._id
	},{
		$set:{ 'usedForTraining': true }
	});

	//console.log('finished training for log ' + userLog._id);
	//console.log('-------------')

};


//------------------------
//For testing purposes.
//------------------------
Classifier.prototype.getTrainingSample = function(trainPercentage){
	let data = this.data;
	//console.log('total ' + data.length + ' records');
	var trainingVolume = Math.round(data.length * trainPercentage);
	var testingVolume = data.length - trainingVolume;

	//We're going to keep the trainingVolume
	//by removing the testingVolume from the array
	//i.e. we're picking in a 'reverse' way
	for(var i=0; i<testingVolume; i++){
		var randIndex = Math.floor(Math.random() * data.length);
		//console.log(data[randIndex]._id);

		//Before removing record, set it to be used as test sample
		UserLogs.update({ _id: data[randIndex]._id },
		{
			$set:{ 'usedForTesting': true }
		});

		data.splice(randIndex, 1);
	}

	this.data = data;
};