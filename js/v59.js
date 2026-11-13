'use strict';
// =====================================================================
//  SÜRÜM 59
//  1) KAHRAMANLAR — Fantasy Medieval Character Pack (oyuncu, botlar, Gölgeler)
//     Sınıf × zırh kalitesi = 3 görünüm (kadın/erkek). Animasyonlar: durma, yürüme,
//     saldırı, savunma (destek yetenekleri), ölüm. Saldırı yetenekleri saldırı,
//     destek yetenekleri (kutsama/şifa/kalkan…) savunma animasyonuyla oynar.
//  2) BOSSLAR — Monsters Creatures Fantasy (Göz Tiranı, Goblin Reisi, Mantar Kral,
//     Kemik Şövalye): haritalarda boss olarak, kendi saldırı/vurulma/ölüm kareleriyle.
//  3) Harita süsleri (ağaç/kaya/çalı) Flat Platformer Template + kayan bulutlar.
// =====================================================================
(function () {
  const TL = TILE;
  // ---------------- 1) KAHRAMANLAR ----------------
  const HC = {"fw":109,"fh":106,"ax":46,"ay":96,"anims":{"idle":[0,8],"walk":[8,8],"attack":[16,8],"block":[24,6],"die":[30,6]},"sheets":{"21m":["archer",0],"21f":["archer",1],"7m":["archer",2],"7f":["archer",3],"27m":["archer",4],"27f":["archer",5],"21mB":["archer",6],"21fB":["archer",7],"7mB":["archer",8],"7fB":["archer",9],"27mB":["archer",10],"27fB":["archer",11],"1m":["warrior",0],"1f":["warrior",1],"3m":["warrior",2],"3f":["warrior",3],"4m":["warrior",4],"4f":["warrior",5],"2m":["warrior",6],"2f":["warrior",7],"13m":["warrior",8],"13f":["warrior",9],"19m":["warrior",10],"19f":["warrior",11],"15m":["mage",0],"15f":["mage",1],"8m":["mage",2],"8f":["mage",3],"25m":["mage",4],"25f":["mage",5],"11m":["mage",6],"11f":["mage",7],"30m":["mage",8],"30f":["mage",9],"17m":["mage",10],"17f":["mage",11],"26m":["priest",0],"26f":["priest",1],"14m":["priest",2],"14f":["priest",3],"20m":["priest",4],"20f":["priest",5],"6m":["priest",6],"6f":["priest",7],"24m":["priest",8],"24f":["priest",9],"22m":["priest",10],"22f":["priest",11],"23m":["misc",0],"23f":["misc",1],"10m":["misc",2],"10f":["misc",3],"12m":["misc",4],"12f":["misc",5],"28m":["misc",6],"28f":["misc",7],"16m":["misc",8],"16f":["misc",9]},"cls":{"warrior":[1,4,13],"mage":[15,25,30],"archer":[21,7,27],"priest":[26,20,24],"misc":[23,10,12,28,16]},"pool":{"warrior":[[1,3],[4,2],[13,19]],"mage":[[15,8],[25,11],[30,17]],"priest":[[26,14],[20,6],[24,22]],"archer":[[21],[7],[27]]},"mrows":{"warrior":12,"mage":12,"archer":12,"priest":12,"misc":10}};
  const AT = {}; for (const c of ['warrior', 'mage', 'archer', 'priest', 'misc']) { const im = new Image(); im.src = 'na/hc_' + c + '.webp?v=69'; AT[c] = im; } // ?v: eski (maskesiz) görsel önbellekten gelmesin
  const ready = im => im && im.complete && im.naturalWidth > 0;
  const FOE = { warrior: 10, mage: 12, archer: 27, priest: 16, assassin: 27 };
  const GLOWC = ['#8fe3ff', '#c77dff', '#ffcf40'];
  // v61: kıyafet KUŞANILI ZIRHA göre: kalite → kademe, eşyanın kendisi → kademedeki görünüm; zırh yoksa temel kıyafet
  const hstr = s => { s = String(s || ''); let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  function heroKey(o) {
    const g = o.gender === 'f' ? 'f' : 'm';
    if (o.foe) return (FOE[o.cls] || 10) + g;
    const e = o._ent || (o.s && typeof player !== 'undefined' ? player : null);
    if (o.noA || o.cls === 'none') return '23' + g;
    const P = (HC.pool && (HC.pool[o.cls] || HC.pool.warrior)) || [[1], [4], [13]], t = Math.max(0, Math.min(2, o.aGrade || 0)), tier = P[t];
    const arm = e && e.eq && e.eq.armor; let idx = 0;
    if (arm) idx = (hstr(arm.uid || arm.name) + (arm.v || 0)) % tier.length; else if (e && e.name) idx = hstr(e.name) % tier.length;
    return tier[idx] + g;
  }
  window.kdHeroKey = heroKey;
  const BLOCK_K = new Set(['buff', 'heal', 'shield', 'stealth', 'cleanse', 'pbless', 'pheal', 'pcleanse', 'blink']);
  function skillAnim(id) { try { const sk = (typeof SKILL_BY_ID !== 'undefined' && SKILL_BY_ID[id]) || (window.KD_SK_ALL && KD_SK_ALL[id]); if (!sk) return 'attack'; if (sk.br === 'def' || BLOCK_K.has(sk.k)) return 'block'; } catch (e) { } return 'attack'; }
  // varlık bilgisi heroLook ile drawHero'ya taşınır
  // yetenek algılama: castT değişince hangi yetenek olduğu bekleme süresinden bulunur → saldırı / savunma animasyonu
  function skillOf(e) { let best = null, bd = 1; try { for (const id of e.act || []) { const sk = SKILL_BY_ID[id], cd = e.cds && e.cds[id]; if (!sk || cd == null) continue; const d = Math.abs(cd - sk.cd - e.castT); if (d < bd) { bd = d; best = id; } } } catch (er) { } return best; }
  function watchCast(e) { if (!e || e.castT == null || e.castT === e._seenCast) return; e._seenCast = e.castT; if (gameTime - e.castT > .4) return;
    const id = skillOf(e), k = e.castK; e._sk = { t: e.castT, a: id ? skillAnim(id) : (BLOCK_K.has(k) ? 'block' : 'attack'), id }; }
  window.kdWatchCast = watchCast;
  if (typeof heroLook === 'function') { const _hl = heroLook; heroLook = function (e) { const r = _hl.apply(this, arguments); try { if (r && e) { r._ent = e; watchCast(e); } } catch (er) { } return r; }; }
  function pickFrame(o) {
    const e = o._ent, t = o.anim || 0;
    if (e && e === (typeof player !== 'undefined' ? player : null) && e.dead) { const k = Math.max(0, Math.min(1, (gameTime - (e._deadT || gameTime)) / .9)); return ['die', Math.min(5, Math.floor(k * 6))]; }
    if (e && e._sk && gameTime >= e._sk.t && gameTime - e._sk.t < .55) { const k = (gameTime - e._sk.t) / .55, a = e._sk.a; return [a, Math.min(HC.anims[a][1] - 1, Math.floor(k * HC.anims[a][1]))]; }
    if (o.atk > 0) { const k = Math.max(0, Math.min(.999, 1 - o.atk / .22)); return ['attack', Math.floor(k * 8)]; }
    if (o.cast) return ['block', Math.min(5, Math.floor(o.cast.prog * 6))];
    if (o.moving && !o.riding) return ['walk', Math.floor(t * (o.running ? 15 : 11)) % 8];
    return ['idle', Math.floor(t * 7) % 8];
  }
  const _dh0 = window.drawHero;
  // ---------- v60: +7/+8/+9 — zırh ve silah KENDİSİ parlar (çevresinde neon yok) ----------
  //  +7: hafif nabız • +8: daha parlak nabız • +9: çok parlak, sönmez
  const ELC = { ePoison: '#ff2a8f', eLight: '#7fd8ff', eFlame: '#ff7a1a', eIce: '#eaf8ff' };
  // v61: +7 yavaş yanıp söner (≈4 sn: tam söner, tam yanar), +8 aynı hız daha parlak, +9 sönmez çok parlak
  // v62: beyaz ve daha kısık — +7 yavaş yanıp söner, +8 aynı hız daha parlak, +9 sönmez
  function glowA(plus, t, seed) { if (plus < 7) return 0; const pu = Math.pow(.5 + .5 * Math.sin(t * 1.6 + seed), 1.4); return plus === 7 ? .26 * pu : plus === 8 ? .40 * pu : .44; }
  const OFF = document.createElement('canvas'); OFF.width = HC.fw; OFF.height = HC.fh; const og = OFF.getContext('2d');
  // kareyi parlama rengine boya; zone=true → yalnız silah tarafı (sağ el ve silah)
  // v62: PARLAYAN YÜZEY MASKESİ — yalnız zırhın / silahın açık yüzeyleri ışık alır.
  //  Koyu çizgiler (kontur, zırh detayları) ve ten (yüz, eller) maskeye girmez → detaylar korunur.
  //  Kare başına bir kez hesaplanıp saklanır.
  // v63: maskeler atlasın içinde hazır (yarım çözünürlük; sol yarı zırh, sağ yarı silah) — piksel OKUNMAZ,
  //  böylece güvenli çerçevede (artifact) de çalışır.
  const PM = document.createElement('canvas'); PM.width = HC.fw; PM.height = HC.fh; const pg = PM.getContext('2d');
  const MA = document.createElement('canvas'), MW = document.createElement('canvas'); MA.width = MW.width = HC.fw; MA.height = MW.height = HC.fh;
  window.__kdSurf = (a, b, c, d) => surfMask(a, b, c, d); window.__kdAT = AT;
  function surfMask(im, sx, sy, zone) {
    let cls = null; for (const k in AT) if (AT[k] === im) cls = k; const rows = HC.mrows && HC.mrows[cls]; if (!rows) return null;
    const c = zone ? MW : MA, g = c.getContext('2d'); g.clearRect(0, 0, HC.fw, HC.fh); g.imageSmoothingEnabled = true;
    g.drawImage(im, (zone ? im.naturalWidth / 2 : 0) + sx / 2, rows * HC.fh + sy / 2, HC.fw / 2, HC.fh / 2, 0, 0, HC.fw, HC.fh); return c;
  }
  // maskeyi renge boya (beyaz zırh / element rengi silah)
  function colorMask(m, col) { og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, HC.fw, HC.fh); og.drawImage(m, 0, 0); if (col && col !== '#ffffff') { og.globalCompositeOperation = 'source-atop'; og.fillStyle = col; og.fillRect(0, 0, HC.fw, HC.fh); og.globalCompositeOperation = 'source-over'; } return OFF; }
  // element parçacıkları (silahın üzerinden)
  function elemFx(el, wx, wy, plus, S) { const rate = plus >= 9 ? .45 : plus === 8 ? .22 : .1; if (Math.random() > rate) return; const j = () => (Math.random() - .5) * 14 * S;
    if (el === 'ePoison') particles.push({ x: wx + j(), y: wy + j(), vx: (Math.random() - .5) * 10, vy: -18 - Math.random() * 16, life: .9, max: .9, col: Math.random() < .5 ? '#ff3c9e' : '#b0106c', s: 2 + Math.random() * 2 });
    else if (el === 'eFlame') particles.push({ x: wx + j(), y: wy + j(), vx: (Math.random() - .5) * 14, vy: -50 - Math.random() * 30, life: .55, max: .55, col: Math.random() < .5 ? '#ffd040' : '#ff5a10', s: 2 + Math.random() * 2.5 });
    else if (el === 'eIce') particles.push({ x: wx + j(), y: wy + j(), vx: (Math.random() - .5) * 12, vy: -8 - Math.random() * 8, life: 1.1, max: 1.1, col: Math.random() < .5 ? '#ffffff' : '#bfe8ff', s: 1.5 + Math.random() * 2 });
    else if (el === 'eLight') particles.push({ x: wx + j(), y: wy + j(), vx: (Math.random() - .5) * 90, vy: (Math.random() - .5) * 90, life: .18, max: .18, col: Math.random() < .5 ? '#ffffff' : '#7fd8ff', s: 1.6 + Math.random() * 1.5 }); }
  function bolt(x0, y0, x1, y1, a) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); const n = 4; for (let i = 1; i <= n; i++) { const k = i / n; ctx.lineTo(x0 + (x1 - x0) * k + (i < n ? (Math.random() - .5) * 8 : 0), y0 + (y1 - y0) * k + (i < n ? (Math.random() - .5) * 8 : 0)); } ctx.stroke(); ctx.restore(); }
  // ---------- v60: AVCI YAYI (pakete uygun, kalın konturlu çizgi film yayı) ----------
  const GRIP = [73, 69];
  // v68: AVCI YAYI — Free Pixel Gear paketindeki yay (Gear_11, lav/obsidyen piksel yay) + aynı paletle piksel ok
  const BOW_IMG = new Image(); BOW_IMG.src = 'data:image/png;base64,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';
  const ARW_IMG = new Image(); ARW_IMG.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAFCAYAAABM6GxJAAAAkElEQVR42mNkgID/fX6+DAwMDAxFmzYzMuAH/6E0IwMDAwMTsmY0BVg1Xw3yYHhdHwdXx8jAwPA/0MyJgYGBgeEV608GBgYGhufPnzNISkpisDe4KDOIRMpArNdoY2BgYGBkYWBgYLCV4IZawM1QtGkzAwMDA+O9e/fg1sLYokeP/r962YNBTFcMLsdIaRgAAJJqKsTeXWUQAAAAAElFTkSuQmCC'; window.KD_ARROW_IMG = ARW_IMG;
  const TB = document.createElement('canvas'); TB.width = TB.height = 16; const tbg = TB.getContext('2d');
  function drawBow(S, k, el, wa) {
    if (!(BOW_IMG.complete && BOW_IMG.naturalWidth)) return;
    const sc = 3.1 * S, pull = k > 0 && k < .72 ? (k / .72) * 9 * S : 0, recoil = k >= .72 ? (1 - k) * 4 * S : 0;
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(-recoil, 0); ctx.rotate(Math.PI / 4);
    ctx.drawImage(BOW_IMG, -8 * sc, -8 * sc, 16 * sc, 16 * sc);
    if (wa > 0 && el) { tbg.globalCompositeOperation = 'source-over'; tbg.clearRect(0, 0, 16, 16); tbg.drawImage(BOW_IMG, 0, 0); tbg.globalCompositeOperation = 'source-atop'; tbg.fillStyle = ELC[el]; tbg.fillRect(0, 0, 16, 16); tbg.globalCompositeOperation = 'source-over';
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= Math.min(1, wa * 1.2); ctx.drawImage(TB, 0, 0, 16, 16, -8 * sc, -8 * sc, 16 * sc, 16 * sc); }
    ctx.restore();
    // ok kirişe takılı (germe sırasında), bırakınca uçar
    if (k > .02 && k < .72 && ARW_IMG.complete && ARW_IMG.naturalWidth) { const as = 2.4 * S; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(ARW_IMG, -pull - 5 * as, -2.5 * as, 16 * as, 5 * as); ctx.restore(); }
  }
  function isBow(o) { if (o.cls !== 'archer') return false; const e = o._ent; if (e && typeof player !== 'undefined' && e === player) return !(window.kdIsDagger && kdIsDagger(e)); if (e && e.d && e.d.pvp) return !!e.ranged || true; return true; }
  window.drawHero = function (x, y, o) {
    try {
      const bow = isBow(o); let key = heroKey(o); if (bow && HC.sheets[key + 'B']) key += 'B';
      const sh = HC.sheets[key]; const im = sh && AT[sh[0]]; if (!ready(im)) return _dh0.apply(this, arguments);
      let [an, fi] = pickFrame(o); if (bow && (an === 'attack' || an === 'block')) { fi = Math.floor((o.anim || 0) * 7) % 8; }
      const col = HC.anims[an === 'attack' || an === 'block' ? (bow ? 'idle' : an) : an][0] + (bow && (an === 'attack' || an === 'block') ? fi : fi), row = sh[1], fw = HC.fw, fh = HC.fh;
      const S = .62 * (o.s ? o.s / 3.2 : 1), face = (o.face || 1) < 0 ? -1 : 1, t = gameTime, e = o._ent;
      const aP = o.foe ? 0 : (o.aPlus || 0), wP = o.foe ? 0 : (o.wPlus || 0), aA = glowA(aP, t, 0), wA = glowA(wP, t, 1.3);
      const el = wP >= 7 ? ((window.kdWeapElem && kdWeapElem(e || (o.s && typeof player !== 'undefined' ? player : null))) || 'eFlame') : null;
      ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
      if (!o.noShadow && !o.riding) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 17 * S / .62, 5.5 * S / .62, 0, 0, 7); ctx.fill(); }
      if (face < 0) ctx.scale(-1, 1);
      if (o.riding) { ctx.beginPath(); ctx.rect(-fw * S, -fh * S - 10, fw * 2 * S, fh * S * .66 + 10); ctx.clip(); }
      ctx.imageSmoothingEnabled = true;
      const dx = -HC.ax * S, dy = -HC.ay * S, sx = col * fw, sy = row * fh;
      ctx.drawImage(im, sx, sy, fw, fh, dx, dy, fw * S, fh * S);
      // zırh kendisi parlar
      // v64: ZIRH 5 PARÇA — miğfer • zırh • eldiven • bacaklık • çizme; her parça KENDİ basmasına göre yanar (+7 altı yanmaz)
      { const ent = e || (o.s && typeof player !== 'undefined' ? player : null), eq = ent && ent.eq && !o.s ? ent.eq : null;
        const pl = sl => o.foe ? 0 : eq ? (eq[sl] ? (eq[sl].plus || 0) : 0) : (o.s && ent && ent.eq ? (ent.eq[sl] ? ent.eq[sl].plus || 0 : (o.aPlus || 0)) : (o.aPlus || 0));
        const AXp = HC.ax, R = [['helmet', [[0, 0, HC.fw, 44]]], ['armor', [[AXp - 16, 44, 32, 28]]], ['bracers', [[0, 40, AXp - 16, 42], [AXp + 16, 40, 14, 42]]], ['pants', [[AXp - 22, 72, 44, 14]]], ['boots', [[0, 86, HC.fw, HC.fh - 86]]]];
        let m = null;
        for (let pi = 0; pi < R.length; pi++) { const [sl, rects] = R[pi], pv = o.s && !o._ent ? (o.aPlus || 0) : pl(sl), ga = glowA(pv, t, pi * .35); if (ga <= 0) continue;
          if (!m) { m = surfMask(im, sx, sy, false); if (!m) break; }
          pg.globalCompositeOperation = 'source-over'; pg.clearRect(0, 0, HC.fw, HC.fh); pg.drawImage(m, 0, 0); pg.globalCompositeOperation = 'destination-in'; pg.beginPath(); for (const r of rects) pg.rect(r[0], r[1], r[2], r[3]); pg.fillStyle = '#000'; pg.fill(); pg.globalCompositeOperation = 'source-over';
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          if (pi > 0) { ctx.globalAlpha *= ga * .2; ctx.shadowColor = 'rgba(255,255,255,.8)'; ctx.shadowBlur = (3 + ga * 5) * (typeof RS !== 'undefined' ? RS : 1) * S / .62; ctx.drawImage(PM, 0, 0, fw, fh, dx, dy, fw * S, fh * S); } // miğferde hale yok (yüze taşmasın)
          ctx.shadowBlur = 0; ctx.globalAlpha = (o.alpha != null ? o.alpha : 1) * ga; ctx.drawImage(PM, 0, 0, fw, fh, dx, dy, fw * S, fh * S); ctx.restore();
          if (!o.s && Math.random() < (pv >= 9 ? .03 : .015) * (pv >= 9 ? 1 : ga / .3)) { const r = rects[0], px = (r[0] + Math.random() * r[2] - AXp) * S * face, py = (r[1] + Math.random() * r[3] - HC.ay) * S; particles.push({ x: x + px, y: y + py, vx: (Math.random() - .5) * 6, vy: -14 - Math.random() * 12, life: 1.1, max: 1.1, col: '#ffffff', s: 1 + Math.random() * 1.2 }); } } }
      // silah kendisi element rengiyle yanar (yay modunda yay çiziminde)
      if (wA > 0 && !bow) { const m = surfMask(im, sx, sy, true); if (m) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= Math.min(1, wA * 1.5); ctx.shadowColor = ELC[el]; ctx.shadowBlur = (2 + wA * 4) * (typeof RS !== 'undefined' ? RS : 1) * S / .62; ctx.drawImage(colorMask(m, ELC[el]), 0, 0, fw, fh, dx, dy, fw * S, fh * S); ctx.restore(); } }
      if (e && typeof player !== 'undefined' && e === player && player._hitFx && gameTime - player._hitFx < .14) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .6; ctx.drawImage(im, sx, sy, fw, fh, dx, dy, fw * S, fh * S); ctx.restore(); }
      // yay
      if (bow && !(e && e.dead)) { let k = 0; if (e && e._sk && gameTime >= e._sk.t && gameTime - e._sk.t < .55) k = (gameTime - e._sk.t) / .55; else if (o.atk > 0) k = Math.max(0, Math.min(1, 1 - o.atk / .22));
        ctx.save(); ctx.translate((GRIP[0] - HC.ax) * S - (k > 0 && k < .72 ? 0 : 0), (GRIP[1] - HC.ay) * S - (k > 0 ? 3 * S : 0)); drawBow(S, k, el, wA, ['#d8d8d8', '#b768ff', '#ffc933'][Math.max(0, Math.min(2, o.wGrade || 0))]); ctx.restore(); }
      ctx.restore();
      // element efektleri (silahın üzerinde): parçacık + şimşek
      if (wA > 0 && el && !o.s) { const zx = x + face * ((bow ? GRIP[0] + 4 : HC.ax + 22 + Math.random() * 18) - HC.ax) * S, zy = y + ((bow ? GRIP[1] + (Math.random() - .5) * 40 : 20 + Math.random() * 45) - HC.ay) * S;
        elemFx(el, zx, zy, wP, S); if (el === 'eLight' && Math.random() < (wP >= 9 ? .35 : wP === 8 ? .18 : .08)) bolt(zx, zy - 10 * S, zx + face * (Math.random() * 14 - 4) * S, zy + 14 * S, Math.min(1, wA + .2)); }
      // yetenek ışıltısı (saldırı: turuncu yay, destek: yeşil halka)
      if (e && e._sk && gameTime >= e._sk.t && gameTime - e._sk.t < .55) { const k = (gameTime - e._sk.t) / .55; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .8;
        if (e._sk.a === 'block') { ctx.strokeStyle = '#9fffb0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 4, 18 + k * 26, 6 + k * 9, 0, 0, 7); ctx.stroke(); for (let i = 0; i < 3; i++) softDot(x + Math.sin(i * 2 + k * 6) * 14, y - 20 - k * 40 - i * 10, 7, '#c8ffd8', .7); }
        else if (!bow) { ctx.strokeStyle = '#ffd890'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + face * 10, y - 30, 26 + k * 10, face > 0 ? -1.6 + k * 2.2 : Math.PI + 1.6 - k * 2.2, face > 0 ? -1.6 + k * 2.2 + 1.4 : Math.PI + 1.6 - k * 2.2 - 1.4, face < 0); ctx.stroke(); }
        ctx.restore(); }
    } catch (er) { window.__kdHeroErr = String(er && er.stack || er); try { ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0; ctx.globalAlpha = 1; } catch (e3) { } try { _dh0.apply(this, arguments); } catch (e2) { } }
  };
  // botlar da yetenek kullanıyormuş gibi (her ~6 sn bir) — partide destek animasyonları görünsün
  if (typeof updBot === 'function') { const _ub = updBot; updBot = function (b, dt) { const r = _ub.apply(this, arguments); try { if (b.alive && b.target && b.atkAnim > .2 && Math.random() < .12) b._sk = { t: gameTime, a: b.cls === 'priest' && Math.random() < .5 ? 'block' : 'attack' }; } catch (e) { } return r; }; }
  // ölüm animasyonu
  if (typeof die === 'function') { const _d = die; die = function () { try { if (player && !player.dead) player._deadT = gameTime; } catch (e) { } return _d.apply(this, arguments); }; }
  if (typeof drawPlayer === 'function') { const _dp = drawPlayer; drawPlayer = function (p) { if (p && p.dead && p._deadT != null && gameTime - p._deadT < 4) { try { drawHero(p.x, p.y, heroLook(p)); } catch (e) { } return; } return _dp.apply(this, arguments); }; }
  // v64: başlangıçta "Full +9" seçildiyse karakter gerçekten efsanevi +9 set + silahla başlar (önceden yalnız önizlemeydi)
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function (d, isNew) { const r = _sg.apply(this, arguments);
    try { const st = window.__kdStage && __kdStage(); if (isNew && st && st.outfit === 'full' && typeof player !== 'undefined' && player) { const p = player;
        for (const sl of ['weapon', 'helmet', 'armor', 'bracers', 'pants', 'boots']) { const it = makeItem(sl, Math.max(1, p.lvl), 2, p.cls); it.plus = 9; p.eq[sl] = it; }
        if (p.cls === 'archer' && p.eq.weapon) { p.eq.weapon.wn = 'Bow2'; }
        recalc(p); p.hp = p.stats.maxHp; p.mp = p.stats.maxMp; try { save(); } catch (e) { } addChat(null, '✨ Full +9 set kuşanıldı: miğfer, zırh, eldiven, bacaklık, çizme ve silah +9.', '#ffd65a'); } } catch (e) { console.error(e); } return r; }; window.startGame = startGame; }
  // ---------------- portre (HUD): kahramanın yüzü atlastan kesilir ----------------
  // v63: portre doğrudan bir çizim alanına çizilir (artifactte toDataURL / piksel okuma engelli)
  let porC = null, porKey = '';
  window.naHeroChar = function (o) { return 'HC' + heroKey(o); };
  function fixPor() { const por = document.getElementById('h2por'); if (!por || typeof player === 'undefined' || !player) return;
    const key = heroKey(heroLook(player)), sh = HC.sheets[key], im = sh && AT[sh[0]]; if (!ready(im)) return;
    const head = por.querySelector('img'); if (!head) return;
    if (!porC || !porC.isConnected) { porC = document.createElement('canvas'); porC.width = porC.height = 128; porC.className = 'kdporc'; porC.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;image-rendering:auto;'; head.parentNode.insertBefore(porC, head); porKey = ''; }
    for (const im2 of por.querySelectorAll('img')) im2.style.visibility = 'hidden';
    if (porKey === key) return; porKey = key; const g = porC.getContext('2d'); g.clearRect(0, 0, 128, 128); g.imageSmoothingEnabled = true; g.drawImage(im, 8, sh[1] * HC.fh + 2, 68, 68, 0, 0, 128, 128); }
  setInterval(fixPor, 400);
  // ---------------- 2) BOSSLAR (Monsters Creatures Fantasy) ----------------
  const MC = {"eye":{"fw":62,"fh":52,"ax":31,"ay":52,"a":{"idle":[0,8],"run":[53,8],"a1":[106,8],"a2":[159,8],"hit":[212,4],"die":[265,4]}},"goblin":{"fw":136,"fh":46,"ax":68,"ay":46,"a":{"idle":[318,4],"run":[365,8],"a1":[412,8],"a2":[459,8],"hit":[506,4],"die":[553,4]}},"mush":{"fw":94,"fh":46,"ax":47,"ay":46,"a":{"idle":[600,4],"run":[647,8],"a1":[694,8],"a2":[741,8],"hit":[788,4],"die":[835,4]}},"skel":{"fw":146,"fh":89,"ax":73,"ay":89,"a":{"idle":[882,4],"run":[972,4],"a1":[1062,8],"a2":[1152,8],"hit":[1242,4],"die":[1332,4],"shield":[1422,4]}}};
  const mcA = new Image(); mcA.src = 'na/mcf.png';
  const BOSS = { eye: { name: 'Kanlı Göz Tiranı', fam: 'wraith', sc: 3.2, h: 150, ranged: 'ghost', range: 230 }, goblin: { name: 'Goblin Savaş Reisi', fam: 'goblin', sc: 2.7, h: 130 },
    mush: { name: 'Çürük Mantar Kral', fam: 'slime', sc: 3, h: 140 }, skel: { name: 'Kemik Şövalye', fam: 'skeleton', sc: 2.3, h: 190 } };
  window.KD_MCF = BOSS;
  if (typeof makeEnemy === 'function') { const _mk = makeEnemy; makeEnemy = function (sp) { const e = _mk.apply(this, arguments); if (!e || !sp || !sp.mcf) return e; const B = BOSS[sp.mcf];
    e.mcf = sp.mcf; e.vt = undefined; e.maxHp = e.hp = Math.round(e.maxHp * 12); e.atk *= 1.7; e.def = (e.def || 0) * 1.5 + 4; e.r = 26; e.cr = 14;
    e.d = Object.assign({}, e.d, { name: '☠ ' + B.name, boss: true, h: B.h, r: 26, xp: (e.d.xp || 30) * 12, xpL: (e.d.xpL || 6) * 12, aggro: 300, col: '#ff6a40', tele: { cd: 6.5, r: 95, m: 2.2, delay: .9 } });
    if (B.ranged) { e.d.ranged = B.ranged; e.d.range = B.range; }
    try { if (gameTime > 4) addChat(null, '☠ ' + B.name + ' uyandı! (dünya bossu)', '#ff8060'); } catch (er) { } return e; }; }
  if (window.naMon) { const _nm = window.naMon; window.naMon = function (e) { if (!e || !e.mcf) return _nm(e); const m = MC[e.mcf], B = BOSS[e.mcf]; if (!(mcA.complete && mcA.naturalWidth)) return false;
      let a = 'idle', sp = 7; const t = e.anim || 0;
      if (e.dead) a = 'die'; else if (gameTime - e.hitT < .22 && !(e.atkAnim > .05)) a = 'hit'; else if (e.atkAnim > .05) a = e.atkAnim > .35 ? 'a2' : (e.alt ? 'a2' : 'a1'); else if (e.moving) a = 'run';
      const [yy, n] = m.a[a]; let f = Math.floor(t * (a === 'a1' || a === 'a2' ? 14 : sp)) % n; if (a === 'a1' || a === 'a2') f = Math.min(n - 1, Math.floor((1 - Math.min(1, e.atkAnim / (e.atkAnim > .35 ? .6 : .3))) * n));
      const S = B.sc; shadow(0, 0, 16 * S, 5 * S);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .22 + .08 * Math.sin(t * 3); ctx.fillStyle = '#ff5030'; ctx.beginPath(); ctx.ellipse(0, -2, 20 * S, 6 * S, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.save(); if ((e.face || 1) < 0) ctx.scale(-1, 1); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mcA, f * m.fw, yy, m.fw, m.fh, Math.round(-m.ax * S), Math.round(-m.ay * S), Math.round(m.fw * S), Math.round(m.fh * S));
      if (!e.dead && gameTime - e.hitT < .1) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .6; ctx.drawImage(mcA, f * m.fw, yy, m.fw, m.fh, Math.round(-m.ax * S), Math.round(-m.ay * S), Math.round(m.fw * S), Math.round(m.fh * S)); }
      ctx.restore(); return true; }; }
  if (window.naMonH) { const _mh = window.naMonH; window.naMonH = function (e) { if (e && e.mcf) return BOSS[e.mcf].h; return _mh(e); }; }
  // boss noktaları: Yeşilvadi'de 4 köşe yolunun dışında, Kızıl Sınır'da 2
  function placeBosses(m, id) {
    if (!m || m._mcf) return m; m._mcf = true;
    if (id === 'yesilvadi') { const C = Math.floor(m.W / 2), L = [['eye', -Math.PI / 4, 16], ['skel', Math.PI / 4, 13], ['goblin', 3 * Math.PI / 4, 9], ['mush', -3 * Math.PI / 4, 6]];
      for (const [k, a, lv] of L) { let x = Math.round(C + Math.cos(a) * 208), y = Math.round(C + Math.sin(a) * 208);
        for (let r = 0; r < 12 && solidTileM(m, x, y); r++) { x += Math.round(Math.cos(a)); y += Math.round(Math.sin(a)); }
        if (typeof clearCircle === 'function') { for (let yy = y - 4; yy <= y + 4; yy++) for (let xx = x - 4; xx <= x + 4; xx++) { const i = yy * m.W + xx; if (Math.hypot(xx - x, yy - y) <= 4 && !SOLID_T[m.tiles[i]]) { m.bsolid[i] = 0; m.deco[i] = D.NONE; } } }
        m.spawns.push({ type: BOSS[k].fam, lvl: lv, x: (x + .5) * TL, y: (y + .5) * TL, mcf: k, resp: 300 }); } }
    if (id === 'sinir' && typeof findSpotIn === 'function') for (const [k, lv] of [['skel', 21], ['eye', 20]]) { const s = findSpotIn(m, 'mid'); if (s) m.spawns.push({ type: BOSS[k].fam, lvl: lv, x: s.x, y: s.y, mcf: k, resp: 300 }); }
    return m;
  }
  if (typeof GEN !== 'undefined') for (const id of ['yesilvadi', 'sinir']) { const g0 = GEN[id]; if (g0) GEN[id] = function () { return placeBosses(g0.apply(this, arguments), id); }; }
  // ---------------- 3) karo süsleri (ağaç/çam/çalı/kaya/kuru ağaç) → Flat paketi ----------------
  if (typeof drawDeco === 'function') { const _dd = drawDeco; drawDeco = function (d, x, y, v) {
    const F = window.KD_FLAT, im = window.kdFlatImg; if (!F || !im || !im.complete || !im.naturalWidth) return _dd.apply(this, arguments);
    let k = null, sc = .7; const h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
    if (d === D.TREE || d === D.PINE || d === D.DEAD) { let z = 'village'; try { z = M.zoneOf(Math.floor(x / TL), Math.floor(y / TL)); } catch (e) { } if (d === D.DEAD) z = 'ruins'; if (d === D.PINE && z === 'village') z = 'forestE'; k = window.kdFlatTree(z, h >>> 4); sc = .62; }
    else if (d === D.BUSH) { k = 'Bushes_' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12][h % 12]; sc = .42; }
    else if (d === D.ROCK) { k = 'Rocks_' + (h % 3); sc = .55; }
    if (!k || !F[k]) return _dd.apply(this, arguments);
    const r = F[k], dw = r[2] * sc, dh = r[3] * sc; ctx.save(); ctx.imageSmoothingEnabled = true; ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y, Math.min(dw * .4, 26), 5, 0, 0, 7); ctx.fill();
    if (h & 1) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); } ctx.drawImage(im, r[0], r[1], r[2], r[3], Math.round(x - dw / 2), Math.round(y - dh + 4), Math.round(dw), Math.round(dh)); ctx.restore(); }; }
})();
