/* =========================
   SPA NAVIGATION
========================= */
const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('nav button');
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    navButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.section;
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    if(id==='map') setTimeout(initMap, 0);
    if(id==='trails') setTimeout(initMaze, 0);
    if(id==='flora') setTimeout(initFloraGame, 0);
    if(id==='fauna') setTimeout(initDietGame, 0);
    if(id==='history') setTimeout(initTimeline, 0);
    if(id==='geology') setTimeout(initGeoGame, 0);
    if(id==='camping') setTimeout(initPackGame, 0);
  });
});

/* =========================
   PWA INSTALL PROMPT
========================= */
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  if(installBtn) installBtn.hidden = false;
});
installBtn?.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  installBtn.hidden = true;
  deferredPrompt = null;
});

/* =========================
   RESPONSIVE CANVASES
========================= */
function fitCanvas(canvas, aspect /* width/height */, maxSquare /* optional */){
  const parentW = canvas.parentElement.clientWidth || window.innerWidth;
  let cssW, cssH;
  if(maxSquare){ // for maze (square)
    cssW = Math.min(parentW, maxSquare);
    cssH = cssW;
  }else{
    cssW = parentW;
    cssH = Math.round(cssW / (aspect || 2)); // default 2:1 (lake)
  }
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvas.width  = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  return {w:canvas.width, h:canvas.height, dpr};
}

/* =========================
   LAKE ILLUSTRATION (CANVAS)
========================= */
function drawLake(){
  const c = document.getElementById('lakeArt');
  if(!c) return;
  const asp = Number(c.dataset.aspect || 2);
  const {w:W, h:H} = fitCanvas(c, asp);
  const ctx = c.getContext('2d');

  // sky
  const sky = ctx.createLinearGradient(0,0,0,H*0.7);
  sky.addColorStop(0,'#b3e5fc');
  sky.addColorStop(1,'#e1f5fe');
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
  // mountains
  ctx.fillStyle = '#90a4ae';
  ctx.beginPath();
  ctx.moveTo(0,H*0.65); ctx.lineTo(W*0.25,H*0.35); ctx.lineTo(W*0.5,H*0.65); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W*0.4,H*0.68); ctx.lineTo(W*0.7,H*0.3); ctx.lineTo(W,H*0.68); ctx.closePath(); ctx.fill();
  // lake
  const water = ctx.createLinearGradient(0,H*0.55,0,H);
  water.addColorStop(0,'#64b5f6'); water.addColorStop(1,'#2196f3');
  ctx.fillStyle = water; ctx.fillRect(0,H*0.55,W,H*0.45);
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  for(let y=H*0.62; y<H*0.9; y+=10){
    ctx.beginPath();
    ctx.moveTo(0,y);
    for(let x=0; x<=W; x+=10){
      ctx.lineTo(x, y + Math.sin((x+y)/25)*2);
    }
    ctx.stroke();
  }
}
window.addEventListener('resize', drawLake);
drawLake();

