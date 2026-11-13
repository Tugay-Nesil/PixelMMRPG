'use strict';
// =====================================================================
//  KAMP ATEŞİ • ÜZERİNDE DURUNCA TOPLAMA • MALZEME ÇANTASI
//  DOKUNMATİK JOYSTICK • BİLGE DEDE REHBERİ
// =====================================================================
let fires=[];
function initFires(){fires=[];
  if(M.id==='yesilvadi'){if(M.fireSpots)for(const f of M.fireSpots)fires.push({x:f.x,y:f.y});else fires.push({x:58.5*TILE,y:58.5*TILE},{x:69.5*TILE,y:61*TILE},{x:58.5*TILE,y:69.5*TILE});
    for(const z of (M.W>200?['meadow','meadow','meadow','forestW','forestW','forestE','forestE','ruins','ruins','volcano']:['meadow','meadow','forestW','forestE','ruins','volcano'])){const s=findSpot(z,(tx,ty)=>!inSafe(tx*TILE,ty*TILE));if(s)fires.push({x:s.x,y:s.y});}}
  else if(M.id==='sinir'){if(M.fireSpots)for(const f of M.fireSpots)fires.push({x:f.x,y:f.y});else fires.push({x:56*TILE,y:96.5*TILE},{x:56*TILE,y:14*TILE});}
  else if(M.id==='mahzen')fires.push({x:M.start.x+40,y:M.start.y});
  for(const f of fires)if(M.dark)M.torches.push({x:f.x,y:f.y-6,fire:true});}
function drawFire(f){const x=f.x,y=f.y,t=gameTime;
  ctx.save();ctx.globalCompositeOperation='lighter';softDot(x,y-10,60+Math.sin(t*7)*4,'#ff9a30',.28);ctx.restore();
  ctx.fillStyle='#5a5660';for(let k=0;k<8;k++){const a=k/8*Math.PI*2;ctx.fillRect(x+Math.cos(a)*14-3,y+Math.sin(a)*6-2,6,4);}
  ctx.fillStyle='#6a4022';ctx.save();ctx.translate(x,y-2);ctx.rotate(.4);ctx.fillRect(-11,-2,22,5);ctx.rotate(-.8);ctx.fillRect(-11,-2,22,5);ctx.restore();
  for(let k=0;k<3;k++){const ph=t*9+k*2.1,h=16+Math.sin(ph)*4-k*3,w=7-k*1.5;ctx.fillStyle=['#e8501a','#ff9a20','#ffe060'][k];ctx.beginPath();ctx.moveTo(x-w,y-2);ctx.quadraticCurveTo(x-w*.6+Math.sin(ph)*2,y-h*.6,x+Math.sin(ph*1.3)*2,y-h);ctx.quadraticCurveTo(x+w*.6,y-h*.5,x+w,y-2);ctx.closePath();ctx.fill();}
  if(rand()<.25)particles.push({x:x+rr(-5,5),y:y-14,vx:rr(-10,10),vy:rr(-60,-30),life:.8,max:.8,col:pick(['#ffb040','#ffe080']),s:2});}
function updFires(dt){const p=player;if(p.dead)return;p.warm=false;for(const f of fires){if(Math.hypot(p.x-f.x,p.y-f.y)<70){p.warm=true;break;}}
  if(p.warm&&gameTime-p.lastHit>2){healPlayer(p.stats.maxHp*.05*dt,true);p.mp=Math.min(p.stats.maxMp,p.mp+p.stats.maxMp*.05*dt);}}

// ---------- üzerinde durunca otomatik toplama ----------
function autoGather(){const p=player;if(p.dead||p.gathering||p.opening||p.moving||p.target&&!p.target.dead&&dist(p,p.target)<300)return;
  for(const n of nodes){if(n.ready&&Math.hypot(p.x-n.x,p.y-n.y)<30){startGather(n);return;}}}

