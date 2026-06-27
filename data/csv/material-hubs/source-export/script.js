/* -----------------------
  Data (material images + inventory)
  Ensure your images are saved under /images/ with these names:
  Bamboo.jpg, Wooden-Stick-Chick-Mat.jpg, Polythene-Sheet.jpg, Cotton-Rope.jpg,
  Steel-Girder.jpg, CGI-Sheet.jpg, Wooden-Plank.jpg, EPS-Panel.jpg, Pallet.jpg
  hub images: gilgit-hub.jpg, muzaffargarh-hub.jpg, sukkur-hub.jpg
  map: pakistan-map.png
------------------------*/


// Materials data
const materials = [
  { id: 'Bamboo', file: 'images/Bamboo.jpg', desc: 'Bamboo used for joists, purlins and beams.' },
  { id: 'Wooden Stick Chick Mat', file: 'images/Wooden-Stick-Chick-Mat.jpg', desc: 'Chick mat for insulation, walls and flooring.' },
  { id: 'Polythene Sheet', file: 'images/Polythene-Sheet.jpg', desc: 'Waterproof polythene sheets for temporary roofing.' },
  { id: 'Cotton Rope', file: 'images/Cotton-Rope.jpg', desc: 'Cotton ropes for tying & securing shelters.' },
  { id: 'Steel Girder', file: 'images/Steel-Girder.jpg', desc: 'H-beams and steel girders for load-bearing structure.' },
  { id: 'CGI Sheet', file: 'images/CGI-Sheet.jpg', desc: 'Corrugated galvanized iron sheets for roofing.' },
  { id: 'Wooden Plank', file: 'images/Wooden-Plank.jpg', desc: 'Wooden planks for flooring and formwork.' },
  { id: 'EPS Panel', file: 'images/EPS-Panel.jpg', desc: 'EPS insulated panels for shelter panels.' },
  { id: 'Pallet', file: 'images/Pallet.jpg', desc: 'Pallets for storage and logistics.' }
];


// Inventory numbers (order same as materials array)
const inventory = {
  gilgit:   [1080, 2540, 141, 13, 35, 400, 171, 345, 200],
  muzaff:   [1070, 2530, 130, 14, 30, 200, 169, 330, 200],
  sukkur:   [1060, 2530, 130, 13, 35, 200, 160, 330, 200]
};


// HUB carousel data
const hubs = [
  { id: 'gilgit', name: 'Gilgit Hub', img: 'images/gilgit-hub.jpg' },
  { id: 'muzaffargarh', name: 'Muzaffargarh Hub', img: 'images/muzaffargarh-hub.jpg' },
  { id: 'sukkur', name: 'Sukkur Hub', img: 'images/sukkur-hub.jpg' }
];


/* === DOM references === */
const materialsGrid = document.getElementById('materialsGrid');
const materialInfo = document.getElementById('materialInfo');
const showImg = document.getElementById('showImg');
const showTitle = document.getElementById('showTitle');
const showDesc = document.getElementById('showDesc');
const showCounts = document.getElementById('showCounts');
const hubCarousel = document.getElementById('hubCarousel');
const inventoryCanvas = document.getElementById('inventoryChart').getContext('2d');


/* === build materials small grid (clickable optional) === */
materials.forEach((m, idx) => {
  const card = document.createElement('div');
  card.className = 'material-card';
  card.innerHTML = `<img src="${m.file}" alt="${m.id}"><div style="padding-top:8px">${m.id}</div>`;
  card.addEventListener('click', () => {
    pauseAutoCycle();
    displayMaterial(idx);
  });
  materialsGrid.appendChild(card);
});


/* === material showcase auto-cycle === */
let currentMaterial = 0;
let autoCycleTimer = null;
const cycleInterval = 3000; // ms


function displayMaterial(index){
  const m = materials[index];
  showImg.src = m.file;
  showTitle.textContent = m.id;
  showDesc.textContent = m.desc;
  showCounts.innerHTML = `
    <div>Gilgit: <strong>${inventory.gilgit[index]}</strong></div>
    <div>Muzaffargarh: <strong>${inventory.muzaff[index]}</strong></div>
    <div>Sukkur: <strong>${inventory.sukkur[index]}</strong></div>
  `;
  document.querySelectorAll('.material-card').forEach((c,i)=> c.style.outline = (i===index) ? '3px solid rgba(0,76,151,0.14)' : 'none');
  currentMaterial = index;
}


function startAutoCycle(){
  if(autoCycleTimer) clearInterval(autoCycleTimer);
  autoCycleTimer = setInterval(()=> {
    currentMaterial = (currentMaterial + 1) % materials.length;
    fadeMaterial(currentMaterial);
  }, cycleInterval);
}
function pauseAutoCycle(){
  if(autoCycleTimer) { clearInterval(autoCycleTimer); autoCycleTimer = null; }
  setTimeout(()=> startAutoCycle(), 6000);
}
function fadeMaterial(idx){
  const wrapper = document.getElementById('materialShowcase') || document.querySelector('.material-showcase');
  wrapper.style.opacity = 0;
  setTimeout(()=> {
    displayMaterial(idx);
    wrapper.style.opacity = 1;
  }, 300);
}
displayMaterial(0);
startAutoCycle();


/* === Hub images carousel (auto) === */
let hubIndex = 0;
function buildHubCarousel(){
  hubs.forEach((h, i) => {
    const slide = document.createElement('div');
    slide.className = 'hub-slide';
    slide.innerHTML = `<img src="${h.img}" alt="${h.name}"><div class="hub-name">${h.name}</div>`;
    if(i===0) slide.classList.add('active');
    hubCarousel.appendChild(slide);
  });
}
function stepHubCarousel(){
  const slides = hubCarousel.querySelectorAll('.hub-slide');
  slides.forEach(s => s.classList.remove('active'));
  hubIndex = (hubIndex + 1) % slides.length;
  slides[hubIndex].classList.add('active');
}
buildHubCarousel();
setInterval(stepHubCarousel, 2800);


