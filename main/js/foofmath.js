/*
	Mostly vector math that is common for games
*/
var FoofMath = (function(){
	this.lerp = function(a, b, s){
		return b - ((b-a) * (1.0 - s));
	}

	this.distance = function(a, b, c, d){
		if(typeof c === typeof d && typeof c === 'number'){
			a = {"x" : a, "y" : b};
			b = {"x" : c, "y" : d};
		}

		d = 0;

		if(typeof a.x === typeof b.x && typeof a.x === 'number')
			d += Math.pow(b.x - a.x, 2);
		if(typeof a.y === typeof b.y && typeof a.y === 'number')
			d += Math.pow(b.y - a.y, 2);
		if(typeof a.z === typeof b.z && typeof a.z === 'number')
			d += Math.pow(b.z - a.z, 2);

		return Math.sqrt(d);
	}
	this.dot = function(a, b, c, d){
		var output = 0;

		if(typeof c === typeof d && typeof c === 'number'){
			a = {"x" : a, "y" : b};
			b = {"x" : c, "y" : d};
		}
		if(typeof a.x === typeof b.x && typeof a.x === 'number')
			output += a.x * b.x;
		if(typeof a.y === typeof b.y && typeof a.y === 'number')
			output += a.y * b.y;
		if(typeof a.z === typeof b.z && typeof a.z === 'number')
			output += a.z * b.z;

		return output;
	}

	return this;
})();