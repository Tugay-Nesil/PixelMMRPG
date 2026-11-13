// ============================================================
//  ZEMİN (ARKA PLAN) ENTEGRASYONU — Kenney Block Pack
//  Oyunun prosedürel zeminini, paketten türetilen tepeden-bakış
//  dokularıyla değiştirir. Bilinmeyen tipler (zindan/volkan/duvar)
//  eski çizime düşer. Çiçek dekorları ve su animasyonu korunur.
// ============================================================
(function () {
  const Z = window.PAKET_ZEMIN;
  if (!Z || typeof drawTile !== 'function') return;
  const IM = {};
  let pend = 0, ready = false;
  for (const k in Z) {
    const im = new Image(); pend++;
    im.onload = im.onerror = function () {
      if (--pend <= 0) {
        ready = true;
        // chunk önbelleğini geçersiz kıl -> dokularla yeniden çizilsin
        try { chunkRS = -999; } catch (e) { }
        try { chunkCache.clear(); } catch (e) { }
      }
    };
    im.src = Z[k]; IM[k] = im;
  }
  const ok = im => im && im.complete && im.naturalWidth > 0;

  // tile tipi -> doku anahtarı  (bilinmeyenler eski çizime düşer)
  function texKey(t) {
    switch (t) {
      case T.GRASS: return 'grass';
      case T.FOREST: return 'forest';
      case T.PATH: return 'path';
      case T.WATER: return 'water';
      case T.SAND: return 'sand';
      case T.RUIN: return 'stone';
      case T.PLAZA: return 'plaza';
      case T.RDIRT: return 'rdirt';
      case T.CAMP: return 'dirt';
      default: return null;
    }
  }

  const _drawTile = drawTile;
  window.drawTile = function (tx, ty) {
    const m = M, i = ty * m.W + tx, t = m.tiles[i];
    const key = texKey(t), img = key && IM[key];
    if (!ready || !ok(img)) return _drawTile(tx, ty);

    const v = m.tvar[i], sx = tx * TILE, sy = ty * TILE;
    ctx.drawImage(img, sx, sy, TILE + .5, TILE + .5);

    // su parıltı animasyonu (eski görünümle aynı)
    if (t === T.WATER) {
      const ph = gameTime * 2 + tx * .7 + ty * .5;
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      ctx.fillRect(sx + 6 + Math.sin(ph) * 3, sy + 10, 12, 2);
      ctx.fillRect(sx + 14 + Math.cos(ph) * 3, sy + 22, 10, 2);
    }

    // dekorlar (çiçek / kristal / kemik) — orijinal çizimden
    const d = m.deco[i];
    if (d === D.FLOWER) { ctx.fillStyle = ['#ffd84a', '#ff6b8a', '#ffffff', '#b48cff'][v]; ctx.fillRect(sx + 7, sy + 9, 3, 3); ctx.fillRect(sx + 21, sy + 19, 3, 3); ctx.fillRect(sx + 13, sy + 25, 3, 3); }
    else if (d === D.CRYSTAL) { const g = .6 + Math.sin(gameTime * 3 + tx) * .3; ctx.fillStyle = 'rgba(200,120,255,' + g + ')'; ctx.beginPath(); ctx.moveTo(sx + 16, sy + 6); ctx.lineTo(sx + 22, sy + 20); ctx.lineTo(sx + 16, sy + 26); ctx.lineTo(sx + 10, sy + 20); ctx.closePath(); ctx.fill(); }
    else if (d === D.BONE) { ctx.fillStyle = '#d8d2c0'; ctx.save(); ctx.translate(sx + 16, sy + 18); ctx.rotate(v * .8); ctx.fillRect(-7, -1.2, 14, 2.4); circle(-7, -1.5, 2); circle(-7, 1.5, 2); circle(7, -1.5, 2); circle(7, 1.5, 2); ctx.restore(); }
  };
})();
