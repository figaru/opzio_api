//Returns a validated heartbeat object to be processed by the queue
cleanHeartbeat = function(request){
	var heartbeat = {};
	//Browser case or OS plugin case
	//Either one of these do not contain body.type or body.entity. 
	if(typeof(request.body.type) === 'undefined' && typeof(request.body.entity) === 'undefined'){
		//Browser case.
		//Browser hearbeat has a data key
		if('data' in request.body){
			if(typeof(request.body.data.domain) !== 'undefined'){

				//console.log(request.body.data)

				//If the browser heartbeat contains one of the domains we wish to
				//ignore, then return nothing which won't add the heartbeat to the queue,
				if(ignorePages.indexOf(request.body.data.url) >= 0){ return; }

				try{
					request.body.data.domain = cleanURL(request.body.data.domain);
					
					var data = {
						'domain': request.body.data.domain,
						'uri': request.body.data.url,
						'pageTitle': request.body.data.title,
						'time': request.body.data.time
					};

					//console.log('BROWSER HEARTBEAT')
					//console.log(request.body.data)

					heartbeat = {
						'token': request.body.token,
						'type': 'browser',
						'data': data
					};
				}
				catch(err){
					console.log('ERR: on API cleaning browser heartbeat')
					console.log(err)
				}
			}
		}
		//OS case
		//OS plugins are the only ones sending an application key
		if('application' in request.body){
			//console.log('got OS heartbeat')
			try{
				//console.log(request.body)
				if( ignoreApplications.indexOf(request.body.url) > -1  
					|| (request.body.title === '' && request.body.url === null) 
					|| (request.body.title === null && request.body.url === '') 
					|| (request.body.title === '' && request.body.url === '')
					|| (request.body.title.length === 0 && request.body.length === 0) 
				){
					//console.log('IGNORE SYSTEM HEARTBEAT!')
					return;
				}
				else{
					var data = {
						'domain': request.body.application,
						'uri': request.body.url,
						'pageTitle': request.body.title,
						'time': request.body.time
					};

					heartbeat = {
						'token': request.body.token,
						'type': 'operative_system',
						'data': data
					};
					
				}
			}
			catch(err){
				console.log('ERR: on API cleaning operative_system heartbeat')
				console.log(err)
			}
			/*
			//OS plugin Structure
			body: {
				token: '31357402-3ea4-7082-3958-fa56cf0b8911',
				application: 'opzio_companion',
				url: '',
				time: 1477431107.651137,
				title: 'Opzio Companion' 
			},
			*/

		}
	}
	//Code heartbeat case
	//Code heartbeats have a type or entity key in the data
	else{
		//TODO: make a try catch to avoid eventual erroneous/malicious data
		if(typeof(request.headers.authorization) !== 'undefined'){
			//console.log('code heartbeat')
			//console.log(request.body)
			try{
				var parsedToken = (request.headers.authorization).split(' ')[1];
				var token = String(new Buffer(parsedToken, 'base64'));
				var file = getParsedFile(request.body.entity);

				if(typeof request.body.language !== 'undefined'){
					 var language = request.body.language.toLowerCase();
				}
				else{
					var language = 'other';
				}

				var data = {
					'domain': request.body.entity,
					'project': request.body.project,
					'uri': request.body.entity,
					'pageTitle': file,
					'time': request.body.time,
					'branch': request.body.branch,
					'file': file,
					'type': request.body.type,
					'language': language
				};
				heartbeat = {
					'token': token,
					'type': 'code',
					'data': data,
				};
			}
			catch(err){
				console.log('ERR: on API cleaning code heartbeat')
				console.log(err)
			}	
			
		}	
	}

	return heartbeat;
};

