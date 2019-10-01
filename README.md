# TwitterMediaDownloader
TimeLineに流れている画像を収集します。
TweetMediaViewerとあわせて使って下さい。
https://github.com/Aotsuki55/TweetMediaViewer

## 動作環境
nodejs 10.14.0
mysql 14.14

## 使い方

### 初期設定

npm install
app.json.sampleをapp.jsonに変更し、自身の環境にあわせ書き換え。
databaseを作成。

### 実行
cd twitter/streaming
node app.js
