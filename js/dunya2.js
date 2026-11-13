'use strict';
// =====================================================================
//  YEŞİLVADİ v2 — harita 2 kat (128 → 256 karo), her bölge 2 kat büyük
//  Köy baştan tasarlandı: geniş ana yollar, merkez meydan + konak,
//  4 mahalle (Muhtar/Lonca • Çarşı: Tüccar/Demirci/pazar çadırları •
//  Şifa Havuzu/Bilge • Ahır: Seyis/Zanaatkâr), kapı muhafızları, bahçeler.
//  Eski genYesilvadi silinmedi; GEN.yesilvadi bu yeni üreticiye bağlanır.
// =====================================================================
(function () {
  const K = 4, C = 64 * K;                     // v57: ölçek 4 → 512x512 karo, harita merkezi (256)
  const VX = 30, VY = 24;                       // köy yarı genişlik / yarı yükseklik (karo)
  const HOUSE = { muhtar: 'hs_red', tuccar: 'hs_shop', demirci: 'hs_forge', bilge: 'hs_dome', seyis: 'hs_hay', zanaat: 'hs_cabin', lonca: 'hs_wood', g1: 'hs_orange2', g2: 'hs_tan' };
  const HW = { hs_shop: 48, hs_dome: 48, hs_wood: 48, hs_hay: 47 };
  const LOOK = {
    muhtar: { body: '#6a3d8a', trim: '#d9b45a', legs: '#3a2a3a', skin: '#e8c09a', hair: '#bbbbbb', beard: '#e0e0e0', weapon: 'none' },
    tuccar: { body: '#b5651d', trim: '#f0d080', legs: '#5a3a1e', skin: '#f0c9a0', hair: '#5a3214', longhair: true, weapon: 'none' },
    demirci: { body: '#4a3a30', trim: '#2a1a10', legs: '#2a2420', skin: '#d8a880', hair: '#2a1a10', beard: '#2a1a10', weapon: 'hammer' },
    bilge: { body: '#2e4f6e', trim: '#c0d0e0', legs: '#1e2f40', skin: '#e8c09a', hat: 'wizard', hatCol: '#1e3550', beard: '#f0f0f0', weapon: 'staff', orb: '#bfffd0' },
    muhafiz: { body: '#5a5a64', trim: '#9b3b2b', legs: '#2a2a30', skin: '#e8c09a', hat: 'helm', hatCol: '#8a9098', weapon: 'sword' },
    seyis: { body: '#6a5030', trim: '#3a2a1a', legs: '#3a3020', skin: '#d8a880', hair: '#4a3018', beard: '#4a3018', weapon: 'none' },
    zanaat: { body: '#4a6a5a', trim: '#c0a060', legs: '#2a3a30', skin: '#f0c9a0', hair: '#8a3a1a', longhair: true, weapon: 'hammer' },
    lonca: { body: '#5a3a6a', trim: '#ffd040', legs: '#2a1a30', skin: '#e8c09a', hair: '#1a1a1a', beard: '#1a1a1a', weapon: 'none' },
    inci: { body: '#2a6a8a', trim: '#f0f0ff', legs: '#1a3040', skin: '#f0c9a0', hair: '#e8e8f0', longhair: true, weapon: 'none' },
    ilan: { body: '#7a5a2a', trim: '#ffe080', legs: '#3a2a1a', skin: '#d8a880', hair: '#3a2010', weapon: 'none' },
  };
  HOUSE.inci = 'hs_orange';

  function genYesilvadi2() {
    const W = 64 * K * 2, H = W;
    const m = newMap('yesilvadi', 'Yeşilvadi Diyarı', W, H); m.villageV2 = true;
    const inVillage = (x, y) => Math.abs(x - C) <= VX + .5 && Math.abs(y - C) <= VY + .5;
    // v58: simetrik bölge düzeni — merkezde köy + Çiçekli Çayır halkası; K volkan, D harabe, G koru, B orman
    const zoneOf = (x, y) => { if (inVillage(x, y)) return 'village'; const dx = x - C, dy = y - C; if (Math.hypot(dx, dy) < 34 * K) return 'meadow'; if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? 'volcano' : 'forestE'; return dx > 0 ? 'ruins' : 'forestW'; };
    const LAKES = [[C - 52, C - 52], [C + 52, C - 52], [C - 52, C + 52], [C + 52, C + 52]];
    m.zoneOf = zoneOf;
    m.zones = { village: { name: 'Yeşilvadi Kalesi', lv: 'Güvenli bölge' }, meadow: { name: 'Çiçekli Çayır', lv: 'Seviye 1-3' }, forestW: { name: 'Uluyan Orman', lv: 'Seviye 3-7' }, forestE: { name: 'Goblin Korusu', lv: 'Seviye 5-9' }, ruins: { name: 'Lanetli Harabeler', lv: 'Seviye 8-13' }, volcano: { name: 'Ejder Tepesi', lv: 'Seviye 14-18' } };
    const wr = mulberry32(20261106); const n1 = makeNoise(wr), n2 = makeNoise(wr), n3 = makeNoise(wr);
    // ---- arazi (gürültü ölçeği de 2 kat → göller/ormanlar orantılı büyür) ----
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, z = zoneOf(x, y); let t = T.GRASS, d = D.NONE;
      const a = fbm(n1, x / (9 * K), y / (9 * K)), b = fbm(n2, x / (5 * K), y / (5 * K)), w = fbm(n3, x / (13 * K), y / (13 * K)), r = wr(); m.tvar[i] = Math.floor(wr() * 4);
      // v58: küçük tek karelik engeller (taş, mezar, kuru ağaç, duvar parçası) YOK — akıcı, takılmasız alan
      if (z === 'volcano') { t = T.VOLC; if (a > .71) t = T.LAVA; else if (r < .005) d = D.CRYSTAL; }
      else if (z === 'ruins') { t = b > .5 ? T.RUIN : T.DARK; }
      else if (z === 'forestW') { t = T.FOREST; if (w > .73) t = T.WATER; else if (r < .006) d = D.BUSH; else if (r < .016) d = D.FLOWER; }
      else if (z === 'forestE') { t = T.GRASS; if (w > .73) t = T.WATER; else if (r < .006) d = D.BUSH; else if (r < .02) d = D.FLOWER; }
      else if (z === 'meadow') { let lk = false; for (const [lx, ly] of LAKES) if (Math.hypot(x - lx, y - ly) < 10 + (w - .5) * 9) lk = true; if (lk) t = T.WATER; else if (r < .022) d = D.FLOWER; else if (r < .026) d = D.BUSH; }
      else if (r < .06) d = D.FLOWER;
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) { t = T.WATER; d = D.NONE; }
      m.tiles[i] = t; m.deco[i] = d;
    }
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (m.tiles[i] !== T.GRASS && m.tiles[i] !== T.FOREST) continue; if (m.tiles[i - 1] === T.WATER || m.tiles[i + 1] === T.WATER || m.tiles[i - W] === T.WATER || m.tiles[i + W] === T.WATER) { m.tiles[i] = T.SAND; if (m.deco[i] === D.PINE || m.deco[i] === D.TREE) m.deco[i] = D.NONE; } }
    // ---- yollar (2 kat uzun, daha geniş) ----
    // v58: simetrik yol ağı — 4 ana yol, 2 halka yol (r100, r185), 4 çapraz bağlantı; bölge meydanları
    const roadT = (tx, ty) => { const z = zoneOf(tx, ty); return z === 'volcano' ? T.SCORCH : z === 'ruins' ? T.PLAZA : T.PATH; };
    carve(m, n1, C, C - VY - 1, C, 16, roadT, 2); carve(m, n1, C + VX + 1, C, W - 18, C, roadT, 2); carve(m, n1, C - VX - 1, C, 18, C, roadT, 2); carve(m, n1, C, C + VY + 1, C, H - 18, roadT, 2);
    const ring = (r, half) => { const N = Math.round(2 * Math.PI * r / 5); for (let k = 0; k < N; k++) { const a0 = k / N * 2 * Math.PI, a1 = (k + 1) / N * 2 * Math.PI; carve(m, null, Math.round(C + Math.cos(a0) * r), Math.round(C + Math.sin(a0) * r), Math.round(C + Math.cos(a1) * r), Math.round(C + Math.sin(a1) * r), roadT, half); } };
    ring(100, 1); ring(185, 1);
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; carve(m, null, Math.round(C + Math.cos(a) * 100), Math.round(C + Math.sin(a) * 100), Math.round(C + Math.cos(a) * 185), Math.round(C + Math.sin(a) * 185), roadT, 1); }
    const PLZ = [['volcano', C, C - 185, T.VOLC], ['ruins', C + 185, C, T.RUIN], ['forestE', C, C + 185, T.GRASS], ['forestW', C - 185, C, T.FOREST]];
    for (const [, px, py, tt] of PLZ) { clearCircle(m, px, py, 10, tt); clearCircle(m, px, py, 6, roadT(px, py)); }
    const CMP = []; for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, x = Math.round(C + Math.cos(a) * 185), y = Math.round(C + Math.sin(a) * 185); CMP.push([x, y]); clearCircle(m, x, y, 6, null); }
    m.design = { PLZ, CMP, LAKES };
    clearCircle(m, 117 * K, C, 2.5 * K, T.RUIN);

    // ================= KÖY =================
    const set = (x, y, t, d) => { const i = y * W + x; if (t != null) m.tiles[i] = t; m.deco[i] = d == null ? D.NONE : d; };
    for (let y = C - VY; y <= C + VY; y++) for (let x = C - VX; x <= C + VX; x++) {
      const dx = x - C, dy = y - C, ax = Math.abs(dx), ay = Math.abs(dy);
      set(x, y, T.GRASS, D.NONE);
      const road = ax <= 2 || ay <= 2, plaza = ax <= 11 && ay <= 9;
      if (plaza || (road && ax < VX && ay < VY)) m.tiles[y * W + x] = T.PLAZA;
      // sınır: ağaç + çit + kaya; dört kapı
      if (ax === VX || ay === VY) {
        const gate = (ax <= 3 && ay === VY) || (ay <= 3 && ax === VX);
        if (gate) m.tiles[y * W + x] = T.PLAZA;
        else { const corner = ax === VX && ay === VY, gatePost = ((ax === 4 || ax === 5) && ay === VY) || ((ay === 4 || ay === 5) && ax === VX), k = (ax + ay) % 5;
          m.deco[y * W + x] = gatePost ? D.TREE : corner ? D.ROCK : k === 0 ? D.ROCK : D.PALI; } // v53: çit + taş; ağaç yalnız kapı girişinde
      } else if (!plaza && !road) { if (wr() < .03) m.deco[y * W + x] = D.FLOWER; }
    }
    // mahalle ara yolları (meydan çevresi halka yol)
    for (let x = C - 20; x <= C + 20; x++) for (const y of [C - 15, C + 15]) if (Math.abs(x - C) > 2) set(x, y, T.PATH);
    for (let y = C - 15; y <= C + 15; y++) for (const x of [C - 20, C + 20]) if (Math.abs(y - C) > 2) set(x, y, T.PATH);
    // köşe bahçeleri: ağaç kümeleri + çiçek
    for (const [cx, cy] of [[C - VX + 4, C - VY + 4], [C + VX - 4, C - VY + 4], [C - VX + 4, C + VY - 4], [C + VX - 4, C + VY - 4]]) {
      for (let k = 0; k < 7; k++) { const x = cx + ri(-3, 3), y = cy + ri(-3, 3); if (Math.abs(x - C) < VX - 1 && Math.abs(y - C) < VY - 1 && m.tiles[y * W + x] === T.GRASS) m.deco[y * W + x] = k % 3 ? D.TREE : D.BUSH; }
      for (let k = 0; k < 10; k++) { const x = cx + ri(-5, 5), y = cy + ri(-5, 5); if (m.tiles[y * W + x] === T.GRASS && !m.deco[y * W + x]) m.deco[y * W + x] = D.FLOWER; }
    }
    // Köy Konağı (merkez)
    addBuilding(m, { x: C - 6, y: C - 6, w: 12, h: 11, type: 'house', roof: '#8b2f24', name: 'Etkinlik Konağı', floors: 2 });
    // ana yollar boyunca lambalar
    for (let k = -VY + 3; k <= VY - 3; k += 5) if (Math.abs(k) > 10) { for (const x of [C - 4, C + 4]) { const i = (C + k) * W + x; if (!m.bsolid[i]) m.deco[i] = D.LAMP; } }
    for (let k = -VX + 3; k <= VX - 3; k += 6) if (Math.abs(k) > 12) { for (const y of [C - 4, C + 4]) { const i = y * W + C + k; if (!m.bsolid[i]) m.deco[i] = D.LAMP; } }
    for (const [lx, ly] of [[C - 12, C - 10], [C + 12, C - 10], [C - 12, C + 10], [C + 12, C + 10]]) m.deco[ly * W + lx] = D.LAMP;

    // ---- NPC'ler ve evleri (mahallelere göre) ----
    const defs = [];
    function npcHouse(id, name, x, y, houseKey) {
      const key = houseKey || HOUSE[id], S = key === 'hs_hay' ? 2.5 : 2, iw = HW[key] || 64;
      // evin alanını temizle
      const bw = Math.max(2, Math.round(iw * S / TILE)), bx = Math.round(x - iw * S / TILE / 2), bottom = y * TILE - 8, by1 = Math.floor(bottom / TILE);
      for (let yy = by1 - 3; yy <= by1 + 1; yy++) for (let xx = bx - 1; xx <= bx + bw; xx++) { const i = yy * W + xx; if (m.deco[i] !== D.PALI) m.deco[i] = D.NONE; }
      addBuilding(m, { x: bx, y: by1 - 2, w: bw, h: 2, type: 'nhouse', img: key, px: x * TILE, py: bottom, S, name });
      defs.push({ id: id.replace(/\d$/, ''), name, look: LOOK[id.replace(/\d$/, '')] || LOOK.muhafiz, x, y, face: x < C ? 1 : -1 });
      // kapı önü küçük patika
      for (let yy = Math.floor(y); yy <= Math.floor(y) + 1; yy++) { const i = yy * W + Math.floor(x); if (m.tiles[i] === T.GRASS) m.tiles[i] = T.PATH; }
    }
    // KB: yönetim mahallesi
    npcHouse('muhtar', 'Elder Aldric', C - 15, C - 18.2);
    npcHouse('lonca', 'Guildmaster Thorne', C - 24, C - 12.2);
    // KD: çarşı
    npcHouse('tuccar', 'Merchant Lyra', C + 14, C - 18.2);
    npcHouse('demirci', 'Blacksmith Borin', C + 24, C - 12.2);
    addBuilding(m, { x: C + 13, y: C - 13, w: 3, h: 2, roof: '#a83a2a', name: 'Pazar', tent: true });
    addBuilding(m, { x: C + 18, y: C - 8, w: 3, h: 2, roof: '#2a6aa8', name: 'Pazar', tent: true });
    // GB: şifa mahallesi (havuz + bilge)
    npcHouse('bilge', 'Sage Elowen', C - 15, C + 13.8);
    const PX = C, PY = C + 12; // v53: şifa havuzu ortada ve büyük
    for (let y = PY - 5; y <= PY + 5; y++) for (let x = PX - 8; x <= PX + 8; x++) { const i = y * W + x; m.deco[i] = D.NONE; m.bsolid[i] = 0; m.tiles[i] = T.PLAZA; }
    m.pool = { x: (PX + .5) * TILE, y: (PY + 1) * TILE, r: 130, s: 6 };
    m.labels.push({ x: PX, y: PY - 4.6, t: 'Şifa Havuzu' });
    // GD: ahır mahallesi (seyis + çit ağıl, zanaatkâr)
    npcHouse('seyis', 'Stablemaster Rowan', C + 14, C + 13.8);
    // v55: ağıl kaldırıldı — güneydoğu köşesi Kızıl Sınır PvP kapısına ayrıldı
    npcHouse('zanaat', 'Artisan Mira', C + 24, C + 13.8 - 6);
    // kapı muhafızları
    npcHouse('muhafiz1', 'Guard Captain Darius', C - 6, C - VY + 4.8, 'hs_orange2');
    npcHouse('muhafiz2', 'Guard Kael', C + 6, C + VY - 1.2, 'hs_tan');
    // ---- v50: PAZAR YERİ — güney kapısından girilen ayrı ticaret bölgesi; ızgara tezgâhlar ----
    const MX0 = C - 31, MX1 = C + 31, MY0 = C + VY + 2, MY1 = C + VY + 31; // v53: alan 2 kat, tezgâhlar küçük → 72 tezgâh
    m.market = { x0: MX0 * TILE, x1: (MX1 + 1) * TILE, y0: MY0 * TILE, y1: (MY1 + 1) * TILE };
    for (let y = MY0 - 1; y <= MY1; y++) for (let x = MX0; x <= MX1; x++) {
      const ax = Math.abs(x - C), edge = x === MX0 || x === MX1 || y === MY1, top = y === MY0 - 1;
      set(x, y, T.GRASS, D.NONE); if (ax <= 4 || y === MY0 + 14 || y === MY0 + 15) m.tiles[y * W + x] = T.PLAZA;
      if (top) { m.tiles[y * W + x] = ax <= 3 ? T.PLAZA : T.PATH; }
      if (edge) { const gate = (y === MY1 && ax <= 3); if (gate) m.tiles[y * W + x] = T.PLAZA; else m.deco[y * W + x] = (x + y) % 6 === 0 ? D.ROCK : D.PALI; }
    }
    m.stalls = []; let sid = 1;
    for (const ry of [MY0 + 3, MY0 + 7, MY0 + 11, MY0 + 18, MY0 + 22, MY0 + 26]) for (const cx of [-28, -24, -20, -16, -12, -8, 8, 12, 16, 20, 24, 28]) {
      for (let y = ry - 1; y <= ry; y++) for (let x = C + cx - 1; x <= C + cx; x++) set(x, y, T.PLAZA, D.NONE);
      m.stalls.push({ id: sid++, x: (C + cx) * TILE, y: (ry + .1) * TILE });
    }
    for (const [lx, ly] of [[C - 5, MY0 + 2], [C + 5, MY0 + 2], [C - 5, MY0 + 28], [C + 5, MY0 + 28], [C - 30, MY0 + 14], [C + 30, MY0 + 14], [C - 5, MY0 + 14], [C + 5, MY0 + 15]]) m.deco[ly * W + lx] = D.LAMP;
    m.safe_extra = { x: (C + .5) * TILE, y: ((MY0 + MY1) / 2 + .5) * TILE, w: 31.6 * TILE, h: ((MY1 - MY0) / 2 + 1.2) * TILE };
    // İnci Dükkânı: pazarın girişinde, güney kapısının solunda (muhafız evinin simetriği)
    npcHouse('inci', 'Pearl Trader Selene', C - 6, C + VY - 1.2);
    // Buluşma Meydanı: parti kurma noktası (ana meydanın güneyi)
    defs.push({ id: 'ilan', name: 'Party Finder Nyx', look: LOOK.ilan, x: C + 10, y: C + 11, face: -1 });
    defs.push({ id: 'etkinlik', name: 'Event Master Orin', look: LOOK.muhtar, x: C + 2.5, y: C + 6.4, face: 1 });
    // v53: görkemli kapılar (çizim köy katmanında): kuzey, güney, batı, doğu + pazar
    m.gates = [{ x: (C + .5) * TILE, y: (C - VY + .9) * TILE, n: 'Kuzey Kapısı' }, { x: (C + .5) * TILE, y: (C + VY + .9) * TILE, n: 'Pazar Kapısı' }, { x: (C - VX + .5) * TILE, y: (C + .9) * TILE, n: 'Batı Kapısı', side: 1 }, { x: (C + VX + .5) * TILE, y: (C + .9) * TILE, n: 'Doğu Kapısı', side: 1 }, { x: (C + .5) * TILE, y: (MY1 + .9) * TILE, n: 'Güney Kapısı' }];
    m.labels.push({ x: C, y: MY0 + 1.2, t: 'Pazar Yeri' }, { x: C + 10, y: C + 9.4, t: 'Buluşma Meydanı' }, { x: C - 19, y: C - 21.5, t: 'Görev Mahallesi' }, { x: C + 19, y: C - 21.5, t: 'Çarşı' }, { x: C + 22, y: C + 22.5, t: 'Ahırlar' });
    m.npcDefs = defs;
    // ---- süsleme: mahallelere ağaç / çalı / çiçek serpiştir (yol, ev, NPC, havuz, geçit, ağıl hariç) ----
    const keep = []; for (const n of defs) keep.push([n.x, n.y, 3]); keep.push([PX, PY, 8], [C + 24.2, C + 21, 6]);
    for (const f of [[C - 8.5, C + 8.5], [C + 9.5, C + 8.5], [C - 8.5, C - 8]]) keep.push([f[0], f[1], 2]);
    const nearKeep = (x, y) => keep.some(([kx, ky, r]) => Math.abs(x - kx) <= r && Math.abs(y - ky) <= r);
    for (let y = C - VY + 2; y <= C + VY - 2; y++) for (let x = C - VX + 2; x <= C + VX - 2; x++) {
      const i = y * W + x; if (m.tiles[i] !== T.GRASS || m.deco[i] || m.bsolid[i] || nearKeep(x, y)) continue;
      if (x >= C + 18 && x <= C + 26 && y >= C + 15 && y <= C + 21) continue; // ağıl içi
      let nb = false; for (let yy = y - 1; yy <= y + 1 && !nb; yy++) for (let xx = x - 1; xx <= x + 1; xx++) { const j = yy * W + xx; if (m.bsolid[j] || m.tiles[j] === T.PATH || m.tiles[j] === T.PLAZA) { nb = true; break; } }
      const r = wr(); if (!nb && r < .012) m.deco[i] = D.BUSH; else if (r < .1) m.deco[i] = D.FLOWER; // v53: sade
    }
    // kamp ateşleri (meydanda, ısınma yeri)
    m.fireSpots = [{ x: (C - 8.5) * TILE, y: (C + 8.5) * TILE }, { x: (C + 9.5) * TILE, y: (C + 8.5) * TILE }, { x: (C - 8.5) * TILE, y: (C - 8) * TILE }];

    // ---- geçitler ----
    m.portals = [{ x: (C + 24.2) * TILE, y: (C + 22) * TILE, to: 'sinir', name: 'Kızıl Sınır PvP', big: 'pvp', r: 42, minLvl: 10, tx: (112 + .5) * TILE, ty: (196 + 3) * TILE, col: '#ff5040', desc: 'Gölge Hanedanı ile sürekli savaşılan PvP bölgesi. Canavarlar daha güçlü, ganimet daha değerli.' },
      { x: (117.5 * K) * TILE, y: (C + .5) * TILE, to: 'mahzen', name: 'Unutulmuş Mahzen', minLvl: 9, col: '#a070ff', desc: 'Karanlık bir zindan. Sonunda Lanetli Kral Varkas bekliyor.' }];
    // portalın önünü aç
    for (let y = C + 15; y <= C + 24; y++) for (let x = C + 17; x <= C + 29; x++) { const i = y * W + x; if (x <= C + 28 && y <= C + 23) m.deco[i] = D.NONE; if (m.tiles[i] === T.GRASS && y >= C + 18 && x >= C + 19 && x <= C + 29) m.tiles[i] = T.PLAZA; }
    // v55: kapıya giden yol (pazar yolundan)
    for (let x = C + 15; x <= C + 19; x++) for (const y of [C + 23, C + 24]) { const i = y * W + x; if (m.tiles[i] === T.GRASS) m.tiles[i] = T.PATH; m.deco[i] = D.NONE; }
    // Kızıl Sınır PvP kapısının iki dev sütunu (içinden geçilmez, ortadan geçilir)
    for (const x of [Math.floor(C + 24.2 - 2.5), Math.floor(C + 24.2 + 2.5)]) m.bsolid[(C + 21) * W + x] = 1;

    // ---- canavarlar (alan 4 kat → sayı ~2.5 kat) ----
    m.spawns = [];
    if (window.kdDesignWorld) kdDesignWorld(m, C, K, VX, VY);
    const far = (tx, ty) => (Math.abs(tx - C) > VX + 6 || Math.abs(ty - C) > VY + 6) && Math.hypot(tx - C, ty - (C - 185)) > 16 && !(Math.abs(tx - C) <= 36 && ty >= C + VY && ty <= C + VY + 38);
    const W2 = (type, zone, count, l0, l1, pack) => { for (let n = 0; n < count; n++) { const s = findSpotIn(m, zone, far); if (!s) continue; let lvl; if (zone === 'meadow') { const d = Math.hypot(s.tx - C, s.ty - C); lvl = clamp(Math.round(l0 + (d - 38) / (13 * K) * (l1 - l0)), l0, l1); } else lvl = ri(l0, l1); for (let k = 0; k < (pack || 1); k++) m.spawns.push({ type, lvl, x: s.x + k * 22 - ((pack || 1) - 1) * 11, y: s.y + (k % 2) * 14 }); } };
    const MK = 3; // v57: harita alanı 4 kat → canavar noktası 3 kat
    W2('slime', 'meadow', 55 * MK, 1, 3); W2('wolf', 'forestW', 35 * MK, 3, 7, 2); W2('goblin', 'forestE', 35 * MK, 5, 9, 2); W2('skeleton', 'ruins', 55 * MK, 8, 13); W2('imp', 'volcano', 45 * MK, 14, 17);
    m.spawns.push({ type: 'wolfking', lvl: 7, x: (C - 185 + .5) * TILE, y: (C + .5) * TILE }, { type: 'goblinchief', lvl: 10, x: (C + .5) * TILE, y: (C + 185 + .5) * TILE }, { type: 'skeletonlord', lvl: 13, x: (C + 185 + .5) * TILE, y: (C + .5) * TILE }, { type: 'dragon', lvl: 18, x: (C + .5) * TILE, y: (C - 185 + .5) * TILE });
    m.start = { x: (C + .5) * TILE, y: (C + 7.6) * TILE };
    m.safe = [{ x: (C + .5) * TILE, y: (C + .5) * TILE, w: (VX + .6) * TILE, h: (VY + .6) * TILE }]; if (m.safe_extra) m.safe.push(m.safe_extra);
    { const z0 = m.zoneOf; m.zoneOf = (x, y) => (m.market && x * TILE >= m.market.x0 && x * TILE < m.market.x1 && y * TILE >= m.market.y0 && y * TILE < m.market.y1) ? 'pazar' : z0(x, y); m.zones.pazar = { name: 'Pazar Yeri', lv: 'Güvenli bölge • Ticaret' }; }
    m.labels.push({ x: C, y: C - 7.5, t: 'Yeşilvadi Kalesi' }, { x: C + 75, y: C - 75, t: 'Çiçekli Çayır' }, { x: C - 150, y: C - 12, t: 'Uluyan Orman' }, { x: C + 12, y: C + 150, t: 'Goblin Korusu' }, { x: C + 150, y: C - 12, t: 'Lanetli Harabeler' }, { x: C + 12, y: C - 150, t: 'Ejder Tepesi' });
    return m;
  }

  // =====================================================================
  //  KIZIL SINIR v3 (Sürüm 47) — "koloni bölgesi" düzeni
  //  Güneyde Şafak Kampı, kuzeyde Gölge Kampı. Ortada EJDER YUVASI (Kor Ejderi
  //  belirli saatlerde uyanır), çevresinde canavarı az SAVAŞ OVASI (VS alanı).
  //  Doğu/batı kenarlar KIZIL AVLAK: bol canavar, kasılma bölgesi; batıda Titan Çukuru.
  //  Üç koridor (batı / orta / doğu) + yatay geçit; koridor kenarlarında ve
  //  arenanın çaprazlarında PUSU ÇALILIKLARI (içindekini dışarıdan göremezsin).
  // =====================================================================
  function genSinir2() {
    const W = 224, H = 224, m = newMap('sinir', 'Kızıl Sınır', W, H), wr = mulberry32(4242); const n1 = makeNoise(wr), n2 = makeNoise(wr);
    m.sinirV2 = true; m.sinirV3 = true;
    const PC = { x: 112, y: 196 }, EC = { x: 112, y: 28 }, CC = { x: 112, y: 112 }, KX = 17, KY = 12; // kamp yarı boyları
    const inRect = (c, x, y, mx) => Math.abs(x - c.x) <= KX + (mx || 0) && Math.abs(y - c.y) <= KY + (mx || 0);
    const dC = (x, y) => Math.hypot(x - CC.x, y - CC.y);
    const zoneOf = (x, y) => inRect(PC, x, y, .5) ? 'camp' : inRect(EC, x, y, .5) ? 'enemycamp' : dC(x, y) < 17 ? 'center' : dC(x, y) < 56 ? 'vs' : 'mid';
    m.zoneOf = zoneOf;
    m.zones = { camp: { name: 'Şafak Kampı', lv: 'Güvenli bölge' }, enemycamp: { name: 'Gölge Kampı', lv: 'Düşman üssü!' }, center: { name: 'Ejder Yuvası', lv: 'Kor Ejderi burada uyanır' },
      vs: { name: 'Savaş Ovası', lv: 'PvP • Çalılıklarda pusu olabilir!' }, mid: { name: 'Kızıl Avlak', lv: 'Kasılma bölgesi • Sv 13-22' } };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; const a = fbm(n1, x / 20, y / 20), b = fbm(n2, x / 12, y / 12), r = wr(); m.tvar[i] = Math.floor(wr() * 4);
      const z = zoneOf(x, y); let t = a > .55 ? T.SCORCH : T.RDIRT, d = D.NONE;
      const far = Math.abs(x - 112) > 34; // lav yalnız uzak kenarlarda (koridorlar açık kalsın)
      if (a > .72 && z === 'mid' && far) t = T.LAVA;
      else if (z === 'vs') { if (r < .008) d = D.ROCK; else if (r < .016) d = D.DEAD; else if (b > .74 && r < .12) d = D.BONE; } // VS alanı: açık, az engel
      else if (r < .022) d = D.ROCK; else if (r < .036) d = D.DEAD; else if (r < .046) d = D.RWALL; else if (b > .72 && r < .2) d = D.BONE;
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) { t = T.LAVA; d = D.NONE; }
      m.tiles[i] = t; m.deco[i] = d;
    }
    const rt = () => T.RDIRT, path = (pts, half) => { for (let k = 1; k < pts.length; k++) carve(m, n1, pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], rt, half || 2); };
    // koridorlar
    path([[112, PC.y - KY - 1], [112, EC.y + KY + 1]]);                                   // orta
    path([[40, 112], [184, 112]]);                                                        // yatay geçit
    path([[112, 182], [86, 178], [60, 166], [46, 140], [41, 112], [46, 84], [60, 58], [86, 46], [112, 42]]);    // batı
    path([[112, 182], [138, 178], [164, 166], [178, 140], [183, 112], [178, 84], [164, 58], [138, 46], [112, 42]]); // doğu
    const set = (x, y, t, d) => { const i = y * W + x; if (t != null) m.tiles[i] = t; m.deco[i] = d == null ? D.NONE : d; };
    // ---- kamp kurucu (köyle aynı dil: dikdörtgen, ağaç/çit/kaya sınır, taş meydan, kapı) ----
    function camp(c, gateUp, roof, friendly) {
      for (let y = c.y - KY; y <= c.y + KY; y++) for (let x = c.x - KX; x <= c.x + KX; x++) {
        const ax = Math.abs(x - c.x), ay = Math.abs(y - c.y); set(x, y, friendly ? T.GRASS : T.CAMP);
        const road = ax <= 2 || ay <= 2, plaza = ax <= 7 && ay <= 5;
        if (plaza || (road && ax < KX && ay < KY)) m.tiles[y * W + x] = T.PLAZA;
        if (ax === KX || ay === KY) {
          const gate = (ax <= 3 && ay === KY && (((y < c.y) === gateUp) || friendly)) || (ax === KX && ay <= 1); // v48: yan kapılar
          if (gate) m.tiles[y * W + x] = T.PLAZA;
          else { const k = (ax + ay) % 4, corner = ax === KX && ay === KY; m.deco[y * W + x] = corner ? (friendly ? D.TREE : D.DEAD) : k === 0 ? (friendly ? D.TREE : D.DEAD) : k === 2 ? D.ROCK : D.PALI; }
        } else if (!plaza && !road && friendly) { const inner = ax === KX - 1 || ay === KY - 1; if (inner && wr() < .4) m.deco[y * W + x] = D.BUSH; else if (wr() < .06) m.deco[y * W + x] = D.FLOWER; }
      }
      for (const [tx, ty] of [[c.x - 14, c.y - 8], [c.x - 9, c.y - 8], [c.x + 7, c.y - 8], [c.x + 12, c.y - 8], [c.x - 14, c.y + 7], [c.x + 12, c.y + 7]]) {
        if (friendly && ty > c.y) continue;
        addBuilding(m, { x: tx, y: ty, w: 3, h: 2, roof, name: '', tent: true });
      }
      for (const [lx, ly] of [[c.x - 8, c.y - 6], [c.x + 8, c.y - 6], [c.x - 8, c.y + 6], [c.x + 8, c.y + 6]]) m.deco[ly * W + lx] = D.LAMP;
    }
    camp(PC, true, '#3a6a9a', true); camp(EC, false, '#6a1a1a', false);
    // v48: yan kapılardan çıkan yollar (alternatif giriş / kaçış rotaları)
    path([[PC.x - KX - 1, PC.y], [84, 194], [66, 172]]); path([[PC.x + KX + 1, PC.y], [140, 194], [158, 172]]);
    path([[EC.x - KX - 1, EC.y], [84, 30], [62, 54]]); path([[EC.x + KX + 1, EC.y], [140, 30], [162, 54]]);
    // savunma kuleleri: ana kapıda 2 (uzun menzil), yan kapılarda 1'er (kısa menzil)
    m.towers = [];
    const tower = (x, y, side, range) => { m.towers.push({ x: (x + .5) * TILE, y: (y + .5) * TILE, side, range, cd: 0 }); const i = y * W + x; m.deco[i] = D.NONE; m.bsolid[i] = 1; };
    tower(PC.x - 6, PC.y - KY + 2, 'ally', 300); tower(PC.x + 6, PC.y - KY + 2, 'ally', 300); tower(PC.x - KX + 2, PC.y - 3, 'ally', 230); tower(PC.x + KX - 2, PC.y - 3, 'ally', 230);
    tower(EC.x - 6, EC.y + KY - 2, 'foe', 300); tower(EC.x + 6, EC.y + KY - 2, 'foe', 300); tower(EC.x - KX + 2, EC.y + 3, 'foe', 230); tower(EC.x + KX - 2, EC.y + 3, 'foe', 230);
    // ---- EJDER YUVASI: kavrulmuş daire, koridor ağızlarında boşluk bırakan sütun halkası, kemikler ----
    clearCircle(m, CC.x, CC.y, 16, T.SCORCH);
    for (let k = 0; k < 16; k++) { if (k % 4 === 0) continue; const a = k * Math.PI / 8; m.deco[Math.round(CC.y + Math.sin(a) * 18) * W + Math.round(CC.x + Math.cos(a) * 18)] = D.PILLAR; }
    for (let k = 0; k < 14; k++) { const a = wr() * 6.283, rr2 = 4 + wr() * 10; m.deco[Math.round(CC.y + Math.sin(a) * rr2) * W + Math.round(CC.x + Math.cos(a) * rr2)] = D.BONE; }
    // ---- TİTAN ÇUKURU (batı avlak) ----
    const TC = { x: 26, y: 112 }; clearCircle(m, TC.x, TC.y, 8, T.SCORCH);
    for (let k = 0; k < 8; k++) { if (k === 0) continue; const a = k * Math.PI / 4; m.deco[Math.round(TC.y + Math.sin(a) * 10) * W + Math.round(TC.x + Math.cos(a) * 10)] = D.PILLAR; }
    carve(m, n1, TC.x + 8, TC.y, 40, 112, rt, 2);
    // ---- PUSU ÇALILIKLARI ----
    const BUSH = [
      [103, 150, 3.6, 2.6], [121, 150, 3.6, 2.6], [103, 74, 3.6, 2.6], [121, 74, 3.6, 2.6],      // orta koridor kenarları
      [91, 91, 4.6, 3.1], [133, 91, 4.6, 3.1], [91, 133, 4.6, 3.1], [133, 133, 4.6, 3.1],        // ejder yuvası çaprazları
      [70, 104, 3.6, 2.4], [154, 104, 3.6, 2.4], [70, 121, 3.6, 2.4], [154, 121, 3.6, 2.4],      // yatay geçit kenarları
      [53, 141, 4, 3], [171, 141, 4, 3], [53, 83, 4, 3], [171, 83, 4, 3],                        // yan koridorlar
      [93, 170, 3.6, 2.5], [131, 170, 3.6, 2.5], [93, 54, 3.6, 2.5], [131, 54, 3.6, 2.5],        // kamp çıkışları
      [88, 26, 3, 2.4], [136, 199, 3, 2.4],                                                      // v48: gizli yan kapı çalılıkları (sızma rotası)
    ];
    m.tgrass = new Uint8Array(W * H); m.bushes = [];
    BUSH.forEach(([cx, cy, rx, ry], bi) => {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (fbm(n2, x / 3, y / 3) - .5) * .5; if (q > 1) continue;
        const i = y * W + x; if (zoneOf(x, y) === 'camp' || zoneOf(x, y) === 'enemycamp') continue;
        m.tgrass[i] = bi + 1; m.deco[i] = D.NONE; if (m.tiles[i] === T.LAVA) m.tiles[i] = T.RDIRT;
      }
      m.bushes.push({ id: bi + 1, x: (cx + .5) * TILE, y: (cy + .5) * TILE, rx: rx * TILE, ry: ry * TILE, north: cy < CC.y });
    });
    // ---- Şafak Kampı içi: komutan + şifacı evleri, havuz, ateşler ----
    const defs = [];
    function npcHouse(id, name, x, y, key, look) {
      const S = 2, iw = key === 'hs_dome' ? 48 : 64, bw = Math.round(iw * S / TILE), bx = Math.round(x - iw * S / TILE / 2), bottom = y * TILE - 8, by1 = Math.floor(bottom / TILE);
      for (let yy = by1 - 3; yy <= by1 + 1; yy++) for (let xx = bx - 1; xx <= bx + bw; xx++) { const i = yy * W + xx; if (m.deco[i] !== D.PALI) m.deco[i] = D.NONE; }
      addBuilding(m, { x: bx, y: by1 - 2, w: bw, h: 2, type: 'nhouse', img: key, px: x * TILE, py: bottom, S, name });
      defs.push({ id, name, x, y, face: x < PC.x ? 1 : -1, look });
    }
    npcHouse('komutan', 'Commander Valen', PC.x - 5, PC.y - 6.2, 'hs_red', { body: '#3a5a8a', trim: '#e0c060', legs: '#2a2a30', skin: '#d8a880', hat: 'helm', hatCol: '#c0c8d0', weapon: 'sword', beard: '#5a3a20' });
    npcHouse('sifaci', 'Healer Seraphine', PC.x + 5, PC.y - 6.2, 'hs_dome', { body: '#e8e0d0', trim: '#3a8a5a', legs: '#8a8070', skin: '#f0c9a0', hair: '#3a2010', longhair: true, weapon: 'staff', orb: '#9fffb0' });
    m.npcDefs = defs;
    const PX = PC.x - 11, PY = PC.y + 7;
    for (let y = PY - 3; y <= PY + 3; y++) for (let x = PX - 3; x <= PX + 3; x++) { const i = y * W + x; m.deco[i] = D.NONE; m.bsolid[i] = 0; }
    m.pool = { x: (PX + .5) * TILE, y: (PY + .5) * TILE, r: 60 };
    m.fireSpots = [{ x: (PC.x - 4.5) * TILE, y: (PC.y + 3.5) * TILE }, { x: (PC.x + 5.5) * TILE, y: (PC.y + 3.5) * TILE }, { x: (EC.x - 4.5) * TILE, y: (EC.y - 3) * TILE }, { x: (EC.x + 5.5) * TILE, y: (EC.y - 3) * TILE }];
    m.portals = [{ x: (PC.x + 12.5) * TILE, y: (PC.y + 8) * TILE, to: 'yesilvadi', tx: (C + 20) * TILE, ty: (C + 23.5) * TILE, name: 'Yeşilvadi\'ye Dön', minLvl: 1, col: '#7dffb0', desc: 'Güvenli köye geri dön.' }];
    for (let y = PC.y + 6; y <= PC.y + 10; y++) for (let x = PC.x + 10; x <= PC.x + 15; x++) { const i = y * W + x; m.deco[i] = D.NONE; m.tiles[i] = T.PLAZA; }
    m.start = { x: (PC.x + .5) * TILE, y: (PC.y + 3) * TILE };
    m.safe = [{ x: (PC.x + .5) * TILE, y: (PC.y + .5) * TILE, w: (KX + .6) * TILE, h: (KY + .6) * TILE }];
    m.foeSafe = { x: (EC.x + .5) * TILE, y: (EC.y + .5) * TILE, r: 18 * TILE };
    m.dragonNest = { x: (CC.x + .5) * TILE, y: (CC.y + .5) * TILE, r: 16 * TILE };
    // ---- canavarlar: ortada (VS alanı) az, kenar avlaklarda bol ----
    m.spawns = [];
    const farm = (tx, ty) => zoneOf(tx, ty) === 'mid' && Math.abs(tx - 112) > 26 && Math.hypot(tx - PC.x, ty - PC.y) > 26 && Math.hypot(tx - EC.x, ty - EC.y) > 26 && !m.tgrass[ty * W + tx];
    for (let n = 0; n < 36; n++) { const s = findSpotIn(m, 'mid', farm); if (s) m.spawns.push({ type: 'golem', lvl: ri(14, 19), x: s.x, y: s.y }); }
    for (let n = 0; n < 26; n++) { const s = findSpotIn(m, 'mid', farm); if (s) for (let k = 0; k < 2; k++) m.spawns.push({ type: 'bloodwolf', lvl: ri(13, 18), x: s.x + k * 24, y: s.y + k * 10 }); }
    for (let n = 0; n < 20; n++) { const s = findSpotIn(m, 'mid', farm); if (s) m.spawns.push({ type: pick(['spider', 'wraith']), lvl: ri(15, 20), x: s.x, y: s.y }); }
    for (let n = 0; n < 6; n++) { const s = findSpotIn(m, 'vs', (tx, ty) => !m.tgrass[ty * W + tx] && dC(tx, ty) > 24); if (s) m.spawns.push({ type: pick(['spider', 'wraith']), lvl: ri(15, 19), x: s.x, y: s.y }); }
    m.spawns.push({ type: 'titan', lvl: 22, x: (TC.x + .5) * TILE, y: (TC.y + .5) * TILE });
    for (let n = 0; n < 16; n++) m.spawns.push({ type: 'foe', lvl: ri(12, 21), x: (EC.x + rr(-10, 10)) * TILE, y: (EC.y + rr(-6, 6)) * TILE, resp: 14, grp: n % 4 });
    m.labels = [{ x: PC.x, y: PC.y + KY + 2, t: 'Şafak Kampı' }, { x: EC.x, y: EC.y - KY - 2, t: 'Gölge Kampı' }, { x: CC.x, y: CC.y - 21, t: 'Ejder Yuvası' }, { x: TC.x, y: TC.y - 12, t: 'Titan Çukuru' },
      { x: 30, y: 60, t: 'Kızıl Avlak' }, { x: 194, y: 164, t: 'Kızıl Avlak' }, { x: 112, y: 64, t: 'Savaş Ovası' }, { x: PX, y: PY - 3, t: 'Şifa Havuzu' }];
    m.pvp = true; m.minLvl = 10; return m;
  }
  if (typeof GEN !== 'undefined') GEN.sinir = genSinir2;
  window.genYesilvadi2 = genYesilvadi2;
  if (typeof GEN !== 'undefined') GEN.yesilvadi = genYesilvadi2;

  // ---- diğer haritalardan Yeşilvadi'ye dönüş noktaları yeni koordinatlara ----
  if (typeof GEN !== 'undefined') {
    for (const id of ['mahzen']) { const g0 = GEN[id]; if (!g0) continue;
      GEN[id] = function () { const m = g0.apply(this, arguments); for (const pt of m.portals || []) if (pt.to === 'yesilvadi') {
        if (id === 'mahzen') { pt.tx = (117 * K - 3) * TILE; pt.ty = (C + .5) * TILE; } else { pt.tx = (C + 20) * TILE; pt.ty = (C + 23.5) * TILE; } } return m; }; }
  }
  // ---- görev hedef konumları (Yeşilvadi görevleri) 2 kat ----
  if (typeof QUESTS !== 'undefined') for (const q of QUESTS) if (q.loc && !q.map && !q._k2) { q.loc = [q.loc[0] * K, q.loc[1] * K]; q._k2 = true; }
  // ---- eski (küçük harita) kayıtlarını yeni haritaya taşı ----
  if (typeof SAVE_FIELDS !== 'undefined') SAVE_FIELDS.push('mapV2', 'mapV3');
  // (oyun dosyaları bu dosyadan sonra yüklendiği için sarmalama sayfa hazır olunca yapılır)
  window.kdDunya2Init = () => {
    if (window.__kdD2Done) return; window.__kdD2Done = true;
    if (typeof startGame === 'function') { const _sg = startGame; startGame = function (d, isNew) { const r = _sg.apply(this, arguments);
      try { const p = player; if (p && (!p.mapV2 || !p.mapV3)) { if (p.map === 'yesilvadi' && !isNew) { p.x = M.start.x; p.y = M.start.y; } p.mapV2 = true; p.mapV3 = true; } } catch (e) { } return r; }; window.startGame = startGame; }
    if (typeof newPlayer === 'function') { const _np = newPlayer; newPlayer = function () { const p = _np.apply(this, arguments); p.mapV2 = true; p.mapV3 = true; return p; }; }
  };
})();