/* =========================
   TTS – עברית
========================= */
let _voices = [];
function loadVoices(){
  _voices = speechSynthesis.getVoices() || [];
}
if('speechSynthesis' in window){
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
function pickHebrewVoice(){
  if(!_voices || !_voices.length) return null;
  const he = _voices.find(v => (v.lang||'').toLowerCase().startsWith('he'));
  if(he) return he;
  const byName = _voices.find(v => /hebrew/i.test(v.name));
  if(byName) return byName;
  // נפוץ שבאנדרואיד קול בעברית לא זמין – נחזיר קול דיפולטי
  return _voices[0] || null;
}
function speakText(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const text = (el.textContent || '').replace(/\s+/g,' ').trim();
  if(!text) return;
  if(!('speechSynthesis' in window)){ alert('הדפדפן לא תומך בקריינות.'); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'he-IL';
  const voice = pickHebrewVoice();
  if(voice) u.voice = voice;
  u.rate = 0.98; u.pitch = 1.0;
  try{ speechSynthesis.cancel(); }catch{}
  speechSynthesis.speak(u);
}
document.querySelectorAll('.tts').forEach(btn=>{
  btn.addEventListener('click', ()=> speakText(btn.dataset.for));
});

/* =========================
   LEAFLET MAP (OSM)
========================= */
let mapInited = false;
function initMap(){
  if(mapInited) return;
  const mapEl = document.getElementById('map');
  if(!mapEl) return;
  const center = [49.243889, -122.386944]; // Rolley Lake Park (approx)
  const falls  = [49.2398, -122.3925];
  const beach  = [49.2453, -122.3840];
  const camp   = [49.2445, -122.3864];
  const map = L.map('map', {scrollWheelZoom:false}).setView(center, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker(center).addTo(map).bindPopup('אגם רולי – מרכז הפארק');
  L.marker(falls).addTo(map).bindPopup('מפל רולי (משוער)');
  L.marker(beach).addTo(map).bindPopup('אזור רחצה (משוער)');
  L.marker(camp).addTo(map).bindPopup('אתר קמפינג (משוער)');
  mapInited = true;
}

/* =========================
   DRAG & DROP – עובד בנייד (Pointer Events)
========================= */
// רישום Dropzones וקולב ירידה
const dropHandlers = new Map();
function makeDropzone(el, onDrop){
  el.classList.add('dropzone');
  dropHandlers.set(el, onDrop);
}
// הכנת פריט לגרירה – ללא HTML5 DnD
function makeDraggable(el, data){
  el.classList.add('draggable');
  el.setAttribute('draggable','false'); // מונע DnD דפדפן
  if(data) el.dataset.payload = JSON.stringify(data);
}

let dragEl = null, ghost = null, startX=0, startY=0;
function elementDropzoneAt(x, y){
  let el = document.elementFromPoint(x,y);
  while(el){
    if(dropHandlers.has(el)) return el;
    el = el.parentElement;
  }
  return null;
}

function startDrag(target, pointer){
  dragEl = target;
  dragEl.style.opacity = '0.5';
  const r = target.getBoundingClientRect();
  ghost = target.cloneNode(true);
  ghost.classList.add('dragging-ghost');
  ghost.style.position = 'fixed';
  ghost.style.left = r.left + 'px';
  ghost.style.top  = r.top  + 'px';
  ghost.style.width = r.width + 'px';
  ghost.style.height= r.height + 'px';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = '9999';
  document.body.appendChild(ghost);
  moveGhost(pointer.clientX, pointer.clientY);
}
function moveGhost(x,y){
  if(!ghost) return;
  ghost.style.left = (x - ghost.offsetWidth / 2) + 'px';
  ghost.style.top  = (y - ghost.offsetHeight/ 2) + 'px';
}
function endDrag(pointer){
  if(!dragEl){ cleanupDrag(); return; }
  const drop = elementDropzoneAt(pointer.clientX, pointer.clientY);
  // פירוק המטען
  let data = {};
  try{ data = JSON.parse(dragEl.dataset.payload || '{}'); }catch{}
  ['id','label','for','food'].forEach(k => { if(dragEl.dataset[k]) data[k]=dragEl.dataset[k]; });

  if(drop){
    const cb = dropHandlers.get(drop);
    if(typeof cb === 'function') cb(data, drop, dragEl);
  }
  cleanupDrag();
}
function cleanupDrag(){
  if(dragEl) dragEl.style.opacity = '';
  if(ghost) ghost.remove();
  dragEl = null; ghost = null;
}
// מאזינים גלובליים
document.addEventListener('pointerdown', (e)=>{
  const target = e.target.closest('.draggable');
  if(!target) return;
  e.preventDefault();
  startDrag(target, e);
});
document.addEventListener('pointermove', (e)=>{
  if(ghost) { e.preventDefault(); moveGhost(e.clientX, e.clientY); }
});
document.addEventListener('pointerup', (e)=>{
  if(!dragEl) return;
  e.preventDefault(); endDrag(e);
});

/* =========================
   GAMES
========================= */
// 1) היסטוריה – ציר זמן
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
  // shuffle
  const shuffled = timelineItems.slice().sort(()=>Math.random()-0.5);
  shuffled.forEach(item=>{
    const div = document.createElement('div');
    div.className = 'draggable';
    div.textContent = item.label;
    div.dataset.id = item.id;
    makeDraggable(div, item);
    pool.appendChild(div);
  });
  makeDropzone(slots, (data, zone, draggedEl)=>{
    if(!data) return;
    zone.appendChild(draggedEl);
  });
  document.getElementById('checkTimeline').onclick = ()=>{
    const order = [...slots.children].map(n=>n.dataset.id);
    const correct = ['indigenous','logging','park1961','today'];
    const ok = JSON.stringify(order) === JSON.stringify(correct);
    document.getElementById('timelineResult').textContent =
      ok? 'כל הכבוד! זה הסדר הנכון.' : 'נסו שוב לסדר לפי הזמן.';
    slots.classList.toggle('correct', ok);
    slots.classList.toggle('wrong', !ok);
  };
}

// 2) גיאולוגיה – בונים אגם
const geoPiecesSrc = [
  {id:'ice', label:'קרחון'},
  {id:'rock', label:'סלע'},
  {id:'water', label:'מים'}
];
function initGeoGame(){
  const area = document.getElementById('geoPieces');
  const stack = document.getElementById('geoStack');
  if(!area || !stack) return;
  area.innerHTML = ''; stack.innerHTML = '';
  const shuffled = geoPiecesSrc.slice().sort(()=>Math.random()-0.5);
  shuffled.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'draggable';
    div.textContent = p.label;
    div.dataset.id = p.id;
    makeDraggable(div, p);
    area.appendChild(div);
  });
  makeDropzone(stack, (data, zone, draggedEl)=>{
    if(!data) return;
    zone.appendChild(draggedEl);
  });
  document.getElementById('checkGeo').onclick = ()=>{
    const order = [...stack.children].map(n=>n.dataset.id);
    const ok = JSON.stringify(order) === JSON.stringify(['ice','rock','water']);
    document.getElementById('geoResult').textContent =
      ok? 'נכון! קודם קרחון, אחר־כך סלע, ואז מים.' : 'טיפ: קרחונים חוצבים, ואז מים ממלאים.';
    stack.classList.toggle('correct', ok);
    stack.classList.toggle('wrong', !ok);
  };
}

