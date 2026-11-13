'use strict';
// ================= HARİTALAR =================
const T={GRASS:0,FOREST:1,PATH:2,WATER:3,SAND:4,RUIN:5,DARK:6,VOLC:7,LAVA:8,PLAZA:9,DFLOOR:10,DWALL:11,RDIRT:12,SCORCH:13,CAMP:14};
const D={NONE:0,TREE:1,PINE:2,ROCK:3,FLOWER:4,TOMB:5,DEAD:6,BUSH:7,CRYSTAL:8,BONE:9,PALI:10,RWALL:11,PILLAR:12,WALL:13,TOWER:14,LAMP:15};
const SOLID_T=[0,0,0,1,0,0,0,0,1,0,0,1,0,0,0];
const SOLID_D=[0,1,1,1,0,1,1,0,0,0,1,1,1,1,1,1];
const TCOL=[['#9ca24a','#a2a044','#949a43','#a7a650'],['#71834b','#6c7d46','#77894f','#687a42'],['#b39a6b','#ad9466','#b8a072','#a88f62'],['#2d6aa8','#2b67a3','#2f6dab','#2a65a0'],['#d6c38a','#d1bd83','#dac78f','#cfb97f'],['#6c6a72','#67656d','#716f77','#626068'],['#3e3a44','#3a3640','#423e48','#36323c'],['#4a2a22','#46281f','#4f2d24','#42251d'],['#e2531d','#de4f1a','#e65820','#d94c18'],['#a59a88','#a09583','#aa9f8d','#9b907e'],['#3d3935','#393531','#413d38','#36322e'],['#1e1b19','#1e1b19','#1e1b19','#1e1b19'],['#6e4a36','#6a4733','#734e39','#664430'],['#4a3328','#463026','#4e362b','#432e24'],['#8a6a48','#856545','#8f6f4c','#806041']];
const MINI_COL=['#4f8f3f','#2f5e2a','#b39a6b','#2d6aa8','#d6c38a','#6c6a72','#3e3a44','#4a2a22','#e2531d','#a59a88','#4a4540','#141210','#7a5240','#4e3428','#9a7a52'];
let M=null;const MAPS={};

function newMap(id,name,W,H){return{id,name,W,H,tiles:new Uint8Array(W*H),deco:new Uint8Array(W*H),tvar:new Uint8Array(W*H),bsolid:new Uint8Array(W*H),buildings:[],portals:[],npcDefs:[],spawns:[],torches:[],labels:[],zones:{},zoneOf:null,start:null,safe:[],foeSafe:null,pvp:false,dark:false,minLvl:1,mini:null};}
function makeNoise(rng){const g=new Float32Array(65536);for(let i=0;i<g.length;i++)g[i]=rng();const at=(x,y)=>g[((y&255)<<8)|(x&255)];const sm=t=>t*t*(3-2*t);return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),u=sm(x-xi),v=sm(y-yi);const a=at(xi,yi),b=at(xi+1,yi),c=at(xi,yi+1),d=at(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};}
const fbm=(n,x,y)=>n(x,y)*.6+n(x*2.03,y*2.03)*.3+n(x*4.1,y*4.1)*.1;
function carve(m,n1,x0,y0,x1,y1,tileFn,half){half=half||1;const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)));for(let s=0;s<=n;s++){const k=s/n;let x=x0+(x1-x0)*k,y=y0+(y1-y0)*k;const wig=n1?(n1(s/7,(x1+y1)*.37)-.5)*7*Math.sin(Math.PI*k):0;if(Math.abs(x1-x0)>Math.abs(y1-y0))y+=wig;else x+=wig;
  for(let oy=-half;oy<=half;oy++)for(let ox=-half;ox<=half;ox++){const tx=Math.round(x)+ox,ty=Math.round(y)+oy;if(tx<2||ty<2||tx>=m.W-2||ty>=m.H-2)continue;const j=ty*m.W+tx;m.tiles[j]=tileFn(tx,ty);m.deco[j]=D.NONE;}}}
