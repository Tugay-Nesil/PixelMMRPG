'use strict';
// =====================================================================
//  OTOMATİK GANİMET TOPLAMA (Sürüm 40)
//  Düşen her şey (altın, iksir, parşömen, eşya, kaynak, pet/binek) önce
//  yere sekerek düşer, sonra parıltı izi bırakarak oyuncuya uçar ve
//  envantere işlenir. Toplama/işleme kodu aynen eskisi (updLoot ve hazine);
//  bu katman yalnızca ganimeti oyuncuya taşır ve animasyonu çizer.
//  Çanta doluysa eşyalar yerde bekler (altın/iksir/malzeme yine toplanır).
// =====================================================================
(function () {
  const RANGE = 560, POP = .45; // çekim mesafesi (px), düşüş/sekme süresi (sn)
  const COL = l => l.kind === 'gold' ? '#ffd860' : l.kind === 'potHp' ? '#ff8080' : l.kind === 'potMp' ? '#80a8ff' : l.kind === 'mat' ? '#e8d8a0' : l.val && l.val.grade != null ? (GRADES[l.val.grade] || GRADES[0]).col : '#ffe080';
  const fullFor = l => (l.kind === 'gear' || (l.val && l.val.slot)) && player.inv.length >= 40;
  const flying = new Set();

  function pull(l, dt, p) {
    const age = gameTime - (l.t || 0);
    // düşüş: küçük sekme (yükseklik l._z)
    if (age < POP) { const k = age / POP; l._z = Math.sin(k * Math.PI) * 26 * (1 - k * .4); return; }
    l._z = 0;
    if (p.dead || fullFor(l)) { l._v = 0; return; }
    const tx = p.x, ty = p.y - 18, dx = tx - l.x, dy = ty - l.y, d = Math.hypot(dx, dy);
    if (d > (window.kdPullRange ? kdPullRange() : RANGE) && !l._fly) return;
    l._fly = true; flying.add(l);
    l._v = Math.min(1100, (l._v || 160) + 1600 * dt);
    const step = Math.min(d, l._v * dt); l.x += dx / (d || 1) * step; l.y += dy / (d || 1) * step;
    if (Math.random() < .6) particles.push({ x: l.x + rr(-3, 3), y: l.y - 6 + rr(-3, 3), vx: rr(-15, 15), vy: rr(-25, 5), life: .35, max: .35, col: COL(l), s: 3 });
    if (d < 34) { l.x = p.x; l.y = p.y; } // eski toplama kodu (32 px) aynı karede alır
  }
  function tick(dt) {
    const p = player; if (!p || !dt) return;
    for (const l of loots) pull(l, dt, p);
    if (typeof specials !== 'undefined') for (const l of specials) pull(l, dt, p);
    // toplananlar: oyuncuda küçük halka
    for (const l of [...flying]) {
      const gone = !loots.includes(l) && (typeof specials === 'undefined' || !specials.includes(l));
      if (gone) { flying.delete(l); effects.push({ type: 'ring', x: p.x, y: p.y - 4, t: 0, r0: 4, r1: 26, col: COL(l), dur: .3 }); }
    }
  }
  if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try { tick(dt); } catch (e) { } }; }

  // çizim: sekme yüksekliği + uçarken hafif küçülme ve parlama
  function lifted(fn) {
    return function (l) {
      const z = l._z || 0, fly = l._fly;
      if (!z && !fly) return fn.apply(this, arguments);
      ctx.save(); ctx.translate(0, -z);
      if (fly) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.fillStyle = COL(l); ctx.beginPath(); ctx.arc(l.x, l.y - 8, 9, 0, 7); ctx.fill(); ctx.restore(); }
      const r = fn.apply(this, arguments); ctx.restore(); return r;
    };
  }
  if (window.kdLoot) window.kdLoot = lifted(window.kdLoot);
  if (typeof drawSpecial === 'function') drawSpecial = lifted(drawSpecial);
})();
