'use strict';
// ================= ÇİZİM =================
const canvas=$('game'),mainCtx=canvas.getContext('2d');let ctx=mainCtx;
let VW=0,VH=0,DPR=1;const lightC=document.createElement('canvas'),lctx=lightC.getContext('2d');
// Dünya ekranın gerçek çözünürlüğünde (RS) çizilir: telefonda keskin görünür. Yazılar ayrı bir katmanda.
const uiCanvas=$('uiLayer'),uctx=uiCanvas.getContext('2d');let TEXT=false,RS=1,ZOOM=1.7;
// 16-bit piksel görünümü: dünya düşük çözünürlükte çizilip image-rendering:pixelated ile büyütülür.
// PIXEL = bir "sanat pikseli"nin kaç CSS pikseli kaplayacağı. Büyük = daha çıtır/retro.
const PIXEL=2.2;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);RS=Math.min(window.RS_CAP||3,Math.max(1,window.devicePixelRatio||1));VW=innerWidth;VH=innerHeight;canvas.width=Math.max(1,Math.ceil(VW*RS));canvas.height=Math.max(1,Math.ceil(VH*RS));uiCanvas.width=Math.round(VW*DPR);uiCanvas.height=Math.round(VH*DPR);lightC.width=VW;lightC.height=VH;}
addEventListener('resize',resize);resize();

function rrect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();}
function shadow(x,y,rx,ry){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);const f=v=>clamp(v+amt,0,255);return'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')';}

// ---------- zemin ----------
function drawTile(tx,ty){const m=M,i=ty*m.W+tx,t=m.tiles[i],v=m.tvar[i],sx=tx*TILE,sy=ty*TILE;ctx.fillStyle=TCOL[t][v];ctx.fillRect(sx,sy,TILE+.5,TILE+.5);
  switch(t){
    case T.WATER:{const ph=gameTime*2+tx*.7+ty*.5;ctx.fillStyle='rgba(255,255,255,.13)';ctx.fillRect(sx+6+Math.sin(ph)*3,sy+10,12,2);ctx.fillRect(sx+14+Math.cos(ph)*3,sy+22,10,2);break;}
    case T.LAVA:{const ph=Math.sin(gameTime*2+tx+ty*1.3);ctx.fillStyle='rgba(255,'+(190+ph*40|0)+',60,.6)';ctx.fillRect(sx+4+ph*3,sy+8,14,4);ctx.fillRect(sx+16-ph*3,sy+20,10,3);break;}
    case T.GRASS:case T.FOREST:{const h=((tx*73856093)^(ty*19349663))>>>0,r=h%13,fo=t===T.FOREST;
      if(r===0||r===1){const dirt=r===0;ctx.fillStyle=dirt?(fo?'#7a6038':'#a8875a'):(fo?'#9a9078':'#c4b898');ctx.fillRect(sx+3,sy+3,26,26);ctx.fillStyle=TCOL[t][v];ctx.fillRect(sx+3,sy+3,3,3);ctx.fillRect(sx+26,sy+26,3,3);ctx.fillRect(sx+3+(h%4)*5,sy+3,4,2);
        ctx.fillStyle='rgba(0,0,0,.14)';ctx.fillRect(sx+3,sy+27,26,2);ctx.fillRect(sx+27,sy+3,2,26);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(sx+6,sy+3,20,2);if(!dirt){ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(sx+10,sy+12,8,1);ctx.fillRect(sx+16,sy+19,7,1);}}
      else if(r===2||r===3){ctx.fillStyle=fo?'#447e3a':'#5fa04a';ctx.fillRect(sx+2,sy+2,28,28);ctx.fillStyle=TCOL[t][v];ctx.fillRect(sx+2,sy+2,3,3);ctx.fillRect(sx+27,sy+2,3,3);ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(sx+2,sy+28,28,2);ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(sx+5,sy+2,22,2);}
      ctx.fillStyle='rgba(20,60,20,.35)';const gx=sx+(h>>3)%24+4,gy=sy+(h>>7)%22+6;ctx.fillRect(gx,gy,1,3);ctx.fillRect(gx+2,gy-1,1,4);ctx.fillRect(gx+4,gy,1,3);break;}
    case T.RUIN:ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,TILE-1,TILE-1);if(v===2){ctx.beginPath();ctx.moveTo(sx+6,sy+8);ctx.lineTo(sx+14,sy+16);ctx.lineTo(sx+12,sy+24);ctx.stroke();}break;
    case T.PLAZA:ctx.strokeStyle='rgba(0,0,0,.13)';ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,15,15);ctx.strokeRect(sx+16.5,sy+16.5,15,15);break;
    case T.PATH:if(v===3){ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(sx+10,sy+14,4,3);}break;
    case T.VOLC:if(v===0){ctx.fillStyle='rgba(255,90,30,.14)';ctx.fillRect(sx+10,sy+14,6,2);}break;
    case T.DFLOOR:ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,TILE-1,TILE-1);if(v===1){ctx.beginPath();ctx.moveTo(sx+16,sy);ctx.lineTo(sx+16,sy+32);ctx.stroke();}break;
    case T.DWALL:{const below=ty+1<m.H?m.tiles[i+m.W]:T.DWALL;ctx.fillStyle='#2a2623';ctx.fillRect(sx+2,sy+2,TILE-4,TILE-14);if(below!==T.DWALL){ctx.fillStyle='#4a423a';ctx.fillRect(sx,sy+TILE-13,TILE,13);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.moveTo(sx,sy+TILE-6.5);ctx.lineTo(sx+TILE,sy+TILE-6.5);ctx.moveTo(sx+(v%2?10:20),sy+TILE-13);ctx.lineTo(sx+(v%2?10:20),sy+TILE-6.5);ctx.moveTo(sx+(v%2?22:6),sy+TILE-6.5);ctx.lineTo(sx+(v%2?22:6),sy+TILE);ctx.stroke();}break;}
    case T.RDIRT:if(v===2){ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(sx+8,sy+18,6,2);}break;
    case T.SCORCH:if(v===0){ctx.fillStyle='rgba(255,80,20,.12)';ctx.fillRect(sx+12,sy+10,4,4);}break;
    case T.CAMP:ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy+10.5);ctx.lineTo(sx+TILE,sy+10.5);ctx.moveTo(sx,sy+21.5);ctx.lineTo(sx+TILE,sy+21.5);ctx.stroke();break;
  }
  const d=m.deco[i];
  if(d===D.FLOWER){ctx.fillStyle=['#ffd84a','#ff6b8a','#ffffff','#b48cff'][v];ctx.fillRect(sx+7,sy+9,3,3);ctx.fillRect(sx+21,sy+19,3,3);ctx.fillRect(sx+13,sy+25,3,3);}
  else if(d===D.CRYSTAL){const g=.6+Math.sin(gameTime*3+tx)*.3;ctx.fillStyle='rgba(200,120,255,'+g+')';ctx.beginPath();ctx.moveTo(sx+16,sy+6);ctx.lineTo(sx+22,sy+20);ctx.lineTo(sx+16,sy+26);ctx.lineTo(sx+10,sy+20);ctx.closePath();ctx.fill();}
  else if(d===D.BONE){ctx.fillStyle='#d8d2c0';ctx.save();ctx.translate(sx+16,sy+18);ctx.rotate(v*.8);ctx.fillRect(-7,-1.2,14,2.4);circle(-7,-1.5,2);circle(-7,1.5,2);circle(7,-1.5,2);circle(7,1.5,2);ctx.restore();}}
// Ağaç tabanı: ağacın kapladığı (geçilemeyen) kareyi zeminde gösterir
function treeBase(x,y){ctx.fillStyle='rgba(30,50,20,.28)';rrect(x-15,y-25,30,29,9);ctx.fill();ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y-2,17,7,0,0,7);ctx.fill();ctx.strokeStyle='#4a3018';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-4,y-3);ctx.quadraticCurveTo(x-10,y,x-15,y+1);ctx.moveTo(x+4,y-3);ctx.quadraticCurveTo(x+10,y,x+15,y+2);ctx.moveTo(x,y-1);ctx.lineTo(x+1,y+4);ctx.stroke();}
// Oyuncu ağacın arkasındaysa tepe yarı saydam olur
function treeFade(x,y,w,h){const p=player;if(!p||p.dead)return 1;return(p.y<y-6&&p.y>y-h&&Math.abs(p.x-x)<w)?.45:1;}
function drawDeco(d,x,y,v){
  switch(d){
    case D.TREE:{treeBase(x,y);const fa=treeFade(x,y,40,84);ctx.globalAlpha=fa;ctx.fillStyle='#14100a';ctx.fillRect(x-7,y-30,14,30);ctx.fillStyle='#6b4423';ctx.fillRect(x-5,y-30,10,30);ctx.fillStyle='#8a5a30';ctx.fillRect(x-5,y-30,3,30);
      const C=[[x,y-62,22],[x-17,y-48,17],[x+17,y-48,17],[x,y-42,19],[x-9,y-70,13],[x+10,y-68,13]];ctx.fillStyle='#39753b';for(const c of C)circle(c[0],c[1],c[2]+2.5);ctx.fillStyle=v&1?'#65a83f':'#5c9e3a';for(const c of C)circle(c[0],c[1],c[2]);ctx.fillStyle=v&1?'#8fc34f':'#86ba47';circle(x-6,y-66,12);circle(x-18,y-52,9);circle(x+12,y-56,9);ctx.fillStyle='rgba(190,240,150,.45)';circle(x-9,y-70,4.5);circle(x-21,y-55,3);ctx.fillStyle='rgba(0,0,0,.18)';circle(x+12,y-40,10);ctx.globalAlpha=1;break;}
    case D.PINE:{treeBase(x,y);const fa=treeFade(x,y,34,90);ctx.globalAlpha=fa;ctx.fillStyle='#14100a';ctx.fillRect(x-6,y-18,12,18);ctx.fillStyle='#5a3a1e';ctx.fillRect(x-4,y-18,8,18);
      for(let k=0;k<4;k++){const w=26-k*5,yy=y-14-k*16;ctx.fillStyle='#2f5f30';ctx.beginPath();ctx.moveTo(x-w-2.5,yy+2);ctx.lineTo(x+w+2.5,yy+2);ctx.lineTo(x,yy-26);ctx.closePath();ctx.fill();ctx.fillStyle=v&1?'#4e8a3e':'#4a843b';ctx.beginPath();ctx.moveTo(x-w,yy);ctx.lineTo(x+w,yy);ctx.lineTo(x,yy-23);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(150,220,150,.25)';ctx.beginPath();ctx.moveTo(x-w+3,yy-1);ctx.lineTo(x-2,yy-1);ctx.lineTo(x,yy-21);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;break;}
    case D.DEAD:{treeBase(x,y);ctx.lineCap='round';for(const [lw,col] of [[8,'#1a1410'],[5,'#5a4a3e']]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-44);ctx.moveTo(x,y-26);ctx.lineTo(x-16,y-40);ctx.moveTo(x,y-34);ctx.lineTo(x+14,y-50);ctx.moveTo(x-16,y-40);ctx.lineTo(x-21,y-37);ctx.moveTo(x+14,y-50);ctx.lineTo(x+20,y-46);ctx.stroke();}break;}
    case D.ROCK:shadow(x,y,12,4);ctx.fillStyle='#7d7b80';ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x-9,y-11);ctx.lineTo(x+1,y-15);ctx.lineTo(x+11,y-8);ctx.lineTo(x+12,y);ctx.closePath();ctx.fill();ctx.fillStyle='#9a989d';ctx.beginPath();ctx.moveTo(x-9,y-11);ctx.lineTo(x+1,y-15);ctx.lineTo(x+2,y-6);ctx.lineTo(x-6,y-4);ctx.closePath();ctx.fill();break;
    case D.TOMB:shadow(x,y,10,3);ctx.fillStyle='#8f8e98';rrect(x-8,y-22,16,22,6);ctx.fill();ctx.fillStyle='#6a6972';ctx.fillRect(x-1.5,y-18,3,11);ctx.fillRect(x-5,y-15,10,3);ctx.fillStyle='#5a5a62';ctx.fillRect(x-10,y-3,20,4);break;
    case D.BUSH:shadow(x,y,11,4);ctx.fillStyle='#71834b';ctx.beginPath();ctx.arc(x-5,y-7,7,0,7);ctx.arc(x+5,y-7,7,0,7);ctx.arc(x,y-11,7,0,7);ctx.fill();if(v===2){ctx.fillStyle='#e04050';ctx.fillRect(x-4,y-10,3,3);ctx.fillRect(x+3,y-7,3,3);}break;
    case D.PALI:ctx.fillStyle='#6a4626';for(let k=-1;k<=1;k++){const px=x+k*10;ctx.fillRect(px-4,y-26,8,26);ctx.beginPath();ctx.moveTo(px-4,y-26);ctx.lineTo(px,y-33);ctx.lineTo(px+4,y-26);ctx.fill();}ctx.fillStyle='#4a3018';ctx.fillRect(x-16,y-18,32,3);break;
    case D.RWALL:shadow(x,y,14,4);ctx.fillStyle='#6a6670';ctx.fillRect(x-15,y-12,30,12);ctx.fillRect(x-15,y-22,16,10);ctx.fillRect(x+3,y-17,8,5);ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1;ctx.strokeRect(x-15,y-12,15,12);ctx.strokeRect(x,y-12,15,12);ctx.strokeRect(x-15,y-22,16,10);break;
    case D.WALL:{ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-16,y-2,32,8);ctx.fillStyle='#8f897e';ctx.fillRect(x-16,y-42,32,42);ctx.fillStyle='#a8a296';ctx.fillRect(x-16,y-48,32,7);ctx.fillStyle='#9d978b';ctx.fillRect(x-15,y-58,11,10);ctx.fillRect(x+2,y-58,11,10);
      ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=1;for(let r=0;r<4;r++){const yy=y-42+r*10.5;ctx.beginPath();ctx.moveTo(x-16,yy);ctx.lineTo(x+16,yy);ctx.stroke();const off=r%2?0:8;ctx.beginPath();ctx.moveTo(x-16+off+8,yy);ctx.lineTo(x-16+off+8,yy+10.5);ctx.moveTo(x+off,yy);ctx.lineTo(x+off,yy+10.5);ctx.stroke();}
      ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x-16,y-12,32,12);break;}
    case D.TOWER:{ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+2,22,7,0,0,7);ctx.fill();ctx.fillStyle='#857f74';ctx.fillRect(x-19,y-78,38,78);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x-19,y-78,8,78);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x+11,y-78,8,78);
      ctx.fillStyle='#9a9488';ctx.fillRect(x-22,y-86,44,9);for(let k=0;k<4;k++)ctx.fillRect(x-22+k*12,y-95,8,9);ctx.fillStyle='#1a1410';ctx.fillRect(x-3,y-60,6,14);ctx.fillRect(x-3,y-32,6,12);
      ctx.fillStyle='#2f4f8f';ctx.beginPath();ctx.moveTo(x-24,y-95);ctx.lineTo(x,y-128);ctx.lineTo(x+24,y-95);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(x-24,y-95);ctx.lineTo(x,y-128);ctx.lineTo(x-6,y-95);ctx.closePath();ctx.fill();
      const fw=Math.sin(gameTime*4+x)*3;ctx.strokeStyle='#4a3a2a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y-128);ctx.lineTo(x,y-146);ctx.stroke();ctx.fillStyle='#e8b830';ctx.beginPath();ctx.moveTo(x,y-146);ctx.quadraticCurveTo(x+9,y-144+fw,x+18,y-141+fw);ctx.lineTo(x,y-136);ctx.closePath();ctx.fill();break;}
    case D.LAMP:{shadow(x,y,6,2);ctx.fillStyle='#2a2626';ctx.fillRect(x-1.5,y-40,3,40);ctx.fillRect(x-5,y-3,10,3);ctx.fillRect(x-1,y-44,8,2);const fl2=.75+Math.sin(gameTime*7+x)*.1;ctx.fillStyle='#2a2626';ctx.fillRect(x+2,y-52,9,10);ctx.fillStyle='rgba(255,210,120,'+fl2+')';ctx.fillRect(x+3.5,y-50.5,6,7);ctx.fillStyle='rgba(255,220,140,.18)';circle(x+6.5,y-47,9);ctx.fillStyle='rgba(255,200,110,.08)';circle(x+6,y-46,26);break;}
    case D.PILLAR:shadow(x,y,11,4);ctx.fillStyle='#6e6a64';ctx.fillRect(x-8,y-46,16,46);ctx.fillStyle='#8a857e';ctx.fillRect(x-11,y-50,22,6);ctx.fillRect(x-11,y-5,22,5);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x+2,y-44,4,39);break;
  }}
