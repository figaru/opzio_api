Template.homepage.events({
	'submit #loginForm': function(e){
		e.preventDefault();

		var email = $('#email').val();
		var password = $('#password').val();
		
		public_client = DDP.connect('https://opz.io');

		public_client.call('login', {'password':password, 'user': {'email': email } }, function(err, rsp){
			console.log('loggin in');
			if(!err && typeof err === 'undefined'){
				//Session.set('user', rsp.id);
				Meteor.call('getUserData', rsp.id, function(err, data){ 
					Session.set('user', data); 
				});
			}
			else{
				console.log(err)
			}
		});
	}
});