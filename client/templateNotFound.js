Template.templateNotFound.onCreated(function(){
	count = 5;
	Session.set('counter', count);

	interval = Meteor.setInterval(function(){
		Session.set('counter', count--);
	}, 1000)
});

Template.templateNotFound.onRendered(function(){

	Meteor.setTimeout(function(){
		Meteor.clearInterval(interval);
		window.location = 'https://opz.io';
	}, 5000);
});

Template.templateNotFound.helpers({
	'counter': function(){
		return Session.get('counter');
	}
});

Template.templateNotFound.onDestroyed(function(){
	Meteor.clearInterval(interval);
});