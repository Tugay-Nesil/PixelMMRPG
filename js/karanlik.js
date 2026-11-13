'use strict';
// =====================================================================
//  KARANLIK FANTASTİK KATMAN
//  Gece-gündüz döngüsü • Kan Ayı • Lanetli düşmanlar • Işık • Sis • Kül
//  (En son yüklenir; diğer dosyaların fonksiyonlarını sarar.)
// =====================================================================

// Karanlık mod: gece-gündüz, Kan Ayı, sis ve koyu renkler. false = kapalı (zindan yine karanlık).
let DARK_MODE=false;

// ---------- karanlık renk paleti (haritalar üretilmeden önce uygulanır) ----------
(function darkPalette(){if(!DARK_MODE)return;
  const P={
    [T.GRASS]:['#34502f','#314c2c','#375431','#2f482a'],
    [T.FOREST]:['#23392a','#213627','#253c2c','#1f3325'],
    [T.PATH]:['#5e5242','#5a4e3f','#625646','#564a3c'],
    [T.WATER]:['#1a3046','#192e43','#1b3249','#182c40'],
    [T.SAND]:['#7a6e54','#766a50','#7e7258','#72664c'],
    [T.RUIN]:['#48464e','#44424a','#4c4a52','#403e46'],
    [T.DARK]:['#28242e','#26222b','#2a2631','#231f29'],
    [T.VOLC]:['#3a1d19','#371b17','#3d1f1b','#341915'],
    [T.PLAZA]:['#5c5850','#58544c','#605c54','#545048'],
    [T.DFLOOR]:['#2e2a27','#2b2724','#312d29','#292522'],
    [T.RDIRT]:['#4a3328','#463026','#4e362b','#432e24'],
    [T.SCORCH]:['#30221c','#2d201a','#33251e','#2a1e18'],
    [T.CAMP]:['#584634','#544232','#5c4a37','#50402f'],
  };
  for(const k in P)TCOL[k]=P[k];
})();

// ---------- saat ----------
const CYCLE=600;          // bir tam gün = 10 dakika
let CLK_OFF=0;            // test için zaman kaydırma (saniye)
const clockSec=()=>Date.now()/1000+CLK_OFF;
const clockPhase=()=>(clockSec()%CYCLE)/CYCLE;
function nightAmt(ph){if(ph==null)ph=clockPhase();
  if(ph<.44)return 0;if(ph<.56)return (ph-.44)/.12;if(ph<.9)return 1;if(ph<.98)return 1-(ph-.9)/.08;return 0;}
const dayIndex=()=>Math.floor(clockSec()/CYCLE);
const bloodDay=i=>((i%3)+3)%3===2;               // her 3 geceden biri Kan Ayı
function isBlood(){return DARK_MODE&&!!M&&!M.dark&&bloodDay(dayIndex())&&nightAmt()>.5;}
function nightNow(){return M&&M.dark?1:DARK_MODE?nightAmt():0;}

// ---------- lamba noktaları (harita başına bir kez) ----------
function lampsOf(m){if(m._lamps)return m._lamps;const L=[];for(let i=0;i<m.deco.length;i++)if(m.deco[i]===D.LAMP)L.push({x:(i%m.W)*TILE+16,y:Math.floor(i/m.W)*TILE+TILE-5});return m._lamps=L;}

