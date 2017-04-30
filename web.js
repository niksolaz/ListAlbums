//require module http
var http = require('http');

//create a fuction for request server
function request_server( req, res ){

	console.log("INCOMING REQUEST: " +  req.method + " " + req.url );
	//Sends a response header to the request
	res.writeHead( 200,
		{
			'Content-Type': 'text/json'
		});
	res.end( JSON.stringify({ error: null}) + "\n"); // Will end the response process 
}

//save the http process
var app = http.createServer( request_server );
var port = 8000;
app.listen( port, function(){
	console.log('Connected to localhost: ' + port);
});