/* === Chart: horizontal bars === */
const labels = materials.map(m => m.id);
const baseGilgit = inventory.gilgit.slice();
const baseMuzaff = inventory.muzaff.slice();
const baseSukkur = inventory.sukkur.slice();


const chart = new Chart(inventoryCanvas, {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [
      { label: 'Gilgit', data: baseGilgit.slice(), backgroundColor: '#2f78d6' },
      { label: 'Muzaffargarh', data: baseMuzaff.slice(), backgroundColor: '#ffb84d' },
      { label: 'Sukkur', data: baseSukkur.slice(), backgroundColor: '#66c2a5' }
    ]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { x:{ beginAtZero:true, ticks:{color:'#333'}}, y:{ticks:{color:'#333'}} },
    animation: { duration: 800, easing: 'linear' }
  }
});


let animStart = performance.now();
function animateChartFrame(now){
  const t = (now - animStart)/1000;
  function mod(val, offset){ return Math.max(0, Math.round(val*(1+0.05*Math.sin(t*1.6+offset)))); }
  chart.data.datasets[0].data = baseGilgit.map((v,i)=>mod(v,i*0.3));
  chart.data.datasets[1].data = baseMuzaff.map((v,i)=>mod(v,i*0.4+1));
  chart.data.datasets[2].data = baseSukkur.map((v,i)=>mod(v,i*0.2+2));
  chart.update('none');
  requestAnimationFrame(animateChartFrame);
}
requestAnimationFrame(animateChartFrame);


document.querySelectorAll('.hub-dot').forEach((btn, idx)=>{
  btn.addEventListener('click', () => {
    const vis = [false,false,false]; vis[idx]=true;
    chart.setDatasetVisibility(0, vis[0]);
    chart.setDatasetVisibility(1, vis[1]);
    chart.setDatasetVisibility(2, vis[2]);
    chart.update();
    setTimeout(()=> {
      chart.setDatasetVisibility(0,true);
      chart.setDatasetVisibility(1,true);
      chart.setDatasetVisibility(2,true);
      chart.update();
    }, 6000);
  });
});


function resizeChartCanvas(){
  const box = document.querySelector('.chart-box');
  const canvas = document.getElementById('inventoryChart');
  if(box && canvas){ canvas.style.height = (box.clientHeight-40)+'px'; chart.resize(); }
}
window.addEventListener('resize', resizeChartCanvas);
setTimeout(resizeChartCanvas,300);


/* ============================================================
   LEFT PANEL — DISTRICT SEARCH + DISTANCE SORTING
   ============================================================ */
let districtList = [];
let distanceTable = [];


async function loadCSV(path){
  const res = await fetch(path);
  let text = await res.text();
  text = text.replace(/^\uFEFF/,"");
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
  const headers = lines[0].split(",").map(h=>h.trim());
  return lines.slice(1).map(line=>{
    const parts = line.split(",").map(v=>v.trim());
    const obj = {};
    headers.forEach((h,i)=>obj[h]=parts[i]??"");
    return obj;
  });
}


async function loadDistrictData(){
  districtList = await loadCSV("data/districts.csv");
  distanceTable = await loadCSV("data/distances.csv");
  showDefaultHubList();
}
loadDistrictData();


const searchInput = document.getElementById("districtSearch");
const hubListDiv = document.getElementById("hubDistanceList");
const suggestionBox = document.getElementById("searchSuggestions");


function showDefaultHubList(){
  hubListDiv.innerHTML = `
    <div class="hub-item">Gilgit — <strong>—</strong></div>
    <div class="hub-item">Muzaffargarh — <strong>—</strong></div>
    <div class="hub-item">Sukkur — <strong>—</strong></div>
  `;
}


/* Search distances on exact match */
searchInput.addEventListener("input", ()=>{
  const q = searchInput.value.trim().toLowerCase();
  if(!q) return showDefaultHubList();


  const match = districtList.find(d=>d.district.toLowerCase()===q);
  if(!match) return showDefaultHubList();


  const row = distanceTable.find(r=>r.district.toLowerCase()===q);
  if(!row) return showDefaultHubList();


  const hubsData = [
    {name:"Gilgit", dist:Number(row.Gilgit)},
    {name:"Muzaffargarh", dist:Number(row.Muzaffargarh)},
    {name:"Sukkur", dist:Number(row.Sukkur)}
  ];


  hubsData.sort((a,b)=>a.dist-b.dist);
  hubListDiv.innerHTML = hubsData.map(h=>`<div class="hub-item">${h.name} — <strong>${h.dist} km</strong></div>`).join("");
});


/* Auto-suggest */
searchInput.addEventListener("input", ()=>{
  const q = searchInput.value.trim().toLowerCase();
  if(!q){ suggestionBox.style.display="none"; return; }


  const matches = districtList.filter(d=>d.district.toLowerCase().startsWith(q)).map(d=>d.district);
  if(matches.length===0){ suggestionBox.style.display="none"; return; }


  suggestionBox.innerHTML = matches.map(m=>`<li class="suggestion-item">${m}</li>`).join("");
  suggestionBox.style.display = "block";
});


suggestionBox.addEventListener("click", e=>{
  if(!e.target.classList.contains("suggestion-item")) return;
  searchInput.value = e.target.textContent;
  suggestionBox.style.display = "none";
  searchInput.dispatchEvent(new Event("input"));
});


document.addEventListener("click", e=>{
  if(!e.target.closest(".left-panel")) suggestionBox.style.display="none";
});
