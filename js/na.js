// ============================================================
//  NINJA ADVENTURE GÖRSELLERİ (CC0 — Pixel-boy & AAA)
//  Oyunun sistemleri aynen kalır; yalnızca çizim katmanı bu
//  hazır görsellere bağlanır. Görsel yüklenmezse eski çizime düşer.
//  - Kahraman: zırh yoksa çıplak (Caveman/Cavegirl), zırh sınıf+kaliteye
//    göre karakter, silah ayrı sprite olarak elde; +7/+8/+9 parlama.
//  - Canavarlar/bosslar, NPC'ler, zemin karoları, ağaç/kaya/çalı, konak.
// ============================================================
(function () {
  const BASE = 'na/';
  const L = {};
  function img(n) { let i = L[n]; if (!i) { i = new Image(); i.src = BASE + n + '.png'; L[n] = i; } return i; }
  const ok = i => i && i.complete && i.naturalWidth > 0;

  // ---------- yön / kare ----------
  // NinjaAdventure sütun sırası: 0=aşağı 1=yukarı 2=sol 3=sağ
  function dirIdx(o) {
    if (o.dir === 'back') return 1;
    if (o.dir === 'side') return (o.face || 1) < 0 ? 2 : 3;
    return 0;
  }
  function frame16(im, col, row, S) { ctx.imageSmoothingEnabled = false; if (im._x) { ctx.drawImage(im, col * 16, row * 19, 16, 19, -8 * S, -19 * S, 16 * S, 19 * S); return; } ctx.drawImage(im, col * 16, row * 16, 16, 16, -8 * S, -16 * S, 16 * S, 16 * S); }
  // uzun kol/bacaklı karakter sayfası (16x19 kare); yüklenmediyse eski 16x16 sayfa
  function chImg(name) { const x = img('x_' + name); if (ok(x)) { x._x = true; return x; } return img('c_' + name); }

  // ---------- KAMERA: dar ekranda biraz uzaklaş (daha çok harita, daha ince piksel) ----------
  function fitZoom() { try { const w = innerWidth, h = innerHeight, z0 = window.HUD_U || (Math.min(w, h) < 600 ? .7 : 1.05), n = Math.max(1, Math.max(2, Math.round(2 * RS * z0)) + (window.ZOOM_LV || 0)); ZOOM = n / (2 * RS); } catch (e) { } }
  window.naFitZoom = fitZoom;
  addEventListener('resize', fitZoom); fitZoom();
  // FPS koruması: telefon yavaşsa çözünürlüğü 3x'ten 2x'e (gerekirse 1.5x'e) indir
  (function () {
    let last = 0, acc = 0, n = 0, warm = 0;
    function tick(ts) {
      if (last && typeof running !== 'undefined' && running && !document.hidden) {
        const dt = ts - last; if (dt < 200) { warm += dt; if (warm > 2500) { acc += dt; n++; } }
        if (n >= 90) {
          const avg = acc / n; acc = 0; n = 0;
          if (avg > 21 && RS > 1.5) { window.RS_CAP = RS > 2 ? 2 : 1.5; try { resize(); fitZoom(); } catch (e) { } }
        }
      }
      last = ts; requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // ---------- KAHRAMAN ----------
  const CLS_CH = {
    warrior: ['Knight', 'SamuraiBlue', 'KnightGold'],
    mage: ['SorcererOrange', 'SorcererBlack', 'NinjaMageBlack'],
    archer: ['Hunter', 'CamouflageGreen', 'CamouflageRed'],
    assassin: ['NinjaGray', 'NinjaDark', 'NinjaRed'],
    priest: ['Monk', 'Monk2', 'Master'],
  };
  const CLS_W = {
    warrior: ['Sword', 'Sword2', 'BigSword'],
    mage: ['Stick', 'MagicWand', 'MagicWand'],
    archer: ['Bow', 'Bow2', 'Bow2'],
    assassin: ['Sai', 'Katana', 'Ninjaku'],
    priest: ['Stick', 'Book', 'MagicWand'],
  };
  const HS = 3; // şartname: oyuncu/NPC 48 px (karo 32 px) // dünya pikseli / sanat pikseli (karakter ~42 birim boy)
  const GLOW = ['#8fe3ff', '#c77dff', '#ffcf40'];

  let curX = false;
  function weaponGlow(o) { const p = o.wPlus || 0; if (p < 7) return 0; return p === 7 ? .5 + .3 * Math.sin(performance.now() / 300) : p === 8 ? .8 : 1; }
  function armorGlow(o) { const p = o.aPlus || 0; if (p < 7) return 0; return p === 7 ? .5 + .3 * Math.sin(performance.now() / 420) : p === 8 ? .8 : 1; }

  function drawWeapon(o, d, S, atkp) {
    const list = CLS_W[o.cls]; if (!list) return;
    let wn = list[Math.max(0, Math.min(2, o.wGrade || 0))]; if (o.wName && ok(img('w_' + o.wName))) wn = o.wName; const wi = img('w_' + wn);
    if (!ok(wi)) return;
    const bow = wn.indexOf('Bow') === 0;
    const H = [[5, -4], [-5, -5], [-3, -4], [3, -4]][d];
    ctx.save();
    ctx.translate(H[0] * S, (H[1] - (curX ? 2 : 0)) * S);
    let ang = [.3, -.3, -.45, .45][d];
    if (atkp >= 0) { const sw = Math.sin(atkp * Math.PI); ang += (d === 2 ? -1 : 1) * sw * 1.7; }
    const w = wi.naturalWidth, h = wi.naturalHeight, WS = S * .5;
    ctx.imageSmoothingEnabled = false;
    const gl = weaponGlow(o);
    if (gl > 0) { ctx.shadowColor = GLOW[Math.min(2, o.wGrade || 0)]; ctx.shadowBlur = 10 * gl * (typeof RS !== "undefined" ? RS : 1) * 2; }
    if (bow) { ctx.rotate(d === 2 ? Math.PI / 2 : -Math.PI / 2); ctx.drawImage(wi, -w / 2 * WS, -h / 2 * WS, w * WS, h * WS); if (gl > 0) ctx.drawImage(wi, -w / 2 * WS, -h / 2 * WS, w * WS, h * WS); }
    else { ctx.rotate(ang); ctx.drawImage(wi, -w / 2 * WS, -(h - 4) * WS, w * WS, h * WS); if (gl > 0) ctx.drawImage(wi, -w / 2 * WS, -(h - 4) * WS, w * WS, h * WS); }
    ctx.restore();
    // +9 silah kıvılcımları
    if (gl > 0 && (o.wPlus || 0) >= 9) {
      const t = performance.now() / 1000, c = GLOW[Math.min(2, o.wGrade || 0)];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c;
      for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1; ctx.globalAlpha = .55 + .35 * Math.sin(t * 7 + k); ctx.fillRect(H[0] * S + Math.cos(a) * 9 - 1.5, H[1] * S - 14 + Math.sin(a * 1.3) * 10 - 1.5, 3, 3); }
      ctx.restore();
    }
  }

  window.naHeroChar = function (o) { const g = Math.max(0, Math.min(2, o.aGrade || 0)); return o.noA ? (o.gender === 'f' ? 'Cavegirl' : 'Caveman') : (CLS_CH[o.cls] || CLS_CH.warrior)[g]; };
  const _dh = window.drawHero;
  window.drawHero = function (x, y, o) {
    const cls = CLS_CH[o.cls] ? o.cls : 'warrior';
    const g = Math.max(0, Math.min(2, o.aGrade || 0));
    const name = o.noA ? (o.gender === 'f' ? 'Cavegirl' : 'Caveman') : CLS_CH[cls][g];
    const im = chImg(name);
    if (!ok(im)) return; // görsel hazır değil: eski çizime düşme (yükleme ekranı zaten bekletir)
    const S = HS * (o.s || 1); curX = !!im._x;
    const d = dirIdx(o), t = o.anim || 0;
    const atkp = o.atk > 0 ? Math.max(0, Math.min(1, 1 - o.atk / .22)) : -1;
    let row = 0;
    if (atkp >= 0) row = 4; else if (o.moving) row = Math.floor(t * (o.running ? 11 : 8)) % 4;
    ctx.save(); ctx.translate(x, y);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (!o.noShadow) shadow(0, 0, 8 * (o.s || 1), 3 * (o.s || 1));
    const ag = o.noA ? 0 : armorGlow(o);
    if (ag > 0) { // ayak altında parıltı halkası
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .35 * ag; ctx.fillStyle = GLOW[g];
      ctx.beginPath(); ctx.ellipse(0, 0, 15 * (o.s || 1), 6 * (o.s || 1), 0, 0, 7); ctx.fill(); ctx.restore();
    }
    if (o.cast) ctx.translate(0, -Math.sin(o.cast.prog * Math.PI) * 6);
    if (!o.noW && d === 1) drawWeapon(o, d, S, atkp);
    if (ag > 0) {
      ctx.save(); ctx.shadowColor = GLOW[g]; ctx.shadowBlur = 12 * ag * (typeof RS !== "undefined" ? RS : 1) * 2;
      frame16(im, d, row, S); if ((o.aPlus || 0) >= 9) frame16(im, d, row, S); ctx.restore();
    }
    frame16(im, d, row, S);
    if (typeof player !== 'undefined' && player && x === player.x && y === player.y && player._hitFx && gameTime - player._hitFx < .14) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .75; frame16(im, d, row, S); ctx.restore(); }
    if (!o.noW && d !== 1) drawWeapon(o, d, S, atkp);
    ctx.restore();
  };

  // ---------- CANAVARLAR / BOSSLAR ----------
  const MON = {
    slime: ['m', 'Slime'], wolf: ['m', 'Beast2'], bloodwolf: ['m', 'Beast'], goblin: ['m', 'Reptile2'],
    skeleton: ['c', 'Skeleton'], imp: ['m', 'Flam'], spider: ['m', 'SpiderRed'], wraith: ['m', 'Spirit'], golem: ['c', 'Statue'],
    wolfking: ['b', 'GiantRacoon'], goblinchief: ['b', 'GiantBamboo'], skeletonlord: ['b', 'DemonCyclop'],
    varkas: ['b', 'TenguRed'], titan: ['b', 'GiantBlueSamurai'], dragon: ['d', 'Dragon'],
  };
  const BM = { GiantRacoon: [60, 60, 6], GiantBamboo: [62, 62, 6], DemonCyclop: [50, 50, 5], TenguRed: [82, 82, 6], GiantBlueSamurai: [96, 48, 6] };
  // ekrandaki görsel boyu (can barını başın hemen üstüne koymak için)
  const MSZ = { slime: 2.5, spider: 2.5, wolf: 4, bloodwolf: 4, goblin: 4, imp: 4, wraith: 4, skeleton: 3, golem: 6 };
  window.naMonH = function (e) { const m = MON[e.type]; if (!m) return 0; if (m[0] === 'b' || m[0] === 'd') return m[0] === 'd' ? 178 : 160; const top = { slime: 7, spider: 5 }[e.type] || 1; return (16 - top) * (MSZ[e.type] || 4); };
  window.naMon = function (e) {
    const m = MON[e.type]; if (!m) return false;
    const sc = e.d.scale || 1;
    if (m[0] === 'm' || m[0] === 'c') {
      const im = img((m[0] === 'm' ? 'm_' : 'c_') + m[1]); if (!ok(im)) return false;
      const SZ = { slime: 2.5, spider: 2.5, wolf: 4, bloodwolf: 4, goblin: 4, imp: 4, wraith: 4, skeleton: 3, golem: 6 }; const S = SZ[e.type] || 4, d = dirIdx(e); // küçük 40 / orta 64 / büyük 96
      let row = Math.floor((e.anim || 0) * (e.moving ? 8 : 3)) % 4;
      if (m[0] === 'c') { row = e.moving ? Math.floor((e.anim || 0) * 8) % 4 : 0; if (e.atkAnim > .05) row = 4; }
      shadow(0, 0, 5 * S, 2 * S);
      ctx.save();
      if (e.atkAnim > .05 && typeof player !== 'undefined' && player) { const a = Math.atan2(player.y - e.y, player.x - e.x), k = Math.min(1, e.atkAnim * 5) * S * 2; ctx.translate(Math.cos(a) * k, Math.sin(a) * k * .6 - S); }
      if (!e.dead && gameTime - e.hitT < .15 && typeof player !== 'undefined' && player) { const a = Math.atan2(e.y - player.y, e.x - player.x); ctx.translate(Math.round(Math.cos(a) * S * 1.5), Math.round(Math.sin(a) * S)); }
      frame16(im, d, row, S);
      if (!e.dead && typeof gameTime !== 'undefined' && gameTime - e.hitT < .12) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .7; frame16(im, d, row, S); }
      ctx.restore();
      return true;
    }
    if (m[0] === 'b') {
      const im = img('b_' + m[1]); if (!ok(im)) return false;
      const fw = BM[m[1]][0], fh = BM[m[1]][1], n = BM[m[1]][2], S = 160 / fh, /* boss 160 px */ f = Math.floor((e.anim || 0) * 7) % n;
      shadow(0, 0, e.r, e.r * .38);
      ctx.save(); if ((e.face || 1) < 0) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(im, f * fw, 0, fw, fh, -fw / 2 * S, -fh * S, fw * S, fh * S);
      if (!e.dead && gameTime - e.hitT < .12) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .6; ctx.drawImage(im, f * fw, 0, fw, fh, -fw / 2 * S, -fh * S, fw * S, fh * S); }
      ctx.restore();
      return true;
    }
    if (m[0] === 'd') {
      const im = img('b_Dragon'); if (!ok(im)) return false;
      const S = 160 / im.naturalHeight, bob = Math.sin((e.anim || 0) * 2.5) * 6, w = im.naturalWidth * S, h = im.naturalHeight * S;
      shadow(0, 0, 58, 15);
      ctx.save(); if ((e.face || 1) < 0) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(im, Math.round(-w / 2), Math.round(-h - 12 + bob), w, h); ctx.restore();
      return true;
    }
    return false;
  };

  // ---------- NPC'LER ----------
  const NPC_MAP = [['muhtar', 'OldMan'], ['tüccar', 'Noble'], ['tuccar', 'Noble'], ['demirci', 'Villager2'], ['bilge', 'Monk'],
    ['muhafız', 'GladiatorBlue'], ['muhafiz', 'GladiatorBlue'], ['seyis', 'Villager3'], ['zanaat', 'Villager4'], ['lonca', 'Master'],
    ['şifa', 'Monk2'], ['sifa', 'Monk2'], ['komutan', 'Samurai'], ['bekçi', 'GladiatorBlue'], ['kâhin', 'OldMan2'], ['kahin', 'OldMan2'],
    ['prenses', 'Princess'], ['müfettiş', 'Inspector'], ['avcı', 'Hunter'], ['çiftçi', 'Villager5'], ['ciftci', 'Villager5'],
    ['inci', 'Woman'], ['buluşma', 'Villager'], ['etkinlik', 'Princess'],
    ['elder', 'OldMan'], ['guildmaster', 'Master'], ['merchant', 'Noble'], ['blacksmith', 'Villager2'], ['sage', 'Monk'], ['stablemaster', 'Villager3'], ['artisan', 'Villager4'],
    ['guard', 'GladiatorBlue'], ['pearl', 'Woman'], ['party finder', 'Villager'], ['event master', 'Princess'], ['commander', 'Samurai'], ['healer', 'Monk2']];
  const POOL = ['Villager', 'Villager5', 'Woman', 'OldWoman', 'Boy', 'OldMan3', 'Eskimo', 'Inspector'];
  function npcChar(name) {
    const n = (name || '').toLocaleLowerCase('tr');
    for (const [k, v] of NPC_MAP) if (n.includes(k)) return v;
    let s = 0; for (let i = 0; i < n.length; i++) s += n.charCodeAt(i);
    return POOL[s % POOL.length];
  }
  setInterval(function () {
    if (typeof npcs === 'undefined' || !npcs) return;
    for (const n of npcs) if (n && n.look && !n.look._na) n.look._na = npcChar(n.name);
  }, 300);
  const _hum = window.drawHumanoid;
  window.drawHumanoid = function (x, y, o) {
    if (o && o._na) {
      const im = chImg(o._na);
      if (ok(im)) {
        const s = o.s || 1;
        ctx.save(); ctx.translate(x, y); shadow(0, 0, 8 * s, 3 * s);
        frame16(im, (o.face || 1) < 0 && o.moving ? 2 : 0, o.moving ? Math.floor((o.anim || 0) * 8) % 4 : 0, HS * s);
        ctx.restore(); return;
      }
    }
    return _hum.call(this, x, y, o);
  };

  // ---------- EVCİL HAYVANLAR (yoldaşlar) ----------
  // yan görünüm 2 kare (sola bakar) ya da 4 yönlü canavar sayfası
  const PET = { fox: ['side', 2], chick: ['side', 2], bunny: ['side', 2], duckling: ['side', 2], drake: ['dir'], fairy: ['dir'], owl: ['dir'] };
  if (typeof drawPet === 'function') {
    const _dp = window.drawPet;
    window.drawPet = function (pt) {
      const P = PET[pt.id], im = P && img('pet_' + pt.id);
      if (!P || !ok(im)) return _dp(pt);
      ctx.save(); ctx.translate(pt.x, pt.y); ctx.imageSmoothingEnabled = false;
      const t = pt.anim || 0, fly = pt.id === 'fairy' || pt.id === 'owl' || pt.id === 'drake';
      shadow(0, 0, 7, 2.5);
      if (fly) ctx.translate(0, -6 + Math.round(Math.sin(t * 4) * 2));
      if (P[0] === 'side') {
        const fw = im.naturalWidth / 2, fh = im.naturalHeight, f = pt.moving ? Math.floor(t * 8) % 2 : Math.floor(t * 1.5) % 2;
        if ((pt.face || 1) > 0) ctx.scale(-1, 1);
        ctx.drawImage(im, f * fw, 0, fw, fh, -fw, -fh * 2, fw * 2, fh * 2);
      } else {
        const d = (pt.face || 1) < 0 ? 2 : 3, row = Math.floor(t * (pt.moving ? 8 : 4)) % 4;
        frame16(im, d, row, 2);
      }
      ctx.restore();
    };
  }

  // ---------- ZEMİN ----------
  const GKEYS = ['grass', 'forest', 'sand', 'plaza', 'path', 'rdirt', 'camp', 'ruin', 'dfloor', 'dwall', 'water'];
  const ground = img('ground');
  ground.addEventListener('load', function () { try { chunkRS = -999; } catch (e) { } try { chunkCache.clear(); } catch (e) { } });
  function gRow(t) {
    switch (t) {
      case T.GRASS: return 0; case T.FOREST: return 1; case T.SAND: return 2; case T.PLAZA: return 3;
      case T.PATH: return 4; case T.RDIRT: return 5; case T.CAMP: return 6; case T.RUIN: return 7;
      case T.DFLOOR: return 8; case T.DWALL: return 9; case T.WATER: return 10; default: return -1;
    }
  }
  const flowerA = img('p_flower'), flowerB = img('p_flower2');
  const edges = img('edges'); edges.addEventListener('load', function () { try { chunkRS = -999; } catch (e) { } try { chunkCache.clear(); } catch (e) { } });
  const _dt = window.drawTile;
  window.drawTile = function (tx, ty) {
    const m = M, i = ty * m.W + tx, t = m.tiles[i], r = gRow(t);
    if (r < 0 || !ok(ground)) return _dt(tx, ty);
    const v = (m.tvar[i] || 0) & 3, sx = tx * TILE, sy = ty * TILE;
    // su: çoğunlukla düz su, ara sıra nilüfer/balık
    // yumuşak kenarlar: çim/orman/kum, farklı zeminle komşuysa paketin yuvarlak kenar parçasıyla çizilir
    const er = t === T.GRASS ? 0 : t === T.FOREST ? 1 : t === T.SAND ? 2 : -1;
    if (er >= 0 && ok(edges)) {
      const nb = (x, y) => { if (x < 0 || y < 0 || x >= m.W || y >= m.H) return -1; const nt = m.tiles[y * m.W + x];
        if (gRow(nt) < 0) return -1;
        if (er < 2) return (nt === T.GRASS || nt === T.FOREST) ? -1 : nt;
        return nt === T.WATER ? nt : -1; };
      const N = nb(tx, ty - 1), Sd = nb(tx, ty + 1), Wd = nb(tx - 1, ty), E = nb(tx + 1, ty);
      if (N >= 0 || Sd >= 0 || Wd >= 0 || E >= 0) {
        const n = N >= 0, s = Sd >= 0, w = Wd >= 0, e = E >= 0;
        const ix = n && w ? 0 : n && e ? 2 : s && w ? 6 : s && e ? 8 : n ? 1 : s ? 7 : w ? 3 : 5;
        const base = n ? N : s ? Sd : w ? Wd : E;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(ground, 0, gRow(base) * 16, 16, 16, sx, sy, TILE, TILE);
        ctx.drawImage(edges, ix * 16, er * 16, 16, 16, sx, sy, TILE, TILE);
        const d0 = m.deco[i]; if (d0 === D.FLOWER) { const f = v & 1 ? flowerB : flowerA; if (ok(f)) ctx.drawImage(f, sx + 8, sy + 8, 16, 16); }
        return;
      }
    }
    const vv = t === T.WATER ? (((tx * 7 + ty * 13) % 11) === 0 ? 2 : ((tx * 5 + ty * 3) % 17) === 0 ? 3 : 0) : v;
    ctx.imageSmoothingEnabled = false; // önbellek tuvalinde varsayılan açık -> karo kenarında açık renk çizgi oluşuyordu
    ctx.drawImage(ground, vv * 16, r * 16, 16, 16, sx, sy, TILE, TILE);
    const d = m.deco[i];
    if (d === D.FLOWER) { const f = v & 1 ? flowerB : flowerA; if (ok(f)) ctx.drawImage(f, sx + 8, sy + 8, 16, 16); }
    else if (d === D.CRYSTAL && ok(img('ws_gem' + (v & 3)))) { ctx.imageSmoothingEnabled = false; const gi = img('ws_gem' + (v & 3)); ctx.drawImage(gi, sx + 16 - gi.naturalWidth, sy + 26 - gi.naturalHeight * 2, gi.naturalWidth * 2, gi.naturalHeight * 2); }
    else if (d === D.BONE && ok(img('ws_bone'))) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(sx + 16, sy + 18); ctx.rotate(1.2 + v * .7); const bi = img('ws_bone'); ctx.drawImage(bi, -bi.naturalWidth, -bi.naturalHeight, bi.naturalWidth * 2, bi.naturalHeight * 2); ctx.restore(); }
    else if (d === D.CRYSTAL) { const g = .6 + Math.sin(gameTime * 3 + tx) * .3; ctx.fillStyle = 'rgba(200,120,255,' + g + ')'; ctx.beginPath(); ctx.moveTo(sx + 16, sy + 6); ctx.lineTo(sx + 22, sy + 20); ctx.lineTo(sx + 16, sy + 26); ctx.lineTo(sx + 10, sy + 20); ctx.closePath(); ctx.fill(); }
    else if (d === D.BONE) { ctx.fillStyle = '#d8d2c0'; ctx.save(); ctx.translate(sx + 16, sy + 18); ctx.rotate(v * .8); ctx.fillRect(-7, -1.2, 14, 2.4); circle(-7, -1.5, 2); circle(-7, 1.5, 2); circle(7, -1.5, 2); circle(7, 1.5, 2); ctx.restore(); }
  };

  // ---------- AĞAÇ / KAYA / ÇALI ----------
  const _dd = window.drawDeco;
  window.drawDeco = function (d, x, y, v) {
    let im = null, S = 2.5, fade = false;
    switch (d) {
      case D.TREE: im = img(v & 1 ? 'p_tree2' : 'p_tree'); fade = true; S = 3; break;
      case D.PINE: im = img('p_pine'); fade = true; S = 3; break;
      case D.DEAD: im = img('p_dead'); S = 3; break;
      case D.ROCK: im = img('p_rock'); S = 2; break;
      case D.BUSH: im = img(v === 2 ? 'p_bush2' : 'p_bush'); S = 2; break;
      case D.PALI: im = img('p_fence'); S = 2; break;
    }
    if (!im || !ok(im)) return _dd(d, x, y, v);
    const w = im.naturalWidth * S, h = im.naturalHeight * S;
    ctx.save();
    if (fade && typeof treeFade === 'function') ctx.globalAlpha *= treeFade(x, y, w * .5, h);
    shadow(x, y, w * .38, w * .13);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(im, Math.round(x - w / 2), Math.round(y - h + 3), w, h);
    ctx.restore();
  };

  // ---------- KÖY KONAĞI (büyük ev) ----------
  const _db = window.drawBuilding;
  window.drawBuilding = function (b) {
    if (b.tent || b.type === 'keep' || b.type === 'fountain') return _db(b);
    const kon = img('h_konak'), h2 = img('h_2f'), hs = img('h_stone'), tr = img('p_tree'), tr2 = img('p_tree2');
    if (!ok(kon) || !ok(h2) || !ok(hs)) return _db(b);
    const x = b.x * TILE, y = b.y * TILE, W = b.w * TILE, bottom = (b.y + b.h) * TILE;
    const blit = (im, cx, by, S) => { const w = im.naturalWidth * S, h = im.naturalHeight * S; ctx.imageSmoothingEnabled = false; ctx.drawImage(im, Math.round(cx - w / 2), Math.round(by - h), w, h); return w; };
    if (b.w >= 9) {
      // arka bahçe ağaçları (binanın arkası)
      if (ok(tr) && ok(tr2)) for (let k = 0; k < 4; k++) { const tx = x + W * (k + .5) / 4; shadow(tx, y + 92, 24, 7); blit(k & 1 ? tr2 : tr, tx, y + 96, 2); }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 6, bottom - 6, W - 4, 10);
      const side = 2 * 48; // yan evler 3 karo genişlik
      blit(h2, x + side / 2, bottom, 2);
      blit(hs, x + W - side / 2, bottom, 2);
      blit(kon, x + W / 2, bottom, (W - 2 * side) / kon.naturalWidth);
    } else {
      const im = b.w <= 3 ? hs : h2, S = W / im.naturalWidth;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 6, bottom - 6, W - 4, 10);
      blit(im, x + W / 2, bottom, S);
    }
  };
})();
