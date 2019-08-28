exports.getDir = function(connection) {
	return new Promise(function(resolved, rejected){
		var Nconf = require('nconf');
		var Promise = require("bluebird");
		var fs = Promise.promisifyAll(require("fs"));
		var request = require('request');
		var sql = 'update media set `is_downloaded` = 1 where `media_id_str` in ("';
		var sql2 = '")';
		var ids = [];
		var promises2 = [];
		var userUpdate = function(type, user_id, user_name){
			return new Promise(function(resolve, reject){
				var sql3 = "";
				var parms = {
					user_id_str: user_id,
					user_name: user_name
				};
				if(type==0){
					sql3 = 'insert into user set ?';
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
			fs.readdir(download_path, function(err, files){
				if (err) throw err;
				var fileId = {};
				var promises = [];
				for(var x of files){
					var id = x.match(/\(\d+\)$/);
					if(id){
						var id2 = id[0].slice(1,-1);
						fileId[id2] = x.normalize();
						promises.push(userUpdate(0, id2, fileId[id2]));
					}
				}
				Promise.all(promises).catch(function(err) {console.log("100:" + err);});
			});
		});
	});
	
}

exports.setFilename = function(connection) {
	connection.query(
		'SELECT * FROM `media` where `filename` is null',
		function (error, results, fields) {
			console.log(results.length);
			for(data in results){
				var ext = "";
				var url = results[data].download_url;
				var exts = url.match(/[^.]+$/);
				if(exts){
					var extss = exts[0].match(/^[^:?]+/);
					if(extss) ext = extss[0];
				}
				if(ext!=""){
					var filename = results[data].tweet_id_str;
					if(results[data].photo_number) filename += "-" + results[data].photo_number;
					filename += "." + ext;
					connection.query(
						'update media set `filename` = "' + filename + '" where `media_id_str` = "' + results[data].media_id_str +'"',
						function (error, results, fields) {
							if(error) {
								console.log(error);
							} 
						}
					);
				}
			}
		}
	);
}

exports.makeLink = function(connection) {
	var Nconf = require('nconf');
	var Promise = require("bluebird");
	var fs = Promise.promisifyAll(require("fs"));
	var childProcess = Promise.promisifyAll(require('child_process'));
	Nconf.use('file', {
		file: '../../config/app.json'
	});
	Nconf.load(function (err, conf) {
		if(err) throw err;
		var download_path = conf.download_path;
		var link_path = conf.link_path;
		fs.readdir(download_path, function(err, files){
			if (err) throw err;
			var fileId = {};
			var promisesLink = [];
			files.sort();
			var i=0;
			var first=1600;
			for(var k=0+first;k<files.length&&k<400+first;++k){
				var x=files[k];
				var id = x.match(/\(\d+\)$/);
				if(id){
					var id2 = id[0].slice(1,-1);
					fileId[id2] = x.normalize();
						++i;
						promisesLink.push(childProcess.execAsync("ln -nfs '"+download_path+"/"+fileId[id2].replace(/'/g, '\'\"\'\"\'')+"' '"+link_path+"/"+id2+"'"));
				}
			}
			Promise.all(promisesLink, {concurrency: 5}).catch(function(err) {console.log("100:" + err);}).then(function(){
				console.log(i);
			});
		});
	});
}

exports.makeLink2 = function(connection) {
	var Nconf = require('nconf');
	var Promise = require("bluebird");
	var fs = Promise.promisifyAll(require("fs"));
	var childProcess = Promise.promisifyAll(require('child_process'));
	Nconf.use('file', {
		file: '../../config/app.json'
	});
	Nconf.load(function (err, conf) {
		if(err) throw err;
		var download_path = conf.download_path;
		var link_path = conf.link_path;
		fs.readdir(download_path, function(err, files){
			if (err) throw err;
			fs.readdir(link_path, function(err2, files2){
				console.log(files.length);
				console.log(files2.length);
				if (err2) throw err2;
				var fileId = {};
				for(var x of files){
					var id = x.match(/\(\d+\)$/);
					if(id){
						var id2 = id[0].slice(1,-1);
						fileId[id2] = x.normalize();
					}
				}
				for(var x of files2){
					var id=x.normalize();
					if(fileId[id]==null){
						console.log(id);
					}
				}
			});
		});
	});
}