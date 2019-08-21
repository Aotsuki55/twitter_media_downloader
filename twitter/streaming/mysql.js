exports.saveTweet = function(data, connection) {
	var result = connection.query(
		"insert into tweet set ?" ,
		{
			tweet_id: BigInt(data.id), 
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
			// medias: data.medias,
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
			lang: data.lang,
			saved_at: data.updatedAt,
			updated_at: data.updatedAt
		},
		function(error,results,fields) {
			if(error && error.code!="ER_DUP_ENTRY") {
				console.log(error);
			} 
			else{
				saveMedia(data, connection);
			}
		}
	);
}

function saveMedia(data, connection) {
	for(var i=0;i<data.extended_entities.media.length;i++){
		var photo_number = data.extended_entities.media.length==1 ? null : i+1;
		var media = data.extended_entities.media[i];
		if(media.type=="video"||media.type=="animated_gif"){
			var video_bitrate = -1;
			for(var j=0;j<media.video_info.variants.length;j++){
				if(video_bitrate==-1||(media.video_info.variants[j].bitrate!=null&&media.video_info.variants[j].bitrate>video_bitrate)){
					media.video_info.video_bitrate = media.video_info.variants[j].bitrate;
					media.video_info.video_content_type = media.video_info.variants[j].content_type;
					media.video_info.video_url = media.video_info.variants[j].url;
					video_bitrate = media.video_info.variants[j].bitrate!=null?media.video_info.variants[j].bitrate:-1;
				}
			}
			media.download_url = media.video_info.video_url;
		}
		else{
			media.download_url = media.media_url + ":large";
		}
		connection.query(
			"insert into media set ?" ,
			{
				media_id: media.id,
				media_id_str: media.id_str,
				download_url: media.download_url,
				photo_number: photo_number,

				tweet_id: BigInt(data.id), 
				tweet_id_str: data.id_str,
				user_id: data.user.id, 
				user_id_str: data.user.id_str, 
				user_name: data.user.name,
				user_screen_name: data.user.screen_name,
				content: data.text, 
				created_at: data.createdAt,
				retweet_count: data.retweet_count,
				favorite_count: data.favorite_count,
				is_sensitive: data.is_sensitive,
				lang: data.lang,

				indices: media.indices!=null?JSON.stringify(media.indices):null,
				media_url: media.media_url,
				media_url_https: media.media_url_https,
				url: media.url,
				display_url: media.display_url,
				expanded_url: media.expanded_url,
				type: media.type,
				size: media.size!=null?JSON.stringify(media.size):null,
				aspect_ratio: (media.video_info!=null&&media.video_info.aspect_ratio!=null)?JSON.stringify(media.video_info.aspect_ratio):null,
				duration_millis: media.video_info!=null?media.video_info.duration_millis:null,
				variants: (media.video_info!=null&&media.video_info.variants!=null)?JSON.stringify(media.video_info.variants):null,
				video_bitrate: media.video_info!=null?media.video_info.video_bitrate:null,
				video_content_type: media.video_info!=null?media.video_info.video_content_type:null,
				video_url: media.video_info!=null?media.video_info.video_url:null,
				additional_media_info: media.additional_media_info!=null?JSON.stringify(media.additional_media_info):null,

				saved_at: data.updatedAt,
				updated_at: data.updatedAt,
				is_downloaded: 0
			},
			function(error,results,fields) {
				if(error && error.code!="ER_DUP_ENTRY") {
					console.log(error);
				} 
			}
		);
	}
}

exports.saveDate = function(data, connection) {

	var result = connection.query(
		'SELECT * FROM `user` WHERE `user_id_str` = "' + data.user.id_str + '" ',
		function (error, results, fields) {
			if(error) {
				console.log(error);
			}
			else if(results.length==null||results.length==0){
				var result2 = connection.query(
					"insert into tweet set ?",
					{
						user_id: data.user.id, 
						user_id_str: data.user.id_str, 
						user_name: data.user.name,
						user_screen_name: data.user.screen_name,
						oldestId: data.id,
						oldestId_str: data.id_str,
						newestId: data.data.id,
						newestId_str: data.data.id_str,
						oldestDate: data.createdAt,
						newestDate: data.createdAt,
						updated_at: data.createdAt
					},
					function(error,results,fields) {
						if(error) {
							console.log(error);
						}
					}
				);
			}
			else{
				if(results.oldestId_str.length>data.user.id_str.length||(results.oldestId_str.length==data.user.id_str.length&&results.oldestId_str>data.user.id_str)){
					var result3 = connection.query(
						'update user set ? where `user_id_str` = "' + data.user.id_str + '" ',
						{
							oldestId: data.id,
							oldestId_str: data.id_str,
							oldestDate: data.createdAt
						},
						function(error,results,fields) {
							if(error) {
								console.log(error);
							} 
						}
					);
				}
				if(results.newestId_str.length<data.user.id_str.length||(results.newestId_str.length==data.user.id_str.length&&results.newestId_str<data.user.id_str)){
					var result4 = connection.query(
						'update user set ? where `user_id_str` = "' + data.user.id_str + '" ',
						{
							newestId: data.id,
							newestId_str: data.id_str,
							newestDate: data.createdAt
						},
						function(error,results,fields) {
							if(error) {
								console.log(error);
							} 
						}
					);
				}
			}
	});
}

