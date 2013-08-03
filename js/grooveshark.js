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

            self.getCurrentSong = function getCurrentSong() {
                var currentSong = Grooveshark.getCurrentSongStatus();
                return currentSong.song.artistName + " - " + currentSong.song.songName;
            }
        };

        window.GroovyPlayer = new GroovesharkPlayer();
    });
}
