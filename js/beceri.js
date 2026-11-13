'use strict';
// =====================================================================
//  YETENEK SİSTEMİ v3 (Sürüm 48) — her sınıfta 3 PvE (kasılma) + 3 PvP yeteneği
//  • Oyuncu istediği an PvE ⇄ PvP setine geçer (PvP bölgesine girince PvP seti).
//  • Avcı: YAY takılıyken yalnız okçu seti, HANÇER takılıyken yalnız suikastçı seti.
//  • Sınıf kimlikleri:
//    Savaşçı  — dayanıklı, tek hedef, kovalama (Hücum / Kanca), küçük alanlı Yer Sarsıntısı
//    Büyücü   — yüksek büyü hasarı: Ateş, Buz (yavaşlatır), Yıldırım (%35 şansla kilitler)
//    Suikastçı— görünmezlik, çok yüksek kritik, hızlı; ama kırılgan (az can/savunma)
//    Okçu     — uzaktan, hızlı koşar, tek başına orta hasar; yakındaki her okçu +%8
//               Ejder Oku: dev ok, 2 sn kilitler
//    Rahip    — mor Zehir Alanı (kendi merkezinden; yalnız rakip oyunculara), Arınma (cure),
//               Kutsama (buff) ve Toplu Şifa — yalnız KENDİ PARTİSİNE ve menzil içinde
//  • Her yeteneğin kendi görsel efekti ve sesi var.
// =====================================================================
(function () {
  const S = (id, n, ic, set, lv, mp, cd, o, d) => Object.assign({ id, n, ic, set, lv, mp, cd, k: 'x', br: o && o.off ? 'atk' : 'def', pas: false, d }, o || {});
  const KIT = {
    warrior: [
      S('wv1', 'Ağır Yarma', '🪓', 'pve', 1, 8, 3, { off: 1, rng: 'melee', snd: 'slash', auto: 'atk' }, 'Hedefe %170 hasar; yanındaki düşmanlara %60 yarma hasarı.'),
      S('wv2', 'Yer Sarsıntısı', '💥', 'pve', 10, 18, 8, { rng: 0, snd: 'smash', auto: 'aoe', r: 115 }, 'Yere vurur: çevrendeki (küçük alan) düşmanlara %150 hasar ve 2 sn yavaşlatma.'),
      S('wv3', 'Savaş Narası', '📯', 'pve', 22, 20, 20, { snd: 'shout', auto: 'buff' }, '12 sn savunma +%35 ve can yenilenmesi; yakındaki canavarları üstüne çeker.'),
      S('wp1', 'Hücum', '🐂', 'pvp', 5, 14, 7, { off: 1, rng: 340, snd: 'charge', auto: 'atk' }, 'Hedefe atılır (340 menzil): %130 hasar ve 0.8 sn sersemletme. Kaçanı yakalar.'),
      S('wp2', 'Zincir Kanca', '⛓️', 'pvp', 15, 16, 10, { off: 1, rng: 300, snd: 'chain', auto: 'atk' }, 'Kancayı fırlatıp rakibi yanına çeker: %120 hasar, 2.5 sn %50 yavaşlatma.'),
      S('wp3', 'Demir İrade', '🛡️', 'pvp', 30, 20, 22, { snd: 'iron', auto: 'self' }, '5 sn alınan hasar -%45, hız +%30; üzerindeki yavaşlatma ve zehirleri siler.'),
    ],
    mage: [
      S('mv1', 'Ateş Topu', '🔥', 'pve', 1, 10, 2.5, { off: 1, rng: 300, snd: 'fire', auto: 'atk' }, 'Patlayan ateş topu: %190 hasar, çevresine %60.'),
      S('mv2', 'Alev Yağmuru', '☄️', 'pve', 10, 26, 9, { off: 1, rng: 330, snd: 'meteor', auto: 'atk', r: 150 }, 'Hedefin üstüne göktaşı yağdırır (geniş alan): %160 hasar + 4 sn yanan zemin.'),
      S('mv3', 'Mana Kalkanı', '🔷', 'pve', 22, 20, 18, { snd: 'shield', auto: 'self' }, '10 sn boyunca canının %30\'u kadar hasar emen kalkan.'),
      S('mp1', 'Buz Oku', '❄️', 'pvp', 5, 14, 5, { off: 1, rng: 320, snd: 'ice', auto: 'atk' }, 'Buz oku: %150 hasar, rakibi 3 sn %50 yavaşlatır (donma).'),
      S('mp2', 'Yıldırım', '⚡', 'pvp', 15, 20, 8, { off: 1, rng: 330, snd: 'thunder', auto: 'atk' }, 'Zincirleme yıldırım: %190 hasar + 2 sekme. Her çarpmada %35 şansla 1.5 sn kilitler.'),
      S('mp3', 'Cehennem Alevi', '🌋', 'pvp', 30, 32, 14, { off: 1, rng: 320, snd: 'inferno', auto: 'atk' }, 'Hedefin altından alev sütunu: %330 hasar + 5 sn yanma.'),
    ],
    archer: [
      // YAY (okçu)
      S('av1', 'Çoklu Ok', '🎯', 'pve', 1, 10, 3, { wpn: 'bow', snd: 'bow', auto: 'atk', rng: 300 }, 'Yelpaze gibi 5 ok: her biri %80 hasar.'),
      S('av2', 'Ok Yağmuru', '🌧️', 'pve', 10, 24, 9, { wpn: 'bow', off: 1, rng: 340, snd: 'volley', auto: 'atk', r: 140 }, 'Hedef alana ok yağmuru: %200 hasar.'),
      S('av3', 'Kartal Gözü', '🦅', 'pve', 22, 16, 20, { wpn: 'bow', snd: 'buff', auto: 'buff' }, '12 sn kritik +%15, menzil +60, saldırı hızı +%15.'),
      S('ap1', 'Sabitleyici Ok', '📌', 'pvp', 5, 12, 7, { wpn: 'bow', off: 1, rng: 320, snd: 'bow', auto: 'atk' }, '%150 hasar, 2.5 sn %50 yavaşlatma.'),
      S('ap2', 'Rüzgar Adımı', '🍃', 'pvp', 15, 14, 14, { wpn: 'bow', snd: 'wind', auto: 'self' }, '5 sn hız +%60 ve kaçınma +%25 — mesafeyi koru.'),
      S('ap3', 'Ejder Oku', '🐉', 'pvp', 30, 35, 20, { wpn: 'bow', off: 1, rng: 380, snd: 'dragon', auto: 'atk' }, 'Dev, parlayan ok: %360 hasar, yolundakilere %120; hedefi 2 sn kilitler.'),
      // HANÇER (suikastçı)
      S('sv1', 'Çift Kesik', '🗡️', 'pve', 1, 8, 3, { wpn: 'dag', off: 1, rng: 'melee', snd: 'slash', auto: 'atk' }, 'Art arda iki hızlı kesik: 2 x %100.'),
      S('sv2', 'Bıçak Kasırgası', '🌀', 'pve', 10, 18, 8, { wpn: 'dag', snd: 'whirl', auto: 'aoe', r: 110 }, 'Dönerek çevrendeki herkese %150 hasar.'),
      S('sv3', 'Kan Emici', '🩸', 'pve', 22, 16, 18, { wpn: 'dag', snd: 'buff', auto: 'buff' }, '10 sn verdiğin hasarın %25\'i can olur, kritik +%10.'),
      S('sp1', 'Gölge Pelerini', '👤', 'pvp', 5, 18, 16, { wpn: 'dag', snd: 'stealth', auto: 'none' }, '6 sn GÖRÜNMEZ ol, hız +%45. Görünmezken ilk vuruş kesin kritik ve x2.4.'),
      S('sp2', 'Ölümcül Hançer', '☠️', 'pvp', 15, 20, 10, { wpn: 'dag', off: 1, rng: 'melee', snd: 'assassin', auto: 'atk' }, '%220 hasar, kritik +%40. Canı %30\'un altındaysa x2 (infaz). Görünmezken tek vuruş öldürebilir.'),
      S('sp3', 'Gölge Adımı', '💨', 'pvp', 30, 16, 9, { wpn: 'dag', off: 1, rng: 380, snd: 'blink', auto: 'atk' }, 'Rakibin arkasına ışınlan: 2 sn %50 yavaşlatır, sonraki saldırın kritik.'),
    ],
    priest: [
      S('pv1', 'Kutsal Işık', '☀️', 'pve', 1, 14, 4, { off: 1, rng: 300, snd: 'holy', auto: 'atk', r: 150 }, 'Hedefin etrafına kutsal ışık: alandaki düşmanlara %85 hasar.'),
      S('pv2', 'Şifa Dalgası', '💚', 'pve', 10, 28, 12, { snd: 'heal', auto: 'heal', r: 380 }, 'Sen ve 380 menzildeki PARTİ üyeleri: anında %22 can + 5 sn %10.'),
      S('pv3', 'Kutsama', '✨', 'pve', 22, 25, 18, { snd: 'bless', auto: 'buff', r: 400 }, 'Sen ve menzildeki PARTİ üyeleri: 15 sn can +%20, savunma +%30.'),
      S('pp1', 'Zehir Alanı', '☁️', 'pvp', 5, 24, 12, { snd: 'poison', auto: 'pzone', r: 200 }, 'Kendi merkezinden yayılan MOR zehir alanı (6 sn, seninle yürür): içindeki RAKİP OYUNCULARIN saldırısı -%40, savunması -%25 + zehir hasarı.'),
      S('pp2', 'Arınma', '💧', 'pvp', 15, 20, 10, { snd: 'cleanse', auto: 'cure', r: 400 }, 'Sen ve menzildeki PARTİ üyelerinden zehir, büyü ve yavaşlatmaları siler; 3 sn bağışıklık.'),
      S('pp3', 'Toplu Şifa', '💖', 'pvp', 30, 40, 16, { snd: 'heal2', auto: 'heal', r: 420 }, 'Party Heal: sen ve 420 menzildeki PARTİ üyeleri anında %35 can + 5 sn %15.'),
    ],
  };
  window.KD_KIT = KIT;
  for (const c in KIT) SKILLS[c] = KIT[c];
  for (const k in SKILL_BY_ID) delete SKILL_BY_ID[k];
  for (const c in SKILLS) for (const s of SKILLS[c]) SKILL_BY_ID[s.id] = s;

  // ---------------- yardımcılar ----------------
  const P = () => (typeof player !== 'undefined' ? player : null);
  const dag = p => !!(window.kdIsDagger && kdIsDagger(p));
  const wpnOK = (p, sk) => !sk.wpn || (sk.wpn === 'dag' ? dag(p) : !dag(p));
  function setSkills(p, set) { return (SKILLS[p.cls] || []).filter(s => s.set === set && wpnOK(p, s)).sort((a, b) => a.lv - b.lv).slice(0, 3); }
  function buildAct(p) {
    if (!p) return; if (!p.kdSet) p.kdSet = (typeof M !== 'undefined' && M && M.pvp) ? 'pvp' : 'pve';
    p.act = setSkills(p, p.kdSet).map(s => s.id); while (p.act.length < 3) p.act.push(null);
    p.pas = [null, null]; p.learned = (SKILLS[p.cls] || []).filter(s => s.lv <= p.lvl).map(s => s.id);
    p._kdW = p.eq && p.eq.weapon;
  }
  window.kdBuildAct = buildAct;
  function toggleSet(force) {
    const p = P(); if (!p) return; p.kdSet = force || (p.kdSet === 'pvp' ? 'pve' : 'pvp'); buildAct(p); try { buildBar(); } catch (e) { }
    try { fl(p.x, p.y - 96, p.kdSet === 'pvp' ? '⚔ PvP SETİ' : '🌿 PvE SETİ', p.kdSet === 'pvp' ? '#ff8a8a' : '#9fffb0', 16); } catch (e) { } sfx('switch'); updSetBtn();
  }
  window.kdToggleSet = toggleSet;
  const FX = (k, x, y, s, o) => { if (window.naFx) try { naFx(k, x, y, s, o); } catch (e) { } };
  const L = []; // efekt listesi (çizim)
  const PR = []; // özel mermiler
  const SCH = []; // zamanlanmış işler
  const later = (dt, fn) => SCH.push({ at: gameTime + dt, fn });
  let shakeT = 0, shakeA = 0; const shake = (a, d) => { shakeA = Math.max(shakeA, a); shakeT = Math.max(shakeT, d); };
  function partyAllies(p, r) { const A = [p]; for (const b of bots) if (b.alive && b.party && Math.hypot(b.x - p.x, b.y - p.y) < r) A.push(b); return A; }
  function foesNear(x, y, r, onlyPlayers) { const R = []; for (const e of enemies) { if (e.dead || e.duel || e._kdHid) continue; if (onlyPlayers && !(e.d && e.d.pvp)) continue; if (Math.hypot(e.x - x, e.y - y) < r + (e.r || 12)) R.push(e); } return R; }
  function nearestVisibleFoe(p, rng) { let b = null, bd = rng; for (const e of enemies) { if (e.dead || e._kdHid || !e.d.pvp || e.duel) continue; const d = dist(p, e); if (d < bd) { bd = d; b = e; } } return b; }
  function rangeOf(p, sk) { const s = p.stats; if (sk.rng === 'melee') return s.range + 14; return sk.rng || s.range + 40; }
  function pickTarget(p, sk) {
    const rng = rangeOf(p, sk);
    if (typeof M !== 'undefined' && M && M.pvp) { const f = nearestVisibleFoe(p, Math.max(rng + 60, 520)); if (f) return f; }
    let t = p.target && !p.target.dead && !p.target._kdHid ? p.target : null; if (!t || dist(p, t) > rng + 200) t = nearestEnemy(Math.max(rng + 60, p.stats.range + 60)) || t; return t;
  }
  function proj(kind, t, spd, onHit, o) { const p = P(); PR.push(Object.assign({ kind, x: p.x + p.face * 10, y: p.y - 26, t, spd, onHit, life: 2.5, trail: [] }, o || {})); }
  const hy = t => (t.d && t.d.h ? t.d.h * .45 : 24);

  // ---------------- yetenekler ----------------
  const C = {
    wv1(p, t) { playerHit(t, 1.7); for (const e of foesNear(t.x, t.y, 70)) if (e !== t) playerHit(e, .6); FX('slash2', t.x, t.y - 22, 3.4, { add: true }); L.push({ k: 'shock', x: t.x, y: t.y, r: 70, t0: gameTime, d: .35, c: '#ffd9a0' }); },
    wv2(p, t, sk) { for (const e of foesNear(p.x, p.y, sk.r)) playerHit(e, 1.5, { slow: 2 }); L.push({ k: 'crack', x: p.x, y: p.y, r: sk.r, t0: gameTime, d: 1.1, seed: Math.random() * 99 }); L.push({ k: 'shock', x: p.x, y: p.y, r: sk.r, t0: gameTime, d: .45, c: '#c8a060' });
      FX('rock', p.x, p.y - 12, 3); for (let i = 0; i < 26; i++) { const a = Math.random() * 6.283, r = Math.random() * sk.r; particles.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * .6, vx: Math.cos(a) * 40, vy: rr(-200, -80), life: .6, max: .6, col: Math.random() < .5 ? '#8a6a40' : '#c8a878', s: rr(3, 6) }); } shake(7, .3); },
    wv3(p) { p.buffs.wv3 = { until: gameTime + 12, mods: { defP: .35, regen: .01 }, col: '#ff6040' }; recalc(p); for (const e of enemies) if (!e.dead && !e.d.pvp && dist(p, e) < 220) e.target = p;
      for (let i = 0; i < 3; i++) later(i * .12, () => L.push({ k: 'shock', x: p.x, y: p.y, r: 120 + i * 40, t0: gameTime, d: .5, c: '#ff7050' })); FX('boost', p.x, p.y - 26, 2.4, { add: true }); fl(p.x, p.y - 96, 'SAVAŞ NARASI!', '#ff8060', 16); },
    wp1(p, t) { FX('smoke', p.x, p.y - 8, 1.6); L.push({ k: 'shock', x: p.x, y: p.y, r: 40, t0: gameTime, d: .3, c: '#d8c0a0' }); p._kdDash = { t, until: gameTime + .45, hit: () => { playerHit(t, 1.3, { stun: .8 }); L.push({ k: 'shock', x: t.x, y: t.y, r: 60, t0: gameTime, d: .35, c: '#fff0c0' }); FX('expl', t.x, t.y - 20, 2, { add: true }); shake(5, .2); } }; },
    wp2(p, t) { L.push({ k: 'chain', a: p, b: t, t0: gameTime, d: .45 }); later(.12, () => { if (t.dead) return; t._kdPull = { to: p, until: gameTime + .35 }; playerHit(t, 1.2, { slow: 2.5 }); fl(t.x, t.y - 80, 'Yakalandı!', '#ffd080', 13); }); },
    wp3(p) { p.buffs.wp3 = { until: gameTime + 5, mods: { dmgRed: .45, spdP: .3 }, col: '#c0c8d0' }; for (const id in p.buffs) if (id.indexOf('deb_') === 0) delete p.buffs[id]; p.kdPoison = null; recalc(p); L.push({ k: 'iron', f: p, t0: gameTime, d: 5 }); FX('shield', p.x, p.y - 28, 3); fl(p.x, p.y - 96, 'DEMİR İRADE', '#e0e8f0', 15); },

    mv1(p, t) { proj('fire', t, 520, (tt) => { playerHit(tt, 1.9); for (const e of foesNear(tt.x, tt.y, 70)) if (e !== tt) playerHit(e, .6); FX('expl', tt.x, tt.y - hy(tt), 2.8, { add: true }); L.push({ k: 'shock', x: tt.x, y: tt.y, r: 70, t0: gameTime, d: .35, c: '#ff8030' }); sfx('boom'); }); },
    mv2(p, t, sk) { const x = t.x, y = t.y; L.push({ k: 'tele', x, y, r: sk.r, t0: gameTime, d: .8, c: '#ff7030' }); L.push({ k: 'meteor', x, y, t0: gameTime, d: .8 });
      later(.8, () => { for (const e of foesNear(x, y, sk.r)) { playerHit(e, 1.6); addDot(e, p.stats.atk * .25, 4, '#ff8030', p); } FX('bigexpl', x, y - 30, 4, { add: true }); L.push({ k: 'fire', x, y, r: sk.r * .8, t0: gameTime, d: 4, tick: 0 }); shake(8, .35); sfx('boom'); }); },
    mv3(p) { p.shield = Math.max(p.shield, Math.round(p.stats.maxHp * .3)); p.shieldUntil = gameTime + 10; FX('shield', p.x, p.y - 28, 3.4, { add: true }); L.push({ k: 'bubble', f: p, t0: gameTime, d: 10 }); },
    mp1(p, t) { proj('ice', t, 600, (tt) => { playerHit(tt, 1.5, { slow: 3 }); tt._kdFrost = gameTime + 3; FX('ice', tt.x, tt.y - hy(tt), 2.4, { add: true }); fl(tt.x, tt.y - 80, 'Dondu!', '#bff0ff', 13); sfx('ice2'); }); },
    mp2(p, t) { let last = { x: p.x, y: p.y - 30 }; const hit = new Set(); let cur = t;
      for (let j = 0; j < 3 && cur; j++) { hit.add(cur); L.push({ k: 'bolt', x1: last.x, y1: last.y, x2: cur.x, y2: cur.y - hy(cur), t0: gameTime, d: .35 }); const lock = Math.random() < .35;
        playerHit(cur, j ? .7 : 1.9, { stun: lock ? 1.5 : 0 }); if (lock) fl(cur.x, cur.y - 90, '⚡ KİLİTLENDİ', '#fff27a', 14); FX('thunder', cur.x, cur.y - hy(cur) - 10, 2.6, { add: true });
        last = { x: cur.x, y: cur.y - hy(cur) }; let nx = null, nd = 180; for (const e of enemies) { if (e.dead || hit.has(e) || e._kdHid) continue; const d = dist(cur, e); if (d < nd) { nd = d; nx = e; } } cur = nx; }
      L.push({ k: 'flash', t0: gameTime, d: .15 }); },
    mp3(p, t) { const x = t.x, y = t.y; L.push({ k: 'tele', x, y, r: 60, t0: gameTime, d: .35, c: '#ff4010' }); later(.35, () => { if (!t.dead) { playerHit(t, 3.3); addDot(t, p.stats.atk * .5, 5, '#ff6020', p); } L.push({ k: 'pillar', x, y, t0: gameTime, d: 1.3 }); FX('bigexpl', x, y - 40, 3.4, { add: true }); FX('flam', x, y - 20, 3.6, { add: true }); shake(6, .3); sfx('boom'); }); },

    av1(p) { FX('sparkc', p.x, p.y - 26, 1.6, { add: true }); const tt = pickTarget(p, { rng: 300 }); const base = tt ? Math.atan2(tt.y - hy(tt) - (p.y - 18), tt.x - p.x) : (p.face > 0 ? 0 : Math.PI); if (tt) { p.target = tt; p.face = tt.x < p.x ? -1 : 1; }
      for (let k = 0; k < 5; k++) { const a = base + (k - 2) * .14; projectiles.push({ x: p.x, y: p.y - 18, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600, owner: 'player', src: p, kind: 'arrow', mult: .8, opt: {}, life: .7 }); } },
    av2(p, t, sk) { FX('sparkc', t.x, t.y - 30, 2.4, { add: true }); effects.push({ type: 'ground', x: t.x, y: t.y, r: sk.r, t: 0, delay: .7, dur: .75, m: 2.0, vis: 'arrows' }); effects.push({ type: 'arrowrain', x: t.x, y: t.y, r: sk.r, t: 0, delay: .7, dur: .7 }); },
    av3(p) { p.buffs.av3 = { until: gameTime + 12, mods: { crit: .15, range: 60, asP: .15 }, col: '#ffe08a' }; recalc(p); FX('sparkc', p.x, p.y - 30, 2.6, { add: true }); fl(p.x, p.y - 96, 'KARTAL GÖZÜ', '#ffe08a', 15); },
    ap1(p, t) { proj('arrow', t, 720, (tt) => { playerHit(tt, 1.5, { slow: 2.5 }); L.push({ k: 'pin', f: tt, t0: gameTime, d: 2.5 }); }); },
    ap2(p) { p.buffs.ap2 = { until: gameTime + 5, mods: { spdP: .6, dodge: .25 }, col: '#9fffb0' }; recalc(p); L.push({ k: 'wind', f: p, t0: gameTime, d: 5 }); FX('boost', p.x, p.y - 20, 2.2, { add: true }); },
    ap3(p, t) { L.push({ k: 'charge', f: p, t0: gameTime, d: .4 }); later(.4, () => { if (t.dead) return; const sx = p.x, sy = p.y - 26;
      proj('dragon', t, 900, (tt) => { playerHit(tt, 3.6, { stun: 2 }); L.push({ k: 'shock', x: tt.x, y: tt.y, r: 120, t0: gameTime, d: .5, c: '#ffe070' }); L.push({ k: 'pin', f: tt, t0: gameTime, d: 2, big: 1 }); FX('bigexpl', tt.x, tt.y - 30, 3, { add: true }); fl(tt.x, tt.y - 100, '🐉 KİLİTLENDİ (2 sn)', '#ffe070', 16); shake(9, .4); sfx('boom');
        // yolundakiler
        const ax = tt.x - sx, ay = tt.y - sy, L2 = ax * ax + ay * ay || 1; for (const e of enemies) { if (e.dead || e === tt || e._kdHid) continue; const k = Math.max(0, Math.min(1, ((e.x - sx) * ax + (e.y - sy) * ay) / L2)); if (Math.hypot(e.x - (sx + ax * k), e.y - (sy + ay * k)) < 40) playerHit(e, 1.2); } }); }); },

    sv1(p, t) { playerHit(t, 1); FX('cutx', t.x, t.y - 22, 2.6, { add: true }); later(.15, () => { if (!t.dead) { playerHit(t, 1); FX('cut', t.x, t.y - 26, 2.8, { add: true, flip: true }); sfx('slash'); } }); },
    sv2(p, t, sk) { for (const e of foesNear(p.x, p.y, sk.r)) playerHit(e, 1.5); effects.push({ type: 'spin', x: p.x, y: p.y, t: 0, r: sk.r, dur: .45 }); L.push({ k: 'blades', f: p, t0: gameTime, d: .5, r: sk.r }); },
    sv3(p) { p.buffs.sv3 = { until: gameTime + 10, mods: { lifesteal: .25, crit: .1 }, col: '#ff4060' }; recalc(p); FX('aura', p.x, p.y - 22, 2.6, { add: true }); fl(p.x, p.y - 96, 'KAN EMİCİ', '#ff6080', 15); },
    sp1(p) { p.stealthUntil = gameTime + 6; p.stealthMult = 2.4; p.buffs.sp1 = { until: gameTime + 6, mods: { spdP: .45 } }; recalc(p); for (const e of enemies) if (e.target === p) e.target = null; p.target = null; p.chase = false;
      FX('smoke', p.x, p.y - 20, 3.2); for (let i = 0; i < 20; i++) particles.push({ x: p.x + rr(-20, 20), y: p.y - rr(0, 40), vx: rr(-60, 60), vy: rr(-60, 0), life: .7, max: .7, col: '#4a3a5a', s: rr(4, 8) }); fl(p.x, p.y - 96, 'GÖRÜNMEZ', '#c8b0ff', 15); },
    sp2(p, t) { let m = 2.2; if (t.hp / t.maxHp < .3) { m *= 2; fl(t.x, t.y - 100, 'İNFAZ!', '#ff3040', 18); } playerHit(t, m, { critB: .4 }); FX('claw', t.x, t.y - 24, 3.4, { add: true }); L.push({ k: 'shock', x: t.x, y: t.y, r: 50, t0: gameTime, d: .3, c: '#ff3050' }); shake(4, .15); },
    sp3(p, t) { const a = Math.atan2(t.y - p.y, t.x - p.x), nx = t.x + Math.cos(a) * 34, ny = t.y + Math.sin(a) * 20; FX('smoke', p.x, p.y - 20, 2.4);
      if (!blocked(nx, ny, 8)) { p.x = nx; p.y = ny; } p.face = t.x < p.x ? -1 : 1; FX('smoke', p.x, p.y - 20, 2.4); playerHit(t, .6, { slow: 2 }); p.buffs.sp3 = { until: gameTime + 2.5, mods: { crit: .6 } }; recalc(p); },

    pv1(p, t, sk) { for (const e of foesNear(t.x, t.y, sk.r)) playerHit(e, .85); (window.kdZones || []).push({ k: 'pdmg', x: t.x, y: t.y, r: sk.r, t0: gameTime, until: gameTime + .9, tick: 0 }); FX('sparkc', t.x, t.y - 20, 3, { add: true }); },
    pv2(p, t, sk) { heal(p, sk.r, .22, .10); (window.kdZones || []).push({ k: 'pheal', x: p.x, y: p.y, r: sk.r, t0: gameTime, until: gameTime + 1.4, tick: 0 }); },
    pv3(p, t, sk) { for (const a of partyAllies(p, sk.r)) { if (a === p) p.buffs.p3 = { until: gameTime + 15, mods: { hpP: .2, defP: .3 }, col: '#ffe08a' }; else { if (!a._bl0) a._bl0 = { def: a.def, maxHp: a.maxHp }; a.def = a._bl0.def * 1.3; a.maxHp = Math.round(a._bl0.maxHp * 1.2); a._blUntil = gameTime + 15; } FX('boost', a.x, a.y - 26, 1.8, { add: true }); }
      recalc(p); (window.kdZones || []).push({ k: 'pbless', x: p.x, y: p.y, r: sk.r, t0: gameTime, until: gameTime + 1.4, tick: 0 }); fl(p.x, p.y - 96, 'KUTSAMA', '#ffe08a', 15); },
    pp1(p, t, sk) { L.push({ k: 'pzone', f: p, r: sk.r, t0: gameTime, d: 6, tick: 0 }); fl(p.x, p.y - 96, 'ZEHİR ALANI', '#d090ff', 15); },
    pp2(p, t, sk) { for (const a of partyAllies(p, sk.r)) { if (a === p) { for (const id in p.buffs) if (id.indexOf('deb_') === 0) delete p.buffs[id]; p.kdPoison = null; p.dots = []; p.kdImmune = gameTime + 3; p._kdSlowUntil = 0; healPlayer(p.stats.maxHp * .1); } else { a.kdPoison = null; a.hp = Math.min(a.maxHp, a.hp + a.maxHp * .1); } FX('water', a.x, a.y - 20, 2, { add: true }); }
      recalc(p); (window.kdZones || []).push({ k: 'pcleanse', x: p.x, y: p.y, r: sk.r, t0: gameTime, until: gameTime + 1.4, tick: 0 }); fl(p.x, p.y - 96, 'ARINMA', '#9fe0ff', 15); },
    pp3(p, t, sk) { heal(p, sk.r, .35, .15); (window.kdZones || []).push({ k: 'pheal', x: p.x, y: p.y, r: sk.r, t0: gameTime, until: gameTime + 1.6, tick: 0 }); fl(p.x, p.y - 96, 'TOPLU ŞİFA', '#9fffb0', 16); },
  };
  function heal(p, r, now, hot) { for (const a of partyAllies(p, r)) { if (a === p) { healPlayer(p.stats.maxHp * now); p.hots.push({ per: p.stats.maxHp * hot / 5, until: gameTime + 5, next: gameTime + 1 }); } else { a.hp = Math.min(a.maxHp, a.hp + a.maxHp * (now + hot)); fl(a.x, a.y - 70, '+' + Math.round(a.maxHp * now), '#7dff9a', 12); } FX('aura', a.x, a.y - 20, 2.6, { add: true }); } }

  // ---------------- OTO savaş kararları ----------------
  window.kdAutoGo = function (sk, p, t, d, hpF) {
    const has = id => p.buffs[id] && p.buffs[id].until > gameTime;
    switch (sk.auto) {
      case 'atk': return d < rangeOf(p, sk) - 10;
      case 'aoe': return d < (sk.r || 110) * .8;
      case 'buff': return d < 280 && !has(sk.id === 'pv3' ? 'p3' : sk.id);
      case 'self': return hpF < .55 && d < 300;
      case 'heal': return hpF < .6 || bots.some(b => b.party && b.alive && b.hp < b.maxHp * .5 && dist(b, p) < (sk.r || 380));
      case 'cure': return !!p.kdPoison || Object.keys(p.buffs).some(k => k.indexOf('deb_') === 0);
      case 'pzone': return M && M.pvp && foesNear(p.x, p.y, (sk.r || 200) * .8, true).length > 0;
      default: return false;
    }
  };

  // ---------------- ses efektleri (WebAudio, dosyasız) ----------------
  let AC = null, sfxOn = true; try { sfxOn = localStorage.getItem('kdSfx') !== '0'; } catch (e) { }
  const unlock = () => { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } };
  addEventListener('pointerdown', unlock, { once: false, passive: true }); addEventListener('keydown', unlock, { passive: true });
  function tone(f0, f1, dur, type, vol, delay) { const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + .02); }
  function noise(dur, fq, q, vol, delay, sweep) { const t = AC.currentTime + (delay || 0), n = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const s = AC.createBufferSource(); s.buffer = b; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(fq, t); if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur); f.Q.value = q || 1; const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); }
  const SND = {
    slash: () => noise(.12, 2400, 2, .25, 0, 900), smash: () => { tone(120, 40, .35, 'sine', .5); noise(.3, 300, 1, .35); }, shout: () => { tone(180, 120, .4, 'sawtooth', .12); tone(240, 160, .4, 'square', .06); },
    charge: () => { noise(.25, 600, 1, .2, 0, 2000); tone(90, 50, .25, 'sine', .3, .2); }, chain: () => { for (let i = 0; i < 4; i++) tone(1800 - i * 200, 1500, .05, 'square', .06, i * .04); }, iron: () => { tone(220, 220, .5, 'triangle', .15); tone(330, 330, .5, 'triangle', .08); },
    fire: () => noise(.3, 800, .8, .25, 0, 300), boom: () => { tone(100, 30, .45, 'sine', .45); noise(.4, 400, .7, .35, 0, 120); }, meteor: () => noise(.8, 3000, 1, .15, 0, 200), shield: () => tone(400, 900, .35, 'sine', .15),
    ice: () => { tone(1400, 2400, .18, 'triangle', .12); noise(.2, 5000, 3, .1); }, ice2: () => { noise(.25, 6000, 4, .15); tone(2000, 1200, .2, 'sine', .08); }, thunder: () => { noise(.08, 4000, 1, .4); noise(.5, 900, .6, .3, .05, 200); },
    inferno: () => noise(.6, 500, .6, .3, 0, 1500), bow: () => { tone(320, 160, .12, 'triangle', .18); noise(.08, 3000, 2, .1); }, volley: () => { for (let i = 0; i < 5; i++) noise(.08, 3500, 2, .08, i * .05); }, wind: () => noise(.6, 1200, .5, .12, 0, 3000),
    dragon: () => { tone(200, 900, .4, 'sawtooth', .1); noise(.4, 1500, .6, .2, .1, 4000); }, whirl: () => noise(.4, 1800, 2, .2, 0, 600), stealth: () => noise(.5, 2000, .5, .12, 0, 300), assassin: () => { noise(.1, 3000, 2, .3); tone(800, 200, .2, 'square', .08); },
    blink: () => tone(1200, 300, .2, 'sine', .15), buff: () => { tone(500, 800, .2, 'sine', .12); tone(750, 1100, .2, 'sine', .08, .08); }, holy: () => { tone(880, 880, .4, 'sine', .1); tone(1320, 1320, .4, 'sine', .06); },
    heal: () => { [660, 880, 1100].forEach((f, i) => tone(f, f, .3, 'sine', .1, i * .07)); }, heal2: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .4, 'sine', .1, i * .07)); }, bless: () => { tone(600, 1200, .5, 'triangle', .1); },
    poison: () => { for (let i = 0; i < 6; i++) tone(200 + Math.random() * 200, 100, .12, 'sine', .08, i * .06); }, cleanse: () => noise(.4, 2500, 1, .15, 0, 6000), switch: () => tone(700, 1000, .08, 'square', .06),
  };
  function sfx(n) { if (!sfxOn || !SND[n]) return; if (!AC) return; try { if (AC.state === 'suspended') AC.resume(); SND[n](); } catch (e) { } }
  window.kdSfx = sfx; window.kdSfxToggle = () => { sfxOn = !sfxOn; try { localStorage.setItem('kdSfx', sfxOn ? '1' : '0'); } catch (e) { } return sfxOn; };

  // ---------------- her kare ----------------
  function tick(dt) {
    const p = P(); if (!p) return;
    for (let i = SCH.length - 1; i >= 0; i--) if (gameTime >= SCH[i].at) { const f = SCH[i].fn; SCH.splice(i, 1); try { f(); } catch (e) { } }
    // hücum
    const d = p._kdDash; if (d) { const t = d.t; if (!t || t.dead || gameTime > d.until) p._kdDash = null; else { const dd = dist(p, t), want = (t.r || 12) + 16; if (dd <= want + 2) { p._kdDash = null; d.hit(); } else { const st = Math.min(dd - want, 1500 * dt); moveEnt(p, (t.x - p.x) / dd * st, (t.y - p.y) / dd * st); particles.push({ x: p.x + rr(-6, 6), y: p.y - rr(0, 8), vx: 0, vy: -20, life: .35, max: .35, col: '#d8c0a0', s: rr(3, 6) }); } } }
    // kanca çekişi
    for (const e of enemies) { const pl = e._kdPull; if (!pl) continue; if (e.dead || gameTime > pl.until) { e._kdPull = null; continue; } const dd = dist(e, pl.to); if (dd > 44) { const st = Math.min(dd - 40, 1100 * dt); moveEnt(e, (pl.to.x - e.x) / dd * st, (pl.to.y - e.y) / dd * st); } }
    // mermiler
    for (let i = PR.length - 1; i >= 0; i--) { const b = PR[i]; b.life -= dt; const t = b.t; if (!t || t.dead || b.life <= 0) { PR.splice(i, 1); continue; }
      const tx = t.x, ty = t.y - hy(t), dx = tx - b.x, dy = ty - b.y, dd = Math.hypot(dx, dy); b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > (b.kind === 'dragon' ? 14 : 8)) b.trail.shift();
      if (dd < 18) { PR.splice(i, 1); try { b.onHit(t); } catch (e) { } continue; } const st = Math.min(dd, b.spd * dt); b.x += dx / dd * st; b.y += dy / dd * st; b.a = Math.atan2(dy, dx);
      if (b.kind === 'fire' && Math.random() < .7) particles.push({ x: b.x, y: b.y, vx: rr(-20, 20), vy: rr(-30, 10), life: .35, max: .35, col: Math.random() < .5 ? '#ffb030' : '#ff5010', s: rr(3, 5) });
      if (b.kind === 'ice' && Math.random() < .5) particles.push({ x: b.x, y: b.y, vx: rr(-15, 15), vy: rr(-15, 15), life: .35, max: .35, col: '#dff6ff', s: 2 }); }
    // alanlar
    for (let i = L.length - 1; i >= 0; i--) { const f = L[i]; if (gameTime - f.t0 > f.d) { L.splice(i, 1); continue; }
      if (f.k === 'fire' && gameTime >= f.tick) { f.tick = gameTime + 1; for (const e of foesNear(f.x, f.y, f.r)) addDot(e, p.stats.atk * .2, 1.2, '#ff8030', p); if (Math.random() < .9) FX('flam', f.x + rr(-f.r * .6, f.r * .6), f.y + rr(-f.r * .3, f.r * .3) - 14, 2, { add: true }); }
      if (f.k === 'pzone' && gameTime >= f.tick) { f.tick = gameTime + .5; const c = f.f; for (const e of foesNear(c.x, c.y, f.r, true)) { if (window.kdDebuff) kdDebuff(e, { atk: .6, def: .75, col: '#b050ff' }, 2); addDot(e, p.stats.atk * .3, 1.5, '#c070ff', p); if (!e._kdPzMsg || gameTime - e._kdPzMsg > 3) { e._kdPzMsg = gameTime; fl(e.x, e.y - 84, 'Saldırı -%40 Savunma -%25', '#d090ff', 12); } } } }
    if (shakeT > 0) shakeT -= dt; else shakeA = 0;
    // silah değişti → set yeniden
    if (p.eq && p.eq.weapon !== p._kdW) { buildAct(p); try { buildBar(); } catch (e) { } updSetBtn(); }
  }

  // ---------------- çizim ----------------
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; };
  function ground() {
    const t = gameTime;
    for (const f of L) { const age = t - f.t0, k = age / f.d; ctx.save();
      if (f.k === 'crack') { ctx.strokeStyle = 'rgba(40,24,10,' + (1 - k) + ')'; ctx.lineWidth = 3; let s = f.seed; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + rnd() * .4; ctx.beginPath(); ctx.moveTo(f.x, f.y); let x = f.x, y = f.y; for (let j = 1; j <= 4; j++) { const rr2 = f.r * j / 4 * Math.min(1, age * 8); x = f.x + Math.cos(a + (rnd() - .5) * .5) * rr2; y = f.y + Math.sin(a + (rnd() - .5) * .5) * rr2 * .55; ctx.lineTo(x, y); } ctx.stroke(); }
        ctx.fillStyle = 'rgba(120,90,50,' + (.35 * (1 - k)) + ')'; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * .55, 0, 0, 7); ctx.fill(); }
      else if (f.k === 'shock') { const r = f.r * (.3 + .7 * k); ctx.strokeStyle = rgba(f.c, 1 - k); ctx.lineWidth = 4 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * .55, 0, 0, 7); ctx.stroke(); }
      else if (f.k === 'tele') { const kk = Math.min(1, k); ctx.fillStyle = rgba(f.c, .15 + kk * .25); ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * .55, 0, 0, 7); ctx.fill(); ctx.strokeStyle = rgba(f.c, .9); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * kk, f.r * .55 * kk, 0, 0, 7); ctx.stroke(); }
      else if (f.k === 'fire') { const fl2 = .2 + .06 * Math.sin(t * 12); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, 'rgba(255,170,40,' + (fl2 + .15) * (1 - Math.max(0, k - .8) * 5) + ')'); g.addColorStop(1, 'rgba(255,60,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * .55, 0, 0, 7); ctx.fill(); }
      else if (f.k === 'pzone') { const c = f.f, r = f.r, fade = Math.min(1, age / .3) * Math.min(1, (f.d - age) / .5), rx = r * Math.min(1, age / .35), ry = rx * .55;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rx); g.addColorStop(0, 'rgba(120,30,170,' + .5 * fade + ')'); g.addColorStop(.7, 'rgba(160,60,220,' + .3 * fade + ')'); g.addColorStop(1, 'rgba(190,90,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(220,140,255,' + .85 * fade + ')'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t * 50; ctx.beginPath(); ctx.ellipse(c.x, c.y, rx * .98, ry * .98, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < 16; i++) { const ph = (t * .8 + i / 16) % 1, a = i * 2.4 + t * .6, rr2 = (.3 + (i % 5) * .15); ctx.fillStyle = 'rgba(200,120,255,' + (1 - ph) * .8 * fade + ')'; ctx.fillRect(c.x + Math.cos(a) * rx * rr2 - 2, c.y + Math.sin(a) * ry * rr2 - ph * 40 - 2, 4, 4); }
        for (let i = 0; i < 6; i++) { const a = -t * 1.2 + i * 1.047; ctx.fillStyle = 'rgba(90,20,130,' + .35 * fade + ')'; ctx.beginPath(); ctx.ellipse(c.x + Math.cos(a) * rx * .6, c.y + Math.sin(a) * ry * .6, 22, 12, 0, 0, 7); ctx.fill(); } }
      ctx.restore(); }
  }
  function top() {
    const t = gameTime;
    for (const f of L) { const age = t - f.t0, k = age / f.d; ctx.save();
      if (f.k === 'bolt') { ctx.globalCompositeOperation = 'lighter'; for (let pass = 0; pass < 2; pass++) { ctx.strokeStyle = pass ? 'rgba(255,255,255,' + (1 - k) + ')' : 'rgba(140,190,255,' + (1 - k) * .7 + ')'; ctx.lineWidth = pass ? 2 : 7; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); const n = 7; for (let i = 1; i < n; i++) { const q = i / n; ctx.lineTo(f.x1 + (f.x2 - f.x1) * q + rr(-14, 14), f.y1 + (f.y2 - f.y1) * q + rr(-14, 14)); } ctx.lineTo(f.x2, f.y2); ctx.stroke(); } }
      else if (f.k === 'chain') { const a = f.a, b = f.b, q = Math.min(1, age / .12), ex = a.x + (b.x - a.x) * q, ey = a.y - 24 + (b.y - 24 - a.y + 24) * q; ctx.strokeStyle = 'rgba(200,200,210,' + (1 - Math.max(0, k - .6) * 2.5) + ')'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(a.x, a.y - 24); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#e0e0e8'; ctx.fillRect(ex - 4, ey - 4, 8, 8); }
      else if (f.k === 'meteor') { const q = Math.min(1, k), x = f.x + 160 * (1 - q), y = f.y - 420 * (1 - q); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, 34); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(.5, 'rgba(255,120,30,.8)'); g.addColorStop(1, 'rgba(255,40,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fill(); for (let i = 0; i < 3; i++) particles.push({ x: x + rr(-10, 10), y: y + rr(-10, 10), vx: 60, vy: -120, life: .4, max: .4, col: '#ff9030', s: rr(3, 6) }); }
      else if (f.k === 'pillar') { ctx.globalCompositeOperation = 'lighter'; const h = 260 * Math.min(1, age / .2), w = 46 * (1 - k * .6), g = ctx.createLinearGradient(0, f.y - h, 0, f.y); g.addColorStop(0, 'rgba(255,90,20,0)'); g.addColorStop(.5, 'rgba(255,140,40,' + .7 * (1 - k) + ')'); g.addColorStop(1, 'rgba(255,230,160,' + .9 * (1 - k) + ')'); ctx.fillStyle = g; ctx.fillRect(f.x - w / 2, f.y - h, w, h); if (Math.random() < .8) FX('flam', f.x + rr(-14, 14), f.y - rr(10, 120), 2.2, { add: true }); }
      else if (f.k === 'flash') { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(220,235,255,' + (.35 * (1 - k)) + ')'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
      else if (f.k === 'iron' || f.k === 'bubble' || f.k === 'wind') { const c = f.f; if (!c || c.dead) { ctx.restore(); continue; } const pu = .5 + .5 * Math.sin(t * 6);
        if (f.k === 'iron') { ctx.strokeStyle = 'rgba(210,220,235,' + (.5 + .3 * pu) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(c.x, c.y - 24, 24, 34, 0, 0, 7); ctx.stroke(); for (let i = 0; i < 6; i++) { const a = t * 2 + i * 1.047; ctx.fillStyle = '#e8eef8'; ctx.fillRect(c.x + Math.cos(a) * 26 - 2, c.y - 24 + Math.sin(a) * 34 - 2, 4, 4); } }
        else if (f.k === 'bubble') { if (!(c.shield > 0)) { ctx.restore(); continue; } ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(120,180,255,' + (.12 + .06 * pu) + ')'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 24, 28, 38, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(160,210,255,.8)'; ctx.lineWidth = 2; ctx.stroke(); }
        else { if (c.moving && Math.random() < .6) particles.push({ x: c.x + rr(-10, 10), y: c.y - rr(4, 30), vx: -c.face * 90, vy: rr(-10, 10), life: .35, max: .35, col: '#c8ffd8', s: 2 }); } }
      else if (f.k === 'pin') { const c = f.f; if (!c || c.dead) { ctx.restore(); continue; } const r = f.big ? 30 : 22; ctx.strokeStyle = f.big ? 'rgba(255,224,112,.9)' : 'rgba(200,230,255,.8)'; ctx.lineWidth = 3; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(c.x, c.y, r - i * 8 + Math.sin(t * 8) * 2, (r - i * 8) * .45, t * (i ? -2 : 2), 0, 7); ctx.stroke(); } }
      else if (f.k === 'charge') { const c = f.f; ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(c.x, c.y - 26, 0, c.x, c.y - 26, 40 * k + 8); g.addColorStop(0, 'rgba(255,240,170,.9)'); g.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y - 26, 40 * k + 8, 0, 7); ctx.fill(); }
      else if (f.k === 'blades') { const c = f.f; for (let i = 0; i < 6; i++) { const a = t * 18 + i * 1.047, x = c.x + Math.cos(a) * f.r * .7, y = c.y - 10 + Math.sin(a) * f.r * .35; ctx.save(); ctx.translate(x, y); ctx.rotate(a + 1.57); ctx.fillStyle = 'rgba(230,235,245,' + (1 - k) + ')'; ctx.fillRect(-2, -10, 4, 20); ctx.restore(); } }
      ctx.restore(); }
    // mermiler
    for (const b of PR) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (b.kind === 'fire') { for (let i = 0; i < b.trail.length; i++) { const q = b.trail[i], s = 4 + i; ctx.fillStyle = 'rgba(255,' + (90 + i * 15) + ',30,' + (i / b.trail.length) * .6 + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, s, 0, 7); ctx.fill(); } const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 18); g.addColorStop(0, '#fff6c0'); g.addColorStop(.4, 'rgba(255,150,30,.95)'); g.addColorStop(1, 'rgba(255,40,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 18, 0, 7); ctx.fill(); }
      else if (b.kind === 'ice') { for (let i = 0; i < b.trail.length; i++) { const q = b.trail[i]; ctx.fillStyle = 'rgba(180,230,255,' + (i / b.trail.length) * .5 + ')'; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); } ctx.translate(b.x, b.y); ctx.rotate(b.a || 0); ctx.fillStyle = 'rgba(200,240,255,.95)'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -6); ctx.lineTo(-6, 0); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill(); }
      else if (b.kind === 'arrow') { ctx.globalCompositeOperation = 'source-over'; ctx.translate(b.x, b.y); ctx.rotate(b.a || 0); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-14, -1.5, 22, 3); ctx.fillStyle = '#c0c8d0'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(5, -4); ctx.lineTo(5, 4); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(-16, -3, 4, 6); }
      else if (b.kind === 'dragon') { for (let i = 0; i < b.trail.length; i++) { const q = b.trail[i], s = 3 + i * 1.6; ctx.fillStyle = 'rgba(255,' + (180 + i * 5) + ',60,' + (i / b.trail.length) * .55 + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, s, 0, 7); ctx.fill(); }
        ctx.translate(b.x, b.y); ctx.rotate(b.a || 0); const g = ctx.createLinearGradient(-60, 0, 30, 0); g.addColorStop(0, 'rgba(255,200,60,0)'); g.addColorStop(1, 'rgba(255,250,200,1)'); ctx.fillStyle = g; ctx.fillRect(-60, -6, 80, 12); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.moveTo(36, 0); ctx.lineTo(16, -14); ctx.lineTo(16, 14); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,120,30,.9)'; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-64, -12); ctx.lineTo(-58, 0); ctx.lineTo(-64, 12); ctx.closePath(); ctx.fill(); }
      ctx.restore(); }
    // donmuş / kilitlenmiş hedefler
    for (const e of enemies) { if (e.dead || e._kdHid) continue; ctx.save();
      if (e._kdFrost > t || (e.slowUntil > t && e._kdFrost > t - .1)) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(150,220,255,.25)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - (e.d.h || 40) * .45, 20, (e.d.h || 40) * .55, 0, 0, 7); ctx.fill(); if (Math.random() < .3) particles.push({ x: e.x + rr(-12, 12), y: e.y - rr(0, 40), vx: 0, vy: -20, life: .5, max: .5, col: '#e8f8ff', s: 2 }); }
      if (e.stunUntil > t) { const y = e.y - (e.d.h || 40) - 18; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.094; ctx.fillStyle = '#fff27a'; ctx.font = '700 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', e.x + Math.cos(a) * 16, y + Math.sin(a) * 5); } }
      ctx.restore(); }
  }
  if (typeof drawExtrasGround === 'function') { const _g = drawExtrasGround; drawExtrasGround = function () { _g.apply(this, arguments); try { ground(); } catch (e) { } }; }
  if (typeof drawExtrasTop === 'function') { const _t = drawExtrasTop; drawExtrasTop = function () { _t.apply(this, arguments); try { top(); } catch (e) { } }; }
  // ekran sarsıntısı
  if (typeof updateCamera === 'function') { const _uc = updateCamera; updateCamera = function () { _uc.apply(this, arguments); if (shakeA > 0 && shakeT > 0) { camX += rr(-shakeA, shakeA) * (shakeT / .4); camY += rr(-shakeA, shakeA) * (shakeT / .4); } }; }

  // ---------------- sınıf dengesi ----------------
  // sınıf dengesi: savas.js recalc İÇİNDE (sınırlamalardan önce) çağrılır
  window.kdClassMod = function (p, s) {
    if (p.cls === 'warrior') { s.maxHp *= 1.18; s.def *= 1.2; s.atk *= .9; }
    else if (p.cls === 'mage') { s.atk *= 1.12; s.maxHp *= .9; }
    else if (p.cls === 'priest') { s.atk *= .85; s.maxHp *= 1.05; }
    else if (p.cls === 'archer') { if (dag(p)) { s.maxHp *= .8; s.def *= .6; s.spd *= 1.18; s.crit += .1; s.critDmg += .6; } else s.spd *= 1.12; }
  };
  // okçu sinerjisi: yakındaki her okçu (parti / müttefik) +%8, en çok +%24
  if (typeof playerHit === 'function') {
    const _ph = playerHit;
    playerHit = function (t, mult, o) {
      try { const p = P(); if (p && p.cls === 'archer' && !dag(p)) { let n = 0; for (const b of bots) if (b.alive && b.cls === 'archer' && (b.party || b.faction === 'ally') && dist(b, p) < 420) n++; if (n) mult *= 1 + .08 * Math.min(3, n); } } catch (e) { }
      return _ph.call(this, t, mult, o);
    };
  }

  // ---------------- arayüz: set düğmesi + yetenek paneli ----------------
  let setBtn = null;
  function updSetBtn() { const p = P(); if (!setBtn || !p) return; const pvp = p.kdSet === 'pvp'; setBtn.classList.toggle('pvp', pvp); setBtn.querySelector('.lab').textContent = pvp ? 'PvP Seti' : 'PvE Seti'; setBtn.querySelector('img').src = 'na/' + (pvp ? 'i_sword' : 'ii_Grass') + '.png'; }
  function mkSetBtn() {
    const root = document.getElementById('h2'); if (!root || setBtn) return;
    setBtn = document.createElement('div'); setBtn.id = 'kdSet'; setBtn.className = 'h2p h2b'; setBtn.innerHTML = '<img class="px" src="na/i_sword.png" alt=""><span class="lab">PvP</span><span class="kk">X</span>';
    setBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggleSet(); }); root.appendChild(setBtn); updSetBtn(); try { kdLayout(); } catch (e) { }
  }
  addEventListener('keydown', e => { if (typeof running === 'undefined' || !running || !P()) return; const ae = document.activeElement; if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return; if (!e.repeat && (e.key || '').toLowerCase() === 'x') toggleSet(); });
  function renderSk() {
    const p = P(); if (!p) return; const list = SKILLS[p.cls] || [], dg = dag(p);
    const card = sk => { const ok = sk.lv <= p.lvl, w = wpnOK(p, sk), on = p.act.includes(sk.id);
      return '<div class="ks' + (ok && w ? '' : ' lock') + (on ? ' on' : '') + '"><img class="skimg" src="na/sk_' + sk.id + '.png" alt=""><div class="kb"><div class="kn">' + sk.n + ' <span>' + (ok ? sk.mp + ' mana • ' + sk.cd + ' sn' : '🔒 Sv ' + sk.lv) + (sk.wpn ? ' • ' + (sk.wpn === 'dag' ? 'Hançer' : 'Yay') : '') + '</span></div><div class="kd">' + sk.d + '</div></div></div>'; };
    const sec = (set, title) => { let L2 = list.filter(s => s.set === set); if (p.cls === 'archer') L2 = L2.slice().sort((a, b) => (wpnOK(p, b) - wpnOK(p, a)) || a.lv - b.lv);
      return '<div class="kset' + (p.kdSet === set ? ' on' : '') + '"><div class="ksh"><b>' + title + '</b>' + (p.kdSet === set ? '<span class="kact">Kullanımda</span>' : '<button data-set="' + set + '">Bu seti kullan</button>') + '</div>' + L2.map(card).join('') + '</div>'; };
    document.getElementById('skills').innerHTML = '<button class="x" data-close="skills">✕</button><h2>Yetenekler — ' + CLASSES[p.cls].name + (p.cls === 'archer' ? (dg ? ' (Hançer: Suikastçı)' : ' (Yay: Okçu)') : '') + '</h2>' +
      '<div class="mut" style="font-size:12px">Her sınıfta 3 PvE (kasılma) + 3 PvP yeteneği. Setler arasında istediğin an geç: sağdaki <b>PvE/PvP</b> düğmesi ya da <b>X</b>. PvP bölgesine girince PvP seti açılır.' + (p.cls === 'archer' ? ' <b>Yay takılıyken okçu, hançer takılıyken suikastçı yetenekleri</b> kullanılır.' : '') + '</div>' +
      sec('pve', '🌿 PvE — Kasılma') + sec('pvp', '⚔ PvP — Oyuncu Savaşı');
  }

  // ---------------- kurulum (son.js çağırır, sinif.js'ten sonra) ----------------
  window.kdBeceriInit = function () {
    if (window.__kdBeceri) return; window.__kdBeceri = true;
    if (typeof useSkill === 'function') {
      const _us = useSkill;
      useSkill = function (slot) {
        const p = P(); if (!p || p.dead) return; const id = p.act[slot], sk = id && SKILL_BY_ID[id];
        if (!sk || sk.k !== 'x') return _us.apply(this, arguments);
        if (sk.lv > p.lvl) { fl(p.x, p.y - 80, 'Sv ' + sk.lv + '\'de açılır', '#cccccc', 12); return; }
        if (!wpnOK(p, sk)) { fl(p.x, p.y - 80, sk.wpn === 'dag' ? 'Hançer gerekli' : 'Yay gerekli', '#ffb080', 13); return; }
        if ((p.cds[id] || 0) > gameTime) return; if (p.mp < sk.mp) { fl(p.x, p.y - 80, 'Mana yetersiz', '#7fb0ff', 12); return; }
        if (window.kdTownActive && kdTownActive() && window.kdTown) kdTown(); // ışınlanmayı iptal eder
        let t = null;
        if (sk.off) { t = pickTarget(p, sk); if (!t) { fl(p.x, p.y - 80, 'Hedef yok', '#cccccc', 12); return; } const rng = rangeOf(p, sk); if (dist(p, t) - (t.r || 12) > rng) { p.target = t; p.chase = true; p._qSkill = { slot, id, until: gameTime + 4 }; fl(p.x, p.y - 80, 'Koşuyor → ' + sk.n, '#cccccc', 12); return; } p.target = t; p.face = t.x < p.x ? -1 : 1; }
        p.mp -= sk.mp; p.cds[id] = gameTime + sk.cd; p.atkAnim = .22; p.alt = !p.alt; p.castK = sk.r ? 'aoe' : 'strike'; p.castT = gameTime;
        try { C[id](p, t, sk); } catch (e) { console.error(e); } sfx(sk.snd);
      };
    }
    // kurulum noktaları: oyun başı, seviye, harita
    if (typeof startGame === 'function') { const _sg = startGame; startGame = function () { const r = _sg.apply(this, arguments); try { const p = P(); p.kdSet = null; buildAct(p); recalc(p); buildBar(); mkSetBtn(); updSetBtn(); } catch (e) { } return r; }; window.startGame = startGame; }
    if (typeof gainXp === 'function') { const _gx = gainXp; gainXp = function () { const p = P(), l0 = p ? p.lvl : 0; const r = _gx.apply(this, arguments); try { if (p && p.lvl !== l0) { buildAct(p); buildBar(); } } catch (e) { } return r; }; }
    if (typeof enterMap === 'function') { const _em = enterMap; enterMap = function () { const r = _em.apply(this, arguments); try { const p = P(); p.kdSet = M.pvp ? 'pvp' : 'pve'; buildAct(p); buildBar(); updSetBtn(); } catch (e) { } return r; }; }
    if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try { tick(dt); } catch (e) { } }; }
    renderSkills = renderSk;
    const sw = document.getElementById('skills'), sw2 = sw.cloneNode(false); sw.parentNode.replaceChild(sw2, sw);
    sw2.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.close) { sw2.classList.add('hidden'); return; } if (b.dataset.set) { toggleSet(b.dataset.set); renderSk(); } });
    mkSetBtn();
  };
  window.kdSkillCast = C;
  window.kdSkillFxCount = () => L.length + PR.length + SCH.length;
})();
