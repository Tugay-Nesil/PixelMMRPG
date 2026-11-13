'use strict';
// =====================================================================
//  GM (OYUN YÖNETİCİSİ) PANELİ
//  Giriş: sohbete /gm yaz, F2'ye bas ya da sol üstteki karakter simgesine
//  hızlıca 5 kez dokun. Varsayılan şifre: GM-2026 (Ayarlar sekmesinden değişir).
// =====================================================================
const GM_KEY='kayipDiyarlar_gm';
const GM={on:false,god:false,oneHit:false,infMana:false,noCd:false,invis:false,speed:1,dmg:1,tpClick:false};
let gmPass='GM-2026',gmRemember=false,gmTab='char';
try{const s=JSON.parse(localStorage.getItem(GM_KEY)||'{}');if(s.pass)gmPass=s.pass;gmRemember=!!s.remember;
  if(s.remember&&s.on){GM.on=true;for(const k of ['god','oneHit','infMana','noCd','invis','speed','dmg'])if(k in s)GM[k]=s[k];}}catch(e){}
function gmSave(){try{const d={pass:gmPass,remember:gmRemember,on:GM.on&&gmRemember};for(const k of ['god','oneHit','infMana','noCd','invis','speed','dmg'])d[k]=GM[k];localStorage.setItem(GM_KEY,JSON.stringify(d));}catch(e){}}

// ---------- pencereler ----------
const gmWin=document.createElement('div');gmWin.id='gm';gmWin.className='panel win hidden';document.body.appendChild(gmWin);
const gmLogin=document.createElement('div');gmLogin.id='gmLogin';gmLogin.className='panel win hidden';document.body.appendChild(gmLogin);
if(typeof PANELS!=='undefined'&&Array.isArray(PANELS))PANELS.push('gm','gmLogin');

function gmOpenLogin(){if(!running)return;if(GM.on){gmOpen();return;}
  gmLogin.innerHTML='<button class="x" data-close="gmLogin">✕</button><h2>GM Girişi</h2>'+
    '<form id="gmForm" class="gmf"><label for="gmPw">Şifre</label><input id="gmPw" type="password" autocomplete="off" maxlength="40">'+
    '<label class="chk"><input id="gmRem" type="checkbox"'+(gmRemember?' checked':'')+'>Bu cihazda beni hatırla</label>'+
    '<div id="gmMsg" class="res"></div><button class="bigbtn" type="submit">Giriş yap</button></form>';
  gmLogin.classList.remove('hidden');const pw=$('gmPw');setTimeout(()=>pw.focus(),30);
  $('gmForm').onsubmit=e=>{e.preventDefault();if(pw.value===gmPass){GM.on=true;gmRemember=$('gmRem').checked;gmSave();gmLogin.classList.add('hidden');
      addChat(null,'👑 GM modu açıldı. Paneli 👑 düğmesiyle ya da F2 ile açabilirsin.','#ffd860');buildBar();gmOpen();}
    else{$('gmMsg').className='res bad';$('gmMsg').textContent='Şifre yanlış.';pw.select();}};}
function gmOpen(){if(!GM.on)return gmOpenLogin();gmRender();gmWin.classList.remove('hidden');}
function gmToggle(){if(!gmWin.classList.contains('hidden'))gmWin.classList.add('hidden');else gmOpen();}

// ---------- giriş yolları ----------
addEventListener('keydown',e=>{if(!running)return;
  if(e.key==='F2'){e.preventDefault();gmToggle();return;}
  if(document.activeElement===chatIn&&e.key==='Enter'&&chatIn.value.trim().toLowerCase()==='/gm'){e.preventDefault();e.stopImmediatePropagation();chatIn.value='';chatIn.blur();gmOpenLogin();}},true);
{let taps=[];$('portrait').style.pointerEvents='auto';$('portrait').addEventListener('pointerdown',()=>{const t=performance.now();taps=taps.filter(x=>t-x<1500);taps.push(t);if(taps.length>=5){taps=[];gmOpenLogin();}});}
{const _bb=buildBar;buildBar=function(){_bb();if(!GM.on)return;const d=document.createElement('div');d.className='slot gmslot';d.id='sl_gm';
  d.innerHTML='<span class="k">F2</span>👑<span class="n"></span><div class="cd"></div><div class="cdt"></div>';d.onclick=gmToggle;$('bar').appendChild(d);};}

