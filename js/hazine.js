'use strict';
// =====================================================================
//  HAZİNE AVI • BİNEKLER • EVCİL HAYVANLAR • TOPLAMA VE ÜRETİM
//  (Bu dosya diğer dosyalardan sonra yüklenir ve onlara bağlanır.)
// =====================================================================
const RES={wood:{n:'Odun',ic:'🪵'},ore:{n:'Demir Cevheri',ic:'🪨'},herb:{n:'Şifalı Ot',ic:'🌿'},crystal:{n:'Ruh Kristali',ic:'💎'}};
const NODE_T={wood:'Odun Yığını',ore:'Maden Damarı',herb:'Şifalı Ot',crystal:'Kristal Kümesi'};
const MOUNTS={
  horse:{n:'Doru At',ic:'🐎',spd:.6,lv:5,price:800,col:'#8a5a32',mane:'#2a1a10',saddle:'#7a2a1a',desc:'Sadık ve hızlı bir savaş atı.'},
  wolf:{n:'Boz Kurt',ic:'🐺',spd:.8,lv:12,price:4000,col:'#8e949c',mane:'#5a5e66',saddle:'#2a4a7a',desc:'Ormanların vahşi koşucusu.'},
  lizard:{n:'Alev Kertenkelesi',ic:'🦎',spd:1,lv:18,price:12000,col:'#b8402a',mane:'#ffb040',saddle:'#3a2a1a',desc:'Ejder Tepesi\'nin sıcak kumlarında yetişir.'},
  star:{n:'Yıldız Atı',ic:'🦄',spd:1.15,lv:1,price:0,chest:true,col:'#eef2ff',mane:'#9fd8ff',saddle:'#c9a030',desc:'Yalnızca Altın hazine sandıklarından çıkar. Ardında yıldız tozu bırakır.'},
};
const PETS={
  fox:{n:'Tilki Yavrusu',ic:'🦊',ab:'loot',price:1500,desc:'Yakındaki ganimeti koşup senin için toplar.'},
  drake:{n:'Yavru Ejder',ic:'🐲',ab:'attack',price:5000,desc:'Hedefine küçük ateş topları fırlatır.'},
  fairy:{n:'Şifa Perisi',ic:'🧚',ab:'heal',price:5000,desc:'Savaşta canını yavaş yavaş yeniler.'},
  owl:{n:'Bilge Baykuş',ic:'🦉',ab:'owl',price:0,chest:true,desc:'+%15 TP kazandırır. Yalnızca hazine sandıklarından çıkar.'},
};
const KEY_T=[{n:'Bronz',col:'#d0884a',m:1},{n:'Gümüş',col:'#dfe6ee',m:2},{n:'Altın',col:'#ffd040',m:3.5}];
const HUNTER_NAMES=['Kara Akbaba','Sinsi Ferit','Altın Kurdu','Gölge Avcı','Kuyruklu Yıldız','Paslı Bıçak','Gece Kartalı','Leş Kargası'];
const RECIPES=[
  {id:'potHp',n:'Can İksiri ×2',ic:'🧪',need:{herb:2},gold:0,make:p=>{p.potHp+=2;}},
  {id:'potMp',n:'Mana İksiri ×2',ic:'🧪',need:{herb:2,crystal:1},gold:0,make:p=>{p.potMp+=2;}},
  {id:'up',n:'Yükseltme Parşömeni',ic:'📜',need:{wood:3,ore:3},gold:20,make:p=>{p.mats.up++;}},
  {id:'ench',n:'Efsun Parşömeni',ic:'🔮',need:{crystal:2,ore:3,herb:2},gold:40,make:p=>{p.mats.ench++;}},
  {id:'luck',n:'Şans Parşömeni',ic:'🍀',need:{crystal:6,ore:4,herb:2},gold:150,make:p=>{p.mats.luck++;}},
  {id:'compass',n:'Hazine Pusulası',ic:'🧭',need:{crystal:4,ore:4,wood:4},gold:100,desc:'Kullanınca yakınında yeni bir hazine anahtarı belirir.',make:p=>{if(treasure&&!treasure.key&&!treasure.chest&&!p.key){spawnTreasure(true);return true;}p.compass=(p.compass||0)+1;addChat(null,'🧭 Pusula çantana kondu. Şu an aktif bir hazine olduğundan, bu hazine bitince otomatik kullanılacak.','#ffd040');}},
  {id:'gear',n:'Usta İşi Eşya',ic:'⚒️',need:{ore:8,wood:5,crystal:3},gold:200,desc:'Seviyende rastgele bir Nadir (mor) eşya.',make:p=>{if(p.inv.length>=40){p.gold+=200;showToast('Çanta dolu!','',1.2);return;}const it=makeItem(pick(DROP_SLOTS),p.lvl,rand()<.12?2:1,p.cls);p.inv.push(it);addChat(null,'⚒ Üretildi: ['+itemName(it)+']',GRADES[it.grade].col);}},
];

let nodes=[],treasure=null,petObj=null,specials=[];

// ---------------- harita başlangıcı ----------------
function addNodes(type,zones,n){for(let i=0;i<n;i++){const s=findSpot(pick(zones),(tx,ty)=>!inSafe(tx*TILE,ty*TILE));if(s)nodes.push({kind:'node',type,x:s.x,y:s.y,ready:true,respAt:0,r:14,v:ri(0,3)});}}
function initMapExtras(){nodes=[];specials=[];treasure=M.id==='mahzen'?null:{key:null,chest:null,timer:rr(25,45),race:null,botHold:null};
  if(M.id==='yesilvadi'){const F=M.W>200?2.6*(M.W*M.H)/(256*256):1;addNodes('herb',['meadow','forestW','forestE'],Math.round(30*F));addNodes('wood',['forestW','forestE'],Math.round(26*F));addNodes('ore',['ruins','volcano','forestE'],Math.round(24*F));addNodes('crystal',['volcano','ruins'],Math.round(12*F));
    for(const b of bots)if(!b.mortal&&rand()<.4)b.mount=pick(['horse','horse','wolf','panther']);}
  else if(M.id==='sinir'){const F=M.W>150?2.5:1;addNodes('ore',['mid'],Math.round(18*F));addNodes('crystal',['mid'],Math.round(14*F));addNodes('herb',['mid'],Math.round(10*F));}
  else if(M.id==='mahzen'){addNodes('crystal',['mahzen'],10);addNodes('ore',['mahzen'],8);}
  const p=player;p.key=null;p.gathering=null;p.opening=null;p.gatherTo=null;}

