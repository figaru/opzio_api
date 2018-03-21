isRoot = function(userId){
    if(userId){
        return Roles.userIsInRole(userId, 'root');
    }
    else if(userId === null){
        return Roles.userIsInRole(this.userId, 'root');
    }
    else{
        return Roles.userIsInRole(Meteor.userId(), 'root');   
    }
};
isAdmin = function(userId){
    if(userId){
        return Roles.userIsInRole(userId, 'admin');
    }
    else if(userId === null){
        return Roles.userIsInRole(this.userId, 'admin');
    }
    else{
        return Roles.userIsInRole(Meteor.userId(), 'admin');   
    }
}

getUserShortName = function(userId){
    if(typeof(userId) !== 'undefined'){
        var user = Meteor.users.findOne({ _id:userId}, 
        {
            fields: {
                'profile.firstName': 1,
                'profile.lastName': 1
            } 
        });

        if(typeof(user) !== 'undefined'){
            if('firstName' in user.profile && 'lastName' in user.profile){
                if(user.profile.firstName.length > 0 && user.profile.lastName.length > 0){
                    return user.profile.firstName + ' ' + user.profile.lastName[0].toUpperCase() + '.';
                }
                else if(user.profile.firstName.length > 0 && user.profile.lastName.length === 0){
                    return user.profile.firstName;
                }
                else{
                    return user.profile.firstName;
                }
            }
            else{
                return 'Unknown';
            }
        }
        /*
        else{
            return userId;
        }
        */

    }
}

getUserInitials = function(userId){
    if(typeof userId === 'string'){
        var names = Meteor.users.findOne({_id:userId}, {fields: {'profile.name': 1, 'profile.firstName': 1, 'profile.lastName': 1} }).profile;
    }
    else{
        var names = userId.profile;
    }
    if('firstName' in names && 'lastName' in names){
        if(names.firstName.length > 0 && names.lastName.length > 0){
            return names.firstName[0].toUpperCase() + names.lastName[0].toUpperCase();
        }
        else if(names.firstName.length > 0 && names.lastName.length === 0){
            return names.firstName[0].toUpperCase();
        }
        else{
            return names.name;
        }
    }
    else{
        return names.name;
    }
}