function drawBuilding(b){if(b.tent)return drawTent(b);if(b.type==='keep')return drawKeep(b);if(b.type==='fountain')return drawFountain(b);return drawHouse(b);}
function drawTent(b){const x=b.x*TILE,y=b.y*TILE,w=b.w*TILE,h=b.h*TILE;ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x+4,y+h-6,w,10);ctx.fillStyle=b.roof;ctx.beginPath();ctx.moveTo(x-4,y+h);ctx.lineTo(x+w/2,y-18);ctx.lineTo(x+w+4,y+h);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.moveTo(x+w/2,y-18);ctx.lineTo(x+w+4,y+h);ctx.lineTo(x+w/2,y+h);ctx.closePath();ctx.fill();ctx.fillStyle='#1a1410';ctx.beginPath();ctx.moveTo(x+w/2-9,y+h);ctx.lineTo(x+w/2,y+h-26);ctx.lineTo(x+w/2+9,y+h);ctx.fill();ctx.strokeStyle='#4a3018';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w/2,y-18);ctx.lineTo(x+w/2,y-28);ctx.stroke();ctx.fillStyle=b.roof;ctx.fillRect(x+w/2,y-28,10,6);}
function drawWindow(wx,wy,ww,wh,lit){ctx.fillStyle='#3a2a18';ctx.fillRect(wx-2,wy-2,ww+4,wh+4);ctx.fillStyle=lit?'#ffe3a0':'#9ab8d0';ctx.fillRect(wx,wy,ww,wh);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(wx+1,wy+1,3,wh-2);ctx.strokeStyle='#3a2a18';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(wx+ww/2,wy);ctx.lineTo(wx+ww/2,wy+wh);ctx.moveTo(wx,wy+wh/2);ctx.lineTo(wx+ww,wy+wh/2);ctx.stroke();ctx.fillStyle='#6a4a28';ctx.fillRect(wx-3,wy+wh+1,ww+6,3);}
function drawHouse(b){const x=b.x*TILE,y=b.y*TILE,w=b.w*TILE,h=b.h*TILE,two=b.floors===2,lift=two?34:0;
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(x+8,y+h-4,w,12);
  const wallTop=y+h*.3-lift,base=y+h-16;
  ctx.fillStyle=b.forge?'#9a9286':'#dcc8a0';ctx.fillRect(x,wallTop,w,base-wallTop);
  if(two){ctx.fillStyle=b.forge?'#8a8276':'#cdb68a';ctx.fillRect(x,wallTop,w,(base-wallTop)/2);}
  ctx.fillStyle='#5a3a20';for(let bx=x;bx<=x+w-4;bx+=TILE)ctx.fillRect(bx,wallTop,4,base-wallTop);ctx.fillRect(x+w-4,wallTop,4,base-wallTop);ctx.fillRect(x,wallTop,w,4);
  if(two){const my=wallTop+(base-wallTop)/2;ctx.fillRect(x-4,my-2,w+8,5);ctx.strokeStyle='#5a3a20';ctx.lineWidth=2.5;for(let bx=x;bx<x+w-4;bx+=TILE){ctx.beginPath();ctx.moveTo(bx+4,wallTop+4);ctx.lineTo(bx+TILE,my-2);ctx.stroke();}}
  ctx.fillStyle='#8a847a';ctx.fillRect(x,base,w,16);ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,base+8);ctx.lineTo(x+w,base+8);for(let bx=x+10;bx<x+w;bx+=20){ctx.moveTo(bx,base);ctx.lineTo(bx,base+8);ctx.moveTo(bx+10,base+8);ctx.lineTo(bx+10,base+16);}ctx.stroke();
  const cols=b.w,doorC=Math.floor(cols/2);
  for(let c=0;c<cols;c++){const wx=x+c*TILE+9;if(c===doorC||(cols%2===0&&c===doorC-1&&cols>=6&&false))continue;const lowerY=two?wallTop+(base-wallTop)/2+12:wallTop+14;drawWindow(wx,lowerY,14,16,b.forge||c%3===0);if(two)drawWindow(wx,wallTop+14,14,16,c%2===0);}
  const dx=x+doorC*TILE+TILE/2-(cols%2===0?TILE/2:0);ctx.fillStyle='#3a2410';ctx.beginPath();ctx.moveTo(dx-12,base+16);ctx.lineTo(dx-12,base-18);ctx.arc(dx,base-18,12,Math.PI,0);ctx.lineTo(dx+12,base+16);ctx.closePath();ctx.fill();
  ctx.fillStyle='#6a4220';ctx.beginPath();ctx.moveTo(dx-9,base+16);ctx.lineTo(dx-9,base-17);ctx.arc(dx,base-17,9,Math.PI,0);ctx.lineTo(dx+9,base+16);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.moveTo(dx,base-26);ctx.lineTo(dx,base+16);ctx.stroke();ctx.fillStyle='#e0b840';circle(dx+5,base-2,1.8);
  const rTop=wallTop-44,ov=12;ctx.fillStyle=b.roof;ctx.beginPath();ctx.moveTo(x-ov,wallTop+6);ctx.lineTo(x+18,rTop);ctx.lineTo(x+w-18,rTop);ctx.lineTo(x+w+ov,wallTop+6);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.moveTo(x-ov,wallTop+6);ctx.lineTo(x+18,rTop);ctx.lineTo(x+30,rTop);ctx.lineTo(x-ov+14,wallTop+6);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=2;for(let k=1;k<5;k++){const yy=rTop+(wallTop+6-rTop)*k/5;const ix=(1-k/5)*(18+ov);ctx.beginPath();ctx.moveTo(x-ov+ix,yy);ctx.lineTo(x+w+ov-ix,yy);ctx.stroke();}
  ctx.fillStyle=shade(b.roof,-30);ctx.fillRect(x+16,rTop-4,w-32,5);
  if(w>=6*TILE){const mx=x+w/2;ctx.fillStyle=shade(b.roof,-15);ctx.beginPath();ctx.moveTo(mx-16,wallTop);ctx.lineTo(mx,rTop+6);ctx.lineTo(mx+16,wallTop);ctx.closePath();ctx.fill();drawWindow(mx-6,wallTop-20,12,12,true);}
  const chx=x+w-40;ctx.fillStyle='#6a625a';ctx.fillRect(chx,rTop-26,14,32);ctx.fillStyle='#4a443e';ctx.fillRect(chx-2,rTop-30,18,5);
  if(b.forge){for(let k=0;k<3;k++){const ph=(gameTime*.6+k/3)%1;ctx.fillStyle='rgba(120,120,120,'+(.45*(1-ph))+')';circle(chx+7+Math.sin(ph*6+k)*4,rTop-34-ph*40,5+ph*8);}
    const ax=x+w+16,ay=y+h+2;ctx.fillStyle='#3a3a40';ctx.fillRect(ax-11,ay-13,22,6);ctx.fillRect(ax-5,ay-7,10,6);ctx.fillRect(ax-9,ay-1,18,3);const g=.5+Math.sin(gameTime*5)*.2;ctx.fillStyle='rgba(255,120,40,'+g+')';ctx.fillRect(x+8,base-10,18,10);}
  if(b.market){const ay=base-34,n=Math.ceil((w+16)/16);for(let k=0;k<n;k++){ctx.fillStyle=k%2?'#f0e6d0':'#c0392b';ctx.beginPath();ctx.moveTo(x-8+k*16,ay);ctx.lineTo(x-8+k*16+16,ay);ctx.lineTo(x-8+k*16+16,ay+14);ctx.quadraticCurveTo(x+k*16,ay+20,x-8+k*16,ay+14);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#8a5a2a';ctx.fillRect(x+w+6,y+h-14,16,14);ctx.fillRect(x-22,y+h-12,14,12);ctx.fillStyle='#c84040';circle(x+w+10,y+h-17,3);circle(x+w+17,y+h-17,3);ctx.fillStyle='#e8c040';circle(x-15,y+h-15,3);}
  if(b.name){const sx=x+w/2,sy=wallTop-6;ctx.fillStyle='#4a3218';rrect(sx-44,sy-10,88,18,4);ctx.fill();ctx.strokeStyle='#c9a25a';ctx.lineWidth=1.5;ctx.stroke();ctx.font='bold 11px Georgia,serif';ctx.textAlign='center';ctx.fillStyle='#f3d890';ctx.fillText(b.name,sx,sy+3);}}
function drawKeep(b){const x=b.x*TILE,y=b.y*TILE,w=b.w*TILE,h=b.h*TILE,top=y-50;
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x+10,y+h-4,w,14);
  ctx.fillStyle='#9a958a';ctx.fillRect(x+20,top,w-40,y+h-top);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x+20,y+h-30,w-40,30);
  ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1;for(let r=0;r<10;r++){const yy=top+r*((y+h-top)/10);ctx.beginPath();ctx.moveTo(x+20,yy);ctx.lineTo(x+w-20,yy);ctx.stroke();}
  ctx.fillStyle='#a8a296';for(let k=0;k<Math.floor((w-40)/16);k++)ctx.fillRect(x+22+k*16,top-10,10,10);
  const gx=x+w/2,gy=y+h;ctx.fillStyle='#2a2018';ctx.beginPath();ctx.moveTo(gx-22,gy);ctx.lineTo(gx-22,gy-34);ctx.arc(gx,gy-34,22,Math.PI,0);ctx.lineTo(gx+22,gy);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#5a5048';ctx.lineWidth=2;for(let k=-16;k<=16;k+=8){ctx.beginPath();ctx.moveTo(gx+k,gy);ctx.lineTo(gx+k,gy-50);ctx.stroke();}for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(gx-22,gy-10-k*11);ctx.lineTo(gx+22,gy-10-k*11);ctx.stroke();}
  ctx.strokeStyle='#7a7468';ctx.lineWidth=4;ctx.beginPath();ctx.arc(gx,gy-34,24,Math.PI,0);ctx.stroke();
  for(const bx of [gx-60,gx+48]){ctx.fillStyle='#2f6a3a';ctx.beginPath();ctx.moveTo(bx,top+8);ctx.lineTo(bx+12,top+8);ctx.lineTo(bx+12,top+70+Math.sin(gameTime*2+bx)*2);ctx.lineTo(bx+6,top+62);ctx.lineTo(bx,top+70+Math.sin(gameTime*2+bx)*2);ctx.closePath();ctx.fill();ctx.fillStyle='#e8b830';circle(bx+6,top+28,4.5);ctx.fillRect(bx,top+8,12,3);}
  for(const wx of [x+40,x+w-50])for(const wy of [top+20,top+64]){ctx.fillStyle='#1a1410';ctx.fillRect(wx,wy,8,18);ctx.fillStyle='rgba(255,210,120,.5)';ctx.fillRect(wx+2,wy+4,4,10);}
  for(const tx of [x-6,x+w-38]){ctx.fillStyle='#8a8478';ctx.fillRect(tx,top-40,44,y+h-top+40);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(tx,top-40,10,y+h-top+40);ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(tx+34,top-40,10,y+h-top+40);
    ctx.fillStyle='#a09a8e';ctx.fillRect(tx-4,top-48,52,9);for(let k=0;k<4;k++)ctx.fillRect(tx-4+k*14,top-57,9,9);
    ctx.fillStyle='#1a1410';ctx.fillRect(tx+18,top-10,7,16);ctx.fillRect(tx+18,top+40,7,16);
    ctx.fillStyle='#2f4f8f';ctx.beginPath();ctx.moveTo(tx-6,top-57);ctx.lineTo(tx+22,top-104);ctx.lineTo(tx+50,top-57);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(tx-6,top-57);ctx.lineTo(tx+22,top-104);ctx.lineTo(tx+14,top-57);ctx.closePath();ctx.fill();
    const fw=Math.sin(gameTime*4+tx)*3;ctx.strokeStyle='#4a3a2a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tx+22,top-104);ctx.lineTo(tx+22,top-124);ctx.stroke();ctx.fillStyle='#2f6a3a';ctx.beginPath();ctx.moveTo(tx+22,top-124);ctx.quadraticCurveTo(tx+32,top-122+fw,tx+44,top-119+fw);ctx.lineTo(tx+22,top-112);ctx.closePath();ctx.fill();}
  if(b.name){ctx.fillStyle='#3a2a18';rrect(gx-50,top+2,100,18,4);ctx.fill();ctx.strokeStyle='#e0b840';ctx.lineWidth=1.5;ctx.stroke();ctx.font='bold 12px Georgia,serif';ctx.textAlign='center';ctx.fillStyle='#ffe090';ctx.fillText(b.name,gx,top+15);}}
function drawFountain(b){const cx=(b.x+b.w/2)*TILE,cy=(b.y+b.h/2)*TILE+14,t=gameTime;
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(cx+4,cy+6,70,36,0,0,7);ctx.fill();
  ctx.fillStyle='#b0a898';ctx.beginPath();ctx.ellipse(cx,cy,66,34,0,0,7);ctx.fill();ctx.fillStyle='#8e8678';ctx.fillRect(cx-66,cy,132,12);ctx.beginPath();ctx.ellipse(cx,cy+12,66,34,0,0,Math.PI);ctx.fill();
  ctx.fillStyle='#2f6eb0';ctx.beginPath();ctx.ellipse(cx,cy,56,27,0,0,7);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;for(let k=0;k<3;k++){const r=((t*.5+k/3)%1);ctx.globalAlpha=1-r;ctx.beginPath();ctx.ellipse(cx,cy,12+r*42,6+r*20,0,0,7);ctx.stroke();}ctx.globalAlpha=1;
  ctx.fillStyle='#a49c8c';ctx.fillRect(cx-9,cy-40,18,40);ctx.fillStyle='#b8b0a0';ctx.beginPath();ctx.ellipse(cx,cy-40,22,8,0,0,7);ctx.fill();ctx.fillStyle='#2f6eb0';ctx.beginPath();ctx.ellipse(cx,cy-41,17,5,0,0,7);ctx.fill();
  ctx.fillStyle='#c9b070';ctx.fillRect(cx-5,cy-70,10,26);circle(cx,cy-75,6);ctx.fillRect(cx-9,cy-66,18,5);ctx.fillStyle='#e8d090';ctx.save();ctx.translate(cx+6,cy-68);ctx.rotate(-.5);ctx.fillRect(-1.5,-28,3,28);ctx.fillRect(-5,-2,10,2.5);ctx.restore();
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2,ph=(t*1.4+k*.37)%1;const sx=cx+Math.cos(a)*4,sy=cy-44,ex=cx+Math.cos(a)*40,ey=cy+Math.sin(a)*18;const px=sx+(ex-sx)*ph,py=sy+(ey-sy)*ph-Math.sin(ph*Math.PI)*22;ctx.fillStyle='rgba(200,230,255,'+(.9-ph*.5)+')';ctx.fillRect(px-1.2,py-1.2,2.4,2.4);}}
function drawPortalGround(p){const t=gameTime;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=p.col+'33';ctx.beginPath();ctx.ellipse(0,0,30,13,0,0,7);ctx.fill();ctx.strokeStyle=p.col;ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.globalAlpha=.4+.3*Math.sin(t*3+k);ctx.beginPath();ctx.ellipse(0,0,26-k*7,11-k*3,0,t*(1+k*.5),t*(1+k*.5)+4.5);ctx.stroke();}ctx.globalAlpha=1;ctx.restore();}
function drawPortalArch(p){const x=p.x,y=p.y;ctx.fillStyle='#5a5660';ctx.fillRect(x-30,y-58,9,58);ctx.fillRect(x+21,y-58,9,58);ctx.fillStyle='#6e6a74';ctx.beginPath();ctx.moveTo(x-34,y-56);ctx.quadraticCurveTo(x,y-90,x+34,y-56);ctx.lineTo(x+30,y-48);ctx.quadraticCurveTo(x,y-78,x-30,y-48);ctx.closePath();ctx.fill();
  const g=ctx.createLinearGradient(0,y-70,0,y);g.addColorStop(0,p.col+'00');g.addColorStop(1,p.col+'88');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-21,y);ctx.lineTo(x-21,y-48);ctx.quadraticCurveTo(x,y-72,x+21,y-48);ctx.lineTo(x+21,y);ctx.closePath();ctx.fill();
  for(let k=0;k<2;k++){const ph=(gameTime*.8+k*.5)%1;ctx.fillStyle=p.col;ctx.globalAlpha=1-ph;circle(x+Math.sin(gameTime*3+k*3)*12,y-ph*60,2);}ctx.globalAlpha=1;}
