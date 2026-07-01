/* ============================================================================
   Edie Fee Tip — CARD BUILDER  (locked rotation, 2026-06-29)
   ----------------------------------------------------------------------------
   WHERE THIS RUNS: paste into the devtools/console of a tab on https://feeedge.com
   (same-origin to /logo-mark.png, and the Higgsfield CloudFront CDN sends CORS so
   the canvas stays untainted and toDataURL works). The sandbox is IP-blocked from
   that CDN (403) and the tool filter blocks returning base64, so the WHOLE image
   pipeline has to happen in the browser. To get finished cards onto disk:
   trigger <a download> (bottom of file). Chrome leaves them as <uuid>.tmp in the
   Downloads folder; if they don't auto-land, move them with Desktop Commander:
     move_file  C:\Users\<user>\Downloads\<uuid>.tmp  ->  ...\edie-persona\<name>.jpg
   ----------------------------------------------------------------------------
   STEP 1 (Higgsfield) for each card you want:
     generate_image  model:soul_2  soul_id:e1ae79e2-efb6-4723-aa1c-0138ca2c3f5b
     aspect_ratio:3:4  count:1  prompt: <SCENES[k].prompt>
     poll job_display -> grab results.rawUrl (CloudFront .png)
   Put the rawUrl into the U{} map below keyed by the scene letter, then run.
   ============================================================================ */

const EM='#2ee6a6', WHITE='#f4f7f6', BG='#07100c', INK='rgba(6,17,12,0.97)';
const W=1080, H=1350;

/* ---- ROTATION: 6 locked looks. Cycle so no two consecutive posts share a
   scene OR a layout. Layouts: left | right | panel | bar | center. ---- */
const SCENES = {
  B: { name:'cafe',     layout:'bar',    anchor:'cover', zoom:1.04,
       prompt:"Edie, a friendly nerdy-cute young woman with long blonde hair, wearing a casual denim jacket over a dark tee, sitting by a large cafe window with soft warm daylight, holding a coffee cup. Candid close-up, caught mid-laugh looking slightly off camera, cozy blurred cafe interior, warm natural lighting with a subtle emerald accent, shallow depth of field, crisp lifestyle editorial photography." },
  C: { name:'studio',   layout:'right',  anchor:'left',  zoom:1.05,
       prompt:"Edie, a friendly nerdy-cute young woman with long blonde hair, wearing a fitted charcoal blazer over an emerald top, arms crossed, standing in a clean minimalist studio with a deep dark teal-black seamless background and soft emerald rim lighting. Confident relaxed smile looking straight at the camera, positioned on the left side of the frame with clean negative space on the right, crisp high-end fashion photography, shallow depth of field." },
  D: { name:'window',   layout:'panel',  anchor:'right', zoom:1.04,
       prompt:"Edie, a friendly nerdy-cute young woman with long blonde hair, wearing a cream knit cardigan, standing by a large bright window with soft natural daylight flooding in, airy minimalist room with light walls. Looking at the camera with a warm relaxed smile, positioned on the right side of the frame with clean bright negative space on the left, high-key crisp editorial photography, shallow depth of field." },
  E: { name:'home',     layout:'left',   anchor:'right', zoom:1.05,
       prompt:"Edie, a friendly nerdy-cute young woman with long blonde hair, wearing a soft charcoal hoodie, sitting cross-legged on a cozy couch with a laptop, warm lamp light, blurred homey living room with plants in the background. Candid relaxed smile looking at the camera, positioned on the right side of the frame with negative space on the left, warm natural lighting with a subtle emerald accent, crisp lifestyle UGC photography, shallow depth of field." },
  F: { name:'rooftop',  layout:'center', anchor:'cover', zoom:1.05,
       prompt:"Edie, a friendly nerdy-cute young woman with long blonde hair, wearing a casual olive jacket, chest-up medium shot on a city rooftop at blue hour with softly blurred city lights and a deep teal-blue dusk sky behind her, subtle emerald accent light. She fills most of the frame with her face in the upper third and minimal sky above, looking straight at the camera with a confident warm smile, cinematic lifestyle photography, shallow depth of field." },
  G: { name:'bookshelf',layout:'right',  anchor:'left',  zoom:1.05,
       prompt:"Edie, a friendly nerdy-cute young woman with long blonde hair and stylish glasses, wearing a smart-casual charcoal blazer, in a warm home office with a softly blurred bookshelf behind her. Bright soft key light clearly illuminating her face and upper body so she stands out, subtle emerald accent. Friendly knowledgeable smile looking straight at the camera, positioned on the left side of the frame with clean negative space on the right, crisp editorial photography, shallow depth of field." }
};

