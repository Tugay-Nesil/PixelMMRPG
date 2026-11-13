'use strict';
// =====================================================================
//  KÖY GÖRSELLERİ (Sürüm 53) — görkemli kapı girişleri
//  Her kapıda iki büyük kule, aralarında büyük taş kemer, yanan mangallar ve
//  kapı adı tabelası. Batı / doğu kapılarında kuleler kapının iki yanında.
// =====================================================================
(function () {
  const IM = {}; const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; };
  const ok = i => i && i.complete && i.naturalWidth > 0;
  const vis = (x, y) => !window.kdOnScreen || kdOnScreen(x, y, 260);
  function tower(x, y) { const t = img('tw_ally'); if (!ok(t)) return; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 46, 13, 0, 0, 7); ctx.fill(); ctx.drawImage(t, Math.round(x - 60), Math.round(y - 116), 120, 120); }
  function brazier(x, y) { const b = img('ws_brazier'); if (ok(b)) ctx.drawImage(b, Math.round(x - 20), Math.round(y - 36), 40, 40); const t = gameTime, f = .7 + .3 * Math.sin(t * 9 + x);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y - 30, 0, x, y - 30, 46 * f); g.addColorStop(0, 'rgba(255,210,120,.75)'); g.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 30, 46 * f, 0, 7); ctx.fill(); ctx.restore();
    if (Math.random() < .3) particles.push({ x: x + rr(-5, 5), y: y - 34, vx: rr(-8, 8), vy: rr(-60, -30), life: .5, max: .5, col: Math.random() < .5 ? '#ffb040' : '#ffe080', s: 3 }); }
  function sign(x, y, n) { ctx.save(); ctx.font = '700 15px "Cinzel","Segoe UI",serif'; const w = ctx.measureText(n).width + 28; ctx.fillStyle = 'rgba(40,24,14,.92)'; ctx.strokeStyle = '#d9a84a'; ctx.lineWidth = 3;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 15, w, 28, 4); else ctx.rect(x - w / 2, y - 15, w, 28); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe9b0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n, x, y); ctx.restore(); }
  function drawGate(g) {
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (g.side) { tower(g.x, g.y - 168); tower(g.x, g.y + 150); brazier(g.x + 34, g.y - 120); brazier(g.x + 34, g.y + 104); sign(g.x, g.y - 300, g.n); }
    else { tower(g.x - 170, g.y); tower(g.x + 170, g.y); const a = img('ws_arch'); if (ok(a)) ctx.drawImage(a, Math.round(g.x - 126), Math.round(g.y - 176), 252, 184);
      brazier(g.x - 110, g.y + 18); brazier(g.x + 110, g.y + 18); sign(g.x, g.y - 192, g.n); }
    ctx.restore();
  }
  if (typeof extrasToList === 'function') { const _el = extrasToList; extrasToList = function (list) { _el.apply(this, arguments); try { if (typeof M !== 'undefined' && M && M.gates) for (const g of M.gates) if (vis(g.x, g.y)) list.push({ y: g.y + 4, k: 7, fn: () => drawGate(g) }); } catch (e) { } }; }
})();
