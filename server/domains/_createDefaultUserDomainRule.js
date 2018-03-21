_createDefaultUserDomainRule = function(userObj, domain, pageTitle, uri, category, createDefault, defaultRule){
	var default_private_days = [0, 7];
	var default_private_hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 19, 20, 21, 22, 23];
	var isDefault = false;
	var isValid = false;
	var uriValue = uri;

	//console.log('_createDefaultUserDomainRule....')

	//Specify this is a default rule if applicable
	if(createDefault){
		isDefault = true;
		uriValue = domain;
		var matchRules = {
			//If set as true, both uri & pageTitle must match
			'exactMatch': false,
			
			//If set as true, will classify if provided uri matches exactly the uri in this rule
			'fullUri': false,
			
			//If set as true, will classify all that matches this page title
			'titleOnly': false,

			//Default as true when created
			//If set as true, will classify all that comes from this domain
			'domainOnly': true,
		};
	}
	//If this is not a default rule, the matchRule is and exactMatch by default
	else{
		var matchRules = {
			'exactMatch': true,			
			'fullUri': false,
			'titleOnly': false,
			'domainOnly': false,
		};
	}

	//If no defaultRule is provided to derive rule,
	//rules will be based on provided (default) category
	if(typeof defaultRule === 'undefined'){

		//console.log('Infering from category')

		var categoryValue = category;
		
		//Assign default values depending on category type. Sets:
		//	private, setProject & project
		switch(category.value){
			//Categories we consider as being private by default
			//If private, assing the project as the user's "personal" time

			//Search category
			//	Dont assume project
			case 15:
				var private = true;
				var setProject = false;
				var project = null;
				break;
			//FOr Social, Leisure, Shopping, Travel, Misc & Other categories
			//	Set as private, and set as personal project by default
			case 6:
			case 7:
			case 9:
			case 11:
			case 17:
			//case 18:
				var private = true;
				var setProject = true;
				var projectObj = Projects.findOne({
					owner: {
						$in: [userObj._id],
					},
					type: 'personal'
				});

				var project = {
					_id: projectObj._id,
					name: projectObj.name,
				}

				break;
			default:
				var private = true;
				var setProject = false;
				var project = null;

				break;
		}

	}
	else{
		
		//console.log('Infering from defaultRule')
		//console.log(defaultRule)


		
		var private = defaultRule.private;
		var categoryValue = defaultRule.category;
		
		if(typeof defaultRule.classifyRules !== 'undefined'){
			var setProject = defaultRule.classifyRules.setProject;
			if(defaultRule.classifyRules.setValidated){
				var setValidated = defaultRule.classifyRules.setValidated;
				isValid = defaultRule.validated;
			}
			else{
				var setValidated = false;
			}
		}
		else{
			var setProject = false;
		}

		if(setProject){
			var project = defaultRule.project;
		}
		else{
			switch(categoryValue){
				case 6:
				case 7:
				case 9:
				case 11:
				case 17:
				//case 18:
					var projectObj = Projects.findOne({
						owner: {
							$in: [userObj._id],
						},
						type: 'personal'
					});

					var project = {
						_id: projectObj._id,
						name: projectObj.name,
					}

				default:
					var project = null;

					break;
			}
		}

	}


	//console.log('>>>>>>> CREATE NEW Rule using: ');
	//console.log('>>>>>>> default:       ' + isDefault);
	//console.log('>>>>>>> category:      ' + category.label);
	//console.log('>>>>>>> setProject:    ' + setProject);
	//console.log('>>>>>>> project:       ' + project);
	//console.log('>>>>>>> private:       ' + private);
	//console.log('>>>>>>> setValidated:  ' + setValidated);
	//console.log('>>>>>>> valid:         ' + isValid);

	var insertPipeline = {
		//Rule owner
		'user': userObj._id,
		'organization': userObj.profile.organization,
		//Data that make up the rule
		'uri': uriValue,
		'domain': domain,
		'pageTitle': pageTitle,
		
		'visited': true,
		'default': isDefault,
		
		//Time periods to apply this rule (currently not being used)
		'privatePeriod':{
			'enabled': true,
			'days': default_private_days,
			'hours': default_private_hours
		},

		'projectRules':[],
		
		//How to match this rule, by descending order of override (1st override 2nd, 2nd override, 3rd, etc)
		//matchRules are defined above depending if this is a default rule or not
		'matchRules': matchRules,

		//What to apply when the heartbeat data matches this rule data
		'classifyRules':{
			//Sets the category
			'setCategory': true,
			//We don't set project by default
			'setProject': setProject,
			'setPrivacy': true, //Basically this is always true,
			'setValidated': false,
		},

		//The data to set according to the options
		'category': categoryValue,
		//The chosen project to classify, if specified
		'project': project,
		//Privacy setting
		'private': private,
		//Privacy setting
		'validated': isValid,
	}
	
	/*
	insertPipeline['matchRules'] = {
		'exactMatch': true,
		'fullUri': false,
		'titleOnly': false,
		'domainOnly': false,
	};
	*/

	return insertPipeline
}