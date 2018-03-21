//Convert to array if not an array (guarantee that all objects are within an array)
checkIfArray = function(object){
	if(typeof(object) !== 'undefined' && object !== null){
		if(object instanceof Array){
			return object;
		}
		else{
			return [object];
		}
	}
}

isArray = function(object){
	if(object instanceof Array){
		return true;
	}
	else{
		return false;
	}
}

orderByProperty = function(prop) {
	var args = Array.prototype.slice.call(arguments, 1);
	return function (a, b) {
		var equality = b[prop] - a[prop];
		if (equality === 0 && arguments.length > 1) {
			return orderByProperty.apply(null, args)(a, b);
		}
		return equality;
	};
};