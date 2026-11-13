'use strict';
// =====================================================================
//  KIZIL SINIR — KOLONİ BÖLGESİ MEKANİKLERİ (Sürüm 47)
//  1) PUSU ÇALILIKLARI: içindekini dışarıdan göremezsin (95 px'ten yakın ya da
//     aynı çalılıktaysan görürsün; saldıran / vurulan 1.5 sn görünür olur).
//     Sen de çalılığa girince düşmanlar seni kaybeder (kovalamayı atlatma).
//  2) PARTİ YAPAY ZEKÂSI: Gölge Hanedanı 4 parti, Şafak müttefikleri 2 parti.
//     Planlar: pusu (çalılıkta bekle, yaklaşanı sar) • koridor baskını •
//     serbest av • ejder (uyandığında çoğu parti Ejder Yuvası'na koşar).
//  3) KOR EJDERİ AZDARHAN: gerçek saatle her 20 dakikada bir (:00 :20 :40)
//     Ejder Yuvası'nda 10 dk uyanır. Ateş Nefesi, Kanat Fırtınası, Meteor
//     Yağmuru. En çok hasarı veren taraf kazanır: ödül + 10 dk "Ejder Kanı".
// =====================================================================
(function () {
  const on = () => typeof M !== 'undefined' && M && M.sinirV3 && typeof player !== 'undefined' && player;
  // v55: çalılık sistemi her haritada (m.tgrass varsa) — etkinlik haritaları dahil
  const bon = () => typeof M !== 'undefined' && M && M.tgrass && typeof player !== 'undefined' && player;
  const TL = typeof TILE !== 'undefined' ? TILE : 32;
  const P = (x, y) => ({ x: (x + .5) * TL, y: (y + .5) * TL });

  // ------------------------------------------------------------------
  // 1) ÇALILIK
  // ------------------------------------------------------------------
  function bushAt(x, y) { if (!bon()) return 0; const tx = Math.floor(x / TL), ty = Math.floor(y / TL); if (tx < 0 || ty < 0 || tx >= M.W || ty >= M.H) return 0; return M.tgrass[ty * M.W + tx]; }
  window.kdBushAt = bushAt;
  const revealed = o => (o._kdRev || 0) > gameTime || gameTime - (o.hitT == null ? -9 : o.hitT) < 1.5 || (o.atkAnim || 0) > .01;
  // gözlemci a, hedef t'yi görebilir mi?
  function sees(a, t) { const b = bushAt(t.x, t.y); if (!b) return true; if (revealed(t)) return true; if (window.kdRevealHook && kdRevealHook(a, t)) return true; if (bushAt(a.x, a.y) === b) return true; return Math.hypot(a.x - t.x, a.y - t.y) < 95; }
  window.kdSees = sees;
  let curE = null;
  if (typeof validTarget === 'function') {
    const _vt = validTarget;
    validTarget = function (t) { const r = _vt.apply(this, arguments); if (!r || !curE || !bon()) return r; if ((t === player || (t && t.kind === 'bot')) && !sees(curE, t)) return false; return r; };
  }
  // oyuncu vurunca görünür olur
  if (typeof damageEnemy === 'function') {
    const _de = damageEnemy;
    damageEnemy = function (e, dm, src) {
      try { if (src && (src === player || src.kind === 'bot')) src._kdRev = gameTime + 1.5; if (e && e.kdDragon && dm && dm.v > 0) tally(e, src, dm.v); } catch (er) { }
      return _de.apply(this, arguments);
    };
  }
  // gizli düşmanları çizimden / hedeften çıkar
  const visible = e => !e._kdHid;
  function filtered(fn) { return function () { if (!bon()) return fn.apply(this, arguments); const all = enemies; enemies = all.filter(visible); try { return fn.apply(this, arguments); } finally { enemies = all; } }; }
  try { render = filtered(render); } catch (e) { }
  try { drawMiniOn = filtered(drawMiniOn); } catch (e) { }
  try { cycleTarget = filtered(cycleTarget); } catch (e) { }
  try { entityAt = filtered(entityAt); } catch (e) { }
  try { nearestEnemy = filtered(nearestEnemy); } catch (e) { }
  try { skillTarget = filtered(skillTarget); } catch (e) { }
  // çalılıktaki oyuncu / müttefik / görünen düşman yarı saydam
  if (typeof heroLook === 'function') {
    const _hl = heroLook;
    heroLook = function (o) { const r = _hl.apply(this, arguments); try { if (bon() && o && bushAt(o.x, o.y)) r.alpha = Math.min(r.alpha == null ? 1 : r.alpha, .55); } catch (e) { } return r; };
  }

  // ------------------------------------------------------------------
  // 2) PARTİLER
  // ------------------------------------------------------------------
  const LANES = {
    // v50: uç noktalar kule menzilinin hemen dışında (baskıncı parti kuleye yürüyüp erimesin)
    W: [[100, 57], [86, 50], [60, 58], [46, 84], [41, 112], [46, 140], [60, 166], [86, 174], [100, 166]],
    M: [[112, 58], [112, 78], [112, 112], [112, 148], [112, 165]],
    E: [[124, 57], [138, 50], [164, 58], [178, 84], [183, 112], [178, 140], [164, 166], [138, 174], [124, 166]],
  };
  const lanePt = (lane, i, south) => { const L = LANES[lane], k = south ? L.length - 1 - i : i; const q = L[Math.max(0, Math.min(L.length - 1, k))]; return P(q[0], q[1]); };
  const GF = [0, 1, 2, 3].map(i => ({ side: 'foe', i, plan: null, until: 0, members: [] }));
  const GA = [0, 1].map(i => ({ side: 'ally', i, plan: null, until: 0, members: [] }));
  window.kdGroups = { foe: GF, ally: GA };
  const OFF = k => ({ x: Math.cos(k * 2.1) * 30, y: Math.sin(k * 2.1) * 20 });
  function replan(g) {
    const dragonUp = DR && !DR.dead, r = Math.random();
    g.wp = 0; g.bush = null; g.lane = null; g.hold = 0;
    if (dragonUp && r < .7) g.plan = 'dragon';
    else if (r < .45) { g.plan = 'ambush'; const B = (M.bushes || []).filter(b => g.side === 'foe' ? (b.north || Math.hypot(b.x - M.dragonNest.x, b.y - M.dragonNest.y) < 56 * TL) : (!b.north || Math.hypot(b.x - M.dragonNest.x, b.y - M.dragonNest.y) < 56 * TL)); g.bush = B.length ? B[Math.floor(Math.random() * B.length)] : null; if (!g.bush) g.plan = 'roam'; }
    else if (r < .85) { g.plan = 'push'; g.lane = ['W', 'M', 'E'][Math.floor(Math.random() * 3)]; }
    else g.plan = 'roam';
    g.until = gameTime + (g.plan === 'ambush' ? 30 + Math.random() * 25 : 28 + Math.random() * 22);
  }
  function planPoint(g, k) {
    const o = OFF(k);
    if (g.plan === 'ambush' && g.bush) return { x: g.bush.x + o.x * .7, y: g.bush.y + o.y * .5 };
    if (g.plan === 'push') { const p = lanePt(g.lane, g.wp, g.side === 'ally'); return { x: p.x + o.x, y: p.y + o.y }; }
    return null;
  }
  function leaderStep(g) { // koridor: lider vardıysa sonraki noktaya geç; sonda kuşatma bekler
    if (g.plan !== 'push') return; const L = g.members[0]; if (!L) return; const p = lanePt(g.lane, g.wp, g.side === 'ally');
    if (Math.hypot(L.x - p.x, L.y - p.y) < 60) { if (g.wp < LANES[g.lane].length - 1) g.wp++; else if (!g.hold) g.hold = gameTime + 12; }
    if (g.hold && gameTime > g.hold) replan(g);
  }
  // basit yol bulma: kamptan çıkarken/girerken kapıdan geç, sıkışınca kısa yan adım
  const CAMPS = [{ cy: 28, gy: 40, out: 44 }, { cy: 196, gy: 184, out: 180 }];
  function inCamp(x, y) { for (const c of CAMPS) if (Math.abs(x / TL - 112) < 17.5 && Math.abs(y / TL - c.cy) < 12.5) return c; return null; }
  function steer(ent, tx, ty) {
    if (ent._kdDet && gameTime < ent._kdDet.until) return ent._kdDet;
    const ce = inCamp(ent.x, ent.y), ct = inCamp(tx, ty);
    let q = { x: tx, y: ty };
    if (ce && ce !== ct) { // içeriden dışarı: önce orta yola, sonra kapıdan dışarı
      if (Math.abs(ent.x - P(112, 0).x) > 40) q = { x: P(112, 0).x, y: ent.y }; else q = P(112, ce.out);
    } else if (ct && ct !== ce) { // dışarıdan içeri: önce kapının önüne
      if (Math.abs(ent.x - P(112, 0).x) > 40 || Math.abs(ent.y / TL - ct.out) > 3) q = P(112, ct.out);
    }
    // sıkışma algılama
    const s = ent._kdSt || (ent._kdSt = { x: ent.x, y: ent.y, t: gameTime });
    if (Math.hypot(ent.x - s.x, ent.y - s.y) > 10) { s.x = ent.x; s.y = ent.y; s.t = gameTime; }
    else if (gameTime - s.t > 1.2 && Math.hypot(q.x - ent.x, q.y - ent.y) > 30) { const a = Math.atan2(q.y - ent.y, q.x - ent.x) + (Math.random() < .5 ? 1.57 : -1.57); ent._kdDet = { x: ent.x + Math.cos(a) * 90, y: ent.y + Math.sin(a) * 90, until: gameTime + .7 }; s.t = gameTime; return ent._kdDet; }
    return q;
  }
  window.kdSteer = steer;
  function springAmbush(g, victim, shoutWho) {
    g.plan = 'fight'; g.until = gameTime + 14;
    for (const m of g.members) { m.target = victim; m._kdRev = gameTime + 3; }
    if (shoutWho) { try { fl(shoutWho.x, shoutWho.y - 90, g.side === 'foe' ? 'PUSU!' : 'Saldırın!', g.side === 'foe' ? '#ff5050' : '#7dff9a', 18); if (g.side === 'foe' && victim === player) addChat(shoutWho.name, pick(['şimdi!!', 'sar onu!', 'kaçamazsın', 'pusu!']), '#ff7070'); } catch (e) { } }
  }
  function groupsTick() {
    for (const g of GF) g.members = []; for (const g of GA) g.members = [];
    for (const e of enemies) if (e.d && e.d.pvp && !e.dead && !e.duel) { const gi = e.sp && e.sp.grp != null ? e.sp.grp : (e._kdG == null ? (e._kdG = Math.floor(Math.random() * 4)) : e._kdG); GF[gi % 4].members.push(e); }
    let ai = 0; for (const b of bots) if (b.faction === 'ally' && b.alive && !b.party) { GA[(b._kdG == null ? (b._kdG = ai % 2) : b._kdG)].members.push(b); ai++; }
    for (const g of GF.concat(GA)) { if (!g.plan || gameTime > g.until || (g.plan === 'dragon' && !(DR && !DR.dead))) replan(g); leaderStep(g); }
    // pusu: yaklaşan düşmanı sar
    for (const g of GF) if (g.plan === 'ambush' && g.bush) {
      const victims = [player].concat(bots.filter(b => b.faction === 'ally' && b.alive)); let v = null, vd = 270;
      for (const t of victims) { if (t === player && (player.dead || inSafe(player.x, player.y))) continue; const d = Math.hypot(t.x - g.bush.x, t.y - g.bush.y); if (d < vd && (t !== player || !bushAt(t.x, t.y) || bushAt(t.x, t.y) === g.bush.id)) { vd = d; v = t; } }
      if (v) springAmbush(g, v, g.members[0]);
    }
    for (const g of GA) if (g.plan === 'ambush' && g.bush) {
      let v = null, vd = 260; for (const e of enemies) if (e.d && e.d.pvp && !e.dead) { const d = Math.hypot(e.x - g.bush.x, e.y - g.bush.y); if (d < vd) { vd = d; v = e; } }
      if (v) springAmbush(g, v, g.members[0]);
    }
  }
  if (typeof updFoe === 'function') {
    const _uf = updFoe;
    updFoe = function (e, dt) {
      if (!on() || e.duel) return _uf.apply(this, arguments);
      const g = GF[(e.sp && e.sp.grp != null ? e.sp.grp : e._kdG || 0) % 4], k = g.members.indexOf(e);
      if (g.plan === 'dragon' && DR && !DR.dead && (!e.target || dist(e, e.target) > 220)) { e.target = null; return fightDragon(e, dt); }
      if (!e.target) {
        const pt = planPoint(g, Math.max(0, k));
        if (pt) {
          const q = steer(e, pt.x, pt.y); e.wt = 99; e.wx = q.x; e.wy = q.y;
          if (Math.hypot(pt.x - e.x, pt.y - e.y) < 18) { e.moving = false; if (gameTime - e.hitT > 4) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * .05 * dt); e.scan -= dt; if (g.plan === 'ambush') return; }
          else if (g.plan === 'ambush') { // pusuya giderken yakına gelen rakibi görürse tüm parti saldırır
            let v = null, vd = 180; for (const t of [player].concat(bots)) { if (!validTarget(t) || (t.kind === 'bot' && t.faction !== 'ally' && !t.party)) continue; const dd = dist(e, t); if (dd < vd) { vd = dd; v = t; } }
            if (v) { springAmbush(g, v, e); return _uf.apply(this, arguments); }
            moveToward(e, q.x, q.y, e.d.spd * .9, dt); return; }
        }
      }
      return _uf.apply(this, arguments);
    };
  }
  if (typeof updEnemy === 'function') {
    const _ue = updEnemy;
    updEnemy = function (e, dt) { if (e && e.kdDragon) return dragonAI(e, dt); curE = e; try { return _ue.apply(this, arguments); } finally { curE = null; } };
  }
  if (typeof updBot === 'function') {
    const _ub = updBot;
    updBot = function (b, dt) {
      if (!on() || b.faction !== 'ally' || !b.alive || b.party) return _ub.apply(this, arguments);
      const g = GA[(b._kdG || 0) % 2], k = g.members.indexOf(b);
      if (g.plan === 'dragon' && DR && !DR.dead && (!b.target || b.target.dead || !(b.target.d && b.target.d.pvp && dist(b, b.target) < 200))) b.target = DR;
      if (b.target === DR && (!DR || DR.dead)) b.target = null;
      if (b.target && b.target === DR && dist(b, DR) > 380) { b.anim += dt; const q = steer(b, DR.x, DR.y + 120); moveToward(b, q.x, q.y, 140, dt); return; } // uzaktaysa önce yuvaya koş
      if (!b.target) {
        const pt = planPoint(g, Math.max(0, k));
        if (pt) { const q = steer(b, pt.x, pt.y); b.tx = q.x; b.ty = q.y; b.wt = 99;
          if (g.plan === 'ambush') { if (Math.hypot(pt.x - b.x, pt.y - b.y) > 14) moveToward(b, q.x, q.y, 135, dt); else b.moving = false; b.anim += dt; return; } }
      }
      return _ub.apply(this, arguments);
    };
  }
  // daha kalabalık müttefik kampı: 10 müttefik (2 parti)
  const EXTRA = ['Kayra', 'Ilgaz', 'Bilge_Han', 'Asena'];
  if (typeof enterMap === 'function') {
    const _em = enterMap;
    enterMap = function (id) {
      const r = _em.apply(this, arguments);
      try { if (id === 'sinir' && M.sinirV3) {
        const have = new Set(bots.map(b => b.name)); for (const n of EXTRA) if (!have.has(n) && bots.filter(b => b.faction === 'ally').length < 10) bots.push(makeBot(n, bots.length, 'ally', ri(14, 21), M.start.x + rr(-90, 90), M.start.y + rr(-60, 0)));
        DR = null; for (const g of GF.concat(GA)) { g.plan = null; g.until = 0; }
        addChat(null, '🌿 Koyu yeşil PUSU ÇALILIKLARINA girersen dışarıdan görünmezsin, peşindekini atlatırsın. Dikkat: Gölge partileri de orada pusu kurar!', '#9fffb0');
        addChat(null, '🐉 KOR EJDERİ her 20 dakikada bir (saat :00, :20, :40) Ejder Yuvası\'nda uyanır. En çok vuran taraf ödülü kapar!', '#ffb070');
      } } catch (e) { }
      return r;
    };
  }

  // ------------------------------------------------------------------
  // 3) KOR EJDERİ
  // ------------------------------------------------------------------
  const SLOT_MS = 20 * 60 * 1000, LIFE = 10 * 60;
  let DR = null, warned = -1; const DONE = {};
  window.kdDragon = () => DR;
  if (window.KD_ELITE) KD_ELITE.DragonRed = { fam: 'imp', name: 'Kor Ejderi Azdarhan', fw: 0, fh: 0, cnt: 1, px: 300 };
  const slotNow = () => Math.floor(Date.now() / SLOT_MS);
  function nextText() { const ms = (slotNow() + 1) * SLOT_MS - Date.now(), s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function spawnDragon(slot, life) {
    const n = M.dragonNest; if (!n) return;
    const e = makeEnemy({ type: 'titan', lvl: 30, x: n.x, y: n.y });
    Object.assign(e, { type: 'ejder', kdDragon: true, vt: 'DragonRed', elite: true, maxHp: 60000, hp: 60000, atk: 170, def: 46, r: 70, cr: 40, sp: { timer: 0 }, kdSlot: slot, kdLeave: gameTime + life, tally: { ally: 0, foe: 0, me: 0 }, kdAtkT: 3, kdN: 0, face: -1 });
    e.d = Object.assign({}, e.d, { name: '🐉 Kor Ejderi Azdarhan', boss: true, h: 300, r: 70, spd: 0, range: 150, aggro: 0, col: '#ff6030', tele: null, xp: 0, resp: 1e9 });
    enemies.push(e); DR = e; for (const g of GF.concat(GA)) g.until = 0; // tüm partiler yeniden plan yapsın (çoğu yuvaya koşar)
    banner('KOR EJDERİ UYANDI!', 'Ejder Yuvası • En çok vuran taraf ödülü kapar');
    addChat(null, '🐉 KOR EJDERİ AZDARHAN Ejder Yuvası\'nda uyandı! Tüm partiler yuvaya!', '#ff8040');
    for (let i = 0; i < 40; i++) particles.push({ x: n.x + rr(-120, 120), y: n.y - rr(0, 200), vx: rr(-120, 120), vy: rr(-220, -40), life: 1, max: 1, col: Math.random() < .5 ? '#ff7030' : '#ffd080', s: rr(3, 7) });
  }
  window.kdDragonSpawn = () => { if (on() && !(DR && !DR.dead)) spawnDragon(slotNow(), LIFE); return DR; };
  function tally(e, src, v) { const T = e.tally; if (!T) return; if (src === player) { T.ally += v; T.me += v; } else if (src && src.kind === 'bot' && (src.faction === 'ally' || src.party)) T.ally += v; else if (src && src.foe) T.foe += v; }
  function combatants() {
    const L = []; const p = player; if (p && !p.dead && !inSafe(p.x, p.y)) L.push(p);
    for (const b of bots) if (b.alive && b.mortal) L.push(b);
    for (const e of enemies) if (e.d && e.d.pvp && !e.dead && !e.duel) L.push(e);
    return L;
  }
  // Gölge oyuncusu ejdere saldırır (yakın dövüşçü yanına koşar, uzak dövüşçü menzilde durur)
  function fightDragon(e, dt) {
    const d = DR, sm = e.slowUntil > gameTime ? .5 : 1, reach = (e.range || 40) + d.r * .8, dd = dist(e, d);
    e.face = d.x < e.x ? -1 : 1;
    if (dd > reach) { const q = steer(e, d.x, d.y); moveToward(e, q.x, q.y, e.d.spd * sm, dt); return; }
    e.atkT -= dt; if (e.atkT > 0) return;
    e.atkT = e.as; e.atkAnim = .22; e.alt = !e.alt;
    if (e.ranged) for (let k = 0; k < 5; k++) particles.push({ x: e.x + (d.x - e.x) * k / 5, y: e.y - 22 + (d.y - 120 - e.y + 22) * k / 5, vx: 0, vy: -10, life: .25, max: .25, col: e.cls === 'mage' ? '#c890ff' : '#ffe0a0', s: 3 });
    damageEnemy(d, rollDmg(e.atk * 1.1, d.def, .05, 1.6, 1), e);
  }
  const DT = []; // ejder saldırı işaretleri
  function tele(x, y, r, delay, dmg, kind) { DT.push({ x, y, r, t0: gameTime, delay, dmg, kind }); }
  function hitAll(t, dmg) {
    for (const c of combatants()) {
      if (Math.hypot(c.x - t.x, (c.y - t.y) * 1.25) > t.r) continue;
      if (c === player) { damagePlayer(dmg, DR || null); }
      else if (c.kind === 'bot') damageBot(c, dmg, DR || null);
      else { const v = Math.max(1, Math.round(dmg * rr(.9, 1.1) - (c.def || 0) * .5)); c.hp -= v; c.hitT = gameTime; fl(c.x + rr(-8, 8), c.y - 60, '' + v, '#ff9050', 12); if (c.hp <= 0) killEnemy(c, DR || c); }
      if (t.kind === 'wing') { const a = Math.atan2(c.y - t.y, c.x - t.x); try { moveEnt(c, Math.cos(a) * 70, Math.sin(a) * 50); } catch (e) { } }
    }
  }
  function dragonAI(e, dt) {
    e.anim += dt; e.atkAnim = Math.max(0, e.atkAnim - dt); try { updDots(e); } catch (er) { } if (e.dead) return;
    if (gameTime > e.kdLeave) { // süre doldu: göğe yükselir
      e.dead = true; e.diedAt = gameTime; DONE[e.kdSlot] = 'fled'; DR = null;
      addChat(null, '🐉 Kor Ejderi kimseye boyun eğmeden göğe yükseldi... Bir sonraki uyanış: ' + nextText(), '#ffb070'); banner('KOR EJDERİ UÇUP GİTTİ', 'Bir sonraki uyanışı bekle'); return;
    }
    const C = combatants().filter(c => Math.hypot(c.x - e.x, c.y - e.y) < 700);
    if (C.length) { const n = C.reduce((a, b) => Math.hypot(a.x - e.x, a.y - e.y) < Math.hypot(b.x - e.x, b.y - e.y) ? a : b); e.face = n.x < e.x ? -1 : 1; }
    if (gameTime - e.hitT > 6) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * .004 * dt);
    e.kdAtkT -= dt; if (e.kdAtkT > 0 || !C.length) return;
    const enraged = e.hp < e.maxHp * .3, kind = e.kdN++ % 3; e.kdAtkT = enraged ? 2.4 : 3.4; e.atkAnim = .6;
    if (kind === 0) { // Ateş Nefesi: en yakın 4 savaşçının ayağının altı
      const tg = C.slice().sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y)).slice(0, enraged ? 6 : 4);
      for (const c of tg) tele(c.x, c.y, 100, 1.2, e.atk * 1.3, 'fire');
      fl(e.x, e.y - 320, 'Ateş Nefesi!', '#ff7030', 18);
    } else if (kind === 1) { tele(e.x, e.y, 300, 1.5, e.atk * .9, 'wing'); fl(e.x, e.y - 320, 'Kanat Fırtınası!', '#ffd080', 18); }
    else { const n = M.dragonNest; for (let i = 0; i < (enraged ? 12 : 9); i++) { const a = Math.random() * 6.283, rr2 = Math.sqrt(Math.random()) * n.r * 1.25; tele(n.x + Math.cos(a) * rr2, n.y + Math.sin(a) * rr2 * .8, 85, 1.3 + Math.random() * .9, e.atk * 1.5, 'meteor'); } fl(e.x, e.y - 320, 'Meteor Yağmuru!', '#ff5030', 18); }
  }
  function teleTick() {
    for (let i = DT.length - 1; i >= 0; i--) { const t = DT[i]; if (gameTime - t.t0 < t.delay) continue; DT.splice(i, 1);
      try { if (window.naFx) naFx(t.kind === 'wing' ? 'smoke' : 'bigexpl', t.x, t.y - 20, t.kind === 'wing' ? 6 : 3.4, { add: t.kind !== 'wing' }); } catch (e) { }
      effects.push({ type: 'ring', x: t.x, y: t.y, t: 0, r0: 10, r1: t.r, col: t.kind === 'wing' ? '#ffe0a0' : '#ff6020', dur: .45, fill: true });
      for (let k = 0; k < (t.kind === 'wing' ? 30 : 14); k++) particles.push({ x: t.x + rr(-t.r * .5, t.r * .5), y: t.y - rr(0, 30), vx: rr(-140, 140), vy: rr(-220, -40), life: .7, max: .7, col: Math.random() < .5 ? '#ff7030' : '#ffd080', s: rr(3, 6) });
      if (DR && !DR.dead) hitAll(t, t.dmg); }
  }
  // ejder ölünce: taraf hesabı + ödül
  if (typeof killEnemy === 'function') {
    const _ke = killEnemy;
    killEnemy = function (e, src) {
      if (!e || !e.kdDragon || e.dead) return _ke.apply(this, arguments);
      e.tagged = null; const r = _ke.apply(this, arguments); DONE[e.kdSlot] = 'killed'; DR = null; DT.length = 0;
      const T = e.tally, ally = T.ally >= T.foe, p = player;
      if (ally) {
        banner('KOR EJDERİ DÜŞTÜ!', 'Şafak Kampı kazandı • Ejder Kanı: 10 dk Saldırı +%15, Can +%10');
        addChat(null, '🏆 Şafak Kampı Kor Ejderi Azdarhan\'ı devirdi! (Şafak ' + Math.round(T.ally) + ' / Gölge ' + Math.round(T.foe) + ' hasar)', '#ffd040');
        if (p && !p.dead && (T.me > 0 || Math.hypot(p.x - e.x, p.y - e.y) < 900)) {
          const h = 40 + Math.round(20 * Math.min(1, T.me / Math.max(1, T.ally) * 4)); p.honor = (p.honor || 0) + h; fl(p.x, p.y - 100, '+' + h + ' Onur', '#ff9a60', 18);
          try { gainXp(3000 + p.lvl * 60); } catch (er) { }
          p.buffs.ejder = { until: gameTime + 600, mods: { atkP: .15, hpP: .1 }, col: '#ff9050' }; recalc(p);
          try { const x0 = e.x, y0 = e.y; for (let k = 0; k < 3; k++) { e.x = x0 + rr(-60, 60); e.y = y0 + rr(-30, 30); dropLoot(e); } e.x = x0; e.y = y0; } catch (er) { }
        }
      } else {
        foeBuffUntil = gameTime + 600;
        banner('GÖLGE HANEDANI EJDERİ KESTİ', '10 dk boyunca Gölge savaşçıları güçlü!');
        addChat(null, '☠ Gölge Hanedanı Kor Ejderi\'ni kesti! 10 dakika boyunca saldırıları %15 güçlü. (Şafak ' + Math.round(T.ally) + ' / Gölge ' + Math.round(T.foe) + ' hasar)', '#ff7070');
      }
      return r;
    };
  }
  let foeBuffUntil = -1;
  if (typeof makeFoe === 'function') { const _mf = makeFoe; makeFoe = function () { const e = _mf.apply(this, arguments); try { if (gameTime < foeBuffUntil) e.atk *= 1.15; } catch (er) { } return e; }; }
  // yön oku: ejder uyanıkken görev okunun yerine geçer
  if (typeof questTarget === 'function') { const _qt = questTarget; questTarget = function () { if (on() && DR && !DR.dead) return { x: DR.x, y: DR.y, label: '🐉 Kor Ejderi' }; return _qt.apply(this, arguments); }; }

  // ------------------------------------------------------------------
  // her kare
  // ------------------------------------------------------------------
  let lastBush = 0;
  function tick(dt) {
    if (bon()) { const p = player;
      // görünürlük bayrakları (v55: etkinliklerde canavarlar da çalılıkta gizlenir)
      for (const e of enemies) e._kdHid = !!(e.d && (e.d.pvp || M.evMap) && !e.dead && !e.kdMon && !e.d.boss && !sees(p, e));
      if (p.target && p.target._kdHid) { p.target = null; p.chase = false; }
      const b = bushAt(p.x, p.y); if (b && b !== lastBush) fl(p.x, p.y - 90, '🌿 Çalılıktasın: dışarıdan görünmüyorsun', '#9fffb0', 12); lastBush = b;
    } else for (const e of enemies) e._kdHid = false;
    if (!on()) { DR = null; DT.length = 0; TB.length = 0; return; }
    const p = player;
    groupsTick(); towersTick(dt);
    // ejder takvimi
    if (DR && (!enemies.includes(DR) || DR.dead)) DR = enemies.includes(DR) && !DR.dead ? DR : null;
    const sl = slotNow(), age = (Date.now() - sl * SLOT_MS) / 1000;
    if (!DR && !window.__kdNoDragon && age < LIFE && !DONE[sl]) spawnDragon(sl, LIFE - age);
    const toNext = (sl + 1) * SLOT_MS - Date.now();
    if (!DR && toNext < 60000 && warned !== sl + 1 && !window.__kdNoDragon) { warned = sl + 1; addChat(null, '🐉 Yer titriyor... Kor Ejderi 1 dakika içinde Ejder Yuvası\'nda uyanacak!', '#ffb070'); banner('EJDER UYANIYOR', '1 dakika içinde Ejder Yuvası\'nda'); }
    teleTick();
  }
  if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try { tick(dt); } catch (e) { console.error(e); } }; }

  // ------------------------------------------------------------------
  // çizim: çalılık zemini + ön plan öbekleri, ejder saldırı işaretleri
  // ------------------------------------------------------------------
  const IM = {}; const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; };
  const ok = i => i && i.complete && i.naturalWidth > 0;
  function viewRange() { const Z = typeof ZOOM !== 'undefined' ? ZOOM : 1; return { x0: Math.max(0, Math.floor(camX / TL) - 1), y0: Math.max(0, Math.floor(camY / TL) - 1), x1: Math.min(M.W - 1, Math.ceil((camX + VW / Z) / TL) + 1), y1: Math.min(M.H - 1, Math.ceil((camY + VH / Z) / TL) + 2) }; }
  function groundDraw() {
    if (!bon()) return; const f = img('pg_field'); const R = viewRange(), G = M.tgrass, W = M.W;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
      if (!G[y * W + x]) continue;
      const n = !G[(y - 1) * W + x], s = !G[(y + 1) * W + x], w = !G[y * W + x - 1], e = !G[y * W + x + 1];
      const col = w && !e ? 0 : e && !w ? 2 : 1, row = n && !s ? 0 : s && !n ? 2 : 1;
      if (ok(f)) ctx.drawImage(f, col * 16, row * 16, 16, 16, x * TL, y * TL, TL, TL); else { ctx.fillStyle = '#4a7a2a'; ctx.fillRect(x * TL, y * TL, TL, TL); }
    }
    // ejder saldırı işaretleri (dolarak kızaran alan)
    for (const t of DT) { const k = Math.min(1, (gameTime - t.t0) / t.delay);
      ctx.fillStyle = 'rgba(255,60,20,' + (.12 + k * .28) + ')'; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * .8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,140,40,.45)'; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * k, t.r * .8 * k, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,120,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * .8, 0, 0, 7); ctx.stroke(); }
    // ejderin dev gölgesi
    if (DR && !DR.dead) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(DR.x, DR.y + 6, 130, 34, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function topDraw() {
    if (!bon()) return; const tf = img('pg_tuft'); if (!ok(tf)) return; const R = viewRange(), G = M.tgrass, W = M.W, t = gameTime;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
      if (!G[y * W + x]) continue; const h = (x * 73856093 ^ y * 19349663) >>> 0;
      for (let k = 0; k < 2; k++) { const v = (h >> (k * 3)) % 5, ox = k * 14 + ((h >> 8) % 6) - 2, sw = Math.sin(t * 2.2 + x * .7 + y * .3 + k) * 1.5;
        ctx.save(); ctx.translate(x * TL + ox + 8, y * TL + TL - 2 + k * 6); ctx.transform(1, 0, sw * .06, 1, 0, 0); ctx.globalAlpha = .92;
        ctx.drawImage(tf, v * 16, 0, 16, 16, -10, -22, 20, 20); ctx.restore(); }
    }
    ctx.restore();
  }
  if (typeof drawExtrasGround === 'function') { const _g = drawExtrasGround; drawExtrasGround = function () { _g.apply(this, arguments); try { groundDraw(); } catch (e) { } }; }
  if (typeof drawExtrasTop === 'function') { const _t = drawExtrasTop; drawExtrasTop = function () { try { topDraw(); } catch (e) { } _t.apply(this, arguments); }; }

  // ------------------------------------------------------------------
  // 4) KÖY SAVUNMA KULELERİ (v48): düşmanı algılar, güdümlü ateş topu atar.
  //    Her isabet hedefin maksimum canının %25'i. Görünmez suikastçıyı yalnız
  //    çok yakından (70 px), çalılıktakini dışarıdan göremez → sızma mümkün ama riskli.
  // ------------------------------------------------------------------
  const TB = []; // kule mermileri
  const TW_CD = 1.8, TW_DMG = .25;
  function towerSees(tw, t) { if (t === player && player.stealthUntil > gameTime) return Math.hypot(t.x - tw.x, t.y - tw.y) < 70; return sees(tw, t); }
  function towerTarget(tw) {
    let best = null, bd = tw.range;
    if (tw.side === 'foe') { const C = [player].concat(bots.filter(b => b.alive && b.mortal)); for (const t of C) { if (t === player && (player.dead || inSafe(player.x, player.y))) continue; const d = Math.hypot(t.x - tw.x, t.y - tw.y); if (d < bd && towerSees(tw, t)) { bd = d; best = t; } } }
    else for (const e of enemies) { if (e.dead || !e.d.pvp || e.duel) continue; const d = Math.hypot(e.x - tw.x, e.y - tw.y); if (d < bd && sees(tw, e)) { bd = d; best = e; } }
    return best;
  }
  function towerHit(tw, t) {
    if (!t) return; let v;
    if (t === player) { if (player.dead) return; v = Math.round(player.stats.maxHp * TW_DMG); player.hp -= v; player.lastHit = gameTime; fl(player.x, player.y - 70, '-' + v + ' (Kule)', '#ff6040', 15); if (player.hp <= 0) { player.hp = 0; try { die({ name: 'Gölge Kulesi' }); } catch (e) { } } }
    else if (t.kind === 'bot') { if (!t.alive) return; v = Math.round(t.maxHp * TW_DMG); t.hp -= v; t.hitT = gameTime; fl(t.x, t.y - 66, '-' + v, '#ff6040', 12); if (t.hp <= 0) { t.alive = false; t.respawnAt = gameTime + 15; t.target = null; } }
    else { if (t.dead) return; v = Math.round(t.maxHp * TW_DMG); t.hp -= v; t.hitT = gameTime; fl(t.x, t.y - 66, '-' + v, '#7fd8ff', 12); if (t.hp <= 0) killEnemy(t, tw); }
    try { if (window.naFx) naFx('expl', t.x, t.y - 24, 2.2, { add: true }); } catch (e) { }
  }
  function towersTick(dt) {
    const T = M.towers || []; for (const tw of T) { tw.cd -= dt; if (tw.cd > 0) continue; const t = towerTarget(tw); if (!t) { tw.cd = .3; continue; } tw.cd = TW_CD; tw.fire = gameTime; TB.push({ x: tw.x, y: tw.y - 80, t, side: tw.side, trail: [], life: 3, tw }); try { if (window.kdSfx && Math.hypot(player.x - tw.x, player.y - tw.y) < 600) kdSfx('fire'); } catch (e) { } }
    for (let i = TB.length - 1; i >= 0; i--) { const b = TB[i], t = b.t; b.life -= dt; const gone = !t || (t === player ? player.dead : t.kind === 'bot' ? !t.alive : t.dead); if (gone || b.life <= 0) { TB.splice(i, 1); continue; }
      if (t === player && player.stealthUntil > gameTime && !towerSees(b.tw, t)) { for (let k = 0; k < 8; k++) particles.push({ x: b.x, y: b.y, vx: rr(-60, 60), vy: rr(-60, 20), life: .4, max: .4, col: '#ffb060', s: 3 }); TB.splice(i, 1); continue; } // görünmezlik kilidi kırar
      const tx = t.x, ty = t.y - 24, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy); b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 9) b.trail.shift();
      if (d < 16) { TB.splice(i, 1); towerHit(b.tw, t); continue; } const st = Math.min(d, 380 * dt); b.x += dx / d * st; b.y += dy / d * st; }
  }
  window.kdTowers = () => (M && M.towers) || [];
  const twImg = { ally: null, foe: null };
  function drawTower(tw) {
    const im = twImg[tw.side] || (twImg[tw.side] = img(tw.side === 'ally' ? 'tw_ally' : 'tw_foe')); ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(tw.x, tw.y + 4, 34, 10, 0, 0, 7); ctx.fill();
    if (ok(im)) ctx.drawImage(im, Math.round(tw.x - 48), Math.round(tw.y - 92), 96, 96);
    if (tw.fire && gameTime - tw.fire < .25) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(tw.x, tw.y - 80, 0, tw.x, tw.y - 80, 30); g.addColorStop(0, 'rgba(255,220,120,.9)'); g.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tw.x, tw.y - 80, 30, 0, 7); ctx.fill(); }
    ctx.restore(); try { label(tw.x, tw.y - 98, tw.side === 'ally' ? 'Şafak Kulesi' : 'Gölge Kulesi', tw.side === 'ally' ? '#9fe0ff' : '#ff7070', 10); } catch (e) { }
  }
  if (typeof extrasToList === 'function') { const _el = extrasToList; extrasToList = function (list) { _el.apply(this, arguments); try { if (on() && M.towers) for (const tw of M.towers) if (!window.kdOnScreen || kdOnScreen(tw.x, tw.y, 140)) list.push({ y: tw.y, k: 7, fn: () => drawTower(tw) }); } catch (e) { } }; }
  if (typeof drawExtrasTop === 'function') { const _t2 = drawExtrasTop; drawExtrasTop = function () { _t2.apply(this, arguments); try { if (!on()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of TB) { for (let i = 0; i < b.trail.length; i++) { const q = b.trail[i]; ctx.fillStyle = (b.side === 'foe' ? 'rgba(255,90,30,' : 'rgba(90,200,255,') + (i / b.trail.length) * .6 + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, 3 + i * .7, 0, 7); ctx.fill(); }
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 15); g.addColorStop(0, '#fff6d0'); g.addColorStop(.45, b.side === 'foe' ? 'rgba(255,120,30,.95)' : 'rgba(80,190,255,.95)'); g.addColorStop(1, 'rgba(255,40,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 15, 0, 7); ctx.fill(); }
    ctx.restore(); } catch (e) { } }; }

  // haritada çalılıklar yeşil görünür (taktik için)
  if (typeof buildMini === 'function') {
    const _bm = buildMini;
    buildMini = function (m) { _bm.apply(this, arguments); try { if (m && m.tgrass && m.mini) { const g = m.mini.getContext('2d'); g.fillStyle = '#3f9a2a'; for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (m.tgrass[y * m.W + x]) g.fillRect(x, y, 1, 1); } } catch (e) { } };
  }

  // ------------------------------------------------------------------
  // arayüz: ejder sayacı (üst orta) + büyük duyuru
  // ------------------------------------------------------------------
  const chip = document.createElement('div'); chip.id = 'kdDrg'; document.body.appendChild(chip);
  chip.addEventListener('pointerdown', e => { e.preventDefault(); try { if (DR && !DR.dead) showToast('Kor Ejderi uyanık!', 'Sarı ok seni Ejder Yuvası\'na götürür. En çok vuran taraf kazanır.', 2.4); else showToast('Kor Ejderi ' + nextText() + ' sonra uyanır', 'Her 20 dakikada bir (:00 :20 :40) Ejder Yuvası\'nda', 2.4); } catch (er) { } });
  const bn = document.createElement('div'); bn.id = 'kdDrgB'; document.body.appendChild(bn); let bnT = null;
  function banner(a, b) { bn.innerHTML = '<div class="a">' + a + '</div><div class="b">' + b + '</div>'; bn.className = ''; void bn.offsetWidth; bn.className = 'show'; clearTimeout(bnT); bnT = setTimeout(() => { bn.className = ''; }, 3400); }
  window.kdDragonBanner = banner;
  setInterval(() => {
    const show = typeof running !== 'undefined' && running && on(); chip.classList.toggle('on', !!show); if (!show) return;
    if (DR && !DR.dead) { const d = Math.round(Math.hypot(DR.x - player.x, DR.y - player.y) / TL); chip.className = 'on up'; chip.textContent = '🐉 KOR EJDERİ UYANIK • %' + Math.ceil(DR.hp / DR.maxHp * 100) + ' • ' + d + 'm'; }
    else { chip.className = 'on'; chip.textContent = '🐉 Kor Ejderi ' + nextText(); }
  }, 250);
})();
