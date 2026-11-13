'use strict';
// =====================================================================
//  EFEKT KATMANI — NinjaAdventure / Foozle FX sprite animasyonları
//  Oyun mantığına dokunmaz: yetenek, vuruş, ölüm, mermi ve seviye olaylarını
//  sarmalayıp üstüne görsel animasyon ekler. Görsel yüklenmezse sessizce atlar.
// =====================================================================
(function () {
  const L = {};
  function img(n) { let i = L[n]; if (!i) { i = new Image(); i.src = 'na/fx_' + n + '.png'; L[n] = i; } return i; }
  const ok = i => i && i.complete && i.naturalWidth > 0;
  // ad: [kare genişliği, kare yüksekliği, kare sayısı, kare/sn]
  const SH = {
    cut: [32, 32, 4, 18], slash: [32, 32, 4, 16], slash2: [32, 32, 4, 16], circ: [32, 32, 4, 16], cutx: [32, 32, 4, 16], claw: [32, 32, 4, 16],
    expl: [40, 40, 9, 18], flam: [25, 30, 8, 14], ice: [32, 32, 10, 18], thunder: [20, 28, 8, 18], rock: [45, 48, 12, 18], water: [40, 33, 11, 18],
    boost: [53, 35, 8, 14], shield: [24, 26, 6, 12], aura: [25, 24, 5, 12], spirit: [32, 32, 5, 12], circleo: [32, 32, 4, 12], sparkc: [32, 32, 6, 14],
    spark: [30, 35, 9, 18], smoke: [32, 32, 6, 14], bigexpl: [64, 64, 7, 14],
    pfire: [16, 16, 4, 12], penergy: [16, 16, 4, 12], parrow: [13, 5, 1, 1], pkunai: [14, 5, 1, 1], pshur: [16, 16, 2, 16], pice: [18, 10, 8, 16],
  };
  for (const k in SH) img(k); // ön yükleme
  const FX = [];
  const now = () => (typeof gameTime !== 'undefined' ? gameTime : performance.now() / 1000);
  // fx: sayfa adı, x/y dünya konumu, s ölçek, o = {delay, rot, flip, follow, oy, alpha, add}
  function fx(k, x, y, s, o) { if (!SH[k]) return; o = o || {}; FX.push({ k, x, y, s: s || 2, t0: now() + (o.delay || 0), rot: o.rot || 0, flip: !!o.flip, follow: o.follow || null, oy: o.oy || 0, alpha: o.alpha == null ? 1 : o.alpha, add: !!o.add }); if (FX.length > 120) FX.shift(); }
  window.naFx = fx; window.naFxCount = () => FX.length;

  function drawFx() {
    if (!FX.length) return;
    const t = now();
    for (let i = FX.length - 1; i >= 0; i--) {
      const f = FX[i], sh = SH[f.k], dt = t - f.t0; if (dt < 0) continue;
      const fr = Math.floor(dt * sh[3]); if (fr >= sh[2]) { FX.splice(i, 1); continue; }
      const im = img(f.k); if (!ok(im)) continue;
      const x = f.follow ? f.follow.x : f.x, y = (f.follow ? f.follow.y : f.y) - f.oy;
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(x, y);
      if (f.rot) ctx.rotate(f.rot); if (f.flip) ctx.scale(-1, 1);
      if (f.alpha < 1) ctx.globalAlpha *= f.alpha; if (f.add) ctx.globalCompositeOperation = 'lighter';
      const w = sh[0] * f.s, h = sh[1] * f.s;
      ctx.drawImage(im, fr * sh[0], 0, sh[0], sh[1], -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }
  if (typeof drawExtrasTop === 'function') { const _dx = drawExtrasTop; drawExtrasTop = function () { _dx.apply(this, arguments); try { drawFx(); } catch (e) { } }; }
  else window.drawExtrasTop = drawFx;

  // ---------- MERMİLER: düz daire yerine sprite ----------
  const PROJ = { fireball: 'pfire', efire: 'pfire', magic: 'penergy', foeMagic: 'penergy', ghost: 'penergy', poison: 'penergy', ice: 'pice', arrow: 'parrow', bigarrow: 'parrow', foeArrow: 'parrow', dagger: 'pkunai', kunai: 'pkunai', shuriken: 'pshur' };
  window.naProj = function (pr) {
    const k = PROJ[pr.kind]; if (!k) return false; const im = img(k); if (!ok(im)) return false;
    const sh = SH[k], s = pr.kind === 'bigarrow' ? 3 : 2, fr = Math.floor(now() * sh[3]) % sh[2], w = sh[0] * s, h = sh[1] * s;
    ctx.imageSmoothingEnabled = false;
    if (pr.kind === 'bigarrow') { ctx.shadowColor = '#9fe8ff'; ctx.shadowBlur = 12; }
    ctx.rotate(Math.atan2(pr.vy || 0, pr.vx || 1));
    ctx.drawImage(im, fr * sh[0], 0, sh[0], sh[1], -w / 2, -h / 2, w, h);
    ctx.shadowBlur = 0;
    return true;
  };

  // ---------- VURUŞ / KRİTİK / ÖLÜM ----------
  const lastHitFx = new WeakMap();
  if (typeof damageEnemy === 'function') {
    const _de = damageEnemy;
    damageEnemy = function (e, dm, src, col) {
      const wasDead = e && e.dead, hp0 = e ? e.hp : 0;
      const r = _de.apply(this, arguments);
      try {
        if (e && src === player && e.hp < hp0) {
          const t = now(), lh = lastHitFx.get(e) || 0, cy = e.y - (e.d && e.d.h ? e.d.h * .45 : 20);
          if (t - lh > .07) {
            lastHitFx.set(e, t);
            const cls = player.cls, crit = dm && dm.crit;
            const k = cls === 'assassin' ? 'claw' : cls === 'mage' ? 'spark' : cls === 'archer' ? 'cut' : 'cut';
            fx(k, e.x + rr(-6, 6), cy + rr(-6, 6), crit ? 3 : 2, { rot: rr(-.6, .6), flip: Math.random() < .5 });
            if (crit) fx('spark', e.x, cy - 6, 2, { add: true, alpha: .9 });
          }
        }
        if (e && !wasDead && e.dead) { fx('smoke', e.x, e.y - 14, e.d && e.d.boss ? 5 : 2.5); if (e.d && e.d.boss) { fx('bigexpl', e.x, e.y - 40, 3); fx('spark', e.x, e.y - 60, 4, { delay: .15, add: true }); } }
      } catch (er) { }
      return r;
    };
  }
  if (typeof damagePlayer === 'function') {
    const _dp = damagePlayer;
    damagePlayer = function () {
      const p = player, hp0 = p ? p.hp : 0; const r = _dp.apply(this, arguments);
      try { if (p && p.hp < hp0) { p._hitFx = now(); fx('claw', p.x + rr(-6, 6), p.y - 24, 1.5, { rot: rr(-.5, .5), alpha: .85 }); } } catch (er) { }
      return r;
    };
  }

  // ---------- YETENEK ANİMASYONLARI ----------
  function pickTarget(p) { if (p.target && !p.target.dead) return p.target; let b = null, bd = 260; for (const e of enemies) { if (e.dead) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; b = e; } } return b; }
  function skillFx(sk, p, t, newEf, x0, y0) {
    const cy = p.y - 22, ty = t ? t.y - (t.d && t.d.h ? t.d.h * .45 : 22) : 0, face = (p.face || 1) < 0;
    switch (sk.k) {
      case 'strike':
        if (!t) break;
        if (sk.vis === 'ice') { fx('ice', t.x, ty, 3); fx('sparkc', t.x, ty, 2, { delay: .1, add: true }); }
        else if (p.cls === 'assassin') { fx('claw', t.x, ty, 3); fx('cutx', t.x, ty, 2.5, { delay: .1 }); }
        else if (p.cls === 'archer') { fx('spark', t.x, ty, 3, { add: true }); }
        else { fx('slash2', t.x, ty, 3.5, { flip: face }); fx('spark', t.x, ty, 2, { delay: .08, add: true }); }
        break;
      case 'multi': if (t) { fx('cutx', t.x, ty, 3); fx('cut', t.x + 8, ty - 6, 2.5, { delay: .1, rot: 1 }); fx('cut', t.x - 8, ty + 4, 2.5, { delay: .2, rot: -1 }); } break;
      case 'aoe':
        if (sk.vis === 'spin') { fx('circ', p.x, cy, 5); fx('circ', p.x, cy, 5, { delay: .2, flip: true }); fx('smoke', p.x, p.y - 6, 3, { alpha: .6 }); }
        else if (sk.vis === 'quake') { fx('expl', p.x, p.y - 10, 3); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, r = (sk.r || 90) * .6; fx('rock', p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .5 - 20, 2, { delay: .05 * i }); } }
        else if (sk.vis === 'ice') { fx('circleo', p.x, p.y - 4, 4, { alpha: .7 }); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = (sk.r || 100) * .65; fx('ice', p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .5 - 16, 2.5, { delay: .03 * i }); } }
        else { fx('circleo', p.x, p.y - 4, 5, { add: true }); fx('sparkc', p.x, cy, 4, { delay: .1, add: true }); }
        break;
      case 'dash': fx('smoke', x0, y0 - 10, 2.5); if (t) fx('slash', t.x, ty, 3.5, { delay: .08, flip: face }); break;
      case 'blink': fx('smoke', x0, y0 - 12, 3); fx('sparkc', p.x, cy, 3, { add: true }); fx('smoke', p.x, p.y - 12, 2.5, { delay: .05 }); break;
      case 'buff': fx('boost', p.x, cy - 6, 3, { follow: p, oy: 26, add: true }); fx('aura', p.x, p.y - 4, 3.5, { follow: p, oy: 4, alpha: .85 }); break;
      case 'heal': fx('spirit', p.x, cy, 3, { follow: p, oy: 26 }); fx('spark', p.x, cy - 10, 3, { delay: .1, follow: p, oy: 34, add: true }); break;
      case 'shield': fx('shield', p.x, cy, 3.5, { follow: p, oy: 22 }); fx('shield', p.x, cy, 3.5, { delay: .5, follow: p, oy: 22, alpha: .7 }); break;
      case 'stealth': fx('smoke', p.x, p.y - 14, 3); break;
      case 'crit': fx('sparkc', p.x, cy, 3, { follow: p, oy: 24, add: true }); break;
      case 'proj': fx('spark', p.x + (face ? -14 : 14), cy, 1.2, { add: true, alpha: .8 }); break;
      case 'chain': {
        if (!t) break; fx('thunder', t.x, ty - 10, 3); fx('sparkc', t.x, ty, 2.5, { add: true });
        let n = 0; for (const e of enemies) { if (e.dead || e === t || n >= 3) continue; if (Math.hypot(e.x - t.x, e.y - t.y) < 180) { n++; fx('thunder', e.x, e.y - (e.d.h || 30) * .45 - 10, 2.5, { delay: .08 * n }); } }
        break; }
      case 'ground': {
        const g = newEf || (t ? { x: t.x, y: t.y, delay: sk.delay || .6, type: 'ground' } : null); if (!g) break;
        const d = g.delay || sk.delay || .6;
        if (g.type === 'meteor' || sk.vis === 'meteor') { fx('bigexpl', g.x, g.y - 30, 3, { delay: d }); fx('rock', g.x, g.y - 20, 2.5, { delay: d + .05 }); }
        else if (g.type === 'arrowrain') { for (let i = 0; i < 6; i++) fx('spark', g.x + rr(-40, 40), g.y + rr(-20, 20) - 10, 1.5, { delay: d * .3 + i * .08, add: true }); }
        else if (sk.vis === 'fire') { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = (g.r || 70) * .55; fx('flam', g.x + Math.cos(a) * r, g.y + Math.sin(a) * r * .5 - 18, 2.5, { delay: d + i * .04 }); } fx('expl', g.x, g.y - 20, 2.5, { delay: d }); }
        else fx('expl', g.x, g.y - 20, 3, { delay: d });
        break; }
      default: fx('sparkc', p.x, cy, 2.5, { add: true });
    }
  }
  if (typeof useSkill === 'function') {
    const _us = useSkill;
    useSkill = function (slot) {
      const p = player; const id = p && p.act ? p.act[slot] : null;
      const before = id && p.cds ? p.cds[id] || 0 : 0, nEf = typeof effects !== 'undefined' ? effects.length : 0, x0 = p ? p.x : 0, y0 = p ? p.y : 0;
      const r = _us.apply(this, arguments);
      try {
        if (id && p.cds && (p.cds[id] || 0) !== before) {
          const sk = SKILL_BY_ID[id]; const newEf = typeof effects !== 'undefined' && effects.length > nEf ? effects.slice(nEf).find(e => e.type === 'ground' || e.type === 'meteor' || e.type === 'arrowrain') : null;
          skillFx(sk, p, pickTarget(p), newEf, x0, y0);
        }
      } catch (er) { }
      return r;
    };
  }

  // ---------- yürüme tozu + seviye atlama ----------
  let dustT = 0, lastLvl = null;
  setInterval(function () {
    if (typeof running === 'undefined' || !running || typeof player === 'undefined' || !player || player.dead) return;
    const p = player;
    if (p.moving && !p.riding) { dustT += .1; if (dustT >= .3) { dustT = 0; fx('smoke', p.x + rr(-4, 4), p.y - 2, .8, { alpha: .45 }); } } else dustT = 0;
    if (lastLvl !== null && p.lvl > lastLvl) { fx('boost', p.x, p.y - 30, 4, { follow: p, oy: 30, add: true }); fx('sparkc', p.x, p.y - 30, 4, { delay: .2, follow: p, oy: 30, add: true }); fx('spark', p.x, p.y - 50, 4, { delay: .35, follow: p, oy: 50, add: true }); }
    lastLvl = p.lvl;
  }, 100);
})();
