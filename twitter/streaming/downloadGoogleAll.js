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
		var nameToIds = {};
		var promises2 = [];
		var promises3 = [];
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
				var link_path = conf.link_path;
				var promiseDownload = function(path, filename, media_id_str){
					return photos.mediaItems.upload(null, filename, path+"/"+filename , null).then(function(res){
						if(res&&res.newMediaItemResults[0]){
							files.push({name: filename});
							nameToIdstr[filename] = media_id_str;
							nameToIds[filename] = res.newMediaItemResults[0].mediaItem.id;
						}
					});
				};
				connection.query('SELECT * FROM `media` WHERE `is_downloaded` = 1 limit 30', function (error, results, fields) {
					var count = results.length;
					console.log(results.length);
					console.log("Download start!");
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
						var path = link_path + "/" + results[data].user_id_str;
						var filename = results[data].tweet_id_str;
						if(results[data].photo_number) filename += "-" + results[data].photo_number;
						filename += "." + ext;
						var media_id_str = results[data].media_id_str;
						promises2.push(promiseDownload(path, filename, media_id_str));
						// download(url, path, filename, media_id_str, fs, request, connection);
					}
					Promise.all(promises2, {concurrency: 5}).catch(function(err) {console.log("150:" + err);}).then(function(){
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
								var removeFiles = fs.readdirSync(download_path);
								for (let file in removeFiles) {
									promises3.push(fs.unlinkAsync(download_path + "/" + removeFiles[file]));
								}
								Promise.all(promises3, {concurrency: 50}).catch(function(err) {console.log("250:" + err);}).then(function() {
									if(count != 0&& 0){
										exports.downloadMedia(connection);
									}
									else{
										console.log("Download successfully!!!");
										process.exit(0);
									}
								});
							}
						);
					});						
				});
			});
		});
	});
	
}