/*
id
id_str
media_url
media_url_https
url
display_url
expanded_url
sizes
type
indices
video_info
duration_millis
variants


[{
	"id":1100762679835119600,
	"id_str":"1100762679835119616",
	"indices":[10,33],
	"media_url":"http://pbs.twimg.com/tweet_video_thumb/D0ax00GUUAAhOU7.jpg",
	"media_url_https":"https://pbs.twimg.com/tweet_video_thumb/D0ax00GUUAAhOU7.jpg",
	"url":"https://t.co/visrnv7PyD","display_url":"pic.twitter.com/visrnv7PyD",
	"expanded_url":"https://twitter.com/azuma_m/status/1100762689649823744/photo/1",
	"type":"animated_gif",
	"sizes":{
		"thumb":{"w":150,"h":150,"resize":"crop"},
		"medium":{"w":600,"h":716,"resize":"fit"},
		"large":{"w":600,"h":716,"resize":"fit"},
		"small":{"w":570,"h":680,"resize":"fit"}
	},
	"video_info":{
		"aspect_ratio":[150,179],
		"variants":[{
			"bitrate":0,
			"content_type":"video/mp4",
			"url":"https://video.twimg.com/tweet_video/D0ax00GUUAAhOU7.mp4"
		}]
	}
}]


[{
	"id":1094198343104815100,
	"id_str":"1094198343104815111",
	"indices":[21,44],
	"media_url":"http://pbs.twimg.com/media/Dy9fmIKVYAcQTRL.jpg",
	"media_url_https":"https://pbs.twimg.com/media/Dy9fmIKVYAcQTRL.jpg",
	"url":"https://t.co/vnKvbMHuDR",
	"display_url":"pic.twitter.com/vnKvbMHuDR",
	"expanded_url":"https://twitter.com/RikuAotsuki/status/1094199054311931904/photo/1",
	"type":"photo",
	"sizes":{
		"small":{"w":510,"h":680,"resize":"fit"},
		"thumb":{"w":150,"h":150,"resize":"crop"},
		"medium":{"w":900,"h":1200,"resize":"fit"},
		"large":{"w":1536,"h":2048,"resize":"fit"}
	}
}]


[{
	"id":1102190459521163265,
	"id_str":"1102190459521163265",
	"indices":[87,110],
	"media_url":"http://pbs.twimg.com/ext_tw_video_thumb/1102190459521163265/pu/img/rY9o3NyaeMkwWGZo.jpg",
	"media_url_https":"https://pbs.twimg.com/ext_tw_video_thumb/1102190459521163265/pu/img/rY9o3NyaeMkwWGZo.jpg",
	"url":"https://t.co/cxa0x8qtRh",
	"display_url":"pic.twitter.com/cxa0x8qtRh",
	"expanded_url":"https://twitter.com/palmie_oekaki/status/1102191293180989440/video/1",
	"type":"video",
	"sizes":{
		"thumb":{"w":150,"h":150,"resize":"crop"},
		"medium":{"w":1200,"h":675,"resize":"fit"},
		"small":{"w":680,"h":383,"resize":"fit"},
		"large":{"w":1280,"h":720,"resize":"fit"}
	},
	"video_info":{
		"aspect_ratio":[16,9],
		"duration_millis":60060,
		"variants":[{
			"bitrate":832000,
			"content_type":"video/mp4",
			"url":"https://video.twimg.com/ext_tw_video/1102190459521163265/pu/vid/640x360/sY_xygjs0mHrxGxR.mp4?tag=6"
		},{
			"bitrate":256000,
			"content_type":"video/mp4",
			"url":"https://video.twimg.com/ext_tw_video/1102190459521163265/pu/vid/320x180/SOHb0b9UaiORP51-.mp4?tag=6"
		},{
			"bitrate":2176000,
			"content_type":"video/mp4",
			"url":"https://video.twimg.com/ext_tw_video/1102190459521163265/pu/vid/1280x720/TqMpj_ZlbYo2c5Y4.mp4?tag=6"
		},{
			"content_type":"application/x-mpegURL",
			"url":"https://video.twimg.com/ext_tw_video/1102190459521163265/pu/pl/YlBkcs54QstfJ8sm.m3u8?tag=6"
		}]
	},
	"additional_media_info":{"monetizable":false}
}]

*/