function clearCircle(m,cx,cy,r,tile){for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){if(x<2||y<2||x>=m.W-2||y>=m.H-2)continue;if(Math.hypot(x-cx,y-cy)<=r){const i=y*m.W+x;if(tile!=null)m.tiles[i]=tile;else if(SOLID_T[m.tiles[i]])m.tiles[i]=T.GRASS;m.deco[i]=D.NONE;}}}
function addBuilding(m,b){m.buildings.push(b);for(let yy=b.y;yy<b.y+b.h;yy++)for(let xx=b.x;xx<b.x+b.w;xx++){const i=yy*m.W+xx;m.bsolid[i]=1;m.deco[i]=D.NONE;}}

// ---------- 1) Yeşilvadi (çiftçilik haritası) ----------
function genYesilvadi(){
  const m=newMap('yesilvadi','Yeşilvadi Diyarı',128,128);const W=128,H=128;
  const zoneOf=(x,y)=>{const d=Math.hypot(x-64,y-64);if(Math.abs(x-64)<=18.5&&Math.abs(y-64)<=15.5)return'village';if(y<28)return'volcano';if(x>98)return'ruins';if(d<34)return'meadow';return x<64?'forestW':'forestE';};
  m.zoneOf=zoneOf;
  m.zones={village:{name:'Yeşilvadi Kalesi',lv:'Güvenli bölge'},meadow:{name:'Çiçekli Çayır',lv:'Seviye 1-3'},forestW:{name:'Uluyan Orman',lv:'Seviye 3-7'},forestE:{name:'Goblin Korusu',lv:'Seviye 5-9'},ruins:{name:'Lanetli Harabeler',lv:'Seviye 8-13'},volcano:{name:'Ejder Tepesi',lv:'Seviye 14-18'}};
  const wr=mulberry32(20261106);const n1=makeNoise(wr),n2=makeNoise(wr),n3=makeNoise(wr);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,z=zoneOf(x,y);let t=T.GRASS,d=D.NONE;const a=fbm(n1,x/9,y/9),b=fbm(n2,x/5,y/5),w=fbm(n3,x/13,y/13),r=wr();m.tvar[i]=Math.floor(wr()*4);
    if(z==='volcano'){t=T.VOLC;if(a>.62&&Math.hypot(x-64,y-12)>10)t=T.LAVA;else if(r<.05)d=D.ROCK;else if(r<.08)d=D.CRYSTAL;}
    else if(z==='ruins'){t=b>.5?T.RUIN:T.DARK;if(r<.04)d=D.TOMB;else if(r<.065)d=D.DEAD;else if(r<.08)d=D.ROCK;else if(r<.09)d=D.RWALL;}
    else if(z==='forestW'||z==='forestE'){t=T.FOREST;if(w>.66)t=T.WATER;else if(b>.72)d=z==='forestW'?D.PINE:D.TREE;else if(r<.045)d=D.BUSH;else if(r<.08)d=D.FLOWER;}
    else if(z==='meadow'){if(w>.68)t=T.WATER;else if(r<.012)d=D.TREE;else if(r<.1)d=D.FLOWER;else if(r<.11)d=D.ROCK;else if(r<.13)d=D.BUSH;}
    else if(r<.06)d=D.FLOWER;
    if(x<2||y<2||x>=W-2||y>=H-2){t=T.WATER;d=D.NONE;}m.tiles[i]=t;m.deco[i]=d;}
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(m.tiles[i]!==T.GRASS&&m.tiles[i]!==T.FOREST)continue;if(m.tiles[i-1]===T.WATER||m.tiles[i+1]===T.WATER||m.tiles[i-W]===T.WATER||m.tiles[i+W]===T.WATER){m.tiles[i]=T.SAND;if(m.deco[i]===D.PINE||m.deco[i]===D.TREE)m.deco[i]=D.NONE;}}
  const roadT=(tx,ty)=>{const z=zoneOf(tx,ty);return z==='volcano'?T.VOLC:z==='ruins'?T.RUIN:T.PATH;};
  carve(m,n1,64,48,64,14,roadT);carve(m,n1,83,64,119,64,roadT);carve(m,n1,45,64,14,64,roadT);carve(m,n1,64,80,64,114,roadT);
  carve(m,null,22,64,22,44,roadT);carve(m,null,64,104,90,104,roadT);carve(m,null,112,64,112,40,roadT);
  for(let y=2;y<24;y++)for(let x=50;x<79;x++)if(Math.hypot(x-64,y-12)<9.5){const i=y*W+x;m.tiles[i]=T.VOLC;m.deco[i]=D.NONE;}
  clearCircle(m,22,43,4.5,T.FOREST);clearCircle(m,90,104,4.5,T.FOREST);clearCircle(m,112,40,5,T.RUIN);clearCircle(m,117,64,2.5,T.RUIN);
  // ---- Yeşilvadi Kalesi: surlu büyük şehir ----
  // Dikdörtgen köy: sınır ağaç + çit + kaya; dört yönde kapı (yol ağzı)
  const VX=18,VY=15;
  for(let y=64-VY;y<=64+VY;y++)for(let x=64-VX;x<=64+VX;x++){const dx=x-64,dy=y-64,i=y*W+x;
    m.deco[i]=D.NONE;m.tiles[i]=T.GRASS;const road=Math.abs(dx)<=2||Math.abs(dy)<=2;
    if((Math.abs(dx)<=9&&Math.abs(dy)<=8)||(road&&Math.abs(dx)<VX-1&&Math.abs(dy)<VY-1))m.tiles[i]=T.PLAZA;
    const edge=Math.abs(dx)===VX||Math.abs(dy)===VY;
    if(edge){const gate=(Math.abs(dx)<=2&&Math.abs(dy)===VY)||(Math.abs(dy)<=2&&Math.abs(dx)===VX);
      if(gate)m.tiles[i]=T.PLAZA;
      else{const corner=Math.abs(dx)===VX&&Math.abs(dy)===VY,post=(Math.abs(dx)===3&&Math.abs(dy)===VY)||(Math.abs(dy)===3&&Math.abs(dx)===VX),k=(Math.abs(dx)+Math.abs(dy))%4;
        m.deco[i]=corner?D.TREE:post?D.ROCK:k===0?D.TREE:k===2?D.ROCK:D.PALI;
        if(m.deco[i]===D.ROCK&&!post&&wr()<.5)m.deco[i]=D.PALI;}}
    else if(m.tiles[i]===T.GRASS){const inner=Math.abs(dx)===VX-1||Math.abs(dy)===VY-1;if(inner&&wr()<.35)m.deco[i]=D.BUSH;else if(wr()<.05)m.deco[i]=D.FLOWER;}}
  // Tek büyük ev tam ortada — köyün merkezi. Başka bina yok.
  addBuilding(m,{x:58,y:58,w:12,h:11,type:'house',roof:'#8b2f24',name:'Köy Konağı',floors:2});
  // evin etrafında simetrik lamba halkası
  for(const [lx,ly] of [[54,54],[74,54],[54,74],[74,74],[61,51],[67,51],[61,77],[67,77]]){const i=ly*W+lx;if(!m.bsolid[i]&&!m.deco[i])m.deco[i]=D.LAMP;}
  // NPC'ler: sadece rol adı, evin etrafına simetrik dağıtılır
  const villagers=[
    {id:'muhtar',name:'Muhtar',look:{body:'#6a3d8a',trim:'#d9b45a',legs:'#3a2a3a',skin:'#e8c09a',hair:'#bbbbbb',beard:'#e0e0e0',weapon:'none'}},
    {id:'tuccar',name:'Tüccar',look:{body:'#b5651d',trim:'#f0d080',legs:'#5a3a1e',skin:'#f0c9a0',hair:'#5a3214',longhair:true,weapon:'none'}},
    {id:'demirci',name:'Demirci',look:{body:'#4a3a30',trim:'#2a1a10',legs:'#2a2420',skin:'#d8a880',hair:'#2a1a10',beard:'#2a1a10',weapon:'hammer'}},
    {id:'bilge',name:'Bilge',look:{body:'#2e4f6e',trim:'#c0d0e0',legs:'#1e2f40',skin:'#e8c09a',hat:'wizard',hatCol:'#1e3550',beard:'#f0f0f0',weapon:'staff',orb:'#bfffd0'}},
    {id:'muhafiz',name:'Muhafız',look:{body:'#5a5a64',trim:'#9b3b2b',legs:'#2a2a30',skin:'#e8c09a',hat:'helm',hatCol:'#8a9098',weapon:'sword'}},
    {id:'seyis',name:'Seyis',look:{body:'#6a5030',trim:'#3a2a1a',legs:'#3a3020',skin:'#d8a880',hair:'#4a3018',beard:'#4a3018',weapon:'none'}},
    {id:'zanaat',name:'Zanaatkâr',look:{body:'#4a6a5a',trim:'#c0a060',legs:'#2a3a30',skin:'#f0c9a0',hair:'#8a3a1a',longhair:true,weapon:'hammer'}},
    {id:'lonca',name:'Lonca',look:{body:'#5a3a6a',trim:'#ffd040',legs:'#2a1a30',skin:'#e8c09a',hair:'#1a1a1a',beard:'#1a1a1a',weapon:'none'}},
    {id:'muhafiz',name:'Muhafız',look:{body:'#5a5a64',trim:'#2f6a3a',legs:'#2a2a30',skin:'#f0c9a0',hat:'helm',hatCol:'#8a9098',weapon:'sword',longhair:true,hair:'#6b3e1e'}},
  ];
  const RNG=13.5;m.npcDefs=villagers.map((v,i)=>{const an=-Math.PI/2+i*2*Math.PI/villagers.length,x=64+Math.cos(an)*RNG,y=64+Math.sin(an)*11.2;return Object.assign({},v,{x:Math.round(x*10)/10,y:Math.round(y*10)/10,face:x<63.8?1:-1});});
  m.portals=[{x:73*TILE,y:77*TILE,to:'sinir',name:'Kızıl Sınır',minLvl:10,col:'#ff5040',desc:'Gölge Hanedanı ile sürekli savaşılan PvP bölgesi. Canavarlar daha güçlü, ganimet daha değerli.'},
             {x:117.5*TILE,y:64.5*TILE,to:'mahzen',name:'Unutulmuş Mahzen',minLvl:9,col:'#a070ff',desc:'Karanlık bir zindan. Sonunda Lanetli Kral Varkas bekliyor.'}];
  m.spawns=[];
  const W2=(type,zone,count,l0,l1,pack)=>{for(let n=0;n<count;n++){const s=findSpotIn(m,zone,(tx,ty)=>(Math.abs(tx-64)>21||Math.abs(ty-64)>18)&&Math.hypot(tx-64,ty-12)>11);if(!s)continue;let lvl;if(zone==='meadow'){const d=Math.hypot(s.tx-64,s.ty-64);lvl=clamp(Math.round(l0+(d-21)/12*(l1-l0)),l0,l1);}else lvl=ri(l0,l1);for(let k=0;k<(pack||1);k++)m.spawns.push({type,lvl,x:s.x+k*22-((pack||1)-1)*11,y:s.y+(k%2)*14});}};
  W2('slime','meadow',22,1,3);W2('wolf','forestW',14,3,7,2);W2('goblin','forestE',14,5,9,2);W2('skeleton','ruins',22,8,13);W2('imp','volcano',18,14,17);
  m.spawns.push({type:'wolfking',lvl:7,x:22.5*TILE,y:43*TILE},{type:'goblinchief',lvl:10,x:90.5*TILE,y:104*TILE},{type:'skeletonlord',lvl:13,x:112.5*TILE,y:40*TILE},{type:'dragon',lvl:18,x:64.5*TILE,y:10*TILE});
  m.start={x:64.5*TILE,y:69.5*TILE};m.safe=[{x:64.5*TILE,y:64.5*TILE,w:18.6*TILE,h:15.6*TILE}];
  m.labels=[{x:64,y:58.5,t:'Yeşilvadi Kalesi'},{x:86,y:86,t:'Çiçekli Çayır'},{x:30,y:72,t:'Uluyan Orman'},{x:86,y:94,t:'Goblin Korusu'},{x:112,y:76,t:'Lanetli Harabeler'},{x:64,y:22,t:'Ejder Tepesi'}];
  return m;}

