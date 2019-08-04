exports.saveTweet = function(data, db) {
	
	var medias = null;
	if(data.extended_entities != null) {
		medias = data.extended_entities;
	}

	var collection = db.collection('tweet');
	collection.insert(
		{
			tweet_id: data.id,
			tweet_id_str: data.id_str,
			user_id: data.user.id,
			user_id_str: data.user.id_str,
			user_name: data.user.name,
			user_screen_name: data.user.screen_name,
			content: data.text,
			created_at: data.createdAt,
			is_truncated: data.truncated,
			hashtags: data.entities.hashtags,
			symbols: data.entities.symbols,
			user_mentions: data.entities.user_mentions,
			urls: data.entities.urls,
			medias: medias,
			source: data.source,
			geo: data.geo,
			coordinates: data.coordinates,
			place: data.place,
			place_name: data.place_name,
			country_code: data.country_code,
			reply_tweet_id: data.in_reply_to_status_id,
			reply_tweet_id_str: data.in_reply_to_status_id_str,
			reply_user_id: data.in_reply_to_user_id,
			reply_user_id_str: data.in_reply_to_user_id_str,
			reply_screen_name: data.in_reply_to_screen_name,
			is_quoted: data.is_quote_status,
			retweet_count: data.retweet_count,
			favorite_count: data.favorite_count,
			is_retweeted: data.retweeted,
			is_favorited: data.favorited,
			is_sensitive: data.is_sensitive,
			lang: data.lang
		}
	), function(err, result) {
		if(err) {
			console.log(err);
		} 
	};
}
