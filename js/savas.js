'use strict';
// ================= DURUM =================
let player=null,enemies=[],spawners=[],bots=[],npcs=[],projectiles=[],loots=[],floaters=[],particles=[],effects=[],pendingReplies=[];
let gameTime=0,running=false,camX=0,camY=0,hoverEnt=null,botChatT=8,botLvlT=50,saveT=15,lastPickupWarn=-9;
const keys={},mouse={x:0,y:0};

// ================= EŞYA =================
function makeItem(slot,lvl,grade,cls){lvl=clamp(lvl,1,MAXL);const m=GRADES[grade].m,base={};
  if(slot==='weapon')base.atk=Math.max(2,Math.round((4+lvl*1.7)*m*rr(.92,1.08)));
  else if(slot==='armor'){base.def=Math.max(1,Math.round((2+lvl*.95)*m*rr(.92,1.08)));base.hp=Math.round((10+lvl*4)*m);}
  else if(slot==='helmet'){base.def=Math.max(1,Math.round((1+lvl*.55)*m*rr(.92,1.08)));base.hp=Math.round((6+lvl*3)*m);}
  else if(slot==='necklace'){base.hp=Math.round((6+lvl*2.4)*m*rr(.92,1.08));base.ap=Math.max(1,Math.round((1+lvl*.5)*m*rr(.92,1.08)));}
  else if(slot==='belt'){base.hp=Math.round((8+lvl*3)*m*rr(.92,1.08));base.def=Math.max(1,Math.round((1+lvl*.35)*m*rr(.92,1.08)));}
  else if(slot==='bracers'){base.def=Math.max(1,Math.round((1+lvl*.4)*m*rr(.92,1.08)));base.atk=Math.max(1,Math.round((1+lvl*.45)*m*rr(.92,1.08)));}
  else if(slot==='pants'){base.def=Math.max(1,Math.round((1+lvl*.6)*m*rr(.92,1.08)));base.hp=Math.round((6+lvl*3.2)*m*rr(.92,1.08));}
  else if(slot==='boots'){base.def=Math.max(1,Math.round((1+lvl*.5)*m*rr(.92,1.08)));base.hp=Math.round((4+lvl*2)*m*rr(.92,1.08));}
  else{base.hp=Math.round((5+lvl*2.5)*m);base.mp=Math.round((5+lvl*3)*m);}
  const it={uid:uid(),slot,cls,grade,lvl,base,plus:0,ench:[],v:ri(0,11),name:pick(PREF[grade])+' '+pick(BASE[slot][cls])};
  if(slot==='weapon'&&typeof WVAR!=='undefined'&&WVAR[cls]){it.wn=pick(WVAR[cls][grade]);it.name=pick(PREF[grade])+' '+WNAME[it.wn];}
  if(grade>=1&&rand()<.45)it.ench=rollEnch(it,grade);return it;}
function rollEnch(it,n){const pool=[...ENCH_POOL[it.slot]],out=[],L=it.lvl,g=it.grade;for(let i=0;i<n&&pool.length;i++){const k=pool.splice(ri(0,pool.length-1),1)[0];let v;
  switch(k){case'str':case'dex':case'int':v=ri(1,2+Math.floor(L/3)+g*2);break;case'ap':v=ri(2,3+Math.floor(L*.6)+g*3);break;case'hp':case'mp':v=ri(10,20+L*6+g*12);break;case'def':v=ri(1,2+Math.floor(L/2)+g);break;case'crit':v=+rr(.01,.03+g*.012).toFixed(3);break;}out.push({k,v});}return out;}
function itemStats(it){const u=1+UPG[it.plus],s={};for(const k in it.base)s[k]=Math.round(it.base[k]*u);for(const e of it.ench)s[e.k]=+((s[e.k]||0)+e.v).toFixed(3);return s;}
function itemName(it){let n=it.name||'';if(typeof ITEM_RENAME!=='undefined'&&!it._rn){for(const k in ITEM_RENAME){if(n===k||n.endsWith(' '+k)||n.startsWith(k+' ')){n=n.split(k).join(ITEM_RENAME[k]);}}it.name=n;it._rn=1;}return(it.plus?'+'+it.plus+' ':'')+n;}
function itemIcon(it){return ICONS[it.slot][it.cls];}
function itemPrice(it){return Math.round((6+it.lvl*4)*GRADES[it.grade].m*GRADES[it.grade].m*(1+it.plus*.6));}
function itemReq(it){return Math.max(1,it.lvl-1);}
function statText(k,v){return k==='crit'?'+'+(v*100).toFixed(1).replace('.0','')+'% Kritik':'+'+v+' '+STAT_TR[k];}

// ================= OYUNCU =================
function xpNeed(l){return Math.floor(40*Math.pow(l,1.7));}
function newPlayer(o){const p={name:o.name,cls:o.cls,gender:o.gender,hair:o.hair,hairCol:o.hairCol,skin:o.skin,face:1,dir:'front',lvl:1,xp:0,gold:60,honor:0,map:'yesilvadi',x:0,y:0,potHp:5,potMp:3,mats:{up:1,luck:0,prot:0,ench:0},inv:[],eq:{weapon:null,helmet:null,necklace:null,armor:null,bracers:null,belt:null,pants:null,boots:null,ring:null,ring2:null},sp:1,learned:[],act:[null,null,null],pas:[null,null],questIdx:0,questActive:false,questProg:0,pvpQ:null,title:'',kills:0,pvpKills:0};
  const first=SKILLS[o.cls][0].id;p.learned=[first];p.act[0]=first;
  p.inv.push(Object.assign(makeItem('weapon',1,0,o.cls),{ench:[]}));p.inv.push(Object.assign(makeItem('armor',1,0,o.cls),{ench:[]}));return p;}
