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

        var GroovesharkPlayer = function() {
            var self = this;

            function $(selector) {
                return document.querySelector(selector);
            }

            function $$(selector) {
                return document.querySelectorAll(selector);
            }

            self.getCurrentSong = function getCurrentSong() {
                var currentSong = Grooveshark.getCurrentSongStatus();
                return currentSong.song.artistName + " - " + currentSong.song.songName;
            }

            self.volume = function volume(value) {
                if (typeof value == 'undefined') {
                    return Grooveshark.getVolume();
                } else {
                    Grooveshark.setVolume(value);
                }
            }

            self.next = function next() {
                Grooveshark.next();
            }

            self.prev = function prev() {
                Grooveshark.previous();
            }

            self.pause = function pause() {
                Grooveshark.pause();
            }

            self.play = function play() {
                Grooveshark.play();
            }

            self.getPlaylist = function getPlaylist() {
                // No API for accessing this data :(

                var queue = $$('.queue-item');
                var playlist = new Array();

                for (var i=0; i<queue.length; i++) {
                    var song = queue[i];
                    var item = new Object();

                    item['playing'] = song.classList.contains('queue-item-active');
                    item['artist'] = song.querySelector('a.artist').innerText;
                    item['song'] = song.querySelector('a.song').innerText;
                    item['album_art'] = song.querySelector('.album-art img').getAttribute('src');

                    playlist.push(item);
                }

                return playlist;
            }
        };

        window.GroovyPlayer = new GroovesharkPlayer();
    });
}