// ---------- malzeme çantası ----------
function bagSlots(){return Math.min(40,8+Math.floor(player.lvl/2)*2);}
{const _re=renderExtra;renderExtra=function(){if(extraMode!=='bag')return _re();const p=player,open=bagSlots();const items=[];
  for(const k of Object.keys(RES))if(p.res[k]>0)items.push({ic:RES[k].ic,n:p.res[k],t:RES[k].n});
  for(const k of Object.keys(MATS))if(p.mats[k]>0)items.push({ic:MATS[k].ic,n:p.mats[k],t:MATS[k].n});
  if(p.compass)items.push({ic:'🧭',n:p.compass,t:'Hazine Pusulası'});
  let g='';for(let i=0;i<40;i++){if(i>=open)g+='<div class="it lock">🔒</div>';else if(items[i])g+='<div class="it g0" title="'+esc(items[i].t)+'">'+items[i].ic+'<span class="lv">'+items[i].n+'</span></div>';else g+='<div class="it empty"></div>';}
  $('extra').innerHTML='<button class="x" data-close="extra">✕</button><h2>🧺 Malzeme Çantası</h2><div class="mut" style="font-size:12px;margin-top:2px">Açık yuva: '+open+'/40 • Her 2 seviyede 2 yuva daha açılır.</div><div class="bag">'+g+'</div><div class="mut" style="font-size:11.5px;margin-top:8px">Malzemeleri kaledeki Zanaatkâr\'in atölyesinde iksire, parşömene ve eşyaya dönüştürebilirsin.</div>';};}
function toggleBag(){if(!$('extra').classList.contains('hidden')&&extraMode==='bag'){$('extra').classList.add('hidden');return;}openExtra('bag');}

// ---------- dokunmatik joystick ----------
const touchUI=matchMedia('(pointer: coarse)').matches||innerWidth<700;let joyVec=null;
(()=>{const joy=$('joy'),knob=$('knob'),atk=$('atkBtn');let jid=null;
  const set=(e)=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2;let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy);if(l>R){dx=dx/l*R;dy=dy/l*R;}knob.style.transform='translate('+dx+'px,'+dy+'px)';joyVec=l>R*.18?{x:dx/R,y:dy/R}:null;};
  joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);set(e);e.preventDefault();});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)set(e);});
  const end=e=>{if(e.pointerId!==jid)return;jid=null;joyVec=null;knob.style.transform='';};joy.addEventListener('pointerup',end);joy.addEventListener('pointercancel',end);
  atk.addEventListener('pointerdown',e=>{e.preventDefault();const p=player;if(!p||p.dead)return;if(!p.target||p.target.dead||dist(p,p.target)>450){const t=nearestEnemy(450);if(t)p.target=t;}if(p.target){p.chase=true;p.moveTo=null;}else talkNearest();});})();
function moveByJoy(dt){const p=player;if(!joyVec||p.dead)return;p.moveTo=null;p.chase=false;p.talkTo=null;const s=p.stats.spd*Math.min(1,Math.hypot(joyVec.x,joyVec.y)*1.2);const l=Math.hypot(joyVec.x,joyVec.y)||1;moveEnt(p,joyVec.x/l*s*dt,joyVec.y/l*s*dt);}

// ---------- Bilge rehberi ----------
const TUT=[
  {t:'Hoş geldin, yolcu! Ben Bilge. Yürümek için <b>WASD / ok tuşlarını</b> kullan ya da yere <b>tıkla / basılı tut</b>. Telefonda sol alttaki çubuğu sürükle.',done:p=>p._moved>160},
  {t:'Güzel! Şimdi kale meydanındaki <b>Elder Aldric</b> ile konuş — başında sarı <b>❗</b> var. Ekrandaki <b>sarı ok</b> seni ona götürür.',done:p=>p.questActive||p.questIdx>0},
  {t:'Kalenin dışında ot, odun, maden ve kristal bulursun. Bir kaynağın <b>üzerinde durman</b> yeterli; toplama kendiliğinden başlar.',done:p=>Object.values(p.res).some(v=>v>0)},
  {t:'Şimdi bir canavarla savaş! Ona tıkla ya da <b>Boşluk</b>a bas. Yeteneklerin <b>1-2-3</b> tuşlarında, iksirler <b>Q / E</b>\'de.',done:p=>p.kills>0},
  {t:'Harika! Son ipuçları: <b>🔥 kamp ateşinin</b> yanında canın hızla dolar. <b>U</b> malzeme çantası, <b>K</b> yetenek ağacı, <b>M</b> harita, <b>R</b> binek. Haritada 🗝 görürsen hazine avı başlar. İyi şanslar!',done:(p,s)=>gameTime-s>12},
];
let tutShownAt=0,tutIdx=-1;
function updTut(){const p=player,el=$('tut');if(p.tut==null||p.tut>=TUT.length){el.classList.add('hidden');return;}
  if(p.tut!==tutIdx){tutIdx=p.tut;tutShownAt=gameTime;el.innerHTML='<div class="av">🧙</div><h2>Bilge</h2><span class="step">'+(p.tut+1)+'/'+TUT.length+'</span><div>'+TUT[p.tut].t+'</div><div class="tb"><button id="tutSkip">Rehberi kapat</button></div>';el.classList.remove('hidden');$('tutSkip').onclick=()=>{p.tut=99;save();};}
  if(TUT[p.tut].done(p,tutShownAt)){p.tut++;save();}}