function initRuntime(p){Object.assign(p,{kind:'player',face:1,anim:0,atkT:0,atkAnim:0,alt:false,cds:{},buffs:{},potCd:0,target:null,chase:false,moveTo:null,talkTo:null,lastHit:-99,dead:false,stats:{},r:12,cr:8,zone:'',say:null,shield:0,shieldUntil:0,hots:[],stealthUntil:0,stealthMult:1,portalIn:null,shopItems:null,moving:false});}
function recalc(p){const c=CLASSES[p.cls],L=0;/* v48: seviye tek başına stat vermez; güç = dağıtılan puanlar + ekipman */
  const s={maxHp:c.hp+c.hpL*L,maxMp:c.mp+c.mpL*L,atk:c.atk+c.atkL*L,def:c.def+c.defL*L,crit:c.crit,critDmg:1.75,spd:c.spd,range:c.range,as:c.as,dodge:c.dodge,lifesteal:0,dmgRed:0,regen:0,mpRegen:0,poisonHit:0,str:0,dex:0,int:0,ap:0};
  {const A=p.attr,BA=window.KD_BASEA&&KD_BASEA[p.cls];if(A&&BA){const dS=A.str-BA.str,dD=A.dex-BA.dex,dI=A.int-BA.int,dT=A.sta-BA.sta;s.str+=dS;s.dex+=dD;s.int+=dI;s.maxHp+=dT*20;s.def+=dT*.8+dD*.4+dS*.3;s.maxMp+=dI*3+dT*1;}}
  for(const k in p.eq){const it=p.eq[k];if(!it||p.lvl<itemReq(it)||(window.kdStatOk&&!kdStatOk(p,it)))continue;const st=itemStats(it);for(const sk in st){const v=st[sk];if(sk==='hp')s.maxHp+=v;else if(sk==='mp')s.maxMp+=v;else s[sk]=(s[sk]||0)+v;}}
  s.atk+=s.ap+(s[c.prim]||0)*1.65;s.maxHp+=s.str*5;s.maxMp+=s.int*5;s.crit+=s.dex*.002;s.dodge+=s.dex*.0015;
  const P={atkP:0,defP:0,hpP:0,mpP:0,asP:0,spdP:0};const addM=m=>{for(const k in m){if(k in P)P[k]+=m[k];else s[k]=(s[k]||0)+m[k];}};
  for(const id of p.pas)if(id&&p.learned.includes(id))addM(SKILL_BY_ID[id].mods);
  for(const id in p.buffs){const b=p.buffs[id];if(b.until>gameTime)addM(b.mods);else delete p.buffs[id];}
  s.atk*=1+P.atkP;s.def*=1+P.defP;s.maxHp*=1+P.hpP;s.maxMp*=1+P.mpP;s.as/=1+P.asP;s.spd*=1+P.spdP;
  if(window.kdClassMod)kdClassMod(p,s);
  s.crit=Math.min(.75,s.crit);s.dodge=Math.min(.6,s.dodge);s.dmgRed=Math.min(.7,s.dmgRed);
  s.atk=Math.round(s.atk);s.def=Math.round(s.def);s.maxHp=Math.round(s.maxHp);s.maxMp=Math.round(s.maxMp);
  p.stats=s;p.hp=Math.min(p.hp,s.maxHp);p.mp=Math.min(p.mp,s.maxMp);
  p.wGrade=p.eq.weapon?p.eq.weapon.grade:0;p.wPlus=p.eq.weapon?p.eq.weapon.plus:0;p.aGrade=p.eq.armor?p.eq.armor.grade:0;p.aPlus=p.eq.armor?p.eq.armor.plus:0;p.helm=p.eq.helmet?p.eq.helmet.grade:-1;p.noW=!p.eq.weapon;p.noA=!p.eq.armor;p.wName=p.eq.weapon&&p.eq.weapon.wn||null;}
function gainXp(n){const p=player;if(p.lvl>=MAXL)return;p.xp+=n;fl(p.x,p.y-74,'+'+n+' TP','#c79bff',13);
  while(p.lvl<MAXL&&p.xp>=xpNeed(p.lvl)){p.xp-=xpNeed(p.lvl);p.lvl++;p.sp++;recalc(p);p.hp=p.stats.maxHp;p.mp=p.stats.maxMp;
    effects.push({type:'lvl',x:p.x,y:p.y,t:0,dur:1.4});showToast('Seviye '+p.lvl+'!','+1 yetenek puanı • K ile yetenek ağacını aç');addChat(null,'✨ Seviye '+p.lvl+' oldun! 1 yetenek puanı kazandın (K).','#f3c969');p.shopItems=null;
    const nw=SKILLS[p.cls].filter(s=>s.lv===p.lvl);for(const s of nw)addChat(null,'🔓 Yeni yetenek açılabilir: '+s.ic+' '+s.n,'#9fe0ff');
    if(bots.length&&rand()<.6)queueReply(pick(bots),pick(['gz!!','tebrikler 🎉','grats','helal olsun']));save();}
  if(p.lvl>=MAXL)p.xp=0;}
function healPlayer(v,silent){const p=player;v=Math.round(v);if(v<=0)return;p.hp=Math.min(p.stats.maxHp,p.hp+v);if(!silent)fl(p.x,p.y-74,'+'+v,'#60ff80',14);}
function damagePlayer(raw,src){const p=player;if(p.dead)return;const s=p.stats;
  if(rand()<s.dodge){fl(p.x+rr(-6,6),p.y-60,'Iska!','#c8e0ff',13);return;}
  let v=Math.max(1,Math.round(raw*rr(.9,1.1)-s.def*.5));v=Math.max(1,Math.round(v*(1-s.dmgRed)));
  if(p.shield>0){const ab=Math.min(p.shield,v);p.shield-=ab;v-=ab;fl(p.x-16,p.y-60,'('+ab+')','#a0c8ff',11);}
  if(v<=0)return;p.hp-=v;p.lastHit=gameTime;fl(p.x+rr(-8,8),p.y-60,'-'+v,'#ff5050',15);
  if(src&&!src.dead&&src.kind==='enemy'&&(!p.target||p.target.dead))p.target=src;
  if(p.hp<=0){p.hp=0;die(src);}}
function die(src){const p=player;p.dead=true;p.target=null;p.moveTo=null;p.chase=false;p.shield=0;p.hots=[];const lost=M.pvp?0:Math.floor(p.gold*.08);p.gold-=lost;
  for(const e of enemies)if(e.target===p){e.target=null;if(!e.d.pvp)e.state='return';}
  if(src&&src.d&&src.d.pvp){addChat(src.name,pick(['kolaydı 😏','tekrar gel','sınır bizim!','gg']),'#ff6060');}
  showDeath(lost,src);}
function respawn(){const p=player;p.dead=false;recalc(p);p.hp=p.stats.maxHp;p.mp=p.stats.maxMp;p.x=M.start.x;p.y=M.start.y;p.portalIn=M.portals.find(pt=>Math.hypot(pt.x-p.x,pt.y-p.y)<34)||null;save();}

// ================= HASAR =================
function rollDmg(atk,def,crit,critDmg,mult){const c=rand()<crit;const v=atk*mult*rr(.88,1.12)*(c?critDmg:1)-def*.5;return{v:Math.max(1,Math.round(v)),crit:c};}
function breakStealth(){player.stealthUntil=0;}
function playerHit(t,mult,o){o=o||{};const p=player,s=p.stats;if(t.dead)return null;let crit=s.crit+(o.critB||0),m=mult;
  if(p.stealthUntil>gameTime){m*=p.stealthMult;crit=1;breakStealth();fl(p.x,p.y-80,'Pusu!','#d0b0ff',14);}
  if(o.execute&&t.hp<t.maxHp*.3)m*=2;
  const dm=rollDmg(s.atk,t.def,crit,s.critDmg,m);damageEnemy(t,dm,p);
  if(s.lifesteal>0)healPlayer(dm.v*s.lifesteal,true);
  if(s.poisonHit&&rand()<s.poisonHit)addDot(t,s.atk*.3,4,'#9dff60',p);
  if(o.stun)t.stunUntil=Math.max(t.stunUntil,gameTime+o.stun*(t.d.boss?.35:1));
  if(o.slow)t.slowUntil=gameTime+o.slow;
  if(o.poison)addDot(t,s.atk*o.poison[0],o.poison[1],'#9dff60',p);
  if(o.burn)addDot(t,s.atk*o.burn[0],o.burn[1],'#ff9a40',p);
  return dm;}
