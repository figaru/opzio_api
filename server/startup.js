//API
import { Meteor } from 'meteor/meteor';
import { DBConnection } from "meteor/mstrlaw:remote-db";

Meteor.startup(function(){
	
	console.log('* API STARTUP @ '+ new Date().toISOString());

	process.env.MAIL_URL = 'smtp://postmaster@opz.io:438e639ed0a29cee91827302126d58e2@smtp.mailgun.org:587';

	//#######################
	//	ENVIRONMENT INITIALIZATION
	//#######################
	switch(process.env.NODE_ENV){
		case 'development':
			console.log('* running in DEVELOPMENT enviroment.');
			process.env.REMOTE_DB = Meteor.settings.app_mongo_url.dev;
			process.env.REMOTE_CLIENT = Meteor.settings.app_url.dev;
			break;
		case 'production':
			console.log('* running in PRODUCTION enviroment.');
			process.env.REMOTE_CLIENT = process.env.APP_URL;
			break;
		default:
			console.log('*WAR: unknown enviroment!');
			break;
	}

	//Set words to look from heartbeats to later ignore
	//TODO: Change unwanted words to collection
	
	ignorePages = ['', ' ', 'newtab', 'blank', 'about:blank', 'chrome://newtab/', 'chrome://extensions/', 'chrome://history/', 'chrome://downloads/'];
	ignoreApplications = ['explorer', 'ShellExperienceHost', 'SearchUI', 'dwm', 'WerFault', 'Idle', 'ApplicationFrameHost', 'uninstall', 'LockApp', 'SoftwareUpdate'];
	

	//Remove any heartbeat still stored in DB (mostly in case server restarts)
	Heartbeats.remove({});

	//#######################
	//	CLIENT CONNECTION
	//#######################

	clientWorker = DDP.connect(process.env.REMOTE_CLIENT);

	//#######################
	//	DATABASE CONNECTION
	//#######################
	var db_connection =  new DBConnection(process.env.REMOTE_DB);
	var remoteDB = db_connection.initConnection();
	if(db_connection.connected()){
		
		//Init collections (both local & remote)
		initCollections(remoteDB);

		Meteor.users.update({},
		{
			$set:{
				'requests': 0,
				'total': 0,
			}
		},
		{ multi: true });

		//#######################
		//	TRIGGER PUBLICATIONS ONCE COLLECTIONS ARE READY
		triggerPublications();

		//#######################
		//	START QUEUES
		console.log('* QUE: INIT Queues');		
		heartbeatQueues = initHeartbeatQueues();
		classifyingQueues = initClassifierQueues();
		trainingQueues = initTrainingQueues();

		//#######################
		//	INDEXES
		UserApps._ensureIndex( { "lastUpdate": 1 }, { expireAfterSeconds: 86400*10 } );

		//**********
		//Update service status & metrics
		//**********
		initQueueMetrics();
		
		Meteor.call('updateServiceStatus', 'SERVER_STARTUP');

		console.log('* SYS: A-OK!');
	}
	else{
		console.log('* ERROR CONNECTING TO DB!');	
	}

});
// END STARTUP