// ---------------- hazine ----------------
function spawnTreasure(near){const tr=treasure,p=player;if(!tr)return;const zones=M.pvp?['mid','center']:['meadow','forestW','forestE','ruins','volcano'];
  const ks=near?findSpot(null,(tx,ty)=>{const d=Math.hypot(tx*TILE-p.x,ty*TILE-p.y);return d>5*TILE&&d<11*TILE&&!inSafe(tx*TILE,ty*TILE);}):findSpot(pick(zones),(tx,ty)=>!inSafe(tx*TILE,ty*TILE));if(!ks)return;
  let cs=null;for(let k=0;k<40&&!cs;k++){const s=findSpot(pick(zones),(tx,ty)=>!inSafe(tx*TILE,ty*TILE));if(s&&Math.hypot(s.x-ks.x,s.y-ks.y)>28*TILE)cs=s;}if(!cs)return;
  const r=rand(),tier=M.pvp?(r<.3?0:r<.7?1:2):(r<.6?0:r<.9?1:2);
  tr.key={x:ks.x,y:ks.y,tier};tr.chest={x:cs.x,y:cs.y,tier};
  const zn=M.zones[M.zoneOf(ks.tx,ks.ty)];addChat(null,'🗝 Bir '+KEY_T[tier].n+' Anahtar ortaya çıktı! ('+(zn?zn.name:'')+') Haritada 🗝 işaretine bak, herkesten önce kap!',KEY_T[tier].col);showToast(KEY_T[tier].n+' Anahtar belirdi!','Haritada 🗝 işaretine bak');
  const free=bots.filter(b=>b.alive&&!b.mortal);if(!M.pvp&&free.length&&rand()<.7){tr.race=pick(free);}}
function endTreasure(){const tr=treasure;tr.key=null;tr.chest=null;tr.race=null;tr.botHold=null;tr.timer=rr(70,130);
  if(player.compass>0){player.compass--;tr.timer=1;tr.nearNext=true;}}
function takeKey(){const tr=treasure,k=tr.key,p=player;p.key={tier:k.tier,until:gameTime+180};tr.key=null;tr.race=null;if(p.riding){}
  addChat(null,'🗝 '+KEY_T[k.tier].n+' Anahtarı aldın! Sandığın yeri haritada ★ ile işaretlendi. 3 dakikan var — ama artık KONUMUN HERKESE AÇIK!','#ffd040');showToast('Anahtar sende!','Konumun herkese açık — sandığa koş!',2.6);
  if(M.pvp){for(const e of enemies)if(e.d.pvp&&!e.dead)e.target=p;addChat(null,'⚠ Bütün Gölge savaşçıları seni görüyor!','#ff6060');}else for(let i=0;i<1+k.tier;i++)spawnHunter();}
function spawnHunter(){const p=player;for(let k=0;k<30;k++){const a=rand()*7,d=rr(420,640),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;if(blocked(x,y,8)||inSafe(x,y))continue;
  const e=makeFoe({type:'foe',lvl:clamp(p.lvl+ri(0,2),1,MAXL),x,y,resp:1e9});e.name=pick(HUNTER_NAMES);e.hunter=true;e.target=p;enemies.push(e);addChat(e.name,pick(['o anahtar benim olacak!','kaçamazsın 😈','hazineyi bana bırak!','yerini görüyorum...']),'#ff6060');return;}}
function startOpen(){const p=player,tr=treasure;if(!tr||!tr.chest)return;if(!p.key){fl(p.x,p.y-80,'Anahtarın yok!','#ffb070',13);return;}if(p.key.tier<tr.chest.tier){fl(p.x,p.y-80,KEY_T[tr.chest.tier].n+' anahtar gerekli','#ffb070',13);return;}
  p.riding=false;p.moveTo=null;p.opening={start:gameTime,until:gameTime+3};fl(p.x,p.y-80,'Sandık açılıyor...','#ffd040',13);}
function openChest(){const p=player,tr=treasure,c=tr.chest,m=KEY_T[c.tier].m,L=p.lvl,tier=c.tier;p.opening=null;p.key=null;
  const add=(k,v)=>loots.push({x:c.x+rr(-30,30),y:c.y+rr(-14,20),kind:k,val:v,t:gameTime,bob:rand()*6});const sp=(k,v,n)=>specials.push({x:c.x+rr(-30,30),y:c.y+rr(-14,20),kind:k,val:v,n:n||1,t:gameTime,bob:rand()*6});
  for(let i=0;i<3+tier*2;i++)add('gold',Math.round(ri(40,90)*m+L*5));
  for(let i=0;i<1+tier;i++)add('gear',makeItem(pick(DROP_SLOTS),L,tier===2?gradeRoll(2):gradeRoll(1),p.cls));
  for(let i=0;i<2+tier;i++)add('mat','up');if(rand()<.4*m)add('mat','ench');if(rand()<.15*m)add('mat','luck');if(tier>=1&&rand()<.3*tier)add('mat','prot');
  for(let i=0;i<2+tier*2;i++)sp('res',pick(Object.keys(RES)),ri(2,4));
  const petPool=Object.keys(PETS).filter(k=>tier===2||!PETS[k].chest);if(rand()<[.03,.06,.14][tier])sp('pet',pick(petPool));
  if(tier===2&&rand()<.07)sp('mount','star');
  for(let i=0;i<50;i++)particles.push({x:c.x+rr(-10,10),y:c.y-14,vx:rr(-160,160),vy:rr(-260,-60),life:.9,max:.9,col:pick(['#ffd040','#fff3a0',KEY_T[tier].col]),s:rr(2,5)});
  effects.push({type:'ring',x:c.x,y:c.y,r0:10,r1:110,col:KEY_T[tier].col,t:0,dur:.7,fill:true});
  addChat(null,'💰 '+p.name+' bir '+KEY_T[tier].n+' Hazine Sandığı açtı!',KEY_T[tier].col);showToast(KEY_T[tier].n+' Sandık açıldı!','Ganimetini topla');
  if(bots.length)queueReply(pick(bots),pick(['vay be şanslısın!','ne çıktı ne çıktı?','gg hazine avcısı 👑']));endTreasure();save();}
