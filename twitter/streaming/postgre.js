exports.saveTweet = function(data, connection) {

	var result = connection.query(
		"insert into tweet (tweet_id, tweet_id_str, user_id, user_id_str, user_name, user_screen_name, content, created_at, is_truncated, hashtags, symbols, user_mentions, urls, medias, source, geo, coordinates, place, place_name, country_code, reply_tweet_id, reply_tweet_id_str, reply_user_id, reply_user_id_str, reply_screen_name, is_quoted, retweet_count, favorite_count, is_retweeted, is_favorited, is_sensitive, lang) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32);",
		[data.id, data.id_str, data.user.id, data.user.id_str, 
			data.user.name, data.user.screen_name, data.text, 
			data.createdAt, data.truncated, data.entities.hashtags, 
			data.entities.symbols, data.entities.user_mentions, 
			data.entities.urls, data.medias,
			data.source, data.geo, data.coordinates, data.place,
		 	data.place_name, data.country_code,
			data.in_reply_to_status_id,
			data.in_reply_to_status_id_str,
			data.in_reply_to_user_id, 
			data.in_reply_to_user_id_str, 
			data.in_reply_to_screen_name,
			data.is_quote_status,
			data.retweet_count,
			data.favorite_count,
			data.retweeted,
			data.favorited,
			data.is_sensitive,
			data.lang
		],

		function(error,result) {
			if(error) {
				console.log(error);
			} else {
				// console.log(result); 
			}
		}
	);
}
