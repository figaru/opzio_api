Template.queueChart.onRendered(function(){
	//console.log(Template.instance().data);

	var t = Template.instance();

	if(t.data.progress >= 90){
		color = '#00E676';
	}
	else if(t.data.progress < 90 && t.data.progress >= 60){
		color = '#81C784';
	}
	else if (t.data.progress < 60 && t.data.progress >= 40){
		color = '#FFEB3B';
	}
	else if (t.data.progress < 40 && t.data.progress >= 10){
		color = '#FF9800';
	}
	else if (t.data.progress < 10 && t.data.progress >= 0){
		color = '#FF3D00';
	}

	t.$('.column').css({
		'background': color,
		'height': t.data.progress+'%',
	});

	/*
	t.$('.column').animate({
		'height': t.data.progress+'%',
	});
	*/

	t.$('.value').text(t.data.length+'/'+t.data.total);

	Meteor.setInterval(function(){
		var a = moment();
		var b = moment(t.data.updateDate);
		t.$('.received').text(moment(t.data.updateDate).fromNow(true));

	}, 1000);

});

Template.queueChart.helpers({
	userName: function(userId){
		return getUserShortName(userId);
	},
	receivedDate: function(queue){
		return moment(queue.updateDate).fromNow(true)
	},
	'chartRefresh': function(queue){
		try{


			var t = Template.instance();

			if(t.data.progress >= 90){
				color = '#00E676';
			}
			else if(t.data.progress < 90 && t.data.progress >= 60){
				color = '#81C784';
			}
			else if (t.data.progress < 60 && t.data.progress >= 40){
				color = '#FFEB3B';
			}
			else if (t.data.progress < 40 && t.data.progress >= 10){
				color = '#FF9800';
			}
			else if (t.data.progress < 10 && t.data.progress >= 0){
				color = '#FF3D00';
			}

			t.$('.column').css({
				'background': color,
			});

			t.$('.column').animate({
				'height': t.data.progress+'%',
			});

			t.$('.value').text(t.data.length+'/'+t.data.total);
		}
		catch(err){}
	}
})