'use strict';
// =====================================================================
//  ARAYÜZ v48
//  • Eşya şartı: giyilemeyen eşyanın üstünde kırmızı rozet (Sv18 / -34 ÇEV),
//    ayrıntıda "Gereken / Sende / Eksik" satırları — neden giyilemediği açık.
//  • Parti komutları (BEKLE / SALDIR / HAZIR OL / KAÇ): ortada büyük uyarı,
//    parti üyeleri uygular. Rakip oyuncuya TEK dokunuş = parti hedefi işaretle.
//  • Oyuncuya ÇİFT dokunuş / çift tık = etkileşim menüsü (basılı tutma kalktı).
//  • Çalılıktayken kendi karakterin de yarı saydam görünür.
//  • Dağıtılmamış özellik puanı uyarısı + "Önerilen dağıtım" düğmesi.
// =====================================================================
(function () {
  const P = () => (typeof player !== 'undefined' ? player : null);
  const SH = { str: 'GÜÇ', dex: 'ÇEV', int: 'ZEKA', sta: 'DAY' };
  // v53: eşyalarda SEVİYE şartı yok — yalnız stat puanı (eşya seviyesi yükseldikçe istenen puan artar)
  itemReq = function () { return 1; };
  // ---------------- eşya şartı ----------------
  function why(it) {
    const p = P(); if (!p || !it) return null; const r = { lvl: 0, st: null }; const need = itemReq(it); if (need > p.lvl) r.lvl = need;
    if (window.kdStatReq && p.attr) { const q = kdStatReq(it), have = p.attr[q.k] || 0; if (have < q.v) r.st = { k: q.k, v: q.v, have }; }
    return (r.lvl || r.st) ? r : null;
  }
  window.kdWhy = why;
  window.kdReqHTML = function (it) {
    const p = P(); if (!p) return ''; const need = itemReq(it), q = window.kdStatReq ? kdStatReq(it) : null, have = q && p.attr ? p.attr[q.k] || 0 : 0;
    const row = (ok, txt) => '<div class="kdrq ' + (ok ? 'ok' : 'no') + '">' + (ok ? '✔ ' : '✖ ') + txt + '</div>';
    let h = '';
    if (q) h += row(have >= q.v, (KD_STN[q.k] || q.k) + ': gereken <b>' + q.v + '</b>, sende <b>' + have + '</b>' + (have < q.v ? ' — <b>' + (q.v - have) + ' puan eksik</b>' : ''));
    return '<div class="kdrqs">' + h + '</div>';
  };
  if (typeof itemBox === 'function') {
    const _ib = itemBox;
    itemBox = function (it) { let h = _ib.apply(this, arguments); try { const w = why(it); if (w) { const tag = w.lvl ? 'Sv' + w.lvl : '-' + (w.st.v - w.st.have) + ' ' + SH[w.st.k]; h = h.replace('class="it ', 'class="it req kdno ').replace(/<\/div>$/, '<span class="rq">' + tag + '</span></div>'); } } catch (e) { } return h; };
  }
  if (typeof equip === 'function') {
    const _eq = equip;
    equip = function (i) { const p = P(), it = p && p.inv[i]; if (it && itemReq(it) > p.lvl) { showToast('Seviyen yetmiyor', 'Gereken: Sv ' + itemReq(it) + ' • Sende: Sv ' + p.lvl + ' (' + (itemReq(it) - p.lvl) + ' eksik)', 2.2); return; } return _eq.apply(this, arguments); };
  }

  // ---------------- çalılıkta kendi karakterin saydam ----------------
  if (typeof drawPlayer === 'function') {
    const _dp = drawPlayer;
    drawPlayer = function (p) { const inB = window.kdBushAt && p && kdBushAt(p.x, p.y); if (!inB) return _dp.apply(this, arguments); ctx.save(); ctx.globalAlpha *= .5; try { return _dp.apply(this, arguments); } finally { ctx.restore(); } };
  }

  // ---------------- parti komutları + hedef işaretleme ----------------
  const CMD = { attack: ['SALDIR', '⚔', '#ff5a5a', 'E'], wait: ['BEKLE', '✋', '#ffd65a', 'R'], flee: ['KAÇ', '🏃', '#b0ff8a', 'T'] }; // v49: 3 komut
  let cmd = null, cmdUntil = 0, cmdAt = null; window.kdMark = null;
  const partyOn = () => window.kdParty && kdParty().length > 0;
  const big = document.createElement('div'); big.id = 'kdCmdB'; document.body.appendChild(big); let bigT = null;
  function banner(txt, col, sub) { big.innerHTML = '<div class="a" style="color:' + col + '">' + txt + '</div>' + (sub ? '<div class="b">' + sub + '</div>' : ''); big.className = ''; void big.offsetWidth; big.className = 'show'; clearTimeout(bigT); bigT = setTimeout(() => big.className = '', 1700); }
  function issue(k) {
    const p = P(); if (!p) return; if (!partyOn()) { showToast('Önce parti kur', 'Bir oyuncuya çift dokun → Parti Daveti', 1.8); return; } if (window.kdPartyLeader && kdPartyLeader() !== '@me') { showToast('Yalnız parti lideri komut verebilir', 'Lider: ' + kdPartyLeader(), 1.8); return; }
    cmd = k; cmdAt = { x: p.x, y: p.y }; cmdUntil = gameTime + (k === 'flee' ? 8 : k === 'attack' ? 15 : 9999);
    const c = CMD[k]; banner(c[1] + ' ' + c[0] + '!', c[2], k === 'attack' && kdMark && !kdMark.dead ? 'Hedef: ' + kdMark.name : 'Parti emri');
    addChat('[Parti] ' + p.name, c[0] + '!', '#9fe0ff');
    const reply = { wait: ['tamam bekliyorum', 'yerimdeyim'], attack: ['saldırıyorum!', 'hedef bende', 'gidiyoruz!'], ready: ['hazırım', 'arkandayım'], flee: ['geri çekiliyoruz!', 'kaç kaç!'] }[k];
    let d = .4; for (const n of kdParty()) { const b = bots.find(x => x.name === n); if (b) { const r = reply[Math.floor(Math.random() * reply.length)]; setTimeout(() => { try { addChat('[Parti] ' + b.name, r, '#7dff9a'); b.say = { text: r, until: gameTime + 2.5 }; } catch (e) { } }, d * 1000); d += .35; } }
    try { if (window.kdSfx) kdSfx(k === 'attack' ? 'shout' : 'switch'); } catch (e) { }
    updPanel();
  }
  window.kdCommand = issue;
  function mark(e) { const p = P(); window.kdMark = e; p.target = e; banner('🎯 HEDEF: ' + e.name, '#ff6060', 'Tüm parti bu hedefe saldırır'); addChat('[Parti] ' + p.name, '🎯 Hedef: ' + e.name, '#ff9090'); updPanel(); }
  window.kdMarkTarget = mark;
  if (typeof updBot === 'function') {
    const _ub = updBot;
    updBot = function (b, dt) {
      if (!b.party || !b.alive || !cmd) return _ub.apply(this, arguments);
      const p = P(); if (!p) return _ub.apply(this, arguments);
      if (gameTime > cmdUntil) { cmd = null; updPanel(); return _ub.apply(this, arguments); }
      const k = b._kdIdx == null ? (b._kdIdx = Math.floor(Math.random() * 5)) : b._kdIdx, ox = Math.cos(k * 1.3) * 34, oy = Math.sin(k * 1.3) * 22;
      if (cmd === 'wait') { b.target = null; if (!b._kdHold) b._kdHold = { x: b.x, y: b.y }; if (Math.hypot(b.x - b._kdHold.x, b.y - b._kdHold.y) > 8) moveToward(b, b._kdHold.x, b._kdHold.y, 140, dt); b.anim += dt; return; }
      b._kdHold = null;
      if (cmd === 'flee') { b.target = null; moveToward(b, M.start.x + ox, M.start.y + oy, 175, dt); b.anim += dt; return; }
      if (cmd === 'ready') { b.target = null; moveToward(b, p.x - (p.face || 1) * 46 + ox * .6, p.y + oy * .6, 165, dt); b.anim += dt; return; }
      if (cmd === 'attack') { const m = window.kdMark; if (m && !m.dead) { b.target = m; if (dist(b, m) > 360) { moveToward(b, m.x, m.y, 160, dt); b.anim += dt; return; } } }
      return _ub.apply(this, arguments);
    };
  }
  // tek dokunuş: rakip oyuncuyu işaretle • çift dokunuş: oyuncu menüsü (sosyal.js)
  const cv = document.getElementById('game');
  cv.addEventListener('pointerdown', e => {
    const p = P(); if (!p || typeof running === 'undefined' || !running) return;
    const Z = ZOOM, wx = camX + e.clientX / Z, wy = camY + e.clientY / Z; let best = null, bd = 46;
    for (const en of enemies) { if (en.dead || !en.d.pvp || en._kdHid) continue; const d = Math.hypot(en.x - wx, en.y - 26 - wy); if (d < bd) { bd = d; best = en; } }
    if (best && partyOn() && window.kdMark !== best) mark(best);
  });
  // işaret çizimi
  if (typeof drawExtrasTop === 'function') {
    const _t = drawExtrasTop;
    drawExtrasTop = function () {
      _t.apply(this, arguments);
      try { const m = window.kdMark; if (!m) return; if (m.dead || !enemies.includes(m)) { window.kdMark = null; updPanel(); return; } if (m._kdHid) return;
        const y = m.y - (m.d.h || 50) - 40 + Math.sin(gameTime * 6) * 4; ctx.save(); ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(m.x, y, 13, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(m.x - 19, y); ctx.lineTo(m.x - 7, y); ctx.moveTo(m.x + 7, y); ctx.lineTo(m.x + 19, y); ctx.moveTo(m.x, y - 19); ctx.lineTo(m.x, y - 7); ctx.moveTo(m.x, y + 7); ctx.lineTo(m.x, y + 19); ctx.stroke();
        ctx.fillStyle = 'rgba(255,40,40,.25)'; ctx.beginPath(); ctx.ellipse(m.x, m.y, 26, 10, 0, 0, 7); ctx.fill(); ctx.restore(); } catch (e) { }
    };
  }
  // panel
  const pan = document.createElement('div'); pan.id = 'kdCmd'; pan.className = 'h2p';
  pan.innerHTML = Object.keys(CMD).map(k => '<button data-c="' + k + '"><i>' + CMD[k][1] + '</i><b>' + CMD[k][0] + '</b><span class="kk">' + CMD[k][3] + '</span></button>').join('');
  pan.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const b = e.target.closest('[data-c]'); if (b) issue(b.dataset.c); });
  function updPanel() { for (const b of pan.querySelectorAll('[data-c]')) b.classList.toggle('on', b.dataset.c === cmd); }
  function attach() { const r = document.getElementById('h2'); if (r && pan.parentNode !== r) { r.appendChild(pan); try { kdLayout(); } catch (e) { } } }
  setInterval(() => { attach(); const on = typeof running !== 'undefined' && running && partyOn(); pan.classList.toggle('on', !!on); if (!on && cmd) { cmd = null; } }, 400);
  // v49 klavye: partideyken E = SALDIR, R = BEKLE, T = KAÇ (parti yokken bu tuşlar eski işlerini yapar: mana iksiri / binek / köye dön)
  addEventListener('keydown', e => { if (typeof running === 'undefined' || !running || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return; const ae = document.activeElement; if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
    const m = { e: 'attack', r: 'wait', t: 'flee' }[(e.key || '').toLowerCase()]; if (m && partyOn()) { e.preventDefault(); e.stopImmediatePropagation(); issue(m); } }, true);

  // ---------------- v49: MOD düğmesi (OTO / PVE / PVP tek ikonda) ----------------
  const modeB = document.createElement('div'); modeB.id = 'kdMode'; modeB.className = 'h2p h2b';
  modeB.innerHTML = '<img class="px" alt=""><span class="lab"></span><span class="oto">OTO</span><span class="kk">H/X</span>';
  const modePop = document.createElement('div'); modePop.id = 'kdModePop'; modePop.className = 'h2p';
  modePop.innerHTML = '<button data-m="oto"><img src="na/i_cog.png" alt=""><b>OTO</b><small></small></button><button data-m="pve"><img src="na/ii_Grass.png" alt=""><b>PVE</b><small>Kasılma yetenekleri</small></button><button data-m="pvp"><img src="na/i_sword.png" alt=""><b>PVP</b><small>Oyuncu savaşı yetenekleri</small></button>';
  modeB.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); modePop.classList.toggle('open'); updMode(); });
  modePop.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const b = e.target.closest('[data-m]'); if (!b) return; const m = b.dataset.m;
    if (m === 'oto') { if (window.kdToggleAuto) kdToggleAuto(); } else if (window.kdToggleSet) kdToggleSet(m); updMode(); setTimeout(() => modePop.classList.remove('open'), 160); });
  addEventListener('pointerdown', e => { if (modePop.classList.contains('open') && !e.target.closest('#kdModePop,#kdMode')) modePop.classList.remove('open'); }, true);
  function updMode() { const p = P(); if (!p) return; const pvp = p.kdSet === 'pvp', auto = !!p.autoFight;
    modeB.classList.toggle('pvp', pvp); modeB.classList.toggle('auto', auto); modeB.querySelector('img').src = 'na/' + (pvp ? 'i_sword' : 'ii_Grass') + '.png'; modeB.querySelector('.lab').textContent = pvp ? 'PVP' : 'PVE';
    for (const b of modePop.querySelectorAll('[data-m]')) { const m = b.dataset.m; b.classList.toggle('on', m === 'oto' ? auto : m === p.kdSet); }
    modePop.querySelector('[data-m="oto"] small').textContent = auto ? 'Açık — otomatik savaş' : 'Kapalı'; }
  window.kdUpdMode = updMode;
  function attachMode() { const r = document.getElementById('h2'); if (r && modeB.parentNode !== r) { r.appendChild(modeB); r.appendChild(modePop); try { kdLayout(); } catch (e) { } } }
  attachMode(); attach();
  setInterval(() => { attachMode(); updMode(); }, 300);

  // ---------------- sohbet: eski satırlar 9 sn sonra kaybolur ----------------
  setInterval(() => { const now = Date.now(); for (const d of document.querySelectorAll('#chatlog > div')) { if (!d._t) d._t = now; else if (now - d._t > 9000) d.classList.add('old'); } }, 1000);

  // ---------------- özellik puanı: uyarı + önerilen dağıtım ----------------
  const REC = { warrior: { str: .5, sta: .35, dex: .15 }, mage: { int: .6, sta: .3, dex: .1 }, archer: { dex: .55, sta: .3, str: .15 }, priest: { int: .5, sta: .4, dex: .1 } };
  window.kdAutoAttr = function () { const p = P(); if (!p || !p.attr || !(p.attrPts > 0)) return; const R = REC[p.cls] || REC.warrior, n = p.attrPts; let left = n;
    const ks = Object.keys(R); for (const k of ks) { const a = Math.floor(n * R[k]); p.attr[k] += a; left -= a; } p.attr[ks[0]] += left; p.attrPts = 0; recalc(p); try { if (typeof renderChar === 'function') renderChar(); save(); } catch (e) { } showToast('Puanlar dağıtıldı', 'Sınıfına önerilen dağılım uygulandı', 1.6); };
  setInterval(() => { const b = document.getElementById('h2char'), p = P(); if (!b || !p) return; let d = b.querySelector('.ptsb'); if (!d) { d = document.createElement('span'); d.className = 'ptsb'; b.appendChild(d); } const n = p.attrPts || 0; d.textContent = n > 0 ? n : ''; d.style.display = n > 0 ? 'flex' : 'none'; }, 700);
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-autoattr]'); if (b) window.kdAutoAttr(); });
  if (typeof renderChar === 'function') {
    // sinif.js renderChar'ı son.js'de değiştirir; bu yüzden her açılışta düğmeyi ekleriz
    setInterval(() => { const c = document.getElementById('char'); if (!c || c.classList.contains('hidden')) return; const h = c.querySelector('.kattr .kh'); const p = P(); if (h && p && p.attrPts > 0 && !h.querySelector('[data-autoattr]')) { const bt = document.createElement('button'); bt.dataset.autoattr = '1'; bt.className = 'kdauto-btn'; bt.textContent = 'Önerilen dağıt'; h.appendChild(bt); } }, 300);
  }
  // eski kayıt geçişi: seviye artık stat vermediği için birikmiş puanlar bir kerelik önerilen dağılımla dağıtılır
  if (typeof SAVE_FIELDS !== 'undefined') SAVE_FIELDS.push('v48mig');
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function (d, isNew) { const r = _sg.apply(this, arguments);
    try { const p = P(); if (p && !p.v48mig) { p.v48mig = 1; if (p.attrPts > 0 && p.lvl > 1) { window.kdAutoAttr(); addChat(null, '⚙ Yeni gelişim sistemi: güç artık seviyeden değil, dağıttığın puanlardan ve ekipmandan gelir. Birikmiş ' + 'puanların sınıfına uygun şekilde dağıtıldı (C ile değiştirebilirsin).', '#ffd65a'); } } } catch (e) { } return r; }; window.startGame = startGame; }
  // ---------------- menü: ses ve yakınlaştırma satırları ----------------
  function menuExtra() {
    const g = document.querySelector('#h2menuPop .grid'); if (!g) return;
    const mk = (id, ic, lab, sub, fn, ord) => { let d = document.getElementById(id); if (d) return d; d = document.createElement('div'); d.id = id; d.className = 'slot h3row'; d.style.order = ord;
      d.innerHTML = '<img class="h3mi" src="na/' + ic + '.png" alt=""><span class="h3ml"><b>' + lab + '</b><small>' + sub + '</small></span>'; d.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); fn(d); }); g.appendChild(d); return d; };
    mk('sl_zoom', 'i_size_larger', 'Yakınlaştırma', 'Görüş: 1.0x / 0.85x / 1.25x (Z)', () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true })); }, 8);
    const s = mk('sl_snd', 'i_burst', 'Ses Efektleri', 'Açık', d => { const on = window.kdSfxToggle ? kdSfxToggle() : true; d.querySelector('small').textContent = on ? 'Açık' : 'Kapalı'; }, 9);
    const close = () => { const mp = document.getElementById('h2menuPop'); if (mp) mp.classList.remove('open'); };
    // v52: son güncellemelerin menü girişleri
    mk('sl_market', 'ii_Chest', 'Pazarım', 'Satışlar ve ticaret geçmişi', () => { close(); if (window.kdOpenTradeLog) kdOpenTradeLog(); }, 6);
    const afk = mk('sl_afk', 'ii_Grass', 'AFK Farm', '', () => { close(); if (window.kdPremActive && kdPremActive('afkfarm')) kdSetAfk(!kdAfkFarm()); else if (window.kdOpenPearl) kdOpenPearl('auto'); }, 6);
    afk.querySelector('small').textContent = window.kdPremActive && kdPremActive('afkfarm') ? (window.kdAfkFarm && kdAfkFarm() ? 'Açık — dokun: durdur' : 'Hazır — dokun: başlat') : 'Yok — İnci Dükkânı';
    mk('sl_meet', 'i_talk', 'Parti Bul', 'Parti arayan oyunculara davet gönder', () => { close(); if (window.kdMeet) kdMeet(); }, 7);
  }
  menuExtra(); setInterval(menuExtra, 1000);
})();