// 3) צמחייה – התאמת שם לצמח
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
    tile.innerHTML = `<div style="font-size:2rem">${card.emoji}</div><div class="small" data-drop="${card.id}">גרור שם מתאים לכאן</div>`;
    makeDropzone(tile, (data, zone, draggedEl)=>{
      if(!data) return;
      if(data.id === card.id){
        zone.querySelector('.small').textContent = data.label || card.name;
        zone.classList.add('correct');
        draggedEl.remove();
      } else {
        zone.classList.add('wrong'); setTimeout(()=>zone.classList.remove('wrong'), 700);
      }
    });
    wrap.appendChild(tile);
  });
  // שמות
  floraCards.slice().sort(()=>Math.random()-0.5).forEach(card=>{
    const tag = document.createElement('div');
    tag.className = 'draggable';
    tag.textContent = card.name;
    tag.dataset.id = card.id;
    makeDraggable(tag, {id:card.id, label:card.name});
    wrap.appendChild(tag);
  });
  document.getElementById('resetFlora').onclick = initFloraGame;
}

// 4) בעלי חיים – מה החיה אוכלת?
const dietPairs = [
  {animal:'דוב שחור', food:'פירות וגרגרים', emoji:'🐻'},
  {animal:'דג טרוטה', food:'חרקים קטנים',  emoji:'🐟'},
  {animal:'ברווז',    food:'צמחי מים',      emoji:'🦆'},
  {animal:'סנאי',     food:'זרעים ואגוזים',  emoji:'🐿️'}
];
function initDietGame(){
  const wrap = document.getElementById('dietGame');
  if(!wrap) return;
  wrap.innerHTML = '';
  dietPairs.forEach((p)=>{
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = `<div style="font-size:2rem">${p.emoji}</div><div><strong>${p.animal}</strong></div><div class="small">גרור מזון מתאים</div>`;
    makeDropzone(tile, (data, zone, draggedEl)=>{
      if(!data) return;
      if(data.for === p.animal && data.food === p.food){
        zone.querySelector('.small').textContent = data.food;
        zone.classList.add('correct');
        draggedEl.remove();
      } else {
        zone.classList.add('wrong'); setTimeout(()=>zone.classList.remove('wrong'), 700);
      }
    });
    wrap.appendChild(tile);
  });
  // מזונות
  dietPairs.slice().sort(()=>Math.random()-0.5).forEach(p=>{
    const tag = document.createElement('div');
    tag.className = 'draggable';
    tag.textContent = p.food;
    makeDraggable(tag, {for:p.animal, food:p.food});
    wrap.appendChild(tag);
  });
  document.getElementById('resetDiet').onclick = initDietGame;
}

