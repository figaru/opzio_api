import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AccountsClient } from 'meteor/accounts-base';

import './home.html';

Meteor.startup(function(){
	public_client = DDP.connect('https://opz.io');
	console.log('connected to public_client')
});