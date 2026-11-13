'use strict';
// =====================================================================
//  SÜRÜM 26 KATMANI — mevcut sistemlere dokunmadan üstüne eklenir
//  • Köy: NPC'lerin arkasında mini evler + sol alt köşede şifa havuzu
//  • Binekler paket görselleriyle • İpucu balonları kaldırıldı
//  • Otomatik iksir (yüzde çubuğu) • OTO savaş + yetenek sırası
//  • Şeffaf, parmağın değdiği yerde açılan joystick
//  • Portre animasyonu (kafa + göz kırpma) • Renkli/animasyonlu durum panelleri
// =====================================================================
(function () {
  const $i = id => document.getElementById(id);
  const IM = {};
  const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; };
  const ok = i => i && i.complete && i.naturalWidth > 0;

  // ------------------------------------------------------------------
  // 1) KÖY: NPC evleri + şifa havuzu
  // ------------------------------------------------------------------
  const HOUSE_OF = { muhtar: 'hs_red', tuccar: 'hs_shop', demirci: 'hs_forge', bilge: 'hs_dome', seyis: 'hs_hay', zanaat: 'hs_cabin', lonca: 'hs_wood' };
  const GUARD = ['hs_orange2', 'hs_tan'];
  if (typeof GEN !== 'undefined' && GEN.yesilvadi) {
    const _gy = GEN.yesilvadi;
    GEN.yesilvadi = function () {
      const m = _gy.apply(this, arguments), W = m.W;
      if (m.villageV2) return m; // yeni köy (dunya2.js) evleri ve havuzu kendisi kurar
      let g = 0;
      for (const n of m.npcDefs) {
        // yol üstündeki NPC'yi yoldan biraz kenara al (ev yolu kapatmasın)
        if (Math.abs(n.x - 64) <= 3) n.x = 64 + (n.x < 64 ? -4.5 : -4.5);
        if (Math.abs(n.y - 64) <= 3) n.y = 58.5;
        const key = HOUSE_OF[n.id] || GUARD[g++ % 2];
        const S = key === 'hs_hay' ? 2.5 : 2, iw = { hs_shop: 48, hs_dome: 48, hs_wood: 48, hs_hay: 47 }[key] || 64;
        const px = n.x * TILE, bottom = n.y * TILE - 8;
        const bx = Math.round(n.x - iw * S / TILE / 2), bw = Math.max(2, Math.round(iw * S / TILE));
        const by1 = Math.floor(bottom / TILE), b = { x: bx, y: by1 - 2, w: bw, h: 2, type: 'nhouse', img: key, px, py: bottom, S, name: n.name };
        if (typeof addBuilding === 'function') addBuilding(m, b); else m.buildings.push(b);
      }
      // sol alt köşe: yuvarlak şifa havuzu (içine girilebilir)
      const cx = 50.6, cy = 75.6, r = 2.35;
      for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) { const i = y * W + x; if (Math.hypot(x + .5 - cx, y + .5 - cy) <= r + .9) { m.deco[i] = D.NONE; m.bsolid[i] = 0; } }
      m.pool = { x: cx * TILE, y: cy * TILE, r: 60 };
      m.labels.push({ x: cx, y: cy - r - .6, t: 'Şifa Havuzu' });
      return m;
    };
  }
  // ev çizimi
  if (typeof drawBuilding === 'function') {
    const _db = drawBuilding;
    drawBuilding = function (b) {
      if (b.type !== 'nhouse') return _db.apply(this, arguments);
      const im = img(b.img); if (!ok(im)) return;
      const w = im.naturalWidth * b.S, h = im.naturalHeight * b.S;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(b.px, b.py - 2, w * .5, 9, 0, 0, 7); ctx.fill();
      ctx.drawImage(im, Math.round(b.px - w / 2), Math.round(b.py - h), Math.round(w), Math.round(h));
      ctx.restore();
    };
  }
  // havuz çizimi (zemin üstü, karakterlerin altı) — paketin çimen gölet parçası + animasyonlu su halkaları
  const PS = 3; // 48x48 piksel gölet → 144 px
  function drawPool() {
    const P = typeof M !== 'undefined' && M && M.pool; if (!P) return;
    const im = img('pool'), rp = img('ripple'), t = gameTime, x = P.x, y = P.y; if (!ok(im)) return;
    const PSx = P.s || PS, w = im.naturalWidth * PSx, h = im.naturalHeight * PSx; // v53: büyük havuz
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
    // su halkaları (paketin 4 kareli animasyonu)
    if (ok(rp)) { const k2 = PSx / 3, RP = [[-22, -14, 0], [20, 4, 1.3], [-6, 22, 2.6], [30, -18, 3.4], [-34, 10, 4.1]]; for (const [dx, dy, ph] of RP) { const f = Math.floor(t * 5 + ph * 4) % 4; ctx.drawImage(rp, f * 16, 0, 16, 16, Math.round(x + dx * k2 - 16), Math.round(y + dy * k2 - 16), 32, 32); } }
    // şifa ışıltısı: suyun üstünde yükselen yeşil-mavi parıltılar
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) { const ph = (t * .35 + k / 7) % 1, a = k * 2.4; ctx.globalAlpha = Math.sin(ph * Math.PI) * .8; ctx.fillStyle = k % 2 ? '#8affc8' : '#9fe0ff';
      ctx.fillRect(Math.round(x + Math.cos(a) * 34), Math.round(y + Math.sin(a) * 26 - ph * 34), 3, 3); }
    ctx.restore();
    if (typeof label === 'function') label(x, y - 40 * PSx / 1.5, 'Şifa Havuzu', '#9fffd0', 12);
  }
  function inPool(e) { const P = typeof M !== 'undefined' && M && M.pool; if (!P) return false; return Math.hypot(e.x - P.x, (e.y - P.y) * 1.05) < P.r; }
  window.kdInPool = inPool;
  { const _g = typeof drawExtrasGround === 'function' ? drawExtrasGround : null; window.drawExtrasGround = function () { if (_g) _g.apply(this, arguments); drawPool(); }; try { drawExtrasGround = window.drawExtrasGround; } catch (e) { } }

  // ------------------------------------------------------------------
  // 2) BİNEKLER: paket görselleri (yan görünüm, yürüyüş kareleri)
  // ------------------------------------------------------------------
  // her binek: yan görünüm + ön/arka görünüm. [yan resmi, yan kare sayısı, ölçek, binici yüksekliği, ön, arka, 4 yönlü sayfa]
  const MT = {
    horse: { side: 'mt_horse', n: 2, S: 3, h: 27, f: 'mtf_horse', b: 'mtb_horse', fh: 22 },
    star: { side: 'mt_star', n: 2, S: 3, h: 27, f: 'mtf_star', b: 'mtb_star', fh: 22 },
    wolf: { dir4: 'm_Beast2', S: 3.6, h: 30, fh: 26 },
    lizard: { dir4: 'mt4_lizard', S: 3.4, h: 26, fh: 22 },
  };
  const mReady = m => m && ok(img(m.dir4 || m.side));
  window.kdMT = MT;
  function view(dir) { return dir === 'front' ? 'f' : dir === 'back' ? 'b' : 's'; }
  if (typeof drawMount === 'function') {
    const _dm = drawMount;
    drawMount = function (x, y, id, face, t, mv, dir) {
      const m = MT[id]; if (!mReady(m)) return _dm.apply(this, arguments);
      const v = view(dir), S = m.S, bob = mv ? Math.round(Math.abs(Math.sin(t * 11)) * 2) : 0;
      ctx.save(); ctx.translate(x, y); ctx.imageSmoothingEnabled = false;
      if (m.dir4) { // 4 yönlü sayfa: sütun 0 aşağı, 1 yukarı, 2 sol, 3 sağ
        const im = img(m.dir4), col = v === 'f' ? 0 : v === 'b' ? 1 : ((face || 1) < 0 ? 2 : 3), row = mv ? Math.floor(t * 9) % 4 : 0;
        shadow(0, 0, 16 * S * .4, 6);
        ctx.drawImage(im, col * 16, row * 16, 16, 16, Math.round(-8 * S), Math.round(-16 * S - bob), Math.round(16 * S), Math.round(16 * S));
      } else if (v !== 's' && ok(img(v === 'f' ? m.f : m.b))) { // ön / arka
        const im = img(v === 'f' ? m.f : m.b), f = mv ? Math.floor(t * 7) % 2 : 0, fw = im.naturalWidth / 2, fh = im.naturalHeight;
        shadow(0, 0, fw * S * .42, 6);
        ctx.drawImage(im, f * fw, 0, fw, fh, Math.round(-fw * S / 2), Math.round(-fh * S - bob), Math.round(fw * S), Math.round(fh * S));
      } else { // yan
        const im = img(m.side), n = m.n, fw = im.naturalWidth / n, fh = im.naturalHeight, f = mv ? Math.floor(t * 7) % n : 0;
        shadow(0, 0, fw * S * .42, 6); if ((face || 1) < 0) ctx.scale(-1, 1);
        ctx.drawImage(im, f * fw, 0, fw, fh, Math.round(-fw * S / 2), Math.round(-fh * S - bob), Math.round(fw * S), Math.round(fh * S));
      }
      ctx.restore();
      if (id === 'star' && mv && Math.random() < .5) particles.push({ x: x - (v === 's' ? (face || 1) * 22 : 0) + rr(-6, 6), y: y - rr(4, 30) + (v === 'b' ? 0 : 0), vx: rr(-10, 10), vy: rr(-30, -5), life: .7, max: .7, col: Math.random() < .5 ? '#bfe6ff' : '#fff6c0', s: 3 });
    };
  }
  if (typeof drawPlayer === 'function') {
    const _dpl = drawPlayer;
    drawPlayer = function (p) {
      if (!p || p.dead || !p.riding || !p.mountId || !mReady(MT[p.mountId])) return _dpl.apply(this, arguments);
      const m = MT[p.mountId]; let v = view(p.dir); if (!m.dir4 && v !== 's' && !(m.f && m.b && ok(img(v === 'f' ? m.f : m.b)))) v = 's'; const FH = m.fh || m.h || 24; // v54: ön/arka görseli olmayan binekte binici kaybolmasın
      const o = heroLook(p); o.riding = true; o.noShadow = true; o.moving = false; o.alpha = p.stealthUntil > gameTime ? .35 : 1;
      const bob = p.moving ? Math.round(Math.abs(Math.sin(p.anim * 11)) * 2) : 0;
      if (v === 'f') { // önden: binici arkada, bineğin başı önde
        drawHero(p.x, p.y - FH - bob, o); drawMount(p.x, p.y, p.mountId, p.face, p.anim, p.moving, p.dir);
      } else if (v === 'b') { // arkadan: binek önce, binicinin sırtı üstte
        drawMount(p.x, p.y, p.mountId, p.face, p.anim, p.moving, p.dir); drawHero(p.x, p.y - FH - bob, o);
      } else { drawMount(p.x, p.y, p.mountId, p.face, p.anim, p.moving, v === 's' ? 'side' : p.dir); drawHero(p.x, p.y - (m.h || 26) - bob, o); }
    };
  }
  // pet / binek listelerinde emoji yerine piksel görsel
  const PIC = { '🦊': ['pet_fox', 2, 1], '🐲': ['pet_drake', 4, 4], '🧚': ['pet_fairy', 4, 4], '🦉': ['pet_owl', 4, 4], '🐎': ['mt_horse', 2, 1], '🐺': ['m_Beast2', 4, 4], '🦎': ['mt_lizard', 4, 1], '🦄': ['mt_star', 2, 1] };
  window.kdPIC = PIC;
  function pixIcons(root) {
    if (!root) return;
    for (const c of root.querySelectorAll('.it')) { const k = (c.textContent || '').trim(); const P = PIC[k]; if (!P || c.querySelector('.pxi')) continue;
      c.innerHTML = '<i class="pxi" style="background-image:url(na/' + P[0] + '.png);background-size:' + (P[1] * 100) + '% ' + (P[2] * 100) + '%"></i>'; }
  }
  if (typeof renderExtra === 'function') { const _re = renderExtra; renderExtra = function () { const r = _re.apply(this, arguments); try { pixIcons($i('extra')); } catch (e) { } return r; }; }

  // ------------------------------------------------------------------
  // 3) İPUCU BALONLARI: yetenek/iksir/menü düğmelerinde çıkmaz
  //    (açıklamalar Yetenek panelinde — K). Dokunmatikte hiç çıkmaz.
  // ------------------------------------------------------------------
  if (typeof showTip === 'function') {
    const _st = showTip;
    showTip = function (html, ev) {
      try {
        if (ev && ev.target && ev.target.closest && ev.target.closest('.slot,#h2,#atkBtn,#dodgeBtn')) return;
        if (ev && ev.sourceCapabilities && ev.sourceCapabilities.firesTouchEvents) return;
        if (ev && ev.target && ev.target.closest && ev.target.closest('#inv.kd2')) { if (window.kdInvHover) kdInvHover(ev); return; }
      } catch (e) { }
      return _st.apply(this, arguments);
    };
  }
  addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && typeof hideTip === 'function') hideTip(); }, true);

  // ------------------------------------------------------------------
  // 4) OTOMATİK İKSİR + OTO SAVAŞ + YETENEK SIRASI
  // ------------------------------------------------------------------
  if (typeof SAVE_FIELDS !== 'undefined') SAVE_FIELDS.push('autoHp', 'autoMp', 'autoFight');
  function ensureDefaults(p) { if (!p) return; if (p.autoHp == null) p.autoHp = 50; if (p.autoMp == null) p.autoMp = 30; if (p.autoFight == null) p.autoFight = false; }
  let lastManual = -99, lastAutoT = 0;
  addEventListener('keydown', e => { const k = (e.key || '').toLowerCase(); if ('wasd'.includes(k) && k.length === 1 || k.startsWith('arrow')) lastManual = typeof gameTime !== 'undefined' ? gameTime : 0; });
  addEventListener('pointerdown', e => { if (e.target && e.target.id === 'game' && typeof gameTime !== 'undefined') lastManual = gameTime; });

  function skillRange(sk, p) { const s = p.stats, ranged = !!CLASSES[p.cls].proj; return sk.k === 'dash' || sk.k === 'blink' ? (sk.range || 200) : (sk.ranged || ranged || sk.k !== 'strike') ? s.range + 40 : s.range + 14; }
  // elle basılan yetenek uzaktaysa: hedefe koş, menzile girince kendiliğinden at
  if (typeof useSkill === 'function') {
    const _us = useSkill;
    useSkill = function (slot) {
      const p = player; const id = p && p.act && p.act[slot]; const before = id ? (p.cds[id] || 0) : 0;
      const r = _us.apply(this, arguments);
      if (p && id && (p.cds[id] || 0) === before && p.chase && p.target && !p.target.dead && (p.cds[id] || 0) <= gameTime && p.mp >= SKILL_BY_ID[id].mp) p._qSkill = { slot, id, until: gameTime + 4 };
      else if (p && id && (p.cds[id] || 0) !== before) p._qSkill = null;
      return r;
    };
  }
  function autoTick() {
    const p = player; if (!p || p.dead) return;
    ensureDefaults(p);
    const s = p.stats;
    // --- otomatik iksir ---
    if (p.potCd <= gameTime) {
      if (p.autoHp > 0 && p.potHp > 0 && p.hp < s.maxHp && p.hp / s.maxHp * 100 <= p.autoHp) usePotion('hp');
      else if (p.autoMp > 0 && p.potMp > 0 && p.mp < s.maxMp && p.mp / s.maxMp * 100 <= p.autoMp) usePotion('mp');
    }
    // --- sıraya alınmış yetenek ---
    const q = p._qSkill;
    if (q) { const t = p.target; if (gameTime > q.until || !t || t.dead || p.act[q.slot] !== q.id) p._qSkill = null;
      else { const sk = SKILL_BY_ID[q.id]; if (dist(p, t) - t.r <= skillRange(sk, p)) { p._qSkill = null; useSkill(q.slot); } } }
    // --- OTO savaş ---
    if (!p.autoFight) return;
    if (window.kdTownActive && kdTownActive()) return; // köye ışınlanırken OTO bekler
    if (gameTime - lastAutoT < .12) return; lastAutoT = gameTime;
    const manual = (typeof joyVec !== 'undefined' && joyVec) || p.moveTo || keys.w || keys.a || keys.s || keys.d || keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright || gameTime - lastManual < 1.2;
    if (manual || p.talkTo || p.gathering || p.opening) return;
    let t = p.target && !p.target.dead ? p.target : null;
    if (!t || dist(p, t) > 520) { t = null; let bd = 420; for (const e of enemies) { if (e.dead || e._kdHid || (e.d && e.d.passive)) continue; if (typeof inSafe === 'function' && inSafe(e.x, e.y)) continue; const d = dist(p, e); if (d < bd) { bd = d; t = e; } } if (t) p.target = t; }
    if (!t) return;
    if (!p.chase) p.chase = true;
    const d = dist(p, t) - t.r, hpF = p.hp / s.maxHp;
    for (let i = 0; i < 3; i++) {
      const id = p.act[i]; if (!id) continue; const sk = SKILL_BY_ID[id]; if (!sk || sk.pas) continue;
      if ((p.cds[id] || 0) > gameTime || p.mp < sk.mp) continue;
      let go = false;
      switch (sk.k) {
        case 'heal': go = hpF < .6; break;
        case 'pheal': go = hpF < .65; break;
        case 'pcleanse': go = !!p.kdPoison; break;
        case 'pbless': go = d < 280 && !(p.buffs.p3 && p.buffs.p3.until > gameTime); break;
        case 'pdmg': case 'ppoison': case 'pcurse': go = d < 300; break;
        case 'shield': go = hpF < .85 && d < 260; break;
        case 'buff': go = d < 260; break;
        case 'aoe': go = d < (sk.r || 120) * .85; break;
        case 'stealth': go = false; break;
        case 'x': go = window.kdAutoGo ? kdAutoGo(sk, p, t, d, hpF) : false; break;
        case 'blink': go = !!sk.behind && d < skillRange(sk, p); break;
        default: go = d <= skillRange(sk, p);
      }
      if (go) { useSkill(i); break; }
    }
  }
  // şifa havuzu: içine girildiği an can ve mana TAMAMEN dolar; içeride kaldıkça dolu kalır
  let poolFxT = 0, wasIn = false, guard = null;
  function poolTick(dt) {
    const p = player; if (!p || p.dead || !dt) return;
    const inside = inPool(p), s = p.stats;
    if (inside) {
      const need = p.hp < s.maxHp || p.mp < s.maxMp;
      if (!wasIn || need) {
        p.hp = s.maxHp; p.mp = s.maxMp;
        if (!wasIn) {
          fl(p.x, p.y - 84, 'Can ve Mana doldu!', '#9fffd0', 15);
          if (window.naFx) { try { naFx('aura', p.x, p.y - 20, 3); naFx('sparkc', p.x, p.y - 30, 2.5, { add: true }); } catch (e) { } }
          if (typeof effects !== 'undefined') effects.push({ type: 'ring', x: p.x, y: p.y, t: 0, r0: 10, r1: 70, col: '#7dffb0', dur: .6, fill: true });
          for (let k = 0; k < 18; k++) particles.push({ x: p.x + rr(-20, 20), y: p.y - rr(0, 20), vx: rr(-40, 40), vy: rr(-120, -50), life: .9, max: .9, col: k % 2 ? '#7dffb0' : '#9fd8ff', s: 4 });
        }
      }
      poolFxT -= dt; if (poolFxT <= 0) { poolFxT = .2; particles.push({ x: p.x + rr(-14, 14), y: p.y - rr(0, 10), vx: rr(-8, 8), vy: rr(-60, -30), life: .7, max: .7, col: Math.random() < .5 ? '#7dffb0' : '#9fd8ff', s: 3 }); }
    }
    // çıkışta: dolan can/mana korunur. Hasar almadan geri düşerse (başka bir sistem eski değeri yazarsa) geri yükle
    if (wasIn && !inside) { guard = { hp: p.hp, mp: p.mp, t: gameTime, hit: p.lastHit }; }
    if (guard && !inside) {
      if (gameTime - guard.t > 3 || p.lastHit !== guard.hit || p.dead) guard = null;
      else { if (p.hp < guard.hp - 1) { console.warn('[Şifa Havuzu] can geri düştü, düzeltildi', Math.round(p.hp), '→', Math.round(guard.hp)); p.hp = Math.min(s.maxHp, guard.hp); }
        if (p.mp < guard.mp - 1 && !(p.cds && Object.values(p.cds).some(c => c > gameTime - .2 && c > guard.t))) p.mp = Math.min(s.maxMp, guard.mp); }
    }
    wasIn = inside;
  }
  if (typeof update === 'function') { const _up = update; update = function (dt) { _up.apply(this, arguments); try { poolTick(dt); autoTick(); } catch (e) { } }; }

  // ayar bloğu (menü ve envanterde aynı)
  function autoBlockHTML() {
    const p = player; ensureDefaults(p);
    const row = (k, lab, col, ico) => '<div class="kdauto-row"><img class="px" src="na/' + ico + '.png" alt=""><span class="kdauto-lab" style="color:' + col + '">' + lab + '</span>' +
      '<input type="range" min="0" max="90" step="5" value="' + p[k] + '" data-auto="' + k + '" style="--c:' + col + ';--v:' + (p[k] / 90 * 100) + '%">' +
      '<b class="kdauto-val" data-autov="' + k + '">' + (p[k] ? '%' + p[k] : 'Kapalı') + '</b></div>';
    return '<div class="kdauto"><div class="kdauto-ttl">Otomatik İksir <span>— çubuk altına düşünce iç</span></div>' + row('autoHp', 'Can', '#ff5a5a', 'ii_LifePot') + row('autoMp', 'Mana', '#5aa0ff', 'ii_WaterPot') + '</div>';
  }
  window.kdAutoBlock = autoBlockHTML;
  document.addEventListener('input', e => {
    const k = e.target && e.target.dataset && e.target.dataset.auto; if (!k || !player) return;
    player[k] = +e.target.value; e.target.style.setProperty('--v', (player[k] / 90 * 100) + '%');
    document.querySelectorAll('[data-autov="' + k + '"]').forEach(b => b.textContent = player[k] ? '%' + player[k] : 'Kapalı');
    document.querySelectorAll('[data-auto="' + k + '"]').forEach(i => { if (i !== e.target) { i.value = player[k]; i.style.setProperty('--v', (player[k] / 90 * 100) + '%'); } });
  });
  document.addEventListener('change', e => { if (e.target && e.target.dataset && e.target.dataset.auto && typeof save === 'function') try { save(); } catch (er) { } });

  // ------------------------------------------------------------------
  // 5) HUD eklentileri: OTO düğmesi, menüde iksir ayarı, iksir yuvasında OTO etiketi
  //    (kilitli yerleşim değişmez; yeni düğme sağ sütunun boş üst hücresine oturur)
  // ------------------------------------------------------------------
  let otoB = null;
  function hudExtras() {
    const root = $i('h2'); if (!root) return;
    if (!otoB) {
      otoB = document.createElement('div'); otoB.id = 'kdOto'; otoB.className = 'h2p h2b';
      otoB.innerHTML = '<img class="px" src="na/i_cog.png" alt=""><span class="lab">OTO</span><span class="kk">H</span>';
      otoB.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggleAuto(); });
      root.appendChild(otoB);
    }
    const mp = $i('h2menuPop'); if (mp && !mp.querySelector('.kdauto')) { const d = document.createElement('div'); d.className = 'kdauto-wrap'; d.innerHTML = autoBlockHTML(); mp.insertBefore(d, mp.querySelector('.grid')); }
    for (const [id, k] of [['sl_ph', 'autoHp'], ['sl_pm', 'autoMp']]) { const el = $i(id); if (el && !el.querySelector('.kdoto')) { const s = document.createElement('span'); s.className = 'kdoto'; s.dataset.k = k; el.appendChild(s); } }
  }
  function toggleAuto() {
    const p = player; if (!p) return; ensureDefaults(p); p.autoFight = !p.autoFight;
    if (!p.autoFight) { p.chase = false; }
    if (typeof showToast === 'function') showToast(p.autoFight ? 'OTO savaş açık' : 'OTO savaş kapalı', p.autoFight ? 'En yakın canavara saldırır, yetenekleri kendisi kullanır' : '', 1.6);
    try { save(); } catch (e) { }
  }
  window.kdToggleAuto = toggleAuto;
  addEventListener('keydown', e => { if (typeof running === 'undefined' || !running || !player) return; const ae = document.activeElement; if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return; if (!e.repeat && (e.key || '').toLowerCase() === 'h') toggleAuto(); });
  if (typeof buildBar === 'function') { const _bb = buildBar; buildBar = function () { _bb.apply(this, arguments); try { hudExtras(); const b = $i('sl_bag'); if (b) b.onclick = () => toggleBag(); } catch (e) { } }; }

  // ------------------------------------------------------------------
  // 6) JOYSTICK: şeffaf, parmağın değdiği yerde açılır (sol alt bölge)
  // ------------------------------------------------------------------
  const zA = document.createElement('div'), zB = document.createElement('div');
  zA.className = zB.className = 'kdjz'; zA.id = 'kdjzA'; zB.id = 'kdjzB';
  document.body.appendChild(zA); document.body.appendChild(zB);
  let jp = null, home = null;
  function jDown(e) {
    if (typeof touchUI === 'undefined' || !touchUI || !player || player.dead) return;
    if (jp != null) return;
    e.preventDefault(); jp = e.pointerId; try { e.target.setPointerCapture(jp); } catch (er) { }
    const j = $i('joy'); if (!j) return; const r = j.getBoundingClientRect();
    home = { left: j.style.left, top: j.style.top, bottom: j.style.bottom, right: j.style.right };
    j.style.bottom = ''; j.style.right = ''; j.style.left = (e.clientX - r.width / 2) + 'px'; j.style.top = (e.clientY - r.height / 2) + 'px';
    j.classList.add('kdon'); jMove(e);
  }
  function jMove(e) {
    if (e.pointerId !== jp) return; const j = $i('joy'), kn = $i('knob'); if (!j) return;
    const r = j.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy);
    // parmak çok uzaklaşırsa joystick de peşinden kayar (rahat kontrol)
    if (l > R * 1.25) { const k = (l - R * 1.25) / l; j.style.left = (r.left + dx * k) + 'px'; j.style.top = (r.top + dy * k) + 'px'; dx -= dx * k; dy -= dy * k; }
    const ll = Math.hypot(dx, dy), kx = ll > R ? dx / ll * R : dx, ky = ll > R ? dy / ll * R : dy;
    if (kn) kn.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
    const f = Math.min(1, ll / (R * .55));
    joyVec = ll > R * .1 ? { x: dx / (ll || 1) * f, y: dy / (ll || 1) * f } : null;
  }
  function jUp(e) {
    if (e.pointerId !== jp) return; jp = null; joyVec = null;
    const j = $i('joy'), kn = $i('knob'); if (kn) kn.style.transform = '';
    if (j) { j.classList.remove('kdon'); if (home) { j.style.left = home.left; j.style.top = home.top; j.style.bottom = home.bottom; j.style.right = home.right; } }
  }
  for (const z of [zA, zB]) { z.addEventListener('pointerdown', jDown); z.addEventListener('pointermove', jMove); z.addEventListener('pointerup', jUp); z.addEventListener('pointercancel', jUp); }

  // ------------------------------------------------------------------
  // 7) PORTRE ANİMASYONU: kafa döner/sallanır, gözler kırpılır (1-2 sn)
  // ------------------------------------------------------------------
  const BLINK = { Cavegirl: 1, Caveman: 1, Hunter: 1, SamuraiBlue: 1, SorcererBlack: 1, SorcererOrange: 1 };
  let porT = 0, porBody = null, porName = '', blinkUntil = 0;
  function porTick(now) {
    const por = $i('h2por'); if (!por || !player || !window.naHeroChar || typeof heroLook !== 'function') return;
    const head = por.querySelector('img'); if (!head) return;
    if (!porBody) { porBody = document.createElement('img'); porBody.className = 'px kdbody'; porBody.alt = ''; head.after(porBody); head.classList.add('kdhead'); }
    const n = naHeroChar(heroLook(player));
    if (n !== porName) { porName = n; porBody.src = 'na/f_' + n + '.png'; }
    if (blinkUntil && now > blinkUntil) { blinkUntil = 0; head.src = 'na/f_' + n + '.png'; }
    if (now < porT) return;
    porT = now + 1000 + Math.random() * 1000;
    const r = Math.random();
    if (BLINK[n] && r < .45) { head.src = 'na/fb_' + n + '.png'; blinkUntil = now + 150; if (Math.random() < .3) setTimeout(() => { head.src = 'na/fb_' + porName + '.png'; blinkUntil = performance.now() + 120; }, 300); }
    const mv = ['kdlookL', 'kdlookR', 'kdnod', 'kdtilt'][Math.floor(Math.random() * 4)];
    head.classList.remove('kdlookL', 'kdlookR', 'kdnod', 'kdtilt'); void head.offsetWidth; head.classList.add(mv);
  }

  // ------------------------------------------------------------------
  // 8) DURUM PANELLERİ: değer değişince zıplar, can azalınca kalp hızlanır
  // ------------------------------------------------------------------
  const lastV = {};
  function pop(sel) { const e = document.querySelector(sel); if (!e) return; e.classList.remove('kdpop'); void e.offsetWidth; e.classList.add('kdpop'); }
  function statTick() {
    const p = player; if (!p || !p.stats) return; const s = p.stats;
    const v = { lvl: p.lvl, atk: Math.round(s.atk || 0), def: Math.round(s.def || 0), mhp: s.maxHp };
    if (lastV.lvl != null) { if (v.lvl !== lastV.lvl) pop('#h2lvl .a'); if (v.atk !== lastV.atk) pop('#h2atk .b'); if (v.def !== lastV.def) pop('#h2def .b'); if (v.mhp !== lastV.mhp) pop('#h2hp .b'); }
    Object.assign(lastV, v);
    const hp = $i('h2hp'); if (hp) hp.classList.toggle('kdlow', p.hp / s.maxHp < .3);
    for (const e of document.querySelectorAll('.kdoto')) { const val = p[e.dataset.k] || 0; const t = val ? 'OTO' : ''; if (e.textContent !== t) e.textContent = t; }
    if (otoB) otoB.classList.toggle('on', !!p.autoFight);
    for (const i of document.querySelectorAll('input[data-auto]')) { const k = i.dataset.auto; if (document.activeElement !== i && +i.value !== (p[k] || 0)) { i.value = p[k] || 0; i.style.setProperty('--v', ((p[k] || 0) / 90 * 100) + '%'); const v = i.parentNode.querySelector('[data-autov]'); if (v) v.textContent = p[k] ? '%' + p[k] : 'Kapalı'; } }
    document.body.classList.toggle('kdtouch', typeof touchUI !== 'undefined' && !!touchUI && !!running);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (typeof running === 'undefined' || !running || !player) return;
    try { porTick(now); statTick(); if (!otoB || !$i('kdOto')) hudExtras(); } catch (e) { }
  }
  requestAnimationFrame(loop);
  window.__kd26tick = function () { porTick(performance.now() + 5000); statTick(); };
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function () { const r = _sg.apply(this, arguments); try { ensureDefaults(player); } catch (e) { } setTimeout(() => { try { hudExtras(); } catch (e) { } }, 0); return r; }; window.startGame = startGame; }
})();
