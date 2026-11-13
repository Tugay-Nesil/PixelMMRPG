'use strict';
// =====================================================================
//  PERFORMANS (Sürüm 48)
//  • Zemin parçaları (8x8 karo) artık bir karede topluca çizilmez: her karede
//    en çok 2 yeni parça hazırlanır, hazır olmayan parça bir anlık düz renkle
//    gösterilir; boş karelerde görüş alanının bir halka dışı önceden hazırlanır.
//    (Kamera yeni bölgeye geçerken yaşanan 80-160 ms'lik takılmaların nedeni buydu.)
//  • Parçacık / efekt / yazı sayısına üst sınır (kalabalık savaşta kare düşmesin).
//  • Ekran dışındaki düşman / bot çizimi atlanır.
// =====================================================================
(function () {
  if (typeof getChunk !== 'function') return;
  // Zemin parçaları sabit 2x ölçekte hazırlanır (karo sanatı 16px→32px, yani her sanat pikseli 4 parça pikseli;
  // ekrana en yakın komşu büyütmeyle basılır → aynı keskinlik). Eskiden ekran yoğunluğu x yakınlaştırma
  // ölçeğinde (telefonda ~5x) hazırlanıyordu: parça başı ~7 MB, 64 parça ~435 MB → bellek taşması / takılma.
  // v58: ölçek kademeli (2 / 1 / 0.5) → yakınlaştırma değişince önbellek silinip tüm zemin yeniden çizilmez
  const CSf = () => { const z = RS * ZOOM; return z >= 1.3 ? 2 : z >= .65 ? 1 : .5; }; let CS = 2, CAP = 80, frameT = 0;
  const _gc = function (cx, cy) {
    CS = CSf();
    if (chunkMap !== M || chunkRS !== CS) { chunkCache.clear(); chunkMap = M; chunkRS = CS; }
    const k = cx + ',' + cy; let c = chunkCache.get(k); if (c) { chunkCache.delete(k); chunkCache.set(k, c); return c; }
    c = document.createElement('canvas'); c.width = c.height = Math.ceil(CHPX * CS); const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const old = ctx, ogt = gameTime; ctx = g; gameTime = 0;
    try { g.setTransform(CS, 0, 0, CS, -cx * CHPX * CS, -cy * CHPX * CS); for (let ty = cy * CH; ty < Math.min(M.H, (cy + 1) * CH); ty++) for (let tx = cx * CH; tx < Math.min(M.W, (cx + 1) * CH); tx++) drawTile(tx, ty); }
    finally { ctx = old; gameTime = ogt; }
    chunkCache.set(k, c); while (chunkCache.size > CAP) chunkCache.delete(chunkCache.keys().next().value); return c;
  };
  const FB = {};
  let budget = 99;
  function fallback(cx, cy) {
    let col = '#3a2a20';
    try { const tx = Math.min(M.W - 1, cx * CH + 4), ty = Math.min(M.H - 1, cy * CH + 4), t = M.tiles[ty * M.W + tx]; col = (TCOL[t] && TCOL[t][0]) || col; } catch (e) { }
    let c = FB[col]; if (!c) { c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 1, 1); FB[col] = c; }
    return c;
  }
  const ready = (cx, cy) => chunkMap === M && chunkRS === CS && chunkCache.has(cx + ',' + cy);
  getChunk = function (cx, cy) {
    CS = CSf();
    if (chunkMap !== M || chunkRS !== CS) { budget = Math.max(budget, 3); }
    // v58: kare başına süre bütçesi (en az 2 parça, 6 ms'e kadar devam) — uzak görünümde zemin geç dolmaz
    if (ready(cx, cy) || budget > 0 || performance.now() - frameT < 6) { if (!ready(cx, cy)) budget--; return _gc(cx, cy); }
    return fallback(cx, cy);
  };
  window.kdChunkBudget = n => { budget = n; };
  if (typeof render === 'function') {
    const _r = render;
    render = function () {
      budget = 2; frameT = performance.now();
      try { if (M) { const Z = ZOOM, vw = Math.ceil(VW / Z / CHPX) + 2, vh = Math.ceil(VH / Z / CHPX) + 2; CAP = Math.max(80, vw * vh * 2 + 16); } } catch (e) { }
      const r = _r.apply(this, arguments);
      // boşta: görüşün bir halka dışını önceden hazırla (karede 1 parça)
      try {
        if (budget > 0 && M && player) {
          const Z = ZOOM, x0 = Math.floor(camX / CHPX) - 1, y0 = Math.floor(camY / CHPX) - 1, x1 = Math.floor((camX + VW / Z) / CHPX) + 1, y1 = Math.floor((camY + VH / Z) / CHPX) + 1;
          const mx = Math.ceil(M.W / CH) - 1, my = Math.ceil(M.H / CH) - 1;
          let n = 0; outer: for (let y = Math.max(0, y0); y <= Math.min(my, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(mx, x1); x++) if (!ready(x, y)) { _gc(x, y); if (++n >= 1 && performance.now() - frameT > 12) break outer; }
        }
      } catch (e) { }
      return r;
    };
  }
  // üst sınırlar: parçacık ve yüzen yazı
  if (typeof update === 'function') {
    const _u = update;
    update = function () {
      const r = _u.apply(this, arguments);
      try { if (particles.length > 260) particles.splice(0, particles.length - 260); if (typeof floaters !== 'undefined' && floaters.length > 40) floaters.splice(0, floaters.length - 40); if (effects.length > 80) effects.splice(0, effects.length - 80); } catch (e) { }
      return r;
    };
  }
  // ekran dışı varlıkları çizme
  const onScreen = (x, y, m) => { const Z = ZOOM; return x > camX - m && x < camX + VW / Z + m && y > camY - m && y < camY + VH / Z + m + 300; };
  if (typeof drawEnemy === 'function') { const _de = drawEnemy; drawEnemy = function (e) { if (e && !e.kdDragon && !onScreen(e.x, e.y, 120)) return; return _de.apply(this, arguments); }; }
  window.kdOnScreen = onScreen;
  // v58: su / lav / kristal animasyonu her karede tek tek çiziliyordu; uzak görünümde binlerce kare → FPS düşüşü.
  // Artık yalnız oyuncunun çevresindeki (en çok ~700) kare canlandırılır, kalanı hazır zemin parçasından gelir.
  if (typeof drawGround === 'function') {
    drawGround = function (tx0, ty0, tx1, ty1) {
      for (let cy = Math.floor(ty0 / CH); cy <= Math.floor(ty1 / CH); cy++) for (let cx = Math.floor(tx0 / CH); cx <= Math.floor(tx1 / CH); cx++) ctx.drawImage(getChunk(cx, cy), cx * CHPX, cy * CHPX, CHPX + .6, CHPX + .6);
      let ax0 = tx0, ay0 = ty0, ax1 = tx1, ay1 = ty1; const area = (tx1 - tx0 + 1) * (ty1 - ty0 + 1);
      if (area > 700 && player) { const R = 13, px = Math.floor(player.x / TILE), py = Math.floor(player.y / TILE); ax0 = Math.max(tx0, px - R); ax1 = Math.min(tx1, px + R); ay0 = Math.max(ty0, py - R); ay1 = Math.min(ty1, py + R); }
      for (let ty = ay0; ty <= ay1; ty++) for (let tx = ax0; tx <= ax1; tx++) { const i = ty * M.W + tx, t = M.tiles[i]; if (t === T.WATER || t === T.LAVA || M.deco[i] === D.CRYSTAL) drawTile(tx, ty); }
    };
  }
})();
