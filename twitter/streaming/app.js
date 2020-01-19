var nconf = require('nconf');
nconf.use('file', {
    file: '../../config/app.json'
});
console.log("");
console.log("");
console.log("///////////////////////////////////////");
var obj = new Date();
var str = obj.getFullYear();
str += '-';
str += ('0' + (parseInt(obj.getMonth()) + 1)).slice(-2);
str += '-';
str += ('0' + obj.getDate()).slice(-2);
str += ' ';
str += ('0' + obj.getHours()).slice(-2);
str += ':';
str += ('0' + obj.getMinutes()).slice(-2);
str += ':';
str += ('0' + obj.getSeconds()).slice(-2);
console.log(str);
nconf.load(function (err, conf) {
	if (err) throw err; 
	
	var googleModule = require('./google.js');
    var twitterModule = require('../connect.js');
    var twitter = twitterModule.getInstance(conf);

	var dbModule = require('../../database/mysql.js');
	var connection = dbModule.getConnection(conf);

	var streamingModule = require('./common.js');
	var Promise = require("bluebird");
	dbModule.connect(connection, function() {
		if(conf.create_table) dbModule.createTweetTable(connection, nconf);
		if(conf.create_media_table) dbModule.createMediaTable(connection, nconf);
		if(conf.create_updateId_table) dbModule.createUpdateIdTable(connection, nconf);
		googleModule.getInstance(conf, nconf).then(function(){
			streamingModule.getTweet2(twitter, connection, "mysql", null).then(function(){
			
				var downloadModule = require('./downloadGoogle.js');
				console.log("Start downloadMedia.");
				downloadModule.downloadMedia(connection);
			});

		});
	});
});