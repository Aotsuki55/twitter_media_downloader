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
global.f=0;
nconf.load(function (err, conf) {
    if (err) { 
    	throw err; 
    }

    var twitterModule = require('../connect.js');
    var twitter = twitterModule.getInstance(conf);

	var dbModule = require('../../database/mysql.js');
	var connection = dbModule.getConnection(conf);

	var streamingModule = require('./updateFav.js');
	var Promise = require("bluebird");
	dbModule.connect(connection, function() {
		console.log("Start update.");
		streamingModule.updateTweet(twitter, connection);
	});
});