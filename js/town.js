'use strict';
// =====================================================================
//  KÖYE IŞINLANMA ("town atma") — Sürüm 44
//  T tuşu, arayüzdeki "Köye Dön" düğmesi ya da Menü: 5 sn (v46) boyunca karakter yerinde sabit durur,
//  ayağının altında dönen büyü çemberi + yükselen ışıklar + üstte ilerleme çubuğu.
//  Bu sırada canavar ya da karşı ırk vurursa (ya da yetenek kullanırsan)
//  ışınlanma BOZULUR — tekrar basman gerekir. Süre dolunca o haritanın
//  köyüne (Yeşilvadi: köy, Kızıl Sınır: Şafak Kampı, Mahzen: giriş) ışınlanırsın.
// =====================================================================
(function () {
  const DUR = 5;
  let R = null; // {t0, x, y}
  const p0 = () => typeof player !== 'undefined' && player;
  function townName() { return M.id === 'sinir' ? 'Şafak Kampı' : M.id === 'mahzen' ? 'Zindan Girişi' : 'Köy'; }
  function townTo() { return M.id === 'sinir' ? 'Şafak Kampı’na' : M.id === 'mahzen' ? 'Zindan Girişi’ne' : 'Köye'; }

  function start() {
    const p = p0(); if (!p || p.dead || typeof running === 'undefined' || !running) return;
    if (R) { cancel('Işınlanma iptal edildi', '#c8c0d8'); return; } // ikinci basış = iptal
    R = { t0: gameTime, x: p.x, y: p.y };
    p.moveTo = null; p.chase = false; p.target = null; if (typeof joyVec !== 'undefined') joyVec = null;
    fl(p.x, p.y - 84, townTo() + ' ışınlanılıyor…', '#9fe0ff', 14);
  }
  function cancel(msg, col) { const p = p0(); if (!R) return; R = null; if (p) { fl(p.x, p.y - 84, msg || 'Işınlanma bozuldu!', col || '#ff7070', 15); for (let k = 0; k < 14; k++) particles.push({ x: p.x + rr(-16, 16), y: p.y - rr(0, 40), vx: rr(-60, 60), vy: rr(-60, 10), life: .5, max: .5, col: '#ff8080', s: 3 }); } }
  function finish() {
    const p = p0(); R = null; if (!p) return;
    const fx = (x, y) => { effects.push({ type: 'ring', x, y, t: 0, r0: 6, r1: 90, col: '#9fe0ff', dur: .6, fill: true }); for (let k = 0; k < 30; k++) particles.push({ x: x + rr(-20, 20), y: y - rr(0, 50), vx: rr(-90, 90), vy: rr(-200, -40), life: .8, max: .8, col: k % 2 ? '#bff0ff' : '#ffffff', s: 4 }); if (window.naFx) try { naFx('boost', x, y - 30, 2.4, { add: true }); } catch (e) { } };
    fx(p.x, p.y);
    p.x = M.start.x; p.y = M.start.y; p.moveTo = null; p.chase = false; p.target = null;
    for (const e of enemies) if (e.target === p) { e.target = null; if (!e.d.pvp) e.state = 'return'; }
    fx(p.x, p.y); fl(p.x, p.y - 84, townName() + '!', '#9fffd0', 16);
    try { if (typeof updateCamera === 'function') updateCamera(); } catch (e) { }
  }
  window.kdTown = start; window.kdTownActive = () => !!R; window.kdTownLeft = () => R ? Math.max(0, DUR - (gameTime - R.t0)) : 0;

  // her kare: yerinde sabit tut, süre dolunca ışınla
  if (typeof update === 'function') {
    const _u = update;
    update = function (dt) {
      _u.apply(this, arguments);
      try {
        const p = p0(); if (!R || !p) return;
        if (p.dead) { R = null; return; }
        p.x = R.x; p.y = R.y; p.moveTo = null; p.chase = false; p.moving = false; if (typeof joyVec !== 'undefined') joyVec = null;
        if (Math.random() < .7) particles.push({ x: p.x + rr(-22, 22), y: p.y - rr(0, 6), vx: rr(-6, 6), vy: rr(-90, -40), life: .7, max: .7, col: Math.random() < .5 ? '#9fe0ff' : '#e8f8ff', s: 3 });
        if (gameTime - R.t0 >= DUR) finish();
      } catch (e) { }
    };
  }
  // vurulunca bozulur (canavar ya da karşı ırk)
  if (typeof damagePlayer === 'function') { const _dp = damagePlayer; damagePlayer = function (raw, src) { if (R && src && src !== p0()) cancel('Işınlanma bozuldu! Tekrar bas.'); return _dp.apply(this, arguments); }; }
  // yetenek / saldırı kullanınca da bozulur
  if (typeof useSkill === 'function') { const _us = useSkill; useSkill = function () { if (R) cancel('Işınlanma iptal edildi', '#c8c0d8'); return _us.apply(this, arguments); }; }

  // çizim: dönen büyü çemberi + ilerleme çubuğu
  if (typeof drawExtrasTop === 'function') {
    const _dt = drawExtrasTop;
    drawExtrasTop = function () {
      _dt.apply(this, arguments);
      const p = p0(); if (!R || !p) return;
      const k = Math.min(1, (gameTime - R.t0) / DUR), t = gameTime;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // zemin çemberi (iki halka + dönen rün noktaları)
      ctx.strokeStyle = 'rgba(140,220,255,' + (.45 + .3 * k) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 30 + k * 6, 11 + k * 2, 0, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 20, 7, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = '#d8f4ff';
      for (let i = 0; i < 8; i++) { const a = t * 2.2 + i * Math.PI / 4; ctx.fillRect(Math.round(p.x + Math.cos(a) * (30 + k * 6)) - 2, Math.round(p.y + Math.sin(a) * (11 + k * 2)) - 2, 4, 4); }
      // yükselen ışık sütunu
      const g = ctx.createLinearGradient(0, p.y - 90, 0, p.y); g.addColorStop(0, 'rgba(160,230,255,0)'); g.addColorStop(1, 'rgba(160,230,255,' + (.15 + .35 * k) + ')');
      ctx.fillStyle = g; ctx.fillRect(p.x - 16 - k * 6, p.y - 90, 32 + k * 12, 90);
      ctx.restore();
      // ilerleme çubuğu
      const bw = 60, x = Math.round(p.x - bw / 2), y = Math.round(p.y - 100);
      ctx.fillStyle = 'rgba(10,8,16,.85)'; ctx.fillRect(x - 2, y - 2, bw + 4, 9);
      ctx.fillStyle = '#7fd8ff'; ctx.fillRect(x, y, bw * k, 5); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, bw * k, 1.5);
      label(p.x, y - 5, townTo() + ' dönüş ' + Math.max(0, DUR - (gameTime - R.t0)).toFixed(1) + ' sn', '#bff0ff', 11);
    };
  }

  // T tuşu
  addEventListener('keydown', e => {
    if (typeof running === 'undefined' || !running || !player || e.repeat) return;
    const ae = document.activeElement; if (ae && (ae.tagName === 'INPUT' && ae.type !== 'range' || ae.tagName === 'TEXTAREA')) return;
    if ((e.key || '').toLowerCase() === 't') start();
  });
  // Menü'de "Köye Dön" düğmesi (dokunmatik için)
  function addBtn() {
    const grid = document.querySelector('#h2menuPop .grid'); if (!grid || document.getElementById('sl_town')) return;
    const d = document.createElement('div'); d.className = 'slot'; d.id = 'sl_town';
    d.innerHTML = '<span class="k">T</span><img class="skimg" src="na/sk_m9.png" alt="" style="width:58%;height:58%"><span class="n" style="font-size:10px">Köye Dön</span>';
    d.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const mp = document.getElementById('h2menuPop'); if (mp) mp.classList.remove('open'); start(); });
    grid.insertBefore(d, grid.firstChild);
  }
  setInterval(addBtn, 1000); addEventListener('kdready', addBtn);
})();
