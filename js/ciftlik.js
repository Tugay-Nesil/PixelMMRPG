'use strict';
// =====================================================================
//  ÇİFTLİK HAYVANLARI — yeni binekler ve yoldaşlar (özgün piksel çizim)
//  Bu dosya hazine.js'den SONRA yüklenir; MOUNTS/PETS ve çizim fonks.
//  (drawMount, drawPet) üzerine biner.
// =====================================================================

// ---- yeni binekler ----
Object.assign(MOUNTS,{
  cow   :{n:'Benekli İnek', ic:'🐄',spd:.45,lv:3, price:500, draw:'cow',   col:'#f3ede2',spot:'#3a332f',saddle:'#7a4a24',desc:'Sakin ama güçlü bir çiftlik dostu.'},
  pig   :{n:'Pembe Domuz',  ic:'🐖',spd:.50,lv:4, price:650, draw:'pig',   col:'#eaa2b0',saddle:'#6a4a24',desc:'Göründüğünden hızlı, neşeli bir yoldaş.'},
  sheep :{n:'Tüylü Koyun',  ic:'🐑',spd:.50,lv:5, price:800, draw:'sheep', col:'#efe9e0',face:'#4a4038',saddle:'#6a4a7a',desc:'Yumuşacık yününe batarak yolculuk et.'},
  goat  :{n:'Dağ Keçisi',   ic:'🐐',spd:.58,lv:6, price:1100,draw:'goat',  col:'#caa876',horn:'#e7dcc2',saddle:'#5a3a22',desc:'Dik yamaçlarda bile sağlam adımlı.'},
  llama :{n:'Tüylü Lama',   ic:'🦙',spd:.62,lv:8, price:1600,draw:'llama', col:'#d9c4a2',saddle:'#7a3a2a',desc:'Uzun boylu, mağrur dağ dostu.'},
  donkey:{n:'İnatçı Eşek',  ic:'🫏',spd:.52,lv:6, price:900, draw:'donkey',col:'#9a9aa2',mane:'#45454e',saddle:'#6a4a24',desc:'Uzun kulaklı, yorulmak bilmez.'},
  duck  :{n:'Şişko Ördek',  ic:'🦆',spd:.68,lv:10,price:2600,draw:'duck',  col:'#f2f1ec',beak:'#f0a830',saddle:'#4a6a9a',desc:'Zıplaya zıplaya hızla koşturur.'},
  panther:{n:'Zırhlı Panter',ic:'🐆',spd:.95,lv:16,price:9000,draw:'panther',col:'#272436',armor:'#6a5aa8',trim:'#9fd8ff',saddle:'#3a3450',desc:'Mor-mavi zırhlı gölge panteri. Sadık ve çevik bir av bineği.'},
});
// ---- yeni yoldaşlar ----
Object.assign(PETS,{
  chick :{n:'Civciv',    ic:'🐤',ab:'cute',price:400,draw:'chick', col:'#ffdb52',desc:'Peşinden seke seke gelen minik dost.'},
  bunny :{n:'Tavşan',    ic:'🐰',ab:'cute',price:700,draw:'bunny', col:'#efe9e2',desc:'Zıplayarak takip eder, moral verir.'},
  duckling:{n:'Ördek Yavrusu',ic:'🐥',ab:'cute',price:600,draw:'duckling',col:'#f6e27a',desc:'Vak vak öterek ardından gelir.'},
});