// ---------- oyun kurallarına müdahale ----------
{const _dp=damagePlayer;damagePlayer=function(raw,src){if(GM.on&&GM.god)return;return _dp(raw,src);};}
{const _vt=validTarget;validTarget=function(t){if(t===player&&GM.on&&GM.invis)return false;return _vt(t);};}
{const _de=damageEnemy;damageEnemy=function(e,dm,src,col){if(src===player&&GM.on&&!e.dead){
    if(GM.oneHit)dm=Object.assign({},dm,{v:Math.max(dm.v,Math.ceil(e.hp)),crit:true});else if(GM.dmg!==1)dm=Object.assign({},dm,{v:Math.round(dm.v*GM.dmg)});}
  return _de(e,dm,src,col);};}
{const _rc=recalc;recalc=function(p){_rc(p);if(p===player&&GM.on&&GM.speed!==1&&p.stats)p.stats.spd*=GM.speed;};}
{const _up=update;update=function(dt){_up(dt);const p=player;if(!GM.on||!p||p.dead)return;
  if(GM.god)p.hp=p.stats.maxHp;if(GM.infMana)p.mp=p.stats.maxMp;if(GM.noCd){for(const k in p.cds)p.cds[k]=0;p.potCd=0;}};}

// ---------- ışınlanma ----------
function gmFree(x,y){if(!blocked(x,y,8))return{x,y};for(let r=16;r<400;r+=16)for(let a=0;a<6.28;a+=.4){const nx=x+Math.cos(a)*r,ny=y+Math.sin(a)*r;if(!blocked(nx,ny,8))return{x:nx,y:ny};}return null;}
function gmTp(x,y){const p=player;x=clamp(x,20,M.W*TILE-20);y=clamp(y,20,M.H*TILE-20);const s=gmFree(x,y);if(!s){showToast('Işınlanılamadı','Orası kapalı bir alan');return;}
  p.x=s.x;p.y=s.y;p.moveTo=null;p.chase=false;p.target=null;updateCamera();effects.push({type:'ring',x:p.x,y:p.y,r0:6,r1:60,t:0,dur:.5,col:'#ffd860'});}
canvas.addEventListener('pointerdown',e=>{if(!(GM.on&&GM.tpClick&&running))return;e.stopImmediatePropagation();e.preventDefault();GM.tpClick=false;gmTp(camX+e.clientX/ZOOM,camY+e.clientY/ZOOM);if(!gmWin.classList.contains('hidden'))gmRender();},true);
$('bmCanvas').addEventListener('pointerdown',e=>{if(!GM.on||!running)return;const r=e.target.getBoundingClientRect();gmTp((e.clientX-r.left)/r.width*M.W*TILE,(e.clientY-r.top)/r.height*M.H*TILE);});