function drawTorch(tc){const f=Math.sin(gameTime*12+tc.x)*1.5;ctx.fillStyle='#4a3020';ctx.fillRect(tc.x-2,tc.y-6,4,10);ctx.fillStyle='#ff9a30';ctx.beginPath();ctx.moveTo(tc.x-4,tc.y-6);ctx.quadraticCurveTo(tc.x+f,tc.y-20,tc.x+4,tc.y-6);ctx.fill();ctx.fillStyle='#ffe080';circle(tc.x,tc.y-9,2);}

// ---------- karakterler ----------
function drawHumanoid(x,y,o){
  const t=o.anim||0,mv=o.moving,bob=mv?-Math.abs(Math.sin(t*10))*2:0,sw=mv?Math.sin(t*10)*4:0,sc=o.s||1;
  ctx.save();ctx.translate(x,y);shadow(0,0,11*sc,4*sc);ctx.scale((o.face||1)*sc,sc);
  if(o.longhair){ctx.fillStyle=o.hair;ctx.fillRect(-8,-34+bob,6,18);}
  ctx.fillStyle=o.legs;ctx.fillRect(-6+sw*.4,-10,5,10);ctx.fillRect(1-sw*.4,-10,5,10);
  ctx.fillStyle=o.body;rrect(-8,-25+bob,16,16,4);ctx.fill();
  if(o.trim){ctx.fillStyle=o.trim;ctx.fillRect(-8,-13+bob,16,3);}
  if(o.ribs){ctx.fillStyle='#8a8676';for(let k=0;k<3;k++)ctx.fillRect(-5,-22+bob+k*3.5,10,1.5);}
  ctx.fillStyle=o.skin;circle(0,-31+bob,7);
  if(o.ears){ctx.beginPath();ctx.moveTo(-5,-33+bob);ctx.lineTo(-13,-37+bob);ctx.lineTo(-6,-29+bob);ctx.fill();}
  if(o.skull){ctx.fillStyle='#222';ctx.fillRect(0,-33+bob,3,3);ctx.fillRect(4,-33+bob,2.5,3);ctx.fillRect(1,-28+bob,5,1.5);}else{ctx.fillStyle=o.eye||'#222';ctx.fillRect(2.5,-32.5+bob,2,2);}
  if(o.hat==='wizard'){ctx.fillStyle=o.hatCol;ctx.beginPath();ctx.moveTo(-9,-35+bob);ctx.lineTo(9,-35+bob);ctx.lineTo(-3,-54+bob);ctx.closePath();ctx.fill();ctx.fillRect(-10,-37+bob,20,3);}
  else if(o.hat==='helm'){ctx.fillStyle=o.hatCol;ctx.beginPath();ctx.arc(0,-32+bob,8,Math.PI,0);ctx.fill();ctx.fillRect(-8,-33+bob,3,7);}
  else if(o.hair){ctx.fillStyle=o.hair;ctx.beginPath();ctx.arc(0,-33+bob,7.5,Math.PI,0);ctx.fill();ctx.fillRect(-7.5,-34+bob,3,7);}
  if(o.crown){ctx.fillStyle='#ffd040';ctx.beginPath();ctx.moveTo(-7,-37+bob);ctx.lineTo(-7,-44+bob);ctx.lineTo(-3.5,-40+bob);ctx.lineTo(0,-46+bob);ctx.lineTo(3.5,-40+bob);ctx.lineTo(7,-44+bob);ctx.lineTo(7,-37+bob);ctx.closePath();ctx.fill();}
  if(o.beard){ctx.fillStyle=o.beard;ctx.beginPath();ctx.moveTo(-3,-28+bob);ctx.lineTo(6,-28+bob);ctx.lineTo(2,-19+bob);ctx.closePath();ctx.fill();}
  const at=o.atk>0?1-o.atk/.2:-1;
  ctx.save();ctx.translate(7,-16+bob);
  if(o.weapon&&o.weapon!=='none'){ctx.rotate(at>=0?-1.2+at*2.6:.35);
    if(o.weapon==='sword'||o.weapon==='rsword'){ctx.fillStyle=o.weapon==='rsword'?'#9a8a70':'#dfe5ec';ctx.fillRect(-1.5,-22,3,20);ctx.fillStyle='#8a6a2a';ctx.fillRect(-5,-3,10,3);}
    else if(o.weapon==='staff'){ctx.fillStyle='#6e4a28';ctx.fillRect(-1.5,-26,3,36);ctx.fillStyle=o.orb||'#8fd0ff';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;circle(0,-28,4.5);ctx.shadowBlur=0;}
    else if(o.weapon==='dagger'){ctx.fillStyle='#c9ced4';ctx.fillRect(-1,-12,2.5,11);ctx.fillStyle='#5a3a1e';ctx.fillRect(-3,-2,6,2);}
    else if(o.weapon==='axe'){ctx.fillStyle='#6e4a28';ctx.fillRect(-1.5,-24,3,26);ctx.fillStyle='#b0b6bc';ctx.beginPath();ctx.moveTo(1,-24);ctx.quadraticCurveTo(14,-20,12,-10);ctx.lineTo(1,-14);ctx.fill();}
    else if(o.weapon==='hammer'){ctx.fillStyle='#6e4a28';ctx.fillRect(-1.2,-16,2.4,18);ctx.fillStyle='#5a5e66';ctx.fillRect(-5,-20,10,6);}}
  ctx.restore();ctx.restore();}

