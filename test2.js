var x = require('./test.js');
var fjs = require('functional.js');
 
 
var converter = fjs.curry(function(rate, symbol, input) {
    var output = input * rate;
    return symbol + output.toFixed(2);
});
 
var poundsToUSD = converter(1.52, "$");
var poundsToEUR = converter(1.27, "€");
 
console.log(poundsToUSD(100)); // => "€63.50" 
console.log(poundsToEUR(50)); // => "$152.00" 
 

x.createABC();