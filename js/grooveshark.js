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
                var songName = $("#now-playing-metadata").querySelector("a").innerHTML;
                var artistName = $(".data-container").querySelector("a").innerHTML;
                return artistName + " - " + songName;
            }
        };

        window.GroovyPlayer = new GroovesharkPlayer();
    });
}
