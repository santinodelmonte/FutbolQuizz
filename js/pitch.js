/* Cancha vertical en SVG.
 * Coordenadas de los datos: x 0-100 (banda izq -> der), y 0-100 (nuestro fondo -> fondo rival).
 * Internamente el SVG trabaja en metros (68 x 105) con nuestro arco abajo.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var W = 68, L = 105, M = 2.5;          // ancho, largo, margen (m)
  var STRIP = 13;                         // alto de la franja neutra (juego B)
  var R_OWN = 2.4, R_RIV = 2.1, R_BALL = 1.05;
  var uid = 0;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function toSvg(p) { return { X: p.x * W / 100, Y: (100 - p.y) * L / 100 }; }
  function fromSvg(X, Y) { return { x: X * 100 / W, y: 100 - Y * 100 / L }; }

  function Pitch(container, opts) {
    opts = opts || {};
    this.id = 'p' + (++uid);
    this.strip = !!opts.strip;
    this.tokens = {};       // rol -> {g, circle, text}
    this.rivals = [];       // [{g}]
    this.focus = null;
    this.hidden = {};

    var h = L + M * 2 + (this.strip ? STRIP + 2 : 0);
    var svg = el('svg', {
      viewBox: (-M) + ' ' + (-M) + ' ' + (W + M * 2) + ' ' + h,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'pitch' + (opts.className ? ' ' + opts.className : ''),
      role: 'img',
      'aria-label': opts.label || 'Cancha'
    });
    this.svg = svg;

    var defs = el('defs', null, svg);
    this._arrowHeads(defs);

    this.gGrass = el('g', { class: 'grass' }, svg);
    this.gLanes = el('g', { class: 'lanes' }, svg);
    this.gLines = el('g', { class: 'lines' }, svg);
    this.gZones = el('g', { class: 'zones' }, svg);
    this.gTrail = el('g', { class: 'trail' }, svg);
    this.gArrows = el('g', { class: 'arrows' }, svg);
    this.gRivals = el('g', { class: 'rivals' }, svg);
    this.gOwn = el('g', { class: 'own' }, svg);
    this.gBall = el('g', { class: 'ballg' }, svg);
    this.gTop = el('g', { class: 'topl' }, svg);

    this._drawField();
    if (this.strip) this._drawStrip();
    this.setLanes(opts.lanes !== false);

    this.ball = el('g', { class: 'ball', visibility: 'hidden' }, this.gBall);
    el('circle', { r: R_BALL, class: 'ball-c' }, this.ball);
    el('circle', { r: R_BALL * 0.38, class: 'ball-d' }, this.ball);

    container.appendChild(svg);
  }

  Pitch.W = W; Pitch.L = L;
  Pitch.toSvg = toSvg;
  Pitch.fromSvg = fromSvg;

  Pitch.prototype._arrowHeads = function (defs) {
    var self = this;
    ['pase', 'mov'].forEach(function (k) {
      var m = el('marker', {
        id: self.id + '-h-' + k, viewBox: '0 0 10 10', refX: '7', refY: '5',
        markerWidth: '4', markerHeight: '4', orient: 'auto-start-reverse'
      }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'head head-' + k }, m);
    });
  };

  Pitch.prototype._drawField = function () {
    var g = this.gGrass, n = 12, i;
    el('rect', { x: -M, y: -M, width: W + M * 2, height: L + M * 2, class: 'grass-bg' }, g);
    for (i = 0; i < n; i += 2) {
      el('rect', { x: 0, y: i * L / n, width: W, height: L / n, class: 'grass-stripe' }, g);
    }

    // Carriles: bordes del área grande y del área chica.
    var lx = [0, 13.84, 24.84, 43.16, 54.16, W];
    for (i = 0; i < 5; i++) {
      if (i % 2 === 1) el('rect', { x: lx[i], y: 0, width: lx[i + 1] - lx[i], height: L, class: 'lane-fill' }, this.gLanes);
    }
    for (i = 1; i < 5; i++) el('line', { x1: lx[i], y1: 0, x2: lx[i], y2: L, class: 'lane-line' }, this.gLanes);

    var l = this.gLines, cx = W / 2;
    el('rect', { x: 0, y: 0, width: W, height: L }, l);
    el('line', { x1: 0, y1: L / 2, x2: W, y2: L / 2 }, l);
    el('circle', { cx: cx, cy: L / 2, r: 9.15 }, l);
    el('circle', { cx: cx, cy: L / 2, r: 0.35, class: 'spot' }, l);
    // Área rival (arriba)
    el('rect', { x: cx - 20.16, y: 0, width: 40.32, height: 16.5 }, l);
    el('rect', { x: cx - 9.16, y: 0, width: 18.32, height: 5.5 }, l);
    el('circle', { cx: cx, cy: 11, r: 0.35, class: 'spot' }, l);
    el('path', { d: 'M' + (cx - 7.312) + ' 16.5 A9.15 9.15 0 0 0 ' + (cx + 7.312) + ' 16.5' }, l);
    el('rect', { x: cx - 3.66, y: -1.6, width: 7.32, height: 1.6, class: 'goal' }, l);
    // Área propia (abajo)
    el('rect', { x: cx - 20.16, y: L - 16.5, width: 40.32, height: 16.5 }, l);
    el('rect', { x: cx - 9.16, y: L - 5.5, width: 18.32, height: 5.5 }, l);
    el('circle', { cx: cx, cy: L - 11, r: 0.35, class: 'spot' }, l);
    el('path', { d: 'M' + (cx - 7.312) + ' ' + (L - 16.5) + ' A9.15 9.15 0 0 1 ' + (cx + 7.312) + ' ' + (L - 16.5) }, l);
    el('rect', { x: cx - 3.66, y: L, width: 7.32, height: 1.6, class: 'goal' }, l);
  };

  Pitch.prototype._drawStrip = function () {
    var y = L + M + 1;
    el('rect', { x: -M, y: L + M, width: W + M * 2, height: STRIP + 2, class: 'strip-bg' }, this.gGrass);
    el('rect', { x: 2, y: y, width: W - 4, height: STRIP - 1, rx: 2, class: 'strip' }, this.gGrass);
    var t = el('text', { x: W / 2 + 8, y: y + STRIP / 2, class: 'strip-t' }, this.gGrass);
    t.textContent = 'Arrastrá tu ficha a la cancha';
    this.stripTextEl = t;
  };

  /* Centro de la franja en coordenadas de datos (puede tener y < 0). */
  Pitch.prototype.stripSpot = function () {
    return fromSvg(12, L + M + 1 + (STRIP - 1) / 2);
  };

  Pitch.prototype.setLanes = function (on) {
    this.gLanes.style.display = on ? '' : 'none';
  };

  Pitch.prototype._ownToken = function (rol) {
    var g = el('g', { class: 'tok own-tok', 'data-rol': rol }, this.gOwn);
    var c = el('circle', { r: R_OWN, class: 'tok-c' }, g);
    var t = el('text', { class: 'tok-t' + (rol.length > 2 ? ' tok-t3' : '') }, g);
    t.textContent = rol;
    return (this.tokens[rol] = { g: g, c: c, t: t });
  };

  Pitch.prototype._rivalToken = function () {
    var g = el('g', { class: 'tok riv-tok' }, this.gRivals);
    el('circle', { r: R_RIV, class: 'tok-c' }, g);
    var tk = { g: g };
    this.rivals.push(tk);
    return tk;
  };

  /* state: {propios: {rol: {x,y}}, rivales: [{x,y}], pelota: {x,y}|null} */
  Pitch.prototype.render = function (state) {
    var rol, p, s, tk, i;
    var seen = {};
    for (rol in state.propios || {}) {
      p = state.propios[rol];
      if (!p) continue;
      tk = this.tokens[rol] || this._ownToken(rol);
      s = toSvg(p);
      tk.g.setAttribute('transform', 'translate(' + s.X.toFixed(2) + ' ' + s.Y.toFixed(2) + ')');
      tk.g.style.display = this.hidden[rol] ? 'none' : '';
      seen[rol] = true;
    }
    for (rol in this.tokens) if (!seen[rol]) this.tokens[rol].g.style.display = 'none';

    var riv = state.rivales || [];
    for (i = 0; i < riv.length; i++) {
      tk = this.rivals[i] || this._rivalToken();
      s = toSvg(riv[i]);
      tk.g.setAttribute('transform', 'translate(' + s.X.toFixed(2) + ' ' + s.Y.toFixed(2) + ')');
      tk.g.style.display = '';
    }
    for (; i < this.rivals.length; i++) this.rivals[i].g.style.display = 'none';

    if (state.pelota) {
      s = toSvg(state.pelota);
      // La pelota se dibuja al pie, arriba a la derecha de la ficha.
      this.ball.setAttribute('transform', 'translate(' + (s.X + 2.3).toFixed(2) + ' ' + (s.Y - 2.2).toFixed(2) + ')');
      this.ball.setAttribute('visibility', 'visible');
    } else {
      this.ball.setAttribute('visibility', 'hidden');
    }
  };

  /* Mueve una sola ficha propia (para el arrastre del juego B). */
  Pitch.prototype.moveToken = function (rol, p) {
    var tk = this.tokens[rol] || this._ownToken(rol);
    var s = toSvg(p);
    tk.g.setAttribute('transform', 'translate(' + s.X.toFixed(2) + ' ' + s.Y.toFixed(2) + ')');
    tk.g.style.display = '';
    return tk;
  };

  /* Resalta un rol. soft = atenúa poco (juegos), normal = atenúa mucho (Mi rol). */
  Pitch.prototype.setFocus = function (rol, soft) {
    this.focus = rol || null;
    this.svg.classList.toggle('has-focus', !!this.focus);
    this.svg.classList.toggle('soft', !!soft);
    for (var r in this.tokens) this.tokens[r].g.classList.toggle('focus', r === this.focus);
    // La ficha resaltada va arriba de todas.
    if (this.focus && this.tokens[this.focus]) this.gOwn.appendChild(this.tokens[this.focus].g);
  };

  Pitch.prototype.setHidden = function (roles) {
    this.hidden = {};
    (roles || []).forEach(function (r) { this.hidden[r] = true; }, this);
  };

  function clear(g) { while (g.firstChild) g.removeChild(g.firstChild); }

  /* flechas: [{tipo:'pase'|'mov', de:{x,y}, a:{x,y}, curva:{x,y}|null}] */
  Pitch.prototype.drawArrows = function (list) {
    clear(this.gArrows);
    var self = this;
    (list || []).forEach(function (f) {
      var a = toSvg(f.de), b = toSvg(f.a);
      var c = f.curva ? toSvg(f.curva) : null;
      // Recorto los extremos para que no queden debajo de las fichas.
      var sa = c || b, sb = c || a;
      var A = shorten(a, sa, 2.6), B = shorten(b, sb, 2.9);
      var d = 'M' + A.X.toFixed(2) + ' ' + A.Y.toFixed(2) +
        (c ? ' Q' + c.X.toFixed(2) + ' ' + c.Y.toFixed(2) + ' ' : ' L') +
        B.X.toFixed(2) + ' ' + B.Y.toFixed(2);
      el('path', {
        d: d, class: 'arrow arrow-' + f.tipo,
        'marker-end': 'url(#' + self.id + '-h-' + f.tipo + ')'
      }, self.gArrows);
    });
  };

  function shorten(p, toward, by) {
    var dx = toward.X - p.X, dy = toward.Y - p.Y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < by * 2) return p;
    return { X: p.X + dx / d * by, Y: p.Y + dy / d * by };
  }

  /* puntos: [{x,y}], actual: índice resaltado */
  Pitch.prototype.drawTrail = function (puntos, actual) {
    clear(this.gTrail);
    if (!puntos || !puntos.length) return;
    var pts = puntos.map(toSvg);
    if (pts.length > 1) {
      el('polyline', {
        points: pts.map(function (s) { return s.X.toFixed(2) + ',' + s.Y.toFixed(2); }).join(' '),
        class: 'trail-line'
      }, this.gTrail);
    }
    var self = this;
    pts.forEach(function (s, i) {
      el('circle', { cx: s.X, cy: s.Y, r: i === actual ? 1.1 : 0.8, class: 'trail-dot' + (i === actual ? ' now' : '') }, self.gTrail);
      if (pts.length > 1) {
        var t = el('text', { x: s.X - 2.2, y: s.Y + 3.6, class: 'trail-n' }, self.gTrail);
        t.textContent = String(i + 1);
      }
    });
  };

  /* zonas: [{x,y,rx,ry,kind:'ideal'|'ok'|'zona'|'bad', label}] */
  Pitch.prototype.drawZones = function (zonas) {
    clear(this.gZones);
    var self = this;
    (zonas || []).forEach(function (z) {
      var s = toSvg(z);
      el('ellipse', {
        cx: s.X, cy: s.Y, rx: z.rx * W / 100, ry: z.ry * L / 100,
        class: 'zone zone-' + (z.kind || 'zona')
      }, self.gZones);
      if (z.label) {
        var t = el('text', { x: s.X, y: s.Y - z.ry * L / 100 - 0.8, class: 'zone-t zone-t-' + (z.kind || 'zona') }, self.gZones);
        t.textContent = z.label;
      }
    });
  };

  /* Marca de toque (juego A). */
  Pitch.prototype.setMarker = function (p, kind) {
    clear(this.gTop);
    if (!p) return;
    var s = toSvg(p);
    var g = el('g', { class: 'marker marker-' + (kind || 'pick'), transform: 'translate(' + s.X + ' ' + s.Y + ')' }, this.gTop);
    el('circle', { r: 1.9, class: 'marker-ring' }, g);
    el('line', { x1: -3, y1: 0, x2: 3, y2: 0 }, g);
    el('line', { x1: 0, y1: -3, x2: 0, y2: 3 }, g);
  };

  /* Pasa un evento de puntero a coordenadas de datos. */
  Pitch.prototype.toUnits = function (clientX, clientY) {
    var m = this.svg.getScreenCTM();
    if (!m) return null;
    var pt = this.svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    var q = pt.matrixTransform(m.inverse());
    return fromSvg(q.x, q.y);
  };

  Pitch.prototype.inField = function (p) {
    return p && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100;
  };

  Pitch.prototype.destroy = function () {
    if (this.svg.parentNode) this.svg.parentNode.removeChild(this.svg);
  };

  window.CAI = window.CAI || {};
  window.CAI.Pitch = Pitch;
})();
