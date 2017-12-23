# 概要
kintoneとconnpassとmapbox連携カスタマイズ用のリポジトリです。
connpassからkintone関連のイベントを取得して、地図に表示します。
 - connpassから今日以降のkintoneイベントを取得してレコード登録
 - イベント開催場所の緯度経度を計算してmapboxで地図表示
 - 今月開催のイベントは色付け
 - アイコンクリックでポップアップ表示(リンククリックで詳細レコードへ遷移)
 - 2パターンの地図スタイル

詳しくは[こちら]()の記事をご覧ください。

# 手順
1. kintoneに「イベント管理(connpass & mapbox連携).zip」のアプリテンプレートをインポート
2. テンプレートからアプリ作成
3. 「map(要編集).js」の必要箇所を編集してkintoneの設定画面よりファイルをアップロード（詳細な手順は[こちら](https://jp.cybozu.help/ja/k/user/js_customize.html)を参照）
4. カレンダーボタンをクリックして、イベントデータ取得(取得データが少ない場合は「sample.csv」をインポートしても良い)

# リポジトリのファイル群
本リポジトリのファイル群は以下です。
 - イベント管理(connpass & mapbox連携).zip（kintoneに読み込むアプリテンプレート）
 - map(要編集).js（kintoneに追加するJavaScriptファイル）
 - map.css(すでにkintoneに適用済みのCSSファイル)
 - dark_style.json(mapboxに読み込む地図のスタイル)
 - light_style.json(mapboxに読み込む地図のスタイル)
 - sample.csv(kintoneに読み込むイベントのサンプルデータ)

# kintoneに設置するファイル群
kintoneの設定画面で設置するファイルは以下です。[Cybozu CDN](https://developer.cybozu.io/hc/ja/articles/202960194)を利用しています。
※アプリテンプレートを読み込むと、「map(要編集).js」ファイル以外は予め設置してあります。

## PC用のJavaScriptファイル
 - jquery.min.js(version: 3.2.1)
 - moment.min.js(version: 2.19.2)
 - moment-with-locales.min.js(version: 2.19.2)
 - sweetalert2.min.js(version: 7.0.5)
 - mapbox-gl-js(version: 0.42.0)
 - map(要編集).js

## PC用のCSSファイル
 - sweetalert2.min.css(version: 7.0.5)
 - fomt-awsome.min.css(version: 4.7.0)
 - fonts.googleapis.css
 - mapbox-gl.css(version: 0.42.0)
 - map.css
 
# 動作環境
Google Chrome Browser

# ライセンス
MIT
# kintone-mapbox