function addDot(e,dps,dur,col,src){if(e.dead)return;e.dots.push({dps,until:gameTime+dur,next:gameTime+.5,col,src});}
function updDots(e){for(let i=e.dots.length-1;i>=0;i--){const d=e.dots[i];if(gameTime>=d.next){d.next+=.5;damageEnemy(e,{v:Math.max(1,Math.round(d.dps*.5)),crit:false},d.src,d.col);if(e.dead)return;}if(gameTime>=d.until)e.dots.splice(i,1);}}
function damageEnemy(e,dm,src,col){if(e.dead)return;
  if(e.state==='return'){if(src===player)fl(e.x,e.y-e.d.h-6,'Kaçıyor','#bbbbbb',11);return;}
  if(e.d.pvp&&!col&&rand()<(e.dodge||0)){fl(e.x,e.y-62,'Iska','#cccccc',11);return;}
  e.hp-=dm.v;e.hitT=gameTime;if(!e.tagged)e.tagged=src;if(src===player)e.pdmg=(e.pdmg||0)+dm.v;
  const hy=e.y-e.d.h-4;
  if(src===player){fl(e.x+rr(-10,10),hy,dm.crit?dm.v+'!':''+dm.v,col||(dm.crit?'#ffd23a':'#ffffff'),dm.crit?19:col?12:14);if(!e.target||!e.d.pvp)e.target=player;}
  else{fl(e.x+rr(-10,10),hy,''+dm.v,'#bdbdbd',10);if(!e.target)e.target=src;}
  for(let i=0;i<3;i++)particles.push({x:e.x,y:e.y-e.d.h*.5,vx:rr(-80,80),vy:rr(-120,-20),life:.35,max:.35,col:e.d.col,s:3});
  if(e.hp<=0)killEnemy(e,src);}
function killEnemy(e,src){e.dead=true;e.diedAt=gameTime;e.hp=0;e.dots=[];e.sp.timer=e.d.resp||e.sp.resp||rr(14,22);
  for(let i=0;i<(e.d.boss?60:16);i++)particles.push({x:e.x,y:e.y-e.d.h*.4,vx:rr(-150,150),vy:rr(-200,30),life:.75,max:.75,col:rand()<.3?'#ffffff':e.d.col,s:rr(2,5)});
  effects.push({type:'ring',x:e.x,y:e.y,r0:e.r*.4,r1:e.r*(e.d.boss?3.4:2.4),col:e.d.col,fill:true,t:0,dur:e.d.boss?.6:.42});
  if(player.target===e)player.target=null;const p=player;
  if(e.d.pvp){if(!(e.pdmg>0)){return;}p.pvpKills++;const h=10+Math.max(0,e.lvl-p.lvl)*2;p.honor+=h;fl(e.x,e.y-90,'+'+h+' Onur','#ff9a60',16);addChat(null,'⚔ '+e.name+' adlı Gölge savaşçısını alt ettin! +'+h+' onur','#ff9a60');gainXp(Math.round(40+e.lvl*9));progressQuest('foe');dropLoot(e,true);return;}
  if(e.tagged!==p)return;
  p.kills++;const diff=e.lvl-p.lvl,mul=diff<=-6?.1:diff<=-4?.5:diff>=3?1.3:1;gainXp(Math.max(1,Math.round((e.d.boss?e.d.xp:e.d.xp+e.d.xpL*(e.lvl-1))*mul)));
  progressQuest(e.type);dropLoot(e);
  if(e.d.boss){addChat(null,'🏆 '+p.name+', '+e.d.name+' adlı boss\'u yendi!','#ff9a40');showToast(e.d.name+' yenildi!','Ganimetlerini topla');for(let i=0;i<3&&bots.length;i++)queueReply(bots[i%bots.length],pick(['GG!!!','efsane!','helal olsun 👑','inanılmaz']));}}
function progressQuest(type){const p=player;const q=QUESTS[p.questIdx];
  if(p.questActive&&q&&q.type===type&&p.questProg<q.count){p.questProg++;if(p.questProg>=q.count){showToast('Görev hazır!','Elder Aldric\'e dön');addChat(null,'📜 "'+q.name+'" tamamlandı! Ödül için Elder Aldric\'e dön.','#f3c969');}}
  if(p.pvpQ){const pq=PVP_QUESTS[p.pvpQ.i];if(pq.type===type&&p.pvpQ.prog<pq.count){p.pvpQ.prog++;if(p.pvpQ.prog>=pq.count)addChat(null,'📜 "'+pq.name+'" tamamlandı! Komutan\'e dön.','#ff9a60');}}}
function gradeRoll(tier){const x=rand();if(tier===2)return x<.4?2:1;if(tier===1)return x<.07?2:x<.38?1:0;return x<.015?2:x<.15?1:0;}
function dropLoot(e,pvpKill){const L=e.lvl,bonus=(M.pvp||M.id==='mahzen')?1:0,cls=player.cls;const add=(k,v)=>loots.push({x:e.x+rr(-20,20),y:e.y+rr(-12,12),kind:k,val:v,t:gameTime,bob:rand()*6});const slot=()=>pick(DROP_SLOTS);
  if(e.d.boss){for(let i=0;i<4+bonus*2;i++)add('gold',ri(30,60)+L*ri(3,6));for(let i=0;i<2+bonus;i++)add('gear',makeItem(slot(),L,gradeRoll(2),cls));add('mat','up');add('mat','up');add('mat','up');if(rand()<.7)add('mat','ench');if(rand()<.5)add('mat','luck');if(bonus&&rand()<.55)add('mat','prot');add('potHp',1);add('potMp',1);return;}
  const gm=1+bonus;
  if(rand()<.6)add('gold',Math.round((ri(2,4)+L*ri(1,3))*gm*(pvpKill?2:1)));if(rand()<.1)add('potHp',1);if(rand()<.06)add('potMp',1);
  if(rand()<(pvpKill?.22:.08*gm))add('gear',makeItem(slot(),L,gradeRoll(bonus||pvpKill?1:0),cls));
  if(rand()<(pvpKill?.3:.05+bonus*.09))add('mat','up');if(rand()<(pvpKill?.1:.025+bonus*.05))add('mat','ench');if(rand()<(pvpKill?.045:.006+bonus*.03))add('mat','luck');if(bonus&&rand()<(pvpKill?.07:.02))add('mat','prot');}

// ================= DÜŞMANLAR =================
function makeEnemy(sp){const d=ET[sp.type];if(d.pvp)return makeFoe(sp);const L=sp.lvl-1;const hp=Math.round(d.boss?d.hp:d.hp+d.hpL*L);
  return{kind:'enemy',type:sp.type,d,lvl:sp.lvl,x:sp.x,y:sp.y,sx:sp.x,sy:sp.y,sp,maxHp:hp,hp,atk:d.boss?d.atk:d.atk+d.atkL*L,def:d.boss?d.def:d.def+d.defL*L,r:d.r,cr:d.cr||Math.min(10,d.r*.7),state:'idle',wt:rr(1,4),wx:sp.x,wy:sp.y,atkT:0,atkAnim:0,target:null,tagged:null,anim:rand()*10,hitT:-9,slowUntil:0,stunUntil:0,dots:[],face:1,teleT:d.tele?d.tele.cd:0,dead:false,diedAt:0,moving:false};}
function makeFoe(sp){const cls=pick(Object.keys(CLASSES)),c=CLASSES[cls],L=sp.lvl-1,hp=Math.round((c.hp+c.hpL*L)*1.35);
  return{kind:'enemy',type:'foe',d:ET.foe,name:pick(FOE_NAMES),cls,lvl:sp.lvl,gender:pick(['m','f']),hair:pick(HAIRS)[0],hairCol:pick(HAIR_COLS),skin:pick(SKINS),wGrade:rand()<.3?2:1,wPlus:ri(4,9),aGrade:ri(1,2),aPlus:ri(4,9),helm:rand()<.6?ri(0,2):-1,foe:true,
    x:sp.x,y:sp.y,sx:sp.x,sy:sp.y,sp,maxHp:hp,hp,atk:(c.atk+c.atkL*L)*1.0,def:c.def+c.defL*L+L,range:c.range,as:c.as*1.15,ranged:!!c.proj,r:12,cr:8,state:'idle',wt:0,wx:sp.x,wy:sp.y,atkT:0,atkAnim:0,alt:false,target:null,tagged:null,anim:rand()*10,hitT:-9,slowUntil:0,stunUntil:0,dots:[],face:1,skillT:rr(4,8),scan:0,dead:false,diedAt:0,moving:false,dodge:c.dodge};}
