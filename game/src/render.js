import { WORLD } from './world.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const buildings=['#e4b979','#d9a86c','#c88660','#eee0bf','#9fc4b5','#d6c898','#d98a6f','#afc3c7'];
function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
export function createRenderer(canvas){
 const c=canvas.getContext('2d');let dpr=1,w=1,h=1,scale=1,cx=0,cy=0;
 function resize(){dpr=Math.min(2,devicePixelRatio||1);w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;scale=Math.min(w/1280,h/720);}
 window.addEventListener('resize',resize);resize();
 function text(t,x,y,size,color='#fff',align='left',weight=600){c.font=`${weight} ${size}px Inter,system-ui,sans-serif`;c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=color;c.fillText(t,x,y);}
 function worldMap(s,camera){
  c.fillStyle='#d0bb89';c.fillRect(0,0,WORLD.w,WORLD.h);
  c.fillStyle='#6db8b5';c.fillRect(2300,0,100,1800);c.fillStyle='#e8d69e';c.fillRect(2220,0,80,1800);
  // A long civic promenade, parks, and a harbor approach.
  for(let row=0;row<4;row++)for(let col=0;col<5;col++){
   const x=170+col*472,y=155+row*472;
   if((row===1&&col===1)||(row===2&&col===3)){c.fillStyle='#85aa76';roundRect(c,x,y,360,360,28);c.fill();c.fillStyle='#75966c';for(let k=0;k<12;k++){c.beginPath();c.arc(x+36+(k*73)%285,y+28+(k*101)%290,7+k%4,0,Math.PI*2);c.fill();}c.fillStyle='#d8ccab';c.fillRect(x+25,y+174,310,10);continue;}
   c.fillStyle='#c9b687';roundRect(c,x-8,y-7,376,376,9);c.fill();
   for(let r=0;r<2;r++)for(let q=0;q<2;q++){
    const bx=x+18+q*166,by=y+16+r*166,bw=150+(randColor(row,col,r,q)*14),bh=145;
    c.fillStyle='rgba(79,61,44,.13)';roundRect(c,bx+8,by+9,bw,bh,5);c.fill();
    c.fillStyle=buildings[(row*3+col+r+q*2)%buildings.length];roundRect(c,bx,by,bw,bh,5);c.fill();
    c.fillStyle='rgba(255,242,204,.45)';for(let wx=0;wx<4;wx++)for(let wy=0;wy<3;wy++)c.fillRect(bx+16+wx*31,by+17+wy*35,9,13);
    c.fillStyle='rgba(127,77,48,.2)';c.fillRect(bx+8,by+bh-8,bw-16,4);
   }
   // shade canopies on corners
   for(let k=0;k<4;k++){const tx=x+45+(k%2)*260,ty=y+47+Math.floor(k/2)*260;c.fillStyle='#43796f';c.beginPath();c.arc(tx,ty,18,0,Math.PI*2);c.fill();c.fillStyle='#6d9a73';c.beginPath();c.arc(tx-3,ty-4,12,0,Math.PI*2);c.fill();}
  }
  // roads run in a legible grid with sidewalks, center lane dashes and crosswalks.
  for(let i=0;i<5;i++){const y=112+i*472;c.fillStyle='#d8c398';c.fillRect(0,y-11,WORLD.w,134);c.fillStyle='#656864';c.fillRect(0,y,WORLD.w,112);c.fillStyle='#efd998';for(let x=10;x<WORLD.w;x+=54)c.fillRect(x,y+54,28,3);for(let x=80;x<2300;x+=472){c.fillStyle='rgba(255,255,255,.48)';for(let k=0;k<6;k++)c.fillRect(x+k*12,y+7,6,19);}}
  for(let i=0;i<6;i++){const x=112+i*472;c.fillStyle='#d8c398';c.fillRect(x-11,0,134,WORLD.h);c.fillStyle='#656864';c.fillRect(x,0,112,WORLD.h);c.fillStyle='#efd998';for(let y=12;y<WORLD.h;y+=54)c.fillRect(x+54,y,3,28);}
  // plaza and marina foreground accents
  c.fillStyle='#b5d0bd';c.fillRect(960,1375,470,110);c.fillStyle='#75aaa4';for(let k=0;k<8;k++){c.fillRect(2245+k%2*18,160+k*190,54,7);}
 }
 function randColor(a,b,d,e){return ((a*7+b*13+d*5+e*3)%11)/11;}
 function drawCar(car,police=false){c.save();c.translate(car.x,car.y);c.rotate(car.angle);c.fillStyle='rgba(18,30,35,.3)';roundRect(c,-23,-10,51,26,7);c.fill();c.fillStyle=police?'#f3f0e4':car.color;roundRect(c,-25,-13,50,26,7);c.fill();c.fillStyle=police?'#334c65':'#456d78';roundRect(c,-10,-10,21,20,5);c.fill();c.fillStyle='rgba(235,246,218,.7)';c.fillRect(17,-9,5,6);c.fillRect(17,4,5,6);c.fillStyle='#51483b';c.fillRect(-20,-15,11,4);c.fillRect(8,-15,11,4);c.fillRect(-20,11,11,4);c.fillRect(8,11,11,4);if(police){c.fillStyle='#ec665b';c.fillRect(-2,-15,5,4);c.fillStyle='#4ca2cf';c.fillRect(3,-15,5,4);}c.restore();}
 function drawPerson(p,player=false,time=0){c.save();c.translate(p.x,p.y);if(!player)c.rotate(p.angle);c.fillStyle='rgba(50,49,38,.24)';c.beginPath();c.ellipse(1,8,7,4,0,0,6.3);c.fill();c.fillStyle=player?'#f2eee2':['#e96e58','#2b7580','#deae54','#615f83'][Math.floor((p.phase||time)*3)%4];c.beginPath();c.arc(0,0,player?7:6,0,6.3);c.fill();c.fillStyle='#543e34';c.beginPath();c.arc(0,-6,3,0,6.3);c.fill();if(player){c.fillStyle='#f3d56e';c.beginPath();c.arc(0,0,10,0,6.3);c.strokeStyle='#fff0aa';c.lineWidth=2;c.stroke();}c.restore();}
 function drawStash(a,time){c.save();c.translate(a.x,a.y);const pulse=1+Math.sin(time*4+a.value)*.12;c.globalAlpha=.92;c.fillStyle='rgba(255,217,112,.18)';c.beginPath();c.arc(0,0,20*pulse,0,6.3);c.fill();c.rotate(time*.45);c.fillStyle='#f4d26d';c.beginPath();c.moveTo(0,-9);c.lineTo(8,0);c.lineTo(0,9);c.lineTo(-8,0);c.closePath();c.fill();c.restore();}
 function minimap(s){const x=1002,y=23,ww=250,hh=158;c.fillStyle='rgba(9,24,31,.78)';roundRect(c,x,y,ww,hh,12);c.fill();c.save();c.beginPath();c.rect(x+9,y+9,ww-18,hh-18);c.clip();c.translate(x+9,y+9);c.scale((ww-18)/WORLD.w,(hh-18)/WORLD.h);c.fillStyle='#cfbd91';c.fillRect(0,0,WORLD.w,WORLD.h);c.fillStyle='#65807c';for(let i=0;i<5;i++)c.fillRect(0,112+i*472,WORLD.w,112);for(let i=0;i<6;i++)c.fillRect(112+i*472,0,112,WORLD.h);c.fillStyle='#55aaa9';c.fillRect(2300,0,100,1800);c.strokeStyle='rgba(249,211,119,.82)';c.lineWidth=13;c.setLineDash([24,16]);const goal=s.story===0?s.mara:s.story===1?s.drop:null;if(goal){c.beginPath();c.moveTo(s.player.x,s.player.y);c.lineTo(goal.x,goal.y);c.stroke();}c.setLineDash([]);s.pickups.forEach(a=>{if(!a.found){c.fillStyle='#f4d26d';c.fillRect(a.x-20,a.y-20,40,40);}});c.fillStyle='#315c79';s.cars.forEach(a=>c.fillRect(a.x-18,a.y-12,36,24));c.fillStyle='#f4e7a1';s.police.forEach(a=>{c.beginPath();c.arc(a.x,a.y,36,0,6.3);c.fill();});if(goal){c.fillStyle='#f4d26d';c.beginPath();c.arc(goal.x,goal.y,46,0,6.3);c.fill();}c.fillStyle='#ff6658';c.beginPath();c.arc(s.player.x,s.player.y,57,0,6.3);c.fill();c.restore();c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=1;c.strokeRect(x+9,y+9,ww-18,hh-18);text('VICE COAST  ·  GOLD: JOB',x+16,y+20,9,'#b6d5cc','left',800);}
 function drawHud(s){const p=s.player;c.fillStyle='rgba(12,25,31,.82)';roundRect(c,24,22,338,108,14);c.fill();text('SOL REYES',44,49,12,'#b4c7c0','left',800);text('$'+p.cash.toLocaleString(),44,78,26,'#f4dc92','left',750);text('HEALTH',44,105,10,'#b4c7c0','left',700);c.fillStyle='#2b454a';roundRect(c,104,93,158,12,6);c.fill();c.fillStyle=p.health<35?'#ef6859':'#77c28f';roundRect(c,104,93,158*p.health/100,12,6);c.fill();text('SUNLINE · 4:38 PM',343,108,10,'#d6d0b6','right',600);
  if(s.heat>0){text('WANTED',1148,214,12,'#ffd0b9','right',800);for(let i=0;i<5;i++)text('✦',1162+i*19,238,18,i<s.heat?'#ff755e':'#5c6968','center',700);}
  c.fillStyle='rgba(14,29,35,.9)';roundRect(c,24,570,510,110,14);c.fill();c.fillStyle='#eebf66';c.fillRect(24,590,3,52);text(s.missionDone?'THE SUNLINE JOB  /  COMPLETE':'THE SUNLINE JOB  /  STORY',44,595,10,'#e8bd72','left',800);text(s.missionText,44,625,19,'#fff6df','left',700);text(s.story===0?'MARINA · EAST DISTRICT':'LIGHTHOUSE · SOUTH SHORE',44,650,10,'#a9c6bc','left',600);
  const unclaimed=s.pickups.filter(a=>!a.found).length;text(`${unclaimed} COAST STASH${unclaimed===1?'':'ES'}`,990,201,9,'#f3d98d','right',750);
  if(s.toastTime>0){c.fillStyle='rgba(19,37,42,.92)';roundRect(c,390,30,500,48,12);c.fill();text(s.toast,640,60,15,'#fff0cd','center',650);}
  if(p.inCar>=0){c.fillStyle='rgba(13,28,34,.8)';roundRect(c,24,145,175,52,12);c.fill();text('ROADSTER  ·  '+Math.round(Math.abs(s.cars[p.inCar].speed))+' MPH',42,177,12,'#fff1d7','left',750);}
  minimap(s);text('WASD move / drive   E enter / exit   F fire   SHIFT sprint   P pause',640,706,11,'rgba(255,255,255,.72)','center',550);
 }
 function panel(title,sub,rows){c.fillStyle='rgba(7,20,27,.60)';c.fillRect(0,0,1280,720);c.fillStyle='rgba(12,29,36,.95)';roundRect(c,340,115,600,490,22);c.fill();c.strokeStyle='rgba(242,212,153,.28)';c.lineWidth=1;c.stroke();c.fillStyle='#efc46f';c.fillRect(375,151,45,3);text('A SUNLINE STORY',375,181,11,'#b8c8bb','left',800);text(title,375,239,48,'#fff5de','left',800);text(sub,375,277,16,'#bdd0c7','left',500);rows.forEach((r,i)=>text(r,375,338+i*31,15,i===rows.length-1?'#f1cc78':'#e2e4d5','left',i===rows.length-1?700:500));}
 function draw(game){const s=game.state,p=s.player;const camX=clamp(p.x-640,0,WORLD.w-1280),camY=clamp(p.y-360,0,WORLD.h-720);c.setTransform(dpr*scale,0,0,dpr*scale,(w-1280*scale)*dpr/2,(h-720*scale)*dpr/2);c.fillStyle='#b8a478';c.fillRect(0,0,1280,720);c.save();c.translate(-camX,-camY);worldMap(s,{x:camX,y:camY});
   // landmarks
   c.fillStyle='#f4e4b1';roundRect(c,1152,1510,92,70,10);c.fill();text('MARINA',1198,1552,11,'#436361','center',800);c.fillStyle='#fae6aa';c.beginPath();c.arc(2160,1660,29,0,6.3);c.fill();c.fillStyle='#e18459';c.fillRect(2155,1638,10,30);c.fillStyle='#f5e3b2';text('LIGHTHOUSE',2160,1705,10,'#345d5f','center',800);
   const goal=s.story===0?s.mara:s.story===1?s.drop:null;if(goal){const pulse=22+Math.sin(s.clock*3)*5;c.strokeStyle='#f7d175';c.lineWidth=3;c.beginPath();c.arc(goal.x,goal.y,pulse,0,6.3);c.stroke();c.fillStyle='rgba(245,204,104,.16)';c.beginPath();c.arc(goal.x,goal.y,pulse+8,0,6.3);c.fill();}
   s.pickups.forEach(a=>{if(!a.found)drawStash(a,s.clock);});s.cars.forEach((a,i)=>drawCar(a));s.people.forEach(a=>{if(a.alive)drawPerson(a,false,s.clock);});s.police.forEach(a=>{drawCar(a,true);const flash=(Math.floor(s.clock*5)%2===0);c.fillStyle=flash?'rgba(255,85,75,.22)':'rgba(73,174,224,.2)';c.beginPath();c.arc(a.x,a.y,29,0,6.3);c.fill();});s.shots.forEach(b=>{c.fillStyle='#ffe48c';c.beginPath();c.arc(b.x,b.y,4,0,6.3);c.fill();});if(p.inCar<0){if(p.invuln<=0||Math.floor(s.clock*14)%2===0)drawPerson(p,true,s.clock);}c.restore();
   drawHud(s);if(s.screen==='title')panel('VICE COAST','A sunlit city. One risky favor. Your call.', ['SOL REYES  ·  freelance wheelwoman','Mara has a package at the marina. The lighthouse is waiting.','Three hidden coast stashes reward exploring side streets.','WASD move / drive  ·  E enter / exit  ·  Mouse aim + F fire','H clinic ($50)  ·  P pause  ·  progress saves on this device','PRESS ENTER OR CLICK TO BEGIN']);if(s.screen==='paused')panel('PAUSED','The coast can wait.', ['Your position, cash and discoveries are saved on this device.','Press P or ENTER to return to the city.','ESC returns to the title.']);if(s.screen==='title'||s.screen==='paused'){c.fillStyle='rgba(8,20,26,.16)';c.fillRect(0,0,1280,720);}
 }
 return {draw,resize};
}
