'use strict';
// =====================================================================
//  SÜRÜM 60 — SİLAH ELEMENT HASARI + çizgi film oku
//  Her silahta bir element hasarı vardır (Zehir • Şimşek • Ateş • Buz);
//  basma (+) ile artar. +7'den itibaren silah bu elementin rengiyle KENDİSİ yanar:
//   Zehir = koyu pembe, Şimşek = elektrik mavisi + kıvılcım, Ateş = alev, Buz = beyaza yakın soğuk ışık.
// =====================================================================
(function () {
  const EL = { ePoison: { n: 'Zehir Hasarı', c: '#ff2a8f' }, eLight: { n: 'Şimşek Hasarı', c: '#7fd8ff' }, eFlame: { n: 'Ateş Hasarı', c: '#ff7a1a' }, eIce: { n: 'Buz Hasarı', c: '#eaf8ff' } };
  const KEYS = Object.keys(EL);
  window.KD_ELEM = EL;
  if (typeof STAT_TR !== 'undefined') for (const k of KEYS) STAT_TR[k] = EL[k].n;
  const hash = s => { s = String(s || ''); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function elemOf(it) { if (!it || it.slot !== 'weapon' || !it.base) return null; for (const k of KEYS) if (it.base[k] != null) return k; return null; }
  function addElem(it, k) { if (!it || it.slot !== 'weapon' || !it.base || elemOf(it)) return; k = k || KEYS[hash(it.uid || it.name) % 4];
    const m = (typeof GRADES !== 'undefined' && GRADES[it.grade]) ? GRADES[it.grade].m : 1; it.base[k] = Math.max(1, Math.round((3 + (it.lvl || 1) * .8) * m)); }
  window.kdElemOf = elemOf;
  if (typeof makeItem === 'function') { const _mk = makeItem; makeItem = function () { const it = _mk.apply(this, arguments); try { addElem(it, KEYS[Math.floor(Math.random() * 4)]); } catch (e) { } return it; }; }
  // eski kayıtlardaki silahlar: ilk okunduğunda (uid'e göre sabit) element alır
  if (typeof itemStats === 'function') { const _is = itemStats; itemStats = function (it) { try { addElem(it); } catch (e) { } return _is.apply(this, arguments); }; }
  // görsel için: varlığın silah elementi (oyuncu: kuşanılı silah; bot / diğerleri: isme göre sabit)
  window.kdWeapElem = e => { if (!e) return null; if (e.eq && e.eq.weapon) return elemOf(e.eq.weapon); return KEYS[hash(e.name) % 4]; };
  // savaş: element hasarı vuruşa eklenir + renkli kıvılcım
  if (typeof damageEnemy === 'function') { const _de = damageEnemy; damageEnemy = function (e, dm, src, col) {
    try { if (e && !e.dead && dm && dm.v > 0 && typeof player !== 'undefined' && src === player && player.eq) { const k = elemOf(player.eq.weapon), v = k && player.stats ? (player.stats[k] || 0) : 0;
        if (v > 0) { dm = Object.assign({}, dm, { v: dm.v + Math.max(1, Math.round(v * (.85 + Math.random() * .3))) }); const c = EL[k].c, hy = e.y - (e.d && e.d.h ? e.d.h * .5 : 20);
          for (let i = 0; i < 5; i++) particles.push({ x: e.x + (Math.random() - .5) * 16, y: hy + (Math.random() - .5) * 16, vx: (Math.random() - .5) * 120, vy: (Math.random() - .5) * 120 - 30, life: .4, max: .4, col: i % 2 ? '#ffffff' : c, s: 2 + Math.random() * 2 }); } } } catch (er) { }
    return _de.call(this, e, dm, src, col); }; }
  // ---------- çizgi film oku (avcı mermisi) ----------
  if (typeof window.naProj === 'function') { const _np = window.naProj; window.naProj = function (pr) {
    if (!pr || !(pr.kind === 'arrow' || pr.kind === 'foeArrow')) return _np.apply(this, arguments);
    let vx = pr.vx, vy = pr.vy; if (pr.homing && pr.target && !(vx || vy)) { vx = pr.target.x - pr.x; vy = pr.target.y - pr.y; } const a = Math.atan2(vy || 0, vx || 1);
    const src = pr.src, el = src && typeof player !== 'undefined' && src === player && player.eq ? elemOf(player.eq.weapon) : null, glow = src === player && (player.eq && player.eq.weapon && player.eq.weapon.plus >= 7);
    const AI = window.KD_ARROW_IMG; ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(a); ctx.imageSmoothingEnabled = false;
    if (AI && AI.complete && AI.naturalWidth) { const k2 = 2.4; ctx.drawImage(AI, -11 * k2, -2.5 * k2, 16 * k2, 5 * k2); if (pr.kind === 'foeArrow') { ctx.globalCompositeOperation = 'source-atop'; } }
    else { ctx.strokeStyle = '#3b3b3b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(12, 0); ctx.stroke(); }
    if (el && glow) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.fillStyle = EL[el].c; ctx.fillRect(-12, -2, 30, 4); }
    ctx.restore();
    if (el && glow && Math.random() < .6) particles.push({ x: pr.x, y: pr.y, vx: (Math.random() - .5) * 20, vy: (Math.random() - .5) * 20, life: .3, max: .3, col: EL[el].c, s: 2 });
    return true; }; }
})();
