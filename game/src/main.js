import { makeWorld } from './world.js';
import { createRenderer } from './render.js';

const canvas=document.querySelector('#game'),status=document.querySelector('#status');
const game=makeWorld(),renderer=createRenderer(canvas),keys=new Set();let last=performance.now(),acc=0,mouse={x:0,y:0};
const SAVE='sunline.vicecoast.save.v1';
function save(){try{const s=game.state;localStorage.setItem(SAVE,JSON.stringify({x:s.player.x,y:s.player.y,cash:s.player.cash,health:s.player.health,story:s.story,found:s.pickups.map(p=>p.found)}));}catch{}}
function load(){try{const a=JSON.parse(localStorage.getItem(SAVE)||'null');if(!a)return;const s=game.state;s.player.x=Number.isFinite(a.x)?Math.max(8,Math.min(2392,a.x)):s.player.x;s.player.y=Number.isFinite(a.y)?Math.max(8,Math.min(1792,a.y)):s.player.y;s.player.cash=Number.isFinite(a.cash)?Math.max(0,a.cash):s.player.cash;s.player.health=Number.isFinite(a.health)?Math.max(1,Math.min(100,a.health)):s.player.health;s.story=Math.max(0,Math.min(2,Number(a.story)||0));s.pickups.forEach((p,i)=>{p.found=Boolean(a.found?.[i]);});s.heat=0;s.missionDone=s.story>=2;s.missionText=s.story===0?'Find Mara at the marina':s.story===1?'Take Mara’s package to the lighthouse':'Job complete · $850 deposited';}catch{}}
load();
let audio=null;
function beep(kind='click'){try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);const now=audio.currentTime;o.type=kind==='alarm'?'sawtooth':'triangle';o.frequency.setValueAtTime(kind==='shot'?210:kind==='alarm'?460:520,now);o.frequency.exponentialRampToValueAtTime(kind==='shot'?75:kind==='alarm'?290:760,now+.12);g.gain.setValueAtTime(.045,now);g.gain.exponentialRampToValueAtTime(.001,now+.16);o.start(now);o.stop(now+.17);}catch{}}
function setScreen(name){game.state.screen=name;}
function start(){setScreen('play');status.textContent='Vice Coast. Find Mara at the marina.';beep();}
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;
 if(game.state.screen==='title'&&(e.code==='Enter'||e.code==='Space'))start();else if(game.state.screen==='paused'&&e.code==='Enter'){setScreen('play');beep();}else if(e.code==='KeyP'||e.code==='Escape'){if(game.state.screen==='play'){setScreen('paused');save();}else if(game.state.screen==='paused'){if(e.code==='Escape'){setScreen('title');save();}else setScreen('play');}beep();}
 if(game.state.screen==='play'){if(e.code==='KeyE'){game.enterExit();beep();}if(e.code==='KeyF'){game.fire();beep('shot');}if(e.code==='KeyC'){game.state.highContrast=!game.state.highContrast;game.message(game.state.highContrast?'High contrast enabled':'High contrast disabled',1.8);beep();}if(e.code==='KeyH'){if(game.state.player.cash>=50){game.state.player.health=100;game.state.player.cash-=50;game.message('Clinic visit · health restored · $50');}else game.message('Clinic visit costs $50');}if(e.code==='KeyM')game.message('Gold marker: mission · teal sparks: coast stashes');}
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();mouse={x:(e.clientX-r.left)/renderer.scale+(innerWidth/renderer.scale-1280)/2,y:(e.clientY-r.top)/renderer.scale+(innerHeight/renderer.scale-720)/2};const s=game.state;window.__aim={x:s.player.x+mouse.x-640,y:s.player.y+mouse.y-360};});
canvas.addEventListener('pointerdown',()=>{if(game.state.screen==='title'){start();return;}if(game.state.screen==='paused'){setScreen('play');return;}if(game.state.screen==='play'){game.fire();beep('shot');}});
function down(...codes){return codes.some(k=>keys.has(k));}
function tick(now){requestAnimationFrame(tick);const dt=Math.min(.05,(now-last)/1000);last=now;if(game.state.screen==='play'){acc+=dt;while(acc>=1/60){game.update(1/60,{up:down('KeyW','ArrowUp'),down:down('KeyS','ArrowDown'),left:down('KeyA','ArrowLeft'),right:down('KeyD','ArrowRight'),sprint:down('ShiftLeft','ShiftRight')});acc-=1/60;}if(Math.floor(now/4500)!==Math.floor((now-dt*1000)/4500))save();}else acc=0;renderer.draw(game);}
function shotScene(){const q=new URLSearchParams(location.search).get('shot');if(!q)return;const s=game.state;s.screen=q==='start'?'title':'play';if(q==='start'){s.player.x=1170;s.player.y=894;}
 else if(q==='city'){s.player.x=1190;s.player.y=860;s.story=0;s.heat=0;}
 else {s.player.x=1540;s.player.y=1050;s.player.inCar=2;s.cars[2].x=s.player.x;s.cars[2].y=s.player.y;s.cars[2].driver=true;s.cars[2].stolen=true;s.cars[2].angle=-.3;s.cars[2].speed=148;s.story=1;s.missionText='Take Mara’s package to the lighthouse';s.heat=3;s.heatTimer=20;s.police.push({x:1120,y:985,angle:.12,speed:148,flash:1},{x:1880,y:1180,angle:3.8,speed:138,flash:1},{x:1600,y:620,angle:1.4,speed:128,flash:1});}
 window.__shotReady=true;}
shotScene();requestAnimationFrame(tick);window.addEventListener('beforeunload',save);
