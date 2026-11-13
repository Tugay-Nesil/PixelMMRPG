'use strict';
// =====================================================================
//  İNCİ DÜKKÂNI v50 — premium mağaza
//  ÖNEMLİ: Bu oyun tarayıcıda tek başına çalışır; gerçek ödeme ve sunucu yoktur.
//  Satın alma akışı gerçek sisteme taşınacak şekilde kurgulandı:
//    sipariş (beklemede) → ödeme doğrulama (PAYMENT.verify) → inci yükleme → kayıt
//  Doğrulama başarısızsa inci YÜKLENMEZ. Harcamalar "harca → uygula → hata olursa iade"
//  biçiminde atomiktir. Ödeme sağlayıcısı bağlanana kadar TEST MODU (ücretsiz simülasyon).
// =====================================================================
(function () {
  const P = () => (typeof player !== 'undefined' ? player : null);
  const esc2 = t => typeof esc === 'function' ? esc(String(t)) : String(t);
  const DAY = 86400000;
  // ---------------- paketler (Türkiye fiyatlandırması) ----------------
  const PKG = [
    { id: 'p25', n: 'Başlangıç', base: 20, bonus: 5, tl: 24.90 },
    { id: 'p65', n: 'Küçük', base: 50, bonus: 15, tl: 59.90 },
    { id: 'p140', n: 'Orta', base: 100, bonus: 40, tl: 109.90, tag: 'POPÜLER' },
    { id: 'p325', n: 'Gelişmiş', base: 250, bonus: 75, tl: 249.90 },
    { id: 'p675', n: 'Büyük', base: 500, bonus: 175, tl: 449.90 },
    { id: 'p1050', n: 'Premium', base: 750, bonus: 300, tl: 649.90 },
    { id: 'p1450', n: 'Ultra', base: 1000, bonus: 450, tl: 799.90, tag: 'EN AVANTAJLI' },
  ];
  const CAMPAIGN = { on: false, pct: 0, name: '' }; // kampanya dönemi: ek bonus yüzdesi
  window.KD_PKG = PKG; window.KD_CAMPAIGN = CAMPAIGN;
  // ---------------- ürünler ----------------
  const CAT = [
    { id: 'svc', n: 'Hizmetler', items: [
      { id: 'rename', n: 'İsim Değiştirme', img: 'ii_Scroll', d: 'Karakter adını değiştir. Kullanılmış isimler alınamaz.', v: [{ q: 1, c: 120 }], kind: 'rename' } ] },
    { id: 'auto', n: 'Otomasyon', items: [
      { id: 'afkfarm', n: 'AFK Farm', img: 'ii_Grass', d: 'Karakterin PvE bölgesinde kendisi gezip kasılır; çanta dolunca sıradan eşyaları satar. PvP\'de çalışmaz.', v: [{ q: 7, c: 90 }, { q: 30, c: 299 }], kind: 'time', key: 'afkfarm' },
      { id: 'afkpazar', n: 'AFK Pazar', img: 'ii_Chest', d: 'Pazarını kurduktan sonra oyundan çıksan da satış devam eder (en çok 12 saat birikir).', v: [{ q: 7, c: 60 }, { q: 30, c: 199 }], kind: 'time', key: 'afkpazar' },
      { id: 'oto', n: 'Oto Savaş', img: 'i_cog', d: 'OTO savaş: saldırı ve seçili setin yeteneklerini kendisi kullanır. Yalnız PvE bölgeleri.', v: [{ q: 7, c: 60 }, { q: 30, c: 199 }], kind: 'time', key: 'oto' } ] },
    { id: 'pow', n: 'Güçlendirme', items: [
      { id: 'bless', n: 'Kutsama Muskası', img: 'ii_GemYellow', d: '1 saat: TP +%50, altın +%20, nadir düşme +%15. (Seviye kutsamasıyla ilgisi yoktur.)', v: [{ q: 1, c: 20 }, { q: 5, c: 85 }], kind: 'mat', mat: 'bless' },
      { id: 'luck', n: 'Şans Parşömeni', img: 'ii_ScrollPlant', d: 'Demircide basma başarısını +%15 artırır.', v: [{ q: 1, c: 12 }, { q: 10, c: 99 }], kind: 'mat', mat: 'luck' },
      { id: 'ench', n: 'Efsun Parşömeni', img: 'ii_ScrollThunder', d: 'Eşyaya rastgele ek özellikler katar (STR, DEX, AP, can, kritik...).', v: [{ q: 1, c: 8 }, { q: 10, c: 65 }], kind: 'mat', mat: 'ench' } ] },
  ];
  window.KD_PCAT = CAT;
  const PREMK = { afkfarm: 'AFK Farm', afkpazar: 'AFK Pazar', oto: 'Oto Savaş' };
  function ensure(p) { if (!p) return; if (p.pearls == null) p.pearls = 0; p.pearlLog = p.pearlLog || []; p.prem = p.prem || {}; p.usedNames = p.usedNames || []; if (window.kdFixMats) kdFixMats(p);
    if (!p.premTrial) { p.premTrial = 1; p.mats.oto1 = (p.mats.oto1 || 0) + 1; setTimeout(() => { try { addChat(null, '🎁 Hoş geldin hediyesi: 1 günlük Oto Savaş Bileti çantanda (İnci Dükkânı → Eşyalarım → Kullan).', '#ffe08a'); } catch (e) { } }, 1500); } }
  if (typeof SAVE_FIELDS !== 'undefined') SAVE_FIELDS.push('pearls', 'pearlLog', 'prem', 'usedNames', 'premTrial');
  const active = k => { const p = P(); return !!(p && p.prem && p.prem[k] > Date.now()); };
  window.kdPremActive = active;
  const left = k => { const p = P(); const ms = (p && p.prem && p.prem[k] || 0) - Date.now(); if (ms <= 0) return ''; const d = Math.floor(ms / DAY), h = Math.floor(ms % DAY / 3600000); return d > 0 ? d + ' gün ' + h + ' sa' : h + ' sa ' + Math.floor(ms % 3600000 / 60000) + ' dk'; };
  function log(type, amount, what) { const p = P(); p.pearlLog.unshift({ t: Date.now(), type, amount, what }); if (p.pearlLog.length > 100) p.pearlLog.length = 100; }

  // ---------------- ödeme / harcama servisi ----------------
  const PAYMENT = {
    testMode: true, // gerçek sağlayıcı (iyzico / PayTR / Google Play / App Store) bağlanınca false
    verify(order) { // gerçek sistemde: sunucu, sağlayıcının imzalı makbuzunu doğrular → {ok, txid}
      if (!this.testMode) return { ok: false, err: 'Ödeme altyapısı bağlı değil' };
      return { ok: true, txid: 'TEST-' + order.id };
    },
  };
  window.KD_PAYMENT = PAYMENT;
  const orders = {};
  function buyPackage(id) {
    const p = P(), pk = PKG.find(x => x.id === id); if (!p || !pk) return { ok: false, err: 'Paket bulunamadı' };
    const order = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), pk: id, status: 'pending' }; orders[order.id] = order;
    const v = PAYMENT.verify(order);
    if (!v.ok) { order.status = 'failed'; return { ok: false, err: v.err || 'Ödeme doğrulanamadı — inci yüklenmedi' }; }
    if (order.status !== 'pending') return { ok: false, err: 'Sipariş zaten işlendi' }; // aynı siparişin iki kez yüklenmesini önler
    const extra = CAMPAIGN.on ? Math.round(pk.base * CAMPAIGN.pct / 100) : 0, total = pk.base + pk.bonus + extra;
    p.pearls += total; order.status = 'done'; log('load', total, pk.n + ' paketi (' + pk.base + ' + ' + (pk.bonus + extra) + ' bonus) • ' + pk.tl.toFixed(2).replace('.', ',') + ' TL • ' + v.txid);
    try { save(); } catch (e) { } return { ok: true, total };
  }
  function spend(cost, what, apply) {
    const p = P(); if (!p) return { ok: false }; if (!(cost > 0)) return { ok: false, err: 'Geçersiz fiyat' };
    if (p.pearls < cost) return { ok: false, err: 'Yetersiz inci (' + p.pearls + '/' + cost + ')' };
    p.pearls -= cost;
    try { const r = apply(); if (r === false) throw new Error('uygulanamadı'); log('spend', -cost, what); try { save(); } catch (e) { } return { ok: true }; }
    catch (e) { p.pearls += cost; log('refund', cost, what + ' — iade (' + e.message + ')'); return { ok: false, err: 'İşlem tamamlanamadı, inci iade edildi' }; }
  }
  window.kdPearlBuy = buyPackage; window.kdPearlSpend = spend;
  function addTime(k, days) { const p = P(); p.prem[k] = Math.max(Date.now(), p.prem[k] || 0) + days * DAY; }
  window.kdPremAdd = addTime;

  // ---------------- isim değiştirme ----------------
  function nameTaken(n) {
    const low = n.toLocaleLowerCase('tr-TR'); const p = P();
    const pools = [typeof BOT_NAMES !== 'undefined' ? BOT_NAMES : [], typeof ALLY_NAMES !== 'undefined' ? ALLY_NAMES : [], typeof FOE_NAMES !== 'undefined' ? FOE_NAMES : [], p.usedNames, window.KD_SELLER_NAMES || []];
    let reg = []; try { reg = JSON.parse(localStorage.getItem('kdNameReg') || '[]'); } catch (e) { }
    pools.push(reg); return pools.some(a => a.some(x => String(x).toLocaleLowerCase('tr-TR') === low));
  }
  function validName(n) { if (!/^[A-Za-zÇĞİÖŞÜçğıöşü0-9_]{3,16}$/.test(n)) return '3-16 karakter; harf, rakam ve _ kullanılabilir'; if (nameTaken(n)) return 'Bu isim daha önce alınmış'; return ''; }
  window.kdValidName = validName;
  function applyName(n) { const p = P(), old = p.name; if (validName(n)) return false; p.usedNames.push(old); let reg = []; try { reg = JSON.parse(localStorage.getItem('kdNameReg') || '[]'); } catch (e) { } reg.push(old, n); try { localStorage.setItem('kdNameReg', JSON.stringify(reg.slice(-500))); } catch (e) { } p.name = n; addChat(null, '🏷️ Yeni adın: ' + n + ' (eski: ' + old + ')', '#d0b0ff'); return true; }
  window.kdApplyName = applyName;

  // ---------------- premium: Oto Savaş geçidi + AFK Farm ----------------
  function otoAllowed(silent) { const p = P(); if (!p) return false; if (typeof M !== 'undefined' && M && M.pvp) { if (!silent) showToast('OTO savaş PvP\'de çalışmaz', 'Yalnız PvE bölgeleri', 1.6); return false; }
    if (!active('oto') && !active('afkfarm')) { if (!silent) { showToast('Oto Savaş İnci Dükkânı\'nda', 'Eşyalarım\'daki bileti kullan ya da satın al', 2); openShop('auto'); } return false; } return true; }
  window.kdOtoAllowed = otoAllowed;
  if (window.kdToggleAuto) { const _ta = window.kdToggleAuto; window.kdToggleAuto = function () { const p = P(); if (p && !p.autoFight && !otoAllowed()) return; return _ta.apply(this, arguments); }; }
  addEventListener('keydown', e => { if ((e.key || '').toLowerCase() !== 'h' || e.repeat) return; const p = P(); if (!p || typeof running === 'undefined' || !running) return; const ae = document.activeElement; if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return; if (!p.autoFight && !otoAllowed()) { e.stopImmediatePropagation(); } }, true);
  let afkOn = false, afkT = 0, lastBagWarn = 0; window.kdAfkFarm = () => afkOn;
  function setAfk(on) { const p = P(); if (on && !active('afkfarm')) { showToast('AFK Farm yok', 'İnci Dükkânı\'ndan al ya da bilet kullan', 1.8); return; } if (on && M && M.pvp) { showToast('AFK Farm PvP\'de çalışmaz', '', 1.5); return; }
    afkOn = on; if (on && !p.autoFight && window.kdToggleAuto) kdToggleAuto(); showToast(on ? 'AFK Farm açık' : 'AFK Farm kapalı', on ? 'Karakterin kendi gezip kasılacak' : '', 1.6); }
  window.kdSetAfk = setAfk;
  function tick(dt) {
    const p = P(); if (!p) return;
    if (p.autoFight && ((M && M.pvp) || (!active('oto') && !active('afkfarm')))) { p.autoFight = false; p.chase = false; addChat(null, M && M.pvp ? '⚙ PvP bölgesinde OTO savaş kapandı.' : '⚙ Oto Savaş süren bitti. İnci Dükkânı\'ndan yenileyebilirsin.', '#ffb070'); }
    if (afkOn && ((M && M.pvp) || !active('afkfarm') || p.dead)) { afkOn = false; addChat(null, '🌾 AFK Farm durdu.', '#ffb070'); }
    if (!afkOn) return; afkT -= dt; if (afkT > 0) return; afkT = 1;
    // çanta doluysa: sıradan (gri) eşyaları sat
    if (p.inv.length >= (typeof bagSlots === 'function' ? bagSlots() : 40)) { let g = 0; for (let i = p.inv.length - 1; i >= 0; i--) { const it = p.inv[i]; if (it.grade === 0 && !it.plus) { g += Math.round(itemPrice(it) * .5); p.inv.splice(i, 1); } }
      if (g) { p.gold += g; addChat(null, '🌾 AFK Farm: çanta doldu, sıradan eşyalar satıldı (+' + g + ' altın).', '#c8ff8a'); }
      else if (Date.now() - lastBagWarn > 30000) { lastBagWarn = Date.now(); afkOn = false; addChat(null, '🌾 AFK Farm: çanta değerli eşyalarla doldu, durdu. Çantanı boşalt.', '#ffb070'); return; } }
    if (!p.autoFight) { if (window.kdToggleAuto) kdToggleAuto(); }
    // hedef yoksa en yakın canavara yürü (köyden çık)
    if (!p.target || p.target.dead) { let b = null, bd = 1600; for (const e of enemies) { if (e.dead || e.d.boss || e.d.pvp || e.lvl > p.lvl + 4) continue; const d = dist(p, e); if (d < bd) { bd = d; b = e; } } if (b) { p.target = b; p.chase = true; p.moveTo = null; } }
  }
  if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try { tick(dt); } catch (e) { } }; }
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function () { const r = _sg.apply(this, arguments); try { ensure(P()); if (P().autoFight && !otoAllowed(true)) P().autoFight = false; } catch (e) { } return r; }; window.startGame = startGame; }
  // premium eşya kullanımı
  function useMat(k) {
    const p = P(); if (!p || !(p.mats[k] > 0)) return;
    if (k === 'bless') { p.buffs.kutsama = { until: gameTime + 3600, mods: {}, col: '#ffe08a' }; addChat(null, '🌟 Kutsama aktif (1 saat): TP +%50, altın +%20, nadir düşme +%15.', '#ffe08a'); }
    else if (k === 'oto1') addTime('oto', 1); else if (k === 'afk1') addTime('afkfarm', 1); else if (k === 'pazar1') addTime('afkpazar', 1);
    else if (k === 'rename') { renameDlg(true); return; }
    else return;
    p.mats[k]--; try { recalc(p); save(); } catch (e) { } showToast(MATS[k].n + ' kullanıldı', '', 1.5); render2();
  }
  window.kdUsePrem = useMat;

  // ---------------- arayüz ----------------
  const win = document.createElement('div'); win.id = 'kdPearl'; win.className = 'panel win hidden'; document.body.appendChild(win);
  let tab = 'shop', cat = 'svc', msg = '', confirmQ = null;
  function openShop(c) { const p = P(); if (!p) return; ensure(p); try { closeAll(); } catch (e) { } if (c) { tab = 'shop'; cat = c; } win.classList.remove('hidden'); render2(); }
  window.kdOpenPearl = openShop;
  const fmtTL = v => v.toFixed(2).replace('.', ',') + ' TL';
  function render2() {
    const p = P(); if (!p || win.classList.contains('hidden')) return; ensure(p);
    let h = '<button class="x" data-close="kdPearl">✕</button><div class="pk-hd"><h2>💎 İnci Dükkânı</h2><div class="pk-bal"><img src="na/ii_GemPurple.png" alt=""><b>' + p.pearls.toLocaleString('tr-TR') + '</b> inci <button data-tab="load" class="gold">+ İnci Yükle</button></div></div>';
    h += '<div class="pk-tabs">' + [['shop', 'Mağaza'], ['load', 'İnci Yükle'], ['mine', 'Eşyalarım'], ['hist', 'Geçmiş']].map(t => '<button data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>';
    if (msg) h += '<div class="pk-msg">' + msg + '</div>';
    if (confirmQ) h += '<div class="pk-conf"><span>' + confirmQ.text + '</span><button class="gold" data-ok="1">Onayla</button><button data-no="1">Vazgeç</button></div>';
    if (tab === 'shop') {
      h += '<div class="pk-cats">' + CAT.map(c => '<button data-cat="' + c.id + '" class="' + (cat === c.id ? 'on' : '') + '">' + c.n + '</button>').join('') + '</div><div class="pk-grid">';
      for (const it of CAT.find(c => c.id === cat).items) {
        const act = it.kind === 'time' && active(it.key) ? '<div class="pk-act">Aktif • ' + left(it.key) + ' kaldı</div>' : '';
        h += '<div class="pk-card"><img src="na/' + it.img + '.png" alt=""><div class="pk-tx"><b>' + it.n + '</b><small>' + it.d + '</small>' + act + '</div><div class="pk-buy">' +
          it.v.map((v, i) => '<button data-buy="' + it.id + '" data-v="' + i + '">' + (it.kind === 'time' ? v.q + ' gün' : it.kind === 'mat' ? v.q + ' adet' : 'Değiştir') + ' • <b>💎 ' + v.c + '</b></button>').join('') + '</div></div>';
      }
      h += '</div>';
    } else if (tab === 'load') {
      h += (PAYMENT.testMode ? '<div class="pk-test">⚠ Ödeme altyapısı henüz bağlanmadı — <b>TEST MODU</b>: satın alma ücretsiz simüle edilir. Gerçek ödemede inci yalnızca sağlayıcı ödemeyi doğruladıktan sonra yüklenir.</div>' : '') +
        (CAMPAIGN.on ? '<div class="pk-camp">🎉 ' + esc2(CAMPAIGN.name) + ': tüm paketlere +%' + CAMPAIGN.pct + ' ek bonus!</div>' : '') + '<div class="pk-pkgs">';
      for (const k of PKG) { const pct = Math.round(k.bonus / k.base * 100), extra = CAMPAIGN.on ? Math.round(k.base * CAMPAIGN.pct / 100) : 0, tot = k.base + k.bonus + extra;
        h += '<div class="pk-pkg' + (k.tag === 'EN AVANTAJLI' ? ' best' : k.tag ? ' pop' : '') + '">' + (k.tag ? '<span class="rib">' + k.tag + '</span>' : '') + '<div class="nm">' + k.n + '</div><div class="pe"><img src="na/ii_GemPurple.png" alt="">' + tot.toLocaleString('tr-TR') + '</div>' +
          '<div class="bd">' + k.base + ' + <b>' + (k.bonus + extra) + ' bonus</b> (%' + (pct + (CAMPAIGN.on ? CAMPAIGN.pct : 0)) + ')</div><button class="gold" data-pkg="' + k.id + '">' + fmtTL(k.tl) + '</button><small>' + (k.tl / tot).toFixed(2).replace('.', ',') + ' TL / inci</small></div>'; }
      h += '</div>';
    } else if (tab === 'mine') {
      h += '<div class="pk-sub">Aktif özellikler</div><div class="pk-mine">' + Object.keys(PREMK).map(k => '<div class="row"><b>' + PREMK[k] + '</b><span class="' + (active(k) ? 'good' : 'mut') + '">' + (active(k) ? left(k) + ' kaldı' : 'Yok') + '</span>' +
        (k === 'afkfarm' && active(k) ? '<button data-afk="1">' + (afkOn ? 'Durdur' : 'Başlat') + '</button>' : '') + '</div>').join('') + '</div>';
      h += '<div class="pk-sub">Çantadaki özel eşyalar</div><div class="pk-mine">' + ['bless', 'oto1', 'afk1', 'pazar1', 'rename'].map(k => '<div class="row"><b>' + MATS[k].ic + ' ' + MATS[k].n + '</b><span>× ' + (p.mats[k] || 0) + '</span>' + (p.mats[k] > 0 ? '<button class="gold" data-use="' + k + '">Kullan</button>' : '') + '</div>').join('') +
        '</div><div class="mut" style="font-size:12px;margin-top:6px">Bu eşyalar oyun içinde yalnızca <b>boss</b> ve <b>hazine sandıklarından</b> düşer.</div>';
    } else {
      const L = p.pearlLog; h += '<div class="pk-hist">' + (L.length ? L.map(r => '<div class="row ' + r.type + '"><span>' + new Date(r.t).toLocaleString('tr-TR') + '</span><b>' + (r.amount > 0 ? '+' : '') + r.amount + ' 💎</b><small>' + esc2(r.what) + '</small></div>').join('') : '<div class="mut">Henüz işlem yok.</div>') + '</div>';
    }
    win.innerHTML = h;
  }
  win.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const p = P(); const d = b.dataset;
    if (d.close) { win.classList.add('hidden'); confirmQ = null; msg = ''; return; }
    if (d.tab) { tab = d.tab; msg = ''; confirmQ = null; } else if (d.cat) { cat = d.cat; msg = ''; }
    else if (d.pkg) { const pk = PKG.find(x => x.id === d.pkg); confirmQ = { text: pk.n + ' paketi • ' + fmtTL(pk.tl) + ' → ' + (pk.base + pk.bonus) + ' inci', fn: () => { const r = buyPackage(pk.id); msg = r.ok ? '✅ ' + r.total + ' inci yüklendi.' : '❌ ' + r.err; } }; }
    else if (d.buy) { const it = CAT.flatMap(c => c.items).find(x => x.id === d.buy), v = it.v[+d.v];
      if (it.kind === 'rename') { renameDlg(false, v.c); return; }
      confirmQ = { text: it.n + (it.kind === 'time' ? ' (' + v.q + ' gün)' : it.kind === 'mat' ? ' x' + v.q : '') + ' → 💎 ' + v.c, fn: () => { const r = spend(v.c, it.n + (it.kind === 'time' ? ' ' + v.q + ' gün' : ' x' + v.q), () => { if (it.kind === 'time') addTime(it.key, v.q); else p.mats[it.mat] = (p.mats[it.mat] || 0) + v.q; }); msg = r.ok ? '✅ Satın alındı: ' + it.n : '❌ ' + r.err; } }; }
    else if (d.ok) { const f = confirmQ && confirmQ.fn; confirmQ = null; if (f) f(); }
    else if (d.no) { confirmQ = null; }
    else if (d.use) useMat(d.use);
    else if (d.afk) setAfk(!afkOn);
    render2();
  });
  // isim değiştirme penceresi (oyun içi; tarayıcı prompt'u yok)
  function renameDlg(fromCoupon, cost) {
    const p = P(); tab = 'shop'; cat = 'svc';
    confirmQ = null; render2();
    const box = document.createElement('div'); box.className = 'pk-ren'; box.innerHTML = '<b>Yeni karakter adı</b><input maxlength="16" placeholder="3-16 karakter" value=""><div class="er"></div><div class="bt"><button class="gold" data-r="ok">' + (fromCoupon ? 'Kuponu kullan' : 'Değiştir • 💎 ' + cost) + '</button><button data-r="no">Vazgeç</button></div>';
    win.appendChild(box); const inp = box.querySelector('input'), er = box.querySelector('.er'); inp.focus();
    inp.addEventListener('input', () => { const v = inp.value.trim(); er.textContent = v ? (validName(v) || '✔ Uygun') : ''; er.className = 'er ' + (v && !validName(v) ? 'ok' : ''); });
    box.addEventListener('click', ev => { const r = ev.target.closest('[data-r]'); if (!r) return; ev.stopPropagation(); if (r.dataset.r === 'no') { box.remove(); return; }
      const v = inp.value.trim(), bad = validName(v); if (bad) { er.textContent = bad; return; }
      if (fromCoupon) { if (!(p.mats.rename > 0)) return; if (applyName(v)) { p.mats.rename--; try { save(); } catch (e) { } msg = '✅ Adın değişti: ' + v; } }
      else { const res = spend(cost, 'İsim değiştirme → ' + v, () => applyName(v)); msg = res.ok ? '✅ Adın değişti: ' + v : '❌ ' + res.err; }
      box.remove(); render2(); });
  }
  // İnci Dükkânı NPC'si + Buluşma Görevlisi (parti kurma)
  if (typeof openNpc === 'function') {
    const _on = openNpc;
    openNpc = function (n) {
      if (n && n.id === 'inci') { openShop(); return; }
      if (n && n.id === 'ilan') return meetDlg(n);
      return _on.apply(this, arguments);
    };
  }
  if (typeof npcMarker === 'function') { const _nm = npcMarker; npcMarker = function (n) { if (n.id === 'inci') return { t: '💎', c: '#fff', s: 16 }; if (n.id === 'ilan') return { t: '⚑', c: '#9fe0ff', s: 18 }; return _nm.apply(this, arguments); }; }
  window.kdMeet = () => meetDlg({ name: 'Parti Bul' });
  function meetDlg(n) {
    const p = P(); const near = bots.filter(b => b.alive && !b.party && b.faction !== 'ally').slice(0, 8);
    const rows = near.map(b => [b.name + ' • Sv ' + b.lvl + ' ' + CLASSES[b.cls].name, () => { if (window.kdInvite) kdInvite(b); else showToast('Oyuncuya çift dokunarak davet et', '', 1.6); }]);
    dialog(n.name, 'Buluşma Meydanı: parti arayan oyuncular burada. Birine davet gönder — kabul ederse partine katılır. (Parti en çok 5 kişi, TP +%10)', rows.length ? rows.concat([['Kapat']]) : [['Şu an kimse yok']]);
  }
  // menü satırı: İnci Dükkânı
  const pearlRow = () => { const g = document.querySelector('#h2menuPop .grid'); if (!g || document.getElementById('sl_pearl')) return; const d = document.createElement('div'); d.id = 'sl_pearl'; d.className = 'slot h3row'; d.style.order = -1;
    d.innerHTML = '<img class="h3mi" src="na/ii_GemPurple.png" alt=""><span class="h3ml"><b>İnci Dükkânı</b><small>Premium ürünler, inci paketleri</small></span>'; d.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); const mp = document.getElementById('h2menuPop'); if (mp) mp.classList.remove('open'); openShop(); }); g.appendChild(d); };
  pearlRow(); setInterval(pearlRow, 1000);
})();
