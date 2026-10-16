/* App: navegación, pizarra, Mi rol, juegos A y B, ficha y Cómo jugamos. */
(function () {
  'use strict';
  var CAI = window.CAI;
  var store = CAI.store;
  var view = document.getElementById('view');
  var alerts = document.getElementById('alerts');
  var modal = document.getElementById('modal');
  var chip = document.getElementById('playerChip');

  var DIAS_BLOQUEO = 7;
  var MS_BLOQUEO = DIAS_BLOQUEO * 24 * 60 * 60 * 1000;
  var SPEEDS = { normal: { dur: 1000, hold: 900 }, lenta: { dur: 1800, hold: 1500 } };

  /* ================= Datos ================= */
  var D;
  try {
    D = CAI.prepare(window.CAI_DATA);
  } catch (e) {
    D = { roles: [], rolesById: {}, fases: [], fasesById: {}, juegoA: [], juegoB: [], comoJugamos: [],
      issues: [{ nivel: 'error', donde: 'data.js', que: 'No se pudieron leer los datos: ' + e.message }] };
  }
  reportIssues(D.issues);

  /* ================= Estado guardado ================= */
  var S = {
    nombre: str(store.get('nombre', '')),
    rol: store.get('rol', null),
    carriles: store.get('carriles', true) !== false,
    velocidad: store.get('velocidad', 'normal') === 'lenta' ? 'lenta' : 'normal'
  };
  if (S.rol === 'ENG') setPref('rol', '10'); // el enganche pasó a llamarse 10
  if (S.rol && !D.rolesById[S.rol]) S.rol = null;

  function str(v) { return typeof v === 'string' ? v : ''; }
  function setPref(key, val) { S[key] = val; store.set(key, val); }

  function intentos() {
    var v = store.get('intentos', []);
    return Array.isArray(v) ? v.filter(function (a) { return a && a.id && typeof a.ts === 'number'; }) : [];
  }
  function guardarIntento(a) {
    var list = intentos();
    list.push(a);
    store.set('intentos', list);
  }
  function ultimoIntento(id) {
    var list = intentos(), last = null;
    list.forEach(function (a) { if (a.id === id && (!last || a.ts > last.ts)) last = a; });
    return last;
  }
  function bloqueo(id) {
    var a = ultimoIntento(id);
    if (!a) return null;
    var hasta = a.ts + MS_BLOQUEO;
    return hasta > Date.now() ? { intento: a, hasta: hasta } : null;
  }

  /* ================= Utilidades ================= */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || view).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || view).querySelectorAll(sel)); }
  function fecha(ts) {
    var d = new Date(ts);
    var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dias[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
  }
  function pct(n) { return Math.round(n) + ' %'; }
  function prom(list) { return list.length ? list.reduce(function (s, a) { return s + a.puntaje; }, 0) / list.length : null; }
  function rolNombre(id) { return (D.rolesById[id] && D.rolesById[id].nombre) || id; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var ICON = {
    prev: '<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    again: '<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>'
  };

  /* ================= Avisos ================= */
  function reportIssues(issues) {
    if (!issues.length) return;
    var errores = issues.filter(function (i) { return i.nivel === 'error'; });
    if (console && console.groupCollapsed) {
      console.groupCollapsed('[CAI Sub-17] Revisión de datos: ' + errores.length + ' error(es), ' + (issues.length - errores.length) + ' aviso(s)');
      issues.forEach(function (i) { console.warn('[' + i.nivel + '] ' + i.donde + ': ' + i.que); });
      console.groupEnd();
    }
    if (!errores.length) return;
    var max = 8;
    showAlert('error',
      '<b>Hay ' + errores.length + ' problema' + (errores.length > 1 ? 's' : '') + ' en los datos (js/data.js).</b> La app sigue funcionando con lo que se pudo cargar.' +
      '<ul>' + errores.slice(0, max).map(function (i) { return '<li>' + esc(i.donde) + ': ' + esc(i.que) + '</li>'; }).join('') + '</ul>' +
      (errores.length > max ? '<div>…y ' + (errores.length - max) + ' más (ver la consola).</div>' : ''));
  }

  function showAlert(kind, html) {
    var d = document.createElement('div');
    d.className = 'alert' + (kind === 'info' ? ' info' : '');
    d.setAttribute('role', kind === 'info' ? 'status' : 'alert');
    d.innerHTML = '<button class="close" aria-label="Cerrar aviso">×</button>' + html;
    d.querySelector('.close').addEventListener('click', function () { d.remove(); });
    alerts.appendChild(d);
  }

  if (!store.available()) {
    showAlert('info', 'Este navegador no deja guardar datos. La demo funciona igual, pero tu nombre y tus respuestas se pierden al cerrar.');
  }

  /* ================= Nombre del jugador ================= */
  function updateChip() {
    chip.hidden = !S.nombre;
    chip.textContent = S.nombre;
  }

  function pedirNombre(force) {
    if (S.nombre && !force) return;
    modal.innerHTML =
      '<form class="modal-box" novalidate>' +
      '<h2>' + (force ? 'Cambiar nombre' : '¡Bienvenido!') + '</h2>' +
      '<p>¿Cómo te dicen? Es solo para mostrar en tu ficha y queda guardado en tu celular.</p>' +
      '<input type="text" name="n" maxlength="24" autocomplete="nickname" placeholder="Nombre o apodo" value="' + esc(S.nombre) + '">' +
      '<div class="btn-row">' + (force ? '<button type="button" class="btn secondary" data-x>Cancelar</button>' : '') +
      '<button class="btn" type="submit" disabled>Entrar</button></div>' +
      '</form>';
    modal.hidden = false;
    var form = modal.querySelector('form'), input = form.n, btn = form.querySelector('[type=submit]');
    function check() { btn.disabled = !input.value.trim(); }
    input.addEventListener('input', check);
    check();
    setTimeout(function () { input.focus(); }, 50);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim().slice(0, 24);
      if (!v) return;
      setPref('nombre', v);
      updateChip();
      modal.hidden = true; modal.innerHTML = '';
      route();
    });
    var x = form.querySelector('[data-x]');
    if (x) x.addEventListener('click', function () { modal.hidden = true; modal.innerHTML = ''; });
  }

  /* ================= Navegación ================= */
  var cleanup = null;

  function route() {
    if (cleanup) { try { cleanup(); } catch (e) { /* nada */ } cleanup = null; }
    var h = (location.hash || '#pizarra').slice(1).split('/').map(function (s) {
      try { return decodeURIComponent(s); } catch (e) { return s; }
    });
    var tab = h[0] || 'pizarra';
    $all('.tabbar a', document).forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-tab') === tab); });
    window.scrollTo(0, 0);
    try {
      if (tab === 'pizarra') h[1] ? screenFase(h[1]) : screenFases();
      else if (tab === 'jugar') {
        if (!h[1]) screenJuegos();
        else if (!h[2]) screenElegirRol(h[1]);
        else if (!h[3]) screenEscenarios(h[1], h[2]);
        else screenJugar(h[1], h[2], h[3]);
      }
      else if (tab === 'como') screenComo();
      else if (tab === 'ficha') screenFicha();
      else screenFases();
    } catch (e) {
      view.innerHTML = '<div class="card"><h3>Algo salió mal</h3><p class="muted">' + esc(e.message) + '</p><p class="mt"><a href="#pizarra">Volver al inicio</a></p></div>';
      if (console && console.error) console.error(e);
    }
  }

  function head(title, backHref, backText) {
    return '<div class="screen-head">' +
      (backHref ? '<a class="back" href="' + backHref + '">' + esc(backText || 'Volver') + '</a>' : '') +
      '<h2>' + esc(title) + '</h2></div>';
  }

  function nuevoPitch(container, opts) {
    var p = new CAI.Pitch(container, opts);
    return p;
  }

  /* ================= PIZARRA: lista ================= */
  function screenFases() {
    view.innerHTML = head('Pizarra') +
      '<p class="screen-sub">Elegí una fase para ver cómo se mueve el equipo en el 1-4-1-3-2.</p>' +
      '<ul class="list">' + D.fases.map(function (f) {
        return '<li><a class="list-item' + (f.ok ? '' : ' disabled') + '" href="#pizarra/' + encodeURIComponent(f.id) + '">' +
          '<span class="num">' + f.num + '</span>' +
          '<span class="body"><span class="title">' + esc(f.nombre) + '</span>' +
          '<span class="meta">' + esc(f.subtitulo) + (f.ok ? ' · ' + f.pasos.length + (f.pasos.length === 1 ? ' paso' : ' pasos') : ' · con errores en los datos') + '</span></span>' +
          '<span class="chev">›</span></a></li>';
      }).join('') + '</ul>' +
      (D.fases.length ? '' : '<div class="card">No hay fases cargadas.</div>');
  }

  /* ================= PIZARRA: reproductor ================= */
  function stateOf(paso) { return { propios: paso.propios, rivales: paso.rivales, pelota: paso.pelota }; }

  function lerpState(a, b, t) {
    var out = { propios: {}, rivales: [], pelota: null }, r;
    for (r in b.propios) {
      var pa = a.propios[r], pb = b.propios[r];
      out.propios[r] = pa ? { x: lerp(pa.x, pb.x, t), y: lerp(pa.y, pb.y, t) } : pb;
    }
    if (a.rivales.length === b.rivales.length) {
      out.rivales = b.rivales.map(function (q, i) { var p = a.rivales[i]; return { x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) }; });
    } else out.rivales = t < 1 ? a.rivales : b.rivales;
    if (a.pelota && b.pelota) out.pelota = { x: lerp(a.pelota.x, b.pelota.x, t), y: lerp(a.pelota.y, b.pelota.y, t) };
    else out.pelota = t < 1 ? a.pelota : b.pelota;
    return out;
  }

  function Player(pitch, pasos, hooks) {
    var idx = 0, disp = stateOf(pasos[0]), raf = 0, timer = 0, playing = false;
    function speed() { return SPEEDS[S.velocidad] || SPEEDS.normal; }
    function draw(s) { disp = s; pitch.render(s); }
    function settle() { pitch.drawArrows(pasos[idx].flechas); }
    function animateTo(i, done) {
      cancelAnimationFrame(raf);
      pitch.drawArrows([]);
      var from = disp, to = stateOf(pasos[i]), dur = speed().dur, t0 = 0;
      idx = i; hooks.onStep(idx);
      function frame(now) {
        if (!t0) t0 = now;
        var t = Math.min(1, (now - t0) / dur);
        draw(lerpState(from, to, ease(t)));
        if (t < 1) raf = requestAnimationFrame(frame);
        else { raf = 0; settle(); if (done) done(); }
      }
      raf = requestAnimationFrame(frame);
    }
    function jump(i) {
      cancelAnimationFrame(raf); raf = 0;
      idx = i; draw(stateOf(pasos[i])); settle(); hooks.onStep(idx);
    }
    function setPlaying(v) { playing = v; hooks.onPlay(v); }
    function step() {
      if (!playing) return;
      if (idx >= pasos.length - 1) { setPlaying(false); return; }
      animateTo(idx + 1, function () {
        if (!playing) return;
        if (idx >= pasos.length - 1) setPlaying(false);
        else timer = setTimeout(step, speed().hold);
      });
    }
    var api = {
      get index() { return idx; },
      get playing() { return playing; },
      play: function () {
        if (pasos.length < 2) return;
        clearTimeout(timer);
        setPlaying(true);
        if (idx >= pasos.length - 1) { jump(0); timer = setTimeout(step, speed().hold); }
        else step();
      },
      pause: function () { clearTimeout(timer); setPlaying(false); },
      toggle: function () { playing ? api.pause() : api.play(); },
      go: function (i) {
        i = Math.max(0, Math.min(pasos.length - 1, i));
        api.pause();
        if (i !== idx) animateTo(i);
      },
      restart: function () {
        api.pause();
        jump(0);
        if (pasos.length > 1) { setPlaying(true); timer = setTimeout(step, speed().hold); }
      },
      destroy: function () { cancelAnimationFrame(raf); clearTimeout(timer); playing = false; }
    };
    jump(0);
    return api;
  }

  function rolesPicker(selected, withAll) {
    var order = ['ARQ', 'LD', 'ZD', 'ZI', 'LI', '5', 'VD', 'VI', '10', 'DD', 'DI'].filter(function (r) { return D.rolesById[r]; });
    var html = '<div class="roles" role="group" aria-label="Elegí tu rol">';
    if (withAll) html += '<button class="role-btn' + (!selected ? ' on' : '') + '" data-rol="" aria-pressed="' + !selected + '">Todos</button>';
    html += order.map(function (r) {
      return '<button class="role-btn' + (selected === r ? ' on' : '') + '" data-rol="' + esc(r) + '" aria-pressed="' + (selected === r) + '" title="' + esc(rolNombre(r)) + '">' + esc(r) + '</button>';
    }).join('');
    return html + '</div>';
  }

  function screenFase(id) {
    var fase = D.fasesById[id];
    if (!fase || !fase.ok) {
      view.innerHTML = head('Fase no disponible', '#pizarra', 'Fases') + '<div class="card">Esta fase no existe o tiene errores en los datos.</div>';
      return;
    }
    var n = fase.pasos.length;
    view.innerHTML = head(fase.num + ' · ' + fase.nombre, '#pizarra', 'Fases') +
      '<div class="board-grid"><div>' +
      rolesPicker(S.rol, true) +
      '<div class="pitch-wrap" id="pw"></div>' +
      '<div class="step-cap" aria-live="polite"><b id="stepN"></b><span id="stepT"></span></div>' +
      '<div class="controls">' +
      '<button class="ctrl" id="bPrev" aria-label="Paso anterior">' + ICON.prev + '</button>' +
      '<button class="ctrl primary" id="bPlay" aria-label="Reproducir">' + ICON.play + '</button>' +
      '<button class="ctrl" id="bNext" aria-label="Paso siguiente">' + ICON.next + '</button>' +
      '<button class="ctrl" id="bAgain" aria-label="Repetir desde el inicio">' + ICON.again + '</button>' +
      '</div>' +
      (n > 1 ? '<input class="range" id="rStep" type="range" min="1" max="' + n + '" step="1" value="1" aria-label="Elegir paso">' : '') +
      '<div class="toggles">' +
      '<span class="seg" role="group" aria-label="Velocidad"><button data-v="normal">Normal</button><button data-v="lenta">Lenta</button></span>' +
      '<label class="check"><input type="checkbox" id="cLanes"' + (S.carriles ? ' checked' : '') + '> Carriles</label>' +
      '</div>' +
      '<div class="legend"><span><i class="l-own"></i>Nosotros</span><span><i class="l-riv"></i>Rival</span><span><i class="l-ball"></i>Pelota</span>' +
      '<span>— pase</span><span>- - movimiento</span></div>' +
      '</div><div>' +
      '<div class="card"><h3>' + esc(fase.subtitulo || 'La idea') + '</h3><p class="phase-text">' + esc(fase.texto) + '</p></div>' +
      '<div id="roleCard"></div>' +
      '</div></div>';

    var pitch = nuevoPitch($('#pw'), { lanes: S.carriles, label: 'Cancha: ' + fase.nombre });
    var bPlay = $('#bPlay'), bPrev = $('#bPrev'), bNext = $('#bNext'), bAgain = $('#bAgain'), range = $('#rStep');
    var rol = S.rol;

    function paintRole() {
      pitch.setFocus(rol);
      if (rol) {
        pitch.drawTrail(fase.pasos.map(function (p) { return p.propios[rol]; }).filter(Boolean), player ? player.index : 0);
      } else pitch.drawTrail([]);
      var card = $('#roleCard');
      if (!rol) {
        card.innerHTML = '<div class="card muted">Elegí tu rol arriba para ver qué hacés en esta fase, con tu recorrido marcado en la cancha.</div>';
        return;
      }
      var t = fase.roles[rol];
      card.innerHTML = '<div class="card role-card">' +
        '<div class="rc-head"><span class="rc-sig">' + esc(rol) + '</span><div><b>' + esc(rolNombre(rol)) + '</b>' +
        (t && t.propuesta ? '<div><span class="badge review">Propuesta para revisar</span></div>' : '') + '</div></div>' +
        (t ? '<dl><dt>Qué hago</dt><dd>' + esc(t.hago) + '</dd>' +
          (t.si.length ? '<dt>Qué hago si…</dt>' + t.si.map(function (s) { return '<dd class="si"><b>…' + esc(s.si) + ':</b> ' + esc(s.hago) + '</dd>'; }).join('') : '') +
          '</dl>' : '<p class="muted">Todavía no hay texto para este rol en esta fase.</p>') +
        '</div>';
    }

    var player = null;
    player = Player(pitch, fase.pasos, {
      onStep: function (i) {
        $('#stepN').textContent = n > 1 ? 'Paso ' + (i + 1) + '/' + n : 'Foto fija';
        $('#stepT').textContent = fase.pasos[i].titulo;
        if (range) range.value = String(i + 1);
        bPrev.disabled = i === 0;
        bNext.disabled = i >= n - 1;
        if (rol) pitch.drawTrail(fase.pasos.map(function (p) { return p.propios[rol]; }).filter(Boolean), i);
      },
      onPlay: function (on) {
        bPlay.innerHTML = on ? ICON.pause : ICON.play;
        bPlay.setAttribute('aria-label', on ? 'Pausa' : 'Reproducir');
      }
    });
    if (n < 2) { bPlay.disabled = true; bAgain.disabled = true; }
    paintRole();

    bPlay.addEventListener('click', function () { player.toggle(); });
    bPrev.addEventListener('click', function () { player.go(player.index - 1); });
    bNext.addEventListener('click', function () { player.go(player.index + 1); });
    bAgain.addEventListener('click', function () { player.restart(); });
    if (range) range.addEventListener('input', function () { player.go(parseInt(range.value, 10) - 1); });

    function paintSpeed() { $all('.seg button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === S.velocidad); }); }
    paintSpeed();
    $all('.seg button').forEach(function (b) {
      b.addEventListener('click', function () { setPref('velocidad', b.getAttribute('data-v')); paintSpeed(); });
    });
    $('#cLanes').addEventListener('change', function (e) { setPref('carriles', e.target.checked); pitch.setLanes(e.target.checked); });

    $all('.roles .role-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        rol = b.getAttribute('data-rol') || null;
        setPref('rol', rol);
        $all('.roles .role-btn').forEach(function (x) {
          var on = (x.getAttribute('data-rol') || null) === rol;
          x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on));
        });
        paintRole();
      });
    });

    cleanup = function () { player.destroy(); };
  }

  /* ================= JUGAR ================= */
  var JUEGOS = {
    A: { nombre: '¿A dónde pasás?', desc: 'Una jugada congelada con la pelota en tu rol. Tocá a dónde la pasás.', lista: function () { return D.juegoA; } },
    B: { nombre: '¿Dónde me paro?', desc: 'Falta tu ficha en la cancha. Arrastrala a donde tenés que estar.', lista: function () { return D.juegoB; } }
  };

  function screenJuegos() {
    view.innerHTML = head('Jugar') +
      '<p class="screen-sub">Un intento por escenario. Cada uno se vuelve a habilitar a los ' + DIAS_BLOQUEO + ' días.</p>' +
      '<ul class="list">' + ['A', 'B'].map(function (k) {
        var j = JUEGOS[k], total = j.lista().length;
        return '<li><a class="list-item" href="#jugar/' + k + '"><span class="num">' + k + '</span>' +
          '<span class="body"><span class="title">' + esc(j.nombre) + '</span><span class="meta">' + esc(j.desc) + ' · ' + total + ' escenarios</span></span>' +
          '<span class="chev">›</span></a></li>';
      }).join('') + '</ul>';
  }

  function screenElegirRol(k) {
    var j = JUEGOS[k];
    if (!j) { location.hash = '#jugar'; return; }
    var lista = j.lista();
    var order = ['ARQ', 'LD', 'ZD', 'ZI', 'LI', '5', 'VD', 'VI', '10', 'DD', 'DI'];
    view.innerHTML = head('Juego ' + k + ' · ' + j.nombre, '#jugar', 'Juegos') +
      '<p class="screen-sub">Elegí tu rol. Solo vas a ver escenarios de ese rol.</p>' +
      '<div class="roles big">' + order.map(function (r) {
        var cnt = lista.filter(function (e) { return e.rol === r; }).length;
        return '<button class="role-btn' + (S.rol === r ? ' on' : '') + '" data-rol="' + esc(r) + '"' + (cnt ? '' : ' disabled') + '>' + esc(r) +
          '<small>' + (cnt ? cnt + (cnt === 1 ? ' escenario' : ' escenarios') : 'sin escenarios') + '</small></button>';
      }).join('') + '</div>' +
      '<p class="muted">Los roles sin escenarios se van a ir sumando en la versión completa.</p>';
    $all('.role-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = b.getAttribute('data-rol');
        setPref('rol', r);
        location.hash = '#jugar/' + k + '/' + encodeURIComponent(r);
      });
    });
  }

  function screenEscenarios(k, rol) {
    var j = JUEGOS[k];
    if (!j || !D.rolesById[rol]) { location.hash = '#jugar'; return; }
    var lista = j.lista().filter(function (e) { return e.rol === rol; });
    view.innerHTML = head('Juego ' + k + ' · ' + rol, '#jugar/' + k, 'Roles') +
      '<p class="screen-sub">' + esc(rolNombre(rol)) + ' · ' + esc(j.nombre) + '</p>' +
      (lista.length ? '<ul class="list">' + lista.map(function (e, i) {
        var b = bloqueo(e.id);
        var meta = b ? 'Respondido: ' + pct(b.intento.puntaje) + ' · se habilita el ' + esc(fecha(b.hasta)) : 'Disponible';
        return '<li><a class="list-item' + (b ? ' locked' : '') + '" href="#jugar/' + k + '/' + encodeURIComponent(rol) + '/' + encodeURIComponent(e.id) + '">' +
          '<span class="num">' + (i + 1) + '</span><span class="body"><span class="title">' + esc(e.titulo) + '</span>' +
          '<span class="meta">' + meta + '</span></span><span class="chev">' + (b ? '✓' : '›') + '</span></a></li>';
      }).join('') + '</ul>' : '<div class="card">No hay escenarios para este rol todavía.</div>');
  }

  function screenJugar(k, rol, id) {
    var lista = JUEGOS[k] ? JUEGOS[k].lista() : [];
    var e = lista.filter(function (x) { return x.id === id && x.rol === rol; })[0];
    if (!e) { location.hash = '#jugar/' + k + '/' + encodeURIComponent(rol); return; }
    var backHref = '#jugar/' + k + '/' + encodeURIComponent(rol);
    var b = bloqueo(e.id);
    if (k === 'A') juegoA(e, backHref, b); else juegoB(e, backHref, b);
  }

  function resultFooter(e, backHref, hasta) {
    return '<p class="locked-note mt">Este escenario se vuelve a habilitar el ' + esc(fecha(hasta)) + '.</p>' +
      '<div class="btn-row mt"><a class="btn" href="' + backHref + '">Ver escenarios</a><a class="btn secondary" href="#ficha">Mi ficha</a></div>';
  }

  /* ---------- Juego A ---------- */
  function juegoA(e, backHref, bloq) {
    view.innerHTML = head('Juego A · ' + e.titulo, backHref, 'Escenarios') +
      '<p class="prompt">' + esc(e.consigna) + ' Sos el <b>' + esc(e.rol) + '</b>: tocá en la cancha a dónde la pasás y confirmá.</p>' +
      '<div class="pitch-wrap" id="pw"></div>' +
      '<div class="legend"><span><i class="l-own"></i>Nosotros</span><span><i class="l-riv"></i>Rival</span><span><i class="l-ball"></i>Pelota</span></div>' +
      '<div id="zone"></div>';
    var pitch = nuevoPitch($('#pw'), { lanes: S.carriles, className: 'tap', label: 'Cancha del escenario' });
    pitch.render(e.situacion);
    pitch.setFocus(e.rol, true);
    var zone = $('#zone');
    var punto = null, done = false;

    function puntaje(p) {
      if (CAI.inEllipse(p, e.ideal)) return { v: 100, cls: 'good', txt: 'Zona ideal' };
      if (CAI.inEllipse(p, e.aceptable)) return { v: 60, cls: 'mid', txt: 'Zona aceptable' };
      return { v: 0, cls: 'bad', txt: 'Fuera de las zonas' };
    }

    function mostrarResultado(p, hasta, repaso) {
      done = true;
      pitch.svg.classList.remove('tap');
      var r = puntaje(p);
      pitch.drawZones([
        { x: e.aceptable.x, y: e.aceptable.y, rx: e.aceptable.rx, ry: e.aceptable.ry, kind: 'ok', label: 'Aceptable' },
        { x: e.ideal.x, y: e.ideal.y, rx: e.ideal.rx, ry: e.ideal.ry, kind: 'ideal', label: 'Ideal' }
      ]);
      pitch.setMarker(p, r.v ? 'good' : 'bad');
      zone.innerHTML = '<div class="card result ' + r.cls + '">' +
        (repaso ? '<p class="muted">Ya lo respondiste. Así quedó:</p>' : '') +
        '<div class="big">' + r.v + ' %</div>' +
        '<div class="kind">' + r.txt + '</div>' +
        '<p>' + esc(e.explicacion) + '</p>' +
        '<div class="legend mt"><span><i class="l-ideal"></i>Ideal (100 %): ' + esc(e.ideal.nombre) + '</span>' +
        '<span><i class="l-ok"></i>Aceptable (60 %): ' + esc(e.aceptable.nombre) + '</span><span>✛ tu pase</span></div>' +
        resultFooter(e, backHref, hasta) + '</div>';
    }

    if (bloq) {
      if (bloq.intento.punto) mostrarResultado(bloq.intento.punto, bloq.hasta, true);
      else zone.innerHTML = '<div class="card">Ya respondiste este escenario.' + resultFooter(e, backHref, bloq.hasta) + '</div>';
      return;
    }

    zone.innerHTML = '<button class="btn block" id="bOk" disabled>Confirmar pase</button><p class="muted mt" id="hint">Tocá un punto de la cancha.</p>';
    var bOk = $('#bOk');
    pitch.svg.addEventListener('click', function (ev) {
      if (done) return;
      var p = pitch.toUnits(ev.clientX, ev.clientY);
      if (!p || !pitch.inField(p)) return;
      punto = { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
      pitch.setMarker(punto, 'pick');
      bOk.disabled = false;
      $('#hint').textContent = 'Podés tocar otro punto para cambiarlo. Cuando estés seguro, confirmá.';
    });
    bOk.addEventListener('click', function () {
      if (!punto || done) return;
      var r = puntaje(punto), ts = Date.now();
      guardarIntento({ id: e.id, juego: 'A', rol: e.rol, puntaje: r.v, punto: punto, ts: ts });
      mostrarResultado(punto, ts + MS_BLOQUEO, false);
      zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* ---------- Juego B ---------- */
  function juegoB(e, backHref, bloq) {
    view.innerHTML = head('Juego B · ' + e.titulo, backHref, 'Escenarios') +
      '<p class="prompt">' + esc(e.consigna) + ' Sos el <b>' + esc(e.rol) + '</b>: arrastrá tu ficha y confirmá.</p>' +
      '<div class="pitch-wrap" id="pw"></div>' +
      '<div id="zone"></div>';
    var pitch = nuevoPitch($('#pw'), { lanes: S.carriles, strip: true, className: 'drag', label: 'Cancha del escenario: arrastrá tu ficha' });
    var sit = e.situacion, rol = e.rol;
    var otros = {};
    for (var r in sit.propios) if (r !== rol) otros[r] = sit.propios[r];
    var home = pitch.stripSpot();
    var pos = home;
    var state = { propios: otros, rivales: sit.rivales, pelota: sit.pelota };
    state.propios[rol] = pos;
    pitch.render(state);
    pitch.setFocus(rol, true);
    var tk = pitch.tokens[rol];
    var hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hit.setAttribute('r', '5'); hit.setAttribute('class', 'hit');
    tk.g.insertBefore(hit, tk.g.firstChild);
    var halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', '6.5'); halo.setAttribute('class', 'halo');
    tk.g.insertBefore(halo, tk.g.firstChild);

    var zone = $('#zone');
    var done = false;

    function mostrarResultado(p, hasta, repaso) {
      done = true;
      var ok = CAI.inEllipse(p, e.zona);
      pitch.moveToken(rol, p);
      pitch.drawZones([{ x: e.zona.x, y: e.zona.y, rx: e.zona.rx, ry: e.zona.ry, kind: 'zona', label: 'Acá' }]);
      tk.g.classList.add(ok ? 'good' : 'bad');
      if (pitch.stripTextEl) pitch.stripTextEl.textContent = '';
      zone.innerHTML = '<div class="card result ' + (ok ? 'good' : 'bad') + '">' +
        (repaso ? '<p class="muted">Ya lo respondiste. Así quedó:</p>' : '') +
        '<div class="big">' + (ok ? '¡Bien ubicado!' : 'No es ahí') + '</div>' +
        '<div class="kind">' + (ok ? 'Quedaste adentro de la zona.' : 'Quedaste afuera de la zona. Fijate dónde era.') + '</div>' +
        '<p>' + esc(e.explicacion) + '</p>' +
        '<div class="legend mt"><span><i class="l-ideal"></i>Zona correcta</span><span><i class="l-own"></i>Tu ficha (' + esc(rol) + ')</span></div>' +
        resultFooter(e, backHref, hasta) + '</div>';
    }

    if (bloq) {
      pitch.svg.classList.remove('drag');
      if (bloq.intento.punto) mostrarResultado(bloq.intento.punto, bloq.hasta, true);
      else zone.innerHTML = '<div class="card">Ya respondiste este escenario.' + resultFooter(e, backHref, bloq.hasta) + '</div>';
      return;
    }

    zone.innerHTML = '<button class="btn block" id="bOk" disabled>Confirmar posición</button><p class="muted mt" id="hint">Arrastrá tu ficha desde la franja de abajo hasta la cancha.</p>';
    var bOk = $('#bOk'), hint = $('#hint');
    var svg = pitch.svg, dragging = false, pid = null, off = { x: 0, y: 0 };

    function clamp(p) { return { x: Math.max(0, Math.min(100, p.x)), y: Math.max(home.y - 2, Math.min(100, p.y)) }; }
    function move(p) { if (!p) return; pos = clamp({ x: p.x + off.x, y: p.y + off.y }); pitch.moveToken(rol, pos); }
    function placed() { return pitch.inField(pos); }

    svg.addEventListener('pointerdown', function (ev) {
      if (done || (ev.button !== undefined && ev.button > 0)) return;
      var p = pitch.toUnits(ev.clientX, ev.clientY);
      if (!p) return;
      var onTok = ev.target && ev.target.closest && ev.target.closest('.own-tok') === tk.g;
      off = onTok ? { x: pos.x - p.x, y: pos.y - p.y } : { x: 0, y: 0 };
      dragging = true; pid = ev.pointerId;
      try { svg.setPointerCapture(pid); } catch (err) { /* nada */ }
      ev.preventDefault();
      tk.g.classList.add('dragging');
      move(p);
    });
    svg.addEventListener('pointermove', function (ev) {
      if (!dragging || ev.pointerId !== pid) return;
      ev.preventDefault();
      move(pitch.toUnits(ev.clientX, ev.clientY));
    });
    function end(ev) {
      if (!dragging || ev.pointerId !== pid) return;
      dragging = false; pid = null;
      tk.g.classList.remove('dragging');
      if (!placed()) { pos = home; pitch.moveToken(rol, pos); }
      bOk.disabled = !placed();
      hint.textContent = placed() ? 'Podés moverla las veces que quieras. Cuando estés seguro, confirmá.' : 'Soltala adentro de la cancha.';
    }
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    // Respaldo para navegadores viejos: que el arrastre nunca mueva la página.
    svg.addEventListener('touchmove', function (ev) { if (dragging) ev.preventDefault(); }, { passive: false });

    bOk.addEventListener('click', function () {
      if (done || !placed()) return;
      var p = { x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10 };
      var ok = CAI.inEllipse(p, e.zona), ts = Date.now();
      guardarIntento({ id: e.id, juego: 'B', rol: rol, puntaje: ok ? 100 : 0, punto: p, ts: ts });
      svg.classList.remove('drag');
      mostrarResultado(p, ts + MS_BLOQUEO, false);
      zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* ================= CÓMO JUGAMOS ================= */
  function screenComo() {
    view.innerHTML = head('Cómo jugamos') +
      '<p class="screen-sub">El 1-4-1-3-2: cuatro defensores, el 5, una línea de tres volantes y dos delanteros. Ocho ideas para tener claras.</p>' +
      D.comoJugamos.map(function (c, i) {
        return '<div class="card idea' + (c.alerta ? ' warn' : '') + '"><span class="num">' + (i + 1) + '</span><div><h3>' + esc(c.titulo) + '</h3>' +
          '<ul>' + c.lineas.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div></div>';
      }).join('');
  }

  /* ================= MI FICHA ================= */
  function screenFicha() {
    var list = intentos();
    var todos = D.juegoA.concat(D.juegoB);
    var validos = {};
    todos.forEach(function (e) { validos[e.id] = e; });
    list = list.filter(function (a) { return validos[a.id]; });
    var A = list.filter(function (a) { return a.juego === 'A'; }), B = list.filter(function (a) { return a.juego === 'B'; });
    var resueltos = {};
    list.forEach(function (a) { resueltos[a.id] = true; });
    var nRes = Object.keys(resueltos).length;
    function v(n) { return n === null ? '—' : pct(n); }

    var order = ['ARQ', 'LD', 'ZD', 'ZI', 'LI', '5', 'VD', 'VI', '10', 'DD', 'DI'];
    var filas = order.map(function (r) {
      var esc_ = todos.filter(function (e) { return e.rol === r; });
      if (!esc_.length) return '';
      var ar = list.filter(function (a) { return a.rol === r; });
      var res = esc_.filter(function (e) { return resueltos[e.id]; }).length;
      return '<tr><td><b>' + esc(r) + '</b> <span class="muted">' + esc(rolNombre(r)) + '</span></td><td class="n">' + res + '/' + esc_.length + '</td><td class="n">' + v(prom(ar)) + '</td></tr>';
    }).join('');

    view.innerHTML = head('Mi ficha') +
      '<div class="card"><div class="rc-head" style="display:flex;align-items:center;justify-content:space-between;gap:10px">' +
      '<div><div class="muted">Jugador</div><div style="font-size:22px;font-weight:800">' + esc(S.nombre || 'Sin nombre') + '</div></div>' +
      '<button class="btn secondary" id="bName">Cambiar</button></div></div>' +
      '<div class="stats">' +
      '<div class="stat main"><div class="v">' + v(prom(list)) + '</div><div class="k">Global · ' + list.length + (list.length === 1 ? ' respuesta' : ' respuestas') + '</div></div>' +
      '<div class="stat"><div class="v">' + v(prom(A)) + '</div><div class="k">Juego A · ¿A dónde pasás?</div></div>' +
      '<div class="stat"><div class="v">' + v(prom(B)) + '</div><div class="k">Juego B · ¿Dónde me paro?</div></div>' +
      '<div class="stat" style="grid-column:1/-1"><div class="v">' + nRes + ' <span style="font-size:18px;color:var(--texto-2)">de ' + todos.length + '</span></div><div class="k">Escenarios resueltos</div></div>' +
      '</div>' +
      '<div class="card"><h3>Por rol</h3><table class="roles-t"><thead><tr><th>Rol</th><th class="n">Resueltos</th><th class="n">%</th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
      '<p class="muted">Tus resultados quedan solo en este celular. No hay rankings ni comparaciones.</p>' +
      (store.available() ? '' : '<p class="muted mt">Este navegador no deja guardar: al cerrar se pierden.</p>') +
      '<details class="dev"><summary>Opciones de demo</summary>' +
      '<p>Para probar la demo podés liberar todos los escenarios. Se borran tus respuestas de este celular.</p>' +
      '<button class="btn danger" id="bReset">Reiniciar mis intentos</button></details>';

    $('#bName').addEventListener('click', function () { pedirNombre(true); });
    $('#bReset').addEventListener('click', function () {
      var ok = true;
      try { ok = window.confirm('¿Borrar todas tus respuestas y liberar los escenarios?'); } catch (err) { ok = true; }
      if (!ok) return;
      store.set('intentos', []);
      screenFicha();
      showAlert('info', 'Listo: tus intentos se reiniciaron y todos los escenarios están disponibles.');
    });
  }

  /* ================= Arranque ================= */
  window.addEventListener('hashchange', route);
  updateChip();
  route();
  pedirNombre(false);
})();
