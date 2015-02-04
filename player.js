// Functions
function init(numPlayers) {
    for (var i = 0; i < numPlayers; ++i) {
        var f = $('<input>', {'class': 'f' + i, 'type': 'text', 'data-id': '#player' + i}),
            label = $('<label>player ' + i + ':</label>');

        f.appendTo(label);
        label.appendTo('.fields');
        checkLocalStorage('.f' + i);
    }
}

function attachButtonEventListeners(players, GE) {
    $('.load').on('click', function(e) {
        // $('.next').show();
        console.log('load');
        var urls = [],
            hasSrc = 0;

        for (var i = 0; i < players.getNumPlayers(); ++i) {
            var el = $('.f' + i);
            urls.push(el.val());
            if (el.val() !== '') {
                hasSrc += 1;
            }
        }

        // verifyUrls(urls, players);
        players.populatePlayers(urls, hasSrc);
        resetControls();
    });

    $('.next').on('click', function(e) {
        console.log('next');
    });

    $('.add').on('click', function(e) {
        console.log('add player');
        var f = $('<input>', {'class': 'f' + players.getNumPlayers(), 'type': 'text', 'data-id': '#player' + players.getNumPlayers()}),
            label = $('<label>player ' + players.getNumPlayers() + ':</label>');

        f.appendTo(label);
        label.appendTo('.fields');
        var className = 'f' + players.getNumPlayers();
        checkLocalStorage('.f' + players.getNumPlayers());
        players.addPlayer();
        attachVideoEventListeners(GE);
        // $('.load').click();
    });

    $('.remove').on('click', function(e) {
        console.log('removing player');
        var n = players.getNumPlayers() - 1;
        $('.f' + n).parent().remove();
        players.removePlayer();
    });

    $('.save').on('click', function(e) {
        console.log('saving');
        var data = {};
        data['numPlayers'] = players.getNumPlayers();
        $('label input').each(function() {
            data[$(this).attr('class')] = $(this).val();
        });
        localStorage.setItem('syncPlay', JSON.stringify(data));
    });

    $('#play').on('click', function() {
        if ($(this).val() === 'play') {
            console.log('play click');
            $(this).val('pause');
            GE.trigger('playVideo');
        } else if ($(this).val() === 'pause') {
            console.log('pause click');
            $(this).val('play');
            GE.trigger('pauseVideo');
        } else {
            console.log('replay');
            $(this).val('pause');
            GE.trigger('playVideo');
        }
    });

    $('#seek').on('input', function() {
        var timestamp = $(this).val();
        console.log('time seeked: ' + timestamp);
        GE.trigger('updateTime', [timestamp]);
        $('#duration').val(prettyTime(parseInt(timestamp, 10)));
    });

    $('video').on('timeupdate', function(e) {
        var timestamp = e.target.currentTime;
        // console.log(timestamp);
        $('#seek').val(timestamp);
        $('#duration').val(prettyTime(parseInt(timestamp, 10)));
    });

    $('video').on('ended', function(e) {
        console.log('ENDED!!');
        $('#play').val('replay');
    });
}

function attachVideoEventListeners(GE) {
    GE.off();
    // these events should trigger for all players simultaneously
    $('video').each(function(index, el) {
        GE.on('playVideo', function(e) {
            el.play();
        });
        GE.on('pauseVideo', function(e) {
            el.pause();
        });
        GE.on('updateTime', function(e, time) {
            el.currentTime = time;
        });
    });
    $('video').on('loadedmetadata', function(e) {
        $('input[type="range"]').prop('max', e.target.duration);
    });
};

function verifyUrls(urls, players) {
    var err = [],
        deferreds = [];

    for (var i = 0; i < urls.length; ++i) {
        deferreds.push(
            $.ajax(urls[i])
            .fail(function() {
                err.push(this.url);
            })
        );
    }

    $.when.apply($, deferreds)
    .then(function() {
        console.log('all urls are valid');
        players.populatePlayers(urls);
        resetControls();
    }, function() {
        console.log('invalid urls: ' + err);
        err = err.map(function(x) {return x.split('output/').pop()});
        alert('the following videos do not exist: \n' + err.join('\n'));
    });
}

function checkLocalStorage(selector) {
    var data = JSON.parse(localStorage.getItem('syncPlay')) || {};
    if (data[selector.slice(1)]) {
        $(selector).val(data[selector.slice(1)]);
    }
}

function prettyTime(secs) {
    var minutes = Math.floor(secs / 60),
        seconds = secs - minutes *60;

    return (('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2));
}

function resetControls() {
    $('#play').val('play');
    $('#duration').val('00:00');
    $('#seek').val(0);
}


// Video Players class
var Players = function(num) {
    var playersReadyCounter = 0,
        numPlayers = num,
        parent = '.videoWrapper',
        currentId = 0,
        loadInterval = {};

    this.attachPlayers = function() {
        var n = numPlayers - $(parent).children().length;

        for (var i = 0; i < n; ++i) {
            var v = $('<video>', {
                'class': 'col-md-6',
                'id': 'player' + currentId,
                'src': '',
                'preload': 'auto'
            });
            v.appendTo(parent);
            currentId += 1;
        }
    }

    this.enableControls = function() {
        $('#play').prop('disabled', false);
        $('#seek').prop('disabled', false);
    }

    this.disableControls = function() {
        $('#play').prop('disabled', true);
        $('#seek').prop('disabled', true);
    }

    this.waitForLoad = function(el, index, nPlayers) {
        if ($(el).prop('readyState')) {
            var duration = $(el).prop('duration'),
                buffered = $(el).prop('buffered').end(0);

            if (buffered === duration) {
                console.log('video ' + index + ' is fully loaded.');
                playersReadyCounter += 1;
                if (playersReadyCounter === nPlayers) {
                    this.enableControls();
                }
                clearInterval(loadInterval[index]);
                // console.log('interval cleared');
                delete loadInterval[index];
            }
        }
    }

    this.populatePlayers = function(urls, hasSrc) {
        this.disableControls();
        playersReadyCounter = 0;

        for (var i = 0; i < numPlayers; ++i) {
            $('#player' + i).prop('src', urls[i])
        }

        console.log('alakazam!');
        $('.videoWrapper').show();
        $('.controls').show();

        var that = this;
        $('video').each(function(index) {
            this.load();
            if ($(this).attr('src') !== '') {
                $(this).on('canplaythrough', function(){
                    this.play();
                    this.pause();
                    clearInterval(loadInterval[index]);
                    loadInterval[index] = setInterval(that.waitForLoad.bind(that, this, index, hasSrc), 500);
                    $(this).off('canplaythrough');
                });
            }
        });
    }

    this.addPlayer = function() {
        numPlayers += 1;
        this.attachPlayers();
    }

    this.removePlayer = function() {
        numPlayers -= 1;
        currentId -= 1;
        $('#player' + currentId).remove();
    }

    this.getNumPlayers = function() {
        return numPlayers;
    }
}


$(document).ready(function() {
    var numPlayers = parseInt((JSON.parse(localStorage['syncPlay'] || '{}')['numPlayers']), 10) || 1,
        players = new Players(numPlayers),
        GE = $('body');

    players.attachPlayers();
    attachButtonEventListeners(players, GE);
    attachVideoEventListeners(GE);
    init(players.getNumPlayers());
});
