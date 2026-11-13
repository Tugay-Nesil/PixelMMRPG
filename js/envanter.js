'use strict';
// =====================================================================
//  YENİ ENVANTER (Sürüm 26) — tek pencere, iki sekme: Eşyalar / Malzemeler
//  • Sağ tık  → kuşan / çıkar      • Çift tık / çift dokunuş → kuşan / çıkar
//  • Tek tık  → alttaki bilgi şeridinde ayrıntı + Kuşan/Çıkar düğmesi
//  • Sürükle-bırak: çantadan yuvaya kuşan, yuvadan çantaya çıkar, çanta içinde taşı
//  Eski sürükle-bırak altyapısı (invPointerDown/Move/Up, equip, unequip) aynen kullanılır.
// =====================================================================
(function () {
  const $i = id => document.getElementById(id);
  const CH = { warrior: ['Knight', 'SamuraiBlue', 'KnightGold'], mage: ['SorcererOrange', 'SorcererBlack', 'NinjaMageBlack'], archer: ['Hunter', 'CamouflageGreen', 'CamouflageRed'], assassin: ['NinjaGray', 'NinjaDark', 'NinjaRed'], priest: ['Monk', 'Monk2', 'Master'] };
  const WP = { warrior: ['Sword', 'Sword2', 'BigSword'], mage: ['Stick', 'MagicWand', 'MagicWand'], archer: ['Bow', 'Bow2', 'Bow2'], assassin: ['Sai', 'Katana', 'Ninjaku'], priest: ['Stick', 'Book', 'MagicWand'] };
  const GEM = ['GemGreen', 'GemPurple', 'GemYellow'];

  // ---------- piksel eşya ikonları (tüm pencerelerde: çanta, karakter, dükkan, demirci) ----------
  // yeni yuvalar: üretilmiş ikon atlası (2 biçim × 8 malzeme rengi); kalite → renk ailesi, it.v → çeşit
  const PALG = [[0, 1, 2], [3, 4, 5], [6, 7]];
  const ATL = { ring: 1, necklace: 1, belt: 1, bracers: 1, pants: 1, boots: 1 };
  function atlasIcon(slot, g, v, extra) { const L = PALG[g], pi = L[Math.floor(v / 2) % L.length], sh = v % 2; return '<i class="pxi eqi' + (extra || '') + '" style="background-image:url(na/eqi_' + slot + '.png);background-position:' + (pi * 100 / 7).toFixed(3) + '% ' + (sh * 100) + '%"></i>'; }
  itemIcon = function (it) {
    const g = Math.max(0, Math.min(2, it.grade || 0)), c = CH[it.cls] ? it.cls : 'warrior', v = it.v || 0;
    if (it.slot === 'weapon') return '<i class="pxi pxw" style="background-image:url(na/w_' + (it.wn || WP[c][g]) + '.png)"></i>';
    if (it.slot === 'armor') return '<i class="pxi pxa" style="background-image:url(na/c_' + CH[c][g] + '.png)"></i>';
    if (it.slot === 'helmet') return '<i class="pxi pxh" style="background-image:url(na/f_' + CH[c][g] + '.png)"></i>';
    if (ATL[it.slot]) return atlasIcon(it.slot, g, v);
    return '<i class="pxi" style="background-image:url(na/ii_' + GEM[g] + '.png)"></i>';
  };
  const PH = { weapon: 'w_Sword', armor: 'c_Caveman', helmet: 'f_Caveman', ring: 'ii_GemGreen' };
  const phIcon = sl => { const b = typeof eqBase === 'function' ? eqBase(sl) : sl; return ATL[b] ? atlasIcon(b, 0, 0, ' ph') : '<i class="pxi ph" style="background-image:url(na/' + PH[b] + '.png)"></i>'; };
  // karşılaştırılacak takılı eşya (yüzükte: boş yuva varsa boş, yoksa zayıf olan)
  function curFor(it) { const p = player; if (it.slot !== 'ring') return p.eq[it.slot]; if (!p.eq.ring || !p.eq.ring2) return null; return itemPrice(p.eq.ring) <= itemPrice(p.eq.ring2) ? p.eq.ring : p.eq.ring2; }

  // ---------- malzeme listesi ----------
  const MICON = { bless: 'GemYellow', oto1: 'Hourglass', afk1: 'Grass', pazar1: 'Chest', rename: 'Scroll', wood: 'Branch', ore: 'BarIron', herb: 'Grass', crystal: 'GemPurple', up: 'Scroll', luck: 'ScrollPlant', prot: 'ScrollIce', ench: 'ScrollThunder' };
  function matList() {
    const p = player, L = [];
    L.push({ k: 'potHp', ic: 'ii_LifePot', n: p.potHp, t: 'Can İksiri', d: 'Canının %40\'ını yeniler. Kısayol: Q', col: '#ff6a6a' });
    L.push({ k: 'potMp', ic: 'ii_WaterPot', n: p.potMp, t: 'Mana İksiri', d: 'Mananın %40\'ını yeniler. Kısayol: E', col: '#6aa8ff' });
    if (typeof RES !== 'undefined') for (const k of Object.keys(RES)) if (p.res && p.res[k] > 0) L.push({ k, ic: 'ii_' + (MICON[k] || 'Bag'), n: p.res[k], t: RES[k].n, d: 'Toplanan malzeme. Zanaatkâr\'da iksire ve parşömene dönüşür.', col: '#d8d0b0' });
    for (const k of Object.keys(MATS)) if (p.mats[k] > 0) L.push({ k, ic: 'ii_' + (MICON[k] || 'Scroll'), n: p.mats[k], t: MATS[k].n, d: MATS[k].desc, col: MATS[k].col });
    if (p.compass) L.push({ k: 'compass', ic: 'ii_Hourglass', n: p.compass, t: 'Hazine Pusulası', d: 'Hazine bitince otomatik kullanılır.', col: '#ffd040' });
    return L;
  }

  // ---------- durum ----------
  let tab = 'items', sel = null, hov = null, lastTap = { k: '', t: 0 };
  // çöp: seçim modu + onay bekleyen silme
  let trashMode = false, marks = new Set(), pending = null;
  const selItem = s => !s ? null : s.bag != null ? player.inv[s.bag] : s.eq ? player.eq[s.eq] : null;

  function infoHTML() {
    const s = hov || sel, p = player;
    if (pending) {
      const its = pending.items, leg = its.some(x => x.it.grade >= 2 || (x.it.plus || 0) >= 5);
      return '<div class="kdi-ic it trash"><i class="kdtrash-ic"></i></div><div class="kdi-tx"><b style="color:#ff8a8a">' + (its.length === 1 ? '<span class="g' + its[0].it.grade + 'c">' + esc(itemName(its[0].it)) + '</span> çöpe atılsın mı?' : its.length + ' eşya çöpe atılsın mı?') + '</b><br>' +
        (leg ? '<span class="kdreq">Dikkat: aralarında efsanevi ya da yüksek basılmış eşya var!</span><br>' : '') + '<span class="mut">Çöpe atılan eşya geri gelmez.</span></div>' +
        '<div class="kdi-bt"><button class="kdbtn red" data-act="trashyes">Evet, at</button><button class="kdbtn" data-act="trashno">Vazgeç</button></div>';
    }
    if (trashMode && !s) return '<div class="kdi-empty"><b>Çöp modu:</b> atmak istediğin eşyalara dokun, sonra üstteki <b>Seçilenleri At</b> düğmesine bas. Eşyayı pencerenin <b>dışına sürükleyip bırakarak</b> da atabilirsin.</div>';
    if (!s) return '<div class="kdi-empty">' + (tab === 'items' ? 'Bir eşyaya dokun → ayrıntı. <b>Sağ tık</b> ya da <b>çift dokunuş</b> → kuşan/çıkar. <b>Sürükle-bırak</b> → taşı. Pencerenin <b>dışına bırak</b> → çöpe at.' : 'Bir malzemeye dokun → ayrıntı.') + '</div>';
    if (s.mat) { const m = matList().find(x => x.k === s.mat); if (!m) return ''; return '<div class="kdi-ic it g0"><i class="pxi" style="background-image:url(na/' + m.ic + '.png)"></i></div><div class="kdi-tx"><b style="color:' + m.col + '">' + esc(m.t) + '</b> <span class="mut">× ' + m.n + '</span><br><span class="mut">' + esc(m.d || '') + '</span></div>'; }
    const it = selItem(s); if (!it) return '';
    const eq = !!s.eq, btn = eq ? '<button class="kdbtn" data-act="uneq">Çıkar</button>' : '<button class="kdbtn gold" data-act="eq">Kuşan</button>';
    const st = itemStats(it), req = itemReq(it);
    const lines = Object.keys(st).map(k => '<span class="kds">' + fmtStat(k, st[k], false) + '</span>').join('');
    let cmp = '';
    if (!eq) {
      const cur = curFor(it), d = diffStats(it, cur), keys = Object.keys(d).filter(k => Math.abs(d[k]) > 1e-6);
      const v = verdict(it, cur);
      cmp = '<div class="kdcmp"><div class="kdcmp-h"><span class="kdv ' + v[0] + '">' + v[1] + '</span><span class="mut">' + (cur ? 'Takılı: <span class="g' + cur.grade + 'c">' + esc(itemName(cur)) + '</span>' : 'Bu yuva boş') + '</span></div>' +
        '<div class="kdchips">' + (keys.length ? keys.map(k => '<span class="kdchip ' + (d[k] > 0 ? 'up' : 'down') + '">' + (d[k] > 0 ? '▲ ' : '▼ ') + fmtStat(k, d[k], true) + '</span>').join('') : '<span class="kdchip same">Aynı değerler</span>') + '</div></div>';
    }
    return '<div class="kdi-ic it g' + it.grade + '">' + itemIcon(it) + (it.plus ? '<span class="pl">+' + it.plus + '</span>' : '') + '</div>' +
      '<div class="kdi-tx"><b class="g' + it.grade + 'c">' + esc(itemName(it)) + '</b> <span class="mut">' + GRADES[it.grade].n + ' ' + SLOT_TR[it.slot] + ' • Sv ' + it.lvl + '</span>' + (window.kdReqHTML ? kdReqHTML(it) : '') +
      '<div class="kdstl">' + lines + '</div>' + cmp + '</div><div class="kdi-bt">' + btn + '<span class="kdprice">' + itemPrice(it) + ' altın</span></div>';
  }
  // karşılaştırma yardımcıları
  const SN = { atk: 'Saldırı', def: 'Savunma', hp: 'Can', mp: 'Mana', crit: 'Kritik', str: 'Güç', dex: 'Çeviklik', int: 'Zeka', ap: 'Saldırı Gücü' };
  function fmtStat(k, v, sign) { const n = k === 'crit' ? +(v * 100).toFixed(1) : Math.round(v); return (sign && n > 0 ? '+' : '') + n + (k === 'crit' ? '%' : '') + ' ' + (SN[k] || k); }
  function diffStats(it, cur) { const a = itemStats(it), b = cur ? itemStats(cur) : {}, d = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) d[k] = (a[k] || 0) - (b[k] || 0); return d; }
  const WGT = { atk: 1, def: 1.1, hp: .12, mp: .06, crit: 120, str: 1, dex: 1, int: 1, ap: .6 };
  function score(it, cur) { const d = diffStats(it, cur); let s = 0; for (const k in d) s += d[k] * (WGT[k] || .5); return s; }
  function verdict(it, cur) { if (!cur) return ['up', 'BOŞ YUVA • KAZANÇ']; const d = diffStats(it, cur), v = Object.values(d).filter(x => Math.abs(x) > 1e-6); if (!v.length) return ['same', 'AYNI']; if (v.every(x => x >= 0)) return ['up', 'DAHA İYİ']; if (v.every(x => x <= 0)) return ['down', 'DAHA ZAYIF']; return score(it, cur) > 0 ? ['mix up', 'GENEL OLARAK İYİ'] : ['mix down', 'GENEL OLARAK ZAYIF']; }
  window.kdBetter = (it) => score(it, curFor(it)) > 0;
  function refreshInfo() { const b = document.querySelector('#inv.kd2 .kdinfo'); if (b) b.innerHTML = infoHTML(); markSel(); }
  function markSel() {
    const w = $i('inv'); if (!w) return; w.querySelectorAll('.kdsel').forEach(x => x.classList.remove('kdsel'));
    if (!sel) return; const q = sel.bag != null ? '[data-i="' + sel.bag + '"]' : sel.eq ? '[data-eq="' + sel.eq + '"]' : sel.mat ? '[data-mat="' + sel.mat + '"]' : null; if (q) { const e = w.querySelector(q); if (e) e.classList.add('kdsel'); }
  }

  // ---------- çizim ----------
  renderInv = function () {
    const p = player, s = p.stats, w = $i('inv'); w.classList.add('kd2');
    if (sel && !selItem(sel) && !sel.mat) sel = null;
    const eqSlot = (sl, lab) => { const it = p.eq[sl]; return '<div class="eqslot kdeq q-' + sl + '" data-eqslot="' + sl + '">' + (it ? itemBox(it, 'data-eq="' + sl + '"') : '<div class="it empty eqph">' + phIcon(sl) + '</div>') + '<span class="eqlbl">' + lab + '</span></div>'; };
    let body = '';
    if (tab === 'items') {
      let g = ''; for (let i = 0; i < 40; i++) { const it = p.inv[i]; g += it ? itemBox(it, 'data-i="' + i + '"') : '<div class="it empty" data-slot-bag="' + i + '"></div>'; }
      body = '<div class="kdmain">' +
        '<div class="kddoll"><div class="kdprev"><canvas id="kdPrev" width="120" height="150"></canvas></div>' + EQ_ORDER.map(sl => eqSlot(sl, SLOT_TR[sl])).join('') +
        '<div class="kdstats"><span class="st hp"><img class="px" src="na/i_heart.png" alt="">' + s.maxHp + '</span><span class="st atk"><img class="px" src="na/i_sword.png" alt="">' + Math.round(s.atk) + '</span><span class="st def"><img class="px" src="na/i_shield.png" alt="">' + Math.round(s.def) + '</span><span class="st crit"><img class="px" src="na/i_star.png" alt="">%' + Math.round(s.crit * 100) + '</span></div></div>' +
        '<div class="kdbag"><div class="kdbagh"><span>Çanta <b>' + p.inv.length + '</b>/40</span><span class="kdbagbt">' + (trashMode ? '<button class="kdbtn sm red" data-act="trashsel"' + (marks.size ? '' : ' disabled') + '>Seçilenleri At (' + marks.size + ')</button><button class="kdbtn sm" data-act="trashoff">İptal</button>' : '<button class="kdbtn sm trashbtn" data-act="trash"><i class="kdtrash-ic"></i>Çöpe At</button><button class="kdbtn sm" data-act="sort">Sırala</button>') + '</span></div><div id="invgrid">' + g + '</div></div></div>';
    } else {
      const L = matList(), open = typeof bagSlots === 'function' ? bagSlots() : 40;
      let g = ''; for (let i = 0; i < 40; i++) { const m = L[i]; if (m) g += '<div class="it g0 kdmat" data-mat="' + m.k + '"><i class="pxi" style="background-image:url(na/' + m.ic + '.png)"></i><span class="lv">' + m.n + '</span></div>'; else if (i >= open + 2) g += '<div class="it lock"><i class="pxi lk"></i></div>'; else g += '<div class="it empty"></div>'; }
      body = '<div class="kdmats"><div class="kdbagh"><span>Malzemeler <span class="mut">• Her 2 seviyede 2 yuva açılır</span></span></div><div class="kdmgrid">' + g + '</div>' + (window.kdAutoBlock ? kdAutoBlock() : '') + '</div>';
    }
    w.innerHTML = '<div class="kdh"><div class="kdtabs"><button data-tab="items" class="' + (tab === 'items' ? 'on' : '') + '">Eşyalar</button><button data-tab="mats" class="' + (tab === 'mats' ? 'on' : '') + '">Malzemeler</button></div>' +
      '<div class="kdgold"><img class="px" src="na/i_coin.png" alt="">' + (p.gold || 0).toLocaleString('tr-TR') + '</div><button class="x" data-close="inv">✕</button></div>' + body + '<div class="kdinfo">' + infoHTML() + '</div>';
    if (tab === 'items') w.querySelectorAll('#invgrid .it[data-i]').forEach(c => { const it = p.inv[+c.dataset.i]; if (!it) return; const sc = score(it, curFor(it)); if (Math.abs(sc) < 1e-6) return; const a = document.createElement('span'); a.className = 'kdar ' + (sc > 0 ? 'up' : 'down'); a.textContent = sc > 0 ? '▲' : '▼'; c.appendChild(a); });
    w.classList.toggle('kdtrashmode', trashMode && tab === 'items');
    if (trashMode) { for (const uid of [...marks]) if (!p.inv.some(x => x.uid === uid)) marks.delete(uid); w.querySelectorAll('#invgrid .it[data-i]').forEach(c => { const it = p.inv[+c.dataset.i]; if (it && marks.has(it.uid)) c.classList.add('kdmark'); }); }
    markSel(); startPrev();
  };
  function doTrash(items) {
    const p = player; let n = 0, eqd = false;
    for (const x of items) {
      if (x.eq) { if (p.eq[x.eq] === x.it) { p.eq[x.eq] = null; eqd = true; n++; } }
      else { const i = p.inv.indexOf(x.it); if (i >= 0) { p.inv.splice(i, 1); n++; } }
      marks.delete(x.it.uid);
    }
    if (eqd) recalc(p);
    pending = null; sel = hov = null; if (!marks.size) trashMode = false;
    if (n && typeof showToast === 'function') showToast(n === 1 ? 'Eşya çöpe atıldı' : n + ' eşya çöpe atıldı', '', 1.4);
    renderInv(); try { save(); } catch (e) { }
  }
  window.kdTrash = doTrash;

  // ---------- karakter önizlemesi ----------
  let raf = 0;
  function startPrev() {
    cancelAnimationFrame(raf); const cv = $i('kdPrev'); if (!cv) return; const pc = cv.getContext('2d'); const t0 = performance.now();
    const loop = now => {
      if (!cv.isConnected || $i('inv').classList.contains('hidden')) { raf = 0; return; }
      const t = (now - t0) / 1000, p = player, old = ctx; ctx = pc; pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, cv.width, cv.height); pc.imageSmoothingEnabled = false;
      const cyc = t % 3.2, atk = cyc < .22 ? .22 - cyc : 0, dirs = ['front', 'side', 'back', 'side'], di = Math.floor(t / 2.4) % 4;
      try { drawHero(60, 140, { cls: p.cls, gender: p.gender, face: di === 3 ? -1 : 1, dir: dirs[di], anim: t, moving: cyc > 1.2, atk, alt: false, wGrade: p.wGrade || 0, wName: p.wName || null, wPlus: p.wPlus || 0, aGrade: p.aGrade || 0, aPlus: p.aPlus || 0, helm: -1, noW: !p.eq.weapon, noA: !p.eq.armor, s: 2.2 }); } catch (e) { }
      ctx = old; raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  // ---------- etkileşim ----------
  const w = $i('inv');
  function keyOf(el) { if (!el) return null; if (el.dataset.i !== undefined) return { bag: +el.dataset.i }; if (el.dataset.eq) return { eq: el.dataset.eq }; if (el.dataset.mat) return { mat: el.dataset.mat }; return null; }
  function act(s) { if (!s) return; if (s.bag != null) { equip(s.bag); sel = null; } else if (s.eq) { unequip(s.eq); sel = null; } }
  w.addEventListener('click', e => {
    if (!w.classList.contains('kd2')) return;
    const tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; sel = hov = null; renderInv(); return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'trash') { trashMode = true; marks.clear(); pending = null; sel = hov = null; renderInv(); return; }
    if (a === 'trashoff') { trashMode = false; marks.clear(); pending = null; renderInv(); return; }
    if (a === 'trashsel') { const its = player.inv.filter(x => marks.has(x.uid)).map(it => ({ it })); if (its.length) { pending = { items: its }; sel = hov = null; refreshInfo(); } return; }
    if (a === 'trashyes') { if (pending) doTrash(pending.items); return; }
    if (a === 'trashno') { pending = null; refreshInfo(); return; }
    if (a === 'eq' || a === 'uneq') { act(sel); hov = null; }
    else if (a === 'sort') { const O = { weapon: 0, armor: 1, helmet: 2, ring: 3 }; player.inv.sort((x, y) => O[x.slot] - O[y.slot] || y.grade - x.grade || y.lvl - x.lvl || (y.plus || 0) - (x.plus || 0)); sel = null; renderInv(); try { save(); } catch (er) { } }
  });
  // sağ tık: kuşan / çıkar
  w.addEventListener('contextmenu', e => { if (!w.classList.contains('kd2')) return; if (trashMode) { e.preventDefault(); return; } const el = e.target.closest('.it[data-i],.it[data-eq]'); e.preventDefault(); if (el) { hov = null; act(keyOf(el)); } });
  // tek dokunuş: seç (eski "dokununca hemen kuşan" davranışı yerine) — çift dokunuş: kuşan
  const outside = (x, y) => { const r = w.getBoundingClientRect(); return x < r.left || x > r.right || y < r.top || y > r.bottom; };
  const overTrash = (x, y) => { const el = document.elementFromPoint(x, y); return !!(el && el.closest && el.closest('#inv [data-act="trash"],#inv [data-act="trashsel"]')); };
  addEventListener('pointermove', e => { if (typeof invDrag === 'undefined' || !invDrag || !invDrag.moved || !invDrag.ghost) return; const t = outside(e.clientX, e.clientY) || overTrash(e.clientX, e.clientY); invDrag.ghost.classList.toggle('kdtrashghost', t); w.classList.toggle('kddropout', t); });
  addEventListener('pointerup', e => {
    if (typeof invDrag === 'undefined' || !invDrag || !w.classList.contains('kd2')) return;
    if (invDrag.moved) { // pencere dışına (ya da çöp düğmesine) bırakıldı → çöpe at onayı
      w.classList.remove('kddropout');
      if (!outside(e.clientX, e.clientY) && !overTrash(e.clientX, e.clientY)) return;
      const d = invDrag; invDrag = null; if (d.ghost) d.ghost.remove(); if (d.el) d.el.classList.remove('dragging'); if (typeof invClearHi === 'function') invClearHi();
      pending = { items: [d.fromBag ? { it: d.it } : { it: d.it, eq: d.slot }] }; sel = hov = null; refreshInfo(); return;
    }
    const d = invDrag; invDrag = null; if (d.el) d.el.classList.remove('dragging'); if (typeof invClearHi === 'function') invClearHi();
    if (trashMode) { if (d.fromBag) { const u = d.it.uid; if (marks.has(u)) marks.delete(u); else marks.add(u); renderInv(); } return; }
    const k = d.fromBag ? { bag: d.idx } : { eq: d.slot }, id = d.fromBag ? 'b' + d.it.uid : 'e' + d.slot, now = performance.now();
    if (lastTap.k === id && now - lastTap.t < 380) { lastTap = { k: '', t: 0 }; hov = null; act(k); return; }
    lastTap = { k: id, t: now }; sel = k; hov = null; refreshInfo();
  }, true);
  w.addEventListener('pointerdown', e => { if (!w.classList.contains('kd2')) return; const m = e.target.closest('[data-mat]'); if (m) { sel = { mat: m.dataset.mat }; hov = null; refreshInfo(); } });
  // fareyle üzerine gelince bilgi şeridi (ipucu balonu yerine)
  window.kdInvHover = function (ev) { const el = ev.target.closest('.it[data-i],.it[data-eq]'); const k = keyOf(el); if (!k) return; if (hov && JSON.stringify(hov) === JSON.stringify(k)) return; hov = k; const b = document.querySelector('#inv.kd2 .kdinfo'); if (b) b.innerHTML = infoHTML(); };
  w.addEventListener('mouseover', e => { if (!w.classList.contains('kd2')) return; const m = e.target.closest('[data-mat]'); if (!m) return; if (hov && hov.mat === m.dataset.mat) return; hov = { mat: m.dataset.mat }; const b = w.querySelector('.kdinfo'); if (b) b.innerHTML = infoHTML(); });
  w.addEventListener('mouseout', e => { if (!hov) return; const to = e.relatedTarget; if (to && to.closest && to.closest('.it[data-i],.it[data-eq],[data-mat]')) return; hov = null; const b = document.querySelector('#inv.kd2 .kdinfo'); if (b) b.innerHTML = infoHTML(); });

  // ---------- Çanta (U) artık aynı pencerenin Malzemeler sekmesi ----------
  toggleBag = function () { const iw = $i('inv'); if (!iw.classList.contains('hidden') && tab === 'mats') { iw.classList.add('hidden'); return; } tab = 'mats'; sel = hov = null; if (typeof closeAll === 'function') closeAll(true); renderInv(); iw.classList.remove('hidden'); };
  // I / Ekipman → Eşyalar sekmesi
  addEventListener('keydown', e => {
    if (typeof running === 'undefined' || !running || !player) return;
    const ae = document.activeElement; if (ae && (ae.tagName === 'INPUT' && ae.type !== 'range' || ae.tagName === 'TEXTAREA')) return;
    const k = e.key; const iw = $i('inv');
    if (e.repeat) { if (e.code === 'KeyI' || /^[iıIİ]$/.test(k)) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
    // v65: I tuşu tek yerden — klavye düzeninden bağımsız (KeyI / i / ı / I / İ), başka dinleyici ikinci kez açıp kapatamaz
    if (e.code === 'KeyI' || k === 'ı' || k === 'İ' || k === 'i' || k === 'I') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!iw.classList.contains('hidden') && tab !== 'items') { tab = 'items'; sel = hov = null; renderInv(); return; }
      toggle('inv');
      if (iw.classList.contains('hidden') && iw.contains(document.activeElement)) { try { document.activeElement.blur(); } catch (er) { } }
      return;
    }
    if (k === 'b' && !iw.classList.contains('hidden') && tab !== 'items') { e.stopImmediatePropagation(); tab = 'items'; sel = hov = null; renderInv(); }
  }, true);
  { const _tg = toggle; toggle = function (id) { if (id === 'inv' && $i('inv').classList.contains('hidden')) { tab = 'items'; sel = hov = null; } return _tg.apply(this, arguments); }; }
})();
