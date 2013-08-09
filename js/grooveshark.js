// Grooveshark have a cool API exposed on their page as "Grooveshark" javascript object
// In order to access it from our script, we must inject ourselves in a <script> tag
if (typeof chrome.extension != 'undefined') {
    var s = document.createElement('script');
    s.src = chrome.extension.getURL("js/grooveshark.js");
    s.onload = function() {
            this.parentNode.removeChild(this);
    };
    (document.head||document.documentElement).appendChild(s);
} else {
    window.addEventListener("load", function(){
        console.log("Grooveshark onload");

        var GroovesharkPlayer = function(gs) {
            var self = this;

            // internal functions
            function $(selector, scope) {
                return (scope || document).querySelector(selector);
            }

            function $$(selector, scope) {
                return (scope || document).querySelectorAll(selector);
            }

            var lastSong = null;
            var lastPlayState = null;
            function onSongStatus(status) {
                // ignore the loading/none statuses, it's not interesting
                if (status.status == 'loading' || status.status == 'none') {
                    return;
                }
                if (lastPlayState == null || lastPlayState != status.status) {
                    self.dispatchEvent('playState', {'state': status.status});
                    lastPlayState = status.status;
                }
                if (lastSong == null ||
                    lastSong.songName != status.song.songName ||
                    lastSong.artistName != status.song.artistName) {
                    self.dispatchEvent('songChange',
                            {'song': {'songName': status.song.songName,
                                      'artistName': status.song.artistName}});
                    lastSong = status.song;
                }
                console.log('onSongStatus');
                console.log(status);
            }
            gs.setSongStatusCallback(onSongStatus);

            // events
            var events = {
                // special event type that catches all events
                // *(type, event)
                '*': new Array(),

                // playState(event)
                // event.state: 'playing', 'paused'
                'playState': new Array(),

                // songChange(event)
                // event.song: {'songName': 'song name', 'artistName': 'artist name'}
                'songChange': new Array()
            };

            self.addEventListener = function addEventListener(type, listener) {
                events[type].push(listener);
            };
            self.removeEventListner = function removeEventListener(type, listener) {
                var index = events[type].indexOf(listener);
                if (index != -1) {
                    events[type].splice(index, 1);
                }
            };
            self.dispatchEvent = function dispatchEvent(type, eventObject) {
                console.log('Dispatching event ' + type);
                console.log(eventObject);

                for (var i=0; i<events[type].length; i++) {
                    events[type][i].call(self, eventObject);
                }
                for (var i=0; i<events['*'].length; i++) {
                    events['*'][i].call(self, type, eventObject);
                }
            };

            // exposed functions
            self.getCurrentSong = function getCurrentSong() {
                var currentSong = gs.getCurrentSongStatus();
                return {'artistName': currentSong.song.artistName,
                        'songName': currentSong.song.songName};
            }

            self.volume = function volume(value) {
                if (typeof value == 'undefined') {
                    return gs.getVolume();
                } else {
                    gs.setVolume(value);
                }
            }

            self.next = function next() {
                gs.next();
            }

            self.prev = function prev() {
                gs.previous();
            }

            self.pause = function pause() {
                gs.pause();
            }

            self.play = function play() {
                gs.play();
            }

            self.getPlaylist = function getPlaylist() {
                // No API for accessing this data :(

                var queue = $$('.queue-item');
                var playlist = new Array();

                for (var i=0; i<queue.length; i++) {
                    var song = queue[i];
                    var item = new Object();

                    item['playing'] = song.classList.contains('queue-item-active');
                    item['artist'] = $('a.artist', song).innerText;
                    item['song'] = $('a.song', song).innerText;
                    item['album_art'] = $('.album-art img', song).getAttribute('src');

                    playlist.push(item);
                }

                return playlist;
            }
        };

        var GroovyClient = function(player, server) {
            var self = this;

            var ws = new WebSocket("ws://" + server + "/ws/server");

            ws.sendJson = function sendJson(data) {
                this.send(JSON.stringify(data));
            }

            ws.onopen = function(){
                console.log("WebSocket connected");
            };

            ws.onclose = function(){
                console.log("WebSocket disconnected");
            };

            ws.onmessage = function(message){
                data = JSON.parse(message.data);
                if (data['type'] == 'call') {
                    func = player[data['call']['function']];
                    var ret = null;
                    if (typeof data['call']['arguments'] != 'undefined') {
                        ret = func.apply(player, data['call']['arguments']);
                    } else {
                        ret = func.apply(player);
                    }

                    ws.sendJson({'type': 'return', 'call': data['call'], 'value': ret});
                } else {
                    console.log("Unknown message");
                }
            };

            player.addEventListener('*', function(type, event){
                ws.sendJson({'type': 'event', 'event': {'type': type, 'data': event}});
            });
        };

        client = new GroovyClient(new GroovesharkPlayer(Grooveshark), "micro.linuxil.org");
    });
}