function validTarget(t){if(!t)return false;if(t===player)return !player.dead&&player.stealthUntil<=gameTime&&!inSafe(player.x,player.y);if(t.kind==='bot')return t.alive&&!inSafe(t.x,t.y);return false;}
function hitTarget(src,t,raw){if(t===player)damagePlayer(raw,src);else if(t.kind==='bot')damageBot(t,raw,src);}
function updSpawners(dt){for(const s of spawners){if(s.enemy&&!s.enemy.dead)continue;s.timer-=dt;if(s.timer<=0){const e=makeEnemy(s);s.enemy=e;enemies.push(e);s.timer=999;}}}
function updEnemy(e,dt){e.anim+=dt;e.atkAnim=Math.max(0,e.atkAnim-dt);updDots(e);if(e.dead)return;if(e.stunUntil>gameTime)return;
  if(e.d.pvp)return updFoe(e,dt);
  const p=player,sm=e.slowUntil>gameTime?.45:1,dHome=Math.hypot(e.x-e.sx,e.y-e.sy);
  if(e.state==='return'){moveToward(e,e.sx,e.sy,e.d.spd*1.7,dt);e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.6*dt);if(dHome<14){e.state='idle';e.hp=e.maxHp;e.tagged=null;e.pdmg=0;e.dots=[];}return;}
  if(e.target&&!validTarget(e.target))e.target=null;
  if(!e.target&&validTarget(p)&&e.lvl>p.lvl-6&&dist(e,p)<e.d.aggro)e.target=p;
  if(!e.target&&M.pvp)for(const b of bots)if(b.alive&&b.mortal&&dist(e,b)<e.d.aggro*.7){e.target=b;break;}
  if(e.target){const t=e.target,dd=dist(e,t);
    if(dHome>(e.d.boss?560:460)){e.state='return';e.target=null;return;}
    const reach=e.d.range+12;if(dd>reach-4)moveToward(e,t.x,t.y,e.d.spd*sm,dt);e.face=t.x<e.x?-1:1;e.atkT-=dt;
    if(dd<=reach+4&&e.atkT<=0){e.atkT=e.d.as*(e.d.boss&&e.hp<e.maxHp*.3?.7:1);e.atkAnim=.3;
      if(e.d.ranged)projectiles.push({x:e.x,y:e.y-e.d.h*.5,vx:0,vy:0,spd:260,homing:true,target:t,owner:'enemy',kind:e.d.ranged,dmg:e.atk,src:e,life:2.4});else hitTarget(e,t,e.atk);}
    if(e.d.tele){e.teleT-=dt;if(e.teleT<=0&&dd<450){const tc=e.d.tele;e.teleT=tc.cd*(e.hp<e.maxHp*.5?.7:1);effects.push({type:'tele',x:t.x,y:t.y,r:tc.r,t:0,delay:tc.delay,dur:tc.delay+.05,dmg:e.atk*tc.m,src:e});e.atkAnim=.6;}}
  }else{e.wt-=dt;if(e.wt<=0){e.wt=rr(2,6);e.wx=e.sx+rr(-90,90);e.wy=e.sy+rr(-90,90);}if(Math.hypot(e.wx-e.x,e.wy-e.y)>6&&!moveToward(e,e.wx,e.wy,e.d.spd*.35,dt))e.wt=0;}}
function updFoe(e,dt){const sm=e.slowUntil>gameTime?.5:1;
  if(e.target&&!validTarget(e.target))e.target=null;
  if(!e.target&&gameTime-e.hitT>4)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.05*dt);
  e.scan-=dt;if(e.scan<=0){e.scan=.6;let best=null,bd=e.d.aggro;for(const t of [player,...bots]){if(!validTarget(t)||(t.kind==='bot'&&t.faction!=='ally'))continue;const d=dist(e,t);if(d<bd){bd=d;best=t;}}if(best&&(!e.target||bd<dist(e,e.target)-60))e.target=best;}
  if(e.target){const t=e.target,dd=dist(e,t),reach=e.range+12;
    if(dd>reach-6)moveToward(e,t.x,t.y,e.d.spd*sm,dt);else if(e.ranged&&dd<reach*.45)moveToward(e,e.x+(e.x-t.x),e.y+(e.y-t.y),e.d.spd*.6*sm,dt);
    e.face=t.x<e.x?-1:1;e.atkT-=dt;e.skillT-=dt;
    if(dd<=reach+6&&e.atkT<=0){e.atkT=e.as;e.atkAnim=.22;e.alt=!e.alt;let mult=1;if(e.skillT<=0){e.skillT=rr(5,9);mult=1.8;fl(e.x,e.y-80,pick(SKILLS[e.cls].filter(s=>!s.pas&&s.br==='atk')).n+'!','#ff8080',13);}
      if(e.ranged)projectiles.push({x:e.x,y:e.y-22,vx:0,vy:0,spd:430,homing:true,target:t,owner:'enemy',kind:e.cls==='mage'?'foeMagic':'foeArrow',dmg:e.atk*mult,src:e,life:2});else hitTarget(e,t,e.atk*mult);}}
  else{e.wt-=dt;if(e.wt<=0||Math.hypot(e.wx-e.x,e.wy-e.y)<10){e.wt=rr(6,14);const s=findSpot(rand()<.8?'mid':'center');if(s){e.wx=s.x;e.wy=s.y;}}if(!moveToward(e,e.wx,e.wy,e.d.spd*.7*sm,dt))e.wt=0;}}

// ================= BOTLAR =================
function botZone(l){return l<=3?'meadow':l<=7?'forestW':l<=9?'forestE':l<=13?'ruins':'volcano';}
function makeBot(name,i,faction,lvl,x,y){const cls=pick(Object.keys(CLASSES)),c=CLASSES[cls],L=lvl-1;
  return{kind:'bot',name,cls,faction,lvl,gender:pick(['m','f']),hair:pick(HAIRS)[0],hairCol:pick(HAIR_COLS),skin:pick(SKINS),wGrade:ri(0,2),wPlus:pick([0,0,1,3,4,5,6,7,7,8,9]),aGrade:ri(0,2),aPlus:pick([0,0,2,4,5,6,7,8,9]),helm:rand()<.5?ri(0,2):-1,
    x,y,r:12,cr:8,tx:x,ty:y,wt:0,scan:0,target:null,atkT:0,atkAnim:0,alt:false,face:1,anim:rand()*5,moving:false,say:null,alive:true,mortal:faction==='ally',maxHp:Math.round((c.hp+c.hpL*L)*1.5),hp:Math.round((c.hp+c.hpL*L)*1.5),def:c.def+c.defL*L+L,respawnAt:0,hitT:-9};}
function damageBot(b,raw,src){b.hitT=gameTime;if(!b.mortal||!b.alive)return;const v=Math.max(1,Math.round(raw*rr(.9,1.1)-b.def*.5));b.hp-=v;
  if(b.hp<=0){b.alive=false;b.respawnAt=gameTime+15;b.target=null;if(src&&src.d&&src.d.pvp)addChat(null,'☠ '+src.name+', müttefikin '+b.name+' adlı oyuncuyu alt etti.','#ff9090');}}
