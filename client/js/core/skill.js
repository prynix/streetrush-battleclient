game.skill = {
  extendjQuery: function () {
    $.fn.extend({
      canCast: game.skill.canCast,
      cast: game.skill.cast,
      passive: game.skill.passive,
      toggle: game.skill.toggle,
      discard: game.skill.discard,
      stopChanneling: game.skill.stopChanneling,
      addStack: game.skill.addStack,
      removeStack: game.skill.removeStack,
      addInvisibility: game.skill.addInvisibility,
      removeInvisibility: game.skill.removeInvisibility,
      summon: game.skill.summon,
      resummon: game.skill.resummon,
      getSkill: game.skill.getSkill
    });
  },
  build: function (side, single, cb) {
    game[side].skills = {};
    game[side].skills.hand = $('<div>').appendTo(game.states.table[side]).addClass('deck skills hand');
    //game[side].skills.sidehand = $('<div>').appendTo(game.states.table[side]).addClass('deck skills sidehand');
    game[side].skills.ult = $('<div>').hide().appendTo(game.states.table[side]).addClass('deck skills ult');
    game[side].skills.temp = $('<div>').hide().appendTo(game.states.table[side]).addClass('deck skills temp');
    game[side].skills.cemitery = $('<div>').hide().appendTo(game.states.table[side]).addClass('deck skills cemitery');
    game[side].skills.deck = game.deck.build({
      name: 'skills',
      multi: !single,
      filter: game[side].picks,
      cb: function (deck) {
        var side = this.side.toString();
        deck.addClass('available').hide().appendTo(game.states.table[side]);
        $.each(JSON.parse(deck.data('cards')), function (i, cardId) {
          var skill = $('#'+cardId);
          var side = this.toString();
          skill.addClass(side);
          if (side == 'player' || game.mode == 'library' || game.mode == 'local') {
            skill.on('mousedown touchstart', game.card.select).on('mouseenter', game.highlight.source).on('mouseleave', game.highlight.refresh);
            //double click / tap 
          } else skill.attr({ title: '' }).addClass('flipped');
          if (skill.data('deck') === game.data.ui.summon) skill.appendTo(game[side].unitsDeck);
          if (skill.data('deck') === game.data.ui.temp) skill.appendTo(game[side].skills.temp);
          if (skill.data('label') === 'ult') skill.appendTo(game[side].skills.ult);
        }.bind(side));
        //deck.shuffleDeck();
        game[side].skills.deck = deck;
        if (this.cb) this.cb();
      }.bind({side: side, cb: cb})
    });
  },
  calcMana: function (side) {
    game[side].mana = 0;
    $(game[side].picks).each(function (i, name) { 
      if (name) game[side].mana += game.data.heroes[name].mana;
    });
    game[side].cardsPerTurn = Math.round(game[side].mana / 5);
  },
  buyCard: function(side) {
    var availableSkills = $('.table .'+side+' .skills.available .card'), card, skills = [], liveheroes = [];
    if (availableSkills.length < game[side].cardsPerTurn + 1) {
      // renew deck
      $('.table .'+side+' .skills.cemitery .card').appendTo(game[side].skills.deck);
      availableSkills = $('.table .'+side+' .skills.available .card');
    }
    // filter alive heroes
    $('.table .map .'+side+'.heroes.card').each(function () {
      var hero = $(this).data('hero');
      if (hero) liveheroes.push(hero);
    });
    for (var i=0; i<availableSkills.length; i++) {
      var skill = $(availableSkills[i]);
      if (liveheroes.indexOf(skill.data('hero')) >= 0) {
        skills.push(skill);
      }
    }
    card = $(skills).randomCard();
    game.skill.toHands(card, side);
  },
  toHands: function (card, side) {
    card.removeClass('casted');
    if (card.data('hand') === game.data.ui.right) {
      if (game[side].skills.hand.children().length < game.maxSkillCards) {
        card.appendTo(game[side].skills.hand);
      }
    } else if (game[side].skills.sidehand.children().length < game.maxSkillCards) {
      card.appendTo(game[side].skills.sidehand);
    }
  },
  buyHand: function(side) {
    //game.units.buyCreeps(side);
    if (game[side].type == 'challenger' || game[side].turn > 0)
      game.skill.buyCards(game[side].cardsPerTurn, side);
  },
  buyCards: function(n, side) {
    for (var i = 0; i < n; i++) {
      game.skill.buyCard(side);
    }
  },
  buyCardsFromHero: function (target, n) {
    var side = target.side();
    var hero = target.data('hero');
    var card;
    if (!n) {
      card = $('.'+side+' .skills.available .'+hero).randomCard();
      game.skill.toHands(card, side);
      return card;
    } else {
      var cards = [];
      for (var i=0; i<n; i++) {
        card = $('.'+side+' .skills.available .'+hero).randomCard();
        game.skill.toHands(card, side);
        cards.push(card);
      }
      return cards;
    }
  },
  canCast: function (skill) {
    if (skill && skill.length) {
      var isBlink = (skill.hasClass('venge-ult') || skill.hasClass('am-blink') || skill.hasClass('blinkdagger'));
      if ( isBlink && this.hasClass('rooted') ) return false;
      var c = !this.hasClasses('dead stunned silenced hexed disabled sleeping cycloned taunted');
      return c;
    }
  },
  cast: function (skill, target) {
    var source = this, targets, duration, str,
      hero = skill.data('hero'),
      label = skill.data('label');
    if (skill.hasClass('items')) {
      hero = skill.data('itemtype');
      label = skill.data('item');
    }
    if (label && hero) {
      if (typeof target === 'string') {
        if (skill.hasClass('items')) {
          if (skill.data('cast select') && skill.data('source')) targets = game.data.items[hero][label]['secondary targets'];
          else targets = game.data.items[hero][label].targets;
        } else {
          if (skill.data('cast select') && skill.data('source')) targets = game.data.items[hero][label]['secondary targets'];
          else targets = game.data.skills[hero][label].targets;
        }
        if (targets.indexOf(game.data.ui.spot) >= 0 || targets.indexOf(game.data.ui.jungle) >= 0) {
          target = $('#' + target);
        } else {target = $('#' + target + ' .card'); }
      }
      if (target.length) {
        var evt = {
          type: 'cast',
          skill: skill,
          source: source,
          target: target
        };
        if (skill.data('cast select') && !skill.data('source')) {
          skill.data('source', target.attr('id'));
          game.highlight.clearMap();
          skill.strokeSkill(target);
          game.highlight.active(evt, target, skill, 'secondary');
        } else {
          skill.removeClass('draggable');
          source.stopChanneling();
          source.trigger('cast', evt).trigger('action', evt);
          skill.trigger('cast', evt);
          if (!target.hasClass('spot')) target.trigger('casted', evt);
          if (!(target.hasBuff('mirror-counter') && source.side() !== target.side())) {
            if (game.audio.sounds.indexOf(hero + '/' + label) >= 0) {
              str = hero + '/' + label;
              if (target.hasClass('linken')) game.audio.play('activate');
              else if (label !== 'ult') game.audio.play(str);
            }
            if (skill.data('type') == game.data.ui.channel) {
              game.skill.channel(skill, source, target, evt);
            }
            if (skill.hasClass('items')) {
              var itemtype = skill.data('itemtype');
              var item = skill.data('item');
              //ITEM CAST
              game.items[itemtype][item].cast(skill, target);
              game.skill.castafter(skill, source, target);
            } else {
              if (target.hasClass('linken')) {
                game.skill.castafter(skill, source, target);
              } else {
                game.fx.ult(skill, function (skill, source, target) {
                  var hero = skill.data('hero');
                  var label = skill.data('label');
                  // SKILL CAST   console.log(hero,label)
                  game.skills[hero][label].cast(skill, source, target);
                  game.skill.castafter(skill, source, target);
                }.bind(this, skill, source, target), str);
              }
            }
          }
        }
      }
    }
    return this;
  },
  castafter: function (skill, source, target) {
    var cb = game.skill.castafterdiscard.bind(this, skill, source, target);
    if (skill.hasClass('dragTarget')) skill.discard(source, cb);
    else game.timeout(400, skill.discard.bind(skill, source, cb));
  },
  castafterdiscard: function (skill, source, target) {
    if (skill.canPlay() && skill.hasClass('items') && target && target.hasClass('card')) {
      if (target.hasClass('trees')) game.card.unselect();
      else target.select();
    }
    else if (source.canPlay() && source && skill.hasClass('selected')) source.select();
    else game.highlight.refresh();
  },
  channel: function (skill, source, target, evt) {
    var channelDuration = skill.data('channel');
    if (!target) target = source;
    if (!evt) {
      evt = {
        skill: skill,
        source: source,
        target: target
      };
    }
    evt.type = 'channel';
    source.data('channel event', evt);
    source.data('channeling', channelDuration);
    source.data('channel', channelDuration);
    source.data('channel skill', skill);
    source.addClass('channeling');
    skill.addClass('channel-on');
  },
  stopChanneling: function() {
    var card = $(this);
    if (card.hasClass('channeling')) {
      card.trigger('channelend', card.data('channel event'));
      $(card.data('channel skill')).removeClass('channel-on on');
      card.data('channel', null).data('channeling', null).data('channel skill', null).data('channel event', null);
      card.off('channel').off('channelend');
      card.removeClass('channeling');
      card.reselect();
    }
    return this;
  },
  activeStopChanneling: function () {
    var card = $(this);
    if (card.side() == 'player') game.player.stopChanneling(card);
    else card.stopChanneling();
  },
  animateCast: function (skill, target, event, cb) {
    if (!skill.hasClass('dragTarget')) {
      if (typeof target === 'string') { target = $('#' + target); }
      var s = skill.offset();
      var x = event.clientX - s.left, y = event.clientY - s.top;
      var fx = x * 1 - 150; var fy = y * 1 - 220;
      skill.css({transform: 'translate('+fx+'px, '+fy+'px) scale(0.3)'});
      game.timeout(400, function (cb) {
        $(this).css({transform: ''});
        if (cb) cb();
      }.bind(skill, cb));
    }
  },
  passive: function (target) {
    var skill = this,
      hero = skill.data('hero'),
      label = skill.data('label');
    if (typeof(target) === 'string') target = $('#' + target + ' .card');
    if (label && hero) {
      target.trigger('passive', {
        skill: skill,
        target: target
      });
      game.skills[hero][label].passive(skill, target);
      if (label == 'aura') {
        var side = target.side();
        var team = $('.table .card.'+side+':not(.skills)');
        $.each(team, function (i, card) {
          target.addBuff($(card), skill);
        });
        target.on('death.'+hero+'-aura',  function (event, eventdata) {
          var target = eventdata.target;
          var side = target.side();
          var team = $('.table .card.'+side+':not(.skills)');
          $.each(team, function (i, card) {
            $(card).removeBuff(hero+'-aura');
          });
        });
        target.on('reborn.'+hero+'-aura', function (event, eventdata) {
          var target = eventdata.target;
          var skill = game.data.skills[hero].aura;
          var side = target.side();
          var team = $('.table .card.'+side+':not(.skills)');
          game.timeout(400, function () {
            $.each(team, function (i, card) {
              target.addBuff($(card), skill.buff);
            });
          });
        });
      }
      game.audio.play('activate');
      target.shake();
      skill.removeClass('draggable');
      var end = function (target) {
        this.appendTo(game.hidden);
        if (target.canPlay()) target.select();
        else game.highlight.refresh();
      }.bind(skill, target);
      if (!skill.hasClass('dragTarget')) game.timeout(400, end);
      else end();
    }
    return this;
  },
  toggle: function (target) { //console.log('target')
    var skill = this,
      hero = skill.data('hero'),
      label = skill.data('label');
    if (typeof target === 'string') { target = $('#' + target + ' .card'); }
    if (label && hero) {
      var evt = {
        type: 'toggle',
        skill: skill,
        target: target
      };
      target.trigger('toggle', evt);
      game.skills[hero][label].toggle(skill, target);
      if (game.audio.sounds.indexOf(hero + '/' + label) >= 0) {
        if (skill.is('.ld-ult:not(.on)')) game.audio.play(hero + '/transform');
        else if (skill.is('.pud-rot:not(.on)')) {
          game.audio.stop('pud/rot');
          game.audio.play('activate');
        }
        else game.audio.play(hero + '/' + label);
      }
      target.shake();
      skill.removeClass('draggable');
      if (skill.hasClass('enemy')) {
        game.enemy.hand -= 1;
      } else if (skill.hasClass('selected')) {
        game.timeout(400, function (target) {
          if (target.side() === 'player') target.select();
        }.bind(skill, target));
      }
    }
    return this;
  },
  summon: function (skill) {
    skill.removeClass('draggable');
    var unit = skill.clone().addClass('units summoned').removeClass('skills selected flipped dragTarget can-attack can-move heroes').on('mousedown touchstart', game.card.select).on('mouseenter', game.highlight.source).on('mouseleave', game.highlight.refresh).css({transform: ''});
    unit.attr('id', game.card.newId());
    if (skill.data('summon name')) unit.find('legend').text(skill.data('summon name'));
    unit.find('.mana, .description, .castRange, .kd').remove();
    unit.data('summon', skill.attr('id'));
    unit.data('summoner', this.attr('id'));
    unit.data('hp', skill.data('hp'));
    unit.data('damage', skill.data('damage'));
    unit.data('range', skill.data('range'));
    unit.data('armor', skill.data('armor'));
    unit.data('resistance', skill.data('resistance'));
    var speed = skill.data('speed') || game.defaultSpeed;
    unit.data('speed', speed);
    if (typeof(speed) == 'number') 
      speed = game.map.getRangeStr(speed);
    if (!unit.find('.speed').length) 
      $('<p>').appendTo(unit.find('.desc')).text(game.data.ui.speed + ': ' + speed).addClass('speed');
    unit.data('current hp', unit.data('hp'));
    unit.data('current damage', unit.data('damage'));
    unit.data('current armor', unit.data('armor'));
    unit.data('current resistance', unit.data('resistance'));
    unit.data('current speed', unit.data('speed'));
    if (!unit.find('.buffs').length) 
      unit.find('fieldset').append($('<div>').addClass('buffs'));
    game.timeout(400, function (unit) {
      if (this.side() === 'player') unit.select();
      game.fx.text(unit, 'z');
    }.bind(this, unit));
    return unit;
  },
  resummon: function (unit) {
    unit.removeClass('dead').addClass('summonsleep').purge();
    game.timeout(400, function (unit) {
      game.fx.text(unit, 'z');
    });
  },
  addStack: function (tag) {
    var stack = this.data(tag+'Stack');
    if (stack) this.data(tag+'Stack', stack + 1);
    else this.data(tag+'Stack', 1);
    this.addClass(tag);
    return this;
  },
  removeStack: function (tag) {
    var stack = this.data(tag+'Stack') - 1;
    this.data(tag+'Stack', stack);
    if (!stack) this.removeClass(tag);
    return this;
  },
  addInvisibility: function (buff) {
    this.addClass('invisible');
    this.on('action.invisible', function (event, eventdata) {
      var target = $(this);
      if (eventdata.type !== 'move') {
        target.removeInvisibility();
        target.trigger('invisibilityLoss', {target: target});
        if (buff) target.removeBuff(buff);
      }
    });
    if (buff) {
      var stack = this.data('invisibilityStack');
      if (stack) this.data('invisibilityStack', stack + 1);
      else this.data('invisibilityStack', 1);
      buff.on('expire', function (event, eventdata) {
        var source = eventdata.target;
        if (source) {
          var expirestack = source.data('invisibilityStack') - 1;
          source.data('invisibilityStack', expirestack);
          if (!expirestack) source.removeInvisibility();
        }
      });
    }
    return this;
  },
  removeInvisibility: function () {
    this.removeClass('invisible').off('action.invisible');
    return this;
  },
  illusion: function (cardEl) {
    var card = $(cardEl);
    return card.clone().data(card.data()).addClass('illusion').on('mousedown touchstart', game.card.select);
  },
  disableDiscard: function () {
    if (game.items.shopEnabled) {
      game.states.table.shop.attr('disabled', false);
      game.items.shopText();
    }
    else game.states.table.shop.attr('disabled', true);
  },
  enableDiscard: function () {
    game.states.table.shop.attr('disabled', false).text(game.data.ui.discard);
  },
  shopDicardClick: function () {
    if (!game.states.table.shop.attr('disabled')) {
      if (game.states.table.shop.text() == game.data.ui.discard) {
        game.skill.discardClick();
      } else {
        game.items.shopClick();
      }
    }
    return false;
  },
  discardClick: function () {
    if (game.selectedCard &&
        game.selectedCard.hasClass('skills') && 
        game.canPlay() ) {
      game.highlight.clearMap();
      game[game.selectedCard.side()].discard(game.selectedCard);
      game.skill.disableDiscard();
    }
  },
  discard: function (source, cb) {
    this.removeClass('draggable');
    if (this.hasClass('skills')) {
      if (this.hasClass('selected')) {
        if (source && source.canPlay()) source.select();
        else game.card.unselect();
      }
      this.trigger('discard', {target: this});
      var side = this.side();
      var to = this.data('discard-to');
      if (to) {
        this.appendTo(game.resolve(to));
      } else if (this.data('deck') === game.data.ui.temp) this.appendTo(game[side].skills.temp);
      else if (this.data('type') === game.data.ui.summon) this.appendTo(game.hidden);
      else this.appendTo(game[side].skills.cemitery);
      if (side == 'enemy') {
        this.addClass('flipped').removeClass('showMoves discardMove');
      }
    } else if (this.hasClass('items')) {
      this.appendTo(game.hidden);
    } else {
      if (this.closest('.map').length) this.parent().addClass('free');
      this.appendTo(game.hidden);
    }
    if (cb) cb();
    game.lockHighlight = false;
    game.highlight.refresh();
    return this;
  },
  getSkill: function (skill) {
    var side = this.side();
    var hero = this.data('hero');
    return $('.'+side+'decks .skills.' + hero + '-' + skill).first();
  }
};
