'use strict';
// =====================================================================
//  DİKEY TELEFON DÜZENİ
//  Saldırı düğmesi sağ altta; 3 yetenek onun soluna yay şeklinde dizilir,
//  can ve mana iksiri hemen altında. Menü düğmeleri iki yanda dikey sütunda.
// =====================================================================
const PORTRAIT_Q=matchMedia('(orientation: portrait) and (max-width: 820px)');
const sideL=document.createElement('div'),sideR=document.createElement('div'),actPad=document.createElement('div');
sideL.id='sideL';sideR.id='sideR';actPad.id='actPad';
sideL.className=sideR.className='sidecol hidden';actPad.className='hidden';
document.body.append(sideL,sideR,actPad);
const PAD_SLOTS=['sl_s0','sl_s1','sl_s2','sl_ph','sl_pm'];

// buildBar her çağrıldığında düğmeler baştan oluşur; burada yerlerine dağıtılır.
function layoutMobile(){const por=PORTRAIT_Q.matches;document.body.classList.toggle('portrait',por);
  sideL.innerHTML='';sideR.innerHTML='';actPad.innerHTML='';
  const show=por&&running;for(const el of [sideL,sideR,actPad])el.classList.toggle('hidden',!show);if(!show)return;
  const bar=$('bar');
  for(const id of PAD_SLOTS){const el=$(id);if(el){el.classList.add('pad_'+id.slice(3));actPad.appendChild(el);}}
  const menu=[...bar.children].filter(c=>c.classList.contains('slot'));
  const half=Math.ceil(menu.length/2);menu.forEach((c,i)=>(i<half?sideL:sideR).appendChild(c));
  $('joy').classList.remove('hidden');$('atkBtn').classList.remove('hidden');}

{const _bb=buildBar;buildBar=function(){_bb();layoutMobile();};}
PORTRAIT_Q.addEventListener('change',()=>{document.body.classList.toggle('portrait',PORTRAIT_Q.matches);if(running&&player)buildBar();});
document.body.classList.toggle('portrait',PORTRAIT_Q.matches);
