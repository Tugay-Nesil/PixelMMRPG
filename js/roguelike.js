'use strict';
// =====================================================================
//  ROGUE-LIKE EKLER (Treasure Hunter tarzı)
//  1) Yuvarlanma / takla (dodge roll): Shift ya da ekrandaki 💨 düğmesi.
//     Kısa süre hızlı kayarsın ve bu sırada hasar almazsın.
//  2) Seviye atlayınca 3 karttan 1 "kutsama" seçme. Kutsamalar kalıcı
//     ve üst üste binebilir; kayıtta saklanır.
// =====================================================================

// ---------- KUTSAMALAR ----------
const BOONS=[
  {id:'guc',       n:'Savaş Gücü',    ic:'⚔️', d:'Hasar +%12'},
  {id:'demir',     n:'Demir Zırh',    ic:'🛡️', d:'Savunma +6 • gelen hasar −%3'},
  {id:'can',       n:'Dayanıklılık',  ic:'❤️', d:'Azami can +%15'},
  {id:'hiz',       n:'Tez Ayak',      ic:'🌀', d:'Hareket hızı +%8'},
  {id:'krit',      n:'Keskin Nişan',  ic:'🎯', d:'Kritik şansı +%7'},
  {id:'kritHasar', n:'Ölümcül Vuruş', ic:'💥', d:'Kritik hasarı +%30'},
  {id:'hizliEl',   n:'Hızlı El',      ic:'⚡', d:'Saldırı hızı +%10'},
  {id:'vampir',    n:'Kan Emme',      ic:'🩸', d:'Verdiğin hasarın %5\'i can olur'},
  {id:'menzil',    n:'Uzun Menzil',   ic:'🏹', d:'Saldırı menzili +%10'},
  {id:'yenilenme', n:'Yenilenme',     ic:'♻️', d:'Can ve mana daha hızlı dolar'},
];
const BOON_BY_ID={};for(const b of BOONS)BOON_BY_ID[b.id]=b;

function applyBoons(p){const s=p.stats;const c={};for(const id of p.boons)c[id]=(c[id]||0)+1;
  if(c.guc)      s.atk*=Math.pow(1.12,c.guc);
  if(c.demir){   s.def+=6*c.demir; s.dmgRed=(s.dmgRed||0)+0.03*c.demir; }
  if(c.can)      s.maxHp=Math.round(s.maxHp*Math.pow(1.15,c.can));
  if(c.hiz)      s.spd*=Math.pow(1.08,c.hiz);
  if(c.krit)     s.crit+=0.07*c.krit;
  if(c.kritHasar)s.critDmg+=0.30*c.kritHasar;
  if(c.hizliEl)  s.as/=Math.pow(1.10,c.hizliEl);
  if(c.vampir)   s.lifesteal=(s.lifesteal||0)+0.05*c.vampir;
  if(c.menzil)   s.range*=Math.pow(1.10,c.menzil);
  if(c.yenilenme){s.regen=(s.regen||0)+0.01*c.yenilenme; s.mpRegen=(s.mpRegen||0)+0.012*c.yenilenme;}
  s.crit=Math.min(.75,s.crit);s.dodge=Math.min(.6,s.dodge);s.dmgRed=Math.min(.7,s.dmgRed);}

// kayıt + yeni oyuncu + recalc bağlantıları
SAVE_FIELDS.push('boons');
{const _np=newPlayer;newPlayer=function(o){const p=_np(o);p.boons=[];return p;};}
{const _rc=recalc;recalc=function(p){const h=p.hp,m=p.mp;_rc(p);if(p===player&&p&&p.boons&&p.boons.length){applyBoons(p);/* ödüller en yüksek canı büyütür: can/mana, ödüllü sınıra göre kırpılmalı (önceden ödülsüz sınıra kırpılıyordu) */if(h!=null)p.hp=Math.min(h,p.stats.maxHp);if(m!=null)p.mp=Math.min(m,p.stats.maxMp);}};}
{const _sg=startGame;startGame=function(d,isNew){_sg(d,isNew);if(player&&!player.boons)player.boons=[];if(player){recalc(player);player.hp=Math.min(player.hp,player.stats.maxHp);}};}

// ---------- KUTSAMA PANELİ ----------
const boonWin=document.createElement('div');boonWin.id='boon';boonWin.className='panel win hidden';document.body.appendChild(boonWin);
let boonOpen=false,boonQueue=0;
function openBoon(){const p=player;if(!p)return;boonOpen=true;
  const pool=BOONS.slice(),pick=[];while(pick.length<3&&pool.length)pick.push(pool.splice(Math.floor(rand()*pool.length),1)[0]);
  let h='<h2>Seviye '+p.lvl+' • Kutsama Seç</h2><div class="mut" style="font-size:12px;margin:2px 0 10px">Bir kutsama seç — kalıcıdır ve üst üste birikir.'+(boonQueue>1?' ('+boonQueue+' seçim sırada)':'')+'</div><div class="booncards">';
  for(const b of pick){const have=p.boons.filter(x=>x===b.id).length;h+='<button type="button" class="booncard" data-boon="'+b.id+'"><div class="bic">'+b.ic+'</div><div class="bn">'+b.n+'</div><div class="bd">'+b.d+'</div>'+(have?'<div class="bhave">sahip: '+have+'</div>':'')+'</button>';}
  boonWin.innerHTML=h+'</div>';boonWin.classList.remove('hidden');}
