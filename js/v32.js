'use strict';
// =====================================================================
//  SÜRÜM 32 — kalan eski (elle çizilmiş) görseller NinjaAdventure paketine
//  • Çiftlik binekleri (inek, domuz, eşek, aslanlar, yaban domuzu, kurbağa, kara panter)
//  • Kaynak noktaları, sandık, anahtar, kamp ateşi, meşale, çadır, geçit kemeri
//  • Lamba, mezar, sütun, kalıntı duvarı, yerdeki ganimetler, özel düşenler
//  Görsel yüklenmezse her parça eski çizime düşer (altyapı korunur).
// =====================================================================
(function () {
  const IM = {};
  const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; };
  const ok = i => i && i.complete && i.naturalWidth > 0;
  const blit = (im, x, y, S, ax, ay) => { const w = im.naturalWidth * S, h = im.naturalHeight * S; ctx.imageSmoothingEnabled = false; ctx.drawImage(im, Math.round(x - w * (ax == null ? .5 : ax)), Math.round(y - h * (ay == null ? 1 : ay)), Math.round(w), Math.round(h)); return [w, h]; };

  // ---------------- ÇİFTLİK BİNEKLERİ ----------------
  if (window.kdMT) Object.assign(kdMT, {
    cow: { side: 'mt_cow', n: 2, S: 3, h: 28, f: 'mtf_cow', b: 'mtb_cow', fh: 24 },
    donkey: { side: 'mt_donkey', n: 2, S: 3, h: 27, f: 'mtf_donkey', b: 'mtb_donkey', fh: 22 },
    sheep: { side: 'mt_sheep', n: 2, S: 2.6, h: 26, f: 'mtf_sheep', fh: 30 },
    llama: { side: 'mt_llama', n: 2, S: 2.6, h: 26, f: 'mtf_llama', fh: 30 },
    goat: { side: 'mt_goat', n: 2, S: 3.2, h: 26 },
    duck: { side: 'mt_duck', n: 2, S: 3.6, h: 26 },
    panther: { side: 'mt_panther', n: 2, S: 3.6, h: 28 },
    pig: { side: 'mt_pig', n: 2, S: 3.4, h: 26 },
  });
  if (window.kdPIC) Object.assign(kdPIC, {
    '🐄': ['mt_cow', 2, 1], '🐖': ['mt_pig', 2, 1], '🐑': ['mt_sheep', 2, 1], '🐐': ['mt_goat', 2, 1], '🦙': ['mt_llama', 2, 1], '🫏': ['mt_donkey', 2, 1],
    '🦆': ['mt_duck', 2, 1], '🐆': ['mt_panther', 2, 1], '🐤': ['pet_chick', 2, 1], '🐰': ['pet_bunny', 2, 1], '🐥': ['pet_duckling', 2, 1],
  });
  // paketinde karşılığı olmayan türler en yakın hayvanla değiştirildi → adları da görsele uyduruldu
  if (typeof MOUNTS !== 'undefined') {
    const RN = { sheep: ['Ak Aslan', 'Bembeyaz yeleli, sakin ama güçlü bir aslan.'], llama: ['Sarı Aslan', 'Altın yeleli, mağrur bir savana aslanı.'],
      goat: ['Yaban Domuzu', 'Çalılıkları yararak koşan inatçı bir yaban domuzu.'], duck: ['Dev Kurbağa', 'Zıplaya zıplaya hızla koşturur.'],
      panther: ['Kara Panter', 'Gölgeler kadar sessiz, çevik bir kara kedi.'] };
    for (const k in RN) if (MOUNTS[k]) { MOUNTS[k].n = RN[k][0]; MOUNTS[k].desc = RN[k][1]; }
  }

  // ---------------- KAYNAK NOKTALARI ----------------
  const NODE = { wood: ['ws_wood', 2], ore: ['ws_ore', 3], herb: ['ws_herb', 2.6], crystal: ['ws_crystal', 3] };
  if (typeof drawNode === 'function') {
    const _dn = drawNode;
    drawNode = function (n) {
      const d = NODE[n.type] || NODE.crystal, im = img(d[0]); if (!ok(im)) return _dn.apply(this, arguments);
      ctx.save(); if (!n.ready) ctx.globalAlpha = .35;
      shadow(n.x, n.y, im.naturalWidth * d[1] * .42, 4);
      if (n.ready && n.type === 'crystal') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDot(n.x, n.y - 18, 26, '#c070ff', .25 + .1 * Math.sin(gameTime * 3 + n.x)); ctx.restore(); }
      blit(im, n.x, n.y + 2, d[1]);
      ctx.restore();
    };
  }

  // ---------------- SANDIK / ANAHTAR ----------------
  if (typeof drawChest === 'function') {
    const _dc = drawChest;
    drawChest = function (c, locked) {
      const big = c.tier >= 2, im = img(big ? 'ws_BigTreasureChest' : 'ws_LittleTreasureChest'); if (!ok(im)) return _dc.apply(this, arguments);
      const col = KEY_T[c.tier].col, x = c.x, y = c.y;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDot(x, y - 12, 46, col, .4); ctx.restore();
      shadow(x, y, 20, 5);
      const fw = im.naturalWidth / 2, fh = im.naturalHeight, S = 3, bob = Math.round(Math.sin(gameTime * 2) * 1);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(im, 0, 0, fw, fh, Math.round(x - fw * S / 2), Math.round(y - fh * S + bob), fw * S, fh * S);
      if (c.tier === 1 || c.tier === 0) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.restore(); }
      if (locked) label(x, y - 52, KEY_T[c.tier].n + ' Sandık (kilitli)', col, 11);
    };
  }
  if (typeof drawKeyItem === 'function') {
    const _dk = drawKeyItem;
    drawKeyItem = function (k) {
      const im = img(k.tier >= 2 ? 'ws_GoldKey' : 'ws_SilverKey'); if (!ok(im)) return _dk.apply(this, arguments);
      const x = k.x, y = k.y - 10 + Math.sin(gameTime * 3) * 3, col = KEY_T[k.tier].col;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, y - 120, 0, y); g.addColorStop(0, hexA(col, 0)); g.addColorStop(1, hexA(col, .45)); ctx.fillStyle = g; ctx.fillRect(x - 5, y - 120, 10, 120); softDot(x, y, 22, col, .5); ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(gameTime * 2) * .3);
      if (k.tier === 0) ctx.filter = 'sepia(1) saturate(2.2) hue-rotate(-10deg)';
      blit(im, 0, 0, 3, .5, .5); ctx.restore();
      label(x, y - 24, KEY_T[k.tier].n + ' Anahtar', col, 11);
    };
  }

  // ---------------- YERDEKİ ÖZEL DÜŞENLER (kaynak, pet, binek) ----------------
  const RESI = { wood: 'ii_Branch', ore: 'ii_BarIron', herb: 'ii_Grass', crystal: 'ii_GemPurple' };
  if (typeof drawSpecial === 'function') {
    const _ds = drawSpecial;
    drawSpecial = function (l) {
      const b = Math.sin(gameTime * 4 + l.bob) * 2, x = l.x, y = l.y - 6 + b;
      let im, fr = 1;
      if (l.kind === 'res') im = img(RESI[l.val]);
      else if (l.kind === 'pet') { im = img('pet_' + l.val); fr = l.val === 'fox' || l.val === 'chick' || l.val === 'bunny' || l.val === 'duckling' ? 2 : 4; }
      else { const m = window.kdMT && kdMT[l.val]; im = m && img(m.dir4 || m.side); fr = m && m.dir4 ? 4 : (m && m.n) || 2; }
      if (!im || !ok(im)) return _ds.apply(this, arguments);
      if (l.kind !== 'res') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDot(x, y, 22, '#ffd040', .5); ctx.restore(); }
      const fw = im.naturalWidth / fr, fh = l.kind === 'res' ? im.naturalHeight : Math.min(im.naturalHeight, fw === 16 && fr === 4 ? 16 : im.naturalHeight), S = l.kind === 'res' ? 1.6 : 2;
      ctx.imageSmoothingEnabled = false; ctx.drawImage(im, 0, 0, fw, fh, Math.round(x - fw * S / 2), Math.round(y - fh * S / 2), Math.round(fw * S), Math.round(fh * S));
    };
  }

  // ---------------- KAMP ATEŞİ (taş çukur + paketin alev animasyonu) ----------------
  if (typeof drawFire === 'function') {
    const _df = drawFire;
    drawFire = function (f) {
      const pit = img('ws_pit'), fl = img('fx_flam'); if (!ok(pit) || !ok(fl)) return _df.apply(this, arguments);
      const x = f.x, y = f.y, t = gameTime;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDot(x, y - 12, 60 + Math.sin(t * 7) * 4, '#ff9a30', .28); ctx.restore();
      blit(pit, x, y + 10, 1.6, .5, 1);
      const n = Math.max(1, Math.round(fl.naturalWidth / 25)), fr = Math.floor(t * 12 + x) % n;
      ctx.imageSmoothingEnabled = false; ctx.drawImage(fl, fr * 25, 0, 25, 30, Math.round(x - 19), Math.round(y - 42), 38, 45);
    };
  }
  // meşale → paketin yanan kaidesi
  if (typeof drawTorch === 'function') {
    const _dt = drawTorch;
    drawTorch = function (tc) {
      const im = img('ws_brazier'); if (!ok(im)) return _dt.apply(this, arguments);
      shadow(tc.x, tc.y + 4, 9, 3); blit(im, tc.x, tc.y + 6, 2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDot(tc.x, tc.y - 14, 16 + Math.sin(gameTime * 12 + tc.x) * 2, '#ffd080', .45); ctx.restore();
    };
  }
  // çadır
  if (typeof drawTent === 'function') {
    const _dte = drawTent;
    drawTent = function (b) {
      const im = img((b.x + b.y) % 2 ? 'ws_tent2' : 'ws_tent1'); if (!ok(im)) return _dte.apply(this, arguments);
      const x = (b.x + b.w / 2) * TILE, bottom = (b.y + b.h) * TILE, S = (b.w * TILE + 8) / im.naturalWidth;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(b.x * TILE + 2, bottom - 6, b.w * TILE, 9);
      blit(im, x, bottom + 2, S);
    };
  }
  // geçit kemeri (taş kemer)
  if (typeof drawPortalArch === 'function') {
    const _dpa = drawPortalArch;
    drawPortalArch = function (p) {
      const im = img('ws_arch'); if (!ok(im)) return _dpa.apply(this, arguments);
      if (p.col && /^#[0-9a-f]{6}$/i.test(p.col)) { const g = ctx.createLinearGradient(0, p.y - 60, 0, p.y); g.addColorStop(0, hexA(p.col, 0)); g.addColorStop(1, hexA(p.col, .55 + .15 * Math.sin(gameTime * 3))); ctx.fillStyle = g; ctx.fillRect(p.x - 20, p.y - 52, 40, 52); }
      blit(im, p.x, p.y + 4, 1.4);
    };
  }

  // ---------------- HARİTA SÜSLERİ: lamba, mezar, sütun, kalıntı duvarı ----------------
  if (typeof drawDeco === 'function' && typeof D !== 'undefined') {
    const _dd = drawDeco;
    const DM = {}; DM[D.LAMP] = ['ws_lamp', 2.4]; DM[D.TOMB] = ['ws_tomb', 2.6]; DM[D.PILLAR] = ['ws_pillar', 3]; DM[D.RWALL] = ['ws_rwall', 2.4];
    drawDeco = function (d, x, y, v) {
      const m = DM[d]; if (!m) return _dd.apply(this, arguments);
      const im = img(m[0]); if (!ok(im)) return _dd.apply(this, arguments);
      ctx.save(); shadow(x, y, im.naturalWidth * m[1] * .4, 4);
      blit(im, x + (d === D.LAMP ? 6 : 0), y + 3, m[1]);
      if (d === D.LAMP) { ctx.globalCompositeOperation = 'lighter'; softDot(x + 6 + im.naturalWidth * m[1] * .25, y - im.naturalHeight * m[1] * .52, 18, '#ffd080', .35 + .08 * Math.sin(gameTime * 5 + x)); }
      ctx.restore();
    };
  }

  // ---------------- YERDEKİ GANİMET ----------------
  const MATI = { up: 'ii_Scroll', luck: 'ii_ScrollPlant', prot: 'ii_ScrollIce', ench: 'ii_ScrollThunder' };
  window.kdLoot = function (l) {
    const b = Math.sin(gameTime * 4 + l.bob) * 2;
    let im = null, S = 2;
    if (l.kind === 'gold') { im = img('ws_GoldCoin'); S = 1.6; }
    else if (l.kind === 'potHp') im = img('ii_LifePot');
    else if (l.kind === 'potMp') im = img('ii_WaterPot');
    else if (l.kind === 'mat') im = img(MATI[l.val] || 'ii_Scroll');
    else if (l.kind === 'gear' || (l.val && l.val.slot)) {
      // eşya: kalite rengi ışık sütunu + küçük kese
      const g = l.val.grade, c = GRADES[g].col; if (g > 0) { ctx.fillStyle = c + (g === 2 ? '55' : '40'); ctx.fillRect(l.x - 3, l.y - 64, 6, 62); }
      im = img('ii_Bag'); S = 1.8;
      if (!ok(im)) return false; shadow(l.x, l.y, 8, 3); blit(im, l.x, l.y + b, S);
      ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.globalAlpha = .9; ctx.beginPath(); ctx.ellipse(l.x, l.y, 11, 4, 0, 0, 7); ctx.stroke(); ctx.restore();
      return true;
    }
    if (!im || !ok(im)) return false;
    if (l.kind === 'mat') { ctx.fillStyle = (MATS[l.val] ? MATS[l.val].col : '#fff') + '40'; ctx.fillRect(l.x - 2, l.y - 46, 4, 40); }
    shadow(l.x, l.y, 7, 2.5); blit(im, l.x, l.y + b, S);
    return true;
  };

  // ---------------- YETENEK SİMGELERİ: emoji yerine paketin piksel simgeleri ----------------
  function skIconize(root) {
    if (!root || typeof player === 'undefined' || !player || typeof SKILLS === 'undefined') return;
    const list = SKILLS[player.cls] || []; const map = {}; for (const sk of list) map[sk.ic] = sk.id;
    const walk = el => { for (const n of [...el.childNodes]) {
      if (n.nodeType === 3) { const t = n.textContent.trim(); const id = map[t]; if (id) { const im = document.createElement('img'); im.className = 'skimg'; im.src = 'na/sk_' + id + '.png'; im.alt = ''; n.replaceWith(im); } }
      else if (n.nodeType === 1 && !n.classList.contains('skimg') && n.tagName !== 'BUTTON') walk(n); } };
    walk(root);
  }
  window.kdSkIconize = skIconize;
  if (typeof buildBar === 'function') { const _bb = buildBar; buildBar = function () { const r = _bb.apply(this, arguments); try { for (const id of ['sl_s0', 'sl_s1', 'sl_s2']) skIconize(document.getElementById(id)); } catch (e) { } return r; }; }
  if (typeof renderSkills === 'function') { const _rs = renderSkills; renderSkills = function () { const r = _rs.apply(this, arguments); try { skIconize(document.getElementById('skills')); } catch (e) { } return r; }; }

  // ---------------- GİRİŞ EKRANI: sınıf kartlarında paketin karakter yüzleri ----------------
  const CLSF = { warrior: 'Knight', mage: 'SorcererOrange', archer: 'Hunter', priest: 'Monk' };
  function startFaces() { document.querySelectorAll('#start .cls[data-c]').forEach(c => { const ic = c.querySelector('.ic'); const f = CLSF[c.dataset.c]; if (ic && f && !ic.querySelector('img')) ic.innerHTML = '<img src="na/f_' + f + '.png" alt="">'; }); }
  if (typeof showStart === 'function') { const _ss = showStart; showStart = function () { const r = _ss.apply(this, arguments); try { startFaces(); } catch (e) { } return r; }; }
  startFaces(); new MutationObserver(startFaces).observe(document.getElementById('start'), { childList: true, subtree: true });
})();
