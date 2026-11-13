'use strict';
// =====================================================================
//  SÜRÜM 55 — rahat farm + mini bosslar + mobil menü düzeltmesi
//  • Canavar YUVALARI: her doğma noktası hızlı yeniden doğar (5-8 sn), sayı +%50
//  • 👑 ŞAMPİYON mini bosslar: her bölgede 2 tane, 2,5 dk'da bir doğar, eşya düşürme şansı
//  • Menü: satırlar ancak gerçek bir dokunuşta (parmak kaymadan bırakılınca) çalışır
// =====================================================================
(function () {
  const TL = TILE;
  // ---------------- 1) canavar yuvaları: +%50 canavar, hızlı yeniden doğma ----------------
  const MINI_Z = { meadow: ['slime', 5], forestW: ['wolf', 9], forestE: ['goblin', 11], ruins: ['skeleton', 15], volcano: ['imp', 19], mid: ['bloodwolf', 21], vs: ['golem', 20] };
  function inSafe(m, x, y) { for (const s of m.safe || []) if (s.w ? (Math.abs(x - s.x) < s.w && Math.abs(y - s.y) < s.h) : Math.hypot(x - s.x, y - s.y) < s.r) return true; return false; }
  function near(m, s) { for (let k = 0; k < 14; k++) { const x = s.x + rr(-80, 80), y = s.y + rr(-80, 80), tx = Math.floor(x / TL), ty = Math.floor(y / TL); if (solidTileM(m, tx, ty) || inSafe(m, x, y) || (m.tgrass && m.tgrass[ty * m.W + tx])) continue; return { x, y }; } return null; }
  function farmify(m, id) {
    if (!m || m._kd55 || id.indexOf('ev_') === 0) return m; m._kd55 = true;
    const normal = m.spawns.filter(s => s.type !== 'foe' && !s.elite && !s.mini && typeof ET !== 'undefined' && ET[s.type] && !ET[s.type].boss);
    normal.forEach((s, i) => { s.resp = rr(5, 8); s.slot = true; for (let c = 0; c < 2; c++) { const q = near(m, s); if (q) m.spawns.push(Object.assign({}, s, { x: q.x, y: q.y, resp: rr(5, 8), slot: true })); } }); // v56: her yuvada 3 canavar (v55 sayısının 2 katı)
    // mini bosslar
    const P = window.KD_POOL || {};
    for (const z in MINI_Z) { if (!m.zones || !m.zones[z]) continue; const [fam, lv] = MINI_Z[z];
      for (let n = 0; n < 2; n++) { const sp = typeof findSpotIn === 'function' ? findSpotIn(m, z, (tx, ty) => !inSafe(m, tx * TL, ty * TL)) : null; if (!sp) continue;
        const pool = (P[fam] || []).filter(k => window.KD_VAR && KD_VAR[k] && !KD_VAR[k].mod.ranged); m.spawns.push({ type: fam, lvl: lv + 2, x: sp.x, y: sp.y, vt: pool.length ? pick(pool) : undefined, mini: true, resp: 150 }); } }
    return m;
  }
  if (typeof GEN !== 'undefined') for (const id of Object.keys(GEN)) { if (id.indexOf('ev_') === 0) continue; const g0 = GEN[id]; GEN[id] = function () { return farmify(g0.apply(this, arguments), id); }; }
  // yuva canavarı ölünce hızlı doğsun (bazı katmanlar d.resp verir — yuvada kısa olan geçerli)
  if (typeof killEnemy === 'function') { const _ke = killEnemy; killEnemy = function (e, src) {
    const was = e && !e.dead; const r = _ke.apply(this, arguments);
    try { if (was && e.sp && e.sp.slot && e.sp.timer > 8) e.sp.timer = e.sp.resp || 6; if (was && e.mini) miniDrop(e, src); } catch (er) { console.error(er); } return r; }; }
  // ---------------- 2) 👑 Şampiyon mini boss ----------------
  if (typeof makeEnemy === 'function') { const _mk = makeEnemy; makeEnemy = function (sp) {
    const e = _mk.apply(this, arguments); if (!e || !sp || !sp.mini) return e;
    e.mini = true; e.sizeM = 1.5; e.maxHp = e.hp = Math.round(e.maxHp * 4); e.atk *= 1.4; e.def = (e.def || 0) * 1.3 + 2; e.r = Math.round((e.r || 12) * 1.3);
    e.d = Object.assign({}, e.d, { name: '👑 Şampiyon ' + e.d.name.replace(/^Lanetli /, ''), xp: (e.d.xp || 20) * 5, xpL: (e.d.xpL || 5) * 5, aggro: (e.d.aggro || 160) * 1.2, col: '#ffb020' });
    try { if (typeof gameTime !== 'undefined' && gameTime > 4 && M && M.zones) { const z = M.zones[M.zoneOf(Math.floor(e.x / TL), Math.floor(e.y / TL))]; addChat(null, '👑 ' + e.d.name + ' ortaya çıktı' + (z ? ' (' + z.name + ')' : '') + ' — eşya düşürebilir!', '#ffc040'); } } catch (er) { }
    return e; }; }
  function miniDrop(e, src) {
    const p = player; if (!p || e.tagged !== p) return; const L = e.lvl;
    const add = (kind, val) => loots.push({ x: e.x + rr(-26, 26), y: e.y + rr(-14, 14), kind, val, t: gameTime, bob: rand() * 6 });
    add('gold', Math.round(120 + L * 18)); let got = [];
    if (rand() < .6) { const r = rand(), g = r < .18 ? 2 : r < .75 ? 1 : 0; add('gear', makeItem(pick(DROP_SLOTS), L, g, p.cls)); got.push(['Sıradan', 'Nadir', 'Efsanevi'][g] + ' eşya'); }
    if (rand() < .7) { add('mat', 'up'); got.push('Yükseltme'); } if (rand() < .25) { add('mat', 'ench'); got.push('Efsun'); } if (rand() < .1) { add('mat', 'luck'); got.push('Şans'); }
    addChat(null, '👑 ' + e.d.name + ' düştü!' + (got.length ? ' Ganimet: ' + got.join(', ') : ''), '#ffc040'); fl(e.x, e.y - 110, '👑 ŞAMPİYON DÜŞTÜ', '#ffc040', 18);
  }
  // ---------------- 3) mobil menü: kaydırırken / açılış dokunuşunda yanlışlıkla seçim olmasın ----------------
  function fixMenu() {
    const mp = document.getElementById('h2menuPop'); if (!mp || mp._kd55) return; mp._kd55 = true;
    let down = null, openedAt = 0;
    new MutationObserver(() => { if (mp.classList.contains('open')) openedAt = performance.now(); }).observe(mp, { attributes: true, attributeFilter: ['class'] });
    const rowOf = t => t && t.closest && t.closest('.grid .slot, .grid .h3row');
    mp.addEventListener('pointerdown', ev => { if (ev.__kdSyn) return; const row = rowOf(ev.target); if (!row) return; down = { row, x: ev.clientX, y: ev.clientY, t: performance.now(), id: ev.pointerId }; ev.stopPropagation(); ev.stopImmediatePropagation(); }, true);
    mp.addEventListener('pointermove', ev => { if (down && ev.pointerId === down.id && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 12) down.moved = true; }, true);
    mp.addEventListener('pointercancel', () => { if (down) down.moved = true; }, true);
    mp.addEventListener('pointerup', ev => { if (ev.__kdSyn) return; const row = rowOf(ev.target); if (!row) return; const d = down; down = null; const now = performance.now();
      ev.stopPropagation(); ev.stopImmediatePropagation();
      if (!d || d.row !== row || d.moved || now - d.t > 900 || now - openedAt < 280) { row._kdBlock = now; return; }
      row._kdOk = now; const pe = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: ev.pointerType || 'touch', clientX: ev.clientX, clientY: ev.clientY }); pe.__kdSyn = true; row.dispatchEvent(pe); }, true);
    // tıklama (click) da yalnızca onaylı dokunuştan sonra geçsin
    mp.addEventListener('click', ev => { const row = rowOf(ev.target); if (!row) return; if (!(row._kdOk && performance.now() - row._kdOk < 700)) { ev.stopPropagation(); ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
  }
  fixMenu(); setInterval(fixMenu, 1000);
  window.kdV55 = { farmify };
})();
