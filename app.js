// ---------- SPA NAV ----------
const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('nav button');
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    navButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.section;
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    if(id==='map') setTimeout(()=>{ initMap(); initMapToggle(); }, 0);
    if(id==='trails') setTimeout(initMaze, 0);
    if(id==='flora') setTimeout(initFloraGame, 0);
    if(id==='fauna') setTimeout(initDietGame, 0);
    if(id==='history') setTimeout(initTimeline, 0);
    if(id==='geology') setTimeout(initGeoGame, 0);
    if(id==='camping') setTimeout(initPackGame, 0);
  });
});

// ---------- PWA INSTALL ----------
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  installBtn.hidden = true;
  deferredPrompt = null;
});

// ---------- CANVAS ART ----------
(function drawLake(){
  const c = document.getElementById('lakeArt');
  if(!c) return;
  const ctx = c.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = 520, h = 260;
  c.width = w*dpr; c.height = h*dpr; c.style.width='100%'; c.style.height='auto';
  ctx.scale(dpr,dpr);

  const sky = ctx.createLinearGradient(0,0,0,h*0.7);
  sky.addColorStop(0,'#b3e5fc'); sky.addColorStop(1,'#e1f5fe');
  ctx.fillStyle = sky; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#90a4ae';
  ctx.beginPath(); ctx.moveTo(0,h*0.65); ctx.lineTo(w*0.25,h*0.35); ctx.lineTo(w*0.5,h*0.65); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w*0.4,h*0.68); ctx.lineTo(w*0.7,h*0.3); ctx.lineTo(w,h*0.68); ctx.closePath(); ctx.fill();
  const water = ctx.createLinearGradient(0,h*0.55,0,h);
  water.addColorStop(0,'#64b5f6'); water.addColorStop(1,'#2196f3');
  ctx.fillStyle = water; ctx.fillRect(0,h*0.55,w,h*0.45);
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  for(let y=h*0.62; y<h*0.9; y+=10){
    ctx.beginPath(); ctx.moveTo(0,y);
    for(let x=0; x<=w; x+=10){ ctx.lineTo(x, y + Math.sin((x+y)/25)*2); }
    ctx.stroke();
  }
})();

