// Enhanced blockchain-style canvas: DPR scaling, glow, gradient lines, mouse interaction
(function(){
  const canvas = document.getElementById('blockchain-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, particles = [], animationId = null;
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  const COLORS = {
    a: '#22c55e', // bright green
    b: '#15803d'  // darker green
  };

  const config = {
    nodeCount: () => Math.max(18, Math.floor((window.innerWidth * window.innerHeight) / 120000)),
    maxDistance: 180,
    nodeRadius: 2.6,
    lineWidth: 1,
    baseAlpha: 0.12
  };

  const mouse = {x: -9999, y: -9999};

  function setupCanvas(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    width = canvas.clientWidth = window.innerWidth;
    height = canvas.clientHeight = window.innerHeight;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function resize(){
    setupCanvas();
    const target = config.nodeCount();
    while(particles.length < target) particles.push(randomParticle());
    while(particles.length > target) particles.pop();
  }

  function randomParticle(){
    return {
      x: Math.random()*width,
      y: Math.random()*height,
      vx: (Math.random()-0.5) * 0.5,
      vy: (Math.random()-0.5) * 0.5,
      r: config.nodeRadius * (0.8 + Math.random()*0.7),
      phase: Math.random()*Math.PI*2
    };
  }

  function drawGradientLine(x1,y1,x2,y2,alpha){
    const g = ctx.createLinearGradient(x1,y1,x2,y2);
    g.addColorStop(0, hexToRgba(COLORS.a, alpha));
    g.addColorStop(1, hexToRgba(COLORS.b, alpha*0.6));
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
  }

  function hexToRgba(hex, a){
    const m = hex.replace('#','');
    const r = parseInt(m.substring(0,2),16);
    const g = parseInt(m.substring(2,4),16);
    const b = parseInt(m.substring(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function step(){
    ctx.clearRect(0,0,width,height);

    // update & draw nodes
    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.phase += 0.02;
      // soft wrap
      if(p.x < -20) p.x = width + 20;
      if(p.x > width + 20) p.x = -20;
      if(p.y < -20) p.y = height + 20;
      if(p.y > height + 20) p.y = -20;

      // pulsing radius
      const pr = p.r * (1 + 0.18 * Math.sin(p.phase));

      // draw node glow
      ctx.save();
      ctx.fillStyle = COLORS.a;
      ctx.globalAlpha = 0.9;
      ctx.shadowBlur = 12;
      ctx.shadowColor = hexToRgba(COLORS.a, 0.9);
      ctx.beginPath();
      ctx.arc(p.x, p.y, pr, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // draw connections with gradient and glow
    ctx.lineWidth = config.lineWidth;
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx,dy);
        if(dist < config.maxDistance){
          const t = 1 - dist / config.maxDistance;
          const alpha = config.baseAlpha * t * (0.8 + 0.4*Math.sin((a.phase+b.phase)/2));
          ctx.save();
          ctx.lineWidth = 1 + t*1.2;
          ctx.shadowBlur = 8 * t;
          ctx.shadowColor = hexToRgba(COLORS.a, Math.min(0.9, alpha*1.6));
          drawGradientLine(a.x,a.y,b.x,b.y, Math.min(0.9, alpha*1.4));
          ctx.restore();
        }
      }
    }

    // mouse attraction lines
    const mx = mouse.x, my = mouse.y;
    if(mx >=0 && my >=0){
      for(let i=0;i<particles.length;i++){
        const p = particles[i];
        const dx = p.x - mx;
        const dy = p.y - my;
        const d = Math.hypot(dx,dy);
        if(d < config.maxDistance*1.1){
          const t = 1 - d / (config.maxDistance*1.1);
          ctx.save();
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.35 * t;
          ctx.strokeStyle = hexToRgba(COLORS.a, 0.25 * t);
          ctx.beginPath();
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(mx,my);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    animationId = requestAnimationFrame(step);
  }

  function start(){
    if(animationId) return;
    resize();
    animationId = requestAnimationFrame(step);
  }
  function stop(){
    if(animationId) cancelAnimationFrame(animationId);
    animationId = null;
  }

  // pause when tab not visible
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) stop(); else start();
  });

  window.addEventListener('resize', ()=>{
    // throttle resize slightly
    clearTimeout(window.__bgResize);
    window.__bgResize = setTimeout(()=>{
      resize();
    }, 120);
  });

  // mouse tracking
  window.addEventListener('mousemove', (e)=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseout', ()=>{ mouse.x = -9999; mouse.y = -9999; });

  // performance: reduce nodes on small or low-power devices
  function init(){
    if(window.devicePixelRatio && window.devicePixelRatio > 1.5){
      config.maxDistance = 160;
    }
    resize();
    start();
  }

  init();
})();