// ---------- +7 / +8 / +9 efektleri ----------
const NEON=['#8fe3ff','#c77dff','#ffcf40'];
function hexA(h,a){const n=parseInt(h.slice(1),16);return'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+clamp(a,0,1).toFixed(3)+')';}
function segPt(s,u,off){const dx=s[2]-s[0],dy=s[3]-s[1],l=Math.hypot(dx,dy)||1;return{x:s[0]+dx*u-dy/l*off,y:s[1]+dy*u+dx/l*off};}
function softDot(x,y,r,col,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,hexA(col,a));g.addColorStop(1,hexA(col,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
// Bıçak boyunca kayan parlak ışık
function shine(s,col,now,n,speed){for(let k=0;k<n;k++){const u=(now*speed+k/n)%1,a=Math.sin(u*Math.PI);const p=segPt(s,u,0);softDot(p.x,p.y,6,col,.85*a);softDot(p.x,p.y,2.2,'#ffffff',.9*a);}}
// Bıçağın etrafında sarmal enerji şeritleri
function ribbons(s,col,now){ctx.lineWidth=1.3;ctx.lineCap='round';for(let st=0;st<2;st++){ctx.strokeStyle=hexA(st?'#ffffff':col,st?.5:.9);ctx.beginPath();for(let i=0;i<=20;i++){const u=i/20,p=segPt(s,u,Math.sin(u*9-now*7+st*Math.PI)*3.6*Math.sin(u*Math.PI)+0);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.stroke();}}
// Yavaşça süzülen közler (her karede aynı yolu izler, titremez)
function embers(s,col,now,n){for(let i=0;i<n;i++){const life=(now*.55+i*.173)%1,u=(i*.37+.1)%1,side=i%2?1:-1;const p=segPt(s,u,side*(2+life*9));const a=Math.sin(life*Math.PI);softDot(p.x,p.y-life*6,3.2,col,.7*a);ctx.fillStyle=hexA('#ffffff',.8*a);ctx.fillRect(p.x-.6,p.y-life*6-.6,1.2,1.2);}}
function wfx(o,pathFn,base,seg,stroke,lw){const wp=o.wPlus||0,wc=NEON[o.wGrade||0],now=performance.now()/1000;
  const paint=col=>{if(stroke){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';pathFn();ctx.stroke();}else{ctx.fillStyle=col;pathFn();ctx.fill();}};
  if(wp>=7){ctx.shadowColor=wc;ctx.shadowBlur=wp===7?5+4*(.5+.5*Math.sin(now*2.4)):wp===8?14:20+4*Math.sin(now*3.5);}
  paint(base);ctx.shadowBlur=0;if(wp<7)return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(wp===7){ctx.globalAlpha*=.16+.14*(.5+.5*Math.sin(now*2.4));paint(wc);}
  else if(wp===8){ctx.globalAlpha*=.5;paint(wc);ctx.globalAlpha=1;shine(seg,wc,now,1,.55);}
  else{ctx.globalAlpha*=.62+.1*Math.sin(now*3.5);paint(wc);ctx.globalAlpha=1;ribbons(seg,wc,now);shine(seg,wc,now,2,.7);embers(seg,wc,now,5);}
  ctx.restore();}
function armorAura(o,now){const ap=o.aPlus||0;if(ap<7)return 0;return ap===7?.42*(.5+.5*Math.sin(now*2.4)):ap===8?.55:.74+.1*Math.sin(now*3);}
// Zırhın KENDİSİ parıldar: üzerinde kayan metalik ışık bandı + ışıltı yıldızları (etraf yanmaz)
function armorGlint(x,y,w,h,r,o,now){const ap=o.aPlus||0;if(ap<7)return;const ac=NEON[o.aGrade||0];
  const it=ap===7?.42*(.5+.5*Math.sin(now*2.4)):ap===8?.6:.82+.12*Math.sin(now*3.2);
  ctx.save();rrect(x,y,w,h,r);ctx.clip();ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=it*.15;ctx.fillStyle=ac;ctx.fillRect(x,y,w,h);ctx.globalAlpha=1;
  const span=w+h+10,base=x-h+((now*.55)%1)*span;ctx.lineCap='round';
  ctx.strokeStyle=hexA(ac,it*.5);ctx.lineWidth=4.5;ctx.beginPath();ctx.moveTo(base+3,y-3);ctx.lineTo(base+3-h,y+h+3);ctx.stroke();
  ctx.strokeStyle=hexA('#ffffff',it*.78);ctx.lineWidth=1.9;ctx.beginPath();ctx.moveTo(base,y-3);ctx.lineTo(base-h,y+h+3);ctx.stroke();
  if(ap>=8){const b2=x-h+(((now*.55)+.5)%1)*span;ctx.strokeStyle=hexA('#ffffff',it*.5);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(b2,y-3);ctx.lineTo(b2-h,y+h+3);ctx.stroke();}
  ctx.restore();
  if(ap>=8){const n=ap>=9?4:2;for(let k=0;k<n;k++){const ph=(now*1.25+k*.41)%1,al=Math.sin(ph*Math.PI)*it;if(al<=.02)continue;
    const px=x+w*(.2+.6*((k*.49+.15)%1)),py=y+h*(.18+.64*((k*.73+.2)%1)),s=1.1+al*1.7;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=hexA('#ffffff',al);
    ctx.beginPath();ctx.moveTo(px,py-s*2.3);ctx.lineTo(px+s*.55,py);ctx.lineTo(px,py+s*2.3);ctx.lineTo(px-s*.55,py);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(px-s*2.3,py);ctx.lineTo(px,py+s*.55);ctx.lineTo(px+s*2.3,py);ctx.lineTo(px,py-s*.55);ctx.closePath();ctx.fill();ctx.restore();}}}

// ---------- kahraman ----------
function castPose(p){if(!p.castK)return null;const k=(gameTime-p.castT)/0.3;if(k<0||k>1)return null;return{k:p.castK,prog:k};}
function arm(sx,sy,ang,len,col,wide){ctx.save();ctx.translate(sx,sy);ctx.rotate(ang);ctx.fillStyle=col;rrect(-2.4,-1,4.8,len+1,2);ctx.fill();if(wide){ctx.beginPath();ctx.moveTo(-2.4,len-4);ctx.lineTo(2.4,len-4);ctx.lineTo(4.5,len+2);ctx.lineTo(-4.5,len+2);ctx.closePath();ctx.fill();}ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=.7;rrect(-2.4,-1,4.8,len+1,2);ctx.stroke();ctx.restore();return{x:sx-Math.sin(ang)*len,y:sy+Math.cos(ang)*len};}
function hand(x,y,col){ctx.fillStyle=col;circle(x,y,2.6);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=.6;ctx.beginPath();ctx.arc(x,y,2.6,0,7);ctx.stroke();}
function drawHero(x,y,o){
  const NA=!!o.noA,NW=!!o.noW;const pal=NA?Object.assign({},NAKED_PAL):Object.assign({},HERO_PAL[o.cls],o.foe?FOE_PAL[o.cls]:null);const cls=NA?'none':o.cls,wc=NW?'none':o.cls,fem=o.gender==='f',sc=o.s||1,skin=o.skin||SKINS[0],hc=o.hairCol||HAIR_COLS[0],now=performance.now()/1000;
  const t=o.anim||0,mv=o.moving,rf=o.running?1.5:1,ph=t*(o.running?12.5:9.5),bob=mv?-Math.abs(Math.sin(ph))*2.3*rf:Math.sin(t*2.2)*.6,sw=mv?Math.sin(ph)*5*rf:Math.sin(t*1.6)*.8,armSw=mv?Math.sin(ph)*rf:0;
  const atr=o.atk>0?clamp(1-o.atk/.22,0,1):-1,at=atr<0?-1:1-Math.pow(1-atr,3);
  const gcol=GRADES[o.aGrade||0].col,wcol=WCOL[o.wGrade||0],sh=fem?7.3:9.2,hy=-39+bob,ty=-32+bob,OL='rgba(0,0,0,.42)';
  const gl=cls==='warrior'?'#9aa3ad':cls==='assassin'?'#1e1a24':cls==='archer'?'#6a4a2a':skin;
  ctx.save();ctx.translate(x,y);if(o.alpha!=null)ctx.globalAlpha*=o.alpha;if(!o.noShadow)shadow(0,0,12*sc,4.5*sc);if(o.cast){const cp=o.cast,e=Math.sin(cp.prog*Math.PI),ck=cp.k,fc=o.face||1;if(ck==='aoe')ctx.rotate(cp.prog*Math.PI*2*fc);else if(ck==='buff'||ck==='heal'||ck==='shield'||ck==='stealth')ctx.translate(0,-e*8);else if(ck==='dash'||ck==='blink'||ck==='strike'||ck==='multi')ctx.translate(fc*e*7,-e*2);else ctx.translate(fc*e*4,-e*3);}ctx.scale((o.face||1)*sc,sc);
  const aa=armorAura(o,now),ac=NEON[o.aGrade||0];
  const glowOn=()=>{},glowOff=()=>{};
  const outline=()=>{ctx.strokeStyle=OL;ctx.lineWidth=.8;ctx.stroke();};
  // ===== ÖN / ARKA görünüm (yukarı-aşağı hareket) =====
  if(o.dir==='front'||o.dir==='back'){const back=o.dir==='back',iris=fem?'#7a4a8e':'#3f6186',helm=o.helm!=null&&o.helm>=0;
    if((o.face||1)<0)ctx.scale(-1,1);
    // bacaklar
    for(const s of [-1,1]){const phse=ph+(s<0?0:Math.PI),lift=mv?Math.max(0,Math.sin(phse))*3*rf:0;
      ctx.save();ctx.translate(s*3.1,-15+bob*.3);glowOn();ctx.fillStyle=pal.pants;rrect(-2.4,-lift,4.8,7,1.6);ctx.fill();glowOff();outline();
      ctx.fillStyle=pal.boots;rrect(-2.8,4.6-lift,6,5,1.8);ctx.fill();outline();ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(-1.4,5.2-lift,2,1.5);ctx.restore();}
    if(cls==='mage'){glowOn();ctx.fillStyle=pal.body;ctx.beginPath();ctx.moveTo(-sh+1,ty+9);ctx.lineTo(sh-1,ty+9);ctx.lineTo(sh+4,-2);ctx.lineTo(-sh-4,-2);ctx.closePath();ctx.fill();glowOff();outline();ctx.fillStyle=gcol;ctx.fillRect(-sh-4,-4,sh*2+8,2);}
    // gövde
    glowOn();ctx.fillStyle=pal.body;if(fem){ctx.beginPath();ctx.moveTo(-sh,ty+3);ctx.quadraticCurveTo(-sh,ty,-sh+3,ty);ctx.lineTo(sh-3,ty);ctx.quadraticCurveTo(sh,ty,sh,ty+3);ctx.lineTo(sh-1.2,ty+10);ctx.lineTo(sh,ty+17);ctx.lineTo(-sh,ty+17);ctx.lineTo(-sh+1.2,ty+10);ctx.closePath();}else rrect(-sh,ty,sh*2,17,4);ctx.fill();glowOff();outline();
    ctx.fillStyle='rgba(0,0,0,.14)';ctx.fillRect(-sh+.5,ty+2,2,13);ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(sh-2.2,ty+2,1.6,13);
    if(!back){
      if(cls==='warrior'){glowOn();ctx.fillStyle=pal.plate;rrect(-sh+1,ty+1,sh*2-2,9,3);ctx.fill();glowOff();outline();ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(0,ty+2,.8,7);
        ctx.fillStyle=pal.tabard;ctx.fillRect(-3.4,ty+8,6.8,13);outline&&(ctx.strokeStyle=OL,ctx.strokeRect(-3.4,ty+8,6.8,13));ctx.fillStyle=gcol;circle(0,ty+13,1.8);
        ctx.fillStyle=pal.plate;circle(-sh+1,ty+2.5,4.7);circle(sh-1,ty+2.5,4.7);ctx.strokeStyle=OL;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(-sh+1,ty+2.5,4.7,0,7);ctx.stroke();ctx.beginPath();ctx.arc(sh-1,ty+2.5,4.7,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.28)';circle(-sh+2.4,ty+1,1.4);circle(sh-2.4,ty+1,1.4);}
      else if(cls==='mage'){ctx.fillStyle=gcol;ctx.beginPath();ctx.moveTo(-3.6,ty);ctx.lineTo(0,ty+7);ctx.lineTo(3.6,ty);ctx.fill();ctx.fillStyle=hexA(gcol==='#c4c4c4'?'#e0d090':gcol,.85);circle(0,ty+10,1.5);ctx.fillStyle=gcol;ctx.fillRect(-sh,ty+12,sh*2,2.4);}
      else if(cls==='archer'){ctx.strokeStyle='#4a3018';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-sh+1,ty+1);ctx.lineTo(sh-1,ty+14);ctx.stroke();ctx.fillStyle=gcol;circle(-sh+2,ty+2.5,1.6);ctx.fillStyle='#6a4a2a';ctx.fillRect(-sh,ty+13,sh*2,2.6);}
      else{ctx.strokeStyle='#0e0c12';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-sh+1,ty+1);ctx.lineTo(sh-1,ty+13);ctx.moveTo(sh-1,ty+1);ctx.lineTo(-sh+1,ty+13);ctx.stroke();ctx.fillStyle=gcol;circle(0,ty+7,1.7);}
      if(cls!=='mage'){ctx.fillStyle='#2a1a10';ctx.fillRect(-sh,ty+14,sh*2,2.6);ctx.fillStyle=gcol;ctx.fillRect(-1.6,ty+13.8,3.2,3);}
    }else{
      if(cls==='warrior'){glowOn();ctx.fillStyle=pal.plate;rrect(-sh+1,ty+1,sh*2-2,13,3);ctx.fill();glowOff();outline();ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,ty+2);ctx.lineTo(0,ty+13);ctx.stroke();ctx.fillStyle=pal.plate;circle(-sh+1,ty+2.5,4.7);circle(sh-1,ty+2.5,4.7);}
      else if(cls==='mage'||cls==='archer'){ctx.fillStyle=pal.cape;rrect(-sh-1,ty-1,sh*2+2,19,4);ctx.fill();outline();ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(-.8,ty,1.6,18);ctx.fillStyle=gcol;ctx.fillRect(-sh-1,ty-1,sh*2+2,2.4);}
      else{ctx.fillStyle='#2a1a10';ctx.fillRect(-sh,ty+14,sh*2,2.6);ctx.fillStyle=gcol;ctx.fillRect(-1.6,ty+13.8,3.2,3);}
      if(wc==='archer'){ctx.save();ctx.translate(3,ty+2);ctx.rotate(.28);ctx.fillStyle='#5a3a1e';rrect(-2.5,-2,5,14,2);ctx.fill();outline();ctx.fillStyle='#e8e0d0';for(let k=0;k<3;k++)ctx.fillRect(-2+k*1.7,-9,1.1,8);ctx.fillStyle='#c04040';for(let k=0;k<3;k++)ctx.fillRect(-2.3+k*1.7,-10,1.8,2.2);ctx.restore();}
      if(wc==='warrior'||wc==='assassin'){ctx.save();ctx.translate(-2,ty+4);ctx.rotate(-.5);ctx.fillStyle='#6a6a72';rrect(-1.5,-13,3,20,1);ctx.fill();outline();ctx.fillStyle=GRADES[o.wGrade||0].col;rrect(-3.4,6,6.8,2,1);ctx.fill();ctx.restore();}
    }
    if(aa>0)armorGlint(-sh,ty,sh*2,17,4,o,now);
    // kollar
    for(const s of [-1,1]){ctx.save();ctx.translate(s*(sh-1.4),ty+3.5);ctx.rotate(s*.12+(mv?Math.sin(ph+(s<0?0:Math.PI))*.35:0));
      glowOn();ctx.fillStyle=pal.sleeve;rrect(-2.1,0,4.2,9,2);ctx.fill();glowOff();outline();hand(0,9.6,gl);ctx.restore();}
    // silah (ön görünüm: elde)
    if(!back){
      if(wc==='warrior'){ctx.save();ctx.translate(sh-1.4,ty+12.6);ctx.fillStyle='#8a6a2a';rrect(-1.3,-1,2.6,6,1);ctx.fill();ctx.fillStyle=GRADES[o.wGrade||0].col;rrect(-4,-2.5,8,2.2,1);ctx.fill();
        wfx(o,()=>{ctx.beginPath();ctx.moveTo(-2,-2.5);ctx.lineTo(2,-2.5);ctx.lineTo(1.3,-26);ctx.lineTo(0,-30);ctx.lineTo(-1.3,-26);ctx.closePath();},wcol,[0,-4,0,-28]);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-1.3,-24,.8,20);ctx.restore();}
      else if(wc==='mage'){ctx.save();ctx.translate(sh-1.4,ty+12.6);ctx.fillStyle='#6e4a28';ctx.fillRect(-1.3,-26,2.6,32);ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=.6;ctx.strokeRect(-1.3,-26,2.6,32);
        const oc=['#bfe6ff','#c890ff','#ffd860'][o.wGrade||0];ctx.shadowColor=oc;ctx.shadowBlur=9;wfx(o,()=>{ctx.beginPath();ctx.arc(0,-30,4,0,7);},oc,[0,-28,0,8]);ctx.shadowBlur=0;ctx.fillStyle='#fff';circle(-1.1,-31,1.3);ctx.restore();}
      else if(wc==='archer'){ctx.save();ctx.translate(-(sh-1.4),ty+11);wfx(o,()=>{ctx.beginPath();ctx.arc(0,0,13,-1.15,1.15,false);},['#7a4a1e','#6a3a8a','#a07820'][o.wGrade||0],[0,-12,0,12],true,2.6);
        ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(13*Math.cos(-1.15),13*Math.sin(-1.15));ctx.lineTo(13*Math.cos(1.15),13*Math.sin(1.15));ctx.stroke();ctx.fillStyle=GRADES[o.wGrade||0].col;circle(13*Math.cos(-1.15),13*Math.sin(-1.15),1.3);circle(13*Math.cos(1.15),13*Math.sin(1.15),1.3);ctx.restore();}
      else if(wc!=='none'){for(const s of [-1,1]){ctx.save();ctx.translate(s*(sh-1.4),ty+12.6);ctx.rotate(s*.25);ctx.fillStyle='#3a2a1a';ctx.fillRect(-2,-1,4,2);
        wfx(o,()=>{ctx.beginPath();ctx.moveTo(-1.3,-1);ctx.lineTo(1.3,-1);ctx.lineTo(.2,-12);ctx.lineTo(-.2,-12);ctx.closePath();},wcol,[0,-2,0,-11]);ctx.restore();}}
    }
    // baş
    ctx.fillStyle=shade(skin,-16);ctx.fillRect(-2.1,ty-3.5,4.2,5);ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(-2.1,ty-3.5,4.2,1.4);
    ctx.save();ctx.translate(0,hy);ctx.scale(1.34,1.34);ctx.translate(0,-hy);
    const hg=ctx.createLinearGradient(0,hy-8,0,hy+8);hg.addColorStop(0,shade(skin,18));hg.addColorStop(.55,skin);hg.addColorStop(1,shade(skin,-20));
    ctx.fillStyle=back?shade(hc,-4):hg;circle(0,hy,7.8);ctx.strokeStyle=OL;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,hy,7.8,0,7);ctx.stroke();
    if(!back){
      // kulaklar
      ctx.fillStyle=shade(skin,-20);circle(-7.4,hy+1,1.7);circle(7.4,hy+1,1.7);ctx.fillStyle=shade(skin,-34);circle(-7.3,hy+1.3,.75);circle(7.3,hy+1.3,.75);
      // gözler (insansı: ak + renkli iris + bebek + ışıltı + üst kirpik)
      for(const s of [-1,1]){const ex=s*2.75,ey=hy+1.3;
        ctx.fillStyle='#fcf8f1';ctx.beginPath();ctx.ellipse(ex,ey,1.95,2.45,0,0,7);ctx.fill();
        ctx.fillStyle=iris;ctx.beginPath();ctx.ellipse(ex,ey+.4,1.5,1.95,0,0,7);ctx.fill();
        ctx.fillStyle='#120f18';ctx.beginPath();ctx.ellipse(ex,ey+.5,.78,1.18,0,0,7);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.97)';circle(ex-.65,ey-.6,.82);ctx.fillStyle='rgba(255,255,255,.55)';circle(ex+.62,ey+1.1,.44);
        ctx.strokeStyle='#2a1c22';ctx.lineWidth=.95;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ex-2.05,ey-1.4);ctx.quadraticCurveTo(ex,ey-2.75,ex+2,ey-1.5);ctx.stroke();}
      // kaşlar
      ctx.strokeStyle=shade(hc,-22);ctx.lineWidth=1.2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-4.6,hy-2.2);ctx.quadraticCurveTo(-2.9,hy-3.1,-1.1,hy-2.5);ctx.stroke();
      ctx.beginPath();ctx.moveTo(1.1,hy-2.5);ctx.quadraticCurveTo(2.9,hy-3.1,4.6,hy-2.2);ctx.stroke();
      // burun
      ctx.strokeStyle='rgba(120,72,58,.5)';ctx.lineWidth=.75;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(.2,hy+2.7);ctx.lineTo(.8,hy+3.9);ctx.lineTo(-.3,hy+4.1);ctx.stroke();
      // yanak allık
      ctx.fillStyle=fem?'rgba(236,120,132,.42)':'rgba(214,126,106,.26)';circle(-4.7,hy+3.9,1.7);circle(4.7,hy+3.9,1.7);
      // ağız (gülümseme + alt dudak)
      if(cls!=='assassin'){ctx.strokeStyle='#9a4a44';ctx.lineWidth=1.05;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-2.1,hy+5.2);ctx.quadraticCurveTo(0,hy+6.9,2.1,hy+5.2);ctx.stroke();
        ctx.fillStyle='rgba(216,112,112,.5)';ctx.beginPath();ctx.moveTo(-1.4,hy+5.6);ctx.quadraticCurveTo(0,hy+6.5,1.4,hy+5.6);ctx.quadraticCurveTo(0,hy+5.95,-1.4,hy+5.6);ctx.fill();}
      // suikastçı maskesi (ağzı/burnu örter, gözler açık kalır)
      if(cls==='assassin'){ctx.fillStyle=pal.scarf;ctx.beginPath();ctx.moveTo(-7,hy+2.8);ctx.lineTo(7,hy+2.8);ctx.lineTo(6,hy+8);ctx.quadraticCurveTo(0,hy+10.5,-6,hy+8);ctx.closePath();ctx.fill();outline();ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-5,hy+4.9);ctx.lineTo(5,hy+4.9);ctx.stroke();}
    }
    if(helm){const hcg=GRADES[o.helm].col;
      if(o.cls==='mage'){ctx.fillStyle=pal.cape;ctx.beginPath();ctx.moveTo(-9,hy-3);ctx.lineTo(9,hy-3);ctx.quadraticCurveTo(0,hy-11,-4,hy-26);ctx.closePath();ctx.fill();outline();ctx.fillStyle=hcg;ctx.fillRect(-9.5,hy-5,19,3);}
      else{ctx.fillStyle=o.cls==='warrior'?'#9aa3ad':'#1a1720';rrect(-8,hy-9,16,back?16:11,5);ctx.fill();outline();if(!back&&o.cls==='warrior'){ctx.fillStyle='#2a2a30';ctx.fillRect(-3.2,hy-1.5,6.4,2.2);}ctx.fillStyle=hcg;ctx.fillRect(-8,hy-9,16,2.4);}}
    else{ctx.fillStyle=hc;
      if(back){circle(0,hy-.5,8);if(fem||o.hair==='uzun'||o.hair==='kuyruk'){rrect(-3.5,hy+3,7,fem?16:10,3);ctx.fill();outline();ctx.fillStyle=hc;}
        if(o.hair==='diken'){for(let k=0;k<6;k++){ctx.beginPath();ctx.moveTo(-7+k*2.6,hy-5);ctx.lineTo(-8+k*2.6,hy-12);ctx.lineTo(-4+k*2.6,hy-5.5);ctx.fill();}}}
      else{ctx.beginPath();ctx.arc(0,hy-1,8.2,Math.PI*1.02,Math.PI*1.98);ctx.fill();ctx.fillRect(-8.2,hy-2,2.6,fem?10:6);ctx.fillRect(5.6,hy-2,2.6,fem?10:6);
        if(o.hair==='diken'){for(let k=0;k<6;k++){ctx.beginPath();ctx.moveTo(-7+k*2.6,hy-6);ctx.lineTo(-8+k*2.6,hy-13);ctx.lineTo(-4+k*2.6,hy-6.5);ctx.fill();}}
        ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.arc(0,hy-2,6,Math.PI*1.15,Math.PI*1.5);ctx.lineTo(0,hy-2);ctx.fill();}}
    ctx.restore();
    ctx.restore();return;}
  // --- arka katman ---
  if(cls==='mage'||cls==='archer'){ctx.fillStyle=pal.cape;ctx.beginPath();ctx.moveTo(-sh+2,ty+1);ctx.lineTo(sh-3,ty+1);ctx.quadraticCurveTo(-3-sw*.4,-14,-4-sw*.6,-3);ctx.lineTo(-sh-8-sw*.6,-4);ctx.closePath();ctx.fill();outline();ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.moveTo(-sh+2,ty+1);ctx.lineTo(-sh-2,ty+6);ctx.lineTo(-sh-8-sw*.6,-4);ctx.lineTo(-sh-4-sw*.6,-4);ctx.closePath();ctx.fill();}
  if(wc==='archer'){ctx.save();ctx.translate(-6,ty+6);ctx.rotate(-.4);ctx.fillStyle='#5a3a1e';rrect(-3.5,-4,7,17,2);ctx.fill();outline();ctx.fillStyle=gcol;ctx.fillRect(-3.5,2,7,1.5);ctx.fillStyle='#e8e0d0';for(let k=0;k<3;k++)ctx.fillRect(-2.4+k*1.7,-10,1.2,7);ctx.fillStyle='#c04040';for(let k=0;k<3;k++)ctx.fillRect(-2.8+k*1.7,-11,2,2.4);ctx.restore();}
  if(cls==='warrior'){ctx.save();ctx.translate(-sh+1,ty+10);ctx.fillStyle='#6a4a2a';ctx.beginPath();ctx.moveTo(-7.5,-10);ctx.lineTo(7.5,-10);ctx.lineTo(7.5,2);ctx.quadraticCurveTo(0,13,-7.5,2);ctx.closePath();ctx.fill();ctx.strokeStyle=gcol;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=gcol;ctx.fillRect(-1.1,-7,2.2,13);ctx.fillRect(-4.5,-2.5,9,2.2);ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(-6,-9,3,10);ctx.restore();}
  if(cls==='assassin'){ctx.fillStyle=pal.scarf;ctx.beginPath();ctx.moveTo(-4,hy+6);ctx.quadraticCurveTo(-12-sw*.4,hy+10,-16-sw*.8,hy+16+Math.sin(t*6)*2);ctx.lineTo(-12-sw*.6,hy+18);ctx.quadraticCurveTo(-8,hy+12,-2,hy+8);ctx.fill();}
  const helm=o.helm!=null&&o.helm>=0;
  if(!helm){ctx.fillStyle=hc;
    if(o.hair==='uzun'){if(fem){rrect(-9.5,hy-3,8.5,25,3.5);ctx.fill();outline();}else{rrect(-8.5,hy-2,6,13,2);ctx.fill();}}
    else if(o.hair==='kuyruk'){ctx.save();ctx.translate(-8,hy-1);ctx.rotate(.5+Math.sin(t*(mv?10:2))*.12);ctx.beginPath();ctx.ellipse(0,7,3.3,fem?10.5:7,0,0,7);ctx.fill();outline();ctx.fillStyle=gcol;ctx.fillRect(-2,-1,4,2);ctx.restore();}
    else if(fem&&o.hair==='kisa'){rrect(-8.5,hy-2,6,10.5,2);ctx.fill();}}
  // --- arka kol ---
  const bsx=-sh+3,bsy=ty+3,w=NW?'none':CLASSES[o.cls].weapon,slv=shade(pal.sleeve,-25);
  if(w==='daggers'){const ang=at>=0&&!o.alt?-.6-Math.sin(at*Math.PI)*1.3:.45+armSw*.5;const h=arm(bsx,bsy,ang,10,slv);ctx.save();ctx.translate(h.x,h.y);ctx.rotate(ang);wfx(o,()=>{ctx.beginPath();ctx.moveTo(-1.5,1);ctx.lineTo(1.5,1);ctx.lineTo(0,14);ctx.closePath();},shade(wcol,-30),[0,2,0,13]);ctx.fillStyle='#3a2a1a';ctx.fillRect(-2.6,-1,5.2,2.2);ctx.restore();hand(h.x,h.y,gl);}
  else if(w!=='bow'){const h=arm(bsx,bsy,.3+armSw*.55,10,slv,cls==='mage');hand(h.x,h.y,gl);}
  // --- bacaklar (kalçadan dönen yürüme döngüsü) ---
  if(o.riding&&cls!=='mage'){ctx.save();ctx.translate(1,-15);ctx.rotate(-1.25);ctx.fillStyle=pal.pants;ctx.fillRect(-2.3,0,4.6,8);ctx.strokeStyle=OL;ctx.lineWidth=.7;ctx.strokeRect(-2.3,0,4.6,8);ctx.translate(0,7.5);ctx.rotate(1.35);ctx.fillRect(-2.2,0,4.4,6);ctx.fillStyle=pal.boots;rrect(-2.8,4.5,6.6,5,1.5);ctx.fill();outline();ctx.restore();}
  else if(cls!=='mage'){for(const [hx,off,dk] of [[-2.5,0,-22],[2.6,Math.PI,0]]){const a=mv?Math.sin(ph+off)*(o.running?.85:.66):0,knee=mv?Math.max(0,Math.cos(ph+off))*(o.running?.72:.6):0;
      ctx.save();ctx.translate(hx,-15+bob*.3);ctx.rotate(-a);glowOn();ctx.fillStyle=dk?shade(pal.pants,dk):pal.pants;ctx.fillRect(-2.3,0,4.6,6.5);glowOff();ctx.strokeStyle=OL;ctx.lineWidth=.7;ctx.strokeRect(-2.3,0,4.6,6.5);
      ctx.translate(0,6);ctx.rotate(knee);ctx.fillStyle=dk?shade(pal.pants,dk):pal.pants;ctx.fillRect(-2.2,0,4.4,4.5);ctx.strokeRect(-2.2,0,4.4,4.5);
      if(cls==='warrior'){ctx.fillStyle=dk?'#7a828c':'#9aa3ad';ctx.fillRect(-2.5,-1.5,5,3.5);}
      ctx.fillStyle=dk?shade(pal.boots,dk):pal.boots;rrect(-2.8,3,6.6,5.8,1.6);ctx.fill();outline();ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(1.6,4,1.8,1.8);ctx.restore();}
    if(cls==='assassin'){ctx.fillStyle='#8a8a90';ctx.fillRect(2.4,-14,1.2,6);ctx.fillStyle='#3a2a1a';ctx.fillRect(2,-15,2,2);}}
  else{glowOn();ctx.fillStyle=pal.boots;ctx.fillRect(-4+sw*.35,-4,5,4);ctx.fillRect(1-sw*.35,-4,5,4);ctx.fillStyle=pal.body;ctx.beginPath();ctx.moveTo(-sh+1,-19+bob);ctx.lineTo(sh-1,-19+bob);ctx.lineTo(sh+4+sw*.25,-2);ctx.lineTo(-sh-4+sw*.25,-2);ctx.closePath();ctx.fill();glowOff();outline();
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.moveTo(-sh+1,-19+bob);ctx.lineTo(-sh+4,-19+bob);ctx.lineTo(-sh+1+sw*.25,-2);ctx.lineTo(-sh-4+sw*.25,-2);ctx.closePath();ctx.fill();
    ctx.fillStyle=gcol;ctx.fillRect(-sh-4+sw*.25,-4,sh*2+8,2);for(let k=0;k<3;k++){ctx.fillStyle=hexA(gcol==='#c4c4c4'?'#d0c090':gcol,.7);circle(-4+k*4+sw*.25,-9,1);}}
  glowOff();
  // --- gövde ---
  glowOn();ctx.fillStyle=pal.body;if(fem){ctx.beginPath();ctx.moveTo(-sh,ty+3);ctx.quadraticCurveTo(-sh,ty,-sh+3,ty);ctx.lineTo(sh-3,ty);ctx.quadraticCurveTo(sh,ty,sh,ty+3);ctx.lineTo(sh-1.2,ty+10);ctx.lineTo(sh,ty+17);ctx.lineTo(-sh,ty+17);ctx.lineTo(-sh+1.2,ty+10);ctx.closePath();}else rrect(-sh,ty,sh*2,17,4);ctx.fill();glowOff();outline();
  ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(-sh+.5,ty+2,2.5,14);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(sh-2.3,ty+2,1.8,13);ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(-sh+2,ty+1,sh*2-4,1.8);
  if(cls==='warrior'){glowOn();ctx.fillStyle=pal.plate;rrect(-sh+1,ty+1,sh*2-2,9.5,3);ctx.fill();glowOff();outline();ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(-sh+3,ty+2,3,6);ctx.strokeStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.moveTo(0,ty+2);ctx.lineTo(0,ty+10);ctx.stroke();
    ctx.fillStyle=pal.tabard;ctx.beginPath();ctx.moveTo(-3.8,ty+9);ctx.lineTo(3.8,ty+9);ctx.lineTo(3.8,ty+20);ctx.lineTo(0,ty+22.5);ctx.lineTo(-3.8,ty+20);ctx.closePath();ctx.fill();outline();ctx.fillStyle=gcol;circle(0,ty+14,1.8);
    ctx.fillStyle=pal.plate;circle(-sh+1.5,ty+2.5,5);circle(sh-1.5,ty+2.5,5);ctx.strokeStyle=gcol;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(sh-1.5,ty+2.5,5,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.3)';circle(sh-3,ty+1,1.5);}
  else if(cls==='mage'){ctx.fillStyle=gcol;ctx.beginPath();ctx.moveTo(-3.5,ty);ctx.lineTo(0,ty+7.5);ctx.lineTo(3.5,ty);ctx.fill();ctx.fillRect(-sh,ty+12,sh*2,2.5);ctx.fillStyle=hexA(gcol==='#c4c4c4'?'#e0d090':gcol,.8);ctx.fillRect(-.6,ty+8,1.2,4);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(sh-4,ty+2,2,9);}
  else if(cls==='archer'){ctx.fillStyle=pal.sleeve;ctx.fillRect(-sh,ty,sh*2,3.2);ctx.strokeStyle='#2a1a0a';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(sh-1,ty+1);ctx.lineTo(-sh+1,ty+15);ctx.stroke();ctx.fillStyle=gcol;circle(sh-3,ty+3,1.9);ctx.fillStyle='rgba(0,0,0,.2)';for(let k=0;k<3;k++)ctx.fillRect(-1+k*2.2,ty+6+k*1.6,1,1);}
  else{ctx.strokeStyle='#0e0c12';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-sh+1,ty+1);ctx.lineTo(sh-1,ty+14);ctx.moveTo(sh-1,ty+1);ctx.lineTo(-sh+1,ty+14);ctx.stroke();ctx.fillStyle=gcol;circle(0,ty+7.5,1.9);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(sh-3,ty+2,1.5,12);}
  ctx.fillStyle='#2a1a10';ctx.fillRect(-sh,ty+14,sh*2,2.6);ctx.fillStyle=gcol;ctx.fillRect(-1.6,ty+13.8,3.2,3);
  if(aa>0)armorGlint(-sh,ty,sh*2,17,4,o,now);
  // --- baş (chibi: belirgin büyütülmüş, sevimli oran) ---
  ctx.save();ctx.translate(0,ty+3);ctx.scale(1.34,1.34);ctx.translate(0,-(ty+3));
  ctx.fillStyle=shade(skin,-16);ctx.fillRect(-1.6,ty-3,4.2,4.5);ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(-1.6,ty-3,4.2,1.5);
  ctx.fillStyle=skin;circle(1,hy,7.6);
  const hg=ctx.createLinearGradient(0,hy-8,0,hy+8);hg.addColorStop(0,shade(skin,18));hg.addColorStop(.5,skin);hg.addColorStop(1,shade(skin,-22));ctx.fillStyle=hg;circle(1,hy,7.6);
  ctx.strokeStyle=OL;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(1,hy,7.6,0,7);ctx.stroke();
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.arc(1,hy,7.6,Math.PI*.52,Math.PI*1.32);ctx.lineTo(1,hy);ctx.fill();
  ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(7.3,hy-.6);ctx.lineTo(9.1,hy+1.1);ctx.lineTo(7.1,hy+2);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=.5;ctx.stroke();
  ctx.fillStyle='#f6f2ea';ctx.beginPath();ctx.ellipse(5.1,hy+.1,2.1,2.7,0,0,7);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=.5;ctx.stroke();
  ctx.fillStyle=fem?'#7a4a8e':'#3f6186';ctx.beginPath();ctx.ellipse(5.5,hy+.2,1.5,2.1,0,0,7);ctx.fill();
  ctx.fillStyle='#120f18';ctx.beginPath();ctx.ellipse(5.7,hy+.3,.85,1.4,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.95)';circle(5.1,hy-.7,.85);ctx.fillStyle='rgba(255,255,255,.6)';circle(6,hy+1,.45);
  ctx.fillStyle=shade(hc,-14);ctx.fillRect(3.4,hy-3.5,4,1.1);
  if(fem){ctx.fillStyle='rgba(232,110,120,.42)';circle(4.2,hy+2.9,1.9);ctx.fillStyle='#c0505a';ctx.fillRect(4.1,hy+3.7,2.9,1.1);}else{ctx.fillStyle='#8a4a3a';ctx.fillRect(4.3,hy+3.6,2.7,1);ctx.fillStyle=shade(skin,-26);ctx.fillRect(-6.6,hy-.6,1.9,3.2);ctx.fillStyle='rgba(0,0,0,.14)';ctx.fillRect(7.5,hy-.3,1,2.6);}
  if(cls==='assassin'){ctx.fillStyle=pal.scarf;ctx.beginPath();ctx.moveTo(-6.5,hy+1);ctx.lineTo(8.8,hy+.2);ctx.lineTo(7.5,hy+6);ctx.quadraticCurveTo(0,hy+9.5,-6.5,hy+5.5);ctx.closePath();ctx.fill();outline();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.moveTo(-3,hy+3);ctx.lineTo(7,hy+3.4);ctx.stroke();}
  if(!helm){ctx.fillStyle=hc;ctx.beginPath();ctx.arc(1,hy-1.2,8.2,Math.PI*.97,Math.PI*2.03);ctx.fill();ctx.fillRect(-7.2,hy-2,4,o.hair==='kisa'&&!fem?6:8);ctx.beginPath();ctx.moveTo(4,hy-7.5);ctx.lineTo(9.4,hy-3);ctx.lineTo(5,hy-3.5);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(1,hy-2,6.5,Math.PI*1.25,Math.PI*1.55);ctx.lineTo(1,hy-2);ctx.fill();ctx.fillStyle=hc;
    if(o.hair==='diken'){for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(-5+k*4,hy-7);ctx.lineTo(-6+k*4,hy-14+(k%2)*2);ctx.lineTo(-1+k*4,hy-8);ctx.fill();}}
    if(fem&&o.hair==='uzun'){ctx.fillRect(6,hy-3,2.4,9);}if(fem&&o.hair==='kisa'){ctx.fillRect(6.2,hy-3,2,5);}}
  else{const hcg=GRADES[o.helm].col;
    if(o.cls==='warrior'){ctx.fillStyle='#9aa3ad';rrect(-7.6,hy-9,17.2,16,5);ctx.fill();outline();ctx.fillStyle='#2a2a30';ctx.fillRect(2,hy-1.5,7.6,2);ctx.fillStyle='rgba(0,0,0,.2)';for(let k=0;k<3;k++)ctx.fillRect(4+k*2,hy+2,1,3);ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(-5,hy-7,3,10);ctx.fillStyle=hcg;ctx.save();ctx.translate(-2,hy-11);ctx.rotate(-.3);ctx.beginPath();ctx.ellipse(0,0,7.5,2.8,0,0,7);ctx.fill();ctx.restore();}
    else if(o.cls==='mage'){ctx.fillStyle=pal.cape;ctx.beginPath();ctx.moveTo(-9.5,hy-4);ctx.lineTo(11.5,hy-4);ctx.quadraticCurveTo(2,hy-12,-6,hy-28);ctx.closePath();ctx.fill();outline();ctx.fillStyle=hcg;ctx.fillRect(-10,hy-6,22,3);ctx.fillStyle=hexA(hcg,.9);circle(-6,hy-28,1.8);}
    else{ctx.fillStyle=o.cls==='archer'?pal.cape:'#1a1720';ctx.beginPath();ctx.arc(1,hy,9.3,Math.PI*.78,Math.PI*2.17);ctx.lineTo(-7,hy+9);ctx.closePath();ctx.fill();outline();ctx.strokeStyle=hcg;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(1,hy,9.3,Math.PI*1.2,Math.PI*1.9);ctx.stroke();}}
  ctx.restore();
  // --- ön kol + silah ---
  const fsx=sh-3,fsy=ty+3;
  if(w==='greatsword'){const ang=at>=0?2.4+at*2.9:-.55-armSw*.25;
    if(at>.04&&at<1){const p1=ang+Math.PI/2,p0=Math.max(2.4,ang-1.5)+Math.PI/2,tc=(o.wPlus||0)>=7?NEON[o.wGrade||0]:'#ffffff';ctx.save();ctx.globalCompositeOperation='lighter';
      const g=ctx.createRadialGradient(fsx,fsy,16,fsx,fsy,47);g.addColorStop(0,hexA(tc,0));g.addColorStop(.75,hexA(tc,.45*(1-atr)));g.addColorStop(1,hexA(tc,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(fsx,fsy,47,p0,p1);ctx.arc(fsx,fsy,16,p1,p0,true);ctx.closePath();ctx.fill();ctx.restore();}
    ctx.save();ctx.translate(fsx,fsy);ctx.rotate(ang);ctx.fillStyle=pal.sleeve;rrect(-2.4,-1,4.8,12,2);ctx.fill();outline();ctx.fillStyle='#9aa3ad';ctx.fillRect(-2.6,6,5.2,4);ctx.translate(0,11);ctx.rotate(at>=0?0:-1.75);
    wfx(o,()=>{ctx.beginPath();ctx.moveTo(-2.5,3);ctx.lineTo(2.5,3);ctx.lineTo(1.8,30);ctx.lineTo(0,36);ctx.lineTo(-1.8,30);ctx.closePath();},wcol,[0,5,0,34]);
    ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-2.5,3);ctx.lineTo(-1.8,30);ctx.lineTo(0,36);ctx.lineTo(1.8,30);ctx.lineTo(2.5,3);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-1.6,5,1,24);
    ctx.fillStyle='#8a6a2a';rrect(-7,1,14,3.2,1);ctx.fill();ctx.fillStyle=GRADES[o.wGrade||0].col;circle(-7,2.6,1.6);circle(7,2.6,1.6);ctx.fillStyle='#4a2a14';ctx.fillRect(-1.3,-6,2.6,7);ctx.fillStyle=GRADES[o.wGrade||0].col;circle(0,-6.6,2.1);hand(0,0,gl);ctx.restore();}
  else if(w==='staff'){const ang=at>=0?-.5-Math.sin(at*Math.PI)*1.1:-.35-armSw*.2;ctx.save();ctx.translate(fsx,fsy);ctx.rotate(ang);ctx.fillStyle=pal.sleeve;rrect(-2.7,-1,5.4,12,2);ctx.fill();ctx.beginPath();ctx.moveTo(-2.7,7);ctx.lineTo(2.7,7);ctx.lineTo(5,13);ctx.lineTo(-5,13);ctx.closePath();ctx.fill();outline();ctx.translate(0,11);ctx.rotate(-ang);
    ctx.fillStyle='#6e4a28';ctx.fillRect(-1.6,-30,3.2,44);ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=.7;ctx.strokeRect(-1.6,-30,3.2,44);ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(-1,-28,.8,40);
    ctx.fillStyle=GRADES[o.wGrade||0].col;ctx.beginPath();ctx.moveTo(-4,-30);ctx.lineTo(-5,-38);ctx.lineTo(-2,-33);ctx.lineTo(2,-33);ctx.lineTo(5,-38);ctx.lineTo(4,-30);ctx.closePath();ctx.fill();
    const oc=['#bfe6ff','#c890ff','#ffd860'][o.wGrade||0];ctx.shadowColor=oc;ctx.shadowBlur=10;wfx(o,()=>{ctx.beginPath();ctx.arc(0,-36,4.8,0,7);},oc,[0,-34,0,8]);ctx.shadowBlur=0;ctx.fillStyle='#fff';circle(-1.2,-37.4,1.5);
    if(at>=0){const k=Math.sin(atr*Math.PI);ctx.save();ctx.globalCompositeOperation='lighter';softDot(0,-36,8+k*14,oc,.9*k);ctx.strokeStyle=hexA(oc,.8*k);ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,-36,6+atr*16,0,7);ctx.stroke();ctx.restore();}
    hand(0,0,gl);ctx.restore();}
  else if(w==='bow'){const pull=at>=0?Math.sin(at*Math.PI):0;const bx=fsx+11,by=fsy+.5;arm(fsx,fsy,-1.5,11,pal.sleeve);ctx.fillStyle='#4a3018';ctx.fillRect(fsx+5,fsy-1.6,4,3.2);
    const top={x:bx-7+15*Math.cos(-1.1),y:by+15*Math.sin(-1.1)},bot={x:top.x,y:by-15*Math.sin(-1.1)};
    wfx(o,()=>{ctx.beginPath();ctx.arc(bx-7,by,15,-1.1,1.1);},['#7a4a1e','#6a3a8a','#a07820'][o.wGrade||0],[top.x,top.y,bot.x,bot.y],true,3);
    ctx.fillStyle=GRADES[o.wGrade||0].col;circle(top.x,top.y,1.4);circle(bot.x,bot.y,1.4);hand(bx,by,gl);
    const pp={x:bx-6-pull*8,y:by};ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(top.x,top.y);ctx.lineTo(pp.x,pp.y);ctx.lineTo(bot.x,bot.y);ctx.stroke();
    if(pull>.1){ctx.strokeStyle='#d8c090';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(bx+9,by);ctx.stroke();ctx.fillStyle='#eee';ctx.beginPath();ctx.moveTo(bx+12,by);ctx.lineTo(bx+8,by-2);ctx.lineTo(bx+8,by+2);ctx.fill();}
    ctx.strokeStyle=slv;ctx.lineWidth=4.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(bsx,bsy);ctx.lineTo(pp.x,pp.y);ctx.stroke();hand(pp.x,pp.y,gl);}
  else if(w==='daggers'){const ang=at>=0&&o.alt?-.6-Math.sin(at*Math.PI)*1.3:-.4-armSw*.45;ctx.save();ctx.translate(fsx,fsy);ctx.rotate(ang);ctx.fillStyle=pal.sleeve;rrect(-2.4,-1,4.8,11,2);ctx.fill();outline();ctx.translate(0,10);
    wfx(o,()=>{ctx.beginPath();ctx.moveTo(-1.7,1);ctx.lineTo(1.7,1);ctx.lineTo(.3,15);ctx.lineTo(-.3,15);ctx.closePath();},wcol,[0,2,0,14]);
    ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(-1,2,.7,10);ctx.fillStyle='#3a2a1a';ctx.fillRect(-2.9,-1,5.8,2.3);ctx.fillStyle=GRADES[o.wGrade||0].col;circle(0,-2,1.2);hand(0,0,gl);ctx.restore();}
  else{const h=arm(fsx,fsy,-.3-armSw*.55,10,pal.sleeve);hand(h.x,h.y,gl);}
  ctx.restore();}
