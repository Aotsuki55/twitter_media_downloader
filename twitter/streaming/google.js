const {google} = require('googleapis');
const Photos = require('googlephotos');
const readline = require('readline')

exports.getInstance = function(conf, nconf) {
	return new Promise(function(resolved, rejected){
		if(conf.refresh_token!=""){
			resolved();
		}
		else{
			const YOUR_CLIENT_ID = conf.google.CLIENT_ID;
			const YOUR_CLIENT_SECRET = conf.google.CLIENT_SECRET;
			const YOUR_REDIRECT_URL  = conf.google.REDIRECT_URL;
		
			const oauth2Client = new google.auth.OAuth2(
				YOUR_CLIENT_ID,
				YOUR_CLIENT_SECRET,
				YOUR_REDIRECT_URL
			);
		
			const scopes = [
				Photos.Scopes.APPEND_ONLY,
				Photos.Scopes.READ_ONLY,
			];
		
			const url = oauth2Client.generateAuthUrl({
				// 'online' (default) or 'offline' (gets refresh_token)
				access_type: 'offline',
				scope: scopes
			});
		
			const rl = readline.createInterface({
				input : process.stdin,
				output: process.stdout
			});
		
			console.log('右記のURLをブラウザで開いてください: ', url)
			  rl.question('表示されたコードを貼り付けてください: ', (codeUrl) => {
				code = "";
				codeUrl = decodeURIComponent(codeUrl);
				redirect=codeUrl.match(/code=[^&]+/);
				if(redirect==null) code = codeUrl;
				else code = redirect[0].substr(5);
				oauth2Client.getToken( code, (err, tokens) => {
					if(err) throw err;
					if(tokens.refresh_token!=null){
						console.log('トークンが発行されました');
						console.log(tokens)
						nconf.set('refresh_token', tokens.refresh_token);
						nconf.save();
						resolved();
					}
				});
			});	
		}
	});
}