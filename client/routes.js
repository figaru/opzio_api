Router.configure({
	notFoundTemplate: 'templateNotFound'
});

Router.route('/',{
	name: 'home',
	subscriptions: function(){
		if(__meteor_runtime_config__.REMOTE_CONNECTION) return [
			Meteor.subscribe('users'),
			Meteor.subscribe('queueMetrics')
		];
		this.next();
	},
	action: function(){
		var currentUser = Session.get('user');
		if(typeof currentUser === 'undefined'){
			this.render('homepage');
		}
		else{
			if(currentUser.roles.indexOf('root') > -1){
				this.render('dashboard',{
					data: function(){
						return{
							'users': Meteor.users.find({active:true}).fetch(),
							'queueMetrics': QueueMetrics.find({},{ sort:{ progress: -1} }).fetch()
						}
					}
				});
			}
			else{
				Router.go('home');
			}
		}
	},
});