// ---------- TTS (Hebrew) ----------
let voices = [];
function loadVoices(){ voices = window.speechSynthesis.getVoices(); }
if ('speechSynthesis' in window){
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
function getHebrewVoice(){
  const he = voices.find(v => (v.lang||'').toLowerCase().startsWith('he'));
  if(he) return he;
  const iw = voices.find(v => (v.lang||'').toLowerCase().startsWith('iw'));
  return iw || null;
}
function speakText(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const text = el.textContent.trim();
  if('speechSynthesis' in window){
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    const v = getHebrewVoice();
    if(v) u.voice = v;
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } else {
    alert('הדפדפן לא תומך בקריינות אוטומטית.');
  }
}
function stopSpeak(){ if('speechSynthesis' in window){ window.speechSynthesis.cancel(); } }
document.getElementById('stopTTS')?.addEventListener('click', stopSpeak);
document.querySelectorAll('.tts').forEach(btn=>{
  btn.addEventListener('click', ()=> speakText(btn.dataset.for));
});

// ---------- MAP (Leaflet + OSM) ----------
let mapInited = false;
function initMap(){
  if(mapInited) return;
  const mapEl = document.getElementById('map');
  if(!mapEl) return;
  const center = [49.243889, -122.386944];
  const falls = [49.2398, -122.3925];
  const beach = [49.2453, -122.3840];
  const camp  = [49.2445, -122.3864];
  const map = L.map('map', { tap: true }).setView(center, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker(center).addTo(map).bindPopup('אגם רולי – מרכז הפארק');
  L.marker(falls).addTo(map).bindPopup('מפל רולי (משוער)');
  L.marker(beach).addTo(map).bindPopup('חוף רחצה (משוער)');
  L.marker(camp).addTo(map).bindPopup('אתר קמפינג (משוער)');
  mapInited = true;
}

// ---------- MAP TOGGLE (OSM / PDF) ----------
function initMapToggle(){
  const btnOSM = document.getElementById('btnMapOSM');
  const btnPDF = document.getElementById('btnMapPDF');
  const osmWrap = document.getElementById('mapWrap');
  const pdfWrap = document.getElementById('pdfWrap');
  if(!btnOSM || !btnPDF || !osmWrap || !pdfWrap) return;

  function setMode(mode){
    const osm = (mode === 'osm');
    osmWrap.classList.toggle('active', osm);
    pdfWrap.classList.toggle('active', !osm);
    btnOSM.classList.toggle('secondary', !osm);
    btnOSM.setAttribute('aria-pressed', String(osm));
    btnPDF.classList.toggle('secondary', osm);
    btnPDF.setAttribute('aria-pressed', String(!osm));
  }
  btnOSM.onclick = ()=> setMode('osm');
  btnPDF.onclick = ()=> setMode('pdf');
  // ברירת מחדל: OSM
  setMode('osm');
}

// ---------- TAP-TO-DROP HELPERS ----------
function enableTapToMove(poolEl, dropEl){
  let selected = null;
  poolEl.addEventListener('click', (e)=>{
    const card = e.target.closest('.draggable');
    if(!card) return;
    [...poolEl.querySelectorAll('.draggable')].forEach(n=>n.classList.remove('selected'));
    card.classList.add('selected');
    selected = card;
  });
  dropEl.addEventListener('click', ()=>{
    if(!selected) return;
    dropEl.appendChild(selected);
    selected.classList.remove('selected');
    selected = null;
  });
}

// ---------- DRAG/DROP (desktop) ----------
let dragData = null;
function makeDraggable(el, data){
  el.setAttribute('draggable','true');
  el.addEventListener('dragstart', (e)=>{
    dragData = data;
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
  });
}
function makeDropzone(el, onDrop){
  el.addEventListener('dragover', (e)=>{ e.preventDefault(); });
  el.addEventListener('drop', (e)=>{
    e.preventDefault();
    const txt = e.dataTransfer.getData('text/plain');
    let data = dragData || (txt? JSON.parse(txt): null);
    dragData = null;
    onDrop && onDrop(data, el);
  });
}

// ---------- HISTORY GAME ----------
const timelineItems = [
  {id:'indigenous', label:'חיי קהילות ילידיות באזור (לפני אלפי שנים)'},
  {id:'logging', label:'פעילות כריתת עצים באזור (לפני יותר ממאה שנה)'},
  {id:'park1961', label:'הכרזה על הפארק (1961)'},
  {id:'today', label:'מסלולים וקמפינג למשפחות (היום)'}
];
function initTimeline(){
  const pool = document.getElementById('timelinePool');
  const slots = document.getElementById('timelineSlots');
  if(!pool || !slots) return;
  pool.innerHTML = ''; slots.innerHTML = '';
  const shuffled = timelineItems.slice().sort(()=>Math.random()-0.5);
  shuffled.forEach(item=>{
    const div = document.createElement('div');
    div.className = 'draggable';
    div.textContent = item.label;
    div.dataset.id = item.id;
    makeDraggable(div, item);
    pool.appendChild(div);
  });
  makeDropzone(slots, (data)=>{
    if(!data) return;
    const node = [...pool.children].find(n => n.dataset.id===data.id);
    if(node) slots.appendChild(node);
  });
  enableTapToMove(pool, slots);
  document.getElementById('checkTimeline').onclick = ()=>{
    const order = [...slots.children].map(n=>n.dataset.id);
    const correct = ['indigenous','logging','park1961','today'];
    const ok = JSON.stringify(order) === JSON.stringify(correct);
    const res = document.getElementById('timelineResult');
    res.textContent = ok? 'כל הכבוד! זה הסדר הנכון.' : 'נסו שוב לסדר לפי הזמן.';
    slots.classList.toggle('correct', ok);
    slots.classList.toggle('wrong', !ok);
  };
}

// ---------- GEOLOGY GAME ----------
const geoPiecesSrc = [
  {id:'ice', label:'קרחון'},
  {id:'rock', label:'סלע'},
  {id:'water', label:'מים'}
];
function initGeoGame(){
  const area = document.getElementById('geoPieces');
  const stack = document.getElementById('geoStack');
  if(!area || !stack) return;
  area.innerHTML = ''; stack.querySelectorAll('.layer:not(.ghost)').forEach(n=>n.remove());

  const shuffled = geoPiecesSrc.slice().sort(()=>Math.random()-0.5);
  shuffled.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'draggable';
    div.textContent = p.label;
    div.dataset.id = p.id;
    makeDraggable(div, p);
    area.appendChild(div);
    div.addEventListener('click', ()=>{
      area.querySelectorAll('.draggable').forEach(n=>n.classList.remove('selected'));
      div.classList.add('selected');
    });
  });

  makeDropzone(stack, (data)=>{
    if(!data) return;
    const node = [...area.children].find(n => n.dataset.id===data.id);
    if(node){
      const layer = document.createElement('div');
      layer.className = 'layer '+data.id;
      layer.textContent = node.textContent;
      stack.appendChild(layer);
      node.remove();
    }
  });
  // tap support
  stack.addEventListener('click', ()=>{
    const chosen = area.querySelector('.draggable.selected');
    if(!chosen) return;
    const id = chosen.dataset.id;
    const layer = document.createElement('div');
    layer.className = 'layer '+id;
    layer.textContent = chosen.textContent;
    stack.appendChild(layer);
    chosen.remove();
  });

  document.getElementById('checkGeo').onclick = ()=>{
    const order = [...stack.querySelectorAll('.layer:not(.ghost)')].map(n=>n.classList.contains('ice')?'ice':n.classList.contains('rock')?'rock':'water');
    const ok = JSON.stringify(order) === JSON.stringify(['ice','rock','water']);
    const res = document.getElementById('geoResult');
    res.textContent = ok? 'נכון! קודם קרחון, אחר־כך סלע, ואז מים.' : 'טיפ: קרחונים חוצבים, אחריהם נשאר סלע, ואז המים ממלאים.';
    stack.classList.toggle('correct', ok);
    stack.classList.toggle('wrong', !ok);
  };
}

