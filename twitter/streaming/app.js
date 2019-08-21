var nconf = require('nconf');
nconf.use('file', {
    file: '../../config/app.json'
});
nconf.load(function (err, conf) {
    if (err) { 
    	throw err; 
    }

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
		streamingModule.getTweet2(twitter, connection, "mysql", null).then(function(){
			
			var downloadModule = require('./download.js');
			console.log("Start downloadMedia.");
			downloadModule.downloadMedia(connection);
		});
	});
});