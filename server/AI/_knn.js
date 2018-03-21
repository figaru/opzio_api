/****
    K-Nearest Neighbour Algorithm implementation 
    from https://www.burakkanber.com/blog/machine-learning-in-js-k-nearest-neighbor-part-1/
****/

predictType = function(dataSet, newData){
    if(typeof(newData) !== 'undefined'){

        var nodes = new NodeList(3);

        //console.log(nodes)

        for(i in dataSet){
            nodes.add( new Node(dataSet[i]) );
        }

        //Add the data point we want to predict
        nodes.add( new Node(newData) );

        var pointPrediction = nodes.determineUnknown();

        return pointPrediction;
    }
};

/*******
 NODE LIST
*******/

Node = function(object) {
    for (var key in object)
    {
        this[key] = object[key];
    }
};

Node.prototype.measureDistances = function(url_range_obj, title_range_obj) {

    var url_range = url_range_obj.max - url_range_obj.min;
    
    var title_range  = title_range_obj.max  - title_range_obj.min;

    for (var i in this.neighbors)
    {
        /* Just shortcut syntax */
        var neighbor = this.neighbors[i];

        var delta_url = neighbor.urlSimilarity - this.urlSimilarity;
        delta_url = (delta_url ) / url_range;

        var delta_title  = neighbor.titleSimilarity  - this.titleSimilarity;
        delta_title = (delta_title ) / title_range;

        neighbor.distance = Math.sqrt( delta_url*delta_url + delta_title*delta_title );
    }
};

Node.prototype.sortByDistance = function() {
    this.neighbors.sort(function (a, b) {
        return a.distance - b.distance;
    });
};

Node.prototype.guessType = function(k) {
    var projects = {};

    for (var i in this.neighbors.slice(0, k))
    {
        var neighbor = this.neighbors[i];

        if ( ! projects[neighbor.project] )
        {
            projects[neighbor.project] = 0;
        }

        projects[neighbor.project] += 1;
    }

    var guess = {project: false, count: 0};

    for (var project in projects)
    {
        if (projects[project] > guess.count)
        {
            guess.project = project;
            guess.count = projects[project];
        }
    }

    this.guess = guess;

    return projects;
};

/*******
 NODE LIST
*******/

NodeList = function(k) {
    this.nodes = [];
    this.k = k;
};

NodeList.prototype.add = function(node){
	this.nodes.push(node);
}

NodeList.prototype.determineUnknown = function(){

	var nodes = this.nodes;

	this.calculateRanges();

    //Loop through our nodes and look for unknown types.
    for (var i in nodes)
    {

        if ( nodes[i].project == null )
        {
            //If the node is an unknown project, clone the nodes list and then measure distances.
            
            // Clone nodes
            nodes[i].neighbors = [];
            for (var j in nodes)
            {
                if ( ! nodes[j].project)
                    continue;
                nodes[i].neighbors.push( new Node(nodes[j]) );
            }


            // Measure distances 
            nodes[i].measureDistances(this.titles, this.urls);


            // Sort by distance
            nodes[i].sortByDistance();

            // Guess type
            nodes[i].guessType(this.k);

            return nodes[i];
        }
    }
}

/* Identifies the min and max range to be used */
NodeList.prototype.calculateRanges  = function() {

    this.titles = {min: 1000000, max: 0};
    this.urls = {min: 1000000, max: 0};

    for (var i in this.nodes)
    {
        if (this.nodes[i].urlSimilarity < this.urls.min)
        {
            this.urls.min = this.nodes[i].urlSimilarity;
        }

        if (this.nodes[i].urlSimilarity > this.urls.max)
        {
            this.urls.max = this.nodes[i].urlSimilarity;
        }

        if (this.nodes[i].titleSimilarity < this.titles.min)
        {
            this.titles.min = this.nodes[i].titleSimilarity;
        }

        if (this.nodes[i].titleSimilarity > this.titles.max)
        {
            this.titles.max = this.nodes[i].titleSimilarity;
        }
    }

};