// 5) שבילים – מבוך רספונסיבי
let maze, player, goal, mazeCanvas, mazeCtx;
const SIZE = 12; // תאי רשת
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
  const {width:W,height:H} = mazeCanvas;
  const cell = Math.floor(Math.min(W,H)/SIZE);
  mazeCtx.clearRect(0,0,W,H);
  for(let y=0;y<SIZE;y++){
    for(let x=0;x<SIZE;x++){
      mazeCtx.fillStyle = (maze[y][x]===1)?'#b0bec5':'#ffffff';
      mazeCtx.fillRect(x*cell, y*cell, cell-1, cell-1);
    }
  }
  // player
  mazeCtx.fillStyle = '#1e88e5';
  const r = Math.floor(cell*0.35);
  mazeCtx.beginPath();
  mazeCtx.arc(player.x*cell+cell/2, player.y*cell+cell/2, r, 0, Math.PI*2);
  mazeCtx.fill();
  // goal
  mazeCtx.fillStyle = '#00bcd4';
  mazeCtx.fillRect(goal.x*cell+6, goal.y*cell+6, cell-12, cell-12);
}
function move(dx,dy){
  const nx = player.x+dx, ny = player.y+dy;
  if(maze[ny]?.[nx]===0){ player.x=nx; player.y=ny; drawMaze(); }
  const status = document.getElementById('mazeStatus');
  if(player.x===goal.x && player.y===goal.y){
    status.textContent = 'ישש! הגעתם למפל!';
  } else {
    status.textContent = 'מצאו את הדרך למפל (הריבוע הכחול).';
  }
}
function initMaze(){
  mazeCanvas = document.getElementById('maze');
  if(!mazeCanvas) return;
  fitCanvas(mazeCanvas, null, Number(mazeCanvas.dataset.size || 360));
  mazeCtx = mazeCanvas.getContext('2d');
  maze = generateMaze(SIZE);
  player = {x:1,y:1};
  goal = {x:SIZE-2, y:SIZE-2};
  drawMaze();
  document.querySelectorAll('[data-move]').forEach(btn=>{
    btn.onclick = ()=>{
      const dir = btn.dataset.move;
      if(dir==='up') move(0,-1);
      if(dir==='down') move(0,1);
      if(dir==='left') move(-1,0);
      if(dir==='right') move(1,0);
    };
  });
  window.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowUp') move(0,-1);
    if(e.key==='ArrowDown') move(0,1);
    if(e.key==='ArrowLeft') move(-1,0);
    if(e.key==='ArrowRight') move(1,0);
  });
}
window.addEventListener('resize', ()=>{ if(mazeCanvas){ initMaze(); }});

// 6) קמפינג – אריזה לתרמיל
const items = [
  {id:'tent',  label:'אוהל',              good:true},
  {id:'water', label:'מים',               good:true},
  {id:'snacks',label:'חטיפי אנרגיה',     good:true},
  {id:'bear',  label:'דב צעצוע ענק',     good:false},
  {id:'tv',    label:'טלוויזיה',         good:false},
  {id:'sleep', label:'שק שינה',          good:true},
  {id:'stove', label:'גזייה',            good:true},
  {id:'glass', label:'כוס זכוכית עדינה', good:false},
  {id:'map',   label:'מפה',              good:true}
];
let packed = new Set();
function initPackGame(){
  const pool = document.getElementById('packItems');
  const bag  = document.getElementById('backpack');
  if(!pool || !bag) return;
  pool.innerHTML=''; bag.innerHTML='';
  packed = new Set();
  items.slice().sort(()=>Math.random()-0.5).forEach(it=>{
    const div = document.createElement('div');
    div.className='draggable';
    div.textContent = it.label;
    div.dataset.id = it.id;
    makeDraggable(div, it);
    pool.appendChild(div);
  });
  makeDropzone(bag, (data, zone, draggedEl)=>{
    if(!data) return;
    zone.appendChild(draggedEl);
    packed.add(data.id);
  });
  document.getElementById('checkPack').onclick = ()=>{
    let score = 0;
    items.forEach(it=>{
      const inBag = packed.has(it.id);
      if(inBag && it.good) score += 2;
      if(inBag && !it.good) score -= 1;
    });
    document.getElementById('packResult').textContent =
      'ציון: ' + score + ' (יותר טוב בלהביא ציוד מתאים!)';
  };
}

/* =========================
   INIT DEFAULT VIEWS
========================= */
initTimeline();
initGeoGame();
initFloraGame();
initDietGame();