var nconf = require('nconf');
nconf.use('file', {
    file: '../../config/app.json'
});
global.f=0;
nconf.load(function (err, conf) {
	if (err) throw err; 
	
	var googleModule = require('./google.js');
    var twitterModule = require('../connect.js');
    var twitter = twitterModule.getInstance(conf);

	var dbModule = require('../../database/mysql.js');
	var connection = dbModule.getConnection(conf);

	var downloadModule = require('./downloadGoogleAll.js');
	dbModule.connect(connection, function() {
		googleModule.getInstance(conf, nconf).then(function(){
			downloadModule.downloadMedia(connection);
		});
	});
});