function updBot(b,dt){b.anim+=dt;b.atkAnim=Math.max(0,b.atkAnim-dt);
  if(!b.alive){if(gameTime>=b.respawnAt){b.alive=true;b.hp=b.maxHp;b.x=M.start.x+rr(-60,60);b.y=M.start.y+rr(-50,0);b.target=null;}return;}
  if(b.mortal&&b.hp<b.maxHp&&gameTime-b.hitT>5)b.hp=Math.min(b.maxHp,b.hp+b.maxHp*.06*dt);
  if(b.target&&(b.target.dead||b.target.state==='return'||dist(b,b.target)>420))b.target=null;
  const ally=b.faction==='ally';
  if(!b.target){b.scan-=dt;if(b.scan<=0){b.scan=1;let best=null,bd=ally?320:230;for(const e of enemies){if(e.dead||e.state==='return'||e.d.boss||e.duel)continue;if(!ally&&(e.lvl>b.lvl+2||(e.tagged&&e.tagged!==b)))continue;const d=dist(b,e);if(d<bd){bd=d;best=e;}}if(best&&rand()<.8)b.target=best;}
    b.wt-=dt;if(b.wt<=0||Math.hypot(b.tx-b.x,b.ty-b.y)<8){b.wt=rr(5,12);const s=ally?findSpot(rand()<.7?'mid':'center',(tx,ty)=>ty>36):(rand()<.15?findSpot('village'):findSpot(botZone(b.lvl)));if(s){b.tx=s.x;b.ty=s.y;}}
    if(!moveToward(b,b.tx,b.ty,135,dt))b.wt=0;}
  else{const t=b.target,c=CLASSES[b.cls],dd=dist(b,t);b.face=t.x<b.x?-1:1;
    if(dd>c.range+t.r-6)moveToward(b,t.x,t.y,140,dt);
    else{b.atkT-=dt;if(b.atkT<=0){b.atkT=c.as*1.15;b.atkAnim=.22;b.alt=!b.alt;const atk=(c.atk+c.atkL*(b.lvl-1))*(ally?1.4:1)+b.lvl;
      if(c.proj){const a=Math.atan2(t.y-t.d.h*.4-(b.y-18),t.x-b.x);projectiles.push({x:b.x,y:b.y-18,vx:Math.cos(a)*400,vy:Math.sin(a)*400,spd:400,homing:true,target:t,owner:'bot',src:b,kind:c.proj,atk,life:2});}
      else damageEnemy(t,rollDmg(atk,t.def,.08,1.75,1),b);}}}}
function queueReply(b,text){if(!b)return;pendingReplies.push({t:gameTime+rr(1.2,3.5),b,text});}
function updChatBots(dt){if(!bots.length)return;botChatT-=dt;if(botChatT<=0){botChatT=rr(14,32);const b=pick(bots);const line=M.pvp?pick(['saldırın!!','gölgeler ortada toplanıyor','titana gidelim mi?','şifacıya dönüyorum','biri beni korusun','sınır bizim olacak!']):pick(BOT_LINES);addChat(b.name,line,b.faction==='ally'?'#7dff9a':'#7fb8ff');b.say={text:line,until:gameTime+4};}
  botLvlT-=dt;if(botLvlT<=0&&!M.pvp){botLvlT=rr(45,100);const b=pick(bots);if(b.lvl<MAXL){b.lvl++;addChat(null,'✨ '+b.name+' seviye '+b.lvl+' oldu!','#9fd6ff');}}
  for(let i=pendingReplies.length-1;i>=0;i--){const r=pendingReplies[i];if(gameTime>=r.t){addChat(r.b.name,r.text,r.b.faction==='ally'?'#7dff9a':'#7fb8ff');r.b.say={text:r.text,until:gameTime+4};pendingReplies.splice(i,1);}}}

