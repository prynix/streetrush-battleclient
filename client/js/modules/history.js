game.history = {
  build: function () {
    game.history.last = game.getData('last-activity');
    game.history.state = game.getData('state');
    game.history.mode = game.getData('mode');
    game.history.size = game.getData('size');
    game.history.seed = game.getData('seed');
  },
  recover: function () {
    game.audio.rememberVolume();
    var mode = game.history.mode,
        state = game.history.state,
        valid = game.states.validState(state),
        name = game.getData('name'),
        logged = (game.getData('logged') === true);
    var delay = 1000 * 60 * 60 * 24 * 30; // 30 days
    var recent = (new Date().valueOf() - game.history.last) < delay; 
    var recovering = logged && name && valid && recent;
    game.player.name = name;
    game.options.opt.show();
    game.history.jumpTo('vs');
    /*
    if (!recovering || state == 'loading') {
      game.states.changeTo('vs', recovering);
    } else {
      if (game.debug){
        game.history.jumpMode('vs', state, recovering);
      } else {
        game.history.jumpTo('vs', recovering);
      }
    }*/
    //console.log(mode, state, logged, name, valid, recent)
  },
  jumpMode: function (mode, state, recovering) {
    if (state == 'result') {
      mode = false;
      state = 'menu';
    }
    if (mode) {
      game.recovering = true;
      game.history.match(mode, recovering);
      game.history.picks();
    }
    game.history.jumpTo(state, recovering);
  },
  jumpTo: function (state, recover) {
    game.setData('last-activity', new Date().valueOf());
    var ctx = {state: state, recover: recover};
    if (game.debug) game.history.change.call(ctx, true);
    else {
      //var str = game.data.ui.welcome +' '+ game.getData('name') +'! '+ game.data.ui.log +'?';
      //game.overlay.confirm(game.history.change.bind(ctx), str);
      game.history.change.bind(ctx);
    }
  },
  change: function (confirmed) {
    var state = this.state;
    var recover = this.recover;
    if (confirmed) {
      if ('AudioContext' in window) game.audio.build();
      //game.states.changeTo(state, recover);
      //game.setMode('online');
      //console.log(game);
      game.states.config.size('s1v1');
      game.online.check('first');
      game.online.start();
      game.states.changeTo('choose');
      //game.states.changeTo('vs'/*state*/, recover);
    } else game.states.changeTo('vs');
  },
  match: function(mode, recovering) {
    game.setMode(mode, recovering);
    //game.states.config.size(game.history.size);
    game.seed = game.history.seed;
    game.setData('seed', game.seed);
    game.states.vs.buildMap();
  },
  picks: function() {
    var playerPicks = game.getData(game.player.type+'Deck');
    if (playerPicks) game.player.picks = playerPicks.split('|');
    var enemyPicks = game.getData(game.enemy.type+'Deck');
    if (enemyPicks) game.enemy.picks = enemyPicks.split('|');
  },
  saveMove: function (move) {
    var matchData = game.getData('matchData');
    if (!matchData) matchData = [];
    matchData.push(move);
    game.setData('matchData', matchData);
  },
  recoverMatch: function () {// console.log('recover')
    if (game.getData('challenged') == game.player.name) {
      game.player.type = 'challenged';
      game.enemy.type = 'challenger';
      game.currentTurnSide = 'player';
    } else {
      game.player.type = 'challenger';
      game.enemy.type = 'challenged';
      game.currentTurnSide = 'enemy';
    }
    if (!game.player.picks) game.player.picks = game.getData(game.player.type+'Deck').split('|');
    //game.skill.calcMana('player');
    if (!game.enemy.picks) game.enemy.picks = game.getData(game.enemy.type+'Deck').split('|');
    //game.skill.calcMana('enemy');
    //game.units.build('player');
    //game.units.build('enemy');
    game[game.mode].setTable();
    game.turn.el.text('Recovering').addClass('show');
    setTimeout(function () {
      game.enemy.autoMove(game.getData('matchData'), function () {
        game.recovering = false;
        game.turn.el.removeClass('show');
      });
    }, 1400);
  }
};
