//API Local & Remote Collections
console.log('* Init Local Collections')
//Heartbeats is only used by the API service
Heartbeats = new Meteor.Collection('heartbeats');

//API Metrics
ServiceMetrics = new Meteor.Collection('serviceMetrics');

//Vocabulary of learned words, stored per project and user
ProjectWordsStats = new Meteor.Collection('projectWordsStats');

UserApps = new Meteor.Collection('userApps');

UserAppsChange = new Meteor.Collection('UserAppsChange');

initCollections = function(database){
	console.log('* Init Remote Collections')
	
	//Remote DB Collections
	//Using new Mongo.Collection to use the options, namely idGeneration 
	//(when using db.open, idGeneration will be as mongo, an object. we want to force string like Meteor does)
	//Use _driver, otherwise it will save to local db and not remote (wtf?). See -> https://dev4devs.com/2015/06/05/meteor-js-how-to-connect-to-remotemultiple-databases/
	UserLogs = new Mongo.Collection('userLogs', { _driver: database, idGeneration: 'STRING' });

	Projects = new Mongo.Collection('projects', { _driver: database, idGeneration: 'STRING' });

	LastTouchedProject = new Mongo.Collection('lastTouchedProject', { _driver: database, idGeneration: 'STRING' });

	Organizations = new Mongo.Collection('organizations', { _driver: database, idGeneration: 'STRING' });

	OrganizationProfile = new Mongo.Collection('organizationProfile', { _driver: database, idGeneration: 'STRING' });

	Domains = new Meteor.Collection('domains', { _driver: database, idGeneration: 'STRING' });

	DomainCategories = new Meteor.Collection('domainCategories', { _driver: database, idGeneration: 'STRING' });

	DomainRules = new Meteor.Collection('domainRules', { _driver: database, idGeneration: 'STRING' });
	
	//For users, we use db.open (new Mongo.Collection creates conflict on remote db.)
	Meteor.users = database.open("users");


	/*********
		DB HOOKS GO HERE
	*********/
	//In the Future, we may want to determine several times the project according to certain criteria/events
	UserLogs.after.insert(function(userId, doc){
		//console.log('INSIDE INSERT HOOK')
		
		//##########################
		//	ASSOCIATE PREVIOUS USERLOG WITH CURRENT ONE, IF APPLICABLE (only if udpate time dif is < 2 minutes)
		//##########################
		var newDate = moment(doc.createDate).subtract(2, 'minutes').toDate();		
		
		var prevUserLog = UserLogs.findOne({
			'_id':{ $ne: doc._id },
			'user': doc.user,
			'updateDate':{ $gte: newDate }
		},
		{
			sort:{ createDate: -1 } 
		});

		if(typeof prevUserLog !== 'undefined'){
			UserLogs.update({
				_id: doc._id,
			},{
				$set:{
					'relatedLog': {
						'logId': prevUserLog._id,
						'project': prevUserLog.project
					}
				}
			});
		}

		//##########################
		//	TRY TO CLASSIFY EVERYTHING ELSE THAT ISN'T CODE
		//	namely browser and operative_system types
		//##########################
		if(doc.type !== 'code'){
			var classifyingQueue = _.find(classifyingQueues, function(queue) { return queue.title == doc.user });

			if(typeof classifyingQueue !== 'undefined'){
				/*
				var userObj = Meteor.users.findOne({
					_id: doc.user
				});
				
				//console.log('-- CLASSIFYING for ' + userObj.profile.firstName +' left:' + classifyingQueue.length() + '/' + classifyingQueue.total());
				*/

				var data = {
					'userId': doc.user,
					'userLog': doc,
				};

				data['queue'] = classifyingQueue;

				try{
					classifyingQueue.add(data);
				}
				catch(err){
					console.log('**QUE ERR: Unable to process classifyHeartbeatTask in server/collections.js');
					console.log(err);
					//console.log(data);

					Email.send({
						to: 'lawbraun.almeida@gmail.com',
						from: 'webmaster@opz.io',
						subject: 'OPZ_API QUEUE ERROR: Unable to process classifyHeartbeatTask',
						html: 'When: '+moment().format('DD @ HH:mm')+'<br><h2>'+ err +'</h2>'
					});

					//console.log('Qname: '+ classifyingQueue.name +' processing:' + classifyingQueue.processing() + ' total: ' + classifyingQueue.total())
				}

			}
			else{
				console.log(doc)
				console.log('**QUE ERR: Queue classifyingQueue not found for user '+ doc.user);
			}
		}
		else{
			UserLogs.update({
				_id: doc._id,
			},{
				$set:{
					'category': DomainCategories.findOne({category:'development'})
				}
			});
		}
	});
	
	//END HOOKS 

}

//----------------------------------------------
//FOR MIGRATION PURPOSES ONLY:
//These collections are used to import from the old Opz.io DB schema structure
//to later 'migrate' the collections into the new DB & schema
ProjectHourLogs = new Mongo.Collection('projectHourLogs');
UserHourLogs = new Mongo.Collection('userHourLogs');