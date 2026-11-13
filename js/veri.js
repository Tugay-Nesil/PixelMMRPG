'use strict';
// ================= TEMEL YARDIMCILAR =================
const TILE=32,MAXL=80,SAVE_KEY='kayipDiyarlar_v2';
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rand=Math.random,rr=(a,b)=>a+rand()*(b-a),ri=(a,b)=>Math.floor(rr(a,b+1)),pick=a=>a[Math.floor(rand()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let uidC=(Date.now()%1000000)*100;const uid=()=>++uidC;
const $=id=>document.getElementById(id);

// ================= KARAKTER GÖRÜNÜMÜ =================
const GENDERS=[['m','Erkek'],['f','Kadın']];
const HAIRS=[['kisa','Kısa'],['uzun','Uzun'],['kuyruk','At kuyruğu'],['diken','Dikenli']];
const HAIR_COLS=['#2b1a10','#6b3e1e','#c8962e','#eadcae','#a8321e','#d8d8d8','#3a4a9a'];
const SKINS=['#f6d2b0','#e8b98f','#c98e62','#8d5a3b'];
const HERO_PAL={
  warrior:{body:'#5d646c',plate:'#a2abb5',tabard:'#8a2424',pants:'#4a3a30',boots:'#2e2622',sleeve:'#6d747c'},
  mage:{body:'#3b2a8a',cape:'#241760',pants:'#241760',boots:'#2a1f40',sleeve:'#4a38a0'},
  archer:{body:'#5a3d22',cape:'#2c5a32',pants:'#3e4a2a',boots:'#3a2a1a',sleeve:'#4a6a3a'},
  assassin:{body:'#2a2533',scarf:'#6a1f2a',pants:'#1f1b26',boots:'#141118',sleeve:'#34303e'},
};
const NAKED_PAL={body:'#e9dfc8',plate:'#e9dfc8',tabard:'#e9dfc8',cape:'#e9dfc8',scarf:'#e9dfc8',pants:'#7a5a3c',boots:'#5e4430',sleeve:'#e9dfc8'};
const FOE_PAL={warrior:{tabard:'#1e1e22',plate:'#5a4a4a'},mage:{body:'#4a1010',cape:'#200808',sleeve:'#5a1818'},archer:{body:'#3a2020',cape:'#4a0e0e',sleeve:'#4a2a2a'},assassin:{scarf:'#b01818'}};

// ================= SINIFLAR =================
const CLASSES={
  warrior:{name:'Savaşçı',icon:'⚔️',prim:'str',weapon:'greatsword',desc:'Ağır zırhlı ön saf savaşçısı. Büyük kılıcı ve kalkanıyla düşmanın karşısına dikilir.',hp:150,mp:55,atk:13,def:7,crit:.05,dodge:.02,spd:150,range:44,as:.9,proj:null,hpL:24,mpL:4,atkL:2.5,defL:1.5},
  mage:{name:'Büyücü',icon:'🔮',prim:'int',weapon:'staff',desc:'Ateş, buz ve yıldırımın efendisi. Canı az ama uzaktan yıkıcı alan hasarı verir.',hp:90,mp:140,atk:16,def:2,crit:.07,dodge:.02,spd:142,range:225,as:1.1,proj:'magic',hpL:13,mpL:15,atkL:3.2,defL:.6},
  archer:{name:'Okçu',icon:'🏹',prim:'dex',weapon:'bow',desc:'Uzun yayıyla uzaktan ölüm yağdıran avcı. Hızlı, isabetli ve çevik.',hp:105,mp:85,atk:13,def:3,crit:.14,dodge:.06,spd:160,range:255,as:.78,proj:'arrow',hpL:16,mpL:7,atkL:2.8,defL:.9},
  assassin:{name:'Suikastçı',icon:'🗡️',prim:'dex',weapon:'daggers',desc:'Gölgelerde saklanan çift hançer ustası. Çok hızlı vurur, kritikleri ölümcüldür.',hp:115,mp:80,atk:14,def:4,crit:.2,dodge:.08,spd:170,range:36,as:.6,proj:null,hpL:18,mpL:6,atkL:2.6,defL:1.1},
};
const PRIM_TR={str:'Güç',dex:'Çeviklik',int:'Zeka'};

// ================= YETENEKLER (her sınıf 12) =================
const SKILLS={
warrior:[
  {id:'w1',n:'Ağır Darbe',ic:'⚔️',br:'atk',lv:1,mp:8,cd:3,k:'strike',m:1.9,d:'Hedefe %190 hasarlı güçlü bir kılıç darbesi.'},
  {id:'w2',n:'Kasırga',ic:'🌀',br:'atk',lv:3,mp:18,cd:6,k:'aoe',m:1.5,r:95,vis:'spin',d:'Kılıcını savurarak çevrendeki herkese %150 hasar verir.'},
  {id:'w3',n:'Hücum',ic:'🐂',br:'atk',lv:6,mp:15,cd:10,k:'dash',m:1.4,range:340,stun:1.2,d:'Hedefe atılır, %140 hasar verip 1.2 sn sersemletir.'},
  {id:'w4',n:'Yer Sarsıntısı',ic:'💥',br:'atk',lv:10,mp:30,cd:14,k:'aoe',m:2.1,r:135,stun:1.5,vis:'quake',d:'Yeri döverek çevreye %210 hasar verir ve 1.5 sn sersemletir.'},
  {id:'w5',n:'Kılıç Ustalığı',ic:'🗡️',br:'atk',lv:4,pas:true,mods:{atkP:.15},d:'Pasif: Saldırı +%15.'},
  {id:'w6',n:'Kan Hırsı',ic:'🩸',br:'atk',lv:12,pas:true,mods:{lifesteal:.08,critDmg:.25},d:'Pasif: Verdiğin hasarın %8\'i kadar can çalarsın, kritik hasarı +%25.'},
  {id:'w7',n:'Savaş Narası',ic:'📯',br:'def',lv:1,mp:20,cd:18,k:'buff',dur:8,mods:{atkP:.2,defP:.3},col:'#ff9a3a',d:'8 sn boyunca saldırı +%20, savunma +%30.'},
  {id:'w8',n:'Kalkan Duvarı',ic:'🛡️',br:'def',lv:3,mp:20,cd:16,k:'buff',dur:6,mods:{dmgRed:.5},col:'#9fd0ff',d:'6 sn boyunca aldığın hasar %50 azalır.'},
  {id:'w9',n:'Meydan Okuma',ic:'😤',br:'def',lv:6,mp:15,cd:12,k:'aoe',m:.6,r:170,taunt:true,shield:.15,vis:'ring',d:'Çevredeki düşmanları üzerine çeker, canının %15\'i kadar kalkan kazanırsın.'},
  {id:'w10',n:'İkinci Rüzgar',ic:'💚',br:'def',lv:10,mp:25,cd:30,k:'heal',p:.3,hot:.2,d:'Anında canının %30\'unu, 6 sn içinde %20 daha yenilersin.'},
  {id:'w11',n:'Demir Deri',ic:'🪨',br:'def',lv:4,pas:true,mods:{defP:.2,hpP:.1},d:'Pasif: Savunma +%20, can +%10.'},
  {id:'w12',n:'Yılmaz İrade',ic:'🦁',br:'def',lv:12,pas:true,mods:{hpP:.15,regen:.008},d:'Pasif: Can +%15, savaşta bile saniyede %0.8 can yenilenir.'},
],
mage:[
  {id:'m1',n:'Ateş Topu',ic:'🔥',br:'atk',lv:1,mp:12,cd:2.5,k:'proj',m:2,aoe:55,vis:'fireball',spd:380,d:'Hedefte patlayan ateş topu: %200 hasar, yakındakilere de sıçrar.'},
  {id:'m2',n:'Yıldırım',ic:'⚡',br:'atk',lv:3,mp:15,cd:4,k:'chain',m:1.6,jumps:2,d:'Hedefe anında %160 hasar verir, yıldırım 2 düşmana daha seker.'},
  {id:'m3',n:'Göktaşı',ic:'☄️',br:'atk',lv:6,mp:35,cd:12,k:'ground',m:3,r:110,delay:.9,vis:'meteor',d:'Hedefin olduğu yere göktaşı düşürür: %300 alan hasarı.'},
  {id:'m4',n:'Alev Fırtınası',ic:'🌋',br:'atk',lv:10,mp:40,cd:15,k:'ground',m:1.2,r:140,delay:.4,burn:[.5,5],vis:'fire',d:'Hedef alanı ateşe verir: %120 hasar ve 5 sn yanma.'},
  {id:'m5',n:'Büyü Kudreti',ic:'✨',br:'atk',lv:4,pas:true,mods:{atkP:.18},d:'Pasif: Saldırı +%18.'},
  {id:'m6',n:'Kritik Kıvılcım',ic:'💫',br:'atk',lv:12,pas:true,mods:{crit:.1,critDmg:.3},d:'Pasif: Kritik şansı +%10, kritik hasarı +%30.'},
  {id:'m7',n:'Buz Halkası',ic:'❄️',br:'def',lv:1,mp:20,cd:9,k:'aoe',m:1,r:150,slow:4,vis:'ice',d:'Çevrene %100 hasar verir ve düşmanları 4 sn yavaşlatır.'},
  {id:'m8',n:'Mana Kalkanı',ic:'🔮',br:'def',lv:3,mp:25,cd:18,k:'shield',p:.35,d:'Canının %35\'i kadar hasarı emen bir büyü kalkanı.'},
  {id:'m9',n:'Işınlanma',ic:'🌌',br:'def',lv:6,mp:15,cd:10,k:'blink',back:230,d:'Düşmanlardan 230 birim uzağa ışınlanırsın.'},
  {id:'m10',n:'Dondurma',ic:'🧊',br:'def',lv:10,mp:25,cd:14,k:'strike',m:1.2,stun:3,ranged:true,vis:'ice',d:'Hedefi 3 sn boyunca dondurur ve %120 hasar verir.'},
  {id:'m11',n:'Derin Bilgelik',ic:'📘',br:'def',lv:4,pas:true,mods:{mpP:.25,mpRegen:.012},d:'Pasif: Mana +%25, mana daha hızlı dolar.'},
  {id:'m12',n:'Arkan Zırh',ic:'🧿',br:'def',lv:12,pas:true,mods:{defP:.3,hpP:.15},d:'Pasif: Savunma +%30, can +%15.'},
],
archer:[
  {id:'a1',n:'Keskin Atış',ic:'🎯',br:'atk',lv:1,mp:8,cd:3,k:'strike',m:1.9,ranged:true,vis:'arrow',d:'Özenle nişan alınmış %190 hasarlı tek ok.'},
  {id:'a2',n:'Çoklu Ok',ic:'🏹',br:'atk',lv:3,mp:15,cd:5,k:'multi',m:1,n:5,d:'Yelpaze şeklinde 5 ok atar, her biri %100 hasar.'},
  {id:'a3',n:'Ok Yağmuru',ic:'🌧️',br:'atk',lv:6,mp:30,cd:12,k:'ground',m:2.2,r:120,delay:.7,vis:'arrows',d:'Hedef alana ok yağdırır: %220 alan hasarı.'},
  {id:'a4',n:'Delici Ok',ic:'➶',br:'atk',lv:10,mp:25,cd:9,k:'proj',m:2.8,pierce:true,vis:'bigarrow',spd:720,d:'Yolundaki herkesi delip geçen %280 hasarlı ok.'},
  {id:'a5',n:'Kartal Gözü',ic:'🦅',br:'atk',lv:4,pas:true,mods:{crit:.08,range:40},d:'Pasif: Kritik +%8, menzil +40.'},
  {id:'a6',n:'Ölümcül Nişan',ic:'💀',br:'atk',lv:12,pas:true,mods:{critDmg:.4,atkP:.1},d:'Pasif: Kritik hasarı +%40, saldırı +%10.'},
  {id:'a7',n:'Rüzgar Adımı',ic:'💨',br:'def',lv:1,mp:18,cd:14,k:'buff',dur:6,mods:{spdP:.6,asP:.35},col:'#c8ffe0',d:'6 sn boyunca hareket hızı +%60, saldırı hızı +%35.'},
  {id:'a8',n:'Geri Sıçrama',ic:'↩️',br:'def',lv:3,mp:12,cd:8,k:'blink',back:180,slowR:110,d:'Geriye sıçrar ve yakındaki düşmanları yavaşlatır.'},
  {id:'a9',n:'Zehirli Ok',ic:'🐍',br:'def',lv:6,mp:15,cd:6,k:'strike',m:.8,ranged:true,vis:'arrow',poison:[.4,6],d:'%80 hasar ve 6 sn boyunca zehir.'},
  {id:'a10',n:'Doğanın Şifası',ic:'🌿',br:'def',lv:10,mp:25,cd:25,k:'heal',p:.3,hot:.25,d:'Canının %30\'unu anında, %25\'ini 6 sn içinde yeniler.'},
  {id:'a11',n:'Çeviklik',ic:'🍃',br:'def',lv:4,pas:true,mods:{dodge:.1,spdP:.1},d:'Pasif: Kaçınma +%10, hız +%10.'},
  {id:'a12',n:'Avcı İçgüdüsü',ic:'🐺',br:'def',lv:12,pas:true,mods:{hpP:.12,asP:.1},d:'Pasif: Can +%12, saldırı hızı +%10.'},
],
assassin:[
  {id:'s1',n:'Gizli Bıçak',ic:'🔪',br:'atk',lv:1,mp:8,cd:3,k:'strike',m:1.7,critB:.3,d:'%170 hasarlı hızlı bıçak darbesi, kritik şansı +%30.'},
  {id:'s2',n:'Gölge Adımı',ic:'👤',br:'atk',lv:3,mp:15,cd:8,k:'blink',behind:true,m:1.6,range:330,d:'Hedefin arkasına ışınlanır ve %160 hasar verir.'},
  {id:'s3',n:'Bıçak Fırtınası',ic:'🌪️',br:'atk',lv:6,mp:20,cd:7,k:'aoe',m:1.5,r:90,vis:'spin',d:'Dönerek çevrendeki herkese %150 hasar verir.'},
  {id:'s4',n:'Ölüm İşareti',ic:'☠️',br:'atk',lv:10,mp:30,cd:14,k:'strike',m:3.2,execute:true,d:'%320 hasar. Hedefin canı %30\'un altındaysa hasar iki katı.'},
  {id:'s5',n:'Zehirli Kenar',ic:'🧪',br:'atk',lv:4,pas:true,mods:{poisonHit:.25,critDmg:.15},d:'Pasif: Saldırıların %25 ihtimalle zehirler, kritik hasarı +%15.'},
  {id:'s6',n:'Gölge Ustası',ic:'🌑',br:'atk',lv:12,pas:true,mods:{crit:.12,asP:.1},d:'Pasif: Kritik +%12, saldırı hızı +%10.'},
  {id:'s7',n:'Gölgelere Karış',ic:'🕶️',br:'def',lv:1,mp:20,cd:18,k:'stealth',dur:6,nm:2.5,d:'6 sn görünmez olursun; düşmanlar seni kaybeder. İlk vuruşun %250 kritik.'},
  {id:'s8',n:'Duman Bombası',ic:'💣',br:'def',lv:3,mp:18,cd:14,k:'aoe',m:.3,r:125,stun:2,vis:'smoke',d:'Çevredeki düşmanları 2 sn sersemleten duman.'},
  {id:'s9',n:'Kaçınma',ic:'🌀',br:'def',lv:6,mp:15,cd:15,k:'buff',dur:5,mods:{dodge:.5},col:'#d0d0ff',d:'5 sn boyunca saldırıların yarısından kaçarsın.'},
  {id:'s10',n:'Kan Emici',ic:'🦇',br:'def',lv:10,mp:20,cd:20,k:'buff',dur:8,mods:{lifesteal:.3},heal:.1,col:'#ff5a6a',d:'8 sn boyunca verdiğin hasarın %30\'u kadar can çalarsın.'},
  {id:'s11',n:'Kedi Refleksi',ic:'🐈',br:'def',lv:4,pas:true,mods:{dodge:.12},d:'Pasif: Kaçınma +%12.'},
  {id:'s12',n:'Sinsi',ic:'🦂',br:'def',lv:12,pas:true,mods:{spdP:.15,hpP:.1},d:'Pasif: Hız +%15, can +%10.'},
]};
const SKILL_BY_ID={};for(const c in SKILLS)for(const s of SKILLS[c])SKILL_BY_ID[s.id]=s;

// ================= EŞYALAR =================
const GRADES=[{n:'Sıradan',col:'#c4c4c4',m:1},{n:'Nadir',col:'#b768ff',m:1.5},{n:'Efsanevi',col:'#ffc933',m:2.2}];
const WCOL=['#d5dbe2','#cfa6ff','#ffd65a'];
const UPG=[0,.08,.17,.27,.38,.5,.64,.8,.98,1.2];
const UPG_CHANCE=[100,100,100,88,72,56,40,26,15];
const SLOT_TR={weapon:'Silah',armor:'Zırh',helmet:'Başlık',ring:'Yüzük'};
const STAT_TR={atk:'Saldırı',def:'Savunma',hp:'Can',mp:'Mana',crit:'Kritik',str:'Güç (STR)',dex:'Çeviklik (DEX)',int:'Zeka (INT)',ap:'Saldırı Gücü (AP)'};
const ENCH_POOL={weapon:['str','dex','int','ap','crit'],armor:['hp','mp','def','str','dex','int'],helmet:['hp','mp','def','str','dex','int'],ring:['hp','mp','crit','ap','str','dex','int']};
const PREF=[['Eski','Basit','Demir','Sağlam','Gezgin'],['Keskin','Kurt Dişi','Ay Işığı','Gümüş','Fırtına'],['Ejder','Kadim','Güneş','Efsanevi','Yıldız']];
const BASE={
  weapon:{warrior:['Kılıç','Savaş Kılıcı','Uzun Kılıç'],mage:['Asa','Kristal Asa','Ak Asa'],archer:['Yay','Uzun Yay','Avcı Yayı'],assassin:['İkiz Hançer','Bozkır Kaması','İkiz Bıçak']},
  armor:{warrior:['Plaka Zırh','Göğüs Zırhı'],mage:['Cübbe','Büyücü Cübbesi'],archer:['Deri Yelek','İz Sürücü Yeleği'],assassin:['Gölge Zırhı','Deri Zırh']},
  helmet:{warrior:['Miğfer','Savaş Miğferi'],mage:['Büyücü Külahı','Yıldızlı Külah'],archer:['Kukuleta','Avcı Başlığı'],assassin:['Gölge Peçesi','Gölge Başlığı']},
  ring:{warrior:['Yüzük','Mühür Yüzüğü'],mage:['Yüzük','Mühür Yüzüğü'],archer:['Yüzük','Mühür Yüzüğü'],assassin:['Yüzük','Mühür Yüzüğü']},
};
const ICONS={weapon:{warrior:'⚔️',mage:'🪄',archer:'🏹',assassin:'🗡️'},armor:{warrior:'🛡️',mage:'👘',archer:'🦺',assassin:'🧥'},helmet:{warrior:'⛑️',mage:'🎩',archer:'🧢',assassin:'🎭'},ring:{warrior:'💍',mage:'💍',archer:'💍',assassin:'💍'}};
// ---- Sürüm 30: 10 yuvalı ekipman ----
const EQ_ORDER=['weapon','helmet','necklace','armor','bracers','belt','pants','boots','ring','ring2'];
const DROP_SLOTS=['weapon','weapon','armor','armor','helmet','helmet','ring','ring','necklace','belt','bracers','pants','boots'];
const eqBase=k=>k==='ring2'?'ring':k;
Object.assign(SLOT_TR,{helmet:'Miğfer',armor:'Zırh',necklace:'Kolye',belt:'Kemer',bracers:'Eldiven',pants:'Bacaklık',boots:'Çizme',ring2:'Yüzük'});
(function(){const C4=o=>({warrior:o.w,mage:o.m,archer:o.a,assassin:o.s});
  Object.assign(BASE,{
    necklace:C4({w:['Kolye','Savaş Madalyonu','Kurt Dişi Kolye','Demir Muska'],m:['Tılsım','Rün Kolyesi','Kristal Madalyon','Ay Muskası'],a:['Avcı Kolyesi','Tüy Tılsımı','Nazarlık','Ok Ucu Kolye'],s:['Gölge Muskası','Kemik Kolye','Kara Gerdanlık','Engerek Muskası']}),
    belt:C4({w:['Savaş Kemeri','Demir Kuşak','Plaka Kemer'],m:['İpek Kuşak','Rün Kemeri','Büyücü Kuşağı'],a:['Sadak Kemeri','Deri Kuşak','Avcı Kemeri'],s:['Hançer Kemeri','Gölge Kuşağı','Sargı Kemer']}),
    bracers:C4({w:['Demir Eldiven','Kalkan Eldiveni','Plaka Eldiven'],m:['Rün Bileklik','Büyü Eldiveni','İpek Bileklik'],a:['Okçu Eldiveni','Deri Eldiven','Avcı Bilekliği'],s:['Gölge Eldiveni','Bıçak Eldiveni','Kara Sargı Eldiven']}),
    pants:C4({w:['Zincir Dizlik','Plaka Dizlik','Savaş Dizliği'],m:['Büyücü Şalvarı','İpek Şalvar','Büyü Eteği'],a:['Deri Pantolon','İz Sürücü Pantolonu','Avcı Şalvarı'],s:['Gölge Şalvar','Sessiz Pantolon','Kara Pantolon']}),
    boots:C4({w:['Demir Çizme','Plaka Çizme','Savaş Çizmesi'],m:['Rün Çizmesi','Yıldız Çizmesi','Büyücü Çizmesi'],a:['Avcı Çizmesi','Deri Tozluk','Rüzgâr Çizmesi'],s:['Gölge Çizmesi','Sessiz Adım Çizmesi','Pars Çizmesi']})});
  BASE.ring.warrior.push('Kan Yüzüğü','Aslan Mührü');BASE.ring.mage.push('Rün Yüzüğü','Yıldız Taşı');BASE.ring.archer.push('Şahin Yüzüğü','Yeşim Halka');BASE.ring.assassin.push('Gölge Halkası','Engerek Yüzüğü');
  BASE.armor.warrior.push('Zincir Zırh','Ejder Pulu');BASE.armor.mage.push('Rün Cübbesi','Yıldız Pelerini');BASE.armor.archer.push('Orman Yeleği','Kurt Postu');BASE.armor.assassin.push('Gece Zırhı','Sessiz Yelek');
  BASE.helmet.warrior.push('Boynuzlu Miğfer','Demir Başlık');BASE.helmet.mage.push('Rün Tacı','Yıldız Külahı');BASE.helmet.archer.push('Şahin Başlığı','Orman Kukuletası');BASE.helmet.assassin.push('Kara Maske','Gece Başlığı');
  PREF[0].push('Paslı','Yıpranmış','Tahta','Acemi','Kaba');PREF[1].push('Gölge','Ateş','Buz','Şimşek','Zümrüt','Kan Ay');PREF[2].push('Titan','Ölümsüz','Anka','Kıyamet','Kartal');
  Object.assign(ENCH_POOL,{necklace:['hp','mp','crit','ap','int','str','dex'],belt:['hp','def','str','dex','int'],bracers:['ap','crit','def','str','dex'],pants:['hp','def','dex','str','int','mp'],boots:['def','hp','dex','mp','str']});
  Object.assign(ICONS,{necklace:{},belt:{},bracers:{},pants:{},boots:{}});
})();
// silah çeşitleri (sınıf × kalite) ve adları
const WVAR={warrior:[['Sword','Club','Axe'],['Sword2','Hammer','Lance'],['BigSword','Lance2']],mage:[['Stick','Book'],['MagicWand','Fork'],['MagicWand','Book']],archer:[['Bow'],['Bow2'],['Bow2']],assassin:[['Çatal Hançer','Whip'],['Ay Kılıcı','Rapier'],['Ninjaku','Ay Kılıcı']]};
const WNAME={Sword:'Kılıç',Club:'Gürz',Axe:'Balta',Sword2:'Savaş Kılıcı',Hammer:'Savaş Çekici',Lance:'Mızrak',BigSword:'Uzun Kılıç',Lance2:'Ejder Dişi Mızrak',Stick:'Asa',Book:'Büyü Kitabı',MagicWand:'Kristal Asa',Fork:'Üç Dişli Asa',Bow:'Yay',Bow2:'Uzun Yay',Sai:'Çatal Hançer',Whip:'Kırbaç',Katana:'Ay Kılıcı',Rapier:'Meç',Ninjaku:'Gece Kılıcı'};
const MATS={
  up:{n:'Yükseltme Parşömeni',ic:'📜',col:'#e8d8a0',desc:'Demircide eşyayı +1 basmak için gerekir (+7 ve üstü için 2 tane).',price:60},
  luck:{n:'Şans Parşömeni',ic:'🍀',col:'#7dff9a',desc:'Basma başarı şansını +%15 artırır.',price:350},
  prot:{n:'Koruma Parşömeni',ic:'🛡️',col:'#7fd0ff',desc:'Basma başarısız olursa eşyanın yanmasını önler. Tüccar\'da satılır; Kızıl Sınır ve zindanda da düşer.',price:450},
  ench:{n:'Efsun Parşömeni',ic:'🔮',col:'#d0a0ff',desc:'Eşyaya rastgele ek özellikler katar (STR, DEX, AP, can, kritik...). Eski efsunun yerini alır.',price:160},
};

// ================= CANAVARLAR =================
const ET={
  slime:{name:'Balçık',hp:32,hpL:11,atk:7,atkL:2.4,def:0,defL:.4,spd:60,xp:10,xpL:5,r:13,h:26,range:26,as:1.3,aggro:120,col:'#5cc46a',draw:'slime'},
  wolf:{name:'Kurt',hp:60,hpL:16,atk:11,atkL:3,def:2,defL:.8,spd:125,xp:20,xpL:7,r:15,h:32,range:30,as:1.05,aggro:190,col:'#8a8f99',draw:'wolf'},
  goblin:{name:'Goblin',hp:68,hpL:17,atk:12,atkL:3.1,def:3,defL:.9,spd:105,xp:24,xpL:8,r:12,h:40,range:28,as:1.1,aggro:180,col:'#6f9a3a',draw:'goblin'},
  skeleton:{name:'İskelet',hp:115,hpL:22,atk:17,atkL:3.6,def:5,defL:1.1,spd:88,xp:40,xpL:10,r:13,h:48,range:30,as:1.25,aggro:190,col:'#e8e4d4',draw:'skeleton'},
  imp:{name:'Ateş İfriti',hp:125,hpL:23,atk:19,atkL:4,def:6,defL:1.2,spd:96,xp:55,xpL:12,r:13,h:46,range:210,as:1.8,aggro:250,col:'#ff6a2a',ranged:'efire',draw:'imp'},
  spider:{name:'Mahzen Örümceği',hp:150,hpL:24,atk:22,atkL:4,def:7,defL:1.2,spd:125,xp:60,xpL:12,r:15,h:26,range:30,as:1.0,aggro:220,col:'#6a4a7a',draw:'spider'},
  wraith:{name:'Hayalet',hp:130,hpL:22,atk:24,atkL:4.2,def:5,defL:1,spd:100,xp:65,xpL:12,r:13,h:48,range:200,as:1.7,aggro:260,col:'#9fd8ff',ranged:'ghost',draw:'wraith'},
  golem:{name:'Savaş Golemi',hp:260,hpL:35,atk:30,atkL:5,def:14,defL:1.6,spd:72,xp:110,xpL:16,r:20,h:58,range:40,as:1.6,aggro:200,col:'#8a7a6a',draw:'golem'},
  bloodwolf:{name:'Kan Kurdu',hp:180,hpL:26,atk:28,atkL:4.6,def:9,defL:1.3,spd:145,xp:90,xpL:14,r:16,h:34,range:30,as:.95,aggro:240,col:'#a83030',draw:'wolf',tint:'#7a2626'},
  wolfking:{name:'Kurt Kralı Bozyele',boss:true,hp:1100,atk:30,def:8,spd:130,xp:600,r:24,cr:12,h:52,range:42,as:1.0,aggro:240,col:'#c0c8d0',draw:'wolf',scale:1.7,tint:'#cfd5dd',tele:{cd:7,r:90,m:2,delay:1},resp:120},
  goblinchief:{name:'Goblin Şefi Grukk',boss:true,hp:1600,atk:38,def:10,spd:105,xp:900,r:20,cr:10,h:62,range:42,as:1.2,aggro:240,col:'#6f9a3a',draw:'goblin',scale:1.5,tele:{cd:6.5,r:100,m:2.2,delay:1},resp:130},
  skeletonlord:{name:'İskelet Lordu Morhan',boss:true,hp:2600,atk:48,def:14,spd:90,xp:1500,r:22,cr:11,h:74,range:44,as:1.3,aggro:260,col:'#c8a0ff',draw:'skeleton',scale:1.5,aura:'#a060ff',tele:{cd:6,r:110,m:2.4,delay:1.1},resp:150},
  dragon:{name:'Kızıl Ejder Azdahar',boss:true,hp:5200,atk:62,def:18,spd:75,xp:3500,r:44,cr:22,h:112,range:72,as:1.6,aggro:300,col:'#c0302a',draw:'dragon',tele:{cd:5,r:100,m:2.5,delay:1.1},resp:180},
  varkas:{name:'Lanetli Kral Varkas',boss:true,hp:6000,atk:66,def:20,spd:85,xp:4000,r:26,cr:12,h:84,range:48,as:1.3,aggro:320,col:'#b090ff',draw:'skeleton',scale:1.75,crown:true,aura:'#7040ff',tele:{cd:5,r:115,m:2.6,delay:1},resp:150},
  titan:{name:'Savaş Titanı Korgath',boss:true,hp:11000,atk:85,def:26,spd:72,xp:7000,r:34,cr:16,h:110,range:58,as:1.5,aggro:320,col:'#8a6a50',draw:'golem',scale:1.9,tint:'#7a4a32',tele:{cd:4.5,r:130,m:2.6,delay:1.1},resp:200},
  foe:{name:'Gölge Hanedanı',hp:0,atk:0,def:0,spd:145,xp:0,r:12,cr:8,h:50,range:0,as:1,aggro:280,col:'#ff5050',draw:'hero',pvp:true},
};

// ================= GÖREVLER =================
const QUESTS=[
  {name:'Balçık Belası',type:'slime',count:6,rec:1,loc:[84,82],text:'Hoş geldin yolcu! Çayırdaki balçıklar tarlalarımızı mahvediyor. Köyün hemen çevresindeki 6 balçığı temizler misin?',done:'Harika iş! Tarlalar artık güvende. Al, bunlar işine yarar.',xp:80,gold:60,potHp:3,mats:{up:2}},
  {name:'Uluyan Orman',type:'wolf',count:8,rec:3,loc:[26,58],text:'Batıdaki Uluyan Orman\'dan kurt ulumaları geliyor. Çobanlarımız korkudan sürüleri çıkaramıyor. 8 kurt avla.',done:'Ulumalar azaldı! Demircimiz senin için bir şey hazırladı.',xp:260,gold:120,gear:1,mats:{up:2}},
  {name:'Kurtların Kralı',type:'wolfking',count:1,rec:6,text:'Kurtları yöneten dev bir beyaz kurt var: Bozyele. Ormanın kuzeybatısında, kendi açıklığında yaşıyor. Onu yen!',done:'Bozyele düştü! Al bakalım, bu parşömenlerle silahını demircide basabilirsin.',xp:700,gold:250,mats:{up:3,ench:1}},
  {name:'Goblin Korusu',type:'goblin',count:10,rec:6,loc:[86,92],text:'Güneydoğudaki korudan gelen goblinler kervanlarımızı yağmalıyor! 10 goblini durdur.',done:'Kervanlar yeniden yola çıkabilir. Tüccarlar sana iksir gönderdi.',xp:650,gold:220,potHp:4,potMp:4},
  {name:'Şef Grukk',type:'goblinchief',count:1,rec:8,text:'Goblinlerin şefi Grukk, korunun en güneyindeki kampında saklanıyor. Başını kes ki goblinler dağılsın!',done:'Grukk\'un baltası artık bizim duvarımızda asılı! Bu şans parşömenini sakla, basarken işine yarar.',xp:1100,gold:350,gear:1,mats:{luck:1}},
  {name:'Lanetli Harabeler',type:'skeleton',count:10,rec:9,loc:[108,72],text:'Doğudaki harabelerde ölüler yürüyor. 10 iskeleti sonsuz uykusuna geri gönder.',done:'Harabeler biraz sessizleşti. Ama lanetin kaynağı daha derinde...',xp:1400,gold:400,mats:{up:3,ench:1}},
  {name:'İskelet Lordu',type:'skeletonlord',count:1,rec:12,text:'İskeletlere komuta eden Morhan, harabelerin kuzeyinde mor bir ışıkla parlıyor. Onu yok et!',done:'Morhan toz oldu! Bu eşya ancak bir kahramana yakışır.',xp:2300,gold:600,gear:2},
  {name:'Unutulmuş Mahzen',type:'varkas',count:1,rec:14,map:'mahzen',text:'Lanetin kaynağını buldum: harabelerin doğu ucundaki mahzen kapısı. Aşağıda Lanetli Kral Varkas uyanmış. İn ve onu yen!\n\nİpucu: Zindan karanlıktır, iksirlerini yanına al.',done:'Varkas\'ın laneti kırıldı! Al, bu nadir parşömenler yalnızca derinliklerde bulunur.',xp:4200,gold:900,mats:{luck:2,prot:1}},
  {name:'Ateşin Habercileri',type:'imp',count:10,rec:15,loc:[64,24],text:'Kuzeydeki Ejder Tepesi\'nden ateş ifritleri iniyor. Bu, Kızıl Ejder Azdahar\'ın uyandığı anlamına gelir! 10 ifriti yok et.',done:'İfritler dağıldı. Artık tek bir şey kaldı...',xp:3800,gold:800,mats:{ench:2,up:3}},
  {name:'Azdahar\'ın Sonu',type:'dragon',count:1,rec:18,text:'Artık hazırsın. Ejder Tepesi\'nin zirvesindeki Kızıl Ejder Azdahar\'ı yen ve diyarı kurtar!\n\nİpucu: Yerde kırmızı halka belirince hemen kaç!',done:'İnanamıyorum... Azdahar yenildi! Adın sonsuza dek "Ejderavcı" olarak anılacak!',xp:7000,gold:2000,gear:2,title:'Ejderavcı'},
];
const PVP_QUESTS=[
  {name:'Sınır Nöbeti',type:'foe',count:5,text:'Gölge Hanedanı savaşçıları ovaya yayıldı. 5 tanesini alt et.',honor:60,gold:400,mats:{up:2,prot:1}},
  {name:'Golem Avı',type:'golem',count:8,text:'Ovadaki savaş golemleri çok değerli parçalar taşır. 8 tane parçala.',honor:30,gold:500,mats:{up:3,ench:1}},
  {name:'Titanın Düşüşü',type:'titan',count:1,text:'Ovanın ortasındaki Savaş Titanı Korgath\'ı yıkarsan iki taraf da adını duyar!',honor:200,gold:2500,mats:{luck:2,prot:2},gear:2},
];

// ================= İSİMLER VE SOHBET =================
const BOT_NAMES=['DarkPaladin','NightRaven','IronFang','MysticRose','SilverArrow','FrostMage','StormRider','Lionheart','ShadowStep','PixelKnight','BlazeWolf','MoonWhisper'];
const ALLY_NAMES=['Aurora','Valkyr','Kaiden','SkyBlade','RuneSmith','Seraph','Thorne','Lyric'];
const FOE_NAMES=['DeathBringer','VoidReaper','Nightshade','Grimfang','Venomous','Hexblade','Doomcaller','BloodMoon','Soulrend','Wraithlord','Havoc','Malice'];
const BOT_LINES=['selam millet','kurtlar fena vuruyor dikkat edin','iksir satan var mı?','harabelerde iskelet kasıyorum gelen?','ejderi kesmeye kim gelir?','muhtarın görevleri bol tp veriyor','az önce efsanevi düştü!!','+7 basarken kılıcım yandı ağlıyorum 😭','şans parşömeniyle bastım +8 oldu!!','kızıl sınırda gölgeler çok güçlü bugün','koruma parşömeni sadece sınırda düşüyor biliyorsunuz','titanı kesmeye kalabalık lazım','efsun attım +12 STR geldi','demirci temur +9 için çok pahalı ya','gg','suikastçı görünmezlikle çok sinir bozucu','bu oyun efsane ya'];
const BOT_REPLIES={greet:['selam!','aleyküm selam :)','hoş geldin!','slm','selamlar 👋'],dragon:['ejder kuzeyde, en az 17-18 seviye ol','Azdahar çok sert vuruyor, kırmızı halkadan kaç!'],up:['+6dan sonra şans parşömeni kullan bence','+7 ve üstü yanabiliyor, koruma parşömeni bul','demirci köyde, muhtarın yanında'],help:['muhtar kemal köyde görev veriyor','K tuşu yetenek ağacı, M harita','haritada sarı ok görevin yerini gösteriyor'],gen:['aynen','haha','katılıyorum','hmm','bilmiyorum valla','olabilir','😄','+1']};

// v54: eski kayıtlardaki eşya adları yeni (özgün) adlarla gösterilir
const ITEM_RENAME={"Zincir Don": "Zincir Dizlik", "Savaş Donu": "Savaş Dizliği", "İpek Don": "İpek Şalvar", "Cübbe Etek": "Büyü Eteği", "İz Sürücü Donu": "İz Sürücü Pantolonu", "Sessiz Don": "Sessiz Pantolon", "Plaka Pantolon": "Plaka Dizlik", "Demir Dizlik": "Demir Çizme", "Plaka Bacaklık": "Plaka Çizme", "Rün Çizme": "Rün Çizmesi", "Yıldız Pabucu": "Yıldız Çizmesi", "Rüzgar Pabucu": "Rüzgâr Çizmesi", "Gölge Çizme": "Gölge Çizmesi", "Sessiz Adım": "Sessiz Adım Çizmesi", "Kedi Pabucu": "Pars Çizmesi", "Demir Kolluk": "Demir Eldiven", "Kalkan Bilekli": "Kalkan Eldiveni", "Plaka Kolluk": "Plaka Eldiven", "Büyü Kolluğu": "Büyü Eldiveni", "Okçu Kolluğu": "Okçu Eldiveni", "Deri Bilekli": "Deri Eldiven", "Gölge Bilekli": "Gölge Eldiveni", "Bıçak Kolluğu": "Bıçak Eldiveni", "Kara Sargı": "Kara Sargı Eldiven", "Zehir Şişesi": "Engerek Muskası", "Göğüslük": "Göğüs Zırhı", "Değnek": "Ak Asa", "Hançerler": "İkiz Hançer", "Kamalar": "Bozkır Kaması", "Ninja Başlığı": "Gece Başlığı", "Ninja Kılıcı": "Gece Kılıcı", "Sai": "Çatal Hançer", "Katana": "Ay Kılıcı", "Ejder Mızrağı": "Ejder Dişi Mızrak", "Mühür": "Mühür Yüzüğü", "Şapka": "Büyücü Külahı", "Büyücü Şapkası": "Yıldızlı Külah", "Yıldız Şapkası": "Yıldız Külahı", "Peçe": "Gölge Peçesi", "Köylü": "Gezgin"};
