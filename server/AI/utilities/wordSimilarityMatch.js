wordSimilarityMatch = function(projects, testWords){
	//console.log('SIMILARITY TEST testWords: '+ testWords.length + ' projects: ' + projects.length);
	//console.log(testWords)
	
	var similarityScores = [];

	if(testWords.length > 0){
		//Remove any language code as that's easily matchable when doing indexOf
		testWords = testWords.join(' ').removeLanguageCodes();
		//testWords = testWords.removeWords(['dengun', 'projects'])
		testWords = testWords.split(' ');

		//Iterate all possible projects
		for(var i=0; i<projects.length; i++){
			var matchedWords = [];
			var exactMatch = [];
			var final_e_score = 0;

			var substringMatch = [];
			var final_s_score = 0;
			
			var titleScores = [];
			var t_score = 0;
			var final_t_score = 0;
			
			var wordsScore = 0;

			//Prepare project joint name
			var jointName = projects[i].name.replace(/[ \._-]/g,"").toLowerCase();
			//console.log('for ' + projects[i].name + ' | ' + jointName)

			//Iterate test words
			for(var w=0; w<testWords.length; w++){

				//Similarity between TEST WORD and FULL project NAME
				var t_score = sSimilarity(testWords[w], projects[i].name);

				//Try to split project name
				var re = /_|\s|-/g;
				var splitName = projects[i].name.split(re);
				
				if(splitName.length>0){
					_.each(splitName, function(word, k){
						if(word.length >= 2 && word !== ''){
							word = word.toLowerCase();
							var substringOfName = ( (word.indexOf(testWords[w]) >= 0  || testWords[w].indexOf(word) >= 0) ? true : false);
							if(substringOfName){
								//console.log('"'+word+'" & '+testWords[w]+' 	HAS SUBSTRING 1	!!')
								titleScores.push(0.5)
							}
						}
					});
				}
		
				
				//Ignore scores under .9
				if(t_score >= 0.9){ titleScores.push(t_score) }
				else{ titleScores.push(0) }


				//Similarity between TEST WORD and project WORDS
				if(projects[i].words.length > 0){
					_.each(projects[i].words, function(wordObj, key){
						//console.log(wordObj.word, testWords[w])
						var w_score = sSimilarity(wordObj.word, testWords[w]);

						
						if(w_score >= 0.9 && wordObj.prob >= 0.1){
							wordsScore += w_score;
							//console.log('push ' + wordObj.word + ' for ' + projects[i].name + ' |p ' + wordObj.prob + ' |s ' + w_score + ' |c ' + wordObj.count)
							matchedWords.push({
								'word': wordObj.word,
								'count': wordObj.count,
								'w_prob': wordObj.prob,
								'w_score': w_score
							});
						}
					});// End project words cycle
				}

				//Check for exact match between joint project name and test word
				var exactWordMatch = jointName === testWords[w];
				var regExp = RegExp(jointName, 'g');
				var existsInTestWord = testWords[w].match(regExp);
				
				//console.log('test ' + projects[i].name.replace(/[ \._-]/g,"").toLowerCase() + ' VS ' + testWords[w])
				//console.log('existsInTestWord: ' + existsInTestWord)
				
				if(exactWordMatch || existsInTestWord !== null || t_score === 1){ 
					//console.log('"'+projects[i].name+'" & '+testWords[w]+' 	PERFECT MATCH 	!!!!!!')
					exactMatch.push(1)
				}

				var substringOfName = ((jointName.indexOf(testWords[w]) >= 0 || testWords[w].indexOf(jointName) >= 0) ? true : false);
				if(substringOfName){
					//console.log('"'+projects[i].name+'" & '+testWords[w]+' 	HAS SUBSTRING 2	!!')
					substringMatch.push(0.5);
				}

			}// End testWords cycle

			


			//###
			//Get average from possible scores arrays
			
			//Divide sum by total testWords
			if(matchedWords.length > 0) wordsScore = wordsScore / projects[i].words.length;

			//Exact Matches
			var exactScoreSum = exactMatch.reduce(function(pv, cv) { return pv + cv; }, 0);
			if(exactScoreSum > 0) final_e_score = exactScoreSum / exactMatch.length;

			//Substring Matches
			var substringScoreSum = substringMatch.reduce(function(pv, cv) { return pv + cv; }, 0);
			if(substringScoreSum > 0) final_s_score = substringScoreSum / substringMatch.length;

			//Title
			var titleScoreSum = titleScores.reduce(function(pv, cv) { return pv + cv; }, 0);
			if(titleScoreSum > 0) final_t_score = titleScoreSum / titleScores.length;



			//Push similarityScores project objects
			similarityScores.push({
				'class': projects[i].class,
				'name': projects[i].name,
				'updateDate': projects[i].updateDate,
				'classProbability': projects[i].classProbability,
				'f_prob': projects[i].f_prob,
				's_prob': projects[i].s_prob,
				'titleScoreSum': titleScoreSum,
				'e_score': final_e_score,
				's_score': final_s_score,
				't_score': final_t_score,
				'w_score': wordsScore,
				'words': matchedWords
			});
		}// End projects cycle
	}
	else{
		for(var i=0; i<projects.length; i++){
			similarityScores.push({
				'class': projects[i].class,
				'name': projects[i].name,
				'updateDate': projects[i].updateDate,
				'classProbability': projects[i].classProbability,
				'f_prob': projects[i].f_prob,
				's_prob': projects[i].s_prob,
				'titleScoreSum': 0,
				'e_score': 0,
				's_score': 0,
				't_score': 0,
				'w_score': 0,
				'words': []
			});
		}
	}

	return similarityScores;
}