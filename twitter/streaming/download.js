exports.downloadMedia = function(connection) {
	return new Promise(function(resolved, rejected){
		var Nconf = require('nconf');
		var Promise = require("bluebird");
		var fs = Promise.promisifyAll(require("fs"));
		var request = require('request');
		var sql = 'update media set `is_downloaded` = 1 where `media_id_str` in ("';
		var sql2 = '")';
		var ids = []
		var promiseDownload = function(url, path, filename, media_id_str, fs, request, connection){
			return new Promise(function(resolve, reject){
				var write = fs.createWriteStream(path + '/' + filename);
				request.get(url).on('response', function (res) {
					if(res.statusCode!=200){
						console.log('statusCode: ', res.statusCode);
						console.log('content-length: ', res.headers['content-length']);
						reject();
					}
				})
				.pipe(write.on('finish',function(){
					ids.push(media_id_str);
					resolve();
				},'error',function(){
					console.log("ERROR:" + err);
					reject();
				}
				));
			})
		  };
		Nconf.use('file', {
			file: '../../config/app.json'
		});
		Nconf.load(function (err, conf) {
			if(err) throw err;
			var download_path = conf.download_path;
			connection.query('SELECT * FROM `media` WHERE `is_downloaded` = 0', function (error, results, fields) {
				var user_names = {};
				for(data in results) {
					user_names[results[data].user_id_str] = results[data].user_name.replace(/\//g, '\\') + "(" + results[data].user_id_str + ")";
				}
				fs.readdir(download_path, function(err, files){
					if (err) throw err;
					var fileId = {};
					for(var x of files){
						var id = x.match(/\(\d+\)$/);
						if(id){
							var id2 = id[0].slice(1,-1);
							fileId[id2] = x.normalize();
						}
					}
					var promises = [];
					for(user_name in user_names){
						if(fileId[user_name] == null){
							promises.push(fs.mkdirAsync(download_path + "/" +　user_names[user_name]));
						}
						else if(fileId[user_name] != user_names[user_name]){
							promises.push(fs.renameAsync(download_path + "/" + fileId[user_name], download_path + "/" + user_names[user_name]));
						}
					}
					Promise.all(promises).catch(function(err) {console.log("100:" + err);}).then(function() {
						console.log("Download start!");
						var promises2 = [];
						for(data in results){
							var ext = "";
							var url = results[data].download_url;
							var exts = url.match(/[^.]+$/);
							if(exts){
								var extss = exts[0].match(/^[^:]+/);
								if(exts) ext = extss[0];
							}
							if(ext==""){
								console.log("file extension error");
								continue;
							}
							var path = download_path + "/" + user_names[results[data].user_id_str];
							var filename = results[data].media_id_str;
							if(results[data].photo_number) filename += "-" + results[data].photo_number;
							filename += "." + ext;
							var media_id_str = results[data].media_id_str;
							promises2.push(promiseDownload(url, path, filename, media_id_str, fs, request, connection));
							// download(url, path, filename, media_id_str, fs, request, connection);
						}
						Promise.all(promises2, {concurrency: 5}).then(function() {
							return new Promise(function(resolve, reject){
								for(var x=0;x<ids.length;x++){
									if(x!=0) sql += '","';
									sql += ids[x];
								}
								sql += sql2;
								connection.query(
									sql,
									function(error,results,fields) {
										if(err){
											console.log(error);
											reject();
										}
										else resolve();
									}
								);
							});
						}).then(function() {
							if(global.endFlag){
								console.log("Download successfully!!!");
								process.exit(0);
							}
							resolved();
						});
					});
				});
			});
		});
	});
	
}

function download(url, path, filename, media_id_str, fs, request, connection) {
	var write = fs.createWriteStream(path + '/' + filename);
	request.get(url).on('response', function (res) {
		// console.log('statusCode: ', res.statusCode);
		// console.log('content-length: ', res.headers['content-length']);
	})
	.pipe(write.on('finish',function(){
		connection.query(
			'update media set ? where `media_id_str` = "' + media_id_str + '" ',
			{
				is_downloaded: 1
			},
			function(error,results,fields) {
				if(error) {
					console.log(error);
				} 
			}
		);
    }));
}