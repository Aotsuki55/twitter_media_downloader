exports.saveTweet = function(data, connection) {

	var result = connection.run(
		"insert into tweet (tweet_id, tweet_id_str, user_id, user_id_str, user_name, user_screen_name, content, created_at, is_truncated, hashtags, symbols, user_mentions, urls, medias, source, geo, coordinates, place, place_name, country_code, reply_tweet_id, reply_tweet_id_str, reply_user_id, reply_user_id_str, reply_screen_name, is_quoted, retweet_count, favorite_count, is_retweeted, is_favorited, is_sensitive, lang) "
		+ "values ($tweet_id, $tweet_id_str, $user_id, $user_id_str, $user_name, $user_screen_name, $content, $created_at, $is_truncated, $hashtags, $symbols, $user_mentions, $urls, $medias, $source, $geo, $coordinates, $place, $place_name, $country_code, $reply_tweet_id, $reply_tweet_id_str, $reply_user_id, $reply_user_id_str, $reply_screen_name, $is_quoted, $retweet_count, $favorite_count, $is_retweeted, $is_favorited, $is_sensitive, $lang);",
		{
			$tweet_id: data.id,
			$tweet_id_str: data.id_str,
			$user_id: data.user.id,
			$user_id_str: data.user.id_str,
			$user_name: data.user.name,
			$user_screen_name: data.user.screen_name,
			$content: data.text,
			$created_at: data.createdAt,
			$is_truncated: data.truncated,
			$hashtags: data.entities.hashtags,
			$symbols: data.entities.symbols,
			$user_mentions: data.entities.user_mentions,
			$urls: data.entities.urls,
			$medias: data.medias,
			$source: data.source,
			$geo: data.geo,
			$coordinates: data.coordinates,
			$place: data.place,
			$place_name: data.place_name,
			$country_code: data.country_code,
			$reply_tweet_id: data.in_reply_to_status_id,
			$reply_tweet_id_str: data.in_reply_to_status_id_str,
			$reply_user_id: data.in_reply_to_user_id,
			$reply_user_id_str: data.in_reply_to_user_id_str,
			$reply_screen_name: data.in_reply_to_screen_name,
			$is_quoted: data.is_quote_status,
			$retweet_count: data.retweet_count,
			$favorite_count: data.favorite_count,
			$is_retweeted: data.retweeted,
			$is_favorited: data.favorited,
			$is_sensitive: data.is_sensitive,
			$lang: data.lang
		}
	);
}
