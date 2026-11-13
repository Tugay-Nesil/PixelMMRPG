'use strict';
// =====================================================================
//  HUD 2 — 6 bölgeli mobil arayüz (şartname: 738x1600 tasarım alanı)
//  Üst sol: portre + Seviye/Can/Saldırı/Savunma   Üst sağ: Sosyal, Menü, Görev, Altın, Koordinat/Saat
//  Sol: Sohbet, Karakter, Ekipman, Joystick        Sağ: Saldırı, Hızlı, Pet, Yetenek
//  Alt: 8 yuvalı hızlı erişim (yetenek 1-3, iksirler, binek, kaçış, harita)
//  Oyun sistemleri DEĞİŞMEZ: mevcut düğme öğeleri (işleyicileriyle) yeni yerlerine taşınır.
// =====================================================================
(function () {
  const DW = 738, DH = 1600;
  const $id = id => document.getElementById(id);
  const root = document.createElement('div'); root.id = 'h2'; root.className = 'off'; document.body.appendChild(root);
  function el(id, cls, html) { const d = document.createElement('div'); d.id = id; if (cls) d.className = cls; if (html) d.innerHTML = html; root.appendChild(d); return d; }
  const I = n => '<img class="px" src="na/' + n + '.png" alt="">';
  function btn(id, icon, lab, fn, strong) {
    const d = el(id, 'h2p h2b' + (strong ? ' strong' : ''), I(icon) + (lab ? '<span class="lab">' + lab + '</span>' : ''));
    d.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); d.classList.add('pressed'); setTimeout(() => d.classList.remove('pressed'), 120); try { fn(e); } catch (er) { } });
    return d;
  }
  const bar = (cls, col) => '<div class="h2bar ' + cls + '"><i class="bg" style="background:' + col[0] + '"></i><i class="gh"></i><i class="fl" style="background:' + col[1] + '"></i></div>';

  // ---------- ÜST SOL ----------
  const por = el('h2por', 'h2p gold', '<img class="px" alt=""><span class="lv h2t h2gold"></span>');
  let taps = []; por.addEventListener('pointerdown', () => { const t = performance.now(); taps = taps.filter(x => t - x < 1500); taps.push(t); if (taps.length >= 5) { taps = []; if (typeof gmOpenLogin === 'function') gmOpenLogin(); } });
  const lvl = el('h2lvl', 'h2p', '<span class="h2t h2gold a"></span><span class="h2t h2dim b"></span>' + bar('xp', ['#2a1c3a', '#a064e6']));
  const hp = el('h2hp', 'h2p', I('i_heart') + '<span class="h2t h2dim a">CAN</span><span class="h2t b"><span class="cu"></span><span class="mx"></span></span>' + bar('hp', ['#3a1418', '#dc3434']) + bar('mp', ['#141c3a', '#3c78e6']));
  const atk = el('h2atk', 'h2p', I('i_sword') + '<span class="h2t h2dim a">SALDIRI</span><span class="h2t h2gold b"></span>');
  const def = el('h2def', 'h2p', I('i_shield') + '<span class="h2t h2dim a">SAVUNMA</span><span class="h2t b"></span>');

  // ---------- ÜST SAĞ ----------
  btn('h2soc', 'i_talk', null, () => toggleChat(false));
  const menuPop = el('h2menuPop', 'h2p', '<div class="ttl h2t">Menü</div><div class="mapw"></div><div class="grid"></div>');
  btn('h2menu', 'i_menu', null, () => menuPop.classList.toggle('open'));
  // v47: görev = küçük simge (yeni bilgi varsa ünlem), dokununca görev paneli açılır
  const quest = el('h2quest', 'h2p h2b gold', I('ii_Scroll') + '<span class="qbadge">!</span><span class="tg"></span>');
  const qPanel = el('h2qpanel', 'h2p gold');
  let qSeen = '';
  function toggleQuest(force) { const o = force != null ? force : !quest.classList.contains('open'); quest.classList.toggle('open', o); qPanel.classList.toggle('open', o); if (o) { const qb = $id('questbox'); qSeen = qb ? qb.textContent : ''; quest.classList.remove('new'); } }
  quest.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggleQuest(); });
  qPanel.addEventListener('pointerdown', e => { if (e.target.closest('button,a,input')) return; toggleQuest(false); });
  window.kdToggleQuest = toggleQuest;
  const gold = el('h2gold', 'h2p', I('i_coin') + '<span class="h2t h2gold"></span>');
  const coord = el('h2coord', 'h2p', '<span class="c h2t"></span><span class="t h2t"></span><span class="z h2t"></span>');
  const ZL = [0, -1, 1], ZN = ['1.0x', '0.85x', '1.25x']; let zi = 0;
  // v48: koordinata dokun → büyük harita (yakınlaştırma Menü'de ve Z tuşunda)
  coord.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); try { toggle('bigmap'); } catch (er) { } });

  // ---------- SOL ----------
  btn('h2chat', 'i_talk', 'Sohbet', () => toggleChat(true)).classList.add('h3gone');
  $id('h2soc').classList.add('h3gone');
  btn('h2char', 'i_star', 'Karakter', () => toggle('char'));
  btn('h2equip', 'i_shield', 'Ekipman', () => toggle('inv'));
  // ---------- SAĞ ----------
  btn('h2quick', 'i_wrench', 'Hızlı', () => { const b = $id('sl_bag'); if (b && b.onclick) b.onclick(); else toggle('inv'); });
  const petB = el('h2pet', 'h2p h2b', '<img class="px" src="na/pet_fox.png" style="width:calc(54*var(--u));height:calc(48*var(--u));object-fit:cover;object-position:left" alt=""><span class="lab">Pet</span>');
  petB.addEventListener('pointerdown', e => { e.preventDefault(); petB.classList.add('pressed'); setTimeout(() => petB.classList.remove('pressed'), 120); const b = $id('sl_pt'); if (b && b.onclick) b.onclick(); else if (typeof openExtra === 'function') openExtra('my'); });
  const skB = btn('h2skill', 'i_burst', 'Yetenek', () => toggle('skills'));
  const skCd = document.createElement('div'); skCd.className = 'cdv h2t'; skCd.style.display = 'none'; skB.appendChild(skCd);
  // v46: Hızlı / Pet / Yetenek düğmeleri menüye taşındı (menüde Çanta, Pet, Yetenek Ağacı yuvaları var)
  for (const e of [$id('h2quick'), petB, skB]) e.classList.add('h3gone');
  // v46: sağ sütun = 3 yetenek (kalan saniye üstünde) + Saldırı + en altta Köye Dön
  const skCells = [0, 1, 2].map(i => el('h2sk' + i, 'h2p h2b h3sk'));
  const townB = el('h2town', 'h2p h2b h3town', I('sk_m9') + '<span class="lab">Köye Dön</span><div class="cdv h2t" style="display:none"></div>');
  townB.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); townB.classList.add('pressed'); setTimeout(() => townB.classList.remove('pressed'), 120); if (window.kdTown) kdTown(); });

  // ---------- ALT ----------
  const inv = el('h2inv', 'h2p h3gone');
  // v47: alt çubuk yok. Can / mana iksiri sağ sütunda Köye Dön'ün altında (küçük), kaçış Saldırı'nın solunda.
  const INV_ORDER = ['sl_ph', 'sl_pm', 'dodgeBtn'];
  const cells = [el('h2potH', 'h2p h3pot hp'), el('h2potM', 'h2p h3pot mp'), el('h2dodge', 'h3dodge')];
  const POT_IMG = { sl_ph: 'ii_LifePot', sl_pm: 'ii_WaterPot' };
  // menü listesi: simge + ad + açıklama
  const MENU = [
    ['sl_bc', 'i_star', 'Karakter', 'Özellik puanları ve istatistikler'],
    ['sl_bi', 'ii_Bag', 'Çanta', 'Ekipman ve eşyalar'],
    ['sl_bag', 'ii_Chest', 'Malzemeler', 'Parşömen, taş ve kaynaklar'],
    ['sl_bk', 'i_burst', 'Yetenekler', 'PvE ve PvP yetenek setleri'],
    ['sl_pt', 'pet_fox', 'Pet ve Binek', 'Yoldaşını çağır, bineğini seç'],
    ['sl_rd', 'mt_horse', 'Bin / İn', 'Seçili bineğine bin'],
    ['sl_bm', 'ii_Scroll', 'Büyük Harita', 'Bölgeler, geçitler, bosslar'],
    ['sl_town', 'sk_m9', 'Köye Dön', '5 sn ışınlanma'],
    ['sl_sv', 'i_cog', 'Kaydet', 'Oyunu şimdi kaydet'],
    ['sl_gm', 'i_wrench', 'GM Paneli', 'Yönetici araçları'],
  ];
  const MENU_ID = {}; MENU.forEach((m, i) => MENU_ID[m[0]] = i);

  // ---------- sohbet ----------
  function toggleChat(focus) {
    const c = $id('chat'); if (!c) return; c.classList.remove('h2hide');
    const i = $id('chatin'); if (i) setTimeout(() => i.focus(), 30);
  }

  // ---------- mevcut öğeleri yeni yerlerine taşı ----------
  function relocate() {
    INV_ORDER.forEach((id, i) => { const e = $id(id); const c = cells[i]; if (e) { e.className = e.className.replace(/\bpad_\w+/g, '').replace(/\bhidden\b/g, ''); if (e.parentNode !== c) { c.innerHTML = ''; c.appendChild(e); } c.classList.remove('empty');
      if (POT_IMG[id] && !e.querySelector('.h3pi')) { const im = document.createElement('img'); im.className = 'h3pi'; im.src = 'na/' + POT_IMG[id] + '.png'; im.alt = ''; e.insertBefore(im, e.firstChild); e.classList.add('h3potslot'); } } });
    skCells.forEach((c, i) => { const e = $id('sl_s' + i); if (e) { e.className = e.className.replace(/\bpad_\w+/g, '').replace(/\bhidden\b/g, ''); if (e.parentNode !== c) { c.innerHTML = ''; c.appendChild(e); } } });
    const grid = menuPop.querySelector('.grid');
    for (const src of ['bar', 'sideL', 'sideR', 'actPad']) { const s = $id(src); if (!s) continue; for (const e of [...s.querySelectorAll('.slot')]) { if (INV_ORDER.includes(e.id) || /^sl_s[012]$/.test(e.id)) continue; e.className = e.className.replace(/\bpad_\w+/g, '');
      for (const old of [...grid.querySelectorAll('.slot')]) if (old !== e && old.id && old.id === e.id) old.remove(); // v47: eski kopyayı sil (menüde çift görünmesin)
      grid.appendChild(e); } }
    menuRows();
    const qb = $id('questbox'); if (qb && qb.parentNode !== qPanel) qPanel.appendChild(qb);
    const mb = $id('mapbox'); const mw = menuPop.querySelector('.mapw'); if (mb && mb.parentNode !== mw) mw.appendChild(mb);
    const ch = $id('chat'); if (ch) { ch.classList.add('h2chat'); ch.classList.remove('h2hide'); chatBand(ch); }
  }
  // v47: menü = liste (küçük simge + ne işe yaradığını söyleyen ad), sıralı
  function menuRows() {
    const grid = menuPop.querySelector('.grid'); if (!grid) return;
    for (const e of [...grid.children]) {
      if (!e.classList.contains('slot')) continue;
      const m = MENU[MENU_ID[e.id]];
      if (!e.querySelector('.h3ml')) {
        const lab = m ? m[2] : (e.getAttribute('title') || (e.textContent || '').replace(/\s+/g, ' ').trim() || 'Seçenek');
        const ic = document.createElement('img'); ic.className = 'h3mi'; ic.alt = ''; ic.src = 'na/' + (m ? m[1] : 'i_star') + '.png';
        const tx = document.createElement('span'); tx.className = 'h3ml'; tx.innerHTML = '<b></b><small></small>'; tx.firstChild.textContent = lab; tx.lastChild.textContent = m ? m[3] : '';
        e.insertBefore(tx, e.firstChild); e.insertBefore(ic, e.firstChild); e.classList.add('h3row');
      }
      e.style.order = m ? MENU_ID[e.id] : 50;
      // v52: ekranda kendi düğmesi olanlar menüde tekrar edilmez (Köye Dön: sağ sütun, Çanta/Karakter: sol alt, Harita: koordinat)
      e.classList.toggle('h3gone', ['sl_town', 'sl_bi', 'sl_bc', 'sl_bm'].includes(e.id));
    }
  }
  // v47: sohbet bandı — son satırlar + her zaman açık yazma kutusu + gönder
  function chatBand(ch) {
    if (ch.querySelector('.h3send')) return;
    const b = document.createElement('button'); b.className = 'h3send'; b.type = 'button'; b.textContent = '➤';
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const i = $id('chatin'); if (i && i.value.trim() && typeof sendChat === 'function') { sendChat(); } else if (i) i.focus(); });
    ch.appendChild(b);
    const i = $id('chatin'); if (i) { i.placeholder = 'Sohbet… (dokun ve yaz)'; i.addEventListener('focus', () => ch.classList.add('h3open')); i.addEventListener('blur', () => setTimeout(() => ch.classList.remove('h3open'), 150)); }
  }
  if (typeof buildBar === 'function') { const _bb = buildBar; buildBar = function () { _bb.apply(this, arguments); relocate(); layout(); }; }

  // ---------- yerleşim (tasarım birimi u + güvenli alan) ----------
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(probe);
  let U = 1, S = { t: 0, r: 0, b: 0, l: 0 };
  // ax: 'l' sol kenar, 'r' sağ kenar, 'c' yatay orta; ay: 't' üst, 'b' alt
  function place(e, x, y, w, h, ax, ay) {
    if (!e) return; const st = e.style;
    st.width = (w * U) + 'px'; if (h != null) st.height = (h * U) + 'px';
    st.left = st.right = st.top = st.bottom = '';
    if (ax === 'l') st.left = (S.l + x * U) + 'px';
    else if (ax === 'r') st.right = (S.r + (DW - x - w) * U) + 'px';
    else st.left = ((innerWidth - w * U) / 2) + 'px';
    if (ay === 't') st.top = (S.t + y * U) + 'px'; else st.bottom = (S.b + (DH - y - (h || 0)) * U) + 'px';
  }
  function layout() {
    const cs = getComputedStyle(probe);
    S = { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
    const aw = innerWidth - S.l - S.r, ah = innerHeight - S.t - S.b;
    U = Math.max(.35, Math.min(aw / DW, ah / 1150, 1.25));
    root.style.setProperty('--u', U + 'px'); document.documentElement.style.setProperty('--u', U + 'px');
    window.HUD_U = U; if (window.naFitZoom) naFitZoom();
    // tasarım koordinatları: şartnameden; güvenli alan içine yerleşir
    // v46: sol üst köşeye sıkıştırılmış blok (portre + yanında Sv/Can, altında Saldırı|Savunma)
    place(por, 8, 8, 92, 92, 'l', 't');
    place(lvl, 106, 8, 168, 30, 'l', 't');
    place(hp, 106, 42, 168, 58, 'l', 't');
    place(atk, 8, 106, 131, 42, 'l', 't');
    place(def, 143, 106, 131, 42, 'l', 't');
    // v47 sağ üst: [koordinat][menü] / altında [altın][görev simgesi] — sağa yaslı, simetrik iki sütun
    place(coord, 486, 14, 142, 70, 'r', 't');
    place($id('h2menu'), 636, 14, 77, 70, 'r', 't');
    place(gold, 486, 92, 142, 46, 'r', 't');
    place(quest, 636, 92, 77, 46, 'r', 't');
    place(qPanel, 393, 146, 320, null, 'r', 't');
    place(menuPop, 0, 180, 560, null, 'c', 't');
    place($id('target'), 279, 24, 180, null, 'c', 't'); // hedef can barı: üst orta, kısa (portre ile sosyal düğmesi arası)
    // sol / sağ sütunlar ve alt çubuk: alta sabit
    // v47 sol: yalnız Karakter + Ekipman (küçük)
    // v48 sol alt köşe: küçük Karakter + Çanta (PvP'de de görünür)
    place($id('joy'), 12, 1268, 150, 150, 'l', 'b');
    place($id('h2char'), 10, 1438, 76, 76, 'l', 'b');
    place($id('h2equip'), 92, 1438, 76, 76, 'l', 'b');
    // v47 sağ sütun (yukarıdan aşağı): 3 yetenek, Saldırı, Köye Dön, iksirler (can | mana)
    place(skCells[0], 629, 940, 96, 96, 'r', 'b');
    place(skCells[1], 629, 1042, 96, 96, 'r', 'b');
    place(skCells[2], 629, 1144, 96, 96, 'r', 'b');
    place($id('atkBtn'), 619, 1246, 106, 106, 'r', 'b');
    place(townB, 629, 1358, 96, 96, 'r', 'b');
    // v48: iksir düğmeleri kalktı (otomatik iksir var; Q/E tuşları çalışır)
    cells[0].classList.add('h3gone'); cells[1].classList.add('h3gone');
    // v49: kaçış (ileri atılma) kalktı; ayrı PvP seti düğmesi yok → tek MOD düğmesi (OTO/PVE/PVP)
    cells[2].classList.add('h3gone'); const ks = $id('kdSet'); if (ks) ks.classList.add('h3gone'); const ko = $id('kdOto'); if (ko) ko.classList.add('h3gone');
    place($id('kdMode'), 629, 846, 96, 86, 'r', 'b');
    place($id('kdModePop'), 433, 760, 188, 172, 'r', 'b');
    // v49: parti komutları sağ altta 3 eşit ikon (SALDIR / BEKLE / KAÇ)
    place($id('kdCmd'), 380, 1494, 345, 98, 'r', 'b'); // v53: büyük komut ikonları
    // v47 alt: yalnız sohbet bandı
    place($id('chat'), 8, 1530, 360, 62, 'l', 'b'); // v53: sohbet yarım genişlik
    const k = $id('knob'); if (k) { k.style.width = k.style.height = (64 * U) + 'px'; k.style.left = k.style.top = (43 * U) + 'px'; k.style.position = 'absolute'; k.style.margin = '0'; }
    const t = $id('tut'); if (t) t.style.top = (S.t + 470 * U) + 'px';
  }
  addEventListener('resize', layout); window.kdLayout = layout;

  // ---------- kamera: karakter ekranda Y≈850/1600, yumuşak takip ----------
  if (typeof updateCamera === 'function') {
    const _uc = updateCamera; let cx = null, cy = null, lastMap = null;
    updateCamera = function () {
      _uc.apply(this, arguments);
      if (typeof M === 'undefined' || !M) return;
      const Z = ZOOM, vw = VW / Z, vh = VH / Z, sc = RS * Z, q = v => Math.round(v * sc) / sc;
      let tx = camX, ty = camY - (850 / DH - .5) * vh;
      ty = Math.max(0, Math.min(Math.max(0, M.H * TILE - vh), ty));
      if (cx === null || lastMap !== M || Math.hypot(tx - cx, ty - cy) > 400) { cx = tx; cy = ty; lastMap = M; }
      else { cx += (tx - cx) * .22; cy += (ty - cy) * .22; }
      camX = q(cx); camY = q(cy);
    };
  }

  // ---------- canlı güncelleme ----------
  const last = {};
  function setT(sel, v) { const e = typeof sel === 'string' ? root.querySelector(sel) : sel; if (e && last[sel] !== v) { e.textContent = v; last[sel] = v; } }
  function setW(e, f) { if (e) e.style.width = 'calc((100% - ' + (4 * U) + 'px) * ' + Math.max(0, Math.min(1, f)).toFixed(4) + ')'; }
  let lastHp = null;
  function tick() {
    requestAnimationFrame(tick);
    const on = typeof running !== 'undefined' && running && typeof player !== 'undefined' && player;
    root.classList.toggle('off', !on); if (!on) return;
    const p = player, s = p.stats || {};
    // portre (zırh/çıplak durumuna göre)
    if (window.naHeroChar && typeof heroLook === 'function') { const n = naHeroChar(heroLook(p)); if (last.por !== n) { por.querySelector('img').src = 'na/f_' + n + '.png'; last.por = n; } }
    setT('#h2por .lv', String(p.lvl));
    const need = typeof xpNeed === 'function' ? xpNeed(p.lvl) : 1, xf = p.lvl >= (typeof MAXL !== 'undefined' ? MAXL : 99) ? 1 : (p.xp || 0) / need;
    setT('#h2lvl .a', 'Sv ' + p.lvl); setT('#h2lvl .b', '%' + Math.floor(xf * 100));
    setW(root.querySelector('#h2lvl .fl'), xf); setW(root.querySelector('#h2lvl .gh'), xf);
    const hf = (p.hp || 0) / (s.maxHp || 1);
    setT('#h2hp .b .cu', Math.ceil(p.hp) + '/');
    setW(root.querySelector('#h2hp .hp .fl'), hf); setW(root.querySelector('#h2hp .hp .gh'), hf);
    setW(root.querySelector('#h2hp .mp .fl'), (p.mp || 0) / (s.maxMp || 1)); setW(root.querySelector('#h2hp .mp .gh'), (p.mp || 0) / (s.maxMp || 1));
    if (lastHp !== null && p.hp < lastHp - .5) { hp.classList.remove('h2hit'); void hp.offsetWidth; hp.classList.add('h2hit'); }
    const tg = p.target, tEl = $id('target'); if (tg && tEl) { if (last.tgObj === tg && tg.hp < last.tgHp - .5) { tEl.classList.remove('h2shake'); void tEl.offsetWidth; tEl.classList.add('h2shake'); } last.tgObj = tg; last.tgHp = tg.hp; }
    lastHp = p.hp;
    // v46: buff → yeşil + değer yükselerek; zehir/lanet → kırmızı + değer düşerek (animasyonlu)
    const now = performance.now(), fdt = Math.min(.1, (now - (last.fT || now)) / 1000); last.fT = now;
    const md = { atk: 0, def: 0, hp: 0 }, gt = typeof gameTime !== 'undefined' ? gameTime : 0;
    if (p.buffs) for (const id in p.buffs) { const b = p.buffs[id]; if (!b || !b.mods || b.until <= gt) continue; const m = b.mods;
      md.atk += (m.atkP || 0) + Math.sign(m.atk || 0) * .1 + (m.critDmg || 0) * .2;
      md.def += (m.defP || 0) + Math.sign(m.def || 0) * .1 + (m.dmgRed || 0) + (m.dodge || 0) * .5;
      md.hp += (m.hpP || 0) + Math.sign(m.maxHp || 0) * .1 + (m.regen ? .1 : 0) + (m.lifesteal ? .05 : 0); }
    if (p.kdPoison && p.kdPoison.until > gt) md.hp -= 1;
    const mood = (e, v) => { e.classList.toggle('h3up', v > .001); e.classList.toggle('h3dn', v < -.001); };
    mood(hp, md.hp); mood(atk, md.atk); mood(def, md.def);
    const tw = (k, e, sel, v) => {
      v = Math.round(v || 0); if (last['tw' + k] === undefined) last['tw' + k] = v;
      const prev = last['tg' + k]; if (prev !== undefined && prev !== v && last.fMap === M) { e.classList.remove('h3fu', 'h3fd'); void e.offsetWidth; e.classList.add(v > prev ? 'h3fu' : 'h3fd'); }
      last['tg' + k] = v; let c = last['tw' + k]; c += (v - c) * Math.min(1, fdt * 7); if (Math.abs(v - c) < .6) c = v; last['tw' + k] = c;
      setT(sel, String(Math.round(c)));
    };
    tw('a', atk, '#h2atk .b', s.atk); tw('d', def, '#h2def .b', s.def);
    tw('h', hp, '#h2hp .mx', s.maxHp);
    last.fMap = M;
    // PvP: sade arayüz (sohbet/karakter/ekipman/görev/altın gizli, hepsi menüde)
    const pvp = !!(typeof M !== 'undefined' && M && M.pvp); root.classList.toggle('h3pvp', pvp); document.body.classList.toggle('h3pvp', pvp);
    // Köye Dön düğmesi: ışınlanırken kalan saniye
    { const c = townB.querySelector('.cdv'), left = window.kdTownLeft ? kdTownLeft() : 0; c.style.display = left > 0 ? 'flex' : 'none'; if (left > 0) setT(c, left.toFixed(1)); townB.classList.toggle('on', left > 0); }
    setT('#h2gold span', (p.gold || 0).toLocaleString('tr-TR'));
    { const qb = $id('questbox'), qt = qb ? qb.textContent : ''; if (!quest.classList.contains('open') && qt && qt !== qSeen) quest.classList.add('new'); }
    setT('#h2coord .c', 'X ' + Math.floor(p.x / TILE) + '  Y ' + Math.floor(p.y / TILE));
    const d = new Date(); setT('#h2coord .t', String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'));
    setT('#h2coord .z', '🔍 ' + ZN[zi]);
    // yetenek düğmesi: en yakın bekleme süresi
    let cd = 0; if (p.act && p.cds && typeof gameTime !== 'undefined') for (const id of p.act) if (id) { const r = (p.cds[id] || 0) - gameTime; if (r > 0 && (cd === 0 || r < cd)) cd = r; }
    skCd.style.display = cd > 0 ? 'flex' : 'none'; if (cd > 0) setT(skCd, String(Math.ceil(cd)));
    // joystick sadece dokunmatikte
    const j = $id('joy'); if (j) j.classList.toggle('hidden', !(typeof touchUI !== 'undefined' && touchUI));
    const a = $id('atkBtn'); if (a) a.classList.remove('hidden');
  }

  // ---------- KLAVYE: yeni HUD düğmelerinin kısayolları (eski kısayollar aynen çalışır) ----------
  // O sosyal/sohbet, J görev paneli, Z yakınlaştırma, Esc (açık pencere yoksa) menü
  // Esc önce açık pencereyi kapatır; aynı tuşta menü açılmaz (dinleyici sırası ne olursa olsun)
  let closedAt = -1e9;
  if (typeof closeAll === 'function') { const _ca = closeAll; closeAll = function () { if (anyWinOpen()) closedAt = performance.now(); return _ca.apply(this, arguments); }; }
  const anyWinOpen = () => [...document.querySelectorAll('.win')].some(w => !w.classList.contains('hidden') && w.getClientRects().length > 0 && getComputedStyle(w).display !== 'none');
  addEventListener('keydown', e => {
    if (typeof running === 'undefined' || !running || !player) return;
    const ae = document.activeElement; if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
    const k = (e.key || '').toLowerCase();
    if (k === 'enter') { const c = $id('chat'); if (c) c.classList.remove('h2hide'); const ci = $id('chatin'); if (ci) ci.focus(); return; }
    if (k === 'escape') { if (menuPop.classList.contains('open')) { menuPop.classList.remove('open'); e.stopImmediatePropagation(); } else if (!anyWinOpen() && performance.now() - closedAt > 80) { menuPop.classList.add('open'); e.stopImmediatePropagation(); } return; }
    if (e.repeat) return;
    if (k === 'o') { e.preventDefault(); toggleChat(true); }
    else if (k === 'j') toggleQuest();
    else if (k === 'z') { zi = (zi + 1) % 3; window.ZOOM_LV = ZL[zi]; if (window.naFitZoom) naFitZoom(); }
  }, true);
  // kısayol etiketleri (fareli cihazda görünür)
  const KEYS = { h2soc: 'O', h2menu: 'Esc', h2chat: 'Enter', h2char: 'C', h2equip: 'I', h2quick: 'U', h2pet: 'P', h2skill: 'K', atkBtn: 'Space', h2quest: 'J', h2coord: 'Z', h2town: 'T' };
  for (const id in KEYS) { const e = $id(id); if (e && !e.querySelector('.kk')) { const s = document.createElement('span'); s.className = 'kk'; s.textContent = KEYS[id]; e.appendChild(s); } }

  // başlat
  function boot() { relocate(); layout(); }
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function () { const r = _sg.apply(this, arguments); setTimeout(boot, 0); return r; }; window.startGame = startGame; }
  boot(); requestAnimationFrame(tick);
})();
