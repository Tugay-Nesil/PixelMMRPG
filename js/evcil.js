'use strict';
// =====================================================================
//  BİNEK / PET AYRIMI (Sürüm 46)
//  - 4 binek (hız verir) + 4 pet (ganimet toplar + kendi yeteneği).
//  - Pet ortadayken düşen eşyalara KOŞAR, dokunduğu eşya sana uçar.
//    Pet yoksa yakındaki (320 px) ganimet eskisi gibi kendiliğinden toplanır.
//  - PvP bölgesinde binek kullanılamaz (girince otomatik inilir).
//  Eski kayıtlarda kaldırılan binek/pet varsa parası geri verilir.
// =====================================================================
(function () {
  if (typeof MOUNTS === 'undefined' || typeof PETS === 'undefined') return;
  const KEEP_M = ['horse', 'wolf', 'panther', 'star'], KEEP_P = ['fox', 'drake', 'fairy', 'owl'];
  const REFUND = {};
  for (const k of Object.keys(MOUNTS)) if (!KEEP_M.includes(k)) { REFUND['m_' + k] = MOUNTS[k].price || 0; delete MOUNTS[k]; }
  for (const k of Object.keys(PETS)) if (!KEEP_P.includes(k)) { REFUND['p_' + k] = PETS[k].price || 0; delete PETS[k]; }

  Object.assign(MOUNTS.horse, { lv: 5, price: 800 });
  Object.assign(MOUNTS.wolf, { lv: 10, price: 3500 });
  Object.assign(MOUNTS.panther, { lv: 16, price: 9000 });
  Object.assign(PETS.fox, { price: 1500, desc: 'En hızlı toplayıcı: düşen eşyalara iki kat hızlı koşar.' });
  Object.assign(PETS.drake, { desc: 'Ganimet toplar + hedefine ateş topu fırlatır.' });
  Object.assign(PETS.fairy, { desc: 'Ganimet toplar + savaşta canını yavaş yavaş yeniler.' });
  Object.assign(PETS.owl, { desc: 'Ganimet toplar + %15 fazla TP. Yalnızca hazine sandıklarından çıkar.' });

  // ---- eski kayıt temizliği ----
  function migrate(p) {
    if (!p || p._evc) return; p._evc = 1; let back = 0;
    p.mounts = (p.mounts || []).filter(id => { if (MOUNTS[id]) return true; back += REFUND['m_' + id] || 0; return false; });
    p.pets = (p.pets || []).filter(id => { if (PETS[id]) return true; back += REFUND['p_' + id] || 0; return false; });
    if (p.mountId && !MOUNTS[p.mountId]) { p.mountId = p.mounts[0] || null; p.riding = false; }
    if (p.petId && !PETS[p.petId]) p.petId = p.pets[0] || null;
    if (back > 0) { p.gold += back; try { addChat(null, '🔄 Binek/pet sistemi yenilendi: kaldırılan hayvanların için ' + back + ' 🪙 iade edildi.', '#ffd040'); } catch (e) { } }
  }

  // ---- pet: ganimete koş, dokunduğunu oyuncuya uçur ----
  const FETCH = 600, SPD = { fox: 760, drake: 520, fairy: 520, owl: 580 };
  const full = (p, l) => (l.kind === 'gear' || (l.val && l.val.slot)) && p.inv.length >= 40;
  window.kdPullRange = () => (player && player.petId && petObj && !player.dead) ? 70 : 320;
  updPet = function (dt) {
    const p = player; if (!p) return; migrate(p);
    if (!p.petId || p.dead || !PETS[p.petId]) { if (!p.petId) petObj = null; return; }
    if (!petObj || petObj.id !== p.petId) petObj = { id: p.petId, x: p.x - 30, y: p.y, anim: 0, face: 1, atkT: 0, busy: null };
    const pt = petObj, def = PETS[p.petId]; pt.anim += dt;
    let tx = p.x - 30 * (p.face || 1), ty = p.y - 4;
    const pool = typeof specials !== 'undefined' ? loots.concat(specials) : loots;
    if (pt.busy && (!pool.includes(pt.busy) || pt.busy._fly)) pt.busy = null;
    if (!pt.busy) {
      let bd = FETCH;
      for (const l of pool) { if (l._fly || full(p, l) || gameTime - (l.t || 0) < .45) continue; const d = Math.hypot(l.x - p.x, l.y - p.y); if (d < bd) { bd = d; pt.busy = l; } }
    }
    let spd;
    if (pt.busy) {
      tx = pt.busy.x; ty = pt.busy.y; spd = SPD[pt.id] || 520;
      if (Math.hypot(pt.x - tx, pt.y - ty) < 16) {
        pt.busy._fly = true; pt.busy._v = 320;
        effects.push({ type: 'ring', x: pt.x, y: pt.y - 4, t: 0, r0: 3, r1: 18, col: '#ffe080', dur: .25 });
        pt.busy = null; pt.got = (pt.got || 0) + 1;
      }
    }
    const dx = tx - pt.x, dy = ty - pt.y, d = Math.hypot(dx, dy);
    if (d > 900) { pt.x = p.x; pt.y = p.y; pt.busy = null; }
    else if (d > 3) { const sp = Math.min(d, (spd || (d > 160 ? 520 : 230)) * dt); pt.x += dx / d * sp; pt.y += dy / d * sp; pt.moving = true; if (Math.abs(dx) > 1) pt.face = dx > 0 ? 1 : -1; }
    else pt.moving = false;
    if (def.ab === 'attack') {
      pt.atkT -= dt; const t = p.target;
      if (t && !t.dead && t.d && dist(pt, t) < 330 && pt.atkT <= 0) { pt.atkT = 1.5; const a = Math.atan2(t.y - t.d.h * .4 - (pt.y - 28), t.x - pt.x); projectiles.push({ x: pt.x, y: pt.y - 28, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, spd: 380, homing: true, target: t, owner: 'player', src: p, kind: 'fireball', mult: .4, opt: {}, life: 2 }); }
    }
    if (def.ab === 'heal' && gameTime - p.lastHit < 6 && p.hp < p.stats.maxHp) { healPlayer(p.stats.maxHp * .012 * dt, true); if (rand() < dt * 6) particles.push({ x: p.x + rr(-10, 10), y: p.y - rr(10, 40), vx: 0, vy: -30, life: .6, max: .6, col: '#9fffb0', s: 3 }); }
  };

  // ---- PvP: binek yasak ----
  const inPvp = () => typeof M !== 'undefined' && M && M.pvp;
  function dismount(p, msg) { if (!p || !p.riding) return; p.riding = false; try { recalc(p); } catch (e) { } if (msg) try { fl(p.x, p.y - 80, msg, '#ff9090', 12); } catch (e) { } }
  if (typeof toggleMount === 'function') {
    const _tm = toggleMount;
    toggleMount = function () { const p = player; if (p && !p.riding && inPvp()) { try { fl(p.x, p.y - 80, 'PvP bölgesinde binek kullanılamaz', '#ff9090', 12); showToast('Binek yasak', 'PvP bölgesinde yaya savaşılır', 1.6); } catch (e) { } return; } return _tm.apply(this, arguments); };
  }
  if (typeof update === 'function') { const _u = update; update = function (dt) { _u.apply(this, arguments); try { if (player && player.riding && inPvp()) dismount(player, 'PvP bölgesi: bineğinden indin'); } catch (e) { } }; }
})();