function updTreasure(dt){const tr=treasure,p=player;if(!tr)return;
  if(!tr.key&&!tr.chest&&!p.key){tr.timer-=dt;if(tr.timer<=0){spawnTreasure(tr.nearNext);tr.nearNext=false;}return;}
  if(tr.key&&tr.race){const b=tr.race;if(!b.alive||b.mortal)tr.race=null;else{b.target=null;b.tx=tr.key.x;b.ty=tr.key.y;b.wt=9;b.mount=b.mount||null;if(dist(b,tr.key)<20){addChat(null,'🗝 '+b.name+' anahtarı senden önce kaptı ve sandığa koşuyor!','#ffb060');tr.botHold={b,until:gameTime+40};tr.key=null;tr.race=null;}}}
  if(tr.botHold){const b=tr.botHold.b;b.target=null;b.tx=tr.chest.x;b.ty=tr.chest.y;b.wt=9;if(gameTime>tr.botHold.until||dist(b,tr.chest)<26){addChat(null,'💰 '+b.name+' '+KEY_T[tr.chest.tier].n+' Hazine Sandığını açtı!','#ffb060');endTreasure();}}
  if(tr.key&&!p.dead&&Math.hypot(p.x-tr.key.x,p.y-tr.key.y)<28)takeKey();
  if(p.key){if(gameTime>p.key.until){addChat(null,'⌛ Anahtarın gücü tükendi ve toz oldu...','#ff9070');p.key=null;endTreasure();}
    else if(!M.pvp)for(const e of enemies)if(e.hunter&&!e.dead&&validTarget(p))e.target=p;}
  if(p.opening){if(p.dead||!tr.chest||dist(p,tr.chest)>70)p.opening=null;else if(p.lastHit>p.opening.start){p.opening=null;fl(p.x,p.y-80,'Açma kesildi!','#ff8080',13);}else if(gameTime>=p.opening.until)openChest();}}

// ---------------- toplama ----------------
function startGather(n){const p=player;if(!n.ready)return;p.riding=false;p.moveTo=null;p.gatherTo=null;p.gathering={node:n,start:gameTime,until:gameTime+1.8};}
function updGather(){const p=player;
  if(p.gatherTo){if(!p.gatherTo.ready)p.gatherTo=null;else if(dist(p,p.gatherTo)<46)startGather(p.gatherTo);}
  const g=p.gathering;if(!g)return;
  if(p.dead||!g.node.ready||p.moving||p.lastHit>g.start||dist(p,g.node)>60){p.gathering=null;return;}
  if(gameTime>=g.until){const n=g.node,amt=ri(1,3)+(M.pvp||M.id==='mahzen'?1:0);p.res[n.type]=(p.res[n.type]||0)+amt;n.ready=false;n.respAt=gameTime+rr(45,75);p.gathering=null;
    fl(n.x,n.y-30,'+'+amt+' '+RES[n.type].n,'#c8ffb0',13);for(let i=0;i<10;i++)particles.push({x:n.x,y:n.y-10,vx:rr(-60,60),vy:rr(-120,-40),life:.5,max:.5,col:{wood:'#a07040',ore:'#b0b0b8',herb:'#70e070',crystal:'#d080ff'}[n.type],s:3});
    if(rand()<.04){const k=pick(['up','ench']);p.mats[k]++;addChat(null,'✨ Toplarken buldun: '+MATS[k].ic+' '+MATS[k].n,MATS[k].col);}
    if(!$('extra').classList.contains('hidden'))renderExtra();}}
function updNodes(){for(const n of nodes)if(!n.ready&&gameTime>=n.respAt)n.ready=true;}

// ---------------- binek ----------------
function toggleMount(){const p=player;if(!p||p.dead)return;if(p.riding){p.riding=false;fl(p.x,p.y-80,'İndin','#ddd',12);return;}
  if(!p.mountId){showToast('Bineğin yok','Kaledeki Seyis\'den alabilirsin',1.8);return;}
  if(gameTime-p.lastHit<3){fl(p.x,p.y-80,'Savaş sırasında binilemez','#ff9090',12);return;}
  p.riding=true;p.gathering=null;p.opening=null;for(let i=0;i<18;i++)particles.push({x:p.x+rr(-20,20),y:p.y-rr(0,30),vx:rr(-40,40),vy:rr(-80,-20),life:.6,max:.6,col:'#e8e0d0',s:rr(3,6)});}