// ---------- 2) Unutulmuş Mahzen (zindan) ----------
function genMahzen(){
  const m=newMap('mahzen','Unutulmuş Mahzen',64,64);const W=64,wr=mulberry32(777),wi=(a,b)=>a+Math.floor(wr()*(b-a+1));
  m.tiles.fill(T.DWALL);for(let i=0;i<W*W;i++)m.tvar[i]=Math.floor(wr()*4);
  const rooms=[];for(let cy=0;cy<4;cy++){const row=[];for(let cx=0;cx<4;cx++){const last=cx===3&&cy===3;const w=last?13:wi(8,11),h=last?13:wi(8,11);const x0=cx*16+Math.floor((16-w)/2),y0=cy*16+Math.floor((16-h)/2);row.push({x0,y0,w,h,cx:x0+Math.floor(w/2),cy:y0+Math.floor(h/2)});}if(cy%2)row.reverse();rooms.push(...row);}
  const fl=(x,y)=>{if(x<1||y<1||x>=W-1||y>=W-1)return;m.tiles[y*W+x]=T.DFLOOR;};
  for(const r of rooms)for(let y=r.y0;y<r.y0+r.h;y++)for(let x=r.x0;x<r.x0+r.w;x++)fl(x,y);
  for(let i=1;i<rooms.length;i++){const a=rooms[i-1],b=rooms[i];for(let x=Math.min(a.cx,b.cx);x<=Math.max(a.cx,b.cx);x++)for(let o=-1;o<=1;o++)fl(x,a.cy+o);for(let y=Math.min(a.cy,b.cy);y<=Math.max(a.cy,b.cy);y++)for(let o=-1;o<=1;o++)fl(b.cx+o,y);}
  for(let i=0;i<W*W;i++)if(m.tiles[i]===T.DFLOOR&&wr()<.035)m.deco[i]=D.BONE;
  for(const r of rooms){if(r.w>=10){for(const [px,py] of [[r.x0+2,r.y0+2],[r.x0+r.w-3,r.y0+2],[r.x0+2,r.y0+r.h-3],[r.x0+r.w-3,r.y0+r.h-3]])m.deco[py*W+px]=D.PILLAR;}
    for(const tx of [r.x0+1,r.x0+r.w-2]){const ty=r.y0-1;if(ty>0&&m.tiles[ty*W+tx]===T.DWALL)m.torches.push({x:tx*TILE+16,y:ty*TILE+26});}}
  const st=rooms[0],bs=rooms[rooms.length-1];
  m.start={x:st.cx*TILE+16,y:(st.cy+2)*TILE+16};
  m.portals=[{x:st.cx*TILE+16,y:(st.cy-2)*TILE+16,to:'yesilvadi',tx:115*TILE,ty:64.5*TILE,name:'Yüzeye Çık',minLvl:1,col:'#7dffb0',desc:'Yeşilvadi Diyarı\'na geri dön.'}];
  m.zoneOf=()=> 'mahzen';m.zones={mahzen:{name:'Unutulmuş Mahzen',lv:'Seviye 12-16 • Zindan'}};
  for(let i=1;i<rooms.length-1;i++){const r=rooms[i];const n=i<5?3:4;for(let k=0;k<n;k++){const x=wi(r.x0+1,r.x0+r.w-2),y=wi(r.y0+1,r.y0+r.h-2);if(m.deco[y*W+x])continue;m.spawns.push({type:pick(i<5?['spider','skeleton']:['spider','skeleton','wraith']),lvl:clamp(11+Math.floor(i/4)+wi(0,1),11,15),x:x*TILE+16,y:y*TILE+16,resp:45});}}
  m.spawns.push({type:'varkas',lvl:16,x:bs.cx*TILE+16,y:bs.cy*TILE+16});
  m.labels=[{x:bs.cx,y:bs.cy-7,t:'Varkas\'ın Tahtı'},{x:st.cx,y:st.cy+5,t:'Giriş'}];
  m.dark=true;m.minLvl=9;return m;}