// ================= YETENEKLER =================
function nearestEnemy(range){let best=null,bd=range;for(const e of enemies){if(e.dead)continue;const d=dist(player,e);if(d<bd){bd=d;best=e;}}return best;}
function skillTarget(range){const p=player;let t=p.target&&!p.target.dead?p.target:null;if(!t||dist(p,t)>range+t.r)t=nearestEnemy(range)||t;return t;}
function shoot(t,kind,spd,mult,opt,extra){const p=player,a=Math.atan2(t.y-t.d.h*.4-(p.y-20),t.x-p.x);projectiles.push(Object.assign({x:p.x+p.face*8,y:p.y-20,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,spd,homing:true,target:t,owner:'player',src:p,kind,mult,opt:opt||{},life:2.4},extra||{}));}
function stepMove(p,dx,dy,distance){const n=Math.ceil(distance/8),sx=dx*8,sy=dy*8;for(let i=0;i<n;i++){if(blocked(p.x+sx,p.y+sy,p.cr))break;p.x+=sx;p.y+=sy;if(i%2===0)particles.push({x:p.x,y:p.y-20,vx:0,vy:-20,life:.35,max:.35,col:'#d8d0ff',s:4});}}
function useSkill(slot){const p=player;if(!p||p.dead)return;const id=p.act[slot];if(!id){fl(p.x,p.y-80,'Boş yuva — K ile yetenek tak','#cccccc',12);return;}
  const sk=SKILL_BY_ID[id],s=p.stats,ranged=!!CLASSES[p.cls].proj;
  if((p.cds[id]||0)>gameTime)return;if(p.mp<sk.mp){fl(p.x,p.y-80,'Mana yetersiz','#7fb0ff',12);return;}
  const needT=['strike','proj','chain','ground','dash'].includes(sk.k)||(sk.k==='blink'&&sk.behind);let t=null;
  if(needT){const rng=sk.k==='dash'||sk.k==='blink'?sk.range:(sk.ranged||ranged||sk.k!=='strike')?s.range+40:s.range+14;t=skillTarget(Math.max(rng,s.range+60));
    if(!t){fl(p.x,p.y-80,'Hedef yok','#cccccc',12);return;}if(dist(p,t)-t.r>rng){p.target=t;p.chase=true;fl(p.x,p.y-80,'Çok uzak','#cccccc',12);return;}p.target=t;p.face=t.x<p.x?-1:1;}
  p.mp-=sk.mp;p.cds[id]=gameTime+sk.cd;p.atkAnim=.22;p.alt=!p.alt;p.castK=sk.k;p.castT=gameTime;
  const fx=(type,o)=>effects.push(Object.assign({type,x:p.x,y:p.y,t:0},o));
  switch(sk.k){
    case'strike':if(sk.ranged||ranged)shoot(t,sk.vis||CLASSES[p.cls].proj,520,sk.m,{critB:sk.critB,stun:sk.stun,poison:sk.poison,execute:sk.execute});else{playerHit(t,sk.m,{critB:sk.critB,stun:sk.stun,execute:sk.execute,poison:sk.poison});fx('slash',{face:p.face,dur:.22});fx('ring',{x:t.x,y:t.y,r0:6,r1:34,col:'#ffffff',dur:.25});}break;
    case'aoe':{for(const e of enemies){if(e.dead||dist(p,e)>sk.r+e.r)continue;playerHit(e,sk.m,{stun:sk.stun,slow:sk.slow});if(sk.taunt)e.target=p;}
      if(sk.shield){p.shield=Math.max(p.shield,Math.round(s.maxHp*sk.shield));p.shieldUntil=gameTime+10;}
      const col={ice:'#9fe8ff',quake:'#c8a060',smoke:'#9a9a9a',ring:'#ff9a3a'}[sk.vis];if(sk.vis==='spin')fx('spin',{r:sk.r,dur:.45});else fx('ring',{r0:12,r1:sk.r,col:col||'#fff',dur:.5,fill:true});
      if(sk.vis==='smoke')for(let i=0;i<30;i++)particles.push({x:p.x+rr(-sk.r,sk.r),y:p.y+rr(-sk.r*.5,sk.r*.5)-10,vx:rr(-20,20),vy:rr(-40,-10),life:1,max:1,col:'#8a8a8a',s:rr(5,9)});
      if(sk.vis==='quake')for(let i=0;i<24;i++)particles.push({x:p.x+rr(-sk.r,sk.r),y:p.y+rr(-sk.r*.5,sk.r*.5),vx:0,vy:rr(-160,-60),life:.5,max:.5,col:'#8a6a40',s:rr(3,6)});break;}
    case'proj':if(sk.pierce){const a=Math.atan2(t.y-t.d.h*.4-(p.y-20),t.x-p.x);projectiles.push({x:p.x,y:p.y-20,vx:Math.cos(a)*sk.spd,vy:Math.sin(a)*sk.spd,owner:'player',src:p,kind:sk.vis,mult:sk.m,opt:{},pierce:new Set(),life:.9});}
      else shoot(t,sk.vis,sk.spd||400,sk.m,{burn:sk.burn},{aoe:sk.aoe});break;
    case'chain':{let last=t;const hit=new Set([t]);playerHit(t,sk.m);fx('bolt',{x1:p.x,y1:p.y-30,x2:t.x,y2:t.y-t.d.h*.5,dur:.3});
      for(let j=0;j<sk.jumps;j++){let nx=null,nd=170;for(const e of enemies){if(e.dead||hit.has(e))continue;const d=dist(last,e);if(d<nd){nd=d;nx=e;}}if(!nx)break;hit.add(nx);fx('bolt',{x1:last.x,y1:last.y-last.d.h*.5,x2:nx.x,y2:nx.y-nx.d.h*.5,dur:.3});playerHit(nx,sk.m*.75);last=nx;}break;}
    case'ground':effects.push({type:'ground',x:t.x,y:t.y,r:sk.r,t:0,delay:sk.delay,dur:sk.delay+.05,m:sk.m,burn:sk.burn,vis:sk.vis});if(sk.vis==='meteor')effects.push({type:'meteor',x:t.x,y:t.y,t:0,delay:sk.delay,dur:sk.delay});if(sk.vis==='arrows')effects.push({type:'arrowrain',x:t.x,y:t.y,r:sk.r,t:0,delay:sk.delay,dur:sk.delay});break;
    case'multi':{const tt=p.target&&!p.target.dead?p.target:nearestEnemy(s.range+40);const base=tt?Math.atan2(tt.y-tt.d.h*.4-(p.y-18),tt.x-p.x):(p.face>0?0:Math.PI);if(tt){p.target=tt;p.face=tt.x<p.x?-1:1;}
      for(let k=0;k<sk.n;k++){const a=base+(k-(sk.n-1)/2)*.16;projectiles.push({x:p.x,y:p.y-18,vx:Math.cos(a)*560,vy:Math.sin(a)*560,owner:'player',src:p,kind:'arrow',mult:sk.m,opt:{},life:.75});}break;}
    case'buff':p.buffs[id]={until:gameTime+sk.dur,mods:sk.mods,col:sk.col};if(sk.heal)healPlayer(s.maxHp*sk.heal);fx('ring',{r0:10,r1:80,col:sk.col||'#fff',dur:.6});fl(p.x,p.y-84,sk.n+'!',sk.col||'#fff',15);break;
    case'heal':healPlayer(s.maxHp*sk.p);p.hots.push({per:s.maxHp*sk.hot/6,until:gameTime+6,next:gameTime+1});fx('ring',{r0:10,r1:60,col:'#7dffa0',dur:.6});break;
    case'shield':p.shield=Math.max(p.shield,Math.round(s.maxHp*sk.p));p.shieldUntil=gameTime+12;fx('ring',{r0:10,r1:50,col:'#a0c8ff',dur:.6});fl(p.x,p.y-84,sk.n+'!','#a0c8ff',15);break;
    case'dash':{const dx=t.x-p.x,dy=t.y-p.y,l=Math.hypot(dx,dy)||1;stepMove(p,dx/l,dy/l,Math.max(0,l-t.r-16));playerHit(t,sk.m,{stun:sk.stun});fx('ring',{x:t.x,y:t.y,r0:8,r1:50,col:'#ffcc66',dur:.4});break;}
    case'blink':if(sk.behind){const dx=t.x-p.x,dy=t.y-p.y,l=Math.hypot(dx,dy)||1;const nx=t.x+dx/l*(t.r+18),ny=t.y+dy/l*(t.r+18);for(let i=0;i<10;i++)particles.push({x:p.x,y:p.y-20,vx:rr(-60,60),vy:rr(-60,20),life:.5,max:.5,col:'#6a4a8a',s:5});if(!blocked(nx,ny,p.cr)){p.x=nx;p.y=ny;}p.face=t.x<p.x?-1:1;playerHit(t,sk.m);}
      else{const src=nearestEnemy(500);let dx,dy;if(src){dx=p.x-src.x;dy=p.y-src.y;}else{dx=-p.face;dy=0;}const l=Math.hypot(dx,dy)||1;for(let i=0;i<10;i++)particles.push({x:p.x,y:p.y-20,vx:rr(-60,60),vy:rr(-60,20),life:.5,max:.5,col:'#b0a0ff',s:4});stepMove(p,dx/l,dy/l,sk.back);
        if(sk.slowR)for(const e of enemies)if(!e.dead&&dist(p,e)<sk.slowR+sk.back)e.slowUntil=gameTime+3;fx('ring',{r0:6,r1:40,col:'#c8b0ff',dur:.35});}break;
    case'stealth':p.stealthUntil=gameTime+sk.dur;p.stealthMult=sk.nm;for(const e of enemies)if(e.target===p)e.target=null;p.target=null;fl(p.x,p.y-84,'Gölgelere karıştın...','#b0a0d0',13);for(let i=0;i<16;i++)particles.push({x:p.x+rr(-12,12),y:p.y-rr(0,40),vx:rr(-30,30),vy:-30,life:.6,max:.6,col:'#4a4060',s:5});break;
  }}
function usePotion(k){const p=player;if(!p||p.dead||p.potCd>gameTime)return;const s=p.stats;
  if(k==='hp'){if(p.potHp<=0){fl(p.x,p.y-80,'Can iksiri yok','#ff9090',12);return;}if(p.hp>=s.maxHp)return;p.potHp--;healPlayer(s.maxHp*.4);}
  else{if(p.potMp<=0){fl(p.x,p.y-80,'Mana iksiri yok','#90b0ff',12);return;}if(p.mp>=s.maxMp)return;p.potMp--;const v=Math.round(s.maxMp*.4);p.mp=Math.min(s.maxMp,p.mp+v);fl(p.x,p.y-80,'+'+v,'#60a0ff',15);}
  p.potCd=gameTime+2;}
