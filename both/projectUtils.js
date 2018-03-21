getProjectFromID = function(projectID){
    var project = Projects.findOne({_id: projectID });
    if(typeof(project) !== 'undefined'){
        if(typeof project.name !== 'undefined'){
            return project.name;
        }
        else{
            return project.gitName;
        }
    }
    else{
        return projectID; //Use this to return OTHERS when project is private or is under X totalTime
    }
};