function heroLook(e){return{cls:e.cls,gender:e.gender,hair:e.hair,hairCol:e.hairCol,skin:e.skin,face:e.face,dir:e.dir,anim:e.anim,moving:e.moving,atk:e.atkAnim,alt:e.alt,wGrade:e.wGrade||0,wName:e.wName||null,wPlus:e.wPlus||0,aGrade:e.aGrade||0,aPlus:e.aPlus||0,helm:e.helm==null?-1:e.helm,foe:e.foe,noW:!!e.noW,noA:!!e.noA};}

// ---------- canavarlar (sevimli, yuvarlak, iri gözlü tarz) ----------
function cuteEye(x,y,r,irisCol){ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(x,y,r,r*1.18,0,0,7);ctx.fill();
  ctx.fillStyle=irisCol||'#1d1726';ctx.beginPath();ctx.ellipse(x+r*.12,y+r*.1,r*.72,r*.92,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.95)';circle(x-r*.32,y-r*.5,r*.42);ctx.fillStyle='rgba(255,255,255,.55)';circle(x+r*.35,y+r*.45,r*.22);}
function cuteBlush(lx,rx,y,r){ctx.fillStyle='rgba(255,140,155,.35)';circle(lx,y,r);circle(rx,y,r);}
function drawSlime(e){const r=e.r,bo=Math.sin(e.anim*5)*.11,sq=1+bo;shadow(0,0,r*1.05,r*.4);
  const base=e.d.tint||(e.lvl>=3?'#4cc2dc':'#64cf7a'),dk=shade(base,-42);
  const top=-r*1.62/sq;
  ctx.fillStyle=base;ctx.beginPath();ctx.moveTo(-r*sq,-1);ctx.quadraticCurveTo(-r*sq,top,0,top);ctx.quadraticCurveTo(r*sq,top,r*sq,-1);ctx.quadraticCurveTo(r*.65,2.5,0,2.5);ctx.quadraticCurveTo(-r*.65,2.5,-r*sq,-1);ctx.closePath();ctx.fill();
  ctx.lineWidth=1.7;ctx.strokeStyle=dk;ctx.stroke();
  ctx.fillStyle=shade(base,-16);ctx.beginPath();ctx.ellipse(0,-1,r*sq*.82,r*.34,0,0,Math.PI);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(-r*.42,top*.72,r*.3,r*.17,-.5,0,7);ctx.fill();
  const ex=e.face*2,ey=top*.52;cuteEye(ex-r*.4,ey,r*.26);cuteEye(ex+r*.4,ey,r*.26);
  cuteBlush(ex-r*.62,ex+r*.62,ey+r*.42,r*.16);
  ctx.strokeStyle=dk;ctx.lineWidth=1.3;ctx.lineCap='round';ctx.beginPath();ctx.arc(ex,ey+r*.3,r*.2,.12*Math.PI,.88*Math.PI);ctx.stroke();}
function drawWolf(e){const t=e.anim,lg=e.moving?Math.sin(t*13)*3:0;shadow(0,0,18,5.5);ctx.save();ctx.scale(e.face,1);
  const c=e.d.tint||(e.lvl>=5?'#6b7078':'#9aa0a8'),dk=shade(c,-36);
  ctx.fillStyle=dk;for(const[lx,ph] of [[-11,0],[-4,Math.PI],[5,0],[11,Math.PI]]){const o=Math.sin(t*13+ph)*(e.moving?2.5:0);rrect(lx-2+o,-9,4.4,9,1.6);ctx.fill();}
  ctx.strokeStyle=c;ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-13,-15);ctx.quadraticCurveTo(-24,-17+Math.sin(t*5)*3,-22,-26);ctx.stroke();
  ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-1,-16,15,9.5,0,0,7);ctx.fill();ctx.lineWidth=1.7;ctx.strokeStyle=dk;ctx.stroke();
  ctx.fillStyle=shade(c,14);ctx.beginPath();ctx.ellipse(-3,-20,10,3.6,0,0,7);ctx.fill();
  ctx.fillStyle=c;circle(16,-21,9.2);ctx.lineWidth=1.7;ctx.strokeStyle=dk;ctx.beginPath();ctx.arc(16,-21,9.2,0,7);ctx.stroke();
  ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(10,-28);ctx.lineTo(10,-37);ctx.lineTo(17,-29);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(18,-29);ctx.lineTo(23,-36);ctx.lineTo(23,-27);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=shade(c,12);ctx.beginPath();ctx.ellipse(24,-18,5.2,4.2,0,0,7);ctx.fill();ctx.fillStyle='#2a2228';circle(27,-18.5,1.7);ctx.fillStyle='rgba(255,255,255,.5)';circle(26.4,-19.2,.7);
  cuteEye(17,-22,2.7,e.target?'#d82f22':'#2a2430');
  if(e.d.boss){ctx.fillStyle='#ffd040';for(const hx of [9,20]){ctx.beginPath();ctx.moveTo(hx,-30);ctx.lineTo(hx+1,-39);ctx.lineTo(hx+4,-31);ctx.closePath();ctx.fill();}}
  ctx.restore();}