/* ---- paste the Higgsfield rawUrls here, keyed by scene letter ---- */
const U = {
  /* B:"https://.../hf_..._B.png", C:"...", ... */
  logo: location.origin + "/logo-mark.png"
};

const load=(src)=>new Promise((res,rej)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=()=>rej(new Error('ERR '+src));im.src=src;});
function makeSprite(img){const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data;let mnX=c.width,mnY=c.height,mxX=0,mxY=0;for(let i=0;i<p.length;i+=4){const g=p[i+1];let a=Math.max(0,Math.min(255,(g-55)*2));p[i+3]=a;if(a>30){const px=(i/4)%c.width,py=Math.floor((i/4)/c.width);if(px<mnX)mnX=px;if(px>mxX)mxX=px;if(py<mnY)mnY=py;if(py>mxY)mxY=py;}}x.putImageData(d,0,0);const bw=mxX-mnX+1,bh=mxY-mnY+1;const s=document.createElement('canvas');s.width=bw;s.height=bh;s.getContext('2d').drawImage(c,mnX,mnY,bw,bh,0,0,bw,bh);return s;}
function wrap(ctx,t,mw){const ws=t.split(' ');const ls=[];let l='';for(const w of ws){const s=l?l+' '+w:w;if(ctx.measureText(s).width>mw&&l){ls.push(l);l=w;}else l=s;}if(l)ls.push(l);return ls;}
function anchor(ctx,img,a,z){const iw=img.naturalWidth,ih=img.naturalHeight,s=Math.max(W/iw,H/ih)*z,dw=iw*s,dh=ih*s;let dx=a==='right'?(W-dw):a==='left'?0:(W-dw)/2;ctx.drawImage(img,dx,0,dw,dh);}
function autohead(ctx,lines,mw,start){let fs=start;ctx.font='800 '+fs+'px Arial';while(lines.some(l=>ctx.measureText(l).width>mw)){fs-=4;ctx.font='800 '+fs+'px Arial';}return fs;}

let SPRITE; /* set after logo loads */
function footL(ctx,x){const lh=58,lw=SPRITE.width*(lh/SPRITE.height);ctx.drawImage(SPRITE,x,H-58-lh+6,lw,lh);ctx.font='700 38px Arial';ctx.fillStyle=WHITE;ctx.textAlign='left';ctx.fillText('feeedge.com',x+lw+16,H-58);}
function footR(ctx,x){const lh=58,lw=SPRITE.width*(lh/SPRITE.height);ctx.font='700 38px Arial';ctx.fillStyle=WHITE;ctx.textAlign='right';ctx.fillText('feeedge.com',x,H-58);const tw=ctx.measureText('feeedge.com').width;ctx.drawImage(SPRITE,x-tw-lw-16,H-58-lh+6,lw,lh);}
function footC(ctx){const lh=54,lw=SPRITE.width*(lh/SPRITE.height);ctx.font='700 36px Arial';ctx.fillStyle=WHITE;ctx.textAlign='left';const tw=ctx.measureText('feeedge.com').width;const tot=lw+14+tw;const sx=(W-tot)/2;ctx.drawImage(SPRITE,sx,H-54-lh+6,lw,lh);ctx.fillText('feeedge.com',sx+lw+14,H-54);}
function badgeAt(ctx,text,cx,mode){ctx.font='800 26px Arial';const tw=ctx.measureText(text).width,padX=22,bw=tw+padX*2;let bx=mode==='left'?cx:mode==='right'?cx-bw:cx-bw/2;ctx.strokeStyle=EM;ctx.lineWidth=2;ctx.fillStyle='rgba(46,230,166,0.14)';const r=27;ctx.beginPath();ctx.moveTo(bx+r,70);ctx.arcTo(bx+bw,70,bx+bw,124,r);ctx.arcTo(bx+bw,124,bx,124,r);ctx.arcTo(bx,124,bx,70,r);ctx.arcTo(bx,70,bx+bw,70,r);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=EM;ctx.textAlign='left';ctx.fillText(text,bx+padX,106);}