validHeartbeats = function(oldHeartbeat, receivedHeartbeat){

	//THere's a problem here. Sometimes the old and new heartbeat have exactly the same time, so the dif is 0

	var valid = true;

	if(receivedHeartbeat.data.time < oldHeartbeat.data.time){
		valid = false;
	}
	
	if(receivedHeartbeat.type === 'browser'){
		//In case receivedHeartbeat is from browser, 
		//first check if the page is in our ignore list.
		if( ignorePages.indexOf(receivedHeartbeat.data.url) > -1 
			|| receivedHeartbeat.data.pageTitle === 'New Tab'
			|| receivedHeartbeat.data.uri === null ){
			//console.log('IGNORE PAGE!')
			valid = false
		}
	}

	if(receivedHeartbeat.type === 'operative_system'){
		//In case receivedHeartbeat is from operative system, 
		//check if application is in our ignore list.
		if( ignoreApplications.indexOf(receivedHeartbeat.data.url) > -1  || (receivedHeartbeat.data.pageTitle === '' && receivedHeartbeat.data.uri === null) || (receivedHeartbeat.data.pageTitle === '' && receivedHeartbeat.data.uri === '') ){
			//console.log('IGNORE SYSTEM HEARTBEAT!')
			valid = false
		};
	}

	return valid;
}

getTimeDifference = function(receivedHeartbeat, lastHeartbeat){
	var dif = receivedHeartbeat.data.time - lastHeartbeat.data.time; //Difference of epoch values
	//console.log(dif)
	return Math.abs(dif); //Forcing to be always positive. sometimes negative dunno why
};

getParsedFile = function(entity){
	try{
		var file = entity.split("/");
		var len = file.length - 1;
		var file = file[len];
	}
	catch (err){
		var file = entity;
	}
	return file;
};

//returns the source of heartbeat
identifyHeartbeat = function(heartbeat){
	if( 'project' in heartbeat['data'] || 'entity' in heartbeat['data'] || 'language' in heartbeat['data']) {
		return 'project';
	}
	else if('domain' in heartbeat['data'] || 'url' in heartbeat['data']){
		return 'browser';	
	}
	else if('application' in heartbeat['data']){
		return 'operative_system';
	}
	else{
		console.log('ERR: Unable to identify heartbeat type!')
		console.log(heartbeat)
		return;
	}
}

//Heartbeat Functions to query/alter database
newHeartbeat = function(heartbeat){
	var type = identifyHeartbeat(heartbeat);

	switch(type){
		case 'project':
			var file = getParsedFile(heartbeat);
			
			return Heartbeats.insert({
				owner: heartbeat.token,
				type: heartbeat.type,
				createDate: new Date(),
				data: {
					project: heartbeat.data.project,
					branch: heartbeat.data.branch,
					uri: heartbeat.data.uri,
					domain: heartbeat.data.domain,
					pageTitle: heartbeat.data.pageTitle,
					file: heartbeat.data.file,
					type: heartbeat.data.type,
					language: heartbeat.data.language,
					time: heartbeat.data.time, //The epoch value
				}
			});
			
			break;

		case 'browser':
			return Heartbeats.insert({
				owner: heartbeat.token,
				type: heartbeat.type,
				createDate: new Date(),
				data: {
					domain: heartbeat.data.domain,
					uri: heartbeat.data.uri,
					pageTitle: heartbeat.data.pageTitle,
					time: heartbeat.data.time, //The epoch value
				}
			});
			
			break;

		case 'operative_system':
			return Heartbeats.insert({
				owner: heartbeat.token,
				type: heartbeat.type,
				createDate: new Date(),
				data: {
					domain: heartbeat.data.application,
					uri: heartbeat.data.url,
					pageTitle: heartbeat.data.pageTitle,
					time: heartbeat.data.time, //The epoch value
				}
			});
			break;

		default:
			console.log('ERR: Unknwon heartbeat type in newHeartbeat util function');
			break;
	}

};

getHeartbeat = function(heartbeat){
	return Heartbeats.findOne({
		'owner': heartbeat.token
	},{
		sort:{
			createdAt: -1
		}
	});
};

removeHeartbeat = function(heartbeat){
	Heartbeats.remove({
		owner :  heartbeat.owner
	});
};

replaceHeartbeat = function(oldHeartbeat, heartbeat){
	if(heartbeat.type === 'project'){
		var setPipeline = {
			'uri': heartbeat.data.entity,
			'pageTitle': heartbeat.data.file,
		}
	}
	if(heartbeat.type === 'browser'){
		var setPipeline = {
			'uri': heartbeat.data.url,
			'pageTitle': heartbeat.data.title,
		}
	}
	Heartbeats.update({
		_id :  oldHeartbeat._id
	},
	{
		$set:{
			setPipeline
		}
	});
};