function drawImp(e){const f=Math.sin(e.anim*3)*2.6;shadow(0,0,11,4);ctx.save();ctx.translate(0,-13+f);ctx.scale(e.face,1);
  const base=e.d.tint||'#d8431f',dk=shade(base,-40);
  ctx.fillStyle=dk;rrect(-5.5,6,4.5,4,1.4);ctx.fill();rrect(1,6,4.5,4,1.4);ctx.fill();
  ctx.fillStyle=base;ctx.beginPath();ctx.ellipse(0,0,11,10.5,0,0,7);ctx.fill();ctx.lineWidth=1.7;ctx.strokeStyle=dk;ctx.stroke();
  ctx.fillStyle=shade(base,-14);ctx.beginPath();ctx.ellipse(0,3,9,5,0,0,Math.PI);ctx.fill();
  ctx.fillStyle=dk;ctx.beginPath();ctx.moveTo(-7,-7);ctx.lineTo(-11,-17);ctx.lineTo(-3,-9.5);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(7,-7);ctx.lineTo(11,-17);ctx.lineTo(3,-9.5);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(-4,-5,3.2,2,-.5,0,7);ctx.fill();
  cuteEye(-3.6,-2,2.7,'#5a0e04');cuteEye(3.6,-2,2.7,'#5a0e04');
  ctx.fillStyle='#ffe85a';circle(-3.4,-2.2,.9);circle(3.8,-2.2,.9);
  ctx.strokeStyle=dk;ctx.lineWidth=1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-6.5,-5.5);ctx.lineTo(-1.6,-3.6);ctx.moveTo(6.5,-5.5);ctx.lineTo(1.6,-3.6);ctx.stroke();
  ctx.fillStyle='#3a0a04';ctx.beginPath();ctx.moveTo(-4,3.2);ctx.quadraticCurveTo(0,7.4,4,3.2);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-3,3.4);ctx.lineTo(-1.8,5.4);ctx.lineTo(-.6,3.4);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(1,3.4);ctx.lineTo(2,5.2);ctx.lineTo(3,3.4);ctx.closePath();ctx.fill();
  if(e.atkAnim>0){ctx.fillStyle='rgba(255,'+(150+rand()*80|0)+',40,.8)';ctx.beginPath();ctx.moveTo(-3,-10);ctx.quadraticCurveTo(0,-22-rand()*5,3,-10);ctx.closePath();ctx.fill();}
  ctx.restore();}
function drawSpider(e){const t=e.anim;shadow(0,0,16,5);ctx.save();ctx.scale(e.face,1);const base=e.d.tint||'#6a4a84',dk=shade(base,-36);
  ctx.strokeStyle=dk;ctx.lineWidth=2.4;ctx.lineCap='round';
  for(let k=0;k<4;k++){const ph=Math.sin(t*13+k*1.7)*(e.moving?3:1.2);for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*3,-10);ctx.lineTo(s*(10+k*2.4),-18+k*3+ph);ctx.lineTo(s*(14+k*2.4),-1+ph*.5);ctx.stroke();}}
  ctx.fillStyle=base;ctx.beginPath();ctx.ellipse(-6,-11,11,9.5,0,0,7);ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=dk;ctx.stroke();
  ctx.fillStyle=shade(base,16);ctx.beginPath();ctx.ellipse(-8,-14,6,3,0,0,7);ctx.fill();
  ctx.fillStyle=base;circle(7,-10,7);ctx.lineWidth=1.6;ctx.strokeStyle=dk;ctx.beginPath();ctx.arc(7,-10,7,0,7);ctx.stroke();
  cuteEye(5,-11,2.4,'#b02038');cuteEye(10.5,-10,2,'#b02038');
  cuteBlush(3,12,-7,1.5);ctx.restore();}