/* cfg: {img, anchor, zoom, layout, badge:"EDIE'S FEE TIP", head:[2 lines], body} */
function card(cfg){
 const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
 ctx.fillStyle=BG;ctx.fillRect(0,0,W,H);
 anchor(ctx,cfg.img,cfg.anchor,cfg.zoom||1.05);
 const L=cfg.layout;
 if(L==='panel'){
   const PW=400;const g=ctx.createLinearGradient(PW,0,PW+170,0);g.addColorStop(0,INK);g.addColorStop(1,'rgba(6,17,12,0)');
   ctx.fillStyle=INK;ctx.fillRect(0,0,PW,H);ctx.fillStyle=g;ctx.fillRect(PW,0,170,H);
   ctx.fillStyle=EM;ctx.fillRect(PW-5,0,5,H);
   badgeAt(ctx,cfg.badge,52,'left');
   const fs=autohead(ctx,cfg.head,300,84);ctx.fillStyle=EM;ctx.textAlign='left';let y=430;cfg.head.forEach(l=>{ctx.fillText(l,52,y);y+=fs*1.05;});
   ctx.fillStyle=EM;ctx.fillRect(54,y-fs*0.55,120,7);y+=44;
   ctx.font='600 34px Arial';ctx.fillStyle=WHITE;wrap(ctx,cfg.body,300).forEach(l=>{ctx.fillText(l,52,y);y+=46;});
   footL(ctx,52);
 } else if(L==='left'||L==='right'){
   const dir=L==='left';const g=dir?ctx.createLinearGradient(0,0,W,0):ctx.createLinearGradient(W,0,0,0);g.addColorStop(0,'rgba(7,16,12,0.96)');g.addColorStop(0.55,'rgba(7,16,12,0.82)');g.addColorStop(0.8,'rgba(7,16,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   ctx.fillStyle='rgba(7,16,12,0.5)';ctx.fillRect(0,0,W,160);ctx.fillRect(0,H-200,W,200);
   badgeAt(ctx,cfg.badge,dir?60:W-60,dir?'left':'right');
   const fs=autohead(ctx,cfg.head,560,112);ctx.save();ctx.shadowColor='rgba(0,0,0,0.55)';ctx.shadowBlur=18;ctx.fillStyle=EM;ctx.textAlign=dir?'left':'right';let y=470;const hx=dir?60:W-60;cfg.head.forEach(l=>{ctx.fillText(l,hx,y);y+=fs*1.02;});ctx.restore();
   ctx.fillStyle=EM;ctx.fillRect(dir?62:W-60-150,y-fs*0.55,150,8);y+=44;
   ctx.save();ctx.shadowColor='rgba(0,0,0,0.55)';ctx.shadowBlur=10;ctx.font='600 40px Arial';ctx.fillStyle=WHITE;ctx.textAlign=dir?'left':'right';wrap(ctx,cfg.body,500).forEach(l=>{ctx.fillText(l,hx,y);y+=54;});ctx.restore();
   dir?footL(ctx,60):footR(ctx,W-60);
 } else if(L==='bar'){
   const barTop=H*0.56;let g=ctx.createLinearGradient(0,barTop-120,0,H);g.addColorStop(0,'rgba(7,16,12,0)');g.addColorStop(0.25,'rgba(7,16,12,0.86)');g.addColorStop(1,'rgba(7,16,12,0.96)');ctx.fillStyle=g;ctx.fillRect(0,barTop-120,W,H-barTop+120);
   ctx.fillStyle=EM;ctx.fillRect(0,barTop-4,W,3);ctx.fillStyle='rgba(7,16,12,0.45)';ctx.fillRect(0,0,W,160);
   badgeAt(ctx,cfg.badge,60,'left');
   const fs=autohead(ctx,cfg.head,960,84);ctx.save();ctx.shadowColor='rgba(0,0,0,0.55)';ctx.shadowBlur=14;ctx.fillStyle=EM;ctx.textAlign='left';let y=barTop+96;cfg.head.forEach(l=>{ctx.fillText(l,60,y);y+=fs*1.04;});ctx.restore();
   ctx.fillStyle=EM;ctx.fillRect(62,y-fs*0.5,150,8);y+=40;
   ctx.font='600 38px Arial';ctx.fillStyle=WHITE;ctx.textAlign='left';wrap(ctx,cfg.body,940).forEach(l=>{ctx.fillText(l,60,y);y+=50;});
   footL(ctx,60);
 } else if(L==='center'){
   const g=ctx.createLinearGradient(0,H*0.34,0,H);g.addColorStop(0,'rgba(7,16,12,0)');g.addColorStop(0.42,'rgba(7,16,12,0.85)');g.addColorStop(1,'rgba(7,16,12,0.97)');ctx.fillStyle=g;ctx.fillRect(0,H*0.34,W,H*0.66);
   ctx.fillStyle='rgba(7,16,12,0.4)';ctx.fillRect(0,0,W,150);
   badgeAt(ctx,cfg.badge,W/2,'center');
   const fs=autohead(ctx,cfg.head,860,104);ctx.save();ctx.shadowColor='rgba(0,0,0,0.6)';ctx.shadowBlur=18;ctx.fillStyle=EM;ctx.textAlign='center';let y=H*0.585;cfg.head.forEach(l=>{ctx.fillText(l,W/2,y);y+=fs*1.04;});ctx.restore();
   ctx.fillStyle=EM;ctx.fillRect(W/2-75,y-fs*0.5,150,8);y+=46;
   ctx.save();ctx.shadowColor='rgba(0,0,0,0.55)';ctx.shadowBlur=10;ctx.font='600 38px Arial';ctx.fillStyle=WHITE;ctx.textAlign='center';wrap(ctx,cfg.body,820).forEach(l=>{ctx.fillText(l,W/2,y);y+=50;});ctx.restore();
   footC(ctx);
 }
 return c;
}

/* render({ K:{scene:'D', head:['know your','real cost'], body:'...' }, ... })
   downloads one jpg per entry, named edie-<scene>.jpg */
async function render(jobs){
  const IM={}; for(const k of Object.keys(U)) IM[k]=await load(U[k]);
  SPRITE=makeSprite(IM.logo);
  for(const key of Object.keys(jobs)){
    const j=jobs[key]; const sc=SCENES[j.scene];
    const cv=card({img:IM[j.scene], anchor:sc.anchor, zoom:sc.zoom, layout:sc.layout, badge:"EDIE'S FEE TIP", head:j.head, body:j.body});
    const a=document.createElement('a'); a.href=cv.toDataURL('image/jpeg',0.92); a.download='edie-'+sc.name+'.jpg';
    document.body.appendChild(a); a.click(); a.remove(); await new Promise(r=>setTimeout(r,500));
  }
}
/* Example:
   U.D = "https://...rawUrl.png";
   render({ D:{scene:'D', head:['know your','real cost'], body:'fees, funding and spreads stack up differently on every venue. the total is the only number that matters.'} });
*/
