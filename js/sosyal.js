'use strict';
// =====================================================================
//  SOSYAL SİSTEM (Sürüm 45) — diğer oyunculara sağ tık (telefonda basılı tut)
//   • Fısılda (özel mesaj)   • Ticaret   • Parti daveti   • Düello (1v1, Yeşilvadi'de)
//  Her istek karşı tarafa onaya gider; kabul ederse iş tamamlanır.
//  Oyunun savaş/eşya altyapısı aynen kullanılır (makeItem, itemPrice, recalc …).
// =====================================================================
(function () {
  const $i = id => document.getElementById(id);
  const P = () => typeof player !== 'undefined' && player;
  const esc2 = s => (typeof esc === 'function' ? esc(String(s)) : String(s));
  const CLSN = c => (CLASSES[c] || {}).name || '';
  const later = (fn, ms) => window.__kdSync ? fn() : setTimeout(fn, ms); // testte anında

  // ---------------- oyuncu bulma (dünya koordinatı) ----------------
  function botAt(wx, wy) { let best = null, bd = 30; for (const b of bots) { if (!b.alive) continue; const d = Math.hypot(wx - b.x, wy - (b.y - 24)); if (d < bd) { bd = d; best = b; } } return best; }
  const toWorld = (cx, cy) => ({ x: camX + cx / ZOOM, y: camY + cy / ZOOM });
  const findBot = name => bots.find(b => b.name === name && b.alive);

  // ---------------- sağ tık menüsü ----------------
  const menu = document.createElement('div'); menu.id = 'kdCtx'; menu.className = 'hidden'; document.body.appendChild(menu);
  let menuBot = null;
  function openMenu(b, cx, cy) {
    menuBot = b; const duelOk = M.id === 'yesilvadi', inParty = party.includes(b.name);
    menu.innerHTML = '<div class="hd"><b>' + esc2(b.name) + '</b><span>Sv ' + b.lvl + ' ' + CLSN(b.cls) + '</span></div>' +
      '<button data-a="pm"><i>✉</i>Fısılda</button><button data-a="trade"><i>⇄</i>Ticaret</button>' +
      '<button data-a="party"' + (inParty ? ' disabled' : '') + '><i>⚑</i>' + (inParty ? 'Partide' : 'Parti Daveti') + '</button>' +
      '<button data-a="duel"' + (duelOk && !duel ? '' : ' disabled') + '><i>⚔</i>Düello' + (duelOk ? '' : ' <small>(sadece Yeşilvadi)</small>') + '</button>';
    menu.classList.remove('hidden');
    const w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = Math.max(6, Math.min(innerWidth - w - 6, cx + 8)) + 'px'; menu.style.top = Math.max(6, Math.min(innerHeight - h - 6, cy + 8)) + 'px';
  }
  function closeMenu() { menu.classList.add('hidden'); menuBot = null; }
  menu.addEventListener('pointerdown', e => e.stopPropagation());
  menu.addEventListener('click', e => { const bt = e.target.closest('[data-a]'); if (!bt || bt.disabled || !menuBot) return; const b = menuBot, a = bt.dataset.a; closeMenu(); request(a, b); });
  addEventListener('pointerdown', e => { if (!menu.classList.contains('hidden') && !e.target.closest('#kdCtx')) closeMenu(); }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const cv = $i('game');
  cv.addEventListener('contextmenu', e => { if (typeof running === 'undefined' || !running) return; const w = toWorld(e.clientX, e.clientY), b = botAt(w.x, w.y); if (b) { e.preventDefault(); openMenu(b, e.clientX, e.clientY); } });
  // telefonda: oyuncunun üstüne basılı tut (0,5 sn)
  let lp = null;
  // v48: basılı tutma kalktı → ÇİFT dokunuş / çift tık (380 ms içinde aynı oyuncuya)
  cv.addEventListener('pointerdown', e => { if (typeof running === 'undefined' || !running) return; const w = toWorld(e.clientX, e.clientY), b = botAt(w.x, w.y); if (!b) { lp = null; return; } const now = performance.now();
    if (lp && lp.b === b && now - lp.t < 380) { lp = null; try { holdMove = false; } catch (er) { } const p = P(); if (p) { p.moveTo = null; p.chase = false; } e.preventDefault(); openMenu(b, e.clientX, e.clientY); return; } lp = { b, t: now }; });

  // ---------------- istek → onay akışı ----------------
  const ACC = { trade: .85, party: .75, duel: .7 };
  const NAMES = { pm: 'Fısıltı', trade: 'Ticaret isteği', party: 'Parti daveti', duel: 'Düello teklifi' };
  let pending = null;
  function request(a, b) {
    if (a === 'pm') { startPM(b.name); return; }
    if (pending) { showToast('Bekleyen bir isteğin var', 'Önce yanıtı bekle', 1.4); return; }
    pending = { a, name: b.name }; b.say = { text: '…', until: gameTime + 3 };
    showToast(NAMES[a] + ' gönderildi', b.name + ' yanıtlıyor…', 1.6);
    addChat(null, '➤ ' + b.name + ' adlı oyuncuya ' + NAMES[a].toLowerCase() + ' gönderdin.', '#b8a8d8');
    later(() => answer(a, b), 900 + Math.random() * 1400);
  }
  function answer(a, b) {
    pending = null; if (!b.alive || !bots.includes(b)) { showToast(b.name + ' artık burada değil', '', 1.4); return; }
    const p = P(); let chance = ACC[a];
    if (a === 'party' && Math.abs(b.lvl - p.lvl) > 8) chance = .3;
    if (a === 'duel') chance = b.lvl >= p.lvl - 3 ? .8 : .45;
    if (window.__kdForceAccept != null) chance = window.__kdForceAccept;
    const ok = Math.random() < chance;
    const yes = { trade: ['Tamam, bakalım neyin var', 'Olur, takas yapalım'], party: ['Katılıyorum!', 'Olur, birlikte kasalım'], duel: ['Kabul! Hazır ol', 'Görelim bakalım gücünü!'] }[a];
    const no = { trade: ['Şu an meşgulüm', 'Sonra belki'], party: ['Tek kasıyorum, sağ ol', 'Şimdi olmaz'], duel: ['Şimdi değil', 'Düello istemiyorum'] }[a];
    const txt = ok ? pick(yes) : pick(no); b.say = { text: txt, until: gameTime + 3.5 };
    addChat(b.name, txt, ok ? '#7dff9a' : '#ff9a9a');
    if (!ok) { showToast(b.name + ' reddetti', NAMES[a], 1.6); return; }
    showToast(b.name + ' kabul etti!', NAMES[a], 1.4);
    if (a === 'trade') openTrade(b); else if (a === 'party') joinParty(b); else if (a === 'duel') startDuel(b);
  }

  // ---------------- FISILTI (özel mesaj) ----------------
  let pmTo = null;
  const PM_REP = {
    greet: ['Selam! Nasılsın?', 'Aleyküm selam :)', 'Merhaba, buyur?'],
    trade: ['Ticaret için sağ tıkla takas penceresini aç', 'Elimde güzel eşyalar var, takas açalım mı?'],
    party: ['Parti daveti at, gelirim belki', 'Hangi bölgede kasıyorsun?'],
    help: ['Elder Aldric\'e git, görevleri o veriyor', 'Demircide koruma parşömeniyle bas, yanmasın', 'Haritada ★ olanlar dev canavar, dikkat'],
    gen: ['Haha evet', 'Aynen öyle', 'Şu an kasıyorum, sonra yazarım', 'Kızıl Sınır\'da görüşürüz', 'İyi oyunlar!'],
  };
  function pmCat(t) { const l = t.toLocaleLowerCase('tr'); return /(selam|merhaba|sa\b|slm|naber|hey)/.test(l) ? 'greet' : /(takas|ticaret|sat|al|eşya|esya|fiyat)/.test(l) ? 'trade' : /(parti|grup|beraber|birlikte)/.test(l) ? 'party' : /(nasıl|nerede|nerde|yardım|\?)/.test(l) ? 'help' : 'gen'; }
  function startPM(name) {
    pmTo = name; const c = $i('chat'); if (c) c.classList.remove('h2hide');
    const ci = $i('chatin'); if (ci) { ci.placeholder = 'Fısıltı → ' + name + ' (Esc: çık)'; ci.classList.add('kdpm'); setTimeout(() => ci.focus(), 30); }
  }
  function endPM() { pmTo = null; const ci = $i('chatin'); if (ci) { ci.placeholder = 'Sohbet için Enter\'a bas...'; ci.classList.remove('kdpm'); } }
  function sendPM(name, text) {
    const p = P(); addChat('[Fısıltı → ' + name + ']', text, '#d79bff');
    const b = findBot(name);
    later(() => { if (!b || !b.alive) { addChat(null, name + ' şu an çevrimdışı ya da uzakta.', '#a59cb8'); return; } const r = pick(PM_REP[pmCat(text)]); addChat('[Fısıltı] ' + name, r, '#d79bff'); b.say = { text: r, until: gameTime + 3 }; lastPMFrom = name; }, 1100 + Math.random() * 1500);
  }
  let lastPMFrom = null;
  if (typeof sendChat === 'function') {
    const _sc = sendChat;
    sendChat = function () {
      const ci = $i('chatin'), t = (ci.value || '').trim();
      const m = t.match(/^\/(w|f|fısıltı|fisilti)\s+(\S+)\s+(.+)$/i), r = t.match(/^\/r\s+(.+)$/i);
      if (m) { ci.value = ''; ci.blur(); sendPM(m[2], m[3]); return; }
      if (r && lastPMFrom) { ci.value = ''; ci.blur(); sendPM(lastPMFrom, r[1]); return; }
      if (pmTo && t) { ci.value = ''; ci.blur(); sendPM(pmTo, t); return; }
      return _sc.apply(this, arguments);
    };
  }
  const ci0 = $i('chatin'); if (ci0) ci0.addEventListener('keydown', e => { if (e.key === 'Escape' && pmTo) endPM(); });
  // Esc (odak nerede olursa olsun) ya da sohbet paneli kapanınca fısıltı modu biter
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && pmTo) endPM(); }, true);
  setInterval(() => { const c = $i('chat'); if (pmTo && c && c.classList.contains('h2hide')) endPM(); }, 400);
  { const mp = $i('h2menuPop'); if (mp) new MutationObserver(() => { if (pmTo && mp.classList.contains('open')) endPM(); }).observe(mp, { attributes: true, attributeFilter: ['class'] }); }
  window.kdPM = (n, t) => sendPM(n, t);

  // ---------------- TİCARET ----------------
  const tw = document.createElement('div'); tw.id = 'kdTrade'; tw.className = 'panel win hidden'; document.body.appendChild(tw);
  let TR = null; // {b, mine:Set(uid), myGold, theirs:[items], theirGold, stage:'edit'|'wait'|'agreed'}
  const ico = it => (typeof itemBox === 'function' ? itemBox(it, 'data-u="' + it.uid + '"') : '');
  function openTrade(b) {
    const p = P(), g = Math.random() < .5 ? 1 : (Math.random() < .25 ? 2 : 0);
    const theirs = [makeItem(pick(DROP_SLOTS), clamp(b.lvl + ri(-1, 1), 1, MAXL), g, p.cls)]; if (Math.random() < .5) theirs.push(makeItem(pick(DROP_SLOTS), clamp(b.lvl, 1, MAXL), 0, p.cls));
    TR = { b, mine: new Set(), myGold: 0, theirs, theirGold: ri(0, 6) * 25, stage: 'edit', msg: b.name + ' teklifini koydu. Karşılığında eşya ya da altın ekle, sonra Teklifi Gönder.' };
    if (typeof closeAll === 'function') closeAll(true); renderTrade(); tw.classList.remove('hidden');
  }
  const val = (items, gold) => items.reduce((s, it) => s + itemPrice(it), 0) + (gold || 0);
  function renderTrade() {
    if (!TR) return; const p = P(), my = p.inv.filter(it => TR.mine.has(it.uid));
    const slots = (arr, n) => { let h = ''; for (let i = 0; i < n; i++) h += arr[i] ? ico(arr[i]) : '<div class="it empty"></div>'; return h; };
    const bag = p.inv.map(it => '<div class="tbag' + (TR.mine.has(it.uid) ? ' on' : '') + '">' + ico(it) + '</div>').join('') || '<span class="mut">Çantan boş</span>';
    const lock = TR.stage !== 'edit';
    tw.innerHTML = '<button class="x" data-tr="close">✕</button><h2>Ticaret — ' + esc2(TR.b.name) + ' <small class="mut">Sv ' + TR.b.lvl + ' ' + CLSN(TR.b.cls) + '</small></h2>' +
      '<div class="tcols"><div class="tside"><h3>Senin teklifin</h3><div class="tgrid">' + slots(my, 6) + '</div><label class="tgold">Altın <input type="number" min="0" max="' + p.gold + '" value="' + TR.myGold + '" data-tr="gold"' + (lock ? ' disabled' : '') + '> <span class="mut">/ ' + p.gold + '</span></label><div class="tval">Değer: ' + val(my, TR.myGold) + '</div></div>' +
      '<div class="tarrow">⇄</div><div class="tside them"><h3>' + esc2(TR.b.name) + ' veriyor</h3><div class="tgrid">' + slots(TR.theirs, 6) + '</div><div class="tgold">Altın <b>' + TR.theirGold + '</b></div><div class="tval">Değer: ' + val(TR.theirs, TR.theirGold) + '</div></div></div>' +
      '<div class="tbagw"><div class="mut">Çantandan eklemek / çıkarmak için eşyaya dokun:</div><div class="tbags">' + bag + '</div></div>' +
      '<div class="tmsg ' + (TR.stage === 'agreed' ? 'ok' : TR.bad ? 'bad' : '') + '">' + esc2(TR.msg) + '</div>' +
      '<div class="tbtns">' + (TR.stage === 'edit' ? '<button class="gold" data-tr="send">Teklifi Gönder</button>' : TR.stage === 'wait' ? '<button disabled>Yanıt bekleniyor…</button>' : '<button class="gold" data-tr="done">Takası Tamamla</button><button data-tr="edit">Değiştir</button>') + '<button data-tr="close">İptal</button></div>';
  }
  tw.addEventListener('click', e => {
    if (!TR) return; const p = P();
    const it = e.target.closest('.tbag .it[data-u]'); if (it && TR.stage === 'edit') { const u = +it.dataset.u; if (TR.mine.has(u)) TR.mine.delete(u); else if (TR.mine.size < 6) TR.mine.add(u); TR.bad = false; renderTrade(); return; }
    const a = e.target.closest('[data-tr]'); if (!a) return; const k = a.dataset.tr;
    if (k === 'close') { if (TR) addChat(null, 'Ticaret iptal edildi.', '#a59cb8'); TR = null; tw.classList.add('hidden'); return; }
    if (k === 'edit') { TR.stage = 'edit'; TR.msg = 'Teklifini değiştirebilirsin.'; renderTrade(); return; }
    if (k === 'send') {
      TR.stage = 'wait'; TR.msg = TR.b.name + ' teklifini inceliyor…'; renderTrade();
      later(() => {
        if (!TR) return; const my = p.inv.filter(x => TR.mine.has(x.uid)), mv = val(my, TR.myGold), tv = val(TR.theirs, TR.theirGold);
        const okv = window.__kdForceAccept === 1 || mv >= tv * .85;
        if (okv) { TR.stage = 'agreed'; TR.bad = false; TR.msg = TR.b.name + ' teklifini KABUL ETTİ. Takası Tamamla\'ya bas.'; TR.b.say = { text: 'Anlaştık!', until: gameTime + 3 }; }
        else { TR.stage = 'edit'; TR.bad = true; TR.msg = TR.b.name + ': "Bu az kaldı, ' + Math.ceil(tv * .85 - mv) + ' değerinde daha ekle."'; TR.b.say = { text: 'Biraz daha ekle', until: gameTime + 3 }; }
        renderTrade();
      }, 700 + Math.random() * 700);
      return;
    }
    if (k === 'done' && TR.stage === 'agreed') {
      const my = p.inv.filter(x => TR.mine.has(x.uid));
      if (p.inv.length - my.length + TR.theirs.length > 40) { TR.msg = 'Çantanda yer yok!'; TR.bad = true; renderTrade(); return; }
      if (TR.myGold > p.gold) { TR.msg = 'Yeterli altının yok!'; TR.bad = true; TR.stage = 'edit'; renderTrade(); return; }
      p.inv = p.inv.filter(x => !TR.mine.has(x.uid)); p.gold -= TR.myGold; for (const x of TR.theirs) p.inv.push(x); p.gold += TR.theirGold;
      addChat(null, '⇄ ' + TR.b.name + ' ile takas tamamlandı: ' + TR.theirs.map(x => '[' + itemName(x) + ']').join(' ') + (TR.theirGold ? ' + ' + TR.theirGold + ' altın' : '') + ' aldın.', '#7dff9a');
      showToast('Takas tamamlandı!', TR.theirs.length + ' eşya + ' + TR.theirGold + ' altın', 1.8);
      TR = null; tw.classList.add('hidden'); try { refreshPanels(); save(); } catch (er) { } return;
    }
  });
  tw.addEventListener('input', e => { if (!TR || e.target.dataset.tr !== 'gold') return; const p = P(); TR.myGold = clamp(Math.floor(+e.target.value || 0), 0, p.gold); TR.bad = false; const v = tw.querySelector('.tside .tval'); if (v) v.textContent = 'Değer: ' + val(p.inv.filter(x => TR.mine.has(x.uid)), TR.myGold); });
  window.kdTradeState = () => TR;

  // ---------------- PARTİ ----------------
  const party = []; // bot isimleri
  const pw = document.createElement('div'); pw.id = 'kdParty'; document.body.appendChild(pw);
  function joinParty(b) { if (party.length >= 4) { showToast('Parti dolu (5 kişi)', '', 1.4); return; } if (!party.includes(b.name)) party.push(b.name); b.party = true; addChat(null, '⚑ ' + b.name + ' partiye katıldı. (Parti bonusu: +%10 TP)', '#9fe0ff'); renderParty(); }
  // v51: LİDERLİK — tek değişken (aynı anda tek lider). '@me' = oyuncu, aksi hâlde üye adı.
  let lead = '@me';
  const partyOrder = () => ['@me'].concat(party);
  function leaveParty(name, why) { const i = party.indexOf(name); if (i < 0) return; party.splice(i, 1); const b = findBot(name) || bots.find(x => x.name === name); if (b) b.party = false;
    addChat(null, '⚑ ' + name + (why === 'kick' ? ' partiden çıkarıldı.' : why === 'off' ? ' bağlantısı koptu, partiden düştü.' : ' partiden ayrıldı.'), '#9fe0ff');
    if (lead === name) { lead = partyOrder()[0]; addChat(null, '👑 Liderlik sıradaki üyeye geçti: ' + (lead === '@me' ? 'sen' : lead), '#ffd65a'); } // parti dağılmaz
    if (!party.length) lead = '@me'; renderParty(); }
  // yetki kontrollü işlemler (gerçek sürümde sunucuda doğrulanmalı)
  const PS = {
    kick(name, actor) { actor = actor || '@me'; if (lead !== actor) return { ok: false, err: 'Yalnız parti lideri üye çıkarabilir' }; if (!party.includes(name)) return { ok: false, err: 'Bu oyuncu partide değil' }; leaveParty(name, 'kick'); return { ok: true }; },
    transfer(to, actor) { actor = actor || '@me'; if (lead !== actor) return { ok: false, err: 'Yalnız parti lideri liderliği devredebilir' }; if (to === actor) return { ok: false, err: 'Zaten lidersin' };
      if (to !== '@me' && !party.includes(to)) return { ok: false, err: 'Bu oyuncu partide değil' }; lead = to; addChat(null, '👑 Yeni parti lideri: ' + (to === '@me' ? 'sen' : to), '#ffd65a'); renderParty(); return { ok: true }; },
    disband(actor) { actor = actor || '@me'; if (lead !== actor) return { ok: false, err: 'Yalnız lider partiyi dağıtabilir' }; for (const n of [...party]) leaveParty(n); lead = '@me'; return { ok: true }; },
    leaveSelf() { for (const n of [...party]) { const b = findBot(n) || bots.find(x => x.name === n); if (b) b.party = false; } party.length = 0; lead = '@me'; addChat(null, '⚑ Partiden ayrıldın.', '#9fe0ff'); renderParty(); return { ok: true }; },
    askLead() { if (lead === '@me') return { ok: false, err: 'Zaten lidersin' }; const yes = Math.random() < .75 || window.__kdForceAccept; const ln = lead;
      if (yes) { lead = '@me'; addChat('[Parti] ' + ln, 'Tamam, liderlik sende.', '#7dff9a'); addChat(null, '👑 Yeni parti lideri: sen', '#ffd65a'); } else addChat('[Parti] ' + ln, 'Şimdilik ben yöneteyim.', '#ff9a9a'); renderParty(); return { ok: yes }; },
  };
  window.kdPartyLeader = () => lead; window.kdPartySvc = PS;
  function renderParty() {
    const p = P(); if (!party.length || !p) { pw.classList.remove('on'); pw.innerHTML = ''; closePM2(); return; }
    const row = (key, n, l, c, f) => { const pc = Math.round(clamp(f, 0, 1) * 100), me = key === '@me'; return '<div class="pr' + (me ? ' me' : '') + (pc < 30 ? ' low' : '') + '" data-pm="' + esc2(key) + '"><b>' + (lead === key ? '<i class="crown">👑</i>' : '') + esc2(n) + '</b><span>' + l + '</span><i class="hp"><i style="width:' + pc + '%"></i></i><em>' + pc + '</em></div>'; };
    pw.innerHTML = '<div class="ph">Parti ' + (party.length + 1) + '/5</div>' + row('@me', p.name, p.lvl, p.cls, p.hp / p.stats.maxHp) +
      party.map(n => { const b = bots.find(x => x.name === n); return b ? row(n, n, b.lvl, b.cls, b.hp / b.maxHp) : ''; }).join('');
    pw.classList.add('on');
  }
  // üyeye dokun → küçük yönetim penceresi
  const pm2 = document.createElement('div'); pm2.id = 'kdPartyPop'; document.body.appendChild(pm2); let pmKey = null, pmAsk = null;
  function closePM2() { pm2.classList.remove('on'); pmKey = null; pmAsk = null; }
  function openPM2(key, el) { pmKey = key; pmAsk = null; const r = el.getBoundingClientRect(); pm2.style.left = Math.round(r.right + 6) + 'px'; pm2.style.top = Math.round(r.top) + 'px'; drawPM2(); pm2.classList.add('on'); }
  function drawPM2() {
    const p = P(), me = pmKey === '@me', L = lead === '@me', name = me ? p.name : pmKey; let h = '<div class="t">' + (lead === pmKey ? '👑 ' : '') + esc2(name) + (me ? ' (sen)' : '') + '</div>';
    if (pmAsk) h += '<div class="q">' + pmAsk.text + '</div><div class="row"><button class="yes" data-y="1">Evet</button><button data-n="1">Hayır</button></div>';
    else if (me) h += (L ? '<button data-act="disband">⚑ Partiyi dağıt</button>' : '<button data-act="ask">👑 Liderliği iste</button>') + '<button data-act="leave">↩ Partiden ayrıl</button>';
    else h += '<button data-act="lead"' + (L ? '' : ' disabled') + '>👑 Liderliği devret</button><button data-act="kick"' + (L ? '' : ' disabled') + '>✕ Partiden çıkar</button><button data-act="pm">✉ Fısılda</button>' + (L ? '' : '<div class="n">Yönetim işlemleri yalnız liderde</div>');
    pm2.innerHTML = h;
  }
  pw.addEventListener('pointerdown', e => { const r = e.target.closest('[data-pm]'); if (!r) return; e.preventDefault(); e.stopPropagation(); if (pm2.classList.contains('on') && pmKey === r.dataset.pm) closePM2(); else openPM2(r.dataset.pm, r); });
  pm2.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const b = e.target.closest('button'); if (!b || b.disabled) return; const d = b.dataset, key = pmKey; let res = null;
    if (d.n) { pmAsk = null; drawPM2(); return; }
    if (d.y && pmAsk) { res = pmAsk.fn(); closePM2(); if (res && !res.ok && res.err) showToast(res.err, '', 1.6); return; }
    const a = d.act;
    if (a === 'pm') { closePM2(); startPM(key); return; }
    if (a === 'ask') { closePM2(); PS.askLead(); return; }
    const Q = { lead: ['Liderliği ' + key + ' oyuncusuna devret?', () => PS.transfer(key)], kick: [key + ' partiden çıkarılsın mı?', () => PS.kick(key)], disband: ['Parti dağıtılsın mı?', () => PS.disband()], leave: ['Partiden ayrılmak istiyor musun?', () => PS.leaveSelf()] }[a];
    if (Q) { pmAsk = { text: Q[0], fn: Q[1] }; drawPM2(); } });
  addEventListener('pointerdown', e => { if (pm2.classList.contains('on') && !e.target.closest('#kdPartyPop,#kdParty')) closePM2(); }, true);
  setInterval(() => { if (!party.length) return; for (const n of [...party]) if (!bots.find(x => x.name === n)) leaveParty(n, 'off'); renderParty(); }, 600);
  window.kdPartyRestore = names => { party.length = 0; const p = P(); for (const n of names) { let b = bots.find(x => x.name === n); if (!b) { b = makeBot(n, bots.length, 'ally', p.lvl, p.x + rr(-50, 50), p.y + rr(10, 50)); bots.push(b); } b.party = true; if (party.length < 4) party.push(n); } renderParty(); };
  window.kdParty = () => party.slice(); window.kdInvite = b => request('party', b);
  // parti üyesi bot: oyuncuyu takip eder, oyuncunun yakınındaki canavarlara saldırır
  if (typeof updBot === 'function') {
    const _ub = updBot;
    updBot = function (b, dt) {
      if (!b.party || !b.alive) return _ub.apply(this, arguments);
      const p = P(); if (!p) return _ub.apply(this, arguments);
      const dp = Math.hypot(p.x - b.x, p.y - b.y);
      if (dp > 700) { b.x = p.x + rr(-40, 40); b.y = p.y + rr(10, 40); }
      if (b.target && (b.target.dead || dist(p, b.target) > 320)) b.target = null;
      if (!b.target) { let best = null, bd = 260; for (const e of enemies) { if (e.dead || e.d.pvp && e.duel) continue; const d = dist(p, e); if (d < bd) { bd = d; best = e; } } b.target = best; }
      if (b.target) return _ub.apply(this, arguments);
      b.anim += dt; b.atkAnim = Math.max(0, b.atkAnim - dt);
      if (dp > 80) moveToward(b, p.x - 30 + (party.indexOf(b.name) % 2 ? 60 : 0), p.y + 20, Math.max(140, p.stats.spd * 1.05), dt); else b.moving = false;
    };
  }
  if (typeof gainXp === 'function') { const _gx = gainXp; gainXp = function (v) { if (party.length && v > 0) v = Math.round(v * 1.1); return _gx.call(this, v); }; }
  if (typeof enterMap === 'function') { const _em = enterMap; enterMap = function () { const had = party.length && !window.__kdKeepParty; const r = _em.apply(this, arguments); if (had) { party.length = 0; lead = '@me'; addChat(null, '⚑ Harita değiştirdiğin için parti dağıldı.', '#9fe0ff'); renderParty(); } endDuel(null, true); return r; }; }

  // ---------------- DÜELLO (1v1) ----------------
  let duel = null; // {b, e, t0, started}
  const db = document.createElement('div'); db.id = 'kdDuelB'; document.body.appendChild(db);
  function banner(t, cls) { db.className = ''; void db.offsetWidth; db.textContent = t; db.className = 'show ' + (cls || ''); }
  function makeDuelFoe(b) {
    const c = CLASSES[b.cls], L = b.lvl - 1, hp = Math.round((c.hp + c.hpL * L) * 1.2);
    const sp = { type: 'foe', lvl: b.lvl, x: b.x, y: b.y, resp: 99999, timer: 99999 };
    return { kind: 'enemy', type: 'foe', d: Object.assign({}, ET.foe, { name: b.name, resp: 99999 }), name: b.name, cls: b.cls, lvl: b.lvl, gender: b.gender, hair: b.hair, hairCol: b.hairCol, skin: b.skin, wGrade: b.wGrade, wPlus: b.wPlus, aGrade: b.aGrade, aPlus: b.aPlus, helm: b.helm, foe: true, duel: true,
      x: b.x, y: b.y, sx: b.x, sy: b.y, sp, maxHp: hp, hp, atk: (c.atk + c.atkL * L), def: c.def + c.defL * L + L, range: c.range, as: c.as * 1.2, ranged: !!c.proj, r: 12, cr: 8, state: 'idle', wt: 0, wx: b.x, wy: b.y, atkT: 1.2, atkAnim: 0, alt: false, target: null, tagged: null, anim: 0, hitT: -9, slowUntil: 0, stunUntil: 0, dots: [], face: 1, skillT: rr(5, 8), scan: 0, dead: false, diedAt: 0, moving: false, dodge: c.dodge };
  }
  function startDuel(b) {
    if (duel) return; const p = P();
    duel = { b, e: null, t0: gameTime, started: false, hp0: p.hp };
    p.target = null; p.chase = false; banner('3', 'cd');
    later(() => duel && banner('2', 'cd'), 1000); later(() => duel && banner('1', 'cd'), 2000);
    later(() => {
      if (!duel) return; const e = makeDuelFoe(b); duel.e = e; duel.started = true; b.alive = false; b.respawnAt = 1e9; b.inDuel = true;
      enemies.push(e); e.target = p; P().target = e; banner('DÜELLO!', 'go'); addChat(null, '⚔ ' + b.name + ' ile düello başladı!', '#ffd65a');
    }, 3000);
  }
  function endDuel(winnerIsPlayer, silent) {
    if (!duel) return; const d = duel, p = P(); duel = null;
    if (d.e) { d.e.dead = true; d.e._rm = true; if (p.target === d.e) p.target = null; } // dizi, döngü bitince temizlenir
    const b = d.b; b.alive = true; b.inDuel = false; b.respawnAt = 0; if (d.e) { b.x = d.e.x; b.y = d.e.y; }
    if (silent) return;
    if (winnerIsPlayer) { banner('ZAFER!', 'win'); addChat(null, '🏆 Düelloyu kazandın! ' + b.name + ' yenildi.', '#ffd65a'); b.say = { text: 'Tebrikler, iyi dövüştün!', until: gameTime + 4 }; p.duelWins = (p.duelWins || 0) + 1; }
    else { banner('YENİLDİN', 'lose'); addChat(null, '⚔ Düelloyu ' + b.name + ' kazandı.', '#ff9a9a'); b.say = { text: 'GG! Bir dahakine :)', until: gameTime + 4 }; p.hp = Math.max(p.hp, Math.round(p.stats.maxHp * .3)); }
  }
  window.kdDuel = () => duel;
  // düello rakibi güvenli bölgede de oyuncuya saldırır (sadece düelloda)
  let duelAI = false;
  if (typeof validTarget === 'function') { const _vt = validTarget; validTarget = function (t) { if (duelAI && t === P()) return !P().dead; return _vt.apply(this, arguments); }; }
  if (typeof updEnemy === 'function') { const _ue = updEnemy; updEnemy = function (e, dt) { if (!e.duel) return _ue.apply(this, arguments); duelAI = true; try { e.target = P(); return _ue.apply(this, arguments); } finally { duelAI = false; } }; }
  // rakip yenilince: onur/ganimet yok, düello biter
  if (typeof killEnemy === 'function') { const _ke = killEnemy; killEnemy = function (e, src) { if (e && e.duel) { e.dead = true; e.hp = 0; endDuel(true); return; } return _ke.apply(this, arguments); }; }
  // oyuncu düelloda ölmez: yenilir
  if (typeof die === 'function') { const _die = die; die = function (src) { if (duel && duel.e && src === duel.e) { const p = P(); p.dead = false; p.hp = 1; endDuel(false); return; } return _die.apply(this, arguments); }; }
  // çok uzaklaşınca düello iptal
  if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try { for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i]._rm) enemies.splice(i, 1); if (duel && duel.e && Math.hypot(P().x - duel.e.x, P().y - duel.e.y) > 1000) { addChat(null, 'Düello iptal: çok uzaklaştın.', '#a59cb8'); endDuel(null, true); } } catch (e) { } }; }
})();