// ---------- FLORA GAME ----------
const floraCards = [
  {id:'douglas', name:'אשוח דאגלס', emoji:'🌲'},
  {id:'cedar',   name:'צדר אדום־מערבי', emoji:'🪵'},
  {id:'hemlock', name:'המלוק מערבי', emoji:'🌲'},
  {id:'fern',    name:'שרך', emoji:'🌿'}
];
function initFloraGame(){
  const wrap = document.getElementById('floraGame');
  if(!wrap) return;
  wrap.innerHTML = '';
  floraCards.forEach(card=>{
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = `<div style="font-size:2rem">${card.emoji}</div>
                      <div class="small" data-drop="${card.id}">גררו/הקישו שם מתאים לכאן</div>`;
    makeDropzone(tile, (data)=>{
      if(!data) return;
      if(data.id === card.id){
        tile.querySelector('.small').textContent = data.label;
        tile.classList.add('correct');
      } else {
        tile.classList.add('wrong');
        setTimeout(()=>tile.classList.remove('wrong'), 700);
      }
    });
    tile.addEventListener('click', ()=>{
      const chosen = wrap.querySelector('.draggable.selected');
      if(chosen){
        const data = {id: chosen.dataset.id, label: chosen.textContent};
        if(data.id === card.id){
          tile.querySelector('.small').textContent = data.label;
          tile.classList.add('correct');
          chosen.remove();
        } else {
          tile.classList.add('wrong'); setTimeout(()=>tile.classList.remove('wrong'), 700);
        }
      }
    });
    wrap.appendChild(tile);
  });
  floraCards.slice().sort(()=>Math.random()-0.5).forEach(card=>{
    const tag = document.createElement('div');
    tag.className = 'draggable';
    tag.textContent = card.name;
    tag.dataset.id = card.id;
    makeDraggable(tag, {id:card.id, label:card.name});
    tag.addEventListener('click', ()=>{
      wrap.querySelectorAll('.draggable').forEach(n=>n.classList.remove('selected'));
      tag.classList.add('selected');
    });
    wrap.appendChild(tag);
  });
  document.getElementById('resetFlora').onclick = initFloraGame;
}