// ---------- ışık kaynakları ----------
const PCOL={magic:'#b48cff',fireball:'#ff8a2a',efire:'#ff5a1a',ghost:'#9fe8ff',ice:'#bff0ff',foeMagic:'#ff4060',poison:'#8aff60',arrow:null,bigarrow:'#9fe8ff',foeArrow:null};
const isHex=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
function lightsNow(){const p=player,n=nightNow(),Z=(typeof ZOOM!=='undefined'?ZOOM:1),L=[],mx=camX-220,my=camY-220,Mx=camX+VW/Z+220,My=camY+VH/Z+220;
  const add=(x,y,r,c,a)=>{if(x>mx&&x<Mx&&y>my&&y<My)L.push({x,y,r,c:isHex(c)?c:null,a:a==null?1:a});};
  if(!p.dead)add(p.x,p.y-20,M.dark?250:190+70*n,'#ffd9a0',.5);
  for(const tc of M.torches)add(tc.x,tc.y-8,150+Math.sin(gameTime*9+tc.x)*8,'#ff9a40');
  if(typeof fires!=='undefined')for(const f of fires)add(f.x,f.y-10,200+Math.sin(gameTime*7+f.x)*12,'#ff8a30');
  for(const l of lampsOf(M))add(l.x+6,l.y-46,115+Math.sin(gameTime*5+l.x)*4,'#ffc870',.85);
  for(const b of M.buildings){
    if(b.type==='fountain'){add((b.x+b.w/2)*TILE,(b.y+b.h/2)*TILE,130,'#6a9aff',.55);continue;}
    if(b.tent){add((b.x+b.w/2)*TILE,(b.y+b.h)*TILE,90,'#ff9a50',.6);continue;}
    add((b.x+b.w/2)*TILE,(b.y+b.h)*TILE-26,b.type==='keep'?200:125,b.forge?'#ff7a30':'#ffcf80',.85);}
  for(const pt of M.portals)add(pt.x,pt.y-30,160,pt.col);
  for(const pr of projectiles)add(pr.x,pr.y,85,PCOL[pr.kind]||'#ffd080');
  for(const ef of effects){if(ef.type==='burnzone'||ef.type==='ring')add(ef.x,ef.y,120,isHex(ef.col)?ef.col:'#ff9a40',.9);else if(ef.type==='bolt')add(ef.x2,ef.y2,110,'#9fd0ff');else if(ef.type==='lvl')add(ef.x,ef.y-30,180,'#ffe090');}
  for(const q of npcs)add(q.x,q.y-20,95,'#ffcf80',.6);
  for(const b of bots)if(b.alive)add(b.x,b.y-20,110,null,.8);
  for(const e of enemies)if(!e.dead&&(e.cursed||e.d.boss))add(e.x,e.y-20,e.d.boss?120:75,e.cursed?'#a030ff':'#ff5030',.75);
  return L;}

