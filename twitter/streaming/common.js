exports.getTweet = function(twitter, connection, driver, db) {
	twitter.stream('statuses/sample', function(stream) {
	 	stream.on('data', function (data) {
	  		// if(data.lang == 'ja') {
    			var databaseClientModule = require('./' + driver + '.js');
    			if(driver != 'mongo') {
 					databaseClientModule.saveTweet(formatTweet(data, new Date()), connection);
 				} else {
 					databaseClientModule.saveTweet(formatTweet(data, new Date()), db);
 				}
			// }
	  	});
	});
}

exports.getTweet2 = function(twitter, connection, driver, db) {
	return new Promise(function(resolved, rejected){
		let id = 0;
		connection.query(
			'SELECT max(id) FROM `updateId`',
			function (error, results, fields) {
				if(error) console.log(error);
				else id = results[0]['max(id)'];
				connection.query(
					'SELECT * FROM `updateId` where `id` = ' + id,
					function (error, results, fields) {
						let since_id_str = "";
						let origin_since_id_str = "";
						let max_id_str = "";
						if(error) console.log(error);
						else{
							if(results[0].since_id_str!=null)since_id_str=results[0].since_id_str;
							if(results[0].max_id_str!=null)max_id_str=results[0].max_id_str;
						}
						origin_since_id_str = since_id_str;
						if(since_id_str!=""){
							var x=since_id_str.length-1;
							since_id_str[x]--;
							for(;x>=0;x--){
								if(since_id_str[x]!=('0'-1)) break;
								since_id_str[x] = '9';
							}
						}
						getTimeline(resolved, rejected, twitter, connection, since_id_str, origin_since_id_str, max_id_str, id);
					}
				);
			}
		);
	})
}

function getTimeline(resolved, rejected, twitter, connection, since_id_str, origin_since_id_str, max_id_str, id, new_since_id = null, new_since_id_str = "", new_Date = null){
	console.log("max_id_str: " + max_id_str);
	var databaseClientModule = require('./mysql.js');
	let new_max_id_str = "";
	let mode = 0;
	let params = {count: 200};
	if(mode == 1) params.id = "2411778596";
	if(since_id_str!="") params.since_id = since_id_str;
	if(max_id_str!="") params.max_id = max_id_str;
	twitter.get(mode == 0 ? 'statuses/home_timeline' :'statuses/user_timeline', params, function(error, tweets, response) {
		// console.log(tweets);
		if(error){
			console.log(error);
			if(id == 0){
				if(max_id_str!=""){
					connection.query(
						'insert into updateId set ?',
						{
							since_id_str: origin_since_id_str,
							max_id_str: max_id_str,
							updated_at: new_Date
						},
						function(error,results,fields) {
							if(error) {
								console.log(error);
							}
							else {
								connection.query(
									'update updateId set ? where `id`=0',
									{
										since_id: new_since_id,
										since_id_str: new_since_id_str,
										since_date: new_Date,
										updated_at: new_Date
									},
									function(error,results,fields) {
										if(error) {
											console.log(error);
										}
										else {
											resolved();
										}
									}
								);
							}
						}
					);
				}
				else{
					resolved();
				}
			}
			else{
				connection.query(
					'update updateId set ? where `id`='+id,
					{
						since_id_str: origin_since_id_str,
						max_id_str: max_id_str,
						updated_at: new_Date
					},
					function(error,results,fields) {
						if(error) {
							console.log(error);
						}
						else {
							resolved();
						}
					}
				);
			}
		}
		else{
			var flag = false;
			var now = new Date();
			for(data in tweets) {
				if(!judgeString(origin_since_id_str,tweets[data].id_str)){
					console.log("end: "+tweets[data].id_str);
					flag = true;
					break;
				}
				if(tweets[data].extended_entities) {
					if(tweets[data].retweeted_status!=null){
						databaseClientModule.saveTweet(formatTweet(tweets[data].retweeted_status,now), connection);
					}
					else{
						databaseClientModule.saveTweet(formatTweet(tweets[data],now), connection);
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
			if(flag || max_id_str==new_max_id_str||tweets.length==0||tweets.length==1){
				if(id==0){
					if(new_since_id_str!=""){
						connection.query(
							'update updateId set ? where `id`='+id,
							{
								since_id: new_since_id,
								since_id_str: new_since_id_str,
								since_date: new_Date,
								updated_at: new_Date
							},
							function(error,results,fields) {
								if(error) {
									console.log(error);
								}
								else {
									resolved();
								}
							}
						);
					}
					else{
						resolved();
					}
				}
				else{
					connection.query(
						'delete from updateId where `id`='+id,
						function(error,results,fields) {
							if(error) {
								console.log(error);
							}
							else {
								resolved();
							}
						}
					);
				}
			}
			else{
				if(tweets.length!=0) getTimeline(resolved, rejected, twitter, connection, since_id_str, origin_since_id_str, new_max_id_str, id, new_since_id, new_since_id_str, new_Date);
			}
		}
	});
}

function formatTweet(data, now) {
	data.createdAt = formatDate(data.created_at);
	data.updatedAt = formatDateNow(now);
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

function judgeString(first, second) {
	return (first.length<second.length||(first.length==second.length&&first<second));
}
