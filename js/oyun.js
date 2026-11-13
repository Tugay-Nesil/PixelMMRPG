'use strict';
// ================= OYUNCU GÜNCELLEME =================
function updPlayer(dt){const p=player;recalc(p);p.anim+=dt;p.atkAnim=Math.max(0,p.atkAnim-dt);if(p.dead)return;const s=p.stats;
  let mx=0,my=0;if(keys.w||keys.arrowup)my--;if(keys.s||keys.arrowdown)my++;if(keys.a||keys.arrowleft)mx--;if(keys.d||keys.arrowright)mx++;
  if(holdMove&&!(mx||my)){const tx=camX+mouse.x/ZOOM,ty=camY+mouse.y/ZOOM;if(Math.hypot(tx-p.x,ty-p.y)>10){p.moveTo={x:tx,y:ty};p.chase=false;p.talkTo=null;}else p.moveTo=null;}
  if(mx||my){p.moveTo=null;p.chase=false;p.talkTo=null;const l=Math.hypot(mx,my);moveEnt(p,mx/l*s.spd*dt,my/l*s.spd*dt);}
  else if(p.target&&p.chase&&!p.target.dead){if(dist(p,p.target)>s.range+p.target.r-6)moveToward(p,p.target.x,p.target.y,s.spd,dt);}
  else if(p.moveTo){if(Math.hypot(p.moveTo.x-p.x,p.moveTo.y-p.y)<5||!moveToward(p,p.moveTo.x,p.moveTo.y,s.spd,dt))p.moveTo=null;}
  if(p.talkTo&&dist(p,p.talkTo)<70){openNpc(p.talkTo);p.talkTo=null;p.moveTo=null;}
  p.atkT-=dt;
  if(p.target){const t=p.target;if(t.dead||dist(p,t)>850)p.target=null;else if(dist(p,t)<=s.range+t.r&&p.atkT<=0&&(p.chase||p.stealthUntil<=gameTime)){p.atkT=s.as;basicAttack(t);}}
  const ooc=gameTime-p.lastHit>5;p.hp=Math.min(s.maxHp,p.hp+s.maxHp*((ooc?.035:.003)+s.regen)*dt);p.mp=Math.min(s.maxMp,p.mp+s.maxMp*((ooc?.045:.018)+s.mpRegen)*dt);
  for(let i=p.hots.length-1;i>=0;i--){const h=p.hots[i];if(gameTime>=h.next){h.next+=1;healPlayer(h.per,true);}if(gameTime>=h.until)p.hots.splice(i,1);}
  if(p.shield>0&&gameTime>p.shieldUntil)p.shield=0;
  const z=M.zoneOf(p.x/TILE,p.y/TILE);if(z!==p.zone){const first=!p.zone;p.zone=z;if(!first)showToast(M.zones[z].name,M.zones[z].lv);}
  const pt=M.portals.find(pt=>Math.hypot(pt.x-p.x,pt.y-p.y)<(pt.r||26));if(pt&&pt!==p.portalIn){p.portalIn=pt;p.moveTo=null;openPortal(pt);}else if(!pt)p.portalIn=null;}

function update(dt){gameTime+=dt;const p=player;
  p.moving=false;for(const e of enemies)e.moving=false;for(const b of bots)b.moving=false;
  updPlayer(dt);for(const e of enemies)updEnemy(e,dt);for(const b of bots)updBot(b,dt);
  updSpawners(dt);updProjectiles(dt);updEffects(dt);updParticles(dt);updLoot();updChatBots(dt);
  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.dead&&gameTime-e.diedAt>.7)enemies.splice(i,1);}
  updateCamera();saveT-=dt;if(saveT<=0){saveT=15;save();}updHud(dt);}

// ================= GİRDİ =================
addEventListener('keydown',e=>{if(!running||document.activeElement===chatIn||document.activeElement===$('pnameIn'))return;const k=e.key.toLowerCase();
  if(e.key==='Enter'){e.preventDefault();chatIn.focus();return;}
  if(k==='tab'){e.preventDefault();cycleTarget();return;}
  if(e.key===' '){e.preventDefault();const p=player;if(!p.target||p.target.dead||dist(p,p.target)>450){const t=nearestEnemy(450);if(t)p.target=t;}if(p.target){p.chase=true;p.moveTo=null;}return;}
  if(k.startsWith('arrow'))e.preventDefault();keys[k]=true;if(e.repeat||player.dead)return;
  if(k==='1')useSkill(0);else if(k==='2')useSkill(1);else if(k==='3')useSkill(2);else if(k==='q')usePotion('hp');else if(k==='e')usePotion('mp');
  else if(k==='i'||k==='b')toggle('inv');else if(k==='c')toggle('char');else if(k==='k')toggle('skills');else if(k==='m')toggle('bigmap');else if(k==='f')talkNearest();else if(k==='escape')closeAll();});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function cycleTarget(){const p=player;const list=enemies.filter(e=>!e.dead&&dist(p,e)<450).sort((a,b)=>dist(p,a)-dist(p,b));if(!list.length)return;const i=list.indexOf(p.target);p.target=list[(i+1)%list.length];}
