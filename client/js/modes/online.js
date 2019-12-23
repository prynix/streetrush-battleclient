game.online = {
  build: function (recover) {
    game.online.builded = true;
    game.tries = 0;
    game.loader.addClass('loading');
    if (recover) {
      if (game.currentData.challenger) {
        if (game.player.name == game.currentData.challenger) game.online.battle('challenged', game.currentData.challenged);
        else game.online.battle('challenger', game.currentData.challenger);
      }
    } else game.online.enableConfig();
  },
  start: function () {
    game.online.started = true;
    game.currentData = {};
    //game.newId(game.id);
    game.setData('id', game.id);
    game.loader.addClass('loading');
    game.message.text(game.data.ui.loading);
    game.tries = 0;
    //game.online.ask();
    game.online.found(game.enemy.name);
  },
  check: function (first) {
    if (game.online.builded && !game.online.started) {
      //console.log(game.id);

      game.db({
        type: 'ask'
      }, function (check) {  //console.log('check',check);
        game.triesCounter.text(game.tries += 1);
        if (check && check.id && check.id !== game.id) {
          //console.log(check);
          game.online.found(check);
          //game.states.changeTo('choose');
          game.states.changeTo('vs');
        }
        else {
          if (first) {
            //game.states.changeTo('config');
            game.states.changeTo('choose');
            game.online.enableConfig();
          }
          if (game.online.builded && !game.online.started) setTimeout(game.online.check, 1000);
        }
      });
    }
  },
  backClick: function () { //console.log('back');
    game.online.builded = false;
    game.online.started = false;
    game.db({
      'set': 'back',
      'data': game.id,
    }, function () {
      game.states.changeTo('menu');
    });
  },
  enableConfig: function () {
    game.states.config.enable();
  },/*
  ask: function () { console.trace('ask');
    game.db({
      type: 'ask'
    }, function (waiting) {
      //console.log(waiting)
      game.triesCounter.text(game.tries += 1);
      if (waiting && waiting.id) {
        if (!waiting.challenged || waiting.challenged == game.player.name && waiting.id == game.id) game.online.wait();
        else game.online.found(waiting);
      } else {
        setTimeout(game.online.ask, 1000);
      }
    });
  },*/
  wait: function () {console.log('wait');
    game.loader.addClass('loading');
    game.setData('size', game.size);
    game.setData('id', game.id);
    game.player.type = 'challenged';
    game.setData('challenged', game.player.name);
    game.db({
      type: 'waiting',
      'data': game.currentData
    }, function () {
      game.message.text(game.data.ui.waiting);
      game.online.waiting = true;
      game.tries = 0;
      setTimeout(game.online.searching, 1000);
    });
  },
  searching: function () { console.log('searching');
    //game.states.choose.back.attr({disabled: false});
    if (game.id && game.online.waiting) {
      game.db({ type: 'get_battle' }, function (found) {
        //console.log(game.player.name,game.enemy.name,found.challenger,found.id);
        if (!found.challenger && found.id === game.id) {
          game.online.waiting = false;
          game.online.challengerFound(found.challenger);
        } else {
          game.triesCounter.text(game.tries += 1);
          if (game.tries >= game.waitLimit) {
            game.online.ask();
          } else { game.timeout(1000, game.online.searching); }
        }
      });
    }
  },
  challengerFound: function (enemyName) { //console.log('challengerFound')
    game.states.changeTo('choose');
    game.message.text(game.data.ui.gamefound);
    game.online.battle('challenger', enemyName);
  },
  found: function (waiting) { //console.log('found',waiting.id)
    //game.states.choose.back.attr({disabled: true});
    game.message.text(game.data.ui.gamefound);
    game.setId(waiting.id);
    game.player.type = 'challenger';
    game.setData('challenger', game.player.name);
    // ask challenged name
    game.db({ type: 'get_battle' }, function (found) {
      //console.log('found:', found);
      var enemyName = found.challenged;
      if (enemyName === game.enemy.name || enemyName != game.player.name) { // tell player name
        game.db({
          type: 'set_battle',
          data: game.currentData
        }, function () { //console.log('tochoose')
          game.states.config.size(found.size);
          game.online.battle('challenged', enemyName);
          game.states.changing = false;
          game.states.changeTo('choose');
        });
      }
    });
  },
  battle: function (type, name) {
    game.tries = 0;
    game.triesCounter.text('');
    game.loader.removeClass('loading');
    game.enemy.name = name;
    game.enemy.type = type;
    game.setData(type, name);
    game.message.html(game.data.ui.battlefound + ' <b>' + game.player.name + '</b> vs <b class="enemy">' + game.enemy.name + '</b>');
    //game.states.choose.counter.show();
    game.audio.play('battle');
    game.states.changeTo('vs');
    //setTimeout(game.online.enablePick, 400);
  },
  chooseStart: function () {
    game.states.choose.randombt.show().attr({ disabled: true });
    game.states.choose.mydeck.show().attr({ disabled: true });
    game.states.choose.pickedbox.hide();
  },
  enablePick: function () {
    //game.states.choose.randombt.show().attr({disabled: false});
    //game.states.choose.mydeck.show();
    //if (game.getData('mydeck')) game.states.choose.mydeck.attr({disabled: false});
    //game.states.choose.enablePick();
    var state = game.history.state;
    var recover = game.history.recover;
    game.states.changeTo('vs'/*state*/, recover);
    //game.states.choose.count = game.timeToPick;
    //setTimeout(game.online.pickCount, 1000);
  },/*
  pickCount: function () {
    game.states.choose.count -= 1;
    if ($('.slot.available').length) {
      game.states.choose.counter.text(game.data.ui.pickdeck + ': ' + game.states.choose.count);
    }
    if (game.states.choose.count < 0) {
      game.states.choose.counter.text(game.data.ui.getready);
      if (!game.online.picked) {
        game.states.choose.disablePick();
        game.states.choose.counter.text(game.data.ui.getready);
        game.states.choose.randomFill(game.online.chooseEnd);
      }
    } else { game.timeout(1000, game.online.pickCount); }
  },
  pick: function () {
    if ($('.slot.available').length === 0) {
      if (!game.online.picked) {
        game.online.picked = true;
        game.online.chooseEnd('picked');
      }
    }
  },
  chooseEnd: function (picked) {
    game.states.choose.disablePick();
    game.states.choose.counter.text(game.data.ui.getready);
    game.states.choose.fillPicks('player', picked);
    game.online.sendDeck();
  },
  sendDeck: function () {
    //game.states.choose.pickDeck.css('margin-left', 0);
    var picks = game.player.picks.join('|');
    // check if enemy picked
    game.db({ type: 'get_battle' }, function (found) {
      var cb;
      game.setData(game.player.type + 'Deck', picks);
      if (found[game.enemy.type + 'Deck']) {
        cb = function () { game.online.foundDeck(game.enemy.type, found); };
      } else cb = function () { game.online.loadDeck(game.enemy.type); };
      game.db({
        type: 'set_battle',
        'data': game.currentData
      }, cb);
    });
  },
  loadDeck: function (type) {
    game.message.text(game.data.ui.loadingdeck);
    game.loader.addClass('loading');
    game.db({ type: 'get_battle' }, function (found) {
      if (found[type + 'Deck']) {
        game.online.foundDeck(type, found);
      } else {
        game.triesCounter.text(game.tries += 1);
        if (game.tries >= game.timeToPick + game.connectionLimit) {
          game.states.choose.back.attr({ disabled: false });
        } else if (game.tries >= game.timeToPick + (2 * game.connectionLimit)) {
          game.online.backClick();
        } else { game.timeout(1000, game.online.loadDeck.bind(this, type)); }
      }
    });
  },
  foundDeck: function (type, found) {
    game.triesCounter.text('');
    var typeDeck = type + 'Deck';
    game.setData(typeDeck, found[typeDeck]);
    game.enemy.picks = found[typeDeck].split('|');
    game.setData(game.enemy.type + 'Deck', game.enemy.picks);
    game.states.choose.clear();
    game.states.changeTo('vs');
  },*/

  setTable: function () {
    if (!game.online.table) {
      game.online.table = true;
      game.states.table.enableUnselect();
      game.loader.addClass('loading');
      game.message.text(game.data.ui.battle);
      game.audio.play('horn');
      //game.items.enableShop();
      //game.player.placeHeroes();
      //game.enemy.placeHeroes();
      game.turn.build(6);
      game.timeout(400, function () {
        game.skill.build('enemy');
        game.skill.build('player', 0, function () {
          if (game.player.type === 'challenger') {
            game.timeout(1000, game.online.beginEnemy);
          } else {
            game.timeout(1000, game.online.beginPlayer);
          }
        });
      });
    }
  },
  startTurn: function (turn) {
    game.turn.counter = game.timeToPlay;
    var t = 1000;
    if (turn == 'enemy') {
      t = 3000;
      game.loader.addClass('loading');
    }
    game.timeout(t, function () {
      game.turn.count(turn, game.online.countEnd, game.online.preGetTurnData);
    });
  },
  countEnd: function (turn) {
    if (turn == 'player') {
      game.online.endPlayer();
    }
    if (turn == 'enemy') {
      game.tries = 0;
      game.loader.addClass('loading');
      game.message.text(game.data.ui.loadingturn);
      game.online.getTurnData();
    }
  },
  beginPlayer: function () {
    game.turn.begin('player', function () {
      game.online.startTurn('player');
      game.units.buyCreeps('player');
      if (game.player.turn === game.ultTurn) {
        $('.card', game.player.skills.ult).appendTo(game.player.skills.deck);
      }
      //game.skill.buyHand('player');
      //game.tower.attack('enemy');
      //game.items.addMoney('player', game.turnReward);
    });
  },
  skip: function () {
    game.turn.stopCount();
    game.online.endPlayer();
  },
  endPlayer: function () {
    game.turn.end('player', game.online.sendTurnData);
  },
  sendTurnData: function () {
    var challengeTurn = game.player.type + 'Turn';
    game.message.text(game.data.ui.uploadingturn);
    game.setData('moves', game.currentMoves.join('|'));
    game.setData(challengeTurn, game.player.turn);
    game.db({ type: 'get_battle' }, function (data) {
      if (data.surrender) {
        game.online.win();
      } else {
        game.db({
          type: 'set_battle',
          'data': game.currentData
        }, game.online.beginEnemy);
      }
    });
  },
  beginEnemy: function () {
    game.turn.begin('enemy', function () {
      game.online.startTurn('enemy');
      if (game.enemy.turn === game.ultTurn) {
        $('.card', game.enemy.skills.ult).appendTo(game.enemy.skills.deck);
      }
      game.units.buyCreeps('enemy');
      //game.skill.buyHand('enemy');
      //game.tower.attack('player');
      //game.items.addMoney('enemy', game.turnReward); 
    });
  },
  preGetTurnData: function (turn) {
    if (turn == 'enemy') {
      game.db({ type: 'get_battle' }, function (data) {
        var challengeTurn = game.enemy.type + 'Turn';
        //console.log(data[challengeTurn], game.enemy.turn)
        if (data[challengeTurn] === game.enemy.turn + 1) {
          game.turn.stopCount();
          game.online.beginEnemyMoves(data, 'pre');
        }
      });
    }
  },
  getTurnData: function () {
    game.db({ type: 'get_battle' }, function (data) {
      var challengeTurn = game.enemy.type + 'Turn';
      if (data[challengeTurn] === game.enemy.turn + 1) {
        game.online.beginEnemyMoves(data);
      } else {
        game.tries += 1;
        game.triesCounter.text(game.tries);
        if (game.tries > game.connectionLimit) {
          if (game.debug) game.reset('online.js: Unable to load enemy turn data');
          else {
            game.db({ 'get_battle': 'server' }, function (serverdata) {
              if (serverdata.status == 'online') game.online.win();
            });
          }
        } else { game.timeout(1000, game.online.getTurnData); }
      }
    });
  },
  beginEnemyMoves: function (data) {
    if (data.surrender) {
      game.online.win();
    } else {
      game.triesCounter.text('');
      game.setData(game.enemy.type, game.enemy.turn);
      game.setData('moves', data.moves);
      game.enemy.autoMove(data.moves, game.online.endEnemy);
    }
  },
  endEnemy: function () {
    game.turn.end('enemy', game.online.beginPlayer);
  },
  win: function () {
    game.turn.stopCount();
    game.winner = game.player.type;
    game.player.points += 10;
    game.setData('points', game.player.points);
    game.online.sendTurnData('over');
    game.states.changeTo('result');
  },
  surrender: function () {
    game.turn.stopCount();
    game.setData('surrender', true);
    game.setData(game.player.type + 'Turn', game.player.turn);
    game.db({
      type: 'set_battle',
      'data': game.currentData
    }, game.online.lose);
  },
  lose: function () {
    game.turn.stopCount();
    game.winner = game.enemy.type;
    game.loader.removeClass('loading');
    game.states.changeTo('result');
  },
  clear: function () {
    game.online.builded = false;
    game.online.started = false;
    game.online.picked = false;
    game.online.table = false;
    game.currentData = {};
    game.seed = 0;
    game.id = null;
  }
};
