export const WORLD = { w: 2400, h: 1800, road: 112, block: 360, step: 472 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const rand = (n) => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function makeWorld() {
  const player = { x: 1170, y: 894, angle: 0, health: 100, cash: 240, inCar: -1, invuln: 0 };
  const cars = [], people = [], police = [], shots = [], pickups = [
    { x: 660, y: 676, value: 75, label: 'Pier tip', found: false },
    { x: 1684, y: 1120, value: 125, label: 'Canal market', found: false },
    { x: 2145, y: 1450, value: 200, label: 'Lighthouse road', found: false },
  ];
  let id = 0;
  for (let row=0; row<4; row++) for (let col=0; col<5; col++) {
    const cx=170+col*472, cy=155+row*472;
    for (let k=0;k<3;k++) {
      const x = cx + 36 + rand(id+1)*284, y=cy+34+rand(id+7)*292;
      people.push({x,y,angle:rand(id+2)*6.28,pace:18+rand(id+5)*22,phase:rand(id+9)*8,alive:true}); id++;
    }
  }
  for(let i=0;i<26;i++) {
    const horizontal=i%2===0, lane=horizontal?Math.floor(i/2)%4:Math.floor(i/2)%5;
    const c={x:horizontal?rand(i+90)*WORLD.w:112+lane*472+(i%3?80:25), y:horizontal?112+lane*472+(i%3?80:25):rand(i+30)*WORLD.h,
      angle:horizontal?(i%4<2?0:Math.PI):(i%4<2?Math.PI/2:-Math.PI/2), speed:36+rand(i+3)*34, color:['#ef6f58','#e9d49d','#43a6a6','#4b6481','#c7c5bb','#d99a3b'][i%6], type:i%5===0?'van':'car', driver:true, stolen:false, bump:0}; cars.push(c);
  }
  // Stable procedural offsets keep each caller on a different block while preserving reproducible offline saves.
  const callSpot=(seed,roadX,roadY)=>({x:clamp(roadX+18+rand(seed)*66,20,WORLD.w-20),y:clamp(roadY+18+rand(seed+3)*66,20,WORLD.h-20)});
  const stranded=callSpot(41,112+472,112+472),medical=callSpot(53,112+472*3,112+472*2),witness=callSpot(67,112+472*4,112+472*3);
  const dispatchCalls=[
    {id:'stranded',name:'Stranded driver',brief:'Jump-start the stranded driver',kind:'service',...stranded,marker:'#f3c866',payout:180,cooldown:60,deadline:75},
    {id:'medical',name:'Medical pickup',brief:'Reach the injured caller',kind:'medical',...medical,pickup:{x:medical.x+78,y:medical.y},marker:'#77d6c2',payout:260,cooldown:75,deadline:90},
    {id:'witness',name:'Street race witness',brief:'Stay with the witness for 12 seconds',kind:'witness',...witness,marker:'#f08b69',payout:320,cooldown:90,deadline:70},
  ];
  const state={player,cars,people,police,shots,pickups,dispatch:{calls:dispatchCalls,active:null,cooldowns:{},completed:{}},heat:0,heatTimer:0,policeEvaded:false,story:0,missionText:'Find Mara at the marina',missionDone:false,clock:0,toast:'',toastTime:0,paused:false,screen:'title',seed:1,highContrast:false,pulseCooldown:0,pulseTime:0,pulseTarget:null};
  state.anchor={x:1196,y:1550}; state.drop={x:2160,y:1660}; state.mara={x:1975,y:860};
  state.courier={phase:'ready',startedAt:0,elapsed:0,best:0,reward:0,checkpoint:0,
    route:[{x:1196,y:1550,name:'Marina gate'},{x:1720,y:1360,name:'Canal bend'},{x:2145,y:1450,name:'Lighthouse road'},{x:2160,y:1660,name:'Beacon steps'}]};
  // Dispatch is deliberately local: accept a radio call with J, then follow its world/minimap marker.
  function requestDispatch(){const d=state.dispatch;if(d.active){message(`${d.active.name} · ${Math.ceil(d.active.remaining)}s remaining`);return;}const choices=d.calls.filter(call=>(d.cooldowns[call.id]||0)<=0);if(!choices.length){message('Dispatch channel cooling down · check back shortly.');return;}const call=choices[(Math.floor(state.clock/17)+Object.keys(d.completed).length)%choices.length];d.active={...call,remaining:call.deadline,serviceTime:0};message(`DISPATCH · ${call.name}: ${call.brief}`,4);}
  function message(s,t=3){state.toast=String(s);state.toastTime=Math.max(0,Number.isFinite(t)?t:3);}
  function beginCourier(){const run=state.courier;if(dist(player,state.anchor)>100){message('Coast Run starts at the marina gate.');return;}if(run.phase==='active'){const next=run.route[run.checkpoint];message(next?`Next checkpoint: ${next.name}`:'Coast Run is finishing.');return;}run.phase='active';run.startedAt=state.clock;run.elapsed=0;run.checkpoint=0;run.reward=0;message('COAST RUN · hit each gold checkpoint in order',4);}
  function pulse(){if(state.pulseCooldown>0){message(`Streetwise pulse recharges in ${Math.ceil(state.pulseCooldown)}s`,1.5);return;}const target=pickups.filter(a=>!a.found).sort((a,b)=>dist(player,a)-dist(player,b))[0];if(!target){message('No coast stashes left to find.');return;}state.pulseTarget=target;state.pulseTime=8;state.pulseCooldown=24;message(`Local tip: ${target.label} is ${Math.round(dist(player,target))}m away · follow the gold ring`,3);}
  function nearestCar(max=58){let best=-1,bd=max;cars.forEach((c,i)=>{if(i===player.inCar)return;const d=dist(player,c);if(d<bd){bd=d;best=i;}});return best;}
  function enterExit(){const p=player;if(p.inCar>=0){const c=cars[p.inCar];p.x=c.x+Math.cos(c.angle+Math.PI/2)*35;p.y=c.y+Math.sin(c.angle+Math.PI/2)*35;c.driver=false;p.inCar=-1;message('On foot. Stay sharp.');return;}
    const i=nearestCar();if(i<0){message('Get closer to a vehicle.');return;}const c=cars[i];p.inCar=i;c.driver=true;p.angle=c.angle;if(!c.stolen){c.stolen=true;raiseHeat(1);message('Vehicle acquired · heat rising');}else message('Back behind the wheel.');}
  function raiseHeat(n){state.heat=clamp(state.heat+n,0,5);state.heatTimer=18;state.policeEvaded=false;}
  function fire(){const p=player;if(p.inCar>=0){message('Exit the vehicle to aim.');return;}if(shots.length>=8){message('Let the last shot clear before firing again.',1.4);return;}const target=globalThis.__aim||{x:p.x+Math.cos(p.angle)*300,y:p.y+Math.sin(p.angle)*300};const a=Math.atan2(target.y-p.y,target.x-p.x);p.angle=a;shots.push({x:p.x+Math.cos(a)*20,y:p.y+Math.sin(a)*20,vx:Math.cos(a)*560,vy:Math.sin(a)*560,life:1});raiseHeat(1);message('Shot fired · police alerted',2);}
  function update(dt,input={}){dt=Number.isFinite(dt)?clamp(dt,0,.05):0;const s=state,p=player;input??={};s.clock+=dt;if(s.toastTime>0)s.toastTime=Math.max(0,s.toastTime-dt);if(p.invuln>0)p.invuln=Math.max(0,p.invuln-dt);s.pulseCooldown=Math.max(0,s.pulseCooldown-dt);Object.keys(s.dispatch.cooldowns).forEach(id=>s.dispatch.cooldowns[id]=Math.max(0,s.dispatch.cooldowns[id]-dt));s.pulseTime=Math.max(0,s.pulseTime-dt);if(s.pulseTime===0)s.pulseTarget=null;
    const run=s.courier;if(run.phase==='active'){run.elapsed=s.clock-run.startedAt;const gate=run.route[run.checkpoint];if(gate&&dist(p,gate)<58){run.checkpoint++;if(run.checkpoint===run.route.length){run.phase='done';run.best=run.best?Math.min(run.best,run.elapsed):run.elapsed;run.reward=Math.max(150,Math.round(650-run.elapsed*8));p.cash+=run.reward;message(`COAST RUN COMPLETE · ${run.elapsed.toFixed(1)}s · $${run.reward} paid`,5);}else message(`CHECKPOINT ${run.checkpoint}/${run.route.length} · ${run.route[run.checkpoint].name}`,2.5);}if(run.phase==='active'&&run.elapsed>=90){run.phase='ready';run.elapsed=0;run.checkpoint=0;message('Coast run timed out · press R at the marina to retry',4);}}
    // Dispatch deadlines run on the same fixed-step clock as driving and story objectives.
    const call=s.dispatch.active;if(call){call.remaining-=dt;const target=call.kind==='medical'?call.pickup:call;if(call.kind==='witness')call.serviceTime=dist(p,target)<68?call.serviceTime+dt:0;else if(call.kind==='service'&&dist(p,target)<56)call.serviceTime=1;else if(call.kind==='medical'&&dist(p,target)<62)call.serviceTime=1;
      if(call.serviceTime>= (call.kind==='witness'?12:1)){const reward=call.payout;p.cash+=reward;s.dispatch.completed[call.id]=(s.dispatch.completed[call.id]||0)+1;s.dispatch.cooldowns[call.id]=call.cooldown;s.dispatch.active=null;message(`${call.name.toUpperCase()} COMPLETE · $${reward} paid`,5);}
      else if(call.remaining<=0){s.dispatch.cooldowns[call.id]=Math.max(30,call.cooldown/2);s.dispatch.active=null;message(`${call.name} timed out · call back after cooldown`,4);}}
    if(s.heat>0&&s.policeEvaded){s.heatTimer-=dt;if(s.heatTimer<=0){s.heat=Math.max(0,s.heat-1);s.heatTimer=10;if(s.heat)message('Stay quiet · wanted level falling.',2);else{s.policeEvaded=false;message('Police heat cleared.',3);}}}
    if(s.heat>0&&!s.policeEvaded&&s.police.length<Math.min(5,Math.ceil(s.heat))&&s.clock%4<dt){const a=s.clock*1.9;police.push({x:clamp(p.x+Math.cos(a)*520,40,WORLD.w-40),y:clamp(p.y+Math.sin(a)*430,40,WORLD.h-40),angle:a+Math.PI,speed:104+14*s.heat,flash:s.clock,lostTime:0});}
    people.forEach((n,i)=>{if(!n.alive)return;n.phase+=dt;if(p.inCar>=0&&dist(n,p)<24){n.alive=false;raiseHeat(1);message('Pedestrian struck · wanted level increased');p.health=Math.max(10,p.health-8);return;}if(Math.floor(n.phase*1.4)%4===0)n.angle+=Math.sin(n.phase+i)*dt*1.1;n.x+=Math.cos(n.angle)*n.pace*dt;n.y+=Math.sin(n.angle)*n.pace*dt;if(n.x<8||n.x>WORLD.w-8){n.x=clamp(n.x,8,WORLD.w-8);n.angle=Math.PI-n.angle;}if(n.y<8||n.y>WORLD.h-8){n.y=clamp(n.y,8,WORLD.h-8);n.angle=-n.angle;}});
    if(p.inCar<0){let dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0),len=Math.hypot(dx,dy)||1;if(dx||dy){const pace=input.sprint?235:152;dx/=len;dy/=len;p.x=clamp(p.x+dx*pace*dt,8,WORLD.w-8);p.y=clamp(p.y+dy*pace*dt,8,WORLD.h-8);p.angle=Math.atan2(dy,dx);}}
    cars.forEach((c,i)=>{if(i===p.inCar){const turn=(input.right?1:0)-(input.left?1:0),acc=(input.up?1:0)-(input.down?1:0);c.angle+=turn*dt*(1.8+Math.abs(acc)*.65);c.speed=clamp(c.speed+acc*dt*190,-85,250);c.speed*=Math.pow(.987,dt*60);const nx=clamp(c.x+Math.cos(c.angle)*c.speed*dt,12,WORLD.w-12),ny=clamp(c.y+Math.sin(c.angle)*c.speed*dt,12,WORLD.h-12);const hit=cars.find((other,j)=>j!==i&&dist({x:nx,y:ny},other)<38);if(hit){c.speed*=-.28;c.bump=.28;message('Traffic collision · ease off the throttle',1.4);}else{c.x=nx;c.y=ny;}p.x=c.x;p.y=c.y;p.angle=c.angle;
      if(Math.abs(c.speed)>170&&s.clock%1<dt){for(const n of people)if(n.alive&&dist(n,c)<21){n.alive=false;raiseHeat(1);}}
    } else {c.x+=Math.cos(c.angle)*c.speed*dt;c.y+=Math.sin(c.angle)*c.speed*dt;if(c.x<0)c.x=WORLD.w;if(c.x>WORLD.w)c.x=0;if(c.y<0)c.y=WORLD.h;if(c.y>WORLD.h)c.y=0;}});
    for(let i=police.length-1;i>=0;i--){const c=police[i],d=Math.atan2(p.y-c.y,p.x-c.x);let turn=Math.atan2(Math.sin(d-c.angle),Math.cos(d-c.angle));c.angle+=clamp(turn,-2.3*dt,2.3*dt);c.x=clamp(c.x+Math.cos(c.angle)*c.speed*dt,8,WORLD.w-8);c.y=clamp(c.y+Math.sin(c.angle)*c.speed*dt,8,WORLD.h-8);const distance=dist(c,p);if(distance>760)c.lostTime=(c.lostTime||0)+dt;else c.lostTime=0;if(c.lostTime>=8){police.splice(i,1);if(police.length===0){s.policeEvaded=true;s.heatTimer=10;message('Patrols lost your trail · stay quiet to lose the heat.',4);}continue;}if(distance<32){if(p.invuln<=0){p.health-=12;p.invuln=.75;message('Patrol contact · break away');}c.x=clamp(c.x-Math.cos(c.angle)*30,8,WORLD.w-8);c.y=clamp(c.y-Math.sin(c.angle)*30,8,WORLD.h-8);}}
    shots.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;for(const n of people){if(n.alive&&dist(n,b)<13){n.alive=false;b.life=0;break;}}if(b.life>0){for(let i=police.length-1;i>=0;i--){if(dist(police[i],b)<17){police.splice(i,1);b.life=0;message('Patrol vehicle disabled',2);break;}}}});while(shots.length&&shots[0].life<=0)shots.shift();
    if(s.story===0&&dist(p,s.mara)<54){s.story=1;s.missionText='Take Mara’s package to the lighthouse';message('MARA: A clean handoff. No questions, Sol.');}
    if(s.story===1&&dist(p,s.drop)<60){s.story=2;s.missionDone=true;s.missionText='Job complete · $850 deposited';p.cash+=850;message('HANDOFF COMPLETE · $850 · New story lead unlocked');}
    for(const stash of pickups){if(!stash.found&&dist(p,stash)<34){stash.found=true;p.cash+=stash.value;message(`${stash.label} stash · $${stash.value} collected`,2.6);}}
    if(p.health<=0){if(p.inCar>=0){const car=cars[p.inCar];if(car){car.driver=false;car.speed=0;}}p.health=100;p.x=1170;p.y=894;p.cash=Math.max(0,p.cash-100);p.inCar=-1;s.heat=0;s.heatTimer=0;s.policeEvaded=false;police.length=0;message('Recovered at the clinic · $100 fee');}
  }
  return {state,update,enterExit,fire,raiseHeat,message,nearestCar,beginCourier,pulse,requestDispatch};
}
