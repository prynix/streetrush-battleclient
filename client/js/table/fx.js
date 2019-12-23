game.fx = {
  ultList: {},
  heroes: {
    axe: {
      taunt: ['taunt'],
      enrage: ['enrage'],
      fire: ['fire'],
      counter: ['counter'],
      ult: ['ult','ult-kill']
    },
    cm: {
      slow: ['slow'],
      freeze: ['freeze'],
      ult: ['ult', 'ult1', 'ult2', 'ult3']
    },
    cat: {
      arrow: ['arrow', 'arrow-impact', 'arrow-source', 'arrow-source-horiz'],
      star: ['star'],
      leap: ['leap', 'leap-path'],
      ult: ['ult']
    },
    ld: {
      link: ['link'],
      roar: ['roar'],
      cry: ['cry'],
      return: ['return','return-target'],
      root: ['root']
    },
    lina: {
      fire: ['fire'],
      stun: ['stun'],
      passive: ['passive'],
      ult: ['ult-close', 'ult-far']
    },
    nyx: {
      stun: ['stun','stun1'],
      burn: ['burn'],
      spike: ['spike']
    },
    pud: {
      hook: ['hook'],
      rot: ['rot'],
      ult: ['ult']
    },
    kotl: {
      illuminate: ['illuminate'],
      mana: ['mana'],
      leak: ['leak'],
      ult: ['ult'],
      blind: ['blind'],
      recall: ['recall','recall-source']
    },
    venge: {
      stun: ['stun'],
      aura: ['aura', 'target'],
      corruption: ['corruption', 'corruption1'],
      ult: ['ult']
    },
    wind: {
      arrow: ['arrow']
    },
    wk: {
      stun: ['stun', 'stun-hit']
    },
    meteor: {
      cast: ['ult']
    },
    projectile: {
      hit: ['hit']
    }
  },
  units:{
    spawn:['spawn-unit']
  },
  build: function() {
    var img = $('<img>').appendTo(game.hidden);
    img.attr({ src: '/img/fx/ultfx.png' });
    var loaded = [];
    $.each(game.player.picks, function(i, hero) {
      $.each(game.fx.heroes[hero], function(skillname, fxarray) {
        if (fxarray)
          $.each(fxarray, function(j, fxname) {
            game.fx.preload(hero, fxname, skillname);
          });
      });
      loaded.push(hero);
    });
    $.each(game.enemy.picks, function(i, hero) {
      if (loaded.indexOf(hero) < 0) {
        $.each(game.fx.heroes[hero], function(skillname, fxarray) {
          if (fxarray)
            $.each(fxarray, function(j, fxname) {
              game.fx.preload(hero, fxname, skillname);
            });
        });
      }
    });
  },
  preload: function(hero, name, skill) {
    var str = hero+'-'+name;
    if (!game.hidden.children('.'+str).length) {
      var img = $('<img>').addClass(str).appendTo(game.hidden);
      img.attr({ src: '/img/fx/' + hero + '/' + name + '.png' });
    }
  },
  offset: {
    x: 210,
    y: 310
  },
  imgs: [],
  add: function(name, source, target, tag, append, custom, pos) {
    if (!target) target = source;
    var a = name.split('-');
    var hero = a[0];
    var skill = a[1];
    //console.log(hero,skill,name)
    if ( !game.recovering && game.fx.heroes[hero] && game.fx.heroes[hero][skill] || game.fx.units[hero]) {
      game.fx.stop(name, source);
      var side = $(source).side();
      if (!side) side = 'neutral';
      if (!custom) custom = '';
      var fx = $('<div>').addClass(name + ' fx fx-' + hero + ' '+side+' '+custom);
      var dirX = source.getX() - target.getX();
      var dirY = source.getY() - target.getY();
      if (tag == 'linear') {
        var dir = source.getDirectionStr(target);
        fx.addClass(dir + ' d'+ Math.abs(dirX || dirY));
      }
      if (tag == 'target') {
        if (Math.abs(dirX) > 1 || Math.abs(dirY) > 1) fx.addClass('far');
        else fx.addClass('close');
        fx.addClass('r' + dirX + dirY);
      }
      if (tag == 'rotate') {
        var angle = 180 * Math.atan2( (source.getX()-target.getX())*game.fx.offset.y, (target.getY()-source.getY())*game.fx.offset.y ) / Math.PI;
        fx.data('rotate', angle).appendTo(game.map.el);
        game.fx.projectileMove(fx, target, pos.scale, pos.offset);
        if (!append) append = game.map.el;
      }
      if (tag == 'flip') {
        if ( target.getX() < source.getX() ) fx.addClass('flip');
      }
      if (tag == 'random') {
        var n = game.fx.heroes[hero][skill].length;
        var r = Math.floor(Math.random() * n);
        if (r) fx.addClass(skill+r);
        game.timeout(50+(Math.random()*600), game.fx.append.bind(this, fx, target, append));
      }
      if (tag !== 'random') {
        game.fx.append(fx, target, append);
      }
      //console.log(fx)
      if (tag != 'keep') fx.on('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function () { this.remove(); });
      target.closest('.card').reselect();
      return fx;
    }
  },
  append: function (fx, target, append) {
    if (append) fx.appendTo(append);
    else fx.appendTo(target);
    game.fx.play(fx);
  },
  play: function(fx) {
    fx[0].style.animationPlayState = 'running';
  },
  pause: function(fx) {
    fx[0].style.animationPlayState = 'paused';
  },
  hide: function(fx) {
    game.fx.pause(fx);
    fx.removeClass('top bottom right left far close r-1-1 r-10 r-11 r0-1 r00 r01 r1-1 r10 r11 r-21 r-20 r-2-1 r21 r20 r2-1 r-1-2 r0-2 r1-2 r-12 r02 r12').appendTo(game.hidden);
  },
  stop: function(name, source) {
    var fx = source.find('.fx.'+name);
    fx.remove();
  },
  projectile: function (source, target, tag, scale) {
    if (!game.recovering) {
      var cl = source.data('hero');
      if (source.hasClass('towers')) cl = 'towers ' + source.side();
      if (source.hasClass('units')) cl = 'units ' + source.data('label') +' '+ source.side();
      if (tag) {
        if (typeof(tag) == 'string') cl += ' '+tag;
        else cl = tag.data('hero');
      }
      var projectile = $('<div>').addClass('projectile ' + cl);
      var angle = 180 * Math.atan2( (source.getX()-target.getX())*game.fx.offset.y, (target.getY()-source.getY())*game.fx.offset.y ) / Math.PI;
      //console.log(angle)
      projectile.data('rotate', angle).appendTo(game.map.el);
      game.fx.projectileMove(projectile, source, scale);
      game.timeout(65, game.fx.projectileMove.bind(this, projectile, target, scale));
      game.timeout(465, projectile.remove.bind(projectile));
      return projectile;
    }
  },
  projectileMove: function(projectile, target, scale, offset) {
    if (!scale) scale = 2.5;
    if (projectile && target) {
      var rotate = projectile.data('rotate') || 0;
      var x = target.getX();
      var y = target.getY();
      if (!offset) 
        projectile.css({
          'transform': 'translate(-50%, -50%) translate3d('+(110 + (x * game.fx.offset.x))+'px,'+(160 + (y * game.fx.offset.y))+'px, 20px) rotate('+rotate+'deg) scale('+scale+')'
        });
      else  
        projectile.css({
          'transform': 'translate(-50%, -50%) translate3d('+(110 + (x * game.fx.offset.x))+'px,'+(160 + (y * game.fx.offset.y))+'px, 20px) rotate('+rotate+'deg) translate('+(offset.x||0)+'px,'+(offset.y||0)+'px) scale('+scale+')'
        });
    }
  },
  textDelay: 600,
  text: function (card, color, val, t) {
    if (color == 'z') {
      for (var i=0; i<3; i++) {
        game.timeout(i*1000, game.fx.sleep.bind(this, card));
      } 
    } else if (val > 0 || typeof(val) == 'string') {
      var textFx = $('<span>').addClass('textfx '+color).text(val);
      var currentDelay = card.data('textFxDelay');
      if (!currentDelay) {
        textFx.appendTo(card);
        card.data('textFxDelay', game.fx.textDelay);
      } else {
        game.timeout(currentDelay, textFx.appendTo.bind(textFx, card));
        card.data('textFxDelay', currentDelay + game.fx.textDelay);
      }
      game.timeout(game.fx.textDelay, function () {
        card.data('textFxDelay', card.data('textFxDelay') - game.fx.textDelay);
      }.bind(this, card));
      if (t) game.timeout(t, textFx.remove.bind(textFx));
    }
  },
  sleep: function (card) {
    var textFx = $('<span>').addClass('textfx textsleep').text('z');
    textFx.appendTo(card);
  },
  buildUlt: function () {
    var ultfx = $('<div>').addClass('ultfx').appendTo(game.camera);
    for (var s=0; s<6; s++) {
      var star = $('<div>').appendTo(ultfx).addClass('ulfx star hide');
    }
    ultfx.append($('<div>').addClass('stripe1 stripes hide'));
    ultfx.append($('<div>').addClass('stripe2 stripes hide'));
    game.states.table.ultfx = ultfx;
  },
  ult: function(skill, cb, str) {// console.log(skill.data())
    var label = skill.data('label'),
        skillId = skill.data('skillId');
    if (label == 'ult' && !game.fx.ultList[skillId]) {
      game.fx.ultList[skillId] = true;
      $('.ultfx *').removeClass('hide');
      var fx = $('<div>').addClass(skillId+' fx');
      game.states.table.ultfx.append(fx);
      game.timeout(1900, function () {
        $('.ultfx .star').addClass('hide');
      });
      game.timeout(2100, function () {
        if (game.states.table.ultfx && game.states.table.ultfx.children) 
          game.states.table.ultfx.children('.fx').remove();
          $('.ultfx .stripes').addClass('hide');
        if (str) game.audio.play(str);
        if (cb) cb();
      });
    } else if (cb) cb();
  },
  shake: function() {
    var state = game.states[game.currentState].el;
    state.addClass('shake');
    setTimeout(function() {
      this.removeClass('shake');
    }
    .bind(state), 260);
  },
  clear: function() {
    $('.ultfx *').addClass('hide');
    if (game.states.table.ultfx && game.states.table.ultfx.children) 
      game.states.table.ultfx.children('.fx').remove();
    $('.map .fx').remove();
    game.fx.ultList = {};
  }
};