function basicAttack(t){const p=player,c=CLASSES[p.cls];p.atkAnim=.22;p.alt=!p.alt;const ddx=t.x-p.x,ddy=t.y-p.y;if(Math.abs(ddx)>=Math.abs(ddy)){p.face=ddx<0?-1:1;p.dir='side';}else p.dir=ddy>0?'front':'back';
  if(c.proj)shoot(t,c.proj,c.proj==='arrow'?520:380,1,{});else{playerHit(t,1);effects.push({type:'slash',x:p.x,y:p.y,face:p.face,t:0,dur:.2});}}

// ================= MERMİLER / EFEKTLER =================
function projHit(pr,t){if(pr.owner==='bot'){damageEnemy(t,rollDmg(pr.atk,t.def,.08,1.75,1),pr.src);return;}
  if(pr.aoe){effects.push({type:'ring',x:pr.x,y:pr.y+14,r0:8,r1:pr.aoe,col:'#ffa040',t:0,dur:.4,fill:true});for(let i=0;i<16;i++)particles.push({x:pr.x,y:pr.y,vx:rr(-160,160),vy:rr(-160,100),life:.45,max:.45,col:pick(['#ffb040','#ff6a20','#ffe080']),s:rr(2,5)});
    for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-pr.x,e.y-e.d.h*.4-pr.y)<pr.aoe+e.r)playerHit(e,pr.mult*(e===t?1:.6),pr.opt);}}
  else playerHit(t,pr.mult,pr.opt);}
function updProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){const pr=projectiles[i];pr.life-=dt;let rm=pr.life<=0;
    if(!rm){
      if(pr.homing){const t=pr.target;const alive=t&&(t===player?!player.dead:t.kind==='bot'?t.alive:!t.dead);
        if(!alive)rm=true;else{const th=t===player||t.kind==='bot'?18:t.d.h*.4,ty=t.y-th,a=Math.atan2(ty-pr.y,t.x-pr.x);pr.vx=Math.cos(a)*pr.spd;pr.vy=Math.sin(a)*pr.spd;pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;
          if(window.kdCoverHit&&kdCoverHit(pr,t))rm=true;else if(Math.hypot(t.x-pr.x,ty-pr.y)<(t.r||12)+6){rm=true;if(pr.owner==='enemy')hitTarget(pr.src,t,pr.dmg);else projHit(pr,t);}}}
      else{pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;
        for(const e of enemies){if(e.dead||(pr.pierce&&pr.pierce.has(e)))continue;if(Math.hypot(e.x-pr.x,e.y-e.d.h*.4-pr.y)<e.r+6){if(pr.pierce){pr.pierce.add(e);playerHit(e,pr.mult,pr.opt);}else{projHit(pr,e);rm=true;break;}}}
        if(!rm){const tx=Math.floor(pr.x/TILE),ty=Math.floor((pr.y+16)/TILE);if(tx<0||ty<0||tx>=M.W||ty>=M.H)rm=true;else{const j=ty*M.W+tx;if(SOLID_D[M.deco[j]]||M.bsolid[j]||M.tiles[j]===T.DWALL){rm=true;if(window.kdCoverFx)kdCoverFx(pr);}}}}}
    if(pr.kind==='fireball'||pr.kind==='efire'||pr.kind==='foeMagic')particles.push({x:pr.x+rr(-3,3),y:pr.y+rr(-3,3),vx:rr(-20,20),vy:rr(-40,0),life:.3,max:.3,col:pick(['#ffb040','#ff6a20']),s:rr(2,4)});
    if(rm)projectiles.splice(i,1);}}
function updEffects(dt){for(let i=effects.length-1;i>=0;i--){const ef=effects[i];ef.t+=dt;
  if(ef.type==='spin'){ef.x=player.x;ef.y=player.y;}
  if(ef.type==='tele'&&ef.t>=ef.delay&&!ef.done){ef.done=true;const tg=[player,...bots];for(const t of tg){if(t===player&&player.dead)continue;if(t.kind==='bot'&&(!t.alive||!t.mortal))continue;if(Math.hypot(t.x-ef.x,t.y-ef.y)<ef.r)hitTarget(ef.src,t,ef.dmg);}
    for(let k=0;k<36;k++){const a=rand()*7,r=rand()*ef.r;particles.push({x:ef.x+Math.cos(a)*r,y:ef.y+Math.sin(a)*r*.5,vx:rr(-30,30),vy:rr(-140,-40),life:.7,max:.7,col:pick(['#ffb040','#ff5a1a','#ffe080']),s:rr(3,6)});}}
  if(ef.type==='ground'&&ef.t>=ef.delay&&!ef.done){ef.done=true;for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-ef.x,e.y-ef.y)<ef.r+e.r)playerHit(e,ef.m,{burn:ef.burn});}
    const cols=ef.vis==='arrows'?['#e8e0c0','#a08060']:['#ffb040','#ff5a1a','#ffe080'];for(let k=0;k<30;k++){const a=rand()*7,r=rand()*ef.r;particles.push({x:ef.x+Math.cos(a)*r,y:ef.y+Math.sin(a)*r*.5,vx:rr(-40,40),vy:rr(-160,-40),life:.6,max:.6,col:pick(cols),s:rr(2,6)});}
    effects.push({type:'ring',x:ef.x,y:ef.y,r0:10,r1:ef.r,col:ef.vis==='arrows'?'#f0e8d0':'#ff8a30',t:0,dur:.4,fill:true});if(ef.burn)effects.push({type:'burnzone',x:ef.x,y:ef.y,r:ef.r,t:0,dur:ef.burn[1]});}
  if(ef.t>=ef.dur)effects.splice(i,1);}}
function updParticles(dt){for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=200*dt;if(q.life<=0)particles.splice(i,1);}
  if(particles.length>600)particles.splice(0,particles.length-600);
  for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.t+=dt;f.y-=32*dt;if(f.t>=f.dur)floaters.splice(i,1);}}
function updLoot(){const p=player;for(let i=loots.length-1;i>=0;i--){const l=loots[i];if(gameTime-l.t>120){loots.splice(i,1);continue;}if(p.dead||Math.hypot(p.x-l.x,p.y-l.y)>32)continue;
  if(l.kind==='gold'){p.gold+=l.val;fl(l.x,l.y-20,'+'+l.val+' 🪙','#ffd860',13);}
  else if(l.kind==='potHp'){p.potHp++;fl(l.x,l.y-20,'+1 Can İksiri','#ff8080',12);}
  else if(l.kind==='potMp'){p.potMp++;fl(l.x,l.y-20,'+1 Mana İksiri','#80a0ff',12);}
  else if(l.kind==='mat'){p.mats[l.val]++;const mt=MATS[l.val];fl(l.x,l.y-20,'+1 '+mt.n,mt.col,12);addChat(null,'Ganimet: '+mt.ic+' '+mt.n,mt.col);refreshPanels();}
  else{if(p.inv.length>=40){if(gameTime-lastPickupWarn>4){lastPickupWarn=gameTime;fl(p.x,p.y-80,'Çanta dolu!','#ff9090',13);}continue;}p.inv.push(l.val);addChat(null,'Ganimet: ['+itemName(l.val)+']',GRADES[l.val.grade].col);fl(l.x,l.y-20,l.val.name,GRADES[l.val.grade].col,12);if(l.val.grade===2){showToast('Efsanevi eşya!',l.val.name,2);}refreshPanels();}
  loots.splice(i,1);}}
function fl(x,y,text,col,size){floaters.push({x,y,text,col,size:size||13,t:0,dur:1.1});if(floaters.length>120)floaters.shift();}