boonWin.addEventListener('click',e=>{const t=e.target.closest('[data-boon]');if(!t)return;const p=player;
  p.boons.push(t.dataset.boon);const b=BOON_BY_ID[t.dataset.boon];recalc(p);if(b.id==='can')p.hp=p.stats.maxHp;
  effects.push({type:'lvl',x:p.x,y:p.y,t:0,dur:1.2});addChat(null,'✨ Kutsama kazandın: '+b.ic+' '+b.n,'#ffd860');
  boonQueue--;boonWin.classList.add('hidden');boonOpen=false;save();
  if(boonQueue>0)setTimeout(openBoon,160);});
boonWin.addEventListener('keydown',e=>e.stopPropagation());

// seviye atlayınca sıraya ekle
{const _gx=gainXp;gainXp=function(n){const before=player?player.lvl:0;_gx(n);if(!player)return;const g=player.lvl-before;if(g>0){boonQueue+=g;if(!boonOpen)openBoon();}};}

// ---------- YUVARLANMA (DODGE ROLL) ----------
const DASH_SPD=520,DASH_TIME=0.18,DASH_CD=0.9;
let dashUntil=0,nextDash=0,dashX=0,dashY=1,lastDirX=0,lastDirY=1;
function tryDash(){const p=player;if(!p||p.dead||!running||boonOpen)return;if(gameTime<nextDash||gameTime<dashUntil)return;
  let dx=lastDirX,dy=lastDirY;if(dx===0&&dy===0){dx=p.face||1;dy=0;}const l=Math.hypot(dx,dy)||1;dashX=dx/l;dashY=dy/l;
  dashUntil=gameTime+DASH_TIME;nextDash=gameTime+DASH_CD;p.stealthUntil=Math.max(p.stealthUntil,dashUntil+0.05);
  p.moveTo=null;p.chase=false;for(let i=0;i<6;i++)particles.push({x:p.x,y:p.y-10,vx:-dashX*60+rr(-20,20),vy:-dashY*60+rr(-20,20),life:.3,max:.3,col:'#dff0ff',s:3});}

addEventListener('keydown',e=>{if(typeof chatIn!=='undefined'&&document.activeElement===chatIn)return;
  if(e.key==='Shift'){e.preventDefault();tryDash();}},false);

// ---------- ekrandaki yuvarlanma düğmesi ----------
const dodgeBtn=document.createElement('div');dodgeBtn.id='dodgeBtn';dodgeBtn.className='hidden';dodgeBtn.textContent='💨';document.body.appendChild(dodgeBtn);
dodgeBtn.addEventListener('pointerdown',e=>{e.preventDefault();tryDash();});
{const _sg=startGame;startGame=function(d,isNew){_sg(d,isNew);if(typeof touchUI!=='undefined'&&touchUI)dodgeBtn.classList.remove('hidden');};}

// ---------- oyun döngüsüne bağla ----------
{const _up=update;update=function(dt){
  if(boonOpen)return;                         // kutsama seçilirken dünya durur
  const p=player;
  if(p&&!p.dead&&running){let dx=0,dy=0;if(keys.w||keys.arrowup)dy--;if(keys.s||keys.arrowdown)dy++;if(keys.a||keys.arrowleft)dx--;if(keys.d||keys.arrowright)dx++;if(dx||dy){lastDirX=dx;lastDirY=dy;}}
  _up(dt);
  if(p&&!p.dead&&gameTime<dashUntil){moveEnt(p,dashX*DASH_SPD*dt,dashY*DASH_SPD*dt);
    if(rand()<.6)particles.push({x:p.x+rr(-5,5),y:p.y-rr(2,14),vx:-dashX*40,vy:-dashY*40,life:.25,max:.25,col:'#cfe8ff',s:2});}
  // yuvarlanma düğmesi bekleme göstergesi
  if(dodgeBtn&&!dodgeBtn.classList.contains('hidden')){const cd=nextDash-gameTime;dodgeBtn.style.opacity=cd>0?'.45':'1';}
};}

window.__rogue={boons:()=>player&&player.boons,dash:tryDash,levelPanel:openBoon};
// v47: yeni oyun / kayıt yüklenince açık kalmış kutsama seçimi dünyayı dondurmasın
{const _sg=startGame;startGame=function(){boonOpen=false;boonQueue=0;try{boonWin.classList.add('hidden');}catch(e){}return _sg.apply(this,arguments);};window.startGame=startGame;}
// v49: kutsama seçimi ve ileri atılma (kaçış/dash) oyundan kaldırıldı.
// Gelişim yalnız özellik puanları + ekipman. Eski kayıtlardaki kutsamalar silinir.
openBoon=function(){boonQueue=0;boonOpen=false;};
tryDash=function(){};
try{dodgeBtn.remove();}catch(e){}
{const _sg2=startGame;startGame=function(){const r=_sg2.apply(this,arguments);try{if(player){player.boons=[];boonOpen=false;boonQueue=0;boonWin.classList.add('hidden');recalc(player);}}catch(e){}return r;};window.startGame=startGame;}
