// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See remote-db-tests.js for an example of importing.
export const name = 'remote-db';

DBConnection = function(url){
	this.db_url = url;
	//Runtime initialization
	__meteor_runtime_config__.REMOTE_CONNECTION = false;
};

//Called upon server startup to connect 
//to a remote database. If unable, attempts to
//reconnect indefinitely
DBConnection.prototype.initConnection = function(){
	let url = this.db_url;
	console.log('** connecting to remote db...');
	var remoteDB = this.connectDatabase();

	if(typeof remoteDB === 'undefined'){
		while(__meteor_runtime_config__.REMOTE_CONNECTION !== true){
			console.log('** retrying...');
			var remoteDB = this.connectDatabase();
			Meteor._sleepForMs(2000);
		}
	}
	//this.checkRemoteConnection();
	return remoteDB;
};

//A basic function that attenpts 
//to connect to a remote mongodb url
DBConnection.prototype.connectDatabase = function(){
	let url = this.db_url;
	var remoteDB = url.split(':');
	remoteDB = remoteDB[remoteDB.length -1 ];

	if(typeof __meteor_runtime_config__.LAST_CONNECTION_TIME === 'undefined'){
		__meteor_runtime_config__.LAST_CONNECTION_TIME = new Date();
	}

	try{
		var database = new MongoInternals.RemoteCollectionDriver(url);
		console.log('** connected to remote db: ' + remoteDB);
		Meteor.call('updateServiceStatus', 'CONNECTED_REMOTE_DB');
		__meteor_runtime_config__.REMOTE_CONNECTION = true;
		__meteor_runtime_config__.LAST_CONNECTION_TIME = new Date();
	}
	catch(err){
		Meteor.call('updateServiceStatus', 'FAILED_REMOTE_DB', __meteor_runtime_config__.LAST_CONNECTION_TIME);
		//console.log(err)
	}

	return database;
}

//Called upon server startup, attemps every 30s
//to connect to url. The attempt result and 
//last successful attempt are stored in runtime 
DBConnection.prototype.checkRemoteConnection = function(){
	let url = this.db_url;
	console.log('** Init connection checker');

	Meteor.setInterval(function(){
		try{
			var conn = new MongoInternals.RemoteCollectionDriver(url);
			__meteor_runtime_config__.REMOTE_CONNECTION = true;
		}
		catch(err){
			__meteor_runtime_config__.REMOTE_CONNECTION = false;
			Meteor.call('updateServiceStatus', 'DISCONNECTED_REMOTE_DB', __meteor_runtime_config__.LAST_CONNECTION_TIME);
			console.log('*WAR: restarting server!');
			process.exit();
			
		}
	}, 1000);

}

//Returns the status of the DB connection
DBConnection.prototype.connected = function(){
	return __meteor_runtime_config__.REMOTE_CONNECTION
};