function talkNearest(){const p=player;let best=null,bd=90;for(const n of npcs){const d=dist(p,n);if(d<bd){bd=d;best=n;}}if(best)openNpc(best);}
function entityAt(wx,wy){for(const e of enemies){if(e.dead)continue;if(Math.hypot(wx-e.x,wy-(e.y-e.d.h*.45))<Math.max(e.r,e.d.h*.5)+6)return e;}
  for(const n of npcs)if(Math.hypot(wx-n.x,wy-(n.y-22))<20)return n;for(const b of bots)if(b.alive&&Math.hypot(wx-b.x,wy-(b.y-24))<18)return b;return null;}
canvas.addEventListener('pointerdown',e=>{if(!running||player.dead)return;hideTip();if(document.activeElement===chatIn)chatIn.blur();const p=player,wx=camX+e.clientX/ZOOM,wy=camY+e.clientY/ZOOM,ent=entityAt(wx,wy);
  if(ent&&ent.kind==='enemy'){p.target=ent;p.chase=true;p.moveTo=null;p.talkTo=null;return;}
  if(ent&&ent.kind==='npc'){p.talkTo=ent;p.chase=false;p.moveTo={x:ent.x,y:ent.y+24};return;}
  if(ent&&ent.kind==='bot'){fl(ent.x,ent.y-80,ent.name+' • Sv '+ent.lvl+' '+CLASSES[ent.cls].name,ent.faction==='ally'?'#9fffb0':'#9fd0ff',12);return;}
  p.moveTo={x:wx,y:wy};p.chase=false;p.talkTo=null;effects.push({type:'click',x:wx,y:wy,t:0,dur:.4});
  if(e.button===0){holdMove=true;mouse.x=e.clientX;mouse.y=e.clientY;try{canvas.setPointerCapture(e.pointerId);}catch(_){}}});
let holdMove=false;
const stopHold=()=>{holdMove=false;};
canvas.addEventListener('pointerup',stopHold);canvas.addEventListener('pointercancel',stopHold);canvas.addEventListener('lostpointercapture',stopHold);addEventListener('blur',stopHold);
canvas.addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;if(!running)return;const ent=entityAt(camX+e.clientX/ZOOM,camY+e.clientY/ZOOM);hoverEnt=ent;canvas.style.cursor=ent?(ent.kind==='enemy'?'crosshair':'pointer'):'default';});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

// ================= KAYIT =================
const SAVE_FIELDS=['name','cls','gender','hair','hairCol','skin','lvl','xp','gold','honor','map','x','y','potHp','potMp','mats','inv','eq','sp','learned','act','pas','questIdx','questActive','questProg','pvpQ','title','kills','pvpKills'];
function save(){if(!player)return;try{const d={v:2};for(const k of SAVE_FIELDS)d[k]=player[k];localStorage.setItem(SAVE_KEY,JSON.stringify(d));}catch(e){}}
function loadSave(){try{const s=localStorage.getItem(SAVE_KEY);if(!s)return null;const d=JSON.parse(s);return d&&CLASSES[d.cls]?d:null;}catch(e){return null;}}
addEventListener('beforeunload',save);

// ================= BAŞLAT =================
function startGame(data,isNew){const base=newPlayer({name:data.name,cls:data.cls,gender:data.gender||'m',hair:data.hair||'kisa',hairCol:data.hairCol||HAIR_COLS[0],skin:data.skin||SKINS[0]});
  if(!isNew)for(const k of SAVE_FIELDS)if(data[k]!==undefined&&data[k]!==null||k==='pvpQ')base[k]=data[k]===undefined?base[k]:data[k];
  player=base;initRuntime(player);if(!GEN[player.map])player.map='yesilvadi';recalc(player);player.hp=player.stats.maxHp;player.mp=player.stats.maxMp;
  $('overlay').classList.add('hidden');for(const id of ['hud','side','chat','bar'])$(id).classList.remove('hidden');$('portrait').textContent=CLASSES[player.cls].icon;
  chatLog.innerHTML='';addChat(null,'Kayıp Diyarlar\'a hoş geldin, '+player.name+'!','#f3c969');running=true;
  const m=getMap(player.map);const px=isNew?null:player.x,py=isNew?null:player.y;M=m;const ok=px!=null&&!blocked(px,py,8);enterMap(player.map,ok?px:null,ok?py:null);buildBar();
  if(isNew){addChat(null,'Köy meydanındaki Elder Aldric\'in (sarı ❗) sana bir görevi var. Ekrandaki sarı ok seni ona götürür.','#f3c969');addChat(null,'İpucu: K ile yetenek ağacını, M ile haritayı açabilirsin.','#9fe0ff');}
  if(bots.length)queueReply(bots[4%bots.length],'hoş geldin '+player.name+' 👋');}

let last=performance.now();
function frame(t){const dt=Math.min(.05,(t-last)/1000);last=t;if(running&&player)update(dt);render();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
showStart();
window.__game={get player(){return player;},get enemies(){return enemies;},get bots(){return bots;},get npcs(){return npcs;},get map(){return M;},step(n){for(let i=0;i<n;i++)update(1/60);render();},keys,useSkill,openNpc,enterMap,doUpgrade,doEnchant,makeItem,recalc,gainXp};
