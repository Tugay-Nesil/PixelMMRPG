'use strict';
// =====================================================================
//  SÜRÜM 58 — YEŞİLVADİ TASARIMI (dunya2 genYesilvadi2 içinden çağrılır)
//  • Ağaçlar tek tek engel değil, net sınırlı KORULAR halinde (içine girilmez,
//    yollardan en az 6 karo uzak) → takılma yok, akıcı koridorlar.
//  • Her bölgenin kendi ağaç paleti: Batı karlı çam ormanı, Güney yeşil koru +
//    bambu, Doğu kuru ağaçlı harabe, Kuzey kızıl-kuru volkan, Çayır sakura/kızıl.
//  • Bölge meydanları: 4 büyük kaya + bölge renginde sancaklar (simetrik).
//  • Halka yol boyunca simetrik büyük kaya çiftleri, köşelerde kamp.
//  • Çayırda hayvanlar, oynayan bitkiler, çiçek / kristal çeşitleri.
//  • Kapalı (ulaşılamayan) cepler doldurulur → canavar ulaşılamaz yerde doğmaz.
// =====================================================================
(function () {
  const TL = TILE;
  const PAL = { forestW: ['t1', 't1', 't4', 't5', 'clump0', 'clump4', 'clump5', 'big2', 't1', 't4'], forestE: ['t0', 't8', 't9', 'clump1', 'big1', 'bamboo', 't3', 't0', 't9'],
    ruins: ['t2', 'clump3', 't3', 't2', 't6'], volcano: ['t2', 'clump3', 'big3', 't2'], meadow: ['big0', 'big3', 't7', 't8', 'big1'] };
  const FLAG = { volcano: 'flagRed', ruins: 'flagGray', forestE: 'flagYellow', forestW: 'flagBlue' };
  const ANIM = ['aChicken', 'aCow', 'aPig', 'aDog2', 'aParrot', 'aHamster', 'aLionCub', 'aRacoon', 'aDogYellow', 'aCatOrange', 'aCatWhite'];
  window.kdDesignWorld = function (m, C, K, VX, VY) {
    const W = m.W, H = m.H, rnd = mulberry32(5858), zoneOf = m.zoneOf, D0 = m.design || {}; m.props = m.props || [];
    const pk = a => a[Math.floor(rnd() * a.length)];
    const isRoad = t => t === T.PATH || t === T.PLAZA || t === T.SCORCH;
    // yola uzaklık (en çok 9)
    const dist = new Uint8Array(W * H).fill(255), q = new Int32Array(W * H); let qh = 0, qt = 0;
    for (let i = 0; i < W * H; i++) if (isRoad(m.tiles[i])) { dist[i] = 0; q[qt++] = i; }
    while (qh < qt) { const i = q[qh++], d = dist[i]; if (d >= 9) continue; const x = i % W; for (const j of [i - 1, i + 1, i - W, i + W]) { if (j < 0 || j >= W * H || (j === i - 1 && x === 0) || (j === i + 1 && x === W - 1)) continue; if (dist[j] > d + 1) { dist[j] = d + 1; q[qt++] = j; } } }
    const avoid = []; for (const [, px, py] of D0.PLZ || []) avoid.push([px, py, 17]); for (const [cx, cy] of D0.CMP || []) avoid.push([cx, cy, 10]); avoid.push([117 * K, C, 14]);
    for (const pt of m.portals || []) avoid.push([pt.x / TL, pt.y / TL, 8]);
    const inMarket = (x, y) => m.market && x * TL >= m.market.x0 - 64 && x * TL < m.market.x1 + 64 && y * TL >= m.market.y0 - 64 && y * TL < m.market.y1 + 64;
    const nearAvoid = (x, y) => avoid.some(([ax, ay, r]) => Math.hypot(x - ax, y - ay) < r);
    const freeT = (x, y) => { if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) return false; const i = y * W + x, t = m.tiles[i]; return !SOLID_T[t] && !m.bsolid[i] && !SOLID_D[m.deco[i]] && !isRoad(t) && t !== T.SAND && zoneOf(x, y) !== 'village' && !inMarket(x, y); };
    const prop = (k, x, y, o) => m.props.push(Object.assign({ k, at: 'n', x: (x + .5) * TL, y: (y + 1) * TL - 2, s: rnd() * 6, fl: rnd() < .5 }, o || {}));
    const solid = (x, y) => { const i = y * W + x; m.bsolid[i] = 1; m.deco[i] = D.NONE; };
    // ---------- 1) KORULAR ----------
    const nz = makeNoise(rnd), grove = new Uint8Array(W * H);
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { const z = zoneOf(x, y); if (!PAL[z] || z === 'meadow') continue; const i = y * W + x; if (!freeT(x, y) || dist[i] < 6 || nearAvoid(x, y)) continue;
      const g = fbm(nz, x / 22, y / 22), th = z === 'forestW' || z === 'forestE' ? .56 : .64; if (g >= th) grove[i] = 1; }
    for (let i = 0; i < W * H; i++) if (grove[i]) { m.bsolid[i] = 1; m.deco[i] = D.NONE; }
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { const i = y * W + x; if (!grove[i] || (x + (y % 2) * 1) % 2 || y % 2 && rnd() < .3) continue;
      const z = zoneOf(x, y); let k = pk(PAL[z]); if (/clump/.test(k) && !grove[i + 1]) k = PAL[z][0]; prop(k, x, y, { x: (x + .5 + (rnd() - .5) * .6) * TL, sc: 2.2 }); }
    // volkan / harabe korularına kristal
    // ---------- 2) çayır: sakura / kızıl ağaç halkası (8 küme, simetrik) ----------
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8, cx = Math.round(C + Math.cos(a) * 64), cy = Math.round(C + Math.sin(a) * 64);
      const kk = k % 2 ? 'big3' : 'big0'; for (const [ox, oy, kt] of [[0, 0, kk], [-3, 2, k % 2 ? 't8' : 't7'], [3, 2, k % 2 ? 't8' : 't7']]) { const x = cx + ox, y = cy + oy; if (freeT(x, y) && dist[y * W + x] >= 2) { solid(x, y); prop(kt, x, y, { sc: 2.2 }); } } }
    // ---------- 3) ana yollar boyunca ağaç sırası (iki yanda, simetrik) ----------
    for (let d = VY + 14; d < 236; d += 9) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const s of [-1, 1]) {
      const x = Math.round(C + dx * d + dy * s * 6), y = Math.round(C + dy * d + dx * s * 6); const z = zoneOf(x, y); if (!PAL[z] || !freeT(x, y) || nearAvoid(x, y) || dist[y * W + x] < 3) continue;
      solid(x, y); prop(z === 'meadow' ? pk(['t7', 't8', 't0']) : PAL[z][0], x, y, { sc: 2.2 }); }
    // ---------- 4) büyük kayalar: meydan çevresi (4) + halka yol boyunca çiftler ----------
    const bigRock = (x, y, z) => { if (!(freeT(x, y) && freeT(x - 1, y) && freeT(x + 1, y))) return; for (const ox of [-1, 0, 1]) { const i = y * W + x + ox; m.bsolid[i] = 1; m.cover = m.cover || new Uint8Array(W * H); m.cover[i] = 1; }
      m.props.push({ k: z === 'volcano' || z === 'ruins' ? 'rockb' : 'rockg', at: 'p', x: (x + .5) * TL, y: (y + 1) * TL - 2, sc: 3.3, s: rnd() * 6, fl: rnd() < .5, big: 1 }); };
    for (const [z, px, py] of D0.PLZ || []) { for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; bigRock(Math.round(px + Math.cos(a) * 9), Math.round(py + Math.sin(a) * 9), z); }
      for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4, x = Math.round(px + Math.cos(a) * 6.5), y = Math.round(py + Math.sin(a) * 6.5); if (k % 2 === 0) prop(FLAG[z], x, y, { an: 4, sc: 2.4, fl: false }); } }
    for (let k = 0; k < 24; k++) { if (k % 3 === 0) continue; const a = k / 24 * Math.PI * 2; for (const s of [-1, 1]) { const r = 185 + s * 6, x = Math.round(C + Math.cos(a) * r), y = Math.round(C + Math.sin(a) * r); bigRock(x, y, zoneOf(x, y)); } }
    // ---------- 5) köşe kampları ----------
    for (const [cx, cy] of D0.CMP || []) { const z = zoneOf(cx, cy); m.props.push({ k: 'pit3', at: 'p', x: (cx + .5) * TL, y: (cy + 1) * TL - 3, f: true, s: 1 }); solid(cx, cy);
      for (const [ox, oy, k] of [[-2, 0, 'logs'], [2, 0, 'bench'], [0, 2, 'blanket'], [-3, -2, 'drying'], [3, -2, 'sackh'], [-3, 2, 'barrel'], [3, 2, 'crate']]) m.props.push({ k, at: 'p', x: (cx + ox + .5) * TL, y: (cy + oy + 1) * TL - 3, s: rnd() * 6, fl: rnd() < .5 });
      prop(FLAG[z] || 'flagGreen', cx - 4, cy - 3, { an: 4, sc: 2.4, fl: false }); prop(FLAG[z] || 'flagGreen', cx + 4, cy - 3, { an: 4, sc: 2.4, fl: false }); }
    // ---------- 6) canlılık: hayvanlar, oynayan bitkiler, çiçek ve kristal çeşitleri (içinden geçilir) ----------
    const sprinkle = (n, zones, keys, o) => { for (let k = 0, t = 0; k < n && t < n * 30; t++) { const x = 3 + Math.floor(rnd() * (W - 6)), y = 3 + Math.floor(rnd() * (H - 6)); if (!zones.includes(zoneOf(x, y)) || !freeT(x, y)) continue; prop(pk(keys), x, y, Object.assign({ x: (x + rnd()) * TL }, o)); k++; } };
    for (let k = 0, t = 0; k < 18 && t < 600; t++) { const a = rnd() * Math.PI * 2, r = 42 + rnd() * 50, x = Math.round(C + Math.cos(a) * r), y = Math.round(C + Math.sin(a) * r); if (zoneOf(x, y) !== 'meadow' || !freeT(x, y)) continue; prop(pk(ANIM), x, y, { an: 2, sc: 2, pet: 1 }); k++; }
    sprinkle(260, ['meadow', 'forestE'], ['plant'], { an: 4, sc: 2 });
    sprinkle(520, ['meadow', 'forestE', 'forestW'], ['fl0', 'fl1', 'fl2', 'fl3', 'fl6', 'gr3', 'gr4', 'gr5', 'gr7', 'gr9', 'gr10'], { sc: 2, flat: 1 });
    sprinkle(220, ['volcano', 'ruins'], ['cry0', 'cry1', 'cry2', 'cry3', 'gem0', 'gem1', 'gem2', 'gem3'], { sc: 2, glow: 1 });
    // ---------- v59: Flat paket — yel değirmenleri (çayır, simetrik), el arabaları, kuzey dağ silueti ----------
    for (let k = 0; k < 4; k++) { const a = Math.PI / 8 + k * Math.PI / 2, x = Math.round(C + Math.cos(a) * 120), y = Math.round(C + Math.sin(a) * 120);
      let okW = true; for (let yy = y - 1; yy <= y; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (!freeT(xx, yy)) okW = false; if (!okW) continue;
      for (let yy = y - 1; yy <= y; yy++) for (let xx = x - 1; xx <= x + 1; xx++) solid(xx, yy); m.props.push({ k: 'WindMill_0', at: 'f', x: (x + .5) * TL, y: (y + 1) * TL - 2, sc: .62, s: k * 1.3, fl: false }); }
    for (const [x, y] of [[C + VX + 6, C - 5], [C - VX - 6, C + 5], [C + 6, C - VY - 6], [C - 6, C - VY - 6]]) if (freeT(x, y) && freeT(x + 1, y)) { solid(x, y); solid(x + 1, y); m.props.push({ k: 'cart', at: 'f', x: (x + 1) * TL, y: (y + 1) * TL - 2, sc: .55, s: 0, fl: x < C }); }
    for (let x = 14; x < W - 14; x += 24) { for (let yy = 3; yy <= 6; yy++) for (let xx = x - 12; xx < x + 12; xx++) if (xx > 1 && xx < W - 2) { const i = yy * W + xx; if (!SOLID_T[m.tiles[i]]) m.bsolid[i] = 1; } m.props.push({ k: 'Mountains', at: 'f', x: (x + .5) * TL, y: 7 * TL, sc: .95, s: 0, fl: (x / 24) % 2 === 1, flat: 0 }); }
    // ---------- 7) kapalı cepleri kapat (köyden ulaşılamayan yürünebilir alan) ----------
    const reach = new Uint8Array(W * H), wq = new Int32Array(W * H); let a0 = 0, a1 = 0; const st = Math.floor(m.start ? m.start.y / TL : C + 7) * W + Math.floor(m.start ? m.start.x / TL : C); reach[st] = 1; wq[a1++] = st;
    const walk = i => !SOLID_T[m.tiles[i]] && !m.bsolid[i] && !SOLID_D[m.deco[i]];
    while (a0 < a1) { const i = wq[a0++], x = i % W; for (const j of [i - 1, i + 1, i - W, i + W]) { if (j < 0 || j >= W * H || reach[j] || (j === i - 1 && x === 0) || (j === i + 1 && x === W - 1)) continue; if (walk(j) || m.bsolid[j] && false) { reach[j] = 1; wq[a1++] = j; } } }
    let sealed = 0; for (let i = 0; i < W * H; i++) if (!reach[i] && walk(i)) { const z = zoneOf(i % W, (i / W) | 0); if (z === 'village') continue; m.bsolid[i] = 1; sealed++; }
    m.design.sealed = sealed;
  };
})();
