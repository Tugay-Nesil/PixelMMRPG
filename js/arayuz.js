'use strict';
// ================= SOHBET / BİLDİRİM =================
let toastTimer=0;
function showToast(main,sub,dur){const t=$('toast');t.innerHTML=esc(main)+(sub?'<small>'+esc(sub)+'</small>':'');t.style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.opacity=0,(dur||2.2)*1000);}
const chatLog=$('chatlog'),chatIn=$('chatin');
function addChat(name,text,col){const d=document.createElement('div');if(name){const s=document.createElement('span');s.style.color=col||'#7fb8ff';s.style.fontWeight='600';s.textContent=name+': ';d.appendChild(s);d.appendChild(document.createTextNode(text));}else{d.style.color=col||'#f3c969';d.textContent=text;}chatLog.appendChild(d);while(chatLog.children.length>80)chatLog.firstChild.remove();chatLog.scrollTop=chatLog.scrollHeight;}
function sendChat(){const text=chatIn.value.trim();chatIn.value='';chatIn.blur();if(!text)return;addChat(player.name,text,'#ffffff');player.say={text,until:gameTime+4};if(!bots.length)return;
  const low=text.toLocaleLowerCase('tr');let cat='gen';if(/(selam|merhaba|^sa$|slm|hey|naber)/.test(low))cat='greet';else if(/(ejder|azdahar|boss)/.test(low))cat='dragon';else if(/(bas|\+\d|yan|parşömen|parsomen)/.test(low))cat='up';else if(/(yardım|nasıl|nerede|nerde|görev|\?)/.test(low))cat='help';
  if(rand()<.8)queueReply(pick(bots),pick(BOT_REPLIES[cat]));}
chatIn.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')sendChat();else if(e.key==='Escape'){chatIn.value='';chatIn.blur();}});

// ================= HUD =================
const SET=(el,v)=>{if(el._v!==v){el._v=v;el.textContent=v;}};
const W_=(el,f)=>{const v=(clamp(f,0,1)*100).toFixed(1)+'%';if(el._w!==v){el._w=v;el.style.width=v;}};
// gecikmeli gri "hasar izi" barı: kırmızı anında iner, gri yavaşça peşinden gelir
function barGhost(redEl,col){const id=redEl.id+'_g';let g=$(id);if(!g){g=document.createElement('i');g.id=id;g.className='hpghost';g.style.background=col;g.style.transition='none';redEl.parentNode.insertBefore(g,redEl);}return g;}
function chipBar(redEl,frac,dt,col){frac=clamp(frac,0,1);W_(redEl,frac);const g=barGhost(redEl,col||'rgba(242,238,230,.82)');
  let gv=g._gv==null?frac:g._gv;if(frac<(g._lf==null?frac:g._lf)-0.0008)g._hold=0.32;g._lf=frac;
  if(frac>=gv)gv=frac;else if((g._hold||0)>0)g._hold-=dt;else gv+=(frac-gv)*Math.min(1,dt*6);
  if(gv-frac<0.003)gv=frac;g._gv=gv;const w=(gv*100).toFixed(1)+'%';if(g._gw!==w){g._gw=w;g.style.width=w;}}
let miniT=0;
function updHud(dt){const p=player,s=p.stats;
  SET($('pname'),(p.title?'<'+p.title+'> ':'')+p.name);SET($('plvl'),'Seviye '+p.lvl+' '+CLASSES[p.cls].name+(p.sp>0?'  •  '+p.sp+' yetenek puanı!':''));
  chipBar($('hpb'),p.hp/s.maxHp,dt);W_($('shb'),p.shield/s.maxHp);SET($('hpt'),Math.ceil(p.hp)+' / '+s.maxHp+(p.shield>0?'  (+'+Math.ceil(p.shield)+')':''));W_($('mpb'),p.mp/s.maxMp);SET($('mpt'),Math.floor(p.mp)+' / '+s.maxMp);
  const need=xpNeed(p.lvl);W_($('xpb'),p.lvl>=MAXL?1:p.xp/need);SET($('xpt'),p.lvl>=MAXL?'EN YÜKSEK SEVİYE':p.xp+' / '+need+' TP');SET($('goldt'),'🪙 '+p.gold+(p.honor?'   🏅 '+p.honor:''));
  let bf='';for(const id in p.buffs){const b=p.buffs[id];if(b.until>gameTime)bf+=(SKILL_BY_ID[id]?SKILL_BY_ID[id].ic:id.indexOf('deb_')===0?'☠️':'✨')+Math.ceil(b.until-gameTime)+' ';}if(p.stealthUntil>gameTime)bf+='🌫️'+Math.ceil(p.stealthUntil-gameTime)+' ';SET($('buffs'),bf);
  const t=p.target;if(t&&!t.dead){$('target').classList.remove('hidden');const tn=$('tname');SET(tn,t.d.pvp?'⚔ '+t.name+' • Sv '+t.lvl+' '+CLASSES[t.cls].name:'Sv '+t.lvl+' '+t.d.name);tn.style.color=t.d.pvp?'#ff6060':conColor(t.lvl);chipBar($('thpb'),t.hp/t.maxHp,dt);SET($('thpt'),Math.ceil(t.hp)+' / '+t.maxHp);}else $('target').classList.add('hidden');
  const z=M.zones[p.zone];SET($('zone'),z?z.name+' • '+z.lv:'');
  let qh='';const q=QUESTS[p.questIdx];
  if(!q)qh='<b>🏆 Ana hikâye tamamlandı!</b>';else if(p.questActive)qh='<b>📜 '+esc(q.name)+'</b><br>'+ET[q.type].name+': '+p.questProg+'/'+q.count+(p.questProg>=q.count?'<br><span class="good">✔ Muhtar\'e dön!</span>':'<br><span class="mut">Sarı oku takip et ➜</span>');else qh='<b>❗ Yeni görev var</b><br>Köydeki Muhtar ile konuş.';
  if(p.pvpQ){const pq=PVP_QUESTS[p.pvpQ.i];qh+='<hr><b style="color:#ff9a60">⚔ '+esc(pq.name)+'</b><br>'+(pq.type==='foe'?'Gölge savaşçısı':ET[pq.type].name)+': '+p.pvpQ.prog+'/'+pq.count;}
  if($('questbox')._v!==qh){$('questbox')._v=qh;$('questbox').innerHTML=qh;}
  for(let i=0;i<3;i++){const el=$('sl_s'+i);if(!el)continue;const id=p.act[i];if(!id){el.querySelector('.cd').style.height='0';SET(el.querySelector('.cdt'),'');continue;}const sk=SKILL_BY_ID[id],rem=(p.cds[id]||0)-gameTime;el.querySelector('.cd').style.height=rem>0?(rem/sk.cd*100)+'%':'0';SET(el.querySelector('.cdt'),rem>0?rem.toFixed(rem<1?1:0):'');el.classList.toggle('nomana',p.mp<sk.mp);}
  const prem=p.potCd-gameTime;for(const [id,n] of [['sl_ph',p.potHp],['sl_pm',p.potMp]]){const el=$(id);SET(el.querySelector('.n'),''+n);el.querySelector('.cd').style.height=prem>0?(prem/2*100)+'%':'0';}
  const kb=$('sl_bk');if(kb)kb.classList.toggle('pulse',p.sp>0);
  miniT-=dt;if(miniT<=0){miniT=.2;drawMiniOn(mctx,160,false);}
  if(!$('bigmap').classList.contains('hidden'))drawMiniOn(bmctx,480,true);}