function drawWraith(e){const t=e.anim,fy=Math.sin(t*2.5)*4;shadow(0,0,10,3);ctx.save();ctx.globalAlpha*=.88;ctx.scale(e.face,1);ctx.translate(0,-20+fy);
  const g=ctx.createLinearGradient(0,-30,0,18);g.addColorStop(0,'#cfeaff');g.addColorStop(1,'rgba(120,180,230,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-10,-16);ctx.quadraticCurveTo(0,-36,11,-16);ctx.lineTo(12,6);for(let k=0;k<4;k++){ctx.lineTo(8-k*6,15+Math.sin(t*6+k)*3);ctx.lineTo(5-k*6,6);}ctx.closePath();ctx.fill();
  ctx.fillStyle='#0a1a2a';ctx.beginPath();ctx.ellipse(2,-16,6,7,0,0,7);ctx.fill();ctx.fillStyle='#7fe8ff';ctx.shadowColor='#7fe8ff';ctx.shadowBlur=8;ctx.fillRect(1,-18,2.5,2.5);ctx.fillRect(5,-18,2.5,2.5);ctx.shadowBlur=0;ctx.restore();}
function drawGolem(e){const t=e.anim,sw=e.moving?Math.sin(t*6)*3:0,base=e.d.tint||'#8a7a6a',up=e.atkAnim>0?-8:0;shadow(0,0,21,6);ctx.save();ctx.scale(e.face,1);
  ctx.fillStyle=shade(base,-25);ctx.fillRect(-12+sw,-17,9,17);ctx.fillRect(3-sw,-17,9,17);ctx.fillStyle=base;rrect(-16,-49,32,34,6);ctx.fill();
  ctx.fillStyle=shade(base,-15);rrect(-25,-47,10,28,4);ctx.fill();rrect(15,-47+up,11,30,4);ctx.fill();ctx.fillStyle=shade(base,12);rrect(-7,-61,16,13,3);ctx.fill();
  ctx.fillStyle='#ff9a30';ctx.shadowColor='#ff7a20';ctx.shadowBlur=8;ctx.fillRect(2,-57,3,3);ctx.fillRect(6,-57,2,3);ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,140,40,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-6,-44);ctx.lineTo(-1,-36);ctx.lineTo(-5,-28);ctx.moveTo(6,-40);ctx.lineTo(10,-30);ctx.stroke();ctx.restore();}
function drawDragon(e){const t=e.anim,flap=Math.sin(t*3)*.35;shadow(0,0,58,15);ctx.save();ctx.scale(e.face,1);
  ctx.strokeStyle='#8a1d17';ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-36,-26);ctx.quadraticCurveTo(-78,-10+Math.sin(t*2)*8,-92,-38);ctx.stroke();
  const wing=(ox,col,rot)=>{ctx.save();ctx.translate(ox,-52);ctx.rotate(rot);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-34,-70);ctx.lineTo(4,-56);ctx.lineTo(30,-82);ctx.lineTo(48,-50);ctx.lineTo(34,-6);ctx.closePath();ctx.fill();ctx.restore();};
  wing(-14,'#6e1612',-.3-flap);ctx.fillStyle='#8a1d17';ctx.fillRect(-30,-24,13,24);ctx.fillRect(16,-24,13,24);ctx.fillStyle='#b0291f';ctx.beginPath();ctx.ellipse(0,-36,48,25,0,0,7);ctx.fill();ctx.fillStyle='#e0a050';ctx.beginPath();ctx.ellipse(10,-27,30,12,0,0,7);ctx.fill();
  ctx.fillStyle='#6e1612';for(let k=-3;k<=2;k++){ctx.beginPath();ctx.moveTo(k*12-6,-58);ctx.lineTo(k*12,-70);ctx.lineTo(k*12+6,-58);ctx.fill();}
  ctx.strokeStyle='#b0291f';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(30,-46);ctx.quadraticCurveTo(50,-72,64,-74);ctx.stroke();ctx.fillStyle='#b0291f';ctx.beginPath();ctx.ellipse(72,-76,20,12,.15,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(80,-68,14,6,.25+(e.atkAnim>0?.3:0),0,7);ctx.fill();
  ctx.fillStyle='#f0e0c0';ctx.beginPath();ctx.moveTo(62,-86);ctx.lineTo(52,-104);ctx.lineTo(70,-88);ctx.fill();ctx.beginPath();ctx.moveTo(72,-87);ctx.lineTo(70,-106);ctx.lineTo(80,-86);ctx.fill();
  ctx.fillStyle='#ffe040';ctx.shadowColor='#ffcc00';ctx.shadowBlur=12;circle(78,-80,3.5);ctx.shadowBlur=0;
  if(e.atkAnim>0){ctx.fillStyle='rgba(255,140,40,'+Math.min(1,e.atkAnim*1.5)+')';ctx.beginPath();ctx.moveTo(92,-70);ctx.lineTo(130,-84);ctx.lineTo(130,-50);ctx.closePath();ctx.fill();}wing(6,'#8a1d17',.25+flap);ctx.restore();}
function drawEnemy(e){const dp=e.dead?(gameTime-e.diedAt)/.75:-1;if(dp>=1)return;
  const a=e.dead?(dp<.45?1:1-(dp-.45)/.55):1;if(a<=0)return;ctx.save();ctx.globalAlpha=Math.max(0,a);let x=e.x,y=e.y;if(!e.dead&&gameTime-e.hitT<.12)x+=rr(-2,2);
  if(!e.dead){
    if(player.target===e){ctx.strokeStyle='rgba(255,70,60,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,e.r+5,(e.r+5)*.4,0,0,7);ctx.stroke();}
    if(e.slowUntil>gameTime){ctx.fillStyle='rgba(150,220,255,.3)';ctx.beginPath();ctx.ellipse(x,y,e.r+4,(e.r+4)*.4,0,0,7);ctx.fill();}
    if(e.d.aura){ctx.fillStyle=e.d.aura+'30';ctx.beginPath();ctx.ellipse(x,y,e.r+18+Math.sin(gameTime*3)*4,(e.r+18)*.45,0,0,7);ctx.fill();}
  }
  ctx.translate(x,y);const sc=e.d.scale||1;
  if(e.dead){let sx,sy;if(dp<.16){const u=dp/.16;sx=1-.14*u;sy=1+.22*u;}else{const u=(dp-.16)/.84;sx=.86+1.25*u;sy=Math.max(.05,1.22-1.5*u);}ctx.scale(sx,sy);}
  const flash=e.dead&&dp<.12;
  if(e.d.draw==='hero'){drawHero(0,0,heroLook(e));}
  else if(window.naMon&&naMon(e)){}
  else{ctx.scale(sc,sc);switch(e.d.draw){
    case'slime':drawSlime(e);break;case'wolf':drawWolf(e);break;case'imp':drawImp(e);break;case'dragon':drawDragon(e);break;case'spider':drawSpider(e);break;case'wraith':drawWraith(e);break;case'golem':drawGolem(e);break;
    case'goblin':drawHumanoid(0,0,{body:e.d.boss?'#5a3a1e':'#6b4a2b',legs:'#4a3420',skin:'#7fae45',ears:true,eye:'#ff3020',weapon:e.d.boss?'axe':'dagger',hat:e.d.boss?'helm':null,hatCol:'#7a6a50',s:.85,face:e.face,anim:e.anim,moving:e.moving,atk:e.atkAnim>.1?e.atkAnim-.1:0});break;
    case'skeleton':drawHumanoid(0,0,{body:'#d6d2c2',legs:'#cfcab8',skin:'#ece8d8',ribs:true,skull:true,crown:e.d.crown||e.d.boss,weapon:'rsword',face:e.face,anim:e.anim,moving:e.moving,atk:e.atkAnim>.1?e.atkAnim-.1:0});break;}}
  if(flash){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,255,255,'+(1-dp/.12)*.6+')';ctx.beginPath();ctx.ellipse(0,-e.d.h*.45,e.r*1.1,e.r*.9,0,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';}
  ctx.restore();
  if(!e.dead&&e.stunUntil>gameTime){for(let k=0;k<3;k++){const a2=gameTime*4+k*2.1;ctx.fillStyle='#ffe060';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('★',x+Math.cos(a2)*12,e.y-e.d.h-2+Math.sin(a2)*4);}}}
// gecikmeli "hasar izi" (gri) takibi — can düşünce gri bar kalır, sonra iner
function hpGhost(o,frac){if(o._hpg==null)o._hpg=frac;if(frac<(o._hpl==null?frac:o._hpl)-0.001)o._hgh=gameTime+0.35;o._hpl=frac;
  if(frac>o._hpg)o._hpg=frac;else if(o._hpg>frac&&gameTime>=(o._hgh||0)){o._hpg+=(frac-o._hpg)*0.14;if(o._hpg-frac<0.004)o._hpg=frac;}return o._hpg;}

// ---------- yazılar ----------
function label(x,y,text,col,size){const g=TEXT?uctx:ctx;if(TEXT)g.globalAlpha=ctx.globalAlpha;g.font='700 '+(size||11)+'px "Segoe UI",Tahoma,sans-serif';g.textAlign='center';g.lineJoin='round';g.lineWidth=3.5;g.strokeStyle='rgba(20,12,6,.9)';g.strokeText(text,x,y);g.fillStyle=col;g.fillText(text,x,y);if(TEXT)g.globalAlpha=1;}
function hpBar(x,y,w,frac,col,ghost,h){h=h||4;const g=TEXT?uctx:ctx;g.fillStyle='rgba(20,12,6,.9)';g.fillRect(x-w/2-1.5,y-1.5,w+3,h+3);g.fillStyle='#3a2a1a';g.fillRect(x-w/2,y,w,h);
  if(ghost!=null&&ghost>frac+0.002){g.fillStyle='rgba(240,236,228,.85)';g.fillRect(x-w/2,y,w*clamp(ghost,0,1),h);}
  g.fillStyle=col;g.fillRect(x-w/2,y,w*clamp(frac,0,1),h);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(x-w/2,y,w*clamp(frac,0,1),Math.max(1.3,h*.3));}
function conColor(l){const d=l-player.lvl;return d>=3?'#ff4a4a':d>=1?'#ffa040':d>=-2?'#ffe066':d>=-4?'#7bd96a':'#9a9a9a';}
function bubble(x,y,text){const g=TEXT?uctx:ctx;g.font='12px "Segoe UI",Tahoma,sans-serif';const t=text.length>44?text.slice(0,42)+'…':text;const w=g.measureText(t).width+14;g.fillStyle='#f3e6c4';g.strokeStyle='#5c3d1e';g.lineWidth=2;g.beginPath();g.rect(x-w/2,y-20,w,19);g.fill();g.stroke();g.beginPath();g.moveTo(x-5,y-1.5);g.lineTo(x+5,y-1.5);g.lineTo(x,y+4);g.closePath();g.fill();g.fillStyle='#3a2410';g.textAlign='center';g.fillText(t,x,y-6);}

// ---------- zemin önbelleği ----------
// Zemin 8x8 karelik parçalar hâlinde bir kez çizilip saklanır; her karede yalnızca su, lav ve kristal yeniden çizilir.
const CH=8,CHPX=CH*TILE,chunkCache=new Map();let chunkMap=null,chunkRS=0;
function getChunk(cx,cy){const WS=RS*ZOOM;if(chunkMap!==M||chunkRS!==WS){chunkCache.clear();chunkMap=M;chunkRS=WS;}
  const k=cx+','+cy;let c=chunkCache.get(k);if(c){chunkCache.delete(k);chunkCache.set(k,c);return c;}
  c=document.createElement('canvas');c.width=c.height=Math.ceil(CHPX*WS);const g=c.getContext('2d');g.imageSmoothingEnabled=false;const old=ctx,ogt=gameTime;ctx=g;gameTime=0;
  g.setTransform(WS,0,0,WS,-cx*CHPX*WS,-cy*CHPX*WS);
  for(let ty=cy*CH;ty<Math.min(M.H,(cy+1)*CH);ty++)for(let tx=cx*CH;tx<Math.min(M.W,(cx+1)*CH);tx++)drawTile(tx,ty);
  ctx=old;gameTime=ogt;chunkCache.set(k,c);if(chunkCache.size>64)chunkCache.delete(chunkCache.keys().next().value);return c;}
function drawGround(tx0,ty0,tx1,ty1){
  for(let cy=Math.floor(ty0/CH);cy<=Math.floor(ty1/CH);cy++)for(let cx=Math.floor(tx0/CH);cx<=Math.floor(tx1/CH);cx++)ctx.drawImage(getChunk(cx,cy),cx*CHPX,cy*CHPX,CHPX,CHPX);
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const i=ty*M.W+tx,t=M.tiles[i];if(t===T.WATER||t===T.LAVA||M.deco[i]===D.CRYSTAL)drawTile(tx,ty);}}

