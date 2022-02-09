exports.downloadMedia = function(connection) {
	return new Promise(function(resolved, rejected){
		const {google} = require('googleapis');
		const Photos = require('googlephotos');
		const Nconf = require('nconf');
		const Promise = require("bluebird");
		var fs = Promise.promisifyAll(require("fs"));
		var request = require('request');
		var files = [];
		var nameToIdstr = {};
		var promises2 = [];
		var promises3 = [];
		var flag1 = false;
		var sql1 = 'insert into `user` ( user_id_str , user_name , user_screen_name , updated_at ) values ';
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
					files.push({name: filename});
					nameToIdstr[filename] = media_id_str;
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
					else if(res.statusCode==404||res.statusCode==403){
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
						files.push({name: filename});
						nameToIdstr[filename] = media_id_str;
						resolve();
					}
				}));
			})
		};
		var userUpdate = function(sql){
			return new Promise(function(resolve, reject){
				if(flag1){
					connection.query(
						sql,
						function(error,results,fields) {
							if(error){
								reject(error);
							}
							else resolve();
						}
					);
				}
				else resolve();
			})
		};
		Nconf.use('file', {
			file: '../../config/app.json'
		});
		Nconf.load(function (err, conf) {
			if(err) throw err;
			const YOUR_CLIENT_ID = conf.google.CLIENT_ID;
			const YOUR_CLIENT_SECRET = conf.google.CLIENT_SECRET;
			const YOUR_REDIRECT_URL  = conf.google.REDIRECT_URL;
			const oauth2Client = new google.auth.OAuth2(
				YOUR_CLIENT_ID,
				YOUR_CLIENT_SECRET,
				YOUR_REDIRECT_URL
			);
			oauth2Client.on('tokens', (tokens) => {
				oauth2Client.setCredentials(tokens);
			});
			oauth2Client.setCredentials({
				refresh_token: conf.refresh_token
			});
			oauth2Client.getAccessToken().then(function(accessToken){
				const photos = new Photos(accessToken.token);
				var download_path = conf.download_path;
				connection.query('SELECT * FROM `media` WHERE `is_downloaded` = 0 limit 50', function (error, results, fields) {
					var count = results.length;
					console.log(results.length);
					console.log("Download start!");
					var user_names = {};
					var user_screen_names = {};
					var updated_ats = {};
					for(data in results) {
						user_names[results[data].user_id_str] = results[data].user_name;
						user_screen_names[results[data].user_id_str] = results[data].user_screen_name;
						updated_ats[results[data].user_id_str] = formatDate(results[data].saved_at);
					}
					for(user_id_str in user_names){
						if(flag1) sql1+=' , ';
						else flag1 = true;
						sql1 += '( "'+user_id_str+'" , "'+user_names[user_id_str]+'" , "'+user_screen_names[user_id_str]+'" , "'+updated_ats[user_id_str]+'" )';
					}
					sql1 += ' ON DUPLICATE KEY UPDATE user_name = VALUES(user_name), user_screen_name = VALUES(user_screen_name), updated_at = VALUES(updated_at)'
					for(let data in results){
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
						var path = download_path;
						var filename = results[data].tweet_id_str;
						if(results[data].photo_number) filename += "-" + results[data].photo_number;
						filename += "." + ext;
						var media_id_str = results[data].media_id_str;
						promises2.push(promiseDownload(url, path, filename, media_id_str, fs, request));
						// download(url, path, filename, media_id_str, fs, request, connection);
					}
					Promise.all(promises2, {concurrency: 5}).catch(function(err) {console.log("150:" + err);}).then(function(){
						if(files.length) return photos.mediaItems.uploadMultiple(null, files, download_path+"/");
					}).then(function(nameToIds){
						let sql = 'UPDATE `media` SET `is_downloaded`=2, `google_photo_id`= CASE `media_id_str` ';
						let sql2 = 'END WHERE `media_id_str` IN ("';
						let sql3 = '")';
						let flag = false;
						for(let name in nameToIds){
							sql += 'WHEN "' + nameToIdstr[name] +'" THEN "' + nameToIds[name] + '" ';
							if(flag) sql2 += '","';
							sql2 += nameToIdstr[name];
							flag = true;
						}
						sql += sql2 + sql3;
						connection.query(
							sql,
							function(error,results,fields) {
								userUpdate(sql1).catch(function(err) {console.log("250:" + err);}).then(function(){
									var removeFiles = fs.readdirSync(download_path);
									for (let file in removeFiles) {
										promises3.push(fs.unlinkAsync(download_path + "/" + removeFiles[file]));
									}
									Promise.all(promises3, {concurrency: 50}).catch(function(err) {console.log("350:" + err);}).then(function() {
										if(count != 0){
											exports.downloadMedia(connection);
										}
										else{
											console.log("Download successfully!!!");
											process.exit(0);
										}
									});
								});
							});
					}).catch(function(err) {console.log("350:" + err);});						
				});
			});
		});
	});
}

function formatDate(date) {
	var obj = new Date(Date.parse(date));
	var str = obj.getFullYear();
	str += '-';
	str += parseInt(obj.getMonth()) + 1;
	str += '-';
	str += obj.getDate();
	str += ' ';
	str += obj.getHours();
	str += ':';
	str += obj.getMinutes();
	str += ':';
	str += obj.getSeconds();
	return str;
}
