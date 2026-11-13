'use strict';
// =====================================================================
//  SINIFLAR v2 (Sürüm 46)
//  • Okçu + Suikastçı birleşti → "Avcı": YAY takınca uzaktan ok atar,
//    HANÇER takınca yakın dövüş suikastçısıdır.
//  • Yeni sınıf RAHİP: az vurur, yetenekleri alan etkili.
//      Zehir Rahibi: Zehir Bulutu (düşman saldırısı ↓ + zehir), Lanet (can ve savunma ↓)
//      Şifacı Rahip: Kutsama (partiye can+savunma ↑), Şifa Dalgası, Arınma (zehri bitirir)
//  • Her sınıfta 6 yetenek (Sv 1-5-10-15-22-30'da açılır), 3'ü seçilir; hazır "tarz"lar var.
//  • PvP'de yetenekler kendiliğinden en yakın karşı ırk oyuncusuna atılır.
//  • Seviye 80'e kadar; her seviyede 3 özellik puanı: Güç, Çeviklik, Zeka, Dayanıklılık.
//    Eşyaları giymek için sınıfın ana özelliği gerekir; + bastıkça şart artar.
// =====================================================================
(function () {
  // ---------------- sınıf tanımları ----------------
  delete CLASSES.assassin;
  const AR = CLASSES.archer;
  Object.assign(AR, { name: 'Avcı', icon: '🏹', desc: 'Yay takınca uzaktan ok yağdıran okçu, hançer takınca gölgelerden vuran suikastçı. Silahını seç, tarzını seç.', hp: 108, hpL: 17, def: 3.5, defL: 1, crit: .15, dodge: .07 });
  CLASSES.priest = { name: 'Rahip', icon: '✨', prim: 'int', weapon: 'staff', desc: 'Az vurur ama yetenekleri alan etkilidir. Zehirle düşmanı zayıflatır ya da partisini korur ve iyileştirir.', hp: 112, mp: 160, atk: 9, def: 4, crit: .05, dodge: .03, spd: 145, range: 200, as: 1.2, proj: 'magic', hpL: 17, mpL: 16, atkL: 1.7, defL: 1.1 };
  PRIM_TR.sta = 'Dayanıklılık';
  // Avcı: silaha göre menzil / saldırı tipi (yalnız oyuncu bağlamında)
  window.__kdPC = false;
  const DAG = { Sai: 1, Katana: 1, Ninjaku: 1, Rapier: 1, Whip: 1 };
  const isDagger = p => !!(p && p.eq && p.eq.weapon && DAG[p.eq.weapon.wn]);
  window.kdIsDagger = isDagger;
  const dag = () => window.__kdPC && typeof player !== 'undefined' && player && player.cls === 'archer' && isDagger(player);
  Object.defineProperty(AR, 'proj', { get: () => dag() ? null : 'arrow', configurable: true });
  Object.defineProperty(AR, 'range', { get: () => dag() ? 38 : 255, configurable: true });
  Object.defineProperty(AR, 'as', { get: () => dag() ? .6 : .78, configurable: true });

  // ---------------- yetenekler (6'şar) ----------------
  const B = {}; for (const c in SKILLS) for (const s of SKILLS[c]) B[s.id] = s;
  const L = [1, 5, 10, 15, 22, 30];
  const cp = (id, o) => Object.assign({}, B[id], o || {});
  const pick6 = (arr) => arr.map((s, i) => Object.assign(s, { lv: L[i], pas: false }));
  SKILLS.warrior = pick6([cp('w1'), cp('w2'), cp('w7'), cp('w3'), cp('w8'), cp('w4')]);
  SKILLS.mage = pick6([cp('m1'), cp('m7'), cp('m2'), cp('m8'), cp('m3'), cp('m4')]);
  SKILLS.archer = pick6([cp('a1', { ranged: false, d: 'Yayla: %190 hasarlı keskin ok. Hançerle: %190 hasarlı keskin darbe.' }), cp('a3'), cp('s3', { d: 'Dönerek çevrendeki herkese %150 hasar (hançerle en etkili).' }), cp('s2'),
    cp('a9', { ranged: false, n: 'Zehirli Darbe', d: '%80 hasar ve 6 sn zehir (yay ya da hançer).' }), cp('s4')]);
  SKILLS.priest = pick6([
    { id: 'p1', n: 'Kutsal Işık', ic: '☀️', br: 'atk', mp: 14, cd: 4, k: 'pdmg', m: .8, r: 170, d: 'Hedefin etrafına kutsal ışık (geniş alan): alandaki herkese %80 hasar.' },
    { id: 'p2', n: 'Zehir Bulutu', ic: '☁️', br: 'atk', mp: 22, cd: 9, k: 'ppoison', r: 240, dur: 8, d: 'Geniş zehir bulutu yere çöker ve 8 sn kalır: içindeki ve içine giren düşmanlar zehirlenir, saldırıları %25 azalır.' },
    { id: 'p3', n: 'Kutsama', ic: '🛡️', br: 'def', mp: 25, cd: 16, k: 'pbless', r: 440, dur: 15, d: 'Sen ve yakındaki parti/müttefikler: 15 sn can +%20, savunma +%30.' },
    { id: 'p4', n: 'Lanet', ic: '💀', br: 'atk', mp: 28, cd: 12, k: 'pcurse', r: 220, dur: 10, d: 'Alandaki düşmanların canı ve savunması düşer: savunma -%30 (10 sn) + canının %8\'i kadar hasar.' },
    { id: 'p5', n: 'Şifa Dalgası', ic: '💚', br: 'def', mp: 30, cd: 14, k: 'pheal', r: 440, d: 'Sen ve yakındaki parti/müttefikler: anında %25 can, 6 sn boyunca %15 daha.' },
    { id: 'p6', n: 'Arınma', ic: '💧', br: 'def', mp: 20, cd: 12, k: 'pcleanse', r: 440, d: 'Alan etkili: sende ve partide zehri ve zayıflatmaları yok eder, 4 sn zehre bağışıklık + %10 can.' },
  ]);
  for (const k in SKILL_BY_ID) delete SKILL_BY_ID[k];
  for (const c in SKILLS) for (const s of SKILLS[c]) SKILL_BY_ID[s.id] = s;
  delete SKILLS.assassin;
  const TARZ = {
    warrior: [['Saldırgan', ['w1', 'w2', 'w4']], ['Dayanıklı', ['w7', 'w8', 'w3']]],
    mage: [['Yıkım', ['m1', 'm3', 'm4']], ['Kontrol', ['m7', 'm2', 'm8']]],
    archer: [['Okçu (yay)', ['a1', 'a3', 'a9']], ['Suikastçı (hançer)', ['s2', 's3', 's4']]],
    priest: [['Zehir Rahibi', ['p2', 'p4', 'p1']], ['Şifacı Rahip', ['p3', 'p5', 'p6']]],
  };
  window.KD_TARZ = TARZ;
  // eşya adları / silah çeşitleri: rahip büyücünün eşyalarını, avcı hançer + yay
  for (const sl in BASE) { if (BASE[sl].mage && !BASE[sl].priest) BASE[sl].priest = BASE[sl].mage.slice(); if (BASE[sl].assassin && BASE[sl].archer) BASE[sl].archer = BASE[sl].archer.concat(BASE[sl].assassin); }
  BASE.weapon.priest = ['Kutsal Asa', 'Dua Kitabı', 'Işık Değneği'];
  for (const sl in ICONS) { ICONS[sl].priest = ICONS[sl].mage || '✨'; }
  for (const sl in ENCH_POOL) { }
  if (typeof WVAR !== 'undefined') { WVAR.archer = [['Bow', 'Sai'], ['Bow2', 'Katana', 'Rapier'], ['Bow2', 'Ninjaku']]; WVAR.priest = [['Stick', 'Book'], ['Book', 'Fork'], ['MagicWand', 'Book']]; }
  if (typeof WNAME !== 'undefined') WNAME.Book = 'Dua Kitabı';

  // ---------------- özellik puanları ----------------
  const BASEA = { warrior: { str: 16, dex: 8, int: 5, sta: 14 }, mage: { str: 5, dex: 8, int: 16, sta: 10 }, archer: { str: 8, dex: 16, int: 5, sta: 11 }, priest: { str: 6, dex: 7, int: 15, sta: 13 } };
  window.KD_BASEA = BASEA;
  const PRIM = c => (CLASSES[c] || CLASSES.warrior).prim;
  function statReq(it) { const c = CLASSES[it.cls] ? it.cls : 'warrior', k = PRIM(c), base = BASEA[c][k]; const acc = { ring: 1, ring2: 1, necklace: 1, belt: 1 }[it.slot] ? .75 : 1;
    return { k, v: Math.round((base * .6 + it.lvl * 1.2 + it.grade * 3 + (it.plus || 0) * 2) * acc) }; }
  window.kdStatReq = statReq;
  window.kdStatOk = (p, it) => { if (!p || !p.attr) return true; const r = statReq(it); return (p.attr[r.k] || 0) >= r.v; };
  const STN = { str: 'Güç (STR)', dex: 'Çeviklik (DEX)', int: 'Zeka (INT)', sta: 'Dayanıklılık (HP)' };
  window.KD_STN = STN;
  function ensureAttr(p) {
    if (!p) return;
    if (p.cls === 'assassin') migrateAssassin(p);
    if (!p.attr) { p.attr = Object.assign({}, BASEA[p.cls] || BASEA.warrior); p.attrPts = 3 * (p.lvl - 1);
      // mevcut kuşanılı eşyaların şartını karşılayacak kadar puanı otomatik ana özelliğe dağıt
      const k = PRIM(p.cls); let need = 0; for (const s in p.eq) { const it = p.eq[s]; if (it) need = Math.max(need, statReq(it).v); }
      const add = Math.min(p.attrPts, Math.max(0, need - p.attr[k])); p.attr[k] += add; p.attrPts -= add; }
    if (p.attrPts == null) p.attrPts = 0;
    // yetenekler: seviyeye göre otomatik açılır
    const list = SKILLS[p.cls] || []; p.learned = list.filter(s => s.lv <= p.lvl).map(s => s.id); p.pas = [null, null]; p.sp = 0;
    if (!Array.isArray(p.act) || p.act.length !== 3 || p.act.some(id => id && !list.find(s => s.id === id))) { const t = TARZ[p.cls][0][1]; p.act = t.map(id => p.learned.includes(id) ? id : null); if (!p.act[0]) p.act[0] = list[0].id; }
  }
  function migrateAssassin(p) {
    p.cls = 'archer'; const fix = it => { if (it && it.cls === 'assassin') it.cls = 'archer'; };
    for (const s in p.eq) fix(p.eq[s]); for (const it of p.inv || []) fix(it); p.act = null;
    addChat && setTimeout(() => { try { addChat(null, '🏹 Suikastçı sınıfı Avcı ile birleşti: hançer takınca suikastçı, yay takınca okçu olursun.', '#ffd65a'); } catch (e) { } }, 1500);
  }
  window.kdEnsureAttr = ensureAttr;
  if (typeof SAVE_FIELDS !== 'undefined') SAVE_FIELDS.push('attr', 'attrPts');

  // ---------------- oyun fonksiyonlarına bağlan (tüm dosyalar yüklenince) ----------------
  // bağlantılar tüm dosyalar yüklendikten sonra js/son.js tarafından kurulur (kesin sıra)
  window.kdSinifInit = () => {
    if (window.__kdSinifDone) return; window.__kdSinifDone = true;
    const P = () => typeof player !== 'undefined' && player;
    // oyuncu bağlamı: Avcı'nın silaha göre davranışı
    const ctxWrap = fn => function () { const o = window.__kdPC; window.__kdPC = true; try { return fn.apply(this, arguments); } finally { window.__kdPC = o; } };
    if (typeof basicAttack === 'function') basicAttack = ctxWrap(basicAttack);
    if (typeof recalc === 'function') { const _rc = recalc; recalc = function (p) { if (p === P()) { ensureAttrQuick(p); const o = window.__kdPC; window.__kdPC = true; try { return _rc.apply(this, arguments); } finally { window.__kdPC = o; } } return _rc.apply(this, arguments); }; }
    function ensureAttrQuick(p) { if (!p.attr || p.cls === 'assassin') ensureAttr(p); }
    if (typeof startGame === 'function') { const _sg = startGame; startGame = function () { const r = _sg.apply(this, arguments); try { ensureAttr(P()); recalc(P()); buildBar(); } catch (e) { } return r; }; window.startGame = startGame; }
    // seviye atlayınca +3 özellik puanı + yeni yetenek açılır
    if (typeof gainXp === 'function') { const _gx = gainXp; gainXp = function () { const p = P(), l0 = p ? p.lvl : 0; const r = _gx.apply(this, arguments);
      if (p && p.lvl > l0) { p.attrPts = (p.attrPts || 0) + 3 * (p.lvl - l0); const before = p.learned.length; ensureAttr(p); fl(p.x, p.y - 100, '+' + 3 * (p.lvl - l0) + ' özellik puanı', '#ffd65a', 14);
        const nw = (SKILLS[p.cls] || []).filter(s => s.lv > l0 && s.lv <= p.lvl); for (const s of nw) addChat(null, '🌟 Yeni yetenek açıldı: ' + s.n + ' (K ile tak)', '#9fe0ff'); try { buildBar(); } catch (e) { } }
      return r; }; }
    // kuşanma: özellik şartı
    if (typeof equip === 'function') { const _eq = equip; equip = function (i) { const p = P(), it = p && p.inv[i]; if (it && !kdStatOk(p, it)) { const r = statReq(it); showToast('Özellik puanın yetmiyor', 'Gereken: ' + r.v + ' ' + STN[r.k] + ' (sende ' + (p.attr[r.k] || 0) + ')', 2); return; } return _eq.apply(this, arguments); }; }

    // ---------------- yetenek kullanımı: rahip yetenekleri + PvP otomatik hedef ----------------
    const FX = (k, x, y, s, o) => { if (window.naFx) try { naFx(k, x, y, s, o); } catch (e) { } };
    const ring = (x, y, r, col, fill) => effects.push({ type: 'ring', x, y, t: 0, r0: 10, r1: r, col, dur: .6, fill: !!fill });
    function nearestFoe(p, rng) { let b = null, bd = rng; for (const e of enemies) { if (e.dead || !e.d.pvp || e.duel || e._kdHid) continue; const d = dist(p, e); if (d < bd) { bd = d; b = e; } } return b; }
    function center(p, sk) { const t = p.target && !p.target.dead && dist(p, p.target) < 420 ? p.target : nearestEnemy(420); return t ? { x: t.x, y: t.y, t } : { x: p.x, y: p.y, t: null }; }
    function allies(p, r) { const L = [p]; for (const b of bots) if (b.alive && (b.party || b.faction === 'ally') && Math.hypot(b.x - p.x, b.y - p.y) < r) L.push(b); return L; }
    function debuff(e, mods, dur) { if (!e._b0) e._b0 = { atk: e.atk, def: e.def }; e.atk = e._b0.atk * (mods.atk || 1); e.def = e._b0.def * (mods.def || 1); e._debUntil = Math.max(e._debUntil || 0, gameTime + dur); e._debCol = mods.col || '#b070ff'; }
    window.kdDebuff = debuff;
    // v47: görünür alan efektleri (yerde kalan zehir bulutu, lanet rünü, kutsama/şifa/arınma dalgaları)
    const ZONES = []; window.kdZones = ZONES;
    const zone = (k, x, y, r, dur, o) => { ZONES.push(Object.assign({ k, x, y, r, t0: gameTime, until: gameTime + dur, tick: 0 }, o || {})); };
    function castPriest(sk, slot) {
      const p = P(), s = p.stats;
      if ((p.cds[sk.id] || 0) > gameTime) return true; if (p.mp < sk.mp) { fl(p.x, p.y - 80, 'Mana yetersiz', '#7fb0ff', 12); return true; }
      p.mp -= sk.mp; p.cds[sk.id] = gameTime + sk.cd; p.atkAnim = .22; p.alt = !p.alt; p.castK = 'aoe'; p.castT = gameTime;
      const c = center(p, sk);
      zone(sk.k, sk.k === 'pdmg' || sk.k === 'ppoison' || sk.k === 'pcurse' ? c.x : p.x, sk.k === 'pdmg' || sk.k === 'ppoison' || sk.k === 'pcurse' ? c.y : p.y, sk.r, sk.k === 'ppoison' ? sk.dur : sk.k === 'pcurse' ? 2.6 : sk.k === 'pdmg' ? .9 : 1.4, { src: p, dmg: s.atk * .45, dur: sk.dur });
      if (sk.k === 'pdmg') { FX('sparkc', c.x, c.y - 20, 3, { add: true }); ring(c.x, c.y, sk.r, '#ffe08a', true); for (const e of enemies) if (!e.dead && Math.hypot(e.x - c.x, e.y - c.y) < sk.r + e.r) playerHit(e, sk.m); }
      else if (sk.k === 'ppoison') { FX('smoke', c.x, c.y - 10, 4); ring(c.x, c.y, sk.r, '#8aff5a', true); let n = 0; for (const e of enemies) if (!e.dead && Math.hypot(e.x - c.x, e.y - c.y) < sk.r + e.r) { addDot(e, s.atk * .45, sk.dur, '#9dff60', p); debuff(e, { atk: .75, def: (e._b0 ? e.def / e._b0.def : 1), col: '#8aff5a' }, sk.dur); if (!e.target) e.target = p; n++; } fl(c.x, c.y - 60, n ? 'Zehirlendi! Saldırı -%25' : 'Kimse yok', '#9dff60', 13); }
      else if (sk.k === 'pcurse') { FX('spirit', c.x, c.y - 20, 3.4, { add: true }); ring(c.x, c.y, sk.r, '#b070ff', true); for (const e of enemies) if (!e.dead && Math.hypot(e.x - c.x, e.y - c.y) < sk.r + e.r) { debuff(e, { def: .7, atk: (e._b0 ? e.atk / e._b0.atk : 1), col: '#b070ff' }, sk.dur); damageEnemy(e, { v: Math.max(1, Math.round(Math.min(e.maxHp * .08, s.atk * 4))), crit: false }, p, '#c890ff'); } fl(c.x, c.y - 60, 'Lanetlendi! Savunma -%30', '#c890ff', 13); }
      else if (sk.k === 'pbless') { for (const a of allies(p, sk.r)) { if (a === p) p.buffs[sk.id] = { until: gameTime + sk.dur, mods: { hpP: .2, defP: .3 }, col: '#ffe08a' }; else { if (!a._bl0) a._bl0 = { def: a.def, maxHp: a.maxHp }; a.def = a._bl0.def * 1.3; a.maxHp = Math.round(a._bl0.maxHp * 1.2); a._blUntil = gameTime + sk.dur; } FX('boost', a.x, a.y - 26, 1.8, { add: true }); } recalc(p); ring(p.x, p.y, sk.r * .5, '#ffe08a'); fl(p.x, p.y - 90, 'Kutsama! Can +%20 Savunma +%30', '#ffe08a', 14); }
      else if (sk.k === 'pheal') { for (const a of allies(p, sk.r)) { if (a === p) { healPlayer(s.maxHp * .25); p.hots.push({ per: s.maxHp * .15 / 6, until: gameTime + 6, next: gameTime + 1 }); } else a.hp = Math.min(a.maxHp, a.hp + a.maxHp * .4); FX('aura', a.x, a.y - 20, 2.6, { add: true }); } ring(p.x, p.y, sk.r * .5, '#7dffa0', true); }
      else if (sk.k === 'pcleanse') { for (const a of allies(p, sk.r)) { FX('water', a.x, a.y - 20, 2, { add: true }); if (a.kdPoison) a.kdPoison = null; } for (const id in p.buffs) if (id.indexOf('deb_') === 0) delete p.buffs[id]; p.kdPoison = null; p.dots = []; p.kdImmune = gameTime + 4; healPlayer(s.maxHp * .1); recalc(p); ring(p.x, p.y, sk.r * .5, '#9fe0ff', true); fl(p.x, p.y - 90, 'Arındın! Zehir yok edildi', '#9fe0ff', 14); }
      return true;
    }
    if (typeof useSkill === 'function') {
      const _us = useSkill;
      useSkill = function (slot) {
        const p = P(); if (!p || p.dead) return; const id = p.act[slot], sk = id && SKILL_BY_ID[id];
        if (sk && !p.learned.includes(id)) { fl(p.x, p.y - 80, 'Sv ' + sk.lv + '\'de açılır', '#cccccc', 12); return; }
        // PvP: yetenek kendiliğinden en yakın karşı ırka atılır (müdahale edilemez)
        if (M && M.pvp && sk && !/^(buff|heal|shield|stealth|pbless|pheal|pcleanse)$/.test(sk.k)) { const f = nearestFoe(p, 520); if (f) { p.target = f; p.face = f.x < p.x ? -1 : 1; } }
        if (sk && /^p(dmg|poison|curse|bless|heal|cleanse)$/.test(sk.k)) { const o = window.__kdPC; window.__kdPC = true; try { return castPriest(sk, slot); } finally { window.__kdPC = o; } }
        const o = window.__kdPC; window.__kdPC = true; try { return _us.apply(this, arguments); } finally { window.__kdPC = o; }
      };
    }
    // her kare: düşman zayıflatmalarının ve kutsamanın süresi, oyuncu zehri
    if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try {
      for (const e of enemies) if (e._b0 && gameTime > e._debUntil) { e.atk = e._b0.atk; e.def = e._b0.def; e._b0 = null; }
      for (let i = ZONES.length - 1; i >= 0; i--) { const z = ZONES[i]; if (gameTime > z.until) { ZONES.splice(i, 1); continue; }
        if (z.k === 'ppoison' && gameTime >= z.tick) { z.tick = gameTime + 1;
          for (const e of enemies) if (!e.dead && !e.duel && Math.hypot(e.x - z.x, (e.y - z.y) * 1.6) < z.r + e.r && !(e._debUntil > gameTime + 1 && e._debCol === '#8aff5a')) { addDot(e, z.dmg, 3, '#9dff60', z.src); debuff(e, { atk: .75, def: (e._b0 ? e.def / e._b0.def : 1), col: '#8aff5a' }, 3); } } }
      for (const b of bots) if (b._bl0 && gameTime > b._blUntil) { b.def = b._bl0.def; b.maxHp = b._bl0.maxHp; b.hp = Math.min(b.hp, b.maxHp); b._bl0 = null; }
      const p = P(); if (p && p.kdPoison && !p.dead) { const z = p.kdPoison; if (gameTime > z.until) { p.kdPoison = null; } else if (gameTime >= z.next) { z.next += .5; const v = Math.max(1, Math.round(z.dps * .5)); p.hp -= v; fl(p.x + rr(-8, 8), p.y - 60, '-' + v, '#9dff60', 12); if (p.hp <= 0) { p.hp = 0; die(z.src); } } }
    } catch (e) { } }; }
    // Gölge rahipleri vurunca zehirler: saldırı/savunma düşer + zehir hasarı (Arınma temizler)
    if (typeof hitTarget === 'function') { const _ht = hitTarget; hitTarget = function (src, t, raw) { const r = _ht.apply(this, arguments); try { const p = P();
      if (t === p && src && src.foe && src.cls === 'priest' && !(p.kdImmune > gameTime) && Math.random() < .35) { p.buffs.deb_poison = { until: gameTime + 5, mods: { atkP: -.3, defP: -.2 }, col: '#b050ff' }; p.kdPoison = { until: gameTime + 6, next: gameTime + .5, dps: p.stats.maxHp * .02, src }; recalc(p); fl(p.x, p.y - 96, 'Zehirlendin! Saldırı -%30 Savunma -%20', '#d090ff', 14); }
    } catch (e) { } return r; }; }

    // ---------------- Yetenek paneli (K) ----------------
    renderSkills = function () {
      const p = P(), list = SKILLS[p.cls] || [], tz = TARZ[p.cls] || [];
      const card = sk => { const ok = p.learned.includes(sk.id), slot = p.act.indexOf(sk.id);
        return '<div class="ks' + (ok ? '' : ' lock') + (slot >= 0 ? ' on' : '') + '"><img class="skimg" src="na/sk_' + sk.id + '.png" alt=""><div class="kb"><div class="kn">' + sk.n + ' <span>' + (ok ? sk.mp + ' mana • ' + sk.cd + ' sn' : '🔒 Sv ' + sk.lv) + '</span></div><div class="kd">' + sk.d + '</div>' +
          (ok ? '<div class="kslots">' + [0, 1, 2].map(i => '<button data-slot="' + i + '" data-id="' + sk.id + '" class="' + (p.act[i] === sk.id ? 'on' : '') + '">' + (i + 1) + '</button>').join('') + '</div>' : '') + '</div></div>'; };
      $('skills').innerHTML = '<button class="x" data-close="skills">✕</button><h2>Yetenekler — ' + CLASSES[p.cls].name + '</h2>' +
        '<div class="mut" style="font-size:12px">6 yetenek Sv 1, 5, 10, 15, 22 ve 30\'da açılır. Oyun tarzına göre 3\'ünü seç. Kızıl Sınır\'da yeteneklerin kendiliğinden en yakın karşı ırk oyuncusuna atılır.</div>' +
        '<div class="ktarz">' + tz.map((t, i) => '<button data-tarz="' + i + '">' + t[0] + '</button>').join('') + '</div>' +
        '<div class="kslotbar">' + p.act.map((id, i) => '<div class="kq"><span>' + (i + 1) + '</span>' + (id ? '<img class="skimg" src="na/sk_' + id + '.png" alt="">' : '') + '</div>').join('') + '</div>' +
        '<div class="klist">' + list.map(card).join('') + '</div>';
    };
    const sw = $('skills'); const sw2 = sw.cloneNode(false); sw.parentNode.replaceChild(sw2, sw); // eski tıklama dinleyicilerini kaldır
    sw2.addEventListener('click', ev => {
      const p = P(), b = ev.target.closest('button'); if (!b || b.disabled || !p) return;
      if (b.dataset.close) { sw2.classList.add('hidden'); return; }
      if (b.dataset.tarz != null) { const t = TARZ[p.cls][+b.dataset.tarz][1]; p.act = t.map(id => p.learned.includes(id) ? id : null); showToast('Tarz: ' + TARZ[p.cls][+b.dataset.tarz][0], 'Açılmamış yetenekler seviyen gelince takılabilir', 1.6); }
      else if (b.dataset.slot != null) { const id = b.dataset.id, i = +b.dataset.slot, prev = p.act.indexOf(id); if (prev >= 0) p.act[prev] = null; p.act[i] = id; }
      else return;
      recalc(p); buildBar(); renderSkills(); try { save(); } catch (e) { }
    });

    // ---------------- Karakter paneli (C): özellik puanları ----------------
    renderChar = function () {
      const p = P(), s = p.stats, c = CLASSES[p.cls]; ensureAttr(p);
      const row = k => '<div class="ka"><span class="kn">' + STN[k] + (k === c.prim ? ' <b class="pr">ana</b>' : '') + '</span><b class="kv">' + p.attr[k] + '</b>' + (p.attrPts > 0 ? '<button data-add="' + k + '">+1</button><button data-add5="' + k + '">+5</button>' : '') + '</div>';
      const rows = [['❤️ Can', s.maxHp], ['💧 Mana', s.maxMp], ['⚔️ Saldırı', Math.round(s.atk)], ['🛡️ Savunma', Math.round(s.def)], ['🎯 Kritik', Math.round(s.crit * 100) + '%'], ['🌀 Kaçınma', Math.round(s.dodge * 100) + '%'], ['⏱️ Saldırı hızı', s.as.toFixed(2) + ' sn'], ['🏅 Onur', p.honor || 0]];
      $('char').innerHTML = '<button class="x" data-close="char">✕</button><h2>' + esc2(p.name) + '</h2><div class="mut" style="font-size:13px">Seviye ' + p.lvl + ' / ' + MAXL + ' • ' + c.name + (p.cls === 'archer' ? (isDagger(p) ? ' (hançer: suikastçı)' : ' (yay: okçu)') : '') + '</div>' +
        '<div class="kattr"><div class="kh">Özellik Puanları <span class="' + (p.attrPts > 0 ? 'pts on' : 'pts') + '">' + p.attrPts + ' puan</span></div>' + ['str', 'dex', 'int', 'sta'].map(row).join('') +
        '<div class="mut" style="font-size:11px;margin-top:4px">Her seviyede 3 puan. Eşyaları giymek için ' + STN[c.prim] + ' gerekir; eşya + bastıkça şart artar. Dayanıklılık: her puan +12 can.</div></div>' +
        '<div class="stats two">' + rows.map(r => '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') + '</div>';
    };
    function esc2(t) { return typeof esc === 'function' ? esc(String(t)) : String(t); }
    $('char').addEventListener('click', ev => { const p = P(), b = ev.target.closest('button'); if (!b || !p) return; const k = b.dataset.add || b.dataset.add5; if (!k) return; const n = Math.min(p.attrPts, b.dataset.add5 ? 5 : 1); if (n <= 0) return; p.attr[k] += n; p.attrPts -= n; recalc(p); renderChar(); try { save(); } catch (e) { } });
  };
})();