function drawMount(x,y,id,face,t,mv){const m=MOUNTS[id];if(!m)return;ctx.save();ctx.translate(x,y);shadow(0,0,26,7);ctx.scale(face||1,1);const g=mv?t*13:t*1.5,sw=k=>mv?Math.sin(g+k)*.65:Math.sin(g+k)*.03;const OL='rgba(0,0,0,.4)';
  if(id==='star'){ctx.save();ctx.globalCompositeOperation='lighter';const gr=ctx.createRadialGradient(0,-28,4,0,-28,40);gr.addColorStop(0,'rgba(160,210,255,.4)');gr.addColorStop(1,'rgba(160,210,255,0)');ctx.fillStyle=gr;ctx.fillRect(-40,-68,80,80);ctx.restore();if(mv&&rand()<.6)particles.push({x:x-face*24+rr(-4,4),y:y-20+rr(-6,6),vx:-face*30,vy:rr(-20,10),life:.7,max:.7,col:pick(['#ffffff','#9fd8ff','#ffe9a0']),s:2.5});}
  if(id==='horse'||id==='star'){const c=m.col,dk=shade(c,-35);
    const leg=(lx,k,col)=>{ctx.save();ctx.translate(lx,-20);ctx.rotate(sw(k));ctx.fillStyle=col;ctx.fillRect(-2.2,0,4.4,11);ctx.translate(0,10);ctx.rotate(Math.max(0,-sw(k))*1.1);ctx.fillRect(-1.9,0,3.8,8.5);ctx.fillStyle=id==='star'?'#c9a030':'#2a1a10';ctx.fillRect(-2.3,7.5,4.6,2.6);ctx.restore();};
    leg(-13,Math.PI,dk);leg(10,0,dk);
    ctx.strokeStyle=m.mane;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-19,-30);ctx.quadraticCurveTo(-29,-22+Math.sin(t*8)*3,-27,-10);ctx.stroke();
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,-27,21,9.5,0,0,7);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=.9;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.ellipse(-2,-31,14,3,0,0,7);ctx.fill();
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(11,-31);ctx.lineTo(18,-48);ctx.lineTo(26,-46);ctx.lineTo(21,-26);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(27,-46,8,4.4,.45,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=m.mane;ctx.beginPath();ctx.moveTo(10,-32);ctx.quadraticCurveTo(13,-44,18,-50);ctx.lineTo(16,-44);ctx.lineTo(14,-31);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(20,-49);ctx.lineTo(21,-55);ctx.lineTo(23,-48);ctx.fill();
    ctx.fillStyle='#111';ctx.fillRect(25,-49,2,2);if(id==='star'){ctx.fillStyle='#ffe080';ctx.beginPath();ctx.moveTo(28,-51);ctx.lineTo(36,-60);ctx.lineTo(30,-49);ctx.fill();}
    leg(-9,0,c);leg(14,Math.PI,c);
    ctx.fillStyle=m.saddle;rrect(-9,-38,15,8,3);ctx.fill();ctx.fillStyle='#e0b840';ctx.fillRect(-2,-31,2,7);ctx.strokeStyle='#3a2410';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(24,-44);ctx.lineTo(4,-36);ctx.stroke();}
  else if(id==='wolf'){const c=m.col,dk=shade(c,-30);const leg=(lx,k,col)=>{ctx.save();ctx.translate(lx,-16);ctx.rotate(sw(k));ctx.fillStyle=col;ctx.fillRect(-2.6,0,5.2,16);ctx.restore();};
    leg(-14,Math.PI,dk);leg(10,0,dk);ctx.strokeStyle=c;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-20,-24);ctx.quadraticCurveTo(-33,-28+Math.sin(t*6)*4,-31,-40);ctx.stroke();
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,-24,22,10,0,0,7);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=.9;ctx.stroke();circle(21,-32,10);ctx.fillRect(25,-33,12,7);ctx.beginPath();ctx.moveTo(15,-39);ctx.lineTo(17,-50);ctx.lineTo(22,-40);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffd040';ctx.fillRect(24,-36,3,3);ctx.fillStyle='#222';ctx.fillRect(35,-33,3,3);leg(-8,0,c);leg(15,Math.PI,c);ctx.fillStyle=m.saddle;rrect(-9,-35,15,8,3);ctx.fill();}
  else{const c=m.col,dk=shade(c,-35);const leg=(lx,k)=>{ctx.save();ctx.translate(lx,-12);ctx.rotate(sw(k)*.8);ctx.fillStyle=dk;ctx.fillRect(-2.5,0,5,6);ctx.translate(0,5);ctx.rotate(.6);ctx.fillRect(-2,0,4,7);ctx.restore();};
    ctx.strokeStyle=c;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-18,-16);ctx.quadraticCurveTo(-34,-10+Math.sin(t*5)*4,-46,-14+Math.sin(t*5+1)*3);ctx.stroke();
    leg(-12,Math.PI);leg(12,0);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,-18,22,9,0,0,7);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=.9;ctx.stroke();
    ctx.fillStyle=m.mane;for(let k=0;k<5;k++){ctx.beginPath();ctx.moveTo(-14+k*7,-26);ctx.lineTo(-11+k*7,-33);ctx.lineTo(-8+k*7,-26);ctx.fill();}
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(24,-22,10,6,.15,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#ffe040';ctx.fillRect(26,-25,3,2.5);ctx.fillStyle='rgba(255,170,60,.6)';if(mv&&rand()<.3)particles.push({x:x+face*34,y:y-20,vx:face*40,vy:-20,life:.4,max:.4,col:'#ffa040',s:3});
    leg(-8,0);leg(16,Math.PI);ctx.fillStyle=m.saddle;rrect(-9,-30,15,7,3);ctx.fill();}
  ctx.restore();}

// ---------------- evcil hayvan ----------------
function updPet(dt){const p=player;if(!p.petId||p.dead){if(!p.petId)petObj=null;return;}
  if(!petObj||petObj.id!==p.petId)petObj={id:p.petId,x:p.x-30,y:p.y,anim:0,face:1,atkT:0,busy:null};const pt=petObj,def=PETS[p.petId];pt.anim+=dt;
  let tx=p.x-30*p.face,ty=p.y-4;
  if(def.ab==='loot'){if(pt.busy&&!loots.includes(pt.busy)&&!specials.includes(pt.busy))pt.busy=null;if(!pt.busy){let bd=240;for(const l of [...loots,...specials]){const d=Math.hypot(l.x-p.x,l.y-p.y);if(d<bd&&d>30){bd=d;pt.busy=l;}}}
    if(pt.busy){tx=pt.busy.x;ty=pt.busy.y;if(Math.hypot(pt.x-tx,pt.y-ty)<10){pt.busy.x=p.x;pt.busy.y=p.y;pt.busy=null;}}}
  const dx=tx-pt.x,dy=ty-pt.y,d=Math.hypot(dx,dy);if(d>700){pt.x=p.x;pt.y=p.y;}else if(d>3){const sp=Math.min(d,(d>160?520:230)*dt);pt.x+=dx/d*sp;pt.y+=dy/d*sp;pt.moving=true;if(Math.abs(dx)>1)pt.face=dx>0?1:-1;}else pt.moving=false;
  if(def.ab==='attack'){pt.atkT-=dt;const t=p.target;if(t&&!t.dead&&dist(pt,t)<330&&pt.atkT<=0){pt.atkT=1.5;const a=Math.atan2(t.y-t.d.h*.4-(pt.y-28),t.x-pt.x);projectiles.push({x:pt.x,y:pt.y-28,vx:Math.cos(a)*380,vy:Math.sin(a)*380,spd:380,homing:true,target:t,owner:'player',src:p,kind:'fireball',mult:.4,opt:{},life:2});}}
  if(def.ab==='heal'&&gameTime-p.lastHit<6&&p.hp<p.stats.maxHp){healPlayer(p.stats.maxHp*.012*dt,true);if(rand()<dt*6)particles.push({x:p.x+rr(-10,10),y:p.y-rr(10,40),vx:0,vy:-30,life:.6,max:.6,col:'#9fffb0',s:3});}}
