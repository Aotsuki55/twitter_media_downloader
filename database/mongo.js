exports.getConnection = function(conf) {
	var mongo = require('mongodb').MongoClient;
	var url = 'mongodb://' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.database;
	var obj = new Object({
		client: mongo,
		url: url
	});
	return obj;
}

exports.connect = function(obj, callback) {
	obj.client.connect(obj.url, function(err, db) {
		if(err) {
	  		console.log('db connection error')
	  		console.log(err)
	  		return;
	  	}
	  	console.log('db connected');
	  	callback(db);
	});
}