// ---------- FAUNA / DIET GAME ----------
const dietPairs = [
  {animal:'דוב שחור',  food:'פירות וגרגרים', emoji:'🐻'},
  {animal:'דג טרוטה',  food:'חרקים קטנים',   emoji:'🐟'},
  {animal:'ברווז',     food:'צמחי מים',       emoji:'🦆'},
  {animal:'סנאי',      food:'זרעים ואגוזים',  emoji:'🐿️'}
];
function initDietGame(){
  const wrap = document.getElementById('dietGame');
  if(!wrap) return;
  wrap.innerHTML = '';
  dietPairs.forEach((p,i)=>{
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = `<div style="font-size:2rem">${p.emoji}</div>
                      <div><strong>${p.animal}</strong></div>
                      <div class="small">גררו/הקישו מזון מתאים</div>`;
    makeDropzone(tile, (data)=>{
      if(!data) return;
      if(data.for === p.animal && data.food === p.food){
        tile.querySelector('.small').textContent = data.food;
        tile.classList.add('correct');
      } else {
        tile.classList.add('wrong'); setTimeout(()=>tile.classList.remove('wrong'), 700);
      }
    });
    tile.addEventListener('click', ()=>{
      const chosen = wrap.querySelector('.draggable.selected');
      if(chosen){
        const data = JSON.parse(chosen.dataset.payload);
        if(data.for === p.animal && data.food === p.food){
          tile.querySelector('.small').textContent = data.food;
          tile.classList.add('correct');
          chosen.remove();
        } else {
          tile.classList.add('wrong'); setTimeout(()=>tile.classList.remove('wrong'), 700);
        }
      }
    });
    wrap.appendChild(tile);
  });
  dietPairs.slice().sort(()=>Math.random()-0.5).forEach(p=>{
    const tag = document.createElement('div');
    tag.className = 'draggable';
    tag.textContent = p.food;
    tag.dataset.payload = JSON.stringify({for:p.animal, food:p.food});
    makeDraggable(tag, {for:p.animal, food:p.food});
    tag.addEventListener('click', ()=>{
      wrap.querySelectorAll('.draggable').forEach(n=>n.classList.remove('selected'));
      tag.classList.add('selected');
    });
    wrap.appendChild(tag);
  });
  document.getElementById('resetDiet').onclick = initDietGame;
}

