'use strict';
// =====================================================================
//  CANAVAR ÇEŞİTLERİ (Sürüm 39) — NinjaAdventure paketindeki TÜM canavarlar
//  • Her yeni canavar bir "aile"nin çeşididir (balçık, kurt, goblin, iskelet, ifrit,
//    kan kurdu, golem, örümcek, hayalet). Davranışı ailesinden gelir; adı, görseli,
//    boyu ve değerleri kendine özgüdür. Görevlerde ailesinin sayısına eklenir.
//  • Kullanılmayan bosslar her bölgede nadir "★ Dev" canavar olarak doğar.
//  • Haritadaki doğma noktalarının ~%70'i rastgele bir çeşide dönüşür (her haritada).
// =====================================================================
(function () {
  const IM = {};
  const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; };
  // v55: yeni canavar görselleri tek atlasta (na/v55atlas.png) — yüklenince parçalara ayrılır
  (function () { const A = {"mvx_CrimsonMole":[0,0,64,64],"mvx_EmberRacoon":[0,65,64,64],"mvx_EmberSpirit":[0,130,64,64],"mvx_FrostKappa":[0,195,64,64],"mvx_FrostOctopus":[0,260,64,64],"mvx_GoldSkull":[0,325,64,64],"mvx_GoldSnake":[0,390,64,64],"mvx_IceBear":[0,455,64,64],"mvx_NightMushroom":[0,520,64,64],"mvx_ShadowCyclope":[0,585,64,64],"mvx_SnowOwl":[0,650,64,64],"mvx_VenomReptile":[0,715,64,64],"an_CatCyclop":[0,780,32,16],"an_Frog":[0,797,32,16],"an_Hyena":[0,814,28,13],"an_Lion":[0,828,32,23],"an_Lioness":[0,852,32,23],"an_Monkey":[0,876,32,16],"an_WildBoar":[0,893,34,16]}; for (const k in A) IM[k] = new Image();
    const at = new Image(); at.onload = () => { for (const k in A) { const [x, y, w, h] = A[k], c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(at, x, y, w, h, 0, 0, w, h); try { IM[k].src = c.toDataURL(); } catch (e) { IM[k] = c; c.complete = true; c.naturalWidth = w; c.naturalHeight = h; } } };
    at.src = 'na/v55atlas.png'; })();
  const ok = i => i && i.complete && i.naturalWidth > 0;
  // [anahtar, görsel, ad, boy (sanat pikseli ölçeği), {hp, atk, spd, ranged, range}]
  const V = [
    // balçık ailesi — çayır
    ['Slime2', 'Mavi Balçık', 2.5], ['Slime3', 'Kızıl Balçık', 2.5, { atk: 1.15 }], ['Slime4', 'Mor Balçık', 2.5, { hp: 1.2 }],
    ['Mushroom', 'Mantarcık', 2.6], ['Mushroom2', 'Zehirli Mantar', 2.6, { atk: 1.2 }], ['Mouse', 'Tarla Faresi', 2.4, { spd: 1.35, hp: .8 }], ['MouseBlack', 'Kara Fare', 2.4, { spd: 1.35, hp: .85 }],
    ['Butterfly', 'Kelebek', 2.4, { spd: 1.25, hp: .75 }], ['ButterflyBlue', 'Mavi Kelebek', 2.4, { spd: 1.25, hp: .75 }], ['Larva', 'Tırtıl', 2.4, { spd: .8, hp: 1.2 }], ['Larva2', 'Yeşil Tırtıl', 2.4, { spd: .8, hp: 1.2 }],
    ['HeartGreen', 'Yeşil Sünger', 2.4], ['HeartRed', 'Kızıl Sünger', 2.4, { atk: 1.1 }],
    // kurt ailesi — batı ormanı
    ['Bear', 'Boz Ayı', 4.2, { hp: 1.5, spd: .8, atk: 1.15 }], ['Panda', 'Kavgacı Panda', 4.2, { hp: 1.45, spd: .8 }], ['Racoon', 'Rakun', 3.4, { spd: 1.1 }],
    ['Owl', 'Baykuş', 3, { spd: 1.15 }], ['Owl2', 'Gece Baykuşu', 3, { spd: 1.15, atk: 1.1 }], ['Snake', 'Yılan', 2.8, { atk: 1.15, hp: .85 }], ['Snake2', 'Su Yılanı', 2.8, { atk: 1.15, hp: .85 }],
    ['Mole', 'Köstebek', 2.8, { hp: 1.1 }], ['Mole2', 'Kara Köstebek', 2.8, { hp: 1.15 }], ['Axolot', 'Semender', 2.8], ['AxolotBlue', 'Mavi Semender', 2.8],
    // goblin ailesi — doğu koru
    ['Reptile', 'Kertenkele Adam', 3.6], ['Lizard', 'Kertenkele', 3.2, { spd: 1.2 }], ['Lizard2', 'Gece Kertenkelesi', 3.2, { spd: 1.2, atk: 1.1 }],
    ['KappaGreen', 'Kappa', 3.4, { hp: 1.15 }], ['KappaRed', 'Kızıl Kappa', 3.4, { atk: 1.15 }], ['Bamboo', 'Bambu Ruhu', 3.4], ['BambooYellow', 'Sarı Bambu', 3.4, { hp: 1.1 }],
    ['GoldRacoon', 'Altın Rakun', 3.4, { spd: 1.15 }], ['Snake3', 'Engerek', 2.8, { atk: 1.2 }], ['Snake4', 'Kum Yılanı', 2.8, { atk: 1.2 }], ['SpiderYellow', 'Sarı Örümcek', 3, { spd: 1.15 }],
    // iskelet ailesi — harabeler
    ['Skull', 'Kafatası', 2.6, { spd: 1.2 }], ['SkullBlue', 'Mavi Kafatası', 2.6, { spd: 1.2 }], ['Eye', 'Gözcü', 2.6, { ranged: 'magic', range: 190, hp: .85 }], ['Eye2', 'Lanetli Göz', 2.6, { ranged: 'magic', range: 190, hp: .85 }],
    ['LanternGreen', 'Yeşil Fener', 2.8, { ranged: 'ghost', range: 190 }], ['LanternRed', 'Kızıl Fener', 2.8, { ranged: 'ghost', range: 190 }], ['BlueBat', 'Mağara Yarasası', 2.6, { spd: 1.4, hp: .75 }],
    ['YellowsBat', 'Sarı Yarasa', 2.6, { spd: 1.4, hp: .75 }], ['Mollusc', 'Dev Salyangoz', 3, { hp: 1.4, spd: .6 }], ['Mollusc2', 'Kabuklu Sümüklü', 3, { hp: 1.4, spd: .6 }], ['Cyclope', 'Tepegöz', 3.8, { hp: 1.35, atk: 1.15 }],
    // ifrit ailesi — volkan
    ['Flam2', 'Mavi Alev', 3.2], ['Dragon', 'Yavru Ejder', 3.8, { hp: 1.2 }], ['DragonYellow', 'Altın Yavru Ejder', 3.8, { hp: 1.2, atk: 1.1 }],
    ['TRex', 'Lav Kertenkelesi', 4.4, { hp: 1.5, ranged: null, range: 36, spd: 1.05 }], ['GreyTrex', 'Kül Canavarı', 4.4, { hp: 1.5, ranged: null, range: 36 }], ['Cyclope2', 'Ateş Tepegözü', 4, { hp: 1.4, atk: 1.2, ranged: null, range: 36 }],
    // Kızıl Sınır aileleri
    ['Fish', 'Kara Balık', 3, { spd: 1.1 }], ['FishRed', 'Kan Balığı', 3, { spd: 1.1, atk: 1.1 }], ['Octopus', 'Bataklık Ahtapotu', 3.6, { hp: 1.2 }], ['Octopus2', 'Mor Ahtapot', 3.6, { hp: 1.2 }],
    ['GreenOctopus', 'Yeşil Ahtapot', 3.8], ['RedOctopus', 'Kızıl Ahtapot', 3.8, { atk: 1.15 }], ['Spirit2', 'Mavi Ruh', 3.4],
  ];
  const VAR = {}; for (const [k, n, s, mod] of V) VAR[k] = { img: 'mv_' + k, name: n, S: s, mod: mod || {} };
  // v55: yeni canavar görselleri — renk varyantları (mvx_) ve hayvan canavarlar (an_, 2 kare yan görünüm)
  const VX = [['IceBear', 'Bear', 'Kutup Ayısı', 4.2, { hp: 1.6, spd: .8, atk: 1.15 }], ['ShadowCyclope', 'Cyclope', 'Gölge Tepegöz', 3.8, { hp: 1.4, atk: 1.2 }], ['VenomReptile', 'Reptile', 'Mor Pullu', 3.6, { atk: 1.15 }],
    ['GoldSkull', 'Skull', 'Altın Kafatası', 2.6, { spd: 1.2, hp: 1.1 }], ['EmberRacoon', 'Racoon', 'Kor Rakun', 3.4, { spd: 1.15, atk: 1.1 }], ['SnowOwl', 'Owl', 'Kar Baykuşu', 3, { spd: 1.2 }],
    ['CrimsonMole', 'Mole', 'Kızıl Köstebek', 2.8, { hp: 1.2 }], ['FrostKappa', 'KappaGreen', 'Su Kappası', 3.4, { hp: 1.2 }], ['GoldSnake', 'Snake', 'Gül Yılanı', 2.8, { atk: 1.2 }],
    ['NightMushroom', 'Mushroom', 'Gök Mantarı', 2.6, { hp: 1.1 }], ['EmberSpirit', 'Spirit2', 'Buz Ruhu', 3.4, { atk: 1.1 }], ['FrostOctopus', 'Octopus', 'Gece Ahtapotu', 3.6, { hp: 1.25 }]];
  for (const [k, b, n, s2, mod] of VX) VAR[k] = { img: 'mvx_' + k, base: b, name: n, S: s2, mod };
  const VA = [['Hyena', 'Sırtlan', 2.6, { spd: 1.3, atk: 1.1 }], ['Lion', 'Yele Aslanı', 2.6, { hp: 1.4, atk: 1.2 }], ['Lioness', 'Dişi Aslan', 2.6, { spd: 1.25, atk: 1.15 }], ['WildBoar', 'Yaban Domuzu', 2.8, { hp: 1.35, spd: 1.1 }],
    ['CatCyclop', 'Tek Gözlü Kedi', 2.6, { spd: 1.3 }], ['Monkey', 'Kara Maymun', 2.6, { spd: 1.25 }], ['Frog', 'Zıpzıp Kurbağa', 2.6, { hp: .9 }]];
  for (const [k, n, s2, mod] of VA) VAR[k] = { img: 'an_' + k, side2: true, name: n, S: s2, mod };
  const POOL = {
    slime: ['Slime2', 'Slime3', 'Slime4', 'Mushroom', 'Mushroom2', 'Mouse', 'MouseBlack', 'Butterfly', 'ButterflyBlue', 'Larva', 'Larva2', 'HeartGreen', 'HeartRed', 'NightMushroom', 'Frog', 'CatCyclop'],
    wolf: ['Bear', 'Panda', 'Racoon', 'Owl', 'Owl2', 'Snake', 'Snake2', 'Mole', 'Mole2', 'Axolot', 'AxolotBlue', 'Hyena', 'WildBoar', 'SnowOwl', 'CrimsonMole', 'EmberRacoon'],
    goblin: ['Reptile', 'Lizard', 'Lizard2', 'KappaGreen', 'KappaRed', 'Bamboo', 'BambooYellow', 'GoldRacoon', 'Snake3', 'Snake4', 'SpiderYellow', 'Monkey', 'VenomReptile', 'FrostKappa', 'GoldSnake'],
    skeleton: ['Skull', 'SkullBlue', 'Eye', 'Eye2', 'LanternGreen', 'LanternRed', 'BlueBat', 'YellowsBat', 'Mollusc', 'Mollusc2', 'Cyclope', 'GoldSkull', 'ShadowCyclope'],
    imp: ['Flam2', 'Dragon', 'DragonYellow', 'TRex', 'GreyTrex', 'Cyclope2', 'Lion', 'Lioness'],
    bloodwolf: ['Fish', 'FishRed', 'Bear', 'GreyTrex', 'IceBear', 'Hyena'],
    golem: ['Octopus', 'Octopus2', 'GreenOctopus', 'RedOctopus', 'Cyclope2', 'TRex', 'FrostOctopus'],
    spider: ['SpiderYellow', 'Snake4', 'Larva2', 'Mollusc2'],
    wraith: ['Spirit2', 'Eye2', 'LanternRed', 'SkullBlue', 'EmberSpirit'],
  };
  // ★ Dev (elit) canavarlar — kullanılmayan boss görselleri: [anahtar, aile, ad, kare gen., kare yük., kare sayısı, boy px]
  const EL = [
    ['GiantSlime', 'slime', 'Dev Balçık', 62, 52, 5, 92], ['GiantFrog', 'slime', 'Dev Kurbağa', 40, 40, 5, 86],
    ['GiantRacoonGold', 'wolf', 'Altın Rakun Kral', 60, 60, 6, 110], ['GiantFrog2', 'wolf', 'Bataklık Kurbağası', 40, 40, 5, 90],
    ['GiantBamboo2', 'goblin', 'Bambu Devi', 62, 62, 6, 118], ['GiantSlime2', 'goblin', 'Zehir Balçığı', 62, 52, 5, 96],
    ['GiantSpirit', 'skeleton', 'Dev Ruh', 50, 50, 5, 112], ['DemonCyclop2', 'skeleton', 'İblis Tepegöz', 50, 50, 5, 120],
    ['GiantFlam', 'imp', 'Alev Devi', 50, 50, 5, 118], ['TenguBlue', 'imp', 'Mavi Tengu', 68, 68, 6, 124], ['DragonBlue', 'imp', 'Mavi Ejder', 0, 0, 1, 128],
    ['GiantRedSamurai', 'golem', 'Kızıl Samuray', 96, 48, 6, 126], ['SquidGreen', 'golem', 'Yeşil Mürekkep', 76, 79, 4, 120], ['SquidRed', 'golem', 'Kan Mürekkep', 76, 79, 4, 120],
  ];
  const ELI = {}; for (const [k, fam, n, fw, fh, cnt, px] of EL) ELI[k] = { fam, name: n, fw, fh, cnt, px };
  const ZONE_EL = { meadow: ['GiantSlime', 'GiantFrog'], forestW: ['GiantRacoonGold', 'GiantFrog2'], forestE: ['GiantBamboo2', 'GiantSlime2'], ruins: ['GiantSpirit', 'DemonCyclop2'], volcano: ['GiantFlam', 'TenguBlue', 'DragonBlue'], mid: ['GiantRedSamurai', 'SquidGreen', 'SquidRed'] };
  const ZONE_LV = { meadow: 4, forestW: 8, forestE: 10, ruins: 14, volcano: 18, mid: 21 };
  window.KD_VAR = VAR; window.KD_ELITE = ELI; window.KD_POOL = POOL;

  // ---------------- haritalara yerleştir ----------------
  function decorate(m) {
    if (!m || m._kdVar) return m; m._kdVar = true;
    const rnd = mulberry32(m.W * 31 + m.H * 7 + 99);
    for (const s of m.spawns) { if (s.vt || !POOL[s.type] || (ET[s.type] && ET[s.type].boss)) continue; if (rnd() < .7) { const P = POOL[s.type]; s.vt = P[Math.floor(rnd() * P.length)]; } }
    // elitler
    for (const z in ZONE_EL) {
      if (!m.zones || !m.zones[z]) continue;
      for (const key of ZONE_EL[z]) { const e = ELI[key]; const s = findSpotIn(m, z, (tx, ty) => !inSafeM(m, tx * TILE, ty * TILE)); if (s) m.spawns.push({ type: e.fam, lvl: ZONE_LV[z], x: s.x, y: s.y, vt: key, elite: true, resp: 150 }); }
    }
    return m;
  }
  function inSafeM(m, x, y) { for (const s of m.safe || []) if (s.w ? (Math.abs(x - s.x) < s.w && Math.abs(y - s.y) < s.h) : Math.hypot(x - s.x, y - s.y) < s.r) return true; return false; }
  if (typeof GEN !== 'undefined') for (const id of Object.keys(GEN)) { const g0 = GEN[id]; GEN[id] = function () { return decorate(g0.apply(this, arguments)); }; }

  // ---------------- canavar oluşturma: çeşit / elit değerleri ----------------
  if (typeof makeEnemy === 'function') {
    const _mk = makeEnemy;
    makeEnemy = function (sp) {
      const e = _mk.apply(this, arguments); if (!e || !sp || !sp.vt || e.d.pvp) return e;
      const cursed = !!e.cursed, pre = cursed ? 'Lanetli ' : '';
      if (ELI[sp.vt]) {
        const el = ELI[sp.vt]; e.vt = sp.vt; e.elite = true;
        e.d = Object.assign({}, e.d, { name: '★ ' + pre + el.name, boss: true, xp: (e.d.xp || 20) * 6, xpL: (e.d.xpL || 5) * 6, h: el.px, r: 24, ranged: e.d.ranged });
        e.maxHp = Math.round(e.maxHp * 5); e.hp = e.maxHp; e.atk *= 1.6; e.def *= 1.5; e.r = 24; e.cr = 12;
      } else if (VAR[sp.vt]) {
        const v = VAR[sp.vt], md = v.mod; e.vt = sp.vt;
        const nd = { name: pre + v.name, h: Math.round(16 * v.S * (sp.mini ? 1.5 : 1)) };
        if ('ranged' in md) nd.ranged = md.ranged; if (md.range) nd.range = md.range; if (md.spd) nd.spd = e.d.spd * md.spd;
        e.d = Object.assign({}, e.d, nd);
        if (md.hp) { e.maxHp = Math.round(e.maxHp * md.hp); e.hp = e.maxHp; } if (md.atk) e.atk *= md.atk;
      }
      return e;
    };
  }

  // ---------------- çizim ----------------
  // v54: bazı sayfalarda sütun sırası farklı (Boz Ayı: ön, sol, arka, sağ)
  const COLMAP = { Bear: [0, 2, 1, 3] };
  // v54: bazı dev canavar şeritleri sönme animasyonu içeriyor → sadece canlı kareleri ileri-geri oynat
  const ELFR = { GiantSlime: [0, 1, 2, 1], GiantSlime2: [0, 1, 2, 1] };
  function dirCol(e) { const m = COLMAP[e.vt] || COLMAP[(VAR[e.vt] || {}).base] || [0, 1, 2, 3]; if (e.dir === 'back') return m[1]; if (e.dir === 'side') return (e.face || 1) < 0 ? m[2] : m[3]; return m[0]; }
  if (window.naMon) {
    const _nm = window.naMon;
    window.naMon = function (e) {
      if (!e.vt) return _nm(e);
      if (ELI[e.vt]) {
        const el = ELI[e.vt], im = img('b_' + e.vt); if (!ok(im)) return false;
        let fw = el.fw || im.naturalWidth, fh = el.fh || im.naturalHeight, cnt = el.cnt; const S = el.px / fh, FR = ELFR[e.vt], f = FR ? FR[Math.floor((e.anim || 0) * 6) % FR.length] : Math.floor((e.anim || 0) * 7) % cnt;
        const bob = el.fw ? 0 : Math.sin((e.anim || 0) * 2.5) * 5;
        shadow(0, 0, fw * S * .35, fw * S * .12);
        ctx.save(); if ((e.face || 1) < 0) ctx.scale(-1, 1); ctx.imageSmoothingEnabled = false;
        // elit parıltısı
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 + .1 * Math.sin((e.anim || 0) * 3); ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.ellipse(0, -2, fw * S * .4, 8, 0, 0, 7); ctx.fill(); ctx.restore();
        ctx.drawImage(im, f * fw, 0, fw, fh, Math.round(-fw * S / 2), Math.round(-fh * S + bob), Math.round(fw * S), Math.round(fh * S));
        if (!e.dead && gameTime - e.hitT < .12) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .6; ctx.drawImage(im, f * fw, 0, fw, fh, Math.round(-fw * S / 2), Math.round(-fh * S + bob), Math.round(fw * S), Math.round(fh * S)); }
        ctx.restore(); return true;
      }
      const v = VAR[e.vt], im = v && img(v.img); if (!v || !ok(im)) return _nm(e);
      const S = v.S * (e.sizeM || 1), d = dirCol(e), row = Math.floor((e.anim || 0) * (e.moving ? 8 : 3)) % 4;
      if (e.mini) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .3 + .12 * Math.sin((e.anim || 0) * 4); ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.ellipse(0, -2, 9 * S, 3 * S, 0, 0, 7); ctx.fill(); ctx.restore(); }
      if (v.side2) { // hayvan: 2 kare yan şerit (sola bakar)
        const fw = im.naturalWidth / 2, fh = im.naturalHeight, f = Math.floor((e.anim || 0) * (e.moving ? 7 : 2)) % 2, k = S * 1.05;
        shadow(0, 0, fw * k * .4, 2 * S); ctx.save(); if ((e.face || 1) > 0) ctx.scale(-1, 1); ctx.imageSmoothingEnabled = false;
        if (e.atkAnim > .05) ctx.translate(-Math.min(1, e.atkAnim * 5) * S * 2, 0);
        ctx.drawImage(im, f * fw, 0, fw, fh, Math.round(-fw * k / 2), Math.round(-fh * k), Math.round(fw * k), Math.round(fh * k));
        if (!e.dead && gameTime - e.hitT < .12) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .7; ctx.drawImage(im, f * fw, 0, fw, fh, Math.round(-fw * k / 2), Math.round(-fh * k), Math.round(fw * k), Math.round(fh * k)); }
        ctx.restore(); return true; }
      shadow(0, 0, 5 * S, 2 * S);
      ctx.save();
      if (e.atkAnim > .05 && typeof player !== 'undefined' && player) { const a = Math.atan2(player.y - e.y, player.x - e.x), k = Math.min(1, e.atkAnim * 5) * S * 2; ctx.translate(Math.cos(a) * k, Math.sin(a) * k * .6 - S); }
      if (!e.dead && gameTime - e.hitT < .15 && typeof player !== 'undefined' && player) { const a = Math.atan2(e.y - player.y, e.x - player.x); ctx.translate(Math.round(Math.cos(a) * S * 1.5), Math.round(Math.sin(a) * S)); }
      ctx.imageSmoothingEnabled = false; ctx.drawImage(im, d * 16, row * 16, 16, 16, -8 * S, -16 * S, 16 * S, 16 * S);
      if (!e.dead && gameTime - e.hitT < .12) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .7; ctx.drawImage(im, d * 16, row * 16, 16, 16, -8 * S, -16 * S, 16 * S, 16 * S); }
      ctx.restore(); return true;
    };
  }
  // v54: çapraz yürürken yön her karede yan↔ön arasında titremesin (eşik + önceki yönü koru)
  if (typeof moveEnt === 'function') {
    const _me = moveEnt;
    moveEnt = function (e, dx, dy) {
      const pd = e.dir, r = _me.apply(this, arguments), ax = Math.abs(dx), ay = Math.abs(dy);
      if (pd && ax > .01 && ay > .01) { const k = ax / ay; if (k > .6 && k < 1.65) { e.dir = pd; if (pd === 'side') e.face = dx > 0 ? 1 : -1; } }
      return r;
    };
  }
  if (window.naMonH) { const _mh = window.naMonH; window.naMonH = function (e) { if (e.vt && ELI[e.vt]) return ELI[e.vt].px + 4; if (e.vt && VAR[e.vt]) return (VAR[e.vt].side2 ? 14 : 15) * VAR[e.vt].S * (e.sizeM || 1); return _mh(e); }; }
})();
