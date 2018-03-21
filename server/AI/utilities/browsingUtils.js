/*****
	Browsing utilities
*****/

/*
	Removes the http:// and/or wwww. from a URL
*/
cleanURL = function(url){
    
    //Remove http/https protocol
    var strippedURL = url.replace(/^https?\:\/\//i, "");

    //Remove www or www2,www3, etc
    strippedURL = strippedURL.replace(/^www\d*?\.]?/, "");

    return strippedURL;
}

/*
	Returns the remainder from a URL stripped from its domain
*/