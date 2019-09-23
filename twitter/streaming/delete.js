exports.deleteTweet = function(twitter, connection) {
	return new Promise(function(resolved, rejected){
		console.log("Start delete.");
		var Nconf = require('nconf');
		var Promise = require("bluebird");
		var fs = Promise.promisifyAll(require("fs"));
		let download_path;
		var promises1 = [];
		var mediaId = [];
		var fileId = {};
		var promiseDelete = function(url, media_id_str){
			return new Promise(function(resolve, reject){
				fs.unlink(url, function(err) {
					if(err) {
						console.log(err);
					}
					else{
						mediaId.push(media_id_str);
					}
					resolve();
				});
			});
		};
		connection.query(
			"SELECT `media_id_str`,`user_id_str`, `filename`, `status` FROM `media` WHERE `status` = -1",
			function (error, results, fields) {
				if(error){
					console.log(error);
					reject();
				}
				else {
					if(results.length!=0){
						Nconf.use('file', {
							file: '../../config/app.json'
						});
						Nconf.load(function (err, conf) {
							if(err) throw err;
							download_path = conf.download_path;
							fs.readdir(download_path, function(err, files){
								if (err) throw err;
								for(let x of files){
									let id = x.match(/\(\d+\)$/);
									if(id){
										let id2 = id[0].slice(1,-1);
										fileId[id2] = x.normalize();
									}
								}
								for(let data of results){
									let url = download_path + "/" +　fileId[data.user_id_str] + "/" + data.filename;
									promises1.push(promiseDelete(url, data.media_id_str));
								}
								Promise.all(promises1, {concurrency: 5}).catch(function(err) {console.log("150:" + err);}).then(function(){
									if(mediaId.length!=0){
										let sql = "DELETE FROM `media` WHERE `media_id_str` in ('";
										for(let i in mediaId){
											if(i!=0) sql+="','";
											sql += mediaId[i];
										}
										sql+="')";
										connection.query(
											sql, function (error, results, fields) {
												if(error){
													console.log(error);
												}
												else {
													console.log(mediaId);
													console.log("Delete successfully!!!");
													resolved();
												}
											}
										);
									}
									else{
										console.log("Delete successfully!!!");
										resolved();
									}
								});
							});
						});
					}
					else{
						console.log("Delete successfully!!!");
						resolved();
					}
				}
			}
		);
	})
}

function formatDateNow(obj) {
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