function buildBar(){const p=player;const bar=$('bar');bar.innerHTML='';
  const mk=(id,k,ic,fn,tip,style)=>{const d=document.createElement('div');d.className='slot';d.id=id;if(style)d.style.cssText=style;d.innerHTML='<span class="k">'+k+'</span>'+ic+'<span class="n"></span><div class="cd"></div><div class="cdt"></div>';d.onclick=fn;if(tip){d.onmouseenter=ev=>showTip(tip(),ev);d.onmousemove=moveTip;d.onmouseleave=hideTip;}return d;};
  const sep=()=>{const s=document.createElement('div');s.className='sep';return s;};
  for(let i=0;i<3;i++){const id=p.act[i],sk=id?SKILL_BY_ID[id]:null;bar.appendChild(mk('sl_s'+i,''+(i+1),sk?sk.ic:'<span style="opacity:.3">＋</span>',()=>sk?useSkill(i):toggle('skills'),()=>sk?skillTip(sk):'<b>Boş yuva</b><br>K ile yetenek ağacını açıp buraya bir yetenek tak.'));}
  bar.appendChild(sep());
  bar.appendChild(mk('sl_ph','Q','🧪',()=>usePotion('hp'),()=>'<b class="bad">Can İksiri</b><br>Canının %40\'ını yeniler.','background:linear-gradient(#6a1c1c,#2e0c0c)'));
  bar.appendChild(mk('sl_pm','E','🧪',()=>usePotion('mp'),()=>'<b style="color:#7fb0ff">Mana İksiri</b><br>Mananın %40\'ını yeniler.','background:linear-gradient(#1c2c6a,#0c142e)'));
  bar.appendChild(sep());
  bar.appendChild(mk('sl_bi','I','🎒',()=>toggle('inv'),()=>'<b>Çanta</b> (I)'));
  bar.appendChild(mk('sl_bc','C','👤',()=>toggle('char'),()=>'<b>Karakter</b> (C)'));
  bar.appendChild(mk('sl_bk','K','🌳',()=>toggle('skills'),()=>'<b>Yetenek Ağacı</b> (K)'));
  bar.appendChild(mk('sl_bm','M','🗺️',()=>toggle('bigmap'),()=>'<b>Harita</b> (M)'));
  bar.appendChild(mk('sl_sv','','💾',()=>{save();showToast('Oyun kaydedildi','',1.3);},()=>'<b>Kaydet</b><br>Oyun her 15 saniyede bir kendiliğinden kaydedilir.'));}
function skillTip(sk){return'<b style="color:var(--gold)">'+sk.ic+' '+sk.n+'</b> <span class="mut">('+(sk.pas?'Pasif':'Aktif')+' • '+(sk.br==='atk'?'Saldırı':'Savunma')+' • Sv '+sk.lv+')</span><br>'+sk.d+(sk.pas?'':'<br><span style="color:#7fb0ff">'+sk.mp+' mana</span> • <span class="mut">'+sk.cd+' sn bekleme</span>');}

// ================= İPUCU =================
const tip=$('tip');
function showTip(html,ev){tip.innerHTML=html;tip.classList.remove('hidden');moveTip(ev);}
function moveTip(ev){const w=tip.offsetWidth,h=tip.offsetHeight;tip.style.left=clamp(ev.clientX+14,4,innerWidth-w-4)+'px';tip.style.top=clamp(ev.clientY+14,4,innerHeight-h-4)+'px';}
function hideTip(){tip.classList.add('hidden');}
function itemTip(it,mode){const p=player,st=itemStats(it),req=itemReq(it);let h='<b class="g'+it.grade+'">'+esc(itemName(it))+'</b><br><span class="mut">'+GRADES[it.grade].n+' '+SLOT_TR[it.slot]+' • Sv '+it.lvl+'</span>'+(window.kdReqHTML?kdReqHTML(it):'');
  h+='<br>';for(const k in it.base)h+=statText(k,Math.round(it.base[k]*(1+UPG[it.plus])))+(it.plus?' <span class="good">(+'+Math.round(UPG[it.plus]*100)+'%)</span>':'')+'<br>';
  for(const e of it.ench)h+='<span style="color:#d0a0ff">✦ '+statText(e.k,e.v)+'</span><br>';
  if(mode!=='eq'){const cur=it.slot==='ring'?(!p.eq.ring||!p.eq.ring2?null:(itemPrice(p.eq.ring)<=itemPrice(p.eq.ring2)?p.eq.ring:p.eq.ring2)):p.eq[it.slot];if(cur){const cs=itemStats(cur),ks=new Set([...Object.keys(st),...Object.keys(cs)]),diffs=[];for(const k of ks){const d=+((st[k]||0)-(cs[k]||0)).toFixed(3);if(!d)continue;diffs.push('<span class="'+(d>0?'good':'bad')+'">'+(k==='crit'?(d>0?'+':'')+(d*100).toFixed(1)+'% Kritik':(d>0?'+':'')+d+' '+STAT_TR[k])+'</span>');}h+='<span class="mut">Kuşanılana göre:</span><br>'+(diffs.join('<br>')||'<span class="mut">aynı</span>')+'<br>';}else h+='<span class="good">Bu yuva boş!</span><br>';}
  h+='<span style="color:var(--gold)">'+(mode==='buy'?'Fiyat: '+itemPrice(it)*4:'Satış: '+itemPrice(it))+' 🪙</span>';return h;}
function itemBox(it,attrs){return'<div class="it g'+it.grade+(itemReq(it)>player.lvl?' req':'')+'" '+attrs+'>'+itemIcon(it)+(it.plus?'<span class="pl">+'+it.plus+'</span>':'')+'<span class="lv">'+it.lvl+'</span></div>';}
function matsRow(){const p=player;return Object.keys(MATS).map(k=>'<span title="'+esc(MATS[k].n+': '+MATS[k].desc)+'" style="color:'+MATS[k].col+'">'+MATS[k].ic+' '+p.mats[k]+'</span>').join('');}

// ================= PANELLER =================
const PANELS=['inv','char','skills','smith','shop','bigmap','dialog'];
function refreshPanels(){if(!$('inv').classList.contains('hidden'))renderInv();if(!$('char').classList.contains('hidden'))renderChar();if(!$('shop').classList.contains('hidden'))renderShop();if(!$('smith').classList.contains('hidden'))renderSmith();if(!$('skills').classList.contains('hidden'))renderSkills();}
function toggle(id){const w=$(id);if(w.classList.contains('hidden')){({inv:renderInv,char:renderChar,skills:renderSkills,bigmap:()=>{$('bmTitle').textContent='🗺️ '+M.name;}})[id]();w.classList.remove('hidden');}else w.classList.add('hidden');hideTip();}
function closeAll(keepTarget){let any=false;for(const id of PANELS){if(!$(id).classList.contains('hidden')){any=true;$(id).classList.add('hidden');}}hideTip();if(!any&&!keepTarget&&player)player.target=null;}
document.addEventListener('click',ev=>{const c=ev.target.closest('[data-close]');if(c){$(c.dataset.close).classList.add('hidden');hideTip();}});