function drawPet(pt){const t=pt.anim,f=pt.face,id=pt.id;ctx.save();ctx.translate(pt.x,pt.y);shadow(0,0,8,3);ctx.scale(f,1);
  if(id==='fox'){const lg=pt.moving?Math.sin(t*16)*3:0;ctx.fillStyle='#c8641e';ctx.fillRect(-6+lg*.4,-6,2.5,6);ctx.fillRect(3-lg*.4,-6,2.5,6);ctx.beginPath();ctx.ellipse(0,-9,8,4.5,0,0,7);ctx.fill();
    ctx.strokeStyle='#d8742a';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-7,-10);ctx.quadraticCurveTo(-15,-12+Math.sin(t*6)*2,-15,-18);ctx.stroke();ctx.fillStyle='#fff';circle(-15,-19,2.2);
    ctx.fillStyle='#d8742a';circle(8,-13,4.5);ctx.beginPath();ctx.moveTo(10,-13);ctx.lineTo(15,-11.5);ctx.lineTo(10,-10);ctx.fill();ctx.beginPath();ctx.moveTo(5,-16);ctx.lineTo(6,-21);ctx.lineTo(9,-17);ctx.fill();ctx.fillStyle='#111';ctx.fillRect(9,-15,1.5,1.5);ctx.fillRect(14.5,-12,1.5,1.5);}
  else if(id==='drake'){const fy=-28+Math.sin(t*3)*3,fw=Math.sin(t*14)*5;ctx.translate(0,fy);ctx.fillStyle='#8a1d17';ctx.beginPath();ctx.moveTo(-2,-2);ctx.lineTo(-12,-10+fw);ctx.lineTo(-5,2);ctx.closePath();ctx.fill();ctx.fillStyle='#c0352a';ctx.beginPath();ctx.ellipse(0,0,7,5,0,0,7);ctx.fill();circle(7,-4,4);ctx.strokeStyle='#c0352a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-6,1);ctx.quadraticCurveTo(-12,4,-14,0);ctx.stroke();ctx.fillStyle='#ffe040';ctx.fillRect(8,-6,1.8,1.8);ctx.fillStyle='#f0e0c0';ctx.beginPath();ctx.moveTo(5,-7);ctx.lineTo(4,-11);ctx.lineTo(7,-8);ctx.fill();ctx.fillStyle='#8a1d17';ctx.beginPath();ctx.moveTo(1,-2);ctx.lineTo(6,-12-fw);ctx.lineTo(7,0);ctx.closePath();ctx.fill();}
  else if(id==='fairy'){const fy=-32+Math.sin(t*3)*4;ctx.translate(0,fy);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(0,0,0,0,0,16);g.addColorStop(0,'rgba(160,255,190,.55)');g.addColorStop(1,'rgba(160,255,190,0)');ctx.fillStyle=g;ctx.fillRect(-16,-16,32,32);ctx.restore();
    const fw=Math.abs(Math.sin(t*18));ctx.fillStyle='rgba(220,255,240,.7)';ctx.beginPath();ctx.ellipse(-5,-3,6,3*fw+1,-.5,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(-5,2,5,2.5*fw+1,.5,0,7);ctx.fill();ctx.fillStyle='#7dffa0';ctx.beginPath();ctx.ellipse(0,1,2.5,4.5,0,0,7);ctx.fill();ctx.fillStyle='#ffe0c0';circle(0,-5,2.8);ctx.fillStyle='#ffd860';circle(-.5,-7,2.2);if(rand()<.3)particles.push({x:pt.x+rr(-6,6),y:pt.y+fy+rr(-4,4),vx:0,vy:20,life:.5,max:.5,col:'#c8ffd8',s:2});}
  else if(id==='owl'){const fy=-30+Math.sin(t*2.5)*3,fw=Math.sin(t*10)*4;ctx.translate(0,fy);ctx.fillStyle='#6a4a2a';ctx.beginPath();ctx.ellipse(-6,0,5,8+fw*.3,-.3,0,7);ctx.fill();ctx.fillStyle='#8a6a40';ctx.beginPath();ctx.ellipse(0,0,7,8,0,0,7);ctx.fill();ctx.fillStyle='#e8d8b0';ctx.beginPath();ctx.ellipse(1,2,4,5,0,0,7);ctx.fill();
    ctx.fillStyle='#fff';circle(-1,-4,2.8);circle(4.5,-4,2.8);ctx.fillStyle='#ffb020';circle(-1,-4,1.6);circle(4.5,-4,1.6);ctx.fillStyle='#111';circle(-.8,-4,.8);circle(4.7,-4,.8);ctx.fillStyle='#e0a030';ctx.beginPath();ctx.moveTo(1.5,-2);ctx.lineTo(3,-2);ctx.lineTo(2.2,0);ctx.fill();ctx.fillStyle='#6a4a2a';ctx.beginPath();ctx.moveTo(-4,-7);ctx.lineTo(-5,-11);ctx.lineTo(-1,-8);ctx.fill();ctx.beginPath();ctx.moveTo(6,-7);ctx.lineTo(8,-11);ctx.lineTo(4,-8);ctx.fill();}
  ctx.restore();}

// ---------------- çizim parçaları ----------------
function drawNode(n){const x=n.x,y=n.y;if(!n.ready){ctx.globalAlpha=.35;}
  if(n.type==='herb'){shadow(x,y,9,3);ctx.strokeStyle='#3a8a3a';ctx.lineWidth=2;for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+k*3,y-8,x+k*5,y-14+Math.abs(k)*2);ctx.stroke();}if(n.ready){ctx.fillStyle=['#ffffff','#ff90c0','#b0e0ff','#ffe060'][n.v];for(let k=-2;k<=2;k+=2)circle(x+k*5,y-14+Math.abs(k)*2,2.4);}}
  else if(n.type==='wood'){shadow(x,y,15,4);ctx.fillStyle='#7a4e28';for(const [ox,oy] of [[-8,-4],[2,-4],[-3,-11]]){ctx.fillRect(x+ox-3,y+oy-4,14,8);ctx.fillStyle='#c09060';circle(x+ox+11,y+oy,3.8);ctx.fillStyle='#8a5a30';circle(x+ox+11,y+oy,1.8);ctx.fillStyle='#7a4e28';}ctx.fillStyle='#5a7a30';ctx.fillRect(x-12,y-2,3,3);}
  else if(n.type==='ore'){shadow(x,y,14,4);ctx.fillStyle='#6a666e';ctx.beginPath();ctx.moveTo(x-14,y);ctx.lineTo(x-10,y-14);ctx.lineTo(x+2,y-19);ctx.lineTo(x+13,y-9);ctx.lineTo(x+14,y);ctx.closePath();ctx.fill();ctx.fillStyle='#8a868e';ctx.beginPath();ctx.moveTo(x-10,y-14);ctx.lineTo(x+2,y-19);ctx.lineTo(x+3,y-8);ctx.lineTo(x-6,y-5);ctx.closePath();ctx.fill();if(n.ready){const g=.6+Math.sin(gameTime*3+x)*.3;ctx.fillStyle='rgba(255,200,120,'+g+')';ctx.fillRect(x-5,y-12,3,3);ctx.fillRect(x+5,y-7,3,3);ctx.fillRect(x-1,y-4,2,2);}}
  else{shadow(x,y,11,3);const g=n.ready?.75+Math.sin(gameTime*3+x)*.2:.3;for(const [ox,h,a] of [[-6,16,-.25],[0,24,0],[6,14,.3]]){ctx.save();ctx.translate(x+ox,y);ctx.rotate(a);ctx.fillStyle='rgba(190,110,255,'+g+')';ctx.beginPath();ctx.moveTo(-3.5,0);ctx.lineTo(0,-h);ctx.lineTo(3.5,0);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(-1,-h+4,1,h-6);ctx.restore();}}
  ctx.globalAlpha=1;}
