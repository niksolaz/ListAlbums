//require module http
var http = require('http');
var fs = require('fs');
var url = require('url');

function load_album_list(callback){
	fs.readdir(
		"albums",
		function(err,files){

			if(err){
				callback(make_error("file_error",JSON.stringify(err)));
				return;
			}

			var only_dirs = [];

			(function iterator(index){
				if (index == files.length){
					callback(null, only_dirs);
					return;
				}

				fs.stat(
					"albums/" + files[index],
					function(err,stats){
						if(err){
							callback(make_error("file_error",JSON.stringify(err)));
							return;
						}
						if(stats.isDirectory()){
							var obj = { name: files[index] }
							only_dirs.push(obj);
						}
						iterator(index + 1);
					}
				);
			})(0);
			
		}
	);
}

function load_album(album_name,page,page_size,callback){
	fs.readdir(
		'albums/' + album_name,
		function(err,files){
			if(err){
				if(err.code == "ENOENT"){
					callback(no_such_album());
				}else{
					callback({ 
						error: "file_error",
						message: JSON.stringify(err) });
				}
				return;
			}
			var only_files = [];
			var path = "albums/" + album_name + "/";

			(function iterator(index){
				if (index == files.length){
					var ps;
					//splice non funzionerà se i parametri sono fuori dall'intervallo
					ps = only_files.splice(page * page_size, page_size);
					var obj = { 
						short_name: album_name,
						photos: ps
					};
					callback(null, obj);
					return;
				}

				fs.stat(
					path + files[index],
					function(err,stats){
						if(err){
							callback(make_error("file_error",JSON.stringify(err)));
							return;
						}
						if(stats.isFile()){
							var obj = {
								filename: files[index],
								desc: files[index]
							};
							only_files.push(obj);
						}
						iterator(index + 1);
					}
				);
			})(0);
		}
	);
}

function do_rename(old_name, new_name, callback) {
    // Rinominare la cartella album.
    fs.rename("albums/" + old_name,
              "albums/" + new_name,
              callback);
}

function handle_incoming_request( req, res ){

	//convertire i parametri della query in un oggetto e ottenere il percorso pulito
	// 2° parametro true = converte i parametri
	req.parsed_url = url.parse(req.url, true);
	var core_url = req.parsed_url.pathname;

	//console.log("INCOMING REQUEST: " +  req.method + " " + req.url );

	//test dell'url per controllare la richiesta
	if(core_url == '/albums.json'){
		handle_list_albums(req,res);
	}else if(core_url.substr(core_url.length - 12) == '/rename.json' 
		&& req.method.toLowerCase() == 'post'){	
		handle_rename_album(req,res);
	}else if(core_url.substr(0,7) == '/albums' 
		&& core_url.substr(core_url.length - 5) == '.json'){
		handle_get_album(req,res);
	}else{
		send_failure(res,404,invalid_resource());
	}
	load_album_list(function(err, albums){
		if(err){
			res.writeHead(503, {"Content-Type": "application/json"});
			res.end(JSON.stringify(err) + "\n");
			return;
		}
		var out = { error : null,
					data: { albums: albums }};
		res.writeHead(200, { "Content-Type":"application/json"});
		res.end(JSON.stringify(out) + "\n");
	});
}

function handle_list_albums(req,res){
	load_album_list(function(err,albums){
		if(err){
			send_failure(res,500,err);
			return;
		}

		send_success(res,{ albums: albums });
	});
}

function handle_get_album(req,res){
	// catturare i parametri GET
	var getp = req.parsed_url.query;
	var page_num = getp.page ? getp.page : 0;
	var page_size = getp.page_size ? getp.page_size :1000;

	if(isNaN(parseInt(page_num))) page_num = 0;
	if(isNaN(parseInt(page_size))) page_size = 1000;

	//il formato della richiesta è /albums/album_name.json
	var core_url = req.parsed_url.pathname;

	var album_name = req.url.substr(7,req.url.length - 12);
	load_album(
		album_name,
		page_num,
		page_size,
		function(err,album_contents){
			if(err && err.error == "no_such_album"){
				send_failure(res,404,err);
			}else if(err){
				send_failure(res,500,err);
			}else{
				send_success(res,{ album_name: album_contents });
			}
		});
}

function handle_rename_album(req, res) {

    // 1. Ottenere il nome dell'album dall'URL
    var core_url = req.parsed_url.pathname;
    var parts = core_url.split('/');
    if (parts.length != 4) {
        send_failure(res, 404, invalid_resource());
        return;
    }

    var album_name = parts[2];

    // ottenere i dati POST per la richiesta. Questo avrà il JSON
    // per il nuovo nome per l'album.
    var json_body = '';
    req.on('readable', () => {
        var d = req.read();
        if (d) {
            if (typeof d == 'string') {
                json_body += d;
            } else if (typeof d == 'object' && d instanceof Buffer) {
                json_body += d.toString('utf8');
            }
        }
    });

    // 3. Quando abbiamo tutti i dati di post, essere sicuri di che avere validi
    // dati e quindi provare a fare la ridenominazione.
    req.on('end', () => {
        // ottenuto un body?
        if (json_body) {
            try {
                var album_data = JSON.parse(json_body);
                if (!album_data.album_name) {
                    send_failure(res, 404, missing_data('album_name'));
                    return;
                }
            } catch (e) {
                // c'è un body ma non è un json valido
                send_failure(res, 403, bad_json());
                return;
            }

            // Rinominare!
            do_rename(album_name, album_data.album_name, (err, results) => {
                if (err && err.code == "ENOENT") {
                    send_failure(res, 403, no_such_album());
                    return;
                } else if (err) {
                    send_failure(res, 500, file_error(err));
                    return;
                }
                send_success(res, null);
            });
        } else {
            send_failure(res, 403, bad_json());
            res.end();
        }
    });
}

function make_error(err,msg){
	var e = new Error(msg);
	e.code = err;
	return e;
}

function send_success(res,data){
	res.writeHead(200,{ "Content-Type": "application/json"});
	var output = { error: null, data: data };
	res.end(JSON.stringify(output) + "\n");
}

function send_failure(res,code,err){
	var code = (err.code) ? err.code : err.name;
	res.writeHead(code,{ "Content-Type": "application/json"});
	res.end(JSON.stringify({ error: code, message: err.message }) + "\n");
}

function invalid_resource(){
	return make_error(
		"invalid_resource",
		"the request resource does not exist.");
}

function no_such_album(){
	return make_error(
		"no_such_album",
		"the specified album does not exist");
}

function bad_json() {
    return make_error("invalid_json",
                      "the provided data is not valid JSON");
}

var app = http.createServer( handle_incoming_request );
var port = 8000;
app.listen( port, function(){
	console.log('Connected to localhost: ' + port);
});