// ---------- ana çizim ----------
function render(){
  ctx=mainCtx;ctx.imageSmoothingEnabled=false;ctx.setTransform(RS,0,0,RS,0,0);ctx.fillStyle='#0d0b09';ctx.fillRect(0,0,VW,VH);const WS=RS*ZOOM;ctx.setTransform(WS,0,0,WS,0,0);
  uctx.setTransform(1,0,0,1,0,0);uctx.clearRect(0,0,uiCanvas.width,uiCanvas.height);uctx.setTransform(DPR*ZOOM,0,0,DPR*ZOOM,0,0);if(!player||!M)return;const p=player;
  ctx.save();ctx.translate(-camX,-camY);uctx.save();uctx.translate(-camX,-camY);TEXT=true;
  const tx0=Math.max(0,Math.floor(camX/TILE)),ty0=Math.max(0,Math.floor(camY/TILE)),tx1=Math.min(M.W-1,Math.floor((camX+VW/ZOOM)/TILE)),ty1=Math.min(M.H-1,Math.floor((camY+VH/ZOOM)/TILE));
  drawGround(tx0,ty0,tx1,ty1);
  for(const tc of M.torches)drawTorch(tc);
  for(const pt of M.portals)drawPortalGround(pt);
  for(const ef of effects){const k=ef.t/ef.dur;
    if(ef.type==='tele'){const kk=Math.min(1,ef.t/ef.delay);ctx.fillStyle='rgba(255,40,20,'+(.12+kk*.25)+')';ctx.beginPath();ctx.ellipse(ef.x,ef.y,ef.r,ef.r*.5,0,0,7);ctx.fill();ctx.fillStyle='rgba(255,90,30,.35)';ctx.beginPath();ctx.ellipse(ef.x,ef.y,ef.r*kk,ef.r*.5*kk,0,0,7);ctx.fill();ctx.strokeStyle='rgba(255,60,30,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(ef.x,ef.y,ef.r,ef.r*.5,0,0,7);ctx.stroke();}
    else if(ef.type==='ground'&&ef.t<ef.delay){const kk=ef.t/ef.delay;ctx.strokeStyle=ef.vis==='arrows'?'rgba(255,255,255,.7)':'rgba(255,170,60,.8)';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.ellipse(ef.x,ef.y,ef.r,ef.r*.5,0,0,7);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(255,170,60,'+(.1+kk*.15)+')';ctx.beginPath();ctx.ellipse(ef.x,ef.y,ef.r*kk,ef.r*.5*kk,0,0,7);ctx.fill();}
    else if(ef.type==='burnzone'){ctx.fillStyle='rgba(255,100,20,'+(.18+Math.sin(gameTime*10)*.05)+')';ctx.beginPath();ctx.ellipse(ef.x,ef.y,ef.r,ef.r*.5,0,0,7);ctx.fill();}
    else if(ef.type==='click'){ctx.strokeStyle='rgba(120,255,120,'+(1-k)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(ef.x,ef.y,10*(1-k)+3,4*(1-k)+1.5,0,0,7);ctx.stroke();}}
  if(typeof drawExtrasGround==='function')drawExtrasGround();
  for(const l of loots){if(window.kdLoot&&kdLoot(l))continue;const b=Math.sin(gameTime*4+l.bob)*2;
    if(l.kind==='gold'){ctx.fillStyle='#f5c518';circle(l.x,l.y-5+b,5);ctx.fillStyle='#fff3a0';ctx.fillRect(l.x-1.5,l.y-8+b,2,2);}
    else if(l.kind==='potHp'||l.kind==='potMp'){ctx.fillStyle=l.kind==='potHp'?'#e83a3a':'#3a7ae8';circle(l.x,l.y-5+b,5);ctx.fillStyle='#ddd';ctx.fillRect(l.x-2,l.y-13+b,4,4);}
    else if(l.kind==='mat'){ctx.fillStyle=MATS[l.val].col;ctx.fillRect(l.x-6,l.y-12+b,12,9);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(l.x-6,l.y-12+b,2,9);ctx.fillRect(l.x+4,l.y-12+b,2,9);ctx.fillStyle=MATS[l.val].col+'40';ctx.fillRect(l.x-2,l.y-46,4,40);}
    else{const g=l.val.grade,c=GRADES[g].col;if(g>0){ctx.fillStyle=c+(g===2?'55':'40');ctx.fillRect(l.x-3,l.y-64,6,62);}ctx.fillStyle='#8a5a2a';rrect(l.x-7,l.y-14+b,14,12,4);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();}}
  const list=[];
  for(let ty=ty0;ty<=Math.min(M.H-1,ty1+2);ty++)for(let tx=tx0;tx<=tx1;tx++){const d=M.deco[ty*M.W+tx];if(d&&d!==D.FLOWER&&d!==D.CRYSTAL&&d!==D.BONE)list.push({y:ty*TILE+TILE-5,k:0,d,x:tx*TILE+16,v:M.tvar[ty*M.W+tx]});}
  for(const b of M.buildings)list.push({y:(b.y+b.h)*TILE,k:1,b});
  for(const pt of M.portals)list.push({y:pt.y-1,k:6,pt});
  for(const n of npcs)list.push({y:n.y,k:2,e:n});for(const b of bots)if(b.alive)list.push({y:b.y,k:3,e:b});for(const e of enemies)list.push({y:e.y,k:4,e});list.push({y:p.y,k:5,e:p});if(typeof extrasToList==='function')extrasToList(list);
  list.sort((a,b)=>a.y-b.y);
  for(const o of list){
    if(o.k===0)drawDeco(o.d,o.x,o.y,o.v);else if(o.k===1)drawBuilding(o.b);else if(o.k===6)drawPortalArch(o.pt);
    else if(o.k===2)drawHumanoid(o.e.x,o.e.y,Object.assign({},o.e.look,{face:o.e.face,anim:gameTime*.3,moving:false}));
    else if(o.k===7)o.fn();
    else if(o.k===3){const b=o.e;if(b.mount&&!b.target&&typeof drawMount==='function'){drawMount(b.x,b.y,b.mount,b.face,b.anim,b.moving);drawHero(b.x,b.y-((window.kdMT&&kdMT[b.mount]&&kdMT[b.mount].h)||24),Object.assign(heroLook(b),{riding:true,noShadow:true,moving:false}));}else drawHero(b.x,b.y,heroLook(b));}
    else if(o.k===4)drawEnemy(o.e);else drawPlayer(o.e);}
  for(const pr of projectiles){ctx.save();ctx.translate(pr.x,pr.y);if(window.naProj&&naProj(pr)){ctx.restore();continue;}
    if(pr.kind==='arrow'||pr.kind==='bigarrow'||pr.kind==='foeArrow'){const big=pr.kind==='bigarrow';ctx.rotate(Math.atan2(pr.vy,pr.vx));if(big){ctx.shadowColor='#9fe8ff';ctx.shadowBlur=12;}ctx.strokeStyle=big?'#cfefff':'#d8c090';ctx.lineWidth=big?3.5:2;ctx.beginPath();ctx.moveTo(big?-18:-11,0);ctx.lineTo(6,0);ctx.stroke();ctx.fillStyle='#eee';ctx.beginPath();ctx.moveTo(big?13:10,0);ctx.lineTo(4,-3.5);ctx.lineTo(4,3.5);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=pr.kind==='foeArrow'?'#ff3030':'#c04040';ctx.fillRect(big?-19:-12,-2,4,4);}
    else{const C={magic:'#b48cff',fireball:'#ff8a2a',efire:'#ff5a1a',ghost:'#9fe8ff',ice:'#bff0ff',foeMagic:'#ff4060',poison:'#8aff60'};const c=C[pr.kind]||'#fff',rad=pr.kind==='fireball'?8:pr.kind==='magic'?5:6;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=14;circle(0,0,rad);ctx.shadowBlur=0;ctx.fillStyle='#fff';circle(0,0,rad*.45);}
    ctx.restore();}
  for(const q of particles){ctx.globalAlpha=Math.max(0,q.life/q.max);ctx.fillStyle=q.col;ctx.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s);}ctx.globalAlpha=1;
  for(const ef of effects){const k=ef.t/ef.dur;
    if(ef.type==='ring'){const r=ef.r0+(ef.r1-ef.r0)*k;ctx.globalAlpha=1-k;if(ef.fill){ctx.fillStyle=ef.col;ctx.globalAlpha=(1-k)*.25;ctx.beginPath();ctx.ellipse(ef.x,ef.y,r,r*.5,0,0,7);ctx.fill();ctx.globalAlpha=1-k;}ctx.strokeStyle=ef.col;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(ef.x,ef.y,r,r*.5,0,0,7);ctx.stroke();ctx.globalAlpha=1;}
    else if(ef.type==='spin'){ctx.strokeStyle='rgba(230,240,255,'+(1-k)+')';ctx.lineWidth=4;for(let j=0;j<3;j++){const a0=k*12+j*2.09;ctx.beginPath();ctx.ellipse(ef.x,ef.y-14,ef.r,ef.r*.42,0,a0,a0+1.2);ctx.stroke();}}
    else if(ef.type==='slash'){ctx.strokeStyle='rgba(255,255,255,'+(1-k)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ef.x+ef.face*20,ef.y-20,18,-1.3,1.3);ctx.stroke();}
    else if(ef.type==='bolt'){ctx.strokeStyle='rgba(200,230,255,'+(1-k)+')';ctx.lineWidth=3;ctx.shadowColor='#9fd0ff';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(ef.x1,ef.y1);const n=6;for(let i=1;i<n;i++){ctx.lineTo(ef.x1+(ef.x2-ef.x1)*i/n+rr(-8,8),ef.y1+(ef.y2-ef.y1)*i/n+rr(-8,8));}ctx.lineTo(ef.x2,ef.y2);ctx.stroke();ctx.shadowBlur=0;}
    else if(ef.type==='meteor'&&ef.t<ef.dur){const kk=Math.min(1,ef.t/ef.delay);const sx=ef.x+160*(1-kk),sy=ef.y-300*(1-kk)-20;ctx.fillStyle='#ff9a30';ctx.shadowColor='#ff6a10';ctx.shadowBlur=20;circle(sx,sy,14);ctx.shadowBlur=0;}
    else if(ef.type==='arrowrain'&&ef.t<ef.delay){ctx.strokeStyle='rgba(230,220,190,.85)';ctx.lineWidth=1.5;for(let i=0;i<10;i++){const ax=ef.x+Math.sin(i*7.3)*ef.r*.8,ay=ef.y+Math.cos(i*3.1)*ef.r*.35,f=((ef.t*3+i*.13)%1);ctx.beginPath();ctx.moveTo(ax,ay-160*(1-f));ctx.lineTo(ax,ay-160*(1-f)+14);ctx.stroke();}}
    else if(ef.type==='lvl'){ctx.fillStyle='rgba(255,220,120,'+(1-k)*.35+')';ctx.fillRect(ef.x-18,ef.y-140*k-20,36,140*k+20);ctx.strokeStyle='rgba(255,230,150,'+(1-k)+')';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(ef.x,ef.y,30+k*30,12+k*12,0,0,7);ctx.stroke();}}
  // isimler
  for(const pt of M.portals)if(!pt.big)label(pt.x,pt.y-96,'⛩ '+pt.name,pt.col,12);
  for(const n of npcs){label(n.x,n.y-70,n.name,'#ffe9a8',11);const m=npcMarker(n);if(m)label(n.x,n.y-86+Math.sin(gameTime*4)*3,m.t,m.c,m.s||20);}
  for(const b of bots){if(!b.alive)continue;label(b.x,b.y-65,b.name+' ['+b.lvl+']',b.party?'#7dff9a':'#8fc4ff',11);if(b.mortal&&b.hp<b.maxHp){const fr=b.hp/b.maxHp;hpBar(b.x,b.y-62,20,fr,'#40c060',hpGhost(b,fr),5);}if(b.say&&b.say.until>gameTime)bubble(b.x,b.y-80,b.say.text);}
  for(const e of enemies){if(e.dead)continue;if(e.d.pvp){const fr=e.hp/e.maxHp;label(e.x,e.y-70,'⚔ '+e.name+' ['+e.lvl+' '+CLASSES[e.cls].name+']','#ff6060',11);hpBar(e.x+(gameTime-e.hitT<.28?Math.round(Math.sin(gameTime*95)*2.5):0),e.y-66,22,fr,'#e04040',hpGhost(e,fr),6);continue;}
    const show=e===p.target||e===hoverEnt||e.hp<e.maxHp||e.d.boss||e.cursed;if(!show)continue;const mh=window.naMonH?naMonH(e):0,hy=mh?e.y-mh-10:e.y-e.d.h-12,fr=e.hp/e.maxHp,shx=gameTime-e.hitT<.28?Math.round(Math.sin(gameTime*95)*2.5):0;hpBar(e.x+shx,hy,e.d.boss?60:20,fr,'#e04040',hpGhost(e,fr),e.d.boss?8:6);label(e.x,hy-5,'Sv '+e.lvl+' '+e.d.name,conColor(e.lvl),e.d.boss?13:11);}
  if(!p.dead){label(p.x,p.y-(p.riding?84:65),(p.title?'<'+p.title+'> ':'')+p.name,'#ffffff',12);if(p.say&&p.say.until>gameTime)bubble(p.x,p.y-(p.riding?100:81),p.say.text);}
  if(typeof drawExtrasTop==='function')drawExtrasTop();
  for(const f of floaters){const k=f.t/f.dur;ctx.globalAlpha=k<.7?1:1-(k-.7)/.3;label(f.x,f.y,f.text,f.col,f.size);}ctx.globalAlpha=1;
  ctx.restore();uctx.restore();ctx.setTransform(RS,0,0,RS,0,0);
  // ışık
  if(typeof drawAtmos==='function')drawAtmos();
  if(typeof drawLighting==='function')drawLighting();
  else if(M.dark){lctx.globalCompositeOperation='source-over';lctx.clearRect(0,0,VW,VH);lctx.fillStyle='rgba(0,0,0,.9)';lctx.fillRect(0,0,VW,VH);lctx.globalCompositeOperation='destination-out';
    const punch=(x,y,r)=>{x-=camX;y-=camY;if(x<-r||y<-r||x>VW+r||y>VH+r)return;const g=lctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.55,'rgba(0,0,0,.75)');g.addColorStop(1,'rgba(0,0,0,0)');lctx.fillStyle=g;lctx.fillRect(x-r,y-r,r*2,r*2);};
    punch(p.x,p.y-20,250);for(const tc of M.torches)punch(tc.x,tc.y,140+Math.sin(gameTime*9+tc.x)*8);for(const pr of projectiles)punch(pr.x,pr.y,70);for(const pt of M.portals)punch(pt.x,pt.y-30,140);for(const ef of effects)if(ef.type==='burnzone'||ef.type==='ring')punch(ef.x,ef.y,110);
    ctx.drawImage(lightC,0,0,VW,VH);}
  if(M.id==='sinir'){ctx.fillStyle='rgba(120,20,0,.1)';ctx.fillRect(0,0,VW,VH);}else if(p.zone==='ruins'){ctx.fillStyle='rgba(40,10,60,.16)';ctx.fillRect(0,0,VW,VH);}else if(p.zone==='volcano'){ctx.fillStyle='rgba(120,30,0,.12)';ctx.fillRect(0,0,VW,VH);}
  const g=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.45,VW/2,VH/2,Math.max(VW,VH)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.4)');ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  if(p.hp<p.stats.maxHp*.25&&!p.dead){ctx.fillStyle='rgba(255,0,0,'+(.08+Math.sin(gameTime*6)*.05)+')';ctx.fillRect(0,0,VW,VH);}
  drawQuestArrow();TEXT=false;}
function drawPlayer(p){if(p.dead)return;const st=p.stealthUntil>gameTime;
  ctx.strokeStyle='rgba(243,201,105,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,14,5.5,0,0,7);ctx.stroke();
  if(p.shield>0){ctx.strokeStyle='rgba(160,200,255,'+(.5+Math.sin(gameTime*5)*.2)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-22,20,30,0,0,7);ctx.stroke();}
  for(const id in p.buffs){const b=p.buffs[id];if(b.until>gameTime&&b.col){ctx.fillStyle=b.col+'2a';ctx.beginPath();ctx.ellipse(p.x,p.y-22,19,29,0,0,7);ctx.fill();break;}}
  if(p.moving&&p.stats.spd>CLASSES[p.cls].spd*1.3)particles.push({x:p.x+rr(-6,6),y:p.y-rr(0,10),vx:-p.face*40,vy:-10,life:.3,max:.3,col:'#d8fff0',s:2});
  const o=heroLook(p);o.alpha=st?.35:1;o.running=p.moving&&p.stats&&p.stats.spd>CLASSES[p.cls].spd*1.12;o.cast=castPose(p);drawHero(p.x,p.y,o);}
function drawQuestArrow(){const q=questTarget();if(!q||player.dead)return;TEXT=false;const sx=(q.x-camX)*ZOOM,sy=(q.y-camY)*ZOOM;const onScreen=sx>40&&sy>60&&sx<VW-40&&sy<VH-60;
  if(onScreen){const b=Math.sin(gameTime*4)*4;ctx.fillStyle='#ffd23a';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,sy-34+b);ctx.lineTo(sx-8,sy-48+b);ctx.lineTo(sx+8,sy-48+b);ctx.closePath();ctx.fill();ctx.stroke();return;}
  const px=(player.x-camX)*ZOOM,py=(player.y-camY)*ZOOM-20,a=Math.atan2(sy-py,sx-px),R=Math.min(VW,VH)/2-70;const ax=VW/2+Math.cos(a)*R,ay=VH/2+Math.sin(a)*R;
  ctx.save();ctx.translate(ax,ay);ctx.rotate(a);ctx.fillStyle='#ffd23a';ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-8,-11);ctx.lineTo(-3,0);ctx.lineTo(-8,11);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  label(ax,ay+26,q.label+' • '+Math.round(Math.hypot(q.x-player.x,q.y-player.y)/TILE)+'m','#ffd23a',11);}

// ---------- mini harita ----------
const mctx=$('minimap').getContext('2d');
function drawMiniOn(g,W,full){const m=M,s=W/(m.W*TILE);g.imageSmoothingEnabled=false;g.fillStyle='#000';g.fillRect(0,0,W,W);g.drawImage(m.mini,0,0,W,W);
  if(!full){g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1;g.strokeRect(camX*s,camY*s,VW*s,VH*s);}
  for(const e of enemies){if(e.dead)continue;if(e.d.boss){g.fillStyle='#ff2020';g.beginPath();g.arc(e.x*s,e.y*s,full?6:3.5,0,7);g.fill();if(full){g.font='bold 11px Segoe UI';g.textAlign='center';g.fillStyle='#ffb0b0';g.fillText('💀 '+e.d.name,e.x*s,e.y*s-9);}}else{g.fillStyle=e.d.pvp?'#ff60a0':'#ff4040';const z=e.d.pvp?3:full?2.5:1.5;g.fillRect(e.x*s-z/2,e.y*s-z/2,z,z);}}
  for(const b of bots){if(!b.alive)continue;g.fillStyle=b.party?'#60ff90':'#6fb4ff';g.fillRect(b.x*s-1.5,b.y*s-1.5,3,3);}
  g.fillStyle='#ffd23a';for(const n of npcs)g.fillRect(n.x*s-2,n.y*s-2,4,4);
  for(const pt of M.portals){g.fillStyle=pt.col;g.beginPath();g.arc(pt.x*s,pt.y*s,full?6:3,0,7);g.fill();if(full){g.font='bold 11px Segoe UI';g.textAlign='center';g.fillStyle=pt.col;g.fillText('⛩ '+pt.name,pt.x*s,pt.y*s+18);}}
  if(full)for(const l of m.labels){g.font='bold 13px Georgia';g.textAlign='center';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.8)';g.strokeText(l.t,l.x*TILE*s,l.y*TILE*s);g.fillStyle='#f3e0b0';g.fillText(l.t,l.x*TILE*s,l.y*TILE*s);}
  if(typeof drawMiniExtras==='function')drawMiniExtras(g,s,full);
  const q=questTarget();if(q){g.fillStyle='#ffd23a';g.font=(full?'18':'12')+'px sans-serif';g.textAlign='center';g.fillText('★',q.x*s,q.y*s+5);}
  g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=1;g.beginPath();g.arc(player.x*s,player.y*s,full?5:3.5,0,7);g.fill();g.stroke();}