function drawChest(c,locked){const x=c.x,y=c.y,col=KEY_T[c.tier].col,b=Math.sin(gameTime*2)*1;
  ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y-12,2,x,y-12,46);g.addColorStop(0,hexA(col,.45));g.addColorStop(1,hexA(col,0));ctx.fillStyle=g;ctx.fillRect(x-46,y-58,92,92);ctx.restore();
  shadow(x,y,18,5);ctx.fillStyle='#6a3a1a';rrect(x-16,y-18,32,18,3);ctx.fill();ctx.fillStyle='#8a4e22';ctx.beginPath();ctx.moveTo(x-16,y-18);ctx.quadraticCurveTo(x,y-34+b,x+16,y-18);ctx.closePath();ctx.fill();
  ctx.fillStyle=col;ctx.fillRect(x-16,y-19,32,3);ctx.fillRect(x-12,y-30,3,30);ctx.fillRect(x+9,y-30,3,30);ctx.fillStyle='#2a1a0a';rrect(x-4,y-15,8,8,2);ctx.fill();ctx.fillStyle=col;circle(x,y-12,1.8);
  if(locked)label(x,y-44,'🔒 '+KEY_T[c.tier].n+' Sandık',col,11);}
function drawKeyItem(k){const x=k.x,y=k.y-10+Math.sin(gameTime*3)*3,col=KEY_T[k.tier].col;
  ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(0,y-120,0,y);g.addColorStop(0,hexA(col,0));g.addColorStop(1,hexA(col,.45));ctx.fillStyle=g;ctx.fillRect(x-5,y-120,10,120);softDot(x,y,22,col,.5);ctx.restore();
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(gameTime*2)*.3);ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(-6,0,4.5,0,7);ctx.stroke();ctx.fillStyle=col;ctx.fillRect(-2,-1.5,13,3);ctx.fillRect(7,1,2,4);ctx.fillRect(10,1,2,3);ctx.restore();label(x,y-20,'🗝 '+KEY_T[k.tier].n+' Anahtar',col,11);}
function drawSpecial(l){const b=Math.sin(gameTime*4+l.bob)*2,x=l.x,y=l.y-6+b;const ic=l.kind==='res'?RES[l.val].ic:l.kind==='pet'?PETS[l.val].ic:MOUNTS[l.val].ic;
  if(l.kind!=='res'){ctx.save();ctx.globalCompositeOperation='lighter';softDot(x,y,22,'#ffd040',.5);ctx.restore();}ctx.font=(l.kind==='res'?14:20)+'px sans-serif';ctx.textAlign='center';ctx.fillText(ic,x,y);}
function drawExtrasGround(){for(const l of specials)drawSpecial(l);const tr=treasure;if(tr&&tr.key)drawKeyItem(tr.key);
  const p=player;if(p.key&&!p.dead){ctx.save();ctx.globalCompositeOperation='lighter';const col=KEY_T[p.key.tier].col,g=ctx.createLinearGradient(0,p.y-260,0,p.y);g.addColorStop(0,hexA(col,0));g.addColorStop(1,hexA(col,.35+.1*Math.sin(gameTime*5)));ctx.fillStyle=g;ctx.fillRect(p.x-14,p.y-260,28,260);ctx.restore();}}
