(() => {
  const root=document.getElementById('modular-carousel');
  if(!root)return;
  const track=document.getElementById('modular-carousel-track');
  const slides=[...root.querySelectorAll('.modular-slide')];
  const dots=[...root.querySelectorAll('.modular-dot')];
  let current=0,startX=null;
  function go(index){
    current=(index+slides.length)%slides.length;
    track.style.transform='translateX(-'+(current*100)+'%)';
    dots.forEach((dot,i)=>{dot.classList.toggle('is-current',i===current);dot.setAttribute('aria-current',String(i===current));});
    slides.forEach((slide,i)=>{slide.setAttribute('aria-hidden',String(i!==current));});
  }
  root.querySelector('.modular-prev').addEventListener('click',()=>go(current-1));
  root.querySelector('.modular-next').addEventListener('click',()=>go(current+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
  root.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();
      go(current+(e.key==='ArrowRight'?1:-1));
    }
  });
  root.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;},{passive:true});
  root.addEventListener('touchend',e=>{
    if(startX===null)return;
    const delta=e.changedTouches[0].clientX-startX;
    if(Math.abs(delta)>40)go(current+(delta<0?1:-1));
    startX=null;
  },{passive:true});
  go(0);
})();
