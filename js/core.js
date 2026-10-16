/* Núcleo: guardado seguro en localStorage + validación y preparación de datos. */
(function () {
  'use strict';
  var CAI = window.CAI = window.CAI || {};

  /* ================= Guardado ================= */
  var PREFIX = 'cai17.';
  var mem = {};
  var available = false;
  try {
    var k = PREFIX + '__test';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    available = true;
  } catch (e) { available = false; }

  CAI.store = {
    available: function () { return available; },
    get: function (key, def) {
      if (available) {
        try {
          var v = window.localStorage.getItem(PREFIX + key);
          if (v !== null) return JSON.parse(v);
        } catch (e) { /* dato corrupto o acceso bloqueado: uso memoria */ }
      }
      return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : def;
    },
    set: function (key, val) {
      mem[key] = val;
      if (!available) return false;
      try { window.localStorage.setItem(PREFIX + key, JSON.stringify(val)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) {
      delete mem[key];
      if (!available) return;
      try { window.localStorage.removeItem(PREFIX + key); } catch (e) { /* nada */ }
    }
  };

  /* ================= Validación ================= */
  var ROLES_ESPERADOS = ['ARQ', 'LD', 'ZD', 'ZI', 'LI', '5', 'VD', 'VI', 'ENG', 'DD', 'DI'];

  function isNum(n) { return typeof n === 'number' && isFinite(n); }

  CAI.prepare = function (raw) {
    var issues = [];
    function err(donde, que) { issues.push({ nivel: 'error', donde: donde, que: que }); }
    function warn(donde, que) { issues.push({ nivel: 'aviso', donde: donde, que: que }); }

    var out = { roles: [], rolesById: {}, fases: [], fasesById: {}, juegoA: [], juegoB: [], comoJugamos: [], issues: issues };

    if (!raw || typeof raw !== 'object') {
      err('data.js', 'No se encontró CAI_DATA. ¿Se cargó el archivo de datos?');
      return out;
    }

    // Lee [x, y] (o {x,y}); fuera de 0–100 lo recorta y avisa.
    function pt(v, donde) {
      var x, y;
      if (Array.isArray(v)) { x = v[0]; y = v[1]; }
      else if (v && typeof v === 'object') { x = v.x; y = v.y; }
      if (!isNum(x) || !isNum(y)) { err(donde, 'Coordenada inválida: ' + JSON.stringify(v)); return null; }
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        err(donde, 'Coordenada fuera de 0–100: [' + x + ', ' + y + ']. Se recorta al borde.');
        x = Math.max(0, Math.min(100, x)); y = Math.max(0, Math.min(100, y));
      }
      return { x: x, y: y };
    }

    function zona(z, donde) {
      if (!z || !isNum(z.x) || !isNum(z.y) || !isNum(z.rx) || !isNum(z.ry) || z.rx <= 0 || z.ry <= 0) {
        err(donde, 'Zona inválida (necesita x, y, rx, ry > 0).');
        return null;
      }
      var p = pt([z.x, z.y], donde);
      return p ? { x: p.x, y: p.y, rx: z.rx, ry: z.ry, nombre: z.nombre || '' } : null;
    }

    /* ---- roles ---- */
    (Array.isArray(raw.roles) ? raw.roles : []).forEach(function (r, i) {
      if (!r || !r.id) { err('roles[' + i + ']', 'Rol sin id.'); return; }
      if (out.rolesById[r.id]) { err('roles', 'Rol repetido: ' + r.id); return; }
      out.rolesById[r.id] = r;
      out.roles.push(r);
    });
    ROLES_ESPERADOS.forEach(function (id) {
      if (!out.rolesById[id]) {
        err('roles', 'Falta el rol ' + id + '.');
        var r = { id: id, nombre: id, nota: '' };
        out.rolesById[id] = r; out.roles.push(r);
      }
    });
    var roleIds = out.roles.map(function (r) { return r.id; });

    /* ---- fases ---- */
    function resolverPelota(v, propios, donde) {
      if (v === null || v === undefined) return { pos: null, de: null };
      if (typeof v === 'string') {
        if (!propios[v]) { err(donde, 'La pelota está en "' + v + '", que no está en la cancha.'); return { pos: null, de: null }; }
        return { pos: { x: propios[v].x, y: propios[v].y }, de: v };
      }
      return { pos: pt(v, donde + ' · pelota'), de: null };
    }

    function resolverExtremo(v, propios, donde) {
      if (typeof v === 'string') {
        if (!propios[v]) { err(donde, 'Flecha hacia/desde "' + v + '", que no está en este paso.'); return null; }
        return propios[v];
      }
      return pt(v, donde);
    }

    (Array.isArray(raw.fases) ? raw.fases : []).forEach(function (f, fi) {
      var dondeF = 'Fase ' + (fi + 1) + (f && f.nombre ? ' (' + f.nombre + ')' : '');
      if (!f || !f.id) { err(dondeF, 'Fase sin id.'); return; }
      if (out.fasesById[f.id]) { err(dondeF, 'Id de fase repetido: ' + f.id); return; }
      var fase = {
        id: f.id, num: out.fases.length + 1, nombre: f.nombre || f.id, subtitulo: f.subtitulo || '',
        texto: f.texto || '', pasos: [], roles: {}, ok: true
      };
      if (!Array.isArray(f.pasos) || !f.pasos.length) {
        err(dondeF, 'La fase no tiene pasos. No se puede reproducir.');
        fase.ok = false;
      } else {
        var prevPropios = {}, prevRivales = [];
        f.pasos.forEach(function (p, pi) {
          var donde = dondeF + ' · paso ' + (pi + 1);
          if (!p || typeof p !== 'object') { err(donde, 'Paso vacío.'); p = {}; }
          var tieneAlgo = p.propios || p.rivales || p.pelota !== undefined;
          if (!tieneAlgo) err(donde, 'Paso vacío: no trae propios, rivales ni pelota. Se repite el anterior.');

          var propios = {};
          var r;
          for (r in prevPropios) propios[r] = prevPropios[r];
          for (r in (p.propios || {})) {
            if (roleIds.indexOf(r) < 0) { err(donde, 'Rol desconocido: "' + r + '".'); continue; }
            var q = pt(p.propios[r], donde + ' · ' + r);
            if (q) propios[r] = q;
          }
          ROLES_ESPERADOS.forEach(function (id) {
            if (!propios[id]) err(donde, 'Falta el rol ' + id + ' (no se dibuja).');
          });

          var rivales;
          if (Array.isArray(p.rivales)) {
            rivales = [];
            p.rivales.forEach(function (rv, ri) {
              var q2 = pt(rv, donde + ' · rival ' + (ri + 1));
              if (q2) rivales.push(q2);
            });
            if (pi > 0 && prevRivales.length && rivales.length && rivales.length !== prevRivales.length) {
              warn(donde, 'Cambió la cantidad de rivales (' + prevRivales.length + ' → ' + rivales.length + '). La animación los va a mover sin transición.');
            }
          } else {
            rivales = prevRivales.slice();
          }

          var pel = resolverPelota(p.pelota !== undefined ? p.pelota : null, propios, donde);
          var flechas = [];
          (Array.isArray(p.flechas) ? p.flechas : []).forEach(function (fl, k) {
            var dd = donde + ' · flecha ' + (k + 1);
            if (!fl || (fl.tipo !== 'pase' && fl.tipo !== 'mov')) { err(dd, 'Tipo de flecha inválido (usá "pase" o "mov").'); return; }
            var a = resolverExtremo(fl.de, propios, dd), b = resolverExtremo(fl.a, propios, dd);
            if (!a || !b) return;
            var c = fl.curva ? pt(fl.curva, dd + ' · curva') : null;
            flechas.push({ tipo: fl.tipo, de: a, a: b, curva: c });
          });

          fase.pasos.push({ titulo: p.titulo || '', propios: propios, rivales: rivales, pelota: pel.pos, pelotaDe: pel.de, flechas: flechas });
          prevPropios = propios; prevRivales = rivales;
        });
      }

      // Textos por rol
      var rt = f.roles || {};
      ROLES_ESPERADOS.forEach(function (id) {
        var t = rt[id];
        if (!t || !t.hago) { warn(dondeF, 'Falta el texto "qué hago" del rol ' + id + '.'); return; }
        fase.roles[id] = {
          hago: t.hago,
          si: Array.isArray(t.si) ? t.si.filter(function (s) { return s && s.si && s.hago; }) : [],
          propuesta: t.propuesta !== false
        };
      });

      out.fasesById[fase.id] = fase;
      out.fases.push(fase);
    });
    if (!out.fases.length) err('fases', 'No hay fases cargadas.');

    /* ---- escenarios ---- */
    var idsVistos = {};
    function escenarioBase(e, donde) {
      var propios = {}, rivales = [], pelota = null, r;
      if (e.base) {
        var fase = out.fasesById[e.base.fase];
        var paso = fase && fase.pasos[(e.base.paso || 1) - 1];
        if (!paso) { err(donde, 'La base apunta a ' + e.base.fase + ' paso ' + e.base.paso + ', que no existe.'); return null; }
        for (r in paso.propios) propios[r] = paso.propios[r];
        rivales = paso.rivales.slice();
        pelota = paso.pelota;
      }
      for (r in (e.propios || {})) {
        if (roleIds.indexOf(r) < 0) { err(donde, 'Rol desconocido: "' + r + '".'); continue; }
        var q = pt(e.propios[r], donde + ' · ' + r);
        if (q) propios[r] = q;
      }
      if (Array.isArray(e.rivales)) {
        rivales = [];
        e.rivales.forEach(function (rv, i) { var q2 = pt(rv, donde + ' · rival ' + (i + 1)); if (q2) rivales.push(q2); });
      }
      if (e.pelota !== undefined) pelota = resolverPelota(e.pelota, propios, donde).pos;
      ROLES_ESPERADOS.forEach(function (id) { if (!propios[id]) err(donde, 'Falta la posición del rol ' + id + '.'); });
      return { propios: propios, rivales: rivales, pelota: pelota };
    }

    function escenarioComun(e, i, juego) {
      var donde = 'Juego ' + juego + ' · escenario ' + (i + 1) + (e && e.id ? ' (' + e.id + ')' : '');
      if (!e || !e.id) { err(donde, 'Escenario sin id.'); return null; }
      if (idsVistos[e.id]) { err(donde, 'Id repetido: ' + e.id); return null; }
      idsVistos[e.id] = true;
      if (!out.rolesById[e.rol]) { err(donde, 'Rol inválido: "' + e.rol + '".'); return null; }
      var sit = escenarioBase(e, donde);
      if (!sit) return null;
      return { donde: donde, sit: sit };
    }

    (Array.isArray(raw.juegoA) ? raw.juegoA : []).forEach(function (e, i) {
      var c = escenarioComun(e, i, 'A');
      if (!c) return;
      var ideal = zona(e.ideal, c.donde + ' · zona ideal');
      var ok = zona(e.aceptable, c.donde + ' · zona aceptable');
      if (!ideal || !ok) return;
      if (!c.sit.pelota) warn(c.donde, 'No hay pelota en la situación.');
      out.juegoA.push({
        id: e.id, juego: 'A', rol: e.rol, titulo: e.titulo || e.id, consigna: e.consigna || '',
        situacion: c.sit, ideal: ideal, aceptable: ok, explicacion: e.explicacion || ''
      });
    });

    (Array.isArray(raw.juegoB) ? raw.juegoB : []).forEach(function (e, i) {
      var c = escenarioComun(e, i, 'B');
      if (!c) return;
      var z = zona(e.zona, c.donde + ' · zona');
      if (!z) return;
      out.juegoB.push({
        id: e.id, juego: 'B', rol: e.rol, titulo: e.titulo || e.id, consigna: e.consigna || '',
        situacion: c.sit, zona: z, explicacion: e.explicacion || ''
      });
    });

    out.comoJugamos = (Array.isArray(raw.comoJugamos) ? raw.comoJugamos : []).filter(function (c, i) {
      var ok = c && c.titulo && Array.isArray(c.lineas);
      if (!ok) warn('Cómo jugamos · punto ' + (i + 1), 'Falta título o líneas.');
      return ok;
    });

    return out;
  };

  /* ================= Utilidades de juego ================= */
  CAI.inEllipse = function (p, z) {
    if (!p || !z) return false;
    var dx = (p.x - z.x) / z.rx, dy = (p.y - z.y) / z.ry;
    return dx * dx + dy * dy <= 1;
  };

  CAI.ROLES_ESPERADOS = ROLES_ESPERADOS;
})();