// ---------- 3) Kızıl Sınır (PvP bölgesi) ----------
function genSinir(){
  const m=newMap('sinir','Kızıl Sınır',112,112);const W=112,H=112,wr=mulberry32(4242);const n1=makeNoise(wr),n2=makeNoise(wr);
  const PC={x:56,y:97},EC={x:56,y:14},CC={x:56,y:56};
  const zoneOf=(x,y)=>Math.hypot(x-PC.x,y-PC.y)<11?'camp':Math.hypot(x-EC.x,y-EC.y)<11?'enemycamp':Math.hypot(x-CC.x,y-CC.y)<12?'center':'mid';
  m.zoneOf=zoneOf;m.zones={camp:{name:'Şafak Kampı',lv:'Güvenli bölge'},enemycamp:{name:'Gölge Kampı',lv:'Düşman üssü!'},center:{name:'Titan Arenası',lv:'Boss bölgesi'},mid:{name:'Kızıl Ova',lv:'PvP • Seviye 13-22'}};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const a=fbm(n1,x/10,y/10),b=fbm(n2,x/6,y/6),r=wr();m.tvar[i]=Math.floor(wr()*4);let t=a>.55?T.SCORCH:T.RDIRT,d=D.NONE;
    if(a>.7&&zoneOf(x,y)==='mid')t=T.LAVA;else if(r<.022)d=D.ROCK;else if(r<.036)d=D.DEAD;else if(r<.046)d=D.RWALL;else if(b>.72&&r<.2)d=D.BONE;
    if(x<2||y<2||x>=W-2||y>=H-2){t=T.LAVA;d=D.NONE;}m.tiles[i]=t;m.deco[i]=d;}
  const rt=()=>T.RDIRT;carve(m,n1,56,90,56,62,rt,1);carve(m,n1,56,50,56,21,rt,1);carve(m,n1,40,56,72,56,rt,1);
  const camp=(c,openUp,roof)=>{clearCircle(m,c.x,c.y,10,T.CAMP);for(let a=0;a<Math.PI*2;a+=.045){const x=Math.round(c.x+Math.cos(a)*9.5),y=Math.round(c.y+Math.sin(a)*9.5);const dy=y-c.y;if(Math.abs(x-c.x)<=2&&(openUp?dy<0:dy>0))continue;m.deco[y*W+x]=D.PALI;}
    for(const t of [[c.x-6,c.y-2],[c.x+3,c.y-2],[c.x-2,c.y+3]])addBuilding(m,{x:t[0],y:t[1],w:3,h:2,roof,name:'',tent:true});};
  camp(PC,true,'#3a6a9a');camp(EC,false,'#6a1a1a');
  clearCircle(m,CC.x,CC.y,7,T.SCORCH);for(let k=0;k<8;k++){const a=k*Math.PI/4;m.deco[Math.round(CC.y+Math.sin(a)*8.5)*W+Math.round(CC.x+Math.cos(a)*8.5)]=D.PILLAR;}
  m.npcDefs=[
    {id:'komutan',name:'Komutan',x:53,y:93.6,face:1,look:{body:'#3a5a8a',trim:'#e0c060',legs:'#2a2a30',skin:'#d8a880',hat:'helm',hatCol:'#c0c8d0',weapon:'sword',beard:'#5a3a20'}},
    {id:'sifaci',name:'Şifacı',x:59.5,y:93.6,face:-1,look:{body:'#e8e0d0',trim:'#3a8a5a',legs:'#8a8070',skin:'#f0c9a0',hair:'#3a2010',longhair:true,weapon:'staff',orb:'#9fffb0'}},
  ];
  m.portals=[{x:56.5*TILE,y:103.5*TILE,to:'yesilvadi',tx:71*TILE,ty:75*TILE,name:'Yeşilvadi\'ye Dön',minLvl:1,col:'#7dffb0',desc:'Güvenli köye geri dön.'}];
  m.start={x:56.5*TILE,y:99*TILE};m.safe=[{x:PC.x*TILE,y:PC.y*TILE,r:11*TILE}];m.foeSafe={x:EC.x*TILE,y:EC.y*TILE,r:11*TILE};
  m.spawns=[];const mid=(tx,ty)=>zoneOf(tx,ty)==='mid'&&Math.abs(ty-56)<34;
  for(let n=0;n<16;n++){const s=findSpotIn(m,'mid',mid);if(s)m.spawns.push({type:'golem',lvl:ri(14,18),x:s.x,y:s.y});}
  for(let n=0;n<9;n++){const s=findSpotIn(m,'mid',mid);if(s)for(let k=0;k<2;k++)m.spawns.push({type:'bloodwolf',lvl:ri(13,17),x:s.x+k*24,y:s.y+k*10});}
  m.spawns.push({type:'titan',lvl:22,x:CC.x*TILE+16,y:CC.y*TILE+16});
  for(let n=0;n<10;n++)m.spawns.push({type:'foe',lvl:ri(12,21),x:(EC.x+rr(-5,5))*TILE,y:(EC.y+rr(-4,4))*TILE,resp:16});
  m.labels=[{x:PC.x,y:PC.y+8,t:'Şafak Kampı'},{x:EC.x,y:EC.y-8,t:'Gölge Kampı'},{x:CC.x,y:CC.y-9,t:'Titan Arenası'},{x:30,y:40,t:'Kızıl Ova'}];
  m.pvp=true;m.minLvl=10;return m;}