// ================= BAĞLANTILAR =================
SAVE_FIELDS.push('tut');
{const _np=newPlayer;newPlayer=function(o){const p=_np(o);p.tut=0;return p;};}
{const _sg=startGame;startGame=function(d,isNew){_sg(d,isNew);const p=player;if(!isNew&&(p.tut==null||p.lvl>2)&&!(p.tut>=0&&p.tut<TUT.length&&p.lvl<=2))p.tut=99;tutIdx=-1;
  if(touchUI){$('joy').classList.remove('hidden');$('atkBtn').classList.remove('hidden');}};}
{const _em=enterMap;enterMap=function(id,x,y){_em(id,x,y);initFires();};}
{const _up=update;update=function(dt){const p=player;const ox=p?p.x:0,oy=p?p.y:0;if(p&&joyVec)moveByJoy(dt);_up(dt);if(!player)return;
  if(!player.dead)player._moved=(player._moved||0)+Math.hypot(player.x-ox,player.y-oy);updFires(dt);autoGather();updTut();};}
{const _el=extrasToList;extrasToList=function(list){_el(list);for(const f of fires)list.push({y:f.y,k:7,fn:()=>drawFire(f)});};}
{const _et=drawExtrasTop;drawExtrasTop=function(){_et();const p=player;if(p.warm&&!p.dead&&p.hp<p.stats.maxHp&&gameTime-p.lastHit>2)label(p.x,p.y-104+(p.key?-14:0),'🔥 Isınıyor','#ffc070',11);};}
{const _bb=buildBar;buildBar=function(){_bb();const bar=$('bar'),sv=$('sl_sv');const d=document.createElement('div');d.className='slot';d.id='sl_bag';d.innerHTML='<span class="k">U</span>🧺<span class="n"></span><div class="cd"></div><div class="cdt"></div>';d.onclick=toggleBag;d.onmouseenter=ev=>showTip('<b>Malzeme Çantası</b> (U)',ev);d.onmousemove=moveTip;d.onmouseleave=hideTip;bar.insertBefore(d,sv);};}
addEventListener('keydown',e=>{if(!running||!player||document.activeElement===chatIn||e.repeat)return;if(e.key.toLowerCase()==='u')toggleBag();});
// Yedek kayıt varsa açılış ekranında geri yükleme düğmesi
(()=>{let bk=null;try{bk=localStorage.getItem(SAVE_KEY+'_yedek');}catch(e){}if(!bk)return;let d;try{d=JSON.parse(bk);}catch(e){return;}if(!d||!CLASSES[d.cls])return;
  const st=$('start');if(!st)return;const w=document.createElement('div');w.style.margin='4px 0 10px';const btn=document.createElement('button');btn.textContent='↺ Yedek kaydı geri yükle — '+d.name+' (Sv '+d.lvl+')';btn.onclick=()=>{try{localStorage.setItem(SAVE_KEY,bk);localStorage.removeItem(SAVE_KEY+'_yedek');}catch(e){}location.reload();};w.appendChild(btn);st.insertBefore(w,st.children[2]||null);})();