function extrasToList(list){for(const n of nodes)list.push({y:n.y,k:7,fn:()=>drawNode(n)});const tr=treasure;if(tr&&tr.chest)list.push({y:tr.chest.y,k:7,fn:()=>drawChest(tr.chest,!player.key)});if(petObj&&!player.dead)list.push({y:petObj.y,k:7,fn:()=>drawPet(petObj)});}
function drawExtrasTop(){const p=player;const ch=p.gathering||p.opening;if(ch&&!p.dead){const k=clamp((gameTime-ch.start)/(ch.until-ch.start),0,1);ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(p.x-26,p.y-92,52,8);ctx.fillStyle=p.opening?'#ffd040':'#7dff9a';ctx.fillRect(p.x-25,p.y-91,50*k,6);label(p.x,p.y-97,p.opening?'Sandık açılıyor':'Toplanıyor: '+NODE_T[p.gathering.node.type],'#fff',10);}
  if(p.key&&!p.dead){const rem=Math.max(0,Math.ceil(p.key.until-gameTime));label(p.x,p.y-108,'🗝 '+Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0'),KEY_T[p.key.tier].col,13);}
  if(hoverEnt&&hoverEnt.kind==='node')label(hoverEnt.x,hoverEnt.y-30,NODE_T[hoverEnt.type]+(hoverEnt.ready?'':' (yeniden çıkıyor)'),'#c8ffb0',11);}
function drawMiniExtras(g,s,full){const tr=treasure;if(!tr)return;const z=full?16:11;g.font=z+'px sans-serif';g.textAlign='center';
  if(tr.key)g.fillText('🗝',tr.key.x*s,tr.key.y*s+z/3);
  if(tr.chest&&(player.key||player.petId==='owl'))g.fillText('📦',tr.chest.x*s,tr.chest.y*s+z/3);
  if(tr.botHold&&tr.botHold.b.alive){g.fillStyle='#ffb060';g.beginPath();g.arc(tr.botHold.b.x*s,tr.botHold.b.y*s,full?5:3,0,7);g.fill();}}

// ---------------- panel (ahır / lonca / atölye / benim) ----------------
let extraMode='my';
function openExtra(mode){extraMode=mode;closeAll(true);renderExtra();$('extra').classList.remove('hidden');}
function resRow(){const p=player;return Object.keys(RES).map(k=>'<span>'+RES[k].ic+' '+(p.res[k]||0)+' '+RES[k].n+'</span>').join('');}
function renderExtra(){const p=player;let h='<button class="x" data-close="extra">✕</button>';
  if(extraMode==='craft'){h+='<h2>⚒️ Zanaatkâr\'in Atölyesi</h2><div class="mut" style="font-size:12px">Ormanda, harabelerde ve tepelerde topladığın malzemelerle üretim yap. (Toplamak için malzemeye tıkla ya da yanında F\'ye bas.)</div><div class="resrow">'+resRow()+'<span style="color:var(--gold)">🪙 '+p.gold+'</span></div>';
    h+=RECIPES.map(r=>{const ok=Object.entries(r.need).every(([k,v])=>(p.res[k]||0)>=v)&&p.gold>=r.gold;return'<div class="srow"><div class="it g1">'+r.ic+'</div><div class="nm"><b>'+r.n+'</b>'+(r.desc?'<br><span class="mut">'+r.desc+'</span>':'')+'<br>'+Object.entries(r.need).map(([k,v])=>'<span class="'+((p.res[k]||0)>=v?'good':'bad')+'">'+RES[k].ic+' '+v+'</span>').join(' ')+(r.gold?' <span class="'+(p.gold>=r.gold?'good':'bad')+'">🪙 '+r.gold+'</span>':'')+'</div><button data-craft="'+r.id+'" '+(ok?'':'disabled')+'>Üret</button></div>';}).join('');}
  else if(extraMode==='stable'){h+='<h2>🐎 Seyis\'in Ahırı</h2><div class="mut" style="font-size:12px">Binek, hareket hızını büyük ölçüde artırır. <b>R</b> tuşuyla bin/in. Saldırınca ya da yetenek kullanınca inersin; savaşın ilk 3 saniyesinde binemezsin.</div><div style="margin-top:10px">';
    h+=Object.entries(MOUNTS).map(([id,m])=>{const own=p.mounts.includes(id);let btn;if(own)btn=p.mountId===id?'<button disabled>Seçili</button>':'<button data-msel="'+id+'">Seç</button>';else if(m.chest)btn='<button disabled>Sandıktan çıkar</button>';else btn='<button data-mbuy="'+id+'" '+(p.gold>=m.price&&p.lvl>=m.lv?'':'disabled')+'>'+(p.lvl<m.lv?'Sv '+m.lv:m.price+' 🪙')+'</button>';
      return'<div class="srow"><div class="it g'+(m.chest?2:1)+'">'+m.ic+'</div><div class="nm"><b>'+m.n+'</b> <span class="good">+%'+Math.round(m.spd*100)+' hız</span><br><span class="mut">'+m.desc+'</span></div>'+btn+'</div>';}).join('')+'</div>';}
  else if(extraMode==='pets'){h+='<h2>🗝️ Hazine Loncası</h2><div class="smbox" style="font-size:12.5px;margin-top:8px"><b>Hazine avı nasıl oynanır?</b><br>• Ara sıra haritada bir <b>anahtar</b> belirir (🗝 haritada görünür). Önce sen kap!<br>• Anahtarı alınca sandığın yeri ★ ile işaretlenir, <b>3 dakikan</b> olur.<br>• Ama anahtar sendeyken <b>konumun herkese açıktır</b>: hazine avcıları peşine düşer. Kızıl Sınır\'da bütün Gölge savaşçıları seni avlar!<br>• Sandığın yanında F\'ye bas, 3 saniye hasar almadan bekle. Bronz < Gümüş < Altın.<br>• Diğer oyuncular da anahtar için yarışır — geç kalırsan kaparlar.</div><h3 style="color:var(--gold);margin:10px 0 6px;font-size:14px">Yoldaşlar</h3>';
    h+=Object.entries(PETS).map(([id,pt])=>{const own=p.pets.includes(id);let btn=own?'<button disabled>Sende var</button>':pt.chest?'<button disabled>Sandıktan çıkar</button>':'<button data-pbuy="'+id+'" '+(p.gold>=pt.price?'':'disabled')+'>'+pt.price+' 🪙</button>';return'<div class="srow"><div class="it g'+(pt.chest?2:1)+'">'+pt.ic+'</div><div class="nm"><b>'+pt.n+'</b><br><span class="mut">'+pt.desc+'</span></div>'+btn+'</div>';}).join('');}
  else{h+='<h2>🐾 Binekler ve Yoldaşlar</h2><div class="mut" style="font-size:12px">R: bin / in • P: bu pencere</div><h3 style="color:var(--gold);margin:10px 0 6px;font-size:14px">Bineklerin</h3>';
    h+=p.mounts.length?p.mounts.map(id=>{const m=MOUNTS[id];return'<div class="srow"><div class="it g1">'+m.ic+'</div><div class="nm"><b>'+m.n+'</b> <span class="good">+%'+Math.round(m.spd*100)+' hız</span></div>'+(p.mountId===id?'<button data-ride="1">'+(p.riding?'İn':'Bin')+'</button>':'<button data-msel="'+id+'">Seç</button>')+'</div>';}).join(''):'<div class="mut">Henüz bineğin yok. Kaledeki Seyis\'e git.</div>';
    h+='<h3 style="color:var(--gold);margin:12px 0 6px;font-size:14px">Yoldaşların</h3>'+(p.pets.length?p.pets.map(id=>{const pt=PETS[id];return'<div class="srow"><div class="it g1">'+pt.ic+'</div><div class="nm"><b>'+pt.n+'</b><br><span class="mut">'+pt.desc+'</span></div><button data-pet="'+id+'">'+(p.petId===id?'Geri gönder':'Çağır')+'</button></div>';}).join(''):'<div class="mut">Henüz yoldaşın yok. Hazine Loncası\'na uğra.</div>');
    h+='<h3 style="color:var(--gold);margin:12px 0 6px;font-size:14px">Malzemelerin</h3><div class="resrow">'+resRow()+'</div>';}
  $('extra').innerHTML=h;}
$('extra').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b||b.disabled||b.dataset.close)return;const p=player,d=b.dataset;
  if(d.craft){const r=RECIPES.find(r=>r.id===d.craft);if(!Object.entries(r.need).every(([k,v])=>(p.res[k]||0)>=v)||p.gold<r.gold)return;for(const [k,v] of Object.entries(r.need))p.res[k]-=v;p.gold-=r.gold;r.make(p);fl(p.x,p.y-80,'Üretildi: '+r.n,'#c8ffb0',13);}
  else if(d.mbuy){const m=MOUNTS[d.mbuy];if(p.gold<m.price||p.lvl<m.lv)return;p.gold-=m.price;p.mounts.push(d.mbuy);p.mountId=d.mbuy;addChat(null,'🐎 Yeni binek: '+m.ic+' '+m.n+' — R ile bin!','#ffd040');showToast(m.n+' senin!','R ile bin');}
  else if(d.msel){p.mountId=d.msel;p.riding=false;}
  else if(d.ride)toggleMount();
  else if(d.pbuy){const pt=PETS[d.pbuy];if(p.gold<pt.price)return;p.gold-=pt.price;p.pets.push(d.pbuy);p.petId=d.pbuy;addChat(null,'🐾 Yeni yoldaş: '+pt.ic+' '+pt.n,'#ffd040');}
  else if(d.pet){p.petId=p.petId===d.pet?null:d.pet;}
  else return;recalc(p);renderExtra();save();});