// ================= DEMİRCİ =================
function findItem(id){const p=player;for(const k in p.eq)if(p.eq[k]&&p.eq[k].uid===id)return{it:p.eq[k],where:'eq',slot:k};const i=p.inv.findIndex(x=>x.uid===id);return i>=0?{it:p.inv[i],where:'inv',idx:i}:null;}
function upgCost(it){return Math.round((20+it.lvl*6)*(it.plus+1)*(1+it.grade*.5));}
function upgNeed(it){return it.plus>=6?2:1;}
function upgChance(it,luck){return Math.min(100,UPG_CHANCE[it.plus]+(luck?15:0));}
function doUpgrade(id,useLuck,useProt){const p=player,f=findItem(id);if(!f)return{r:'err',msg:'Önce bir eşya seç.'};const it=f.it;if(it.plus>=9)return{r:'err',msg:'Bu eşya zaten +9!'};
  const need=upgNeed(it),cost=upgCost(it);if(p.mats.up<need)return{r:'err',msg:'Yeterli Yükseltme Parşömeni yok ('+need+' gerekli).'};if(p.gold<cost)return{r:'err',msg:'Yeterli altın yok ('+cost+' gerekli).'};
  const luck=useLuck&&p.mats.luck>0,ch=upgChance(it,luck),prot=useProt&&p.mats.prot>0&&ch<100;
  p.mats.up-=need;p.gold-=cost;if(luck)p.mats.luck--;if(prot)p.mats.prot--;
  if(rand()*100<ch){it.plus++;recalc(p);if(it.plus>=7)addChat(null,'🔥 '+p.name+' eşyasını +'+it.plus+' bastı: '+itemName(it),GRADES[it.grade].col);save();return{r:'ok',msg:'BAŞARILI! '+itemName(it)};}
  if(prot){save();return{r:'warn',msg:'Başarısız... Koruma Parşömeni eşyanı kurtardı.'};}
  if(f.where==='eq')p.eq[f.slot]=null;else p.inv.splice(f.idx,1);recalc(p);addChat(null,'💥 '+itemName(it)+' basılırken yandı...','#ff7070');save();return{r:'bad',msg:'EŞYA YANDI! '+itemName(it)+' kül oldu...'};}
function enchCost(it){return 40+it.lvl*12;}
function doEnchant(id){const p=player,f=findItem(id);if(!f)return{r:'err',msg:'Önce bir eşya seç.'};const it=f.it,cost=enchCost(it);if(p.mats.ench<1)return{r:'err',msg:'Efsun Parşömeni yok.'};if(p.gold<cost)return{r:'err',msg:'Yeterli altın yok ('+cost+' gerekli).'};
  p.mats.ench--;p.gold-=cost;it.ench=rollEnch(it,it.grade+1);recalc(p);save();return{r:'ok',msg:'Efsun tuttu: '+it.ench.map(e=>statText(e.k,e.v)).join(', ')};}

// ================= GÖREV HEDEFİ / NPC İŞARETİ =================
function questTarget(){const p=player;if(!p||!M)return null;const q=QUESTS[p.questIdx];let map,pos,lbl;
  if(M.pvp&&p.pvpQ){const pq=PVP_QUESTS[p.pvpQ.i];if(p.pvpQ.prog>=pq.count){const n=npcs.find(n=>n.id==='komutan');return n?{x:n.x,y:n.y,label:'Commander Valen'}:null;}if(pq.type==='titan'){const s=M.spawns.find(s=>s.type==='titan');return{x:s.x,y:s.y,label:pq.name};}return null;}
  if(!q)return null;
  if(p.questActive&&p.questProg<q.count){map=q.map||'yesilvadi';if(q.loc)pos={x:q.loc[0]*TILE,y:q.loc[1]*TILE};else{const s=getMap(map).spawns.find(s=>s.type===q.type);pos=s?{x:s.x,y:s.y}:null;}lbl=q.name;}
  else{map='yesilvadi';const n=getMap('yesilvadi').npcDefs.find(n=>n.id==='muhtar');pos={x:n.x*TILE,y:n.y*TILE};lbl='Elder Aldric';}
  if(map!==M.id){const pt=M.portals.find(pt=>pt.to===map)||M.portals.find(pt=>pt.to==='yesilvadi');return pt?{x:pt.x,y:pt.y,label:lbl+' → '+pt.name}:null;}
  return pos?{x:pos.x,y:pos.y,label:lbl}:null;}
function npcMarker(n){const p=player;
  if(n.id==='muhtar'){const q=QUESTS[p.questIdx];if(!q)return null;if(p.questActive)return p.questProg>=q.count?{t:'?',c:'#7dff9a',s:24}:null;return{t:'!',c:'#ffd23a',s:24};}
  if(n.id==='komutan'){if(!p.pvpQ)return{t:'!',c:'#ff9a60',s:24};return p.pvpQ.prog>=PVP_QUESTS[p.pvpQ.i].count?{t:'?',c:'#7dff9a',s:24}:null;}
  return{tuccar:{t:'🪙',c:'#fff',s:15},demirci:{t:'🔨',c:'#fff',s:15},sifaci:{t:'✚',c:'#7dff9a',s:18},bilge:{t:'📖',c:'#fff',s:14}}[n.id]||null;}

// ================= HARİTA DEĞİŞTİRME =================
function enterMap(id,x,y){const p=player;M=getMap(id);p.map=id;p.x=x!=null?x:M.start.x;p.y=y!=null?y:M.start.y;
  p.target=null;p.moveTo=null;p.chase=false;p.talkTo=null;p.zone='';
  spawners=M.spawns.map(s=>Object.assign({},s,{enemy:null,timer:rand()*1.2}));enemies=[];projectiles=[];loots=[];effects=[];particles=[];pendingReplies=[];
  npcs=M.npcDefs.map(n=>Object.assign({kind:'npc',r:12},n,{x:n.x*TILE,y:n.y*TILE}));bots=[];
  if(id==='yesilvadi')BOT_NAMES.slice(0,12).forEach((n,i)=>{const lvl=ri(2,17);const s=findSpot(botZone(lvl))||M.start;bots.push(makeBot(n,i,'neutral',lvl,s.x,s.y));});
  else if(id==='sinir')ALLY_NAMES.slice(0,7).forEach((n,i)=>bots.push(makeBot(n,i,'ally',ri(14,21),M.start.x+rr(-90,90),M.start.y+rr(-60,0))));
  p.portalIn=M.portals.find(pt=>Math.hypot(pt.x-p.x,pt.y-p.y)<40)||null;
  updateCamera();showToast(M.name,M.zones[M.zoneOf(p.x/TILE,p.y/TILE)].lv);
  if(id==='sinir')addChat(null,'⚔ Kızıl Sınır\'a girdin! Kırmızı isimli oyuncular düşmanın, yeşil isimliler müttefikin. Kamp güvenli bölgedir.','#ff9a60');
  if(id==='mahzen')addChat(null,'🕯 Unutulmuş Mahzen\'e indin. Karanlıkta dikkatli ol...','#c8a0ff');
  save();}
function updateCamera(){const p=player,Z=(typeof ZOOM!=='undefined'?ZOOM:1),vw=VW/Z,vh=VH/Z,sc=RS*Z,q=v=>Math.round(v*sc)/sc;camX=q(clamp(p.x-vw/2,0,Math.max(0,M.W*TILE-vw)));camY=q(clamp(p.y-vh/2,0,Math.max(0,M.H*TILE-vh)));}
