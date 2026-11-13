// ============================================================
//  PAKET ENTEGRASYONU + ANİMASYON
//  Satın alınan paketler (Simple 2D Cute Characters + Monsters
//  Creatures Fantasy 2). Karakterler KATMANLI çizilir (gövde + sol/sağ
//  ayak); yürürken bacaklar sallanır, gövde zıplar, yöne göre çevrilir.
//  Görsel yüklenmemişse eski prosedürel çizime düşer.
// ============================================================
(function () {
  const P = window.PAKET || { chars: {}, mons: {} };
  const PL = window.PAKET_L || {};
  const MO = {};
  function loadMap(src, into) { for (const k in src) { const im = new Image(); im.src = src[k]; into[k] = im; } }
  loadMap(P.mons, MO);

  // katmanlı karakter görsellerini yükle
  const LIMG = {};
  for (const k in PL) {
    const L = PL[k], o = { body: new Image(), lf: new Image(), rf: new Image() };
    o.body.src = L.body; o.lf.src = L.lf; o.rf.src = L.rf;
    LIMG[k] = o;
  }
  const okp = im => im && im.complete && im.naturalWidth > 0;

  // sınıf -> karakter
  const CLASS2CHAR = { warrior: 'warrior', mage: 'wizard', archer: 'archer', assassin: 'ninja' };

  // NPC adı -> karakter
  function npcChar(name) {
    const n = (name || '').toLocaleLowerCase('tr');
    if (n.includes('demir') || n.includes('zanaat')) return 'cave_man';
    if (n.includes('tücc') || n.includes('tucc') || n.includes('satı') || n.includes('pazar')) return 'pirate';
    if (n.includes('lonca')) return 'soldier';
    if (n.includes('muhtar') || n.includes('reis')) return 'monk';
    if (n.includes('bilge') || n.includes('kâhin') || n.includes('kahin') || n.includes('büyü')) return 'wizard';
    if (n.includes('muhaf') || n.includes('komutan') || n.includes('asker') || n.includes('bekç') || n.includes('bekc') || n.includes('nöbet')) return 'soldier';
    if (n.includes('seyis') || n.includes('avcı') || n.includes('avci')) return 'archer';
    if (n.includes('şifa') || n.includes('sifa') || n.includes('rahip') || n.includes('keşiş')) return 'monk';
    const pool = ['pirate', 'monk', 'clown', 'soldier', 'archer', 'cave_man'];
    let s = 0; for (let i = 0; i < n.length; i++) s += n.charCodeAt(i);
    return pool[s % pool.length];
  }

  // canavar draw tipi -> paket canavarı
  const DRAW2MON = { slime: 'slime', wolf: 'rat', imp: 'bat', spider: 'rat', wraith: 'bat', golem: 'mimic', dragon: 'mimic' };

  // ---------- KATMANLI KARAKTER ÇİZİMİ (animasyonlu) ----------
  // ctx halihazırda varlık konumuna taşınmış; ayak y=0, gövde yukarı.
  function drawFoot(img, piv, ox, oy, dw, dh, sc, angDeg, alpha) {
    if (!okp(img)) return;
    const px = ox + piv[0] * sc, py = oy + piv[1] * sc;
    ctx.save();
    if (alpha != null) ctx.globalAlpha *= alpha;
    ctx.translate(px, py); ctx.rotate(angDeg * Math.PI / 180); ctx.translate(-px, -py);
    ctx.drawImage(img, ox, oy, dw, dh);
    ctx.restore();
  }
  // key: karakter anahtarı, dispH: ekran yüksekliği, o: {face,anim,moving,running,alpha}
  function drawCharAnim(key, dispH, o) {
    const L = PL[key], IM = LIMG[key];
    if (!L || !IM || !okp(IM.body)) return false;
    const sc = dispH / L.h, dw = L.w * sc, dh = dispH;
    const ox = -dw / 2, oy = -dh;
    const t = o.anim || 0, moving = o.moving;
    const ph = t * (o.running ? 13 : 9.5);
    const sw = moving ? Math.sin(ph) : 0;
    const legAng = sw * (o.running ? 26 : 20);         // derece
    const bob = moving ? -Math.abs(Math.sin(ph)) * (dispH * 0.06) : Math.sin(t * 2.2) * (dispH * 0.016);

    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
    ctx.save();
    const face = o.face || 1; if (face < 0) ctx.scale(-1, 1);
    const a = o.alpha;
    // ayaklar (zıt faz)
    drawFoot(IM.lf, L.lp, ox, oy, dw, dh, sc, legAng, a);
    drawFoot(IM.rf, L.rp, ox, oy, dw, dh, sc, -legAng, a);
    // gövde (zıplamalı)
    ctx.save();
    if (a != null) ctx.globalAlpha *= a;
    ctx.translate(0, bob);
    ctx.drawImage(IM.body, ox, oy, dw, dh);
    ctx.restore();
    ctx.restore();
    ctx.imageSmoothingEnabled = sm;
    return true;
  }

  function blitMon(img, wWidth, face, e) {
    if (!okp(img)) return false;
    const asp = img.naturalWidth / img.naturalHeight, w = wWidth, h = w / asp;
    const bob = Math.sin((performance.now() / 320) + (e ? (e.x + e.y) * 0.02 : 0)) * h * 0.05; // hafif nefes/süzülme
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.save(); if (face && face < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h + bob, w, h);
    ctx.restore(); ctx.imageSmoothingEnabled = sm;
    return true;
  }

  // ---------- KAHRAMAN / OYUNCU / BOT / PvP ----------
  const _drawHero = window.drawHero;
  window.drawHero = function (x, y, o) {
    const key = CLASS2CHAR[o.cls] || 'warrior';
    if (PL[key] && okp(LIMG[key] && LIMG[key].body)) {
      const s = o.s || 1;
      ctx.save(); ctx.translate(x, y);
      if (!o.noShadow && typeof shadow === 'function') shadow(0, 0, 12 * s, 4.5 * s);
      ctx.scale(s, s);
      drawCharAnim(key, 52, o);
      ctx.restore();
      return;
    }
    return _drawHero.call(this, x, y, o);
  };

  // ---------- NPC'ler (yalnızca _sprite'lı çağrılarda) ----------
  const _drawHumanoid = window.drawHumanoid;
  window.drawHumanoid = function (x, y, o) {
    if (o && o._sprite && PL[o._sprite]) {
      const s = o.s || 1;
      ctx.save(); ctx.translate(x, y);
      if (typeof shadow === 'function') shadow(0, 0, 11 * s, 4.2 * s);
      ctx.scale(s, s);
      drawCharAnim(o._sprite, 50, o);
      ctx.restore();
      return;
    }
    return _drawHumanoid.call(this, x, y, o);
  };

  // NPC'lere sprite etiketi ata
  setInterval(function () {
    if (typeof npcs === 'undefined' || !npcs) return;
    for (const n of npcs) { if (n && n.look && !n.look._sprite) n.look._sprite = npcChar(n.name); }
  }, 400);

  // ---------- CANAVARLAR ----------
  function wrapMon(fnName, monKey) {
    const orig = window[fnName];
    window[fnName] = function (e) {
      const img = MO[monKey];
      if (okp(img)) { if (blitMon(img, (e.r || 14) * 2.8, e.face || 1, e)) return; }
      return orig.call(this, e);
    };
  }
  wrapMon('drawSlime', 'slime');
  wrapMon('drawWolf', 'rat');
  wrapMon('drawImp', 'bat');
  wrapMon('drawSpider', 'rat');
  wrapMon('drawWraith', 'bat');
  wrapMon('drawGolem', 'mimic');
  wrapMon('drawDragon', 'mimic');
})();
