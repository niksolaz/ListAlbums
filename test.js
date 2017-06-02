var fjs = require('functional.js');

function ABC(par){
	console.log(par);
	const add = fjs.curry((a, b) => a + b);
 
	const add3 = add(3);
	 
	console.log(add(1, 2, 3)); // => 6 
	console.log(add3(1, 2, 3, 4, 5)); // => 18 
}

exports.createABC = function(par){
	return new ABC(par);
}