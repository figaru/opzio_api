Meteor.methods({
	'cleanURItest': function(data){
		//console.log(data)

		if(typeof data.domain !== 'undefined' && data.domain !== ''){
			var domain = data.domain.cleanDomain(),
				normalized_domain = domain.normal();
		}
		else{
			var normalized_domain = '';
		}

		//console.log('normalized_domain ' + normalized_domain)

		//Remove unwanted characters and normalize string from Page Title (pt)
		if(typeof data.pageTitle !== 'undefined' && data.pageTitle !== ''){
			var pt = data.pageTitle.cleanString();
			//console.log('clean pt ' + pt)
			var normalized_pt = pt.normal();
		}
		else{
			var normalized_pt = '';
		}

		//console.log('normalized_pt ' + normalized_pt)

		//Remove unwanted characters and normalize string from URI
		if(typeof data.uri !== 'undefined' && data.uri !== ''){
			var uri = data.uri.cleanURI();

			var cleanString_uri = uri.cleanString();

			var normalized_uri = cleanString_uri.normal();
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

		console.log('words ' + words)

		return {
			'normalized_domain': normalized_domain,
			'normalized_pt': normalized_pt,
			'normalized_uri': normalized_uri,
			'words': words.join(', '),
		}

	},
	'simulateHeartbeat': function(){

		//Sara - 01222cdd-dffd-eb4e-ddf0-f40380a3a4f4
		//Law  - f1b1140d-d6b9-f6de-e58a-473666b79838

		var os_heartbeats = [
			{
				body: {
					token: '01222cdd-dffd-eb4e-ddf0-f40380a3a4f4',
					application: 'Excel',
					url: 'C:\\Users\\sbc\\Desktop\\Em Transito\\CaseWare Sync\\CW Travel Team 16 (Sync)-1\\Vendas+PS V1b.xlsx',
					time: moment().unix(),
					title: 'Vendas+PS V1b.xlsx' 
				}
			},
		]

		var timeConst = 2000;
		var time = timeConst

		_.each(os_heartbeats, function(request, key){
			
			Meteor.setTimeout(function(){
				var heartbeat = cleanHeartbeat(request);

				if(typeof(heartbeat) !== 'undefined' && typeof(heartbeat) === 'object' && typeof(heartbeat['token']) !== 'undefined'){
					
					var user = Meteor.users.findOne({'profile.token':heartbeat.token});
					if(typeof user !== 'undefined'){
						//console.log('PING for '+ user.profile.firstName + ' '+ user.profile.lastName +'!')
						
						//Get or Update user tracking settings, then pass to queue accordingly
						var proceed = updateUserTracker(user, heartbeat);
						if(proceed){
							var data = {
								'receivedHeartbeat': heartbeat,
								'user': user,
							};
							
							console.log('PROCESS HEARTBEAT');
							
							addHeartbeatTask(data);
						}
					}
				}
			}, time);

			time += timeConst;
		});
	}
});