_determineOptimalMatch = function(classMatching){
	//console.log('\n\n _determineOptimalMatch \n\n');


	//Make some classMatching clones
	var sortedBy_FProb = classMatching.slice(0);
	var sortedBy_SProb = classMatching.slice(0);
	var sortedBy_TScore = classMatching.slice(0);
	//var sortedBy_totalScore = classMatching.slice(0);
	
	var sortedBy_FProb = sortedBy_FProb.sort(orderByProperty('f_prob', 'updateDate'));
	var sortedBy_SProb = sortedBy_SProb.sort(orderByProperty('s_prob', 'updateDate'));
	var sortedBy_TScore = sortedBy_TScore.sort(orderByProperty('t_score', 'updateDate'));
	//var sortedBy_totalScore = sortedBy_totalScore.sort(orderByProperty('tt_score', 'updateDate'));

	var candidates = [];
	//If classMatching > 10 set maxScore (max loop) as 10, otherwise as classMatching length
	var maxScore = (classMatching.length > 10) ? 10 : classMatching.length;
	var now = moment().valueOf();

	for(var i=0; i<maxScore; i++){
		//console.log('Round ' + i + ' cumul: ' + (maxScore - i))
		if(typeof sortedBy_FProb[i] !== 'undefined'){
			var index = candidates.findIndex(obj => obj._id === sortedBy_FProb[i].class);
			if(index >= 0){
				//console.log('INCREMENT ' + candidates[index].name + ' from sortedBy_FProb cumulatedCount: ' + candidates[index].cumulatedCount);
				var tmpObj = candidates[index];
				tmpObj['count'] += 1;
				tmpObj['cumulatedCount'] += (maxScore - i);
				candidates.splice(index, 1);
				candidates.push(tmpObj);
			}
			else{
				if(sortedBy_FProb[i].updateDate !== false){
					//console.log('get projectTimestamp for sortedBy_FProb')
					var projectTimestamp = moment(sortedBy_FProb[i].updateDate).valueOf();
					var dif = now - projectTimestamp;
				}
				else{
					var dif = false;
				}
				//console.log('PUSH      ' + sortedBy_FProb[i].name + ' from sortedBy_FProb');
				candidates.push({
					'_id': sortedBy_FProb[i].class,
					'name': sortedBy_FProb[i].name,
					'count': 1,
					'cumulatedCount': (maxScore - i),
					'probabilityScore':  sortedBy_FProb[i].probabilityScore,
					'probabilityAvg': sortedBy_FProb[i].probabilityAvg,
					'classProbability': sortedBy_FProb[i].classProbability,
					'similarityScoreAvg': sortedBy_FProb[i].similarityScoreAvg,
					'updateDate': sortedBy_FProb[i].updateDate,
					'updateDif': dif
				});
			}
		}
		if(typeof sortedBy_SProb[i] !== 'undefined'){
			index = candidates.findIndex(obj => obj._id === sortedBy_SProb[i].class);
			if(index >= 0){
				var tmpObj = candidates[index];
				//console.log('INCREMENT ' + candidates[index].name + ' from sortedBy_SProb cumulatedCount: ' + candidates[index].cumulatedCount);
				tmpObj['count'] += 1;
				tmpObj['cumulatedCount'] += (maxScore - i);
				candidates.splice(index, 1);
				candidates.push(tmpObj);
			}
			else{
				if(sortedBy_SProb[i].updateDate !== false){
					//console.log('get projectTimestamp for sortedBy_SProb')
					var projectTimestamp = moment(sortedBy_SProb[i].updateDate).valueOf();
					var dif = now - projectTimestamp;
				}
				else{
					var dif = false;
				}
				//console.log('PUSH      ' + sortedBy_SProb[i].name + ' from sortedBy_SProb');
				candidates.push({
					'_id': sortedBy_SProb[i].class,
					'name': sortedBy_SProb[i].name,
					'count': 1,
					'cumulatedCount': (maxScore - i),
					'probabilityScore':  sortedBy_SProb[i].probabilityScore,
					'probabilityAvg': sortedBy_SProb[i].probabilityAvg,
					'classProbability': sortedBy_SProb[i].classProbability,
					'similarityScoreAvg': sortedBy_SProb[i].similarityScoreAvg,
					'updateDate': sortedBy_SProb[i].updateDate,
					'updateDif': dif
				});
			}
		}
		if(typeof sortedBy_TScore[i] !== 'undefined'){
			index = candidates.findIndex(obj => obj._id === sortedBy_TScore[i].class);
			if(index >= 0){
				//console.log('INCREMENT ' + candidates[index].name + ' from sortedBy_TScore cumulatedCount: ' + candidates[index].cumulatedCount);
				var tmpObj = candidates[index];
				tmpObj['count'] += 1;
				tmpObj['cumulatedCount'] += (maxScore - i);
				candidates.splice(index, 1);
				candidates.push(tmpObj);
			}
			else{
				if(sortedBy_TScore[i].updateDate !== false){
					var projectTimestamp = moment(sortedBy_TScore[i].updateDate).valueOf();
					var dif = now - projectTimestamp;
				}
				else{
					var dif = false;
				}
				//console.log('PUSH      ' + sortedBy_TScore[i].name + ' from sortedBy_TScore');
				candidates.push({
					'_id': sortedBy_TScore[i].class,
					'name': sortedBy_TScore[i].name,
					'count': 1,
					'cumulatedCount': (maxScore - i),
					'probabilityScore':  sortedBy_TScore[i].probabilityScore,
					'probabilityAvg': sortedBy_TScore[i].probabilityAvg,
					'classProbability': sortedBy_TScore[i].classProbability,
					'similarityScoreAvg': sortedBy_TScore[i].similarityScoreAvg,
					'updateDate': sortedBy_TScore[i].updateDate,
					'updateDif': dif
				});
			}
		}
		/*
		if(typeof sortedBy_totalScore[i] !== 'undefined'){
			index = candidates.findIndex(obj => obj._id === sortedBy_totalScore[i].class);
			if(index >= 0){
				var tmpObj = candidates[index];
				tmpObj['count'] += 1;
				tmpObj['cumulatedCount'] += (maxScore - i);
				candidates.splice(index, 1);
				candidates.push(tmpObj);
			}
			else{
				if(sortedBy_totalScore[i].updateDate !== false){
					//console.log('get projectTimestamp for sortedBy_totalScore')
					var projectTimestamp = moment(sortedBy_totalScore[i].updateDate).valueOf();
					var dif = now - projectTimestamp;
				}
				else{
					var dif = false;
				}
				candidates.push({
					'_id': sortedBy_totalScore[i].class,
					'name': sortedBy_totalScore[i].name,
					'count': 1,
					'cumulatedCount': 1,
					'probabilityScore':  sortedBy_totalScore[i].probabilityScore,
					'probabilityAvg': sortedBy_totalScore[i].probabilityAvg,
					'classProbability': sortedBy_totalScore[i].classProbability,
					'updateDate': sortedBy_totalScore[i].updateDate,
					'updateDif': dif
				});
			}
		}
		*/
	}

	/*
	console.log('\n\nBefore Ratios\n\n')
	_.each(candidates, function(val, key){
		console.log(val);
		console.log('---------------------')
	});
	*/

	//Calculate final score based on last update date
	
	//console.log('------ GET MAX TIME DIF ------')

	//First, get maxTimeDif and maxCumulatedCount
	var maxTimeDif = 0;
	var maxCumulatedCount = 0;
	for(var i=0; i< candidates.length; i++){
		//console.log(candidates[i]);
		if(candidates[i].updateDif > maxTimeDif){
			maxTimeDif = candidates[i].updateDif;
			//console.log('max dif is from <' + candidates[i].name + '> with ' + candidates[i].updateDif + '('+ candidates[i].updateDate +')');
		}
		if(candidates[i].cumulatedCount > maxCumulatedCount) maxCumulatedCount = candidates[i].cumulatedCount;
	}

	//console.log('------ CALCULATE MAX RATIO ------')

	//Get max Ratio
	var maxRatio = 0;
	for(var i=0; i< candidates.length; i++){
		if(candidates[i].updateDif){
			var difRatio = maxTimeDif / candidates[i].updateDif;
			
			candidates[i].difRatio = difRatio;
			
			//console.log('difRatio for ' + candidates[i].name + ' -> ' + difRatio + ' - ('+ maxTimeDif +'/' + candidates[i].updateDif+')')

			if(difRatio > maxRatio){
				maxRatio = difRatio;
				//console.log('max ratio is from <' + candidates[i].name + '> with ' + difRatio);
			}
		}
		else{
			candidates[i].difRatio = false;
		}
	}

	/*
	console.log('\n\nAfter Ratios\n\n')

	_.each(candidates, function(val, key){
		console.log(val);
		console.log('---------------------')
	});
	*/

	//CALCULATE FINAL SCORE
	for(var i=0; i< candidates.length; i++){
		
		if(candidates[i].difRatio){
			var temporalRatio = maxRatio / candidates[i].difRatio;
			var temporalScore = Math.abs( (1 / temporalRatio) - 0.5 );
			//console.log('temporalRatio for ' + candidates[i].name + ' -> '+ temporalRatio + ' temporalScore: ' + temporalScore + ' - ('+ maxRatio +'/' + candidates[i].difRatio+')')
		}
		else{
			var temporalScore = 0.1;
		}
		

		candidates[i]['temporalScore'] = temporalScore;

		var countWeight = candidates[i].count / 5;
		var countScore = candidates[i].probabilityScore * countWeight;
		candidates[i]['countScore'] = countScore;
		
		var cumulCountWeight = candidates[i].cumulatedCount / maxCumulatedCount;
		var cumulCountScore = candidates[i].probabilityScore * cumulCountWeight;
		candidates[i]['cumulCountScore'] = cumulCountScore;


		//similarityPower seriously influences the final value of the score
		//similarityPower is derived from similarityScoreAvg, the average of scores from
		//occurring similarities in the log keywords and the project's name or keywords
		var similarityPower = 1 - candidates[i].similarityScoreAvg;

		var finalScore = (candidates[i].probabilityAvg
						+ temporalScore 
						+ countScore 
						+ cumulCountScore) / 4;

		finalScore = Math.pow(finalScore, similarityPower);
	
		candidates[i]['matchType'] = 'classifier';
		
		candidates[i]['score'] = finalScore;

		//Remove unwanted properties
		delete candidates[i].updateDate;
		delete candidates[i].updateDif;
		delete candidates[i].difRatio;
		delete candidates[i].count;
		delete candidates[i].cumulatedCount;
		//delete candidates[i].probabilityScore;

	}

	candidates = candidates.sort(orderByProperty('score'));
	
	//console.log('\n\nAfter FINAL SCORE\n\n')
	/*
	_.each(candidates, function(val, key){
		console.log(val);
		console.log('---------------------')
	});
	*/

	return candidates;
};