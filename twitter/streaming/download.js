exports.downloadMedia = function(connection) {
	return new Promise(function(resolved, rejected){
		var Nconf = require('nconf');
		var Promise = require("bluebird");
		var fs = Promise.promisifyAll(require("fs"));
		var childProcess = Promise.promisifyAll(require('child_process'));
		var request = require('request');
		var sql = 'update media set `is_downloaded` = 1 where `media_id_str` in ("';
		var sql2 = '")';
		var ids = [];
		var promises2 = [];
		var download = function(url, path, filename, media_id_str, fs, request, resolve, reject) {
			var write = fs.createWriteStream(path + '/' + filename);
			var f=0;
			request.get(url).on('response', function (res) {
				if(res.statusCode==200){
					f=1;
				}
				else{
					console.log('statusCode: ', res.statusCode);
					connection.query(
						'update media set `error` = ' + res.statusCode + ', `is_downloaded` = -1 where `media_id_str` = ' + media_id_str,
						function(error,results,fields) {
							if(error){
								console.log(error);
								reject();
							}
							else {
								promises2.push(fs.unlinkAsync(path + '/' + filename, (err) => {
									if (err) throw err;
									resolve();
								}));
							}
						}
					);
				}
			})
			.pipe(write.on('error', function(){
				console.log("ERROR:" + err);
				reject();
			}).on('finish', function(){
				if(f==1){
					ids.push(media_id_str);
					resolve();
				}
			}));
		}
		var promiseDownload = function(url, path, filename, media_id_str, fs, request){
			return new Promise(function(resolve, reject){
				var write = fs.createWriteStream(path + '/' + filename);
				var f=0;
				request.get(url).on('response', function (res) {
					if(res.statusCode==200){
						f=1;
					}
					else if(res.statusCode==404){
						console.log('statusCode: ' + res.statusCode + " " + url);
						var exts = url.match(/^https?:[^:?]+/);
						if(exts) url = exts[0];
						promises2.push(download(url, path, filename, media_id_str, fs, request, resolve, reject));
					}
					else{
						console.log('statusCode: ', res.statusCode);
						console.log('content-length: ', res.headers['content-length']);
						reject();
					}
				})
				.pipe(write.on('error', function(){
					console.log("ERROR:" + err);
					reject();
				}).on('finish', function(){
					if(f==1){
						ids.push(media_id_str);
						resolve();
					}
				}));
			})
		};
		var userUpdate = function(type, user_id, user_name, user_screen_name, updated_at){
			return new Promise(function(resolve, reject){
				var sql3 = "";
				var parms = {
					user_name: user_name,
					user_screen_name: user_screen_name,
					updated_at: updated_at
				};
				if(type==0){
					sql3 = 'insert into user set ?';
					parms.user_id_str = user_id;
				}
				else{
					sql3 = 'update user set ? where `user_id_str` = "' + user_id + '"';
				}
				connection.query(
					sql3, parms,
					function(error,results,fields) {
						if(error){
							console.log(error);
							reject();
						}
						else {
							resolve();
						}
					}
				);
			})
		};
		Nconf.use('file', {
			file: '../../config/app.json'
		});
		Nconf.load(function (err, conf) {
			if(err) throw err;
			var download_path = conf.download_path;
			var link_path = conf.link_path;
			connection.query('SELECT * FROM `media` WHERE `is_downloaded` = 0 limit 100', function (error, results, fields) {
				var user_names = {};
				var user_screen_names = {};
				var updated_ats = {};
				var count = results.length;
				console.log(results.length);
				for(data in results) {
					user_names[results[data].user_id_str] = results[data].user_name.replace(/\//g, '／').replace(/:/g, ';')  + "(" + results[data].user_id_str + ")";
					user_screen_names[results[data].user_id_str] = results[data].user_screen_name;
					updated_ats[results[data].user_id_str] = results[data].saved_at;
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
					var promisesUser = [];
					var promisesLink = [];
					for(user_name in user_names){
						if(fileId[user_name] == null){
							promises.push(fs.mkdirAsync(download_path + "/" +　user_names[user_name]));
							promisesUser.push(userUpdate(0, user_name, user_names[user_name], user_screen_names[user_name], updated_ats[user_name]));
							promisesLink.push(childProcess.execAsync("ln -nfs '"+download_path+"/"+user_names[user_name].replace(/'/g, '\'\"\'\"\'')+"' '"+link_path+"/"+user_name+"'"));
						}
						else if(fileId[user_name] != user_names[user_name]){
							promises.push(fs.renameAsync(download_path + "/" + fileId[user_name], download_path + "/" + user_names[user_name]));
							promisesUser.push(userUpdate(1, user_name, user_names[user_name], user_screen_names[user_name], updated_ats[user_name]));
							promisesLink.push(childProcess.execAsync("ln -nfs '"+download_path+"/"+user_names[user_name].replace(/'/g, '\'\"\'\"\'')+"' '"+link_path+"/"+user_name+"'"));
						}
					}
					Promise.all(promises).catch(function(err) {console.log("100:" + err);}).
					all(promisesUser).catch(function(err) {console.log("150:" + err);}).
					all(promisesLink).catch(function(err) {console.log("180:" + err);}).then(function() {
						console.log("Download start!");
						for(data in results){
							var ext = "";
							var url = results[data].download_url;
							var exts = url.match(/[^.]+$/);
							if(exts){
								var extss = exts[0].match(/^[^:?]+/);
								if(extss) ext = extss[0];
							}
							if(ext==""){
								console.log("file extension error");
								continue;
							}
							var path = download_path + "/" + user_names[results[data].user_id_str];
							var filename = results[data].tweet_id_str;
							if(results[data].photo_number) filename += "-" + results[data].photo_number;
							filename += "." + ext;
							var media_id_str = results[data].media_id_str;
							promises2.push(promiseDownload(url, path, filename, media_id_str, fs, request));
							// download(url, path, filename, media_id_str, fs, request, connection);
						}
						Promise.all(promises2, {concurrency: 5}).catch(function(err) {console.log("150:" + err);}).then(function() {
							console.log("Start save database.");
							return new Promise(function(resolve, reject){
								for(var x=0;x<ids.length;x++){
									if(x!=0) sql += '","';
									sql += ids[x];
								}
								sql += sql2;
								connection.query(
									sql,
									function(error,results,fields) {
										if(error){
											console.log(error);
											reject();
										}
										else resolve();
									}
								);
							});
						}).then(function() {
							if(count != 0){
								exports.downloadMedia(connection);
							}
							else{
								console.log("Download successfully!!!");
								process.exit(0);
								resolved();
							}
						});
					});
				});
			});
		});
	});
	
}
