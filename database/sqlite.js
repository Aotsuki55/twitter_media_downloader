exports.getConnection = function(conf) {
	var sqlite3 = require('sqlite3');
	return new sqlite3.Database(conf.sqlite.path);
}

exports.connect = function(connection, callback) {
	connection.serialize(function() {
		callback();
	});
}

exports.createTweetTable = function(connection, nconf) {
	var sql = 'create table tweet ('
				+ 'tweet_id integer, '
		 		+ 'tweet_id_str text, '
		 		+ 'user_id integer , '
			 	+ 'user_id_str text, '
			 	+ 'user_name text, '
			 	+ 'user_screen_name text, '
			 	+ 'content text, '
			 	+ 'created_at text, '
			 	+ 'is_truncated integer, '
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
			 	+ 'country_code text, '
			 	+ 'reply_tweet_id integer , '
			 	+ 'reply_tweet_id_str text, '
			 	+ 'reply_user_id integer , '
			 	+ 'reply_user_id_str text, '
			 	+ 'reply_screen_name text, '
			 	+ 'is_quoted integer, '
			 	+ 'retweet_count integer, '
			 	+ 'favorite_count integer, '
			 	+ 'is_retweeted integer, '
			 	+ 'is_favorited integer, '
			 	+ 'is_sensitive integer, '
			 	+ 'lang text'
			 	+ ');';

	connection.run(sql, function(err, row) {
		if(err) {
			console.log('failed to create tweet table.');
		} else {
			console.log('tweet table is successfully created.');
			nconf.set('create_table', false);
			nconf.save();
		}
	});
}