// ---------- karanlık + ışık ----------
function drawLighting(){if(!DARK_MODE&&!M.dark)return;const n=nightNow(),bm=isBlood();
  const dk=M.dark?.92:.3+.6*n;
  lctx.globalCompositeOperation='source-over';lctx.clearRect(0,0,VW,VH);
  lctx.fillStyle=bm?'rgba(30,2,8,'+dk+')':'rgba(8,10,24,'+dk+')';lctx.fillRect(0,0,VW,VH);
  lctx.globalCompositeOperation='destination-out';
  const L=lightsNow();
  const Z=(typeof ZOOM!=='undefined'?ZOOM:1);for(const l of L){const x=(l.x-camX)*Z,y=(l.y-camY)*Z,r=l.r*Z;const g=lctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(0,0,0,'+l.a+')');g.addColorStop(.5,'rgba(0,0,0,'+(l.a*.7)+')');g.addColorStop(1,'rgba(0,0,0,0)');lctx.fillStyle=g;lctx.fillRect(x-r,y-r,r*2,r*2);}
  ctx.drawImage(lightC,0,0,VW,VH);
  // sıcak ışık haleleri
  const ga=.05+.2*(M.dark?1:n);ctx.save();ctx.globalCompositeOperation='lighter';
  for(const l of L){if(!l.c)continue;const x=(l.x-camX)*Z,y=(l.y-camY)*Z,r=l.r*.62*Z;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,hexA(l.c,ga*l.a));g.addColorStop(1,hexA(l.c,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  ctx.restore();
  if(bm){ctx.fillStyle='rgba(140,10,20,'+(.07+Math.sin(gameTime*.8)*.02)+')';ctx.fillRect(0,0,VW,VH);}
  drawMotes(n);}

// ---------- sis ----------
const fogC=document.createElement('canvas');fogC.width=fogC.height=512;
(function(){const g=fogC.getContext('2d'),rnd=mulberry32(77);
  for(let i=0;i<60;i++){const x=rnd()*512,y=rnd()*512,r=50+rnd()*120;
    for(const dx of [-512,0,512])for(const dy of [-512,0,512]){const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,r);gr.addColorStop(0,'rgba(160,170,195,.2)');gr.addColorStop(1,'rgba(160,170,195,0)');g.fillStyle=gr;g.fillRect(x+dx-r,y+dy-r,r*2,r*2);}}})();
const md=(a,b)=>((a%b)+b)%b;
function drawAtmos(){if(!DARK_MODE&&!M.dark)return;const n=nightNow(),t=gameTime;let a=M.dark?.12:.14-.06*n;
  if(player.zone==='forestW'||player.zone==='forestE'||player.zone==='ruins')a+=.08;
  ctx.save();
  for(let layer=0;layer<2;layer++){const sp=layer?1:.7,ox=-md(camX*sp+t*(layer?18:9),512),oy=-md(camY*sp+t*(layer?4:-3),512);ctx.globalAlpha=a*(layer?.8:1);
    for(let x=ox;x<VW;x+=512)for(let y=oy;y<VH;y+=512)ctx.drawImage(fogC,x,y);}
  ctx.restore();}

// ---------- havada süzülenler: kül, köz, ateş böceği, ruh ----------
const motes=[];let moteLast=performance.now();
function moteKind(n){if(M.dark)return 'dust';if(M.id==='sinir'||player.zone==='volcano')return rand()<.75?'ember':'ash';if(player.zone==='ruins')return rand()<.6?'wisp':'ash';if(n>.5)return rand()<.55?'fly':'ash';return 'ash';}
function newMote(n,anywhere){const k=moteKind(n);return{k,x:rand()*VW,y:anywhere?rand()*VH:(k==='ember'||k==='wisp'?VH+10:-10),vx:rr(-8,8),vy:k==='ash'?rr(10,26):k==='dust'?rr(-4,4):k==='fly'?rr(-8,8):rr(-40,-18),ph:rand()*7,s:k==='ash'?rr(1,2.2):rr(1.5,3)};}
function drawMotes(n){const now=performance.now(),dt=Math.min(.05,(now-moteLast)/1000);moteLast=now;
  const want=M.dark?30:60;while(motes.length<want)motes.push(newMote(n,true));
  ctx.save();
  for(let i=motes.length-1;i>=0;i--){const m=motes[i];m.ph+=dt;
    if(m.k==='fly'){m.vx+=rr(-30,30)*dt;m.vy+=rr(-30,30)*dt;m.vx*=.98;m.vy*=.98;}
    m.x+=(m.vx+Math.sin(m.ph*1.3)*6)*dt;m.y+=m.vy*dt;
    if(m.x<-20||m.x>VW+20||m.y<-20||m.y>VH+20){motes[i]=newMote(n,false);continue;}
    let col,al;
    if(m.k==='ash'){col='#b8b4ae';al=.35;ctx.globalCompositeOperation='source-over';}
    else if(m.k==='dust'){col='#d8c8a8';al=.25;ctx.globalCompositeOperation='source-over';}
    else{ctx.globalCompositeOperation='lighter';col=m.k==='ember'?'#ff8a30':m.k==='wisp'?'#b070ff':'#d8ff70';al=m.k==='fly'?.25+.6*Math.max(0,Math.sin(m.ph*2.2)):.75;
      const g=ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.s*4);g.addColorStop(0,hexA(col,al*.5));g.addColorStop(1,hexA(col,0));ctx.fillStyle=g;ctx.fillRect(m.x-m.s*4,m.y-m.s*4,m.s*8,m.s*8);}
    ctx.fillStyle=hexA(col,al);ctx.fillRect(m.x-m.s/2,m.y-m.s/2,m.s,m.s);}
  ctx.restore();}

// ---------- lanetli düşmanlar + Kan Ayı ----------
const _makeEnemy=makeEnemy;
makeEnemy=function(sp){const e=_makeEnemy(sp);if(!e||e.d.pvp)return e;
  const bm=isBlood(),n=nightNow(),boss=!!e.d.boss;
  if(bm&&!boss){e.maxHp=Math.round(e.maxHp*1.3);e.hp=e.maxHp;e.atk*=1.2;e.blood=true;}
  const ch=boss?0:bm?.28:M.dark?.08:n>.5?.1:.035;
  if(rand()<ch){e.cursed=true;e.d=Object.assign({},e.d,{name:'Lanetli '+e.d.name,xp:e.d.xp*3,xpL:(e.d.xpL||0)*3});e.maxHp=Math.round(e.maxHp*2.2);e.hp=e.maxHp;e.atk*=1.4;e.def*=1.2;}
  else if(e.blood)e.d=Object.assign({},e.d,{xp:e.d.xp*2,xpL:(e.d.xpL||0)*2});
  return e;};
const _dropLoot=dropLoot;
dropLoot=function(e,pvpKill){const n0=loots.length;_dropLoot(e,pvpKill);
  if(e.cursed){_dropLoot(e,pvpKill);const add=(k,v)=>loots.push({x:e.x+rr(-20,20),y:e.y+rr(-12,12),kind:k,val:v,t:gameTime,bob:rand()*6});
    add('gear',makeItem(pick(DROP_SLOTS),e.lvl,gradeRoll(1),player.cls));add('mat','up');if(rand()<.35)add('mat','ench');
    addChat(null,'🕯 Lanetli '+e.d.name.replace('Lanetli ','')+' arındırıldı! Ganimeti bol.','#c08aff');}
  if(e.blood||(e.cursed&&isBlood()))for(let i=n0;i<loots.length;i++)if(loots[i].kind==='gold')loots[i].val=Math.round(loots[i].val*2);};
const _drawEnemy=drawEnemy;
drawEnemy=function(e){if(e.cursed&&!e.dead){const t=gameTime,h=e.d.h||30,cy=e.y-h*.45,R=h*.9+16;
    ctx.save();const g=ctx.createRadialGradient(e.x,cy,2,e.x,cy,R);g.addColorStop(0,'rgba(110,20,170,.38)');g.addColorStop(1,'rgba(40,0,60,0)');ctx.fillStyle=g;ctx.fillRect(e.x-R,cy-R,R*2,R*2);
    ctx.strokeStyle='rgba(190,80,255,'+(.45+.25*Math.sin(t*4))+')';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(e.x,e.y,e.r+8,(e.r+8)*.38,0,0,7);ctx.stroke();
    ctx.setLineDash([4,6]);ctx.lineDashOffset=-t*20;ctx.beginPath();ctx.ellipse(e.x,e.y,e.r+14,(e.r+14)*.38,0,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    if(rand()<.3)particles.push({x:e.x+rr(-e.r,e.r),y:e.y-rr(0,h),vx:rr(-12,12),vy:rr(-60,-25),life:.8,max:.8,col:pick(['#7a2aa8','#2a0a3a','#b060ff']),s:rr(2,4)});}
  _drawEnemy(e);
  if(e.blood&&!e.dead&&!e.cursed){ctx.fillStyle='rgba(255,40,50,'+(.6+.3*Math.sin(gameTime*6+e.x))+')';const h=e.d.h||30;ctx.fillRect(e.x-1,e.y-h-6,2,2);}};

// ---------- saat göstergesi ve duyurular ----------
const clockEl=document.createElement('div');clockEl.id='clock';$('mapbox').appendChild(clockEl);if(!DARK_MODE)clockEl.style.display='none';
let clkState='',clkT=0,clkIntro=false;
function fmtT(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function updClock(){const ph=clockPhase(),di=dayIndex(),nightNowB=nightAmt(ph)>.5;
  if(M.dark){clockEl.className='cave';clockEl.innerHTML='🕯 Yeraltı • gün ışığı yok';return;}
  if(nightNowB){const left=(.94-ph)*CYCLE;const b=bloodDay(di);clockEl.className=b?'blood':'night';clockEl.innerHTML=(b?'🩸 Kan Ayı':'🌙 Gece')+' • şafağa '+fmtT(left);}
  else{const tgt=ph>=.94?1.5:.5,left=(tgt-ph)*CYCLE,b=bloodDay(ph>=.94?di+1:di);clockEl.className=b?'day warn':'day';clockEl.innerHTML='☀️ Gündüz • '+(b?'<b>Kan Ayı</b>na ':'geceye ')+fmtT(left);}}
const _update=update;
update=function(dt){_update(dt);if(!DARK_MODE)return;clkT-=dt;if(clkT>0)return;clkT=.5;updClock();
  const st=M.dark?'cave':isBlood()?'blood':nightAmt()>.5?'night':'day';
  if(!clkIntro){clkIntro=true;addChat(null,'🌑 Diyarda gün 10 dakika sürer. Geceleri Lanetli yaratıklar (mor halkalı) daha sık çıkar; yenince 3 kat TP ve bol ganimet verirler. Her üç geceden biri Kan Ayı\'dır.','#c08aff');}
  if(st!==clkState){const prev=clkState;clkState=st;if(!prev||st==='cave'||prev==='cave')return;
    if(st==='blood'){showToast('🩸 Kan Ayı yükseldi!','Düşmanlar güçlendi • 2× TP ve altın');addChat(null,'🩸 Kan Ayı yükseldi! Yaratıklar daha güçlü ama 2 kat TP ve altın veriyor. Lanetliler her yerde.','#ff5a6a');}
    else if(st==='night'){showToast('🌙 Gece çöktü','Lanetliler daha sık görülür');addChat(null,'🌙 Gece çöktü. Meşalelerin ve ateşlerin yakınında kal.','#9fb0ff');}
    else if(st==='day'){showToast('☀️ Şafak söktü','Diyar bir süre güvende');addChat(null,'☀️ Şafak söktü.','#f3c969');}}};

window.__karanlik={setOffset(s){CLK_OFF=s;clkT=0;},jumpTo(ph,blood){const now=Date.now()/1000;let di=Math.floor(now/CYCLE);if(blood!=null)while(bloodDay(di)!==!!blood)di++;CLK_OFF=di*CYCLE+ph*CYCLE-now;clkT=0;},isBlood,nightNow};
function setDarkMode(v){DARK_MODE=!!v;clockEl.style.display=DARK_MODE?'':'none';clkT=0;}
