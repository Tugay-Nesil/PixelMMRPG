// Netlik + karakter boyutu: dünyadaki kahraman biraz küçültülür (önizleme/portre hariç).
(function(){
  const _dh=window.drawHero;
  window.drawHero=function(x,y,o){
    if(o&&o.s) return _dh.call(this,x,y,o);
    ctx.save();ctx.translate(x,y);ctx.scale(.86,.86);_dh.call(this,0,0,o);ctx.restore();
  };
})();

// Yetenek/iksir düğmeleri: telefonda joystick'e basılıyken ikinci parmakla
// dokunulunca 'click' oluşmayabiliyor -> parmak değdiği an (pointerdown) çalıştır.
(function(){
  const FAST=['sl_s0','sl_s1','sl_s2','sl_ph','sl_pm'];
  function fastify(){
    for(const id of FAST){const el=document.getElementById(id);if(!el||el._fast)continue;
      const fn=el.onclick;if(!fn)continue;el._fast=true;el.onclick=null;el.style.touchAction='none';
      el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.classList.add('pressed');setTimeout(()=>el.classList.remove('pressed'),140);fn.call(el,e);});}
  }
  const _bb=buildBar;buildBar=function(){_bb.apply(this,arguments);fastify();};
  const st=document.createElement('style');st.textContent='.slot.pressed{transform:scale(.9);filter:brightness(1.5)}#actPad,#joy,#atkBtn{touch-action:none}';document.head.appendChild(st);
})();

// İlk girişte: karakter çıplak başlar -> kuşanma ipucu
(function(){
  const _sg=window.startGame;if(typeof _sg!=='function')return;
  window.startGame=function(){const r=_sg.apply(this,arguments);
    setTimeout(()=>{try{if(player&&player.noW&&player.inv&&player.inv.length&&typeof showToast==='function')showToast('Çantandaki silah ve zırhı kuşan!','Çanta (I) → eşyaya tıkla',4);}catch(e){}},1500);return r;};
})();
