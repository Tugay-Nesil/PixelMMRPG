'use strict';
// =====================================================================
//  ETKİNLİKLER (Sürüm 53) — klasik MMO etkinlik türleri (özgün adlar)
//  Etkinlik Konağı (köy ortası) → Etkinlik Merkezi: saatler, kurallar, hediyeler, katıl.
//  • Kale Kuşatması: 5v5, rakip KALEYİ yık → kazan.
//  • Rün Dağı Seferi: 5v5, canavar kes → 5 Kadim Rün topla → Bekçi (boss) açılır,
//    bossu kesen takım kazanır (rakip takım da yarışır, sonunda karşı karşıya gelinir).
//  • Zindan: tek başına; 3 canavar dalgası + Zindan Efendisi → hazine.
//  • Günlük Giriş: 7 günlük takvim, her gün tıkla-al.
//  • Çevrimiçi Hediye: oyunda kaldığın her 30 dakikada 1 hediye.
//  • Klan Savaşı: haftada bir (Cumartesi 21:00); kayıtlı klanlar rastgele eşleşir,
//    5v5 ölüm maçı (20 leş ya da 4 dk sonunda en çok leş) → hediye.
//  Saat dışında katılınamaz; GM paneli etkinliği hemen açabilir.
// =====================================================================
(function () {
  const P = () => (typeof player !== 'undefined' ? player : null);
  const esc2 = t => typeof esc === 'function' ? esc(String(t)) : String(t);
  const TL = typeof TILE !== 'undefined' ? TILE : 32;
  // ---------------- takvim ----------------
  const EV = {
    bdv: { n: 'Kale Kuşatması', ic: 'tw_foe', times: ['12:00', '18:00', '21:00'], win: 30, team: 1,
      rules: ['5’e 5 parti savaşı. Harita üç yola ayrılır: KUZEY Pusu Ormanı (çalılıklar), ORTA Mancınık Köprüsü, GÜNEY Kaya Geçidi (siper taşları).', 'Amaç: rakibin KALESİNİ yık, kendi kaleni koru.', 'Köprüdeki MANCINIĞI ele geçir (yanında rakipten çok kişiyle dur): 8 sn’de bir düşman kalesine dev taş atar.', 'Çalılıkta saklan: dışarıdan görünmezsin, ilk vuruşun PUSU olur (+%40 hasar).', 'Taşların arkasına geç: oklar ve büyüler taşa çarpar. Menzilliler seni görmek için kanattan dolanmak zorunda kalır.', 'Partinle birlikte dur (3+ kişi): SAF DÜZENİ +%12 hasar, -%15 alınan hasar. Hedef işaretlersen (🎯) herkes ona +%15 vurur.', 'Süre 8 dk; bitince kalesi daha sağlam olan kazanır.'],
      tips: ['Bir kişi Mancınığı tutarken diğerleri köprü başındaki taşların arkasından ok atsın.', 'Kuzey ormanında Gölgeler pusu kurar — çalılığa girmeden önce yanına yaklaş, 3 adımdan yakını görürsün.', 'Güney Kaya Geçidi’nden kalenin yanındaki gizli çalılığa sızabilirsin.'],
      rew: 'Zafer: 3.000+ altın, 60 onur, 3 Yükseltme, 1 Efsun, şans: Şans Parşömeni, Kutsama • Yenilgi: ödülün %30’u' },
    jr: { n: 'Rün Dağı Seferi', ic: 'ii_GemPurple', times: ['14:00', '20:00', '23:00'], win: 30, team: 1,
      rules: ['5’e 5 parti etkinliği. Dağda üç RÜN SUNAĞI var: 🔥 Ateş • 👁 Göz • ❄ Buz.', 'Sunağın çevresinde rakipten fazla kişiyle durarak ele geçir; elindeki her sunak takımına sürekli RÜN GÜCÜ verir. Sunak bekçisi canavarları kesmek de güç verir.', '👁 GÖZ SUNAĞI kimdeyse o takım rakibin çalılıkta saklananlarını görür — pusuya karşı en güçlü silah!', '100 rün gücüne ilk ulaşan takım zirvedeki RÜN BEKÇİSİ’ni uyandırır; Bekçiye en çok vuran takım kazanır.', 'Lav nehrinin yalnız üç geçidi var: dar boğazlarda siper taşları ve çalılıklar seni bekler.', 'Süre 10 dk; süre biterse rün gücü fazla olan kazanır.'],
      tips: ['Göz Sunağı’nı alırsan Gölgelerin pususu boşa çıkar.', 'Partiyi ikiye böl: ikisi bir sunağı tutsun, üçü diğerine baskın yapsın.', 'Lav geçidinde taşın arkasında bekle, karşıdan gelen okçular taşa vursun.'],
      rew: 'Zafer: 4.000+ altın, 80 onur, 2 Efsun, 1 Şans, şans: Oto/AFK bileti • Yenilgi: ödülün %30’u' },
    zindan: { n: 'Gölge Zindanı', ic: 'ws_tomb', times: ['her zaman'], win: 0, daily: 3,
      rules: ['Tek başına ya da partinle girilir (günde 3 giriş).', '4 oda: Giriş → Sütunlu Salon → Yosunlu Mağara → Efendinin Tahtı. Oda temizlenince sonraki kapı açılır.', 'Sütunlar okları ve büyüleri durdurur: okçu canavarlara karşı arkalarına saklan.', 'Yosunda saklanırsan canavarlar seni kaybeder. DİKEN TUZAKLARI canavarlara da vurur — onları tuzağa çek!', 'Zindan Efendisi gölge mızrağı fırlatır: sütunların arkasına geç. Süre 7 dk.'],
      tips: ['Tuzağın yanında bekle, canavar üstüne gelince geri çekil.', 'Okçular sütunun arkasındayken sana ateş edemez; yanlarından dolanmaya çalışırlar.'],
      rew: '1.500+ altın, 2 Yükseltme, şans: Efsun, Şans, Kutsama' },
    klan: { n: 'Klan Savaşı', ic: 'i_sword', times: ['Cumartesi 21:00'], win: 60, team: 1, weekly: 6,
      rules: ['Haftada bir. Klanlar Etkinlik Merkezi’nden KAYIT olur, rastgele eşleşir: 5’e 5.', 'Her leş 1 puan. Ortadaki 🚩 ZAFER SANCAĞI’nı tutan klan 8 sn’de bir +1 puan alır.', 'Kuzey ve güney kanatlarında pusu çalılıkları, sancağın çevresinde siper taşları var.', '20 puana ilk ulaşan ya da 5 dk sonunda önde olan klan kazanır.'],
      tips: ['Sancağı tutan takım ortada kalır — kanattaki çalılıktan arkalarına dolan.', 'Siper taşlarının arkasında dur: sancak alanında kalırken oklardan korunursun.'],
      rew: 'Zafer: 5.000+ altın, 3 Efsun, 2 Şans, 10 inci, klan puanı • Yenilgi: 1.500 altın' },
  };
  window.KD_EVENTS = EV;
  let forced = {}; // GM: hemen aç
  window.kdEventForce = (k, on) => { forced[k] = on !== false; };
  function nowOpen(k) {
    const e = EV[k]; if (forced[k]) return true; if (!e.win) return true; const d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    if (e.weekly != null && d.getDay() !== e.weekly) return false;
    return e.times.some(t => { const r = /(\d+):(\d+)/.exec(t); if (!r) return false; const s = +r[1] * 60 + +r[2]; return m >= s && m < s + e.win; });
  }
  function nextText(k) { const e = EV[k]; if (!e.win) return 'Her zaman açık'; if (nowOpen(k)) return 'ŞİMDİ AÇIK'; return 'Sonraki: ' + e.times.join(' • '); }
  window.kdEventOpen = nowOpen;
  // ---------------- oyuncu verisi ----------------
  if (typeof SAVE_FIELDS !== 'undefined') SAVE_FIELDS.push('evDaily', 'evOnline', 'evZin', 'clan', 'evLog');
  function ensure(p) { p.evDaily = p.evDaily || { last: '', day: 0 }; if (p.evOnline == null) p.evOnline = 0; p.evZin = p.evZin || { d: '', n: 0 }; p.evLog = p.evLog || []; }
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  function give(r, title) {
    const p = P(); const parts = [];
    if (r.gold) { p.gold += r.gold; parts.push(r.gold.toLocaleString('tr-TR') + ' altın'); }
    if (r.honor) { p.honor = (p.honor || 0) + r.honor; parts.push(r.honor + ' onur'); }
    if (r.pearls) { p.pearls = (p.pearls || 0) + r.pearls; parts.push(r.pearls + ' inci'); }
    for (const k in (r.mats || {})) { if (!(r.mats[k] > 0)) continue; p.mats[k] = (p.mats[k] || 0) + r.mats[k]; parts.push(r.mats[k] + ' ' + (MATS[k] ? MATS[k].n : k)); }
    const txt = parts.join(', '); addChat(null, '🎁 ' + title + ': ' + txt, '#ffe08a'); p.evLog.unshift({ t: Date.now(), what: title, txt }); if (p.evLog.length > 40) p.evLog.length = 40; try { save(); } catch (e) { } return txt;
  }
  const chance = c => Math.random() < c ? 1 : 0;
  const DAILY = [{ gold: 500 }, { mats: { up: 2 } }, { mats: { ench: 1 } }, { gold: 1000, mats: { prot: 1 } }, { mats: { luck: 1 } }, { mats: { bless: 1 } }, { pearls: 10, mats: { oto1: 1 } }];
  const DAILY_T = ['500 altın', '2 Yükseltme', '1 Efsun', '1.000 altın + Koruma', '1 Şans', '1 Kutsama', '10 inci + Oto bileti'];
  function claimDaily() { const p = P(); ensure(p); if (p.evDaily.last === today()) return { ok: false, err: 'Bugünün hediyesini aldın' }; const i = p.evDaily.day % 7; p.evDaily.day++; p.evDaily.last = today(); return { ok: true, txt: give(DAILY[i], 'Günlük Giriş (' + (i + 1) + '. gün)') }; }
  window.kdClaimDaily = claimDaily;
  function onlineReward() { const p = P(), L = p.lvl; const pool = [{ gold: 300 + L * 20 }, { mats: { up: 1 } }, { mats: { prot: 1 } }, { gold: 500 + L * 30 }, { mats: { up: 2 } }]; return give(pool[Math.floor(Math.random() * pool.length)], 'Çevrimiçi Hediye (30 dk)'); }
  // =====================================================================
  //  v55 ETKİNLİK HARİTALARI — baştan tasarım
  //  Her haritada: pusu çalılıkları (m.tgrass), siper taşları (m.cover: oklar çarpar),
  //  ele geçirilen hedefler (m.caps), parti taktiği için kanat yolları / dar boğazlar.
  // =====================================================================
  function arena(id, name, W, H, floor, wall) {
    const m = newMap(id, name, W, H); m.zoneOf = () => 'mid'; m.zones = { mid: { name, lv: 'Etkinlik' } };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, edge = x < 2 || y < 2 || x >= W - 2 || y >= H - 2; m.tiles[i] = edge ? wall : floor; m.tvar[i] = Math.floor(Math.random() * 4); m.deco[i] = D.NONE; }
    m.safe = []; m.portals = []; m.npcDefs = []; m.labels = []; m.spawns = []; m.evMap = id;
    m.tgrass = new Uint8Array(W * H); m.bushes = []; m.cover = new Uint8Array(W * H); m.covers = []; m.caps = []; m.traps = []; m.doors = [];
    return m;
  }
  const IX = (m, x, y) => y * m.W + x;
  const inM = (m, x, y) => x >= 0 && y >= 0 && x < m.W && y < m.H;
  function fillR(m, x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inM(m, x, y)) { m.tiles[IX(m, x, y)] = t; m.deco[IX(m, x, y)] = D.NONE; } }
  function fillC(m, cx, cy, r, t) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (inM(m, x, y) && Math.hypot(x - cx, y - cy) <= r) { m.tiles[IX(m, x, y)] = t; m.deco[IX(m, x, y)] = D.NONE; } }
  function path(m, pts, t, wd) { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2); for (let i = 0; i <= n; i++) { const x = Math.round(ax + (bx - ax) * i / n), y = Math.round(ay + (by - ay) * i / n); for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) if (inM(m, x + dx, y + dy) && !SOLID_T[m.tiles[IX(m, x + dx, y + dy)]]) { m.tiles[IX(m, x + dx, y + dy)] = t; m.deco[IX(m, x + dx, y + dy)] = D.NONE; } } } }
  function bush(m, cx, cy, rx, ry) { const id = m.bushes.length + 1; for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) { if (!inM(m, x, y)) continue; const j = IX(m, x, y); if (((x - cx) / (rx + .3)) ** 2 + ((y - cy) / (ry + .3)) ** 2 > 1 || SOLID_T[m.tiles[j]] || m.cover[j]) continue; m.tgrass[j] = id; m.deco[j] = D.NONE; }
    m.bushes.push({ id, x: (cx + .5) * TL, y: (cy + .5) * TL, rx: rx * TL, ry: ry * TL }); }
  function cover(m, tx, ty, w, kind) { for (let x = tx; x < tx + w; x++) { if (!inM(m, x, ty)) continue; const j = IX(m, x, ty); m.cover[j] = 1; m.bsolid[j] = 1; m.deco[j] = D.NONE; m.tgrass[j] = 0; }
    m.covers.push({ x: (tx + w / 2) * TL, y: (ty + 1) * TL - 2, w: w * TL + 8, h: 34 + w * 9, kind: kind || 'stone', seed: tx * 31 + ty * 17 }); }
  function sprinkle(m, n, decos, ok) { for (let k = 0; k < n; k++) { const x = 3 + Math.floor(Math.random() * (m.W - 6)), y = 3 + Math.floor(Math.random() * (m.H - 6)), j = IX(m, x, y); if (m.tgrass[j] || m.cover[j] || SOLID_T[m.tiles[j]] || (ok && !ok(x, y))) continue; m.deco[j] = pick(decos); } }
  const L2 = (x, y) => ({ x: (x + .5) * TL, y: (y + .5) * TL });
  if (typeof GEN !== 'undefined') {
    // ---------- 1) KALE KUŞATMASI: 3 yol + nehir + ortada Mancınık ----------
    GEN.ev_bdv = () => { const W = 96, H = 48, m = arena('ev_bdv', 'Kale Kuşatması', W, H, T.GRASS, T.WATER);
      fillR(m, 46, 2, 49, H - 3, T.WATER); fillR(m, 46, 7, 49, 10, T.PATH); fillR(m, 46, 21, 49, 27, T.PLAZA); fillR(m, 46, 37, 49, 40, T.PATH);
      fillR(m, 2, 18, 11, 30, T.PLAZA); fillR(m, 84, 18, 93, 30, T.PLAZA);
      path(m, [[11, 24], [45, 24]], T.PATH, 1); path(m, [[50, 24], [84, 24]], T.PATH, 1);
      path(m, [[9, 18], [15, 9], [45, 9]], T.PATH, 0); path(m, [[50, 9], [80, 9], [86, 18]], T.PATH, 0);
      path(m, [[9, 30], [15, 39], [45, 39]], T.PATH, 0); path(m, [[50, 39], [80, 39], [86, 30]], T.PATH, 0);
      for (const [x, y] of [[22, 5], [30, 13], [39, 5], [56, 13], [65, 5], [73, 13]]) bush(m, x, y, 3, 2);       // kuzey: Pusu Ormanı
      for (const [x, y] of [[13, 33], [82, 15]]) bush(m, x, y, 2, 2);                                              // kale yanı gizli çalılık
      for (const [x, y, w] of [[19, 36, 2], [25, 42, 2], [32, 36, 3], [39, 42, 2], [55, 42, 2], [60, 36, 3], [68, 42, 2], [74, 36, 2]]) cover(m, x, y, w); // güney: Kaya Geçidi
      for (const [x, y] of [[41, 20], [41, 28], [53, 20], [53, 28]]) cover(m, x, y, 2);                           // köprü başı siperleri
      sprinkle(m, 50, [D.FLOWER, D.FLOWER, D.TREE], (x, y) => (y < 16 || y > 31) && Math.abs(y - 9) > 2 && Math.abs(y - 39) > 2 && x > 12 && x < 84 && Math.abs(x - 47.5) > 4);
      m.caps.push({ id: 'cat', kind: 'catapult', x: 47.5 * TL, y: 24.5 * TL, r: 150, name: 'Mancınık', own: 0, prog: 0 });
      m.start = L2(8, 24); m.pvp = true;
      m.labels.push({ x: 6, y: 17, t: 'Şafak Kalesi' }, { x: 90, y: 17, t: 'Gölge Kalesi' }, { x: 30, y: 2, t: 'Pusu Ormanı' }, { x: 30, y: 45, t: 'Kaya Geçidi' }, { x: 47, y: 19, t: 'Mancınık Köprüsü' });
      m.route = (e, gx, gy) => routeRiver(e, gx, gy);
      for (let k = 0; k < 5; k++) m.spawns.push({ type: 'foe', lvl: 1, x: (86 + Math.random() * 3) * TL, y: (21 + Math.random() * 6) * TL, resp: 7 }); return m; };
    // ---------- 2) RÜN DAĞI SEFERİ: 3 sunak + lav nehri dar boğazları + zirve ----------
    GEN.ev_jr = () => { const W = 84, H = 64, m = arena('ev_jr', 'Rün Dağı', W, H, T.RDIRT, T.LAVA);
      fillR(m, 2, 18, W - 3, 20, T.LAVA); for (const x of [13, 40, 67]) fillR(m, x, 18, x + 3, 20, T.SCORCH);
      fillC(m, 42, 8, 6.5, T.PLAZA); fillR(m, 3, 53, 13, 60, T.PLAZA); fillR(m, 70, 53, 80, 60, T.PLAZA);
      for (const [x, y] of [[28, 42], [56, 42], [42, 50]]) fillC(m, x, y, 2.2, T.LAVA);
      path(m, [[8, 53], [14, 34], [14, 21]], T.SCORCH, 0); path(m, [[76, 53], [70, 34], [69, 21]], T.SCORCH, 0); path(m, [[13, 56], [42, 36], [71, 56]], T.SCORCH, 0);
      path(m, [[14, 17], [42, 9], [69, 17]], T.SCORCH, 0); path(m, [[42, 30], [42, 17]], T.SCORCH, 0);
      for (const [x, y, rx] of [[7, 27, 2], [21, 37, 3], [33, 26, 2], [51, 26, 2], [63, 37, 3], [77, 27, 2], [42, 44, 2], [31, 11, 2], [53, 11, 2]]) bush(m, x, y, rx, 2);
      for (const [x, y] of [[11, 16], [17, 16], [38, 16], [45, 16], [65, 16], [71, 16], [36, 35], [47, 35], [17, 49], [65, 49]]) cover(m, x, y, 2, 'lava');
      sprinkle(m, 70, [D.DEAD, D.ROCK, D.DEAD], (x, y) => Math.hypot(x - 42, y - 8) > 9 && y > 22 && y < 52);
      m.caps.push({ id: 'fire', kind: 'altar', el: 'fire', x: 14.5 * TL, y: 32 * TL, r: 120, name: 'Ateş Sunağı', own: 0, prog: 0 },
        { id: 'eye', kind: 'altar', el: 'eye', x: 42.5 * TL, y: 32 * TL, r: 120, name: 'Göz Sunağı', own: 0, prog: 0 },
        { id: 'ice', kind: 'altar', el: 'ice', x: 70.5 * TL, y: 32 * TL, r: 120, name: 'Buz Sunağı', own: 0, prog: 0 });
      m.start = L2(8, 57); m.pvp = true;
      m.labels.push({ x: 42, y: 1, t: 'Bekçinin Zirvesi' }, { x: 8, y: 51, t: 'Şafak Kampı' }, { x: 75, y: 51, t: 'Gölge Kampı' }, { x: 42, y: 22, t: 'Lav Nehri' });
      m.route = (e, gx, gy) => routeBand(e, gx, gy, 18, 20, [14.5, 41.5, 68.5]);
      for (let k = 0; k < 5; k++) m.spawns.push({ type: 'foe', lvl: 1, x: (73 + Math.random() * 5) * TL, y: (55 + Math.random() * 4) * TL, resp: 8 }); return m; };
    // ---------- 3) GÖLGE ZİNDANI: 4 oda, kapılar, sütunlar, yosun, diken tuzakları ----------
    GEN.ev_zindan = () => { const W = 64, H = 52, m = arena('ev_zindan', 'Gölge Zindanı', W, H, T.DWALL, T.DWALL);
      const R = [[41, 49], [28, 37], [15, 24], [2, 11]]; for (const [y0, y1] of R) fillR(m, 10, y0, 53, y1, T.DFLOOR);
      for (const [y0, y1] of [[38, 40], [25, 27], [12, 14]]) m.doors.push({ x0: 30, x1: 33, y0, y1, open: false });
      for (const x of [14, 21, 37, 44]) for (const y of [30, 35]) cover(m, x, y, 2, 'dungeon');
      for (const [x, y] of [[16, 18], [26, 22], [40, 17], [48, 21]]) bush(m, x, y, 3, 2);
      for (const [x, y] of [[18, 33], [46, 33], [22, 20], [33, 18], [42, 22], [30, 23]]) m.traps.push({ x: (x + .5) * TL, y: (y + .5) * TL, ph: Math.random() * 3 });
      for (const [x, y] of [[16, 5], [46, 5], [16, 9], [46, 9]]) cover(m, x, y, 2, 'dungeon');
      sprinkle(m, 30, [D.BONE], (x, y) => y > 40);
      m.rooms = R.map(([y0, y1], i) => ({ i, x0: 10, x1: 53, y0, y1, name: ['Giriş', 'Sütunlu Salon', 'Yosunlu Mağara', 'Efendinin Tahtı'][i] }));
      m.labels.push({ x: 32, y: 49, t: 'Giriş' }, { x: 32, y: 37, t: 'Sütunlu Salon' }, { x: 32, y: 24, t: 'Yosunlu Mağara' }, { x: 32, y: 1, t: 'Efendinin Tahtı' });
      m.start = L2(32, 47); m.dark = false; m.route = (e, gx, gy) => routeDoors(e, gx, gy); return m; };
    // ---------- 4) KLAN SAVAŞI: Sancak Arenası ----------
    GEN.ev_klan = () => { const W = 64, H = 40, m = arena('ev_klan', 'Sancak Arenası', W, H, T.SCORCH, T.LAVA);
      fillR(m, 2, 15, 9, 25, T.PLAZA); fillR(m, 54, 15, 61, 25, T.PLAZA); fillC(m, 32, 20, 4.5, T.PLAZA);
      for (const [x0, y0] of [[19, 3], [39, 3], [19, 31], [39, 31]]) fillR(m, x0, y0, x0 + 5, y0 + 5, T.LAVA);
      for (const [x, y] of [[26, 15], [36, 15], [26, 25], [36, 25], [31, 12], [31, 28]]) cover(m, x, y, 2, 'lava');
      for (const [x, y, rx] of [[13, 10, 2], [32, 5, 3], [50, 10, 2], [13, 30, 2], [32, 35, 3], [50, 30, 2]]) bush(m, x, y, rx, 2);
      sprinkle(m, 26, [D.DEAD, D.ROCK], (x, y) => Math.abs(y - 20) > 6 && x > 10 && x < 54);
      m.caps.push({ id: 'flag', kind: 'flag', x: 32.5 * TL, y: 20.5 * TL, r: 120, name: 'Zafer Sancağı', own: 0, prog: 0 });
      m.start = L2(5, 20); m.pvp = true; m.labels.push({ x: 32, y: 14, t: 'Zafer Sancağı' });
      for (let k = 0; k < 5; k++) m.spawns.push({ type: 'foe', lvl: 1, x: (56 + Math.random() * 3) * TL, y: (17 + Math.random() * 6) * TL, resp: 5 }); return m; };
  }
  // ---------------- yol bulma (nehir köprüleri / lav geçitleri / zindan kapıları) ----------------
  function routeRiver(e, gx, gy) { const ex = e.x / TL, gxT = gx / TL, side = x => x < 46 ? -1 : x > 49.5 ? 1 : 0; const a = side(ex), b = side(gxT);
    if (a === b || a === 0) return null; const lane = e._lane != null ? e._lane : [8.5, 24, 38.5].reduce((q, y) => Math.abs(y - e.y / TL) < Math.abs(q - e.y / TL) ? y : q, 24);
    return { x: (a < 0 ? 46.2 : 49.4) * TL, y: lane * TL }; }
  function routeBand(e, gx, gy, y0, y1, xs) { const ey = e.y / TL, gyT = gy / TL, side = y => y < y0 ? -1 : y > y1 + 1 ? 1 : 0; const a = side(ey), b = side(gyT);
    if (a === b || a === 0) return null; const cx = xs.reduce((q, x) => Math.abs(x - e.x / TL) + Math.abs(x - gx / TL) < Math.abs(q - e.x / TL) + Math.abs(q - gx / TL) ? x : q, xs[0]);
    if (Math.abs(e.x / TL - cx) < 1.2) return { x: cx * TL, y: (a < 0 ? y1 + 2 : y0 - 2) * TL }; return { x: cx * TL, y: (a < 0 ? y0 - 1.2 : y1 + 2.2) * TL }; }
  function routeDoors(e, gx, gy) { const ey = e.y / TL, gyT = gy / TL; if (Math.abs(ey - gyT) < 2) return null; for (const d of M.doors || []) { const mid = (d.y0 + d.y1) / 2; if ((ey - mid) * (gyT - mid) < 0) { if (Math.abs(e.x / TL - 32) > 1.2) return { x: 32 * TL, y: (ey > mid ? d.y1 + 1.5 : d.y0 - 1) * TL }; return { x: 32 * TL, y: (ey > mid ? d.y0 - 1.5 : d.y1 + 1.5) * TL }; } } return null; }
  // hedefe yürü: yol noktası + takılınca yana kay
  function goTo(e, gx, gy, spd, dt) { const w = M.route ? M.route(e, gx, gy) : null, tx = w ? w.x : gx, ty = w ? w.y : gy;
    if (e._side && gameTime < e._sideT) { const dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy) || 1; moveToward(e, e.x - dy / l * 40 * e._side + dx / l * 10, e.y + dx / l * 40 * e._side + dy / l * 10, spd, dt); return; }
    const ox = e.x, oy = e.y; moveToward(e, tx, ty, spd, dt); if (Math.hypot(tx - e.x, ty - e.y) > 8 && Math.hypot(e.x - ox, e.y - oy) < spd * dt * .25) { e._stk = (e._stk || 0) + dt; if (e._stk > .35) { e._stk = 0; e._side = Math.random() < .5 ? -1 : 1; e._sideT = gameTime + .7; } } else e._stk = 0;
    e.face = tx < e.x ? -1 : 1; }
  window.kdGoTo = goTo;
  // ---------------- etkinlik durumu ----------------
  let E = null;
  window.kdEvent = () => E;
  const ret = { x: 0, y: 0 };
  function teamNames(n) { const pool = (typeof ALLY_NAMES !== 'undefined' ? ALLY_NAMES : []).concat(['Arden', 'Elara', 'Fenrir', 'Ivy', 'Orion', 'Nova']); return pool.slice().sort(() => Math.random() - .5).slice(0, n); }
  const DUR = { bdv: 480, jr: 600, zindan: 420, klan: 300 };
  function start(k) {
    const p = P(); if (!p || p.dead) return { ok: false, err: 'Şu an girilemez' }; if (E) return { ok: false, err: 'Zaten bir etkinliktesin' };
    if (!nowOpen(k)) return { ok: false, err: EV[k].n + ' şu an kapalı. ' + nextText(k) };
    ensure(p); if (k === 'zindan') { if (p.evZin.d !== today()) p.evZin = { d: today(), n: 0 }; if (p.evZin.n >= EV.zindan.daily) return { ok: false, err: 'Bugünkü 3 Zindan hakkını kullandın' }; }
    if (k === 'klan' && !(p.clan && p.clan.reg === weekId())) return { ok: false, err: 'Klanın bu hafta kayıtlı değil (Klan sekmesi)' };
    if (window.kdMyStall && kdMyStall()) return { ok: false, err: 'Önce pazarını kapat' };
    if (k === 'zindan') p.evZin.n++;
    const pn = window.kdParty ? kdParty() : []; ret.x = p.x; ret.y = p.y;
    try { if (typeof MAPS !== 'undefined') delete MAPS['ev_' + k]; } catch (e) { }   // her girişte taze harita (kapılar kapalı)
    window.__kdKeepParty = true; try { enterMap('ev_' + k); } finally { window.__kdKeepParty = false; }
    try { chunkCache.clear(); } catch (e) { }
    const L = p.lvl; E = { k, t0: gameTime, dur: DUR[k], lvl: L, over: false, pn, shots: [] };
    for (const sp of spawners) if (sp.type === 'foe') { sp.lvl = Math.max(1, L + Math.round(rr(-2, 2))); sp.timer = rr(.5, 2); }
    for (const e of enemies) if (e.d && e.d.pvp) scaleFoe(e, L);
    const team = EV[k].team || (k === 'zindan' && pn.length);
    if (team) { bots.length = 0; const need = k === 'zindan' ? Math.min(4, pn.length) : 4, names = pn.slice(0, need).concat(k === 'zindan' ? [] : teamNames(need)).filter((v, i, a) => a.indexOf(v) === i).slice(0, need);
      names.forEach((n, i) => { const b = makeBot(n, i, 'ally', Math.max(1, L + Math.round(rr(-2, 2))), M.start.x + rr(-50, 50), M.start.y + rr(-60, 60)); b.evRole = ['escort', 'escort', 'cap', 'push'][i % 4]; bots.push(b); });
      if (pn.length && window.kdPartyRestore) kdPartyRestore(pn.filter(n => names.includes(n))); }
    if (k === 'bdv') { const hp = 6000 + L * 300; E.mine = { x: 5 * TL, y: 24.5 * TL, hp, maxHp: hp }; E.theirs = spawnMon(91 * TL, 24.5 * TL, hp); E.cat = M.caps[0]; }
    if (k === 'jr') { E.pow = { us: 0, them: 0 }; E.runes = 0; E.foeRunes = 0; E.boss = null; for (const c of M.caps) for (let i = 0; i < 3; i++) { const a = i / 3 * 6.28; const mo = addMob(pick(['golem', 'bloodwolf', 'spider', 'wraith']), c.x + Math.cos(a) * 70, c.y + 40 + Math.sin(a) * 40, L); mo.altar = c.id; }
      for (let i = 0; i < 6; i++) addMob(pick(['bloodwolf', 'spider', 'imp']), rr(10, 74) * TL, rr(36, 48) * TL, L); }
    if (k === 'zindan') { E.wave = 0; E.room = 0; nextWave(); }
    if (k === 'klan') { E.us = 0; E.them = 0; E.flagT = 0; E.foeClan = pick(['CrimsonWolves', 'NightWatch', 'IronFist', 'JadeDragons', 'StormLegion']); addChat(null, '⚔ Klan Savaşı: ' + (p.clan ? p.clan.name : '?') + ' vs ' + E.foeClan + ' — 20 puana ilk ulaşan kazanır!', '#ff9a60'); }
    let fi = 0; for (const e of enemies) if (e.d && e.d.pvp) e.evRole = FOE_ROLES[fi++ % 5];
    addChat(null, '🏁 ' + EV[k].n + ' başladı! ' + EV[k].rules[1], '#ffd65a'); addChat(null, '💡 İpucu: ' + pick(EV[k].tips || EV[k].rules), '#9fe0ff');
    try { showToast(EV[k].n, 'Başladı! Bol şans', 2); } catch (e) { } bar.classList.add('on'); closeHall();
    return { ok: true };
  }
  window.kdEventStart = start;
  const FOE_ROLES = ['push', 'cap', 'ambush', 'push', 'flank'];
  function scaleFoe(e, L) { const c = CLASSES[e.cls] || CLASSES.warrior, Lv = Math.max(1, L + Math.round(rr(-2, 2))); e.lvl = Lv; e.maxHp = e.hp = Math.round((c.hp + c.hpL * (Lv - 1)) * 1.25); e.atk = (c.atk + c.atkL * (Lv - 1)); e.def = c.def + c.defL * (Lv - 1) + Lv; }
  function addMob(type, x, y, L) { const e = makeEnemy({ type, lvl: Math.max(1, L + Math.round(rr(-1, 2))), x, y }); e.sp = { timer: 999, resp: 999 }; enemies.push(e); return e; }
  function spawnMon(x, y, hp) { const e = makeEnemy({ type: 'golem', lvl: 30, x, y }); Object.assign(e, { kdMon: true, maxHp: hp, hp, atk: 60 + E.lvl * 4, def: 20, r: 40, cr: 30, sp: { timer: 999 } }); e.d = Object.assign({}, e.d, { name: 'Gölge Kalesi', boss: false, spd: 0, aggro: 0, h: 150, r: 40, col: '#ff6040' }); e.monT = 2; enemies.push(e); return e; }
  // ---------- zindan: oda dalgaları ----------
  const ZW = [{ n: 6, r: 0 }, { n: 8, r: .5 }, { n: 10, r: .3 }, { n: 4, r: .5, boss: true }];
  function roomSpot(rm) { for (let k = 0; k < 40; k++) { const x = rr(rm.x0 + 2, rm.x1 - 2), y = rr(rm.y0 + 1.5, rm.y1 - 1); if (!solidAt(x * TL, y * TL) && !(M.tgrass && M.tgrass[Math.floor(y) * M.W + Math.floor(x)])) return { x: x * TL, y: y * TL }; } return { x: (rm.x0 + rm.x1) / 2 * TL, y: (rm.y0 + rm.y1) / 2 * TL }; }
  function nextWave() {
    const L = E.lvl, w = ZW[E.wave], rm = M.rooms[E.wave]; E.wave++; E.room = rm.i;
    const melee = L < 6 ? ['slime', 'wolf'] : L < 10 ? ['wolf', 'goblin'] : L < 15 ? ['goblin', 'skeleton'] : ['skeleton', 'golem'], ranged = ['imp', 'wraith'];
    for (let i = 0; i < w.n; i++) { const s = roomSpot(rm); const e = addMob(Math.random() < w.r ? pick(ranged) : pick(melee), s.x, s.y, L); e.room = rm.i; e.d = Object.assign({}, e.d, { aggro: 330 }); }
    if (w.boss) { const e = addMob('golem', 32 * TL, 5.5 * TL, L + 2); e.vt = 'DemonCyclop2'; e.elite = true; e.maxHp = e.hp = Math.round(e.maxHp * 8); e.atk *= 1.6; e.d = Object.assign({}, e.d, { name: '★ Zindan Efendisi', boss: true, h: 120, r: 24, aggro: 420 }); e.r = 24; e.kdZBoss = true; e.room = 3; e.spT = 3; addChat(null, '💀 Zindan Efendisi tahtından kalktı! Gölge mızraklarına karşı sütunların arkasına geç.', '#ff7070'); }
    else addChat(null, '🚪 ' + rm.name + ': ' + w.n + ' canavar' + (w.r ? ' (okçular var — siperlere saklan!)' : '') + (rm.i === 2 ? ' • yosunda saklan, tuzaklara çek!' : ''), '#ffb070');
  }
  function openDoor(i) { const d = M.doors[i]; if (!d || d.open) return; d.open = true; fillR(M, d.x0, d.y0, d.x1, d.y1, T.DFLOOR); try { chunkCache.clear(); } catch (e) { } try { buildMini(M); } catch (e) { } addChat(null, '🔓 Kapı açıldı!', '#9fffb0'); try { naFx('smoke', (d.x0 + 2) * TL, (d.y1 + 1) * TL, 3); } catch (e) { } }
  function finish(win, why) {
    if (!E || E.over) return; E.over = true; const p = P(), k = E.k, L = E.lvl; let r;
    if (k === 'bdv') r = win ? { gold: 3000 + L * 100, honor: 60, mats: { up: 3, ench: 1, luck: chance(.25), bless: chance(.1) } } : { gold: Math.round((3000 + L * 100) * .3), honor: 15, mats: { up: 1 } };
    else if (k === 'jr') r = win ? { gold: 4000 + L * 120, honor: 80, mats: { ench: 2, luck: 1, oto1: chance(.15), afk1: chance(.1) } } : { gold: Math.round((4000 + L * 120) * .3), honor: 20, mats: { up: 1 } };
    else if (k === 'zindan') r = win ? { gold: 1500 + L * 60, mats: { up: 2, ench: chance(.35), luck: chance(.12), bless: chance(.06) } } : { gold: 300 + L * 10 };
    else r = win ? { gold: 5000 + L * 100, pearls: 10, mats: { ench: 3, luck: 2 } } : { gold: 1500 };
    if (k === 'klan' && win && p.clan) p.clan.pts = (p.clan.pts || 0) + 10;
    const txt = give(r, EV[k].n + (win ? ' — ZAFER' : ' — yenilgi'));
    res.innerHTML = '<div class="h ' + (win ? 'w' : 'l') + '">' + (win ? 'ZAFER!' : 'YENİLGİ') + '</div><div class="s">' + esc2(EV[k].n) + (why ? ' • ' + esc2(why) : '') + '</div><div class="r">🎁 ' + esc2(txt) + '</div><button class="gold" data-back="1">Köye Dön</button>';
    res.classList.add('on'); bar.classList.remove('on');
  }
  function leave() { E = null; res.classList.remove('on'); bar.classList.remove('on'); const pn = window.kdParty ? kdParty() : []; window.__kdKeepParty = true; try { enterMap('yesilvadi', ret.x || null, ret.y || null); } finally { window.__kdKeepParty = false; } if (pn.length && window.kdPartyRestore) kdPartyRestore(pn); }
  window.kdEventLeave = leave; window.kdEventFinish = finish;
  // ---------- ele geçirme (Mancınık / Sunak / Sancak) ----------
  const usTeam = () => [P()].filter(p => p && !p.dead).concat(bots.filter(b => b.alive && b.faction === 'ally'));
  const themTeam = () => enemies.filter(e => !e.dead && e.d && e.d.pvp);
  function capTick(c, dt) {
    const us = usTeam().filter(o => Math.hypot(o.x - c.x, o.y - c.y) < c.r).length, th = themTeam().filter(o => Math.hypot(o.x - c.x, o.y - c.y) < c.r).length;
    c.us = us; c.th = th; const d = us - th; if (d) c.prog = clamp(c.prog + Math.sign(d) * Math.min(3, Math.abs(d)) * dt / 5, -1, 1);
    const was = c.own; if (c.prog >= 1) c.own = 1; else if (c.prog <= -1) c.own = -1; else if ((c.own === 1 && c.prog < 0) || (c.own === -1 && c.prog > 0)) c.own = 0;
    if (was !== c.own) { const t = c.own === 1 ? '✅ ' + c.name + ' artık BİZİM!' : c.own === -1 ? '⚠ Gölgeler ' + c.name + '\'nı aldı!' : '⚪ ' + c.name + ' sahipsiz kaldı'; addChat(null, t, c.own === 1 ? '#9fffb0' : c.own === -1 ? '#ff9090' : '#ddd'); try { showToast(c.name, c.own === 1 ? 'Ele geçirildi' : c.own === -1 ? 'Kaybedildi' : 'Sahipsiz', 1.4); } catch (e) { } }
  }
  // ---------------- her kare ----------------
  let onlineT = 0;
  function tick(dt) {
    const p = P(); if (!p) return; ensure(p);
    if (!p.dead) { p.evOnline += dt; onlineT += dt; if (p.evOnline >= 1800) { p.evOnline -= 1800; const t = onlineReward(); try { showToast('Çevrimiçi hediye!', t, 2.4); } catch (e) { } } }
    if (!E || E.over) return; if (!M || !M.evMap) { E = null; bar.classList.remove('on'); return; }
    const left = E.dur - (gameTime - E.t0);
    for (const c of M.caps || []) capTick(c, dt);
    // mancınık atışları (uçan taş)
    for (let i = E.shots.length - 1; i >= 0; i--) { const s = E.shots[i]; s.t += dt; if (s.t >= s.dur) { E.shots.splice(i, 1); try { naFx('bigexpl', s.x1, s.y1 - 60, 3, { add: true }); } catch (e) { } if (s.to === 'them' && E.theirs && !E.theirs.dead) { E.theirs.hp -= E.theirs.maxHp * .035; fl(s.x1, s.y1 - 190, '💥 Mancınık!', '#ffd65a', 16); if (E.theirs.hp <= 0) { E.theirs.hp = 0; E.theirs.dead = true; } } else if (s.to === 'us' && E.mine) { E.mine.hp -= E.mine.maxHp * .035; fl(s.x1, s.y1 - 190, '💥 Mancınık!', '#ff8080', 16); } } }
    if (E.k === 'bdv') { const c = E.cat; c.fireT = (c.fireT == null ? 8 : c.fireT) - dt; if (c.own && c.fireT <= 0) { c.fireT = 8; const tgt = c.own === 1 ? E.theirs : E.mine; E.shots.push({ x0: c.x, y0: c.y - 40, x1: tgt.x, y1: tgt.y, t: 0, dur: 1.6, to: c.own === 1 ? 'them' : 'us' }); } else if (!c.own) c.fireT = Math.max(c.fireT, 2);
      if (E.theirs.dead || E.theirs.hp <= 0) return finish(true, 'Gölge Kalesi yıkıldı'); if (E.mine.hp <= 0) return finish(false, 'Kalen yıkıldı'); if (left <= 0) return finish(E.mine.hp / E.mine.maxHp > E.theirs.hp / E.theirs.maxHp, 'süre doldu'); }
    if (E.k === 'jr') { let ou = 0, ot = 0; for (const c of M.caps) { if (c.own === 1) ou++; if (c.own === -1) ot++; }
      if (!E.boss) { E.pow.us = Math.min(100, E.pow.us + ou * .55 * dt); E.pow.them = Math.min(100, E.pow.them + ot * .55 * dt + .05 * dt); }
      E.runes = Math.floor(E.pow.us / 20); E.foeRunes = Math.floor(E.pow.them / 20);
      if (!E.boss && (E.pow.us >= 100 || E.pow.them >= 100)) { const b = addMob('golem', 42 * TL, 8 * TL, E.lvl + 3); b.vt = 'GiantRedSamurai'; b.elite = true; b.maxHp = b.hp = Math.round(b.maxHp * 14); b.atk *= 1.7; b.d = Object.assign({}, b.d, { name: '★ Rün Bekçisi', boss: true, h: 126, r: 26 }); b.r = 26; b.kdJr = true; b.tally = { us: 0, them: 0 }; E.boss = b; addChat(null, '⛰ RÜN BEKÇİSİ uyandı (' + (E.pow.us >= 100 ? 'takımın' : 'Gölgeler') + ' 100 rün gücüne ulaştı)! Zirveye!', '#ffd65a'); try { showToast('Rün Bekçisi uyandı!', 'Zirveye koş', 2); } catch (e) { } }
      if (E.boss && (E.boss.dead || E.boss.hp <= 0)) return finish(E.boss.tally.us >= E.boss.tally.them, 'Bekçi düştü'); if (left <= 0) return finish(E.pow.us > E.pow.them, 'süre doldu');
      for (const c of M.caps) { const n = enemies.filter(e => !e.dead && e.altar === c.id).length; if (n < 2 && Math.random() < dt * .03) { const mo = addMob(pick(['golem', 'bloodwolf', 'spider', 'wraith']), c.x + rr(-70, 70), c.y + rr(20, 60), E.lvl); mo.altar = c.id; } } }
    if (E.k === 'zindan') { const rm = E.room, alive = enemies.filter(e => !e.dead).length;
      if (!alive) { if (E.wave < ZW.length) { openDoor(E.wave - 1); nextWave(); } else return finish(true, 'Zindan temizlendi'); }
      if (left <= 0) return finish(false, 'süre doldu'); if (p.dead) return finish(false, 'yenildin'); }
    if (E.k === 'klan') { const c = M.caps[0]; E.flagT += dt; if (E.flagT >= 8) { E.flagT = 0; if (c.own === 1) { E.us++; fl(c.x, c.y - 120, '🚩 +1 Sancak', '#9fffb0', 15); } else if (c.own === -1) { E.them++; fl(c.x, c.y - 120, '🚩 +1 Gölge', '#ff9090', 15); } }
      if (E.us >= 20 || E.them >= 20 || left <= 0) return finish(E.us > E.them, E.us + ' - ' + E.them); }
    // diken tuzakları: herkese vurur (canavarı tuzağa çek!)
    for (const tr of M.traps || []) { tr.ph = (tr.ph + dt) % 3; tr.up = tr.ph > 2.2; if (!tr.up) continue;
      const near = o => Math.abs(o.x - tr.x) < 20 && Math.abs(o.y - tr.y) < 18;
      if (!p.dead && near(p) && gameTime - (p._trapT || -9) > .5) { p._trapT = gameTime; damagePlayer(p.stats.maxHp * .07 + 8, { name: 'Diken Tuzağı', d: {}, x: tr.x, y: tr.y, kind: 'trap' }); }
      for (const e of enemies) if (!e.dead && near(e) && gameTime - (e._trapT || -9) > .5) { e._trapT = gameTime; damageEnemy(e, { v: Math.round(e.maxHp * .09), crit: false }, p); if (e.hp <= 0 && !e.dead) try { killEnemy(e, p); } catch (er) { } fl(e.x, e.y - 50, 'Tuzak!', '#ffb070', 12); }
      for (const b of bots) if (b.alive && near(b) && gameTime - (b._trapT || -9) > .5) { b._trapT = gameTime; damageBot(b, b.maxHp * .07, null); } }
  }
  if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try { tick(dt); } catch (e) { console.error(e); } }; }
  // ---------- hedef göster: Göz Sunağı sahibi rakibin çalılıktakilerini görür ----------
  window.kdRevealHook = function (a, t) { if (!E || E.over || E.k !== 'jr' || !M.caps) return false; const eye = M.caps.find(c => c.id === 'eye'); if (!eye || !eye.own) return false;
    const aUs = a === P() || (a && a.kind === 'bot'), tUs = t === P() || (t && t.kind === 'bot'); return eye.own === 1 ? aUs && !tUs : !aUs && tUs; };
  // ---------- Gölge (rakip) YZ: rol bazlı ----------
  function foeGoal(e) {
    const r = e.evRole || 'push', c0 = (M.caps || [])[0];
    if (E.k === 'bdv') { if (r === 'cap') return c0; if (r === 'ambush') { if (!e._bush) { const B = M.bushes.filter(b => b.y < 16 * TL && b.x > 20 * TL); e._bush = pick(B); e._ambT = gameTime + 40; e._lane = 8.5; } if (gameTime < e._ambT) return e._bush; e.evRole = 'push'; }
      if (r === 'flank') { e._lane = 38.5; if (e.x > 40 * TL) return { x: 30 * TL, y: 39 * TL }; } else if (r === 'push') e._lane = 24; return { x: E.mine.x + 60, y: E.mine.y, castle: true }; }
    if (E.k === 'jr') { if (E.boss && !E.boss.dead) return E.boss; if (r === 'ambush') { if (!e._bush) { e._bush = pick(M.bushes.filter(b => Math.abs(b.y - 30 * TL) < 10 * TL)); e._ambT = gameTime + 35; } if (gameTime < e._ambT) return e._bush; e.evRole = 'cap'; }
      const C = M.caps.filter(c => c.own !== -1); return C.length ? C.reduce((a, b) => dist(e, a) < dist(e, b) ? a : b) : pick(M.caps); }
    if (E.k === 'klan') { if (r === 'cap' || r === 'push') return c0; if (r === 'ambush') { if (!e._bush) e._bush = pick(M.bushes); return e._bush; } const t = usTeam().sort((a, b) => dist(e, a) - dist(e, b))[0]; return t || c0; }
    return null;
  }
  if (typeof updFoe === 'function') { const _uf = updFoe; updFoe = function (e, dt) {
    if (E && !E.over && M && M.evMap) {
      if (!e.evRole) e.evRole = pick(FOE_ROLES);
      if (e.target && !validTarget(e.target)) e.target = null;
      if (!e.target) { const g = foeGoal(e); if (g) { const sm = e.slowUntil > gameTime ? .5 : 1, d = Math.hypot(g.x - e.x, g.y - e.y);
          if (g.castle && d < 80) { e.atkT -= dt; if (e.atkT <= 0) { e.atkT = e.as; e.atkAnim = .22; E.mine.hp -= Math.max(5, e.atk * 1.2); } }
          else if (d > (g.kind ? 40 : 20)) goTo(e, g.x, g.y, e.d.spd * .9 * sm, dt);
          if (E.k === 'jr' && E.boss && g === E.boss && d < (e.range || 40) + 40) { e.atkT -= dt; if (e.atkT <= 0) { e.atkT = e.as; e.atkAnim = .22; const dm = rollDmg(e.atk, E.boss.def, .05, 1.6, 1); E.boss.tally.them += dm.v; damageEnemy(E.boss, dm, e); } return; }
          e.scan -= dt; if (e.scan <= 0) return _uf.call(this, e, 0); return; } }
      else if (dist(e, e.target) > e.range + 40 && M.route && M.route(e, e.target.x, e.target.y)) { goTo(e, e.target.x, e.target.y, e.d.spd, dt); e.atkT -= dt; return; }
    }
    return _uf.apply(this, arguments); }; }
  // ---------- müttefik YZ: 2 koruma (seni takip eder → Saf Düzeni), 1 ele geçirici, 1 saldırgan ----------
  if (typeof updBot === 'function') { const _ub = updBot; updBot = function (b, dt) {
    if (E && !E.over && M && M.evMap && b.alive && b.faction === 'ally') {
      const p = P(); if (b.target && (b.target._kdHid || b.target.dead)) b.target = null;
      let goal = null; const role = b.evRole || 'escort';
      if (E.k === 'bdv') goal = role === 'cap' && E.cat.own !== 1 ? E.cat : role === 'push' ? E.theirs : null;
      if (E.k === 'jr') goal = E.boss && !E.boss.dead ? E.boss : role === 'cap' || role === 'push' ? (M.caps.filter(c => c.own !== 1).sort((a, c) => dist(b, a) - dist(b, c))[0] || null) : null;
      if (E.k === 'klan') goal = role === 'cap' || role === 'push' ? M.caps[0] : null;
      if (goal && goal.hp != null && !goal.dead && (!b.target || b.target.dead) && dist(b, goal) < 320) b.target = goal;
      if (b.target) { const c = CLASSES[b.cls]; if (dist(b, b.target) > c.range + (b.target.r || 12) + 30 && M.route && M.route(b, b.target.x, b.target.y)) { b.anim += dt; goTo(b, b.target.x, b.target.y, 140, dt); return; } }
      else { const g = goal || (p && !p.dead ? p : null); if (g) { const d = dist(b, g), near = goal ? (goal.kind ? 50 : 30) : 90; if (d > near) { b.anim += dt; goTo(b, g.x + (goal ? 0 : (bots.indexOf(b) % 2 ? 40 : -40)), g.y + (goal ? 0 : 30), 140, dt); b.scan -= dt; if (b.scan <= 0) { _ub.call(this, b, 0); if (b.target && b.target._kdHid) b.target = null; } return; } } }
      const r = _ub.apply(this, arguments); if (b.target && b.target._kdHid) b.target = null; return r;
    }
    return _ub.apply(this, arguments); }; }
  // ---------- canavarlar: sunak bekçileri, zindan efendisinin gölge mızrağı ----------
  if (typeof updEnemy === 'function') { const _ue2 = updEnemy; updEnemy = function (e, dt) {
    if (e && !e.dead && !e.kdZBoss && E && !E.over && E.k === 'zindan' && e.target && M.route && e.stunUntil <= gameTime) { const t = e.target; if (validTarget(t) && M.route(e, t.x, t.y)) { e.anim += dt; e.atkAnim = Math.max(0, e.atkAnim - dt); try { updDots(e); } catch (er) { } goTo(e, t.x, t.y, e.d.spd, dt); return; } }
    if (e && e.kdZBoss && !e.dead && E && !E.over) { e.spT -= dt; const t = e.target; if (t && e.spT <= 0 && dist(e, t) > 110) { e.spT = 2.4; e.atkAnim = .4; projectiles.push({ x: e.x, y: e.y - 70, vx: 0, vy: 0, spd: 320, homing: true, target: t, owner: 'enemy', kind: 'efire', dmg: e.atk * 1.4, src: e, life: 3 }); fl(e.x, e.y - 140, 'Gölge Mızrağı!', '#c080ff', 14); } }
    return _ue2.apply(this, arguments); }; }
  // kale: oyuncu ve müttefikler vurur (düşman listesinde); kendi kalemizi Gölgeler vurur
  if (typeof updEnemy === 'function') { const _ue = updEnemy; updEnemy = function (e, dt) {
    if (e && e.kdMon) { e.anim += dt; try { updDots(e); } catch (er) { } if (e.dead) return; e.monT -= dt; if (e.monT <= 0) { e.monT = 2.2; const C2 = [P()].concat(bots.filter(b => b.alive && b.mortal)).filter(t => t && !(t === P() && P().dead) && Math.hypot(t.x - e.x, t.y - e.y) < 300); if (C2.length) { const t = C2[0]; if (t === P()) damagePlayer(t.stats.maxHp * .12 + 30, e); else damageBot(t, t.maxHp * .14, e); try { naFx('expl', t.x, t.y - 20, 2, { add: true }); } catch (er) { } } } return; }
    return _ue.apply(this, arguments); }; }
  // skor / rün / tally
  if (typeof damageEnemy === 'function') { const _de = damageEnemy; damageEnemy = function (e, dm, src) { try { if (e && e.kdJr && dm && src && (src === P() || src.kind === 'bot')) e.tally.us += dm.v; } catch (er) { } return _de.apply(this, arguments); }; }
  if (typeof killEnemy === 'function') { const _ke = killEnemy; killEnemy = function (e, src) { const was = e && !e.dead; const r = _ke.apply(this, arguments);
    try { if (was && E && !E.over && M && M.evMap) { const ours = src && (src === P() || src.kind === 'bot');
      if (E.k === 'jr' && ours && !e.d.pvp && !e.kdJr && !E.boss) { const g = e.altar ? 6 : 3; E.pow.us = Math.min(100, E.pow.us + g); fl(e.x, e.y - 60, '+' + g + ' Rün Gücü', '#ffd65a', 14); if (Math.floor((E.pow.us - g) / 20) < Math.floor(E.pow.us / 20)) addChat(null, '💠 Takımın rün gücü: ' + Math.floor(E.pow.us) + '/100', '#ffd65a'); }
      if (E.k === 'klan' && e.d.pvp) E.us++; } } catch (er) { } return r; }; }
  if (typeof damageBot === 'function') { const _db = damageBot; damageBot = function (b) { const was = b && b.alive; const r = _db.apply(this, arguments); try { if (was && !b.alive && E && E.k === 'klan' && !E.over) E.them++; } catch (er) { } return r; }; }
  if (typeof die === 'function') { const _d = die; die = function () { const r = _d.apply(this, arguments); try { if (E && E.k === 'klan' && !E.over) E.them++; } catch (er) { } return r; }; }
  // ---------------- çizim: kaleler, mancınık, sunaklar, sancak, tuzaklar, uçan taş ----------------
  const IM = {}; const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; }; const ok = i => i && i.complete && i.naturalWidth > 0;
  function drawMon(x, y, key, f, name) { const t = img(key); ctx.save(); ctx.imageSmoothingEnabled = false; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 60, 18, 0, 0, 7); ctx.fill(); if (ok(t)) ctx.drawImage(t, x - 80, y - 156, 160, 160);
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(x - 60, y - 176, 120, 10); ctx.fillStyle = key === 'tw_ally' ? '#5aff8a' : '#ff5050'; ctx.fillRect(x - 59, y - 175, 118 * Math.max(0, f), 8); ctx.restore(); try { label(x, y - 186, name + ' %' + Math.ceil(Math.max(0, f) * 100), key === 'tw_ally' ? '#9fffb0' : '#ff9090', 12); } catch (e) { } }
  const OWNC = o => o === 1 ? '#5aff8a' : o === -1 ? '#ff5050' : '#e8e0c8';
  function capGround(c) { ctx.save(); const col = OWNC(c.own), t = gameTime; ctx.globalAlpha = .18; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * .55, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = .8; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * .55, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (Math.abs(c.prog) > .01 && Math.abs(c.prog) < 1) { ctx.lineWidth = 5; ctx.strokeStyle = c.prog > 0 ? '#5aff8a' : '#ff5050'; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r - 6, c.r * .55 - 4, 0, -Math.PI / 2, -Math.PI / 2 + Math.abs(c.prog) * 6.283); ctx.stroke(); }
    ctx.restore(); }
  function drawCatapult(c) { const x = c.x, y = c.y, t = gameTime, ph = c.own ? Math.max(0, 1 - (c.fireT || 8) / 1.2) : 0; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 46, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a2e18'; ctx.fillRect(x - 40, y - 14, 80, 10); ctx.fillStyle = '#6e4826'; ctx.fillRect(x - 40, y - 16, 80, 4);
    for (const wx of [-30, 30]) { ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.arc(x + wx, y - 4, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#8a5a30'; ctx.beginPath(); ctx.arc(x + wx, y - 4, 6, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - 6, y - 44, 12, 30); ctx.save(); ctx.translate(x, y - 40); ctx.rotate(-.9 + ph * 1.6); ctx.fillStyle = '#7a5028'; ctx.fillRect(-3, -50, 6, 58); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, -52, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.arc(0, -54, 6, 0, 7); ctx.fill(); ctx.restore();
    const fl2 = c.own === 1 ? '#3ab05a' : c.own === -1 ? '#c03030' : '#bbb'; ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 34, y - 64, 3, 50); ctx.fillStyle = fl2; ctx.beginPath(); ctx.moveTo(x + 37, y - 64); ctx.lineTo(x + 58 + Math.sin(t * 4) * 3, y - 58); ctx.lineTo(x + 37, y - 50); ctx.fill();
    ctx.restore(); try { label(x, y - 104, '⚙ Mancınık • ' + (c.own === 1 ? 'BİZİM' : c.own === -1 ? 'GÖLGE' : 'BOŞ') + (c.us || c.th ? '  (' + c.us + ' vs ' + c.th + ')' : ''), OWNC(c.own), 12); } catch (e) { } }
  function drawAltar(c) { const x = c.x, y = c.y, t = gameTime, col = c.el === 'fire' ? '#ff7a30' : c.el === 'ice' ? '#8fe3ff' : '#e080ff', oc = OWNC(c.own); ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 40, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a2228'; ctx.fillRect(x - 34, y - 14, 68, 14); ctx.fillStyle = '#4a3e46'; ctx.fillRect(x - 34, y - 16, 68, 4); ctx.fillStyle = '#3a3038'; ctx.fillRect(x - 22, y - 30, 44, 16); ctx.fillStyle = '#5a4e58'; ctx.fillRect(x - 22, y - 32, 44, 4);
    const cr = img('ws_crystal'); const by = y - 70 + Math.sin(t * 2) * 4; ctx.globalCompositeOperation = 'lighter'; softDot(x, by + 10, 46, col, .55 + .15 * Math.sin(t * 3)); softDot(x, y - 6, 60, oc, .25); ctx.globalCompositeOperation = 'source-over';
    if (ok(cr)) { ctx.imageSmoothingEnabled = false; ctx.drawImage(cr, x - 18, by - 16, 36, 46); } else { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, by - 22); ctx.lineTo(x + 12, by + 6); ctx.lineTo(x, by + 30); ctx.lineTo(x - 12, by + 6); ctx.fill(); }
    if (c.el === 'eye') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, by + 6, 8, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#300030'; ctx.beginPath(); ctx.arc(x + Math.sin(t) * 2, by + 6, 3, 0, 7); ctx.fill(); }
    ctx.restore(); try { label(x, y - 112, (c.el === 'fire' ? '🔥 ' : c.el === 'ice' ? '❄ ' : '👁 ') + c.name + ' • ' + (c.own === 1 ? 'BİZİM' : c.own === -1 ? 'GÖLGE' : 'BOŞ'), OWNC(c.own), 12); } catch (e) { } }
  function drawFlag(c) { const x = c.x, y = c.y, t = gameTime, col = c.own === 1 ? '#3ab05a' : c.own === -1 ? '#c03030' : '#d8d0b8'; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 26, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a3036'; ctx.fillRect(x - 16, y - 10, 32, 10); ctx.fillStyle = '#d0b060'; ctx.fillRect(x - 2, y - 120, 4, 112); ctx.beginPath(); ctx.arc(x, y - 122, 4, 0, 7); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 2, y - 116); for (let i = 0; i <= 8; i++) ctx.lineTo(x + 2 + i * 6, y - 116 + Math.sin(t * 5 + i * .8) * 3 + (i === 8 ? 10 : 0)); for (let i = 8; i >= 0; i--) ctx.lineTo(x + 2 + i * 6, y - 84 + Math.sin(t * 5 + i * .8) * 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 14px "Segoe UI",sans-serif'; ctx.fillText('⚔', x + 18, y - 95); ctx.restore(); try { label(x, y - 140, '🚩 Zafer Sancağı • ' + (c.own === 1 ? 'BİZİM' : c.own === -1 ? 'GÖLGE' : 'BOŞ'), OWNC(c.own), 12); } catch (e) { } }
  function drawTrap(tr) { const x = tr.x, y = tr.y; ctx.save(); ctx.fillStyle = '#2a2430'; ctx.fillRect(x - 15, y - 12, 30, 24); ctx.strokeStyle = '#5a4a60'; ctx.lineWidth = 2; ctx.strokeRect(x - 15, y - 12, 30, 24);
    const warn = tr.ph > 1.8 && !tr.up, h = tr.up ? 12 : warn ? 3 : 0; ctx.fillStyle = '#14101a'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.fillRect(x - 11 + i * 9, y - 7 + j * 10, 4, 4);
    if (h) { ctx.fillStyle = tr.up ? '#d8d8e0' : '#a09cb0'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const sx = x - 9 + i * 9, sy = y - 3 + j * 10; ctx.beginPath(); ctx.moveTo(sx - 3, sy); ctx.lineTo(sx, sy - h); ctx.lineTo(sx + 3, sy); ctx.fill(); } }
    if (warn) { ctx.globalAlpha = .5 + .5 * Math.sin(gameTime * 30); ctx.strokeStyle = '#ff5050'; ctx.strokeRect(x - 15, y - 12, 30, 24); } ctx.restore(); }
  function drawShot(s) { const k = s.t / s.dur, x = s.x0 + (s.x1 - s.x0) * k, y = s.y0 + (s.y1 - 80 - s.y0) * k - Math.sin(k * Math.PI) * 260; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(s.x0 + (s.x1 - s.x0) * k, s.y0 + (s.y1 - s.y0) * k, 12, 4, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#6a6470'; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#9a94a0'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 5, 0, 7); ctx.fill(); ctx.restore(); }
  if (typeof drawEnemy === 'function') { const _dn = drawEnemy; drawEnemy = function (e) { if (e && e.kdMon) { if (!e.dead) drawMon(e.x, e.y, 'tw_foe', e.hp / e.maxHp, 'Gölge Kalesi'); return; } return _dn.apply(this, arguments); }; }
  if (typeof drawExtrasGround === 'function') { const _g = drawExtrasGround; drawExtrasGround = function () { _g.apply(this, arguments); try { if (M && M.evMap) { for (const c of M.caps || []) capGround(c); for (const tr of M.traps || []) drawTrap(tr); } } catch (e) { } }; }
  if (typeof drawExtrasTop === 'function') { const _t = drawExtrasTop; drawExtrasTop = function () { _t.apply(this, arguments); try { if (E && E.shots) for (const s of E.shots) drawShot(s); } catch (e) { } }; }
  if (typeof extrasToList === 'function') { const _el = extrasToList; extrasToList = function (list) { _el.apply(this, arguments); try { if (E && E.k === 'bdv' && E.mine) { const m = E.mine; list.push({ y: m.y, k: 7, fn: () => drawMon(m.x, m.y, 'tw_ally', m.hp / m.maxHp, 'Şafak Kalesi') }); }
      if (M && M.evMap) for (const c of M.caps || []) list.push({ y: c.y, k: 7, fn: () => c.kind === 'catapult' ? drawCatapult(c) : c.kind === 'altar' ? drawAltar(c) : drawFlag(c) }); } catch (e) { } }; }
  if (typeof questTarget === 'function') { const _qt = questTarget; questTarget = function () { if (E && !E.over) { const p = P();
      if (E.k === 'bdv') { if (E.cat.own !== 1) return { x: E.cat.x, y: E.cat.y, label: 'Mancınığı al' }; if (E.theirs && !E.theirs.dead) return { x: E.theirs.x, y: E.theirs.y, label: 'Gölge Kalesi' }; }
      if (E.k === 'jr') { if (E.boss && !E.boss.dead) return { x: E.boss.x, y: E.boss.y, label: 'Rün Bekçisi' }; const c = M.caps.filter(c => c.own !== 1).sort((a, b) => dist(p, a) - dist(p, b))[0]; if (c) return { x: c.x, y: c.y, label: c.name }; }
      if (E.k === 'zindan') { const d = (M.doors || [])[E.wave - 1]; const B = enemies.find(e => e.kdZBoss && !e.dead); if (B) return { x: B.x, y: B.y, label: 'Zindan Efendisi' }; const rm = M.rooms[E.room]; if (rm && Math.abs(p.y / TL - (rm.y0 + rm.y1) / 2) > 6) return { x: 32 * TL, y: (rm.y0 + rm.y1) / 2 * TL, label: rm.name }; }
      if (E.k === 'klan' && M.caps[0].own !== 1) return { x: M.caps[0].x, y: M.caps[0].y, label: 'Zafer Sancağı' };
      return null; } return _qt.apply(this, arguments); }; }

  // ---------------- arayüz: üst bilgi çubuğu + sonuç ----------------
  const bar = document.createElement('div'); bar.id = 'kdEvBar'; document.body.appendChild(bar);
  const res = document.createElement('div'); res.id = 'kdEvRes'; document.body.appendChild(res);
  res.addEventListener('click', e => { if (e.target.closest('[data-back]')) leave(); });
  bar.addEventListener('pointerdown', e => { if (e.target.closest('[data-quit]')) { e.preventDefault(); e.stopPropagation(); if (E && !E.over) finish(false, 'ayrıldın'); } });
  setInterval(() => { if (!E || E.over) return; const left = Math.max(0, E.dur - (gameTime - E.t0)), mm = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(Math.floor(left % 60)).padStart(2, '0'); let s = '';
    const O = c => c.own === 1 ? '🟢' : c.own === -1 ? '🔴' : '⚪';
    if (E.k === 'bdv') s = '🏰 %' + Math.ceil(Math.max(0, E.mine.hp) / E.mine.maxHp * 100) + ' • Gölge %' + Math.ceil(Math.max(0, E.theirs.hp) / E.theirs.maxHp * 100) + ' • ⚙' + O(E.cat);
    else if (E.k === 'jr') s = '💠 ' + Math.floor(E.pow.us) + ' • Gölge ' + Math.floor(E.pow.them) + ' • ' + M.caps.map(c => (c.el === 'fire' ? '🔥' : c.el === 'ice' ? '❄' : '👁') + O(c)).join(' ') + (E.boss ? ' • Bekçi %' + Math.ceil(Math.max(0, E.boss.hp) / E.boss.maxHp * 100) : '');
    else if (E.k === 'zindan') s = '🚪 ' + (M.rooms && M.rooms[E.room] ? M.rooms[E.room].name : '') + ' (' + E.wave + '/4) • Kalan ' + enemies.filter(e => !e.dead).length;
    else s = '⚔ ' + E.us + ' - ' + E.them + ' ' + esc2(E.foeClan) + ' • 🚩' + O(M.caps[0]);
    bar.innerHTML = '<b>' + esc2(EV[E.k].n) + '</b><span>' + s + '</span><span class="tm">⏱ ' + mm + '</span><button data-quit="1">Ayrıl</button>'; }, 300);

  // ---------------- ETKİNLİK MERKEZİ (Etkinlik Konağı) ----------------
  const hall = document.createElement('div'); hall.id = 'kdEvent'; hall.className = 'panel win hidden'; document.body.appendChild(hall);
  let tab = 'ev', msg = '';
  function openHall() { const p = P(); if (!p) return; ensure(p); try { closeAll(); } catch (e) { } hall.classList.remove('hidden'); render(); }
  function closeHall() { hall.classList.add('hidden'); }
  window.kdOpenEvents = openHall;
  const weekId = () => { const d = new Date(), j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + '-' + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); };
  function render() {
    const p = P(); if (!p || hall.classList.contains('hidden')) return; ensure(p);
    let h = '<button class="x" data-close="kdEvent">✕</button><h2>Etkinlik Merkezi</h2><div class="ev-tabs">' + [['ev', 'Etkinlikler'], ['daily', 'Günlük Giriş'], ['online', 'Çevrimiçi Hediye'], ['klan', 'Klan'], ['log', 'Kazanılanlar']].map(t => '<button data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>';
    if (msg) h += '<div class="pk-msg">' + msg + '</div>';
    if (tab === 'ev') for (const k of ['bdv', 'jr', 'zindan', 'klan']) { const e = EV[k], open = nowOpen(k);
      h += '<div class="ev-card"><div class="ev-hd"><img src="na/' + e.ic + '.png" alt=""><div><b>' + e.n + '</b><span class="' + (open ? 'good' : 'mut') + '">' + nextText(k) + (k === 'zindan' ? ' • Bugün ' + (p.evZin.d === today() ? p.evZin.n : 0) + '/3' : '') + '</span></div>' +
        '<button class="' + (open ? 'gold' : '') + '" data-join="' + k + '"' + (open ? '' : ' disabled') + '>Katıl</button></div><div class="ev-sub">Saatler</div><div class="ev-tx">' + e.times.join(' • ') + (e.win ? ' (her biri ' + e.win + ' dk açık)' : '') + '</div>' +
        '<div class="ev-sub">Kurallar</div><ul>' + e.rules.map(r => '<li>' + esc2(r) + '</li>').join('') + '</ul><div class="ev-sub">Hediyeler</div><div class="ev-tx">🎁 ' + esc2(e.rew) + '</div></div>'; }
    else if (tab === 'daily') { const done = p.evDaily.last === today(), cur = p.evDaily.day % 7;
      h += '<div class="mut">Her gün giriş yap, hediyeni al. 7 günlük döngü.</div><div class="ev-cal">' + DAILY_T.map((t, i) => '<div class="d' + (i < cur || (done && i === (cur + 6) % 7 && false) ? ' got' : '') + (i === cur && !done ? ' now' : '') + '"><b>' + (i + 1) + '. gün</b><span>' + t + '</span></div>').join('') + '</div>' +
        '<button class="gold big" data-daily="1"' + (done ? ' disabled' : '') + '>' + (done ? 'Bugünün hediyesi alındı ✔' : 'Hediyeyi Al') + '</button>'; }
    else if (tab === 'online') { const pc = Math.min(100, p.evOnline / 1800 * 100), rem = Math.ceil((1800 - p.evOnline) / 60);
      h += '<div class="mut">Oyunda kaldığın her 30 dakikada bir hediye otomatik çantana gelir.</div><div class="ev-prog"><i style="width:' + pc.toFixed(1) + '%"></i></div><div class="ev-tx">Sonraki hediye: <b>' + rem + ' dk</b> sonra</div>'; }
    else if (tab === 'klan') { const c = p.clan;
      if (!c) h += '<div class="ev-tx">Bir klanın yok. Klan kur, arkadaşlarını topla, haftalık Klan Savaşı\'na kayıt ol.</div><div class="ev-row"><input data-cname="1" maxlength="16" placeholder="Klan adı"><button class="gold" data-cnew="1">Klan Kur</button></div>';
      else h += '<div class="ev-card"><div class="ev-hd"><img src="na/i_shield.png" alt=""><div><b>' + esc2(c.name) + '</b><span class="mut">Üyeler: ' + esc2([p.name].concat(c.members).join(', ')) + ' • Klan puanı: ' + (c.pts || 0) + '</span></div></div>' +
        '<div class="ev-tx">Bu hafta: ' + (c.reg === weekId() ? '<b class="good">Klan Savaşı\'na kayıtlı ✔</b>' : '<span class="mut">kayıtlı değil</span>') + '</div><div class="ev-row"><button class="gold" data-creg="1"' + (c.reg === weekId() ? ' disabled' : '') + '>Bu Haftaya Kayıt Ol</button><button data-cleave="1">Klandan Ayrıl</button></div></div>'; }
    else h += '<div class="pk-hist">' + (p.evLog.length ? p.evLog.map(r => '<div class="row load"><span>' + new Date(r.t).toLocaleString('tr-TR') + '</span><b>' + esc2(r.what) + '</b><small>' + esc2(r.txt) + '</small></div>').join('') : '<div class="mut">Henüz hediye yok.</div>') + '</div>';
    hall.innerHTML = h;
  }
  hall.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; const d = b.dataset, p = P();
    if (d.close) { closeHall(); return; } if (d.tab) { tab = d.tab; msg = ''; }
    else if (d.join) { const r = start(d.join); msg = r.ok ? '' : '❌ ' + r.err; if (r.ok) return; }
    else if (d.daily) { const r = claimDaily(); msg = r.ok ? '✅ ' + r.txt : '❌ ' + r.err; }
    else if (d.cnew) { const n = (hall.querySelector('[data-cname]').value || '').trim(); if (!/^[A-Za-zÇĞİÖŞÜçğıöşü0-9_]{3,16}$/.test(n)) msg = '❌ Klan adı 3-16 karakter (harf, rakam, _)'; else { p.clan = { name: n, members: teamNames(4), pts: 0, reg: '' }; msg = '✅ "' + n + '" klanı kuruldu, 4 üye katıldı.'; try { save(); } catch (e) { } } }
    else if (d.creg) { p.clan.reg = weekId(); msg = '✅ Klan Savaşı\'na kayıt oldun. Cumartesi 21:00\'de rastgele bir klanla eşleşeceksin.'; try { save(); } catch (e) { } }
    else if (d.cleave) { p.clan = null; msg = 'Klandan ayrıldın.'; }
    render(); });
  // NPC + menü satırı
  if (typeof openNpc === 'function') { const _on = openNpc; openNpc = function (n) { if (n && n.id === 'etkinlik') { openHall(); return; } return _on.apply(this, arguments); }; }
  if (typeof npcMarker === 'function') { const _nm = npcMarker; npcMarker = function (n) { if (n.id === 'etkinlik') { const p = P(); const dueD = p && p.evDaily && p.evDaily.last !== today(); return { t: dueD ? '!' : '🏆', c: dueD ? '#ffd23a' : '#fff', s: dueD ? 24 : 16 }; } return _nm.apply(this, arguments); }; }
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function () { const r = _sg.apply(this, arguments); try { E = null; bar.classList.remove('on'); res.classList.remove('on'); const p = P(); ensure(p); if (M && M.evMap) enterMap('yesilvadi'); if (p.evDaily.last !== today()) setTimeout(() => { try { addChat(null, '🎁 Günlük giriş hediyen hazır! Etkinlik Konağı → Event Master Orin (ya da Menü → Etkinlikler).', '#ffe08a'); } catch (e) { } }, 2500); } catch (e) { } return r; }; window.startGame = startGame; }
})();
