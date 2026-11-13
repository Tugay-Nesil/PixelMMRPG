'use strict';
// =====================================================================
//  EKONOMİ v50 — düşme oranları, boss / sandık ödül havuzları
//  • Normal canavar: temel malzeme + normal ekipman. Şans / Efsun parşömeni ve
//    İnci Dükkânı ürünlerinin oyun içi karşılıkları NORMAL CANAVARDAN DÜŞMEZ.
//  • Elit (★) < Boss < Kor Ejderi: katman arttıkça nadir ödül şansı artar.
//  • Her bossun kendine özgü "imza" ödülü var (ör. Kurt Kral: çizme/pantolon).
//  • Sandıklar Bronz / Gümüş / Altın: ayrı şans tabloları.
//  • Enflasyon kontrolü: normal canavar altını -%15; pazar vergisi ve tezgâh
//    ücreti pazar.js'de (altın oyundan çıkar).
// =====================================================================
(function () {
  // ---- İnci Dükkânı ürünlerinin oyun içi karşılıkları (malzeme olarak) ----
  Object.assign(MATS, {
    bless: { n: 'Kutsama Muskası', ic: '🌟', col: '#ffe08a', desc: '1 saat: TP +%50, altın +%20, nadir düşme +%15. İnci Dükkânı → Eşyalarım\'dan kullan.', price: 900, prem: 1 },
    oto1: { n: 'Oto Savaş Bileti (1 gün)', ic: '⚙️', col: '#9fffb0', desc: 'Kullanınca 1 gün OTO savaş (yalnız PvE bölgeleri).', price: 700, prem: 1 },
    afk1: { n: 'AFK Farm Bileti (1 gün)', ic: '🌾', col: '#c8ff8a', desc: 'Kullanınca 1 gün AFK Farm: karakter PvE bölgesinde kendi gezer ve kasılır.', price: 1200, prem: 1 },
    pazar1: { n: 'AFK Pazar Bileti (1 gün)', ic: '🏪', col: '#ffd0a0', desc: 'Kullanınca 1 gün AFK Pazar: oyundan çıksan da pazarın satış yapar.', price: 800, prem: 1 },
    rename: { n: 'İsim Değiştirme Kuponu', ic: '🏷️', col: '#d0b0ff', desc: 'Karakter adını bir kez değiştirir.', price: 3000, prem: 1 },
  });
  const PREM = ['luck', 'ench', 'bless', 'oto1', 'afk1', 'pazar1', 'rename'];
  window.KD_PREM_MATS = PREM;
  function fixMats(p) { if (!p) return; p.mats = p.mats || {}; for (const k in MATS) if (p.mats[k] == null || isNaN(p.mats[k])) p.mats[k] = 0; }
  window.kdFixMats = fixMats;
  if (typeof startGame === 'function') { const _sg = startGame; startGame = function () { const r = _sg.apply(this, arguments); try { fixMats(player); } catch (e) { } return r; }; window.startGame = startGame; }

  // ---- boss katmanları ve imza ödülleri ----
  const TIER = {
    1: { ench: .25, luck: .10, bless: .03, oto1: .02 },                                                          // ★ elit
    2: { ench: .50, luck: .25, prot: .30, bless: .08, oto1: .05, afk1: .04, pazar1: .03, rename: .008 },        // bölge bossu
    3: { ench: .80, luck: .50, prot: .50, bless: .30, oto1: .15, afk1: .15, pazar1: .12, rename: .05 },         // Kor Ejderi
  };
  const SIG = { // boss türü → imza ekipman yuvaları + en düşük kalite
    wolfking: { slots: ['boots', 'pants'], g: 1, n: 'Kurt Kral' }, goblinchief: { slots: ['ring', 'necklace'], g: 1, n: 'Goblin Reisi' },
    skeletonlord: { slots: ['helmet', 'armor'], g: 1, n: 'İskelet Lordu' }, dragon: { slots: ['weapon'], g: 2, n: 'Ejderha' },
    titan: { slots: ['belt', 'bracers'], g: 2, n: 'Titan' }, ejder: { slots: ['weapon', 'armor'], g: 2, n: 'Kor Ejderi' },
  };
  window.KD_TIER = TIER; window.KD_SIG = SIG;
  const tierOf = e => e.kdDragon ? 3 : e.elite ? 1 : 2;
  if (typeof dropLoot === 'function') {
    const _dl = dropLoot;
    dropLoot = function (e, pvpKill) {
      const n0 = loots.length; const r = _dl.apply(this, arguments);
      try {
        const add = (k, v) => loots.push({ x: e.x + rr(-24, 24), y: e.y + rr(-14, 14), kind: k, val: v, t: gameTime, bob: Math.random() * 6 });
        const fresh = loots.slice(n0);
        const blessed = player && player.buffs && player.buffs.kutsama && player.buffs.kutsama.until > gameTime;
        if (!e.d.boss) {
          // normal canavar / PvP: şans-efsun ve İnci ürünleri düşmez; altın -%15 (kutsamada +%20)
          for (const l of fresh) { if (l.kind === 'mat' && PREM.includes(l.val)) { const i = loots.indexOf(l); if (i >= 0) loots.splice(i, 1); } else if (l.kind === 'gold') l.val = Math.max(1, Math.round(l.val * .85 * (blessed ? 1.2 : 1))); }
          if (blessed && Math.random() < .15) add('mat', 'up');
        } else {
          const t = tierOf(e), P = TIER[t], mul = blessed ? 1.15 : 1;
          for (const k in P) if (Math.random() < P[k] * mul) add('mat', k);
          const sg = SIG[e.type]; if (sg) add('gear', makeItem(pick(sg.slots), e.lvl, Math.max(sg.g, gradeRoll(2)), player.cls));
          if (blessed) for (const l of fresh) if (l.kind === 'gold') l.val = Math.round(l.val * 1.2);
        }
      } catch (er) { }
      return r;
    };
  }
  // ---- sandıklar ----
  const CHEST = [{ bless: .03, oto1: .03 }, { bless: .06, oto1: .06, afk1: .04, pazar1: .03 }, { bless: .12, oto1: .08, afk1: .08, pazar1: .06, rename: .02 }];
  window.KD_CHEST = CHEST;
  if (typeof openChest === 'function') {
    const _oc = openChest;
    openChest = function () {
      const c = treasure && treasure.chest, tier = c ? c.tier : 0; const r = _oc.apply(this, arguments);
      try { if (c) for (const k in CHEST[tier]) if (Math.random() < CHEST[tier][k]) { loots.push({ x: c.x + rr(-30, 30), y: c.y + rr(-14, 20), kind: 'mat', val: k, t: gameTime, bob: Math.random() * 6 }); addChat(null, '✨ Sandıktan nadir ödül: ' + MATS[k].ic + ' ' + MATS[k].n, '#ffe08a'); } } catch (e) { }
      return r;
    };
  }
  // ---- Kutsama: TP +%50 ----
  if (typeof gainXp === 'function') { const _gx = gainXp; gainXp = function (n) { try { const p = player; if (p && p.buffs && p.buffs.kutsama && p.buffs.kutsama.until > gameTime) n = Math.round(n * 1.5); } catch (e) { } return _gx.call(this, n); }; }
  // malzemelerde ikon
  if (typeof MICON !== 'undefined') Object.assign(MICON, { bless: 'GemYellow', oto1: 'Hourglass', afk1: 'Grass', pazar1: 'Chest', rename: 'Scroll' });
})();