const GEN={yesilvadi:genYesilvadi,mahzen:genMahzen,sinir:genSinir};
function getMap(id){if(!MAPS[id]){MAPS[id]=GEN[id]();buildMini(MAPS[id]);}return MAPS[id];}

// ================= ÇARPIŞMA / HAREKET =================
function solidTileM(m,tx,ty){if(tx<0||ty<0||tx>=m.W||ty>=m.H)return true;const i=ty*m.W+tx;return !!(SOLID_T[m.tiles[i]]||SOLID_D[m.deco[i]]||m.bsolid[i]);}
function solidTile(tx,ty){return solidTileM(M,tx,ty);}
function solidAt(px,py){return solidTile(Math.floor(px/TILE),Math.floor(py/TILE));}
function blocked(x,y,r){return solidAt(x-r,y)||solidAt(x+r,y)||solidAt(x,y-r*.6)||solidAt(x,y+r*.4);}
function moveEnt(e,dx,dy){const r=e.cr||8;let mv=false;if(!blocked(e.x+dx,e.y,r)){e.x+=dx;mv=true;}if(!blocked(e.x,e.y+dy,r)){e.y+=dy;mv=true;}if(mv)e.moving=true;
  if(Math.abs(dx)>=Math.abs(dy)){if(dx>.01){e.face=1;e.dir='side';}else if(dx<-.01){e.face=-1;e.dir='side';}}
  else{if(dy>.01)e.dir='front';else if(dy<-.01)e.dir='back';}
  return mv;}