// ---------------------------------------------------------------------
//  Ortak çizim yardımcısı: yan görünüm dört ayaklı
//  (baş sağda, kuyruk solda, ayaklar yürürken sallanır)
// ---------------------------------------------------------------------
const FOL='rgba(0,0,0,.45)';
function farmLegs(bodyY,bh,sw,len,c,dk,hoof,near){
  const yTop=bodyY+bh-2;
  const draw=(lx,ph,col)=>{ctx.save();ctx.translate(lx,yTop);ctx.rotate(sw(ph));ctx.fillStyle=col;ctx.fillRect(-2.3,0,4.6,len);ctx.fillStyle=hoof||shade(col,-28);ctx.fillRect(-2.5,len-2.6,5,2.8);ctx.strokeStyle=FOL;ctx.lineWidth=.7;ctx.strokeRect(-2.3,0,4.6,len);ctx.restore();};
  if(near){draw(-6,0,c);draw(13,Math.PI,c);}else{draw(-10,Math.PI,dk);draw(9,0,dk);}
}
function farmBody(bodyY,bw,bh,c){
  ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,bodyY,bw,bh,0,0,7);ctx.fill();
  ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.ellipse(-2,bodyY-bh*.42,bw*.68,bh*.32,0,0,7);ctx.fill();
}
function blob(x,y,rx,ry,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();}
function eyeShine(x,y){ctx.fillStyle='#141018';ctx.fillRect(x,y,2,2.4);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(x,y,.9,.9);}

