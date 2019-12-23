game.audio = {
  defaultVolume: 0.5,
  defaultSounds: 0.25,
  defaultMusic: 0.25,
  build: function () {
    game.audio.context = new AudioContext();
    game.audio.volumeNode = game.audio.context.createGain();
    game.audio.soundsNode = game.audio.context.createGain();
    game.audio.musicNode = game.audio.context.createGain();
    game.audio.soundsNode.connect(game.audio.volumeNode);
    game.audio.musicNode.connect(game.audio.volumeNode);
    game.audio.volumeNode.connect(game.audio.context.destination);
    game.audio.loadMusic();
    game.audio.loadSounds();
    game.audio.rememberVolume();
  },
  buffers: {},
  load: function (name, cb) {
    var ajax = new XMLHttpRequest();
    ajax.open('GET', game.dynamicHost + 'audio/' + name + '.mp3', /*async*/true);
    ajax.responseType = 'arraybuffer';
    ajax.onload = function () {
      game.audio.context.decodeAudioData(ajax.response, function (buffer) {
        game.audio.buffers[name] = buffer;
        if (cb) { cb(); }
      });
    };
    ajax.send();
  },
  sounds: [
    'activate',
    'crit',
    'horn',
    'battle',
    'pick',
    'move',
    'items/bkb',
    'tower/attack',
    'am/attack',
    'crit'
  ],
  loadSounds: function () {
    $(game.audio.sounds).each(function (a, b) {
      game.audio.load(b);
    });
  },
  musics: [
    'RandomEncounter',
    'DrugWars'
  ],
  loadMusic: function () {
    $(game.audio.musics).each(function (a, b) {
      game.audio.load('music/'+b);
    });
    game.audio.song = 'DrugWars';
    game.audio.load('music/'+game.audio.song, function () {
      if (game.currentState != 'loading' &&
          game.currentState != 'table' &&
          game.currentState != 'vs' &&
          game.currentState != 'log') setTimeout(game.audio.loopSong, 1000);
    });
  },
  loopSong: function (song) {
    if ((song && song !== game.audio.song) || !game.audio.loopingSong) {
      if (song) game.audio.song = song;
      game.audio.play(song || game.audio.song, /*loop*/true, 'music');
    }
  },
  sources: [],
  play: function (name, loop, music, cb) { //console.trace(name);
    if (!game.audio.context && 'AudioContext' in window) game.audio.context = new AudioContext();
    if (music) name = 'music/'+name;
    if (game.audio.context &&
        game.audio.context.createBufferSource &&
        game.audio.buffers[name] &&
        game.audio.buffers[name].duration) {//console.log(name);
      var audio = game.audio.context.createBufferSource();
      //console.log(name, game.audio.buffers[name]);
      audio.buffer = game.audio.buffers[name];
      if (music) {
        game.audio.songSource = audio;
        audio.connect(game.audio.musicNode);
        if (loop) game.audio.loopingSong = true;
      } else {
        audio.connect(game.audio.soundsNode);
      }
      game.audio.sources[name] = audio;
      audio.loop = loop;
      if (!game.recovering) {
        audio.start();
        audio.started = true;
      }
      if (cb) setTimeout(cb, game.audio.buffers[name].duration * 1000);
      return audio;
    }
  },
  stop: function (str) {
    var audio = game.audio.sources[str];
    if (audio && audio.started && !game.recovering) audio.stop();
  },
  stopSong: function () {
    var audio = game.audio.songSource;
    if (audio) {
      game.audio.loopingSong = false;
      if (audio && audio.started && !game.recovering) audio.stop();
    }
  },
  mute: function () {
    var vol = game.audio.unmutedvolume || game.audio.volumeNode.gain.value || game.audio.defaultVolume;
    if (this.checked) { vol = 0; }
    game.audio.setVolume('volume', vol);
  },
  setVolume: function (target , v) {
    if (v === undefined || v === null) {
      v = game.audio.defaultVolume;
      if (target == 'music') v = game.audio.defaultMusic;
      if (target == 'sounds') v = game.audio.defaultSounds;
    }
    var vol = parseFloat(v);
    if (vol <= 0) {
      vol = 0;
      if (target === 'volume') game.options.muteinput.prop('checked', true);
    } else {
      if (target === 'volume') {
        game.audio.unmutedvolume = vol;
        game.options.muteinput.prop('checked', false);
      }
    }
    if (vol > 1) { vol = 1; }
    if (typeof(vol) == 'number' && isFinite(vol))  {
      if (game.audio[target + 'Node']) {
        //game.audio[target + 'Node'].gain.value = vol;
        game.audio[target + 'Node'].gain.setTargetAtTime(vol, game.audio.context.currentTime + 1, 0.1);
      }
      if (game.options[target + 'control']) {
        game.options[target + 'control'].css('transform', 'scale(' + vol + ')');
      }
      game.setData(target, vol);
    }
  },
  rememberVolume: function () {
    var volume = game.getData('volume');
    if (typeof(volume) == undefined) volume = game.audio.defaultVolume;
    game.audio.setVolume('volume', volume);
    var music = game.getData('music');
    if (typeof(music) == undefined) music = game.audio.defaultMusic;
    game.audio.setVolume('music', music);
    var sounds = game.getData('sounds');
    if (typeof(sounds) == undefined) sounds = game.audio.defaultSounds;
    game.audio.setVolume('sounds', sounds);
  },
  volumeMouseDown: function (event) {
    var target = $(event.target).closest('.volume').attr('id');
    game.audio.volumetarget = target;
    game.audio.volumeMouseMove(event);
    game.options[target + 'input'].on('mousemove.volume', game.audio.volumeMouseMove);
  },
  volumeMouseUp: function () {
    if (game.audio.volumetarget) {
      game.options[game.audio.volumetarget + 'input'].off('mousemove.volume');
      game.audio.volumetarget = false;
    }
  },
  volumeMouseMove: function (event) {
    var w = 100 * game.screen.scale;
    //console.log(w);
    var x = event.clientX - game.options.volumecontrol.offset().left,
        v = parseInt(x / game.screen.scale, 10) / 100;
    //console.log(x, v)
    if (game.audio.volumetarget) game.audio.setVolume(game.audio.volumetarget, v);
  },
  volumeControl: function (name) {
    game.options[name+'control'] = $('<div>').addClass('volumecontrol');
    game.options[name+'input'] = $('<div>').addClass('volume').attr('id', name).append(game.options[name+'control']);
    $('<label>').appendTo(game.options.audio).append($('<span>').text(game.data.ui[name])).append(game.options[name+'input']);
  }
};
