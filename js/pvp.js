'use strict';
// =====================================================================
//  KIZIL SINIR — KOLONİ SAVAŞI (Sürüm 41)
//  • İki ırk: Şafak (sen + müttefikler) ↔ Gölge Hanedanı
//  • Karşı ırktan biri öldürülünce sol üstte herkesin gördüğü duyuru:
//        "Efe49 x İsmail47 yok etti"
//  • Her öldürme onur puanı kazandırır → Onur Sıralaması
//      1. sıra: Ejder rozeti   2. sıra: Z rozeti   3. sıra: T rozeti
//    Rozetler duyuruda, sıralama listesinde ve dünyada ismin hemen solunda.
//  Savaş/ödül altyapısı aynen kalır (oyuncunun onuru p.honor).
// =====================================================================
(function () {
  const KEY = 'kdPvpRank_v2';
  let R = {}; try { R = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { R = {}; }
  let dirty = false;
  function store() { if (!dirty) return; dirty = false; try { localStorage.setItem(KEY, JSON.stringify(R)); } catch (e) { } }
  setInterval(store, 5000);
  function seed() {
    if (R._seeded) return;
    for (const n of (typeof ALLY_NAMES !== 'undefined' ? ALLY_NAMES : [])) R[n] = { h: ri(20, 520), side: 'ally' };
    for (const n of (typeof FOE_NAMES !== 'undefined' ? FOE_NAMES : [])) R[n] = { h: ri(20, 520), side: 'foe' };
    R._seeded = true; dirty = true;
  }
  const me = () => typeof player !== 'undefined' && player;
  function honorOf(name) { const p = me(); if (p && name === p.name) return p.honor || 0; return R[name] ? R[name].h : 0; }
  function addHonor(name, side, h) { const p = me(); if (p && name === p.name) return; if (!R[name]) R[name] = { h: 0, side }; R[name].h += h; R[name].side = side; dirty = true; }
  function ranking() {
    const p = me(); const list = [];
    for (const k in R) if (k[0] !== '_') list.push({ n: k, h: R[k].h, side: R[k].side });
    if (p) list.push({ n: p.name, h: p.honor || 0, side: 'ally', me: true });
    list.sort((a, b) => b.h - a.h); return list;
  }
  let rankCache = [], rankT = 0;
  function rankOf(name) { const i = rankCache.findIndex(r => r.n === name); return i < 0 ? 0 : i + 1; }
  window.kdPvpRank = () => ranking();

  // ---------------- rozetler (HTML ve tuval) ----------------
  const BADGE = { 1: 'dragon', 2: 'Z', 3: 'T' };
  function badgeHTML(name) { const r = rankOf(name); if (!r || r > 3) return ''; return r === 1 ? '<i class="kdrk kdrk1" title="1. sıra"></i>' : '<i class="kdrk kdrk' + r + '" title="' + r + '. sıra">' + BADGE[r] + '</i>'; }
  const IM = new Image(); IM.src = 'na/mv_Dragon.png';
  function badgeCanvas(g, r, x, y) {
    g.save();
    if (r === 1) { // altın çerçeveli ejder başı
      g.fillStyle = '#3a1a08'; g.strokeStyle = '#ffd04a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.stroke();
      if (IM.complete && IM.naturalWidth) { g.imageSmoothingEnabled = false; g.drawImage(IM, 0, 0, 16, 16, x - 8, y - 9, 16, 16); }
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = .25 + .15 * Math.sin(performance.now() / 300); g.fillStyle = '#ffb030'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
    } else {
      g.fillStyle = r === 2 ? '#5a2a8a' : '#2a4a7a'; g.strokeStyle = r === 2 ? '#d8a8ff' : '#a8d0ff'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x - 7, y - 8); g.lineTo(x + 7, y - 8); g.lineTo(x + 8, y + 7); g.lineTo(x - 8, y + 7); g.closePath(); g.fill(); g.stroke();
      g.font = '900 11px "Segoe UI",Tahoma,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(BADGE[r], x, y);
    }
    g.restore();
  }

  // ---------------- duyuru + sıralama paneli (sol üst) ----------------
  const box = document.createElement('div'); box.id = 'kdPvp'; box.innerHTML = '<div class="kdpv-rank"></div><div class="kdpv-feed"></div>'; document.body.appendChild(box);
  const feed = [];
  function announce(killer, kside, victim, vside) {
    feed.push({ k: killer, ks: kside, v: victim, vs: vside, t: performance.now() }); if (feed.length > 6) feed.shift();
    try { rankCache = ranking(); box.classList.toggle('on', !!(M && M.pvp)); renderRank(); } catch (e) { }
    renderFeed();
  }
  window.kdAnnounce = announce;

  // ---------------- ÖLMEDEN ARKA ARKAYA ÖLDÜRME SERİSİ ----------------
  const STREAK = {};
  const TIERS = { 2: ['DOUBLE KILL', 't2'], 3: ['TRIPLE KILL', 't3'], 4: ['QUADRA KILL', 't4'], 5: ['PENTA KILL', 't5'], 7: ['UNSTOPPABLE', 't7'], 10: ['IMMORTAL', 't10'], 15: ['GODLIKE', 't15'] };
  const sb = document.createElement('div'); sb.id = 'kdStreak'; document.body.appendChild(sb);
  let sbT = null;
  function streakBanner(name, side, n, tier) {
    sb.className = ''; void sb.offsetWidth;
    sb.innerHTML = '<div class="nm">' + badgeHTML(name) + '<b class="' + (side === 'ally' ? 'al' : 'fo') + '">' + esc(name) + '</b> <span class="cnt">' + n + ' ölmeden</span></div><div class="big ' + tier[1] + '">' + tier[0] + '</div>';
    sb.className = 'show ' + tier[1]; clearTimeout(sbT); sbT = setTimeout(() => { sb.className = ''; }, 2100);
    try { const p = me(); if (p) effects.push({ type: 'ring', x: p.x, y: p.y, t: 0, r0: 10, r1: 90, col: side === 'ally' ? '#ffd65a' : '#ff5050', dur: .6 }); } catch (e) { }
  }
  // v46: seri sayımı her 1 dakikada sıfırlanır (ilk öldürmeden itibaren 60 sn'lik pencere)
  const ST0 = {}, WIN = 60;
  const gt = () => typeof gameTime !== 'undefined' ? gameTime : performance.now() / 1000;
  function onKill(killer, kside, victim) {
    STREAK[victim] = 0; ST0[victim] = null;
    if (ST0[killer] == null || gt() - ST0[killer] >= WIN) { STREAK[killer] = 0; ST0[killer] = gt(); }
    const n = (STREAK[killer] || 0) + 1; STREAK[killer] = n;
    const t = TIERS[n] || (n > 15 && n % 5 === 0 ? ['GODLIKE', 't15'] : null);
    if (t) streakBanner(killer, kside, n, t);
  }
  window.kdStreak = n => (ST0[n] != null && gt() - ST0[n] >= WIN) ? 0 : (STREAK[n] || 0);
  const _ann = announce;
  announce = function (killer, kside, victim, vside) { _ann(killer, kside, victim, vside); onKill(killer, kside, victim); };
  window.kdAnnounce = announce;
  function nameHTML(n, side) { return badgeHTML(n) + '<b class="' + (side === 'ally' ? 'al' : 'fo') + '">' + esc(n) + '</b>'; }
  // tek satır: en son öldürme kayarak gelir, ~3 sn kalır, yavaşça kaybolur (yeniden çizim yok → birikmez)
  let feedT = null;
  function renderFeed() {
    const el = box.querySelector('.kdpv-feed'), f = feed[feed.length - 1]; if (!f || f._shown) return; f._shown = true;
    el.innerHTML = '<div class="ln">' + nameHTML(f.k, f.ks) + ' <span class="x">x</span> ' + nameHTML(f.v, f.vs) + ' <span class="yk">yok etti</span></div>';
    const ln = el.firstChild; ln.addEventListener('animationend', () => { if (ln.parentNode) ln.remove(); });
    clearTimeout(feedT); feedT = setTimeout(() => { if (ln.parentNode) ln.remove(); }, 3600);
  }
  function renderRank() {
    const p = me(); if (!p) return; const list = rankCache, top = list.slice(0, 3), mi = list.findIndex(r => r.me);
    box.querySelector('.kdpv-rank').innerHTML = '<div class="hd">Onur Sıralaması</div>' + top.map((r, i) => '<div class="rw' + (r.me ? ' me' : '') + '"><span class="no">' + (i + 1) + '.</span>' + nameHTML(r.n, r.side) + '<span class="hp">' + r.h + '</span></div>').join('') +
      (mi > 2 ? '<div class="rw me"><span class="no">' + (mi + 1) + '.</span><b class="al">' + esc(p.name) + '</b><span class="hp">' + (p.honor || 0) + '</span></div>' : '');
  }
  setInterval(() => { const on = typeof running !== 'undefined' && running && typeof M !== 'undefined' && M && M.pvp; box.classList.toggle('on', !!on); if (on) { rankCache = ranking(); renderRank(); } }, 500);
  // v46: sade PvP — sıralama ekranda değil Menü'de; ekranda yalnız üst ortada tek satır öldürme bildirimi
  setInterval(() => {
    const mp = document.getElementById('h2menuPop'); if (!mp) return;
    let mr = mp.querySelector('.kdpv-mrank');
    if (!mr) { mr = document.createElement('div'); mr.className = 'kdpv-mrank'; mp.insertBefore(mr, mp.querySelector('.mapw') || mp.firstChild); }
    const on = box.classList.contains('on'); mr.style.display = on ? '' : 'none';
    if (on && mp.classList.contains('open')) mr.innerHTML = box.querySelector('.kdpv-rank').innerHTML;
  }, 400);

  // ---------------- öldürme kancaları ----------------
  const H = (killerLvl, victimLvl) => 10 + Math.max(0, (victimLvl || 1) - (killerLvl || 1)) * 2;
  if (typeof killEnemy === 'function') {
    const _ke = killEnemy;
    killEnemy = function (e, src) {
      const wasPvp = e && e.d && e.d.pvp && !e.dead;
      const r = _ke.apply(this, arguments);
      try {
        if (wasPvp) {
          const p = me(); const killer = (src === p || e.pdmg > 0) ? p : src; // oyuncu hasar verdiyse onur oyuncunun (oyunun kuralı)
          if (killer && killer.name) { const ks = 'ally'; if (killer !== p) addHonor(killer.name, ks, H(killer.lvl, e.lvl)); announce(killer.name, ks, e.name, 'foe'); }
          addHonor(e.name, 'foe', 0);
        }
      } catch (er) { }
      return r;
    };
  }
  if (typeof damageBot === 'function') {
    const _db = damageBot;
    damageBot = function (b, raw, src) {
      const alive = b && b.alive; const r = _db.apply(this, arguments);
      try { if (alive && !b.alive && src && src.d && src.d.pvp && src.name) { addHonor(src.name, 'foe', H(src.lvl, b.lvl)); announce(src.name, 'foe', b.name, 'ally'); } } catch (er) { }
      return r;
    };
  }
  if (typeof die === 'function') {
    const _die = die;
    die = function (src) {
      const p = me(); const r = _die.apply(this, arguments);
      try { STREAK[p.name] = 0; } catch (er) { }
      try { if (M && M.pvp && src && src.d && src.d.pvp && src.name) { addHonor(src.name, 'foe', H(src.lvl, p.lvl) + 5); announce(src.name, 'foe', p.name, 'ally'); } } catch (er) { }
      return r;
    };
  }
  if (typeof enterMap === 'function') { const _em = enterMap; enterMap = function () { const r = _em.apply(this, arguments); try { if (M && M.pvp) { seed(); rankCache = ranking(); } } catch (e) { } return r; }; }

  // ---------------- dünyada isim solunda rozet ----------------
  function labelW(text, size) { const g = typeof uctx !== 'undefined' && TEXT ? uctx : ctx; g.save(); g.font = '700 ' + (size || 11) + 'px "Segoe UI",Tahoma,sans-serif'; const w = g.measureText(text).width; g.restore(); return w; }
  if (typeof drawExtrasTop === 'function') {
    const _dt = drawExtrasTop;
    drawExtrasTop = function () {
      _dt.apply(this, arguments);
      try {
        if (!rankCache.length) return; const g = typeof uctx !== 'undefined' && TEXT ? uctx : ctx, p = me();
        const put = (name, text, size, x, y) => { const r = rankOf(name); if (!r || r > 3) return; badgeCanvas(g, r, Math.round(x - labelW(text, size) / 2 - 12), y - 4); };
        if (p && !p.dead) put(p.name, (p.title ? '<' + p.title + '> ' : '') + p.name, 12, p.x, p.y - (p.riding ? 84 : 65));
        for (const b of bots) if (b.alive) put(b.name, b.name + ' [' + b.lvl + ']', 11, b.x, b.y - 65);
        for (const e of enemies) if (!e.dead && e.d.pvp) put(e.name, '⚔ ' + e.name + ' [' + e.lvl + ' ' + CLASSES[e.cls].name + ']', 11, e.x, e.y - 70);
      } catch (er) { }
    };
  }
})();
