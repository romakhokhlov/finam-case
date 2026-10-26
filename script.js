'use strict';
document.querySelectorAll('img').forEach(image => image.addEventListener('error',()=>image.classList.add('asset-unavailable')));
const modularCarousel=document.querySelector('[data-modular-carousel]');
if(modularCarousel){
  const track=modularCarousel.querySelector('.modular-carousel-track');
  const slides=Array.from(modularCarousel.querySelectorAll('.modular-slide'));
  const dots=Array.from(modularCarousel.querySelectorAll('.modular-dot'));
  let active=0, startX=null;
  function render(){track.style.transform=`translateX(-${active*100}%)`;dots.forEach((dot,i)=>{dot.classList.toggle('is-current',i===active);dot.setAttribute('aria-current',String(i===active));});slides.forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i!==active)));}
  function go(i){active=(i+slides.length)%slides.length;render();}
  modularCarousel.querySelector('.modular-prev').addEventListener('click',()=>go(active-1));
  modularCarousel.querySelector('.modular-next').addEventListener('click',()=>go(active+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
  modularCarousel.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(active+1);if(e.key==='ArrowLeft')go(active-1);});
  modularCarousel.addEventListener('touchstart',e=>{startX=e.touches[0].clientX},{passive:true});
  modularCarousel.addEventListener('touchend',e=>{if(startX===null)return;const delta=e.changedTouches[0].clientX-startX;if(Math.abs(delta)>40)go(active+(delta<0?1:-1));startX=null;},{passive:true});
  render();
}
