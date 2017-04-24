//require module http
var http = require('http');

//create a fuction for request server
function request_server( req, res ){

	var body = 'Thanks, you are connected !!!'; //see the string on the localhost to confirm the successfull connection
	var content_length = body.length; // info length body

	//Sends a response header to the request
	res.writeHead( 200,
		{
			'Content-Length': content_length,
			'Content-Type': 'text/plain'
		});
	res.end( body ); // Will end the response process 
}

//save the http process
var app = http.createServer( request_server );
var port = 8000;
app.listen( port, function(){
	console.log('Connected to localhost: ' + port);
});