// ---------- işlemler ----------
const GM_SLOTS=[['weapon','Silah'],['armor','Zırh'],['helmet','Miğfer'],['ring','Yüzük'],['necklace','Kolye'],['belt','Kemer'],['bracers','Eldiven'],['pants','Bacaklık'],['boots','Çizme']];
const gmEnemyTypes=()=>Object.keys(ET).filter(k=>!CLASSES[k]&&k!=='foe');
function gmMsg(t){showToast('👑 GM',t);}
const GM_ACT={
  heal(){const p=player;p.hp=p.stats.maxHp;p.mp=p.stats.maxMp;gmMsg('Can ve mana doldu');},
  setLvl(){const p=player,n=clamp(parseInt($('gmLvl').value)||1,1,MAXL),d=n-p.lvl;p.lvl=n;p.xp=0;if(d>0)p.sp+=d;recalc(p);p.hp=p.stats.maxHp;p.mp=p.stats.maxMp;p.shopItems=null;buildBar();gmMsg('Seviye '+n);},
  addXp(){gainXp(Math.max(1,parseInt($('gmXp').value)||0));},
  addGold(){const n=parseInt($('gmGold').value)||0;player.gold=Math.max(0,player.gold+n);gmMsg((n>=0?'+':'')+n+' altın');},
  addHonor(){const n=parseInt($('gmHonor').value)||0;player.honor=Math.max(0,(player.honor||0)+n);gmMsg((n>=0?'+':'')+n+' onur');},
  addSp(){player.sp+=5;gmMsg('+5 yetenek puanı');},
  learnAll(){const p=player;for(const s of SKILLS[p.cls])if(!p.learned.includes(s.id))p.learned.push(s.id);recalc(p);buildBar();gmMsg('Tüm yetenekler öğrenildi');},
  setTitle(){player.title=$('gmTitle').value.trim().slice(0,20);gmMsg(player.title?'Ünvan: '+player.title:'Ünvan kaldırıldı');},
  giveItem(){const p=player;if(p.inv.length>=40)return gmMsg("Çanta dolu (40/40)");const it=makeItem($('gmSlot').value,clamp(parseInt($('gmILvl').value)||1,1,MAXL),parseInt($('gmGrade').value)||0,$('gmCls').value);
    it.plus=clamp(parseInt($('gmPlus').value)||0,0,9);if($('gmEnch').checked&&typeof rollEnch==='function')it.ench=rollEnch(it,Math.max(1,it.grade));p.inv.push(it);gmMsg('Çantaya eklendi: +'+it.plus+' '+it.name);},
  mats(){const m=player.mats;for(const k in MATS)m[k]=(m[k]||0)+10;gmMsg('Her parşömenden +10');},
  pots(){player.potHp+=20;player.potMp+=20;buildBar();gmMsg('+20 can, +20 mana iksiri');},
  res(){const p=player;if(!p.res)p.res={};for(const k of ['wood','ore','herb','crystal'])p.res[k]=(p.res[k]||0)+50;gmMsg('Her kaynaktan +50');},
  pets(){const p=player;if(typeof MOUNTS!=='undefined'){p.mounts=Object.keys(MOUNTS);}if(typeof PETS!=='undefined'){p.pets=Object.keys(PETS);}gmMsg('Tüm binek ve evcil hayvanlar açıldı');},
  clearInv(){player.inv=[];gmMsg('Çanta boşaltıldı');},
  spawn(){const p=player,type=$('gmType').value,lvl=clamp(parseInt($('gmELvl').value)||1,1,40),n=clamp(parseInt($('gmCount').value)||1,1,20);
    for(let i=0;i<n;i++){const a=rand()*6.28,s=gmFree(p.x+Math.cos(a)*rr(90,160),p.y+Math.sin(a)*rr(60,120))||{x:p.x+60,y:p.y};
      const sp={type,lvl,x:s.x,y:s.y,resp:99999,timer:99999,gm:true};const e=makeEnemy(sp);sp.enemy=e;enemies.push(e);}
    gmMsg(n+' × '+ET[type].name+' çağrıldı');},
  killAll(){let n=0;for(const e of enemies.slice())if(!e.dead&&dist(player,e)<700){e.tagged=player;e.pdmg=e.maxHp;killEnemy(e,player);n++;}gmMsg(n+' düşman yok edildi');},
  tpClick(){GM.tpClick=true;gmWin.classList.add('hidden');gmMsg('Dünyada bir yere dokun, oraya ışınlanacaksın');},
  tpStart(){gmTp(M.start.x,M.start.y);},
  dark(){if(typeof setDarkMode==='function'){setDarkMode(!DARK_MODE);gmMsg('Karanlık mod '+(DARK_MODE?'açık':'kapalı'));}},
  night(){if(window.__karanlik){if(!DARK_MODE)setDarkMode(true);window.__karanlik.jumpTo(.7,false);gmMsg('Gece yapıldı');}},
  day(){if(window.__karanlik){window.__karanlik.jumpTo(.2);gmMsg('Gündüz yapıldı');}},
  blood(){if(window.__karanlik){if(!DARK_MODE)setDarkMode(true);window.__karanlik.jumpTo(.7,true);gmMsg('Kan Ayı başlatıldı');}},
  passwd(){const v=$('gmNewPw').value;if(v.length<4){$('gmPwMsg').className='res bad';$('gmPwMsg').textContent='Şifre en az 4 karakter olmalı.';return;}gmPass=v;gmSave();$('gmPwMsg').className='res ok';$('gmPwMsg').textContent='Şifre değişti.';$('gmNewPw').value='';},
  logout(){for(const k of ['god','oneHit','infMana','noCd','invis','tpClick'])GM[k]=false;GM.speed=1;GM.dmg=1;GM.on=false;gmSave();recalc(player);gmWin.classList.add('hidden');buildBar();addChat(null,'👑 GM modundan çıkıldı.','#ffd860');},
};

