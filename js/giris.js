'use strict';
// =====================================================================
//  KARAKTER OLUŞTURMA SAHNESİ (Sürüm 36)
//  • Paketin karakterleri, çimen zeminde taş kaide üstünde, sınıf ışığıyla
//  • Her sınıf seçiminde / cinsiyet / kıyafet değişiminde kendine özgü giriş animasyonu
//      Savaşçı: yürüyerek gelir + kılıç savurur      Büyücü: büyü girdabından belirir + ateş topu
//      Okçu: öbür yandan gelir + ok atar             Suikastçı: dumandan çıkar + hızlı saldırı
//  • Kıyafet: "Çıplak" ya da "Full +9" (efsanevi +9 zırh ve silah, parıltılı)
//  Oyun sistemine dokunmaz: seçimleri giriş ekranındaki mevcut düğmelerden okur.
// =====================================================================
(function () {
  const IM = {};
  const img = n => { let i = IM[n]; if (!i) { i = new Image(); i.src = 'na/' + n + '.png'; IM[n] = i; } return i; };
  const ok = i => i && i.complete && i.naturalWidth > 0;
  const COL = { warrior: '#ff9a4a', mage: '#a07aff', archer: '#7dff9a', priest: '#ffe08a' };
  const NAME = { warrior: 'Savaşçı', mage: 'Büyücü', archer: 'Avcı', priest: 'Rahip' };
  const W = 320, H = 270, GY = 222, CX = 160, SC = 2.1;
  let outfit = 'naked', raf = 0, cv = null, g = null;
  let st = { cls: null, gender: null, outfit: null, t0: 0 }, parts = [];

  // efekt sayfası karesi çiz: (ad, kare gen., kare yük., kare sayısı, ilerleme 0..1, x, y, ölçek)
  function fx(n, fw, fh, cnt, k, x, y, s, rot, add) {
    const im = img('fx_' + n); if (!ok(im) || k < 0 || k >= 1) return;
    const f = Math.min(cnt - 1, Math.floor(k * cnt));
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (add) g.globalCompositeOperation = 'lighter';
    g.imageSmoothingEnabled = false; g.drawImage(im, f * fw, 0, fw, fh, -fw * s / 2, -fh * s / 2, fw * s, fh * s); g.restore();
  }
  function selCls() { const e = document.querySelector('#start .cls.sel'); return e ? e.dataset.c : 'warrior'; }
  function selGender() { const e = document.querySelector('#start [data-k="gender"].sel'); return e ? e.dataset.v : 'm'; }

  // ---------------- sahne arka planı ----------------
  function backdrop(t, cls) {
    const c = COL[cls];
    // gökyüzü
    const sky = g.createLinearGradient(0, 0, 0, GY); sky.addColorStop(0, '#120d1e'); sky.addColorStop(1, '#2a2040'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // yıldızlar
    g.fillStyle = '#fff'; for (let i = 0; i < 26; i++) { const x = (i * 97) % W, y = (i * 53) % 120; g.globalAlpha = .25 + .35 * Math.abs(Math.sin(t * 1.3 + i)); g.fillRect(x, y, 2, 2); } g.globalAlpha = 1;
    // ay
    g.fillStyle = 'rgba(255,230,170,.9)'; g.beginPath(); g.arc(262, 48, 18, 0, 7); g.fill(); g.fillStyle = '#2a2040'; g.beginPath(); g.arc(270, 42, 15, 0, 7); g.fill();
    // uzak ağaçlar (paket)
    const tr = img('p_pine'), tr2 = img('p_tree');
    if (ok(tr) && ok(tr2)) { g.imageSmoothingEnabled = false; g.globalAlpha = .55; for (let i = 0; i < 6; i++) { const im = i % 2 ? tr : tr2, s = 2; g.drawImage(im, i * 58 - 20, GY - im.naturalHeight * s + 6, im.naturalWidth * s, im.naturalHeight * s); } g.globalAlpha = 1; }
    // çimen zemin (paketin zemin karosu)
    const gr = img('ground'); if (ok(gr)) { g.imageSmoothingEnabled = false; for (let x = 0; x < W; x += 32) for (let y = GY - 6; y < H; y += 32) g.drawImage(gr, 0, 0, 16, 16, x, y, 32, 32); }
    else { g.fillStyle = '#4a7a3a'; g.fillRect(0, GY - 6, W, H); }
    const sh = g.createLinearGradient(0, GY - 8, 0, GY + 6); sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, GY - 8, W, 14);
    // taş kaide
    g.fillStyle = '#4a4458'; g.beginPath(); g.ellipse(CX, GY + 4, 64, 15, 0, 0, 7); g.fill();
    g.fillStyle = '#6a6478'; g.beginPath(); g.ellipse(CX, GY, 60, 12, 0, 0, 7); g.fill();
    g.strokeStyle = '#8a849a'; g.lineWidth = 2; g.beginPath(); g.ellipse(CX, GY, 60, 12, 0, Math.PI, 0); g.stroke();
    // sınıf ışığı
    g.save(); g.globalCompositeOperation = 'lighter';
    const gl = g.createRadialGradient(CX, GY - 50, 4, CX, GY - 50, 120); gl.addColorStop(0, hexA(c, .32 + .08 * Math.sin(t * 2))); gl.addColorStop(1, hexA(c, 0)); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    g.strokeStyle = hexA(c, .55); g.lineWidth = 2; g.beginPath(); g.ellipse(CX, GY, 50 + Math.sin(t * 3) * 3, 9, 0, 0, 7); g.stroke();
    g.restore();
  }
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }

  // ---------------- karakter ----------------
  function hero(x, y, o) {
    const old = ctx; ctx = g;
    try { drawHero(x, y, Object.assign({ hair: 'kisa', skin: '#e8c09a', hairCol: '#222', helm: -1, s: SC }, o)); } catch (e) { }
    ctx = old;
  }
  function look(cls, gender, t) {
    const full = outfit === 'full';
    return { cls, gender, anim: t, wGrade: full ? 2 : 0, wPlus: full ? 9 : 0, aGrade: full ? 2 : 0, aPlus: full ? 9 : 0, noA: !full, noW: !full, alt: false };
  }

  // her sınıfın giriş (0..~1.8 sn) ve bekleme hareketi
  function scene(t) {
    const cls = st.cls, e = window.__kdSceneE != null ? window.__kdSceneE : t - st.t0, o = look(cls, st.gender, t);
    let x = CX, y = GY, dir = 'front', face = 1, moving = false, atk = 0, alpha = 1;
    const sig = e > 2.2 ? ((e - 2.2) % 4.2) : -1; // bekleme sırasında 4 sn'de bir imza hareketi
    if (cls === 'warrior') {
      if (e < .9) { x = -30 + (CX + 30) * (e / .9); dir = 'side'; moving = true; }
      else if (e < 1.5) { const k = (e - .9) / .6; atk = k < .4 ? .22 * (1 - k / .4) : 0; dir = 'side'; fx('slash', 32, 32, 4, (e - .95) / .35, CX + 34, GY - 40, 2.6); if (k > .4) fx('circ', 32, 32, 4, (e - 1.15) / .35, CX, GY - 4, 3, 0, true); }
      if (sig >= 0 && sig < .5) { dir = 'side'; atk = sig < .22 ? .22 - sig : 0; fx('slash2', 32, 32, 4, sig / .35, CX + 34, GY - 40, 2.4); }
    } else if (cls === 'mage') {
      if (e < 1) { alpha = Math.min(1, e / .8); fx('spirit', 32, 32, 5, e / 1, CX, GY - 60, 4.2, 0, true); }
      else if (e < 2) { const k = e - 1; dir = 'side'; atk = k < .22 ? .22 - k : 0; const px = CX + 30 + k * 260; if (px < W - 30) fx('pfire', 16, 16, 4, (k * 4) % 1, px, GY - 52, 2.6, 0, true); else fx('expl', 40, 40, 9, (px - (W - 30)) / 120, W - 34, GY - 52, 2.2, 0, true); }
      if (sig >= 0 && sig < .8) { fx('aura', 25, 24, 5, sig / .8, CX, GY - 50, 4.4, 0, true); }
    } else if (cls === 'archer') {
      if (e < .9) { x = W + 30 - (W + 30 - CX) * (e / .9); dir = 'side'; face = -1; moving = true; }
      else if (e < 1.9) { const k = e - .9; dir = 'side'; face = 1; atk = k > .2 && k < .42 ? .42 - k : 0; if (k > .35) { const ax = CX + 30 + (k - .35) * 420; if (ax < W + 20) { const ar = img('fx_parrow'); if (ok(ar)) { g.imageSmoothingEnabled = false; g.drawImage(ar, ax, GY - 48, 13 * 3, 5 * 3); } } } }
      if (sig >= 0 && sig < .6) { fx('boost', 53, 35, 8, sig / .6, CX, GY - 30, 2, 0, true); }
    } else if (cls === 'priest') { // ışık sütunundan iner, kutsama halesi + şifa parıltısı
      if (e < 1) { alpha = Math.min(1, e / .7); y = GY - Math.round((1 - Math.min(1, e / .8)) * 40); fx('boost', CX, GY - 40, 2.6, 0, true); }
      else if (e < 1.9) { fx('aura', CX, GY - 50, 4.6, 0, true); if (e > 1.3) fx('sparkc', CX + 40, GY - 70, 2.2, 0, true); }
      if (sig >= 0 && sig < .8) { fx('spirit', CX, GY - 50, 3.6, 0, true); }
    } else { // eski suikastçı (yedek)
      if (e < .7) { alpha = e < .35 ? 0 : (e - .35) / .35; fx('smoke', 32, 32, 6, e / .7, CX, GY - 40, 4.2); }
      else if (e < 1.5) { const k = (e - .7) / .8; dir = 'side'; x = CX + Math.sin(k * Math.PI) * 70; moving = true; atk = k > .4 && k < .6 ? .22 : 0; if (k > .35 && k < .75) fx('cutx', 32, 32, 4, (k - .35) / .4, CX + 70, GY - 40, 2.6, 0, true); }
      if (sig >= 0 && sig < .6) { fx('claw', 32, 32, 4, sig / .6, CX + 26, GY - 44, 2.4, 0, true); }
    }
    // bekleme: sağa sola bakar
    if (e > 2.2 && !atk && sig >= 1.2) { const ph = Math.floor((sig - 1.2) / 1) % 3; dir = ph === 1 ? 'side' : 'front'; face = ph === 1 ? (Math.floor(e / 4) % 2 ? -1 : 1) : 1; }
    g.save(); g.globalAlpha = alpha;
    hero(x, y + (moving ? 0 : Math.round(Math.sin(t * 2.2) * 1)), Object.assign(o, { dir, face, moving, atk }));
    g.restore();
    // +9 parıltıları
    if (outfit === 'full' && alpha > .5) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * 1.05, r = 34 + Math.sin(t * 2 + i) * 6; g.fillStyle = i % 2 ? '#ffe27a' : '#fff6c0'; g.globalAlpha = .5 + .4 * Math.sin(t * 5 + i); g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 50 + Math.sin(a) * r * .6), 3, 3); }
      g.restore();
    }
  }

  function banner(t) {
    const cls = st.cls, c = COL[cls];
    g.save(); g.font = '16px KDPixel, "Segoe UI", sans-serif'; g.textAlign = 'center';
    const txt = NAME[cls] + (outfit === 'full' ? '  +9' : '  •  Çıplak');
    const w = g.measureText(txt).width + 26; g.fillStyle = 'rgba(13,9,18,.82)'; g.fillRect(CX - w / 2, 10, w, 26); g.strokeStyle = c; g.lineWidth = 2; g.strokeRect(CX - w / 2 + 1, 11, w - 2, 24);
    g.fillStyle = '#000'; g.fillText(txt, CX + 2, 30); g.fillStyle = outfit === 'full' ? '#ffd65a' : '#ece6f6'; g.fillText(txt, CX, 28);
    g.restore();
  }

  // yetenek satırı: emoji yerine paketin yetenek simgeleri
  function skRow() { const box = document.getElementById('clsInfo'); if (!box || typeof SKILLS === 'undefined') return; const map = {}; for (const sk of SKILLS[selCls()] || []) map[sk.ic] = sk.id;
    box.querySelectorAll('.skrow span').forEach(sp => { const id = map[sp.textContent.trim()]; if (id) sp.innerHTML = '<img class="skimg" src="na/sk_' + id + '.png" alt="">'; }); }
  function loop(now) {
    if (!cv || !cv.isConnected || document.getElementById('start').classList.contains('hidden') || document.getElementById('overlay').classList.contains('hidden')) { raf = 0; return; }
    const t = now / 1000, cls = selCls(), gen = selGender();
    if (cls !== st.cls || gen !== st.gender || outfit !== st.outfit) { st = { cls, gender: gen, outfit, t0: t }; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    backdrop(t, cls); scene(t); banner(t);
    raf = requestAnimationFrame(loop);
  }

  // ---------------- giriş ekranına yerleştir ----------------
  function mount() {
    const prev = document.getElementById('prev'); if (!prev || document.getElementById('kdStage')) return;
    try { if (typeof prevRaf !== 'undefined') cancelAnimationFrame(prevRaf); } catch (e) { }
    cv = document.createElement('canvas'); cv.id = 'kdStage'; cv.width = W; cv.height = H; g = cv.getContext('2d');
    prev.style.display = 'none'; prev.parentNode.insertBefore(cv, prev);
    // kıyafet seçimi (eski efekt önizleme satırının yerine)
    const grp = document.createElement('div'); grp.className = 'grp kdoutfit';
    grp.innerHTML = '<label>Kıyafet</label><div class="chips"><span class="chip sel" data-out="naked">Çıplak</span><span class="chip" data-out="full">Full +9</span></div>';
    const pv = document.querySelector('#start .grp:has([data-k="pvPlus"])');
    (pv ? pv.parentNode : prev.parentNode).insertBefore(grp, pv || null);
    grp.addEventListener('click', e => { const c = e.target.closest('[data-out]'); if (!c) return; outfit = c.dataset.out; grp.querySelectorAll('[data-out]').forEach(x => x.classList.toggle('sel', x === c)); });
    st.cls = null; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    const ci = document.getElementById('clsInfo'); if (ci) { skRow(); new MutationObserver(skRow).observe(ci, { childList: true }); }
  }
  if (typeof showStart === 'function') { const _ss = showStart; showStart = function () { const r = _ss.apply(this, arguments); try { mount(); } catch (e) { } return r; }; }
  try { mount(); } catch (e) { }
  new MutationObserver(() => { try { mount(); } catch (e) { } }).observe(document.getElementById('start'), { childList: true });
  // oyun başlarken eski önizleme döngüsü yeniden kurulmasın / sahne dursun
  addEventListener('kdready', () => { try { mount(); } catch (e) { } });
  window.__kdStage = () => ({ cls: st.cls, outfit, running: !!raf });
})();
