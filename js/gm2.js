'use strict';
// =====================================================================
//  GRAND MASTER (Sürüm 53) — test ve yönetim paneli
//  • İlk açılışta GM hesabı oluşturulur (kullanıcı adı + şifre; şifre özetlenerek saklanır).
//  • Sekmeler: Oyuncular (ara / banla / ban kaldır / sustur / at / ışınlan / yanına çek)
//    • Ekonomi (altın, inci, malzeme, eşya ver; ticaret ve inci kayıtları)
//    • Etkinlik (her etkinliği hemen aç, Kor Ejderi'ni doğur) • Duyuru • Araçlar (eski GM).
//  • Banlı karakter oyuna giremez; banlı oyuncular dünyadan kaldırılır ve yeniden doğmaz.
//  NOT: Gerçek çok oyunculu sürümde hesap/ban işlemleri sunucuda yapılmalıdır.
// =====================================================================
(function () {
  const P = () => (typeof player !== 'undefined' ? player : null);
  const esc2 = t => typeof esc === 'function' ? esc(String(t)) : String(t);
  const KEY = 'kdGM2', BANK = 'kdBans', MUTEK = 'kdMutes', LOGK = 'kdGMLog';
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || '') || d; } catch (e) { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  async function hash(s) { try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kd:' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (e) { let h = 0; for (const c of 'kd:' + s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h; } }
  let session = false, acc = load(KEY, null);
  const bans = () => load(BANK, []), mutes = () => load(MUTEK, {});
  function glog(t) { const L = load(LOGK, []); L.unshift({ t: Date.now(), a: acc ? acc.user : '?', x: t }); store(LOGK, L.slice(0, 200)); }
  window.kdIsBanned = n => bans().some(b => b.n.toLocaleLowerCase('tr-TR') === String(n).toLocaleLowerCase('tr-TR'));
  window.kdIsMuted = n => { const m = mutes()[n]; return !!(m && m > Date.now()); };
  // ---- ban/mute uygulaması ----
  function purge() { if (typeof bots === 'undefined') return; for (let i = bots.length - 1; i >= 0; i--) if (kdIsBanned(bots[i].name)) bots.splice(i, 1); for (const e of (typeof enemies !== 'undefined' ? enemies : [])) if (e.name && kdIsBanned(e.name) && !e.dead) { e.dead = true; e.diedAt = gameTime; } }
  setInterval(() => { try { if (typeof running !== 'undefined' && running) purge(); } catch (e) { } }, 1000);
  if (typeof addChat === 'function') { const _ac = addChat; addChat = function (who) { if (who && typeof who === 'string' && (kdIsMuted(who.replace(/^\[.*?\]\s*/, '')) || kdIsBanned(who.replace(/^\[.*?\]\s*/, '')))) return; return _ac.apply(this, arguments); }; }
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function (d) { const n = d && d.name; if (n && kdIsBanned(n)) { try { showToast('Bu karakter banlı', 'Grand Master ile iletişime geç', 3); } catch (e) { } return; } return _sg.apply(this, arguments); }; window.startGame = startGame; }
  // ---- pencere ----
  const win = document.createElement('div'); win.id = 'kdGM'; win.className = 'panel win hidden'; document.body.appendChild(win);
  let tab = 'oyuncu', q = '', msg = '';
  const giveSel = { slot: 'weapon', grade: 2, plus: 9, lvl: 0 };
  window.kdGMActive = () => session || (typeof GM !== 'undefined' && GM.on);
  function open() { try { closeAll(); } catch (e) { } win.classList.remove('hidden'); render(); }
  window.kdOpenGM = open;
  function players() { const L = []; const add = (o, kind) => { if (o && o.name) L.push({ o, kind }); };
    for (const b of (typeof bots !== 'undefined' ? bots : [])) add(b, b.faction === 'ally' ? 'Müttefik' : 'Oyuncu');
    for (const e of (typeof enemies !== 'undefined' ? enemies : [])) if (e.d && e.d.pvp && !e.dead) add(e, 'Gölge');
    for (const s of (window.kdStalls ? kdStalls() : [])) if (s.seller) add(s.seller, 'Satıcı'); return L; }
  function render() {
    const p = P(); let h = '<button class="x" data-close="kdGM">✕</button><h2>👑 Grand Master</h2>';
    if (!acc) { h += '<div class="gm-box"><div class="ev-tx">İlk kez açıyorsun. Kendi <b>Grand Master hesabını</b> oluştur:</div><input data-u="1" placeholder="GM kullanıcı adı" maxlength="20"><input data-p="1" type="password" placeholder="Şifre (en az 4)"><input data-p2="1" type="password" placeholder="Şifre tekrar"><button class="gold" data-create="1">Hesabı Oluştur</button></div>'; }
    else if (!session) { h += '<div class="gm-box"><div class="ev-tx">GM hesabı: <b>' + esc2(acc.user) + '</b></div><input data-p="1" type="password" placeholder="Şifre"><button class="gold" data-login="1">Giriş Yap</button><button data-reset="1">Hesabı sıfırla</button></div>'; }
    else {
      h += '<div class="ev-tabs">' + [['oyuncu', 'Oyuncular'], ['eko', 'Ekonomi'], ['etk', 'Etkinlik'], ['duy', 'Duyuru'], ['ara', 'Araçlar'], ['log', 'Kayıt']].map(t => '<button data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>';
      if (msg) h += '<div class="pk-msg">' + msg + '</div>';
      if (tab === 'oyuncu') { const L = players().filter(x => !q || x.o.name.toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR'))), B = bans();
        h += '<div class="mk-sr"><input data-q="1" placeholder="Oyuncu ara..." value="' + esc2(q) + '"></div><div class="gm-list">' + L.slice(0, 40).map(x => '<div class="gm-row"><b>' + esc2(x.o.name) + '</b><small>' + x.kind + ' • Sv ' + (x.o.lvl || '?') + (kdIsMuted(x.o.name) ? ' • 🔇' : '') + '</small><button data-ban="' + esc2(x.o.name) + '">Banla</button><button data-mute="' + esc2(x.o.name) + '">Sustur 10dk</button><button data-tp="' + esc2(x.o.name) + '">Işınlan</button><button data-pull="' + esc2(x.o.name) + '">Çek</button></div>').join('') + '</div>';
        h += '<div class="ev-sub">Banlılar (' + B.length + ')</div><div class="gm-list">' + (B.length ? B.map(b => '<div class="gm-row"><b>' + esc2(b.n) + '</b><small>' + new Date(b.t).toLocaleString('tr-TR') + ' • ' + esc2(b.why || '') + '</small><button data-unban="' + esc2(b.n) + '">Ban Kaldır</button></div>').join('') : '<div class="mut">Banlı yok.</div>') + '</div>';
        h += '<div class="ev-row"><input data-bname="1" placeholder="Karakter adı (çevrimdışı ban)"><button data-banname="1">Banla</button></div>'; }
      else if (tab === 'eko') { h += '<div class="gm-grid"><button data-g="gold">+10.000 altın</button><button data-g="pearl">+500 inci</button><button data-g="mats">+10 her parşömen</button><button data-g="prem">Tüm premium 30 gün</button><button data-g="gear">+5 rastgele eşya (Efsanevi)</button><button data-g="lvl">+5 seviye</button><button data-g="pts">+30 özellik puanı</button><button data-g="heal">Can/Mana doldur</button></div>';
        // v69: istenen eşyayı seçerek ver (tür • kalite • artı • seviye) + tam +9 set
        { const SL = [['weapon','Silah'],['helmet','Miğfer'],['armor','Zırh'],['bracers','Eldiven'],['pants','Bacaklık'],['boots','Çizme'],['belt','Kemer'],['necklace','Kolye'],['ring','Yüzük']];
          const opt = (a, sel) => a.map(x => '<option value="' + x[0] + '"' + (String(x[0]) === String(sel) ? ' selected' : '') + '>' + x[1] + '</option>').join('');
          h += '<div class="ev-sub">Eşya ver</div><div class="gm-give"><label>Tür<select data-gs="1">' + opt(SL, giveSel.slot) + '</select></label>' +
            '<label>Kalite<select data-gg="1">' + opt((typeof GRADES !== 'undefined' ? GRADES : [{ n: 'Sıradan' }, { n: 'Nadir' }, { n: 'Efsanevi' }]).map((g, i) => [i, g.n]), giveSel.grade) + '</select></label>' +
            '<label>Artı<select data-gp="1">' + opt([0,1,2,3,4,5,6,7,8,9].map(i => [i, '+' + i]), giveSel.plus) + '</select></label>' +
            '<label>Seviye<input data-gl="1" type="number" min="1" max="' + (typeof MAXL !== 'undefined' ? MAXL : 60) + '" value="' + (giveSel.lvl || p.lvl) + '"></label></div>' +
            '<div class="gm-grid"><button class="gold" data-give="1">Çantaya ver</button><button data-give="eq">Ver ve kuşan</button><button data-give="set">Tam set +9 kuşan (silah + 8 parça)</button></div>'; }
        const T = (p.tradeLog || []).slice(0, 10), PL = (p.pearlLog || []).slice(0, 10);
        h += '<div class="ev-sub">Son ticaretler</div><div class="pk-hist">' + (T.map(r => '<div class="row"><span>' + new Date(r.t).toLocaleString('tr-TR') + '</span><b>' + r.gold + ' 🪙</b><small>' + esc2(r.type + ': ' + r.what + ' • ' + (r.who || '')) + '</small></div>').join('') || '<div class="mut">Yok</div>') + '</div>';
        h += '<div class="ev-sub">Son inci işlemleri</div><div class="pk-hist">' + (PL.map(r => '<div class="row ' + r.type + '"><span>' + new Date(r.t).toLocaleString('tr-TR') + '</span><b>' + r.amount + ' 💎</b><small>' + esc2(r.what) + '</small></div>').join('') || '<div class="mut">Yok</div>') + '</div>'; }
      else if (tab === 'etk') { h += '<div class="ev-tx">Etkinlikleri saatini beklemeden aç (test için):</div><div class="gm-grid">' + ['bdv', 'jr', 'zindan', 'klan'].map(k => '<button data-ev="' + k + '">' + esc2(window.KD_EVENTS ? KD_EVENTS[k].n : k) + ' — aç + katıl</button>').join('') + '<button data-drg="1">Kor Ejderi\'ni doğur (Kızıl Sınır)</button><button data-daily="1">Günlük girişi sıfırla</button><button data-online="1">Çevrimiçi hediyeyi hemen ver</button><button data-clanreg="1">Klan kur + kayıt</button></div>'; }
      else if (tab === 'duy') { h += '<div class="ev-row"><input data-ann="1" maxlength="120" placeholder="Tüm sunucuya duyuru..."><button class="gold" data-send="1">Gönder</button></div>'; }
      else if (tab === 'ara') { h += '<div class="ev-tx">Eski GM araçları (ölümsüzlük, tek vuruş, hız, ışınlanma...):</div><button class="gold" data-old="1">Araç panelini aç</button>'; }
      else { const L = load(LOGK, []); h += '<div class="pk-hist">' + (L.map(r => '<div class="row"><span>' + new Date(r.t).toLocaleString('tr-TR') + '</span><b>' + esc2(r.a) + '</b><small>' + esc2(r.x) + '</small></div>').join('') || '<div class="mut">Kayıt yok</div>') + '</div>'; }
      h += '<div class="ev-row" style="margin-top:10px"><button data-logout="1">Çıkış</button></div>';
    }
    win.innerHTML = h;
  }
  function find(n) { return players().find(x => x.o.name === n); }
  win.addEventListener('input', e => { if (e.target.dataset.q != null) { q = e.target.value; const pos = e.target.selectionStart; render(); const n = win.querySelector('[data-q]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { } } } });
  win.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset, p = P(), val = s => (win.querySelector(s) || {}).value || '';
    if (d.close) { win.classList.add('hidden'); return; }
    if (d.create) { const u = val('[data-u]').trim(), pw = val('[data-p]'), pw2 = val('[data-p2]'); if (u.length < 3 || pw.length < 4) { msg = ''; alertIn('Kullanıcı adı en az 3, şifre en az 4 karakter'); return; } if (pw !== pw2) { alertIn('Şifreler aynı değil'); return; } acc = { user: u, h: await hash(pw), t: Date.now() }; store(KEY, acc); session = true; glog('GM hesabı oluşturuldu'); msg = '✅ GM hesabı oluşturuldu, giriş yapıldı.'; render(); return; }
    if (d.login) { if (await hash(val('[data-p]')) === acc.h) { session = true; glog('giriş'); msg = '✅ Hoş geldin, ' + acc.user; } else alertIn('Şifre yanlış'); render(); return; }
    if (d.reset) { if (b.dataset.sure) { localStorage.removeItem(KEY); acc = null; session = false; render(); } else { b.dataset.sure = 1; b.textContent = 'Emin misin? (tekrar bas)'; } return; }
    if (!session) return;
    if (d.logout) { session = false; render(); return; }
    if (d.tab) { tab = d.tab; msg = ''; render(); return; }
    if (d.ban || d.banname) { const n = d.ban || val('[data-bname]').trim(); if (!n) return; const B = bans(); if (!B.some(x => x.n === n)) B.push({ n, t: Date.now(), why: 'GM' }); store(BANK, B); purge(); glog('BAN: ' + n); msg = '⛔ ' + n + ' banlandı.'; try { addChat(null, '⛔ ' + n + ' sunucudan uzaklaştırıldı.', '#ff7070'); } catch (er) { } }
    else if (d.unban) { store(BANK, bans().filter(x => x.n !== d.unban)); glog('ban kaldır: ' + d.unban); msg = '✅ ' + d.unban + ' banı kaldırıldı.'; }
    else if (d.mute) { const m = mutes(); m[d.mute] = Date.now() + 600000; store(MUTEK, m); glog('sustur: ' + d.mute); msg = '🔇 ' + d.mute + ' 10 dk susturuldu.'; }
    else if (d.tp) { const x = find(d.tp); if (x) { p.x = x.o.x + 40; p.y = x.o.y; msg = '✨ ' + d.tp + ' yanına ışınlandın.'; } }
    else if (d.pull) { const x = find(d.pull); if (x) { x.o.x = p.x + 40; x.o.y = p.y; msg = '✨ ' + d.pull + ' yanına çekildi.'; } }
    else if (d.g) { const g = d.g; if (g === 'gold') p.gold += 10000; else if (g === 'pearl') p.pearls = (p.pearls || 0) + 500; else if (g === 'mats') for (const k of ['up', 'prot', 'luck', 'ench', 'bless', 'oto1', 'afk1', 'pazar1', 'rename']) p.mats[k] = (p.mats[k] || 0) + 10;
      else if (g === 'prem') { p.prem = p.prem || {}; for (const k of ['oto', 'afkfarm', 'afkpazar']) p.prem[k] = Date.now() + 30 * 864e5; }
      else if (g === 'gear') { for (let i = 0; i < 5 && p.inv.length < 40; i++) p.inv.push(makeItem(pick(DROP_SLOTS), p.lvl, 2, p.cls)); }
      else if (g === 'lvl') { for (let i = 0; i < 5; i++) gainXp(xpNeed(p.lvl) + 1); } else if (g === 'pts') p.attrPts = (p.attrPts || 0) + 30; else if (g === 'heal') { p.hp = p.stats.maxHp; p.mp = p.stats.maxMp; }
      try { recalc(p); save(); refreshPanels(); } catch (er) { } glog('ver: ' + g); msg = '✅ Verildi: ' + b.textContent; }
    else if (d.give) { const bag = () => p.inv.length < 40;
      const mk = (sl, gr, pl, lv) => { const it = makeItem(sl, lv, gr, p.cls); it.plus = pl; if (typeof itemStats === 'function') itemStats(it); return it; };
      const lv = Math.max(1, Math.min(typeof MAXL !== 'undefined' ? MAXL : 60, parseInt(val('[data-gl]')) || p.lvl)); giveSel.slot = val('[data-gs]') || 'weapon'; giveSel.grade = +val('[data-gg]') || 0; giveSel.plus = +val('[data-gp]') || 0; giveSel.lvl = lv;
      if (d.give === 'set') { const ss = ['weapon', 'helmet', 'armor', 'bracers', 'pants', 'boots', 'belt', 'necklace', 'ring', 'ring2']; let moved = 0;
        for (const sl of ss) { const old = p.eq[sl]; if (old) { if (bag()) { p.inv.push(old); } else moved++; } p.eq[sl] = mk(sl === 'ring2' ? 'ring' : sl, 2, 9, lv); }
        msg = '✅ Tam set kuşanıldı: Efsanevi +9 (silah, miğfer, zırh, eldiven, bacaklık, çizme, kemer, kolye, 2 yüzük)' + (moved ? ' • çanta dolu olduğu için ' + moved + ' eski eşya silindi' : ''); glog('tam +9 set'); }
      else { const it = mk(giveSel.slot, giveSel.grade, giveSel.plus, lv), nm = typeof itemName === 'function' ? itemName(it) : it.name;
        if (d.give === 'eq') { let sl = it.slot; if (sl === 'ring' && p.eq.ring && !p.eq.ring2) sl = 'ring2'; const old = p.eq[sl]; if (old && !bag()) { alertIn('Çanta dolu (40/40) — eski eşya için yer yok'); return; } if (old) p.inv.push(old); p.eq[sl] = it; msg = '✅ Kuşanıldı: ' + esc2(nm); }
        else { if (!bag()) { alertIn('Çanta dolu (40/40)'); return; } p.inv.push(it); msg = '✅ Çantaya eklendi: ' + esc2(nm); }
        glog('eşya: +' + it.plus + ' ' + it.slot); }
      try { recalc(p); save(); refreshPanels(); } catch (er) { } }
    else if (d.ev) { if (window.kdEventForce) kdEventForce(d.ev, true); win.classList.add('hidden'); const r = window.kdEventStart ? kdEventStart(d.ev) : { ok: false }; glog('etkinlik: ' + d.ev); if (!r.ok) { open(); msg = '❌ ' + r.err; render(); } return; }
    else if (d.drg) { if (M.id !== 'sinir') enterMap('sinir'); const D2 = window.kdDragonSpawn && kdDragonSpawn(); glog('ejder doğdu'); msg = D2 ? '🐉 Kor Ejderi doğdu.' : '❌ Doğmadı'; }
    else if (d.daily) { if (p.evDaily) p.evDaily.last = ''; msg = '✅ Günlük giriş sıfırlandı.'; }
    else if (d.online) { p.evOnline = 1799.9; msg = '✅ Hediye birazdan gelir.'; }
    else if (d.clanreg) { if (!p.clan) p.clan = { name: 'GM_Klanı', members: ['Aybars', 'Gökçe', 'Tuğrul', 'Börü'], pts: 0, reg: '' }; const dd = new Date(), j = new Date(dd.getFullYear(), 0, 1); p.clan.reg = dd.getFullYear() + '-' + Math.ceil(((dd - j) / 864e5 + j.getDay() + 1) / 7); msg = '✅ Klan kuruldu ve kayıt oldu.'; }
    else if (d.send) { const t = val('[data-ann]').trim(); if (t) { try { addChat(null, '📢 [GM] ' + t, '#ffd65a'); if (window.kdDragonBanner) kdDragonBanner('DUYURU', t); else showToast('📢 Duyuru', t, 4); } catch (er) { } glog('duyuru: ' + t); msg = '📢 Duyuru gönderildi.'; } }
    else if (d.old) { win.classList.add('hidden'); try { GM.on = true; gmOpen(); } catch (er) { } return; }
    render();
  });
  function alertIn(t) { msg = '❌ ' + t; render(); }
  // v69: GM açıkken kendi karakterin için özellik puanı şartı yok (verilen +9 eşyalar kuşanılır ve statları işler)
  if (window.kdStatOk) { const _so = window.kdStatOk; window.kdStatOk = function (pp, it) { if (pp && typeof player !== 'undefined' && pp === player && window.kdGMActive && kdGMActive()) return true; return _so.apply(this, arguments); }; }
  // menü satırı
  const row = () => { const g = document.querySelector('#h2menuPop .grid'); if (!g || document.getElementById('sl_gm2')) return; const dv = document.createElement('div'); dv.id = 'sl_gm2'; dv.className = 'slot h3row'; dv.style.order = 39;
    dv.innerHTML = '<img class="h3mi" src="na/i_star.png" alt=""><span class="h3ml"><b>Grand Master</b><small>Test ve yönetim paneli</small></span>'; dv.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); const mp = document.getElementById('h2menuPop'); if (mp) mp.classList.remove('open'); open(); }); g.appendChild(dv); };
  row(); setInterval(row, 1000);
})();
