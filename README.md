# TwitterMediaDownloader
TimeLineに流れている画像を収集します  
[TweetMediaViewer](https://github.com/Aotsuki55/TweetMediaViewer)とあわせて使って下さい  

## 動作環境
Node.js 10.14.0  
MySQL 14.14

## 初期設定
以下を実行
```
npm install
cp config/app.json.example config/app.json
```
config/app.jsonを自身の環境にあわせ書き換え   
databaseを作成

## 使い方
### tweet情報取得/画像ダウンロード
cron等を用いて約5分おきに実行することを想定しています  
```
cd twitter/streaming
node app.js
```

### tweet情報更新
cron等を用いて約15分おきに実行することを想定しています  
```
cd twitter/streaming
node app2.js
```