// --- çanta (iki sayfa: donanım + çanta, sürükle-bırak) ---
const EQ_PLACE={weapon:'⚔',armor:'🛡',helmet:'⛑',ring:'💍'};
let invPage='gear';
function renderInv(){const p=player,s=p.stats;let g='';
  for(let i=0;i<40;i++){const it=p.inv[i];g+=it?itemBox(it,'data-i="'+i+'"'):'<div class="it empty" data-slot-bag="'+i+'"></div>';}
  const eqSlot=sl=>{const it=p.eq[sl];return '<div class="eqslot" data-eqslot="'+sl+'">'+(it?itemBox(it,'data-eq="'+sl+'"'):'<div class="it empty eqph">'+EQ_PLACE[sl]+'</div>')+'<span class="eqlbl">'+SLOT_TR[sl]+'</span></div>';};
  const mini='<span>❤️ '+s.maxHp+'</span><span>⚔️ '+s.atk+'</span><span>🛡️ '+s.def+'</span><span>🎯 '+Math.round(s.crit*100)+'%</span>';
  $('inv').dataset.page=invPage;
  $('inv').innerHTML='<button class="x" data-close="inv">✕</button><h2>🎒 Donanım & Çanta</h2>'+
    '<div class="invtabs"><button data-page="gear" class="'+(invPage==='gear'?'on':'')+'">👤 Donanım</button><button data-page="bag" class="'+(invPage==='bag'?'on':'')+'">🎒 Çanta</button></div>'+
    '<div class="invpages">'+
      '<div class="invpage gear">'+
        '<div class="paperdoll">'+
          '<div class="eqcol">'+eqSlot('helmet')+eqSlot('weapon')+'</div>'+
          '<div class="dollmid"><canvas id="invPrev" width="150" height="210"></canvas></div>'+
          '<div class="eqcol">'+eqSlot('armor')+eqSlot('ring')+'</div>'+
        '</div>'+
        '<div class="eqstats">'+mini+'</div>'+
        '<div class="mut invhint">Eşyayı yuvaya sürükle → kuşan • yuvadan çantaya sürükle → çıkar</div>'+
      '</div>'+
      '<div class="invpage bag">'+
        '<div class="mut" style="font-size:12px;margin-bottom:6px">'+p.inv.length+'/40 • sürükle-bırak ile taşı, boş yuvaya sürükle → kuşan</div>'+
        '<div id="invgrid">'+g+'</div>'+
        '<div class="invfoot"><span>🧪 <span class="bad">'+p.potHp+'</span></span><span>🧪 <span style="color:#7fb0ff">'+p.potMp+'</span></span>'+matsRow()+'<span style="color:var(--gold)">🪙 '+p.gold+'</span></div>'+
      '</div>'+
    '</div>';
  startInvPrev();}
// karakter önizleme animasyonu (sadece çanta açıkken döner)
let invPrevRaf=0;
function startInvPrev(){cancelAnimationFrame(invPrevRaf);const cv=$('invPrev');if(!cv)return;const pc=cv.getContext('2d');pc.imageSmoothingEnabled=false;const t0=performance.now();
  const loop=now=>{if(!cv.isConnected||$('inv').classList.contains('hidden')){invPrevRaf=0;return;}const t=(now-t0)/1000,p=player,old=ctx;ctx=pc;pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,cv.width,cv.height);
    const g=pc.createRadialGradient(75,150,8,75,150,112);g.addColorStop(0,'rgba(243,201,105,.16)');g.addColorStop(1,'rgba(0,0,0,0)');pc.fillStyle=g;pc.fillRect(0,0,cv.width,cv.height);
    const cyc=t%3,atk=cyc<.22?.22-cyc:0;
    drawHero(75,188,{cls:p.cls,gender:p.gender,hair:p.hair,hairCol:p.hairCol,skin:p.skin,face:1,dir:'front',anim:t,moving:false,atk,alt:Math.floor(t/3)%2===0,wGrade:p.wGrade||0,wPlus:p.wPlus||0,aGrade:p.aGrade||0,aPlus:p.aPlus||0,helm:p.helm==null?-1:p.helm,noW:!p.eq.weapon,noA:!p.eq.armor,s:3.4});
    ctx=old;invPrevRaf=requestAnimationFrame(loop);};
  invPrevRaf=requestAnimationFrame(loop);}
// --- sürükle-bırak ---
let invDrag=null;
function invDropTarget(x,y){const el=document.elementFromPoint(x,y);if(!el)return null;return el.closest('.eqslot,.it[data-i],.it[data-slot-bag],#invgrid');}
function invReorder(from,to){const p=player;if(to>=p.inv.length)to=p.inv.length-1;if(to<0||from===to)return;const[it]=p.inv.splice(from,1);p.inv.splice(to,0,it);refreshPanels();save();}
function invClearHi(){document.querySelectorAll('.drophi').forEach(x=>x.classList.remove('drophi'));}
function invPointerDown(e){if(e.button!=null&&e.button!==0)return;const el=e.target.closest('.it[data-i],.it[data-eq]');if(!el)return;
  const fromBag=el.dataset.i!==undefined,idx=fromBag?+el.dataset.i:-1,slot=fromBag?null:el.dataset.eq,it=fromBag?player.inv[idx]:player.eq[slot];if(!it)return;
  e.preventDefault();invDrag={it,fromBag,idx,slot,el,moved:false,sx:e.clientX,sy:e.clientY,ghost:null};hideTip();}
