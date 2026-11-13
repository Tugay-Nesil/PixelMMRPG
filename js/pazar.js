'use strict';
// =====================================================================
//  PAZAR YERİ + AFK PAZAR + TİCARET SERVİSİ (Sürüm 50)
//  • Yeşilvadi'nin güneyindeki Pazar Yeri’nde 24 numaralı tezgâh (ızgara). Bir tezgâhı
//    aynı anda yalnız BİR satıcı kullanır; kimse başkasının tezgâhını işgal edemez.
//  • Satıcının başında sattığı ilk 3 eşyanın simgesi + pazar adı görünür.
//  • Pazar kur: eşya seç, miktar ve fiyat gir, pazara ad ver, toplamı gör, aç.
//    Açık pazarın sahibi tezgâhta sabit kalır; alıcılar gelip alışveriş yapar.
//  • AFK Pazar (İnci Dükkânı): oyundan çıksan da satış sürer (en çok 12 saat birikir).
//    AFK Pazar yoksa oyundan çıkınca pazar kapanır, eşyalar çantana döner.
//  • TİCARET SERVİSİ (TX): para / eşya / çanta yeri kontrolü, kilit (çift satış yok),
//    atomik aktarım (hata olursa geri alınır), ticaret geçmişi.
//    Gerçek çok oyunculu sürümde bu kurallar sunucuda çalıştırılmalıdır.
//  • Enflasyon frenleri: satışta %5 pazar vergisi, açılışta %1 tezgâh ücreti (altın oyundan çıkar).
// =====================================================================
(function () {
  const P = () => (typeof player !== 'undefined' ? player : null);
  const esc2 = t => typeof esc === 'function' ? esc(String(t)) : String(t);
  const TAX = .05, FEE = .01, MAXL = 12, AFK_CAP_H = 12;
  const NAMES = ['TradeKing', 'GoldPouch', 'LootMerchant', 'CopperSmith', 'SilkRoad', 'ShinyGems', 'BargainBob', 'EpicDeals', 'RuneVendor', 'MysticShop', 'IronMonger', 'PotionPete', 'RareFinds', 'CoinCollector'];
  window.KD_SELLER_NAMES = NAMES;
  const SHOP_N = ['Ucuz Ekipman', 'Kaliteli Zırhlar', 'Parşömenci', 'Silah Dükkânı', 'Her Şey Burada', 'Başlangıç Seti', 'Nadir Eşyalar', 'Kervan Malları', 'Usta İşi', 'Fırsat Tezgâhı', 'Takı & Yüzük'];
  let STALLS = [], lid = 1;
  const bagCap = () => (typeof bagSlots === 'function' ? bagSlots() : 40);
  const fair = e => e.kind === 'gear' ? Math.round(itemPrice(e.it) * 1.6) : Math.round((MATS[e.mat] ? MATS[e.mat].price : 50) * 1.4);
  const ename = e => e.kind === 'gear' ? itemName(e.it) : (MATS[e.mat] ? MATS[e.mat].n : e.mat);
  const eicon = e => e.kind === 'gear' ? (ICONS[e.it.slot] && ICONS[e.it.slot][e.it.cls] || '📦') : (MATS[e.mat] ? MATS[e.mat].ic : '📦');
  const eiconHTML = e => e.kind === 'gear' ? '<div class="it g' + e.it.grade + '">' + itemIcon(e.it) + (e.it.plus ? '<span class="pl">+' + e.it.plus + '</span>' : '') + '</div>' : '<div class="it g0"><span style="font-size:22px">' + eicon(e) + '</span></div>';
  if (typeof SAVE_FIELDS !== 'undefined') SAVE_FIELDS.push('kdShop', 'kdShopAt', 'tradeLog');

  // ---------------- ticaret servisi ----------------
  function logTx(r) { const p = P(); p.tradeLog = p.tradeLog || []; p.tradeLog.unshift(Object.assign({ t: Date.now() }, r)); if (p.tradeLog.length > 80) p.tradeLog.length = 80; }
  const TX = {
    // alıcı (oyuncu) bir tezgâhtan satın alır
    buy(st, id, qty) {
      const p = P(), sh = st && st.shop; if (!p || !sh) return { ok: false, err: 'Pazar kapalı' };
      if (sh.owner === 'player') return { ok: false, err: 'Kendi pazarından alamazsın' };
      const e = sh.items.find(x => x.lid === id); if (!e || e.qty <= 0) return { ok: false, err: 'Bu ürün artık satılmıyor' };
      if (e.lock) return { ok: false, err: 'Bu ürün şu an başka bir işlemde' };
      qty = Math.max(1, Math.min(e.qty, Math.floor(qty || 1))); const cost = e.price * qty;
      if (p.gold < cost) return { ok: false, err: 'Yetersiz altın (' + p.gold + '/' + cost + ')' };
      if (e.kind === 'gear' && p.inv.length >= bagCap()) return { ok: false, err: 'Çantan dolu' };
      e.lock = true; const snap = { gold: p.gold, invLen: p.inv.length, mat: e.kind === 'mat' ? p.mats[e.mat] || 0 : 0, qty: e.qty, items: sh.items.slice() };
      try {
        p.gold -= cost; if (e.kind === 'gear') p.inv.push(e.it); else p.mats[e.mat] = (p.mats[e.mat] || 0) + qty;
        e.qty -= qty; if (e.qty <= 0) sh.items.splice(sh.items.indexOf(e), 1);
        sh.earned = (sh.earned || 0) + cost;
        logTx({ type: 'al', who: sh.ownerName, what: ename(e), qty, gold: -cost });
        try { save(); } catch (er) { }
        return { ok: true, cost, name: ename(e) };
      } catch (ex) { // geri al
        p.gold = snap.gold; if (e.kind === 'gear') p.inv.length = snap.invLen; else p.mats[e.mat] = snap.mat; e.qty = snap.qty; sh.items = snap.items;
        return { ok: false, err: 'İşlem geri alındı' };
      } finally { e.lock = false; }
    },
    // oyuncunun pazarından (botlar) satın alma
    sell(st, e, qty, buyer) {
      const p = P(), sh = st.shop; if (!sh || sh.owner !== 'player' || e.lock || !sh.items.includes(e)) return false;
      e.lock = true; try { qty = Math.max(1, Math.min(e.qty, qty)); const gross = e.price * qty, tax = Math.ceil(gross * TAX), net = gross - tax;
        e.qty -= qty; if (e.qty <= 0) sh.items.splice(sh.items.indexOf(e), 1); p.gold += net; sh.earned = (sh.earned || 0) + net; sh.sold = (sh.sold || 0) + 1;
        logTx({ type: 'sat', who: buyer, what: ename(e), qty, gold: net, tax });
        return { net, tax, name: ename(e), qty }; } finally { e.lock = false; }
    },
  };
  window.kdTX = TX;

  // ---------------- tezgâhlar / satıcılar ----------------
  function botItems(lv) {
    const L = [], n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      if (Math.random() < .65) { const it = makeItem(pick(DROP_SLOTS), Math.max(1, lv + Math.floor(rr(-3, 4))), gradeRoll(Math.random() < .2 ? 1 : 0), pick(Object.keys(CLASSES))); if (Math.random() < .25) it.plus = Math.floor(rr(1, 5)); L.push({ lid: lid++, kind: 'gear', it, qty: 1, price: 0 }); }
      else { const k = pick(['up', 'up', 'prot', 'up', 'prot']); L.push({ lid: lid++, kind: 'mat', mat: k, qty: Math.floor(rr(2, 9)), price: 0 }); }
    }
    for (const e of L) e.price = Math.max(5, Math.round(fair(e) * rr(.75, 1.35) / (e.kind === 'mat' ? 1 : 1)));
    return L;
  }
  function setup() {
    STALLS = []; if (typeof M === 'undefined' || !M || !M.stalls) return;
    const used = new Set();
    for (const s of M.stalls) STALLS.push({ id: s.id, x: s.x, y: s.y, shop: null, seller: null });
    const k = Math.max(1, Math.min(Math.round(STALLS.length * .36), STALLS.length - 10)); const idx = STALLS.map((_, i) => i).sort(() => Math.random() - .5).slice(0, k);
    idx.forEach((i, j) => { const st = STALLS[i]; const nm = NAMES[j % NAMES.length] + (j >= NAMES.length ? '_' + (Math.floor(j / NAMES.length) + 1) : ''); const b = makeBot(nm, 100 + j, 'neutral', Math.floor(rr(5, 26)), st.x, st.y - 4); b.face = 1; b.dir = 'front';
      st.seller = b; st.shop = { owner: 'bot', ownerName: nm, name: SHOP_N[j % SHOP_N.length], items: botItems(b.lvl), earned: 0 }; });
    // oyuncunun kayıtlı pazarı
    const p = P(); if (p && p.kdShop) restoreShop(p);
  }
  window.kdStalls = () => STALLS;
  // stokları zaman zaman yenile (satılanın yerine yeni mal)
  let restockT = 120;

  // ---------------- oyuncu pazarı ----------------
  let myStall = null;
  function nearStall(p, r) { let b = null, bd = r || 40; for (const s of STALLS) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; b = s; } } return b; }
  function openMyShop(st, name, list) {
    const p = P(); if (!p || !st) return { ok: false, err: 'Tezgâh yok' };
    if (st.shop) return { ok: false, err: 'Bu tezgâh dolu — boş bir tezgâh seç' };
    if (myStall) return { ok: false, err: 'Zaten açık bir pazarın var' };
    if (!list.length) return { ok: false, err: 'En az bir ürün ekle' };
    for (const e of list) { if (!(e.price >= 1)) return { ok: false, err: 'Her ürüne fiyat gir' }; if (e.kind === 'gear' && !p.inv.includes(e.it)) return { ok: false, err: 'Eşya çantanda değil' }; if (e.kind === 'mat' && (p.mats[e.mat] || 0) < e.qty) return { ok: false, err: 'Yeterli ' + ename(e) + ' yok' }; }
    const total = list.reduce((a, e) => a + e.price * e.qty, 0), fee = Math.max(5, Math.ceil(total * FEE)); if (p.gold < fee) return { ok: false, err: 'Tezgâh ücreti için altın yetmiyor (' + fee + ')' };
    // emanete al (atomik)
    const snapInv = p.inv.slice(), snapMats = Object.assign({}, p.mats), g0 = p.gold;
    try { for (const e of list) { if (e.kind === 'gear') p.inv.splice(p.inv.indexOf(e.it), 1); else p.mats[e.mat] -= e.qty; e.lid = lid++; }
      p.gold -= fee; st.shop = { owner: 'player', ownerName: p.name, name: (name || p.name + '\'in Pazarı').slice(0, 24), items: list, earned: 0, sold: 0 }; myStall = st;
      p.x = st.x; p.y = st.y - 4; p.moveTo = null; p.chase = false; p.target = null; if (p.riding) { p.riding = false; try { recalc(p); } catch (e) { } }
      persist(); logTx({ type: 'aç', who: '-', what: st.shop.name + ' (' + list.length + ' ürün)', qty: 0, gold: -fee });
      addChat(null, '🏪 Pazarın açıldı: "' + st.shop.name + '" — tezgâh #' + st.id + ' (ücret ' + fee + ' altın).', '#ffd65a'); try { save(); } catch (e) { } return { ok: true, fee };
    } catch (ex) { p.inv = snapInv; p.mats = snapMats; p.gold = g0; st.shop = null; myStall = null; return { ok: false, err: 'Pazar açılamadı, geri alındı' }; }
  }
  function closeMyShop(silent) {
    const p = P(), st = myStall; if (!p || !st || !st.shop) return; const sh = st.shop; let back = 0, kept = [];
    for (const e of sh.items) { if (e.kind === 'gear') { if (p.inv.length < bagCap()) { p.inv.push(e.it); back++; } else kept.push(e); } else { p.mats[e.mat] = (p.mats[e.mat] || 0) + e.qty; back++; } }
    if (kept.length) { sh.items = kept; if (!silent) showToast('Çanta dolu', kept.length + ' eşya tezgâhta kaldı — yer açıp tekrar kapat', 2.2); persist(); return; }
    if (!silent) addChat(null, '🏪 Pazarın kapandı. ' + back + ' ürün çantana döndü. Toplam kazanç: ' + (sh.earned || 0) + ' altın.', '#ffd65a');
    st.shop = null; myStall = null; p.kdShop = null; try { save(); } catch (e) { }
  }
  function persist() { const p = P(); if (!p || !myStall) return; p.kdShop = { stall: myStall.id, name: myStall.shop.name, items: myStall.shop.items.map(e => ({ kind: e.kind, it: e.it, mat: e.mat, qty: e.qty, price: e.price })), earned: myStall.shop.earned || 0 }; p.kdShopAt = Date.now(); }
  function restoreShop(p) {
    const s = p.kdShop; if (!s) return; const st = STALLS.find(x => x.id === s.stall && !x.shop) || STALLS.find(x => !x.shop); if (!st) return;
    st.shop = { owner: 'player', ownerName: p.name, name: s.name, items: s.items.map(e => Object.assign({ lid: lid++ }, e)), earned: s.earned || 0, sold: 0 }; myStall = st;
    const afk = window.kdPremActive && kdPremActive('afkpazar');
    if (!afk) { closeMyShop(true); addChat(null, '🏪 AFK Pazar özelliğin olmadığı için pazarın kapatıldı, eşyalar çantana döndü. (İnci Dükkânı → AFK Pazar)', '#ffb070'); return; }
    // çevrimdışı satış simülasyonu (en çok 12 saat)
    const hrs = Math.min(AFK_CAP_H, Math.max(0, (Date.now() - (p.kdShopAt || Date.now())) / 3600000)); let net = 0, n = 0;
    for (const e of st.shop.items.slice()) { const ph = buyChance(e) * 6; const P2 = 1 - Math.pow(1 - Math.min(.9, ph), hrs); if (Math.random() < P2) { const r = TX.sell(st, e, e.kind === 'mat' ? e.qty : 1, pick(NAMES)); if (r) { net += r.net; n++; } } }
    p.x = st.x; p.y = st.y - 4;
    if (n) setTimeout(() => { try { showToast('Sen yokken ' + n + ' satış!', '+' + net + ' altın (vergi düşüldü)', 3); addChat(null, '💰 AFK Pazar: sen yokken ' + n + ' ürün satıldı, +' + net + ' altın.', '#ffd65a'); } catch (e) { } }, 1200);
    persist();
  }
  // alıcı olasılığı: pahalıysa az, ucuzsa çok satılır
  function buyChance(e) { const r = e.price / Math.max(1, fair(e)); return Math.max(.02, Math.min(.6, (1.5 - r) * .4)); }
  window.kdOpenMyShop = (stallId, name, list) => openMyShop(STALLS.find(s => s.id === stallId), name, list);
  window.kdCloseMyShop = closeMyShop; window.kdMyStall = () => myStall;

  // ---------------- her kare ----------------
  let buyerT = 20;
  function tick(dt) {
    const p = P(); if (!p || typeof M === 'undefined' || !M || !M.stalls) return;
    if (myStall) { // satıcı tezgâhta sabit
      if (Math.hypot(p.x - myStall.x, p.y - (myStall.y - 4)) > 6) { p.x = myStall.x; p.y = myStall.y - 4; } p.moveTo = null; p.chase = false; p.moving = false;
      buyerT -= dt; if (buyerT <= 0) { buyerT = rr(15, 40); const sh = myStall.shop; if (sh && sh.items.length) { const e = pick(sh.items); if (Math.random() < buyChance(e)) { const who = pick(NAMES.concat(typeof BOT_NAMES !== 'undefined' ? BOT_NAMES : [])); const r = TX.sell(myStall, e, e.kind === 'mat' ? Math.max(1, Math.ceil(e.qty * Math.random())) : 1, who);
        if (r) { addChat(null, '💰 ' + who + ' pazarından ' + (r.qty > 1 ? r.qty + 'x ' : '') + r.name + ' aldı: +' + r.net + ' altın (vergi ' + r.tax + ').', '#ffd65a'); try { showToast('Satış!', r.name + ' • +' + r.net + ' altın', 1.8); fl(p.x, p.y - 96, '+' + r.net + ' 🪙', '#ffd65a', 16); } catch (er) { } persist(); try { save(); } catch (er) { } } } }
        if (sh && !sh.items.length) { addChat(null, '🏪 Pazarındaki her şey satıldı!', '#ffd65a'); closeMyShop(true); } } }
    restockT -= dt; if (restockT <= 0) { restockT = rr(120, 240); const st = pick(STALLS.filter(s => s.shop && s.shop.owner === 'bot')); if (st && st.shop.items.length < 6) st.shop.items.push(...botItems(st.seller.lvl).slice(0, 2)); }
  }
  if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try { tick(dt); } catch (e) { } }; }
  if (typeof enterMap === 'function') { const _em = enterMap; enterMap = function (id) { if (myStall && id !== 'yesilvadi') { closeMyShop(true); } const r = _em.apply(this, arguments); try { if (M.stalls) setup(); else STALLS = []; } catch (e) { } return r; }; }
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function () { myStall = null; const r = _sg.apply(this, arguments); try { const p = P(); p.tradeLog = p.tradeLog || []; if (M && M.stalls && !STALLS.length) setup(); } catch (e) { } return r; }; window.startGame = startGame; }
  // kayıt öncesi pazar durumunu yaz
  if (typeof save === 'function') { const _sv = save; save = function () { try { persist(); } catch (e) { } return _sv.apply(this, arguments); }; }
  // köye ışınlanma / yürüme pazar açıkken engellenir
  if (window.kdTown) { const _kt = window.kdTown; window.kdTown = function () { if (myStall) { showToast('Önce pazarını kapat', '', 1.4); return; } return _kt.apply(this, arguments); }; }

  // ---------------- çizim ----------------
  const IM = {}; const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; }; const ok = i => i && i.complete && i.naturalWidth > 0;
  const vis = (x, y) => !window.kdOnScreen || kdOnScreen(x, y, 120);
  if (typeof drawExtrasGround === 'function') { const _g = drawExtrasGround; drawExtrasGround = function () { _g.apply(this, arguments); try { if (!STALLS.length) return; ctx.save(); ctx.imageSmoothingEnabled = false;
    for (const s of STALLS) { if (!vis(s.x, s.y)) continue; const r = img(s.shop ? 'st_rug1' : 'st_rug2'); ctx.globalAlpha = s.shop ? 1 : .45; if (ok(r)) ctx.drawImage(r, s.x - 30, s.y - 20, 60, 50); ctx.globalAlpha = 1;
      if (!s.shop) { ctx.font = '700 11px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,240,200,.75)'; ctx.fillText('#' + s.id, s.x, s.y + 4); } }
    ctx.restore(); } catch (e) { } }; }
  if (typeof extrasToList === 'function') { const _el = extrasToList; extrasToList = function (list) { _el.apply(this, arguments); try { for (const s of STALLS) { if (!s.shop || !vis(s.x, s.y)) continue;
    list.push({ y: s.y - 30, k: 7, fn: () => { const t = img('st_table'); if (ok(t)) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(t, s.x - 24, s.y - 62, 48, 48); ctx.restore(); } } });
    if (s.seller) list.push({ y: s.y, k: 7, fn: () => { try { drawHero(s.seller.x, s.seller.y, heroLook(s.seller)); } catch (e) { } } }); } } catch (e) { } }; }
  if (typeof drawExtrasTop === 'function') { const _t = drawExtrasTop; drawExtrasTop = function () { _t.apply(this, arguments); try { for (const s of STALLS) { if (!s.shop || !vis(s.x, s.y)) continue; const sh = s.shop, y = s.y - 92;
    const ic = sh.items.slice(0, 3).map(eicon); const w = 18 * Math.max(1, ic.length) + 10; ctx.save(); ctx.fillStyle = 'rgba(20,14,28,.85)'; ctx.strokeStyle = sh.owner === 'player' ? '#ffd65a' : '#c99a3c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(s.x - w / 2, y - 14, w, 22, 5) : ctx.rect(s.x - w / 2, y - 14, w, 22); ctx.fill(); ctx.stroke(); ctx.font = '14px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ic.forEach((c, i) => ctx.fillText(c, s.x - (ic.length - 1) * 9 + i * 18, y - 3)); ctx.restore(); label(s.x, y - 20, sh.name, sh.owner === 'player' ? '#ffd65a' : '#ffe9b0', 10); if (s.seller) label(s.x, y + 18, s.seller.name, '#8fc4ff', 9); } } catch (e) { } }; }

  // ---------------- arayüz ----------------
  const win = document.createElement('div'); win.id = 'kdMarket'; win.className = 'panel win hidden'; document.body.appendChild(win);
  let mode = 'buy', cur = null, draft = [], dname = '', conf = null, msg = '', mtab = 'list', sel = null, sq = '', sslot = '';
  const tipHTML = e => e.kind === 'gear' ? (typeof itemTip === 'function' ? itemTip(e.it) : esc2(ename(e))) : '<b style="color:' + (MATS[e.mat] ? MATS[e.mat].col : '#fff') + '">' + esc2(ename(e)) + '</b><br><span class="mut">' + esc2(MATS[e.mat] ? MATS[e.mat].desc : '') + '</span>';
  window.kdOpenSearch = () => { mode = 'search'; conf = null; msg = ''; try { closeAll(); } catch (e) { } win.classList.remove('hidden'); render(); };
  function openBuy(st) { mode = 'buy'; cur = st; conf = null; msg = ''; sel = null; try { closeAll(); } catch (e) { } win.classList.remove('hidden'); render(); }
  function openSetup(st) { const p = P(); if (st.shop) { if (st === myStall) return openManage(); return openBuy(st); } mode = 'setup'; cur = st; draft = []; dname = p.name + '\'in Pazarı'; conf = null; msg = ''; try { closeAll(); } catch (e) { } win.classList.remove('hidden'); render(); }
  function openManage() { mode = 'manage'; cur = myStall; conf = null; msg = ''; mtab = 'list'; try { closeAll(); } catch (e) { } win.classList.remove('hidden'); render(); }
  window.kdOpenTradeLog = () => { mode = 'manage'; cur = myStall; conf = null; msg = ''; mtab = myStall ? 'list' : 'hist'; try { closeAll(); } catch (e) { } win.classList.remove('hidden'); render(); };
  window.kdOpenStall = id => { const st = STALLS.find(s => s.id === id); if (st) openSetup(st); };
  function row(e, act) { return '<div class="mk-row" data-l="' + e.lid + '">' + eiconHTML(e) + '<div class="mk-nm"><b class="' + (e.kind === 'gear' ? 'g' + e.it.grade + 'c' : '') + '">' + esc2(ename(e)) + '</b><small>' + (e.kind === 'gear' ? 'Sv ' + e.it.lvl + ' • ' + (SLOT_TR[e.it.slot] || '') : 'Malzeme') + ' • Adet: ' + e.qty + '</small></div><div class="mk-pr">🪙 ' + e.price.toLocaleString('tr-TR') + (e.qty > 1 ? '<small>/adet</small>' : '') + '</div>' + (act || '') + '</div>'; }
  function render() {
    const p = P(); if (!p || win.classList.contains('hidden')) return; let h = '<button class="x" data-close="kdMarket">✕</button>';
    if (mode === 'buy') { const sh = cur && cur.shop;
      // v53: Knight Online tarzı satıcı penceresi — 4x3 eşya ızgarası, fiyat kutunun altında, üstüne gelince özellikler
      h += '<h2>🏪 ' + esc2(sh ? sh.name : 'Pazar') + '</h2><div class="mk-info">Satıcı: <b style="color:#8fc4ff">' + esc2(sh ? sh.ownerName : '') + '</b> • Altının: <b style="color:#ffd65a">' + p.gold.toLocaleString('tr-TR') + '</b> • Çanta: ' + p.inv.length + '/' + bagCap() + '<button data-search="1" class="mk-sbtn">🔍 Pazar Ara</button></div>';
      if (msg) h += '<div class="pk-msg">' + msg + '</div>'; if (conf) h += '<div class="pk-conf"><span>' + conf.text + '</span><button class="gold" data-ok="1">Onayla</button><button data-no="1">Vazgeç</button></div>';
      const items = sh ? sh.items : []; h += '<div class="ko-grid">';
      for (let k = 0; k < 12; k++) { const e = items[k]; h += e ? '<div class="ko-slot' + (sel === e.lid ? ' on' : '') + '" data-l="' + e.lid + '">' + eiconHTML(e) + (e.qty > 1 ? '<span class="q">' + e.qty + '</span>' : '') + '<div class="pr">' + e.price.toLocaleString('tr-TR') + '</div></div>' : '<div class="ko-slot empty"><div class="it"></div><div class="pr">&nbsp;</div></div>'; }
      h += '</div>'; const se = items.find(x => x.lid === sel);
      h += '<div class="ko-det">' + (se ? '<div class="tip">' + tipHTML(se) + '</div><div class="bt"><span>' + (se.qty > 1 ? se.qty + ' adet • ' : '') + 'Toplam: <b>🪙 ' + (se.price * se.qty).toLocaleString('tr-TR') + '</b></span><button class="gold" data-buy="' + se.lid + '">Satın Al</button></div>' : '<div class="mut">Bir eşyaya dokun (ya da üstüne gel) → özelliklerini gör. <b>Çift dokun / sağ tıkla / çantaya sürükle</b> → satın al.</div>') + '</div>';
      h += '<div class="mk-drop" data-drop="1">🎒 Çantana sürükle</div>';
    } else if (mode === 'search') { const all = []; for (const st of STALLS) if (st.shop && st.shop.owner !== 'player') for (const e of st.shop.items) all.push({ st, e });
      const q = (sq || '').toLocaleLowerCase('tr-TR'); const R2 = all.filter(x => (!q || ename(x.e).toLocaleLowerCase('tr-TR').includes(q)) && (!sslot || (x.e.kind === 'gear' ? x.e.it.slot === sslot : sslot === 'mat')));
      R2.sort((a, b) => a.e.price - b.e.price);
      h += '<h2>🔍 Pazar Ara</h2><div class="mk-sr"><input data-sq="1" placeholder="Eşya adı..." value="' + esc2(sq || '') + '"><select data-ss="1"><option value="">Tümü</option>' + ['weapon', 'helmet', 'armor', 'pants', 'boots', 'bracers', 'belt', 'necklace', 'ring'].map(k => '<option value="' + k + '"' + (sslot === k ? ' selected' : '') + '>' + (SLOT_TR[k] || k) + '</option>').join('') + '<option value="mat"' + (sslot === 'mat' ? ' selected' : '') + '>Malzeme</option></select></div>';
      h += '<div class="mut" style="font-size:12px">' + R2.length + ' ürün • en ucuzdan pahalıya</div><div class="mk-list">' + R2.slice(0, 40).map(x => row(x.e, '<button class="gold" data-go="' + x.st.id + '">Git (#' + x.st.id + ')</button>')).join('') + '</div>';
    } else if (mode === 'setup') { const total = draft.reduce((a, e) => a + (e.price || 0) * e.qty, 0), fee = Math.max(5, Math.ceil(total * FEE));
      h += '<h2>🏪 Pazar Kur — Tezgâh #' + cur.id + '</h2><label class="mk-name">Pazar adı <input data-name="1" maxlength="24" value="' + esc2(dname) + '"></label>';
      if (msg) h += '<div class="pk-msg">' + msg + '</div>';
      h += '<div class="mk-sub">Satışa çıkanlar (' + draft.length + '/' + MAXL + ')</div><div class="mk-list">' + (draft.length ? draft.map((e, i) => '<div class="mk-row">' + eiconHTML(e) + '<div class="mk-nm"><b>' + esc2(ename(e)) + '</b><small>Önerilen: ' + fair(e) + ' / adet</small></div>' +
        (e.kind === 'mat' ? '<label class="mk-q">Adet <input type="number" min="1" max="' + (p.mats[e.mat] || 1) + '" value="' + e.qty + '" data-q="' + i + '"></label>' : '') + '<label class="mk-q">Fiyat <input type="number" min="1" value="' + (e.price || '') + '" data-p="' + i + '"></label><button data-rm="' + i + '">✕</button></div>').join('') : '<div class="mut">Aşağıdan eşya ya da malzeme seç.</div>') + '</div>';
      h += '<div class="mk-tot">Toplam satış değeri: <b>🪙 ' + total.toLocaleString('tr-TR') + '</b> • Tezgâh ücreti (%1): <b>' + fee + '</b> • Satışlardan %5 pazar vergisi kesilir</div>';
      h += '<div class="mk-sub">Çantan — eklemek için dokun</div><div class="mk-bag">' + p.inv.map((it, i) => draft.some(e => e.it === it) ? '' : '<div class="it g' + it.grade + '" data-add="g' + i + '" title="' + esc2(itemName(it)) + '">' + itemIcon(it) + (it.plus ? '<span class="pl">+' + it.plus + '</span>' : '') + '</div>').join('') +
        Object.keys(MATS).filter(k => p.mats[k] > 0 && !draft.some(e => e.mat === k)).map(k => '<div class="it g0" data-add="m' + k + '" title="' + MATS[k].n + '"><span style="font-size:20px">' + MATS[k].ic + '</span><span class="lv">' + p.mats[k] + '</span></div>').join('') + '</div>';
      h += '<div class="mk-bt"><button class="gold" data-open="1">Pazarı Aç</button></div>';
    } else { const sh = myStall && myStall.shop;
      h += '<h2>🏪 ' + esc2(sh ? sh.name : 'Pazarım ve Ticaret Geçmişi') + '</h2><div class="pk-tabs"><button data-mt="list" class="' + (mtab === 'list' ? 'on' : '') + '">Ürünler</button><button data-mt="hist" class="' + (mtab === 'hist' ? 'on' : '') + '">Satış Geçmişi</button></div>';
      if (msg) h += '<div class="pk-msg">' + msg + '</div>';
      if (mtab === 'list') h += '<div class="mut" style="font-size:12px">Kazanç: <b style="color:#ffd65a">' + (sh ? sh.earned : 0) + '</b> altın • Satılan: ' + (sh ? sh.sold || 0 : 0) + ' • AFK Pazar: ' + (window.kdPremActive && kdPremActive('afkpazar') ? '<b class="good">aktif</b>' : '<span class="bad">yok</span> (oyundan çıkınca kapanır)') + '</div><div class="mk-list">' +
        (sh && sh.items.length ? sh.items.map(e => row(e, '<label class="mk-q">Fiyat <input type="number" min="1" value="' + e.price + '" data-ep="' + e.lid + '"></label><button data-back="' + e.lid + '">Geri al</button>')).join('') : '<div class="mut">Ürün yok.</div>') + '</div>' + (sh ? '<div class="mk-bt"><button data-close-shop="1" class="bad2">Pazarı Kapat</button></div>' : '<div class="mut" style="font-size:12px;margin-top:6px">Açık pazarın yok. Pazar Yeri’nde boş bir tezgâha gidip <b>Pazar Kur</b>’a dokun.</div>');
      else { const L = (p.tradeLog || []); h += '<div class="pk-hist">' + (L.length ? L.map(r => '<div class="row ' + (r.gold >= 0 ? 'load' : 'spend') + '"><span>' + new Date(r.t).toLocaleString('tr-TR') + '</span><b>' + (r.gold > 0 ? '+' : '') + r.gold + ' 🪙</b><small>' + ({ sat: 'Sattın', al: 'Aldın', aç: 'Pazar açıldı' }[r.type] || r.type) + ': ' + esc2(r.what) + (r.qty > 1 ? ' x' + r.qty : '') + (r.who && r.who !== '-' ? ' • ' + esc2(r.who) : '') + (r.tax ? ' • vergi ' + r.tax : '') + '</small></div>').join('') : '<div class="mut">Henüz işlem yok.</div>') + '</div>'; }
    }
    win.innerHTML = h;
  }
  function askBuy(id) { const sh = cur && cur.shop, e = sh && sh.items.find(x => x.lid === +id); if (!e) return; const q = e.kind === 'mat' ? e.qty : 1;
    conf = { text: (q > 1 ? q + 'x ' : '') + esc2(ename(e)) + ' → 🪙 ' + (e.price * q).toLocaleString('tr-TR'), fn: () => { const r = TX.buy(cur, e.lid, q); msg = r.ok ? '✅ Satın alındı: ' + esc2(r.name) + ' (-' + r.cost + ' altın)' : '❌ ' + r.err; if (r.ok) try { refreshPanels(); } catch (er) { } } }; render(); }
  win.addEventListener('click', ev => { const sl = ev.target.closest('.ko-slot[data-l]'); if (sl && mode === 'buy' && !ev.target.closest('button')) { sel = +sl.dataset.l; render(); return; } const b = ev.target.closest('button,[data-add]'); if (!b) return; const d = b.dataset, p = P();
    if (d.close) { win.classList.add('hidden'); return; }
    if (d.ok) { const f = conf && conf.fn; conf = null; if (f) f(); render(); return; } if (d.no) { conf = null; render(); return; }
    if (d.buy) return askBuy(d.buy);
    if (d.search) { mode = 'search'; render(); return; }
    if (d.go) { const st = STALLS.find(x => x.id === +d.go); if (st) { openBuy(st); } return; }
    if (d.mt) { mtab = d.mt; render(); return; }
    if (d.add) { if (draft.length >= MAXL) { msg = 'En çok ' + MAXL + ' ürün'; render(); return; } if (d.add[0] === 'g') { const it = p.inv[+d.add.slice(1)]; if (it) draft.push({ kind: 'gear', it, qty: 1, price: Math.round(itemPrice(it) * 1.5) }); } else { const k = d.add.slice(1); draft.push({ kind: 'mat', mat: k, qty: p.mats[k], price: Math.round((MATS[k].price || 50) * 1.3) }); } msg = ''; render(); return; }
    if (d.rm != null) { draft.splice(+d.rm, 1); render(); return; }
    if (d.open) { const r = openMyShop(cur, dname, draft); if (r.ok) { win.classList.add('hidden'); draft = []; } else { msg = '❌ ' + r.err; render(); } return; }
    if (d.back) { const sh = myStall.shop, e = sh.items.find(x => x.lid === +d.back); if (!e) return; if (e.kind === 'gear' && p.inv.length >= bagCap()) { msg = '❌ Çanta dolu'; render(); return; } sh.items.splice(sh.items.indexOf(e), 1); if (e.kind === 'gear') p.inv.push(e.it); else p.mats[e.mat] += e.qty; persist(); if (!sh.items.length) { closeMyShop(); win.classList.add('hidden'); return; } render(); return; }
    if (d.closeShop != null) { closeMyShop(); win.classList.add('hidden'); return; }
  });
  win.addEventListener('input', ev => { const t = ev.target, d = t.dataset; if (d.sq != null) { sq = t.value; const pos = t.selectionStart; render(); const n = win.querySelector('[data-sq]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } return; } if (d.name) dname = t.value; else if (d.p != null) draft[+d.p].price = Math.max(1, Math.floor(+t.value || 0)); else if (d.q != null) { const e = draft[+d.q]; e.qty = Math.max(1, Math.min(P().mats[e.mat] || 1, Math.floor(+t.value || 1))); }
    else if (d.ep) { const e = myStall && myStall.shop.items.find(x => x.lid === +d.ep); if (e) { e.price = Math.max(1, Math.floor(+t.value || 1)); persist(); } } });
  win.addEventListener('change', ev => { if (ev.target.dataset.ss != null) { sslot = ev.target.value; render(); return; } if (mode === 'setup') render(); });
  // sağ tık / çift tık ile satın al
  win.addEventListener('contextmenu', ev => { const r = ev.target.closest('.mk-row,.ko-slot[data-l]'); if (r && mode === 'buy') { ev.preventDefault(); askBuy(r.dataset.l); } });
  win.addEventListener('dblclick', ev => { const r = ev.target.closest('.mk-row,.ko-slot[data-l]'); if (r && mode === 'buy') askBuy(r.dataset.l); });
  // masaüstü: üstüne gelince özellik balonu (pazar ızgarası, arama, kurulum çantası)
  win.addEventListener('mouseover', ev => { const c = ev.target.closest('.ko-slot[data-l],.mk-row[data-l],[data-add]'); if (!c || typeof showTip !== 'function') return; const p = P(); let html = '';
    if (c.dataset.add) { if (c.dataset.add[0] === 'g') { const it = p.inv[+c.dataset.add.slice(1)]; if (it) html = itemTip(it); } else { html = tipHTML({ kind: 'mat', mat: c.dataset.add.slice(1) }); } }
    else { const all = []; for (const st of STALLS) if (st.shop) all.push(...st.shop.items); const e = all.find(x => x.lid === +c.dataset.l); if (e) html = tipHTML(e); }
    if (html) showTip(html, ev); });
  win.addEventListener('mousemove', ev => { if (typeof moveTip === 'function' && ev.target.closest('.ko-slot[data-l],.mk-row[data-l],[data-add]')) moveTip(ev); });
  win.addEventListener('mouseout', ev => { if (typeof hideTip === 'function' && ev.target.closest('.ko-slot[data-l],.mk-row[data-l],[data-add]')) hideTip(); });
  // ticaret (takas) penceresi: eşyaların üstüne gelince özellikleri
  addEventListener('mouseover', ev => { const c = ev.target.closest && ev.target.closest('#kdTrade .it[data-u]'); if (!c || typeof showTip !== 'function') return; const p = P(), u = c.dataset.u; let it = p.inv.find(x => String(x.uid) === u); const TR = window.kdTradeState && kdTradeState(); if (!it && TR && TR.theirs) it = TR.theirs.find(x => String(x.uid) === u); if (it) showTip(itemTip(it), ev); });
  addEventListener('mouseout', ev => { if (ev.target.closest && ev.target.closest('#kdTrade .it[data-u]') && typeof hideTip === 'function') hideTip(); });
  // sürükle-bırak: ürün satırını "çanta" alanına bırak
  let drag = null;
  win.addEventListener('pointerdown', ev => { if (mode !== 'buy') return; const r = ev.target.closest('.mk-row,.ko-slot[data-l]'); if (!r || ev.target.closest('button')) return; drag = { l: r.dataset.l, x: ev.clientX, y: ev.clientY, el: null }; });
  addEventListener('pointermove', ev => { if (!drag) return; if (!drag.el && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) > 8) { drag.el = document.createElement('div'); drag.el.className = 'mk-ghost'; drag.el.textContent = '🛍'; document.body.appendChild(drag.el); }
    if (drag.el) { drag.el.style.left = ev.clientX + 'px'; drag.el.style.top = ev.clientY + 'px'; } });
  addEventListener('pointerup', ev => { if (!drag) return; const d = drag; drag = null; if (d.el) { d.el.remove(); const t = document.elementFromPoint(ev.clientX, ev.clientY); if (t && t.closest('[data-drop]')) askBuy(d.l); } });
  // dünyada: tezgâha / satıcıya dokun → pazar; boş tezgâhta dur → "Pazar Kur"
  const cv = document.getElementById('game');
  cv.addEventListener('pointerdown', e => { const p = P(); if (!p || typeof running === 'undefined' || !running || !STALLS.length) return; const Z = ZOOM, wx = camX + e.clientX / Z, wy = camY + e.clientY / Z;
    for (const s of STALLS) if (s.shop && Math.hypot(s.x - wx, s.y - 30 - wy) < 44) { if (Math.hypot(p.x - s.x, p.y - s.y) > 260) { showToast('Tezgâha yaklaş', '', 1); return; } if (s === myStall) openManage(); else openBuy(s); return; } });
  const chip = document.createElement('div'); chip.id = 'kdStallChip'; document.body.appendChild(chip);
  chip.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const b = e.target.closest('[data-c]'); if (!b) return; const c = b.dataset.c, p = P();
    if (c === 'kur') { const st = nearStall(p, 46); if (st) openSetup(st); } else if (c === 'yonet') openManage(); else if (c === 'kapat') closeMyShop(); else if (c === 'gir') { const st = nearStall(p, 90); if (st) openBuy(st); } });
  setInterval(() => { const p = P(); let h = ''; if (p && typeof running !== 'undefined' && running && STALLS.length) {
      if (myStall) h = '<span>🏪 Pazarın açık • ' + myStall.shop.items.length + ' ürün • +' + (myStall.shop.earned || 0) + ' 🪙</span><button data-c="yonet">Yönet</button><button data-c="kapat">Kapat</button>';
      else { const st = nearStall(p, 46), st2 = nearStall(p, 90); if (st && !st.shop) h = '<span>Tezgâh #' + st.id + ' boş</span><button data-c="kur" class="gold">Pazar Kur</button>'; else if (st2 && st2.shop) h = '<span>' + esc2(st2.shop.name) + '</span><button data-c="gir" class="gold">Pazara Gir</button>'; } }
    if (chip._h !== h) { chip._h = h; chip.innerHTML = h; } chip.classList.toggle('on', !!h); }, 300);
})();
