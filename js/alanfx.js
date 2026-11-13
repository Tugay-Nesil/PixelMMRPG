'use strict';
// =====================================================================
//  ALAN EFEKTLERİ (Sürüm 47) — rahip yeteneklerinin görünür alanları
//  Zehir Bulutu: yerde 8 sn kalan, kaynayan yeşil bulut (içine gireni zehirler)
//  Lanet: dönen mor rün çemberi • Kutsal Işık: altın parlama + ışınlar
//  Kutsama / Şifa / Arınma: büyüyen dalga + müttefiklerin üstünde ışık sütunu
//  Kutsanmış müttefiklerin ayağında altın hale; zehirli / lanetli düşmanın başında işaret
// =====================================================================
(function () {
  const Z = () => window.kdZones || [];
  const COL = { ppoison: [120, 255, 80], pcurse: [176, 112, 255], pdmg: [255, 224, 138], pbless: [255, 214, 90], pheal: [125, 255, 160], pcleanse: [140, 210, 255] };
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  function allyList() { const L = []; if (typeof player !== 'undefined' && player && !player.dead) L.push(player); if (typeof bots !== 'undefined') for (const b of bots) if (b.alive && (b.party || b.faction === 'ally')) L.push(b); return L; }

  function ground() {
    const t = gameTime;
    for (const z of Z()) {
      const age = t - z.t0, life = z.until - z.t0, left = z.until - t, c = COL[z.k] || [255, 255, 255];
      const fade = Math.min(1, age / .25) * Math.min(1, left / .6);
      ctx.save();
      if (z.k === 'ppoison') {
        const rx = z.r, ry = z.r / 1.6;
        // gövde: koyu yeşil çekirdek, açık kenar
        const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, rx); g.addColorStop(0, rgba([70, 160, 40], .42 * fade)); g.addColorStop(.75, rgba(c, .26 * fade)); g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(z.x, z.y, rx, ry, 0, 0, 7); ctx.fill();
        // dönen kesikli kenar
        ctx.strokeStyle = rgba([190, 255, 120], .75 * fade); ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 40;
        ctx.beginPath(); ctx.ellipse(z.x, z.y, rx * .97, ry * .97, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        // kaynayan bulut öbekleri
        for (let i = 0; i < 18; i++) { const a = hash(i) * 6.283 + t * (.25 + hash(i + 9) * .3) * (i % 2 ? 1 : -1), rr2 = (.25 + hash(i + 3) * .7);
          const px = z.x + Math.cos(a) * rx * rr2, py = z.y + Math.sin(a) * ry * rr2, s = 16 + hash(i + 5) * 22 + Math.sin(t * 2 + i) * 4;
          ctx.fillStyle = rgba(i % 3 ? [110, 220, 70] : [60, 140, 40], .28 * fade); ctx.beginPath(); ctx.ellipse(px, py - 6, s, s * .62, 0, 0, 7); ctx.fill(); }
        // yükselen kabarcıklar
        for (let i = 0; i < 16; i++) { const ph = (t * .7 + hash(i + 20)) % 1, a = hash(i + 40) * 6.283, rr2 = Math.sqrt(hash(i + 60));
          const px = z.x + Math.cos(a) * rx * rr2 * .9, py = z.y + Math.sin(a) * ry * rr2 * .9 - ph * 46;
          ctx.fillStyle = rgba([200, 255, 140], (1 - ph) * .85 * fade); ctx.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4 + (i % 2) * 2, 4 + (i % 2) * 2); }
      } else if (z.k === 'pcurse') {
        const rx = z.r, ry = z.r / 1.6, k = Math.min(1, age / .35);
        ctx.fillStyle = rgba([60, 20, 90], .3 * fade); ctx.beginPath(); ctx.ellipse(z.x, z.y, rx * k, ry * k, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = rgba(c, .9 * fade); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(z.x, z.y, rx * k, ry * k, 0, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(z.x, z.y, rx * k * .62, ry * k * .62, 0, 0, 7); ctx.stroke();
        // dönen rün yıldızı
        ctx.beginPath(); for (let i = 0; i <= 5; i++) { const a = -t * 1.4 + i * 2.513; const px = z.x + Math.cos(a) * rx * k * .62, py = z.y + Math.sin(a) * ry * k * .62; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke();
        ctx.fillStyle = rgba([230, 190, 255], fade); for (let i = 0; i < 10; i++) { const a = t * 1.8 + i * .628; ctx.fillRect(Math.round(z.x + Math.cos(a) * rx * k) - 3, Math.round(z.y + Math.sin(a) * ry * k) - 3, 6, 6); }
      } else if (z.k === 'pdmg') {
        const k = Math.min(1, age / .25), rx = z.r * k, ry = z.r / 1.6 * k;
        const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, rx); g.addColorStop(0, rgba([255, 250, 210], .7 * fade)); g.addColorStop(1, rgba(c, 0));
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(z.x, z.y, rx, ry, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = rgba(c, .9 * fade); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(z.x, z.y, rx, ry, 0, 0, 7); ctx.stroke();
      } else { // kutsama / şifa / arınma: büyüyen dalga
        const k = Math.min(1, age / life), rx = z.r * (.15 + .85 * k), ry = rx / 1.6;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rgba(c, .22 * (1 - k)); ctx.beginPath(); ctx.ellipse(z.x, z.y, rx, ry, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = rgba(c, .95 * (1 - k * .8)); ctx.lineWidth = 5 - k * 3; ctx.beginPath(); ctx.ellipse(z.x, z.y, rx, ry, 0, 0, 7); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(z.x, z.y, rx * .7, ry * .7, 0, 0, 7); ctx.stroke();
      }
      ctx.restore();
    }
    // kutsanmış müttefiklerin ayağında altın hale
    const p = typeof player !== 'undefined' ? player : null;
    const blessed = []; if (p && !p.dead && p.buffs && p.buffs.p3 && p.buffs.p3.until > t) blessed.push(p);
    if (typeof bots !== 'undefined') for (const b of bots) if (b.alive && b._bl0) blessed.push(b);
    for (const a of blessed) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pu = .5 + .5 * Math.sin(t * 4 + a.x);
      ctx.strokeStyle = rgba([255, 214, 90], .55 + .35 * pu); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(a.x, a.y, 22 + pu * 3, 9 + pu, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = rgba([255, 214, 90], .16 + .1 * pu); ctx.beginPath(); ctx.ellipse(a.x, a.y, 22, 9, 0, 0, 7); ctx.fill(); ctx.restore(); }
  }

  function top() {
    const t = gameTime;
    // dalga sırasında müttefiklerin üstünde ışık sütunu + şifada yükselen artılar
    for (const z of Z()) {
      if (!/^(pbless|pheal|pcleanse)$/.test(z.k)) continue;
      const age = t - z.t0, k = age / (z.until - z.t0), c = COL[z.k];
      for (const a of allyList()) { if (Math.hypot(a.x - z.x, a.y - z.y) > z.r) continue;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, a.y - 120, 0, a.y); g.addColorStop(0, rgba(c, 0)); g.addColorStop(1, rgba(c, .55 * (1 - k)));
        ctx.fillStyle = g; ctx.fillRect(a.x - 18, a.y - 120, 36, 120);
        if (z.k !== 'pcleanse') for (let i = 0; i < 4; i++) { const ph = (age * 1.2 + i * .25) % 1, px = a.x + Math.sin(i * 2.1 + t * 3) * 14, py = a.y - 20 - ph * 70;
          ctx.fillStyle = rgba(z.k === 'pheal' ? [140, 255, 170] : [255, 230, 140], 1 - ph); if (z.k === 'pheal') { ctx.fillRect(px - 5, py - 1.5, 10, 3); ctx.fillRect(px - 1.5, py - 5, 3, 10); } else ctx.fillRect(px - 2, py - 2, 4, 4); }
        else for (let i = 0; i < 5; i++) { const ph = (age * 1.4 + i * .2) % 1; ctx.fillStyle = rgba([200, 240, 255], 1 - ph); ctx.beginPath(); ctx.arc(a.x + Math.sin(i * 1.7) * 16, a.y - 16 - ph * 60, 3, 0, 7); ctx.fill(); }
        ctx.restore(); }
    }
    // zehirli / lanetli düşmanın başında işaret
    if (typeof enemies !== 'undefined') for (const e of enemies) {
      if (e.dead || !e._b0 || !(e._debUntil > t) || e._kdHid) continue;
      const poison = e._debCol === '#8aff5a', y = e.y - (e.d.h || 40) - 26 + Math.sin(t * 5 + e.x) * 2;
      ctx.save(); ctx.font = '700 15px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      const purple = e._debCol === '#b050ff', s = purple ? '☠ ZEHİR' : poison ? '☠ -%25' : '▼ ZIRH'; ctx.strokeText(s, e.x, y); ctx.fillStyle = purple ? '#e0a0ff' : poison ? '#9dff60' : '#d8a8ff'; ctx.fillText(s, e.x, y); ctx.restore();
    }
  }

  if (typeof drawExtrasGround === 'function') { const _g = drawExtrasGround; drawExtrasGround = function () { _g.apply(this, arguments); try { ground(); } catch (e) { } }; }
  else window.drawExtrasGround = function () { try { ground(); } catch (e) { } };
  if (typeof drawExtrasTop === 'function') { const _t = drawExtrasTop; drawExtrasTop = function () { _t.apply(this, arguments); try { top(); } catch (e) { } }; }
})();
