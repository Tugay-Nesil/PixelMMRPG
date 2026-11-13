'use strict';
// =====================================================================
//  SÜRÜM 55 — TAKTİK / AKIL OYUNLARI
//  • Siper taşları: oklar, büyüler ve canavar mermileri taşa ÇARPAR (arkasına saklan)
//  • Görüş hattı (kdLOS): menzilliler taşın arkasındakini vuramaz → kanattan dolanır
//  • Pusu vuruşu: çalılıktan yapılan ilk saldırı +%40
//  • Saf Düzeni: 3+ takım arkadaşı yakın → +%12 hasar, -%15 alınan hasar (iki taraf için)
//  • Odak ateşi: işaretli hedefe (🎯) parti +%15
// =====================================================================
(function () {
  const TL = TILE;
  const STONE = new Set([D.ROCK, D.PILLAR, D.RWALL, D.TOMB, D.WALL, D.TOWER]);
  const P = () => (typeof player !== 'undefined' ? player : null);
  function stoneTile(tx, ty) { if (!M || tx < 0 || ty < 0 || tx >= M.W || ty >= M.H) return false; const j = ty * M.W + tx; return STONE.has(M.deco[j]) || !!(M.cover && M.cover[j]) || M.tiles[j] === T.DWALL; }
  const tileOf = o => [Math.floor(o.x / TL), Math.floor(o.y / TL)];
  // görüş hattı: ayak hizasında taş var mı?
  function los(a, b) { if (!a || !b || !M) return true; const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), n = Math.ceil(L / 12); const [ax, ay] = tileOf(a), [bx, by] = tileOf(b);
    for (let i = 1; i < n; i++) { const x = a.x + dx * i / n, y = a.y + dy * i / n - 4, tx = Math.floor(x / TL), ty = Math.floor(y / TL); if ((tx === ax && ty === ay) || (tx === bx && ty === by)) continue; if (stoneTile(tx, ty)) return false; } return true; }
  window.kdLOS = los;
  let fxT = 0;
  function coverFx(pr) { for (let k = 0; k < 6; k++) particles.push({ x: pr.x, y: pr.y, vx: rr(-90, 90), vy: rr(-120, -10), life: .35, max: .35, col: pick(['#d8d4cc', '#9a948c', '#fff2c0']), s: rr(2, 3.5) });
    const p = P(); if (p && (pr.src === p || pr.target === p) && gameTime - fxT > .6) { fxT = gameTime; fl(pr.x, pr.y - 14, pr.target === p ? '🛡 Taş korudu!' : 'Taşa çarptı', pr.target === p ? '#9fffb0' : '#cccccc', 11); } }
  window.kdCoverFx = coverFx;
  window.kdCoverHit = function (pr, t) {
    if (!M) return false; const tx = Math.floor(pr.x / TL), ty = Math.floor((pr.y + 16) / TL); if (!stoneTile(tx, ty)) return false;
    const s = pr.src; if (s && s.x != null) { const [sx, sy] = tileOf(s); if (sx === tx && sy === ty) return false; if (Math.hypot(s.x - pr.x, s.y - 20 - pr.y) < 26) return false; }
    if (t) { const [qx, qy] = tileOf(t); if (qx === tx && qy === ty) return false; if (Math.hypot(t.x - pr.x, t.y - 18 - pr.y) < 22) return false; }
    coverFx(pr); return true;
  };
  // ---------- menzilli YZ: taş arkasındakine boşuna ateş etmez, yana dolanır ----------
  function flank(e, t, spd, dt) { if (!e._flS || gameTime > e._flT) { e._flS = Math.random() < .5 ? -1 : 1; e._flT = gameTime + 1.2; }
    const dx = t.x - e.x, dy = t.y - e.y, L = Math.hypot(dx, dy) || 1, ox = e.x, oy = e.y;
    moveToward(e, e.x - dy / L * 40 * e._flS + dx / L * 14, e.y + dx / L * 40 * e._flS + dy / L * 14, spd, dt); if (Math.hypot(e.x - ox, e.y - oy) < spd * dt * .2) { e._flS *= -1; e._flT = gameTime + 1.2; }
    e.face = t.x < e.x ? -1 : 1; e.moving = true; }
  if (typeof updFoe === 'function') { const _uf = updFoe; updFoe = function (e, dt) {
    const t = e && e.target; if (t && e.ranged && validTarget(t) && dist(e, t) <= e.range + 80 && !los(e, t)) { e.atkT = Math.max(e.atkT, .2); flank(e, t, e.d.spd * .9, dt); return; }
    return _uf.apply(this, arguments); }; }
  if (typeof updBot === 'function') { const _ub = updBot; updBot = function (b, dt) {
    const t = b && b.alive && b.target, c = b && CLASSES[b.cls]; if (t && c && c.proj && !t.dead && t.hp != null && !t.kdMon && dist(b, t) <= c.range + 80 && !los(b, t)) { b.anim += dt; b.atkT = Math.max(b.atkT, .2); flank(b, t, 140, dt); return; }
    return _ub.apply(this, arguments); }; }
  if (typeof updEnemy === 'function') { const _ue = updEnemy; updEnemy = function (e, dt) {
    if (e && !e.dead && !e.d.pvp && e.d.ranged && !e.kdMon && e.target && e.stunUntil <= gameTime && validTarget(e.target) && dist(e, e.target) <= e.d.range + 80 && !los(e, e.target)) { e.anim += dt; e.atkAnim = Math.max(0, e.atkAnim - dt); flank(e, e.target, e.d.spd, dt); e.atkT = Math.max(e.atkT, .2); return; }
    return _ue.apply(this, arguments); }; }
  // ---------- pusu / saf düzeni / odak ----------
  const inBush = o => !!(o && o.x != null && window.kdBushAt && kdBushAt(o.x, o.y));
  function ambush(src) { if (!inBush(src) || gameTime - (src._ambT || -99) < 4) return 1; return 1.4; }
  const tacOn = () => M && (M.evMap || M.pvp);
  const allyTeam = () => { const p = P(); return (p && !p.dead ? [p] : []).concat(bots.filter(b => b.alive && b.faction === 'ally')); };
  function formUs(o) { if (!tacOn() || !o) return 0; let n = 0; for (const a of allyTeam()) if (a !== o && Math.hypot(a.x - o.x, a.y - o.y) < 220) n++; return n >= 2 ? n + 1 : 0; }
  function formThem(o) { if (!tacOn() || !o || !o.d || !o.d.pvp) return 0; let n = 0; for (const e of enemies) if (e !== o && !e.dead && e.d.pvp && Math.hypot(e.x - o.x, e.y - o.y) < 220) n++; return n >= 2 ? n + 1 : 0; }
  window.kdFormation = () => formUs(P());
  const ours = s => s && (s === P() || (s.kind === 'bot' && s.faction === 'ally'));
  function ambText(o) { fl(o.x, o.y - 96, 'PUSU!', '#9fffb0', 17); }
  if (typeof damageEnemy === 'function') { const _de = damageEnemy; damageEnemy = function (e, dm, src, col) {
    try { if (e && !e.dead && dm && dm.v > 0 && ours(src)) { let m = 1; const a = ambush(src); if (a > 1) { m *= a; ambText(src); } src._ambT = gameTime;
        if (formUs(src)) m *= 1.12; if (window.kdMark && window.kdMark === e) m *= 1.15; if (formThem(e)) m *= .88;
        if (m !== 1) dm = Object.assign({}, dm, { v: Math.max(1, Math.round(dm.v * m)) }); } } catch (er) { }
    return _de.call(this, e, dm, src, col); }; }
  function incoming(raw, src, tgt) { let m = 1; if (src && src.d && !ours(src)) { const a = ambush(src); if (a > 1) { m *= a; ambText(src); } src._ambT = gameTime; if (formThem(src)) m *= 1.12; } if (formUs(tgt)) m *= .85; return raw * m; }
  if (typeof damagePlayer === 'function') { const _dp = damagePlayer; damagePlayer = function (raw, src) { try { raw = incoming(raw, src, P()); } catch (er) { } return _dp.call(this, raw, src); }; }
  if (typeof damageBot === 'function') { const _db = damageBot; damageBot = function (b, raw, src) { try { if (b && b.faction === 'ally') raw = incoming(raw, src, b); } catch (er) { } return _db.call(this, b, raw, src); }; }
  // ---------- çizim: siper taşları ----------
  function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const PAL = { stone: ['#a19dab', '#6b6776', '#c9c5d2', '#56803a'], lava: ['#5e4c4a', '#2e2424', '#7e6a66', null], dungeon: ['#6e6476', '#3a3442', '#8e86a0', null] };
  function drawCover(c) {
    const x = c.x, y = c.y, w = c.w, h = c.h, r = rnd(c.seed), pl = PAL[c.kind] || PAL.stone; ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(x, y - 1, w * .56, 8, 0, 0, 7); ctx.fill();
    const N = 7, pts = []; for (let i = 0; i <= N; i++) { const u = i / N, top = Math.sin(u * Math.PI); pts.push([x - w / 2 + u * w, y - 6 - h * (.35 + .65 * top) * (.85 + r() * .2)]); }
    const path = () => { ctx.beginPath(); ctx.moveTo(x - w / 2, y - 2); for (const [px, py] of pts) ctx.lineTo(px, py); ctx.lineTo(x + w / 2, y - 2); ctx.quadraticCurveTo(x, y + 4, x - w / 2, y - 2); ctx.closePath(); };
    ctx.fillStyle = '#1c1820'; ctx.save(); ctx.translate(0, 0); ctx.lineWidth = 6; ctx.strokeStyle = '#1c1820'; path(); ctx.stroke(); ctx.restore();
    const g = ctx.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, pl[2]); g.addColorStop(.35, pl[0]); g.addColorStop(1, pl[1]); ctx.fillStyle = g; path(); ctx.fill();
    // yüzey: çatlaklar + yan gölge
    ctx.save(); path(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + w * .12, y - h - 4, w * .5, h + 8);
    ctx.strokeStyle = 'rgba(20,16,24,.55)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const sx = x - w * .35 + r() * w * .7, sy = y - h * .7 + r() * h * .3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + rr(-6, 6), sy + 8); ctx.lineTo(sx + rr(-8, 8), sy + 16); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x - w * .36, y - h * .86, w * .22, 3);
    if (pl[3]) { ctx.fillStyle = pl[3]; for (let k = 0; k < 4; k++) { const mx = x - w * .4 + r() * w * .5; ctx.beginPath(); ctx.ellipse(mx, y - h * .82 + r() * 6, 5 + r() * 5, 3, 0, 0, 7); ctx.fill(); } }
    if (c.kind === 'lava') { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,90,30,' + (.5 + .3 * Math.sin(gameTime * 3 + c.seed)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w * .2, y - 6); ctx.lineTo(x - w * .1, y - h * .4); ctx.lineTo(x + w * .05, y - h * .55); ctx.stroke(); }
    ctx.restore(); ctx.restore();
  }
  if (typeof extrasToList === 'function') { const _el = extrasToList; extrasToList = function (list) { _el.apply(this, arguments); try { if (M && M.covers && M.covers.length) { const Z = typeof ZOOM !== 'undefined' ? ZOOM : 1, x0 = camX - 120, y0 = camY - 60, x1 = camX + VW / Z + 120, y1 = camY + VH / Z + 160; for (const c of M.covers) if (c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1) list.push({ y: c.y, k: 7, fn: () => drawCover(c) }); } } catch (e) { } }; }
  // ---------- küçük taktik göstergesi ----------
  const chip = document.createElement('div'); chip.id = 'kdTac'; document.body.appendChild(chip);
  setInterval(() => { const p = P(); if (!p || !M || !tacOn() || p.dead) { chip.classList.remove('on'); return; } const f = formUs(p), b = inBush(p), a = b && gameTime - (p._ambT || -99) >= 4; const parts = [];
    if (f) parts.push('<span class="f">🛡 Saf Düzeni (' + f + ')</span>'); if (b) parts.push('<span class="b">🌿 ' + (a ? 'Pusu hazır +%40' : 'Gizlisin') + '</span>'); if (window.kdMark && !window.kdMark.dead) parts.push('<span class="m">🎯 Odak +%15</span>');
    chip.innerHTML = parts.join(''); chip.classList.toggle('on', parts.length > 0); }, 250);
})();
