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

            // exposed functions
            self.getCurrentSong = function getCurrentSong() {
                var currentSong = gs.getCurrentSongStatus();
                return currentSong.song.artistName + " - " + currentSong.song.songName;
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
                    if (typeof data['call']['arguments'] != undefined) {
                        ret = func.apply(player, data['call']['arguments']);
                    } else {
                        ret = func.apply(player);
                    }

                    ws.sendJson({'type': 'return', 'call': data['call'], 'value': ret});
                } else {
                    console.log("Unknown message");
                }
            };
        };

        client = new GroovyClient(new GroovesharkPlayer(Grooveshark), "localhost:8888");
    });
}
