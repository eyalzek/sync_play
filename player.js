var Players = function() {
    var playersReadyCounter = 0,
        loadInterval = {},
        durations = [];

    this.getMaxDuration = function() {
        return Math.min.apply(null, durations);
    }
    
    this.enableControls = function() {
        $("#play").prop("disabled", false);
        $("#seek").prop("disabled", false);
    }

    this.disableControls = function() {
        $("#play").prop("disabled", true);
        $("#seek").prop("disabled", true);
    }
    
    this.waitForLoad = function(el, index) {
        if ($(el).prop("readyState")) {
            var duration = $(el).prop("duration"),
                buffered = $(el).prop("buffered").end(0);

            if (buffered === duration) {
                console.log("video " + index + " is fully loaded.");
                playersReadyCounter += 1;
                if (playersReadyCounter === 2) {
                    this.enableControls();
                }
                clearInterval(loadInterval[index]);
                // console.log("interval cleared");
                delete loadInterval[index];
            }
        }
    }
    
    this.populatePlayers = function(urls) {
        this.disableControls();
        playersReadyCounter = 0;

        $("#player1").prop("src", urls[0]);
        $("#player2").prop("src", urls[1]);

        console.log("alakazam!");
        $(".videoWrapper").show();
        $(".controls").show();

        var that = this;

        $("video").each(function(index, el) {
            durations.push(el.duration);
            this.load();
            $(this).on("canplaythrough", function(){
                this.play();
                this.pause();
                clearInterval(loadInterval[index])
                loadInterval[index] = setInterval(that.waitForLoad.bind(that, this, index), 500);
                $(this).off("canplaythrough");
            });
        });
    }
}


$(document).ready(function() {
    var players = new Players(),
        clips = $(".clip option").each(function() {arr.push($(this).val())});
        GE = $("body");

    $(".videoWrapper").hide();
    $(".controls").hide();

    $(".load").on("click", function(e) {
        console.log("load");
        var urls = [];

        $("input[type=text]").each(function() {
            urls.push($(this).val());
        })

        console.log(urls)
        // verifyUrls(urls);
        players.populatePlayers(urls);
        resetControls();
    });

    (function attachEventListeners() {
        $("video").each(function(index, el) {
            // these events should trigger for all players simultaneously
            GE.on("playVideo", function(e) {
                el.play();
            });
            GE.on("pauseVideo", function(e) {
                el.pause();
            });
            GE.on("updateTime", function(e, time) {
                el.currentTime = time;
            });
        });
        // seekbar max duration is set to the shortest video's duration
        $("video").on("loadedmetadata", function(e) {
            console.log("video duration: ");
            console.log(e.target.duration);
            if ($("input[type='range']").prop("max") === 0.0) $("input[type='range']").prop("max", e.target.duration);
            if (e.target.duration < $("input[type='range']").prop("max")) $("input[type='range']").prop("max", e.target.duration);
        });
    })();

    function prettyTime(secs) {
        var minutes = Math.floor(secs / 60),
            seconds = secs - minutes *60;

        return (("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2));
    }

    function resetControls() {
        $("#play").val("play");
        $("#duration").val("00:00");
        $("#seek").val(0);
    }

    // events:
    $("#play").on("click", function() {
        if ($(this).val() === "play") {
            console.log("play click");
            $(this).val("pause");
            GE.trigger("playVideo");
        } else if ($(this).val() === "pause") {
            console.log("pause click");
            $(this).val("play");
            GE.trigger("pauseVideo");
        } else {
            console.log("replay");
            $(this).val("pause");
            GE.trigger("playVideo");
        }
    });

    $("#seek").on("input", function() {
        var timestamp = $(this).val();
        console.log("time seeked: " + timestamp);
        GE.trigger("updateTime", [timestamp]);
        $("#duration").val(prettyTime(parseInt(timestamp, 10)));
    });

    $("video").on("timeupdate", function(e) {
        var timestamp = e.target.currentTime;
        // console.log(timestamp);
        $("#seek").val(timestamp);
        $("#duration").val(prettyTime(parseInt(timestamp, 10)));
    });

    $("video").on("ended", function(e) {
        console.log("ENDED!!");
        $("#play").val("replay");
    });

    // maybe someday I'll try to make the buffering thing work properly

    // $("video").on("waiting", function(e) {
    //     var index = e.target.id;
    //     if (loadedArray[index] !== 0) {
    //         loadedArray[index] = 0;
    //         console.log("video " + index + " is waiting");
    //         GE.trigger("pauseVideo");
    //         GE.trigger("updateTime", [e.target.currentTime]);
    //     }
    // });

    // $("video").on("canplay", function(e) {
    //     var index = e.target.id;
    //     loadedArray[index] = 1;
    //     console.log(index + " is ready");
    //     if (loadedArray.indexOf(0) === -1 && play) GE.trigger("playVideo");
    // });

});
