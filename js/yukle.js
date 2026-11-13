'use strict';
// =====================================================================
//  YÜKLEME EKRANI — tüm paket görselleri (na/*.png) ve piksel yazı tipi
//  yüklenmeden oyun/giriş ekranı gösterilmez. Böylece açılışta eski
//  (yedek) çizimler bir an bile görünmez.
// =====================================================================
(function () {
  const list = (window.KD_ASSETS || []).map(n => 'na/' + n);
  const ov = document.createElement('div'); ov.id = 'kdLoad';
  ov.innerHTML = '<div class="kdl-box"><div class="kdl-title">Kayıp Diyarlar</div><div class="kdl-bar"><i></i></div><div class="kdl-txt">Yükleniyor… %0</div></div>';
  document.body.insertBefore(ov, document.body.firstChild);
  document.documentElement.classList.add('kdloading');
  window.KD_IMG = {}; // önbellek: aynı adres tekrar istendiğinde anında hazır
  let done = 0, finished = false; const total = list.length + 1;
  const bar = ov.querySelector('i'), txt = ov.querySelector('.kdl-txt');
  function step() { done++; const k = Math.min(1, done / total); bar.style.width = (k * 100).toFixed(1) + '%'; txt.textContent = 'Yükleniyor… %' + Math.floor(k * 100); if (done >= total) finish(); }
  function finish() { if (finished) return; finished = true; document.documentElement.classList.remove('kdloading'); const pre = document.getElementById('kdpre'); if (pre) pre.remove(); ov.classList.add('kdl-out'); ov.addEventListener('transitionend', () => ov.remove()); setTimeout(() => ov.remove(), 450); requestAnimationFrame(() => requestAnimationFrame(() => { if (getComputedStyle(ov).opacity === '0') ov.remove(); })); window.KD_READY = true; try { dispatchEvent(new Event('kdready')); } catch (e) { } }
  for (const src of list) { const im = new Image(); im.onload = im.onerror = step; im.src = src; KD_IMG[src] = im; }
  try { const f = new FontFace('KDPixel', 'url(na/pixelfont.ttf)'); f.load().then(ff => { document.fonts.add(ff); step(); }, step); } catch (e) { step(); }
  window.__kdLoadFinish = finish; // testler için
  setTimeout(finish, 15000); // ağ çok yavaşsa yine de aç
})();