// ---------- panel ----------
const gmOpt=(arr,sel)=>arr.map(([v,t])=>'<option value="'+v+'"'+(String(v)===String(sel)?' selected':'')+'>'+esc(t)+'</option>').join('');
const gmBtn=(act,t,cls)=>'<button type="button" data-gm="'+act+'"'+(cls?' class="'+cls+'"':'')+'>'+t+'</button>';
const gmSw=(k,t,d)=>'<label class="gmsw"><input type="checkbox" data-sw="'+k+'"'+(GM[k]?' checked':'')+'><span><b>'+t+'</b><small>'+d+'</small></span></label>';
function gmRender(){const p=player;let h='<button class="x" data-close="gm">✕</button><h2>GM Paneli</h2>';
  const tabs=[['char','Karakter'],['item','Eşya'],['world','Dünya'],['cheat','Hileler'],['set','Ayarlar']];
  h+='<div class="tabs gmtabs">'+tabs.map(([k,t])=>'<button type="button" data-tab="'+k+'"'+(gmTab===k?' class="on"':'')+'>'+t+'</button>').join('')+'</div><div class="gmbody">';
  if(gmTab==='char'){h+='<div class="gmrow mut">'+esc(p.name)+' • Seviye '+p.lvl+' '+CLASSES[p.cls].name+' • '+p.gold+' altın • '+p.sp+' yetenek puanı</div>'+
    '<div class="gmrow"><label for="gmLvl">Seviye</label><input id="gmLvl" type="number" min="1" max="'+MAXL+'" value="'+p.lvl+'">'+gmBtn('setLvl','Uygula')+'</div>'+
    '<div class="gmrow"><label for="gmXp">Tecrübe (TP)</label><input id="gmXp" type="number" value="500">'+gmBtn('addXp','Ekle')+'</div>'+
    '<div class="gmrow"><label for="gmGold">Altın</label><input id="gmGold" type="number" value="10000">'+gmBtn('addGold','Ekle')+'</div>'+
    '<div class="gmrow"><label for="gmHonor">Onur</label><input id="gmHonor" type="number" value="500">'+gmBtn('addHonor','Ekle')+'</div>'+
    '<div class="gmrow"><label for="gmTitle">Ünvan</label><input id="gmTitle" type="text" maxlength="20" value="'+esc(p.title||'')+'" placeholder="ör. GM">'+gmBtn('setTitle','Kaydet')+'</div>'+
    '<div class="gmgrid">'+gmBtn('heal','Can ve manayı doldur')+gmBtn('addSp','+5 yetenek puanı')+gmBtn('learnAll','Tüm yetenekleri öğret')+'</div>';}
  else if(gmTab==='item'){h+='<div class="gmrow"><label for="gmSlot">Tür</label><select id="gmSlot">'+gmOpt(GM_SLOTS,'weapon')+'</select></div>'+
    '<div class="gmrow"><label for="gmCls">Sınıf</label><select id="gmCls">'+gmOpt(Object.keys(CLASSES).map(k=>[k,CLASSES[k].name]),p.cls)+'</select></div>'+
    '<div class="gmrow"><label for="gmGrade">Kalite</label><select id="gmGrade">'+gmOpt(GRADES.map((g,i)=>[i,g.n]),2)+'</select></div>'+
    '<div class="gmrow"><label for="gmILvl">Seviye</label><input id="gmILvl" type="number" min="1" max="'+MAXL+'" value="'+p.lvl+'"><label for="gmPlus">Artı</label><select id="gmPlus">'+gmOpt([0,1,2,3,4,5,6,7,8,9].map(i=>[i,'+'+i]),9)+'</select></div>'+
    '<label class="chk"><input id="gmEnch" type="checkbox" checked>Efsunlu olsun</label>'+
    '<div class="gmgrid">'+gmBtn('giveItem','Eşyayı ver','gold')+'</div><hr>'+
    '<div class="gmgrid">'+gmBtn('mats','+10 her parşömen')+gmBtn('pots','+20 iksir')+gmBtn('res','+50 her kaynak')+gmBtn('pets','Tüm binek ve hayvanlar')+gmBtn('clearInv','Çantayı boşalt')+'</div>'+
    '<div class="mut gmnote">Çanta: '+p.inv.length+'/40</div>';}
  else if(gmTab==='world'){const maps=[['yesilvadi','Yeşilvadi'],['sinir','Kızıl Sınır'],['mahzen','Unutulmuş Mahzen']];
    h+='<div class="gmsub">Haritaya git</div><div class="gmgrid">'+maps.map(([id,n])=>'<button type="button" data-map="'+id+'"'+(M.id===id?' class="on"':'')+'>'+n+'</button>').join('')+'</div>'+
    '<div class="gmsub">Işınlan</div><div class="gmgrid">'+gmBtn('tpClick','Dokunduğum yere ışınlan')+gmBtn('tpStart','Başlangıç noktasına dön')+'</div><div class="mut gmnote">GM açıkken büyük haritada (M) bir yere tıklamak da seni oraya ışınlar.</div>'+
    '<div class="gmsub">Canavar çağır</div><div class="gmrow"><label for="gmType">Tür</label><select id="gmType">'+gmOpt(gmEnemyTypes().map(k=>[k,(ET[k].boss?'💀 ':'')+ET[k].name]),'wolf')+'</select></div>'+
    '<div class="gmrow"><label for="gmELvl">Seviye</label><input id="gmELvl" type="number" min="1" max="40" value="'+p.lvl+'"><label for="gmCount">Adet</label><input id="gmCount" type="number" min="1" max="20" value="3"></div>'+
    '<div class="gmgrid">'+gmBtn('spawn','Çağır','gold')+gmBtn('killAll','Yakındaki düşmanları yok et')+'</div>'+
    '<div class="gmsub">Zaman</div><div class="gmgrid">'+gmBtn('dark','Karanlık mod: '+(typeof DARK_MODE!=='undefined'&&DARK_MODE?'Açık':'Kapalı'))+gmBtn('day','Gündüz')+gmBtn('night','Gece')+gmBtn('blood','Kan Ayı')+'</div>';}
  else if(gmTab==='cheat'){h+=gmSw('god','Ölümsüzlük','Hasar almazsın, canın hep dolu')+gmSw('oneHit','Tek vuruş','Her vuruş düşmanı öldürür')+gmSw('infMana','Sınırsız mana','Mana hiç bitmez')+gmSw('noCd','Bekleme yok','Yetenek ve iksir beklemesi sıfır')+gmSw('invis','Görünmezlik','Düşmanlar sana saldırmaz')+
    '<div class="gmrow"><label for="gmSpeed">Hız</label><select id="gmSpeed" data-num="speed">'+gmOpt([[1,'Normal'],[1.5,'1,5 kat'],[2,'2 kat'],[3,'3 kat']],GM.speed)+'</select></div>'+
    '<div class="gmrow"><label for="gmDmg">Hasar</label><select id="gmDmg" data-num="dmg">'+gmOpt([[1,'Normal'],[2,'2 kat'],[5,'5 kat'],[10,'10 kat']],GM.dmg)+'</select></div>';}
  else{h+='<div class="gmsub">Şifre değiştir</div><div class="gmrow"><label for="gmNewPw">Yeni şifre</label><input id="gmNewPw" type="password" autocomplete="off" maxlength="40">'+gmBtn('passwd','Kaydet')+'</div><div id="gmPwMsg" class="res"></div>'+
    '<label class="chk"><input id="gmRem2" type="checkbox"'+(gmRemember?' checked':'')+'>Bu cihazda beni hatırla</label>'+
    '<div class="mut gmnote">Giriş yolları: sohbete <b>/gm</b> yaz, <b>F2</b>\'ye bas ya da telefonda sol üstteki karakter simgesine hızlıca 5 kez dokun.</div>'+
    '<div class="gmgrid">'+gmBtn('logout','GM modundan çık','danger')+'</div>';}
  gmWin.innerHTML=h+'</div>';}
gmWin.addEventListener('click',e=>{const t=e.target.closest('[data-tab],[data-gm],[data-map]');if(!t)return;
  if(t.dataset.tab){gmTab=t.dataset.tab;gmRender();return;}
  if(t.dataset.map){if(t.dataset.map!==M.id){enterMap(t.dataset.map);gmMsg(M.name);}gmRender();return;}
  const f=GM_ACT[t.dataset.gm];if(f){f();if(t.dataset.gm!=='tpClick'&&t.dataset.gm!=='logout')gmRender();}});
gmWin.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.sw){GM[t.dataset.sw]=t.checked;gmSave();return;}
  if(t.dataset.num){GM[t.dataset.num]=parseFloat(t.value)||1;gmSave();recalc(player);return;}
  if(t.id==='gmRem2'){gmRemember=t.checked;gmSave();}});
gmWin.addEventListener('keydown',e=>e.stopPropagation());gmLogin.addEventListener('keydown',e=>{if(e.key!=='Escape')e.stopPropagation();});