// ================= MEVCUT KODA BAĞLANTILAR =================
SAVE_FIELDS.push('res','mounts','mountId','pets','petId','compass');
PANELS.push('extra');
{const _np=newPlayer;newPlayer=function(o){const p=_np(o);Object.assign(p,{res:{wood:0,ore:0,herb:0,crystal:0},mounts:[],mountId:null,pets:[],petId:null,compass:0});return p;};}
{const _rc=recalc;recalc=function(p){_rc(p);if(p.riding&&p.mountId&&MOUNTS[p.mountId])p.stats.spd*=1+MOUNTS[p.mountId].spd;};}
{const _ba=basicAttack;basicAttack=function(t){if(player.riding){player.riding=false;}_ba(t);};}
{const _us=useSkill;useSkill=function(i){const p=player;if(p&&p.riding&&p.act[i]){p.riding=false;}_us(i);};}
{const _gx=gainXp;gainXp=function(n){if(player&&player.petId==='owl')n=Math.round(n*1.15);_gx(n);};}
{const _die=die;die=function(src){const p=player;if(p.key&&treasure){treasure.key={x:p.x,y:p.y,tier:p.key.tier};p.key=null;addChat(null,'🗝 Öldün ve anahtar yere düştü! Kapan kapar...','#ff9070');}p.riding=false;p.gathering=null;p.opening=null;_die(src);};}
{const _qt=questTarget;questTarget=function(){const p=player;if(p&&p.key&&treasure&&treasure.chest)return{x:treasure.chest.x,y:treasure.chest.y,label:KEY_T[treasure.chest.tier].n+' Hazine Sandığı'};return _qt();};}
{const _em=enterMap;enterMap=function(id,x,y){if(player&&player.key&&treasure){player.key=null;addChat(null,'🗝 Haritadan ayrıldığın için anahtar kayboldu.','#ff9070');}_em(id,x,y);initMapExtras();petObj=null;};}
{const _nm=npcMarker;npcMarker=function(n){return{seyis:{t:'🐎',c:'#fff',s:15},zanaat:{t:'⚒️',c:'#fff',s:15},lonca:{t:'🗝️',c:'#fff',s:15}}[n.id]||_nm(n);};}
{const _on=openNpc;openNpc=function(n){if(n.id==='seyis')return openExtra('stable');if(n.id==='zanaat')return openExtra('craft');if(n.id==='lonca')return openExtra('pets');return _on(n);};}
{const _ea=entityAt;entityAt=function(wx,wy){const e=_ea(wx,wy);if(e)return e;const tr=treasure;if(tr&&tr.chest&&Math.hypot(wx-tr.chest.x,wy-(tr.chest.y-14))<24)return{kind:'chest'};for(const n of nodes)if(Math.hypot(wx-n.x,wy-(n.y-10))<18)return n;return null;};}
{const _tn=talkNearest;talkNearest=function(){const p=player,tr=treasure;if(tr&&tr.chest&&dist(p,tr.chest)<60){startOpen();return;}let best=null,bd=56;for(const n of nodes){if(!n.ready)continue;const d=dist(p,n);if(d<bd){bd=d;best=n;}}if(best){startGather(best);return;}_tn();};}
{const _bb=buildBar;buildBar=function(){_bb();const bar=$('bar'),sv=$('sl_sv');const mk=(id,k,ic,fn,tip)=>{const d=document.createElement('div');d.className='slot';d.id=id;d.innerHTML='<span class="k">'+k+'</span>'+ic+'<span class="n"></span><div class="cd"></div><div class="cdt"></div>';d.onclick=fn;d.onmouseenter=ev=>showTip(tip,ev);d.onmousemove=moveTip;d.onmouseleave=hideTip;return d;};
  bar.insertBefore(mk('sl_rd','R','🐎',toggleMount,'<b>Bin / İn</b> (R)'),sv);bar.insertBefore(mk('sl_pt','P','🐾',()=>{if($('extra').classList.contains('hidden')||extraMode!=='my')openExtra('my');else $('extra').classList.add('hidden');},'<b>Binekler ve Yoldaşlar</b> (P)'),sv);};}
{const _up=update;update=function(dt){_up(dt);if(!player)return;updNodes();updGather();updTreasure(dt);updPet(dt);
  const p=player;for(let i=specials.length-1;i>=0;i--){const l=specials[i];if(p.dead||Math.hypot(p.x-l.x,p.y-l.y)>32)continue;
    if(l.kind==='res'){p.res[l.val]=(p.res[l.val]||0)+l.n;fl(l.x,l.y-20,'+'+l.n+' '+RES[l.val].n,'#c8ffb0',12);}
    else if(l.kind==='pet'){if(!p.pets.includes(l.val)){p.pets.push(l.val);if(!p.petId)p.petId=l.val;addChat(null,'🎉 Yeni yoldaş buldun: '+PETS[l.val].ic+' '+PETS[l.val].n+'!','#ffd040');showToast('Yeni yoldaş!',PETS[l.val].n);}else{p.gold+=1500;fl(l.x,l.y-20,'+1500 🪙 (zaten vardı)','#ffd860',12);}}
    else if(l.kind==='mount'){if(!p.mounts.includes(l.val)){p.mounts.push(l.val);p.mountId=l.val;addChat(null,'🌟 EFSANEVİ BİNEK: '+MOUNTS[l.val].n+'!','#ffd040');showToast(MOUNTS[l.val].n+'!','Efsanevi binek senin');}else{p.gold+=5000;}}
    specials.splice(i,1);}
  const rd=$('sl_rd');if(rd)rd.classList.toggle('on',!!p.riding);};}
{const _dp=drawPlayer;drawPlayer=function(p){if(p.dead)return;if(p.riding&&p.mountId){drawMount(p.x,p.y,p.mountId,p.face,p.anim,p.moving);const o=heroLook(p);o.riding=true;o.noShadow=true;o.moving=false;o.alpha=p.stealthUntil>gameTime?.35:1;drawHero(p.x,p.y-20,o);}else _dp(p);};}
addEventListener('keydown',e=>{if(!running||!player||document.activeElement===chatIn||e.repeat)return;const k=e.key.toLowerCase();if(k==='r')toggleMount();else if(k==='p'){if($('extra').classList.contains('hidden')||extraMode!=='my')openExtra('my');else $('extra').classList.add('hidden');}});
canvas.addEventListener('pointerdown',e=>{if(!running||!player||player.dead)return;const ent=entityAt(e.clientX+camX,e.clientY+camY);if(!ent)return;const p=player;
  if(ent.kind==='node'){e.stopImmediatePropagation();p.gatherTo=ent;p.moveTo={x:ent.x,y:ent.y+18};p.chase=false;p.target=null;}
  else if(ent.kind==='chest'){e.stopImmediatePropagation();const c=treasure.chest;if(dist(p,c)<60)startOpen();else{p.moveTo={x:c.x,y:c.y+20};p.chase=false;}}},{capture:true});
