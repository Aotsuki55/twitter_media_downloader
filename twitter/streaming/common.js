exports.getTweet = function(twitter, connection, driver, db) {
	twitter.stream('statuses/sample', function(stream) {
	 	stream.on('data', function (data) {
	  		// if(data.lang == 'ja') {
    			var databaseClientModule = require('./' + driver + '.js');
    			if(driver != 'mongo') {
 					databaseClientModule.saveTweet(formatTweet(data), connection);
 				} else {
 					databaseClientModule.saveTweet(formatTweet(data), db);
 				}
			// }
	  	});
	});
}

exports.getTweet2 = function(twitter, connection, driver, db) {
	return new Promise(function(resolved, rejected){
		let since_id_str = "";
		connection.query(
			'SELECT * FROM `updateId`',
			function (error, results, fields) {
				if(error) console.log(error);
				else since_id_str=results[0].newestId_str;
				if(since_id_str!=""){
					var x=since_id_str.length-1;
					since_id_str[x]--;
					for(;x>=0;x--){
						if(since_id_str[x]!=('0'-1)) break;
						since_id_str[x] = '9';
					}
				}
				getTimeline(resolved, rejected, twitter, connection, since_id_str);
			}
		);
	})
}

function getTimeline(resolved, rejected, twitter, connection, since_id_str, max_id_str = "", new_since_id = null, new_since_id_str = "", new_Date = null){
	console.log("max_id_str: " + max_id_str);
	var databaseClientModule = require('./mysql.js');
	let new_max_id_str = "";
	let params = {count: 200};
	if(since_id_str!="") params.since_id = since_id_str;
	if(max_id_str!="") params.max_id = max_id_str;
	twitter.get('statuses/home_timeline', params, function(error, tweets, response) {
		// console.log(tweets);
		if(error){
			console.log(error);
		}
		else{
			var flag = false;
			for(data in tweets) {
				if(!judgeString(since_id_str,tweets[data].id_str)){
					console.log("end: "+tweets[data].id_str);
					flag = true;
					break;
				}
				if(tweets[data].extended_entities) {
					if(tweets[data].retweeted_status!=null){
						databaseClientModule.saveTweet(formatTweet(tweets[data].retweeted_status), connection);
					}
					else{
						databaseClientModule.saveTweet(formatTweet(tweets[data]), connection);
					}
				}
				
				if(judgeString(new_since_id_str, tweets[data].id_str)){
					new_since_id = BigInt(tweets[data].id);
					new_since_id_str = tweets[data].id_str;
					new_Date = formatDate(tweets[data].created_at);
				}
				if(new_max_id_str==""||judgeString(tweets[data].id_str, new_max_id_str)){
					new_max_id_str = tweets[data].id_str;
				}
			}
			if(flag || max_id_str==new_max_id_str||tweets.length==0){
				if(new_since_id_str!=""){
					connection.query(
						'update updateId set ?',
						{
							newestId: new_since_id,
							newestId_str: new_since_id_str,
							newestDate: new_Date,
							updated_at: new_Date
						},
						function(error,results,fields) {
							if(error) {
								console.log(error);
							}
							else {
								global.endFlag = 1;
								resolved();
							}
						}
					);
				}
			}
			else{
				if(tweets.length!=0) getTimeline(resolved, rejected, twitter, connection, since_id_str, new_max_id_str, new_since_id, new_since_id_str, new_Date);
			}
		}
	});
}

function formatTweet(data) {
	data.createdAt = formatDate(data.created_at);

	if(data.entities.hashtags.length != 0) {
		data.entities.hashtags = JSON.stringify(data.entities.hashtags);
	} else {
		data.entities.hashtags = null;
	}

	if(data.entities.symbols.length != 0) {
		data.entities.symbols = JSON.stringify(data.entities.symbols);
	} else {
		data.entities.symbols = null;
	}

	if(data.entities.user_mentions.length != 0) {
		data.entities.user_mentions = JSON.stringify(data.entities.user_mentions);
	} else {
		data.entities.user_mentions = null;
	}

	if(data.entities.urls.length != 0) {
		data.entities.urls = JSON.stringify(data.entities.urls);
	} else {
		data.entities.urls = null;
	}

	if(data.extended_entities != undefined) {
		data.medias = JSON.stringify(data.extended_entities.media);
	} else {
		data.medias = null;
	}

	if(data.geo != null) {
		data.geo = JSON.stringify(data.entities.geo);
	} 
	if(data.coordinates != null) {
		data.coordinates = JSON.stringify(data.entities.coordinates);
	}
	if(data.place != null) {
		data.place_name = data.place.full_name;
		data.country_code = data.place.country_code;
		data.place = JSON.stringify(data.place);
	} else {
		data.place_name = null;
		data.country_code = null;
	}

	if(data.possibly_sensitive != undefined) {
		data.is_sensitive = false;
	}

	return data;
}

function formatDate(date) {
	var obj = new Date(Date.parse(date));
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

function judgeString(first, second) {
	return (first.length<second.length||(first.length==second.length&&first<second));
}
