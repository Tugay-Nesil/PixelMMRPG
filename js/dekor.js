'use strict';
// =====================================================================
//  SÜRÜM 57 — DEKOR (NinjaAdventure hazır nesneleri, tek atlas: na/props.png)
//  Kütük, odun yığını, kamp ateşi, varil, sandık, çuval, fener, sancak,
//  kurutma rafı, böğürtlen çalısı, büyük kaya… Tüm haritalarda zemine göre
//  serpiştirilir + "kamp" ve "oduncu" kümeleri. Büyük kayalar okları durdurur.
//  Ayrıca: büyük haritada uzaktaki boşta canavarlar dondurulur (performans).
// =====================================================================
(function () {
  const TL = TILE;
  const A = {"logs":[0,0,32,16],"logs2":[33,0,32,16],"logb":[66,0,32,32],"logc":[99,0,16,32],"hay":[116,0,32,32],"slice":[149,0,32,32],"stump":[182,0,16,16],"stump2":[199,0,16,16],"barrel":[216,0,16,16],"bigbarrel":[0,33,32,32],"sack":[33,33,16,16],"sack2":[50,33,16,16],"pot":[67,33,16,16],"pot2":[84,33,16,16],"lamp":[101,33,16,32],"banner":[118,33,16,32],"pit1":[135,33,32,32],"pit2":[168,33,32,32],"pit3":[201,33,32,32],"bench":[0,66,48,16],"crate":[49,66,16,16],"bbar":[66,66,32,16],"sackh":[99,66,32,16],"log3":[132,66,16,16],"chest":[149,66,16,16],"drying":[166,66,32,32],"blanket":[199,66,32,32],"leaves":[0,99,32,32],"mush":[33,99,48,16],"nstump":[82,99,32,32],"nstump2":[115,99,32,32],"nst3":[148,99,16,16],"sign":[165,99,16,16],"nlog":[182,99,16,48],"nlog2":[199,99,16,48],"berry":[216,99,32,32],"berry2":[0,148,32,32],"rockb":[33,148,48,48],"rockg":[82,148,48,48],"rocks":[131,148,32,32]};
  // katı (içinden geçilmez) ve taş (oku durdurur) nesneler
  const SOLID = new Set(['logb', 'hay', 'slice', 'barrel', 'bigbarrel', 'crate', 'pit1', 'pit2', 'pit3', 'drying', 'nstump', 'nstump2', 'rockb', 'rockg', 'rocks', 'bbar', 'chest', 'lamp', 'banner']);
  const STONE = new Set(['rockb', 'rockg', 'rocks']);
  const FIRE = new Set(['pit3', 'pit1']);
  const flat = new Set(['leaves', 'mush', 'blanket']);
  const atlas = new Image(); atlas.src = 'na/props.png';
  const ok = () => atlas.complete && atlas.naturalWidth > 0;
  // v58: ikinci atlas — ağaç çeşitleri, korular, kristal, çiçek, oynayan bitki, sancak, hayvanlar
  const NAT = {"t0":[0,0,32,32],"t1":[33,0,32,32],"t2":[66,0,32,32],"t3":[99,0,32,32],"t4":[132,0,32,32],"t5":[165,0,32,32],"t6":[198,0,32,32],"t7":[231,0,32,32],"t8":[264,0,32,32],"t9":[297,0,32,32],"big0":[330,0,48,48],"big1":[379,0,48,48],"big2":[428,0,48,48],"big3":[0,49,48,48],"clump0":[49,49,64,48],"clump1":[114,49,64,48],"clump2":[179,49,64,48],"clump3":[244,49,64,48],"clump4":[309,49,64,48],"clump5":[374,49,64,48],"bamboo":[439,49,16,48],"bam2":[456,49,32,32],"cry0":[489,49,16,16],"cry1":[0,98,16,16],"cry2":[17,98,16,16],"cry3":[34,98,16,16],"gem0":[51,98,16,16],"gem1":[68,98,16,16],"gem2":[85,98,16,16],"gem3":[102,98,16,16],"fl0":[119,98,16,16],"fl1":[136,98,16,16],"fl2":[153,98,16,16],"fl3":[170,98,16,16],"fl6":[187,98,16,16],"gr3":[204,98,16,16],"gr4":[221,98,16,16],"gr5":[238,98,16,16],"gr7":[255,98,16,16],"gr9":[272,98,16,16],"gr10":[289,98,16,16],"plant":[306,98,64,16],"flagRed":[371,98,64,16],"flagBlue":[436,98,64,16],"flagGreen":[0,115,64,16],"flagYellow":[65,115,64,16],"flagBlack":[130,115,64,16],"flagWhite":[195,115,64,16],"flagBrown":[260,115,64,16],"flagGray":[325,115,64,16],"aChicken":[390,115,32,16],"aCow":[423,115,32,16],"aPig":[456,115,32,16],"aDog2":[0,132,32,16],"aParrot":[33,132,32,16],"aHamster":[66,132,30,15],"aLionCub":[97,132,32,16],"aRacoon":[130,132,32,16],"aDogYellow":[163,132,42,17],"aCatOrange":[206,132,44,17],"aCatWhite":[251,132,34,15]};
  const natA = new Image(); natA.src = 'na/nature.png'; const okN = () => natA.complete && natA.naturalWidth > 0;
  // v59: Flat Platformer Template — ağaç, kaya, çalı, çimen/çiçek, yel değirmeni, araba, bulut, dağ (na/flat.webp)
  const FLAT = {"WindMill_0":[0,0,141,230],"WindMill_1":[143,0,230,230],"Trees_0_g":[375,0,125,190],"Trees_1_g":[502,0,173,190],"Trees_2_g":[677,0,104,190],"Trees_3_g":[783,0,92,190],"Trees_4_g":[877,0,133,190],"Trees_5_g":[1012,0,125,190],"Trees_6_g":[1139,0,151,190],"Trees_7_g":[1292,0,102,190],"Trees_8_g":[1396,0,127,190],"Trees_9_g":[1525,0,151,190],"Trees_10_g":[1678,0,89,190],"Trees_11_g":[1769,0,144,190],"Trees_12_g":[1915,0,116,190],"Trees_13_g":[0,232,117,190],"Trees_14_g":[119,232,108,190],"Trees_15_g":[229,232,85,190],"Trees_16_g":[316,232,100,190],"Trees_17_g":[418,232,96,190],"Trees_18_g":[516,232,94,190],"Trees_19_g":[612,232,96,190],"Trees_20_g":[710,232,102,190],"Trees_21_g":[814,232,100,190],"Trees_22_g":[916,232,134,190],"Trees_23_g":[1052,232,165,190],"Trees_24_g":[1219,232,170,190],"Trees_25_g":[1391,232,155,190],"Trees_26_g":[1548,232,157,190],"Trees_0_sn":[1707,232,125,190],"Trees_3_sn":[1834,232,92,190],"Trees_6_sn":[0,424,151,190],"Trees_9_sn":[153,424,151,190],"Trees_12_sn":[306,424,116,190],"Trees_15_sn":[424,424,85,190],"Trees_18_sn":[511,424,94,190],"Trees_21_sn":[607,424,100,190],"Trees_24_sn":[709,424,170,190],"Trees_0_au":[881,424,125,190],"Trees_3_au":[1008,424,92,190],"Trees_6_au":[1102,424,151,190],"Trees_9_au":[1255,424,151,190],"Trees_12_au":[1408,424,116,190],"Trees_15_au":[1526,424,85,190],"Trees_18_au":[1613,424,94,190],"Trees_21_au":[1709,424,100,190],"Trees_24_au":[1811,424,170,190],"Trees_0_pk":[0,616,125,190],"Trees_3_pk":[127,616,92,190],"Trees_6_pk":[221,616,151,190],"Trees_9_pk":[374,616,151,190],"Trees_12_pk":[527,616,116,190],"Trees_15_pk":[645,616,85,190],"Trees_18_pk":[732,616,94,190],"Trees_21_pk":[828,616,100,190],"Trees_24_pk":[930,616,170,190],"Trees_0_dk":[1102,616,125,190],"Trees_3_dk":[1229,616,92,190],"Trees_6_dk":[1323,616,151,190],"Trees_9_dk":[1476,616,151,190],"Trees_12_dk":[1629,616,116,190],"Trees_15_dk":[1747,616,85,190],"Trees_18_dk":[1834,616,94,190],"Trees_21_dk":[1930,616,100,190],"Trees_24_dk":[0,808,170,190],"Rocks_3":[172,808,153,150],"Rocks_4":[327,808,170,150],"Rocks_5":[499,808,153,150],"Rocks_6":[654,808,202,150],"Rocks_7":[858,808,192,150],"Mountains":[1052,808,805,120],"Clouds_0":[0,1000,494,110],"Clouds_1":[496,1000,266,110],"Clouds_2":[764,1000,353,110],"Clouds_3":[1119,1000,324,110],"Clouds_4":[1445,1000,309,110],"Cart_0":[1756,1000,124,80],"Rocks_0":[1882,1000,52,70],"Rocks_1":[1936,1000,101,70],"Rocks_2":[0,1112,124,70],"Bushes_0":[126,1112,207,48],"Bushes_1":[335,1112,284,48],"Bushes_2":[621,1112,206,48],"Bushes_3":[829,1112,286,48],"Bushes_4":[1117,1112,237,48],"Bushes_5":[1356,1112,207,48],"Bushes_6":[1565,1112,237,48],"Bushes_7":[1804,1112,206,48],"Bushes_8":[0,1184,168,48],"Bushes_9":[170,1184,154,48],"Bushes_10":[326,1184,152,48],"Bushes_12":[480,1184,168,48],"Cart_3":[650,1184,46,46],"Cart_4":[698,1184,46,46],"Grass_4":[746,1184,35,44],"Grass_5":[783,1184,29,44],"Grass_6":[814,1184,29,44],"Grass_7":[845,1184,14,44],"Grass_8":[861,1184,35,44],"Grass_9":[898,1184,29,44],"Cart_2":[929,1184,142,42],"Grass_0":[1073,1184,94,34],"Grass_1":[1169,1184,62,34],"Grass_2":[1233,1184,117,34],"Grass_3":[1352,1184,85,34]};
  const flatA = new Image(); flatA.src = 'na/flat.webp'; const okF = () => flatA.complete && flatA.naturalWidth > 0;
  window.KD_FLAT = FLAT; window.kdFlatImg = flatA;
  const TREE_T = { forestW: 'sn', forestE: 'g', ruins: 'dk', volcano: 'au', meadow: 'pk', village: 'g', mid: 'dk', vs: 'au', center: 'au', camp: 'g', enemycamp: 'dk', pazar: 'g' };
  const TREE_N = { g: [...Array(27).keys()], sn: [0, 3, 6, 9, 12, 15, 18, 21, 24] }; TREE_N.au = TREE_N.dk = TREE_N.pk = TREE_N.sn;
  function flatTree(z, h) { const t = TREE_T[z] || 'g', a = TREE_N[t]; return 'Trees_' + a[h % a.length] + '_' + t; }
  window.kdFlatTree = flatTree;
  // eski ağaç / kaya / çalı / çiçek nesnelerini Flat paketinin karşılığına çevir
  function flatRemap(m) { if (!m || !m.props) return; const zo = (x, y) => { try { return m.zoneOf(Math.floor(x / TL), Math.floor(y / TL)); } catch (e) { return 'mid'; } };
    let h = 7; for (const p of m.props) { h = (h * 1103515245 + 12345) >>> 0; const r = h >>> 8;
      if (p.at === 'n' && /^(t\d|big\d|clump\d|bamboo|bam2)/.test(p.k)) { p.k = flatTree(zo(p.x, p.y), r); p.at = 'f'; p.sc = /big|clump/.test(p.k) ? .82 : .74; }
      else if (/^rock[bgs]$/.test(p.k)) { p.at = 'f'; if (p.big) { p.k = 'Rocks_' + (3 + r % 5); p.sc = .82; } else { p.k = 'Rocks_' + (r % 3); p.sc = .7; } }
      else if (/^berry/.test(p.k)) { p.at = 'f'; p.k = 'Bushes_' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12][r % 12]; p.sc = .5; }
      else if (p.at === 'n' && /^fl\d/.test(p.k)) { p.at = 'f'; p.k = 'Grass_' + (4 + r % 6); p.sc = .42; }
      else if (p.at === 'n' && /^(gr\d|plant)/.test(p.k)) { p.at = 'f'; p.k = 'Grass_' + (r % 4); p.sc = .5; p.an = 0; p.flat = 1; } } }
  window.kdFlatRemap = flatRemap;
  // zemine göre tema
  const THEME = {
    green: ['stump', 'stump2', 'nst3', 'nstump', 'nstump2', 'logs', 'logs2', 'nlog', 'nlog2', 'berry', 'berry2', 'leaves', 'mush', 'rocks', 'log3', 'hay', 'sign'],
    forest: ['nstump', 'nstump2', 'nst3', 'nlog', 'nlog2', 'logs', 'logs2', 'berry', 'berry2', 'leaves', 'mush', 'stump', 'stump2', 'log3', 'logc'],
    ruin: ['rockg', 'rocks', 'crate', 'barrel', 'bbar', 'banner', 'pot', 'pot2', 'leaves', 'sack2', 'chest', 'nst3'],
    volcano: ['rockb', 'rocks', 'rockb', 'pit1', 'logs2', 'nstump2', 'pot2'],
    dungeon: ['barrel', 'crate', 'pot', 'pot2', 'sack', 'bbar', 'chest', 'sack2'],
    sand: ['rocks', 'logs2', 'pot', 'nst3', 'leaves'],
    camp: ['barrel', 'crate', 'sack', 'sack2', 'pot', 'bench', 'sackh', 'banner', 'lamp', 'bbar'],
  };
  function themeOf(t) { if (t === T.GRASS) return 'green'; if (t === T.FOREST) return 'forest'; if (t === T.RUIN || t === T.DARK) return 'ruin'; if (t === T.VOLC || t === T.SCORCH || t === T.RDIRT) return 'volcano'; if (t === T.DFLOOR) return 'dungeon'; if (t === T.SAND) return 'sand'; if (t === T.CAMP) return 'camp'; return null; }
  function inSafe(m, x, y) { for (const s of m.safe || []) if (s.w ? (Math.abs(x - s.x) < s.w + 40 && Math.abs(y - s.y) < s.h + 40) : Math.hypot(x - s.x, y - s.y) < s.r + 40) return true; return false; }
  function decorate(m, id) {
    if (!m || m._dek) return m; m._dek = true; m.props = m.props || []; /* v58: açık arazide serpiştirilenler içinden geçilir */ const soft = id === 'yesilvadi' || id === 'sinir'; const W = m.W, H = m.H, rnd = mulberry32((W * 7919 + H * 31 + id.length * 97) >>> 0), ev = id.indexOf('ev_') === 0;
    const keepOut = []; for (const p of m.portals || []) keepOut.push([p.x, p.y, 150]); for (const n of m.npcDefs || []) keepOut.push([n.x * TL, n.y * TL, 70]); for (const c of m.caps || []) keepOut.push([c.x, c.y, c.r + 40]);
    if (m.start) keepOut.push([m.start.x, m.start.y, 120]);
    const free = (tx, ty, solid) => { if (tx < 3 || ty < 3 || tx >= W - 3 || ty >= H - 3) return false; const i = ty * W + tx, t = m.tiles[i];
      if (m.deco[i] || m.bsolid[i] || SOLID_T[t] || t === T.PATH || t === T.PLAZA || (m.tgrass && m.tgrass[i]) || (m.cover && m.cover[i]) || m._pt && m._pt[i]) return false;
      const x = (tx + .5) * TL, y = (ty + .5) * TL; if (keepOut.some(([kx, ky, r]) => Math.hypot(kx - x, ky - y) < r)) return false; if (solid && (inSafe(m, x, y) || SM[i])) return false; return true; };
    m._pt = new Uint8Array(W * H); const SM = new Uint8Array(W * H); for (const sp of m.spawns || []) { const sx = Math.floor(sp.x / TL), sy = Math.floor(sp.y / TL); for (let y = sy - 1; y <= sy + 1; y++) for (let x = sx - 1; x <= sx + 1; x++) if (x >= 0 && y >= 0 && x < W && y < H) SM[y * W + x] = 1; }
    const put = (k, tx, ty, sx, camp) => { const solid = SOLID.has(k) && !ev && (camp || !soft); if (!free(tx, ty, solid)) return false; const i = ty * W + tx; m._pt[i] = 1;
      if (solid) { m.bsolid[i] = 1; if (STONE.has(k)) { m.cover = m.cover || new Uint8Array(W * H); m.cover[i] = 1; } }
      m.props.push({ k, x: (tx + .5) * TL + (sx || 0), y: (ty + 1) * TL - 3, f: FIRE.has(k), s: rnd() * 6, fl: rnd() < .5 }); return true; };
    if (id === 'sinir' && m.zoneOf) { const rep = { [D.ROCK]: 'rocks', [D.DEAD]: 'nstump2', [D.RWALL]: 'rocks', [D.TOMB]: 'nst3' };
      for (let ty = 3; ty < H - 3; ty++) for (let tx = 3; tx < W - 3; tx++) { const i = ty * W + tx, d = m.deco[i]; if (!rep[d]) continue; const z = m.zoneOf(tx, ty); if (z !== 'mid' && z !== 'vs' && z !== 'center') continue;
        m.deco[i] = D.NONE; if (rnd() < .45) m.props.push({ k: rep[d], x: (tx + .5) * TL, y: (ty + 1) * TL - 3, s: rnd() * 6, fl: rnd() < .5 }); } }
    // 1) serpiştir (eski ağaç/çiçek yerine çeşit)
    const dens = ev ? .004 : id === 'yesilvadi' ? .0035 : .007;
    for (let ty = 3; ty < H - 3; ty++) for (let tx = 3; tx < W - 3; tx++) { if (rnd() > dens) continue; const th = themeOf(m.tiles[ty * W + tx]); if (!th) continue; put(pick2(THEME[th], rnd), tx, ty, rnd() * 10 - 5); }
    // 2) kamp kümeleri: ateş + oturak + eşya / oduncu kampı
    const nCamp = ev ? 3 : Math.round(W * H / (id === 'yesilvadi' ? 14000 : 6000));
    for (let n = 0, tries = 0; n < nCamp && tries < nCamp * 40; tries++) { const tx = 6 + Math.floor(rnd() * (W - 12)), ty = 6 + Math.floor(rnd() * (H - 12)); const th = themeOf(m.tiles[ty * W + tx]); if (!th || th === 'sand') continue;
      let okA = true; for (let y = ty - 2; y <= ty + 2 && okA; y++) for (let x = tx - 3; x <= tx + 3; x++) if (!free(x, y, true)) { okA = false; break; } if (!okA) continue;
      if (th === 'forest' && rnd() < .5) { put('logb', tx, ty, 0, 1); put('slice', tx + 2, ty, 0, 1); put('logs', tx - 2, ty + 1); put('logc', tx + 1, ty - 2); put('stump', tx - 1, ty - 1); put('nst3', tx + 3, ty + 1); if (rnd() < .5) put('sign', tx - 3, ty - 1); }
      else if (th === 'dungeon') { put('bigbarrel', tx, ty); put('crate', tx + 2, ty); put('barrel', tx - 2, ty); put('chest', tx + 1, ty + 2); put('pot', tx - 1, ty + 2); }
      else { put('pit3', tx, ty, 0, 1); put('logs', tx - 2, ty); put('bench', tx + 2, ty); put('blanket', tx, ty + 2); put(rnd() < .5 ? 'drying' : 'sackh', tx - 2, ty - 2); put('barrel', tx + 3, ty - 2); put('sack', tx + 2, ty - 2); if (rnd() < .6) put('lamp', tx - 3, ty + 1); if (th === 'ruin' || th === 'volcano') put('banner', tx + 3, ty + 1); }
      n++; }
    // 3) köy evlerinin yanına varil / sandık / çuval (yumuşak, yol kapatmaz)
    for (const b of m.buildings || []) { if (b.type !== 'nhouse') continue; const L = ['barrel', 'crate', 'sack', 'pot', 'sack2', 'bbar']; const by = b.y + b.h, x0 = b.x - 1, x1 = b.x + b.w;
      const putS = (k, tx, ty) => { const i = ty * W + tx; if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1 || m.deco[i] || m.bsolid[i] || m._pt[i] || SOLID_T[m.tiles[i]] || m.tiles[i] === T.PATH) return; m._pt[i] = 1; m.props.push({ k, x: (tx + .5) * TL, y: (ty + 1) * TL - 3, s: rnd() * 6, fl: rnd() < .5 }); };
      putS(pick2(L, rnd), x0, by - 1); putS(pick2(L, rnd), x1, by - 1); if (rnd() < .5) putS(pick2(L, rnd), x1, by - 2); }
    flatRemap(m);
    // ızgara dizini (8x8 karo parçaları)
    m.propGrid = new Map(); for (const p of m.props) { const k = Math.floor(p.y / TL / 8) * 1000 + Math.floor(p.x / TL / 8); let a = m.propGrid.get(k); if (!a) m.propGrid.set(k, a = []); a.push(p); }
    delete m._pt; return m;
  }
  function pick2(a, r) { return a[Math.floor(r() * a.length)]; }
  if (typeof GEN !== 'undefined') for (const id of Object.keys(GEN)) { const g0 = GEN[id]; GEN[id] = function () { return decorate(g0.apply(this, arguments), id); }; }
  window.kdDecorate = decorate;
  // ---------------- çizim ----------------
  const S = 2.2;
  function flame(x, y, s) { const t = gameTime; ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDot(x, y - 8 * s, 30 * s, '#ff7020', .28 + .08 * Math.sin(t * 7 + x)); ctx.globalCompositeOperation = 'source-over';
    for (let k = 0; k < 3; k++) { const f = Math.sin(t * (9 + k * 2) + x + k) * 2.5 * s, h = (20 - k * 5) * s; ctx.fillStyle = ['#d8301a', '#ff8a1a', '#ffe080'][k]; ctx.beginPath(); ctx.moveTo(x - (8 - k * 2.4) * s, y); ctx.quadraticCurveTo(x - 6 * s + f, y - h * .6, x + f * .6, y - h); ctx.quadraticCurveTo(x + 6 * s + f, y - h * .6, x + (8 - k * 2.4) * s, y); ctx.closePath(); ctx.fill(); }
    if (Math.random() < .08) particles.push({ x: x + rr(-6, 6), y: y - 10, vx: rr(-10, 10), vy: rr(-60, -30), life: .8, max: .8, col: pick(['#ffb040', '#ff6a20']), s: rr(1.5, 2.5) }); ctx.restore(); }
  function drawCart(p) { if (!okF()) return; const sc = p.sc || .55, d = (k, x, y, s2) => { const r = FLAT[k]; ctx.drawImage(flatA, r[0], r[1], r[2], r[3], x - r[2] * s2 / 2, y - r[3] * s2, r[2] * s2, r[3] * s2); };
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(p.x, p.y); if (p.fl) ctx.scale(-1, 1); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, -2, 46, 7, 0, 0, 7); ctx.fill();
    d('Cart_0', 0, -30 * sc / .55, sc); d('Cart_2', 0, -16 * sc / .55, sc); d('Cart_3', -26, 0, sc * .9); d('Cart_4', 26, 0, sc * .9); ctx.restore(); }
  function drawProp(p) { if (p.k === 'cart') return drawCart(p); const N = p.at === 'n', F = p.at === 'f', im = F ? flatA : N ? natA : atlas; if (F ? !okF() : N ? !okN() : !ok()) return; const r = (F ? FLAT : N ? NAT : A)[p.k]; if (!r) return; let [sx, sy, w, h] = r; const sc = p.sc || S;
    if (p.an) { w = w / p.an; sx += (Math.floor(gameTime * (p.an === 2 ? 2.5 : 6) + p.s) % p.an) * w; }
    const dw = w * sc, dh = h * sc;
    if (p.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDot(p.x, p.y - dh * .4, 16, p.k.indexOf('cry0') >= 0 ? '#ff9040' : '#a0d8ff', .22 + .08 * Math.sin(gameTime * 3 + p.s)); ctx.restore(); }
    ctx.save(); ctx.imageSmoothingEnabled = F; if (!flat.has(p.k) && !p.flat) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 2, dw * .38, 5, 0, 0, 7); ctx.fill(); }
    if (p.fl && !/sign|banner|lamp|nlog|flag|WindMill|Cart/.test(p.k)) { ctx.translate(p.x, 0); ctx.scale(-1, 1); ctx.translate(-p.x, 0); }
    ctx.drawImage(im, sx, sy, w, h, Math.round(p.x - dw / 2), Math.round(p.y - dh), Math.round(dw), Math.round(dh)); ctx.restore();
    if (p.f) flame(p.x, p.y - dh * .38, 1.1);
    if (p.k === 'WindMill_0' && okF()) { const b = FLAT.WindMill_1, bs = sc * .95; ctx.save(); ctx.translate(p.x, p.y - dh * .78); ctx.rotate(gameTime * .9 + p.s); ctx.drawImage(flatA, b[0], b[1], b[2], b[3], -b[2] * bs / 2, -b[3] * bs / 2, b[2] * bs, b[3] * bs); ctx.restore(); }
    if (p.k === 'lamp') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDot(p.x + 6, p.y - dh * .62, 22, '#ffd080', .3 + .06 * Math.sin(gameTime * 5 + p.s)); ctx.restore(); } }
  if (typeof extrasToList === 'function') { const _el = extrasToList; extrasToList = function (list) { _el.apply(this, arguments);
    try { if (!M || !M.propGrid) return; const Z = typeof ZOOM !== 'undefined' ? ZOOM : 1, x0 = Math.floor((camX - 140) / TL / 8), y0 = Math.floor((camY - 60) / TL / 8), x1 = Math.floor((camX + VW / Z + 140) / TL / 8), y1 = Math.floor((camY + VH / Z + 180) / TL / 8);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const a = M.propGrid.get(cy * 1000 + cx); if (a) for (const p of a) list.push({ y: flat.has(p.k) || p.flat ? p.y - 40 : p.y, k: 7, fn: () => drawProp(p) }); } } catch (e) { } }; }
  // ---------------- büyük harita: uzaktaki boşta canavarlar dondurulur ----------------
  if (typeof updEnemy === 'function') { const _ue = updEnemy; updEnemy = function (e, dt) {
    if (e && !e.target && !e.dead && M && M.W > 300 && !(e.d && (e.d.pvp || e.d.boss)) && typeof player !== 'undefined' && player) { if (Math.abs(e.x - player.x) > 1500 || Math.abs(e.y - player.y) > 1300) { e.anim += dt; return; } }
    return _ue.apply(this, arguments); }; }
})();
