exports.getInstance = function(conf) {
	var twitter = require('twitter');
	var tw = new twitter({
	  consumer_key: conf.twitter.consumer_key,
	  consumer_secret: conf.twitter.consumer_secret,
	  access_token_key: conf.twitter.access_token_key,
	  access_token_secret: conf.twitter.access_token_secret
	});
	return tw;
}

