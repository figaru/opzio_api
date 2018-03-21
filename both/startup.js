Meteor.startup(function(){
	switch(process.env.NODE_ENV){
		case 'development':
			process.env.APP_URL = Meteor.settings.public.app_url.dev;
			var public_url = Meteor.settings.public.app_url.dev;
			break;
		case 'production':
			console.log('* running in PRODUCTION enviroment.');
			//var public_url = Meteor.settings.public.app_url.prod;
			break;
		default:
			console.log('*WAR: unknown enviroment!');
			break;
	}
	
	console.log('* CONN: connected to client ' + process.env.APP_URL);
	
	client = DDP.connect(process.env.APP_URL);
	//public_client = DDP.connect('https://opz.io');
});