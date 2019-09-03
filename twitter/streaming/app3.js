var nconf = require('nconf');
nconf.use('file', {
    file: '../../config/app.json'
});
global.f=0;
nconf.load(function (err, conf) {
    if (err) { 
    	throw err; 
    }

    var twitterModule = require('../connect.js');
    var twitter = twitterModule.getInstance(conf);

	var dbModule = require('../../database/mysql.js');
	var connection = dbModule.getConnection(conf);

	var streamingModule = require('./getDir.js');
	var Promise = require("bluebird");
	dbModule.connect(connection, function() {
		console.log("Start update.");
		// streamingModule.getDir(connection);
		streamingModule.makeLink2(connection);
	});
});