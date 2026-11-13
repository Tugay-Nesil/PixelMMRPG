'use strict';
// =====================================================================
//  SÜRÜM 54 — Kızıl Sınır PvP kapısı (büyük, kırmızı, köy kapılarından farklı)
//  Bazalt sütunlar + sivri kemer + kızıl girdap + "KIZIL SINIR PvP" levhası
// =====================================================================
(function () {
  const RED = '#ff3b2a';
  const IM = {}; const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; };
  const ok = i => i && i.complete && i.naturalWidth > 0;
  function px(x) { return Math.round(x); }
  function signPlate(x, y) {
    ctx.save();
    ctx.font = '900 16px "Cinzel","Segoe UI",serif';
    const t1 = 'KIZIL SINIR ', t2 = 'PvP', w1 = ctx.measureText(t1).width, w2 = ctx.measureText(t2).width, w = w1 + w2 + 30, h = 28;
    // zincirler
    ctx.strokeStyle = '#2a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w / 2 + 10, y - 16); ctx.lineTo(x - w / 2 + 14, y - h / 2); ctx.moveTo(x + w / 2 - 10, y - 16); ctx.lineTo(x + w / 2 - 14, y - h / 2); ctx.stroke();
    ctx.fillStyle = '#14070a'; ctx.fillRect(px(x - w / 2 - 3), px(y - h / 2 - 3), px(w + 6), h + 6);
    const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, '#5a0e14'); g.addColorStop(1, '#2a0508');
    ctx.fillStyle = g; ctx.fillRect(px(x - w / 2), px(y - h / 2), px(w), h);
    ctx.strokeStyle = '#ff6a4a'; ctx.lineWidth = 2; ctx.strokeRect(px(x - w / 2) + 1, px(y - h / 2) + 1, px(w) - 2, h - 2);
    ctx.fillStyle = '#ffb040'; for (const sx of [-1, 1]) { ctx.fillRect(px(x + sx * (w / 2 - 6)) - 2, px(y) - 2, 4, 4); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const lx = x - (w1 + w2) / 2;
    ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(t1, lx, y + 1); ctx.strokeText(t2, lx + w1, y + 1);
    ctx.fillStyle = '#ffe2b0'; ctx.fillText(t1, lx, y + 1);
    ctx.shadowColor = RED; ctx.shadowBlur = 10 + 4 * Math.sin(gameTime * 4); ctx.fillStyle = '#ff4a30'; ctx.fillText(t2, lx + w1, y + 1);
    ctx.restore();
  }
  function flame(x, y, s) {
    const t = gameTime; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    softDot(x, y - 10 * s, 34 * s, '#ff3020', .3 + .1 * Math.sin(t * 7 + x));
    ctx.globalCompositeOperation = 'source-over';
    for (let k = 0; k < 3; k++) { const f = Math.sin(t * (9 + k * 2) + x + k) * 3 * s, hgt = (24 - k * 6) * s; ctx.fillStyle = ['#c0180c', '#ff5a1a', '#ffd070'][k];
      ctx.beginPath(); ctx.moveTo(x - (9 - k * 2.5) * s, y); ctx.quadraticCurveTo(x - 6 * s + f, y - hgt * .6, x + f * .6, y - hgt); ctx.quadraticCurveTo(x + 6 * s + f, y - hgt * .6, x + (9 - k * 2.5) * s, y); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function pillar(x, y, H, side) {
    const W = 30, t = gameTime;
    // kaide
    ctx.fillStyle = '#14080a'; ctx.fillRect(px(x - W / 2 - 9), px(y - 16), W + 18, 18);
    ctx.fillStyle = '#3a1a1e'; ctx.fillRect(px(x - W / 2 - 7), px(y - 14), W + 14, 14); ctx.fillStyle = '#56262c'; ctx.fillRect(px(x - W / 2 - 7), px(y - 14), W + 14, 3);
    // gövde
    ctx.fillStyle = '#14080a'; ctx.fillRect(px(x - W / 2 - 2), px(y - H), W + 4, H - 14);
    const g = ctx.createLinearGradient(x - W / 2, 0, x + W / 2, 0); g.addColorStop(0, '#2a1216'); g.addColorStop(.45, '#4a2228'); g.addColorStop(1, '#1e0c0f');
    ctx.fillStyle = g; ctx.fillRect(px(x - W / 2), px(y - H + 2), W, H - 16);
    // taş sıraları
    ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let yy = y - 30; yy > y - H + 8; yy -= 18) ctx.fillRect(px(x - W / 2), px(yy), W, 2);
    // parlayan kızıl çatlak
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,60,40,' + (.55 + .3 * Math.sin(t * 3 + side)) + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 3 * side, y - 22); ctx.lineTo(x + 4 * side, y - 48); ctx.lineTo(x - 2 * side, y - 70); ctx.lineTo(x + 5 * side, y - 96); ctx.lineTo(x, y - H + 18); ctx.stroke(); ctx.restore();
    // başlık + boynuzlar
    ctx.fillStyle = '#14080a'; ctx.fillRect(px(x - W / 2 - 8), px(y - H - 12), W + 16, 16);
    ctx.fillStyle = '#4a2228'; ctx.fillRect(px(x - W / 2 - 6), px(y - H - 10), W + 12, 12); ctx.fillStyle = '#6a3036'; ctx.fillRect(px(x - W / 2 - 6), px(y - H - 10), W + 12, 3);
    ctx.fillStyle = '#d8c8b0'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * (W / 2 + 6), y - H - 8); ctx.quadraticCurveTo(x + s * (W / 2 + 18), y - H - 14, x + s * (W / 2 + 16), y - H - 30); ctx.lineTo(x + s * (W / 2 + 4), y - H - 12); ctx.closePath(); ctx.fill(); }
    // kızıl sancak
    const sw = Math.sin(t * 2.4 + side) * 2, bx = x - 11, by = y - H + 4, bh = 58;
    ctx.fillStyle = '#14080a'; ctx.fillRect(px(bx - 2), px(by - 2), 26, 4);
    ctx.fillStyle = '#a8141c'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 22, by); ctx.lineTo(bx + 22 + sw, by + bh); ctx.lineTo(bx + 11 + sw, by + bh - 9); ctx.lineTo(bx + sw, by + bh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d42a2a'; ctx.fillRect(px(bx), px(by), 4, bh - 6);
    // sancakta çapraz kılıç
    ctx.save(); ctx.translate(bx + 11 + sw * .5, by + 24); ctx.fillStyle = '#ffd6a0';
    for (const r of [-.6, .6]) { ctx.save(); ctx.rotate(r); ctx.fillRect(-1, -10, 2, 18); ctx.fillRect(-4, 5, 8, 2); ctx.restore(); }
    ctx.restore();
    // tepede kızıl ateş kazanı
    const bz = img('ws_brazier'); if (ok(bz)) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bz, px(x - 18), px(y - H - 44), 36, 36); }
    flame(x, y - H - 34, 1.1);
  }
  function drawPvpGate(p) {
    const x = p.x, y = p.y, t = gameTime, HW = 80, H = 150;
    ctx.save();
    // --- girdap (kemerin içi) ---
    ctx.save(); ctx.beginPath(); ctx.moveTo(x - HW + 15, y); ctx.lineTo(x - HW + 15, y - H + 14); ctx.quadraticCurveTo(x, y - H - 50, x + HW - 15, y - H + 14); ctx.lineTo(x + HW - 15, y); ctx.closePath(); ctx.clip();
    const rg = ctx.createRadialGradient(x, y - 66, 6, x, y - 66, 110); rg.addColorStop(0, 'rgba(255,190,120,.95)'); rg.addColorStop(.25, 'rgba(255,60,40,.85)'); rg.addColorStop(.7, 'rgba(110,8,16,.85)'); rg.addColorStop(1, 'rgba(30,2,6,.9)');
    ctx.fillStyle = rg; ctx.fillRect(x - HW, y - H - 60, HW * 2, H + 60);
    ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) { ctx.strokeStyle = 'rgba(255,' + (90 + k * 30) + ',60,' + (.35 - k * .05) + ')'; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const a = t * (1.6 + k * .3) + k * 1.57 + i * .22, r = 4 + i * 1.6; const qx = x + Math.cos(a) * r, qy = y - 66 + Math.sin(a) * r * .9; if (i) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy); }
      ctx.stroke(); }
    for (let k = 0; k < 10; k++) { const ph = (t * .5 + k * .1) % 1, ex = x + Math.sin(k * 2.3 + t) * (HW - 25), ey = y - ph * (H + 10); softDot(ex, ey, 4, '#ffb060', (1 - ph) * .9); }
    ctx.restore();
    // --- sütunlar ---
    pillar(x - HW, y, H, -1); pillar(x + HW, y, H, 1);
    // --- sivri kemer ---
    const ar = (o) => { ctx.beginPath(); ctx.moveTo(x - HW - 18 - o, y - H + 2); ctx.quadraticCurveTo(x, y - H - 92 - o * 2, x + HW + 18 + o, y - H + 2); ctx.lineTo(x + HW - 14 + o, y - H + 16); ctx.quadraticCurveTo(x, y - H - 46 + o, x - HW + 14 - o, y - H + 16); ctx.closePath(); };
    ctx.fillStyle = '#14080a'; ar(3); ctx.fill();
    const ag = ctx.createLinearGradient(0, y - H - 80, 0, y - H + 16); ag.addColorStop(0, '#5a2a30'); ag.addColorStop(1, '#2a1014'); ctx.fillStyle = ag; ar(0); ctx.fill();
    // kemer üstündeki kızıl rün taşları
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 1; k < 8; k++) { const u = k / 8, bx = (1 - u) * (1 - u) * (x - HW - 2) + 2 * u * (1 - u) * x + u * u * (x + HW + 2), by = (1 - u) * (1 - u) * (y - H + 8) + 2 * u * (1 - u) * (y - H - 70) + u * u * (y - H + 8);
      softDot(bx, by, 7, RED, .5 + .35 * Math.sin(t * 3 + k)); ctx.fillStyle = '#ffb090'; ctx.fillRect(px(bx) - 1, px(by) - 1, 3, 3); }
    ctx.restore();
    // kilit taşı: kalkan + çapraz kılıç
    const kx = x, ky = y - H - 44;
    ctx.fillStyle = '#14080a'; ctx.beginPath(); ctx.moveTo(kx - 17, ky - 18); ctx.lineTo(kx + 17, ky - 18); ctx.lineTo(kx + 15, ky + 6); ctx.lineTo(kx, ky + 20); ctx.lineTo(kx - 15, ky + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b01820'; ctx.beginPath(); ctx.moveTo(kx - 14, ky - 15); ctx.lineTo(kx + 14, ky - 15); ctx.lineTo(kx + 12, ky + 5); ctx.lineTo(kx, ky + 16); ctx.lineTo(kx - 12, ky + 5); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(kx, ky); ctx.fillStyle = '#ffe0b0'; for (const r of [-.7, .7]) { ctx.save(); ctx.rotate(r); ctx.fillRect(-1.5, -13, 3, 20); ctx.fillStyle = '#ffb040'; ctx.fillRect(-5, 4, 10, 3); ctx.fillStyle = '#ffe0b0'; ctx.restore(); } ctx.restore();
    // levha
    signPlate(x, y - H + 30);
    ctx.restore();
  }
  if (typeof drawPortalArch === 'function') {
    const _a = drawPortalArch;
    drawPortalArch = function (p) { if (p && p.big === 'pvp') return drawPvpGate(p); return _a.apply(this, arguments); };
  }
  if (typeof drawPortalGround === 'function') {
    const _g = drawPortalGround;
    drawPortalGround = function (p) {
      if (!p || p.big !== 'pvp') return _g.apply(this, arguments);
      const t = gameTime; ctx.save(); ctx.translate(p.x, p.y);
      // kızıl taş zemin + parlayan rün çemberi
      ctx.fillStyle = 'rgba(40,6,10,.55)'; ctx.beginPath(); ctx.ellipse(0, 4, 118, 34, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(120,14,20,.45)'; ctx.beginPath(); ctx.ellipse(0, 4, 96, 26, 0, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = RED; ctx.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) { ctx.globalAlpha = .45 + .3 * Math.sin(t * 3 + k); ctx.beginPath(); ctx.ellipse(0, 4, 84 - k * 22, 22 - k * 6, 0, t * (1 + k * .4) * (k % 2 ? -1 : 1), t * (1 + k * .4) * (k % 2 ? -1 : 1) + 4.6); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.restore();
    };
  }
})();
