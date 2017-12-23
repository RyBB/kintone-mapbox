jQuery.noConflict();
(function($) {
    'use strict';

    // connpassからイベント取得する関数
    const getEvents = () => {
        if (document.getElementById('button') !== null) {
            return;
        }

        const $button = $(
            '<button class="button" id="button" title="connpassからkinotneイベント取得"><i class="fa fa-calendar" aria-hidden="true"></i>'
        );
        $(kintone.app.getHeaderMenuSpaceElement()).append($button);

        $button.click(() => {
            return new kintone.Promise((resolve, reject) => {
                const url = 'http://connpass.com/api/v1/event/?keyword=kintone&count=100';
                return kintone.proxy(url, 'GET', {}, {}).then((args) => {
                    if (args[1] !== 200) {
                        return event;
                    }
                    resolve(JSON.parse(args[0]));
                }, (error) => {
                    event.error = error;
                    resolve(event);
                });
            }).then((resp) => {
                // connpassでの取得件数が0件のとき
                if (resp['events'].length < 1) {
                    event.error = '検索結果が0件でした';
                    return event;
                }

                // 今日以降のイベントを絞り込み新たに配列作成
                const today = moment().format('YYYY-MM-DD');
                const body = resp['events'].filter((data) => {
                    return data.started_at >= today;
                });

                // 今日以降のイベントが0件のとき
                if (body.length === 0) {
                    swal({
                        title: '今日以降のkintone関連のイベントはありません',
                        type: 'info'
                    });
                    return event;
                }

                // kintoneへ登録用のデータ配列作成
                let post = [];
                return body.reduce((promise, formatedData) => {
                    return promise.then(() => {
                        const getRecords = {
                            'app': kintone.app.getId(),
                            'query': 'url =' + '"' + formatedData.event_url + '"'
                        };
                        return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', getRecords).then((getResp) => {
                            if (getResp.records.length === 0) {
                                const records = {
                                    'title': {
                                        'value': formatedData.title
                                    },
                                    'start': {
                                        'value': formatedData.started_at
                                    },
                                    'end': {
                                        'value': formatedData.ended_at
                                    },
                                    'url': {
                                        'value': formatedData.event_url
                                    },
                                    'address': {
                                        'value': formatedData.address
                                    },
                                    'place': {
                                        'value': formatedData.place
                                    },
                                    'lat': {
                                        'value': formatedData.lat
                                    },
                                    'lon': {
                                        'value': formatedData.lon
                                    }
                                };
                                post.push(records);
                                return post;
                            }
                        });
                    });
                }, Promise.resolve()).then(() => {
                    const postRecords = {
                        'app': kintone.app.getId(),
                        'records': post
                    };

                    return kintone.api(kintone.api.url('/k/v1/records', true), 'POST', postRecords).then((putResp) => {
                        if (post.length > 0) {
                            swal({
                                title: 'kintone関連イベントの取得が完了しました！' + post.length + '件',
                                text: '画面を更新します',
                                type: 'success'
                            }).then(() => {
                                return location.reload();
                            });
                        } else if (post.length === 0) {
                            swal({
                                title: '新規に追加されたkintone関連イベントはありません',
                                type: 'info'
                            });
                        }
                    }, (error) => {
                        event.error = error;
                        return event;
                    });
                });
            }).catch((error) => {
                event.error = 'エラーが発生しました';
                return event;
            });
        });
    };

    // mapboxで地図表示する関数
    const showMap = (records, appId, domain, token, styleStandard) => {
        if (!records || !records.length) {
            document.getElementById('map').innerHTML = '表示するレコードがありません';
            return;
        }
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
            container: 'map',
            style: styleStandard,
            center: [137.6850225, 38.258595],
            zoom: 6
        });

        // 地図にピン打ちするデータ作成
        const today = moment().format('YYYY-MM');
        let thisMonthEvents = [];
        const features = records.map((record) => {
            const date = moment(record.start.value).format('YYYY-MM');
            const link = 'https://' + domain + '.cybozu.com/k/' + appId + '/show#record=' + record.$id.value;

            // 今月のイベントデータ
            if (date === today) {
                const feature = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(record.lon.value), parseFloat(record.lat.value)]
                    },
                    properties: {
                        title: '<a href=' + link + '>' + record.title.value + '</a>',
                        description: record.address.value,
                        icon: 'thisMonth'
                    }
                };
                thisMonthEvents.push(1);
                return feature;

            // 今月以外のイベントデータ
            } else if (date !== today) {
                const feature = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(record.lon.value), parseFloat(record.lat.value)]
                    },
                    properties: {
                        title: '<a href=' + link + '>' + record.title.value + '</a>',
                        description: record.address.value,
                        icon: 'notThisMonth'
                    }
                };
                return feature;
            }
        });

        // 地図ナビゲーションコントローラの追加
        map.addControl(new mapboxgl.NavigationControl());

        // データ作成
        const geojson = {
            type: 'FeatureCollection',
            features: features
        };

        const $notation = $(
            '<p>今月開催予定のイベントは<b>' + thisMonthEvents.length + '</b>件です📍</p>' +
            '<p>赤色が今月、黒色が今月以外のイベントです</p>'
        ).css('padding-left', '20px').css('padding-top', '0px');
        $(kintone.app.getHeaderSpaceElement()).append($notation);

        // マーカーを地図に追加
        geojson.features.forEach(function(marker) {
            if (isNaN(marker.geometry.coordinates[0]) || isNaN(marker.geometry.coordinates[1])) {
                return;
            }

            // HTML要素の作成
            const elThisMonth = document.createElement('div');
            const el = document.createElement('div');
            if (marker.properties.icon === 'thisMonth') {
                el.className = 'marker-this-month';
            } else if (marker.properties.icon === 'notThisMonth') {
                el.className = 'marker';
            }
            // マーカー要素を作成
            new mapboxgl.Marker(elThisMonth)
                .setLngLat(marker.geometry.coordinates)
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML('<h3><b>' + marker.properties.title + '</b></h3><p>' + marker.properties.description + '</p>'))
                .addTo(map);

            new mapboxgl.Marker(el)
                .setLngLat(marker.geometry.coordinates)
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML('<h3><b>' + marker.properties.title + '</b></h3><p>' + marker.properties.description + '</p>'))
                .addTo(map);
        });
    };

    // mapboxで分布図を作成する関数
    const showChoroplethMap = (records, appId, domain, token, styleChoropleth) => {
        if (!records || !records.length) {
            document.getElementById('map').innerHTML = '表示するレコードがありません';
            return;
        }

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
            container: 'map',
            style: styleChoropleth,
            center: [137.6850225, 38.258595],
            zoom: 6
        });

        // 地図にピン打ちするデータ作成
        const features = records.map((record) => {
            const link = 'https://' + domain + '.cybozu.com/k/' + appId + '/show#record=' + record.$id.value;

            const feature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(record.lon.value), parseFloat(record.lat.value)]
                },
                properties: {
                    title: '<a href=' + link + '>' + record.title.value + '</a>',
                    description: record.address.value
                }
            };
            return feature;
        });

        // 地図ナビゲーションコントローラの追加
        map.addControl(new mapboxgl.NavigationControl());

        // データ作成
        const geojson = {
            type: 'FeatureCollection',
            features: features
        };

        // マーカーを地図に追加
        geojson.features.forEach(function(marker) {
            if (isNaN(marker.geometry.coordinates[0]) || isNaN(marker.geometry.coordinates[1])) {
                return;
            }

            // HTML要素の作成
            const el = document.createElement('div');
            el.className = 'marker-choropleth';

            // マーカー要素を作成
            new mapboxgl.Marker(el)
                .setLngLat(marker.geometry.coordinates)
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML('<h3><b>' + marker.properties.title + '</b></h3><p>' + marker.properties.description + '</p>'))
                .addTo(map);
        });
    };

    // イベント処理 ※書き換え必要箇所
    kintone.events.on('app.record.index.show', (event) => {
        const records = event.records;
        const appId = kintone.app.getId();
        const domain = '×××'; // サブドメイン名を記入
        const token = '×××'; // mapboxで作成したStyleのAccess tokenを記入
        const styleStandard = 'mapbox://styles/×××/×××'; // mapboxで作成したStyleのURLを記入
        const styleChoropleth = 'mapbox://styles/×××/×××'; // mapboxで作成したStyleのURLを記入

        // connpassからのイベント取得
        getEvents();

        // mapboxで地図表示
        if (event.viewName === '地図') {
            showMap(records, appId, domain, token, styleStandard);
        }

        // mapboxでコロプレス地図表示
        if (event.viewName === '分布地図') {
            showChoroplethMap(records, appId, domain, token, styleChoropleth);
        }
    });
})(jQuery);
