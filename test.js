var fs = require('fs');

function FileObject(){
	this.filename = '';
	this.file_exists = function(callback){

		var self = this;

		console.log("About to open: " + self.filename);
		fs.open(
			this.filename, 'r', 
			function(err, handle){
				if(err){
					console.log("Can't open this file: " + self.filename);
					callback(err);
					return;
				}

				var buf = new Buffer(100000);
				fs.read(
					handle,buf,0,100000,null,
					function(err, length){
						if(err){
							console.log("ERROR: " + err.code + "(" + err.message +")");
							return;
						}
						console.log(buf.toString('utf8',0,length));
						fs.close(handle, function(){});
					});

			callback(null, true);
		});
	};
}

var fo = new FileObject();
fo.filename = "info.txt";

fo.file_exists(function(err,results){
	if(err){
		console.log("Aw,bummer: " + JSON.stringify(err));
		return;
	}
	console.log("File exists !!!");

});

/*
// ---------------------------------------
	
	fs.open(
		'info.txt','r',
		function(err,handle){
			if(err){
				console.log("ERROR: " + err.code + "(" + err.message +")");
				return;
			}
			var buf = new Buffer(100000);
			fs.read(
				handle,buf,0,100000,null,
				function(err,length){
					if(err){
						console.log("ERROR: " + err.code + "(" + err.message +")");
						return;
					}
					console.log(buf.toString('utf8',0,length));
					fs.close(handle,function(){
						console.log("I read file info.txt !");
					});
				}
			);
		}
	);
	// ---------------------------------------

*/