function invPointerMove(e){if(!invDrag)return;const d=invDrag,dx=e.clientX-d.sx,dy=e.clientY-d.sy;
  if(!d.moved){if(Math.hypot(dx,dy)<6)return;d.moved=true;d.el.classList.add('dragging');const gh=document.createElement('div');gh.className='dragghost it g'+d.it.grade;gh.innerHTML=itemIcon(d.it)+(d.it.plus?'<span class="pl">+'+d.it.plus+'</span>':'');document.body.appendChild(gh);d.ghost=gh;}
  d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';invClearHi();const t=invDropTarget(e.clientX,e.clientY);if(t)t.classList.add('drophi');}
function invPointerUp(e){if(!invDrag)return;const d=invDrag;invDrag=null;if(d.ghost)d.ghost.remove();d.el.classList.remove('dragging');invClearHi();
  if(!d.moved){if(d.fromBag)equip(d.idx);else unequip(d.slot);return;}
  const t=invDropTarget(e.clientX,e.clientY);if(!t)return;const eq=t.closest('.eqslot');
  if(eq){const sl=eq.dataset.eqslot;if(d.fromBag){if(d.it.slot!==eqBase(sl)){showToast('Bu eşya "'+SLOT_TR[sl]+'" yuvasına uymuyor','',1.4);return;}equip(d.idx,sl);}return;}
  // çantaya bırakıldı
  if(!d.fromBag){unequip(d.slot);return;}
  let to;if(t.dataset.i!==undefined)to=+t.dataset.i;else if(t.dataset.slotBag!==undefined)to=+t.dataset.slotBag;else to=player.inv.length;
  invReorder(d.idx,to);}
function equip(i,key){const p=player,it=p.inv[i];if(!it)return;if(itemReq(it)>p.lvl){showToast('Seviyen yetmiyor','Gereken: Sv '+itemReq(it),1.5);return;}let sl=key||it.slot;if(it.slot==='ring'&&!key)sl=!p.eq.ring?'ring':!p.eq.ring2?'ring2':(itemPrice(p.eq.ring)<=itemPrice(p.eq.ring2)?'ring':'ring2');if(eqBase(sl)!==it.slot)return;const old=p.eq[sl];p.eq[sl]=it;p.inv.splice(i,1);if(old)p.inv.splice(i,0,old);recalc(p);fl(p.x,p.y-80,'Kuşanıldı','#c8ffc8',12);hideTip();refreshPanels();}
function unequip(sl){const p=player,it=p.eq[sl];if(!it)return;if(p.inv.length>=40){showToast('Çanta dolu!','',1.2);return;}p.eq[sl]=null;p.inv.push(it);recalc(p);hideTip();refreshPanels();}
// --- karakter ---
function renderChar(){const p=player,s=p.stats,c=CLASSES[p.cls];let eq='';for(const sl of EQ_ORDER){const it=p.eq[sl];eq+='<div class="eq">'+(it?itemBox(it,'data-eq="'+sl+'"'):'<div class="it empty"></div>')+SLOT_TR[sl]+'</div>';}
  const rows=[['❤️ Can',s.maxHp],['💧 Mana',s.maxMp],['⚔️ Saldırı',s.atk],['🛡️ Savunma',s.def],['🎯 Kritik',Math.round(s.crit*100)+'%'],['💥 Kritik hasarı',Math.round(s.critDmg*100)+'%'],['🌀 Kaçınma',Math.round(s.dodge*100)+'%'],['⏱️ Saldırı hızı',s.as.toFixed(2)+' sn'],['💪 Güç (STR)',s.str],['🍃 Çeviklik (DEX)',s.dex],['🧠 Zeka (INT)',s.int],['🗡️ Saldırı Gücü (AP)',s.ap],['🩸 Can çalma',Math.round(s.lifesteal*100)+'%'],['🏅 Onur',p.honor],['⚔ PvP zafer',p.pvpKills],['💀 Canavar',p.kills]];
  $('char').innerHTML='<button class="x" data-close="char">✕</button><h2>'+c.icon+' '+esc(p.name)+'</h2><div class="mut" style="font-size:13px">Seviye '+p.lvl+' '+c.name+' • Ana özellik: '+PRIM_TR[c.prim]+(p.title?' • <span style="color:var(--gold)">'+esc(p.title)+'</span>':'')+'</div><div id="eqgrid">'+eq+'</div><div class="stats two">'+rows.map(r=>'<div><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('')+'</div><div class="mut" style="font-size:11px;margin-top:8px">Çıkarmak için kuşanılmış eşyaya tıkla. Efsunla gelen STR/DEX/INT ana özelliğine göre saldırını artırır.</div>';}
{const w=$('char');
  w.addEventListener('click',ev=>{const a=ev.target.closest('[data-i]');if(a){equip(+a.dataset.i);return;}const b=ev.target.closest('[data-eq]');if(b)unequip(b.dataset.eq);});
  w.addEventListener('mouseover',ev=>{const a=ev.target.closest('[data-i]');if(a){const it=player.inv[+a.dataset.i];if(it)showTip(itemTip(it),ev);return;}const b=ev.target.closest('[data-eq]');if(b){const it=player.eq[b.dataset.eq];if(it)showTip(itemTip(it,'eq'),ev);}});
  w.addEventListener('mousemove',ev=>{if(!tip.classList.contains('hidden'))moveTip(ev);});
  w.addEventListener('mouseout',ev=>{if(ev.target.closest('[data-i],[data-eq]'))hideTip();});}
// çanta: sayfa sekmeleri + sürükle-bırak + ipucu
{const w=$('inv');
  w.addEventListener('click',ev=>{const tb=ev.target.closest('[data-page]');if(tb){invPage=tb.dataset.page;w.dataset.page=invPage;w.querySelectorAll('.invtabs button').forEach(x=>x.classList.toggle('on',x===tb));}});
  w.addEventListener('pointerdown',invPointerDown);
  w.addEventListener('mouseover',ev=>{if(invDrag)return;const a=ev.target.closest('[data-i]');if(a){const it=player.inv[+a.dataset.i];if(it)showTip(itemTip(it),ev);return;}const b=ev.target.closest('[data-eq]');if(b){const it=player.eq[b.dataset.eq];if(it)showTip(itemTip(it,'eq'),ev);}});
  w.addEventListener('mousemove',ev=>{if(!tip.classList.contains('hidden')&&!invDrag)moveTip(ev);});
  w.addEventListener('mouseout',ev=>{if(ev.target.closest('[data-i],[data-eq]'))hideTip();});}
addEventListener('pointermove',invPointerMove);
addEventListener('pointerup',invPointerUp);
addEventListener('pointercancel',invPointerUp);

// --- yetenek ağacı ---
function renderSkills(){const p=player,list=SKILLS[p.cls];
  const card=sk=>{const learned=p.learned.includes(sk.id),canLearn=!learned&&p.lvl>=sk.lv&&p.sp>0,locked=p.lvl<sk.lv;let b='';
    if(!learned)b='<button data-learn="'+sk.id+'" '+(canLearn?'':'disabled')+'>'+(locked?'🔒 Sv '+sk.lv:'Öğren (1 puan)')+'</button>';
    else if(sk.pas){const on=p.pas.includes(sk.id);b='<button data-pas="'+sk.id+'" class="'+(on?'on':'')+'">'+(on?'✔ Takılı (çıkar)':'Pasif yuvaya tak')+'</button>';}
    else b=[0,1,2].map(i=>'<button data-act="'+sk.id+'" data-slot="'+i+'" class="'+(p.act[i]===sk.id?'on':'')+'">'+(i+1)+'</button>').join('')+'<span class="mut" style="font-size:11px;align-self:center">yuvasına tak</span>';
    return'<div class="sk'+(learned?' learned':'')+(locked?' lock':'')+'"><div class="ic'+(sk.pas?' pas':'')+'">'+sk.ic+'</div><div class="bd"><div class="nm">'+sk.n+' <span class="mut" style="font-weight:400;font-size:11px">'+(sk.pas?'Pasif':'Aktif • '+sk.mp+' mana • '+sk.cd+' sn')+' • Sv '+sk.lv+'</span></div>'+sk.d+'<div class="btns">'+b+'</div></div></div>';};
  const lo=p.act.map((id,i)=>'<div class="lo"><span>'+(i+1)+'</span>'+(id?SKILL_BY_ID[id].ic:'')+'</div>').join('')+'<span style="margin:0 6px" class="mut">Pasif:</span>'+p.pas.map(id=>'<div class="lo pas">'+(id?SKILL_BY_ID[id].ic:'')+'</div>').join('');
  $('skills').innerHTML='<button class="x" data-close="skills">✕</button><h2>🌳 Yetenek Ağacı — '+CLASSES[p.cls].name+'</h2><div class="mut" style="font-size:12px">Her seviyede 1 puan kazanırsın. 12 yetenekten 3 aktif ve 2 pasif seçip kullanırsın. <b style="color:var(--gold)">Kalan puan: '+p.sp+'</b></div><div class="loadout"><span class="mut">Aktif:</span>'+lo+'</div>'+
    '<div class="tree"><div class="br"><h3>⚔ Saldırı Dalı</h3>'+list.filter(s=>s.br==='atk').sort((a,b)=>a.lv-b.lv).map(card).join('')+'</div><div class="br"><h3>🛡 Savunma Dalı</h3>'+list.filter(s=>s.br==='def').sort((a,b)=>a.lv-b.lv).map(card).join('')+'</div></div>';}
$('skills').addEventListener('click',ev=>{const p=player,b=ev.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.learn){const sk=SKILL_BY_ID[b.dataset.learn];if(p.sp<1||p.lvl<sk.lv)return;p.sp--;p.learned.push(sk.id);
    if(sk.pas){const i=p.pas.indexOf(null);if(i>=0)p.pas[i]=sk.id;}else{const i=p.act.indexOf(null);if(i>=0)p.act[i]=sk.id;}addChat(null,'🌳 Yeni yetenek öğrendin: '+sk.ic+' '+sk.n,'#9fe0ff');}
  else if(b.dataset.act){const id=b.dataset.act,i=+b.dataset.slot;const prev=p.act.indexOf(id);if(prev>=0)p.act[prev]=null;p.act[i]=id;}
  else if(b.dataset.pas){const id=b.dataset.pas,i=p.pas.indexOf(id);if(i>=0)p.pas[i]=null;else{const j=p.pas.indexOf(null);if(j<0){showToast('Pasif yuvalar dolu','Önce birini çıkar',1.4);return;}p.pas[j]=id;}}
  else return;recalc(p);buildBar();renderSkills();save();});
$('skills').addEventListener('mouseover',ev=>{});

// --- dükkan ---
function openShop(potOnly){const p=player;if(!p.shopItems)p.shopItems=[makeItem('weapon',p.lvl,1,p.cls),makeItem('armor',p.lvl,1,p.cls),makeItem(pick(['helmet','ring']),p.lvl,1,p.cls)];p.shopPotOnly=!!potOnly;renderShop();$('shop').classList.remove('hidden');}
function renderShop(){const p=player;let buy='';
  const row=(ic,bg,name,sub,attr,price)=>'<div class="srow"><div class="it" style="background:'+bg+'">'+ic+'</div><div class="nm">'+name+'<br><span class="mut">'+sub+'</span></div><button '+attr+' '+(p.gold<price?'disabled':'')+'>'+price+' 🪙</button></div>';
  buy+=row('🧪','#3a1010','Can İksiri','Canın %40\'ı • sende '+p.potHp,'data-buy="potHp"',25);buy+=row('🧪','#10183a','Mana İksiri','Mananın %40\'ı • sende '+p.potMp,'data-buy="potMp"',25);
  if(!p.shopPotOnly){for(const k of ['up','ench','luck','prot'])buy+=row(MATS[k].ic,'#2a2016','<span style="color:'+MATS[k].col+'">'+MATS[k].n+'</span>','sende '+p.mats[k],'data-buy="'+k+'"',MATS[k].price);
    p.shopItems.forEach((it,i)=>{if(!it)return;buy+='<div class="srow">'+itemBox(it,'data-si="'+i+'"')+'<div class="nm"><span class="g'+it.grade+'">'+esc(itemName(it))+'</span><br><span class="mut">Sv '+it.lvl+' '+SLOT_TR[it.slot]+'</span></div><button data-bi="'+i+'" '+(p.gold<itemPrice(it)*4?'disabled':'')+'>'+itemPrice(it)*4+' 🪙</button></div>';});}
  let sell='';p.inv.forEach((it,i)=>{sell+='<div class="srow">'+itemBox(it,'data-i="'+i+'"')+'<div class="nm"><span class="g'+it.grade+'">'+esc(itemName(it))+'</span><br><span class="mut">Sv '+it.lvl+' '+SLOT_TR[it.slot]+'</span></div><button data-sell="'+i+'">'+itemPrice(it)+' 🪙</button></div>';});
  if(!sell)sell='<div class="mut" style="font-size:12px">Satacak eşyan yok.</div>';else if(p.inv.some(it=>it.grade===0&&!it.plus))sell='<button data-sellall="1" style="margin-bottom:8px;width:100%">Tüm sıradan (gri) eşyaları sat</button>'+sell;
  $('shop').innerHTML='<button class="x" data-close="shop">✕</button><h2>🪙 '+(p.shopPotOnly?'Şifacı\'un Çadırı':'Tüccar\'nin Dükkanı')+'</h2><div style="font-size:13px;color:var(--gold);margin-top:4px">Altının: '+p.gold+' 🪙</div><div class="shopcols"><div><h3>Satın Al</h3>'+buy+'</div><div><h3>Sat</h3>'+sell+'</div></div>';}
(()=>{const w=$('shop');w.addEventListener('click',ev=>{const p=player,t=ev.target.closest('button');if(!t||t.dataset.close)return;
  if(t.dataset.buy){const k=t.dataset.buy,price=k.startsWith('pot')?25:MATS[k].price;if(p.gold<price)return;p.gold-=price;if(k.startsWith('pot'))p[k]++;else p.mats[k]++;}
  else if(t.dataset.bi!==undefined){const i=+t.dataset.bi,it=p.shopItems[i];if(!it||p.gold<itemPrice(it)*4)return;if(p.inv.length>=40){showToast('Çanta dolu!','',1.2);return;}p.gold-=itemPrice(it)*4;p.inv.push(it);p.shopItems[i]=null;addChat(null,'Satın alındı: ['+itemName(it)+']',GRADES[it.grade].col);}
  else if(t.dataset.sell!==undefined){const i=+t.dataset.sell,it=p.inv[i];if(!it)return;p.gold+=itemPrice(it);p.inv.splice(i,1);}
  else if(t.dataset.sellall){let g=0;p.inv=p.inv.filter(it=>{if(it.grade===0&&!it.plus){g+=itemPrice(it);return false;}return true;});p.gold+=g;if(g)fl(p.x,p.y-80,'+'+g+' 🪙','#ffd860',14);}
  else return;hideTip();renderShop();refreshPanels();});
  w.addEventListener('mouseover',ev=>{const a=ev.target.closest('[data-i]');if(a){const it=player.inv[+a.dataset.i];if(it)showTip(itemTip(it),ev);return;}const b=ev.target.closest('[data-si]');if(b){const it=player.shopItems[+b.dataset.si];if(it)showTip(itemTip(it,'buy'),ev);}});
  w.addEventListener('mousemove',ev=>{if(!tip.classList.contains('hidden'))moveTip(ev);});w.addEventListener('mouseout',ev=>{if(ev.target.closest('[data-i],[data-si]'))hideTip();});})();

// --- demirci ---
const smith={tab:'up',sel:null,luck:false,prot:true,msg:null,risk:false};
function openSmith(){smith.msg=null;if(smith.sel&&!findItem(smith.sel))smith.sel=null;renderSmith();$('smith').classList.remove('hidden');}
function renderSmith(){const p=player;const all=[];for(const k of EQ_ORDER)if(p.eq[k])all.push({it:p.eq[k],eq:true});for(const it of p.inv)all.push({it,eq:false});
  const list=all.map(o=>'<div class="irow'+(smith.sel===o.it.uid?' sel':'')+'" data-u="'+o.it.uid+'">'+itemBox(o.it,'')+'<div><span class="g'+o.it.grade+'">'+esc(itemName(o.it))+'</span><br><span class="mut">'+(o.eq?'Kuşanılı • ':'')+SLOT_TR[o.it.slot]+' • Sv '+o.it.lvl+'</span></div></div>').join('')||'<div class="mut">Eşyan yok.</div>';
  const f=smith.sel?findItem(smith.sel):null;let box='<div class="mut">Soldan bir eşya seç.</div>';
  if(f){const it=f.it,st=itemStats(it);box='<div style="font-size:16px"><b class="g'+it.grade+'">'+esc(itemName(it))+'</b></div><div class="mut">'+GRADES[it.grade].n+' '+SLOT_TR[it.slot]+' • Sv '+it.lvl+'</div><div style="margin:6px 0">'+Object.entries(st).map(([k,v])=>statText(k,v)).join(' • ')+'</div>';
    if(smith.tab==='up'){if(it.plus>=9)box+='<div class="good" style="font-size:15px">⭐ Bu eşya en üst seviyede (+9)!</div>';
      else{const luck=smith.luck&&p.mats.luck>0,ch=upgChance(it,luck),need=upgNeed(it),cost=upgCost(it),next=Object.assign({},it,{plus:it.plus+1}),ns=itemStats(next);
        box+='<div class="upgrow"><div><div class="mut">Hedef</div><div class="chance g'+it.grade+'">+'+(it.plus+1)+'</div></div><div><div class="mut">Başarı şansı</div><div class="chance" style="color:'+(ch>=100?'#7dff9a':ch>=50?'#ffd23a':'#ff6b6b')+'">%'+ch+'</div></div></div>';
        box+='<div>Yeni değerler: '+Object.keys(it.base).map(k=>statText(k,ns[k]-it.ench.filter(e=>e.k===k).reduce((a,e)=>a+e.v,0))).join(' • ')+'</div>';
        const okUp=p.mats.up>=need,okGold=p.gold>=cost;
        box+='<div>Gerekli: <span class="'+(okUp?'':'smmiss')+'">'+MATS.up.ic+' '+need+' Yükseltme Parşömeni <span class="mut">(sende '+p.mats.up+')</span></span> + <span class="'+(okGold?'':'smmiss')+'">🪙 '+cost+' <span class="mut">(sende '+p.gold+')</span></span>'+(need>1?'<br><span class="mut">+7 ve üstü basmalar için 2 parşömen gerekir.</span>':'')+'</div>';
        const protOn=smith.prot&&p.mats.prot>0&&ch<100;
        box+='<label class="chk"><input type="checkbox" id="smLuck" '+(smith.luck?'checked':'')+' '+(p.mats.luck>0?'':'disabled')+'> 🍀 Şans Parşömeni kullan (+%15) <span class="mut">sende '+p.mats.luck+'</span></label>';
        box+='<label class="chk"><input type="checkbox" id="smProt" '+(smith.prot?'checked':'')+' '+(p.mats.prot>0&&ch<100?'':'disabled')+'> 🛡️ Koruma Parşömeni kullan (yanmayı önler) <span class="mut">sende '+p.mats.prot+'</span></label>';
        if(ch>=100)box+='<div class="smstat safe">✔ %100 başarı — eşya yanmaz.</div>';
        else if(protOn)box+='<div class="smstat safe">🛡️ KORUNUYOR — başarısız olursa eşya YANMAZ (1 Koruma Parşömeni harcanır).</div>';
        else box+='<div class="smstat risk">⚠ KORUMA YOK — başarısız olursa eşya YANAR ve yok olur!'+(p.mats.prot>0?' (Koruma kutusunu işaretle)':' Koruma Parşömenin yok: Tüccar\'dan alabilirsin.')+'</div>';
        const risky=ch<100&&!protOn;
        box+='<button class="bigbtn'+(risky&&smith.risk?' riskbtn':'')+'" id="smGo" '+(p.mats.up>=need&&p.gold>=cost?'':'disabled')+'>'+(risky&&smith.risk?'⚠ Eminim, korumasız bas! (+'+(it.plus+1)+')':'🔨 Bas! (+'+(it.plus+1)+')')+'</button>';
        if(!okUp||!okGold)box+='<div class="smstat risk">Basamazsın: '+[!okUp?(need-p.mats.up)+' Yükseltme Parşömeni daha gerekli'+(need>1?' (bu seviye 2 tane ister)':''):'',!okGold?(cost-p.gold)+' altın daha gerekli':''].filter(Boolean).join(' • ')+'. Parşömen Tüccar’da satılır, Zanaatkâr’da üretilir.</div>';}
      box+='<div class="chtab">'+UPG_CHANCE.map((c,i)=>'<span class="'+(i===it.plus?'cur':'')+'">+'+(i+1)+'<br>%'+c+'</span>').join('')+'</div>';}
    else{const cost=enchCost(it);box+='<div><b>Mevcut efsun:</b><br>'+(it.ench.length?it.ench.map(e=>'<span style="color:#d0a0ff">✦ '+statText(e.k,e.v)+'</span>').join('<br>'):'<span class="mut">yok</span>')+'</div>';
      box+='<div style="margin-top:8px">Efsun Parşömeni bu eşyaya <b>'+(it.grade+1)+'</b> rastgele özellik ekler <span class="mut">(kalite arttıkça daha çok satır)</span>. Eski efsun silinir.<br>Olası özellikler: '+ENCH_POOL[it.slot].map(k=>STAT_TR[k]).join(', ')+'</div>';
      box+='<div>Gerekli: 🔮 1 Efsun Parşömeni <span class="mut">(sende '+p.mats.ench+')</span> + 🪙 '+cost+'</div><button class="bigbtn" id="smEnch" '+(p.mats.ench>=1&&p.gold>=cost?'':'disabled')+'>✨ Efsun At</button>';}}
  if(smith.msg)box+='<div class="res '+smith.msg.r+' flash">'+esc(smith.msg.msg)+'</div>';
  $('smith').innerHTML='<button class="x" data-close="smith">✕</button><h2>🔨 Demirci</h2><div class="tabs"><button data-tab="up" class="'+(smith.tab==='up'?'on':'')+'">⬆ Basma (+1…+9)</button><button data-tab="ench" class="'+(smith.tab==='ench'?'on':'')+'">✨ Efsun</button><span class="mats">'+matsRow()+' <span style="color:var(--gold)">🪙 '+p.gold+'</span></span></div><div class="smcols"><div class="ilist">'+list+'</div><div class="smbox">'+box+'</div></div>';}
$('smith').addEventListener('click',ev=>{const t=ev.target;if(t.closest('[data-close]'))return;const tab=t.closest('[data-tab]');if(tab){smith.tab=tab.dataset.tab;smith.msg=null;smith.risk=false;renderSmith();return;}
  const row=t.closest('[data-u]');if(row){smith.sel=+row.dataset.u;smith.msg=null;smith.risk=false;renderSmith();return;}
  if(t.id==='smLuck'){smith.luck=t.checked;smith.risk=false;renderSmith();return;}if(t.id==='smProt'){smith.prot=t.checked;smith.risk=false;renderSmith();return;}
  if(t.id==='smGo'){const f=findItem(smith.sel);if(f&&f.it.plus<9){const p=player,ch=upgChance(f.it,smith.luck&&p.mats.luck>0),protOn=smith.prot&&p.mats.prot>0&&ch<100;
      if(ch<100&&!protOn&&!smith.risk){smith.risk=true;smith.msg={r:'warn',msg:'Koruma yok! Başarısız olursa eşya yanar. Yine de basmak için düğmeye tekrar bas.'};renderSmith();return;}}
    smith.risk=false;const r=doUpgrade(smith.sel,smith.luck,smith.prot);smith.msg=r;if(r.r==='bad')smith.sel=null;effects.push({type:'ring',x:player.x,y:player.y,r0:6,r1:60,col:r.r==='ok'?'#ffd23a':r.r==='bad'?'#ff4040':'#a0c8ff',t:0,dur:.5});renderSmith();refreshPanels();return;}
  if(t.id==='smEnch'){smith.msg=doEnchant(smith.sel);renderSmith();refreshPanels();}});

// --- diyalog ---
function dialog(title,text,btns){const d=$('dialog');$('dtitle').textContent=title;$('dtext').textContent=text;const bx=$('dbtns');bx.innerHTML='';for(const [lbl,fn] of btns){const b=document.createElement('button');b.textContent=lbl;b.onclick=()=>{d.classList.add('hidden');if(fn)fn();};bx.appendChild(b);}d.classList.remove('hidden');}
function rewardText(o){const r=[];if(o.xp)r.push(o.xp+' TP');if(o.gold)r.push(o.gold+' altın');if(o.honor)r.push(o.honor+' onur');if(o.potHp)r.push(o.potHp+' can iksiri');if(o.potMp)r.push(o.potMp+' mana iksiri');if(o.mats)for(const k in o.mats)r.push(o.mats[k]+' '+MATS[k].n);if(o.gear)r.push(GRADES[o.gear].n+' eşya');if(o.title)r.push('"'+o.title+'" unvanı');return r.join(', ');}
function giveReward(o){const p=player;if(o.gold)p.gold+=o.gold;if(o.honor)p.honor+=o.honor;if(o.potHp)p.potHp+=o.potHp;if(o.potMp)p.potMp+=o.potMp;if(o.mats)for(const k in o.mats)p.mats[k]+=o.mats[k];
  if(o.gear){const it=makeItem(pick(DROP_SLOTS),p.lvl,o.gear,p.cls);if(p.inv.length<40){p.inv.push(it);addChat(null,'🎁 Ödül: ['+itemName(it)+']',GRADES[it.grade].col);}else p.gold+=itemPrice(it);}
  if(o.title)p.title=o.title;if(o.xp)gainXp(o.xp);refreshPanels();save();}
function openNpc(n){closeAll(true);const p=player;
  if(n.id==='muhtar'){const q=QUESTS[p.questIdx];
    if(!q)return dialog(n.name,'Diyarı kurtardın, '+(p.title||'kahraman')+'! Artık kendini Kızıl Sınır\'da kanıtlayabilirsin.',[['Teşekkürler']]);
    if(p.questActive){if(p.questProg>=q.count)return dialog(n.name,q.done,[['🎁 Ödülü Al',()=>{p.questActive=false;p.questProg=0;p.questIdx++;showToast('Görev Tamamlandı!',q.name);addChat(null,'✅ "'+q.name+'" tamamlandı!','#7dff9a');giveReward(q);}]]);
      return dialog(n.name,'"'+q.name+'" görevin sürüyor: '+p.questProg+'/'+q.count+' '+ET[q.type].name+'.\n\nEkrandaki sarı ok seni hedefe götürür. M tuşuyla haritayı da açabilirsin.',[['Tamam']]);}
    return dialog(n.name+' — '+q.name,q.text+'\n\n🎁 Ödül: '+rewardText(q)+'\n📈 Önerilen seviye: '+q.rec+(p.lvl<q.rec?'  (sen: '+p.lvl+' — zorlanabilirsin)':''),[['✔ Kabul Et',()=>{p.questActive=true;p.questProg=0;addChat(null,'📜 Yeni görev: '+q.name+' — sarı oku takip et!','#f3c969');save();}],['Sonra']]);}
  if(n.id==='tuccar')return openShop(false);
  if(n.id==='demirci')return openSmith();
  if(n.id==='bilge')return dialog(n.name,'Gel otur evlat, sana diyarı anlatayım:\n\n🌼 Çiçekli Çayır (Sv 1-3) — köyün çevresi\n🌲 Uluyan Orman (Sv 3-7) — batı\n👺 Goblin Korusu (Sv 5-9) — güneydoğu\n💀 Lanetli Harabeler (Sv 8-13) — doğu\n🕯 Unutulmuş Mahzen (Sv 12-16) — harabelerin doğu ucunda\n🐉 Ejder Tepesi (Sv 14-18) — kuzey\n⚔ Kızıl Sınır (Sv 10+) — kalenin güneydoğusundaki kızıl geçit\n\nDemirci eşyalarını +9\'a kadar basar. +4\'ten sonra yanma riski var; şans ve koruma parşömenleri işini kolaylaştırır.',[['💚 Bana şifa ver',()=>{recalc(p);p.hp=p.stats.maxHp;p.mp=p.stats.maxMp;effects.push({type:'ring',x:p.x,y:p.y,r0:10,r1:60,col:'#7dffa0',t:0,dur:.6});}],['Teşekkürler']]);
  if(n.id==='muhafiz')return dialog(n.name,pick(['Kalenin güneydoğusundaki kızıl geçit, Kızıl Sınır\'a açılır. Orada Gölge Hanedanı ile savaş hiç bitmez. En az 10. seviye olmalısın.','Kızıl Sınır\'daki canavarlar daha güçlü ama düşürdükleri ganimet de değerli. Koruma parşömeni yalnızca orada ve zindanda çıkar.','Köyde güvendesin. Canavarlar buraya giremez.']),[['Anladım']]);
  if(n.id==='sifaci')return dialog(n.name,'Yaraların mı var savaşçı? Şafak Birliği\'nin şifası seninle.',[['💚 Şifa ver',()=>{recalc(p);p.hp=p.stats.maxHp;p.mp=p.stats.maxMp;effects.push({type:'ring',x:p.x,y:p.y,r0:10,r1:60,col:'#7dffa0',t:0,dur:.6});}],['🧪 İksir al',()=>openShop(true)],['Kapat']]);
  if(n.id==='komutan'){if(!p.pvpQ)return dialog(n.name,'Şafak Birliği\'ne hoş geldin! Gölge Hanedanı ovayı ele geçirmek istiyor. Bir görev seç:\n\n'+PVP_QUESTS.map((q,i)=>(i+1)+') '+q.name+' — '+q.text+'\n   Ödül: '+rewardText(q)).join('\n\n'),[...PVP_QUESTS.map((q,i)=>[q.name,()=>{p.pvpQ={i,prog:0};addChat(null,'⚔ Sınır görevi: '+q.name,'#ff9a60');save();}]),['Sonra']]);
    const pq=PVP_QUESTS[p.pvpQ.i];if(p.pvpQ.prog>=pq.count)return dialog(n.name,'Harika iş çıkardın! Şafak Birliği seninle gurur duyuyor.',[['🎁 Ödülü Al',()=>{p.pvpQ=null;showToast('Sınır görevi tamamlandı!',pq.name);giveReward(pq);}]]);
    return dialog(n.name,'"'+pq.name+'": '+p.pvpQ.prog+'/'+pq.count+'. Ova seni bekliyor!',[['Tamam'],['Görevi bırak',()=>{p.pvpQ=null;}]]);}}
function openPortal(pt){const p=player;if(p.lvl<pt.minLvl)return dialog('⛩ '+pt.name,pt.desc+'\n\nBu geçidi kullanmak için en az '+pt.minLvl+'. seviye olmalısın.',[['Tamam']]);
  dialog('⛩ '+pt.name,pt.desc,[['Geç',()=>enterMap(pt.to,pt.tx,pt.ty)],['Vazgeç']]);}
function showDeath(lost,src){const where=M.id==='sinir'?'Şafak Kampı\'nda':M.id==='mahzen'?'zindan girişinde':'Yeşilvadi Köyü\'nde';
  $('death').innerHTML='<h1>Öldün...</h1><div class="mut" style="margin-bottom:18px">'+(src&&src.d&&src.d.pvp?esc(src.name)+' seni alt etti. ':src&&src.d?esc(src.d.name)+' seni yendi. ':'')+'Ruhun '+where+' yeniden doğacak.'+(lost?' Kaybettiğin altın: '+lost+' 🪙':'')+'</div><button class="bigbtn" id="respBtn">⛪ Diril</button>';
  $('start').classList.add('hidden');$('death').classList.remove('hidden');$('overlay').classList.remove('hidden');$('respBtn').onclick=()=>{respawn();$('overlay').classList.add('hidden');};}
const bmctx=$('bmCanvas').getContext('2d');

// ================= KARAKTER YARATMA =================
const pctx=$('prev')?null:null;let prevRaf=0;
function showStart(){const sv=loadSave();const o={name:pick(['Alp','Ece','Toprak','Deniz','Ayaz','Yağmur','Kaan','Defne'])+ri(10,99),cls:'warrior',gender:'m',hair:'kisa',hairCol:HAIR_COLS[0],skin:SKINS[0],pvPlus:'0',pvGrade:'0'};
  const chips=(key,arr)=>arr.map(([v,t])=>'<span class="chip'+(o[key]===v?' sel':'')+'" data-k="'+key+'" data-v="'+v+'">'+t+'</span>').join('');
  const sws=(key,arr)=>arr.map(c=>'<span class="sw'+(o[key]===c?' sel':'')+'" data-k="'+key+'" data-v="'+c+'" style="background:'+c+'"></span>').join('');
  $('start').innerHTML='<h1>⚔ Kayıp Diyarlar</h1><div class="sub">Ay kana bulandığında lanetliler uyanır</div>'+
    (sv?'<div style="margin-bottom:12px"><button class="bigbtn" id="contBtn">▶ Devam Et — '+esc(sv.name)+' (Sv '+sv.lvl+' '+CLASSES[sv.cls].name+')</button><div class="mut" style="font-size:12px;margin-top:4px">— ya da yeni bir kahraman yarat (eski kayıt silinir) —</div></div>':'')+
    '<div class="create"><div class="opts"><canvas id="prev" width="220" height="250"></canvas>'+
    '<div class="grp"><label>Kahramanın adı</label><input id="pnameIn" maxlength="14" value="'+o.name+'"></div>'+
    '<div class="grp"><label>Cinsiyet</label><div class="chips">'+chips('gender',GENDERS)+'</div></div>'+
    '<div class="grp"><label>Saç modeli</label><div class="chips">'+chips('hair',HAIRS)+'</div></div>'+
    '<div class="grp"><label>Saç rengi</label><div class="chips">'+sws('hairCol',HAIR_COLS)+'</div></div>'+
    '<div class="grp"><label>Ten rengi</label><div class="chips">'+sws('skin',SKINS)+'</div></div>'+
    '<div class="grp"><label>Efekt önizleme (silah ve zırh basma seviyesi)</label><div class="chips">'+chips('pvPlus',[['0','+0'],['7','+7'],['8','+8'],['9','+9']])+'</div><div class="chips" style="margin-top:6px">'+chips('pvGrade',[['0','Gri'],['1','Mor'],['2','Sarı']])+'</div></div></div>'+
    '<div><div class="classes">'+Object.entries(CLASSES).map(([k,c])=>'<div class="cls'+(k===o.cls?' sel':'')+'" data-c="'+k+'"><div class="ic">'+c.icon+'</div><h3>'+c.name+'</h3><p>'+c.desc+'</p><div class="st">Can '+c.hp+' • Mana '+c.mp+'<br>Saldırı '+c.atk+' • Savunma '+c.def+'<br>'+(c.proj?'Uzak':'Yakın')+' dövüş • '+PRIM_TR[c.prim]+'</div></div>').join('')+'</div>'+
    '<div id="clsInfo"></div><button class="bigbtn" id="newBtn">⚔ Maceraya Başla</button></div></div>'+
    '<div class="help"><b>Kontroller:</b> WASD / ok tuşları ya da yere tıklayarak yürü • Düşmana tıkla = saldır • Boşluk = en yakın düşmana saldır • Tab = hedef değiştir<br>1-2-3 yetenekler • Q/E iksirler • I çanta • C karakter • K yetenek ağacı • M harita • F konuş • Enter sohbet • Esc kapat</div>';
  $('death').classList.add('hidden');$('start').classList.remove('hidden');$('overlay').classList.remove('hidden');
  const info=()=>{const sk=SKILLS[o.cls];$('clsInfo').innerHTML='<div class="mut" style="font-size:12px;margin:4px 0">'+CLASSES[o.cls].name+' yetenekleri (12): ⚔ saldırı ve 🛡 savunma dalı</div><div class="skrow">'+sk.map(s=>'<span title="'+esc(s.n+' — '+s.d)+'" class="'+(s.pas?'pas':'')+' '+s.br+'">'+s.ic+'</span>').join('')+'</div>';};info();
  $('start').addEventListener('click',ev=>{const c=ev.target.closest('[data-k]');if(c){o[c.dataset.k]=c.dataset.v;c.parentElement.querySelectorAll('[data-k]').forEach(x=>x.classList.toggle('sel',x===c));return;}
    const cl=ev.target.closest('[data-c]');if(cl){o.cls=cl.dataset.c;$('start').querySelectorAll('.cls').forEach(x=>x.classList.toggle('sel',x===cl));info();}});
  $('newBtn').onclick=()=>{o.name=($('pnameIn').value||'').trim().slice(0,14)||o.name;cancelAnimationFrame(prevRaf);startGame(newPlayer(o),true);};
  if(sv)$('contBtn').onclick=()=>{cancelAnimationFrame(prevRaf);startGame(sv,false);};
  const pc=$('prev').getContext('2d');let t0=performance.now();
  const loop=now=>{const t=(now-t0)/1000;ctx=pc;pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,220,250);const g=pc.createRadialGradient(110,170,10,110,170,120);g.addColorStop(0,'rgba(243,201,105,.18)');g.addColorStop(1,'rgba(0,0,0,0)');pc.fillStyle=g;pc.fillRect(0,0,220,250);
    const cyc=t%2.4,atk=cyc<.22?.22-cyc:0;drawHero(104,226,{cls:o.cls,gender:o.gender,hair:o.hair,hairCol:o.hairCol,skin:o.skin,face:1,dir:'front',anim:t,moving:false,atk,alt:Math.floor(t/2.4)%2===0,wGrade:+o.pvGrade,wPlus:+o.pvPlus,aGrade:+o.pvGrade,aPlus:+o.pvPlus,helm:-1,s:4});ctx=mainCtx;prevRaf=requestAnimationFrame(loop);};
  prevRaf=requestAnimationFrame(loop);}