function moveToward(e,tx,ty,spd,dt){const dx=tx-e.x,dy=ty-e.y,l=Math.hypot(dx,dy);if(l<1)return false;const s=Math.min(l,spd*dt);return moveEnt(e,dx/l*s,dy/l*s);}
function findSpotIn(m,zone,test){for(let k=0;k<1200;k++){const tx=ri(3,m.W-4),ty=ri(3,m.H-4);if(zone&&m.zoneOf(tx,ty)!==zone)continue;if(solidTileM(m,tx,ty))continue;let free=0;if(!solidTileM(m,tx+1,ty))free++;if(!solidTileM(m,tx-1,ty))free++;if(!solidTileM(m,tx,ty+1))free++;if(!solidTileM(m,tx,ty-1))free++;if(free<3)continue;if(test&&!test(tx,ty))continue;return{x:tx*TILE+16,y:ty*TILE+16,tx,ty};}return null;}
function findSpot(zone,test){return findSpotIn(M,zone,test);}
function zoneAt(x,y){return M.zoneOf(x/TILE,y/TILE);}
function inSafe(x,y){for(const s of M.safe)if(s.w?(Math.abs(x-s.x)<s.w&&Math.abs(y-s.y)<s.h):Math.hypot(x-s.x,y-s.y)<s.r)return true;return false;}
function buildMini(m){const c=document.createElement('canvas');c.width=m.W;c.height=m.H;const g=c.getContext('2d'),img=g.createImageData(m.W,m.H);
  for(let i=0;i<m.W*m.H;i++){let col=MINI_COL[m.tiles[i]];const d=m.deco[i];if(d===D.LAMP){}else if(d===D.WALL||d===D.TOWER)col='#c8c0b0';else if(SOLID_D[d])col=d===D.PALI?'#5a3a1e':m.tiles[i]===T.RUIN||m.tiles[i]===T.DARK?'#2a2830':m.tiles[i]===T.RDIRT||m.tiles[i]===T.SCORCH?'#3a2a20':'#1f4a22';if(m.bsolid[i])col='#9b3b2b';const n=parseInt(col.slice(1),16);img.data[i*4]=n>>16;img.data[i*4+1]=n>>8&255;img.data[i*4+2]=n&255;img.data[i*4+3]=255;}
  g.putImageData(img,0,0);m.mini=c;}