function drawFarmMount(x,y,id,m,face,t,mv){
  ctx.save();ctx.translate(x,y);shadow(0,0,24,7);ctx.scale(face||1,1);
  const g=mv?t*12:t*1.6,sw=k=>mv?Math.sin(g+k)*.6:Math.sin(g+k)*.04;
  const c=m.col,dk=shade(c,-32),lt=shade(c,16),hoof='#2a2018';
  if(id==='cow'||id==='pig'||id==='sheep'||id==='goat'||id==='donkey'){
    const bodyY=-18,bw=20,bh=10;
    farmLegs(bodyY,bh,sw,11,c,dk,hoof,false);
    // kuyruk
    ctx.strokeStyle=dk;ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-18,bodyY+1);ctx.quadraticCurveTo(-26,bodyY+4+Math.sin(t*6)*2,-24,bodyY+11);ctx.stroke();
    if(id==='cow'){ctx.fillStyle=dk;circle(-24,bodyY+12,2);}
    if(id==='sheep'){ // yün gövde
      ctx.fillStyle=c;for(const [ox,oy] of [[-14,-20],[-5,-23],[5,-22],[13,-19],[-10,-13],[2,-14],[11,-12],[-16,-15]])blob(ox,oy,6.5,5.8,c);
    } else farmBody(bodyY,bw,bh,c);
    // desen / coat
    if(id==='cow'){for(const [ox,oy,r] of [[-9,-20,5],[6,-15,4.5],[-2,-13,3.5]])blob(ox,oy,r,r*.8,m.spot);}
    if(id==='pig'){blob(-4,-20,10,6,lt);}
    farmLegs(bodyY,bh,sw,11,c,dk,hoof,true);
    // --- baş ---
    if(id==='pig'){blob(20,-20,9,7.5,c);ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(20,-20,9,7.5,0,0,7);ctx.stroke();
      ctx.fillStyle=shade(c,-14);ctx.beginPath();ctx.ellipse(27,-19,4.5,3.8,0,0,7);ctx.fill();ctx.fillStyle=dk;ctx.fillRect(26,-20,1.6,1.6);ctx.fillRect(28.5,-20,1.6,1.6);
      ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(15,-27);ctx.lineTo(13,-33);ctx.lineTo(19,-28);ctx.closePath();ctx.fill();eyeShine(22,-24);}
    else if(id==='sheep'){ctx.fillStyle=m.face;ctx.beginPath();ctx.ellipse(19,-22,6.5,6,0,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
      ctx.fillStyle=shade(m.face,-18);ctx.beginPath();ctx.moveTo(13,-27);ctx.lineTo(11,-23);ctx.lineTo(15,-24);ctx.fill();ctx.beginPath();ctx.moveTo(25,-27);ctx.lineTo(27,-23);ctx.lineTo(23,-24);ctx.fill();
      eyeShine(21,-24);ctx.fillStyle=c;blob(18,-27,5,4,c);}
    else if(id==='goat'){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(14,-26);ctx.lineTo(30,-24);ctx.lineTo(28,-16);ctx.lineTo(15,-17);ctx.closePath();ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
      ctx.fillStyle=m.horn;ctx.beginPath();ctx.moveTo(16,-25);ctx.quadraticCurveTo(14,-34,19,-36);ctx.lineTo(19,-32);ctx.quadraticCurveTo(17,-28,19,-25);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle=lt;ctx.beginPath();ctx.moveTo(22,-17);ctx.lineTo(24,-12);ctx.lineTo(20,-16);ctx.fill();eyeShine(24,-22);ctx.fillStyle=dk;ctx.fillRect(28,-21,2,1.6);}
    else if(id==='donkey'){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(14,-30);ctx.quadraticCurveTo(26,-31,27,-20);ctx.lineTo(18,-17);ctx.quadraticCurveTo(13,-22,14,-30);ctx.closePath();ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
      ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(16,-35,2.6,6,-.25,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(22,-35,2.6,6,.25,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle=shade(c,-22);ctx.beginPath();ctx.ellipse(26,-19,3.4,3,0,0,7);ctx.fill();ctx.fillStyle=m.mane;ctx.fillRect(13,-32,3,12);eyeShine(21,-26);}
    else{ // cow baş
      ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(21,-23,8.5,6.8,0,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
      ctx.fillStyle=m.spot;blob(18,-26,4,3,m.spot);
      ctx.fillStyle='#e7a6ac';ctx.beginPath();ctx.ellipse(28,-21,4.5,3.6,0,0,7);ctx.fill();ctx.fillStyle=dk;ctx.fillRect(27,-22,1.6,1.6);ctx.fillRect(29.5,-22,1.6,1.6);
      ctx.fillStyle=m.horn||'#e7dcc2';ctx.beginPath();ctx.moveTo(16,-29);ctx.lineTo(14,-33);ctx.lineTo(18,-29);ctx.fill();ctx.beginPath();ctx.moveTo(25,-29);ctx.lineTo(27,-33);ctx.lineTo(23,-29);ctx.fill();
      ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(13,-26);ctx.lineTo(11,-22);ctx.lineTo(16,-24);ctx.fill();eyeShine(23,-25);}
    // eyer
    ctx.fillStyle=m.saddle;rrect(-8,bodyY-bh+1,15,7,3);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.8;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(-6,bodyY-bh+2,11,2);
  }
  else if(id==='llama'){
    const bodyY=-20,bw=16,bh=9;
    farmLegs(bodyY,bh,sw,13,c,dk,hoof,false);
    ctx.strokeStyle=dk;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-15,bodyY);ctx.quadraticCurveTo(-21,bodyY-3,-20,bodyY-9);ctx.stroke();
    farmBody(bodyY,bw,bh,c);
    // uzun boyun + baş
    ctx.fillStyle=c;ctx.save();ctx.translate(13,bodyY-4);ctx.rotate(-.15);rrect(-3.5,-22,7.5,24,3);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;rrect(-3.5,-22,7.5,24,3);ctx.stroke();ctx.restore();
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(16,-40,6,5,.2,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.stroke();
    ctx.fillStyle=lt;ctx.beginPath();ctx.ellipse(20,-38,3.2,2.6,0,0,7);ctx.fill();
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(13,-45);ctx.lineTo(12,-50);ctx.lineTo(16,-45);ctx.fill();ctx.beginPath();ctx.moveTo(18,-45);ctx.lineTo(20,-50);ctx.lineTo(21,-45);ctx.fill();
    eyeShine(17,-41);ctx.fillStyle=dk;ctx.fillRect(20,-37,1.6,1.3);
    farmLegs(bodyY,bh,sw,13,c,dk,hoof,true);
    ctx.fillStyle=m.saddle;rrect(-8,bodyY-bh+1,14,7,3);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.8;ctx.stroke();
  }
  else if(id==='duck'){
    const bodyY=-18;
    // ayaklar (perde)
    const foot=(lx,ph)=>{ctx.save();ctx.translate(lx,-6);ctx.rotate(sw(ph)*.7);ctx.fillStyle=m.beak;ctx.fillRect(-1.6,0,3.2,7);ctx.beginPath();ctx.moveTo(-3,7);ctx.lineTo(4,7);ctx.lineTo(1,10);ctx.closePath();ctx.fill();ctx.restore();};
    foot(-6,0);foot(8,Math.PI);
    // kuyruk
    ctx.fillStyle=shade(c,-10);ctx.beginPath();ctx.moveTo(-18,bodyY+1);ctx.lineTo(-27,bodyY-4);ctx.lineTo(-19,bodyY+6);ctx.closePath();ctx.fill();
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-1,bodyY,19,13,0,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
    ctx.fillStyle=shade(c,10);ctx.beginPath();ctx.ellipse(-3,bodyY-5,13,7,0,0,7);ctx.fill();
    // kanat
    ctx.fillStyle=shade(c,-8);ctx.beginPath();ctx.ellipse(-2,bodyY+1,9,6,.1,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.7;ctx.stroke();
    // baş
    circle(16,bodyY-14,9);ctx.fillStyle=c;ctx.beginPath();ctx.arc(16,bodyY-14,9,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
    ctx.fillStyle=m.beak;ctx.beginPath();ctx.ellipse(27,bodyY-13,6,3.2,0,0,7);ctx.fill();ctx.fillStyle=shade(m.beak,-18);ctx.fillRect(24,bodyY-12,7,1.4);
    eyeShine(19,bodyY-17);
    ctx.fillStyle=m.saddle;rrect(-8,bodyY-11,15,7,3);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.8;ctx.stroke();
  }
  else if(id==='panther'){
    const c2=m.col,ar=m.armor,trim=m.trim,dk2=shade(c2,-20),bodyY=-20;
    // parıltı
    ctx.save();ctx.globalCompositeOperation='lighter';const gr=ctx.createRadialGradient(0,bodyY,4,0,bodyY,40);gr.addColorStop(0,hexA(trim,.18));gr.addColorStop(1,hexA(trim,0));ctx.fillStyle=gr;ctx.fillRect(-42,-54,84,70);ctx.restore();
    const paw=(lx,ph,col)=>{ctx.save();ctx.translate(lx,-9);ctx.rotate(sw(ph)*1.05);ctx.fillStyle=col;rrect(-2.8,0,5.6,11,2);ctx.fill();ctx.fillStyle=shade(col,-25);ctx.beginPath();ctx.ellipse(0,11,3.6,2.3,0,0,7);ctx.fill();ctx.restore();};
    // kuyruk — dalgalı mavi bayrak
    ctx.strokeStyle=c2;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-20,bodyY);ctx.quadraticCurveTo(-34,bodyY-8+Math.sin(t*5)*4,-30,bodyY-24+Math.sin(t*5+1)*4);ctx.stroke();
    ctx.strokeStyle=trim;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-20,bodyY);ctx.quadraticCurveTo(-34,bodyY-8+Math.sin(t*5)*4,-30,bodyY-24+Math.sin(t*5+1)*4);ctx.stroke();
    paw(-13,Math.PI,dk2);paw(11,0,dk2);
    // gövde (uzun, alçak)
    ctx.fillStyle=c2;ctx.beginPath();ctx.ellipse(-2,bodyY,24,10,0,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.ellipse(-4,bodyY-4,16,4,0,0,7);ctx.fill();
    // zırh plakaları
    ctx.fillStyle=ar;rrect(-14,bodyY-9,26,12,4);ctx.fill();ctx.strokeStyle=shade(ar,-30);ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=shade(ar,16);rrect(-13,bodyY-8,24,3,2);ctx.fill();
    ctx.strokeStyle=trim;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-14,bodyY+2);ctx.lineTo(12,bodyY+2);ctx.stroke();
    ctx.fillStyle=trim;for(let k=0;k<3;k++)circle(-8+k*8,bodyY-3,1.4);
    // ön pençeler
    paw(-7,0,c2);paw(15,Math.PI,c2);
    // boyun + kafa (kedi)
    ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(14,bodyY-6);ctx.quadraticCurveTo(24,bodyY-10,26,bodyY-2);ctx.lineTo(18,bodyY+3);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.ellipse(27,bodyY-10,9,8,0,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.9;ctx.stroke();
    // kulaklar + zırhlı maske
    ctx.fillStyle=ar;ctx.beginPath();ctx.moveTo(22,bodyY-16);ctx.lineTo(23,bodyY-24);ctx.lineTo(28,bodyY-17);ctx.closePath();ctx.fill();ctx.strokeStyle=shade(ar,-30);ctx.stroke();
    ctx.beginPath();ctx.moveTo(30,bodyY-16);ctx.lineTo(33,bodyY-23);ctx.lineTo(34,bodyY-15);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=ar;ctx.beginPath();ctx.moveTo(22,bodyY-13);ctx.lineTo(34,bodyY-14);ctx.lineTo(33,bodyY-6);ctx.lineTo(24,bodyY-5);ctx.closePath();ctx.fill();ctx.strokeStyle=shade(ar,-30);ctx.stroke();
    ctx.fillStyle=trim;ctx.fillRect(23,bodyY-11,12,1.4);
    // burun + parlayan göz
    ctx.fillStyle=dk2;ctx.beginPath();ctx.moveTo(34,bodyY-9);ctx.lineTo(38,bodyY-8);ctx.lineTo(34,bodyY-6);ctx.closePath();ctx.fill();
    ctx.fillStyle=trim;ctx.shadowColor=trim;ctx.shadowBlur=6;ctx.fillRect(30,bodyY-11,2.6,2.2);ctx.shadowBlur=0;
    // eyer
    ctx.fillStyle=m.saddle;rrect(-9,bodyY-12,16,8,3);ctx.fill();ctx.strokeStyle=trim;ctx.lineWidth=1;ctx.stroke();
    if(mv&&rand()<.4)particles.push({x:x-face*26+rr(-4,4),y:y-18+rr(-4,4),vx:-face*26,vy:rr(-14,6),life:.5,max:.5,col:trim,s:2});
  }
  ctx.restore();
}

// drawMount'u sar: yeni bineklerse kendi çizimimiz, değilse eskisi
{const _dm=drawMount;drawMount=function(x,y,id,face,t,mv){const m=MOUNTS[id];if(m&&m.draw){return drawFarmMount(x,y,id,m,face,t,mv);}return _dm(x,y,id,face,t,mv);};}

// ---------------------------------------------------------------------
//  Yeni yoldaş çizimleri
// ---------------------------------------------------------------------
function drawFarmPet(pt){const t=pt.anim,f=pt.face,id=pt.id,m=PETS[id];ctx.save();ctx.translate(pt.x,pt.y);shadow(0,0,7,2.6);ctx.scale(f,1);
  const hop=pt.moving?Math.abs(Math.sin(t*12))*3:0,c=m.col;
  if(id==='chick'||id==='duckling'){ctx.translate(0,-hop);
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,-6,6.5,6,0,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.8;ctx.stroke();
    circle(3,-11,4.2);ctx.fillStyle=c;ctx.beginPath();ctx.arc(3,-11,4.2,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f0a830';ctx.beginPath();ctx.moveTo(7,-11);ctx.lineTo(11,-10);ctx.lineTo(7,-9);ctx.closePath();ctx.fill();
    if(id==='duckling'){ctx.fillStyle='#f0c040';ctx.fillRect(-6,-8,3,2);}
    eyeShine(5,-12);ctx.fillStyle='#f0a830';const lp=pt.moving?Math.sin(t*12)*2:0;ctx.fillRect(-2+lp,-1,1.6,3);ctx.fillRect(2-lp,-1,1.6,3);}
  else if(id==='bunny'){ctx.translate(0,-hop);
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-1,-6,7,6,0,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.lineWidth=.8;ctx.stroke();
    ctx.fillStyle='#fff';circle(-7,-5,2);ctx.fillStyle=c;circle(5,-11,4.2);ctx.beginPath();ctx.arc(5,-11,4.2,0,7);ctx.fill();ctx.strokeStyle=FOL;ctx.stroke();
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(3,-18,1.8,5,-.2,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(6,-18,1.8,5,.15,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f0a6b4';ctx.beginPath();ctx.ellipse(4,-17,.7,2.4,-.2,0,7);ctx.fill();eyeShine(7,-12);ctx.fillStyle='#e07a86';ctx.fillRect(8,-10,1.4,1.2);}
  ctx.restore();}
{const _dp=drawPet;drawPet=function(pt){const m=PETS[pt.id];if(m&&m.draw){return drawFarmPet(pt);}return _dp(pt);};}