// ---------- TRAILS MAZE ----------
let maze, player, goal, mazeCanvas, mazeCtx;
const SIZE=12, CELL=28;
function generateMaze(size){
  const grid = Array.from({length:size}, ()=>Array(size).fill(0));
  for(let i=0;i<size;i++){ grid[0][i]=1; grid[size-1][i]=1; grid[i][0]=1; grid[i][size-1]=1; }
  for(let i=0;i<size*2;i++){
    const x = 1+Math.floor(Math.random()*(size-2));
    const y = 1+Math.floor(Math.random()*(size-2));
    grid[y][x]=1;
  }
  grid[1][1]=0; grid[size-2][size-2]=0;
  return grid;
}
function drawMaze(){
  mazeCtx.clearRect(0,0,mazeCanvas.width, mazeCanvas.height);
  for(let y=0;y<SIZE;y++){
    for(let x=0;x<SIZE;x++){
      mazeCtx.fillStyle = (maze[y][x]===1)?'#b0bec5':'#ffffff';
      mazeCtx.fillRect(x*CELL, y*CELL, CELL-1, CELL-1);
    }
  }
  mazeCtx.fillStyle = '#1e88e5';
  mazeCtx.beginPath();
  mazeCtx.arc(player.x*CELL+CELL/2, player.y*CELL+CELL/2, CELL*0.35, 0, Math.PI*2);
  mazeCtx.fill();
  mazeCtx.fillStyle = '#00bcd4';
  mazeCtx.fillRect(goal.x*CELL+6, goal.y*CELL+6, CELL-12, CELL-12);
}
function move(dx,dy){
  const nx = player.x+dx, ny = player.y+dy;
  if(maze[ny]?.[nx]===0){ player.x=nx; player.y=ny; drawMaze(); }
  const status = document.getElementById('mazeStatus');
  status.textContent = (player.x===goal.x && player.y===goal.y)
    ? 'ישש! הגעתם למפל!' : 'מצאו את הדרך למפל (הריבוע הכחלחל).';
}
function initMaze(){
  mazeCanvas = document.getElementById('maze');
  if(!mazeCanvas) return;
  mazeCtx = mazeCanvas.getContext('2d');
  maze = generateMaze(SIZE);
  player = {x:1,y:1}; goal = {x:SIZE-2, y:SIZE-2};
  drawMaze();
  document.querySelectorAll('[data-move]').forEach(btn=>{
    btn.onclick = ()=>{ const d = btn.dataset.move;
      if(d==='up') move(0,-1); if(d==='down') move(0,1);
      if(d==='left') move(-1,0); if(d==='right') move(1,0);
    };
  });
  window.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowUp') move(0,-1);
    if(e.key==='ArrowDown') move(0,1);
    if(e.key==='ArrowLeft') move(-1,0);
    if(e.key==='ArrowRight') move(1,0);
  }, {passive:true});
}

// ---------- CAMPING PACK GAME ----------
const items = [
  {id:'tent', label:'אוהל', good:true},
  {id:'water', label:'מים', good:true},
  {id:'snacks', label:'חטיפי אנרגיה', good:true},
  {id:'bear', label:'דב צעצוע ענק', good:false},
  {id:'tv', label:'טלוויזיה', good:false},
  {id:'sleep', label:'שק שינה', good:true},
  {id:'stove', label:'גזייה', good:true},
  {id:'glass', label:'כוס זכוכית עדינה', good:false},
  {id:'map', label:'מפה', good:true}
];
let packed = new Set();
function initPackGame(){
  const pool = document.getElementById('packItems');
  const bag = document.getElementById('backpack');
  if(!pool || !bag) return;
  pool.innerHTML=''; bag.innerHTML='';
  packed = new Set();
  items.slice().sort(()=>Math.random()-0.5).forEach(it=>{
    const div = document.createElement('div');
    div.className='draggable';
    div.textContent = it.label;
    div.dataset.id = it.id;
    makeDraggable(div, it);
    div.addEventListener('click', ()=>{
      pool.querySelectorAll('.draggable').forEach(n=>n.classList.remove('selected'));
      div.classList.add('selected');
    });
    pool.appendChild(div);
  });
  makeDropzone(bag, (data)=>{
    if(!data) return;
    const node = [...pool.children].find(n => n.dataset.id===data.id);
    if(node){ bag.appendChild(node); packed.add(data.id); }
  });
  bag.addEventListener('click', ()=>{
    const chosen = pool.querySelector('.draggable.selected');
    if(!chosen) return;
    packed.add(chosen.dataset.id);
    bag.appendChild(chosen); chosen.classList.remove('selected');
  });
  document.getElementById('checkPack').onclick = ()=>{
    let score = 0;
    items.forEach(it=>{
      const inBag = packed.has(it.id);
      if(inBag && it.good) score += 2;
      if(inBag && !it.good) score -= 1;
    });
    const res = document.getElementById('packResult');
    res.textContent = 'ציון: ' + score + ' (כל הכבוד על אריזה בטוחה!)';
  };
}

// ---------- INIT DEFAULT ----------
initTimeline();
initGeoGame();
initFloraGame();
initDietGame();
