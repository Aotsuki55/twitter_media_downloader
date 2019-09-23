exports.updateTweet = function(twitter, connection) {
	return new Promise(function(resolved, rejected){
		var update = function(media_ids, retweet_count, favorite_count, updated_at) {
			return new Promise(function(resolve, reject){
				connection.query(
					'update media set ? where `media_id_str` in ("' + media_ids + '")',
					{
						retweet_count: retweet_count,
						favorite_count: favorite_count,
						error: null,
						updated_at: updated_at
					},
					function(error,results,fields) {
						if(error){
							console.log(error);
							resolve();
						}
						else {
							resolve();
						}
					}
				);
			});
		}
		var now = formatDateNow(new Date());
		var sql1 = 'SELECT `tweet_id_str`,`media_id_str` FROM `media` WHERE (SUBDATE("' + now + '",1) >= `updated_at` or `updated_at` is null) and `is_downloaded` = 1 limit 100';
		var sql2 = 'SELECT `tweet_id_str`,`media_id_str` FROM `media` WHERE (SUBDATE("' + now + '",1) >= `created_at` or `created_at` is null) and `is_downloaded` = 1 limit 3';
		connection.query(
			sql1,
			function (error, results, fields) {
				if(error) console.log(error);
				else {
					if(results.length==0){
						console.log("Update successfully!!!");
						// resolved();
						process.exit(0);
					}
					else{
						var ids = results.map(function (result) {return result.tweet_id_str});
						var params = {id: ids.join(',')};
						var tweet_to_media = {};
						var tweet_to_media2 = {};
						for(var result of results){
							if(tweet_to_media[result.tweet_id_str]==null) tweet_to_media[result.tweet_id_str]= result.media_id_str;
							else tweet_to_media[result.tweet_id_str]+='", "'+result.media_id_str;
							tweet_to_media2[result.tweet_id_str] = tweet_to_media[result.tweet_id_str];
						}
						console.log(tweet_to_media);
						twitter.get('statuses/lookup', params, function(error, tweets, response) {
							if(error){
								console.log(error);
								// resolved();
								process.exit(0);
							}
							else{
								var promises = [];
								for(var tweet of tweets){
									delete tweet_to_media2[tweet.id_str];
									promises.push(update(tweet_to_media[tweet.id_str], tweet.retweet_count, tweet.favorite_count, now));
								}
								Promise.all(promises, {concurrency: 1}).catch(function(err) {console.log("100:" + err);}).then(function() {
									return new Promise(function(resolve, reject){
										if(Object.keys(tweet_to_media2).length==0){
											resolve();
										}
										else{
											var error_ids = Object.values(tweet_to_media2).join('", "');
											connection.query(
												'update media set ? where `media_id_str` in ("' + error_ids + '")',
												{
													error: -404,
													updated_at: now
												},
												function(error,results,fields) {
													if(error){
														console.log(error);
														resolve();
													}
													else {
														resolve();
													}
												}
											);
										}
									});
								}).then(function() {
									if(results.length!=0){
										// process.exit(0);
										console.log("Next.");
										exports.updateTweet(twitter, connection);
									}
									else{
										console.log("Update successfully!!!");
										// resolved();
										process.exit(0);
									}
								});
							}
						});
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
