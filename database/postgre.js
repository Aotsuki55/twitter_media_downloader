exports.getConnection = function(conf) {
	var pg = require('pg');
	var connection = new pg.Pool({
		host: conf.postgre.host,
		user: conf.postgre.user,
		pasword: conf.postgre.password,
		database: conf.postgre.database,
		port: conf.postgre.port,
	});
	return connection;
}

exports.connect = function(connection, callback) {
	connection.connect(function(err, client, done) {
		if(err) {
			console.error('db connection error');
			console.log(err);
			return;
		}
		console.log('db connected ');
		callback();
	});
}

exports.createTweetTable = function(connection, nconf) {
	var sql = 'create table tweet ('
				+ 'tweet_id bigint, '
		 		+ 'tweet_id_str varchar(30), '
		 		+ 'user_id bigint , '
			 	+ 'user_id_str varchar(30), '
			 	+ 'user_name varchar(25), '
			 	+ 'user_screen_name varchar(16), '
			 	+ 'content text, '
			 	+ 'created_at timestamp, '
			 	+ 'is_truncated boolean, '
			 	+ 'hashtags text, '
			 	+ 'symbols text, '
			 	+ 'user_mentions text, '
			 	+ 'urls text, '
			 	+ 'medias text, '
			 	+ 'source text, '
			 	+ 'geo text, '
			 	+ 'coordinates text, '
			 	+ 'place text, '
			 	+ 'place_name text, '
			 	+ 'country_code varchar(5), '
			 	+ 'reply_tweet_id bigint , '
			 	+ 'reply_tweet_id_str varchar(30), '
			 	+ 'reply_user_id bigint , '
			 	+ 'reply_user_id_str varchar(30), '
			 	+ 'reply_screen_name varchar(16), '
			 	+ 'is_quoted boolean, '
			 	+ 'retweet_count integer, '
			 	+ 'favorite_count integer, '
			 	+ 'is_retweeted boolean, '
			 	+ 'is_favorited boolean, '
			 	+ 'is_sensitive boolean, '
			 	+ 'lang varchar(10)'
			 	+ ');';
	connection.query(sql, function (error, result) {
		if(error) {
			console.log('failed to create tweet table.');
			console.log(error);
		} else {
			console.log('tweet table is successfully created.');
			nconf.set('create_table', false);
			nconf.save();
		}
	});
}