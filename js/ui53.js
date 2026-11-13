'use strict';
// =====================================================================
//  MENÜ v53 — tam boy yan çekmece, bölümlü:
//  KARAKTER • EKONOMİ • ETKİNLİK & SOSYAL • AYARLAR
// =====================================================================
(function () {
  const ORDER = { sl_bk: 2, sl_bag: 3, sl_pt: 4, sl_rd: 5, sl_pearl: 11, sl_market: 12, sl_search: 13, sl_events: 21, sl_meet: 22, sl_afk: 23, sl_zoom: 31, sl_snd: 32, sl_sv: 33, sl_gm2: 34 };
  const SEC = [['KARAKTER', 0], ['EKONOMİ', 10], ['ETKİNLİK & SOSYAL', 20], ['AYARLAR', 30]];
  window.KD_MENU_ORDER = ORDER;
  function row(g, id, ic, lab, sub, fn) { if (document.getElementById(id)) return; const d = document.createElement('div'); d.id = id; d.className = 'slot h3row';
    d.innerHTML = '<img class="h3mi" src="na/' + ic + '.png" alt=""><span class="h3ml"><b>' + lab + '</b><small>' + sub + '</small></span>'; d.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); const mp = document.getElementById('h2menuPop'); if (mp) mp.classList.remove('open'); fn(); }); g.appendChild(d); }
  function apply() {
    const mp = document.getElementById('h2menuPop'), g = mp && mp.querySelector('.grid'); if (!g) return;
    row(g, 'sl_events', 'i_star', 'Etkinlikler', 'Kale Kuşatması, Rün Dağı, Zindan, Klan Savaşı • hediyeler', () => { if (window.kdOpenEvents) kdOpenEvents(); });
    row(g, 'sl_search', 'ii_Bag', 'Pazar Ara', 'Bütün tezgâhlarda eşya ara, en ucuzu bul', () => { if (window.kdOpenSearch) kdOpenSearch(); });
    for (const [t, o] of SEC) { let h = g.querySelector('.h3sec[data-o="' + o + '"]'); if (!h) { h = document.createElement('div'); h.className = 'h3sec'; h.dataset.o = o; h.textContent = t; h.style.setProperty('--o', o); g.appendChild(h); } }
    for (const e of g.children) { if (!e.classList.contains('slot')) continue; if (ORDER[e.id] != null) e.style.order = ORDER[e.id]; else if (e.id === 'sl_gm') e.classList.add('h3gone'); }
    const ttl = mp.querySelector('.ttl'); if (ttl && !ttl.querySelector('.h3close')) { const b = document.createElement('button'); b.className = 'h3close'; b.textContent = 'Kapat ✕'; b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); mp.classList.remove('open'); }); ttl.appendChild(b); }
  }
  apply(); setInterval(apply, 500);
})();
