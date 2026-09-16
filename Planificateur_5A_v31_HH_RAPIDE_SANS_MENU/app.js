
const seed = window.TEACHFLOW_SEED;
const STORAGE_KEY = 'teachflow-2026-2027-v1';
const DEFAULT_STUDENTS_5A = [
  {
    "name": "Kurtis",
    "birthdate": "9/9/2016"
  },
  {
    "name": "Joseph",
    "birthdate": "9/21/2016"
  },
  {
    "name": "Emilie",
    "birthdate": "9/24/2016"
  },
  {
    "name": "Léa",
    "birthdate": "10/5/2016"
  },
  {
    "name": "Tegan",
    "birthdate": "10/7/2016"
  },
  {
    "name": "Lenora",
    "birthdate": "10/8/2016"
  },
  {
    "name": "Emma",
    "birthdate": "11/20/2016"
  },
  {
    "name": "Naomi",
    "birthdate": "11/26/2016"
  },
  {
    "name": "Benjamin",
    "birthdate": "12/8/2016"
  },
  {
    "name": "Dominic",
    "birthdate": "1/26/2016"
  },
  {
    "name": "Eileigh",
    "birthdate": "2/8/2016"
  },
  {
    "name": "Ewelina",
    "birthdate": "2/17/2016"
  },
  {
    "name": "Lexi",
    "birthdate": "2/24/2016"
  },
  {
    "name": "Kalliope",
    "birthdate": "3/15/2016"
  },
  {
    "name": "Odin",
    "birthdate": "5/12/2016"
  },
  {
    "name": "Adefarayola",
    "birthdate": "5/17/2016"
  },
  {
    "name": "Anna",
    "birthdate": "5/18/2016"
  },
  {
    "name": "Nathan",
    "birthdate": "5/25/2016"
  },
  {
    "name": "Maève",
    "birthdate": "6/3/2016"
  },
  {
    "name": "Oliver",
    "birthdate": "6/6/2016"
  },
  {
    "name": "Madilynn",
    "birthdate": "6/20/2016"
  },
  {
    "name": "Deacon",
    "birthdate": "7/7/2016"
  },
  {
    "name": "Isla",
    "birthdate": "7/10/2016"
  },
  {
    "name": "Wyatt",
    "birthdate": "7/16/2016"
  },
  {
    "name": "Araotanlowooluwa",
    "birthdate": "8/5/2016"
  },
  {
    "name": "Sophie",
    "birthdate": "8/13/2016"
  },
  {
    "name": "Jayden",
    "birthdate": "8/21/2016"
  }
];
let state = loadState();
let currentView = 'week';
let weekIndex = 0;
let dayIndex = 0;
let subjectFilter = 'Français';
let cloudUser = null;
let cloudSaveTimer = null;
let cloudReady = false;
ensureImportedResources();

function loadState(){
  try { const saved=localStorage.getItem(STORAGE_KEY); if(saved) return JSON.parse(saved); } catch(e){}
  return structuredClone(seed);
}
function setSyncStatus(text, busy=false){
  const btn=document.getElementById('syncStatusBtn'); if(!btn)return;
  btn.textContent=(busy?'☁️ ':'✓ ')+text;
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if(cloudReady){
    setSyncStatus('Sauvegarde…',true);
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer=setTimeout(syncStateToCloud,500);
  }
}
async function api(path, options={}){
  const res=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  let body=null; try{body=await res.json();}catch(e){}
  if(!res.ok) throw new Error(body?.error||`Erreur ${res.status}`);
  return body;
}
async function syncStateToCloud(){
  if(!cloudReady)return;
  try{await api('/api/state',{method:'POST',body:JSON.stringify({state})});setSyncStatus('Synchronisé');}
  catch(e){setSyncStatus('Erreur de synchro');console.error(e);}
}
function migrateLocalPrivateData(){
  if(!state.private_students){try{state.private_students=JSON.parse(localStorage.getItem('teachflow-private-students')||'[]');}catch(e){state.private_students=[];}}
  if(!Array.isArray(state.private_students) || state.private_students.length===0){
    state.private_students = DEFAULT_STUDENTS_5A.map(x=>({...x}));
  }
  if(!state.quick_links){try{state.quick_links=JSON.parse(localStorage.getItem('teachflow-quick-links')||'[]');}catch(e){state.quick_links=[];}}
  if(!state.class_students)state.class_students=localStorage.getItem('teachflow-local-students')||state.private_students.map(x=>x.name).join('\n');
  if(state.class_reminder==null)state.class_reminder=localStorage.getItem('teachflow-class-reminder')||'';
  ensureImportedResources();
}
async function initializeCloud(){
  const status=await api('/api/auth/status');
  if(status.setupRequired){showAuth(true);return;}
  if(!status.authenticated){showAuth(false);return;}
  await finishCloudLogin(status.user);
}
async function finishCloudLogin(user){
  cloudUser=user;
  const remote=await api('/api/state');
  if(remote.state){state=remote.state;localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  else{state=loadState();migrateLocalPrivateData();}
  migrateLocalPrivateData();
  cloudReady=true;
  document.getElementById('authDialog').close();
  setSyncStatus('Synchronisé');
  render();
  if(!remote.state) await syncStateToCloud();
}
function showAuth(setup){
  cloudReady=false;
  const dialog=document.getElementById('authDialog');
  document.getElementById('authTitle').textContent=setup?'Créer ton accès TeachFlow':'Connexion';
  document.getElementById('authIntro').textContent=setup?'Première ouverture : crée ton identifiant privé. Il servira sur tes ordinateurs à la maison et à l’école.':'Connecte-toi pour retrouver la même planification sur tous tes appareils.';
  document.querySelectorAll('.setup-only').forEach(x=>x.style.display=setup?'block':'none');
  document.getElementById('authSubmit').textContent=setup?'Créer mon accès':'Se connecter';
  document.getElementById('authPassword').autocomplete=setup?'new-password':'current-password';
  document.getElementById('authMessage').textContent='';
  document.getElementById('authSubmit').onclick=async()=>{
    const username=document.getElementById('authUsername').value.trim();
    const password=document.getElementById('authPassword').value;
    const password2=document.getElementById('authPassword2').value;
    const msg=document.getElementById('authMessage');
    if(!username||password.length<8){msg.textContent='Utilise un nom et un mot de passe d’au moins 8 caractères.';return;}
    if(setup&&password!==password2){msg.textContent='Les deux mots de passe ne correspondent pas.';return;}
    try{msg.textContent='Connexion…';const out=await api(setup?'/api/auth/setup':'/api/auth/login',{method:'POST',body:JSON.stringify({username,password})});await finishCloudLogin(out.user);}
    catch(e){msg.textContent=e.message;}
  };
  if(!dialog.open)dialog.showModal();
}

const content=document.getElementById('content');
const pageTitle=document.getElementById('pageTitle');
const eyebrow=document.getElementById('eyebrow');

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active')); btn.classList.add('active');
  currentView=btn.dataset.view; render(); document.getElementById('sidebar').classList.remove('open');
}));
document.getElementById('menuBtn').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
document.getElementById('printBtn').onclick=()=>window.print();
document.getElementById('todayBtn').onclick=()=>{weekIndex=0; currentView='week'; activateNav('week'); render();};
document.getElementById('exportBtn').onclick=exportData;

function activateNav(v){document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===v));}
function weekLabel(w){return `${w.Mois||''} · semaine ${String(w['Sem.']||'').replace('.0','')} · ${w.Dates||''}`;}
function normalizeKey(s){return s.replace(/\n/g,' ').replace(/[📖✏️🔢🧩🔬🌍✝️🎨🌟📝]/g,'').trim();}
function esc(s=''){
  s=String(s)
    .replace(/Les arts/g,'Les arts')
    .replace(/Mme Rushnelle/g,'Mme Rushnelle');
  return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function subjectClass(k){return k.includes('Math')?'Mathématiques':k.includes('Science')?'Sciences':k.includes('social')?'Études sociales':k.includes('rel')?'Religion':k.includes('Art')?'Arts':k.includes('Écriture')?'Écriture':k.includes('Lecture')?'Lecture':k.includes('Grammaire')?'Grammaire':k.includes('Projet')?'Projet':normalizeKey(k);}

const SUBJECTS=['Français','Mathématiques','Sciences','Enseignement religieux','Études sociales','Arts','Éducation physique / Santé','Anglais','Autre'];
function canonicalSubjectFromKey(k=''){
  const x=stripAccents(normalizeKey(k));
  if(x.includes('math')||x.includes('modulo'))return 'Mathématiques';
  if(x.includes('science'))return 'Sciences';
  if(x.includes('social'))return 'Études sociales';
  if(x.includes('rel'))return 'Enseignement religieux';
  if(x.includes('lecture')||x.includes('ecriture')||x.includes('grammaire')||x.includes('grapheme')||x.includes('litteratie'))return 'Français';
  if(x.includes('art'))return 'Arts';
  if(x.includes('anglais'))return 'Anglais';
  if(x.includes('education physique')||x.includes('sante'))return 'Éducation physique / Santé';
  return 'Autre';
}
function subjectSlug(subject='Autre'){const s=stripAccents(subject);if(s.startsWith('franc'))return 'francais';if(s.startsWith('math'))return 'maths';if(s.startsWith('science'))return 'sciences';if(s.startsWith('enseignement'))return 'religion';if(s.startsWith('etudes'))return 'sociales';return 'autres';}
function subjectColorLabel(subject){return {'Français':'Jaune','Mathématiques':'Bleu','Sciences':'Vert','Enseignement religieux':'Violet','Études sociales':'Rouge'}[subject]||'Gris';}
function ensureUnits(){if(!Array.isArray(state.units))state.units=[];return state.units;}
function unitById(id){return ensureUnits().find(u=>u.id===id);}
function makeId(){return 'u_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);}
function ensureImportedResources(){
  const imported=Array.isArray(window.TEACHFLOW_IMPORTED_LINKS)?window.TEACHFLOW_IMPORTED_LINKS:[];
  if(!Array.isArray(state.resources))state.resources=[];
  const urls=new Set(state.resources.map(r=>r.url));
  imported.forEach(r=>{if(r.url&&!urls.has(r.url)){state.resources.push({...r});urls.add(r.url);}});
  return state.resources;
}
function resourceDomain(url=''){try{return new URL(url).hostname.replace(/^www\./,'');}catch(e){return '';}}
function renderResources(){
  pageTitle.textContent='Ressources et liens';ensureImportedResources();
  const cats=['Toutes',...Array.from(new Set(state.resources.map(r=>r.category||'Autre')))];
  content.innerHTML=`<div class="section-card"><div class="section-head"><div><h2>Mes liens de planification</h2><p class="muted-copy">Les hyperliens retrouvés dans ta planification originale sont réintégrés ici. Tu peux les ouvrir, les rechercher ou les ajouter à tes liens rapides.</p></div><button class="primary-btn" id="addResourceBtn">+ Ajouter un lien</button></div><div class="resource-tools"><input class="search" id="resourceSearch" placeholder="Rechercher un lien, une matière ou une ressource…"><select class="search resource-filter" id="resourceCategory">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div></div><div id="resourceList" class="resource-grid"></div>`;
  const paint=()=>{const q=(document.getElementById('resourceSearch').value||'').toLowerCase(),cat=document.getElementById('resourceCategory').value;const rows=state.resources.filter(r=>(cat==='Toutes'||r.category===cat)&&(!q||`${r.label} ${r.category} ${r.url}`.toLowerCase().includes(q)));document.getElementById('resourceList').innerHTML=rows.length?rows.map(r=>`<article class="resource-card"><div class="resource-meta"><span class="resource-category">${esc(r.category||'Autre')}</span><small>${esc(resourceDomain(r.url))}</small></div><h3>${esc(r.label||'Ressource')}</h3><a class="resource-url" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a><div class="resource-actions"><a class="primary-btn resource-open" href="${esc(r.url)}" target="_blank" rel="noopener">Ouvrir ↗</a><button class="ghost-btn" data-quick-resource="${esc(r.id)}">+ Liens rapides</button>${r.imported?'':'<button class="ghost-btn danger-soft" data-delete-resource="'+esc(r.id)+'">Supprimer</button>'}</div></article>`).join(''):'<div class="empty-state"><h2>Aucun lien trouvé</h2><p>Essaie une autre recherche ou ajoute une ressource.</p></div>';
    document.querySelectorAll('[data-quick-resource]').forEach(b=>b.onclick=()=>{const r=state.resources.find(x=>x.id===b.dataset.quickResource);if(!r)return;state.quick_links=state.quick_links||[];if(!state.quick_links.some(x=>x.url===r.url))state.quick_links.push({label:r.label,url:r.url});saveState();alert('Lien ajouté au Tableau de classe.');});
    document.querySelectorAll('[data-delete-resource]').forEach(b=>b.onclick=()=>{state.resources=state.resources.filter(x=>x.id!==b.dataset.deleteResource);saveState();paint();});
  };
  document.getElementById('resourceSearch').oninput=paint;document.getElementById('resourceCategory').onchange=paint;
  document.getElementById('addResourceBtn').onclick=()=>{const label=prompt('Nom de la ressource :');if(!label)return;const category=prompt('Catégorie / matière :','Planif annuelle')||'Autre';let url=prompt('Adresse web :','https://');if(!url)return;if(!/^https?:\/\//i.test(url))url='https://'+url;state.resources.push({id:'res_'+Date.now().toString(36),label:label.trim(),category:category.trim(),url:url.trim(),imported:false});saveState();renderResources();};
  paint();
}
function fieldsForSubject(subject){
  if(subject==='Français')return ['📖 Lecture\n& C.O.','✏️ Écriture','Grammaire\nciblée','Graphème\n (devoirs)'];
  if(subject==='Mathématiques')return ['🔢 Maths','🧩 Concepts spécifiques\npar leçon Modulo'];
  if(subject==='Sciences')return ['🔬 Sciences'];
  if(subject==='Études sociales')return ['🌍 Ét. sociales'];
  if(subject==='Enseignement religieux')return ['✝️ Ens. rel.'];
  if(subject==='Arts')return ['🎨 Arts'];
  return ['🌟 Projet /\nIntégration','📝 Notes /\nÉvénements'];
}

const MONTHS_FR={janvier:0,janv:0,fevrier:1,février:1,fevr:1,févr:1,mars:2,avril:3,mai:4,juin:5,juillet:6,juil:6,aout:7,août:7,septembre:8,sept:8,octobre:9,oct:9,novembre:10,nov:10,decembre:11,décembre:11,dec:11,déc:11};
function stripAccents(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function monthIndexFromWeek(w){const candidates=[w.Mois,w.Dates].filter(Boolean).join(' ').toLowerCase();for(const [name,idx] of Object.entries(MONTHS_FR)){if(candidates.includes(name)||stripAccents(candidates).includes(stripAccents(name)))return idx;}return 8;}
function schoolYearForMonth(monthIndex){return monthIndex>=8?2026:2027;}
function datesForWeek(w){const month=monthIndexFromWeek(w),year=schoolYearForMonth(month);const match=String(w.Dates||'').match(/(\d{1,2})/);const startDay=match?Number(match[1]):1;const anchor=new Date(year,month,startDay,12,0,0);const jsDay=anchor.getDay();const mondayOffset=jsDay===0?-6:1-jsDay;const monday=new Date(anchor);monday.setDate(anchor.getDate()+mondayOffset);return Array.from({length:5},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});}
function fmtDay(d){return new Intl.DateTimeFormat('fr-CA',{weekday:'long',day:'numeric',month:'long'}).format(d);}
function fmtDateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function capitalizeFirst(s){return s?String(s).charAt(0).toUpperCase()+String(s).slice(1):s;}
function getDayDetail(key){state.day_details=state.day_details||{};const d=state.day_details[key]||(state.day_details[key]={notes:'',notesHtml:'',links:[],images:[]});if(typeof d.links==='string'){d.links=d.links.split(/\n+/).map(url=>url.trim()).filter(Boolean).map(url=>({label:url.replace(/^https?:\/\//,'').replace(/\/$/,''),url}));}if(!Array.isArray(d.links))d.links=[];if(!Array.isArray(d.images))d.images=[];return d;}

function getPrivateStudents(){return state.private_students||[];}
function savePrivateStudents(rows){state.private_students=rows;state.class_students=rows.map(x=>x.name).join('\n');saveState();}
function parseBirthdayDate(raw=''){
  const s=String(raw).trim(); if(!s)return null;
  let m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/); if(!m)return null;
  let a=Number(m[1]),b=Number(m[2]),y=Number(m[3]); if(y<100)y+=2000;
  // Les listes de classe fournies à TeachFlow utilisent M/J/AAAA. Si le premier nombre >12, on accepte J/M/AAAA.
  let month=a,day=b;if(a>12){day=a;month=b;}
  if(month<1||month>12||day<1||day>31)return null;
  return {month,day,year:y};
}
function birthdaysForDate(d){
  return getPrivateStudents().filter(st=>{const b=parseBirthdayDate(st.birthdate);return b&&b.month===d.getMonth()+1&&b.day===d.getDate();});
}
function parseStudentText(text=''){
  const lines=String(text).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length)return [];
  const delim=lines[0].includes('\t')?'\t':lines[0].includes(';')?';':',';
  const split=line=>delim==='\t'?line.split('\t'):line.split(delim);
  let start=0;const first=split(lines[0]).map(x=>stripAccents(x.replace(/^"|"$/g,'').trim()));
  if(first.some(x=>/prenom|nom|ddn|naissance|birthday/.test(x)))start=1;
  const out=[];
  for(let i=start;i<lines.length;i++){
    const cells=split(lines[i]).map(x=>x.replace(/^"|"$/g,'').trim());
    if(cells.length<2)continue;
    const name=cells[0],birthdate=cells[1]; if(name&&parseBirthdayDate(birthdate))out.push({name,birthdate});
  }
  return out;
}


function render(){
  eyebrow.textContent=`${state.meta.annee} · ${state.meta.classe}`;
  if(currentView==='week') renderWeek();
  if(currentView==='day') renderDay();
  if(currentView==='classboard') renderClassboard();
  if(currentView==='classhub') renderClassHub();
  if(currentView==='reussir') renderReussir();
  if(currentView==='prayers') renderPrayers();
  if(currentView==='subjects') renderSubjects();
  if(currentView==='units') renderUnits();
  if(currentView==='annual') renderAnnual();
  if(currentView==='schedule') renderSchedule();
  if(currentView==='homework') renderHomework();
  if(currentView==='resources') renderResources();
  if(currentView==='students') renderStudents();
  if(currentView==='guards') renderGuards();
  if(currentView==='settings') renderSettings();
}

function renderWeek(){
  pageTitle.textContent='Planification de la semaine';
  const weeks=state.planification_hebdomadaire||[]; if(!weeks.length){content.innerHTML='<div class="empty-state"><h2>Aucune semaine</h2></div>';return;}
  weekIndex=Math.max(0,Math.min(weekIndex,weeks.length-1)); const w=weeks[weekIndex];
  const dates=datesForWeek(w);
  const columns=[['Lundi',['📖 Lecture\n& C.O.','✏️ Écriture','Grammaire\nciblée']],['Mardi',['🔢 Maths','🧩 Concepts spécifiques\npar leçon Modulo']],['Mercredi',['🔬 Sciences','🌍 Ét. sociales']],['Jeudi',['✝️ Ens. rel.','🎨 Arts']],['Vendredi',['🌟 Projet /\nIntégration','Graphème\n (devoirs)','📝 Notes /\nÉvénements']]];
  const summary=[['Graphème',w['Graphème\n (devoirs)']],['Grammaire',w['Grammaire\nciblée']],['Projet',w['🌟 Projet /\nIntégration']],['Événements',w['📝 Notes /\nÉvénements']]];
  content.innerHTML=`<div class="week-toolbar"><div class="week-nav"><button class="ghost-btn" id="prevWeek">←</button><strong>${esc(weekLabel(w))}</strong><button class="ghost-btn" id="nextWeek">→</button></div><div style="display:flex;gap:8px;width:min(520px,100%)"><input class="search" id="weekSearch" placeholder="Rechercher dans la semaine…"><button class="primary-btn" id="editWeek">Modifier</button></div></div><div class="summary-strip">${summary.map(([a,b])=>`<div class="summary-card"><small>${esc(a)}</small><strong>${esc(b||'—')}</strong></div>`).join('')}</div><div class="week-grid" id="weekGrid">${columns.map(([day,keys],i)=>{const d=dates[i],key=fmtDateKey(d),detail=getDayDetail(key);return `<div class="day-column"><button class="day-head day-open" data-day="${key}" data-day-index="${i}"><span><strong>${esc(capitalizeFirst(fmtDay(d)))}</strong>${birthdaysForDate(d).length?`<small class="birthday-line">🎂 ${birthdaysForDate(d).map(x=>esc(x.name)).join(' · ')}</small>`:''}<small class="day-hint">${detail.notes||detail.notesHtml||detail.links?.length||detail.images?.length?'● Infos ajoutées':'Cliquer pour ajouter infos, liens et images'}</small></span><small>Jour ${i+1}</small></button><div class="day-body">${keys.map(k=>lessonCard(k,w[k])).join('')}</div></div>`;}).join('')}</div>`;
  document.getElementById('prevWeek').onclick=()=>{weekIndex=Math.max(0,weekIndex-1);renderWeek()};
  document.getElementById('nextWeek').onclick=()=>{weekIndex=Math.min(weeks.length-1,weekIndex+1);renderWeek()};
  document.getElementById('editWeek').onclick=()=>openEditWeek(weekIndex);document.getElementById('weekSearch').oninput=e=>filterWeek(e.target.value);
  document.querySelectorAll('.lesson-card').forEach(c=>c.onclick=e=>{if(e.target.closest('.unit-link-btn'))return;openEditWeek(weekIndex);});
  document.querySelectorAll('.unit-link-btn').forEach(b=>b.onclick=e=>{e.stopPropagation();const card=b.closest('.lesson-card');addLessonToUnit(card.dataset.subject,card.dataset.field,card.querySelector('p').innerText);});
  document.querySelectorAll('.day-open').forEach(btn=>btn.onclick=()=>openDayDetail(btn.dataset.day,Number(btn.dataset.dayIndex),dates[Number(btn.dataset.dayIndex)]));
}
function lessonCard(k,v){if(!v||!String(v).trim())return '';const subject=canonicalSubjectFromKey(k),slug=subjectSlug(subject);return `<article class="lesson-card subject-${slug}" data-field="${esc(k)}" data-subject="${esc(subject)}" data-text="${esc((k+' '+v).toLowerCase())}"><div class="lesson-card-top"><div class="subject">${esc(subject)}</div><button class="unit-link-btn" type="button" title="Ajouter cette leçon à une unité">+ Unité</button></div><p>${esc(v)}</p></article>`;}
function filterWeek(q){q=q.toLowerCase().trim();document.querySelectorAll('.lesson-card').forEach(c=>c.style.display=!q||c.dataset.text.includes(q)?'block':'none');}



function renderReussir(){
  pageTitle.textContent='Habitudes de travail';
  state.reussir=state.reussir||{};
  const r=state.reussir;
  r.semester=Number(r.semester||1);
  r.tab=r.tab||'classe';
  r.observations=Array.isArray(r.observations)?r.observations:[];

  const hh=[
    ['Collaboration','Collaboration'],
    ['Autonomie','Autonomie'],
    ['Autorégulation','Autorégulation'],
    ['Fiabilité','Fiabilité'],
    ['Organisation','Organisation'],
    ['Initiative','Initiative'],
    ['Français oral','Utilisation du français oral']
  ];
  const students=(state.class_students||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const semesterObs=r.observations.filter(o=>Number(o.semester||1)===r.semester);

  content.innerHTML=`
    <div class="tf-reussir tf-hh">
      <section class="hh-top">
        <div>
          <span class="eyebrow">5A · 2026–2027</span>
          <h2>Habitudes de travail</h2>
          <p>Choisis un élève — ou toute la classe — puis touche simplement le HH observé.</p>
        </div>
        <div class="hh-semesters">
          <button data-sem="1" class="${r.semester===1?'active':''}">1er semestre</button>
          <button data-sem="2" class="${r.semester===2?'active':''}">2e semestre</button>
        </div>
      </section>

      <div class="hh-tabs">
        <button data-rtab="classe" class="${r.tab==='classe'?'active':''}">👥 Élèves</button>
        <button data-rtab="historique" class="${r.tab==='historique'?'active':''}">🕘 Historique</button>
        <button data-rtab="sommaire" class="${r.tab==='sommaire'?'active':''}">📊 Sommaire</button>
      </div>
      <div id="reussirPanel"></div>
    </div>`;

  const renderPanel=()=>{
    const panel=document.getElementById('reussirPanel');
    if(r.tab==='classe'){
      panel.innerHTML=`
        <section class="hh-student-card">
          <div class="hh-section-title">
            <div><strong>1. Choisir</strong><span>Trouve rapidement l’élève</span></div>
            <input id="hhStudentSearch" type="search" placeholder="🔎 Rechercher un élève…">
          </div>
          <div class="hh-student-grid" id="hhStudentGrid">
            <button class="hh-student all" data-hh-student="__ALL__"><b>✓ Tous</b><span>Toute la classe</span></button>
            ${students.map(n=>`<button class="hh-student" data-hh-student="${esc(n)}"><b>${esc(n)}</b></button>`).join('')}
          </div>
        </section>
        <section class="hh-award-card" id="hhAwardCard">
          <div class="hh-section-title"><div><strong>2. Choisir le HH</strong><span id="hhChosenLabel">Sélectionne d’abord un élève ou « Tous ».</span></div></div>
          <div class="hh-choice-grid">
            ${hh.map(([key,label],i)=>`<button class="hh-choice" data-hh-index="${i}" disabled><span>${i+1}</span><strong>${esc(label)}</strong></button>`).join('')}
          </div>
          <div class="hh-success" id="hhSuccess"></div>
        </section>`;
      let chosen='';
      const chooseStudent=(value,btn)=>{
        chosen=value;
        document.querySelectorAll('.hh-student').forEach(x=>x.classList.remove('selected'));
        btn.classList.add('selected');
        document.querySelectorAll('.hh-choice').forEach(x=>x.disabled=false);
        document.getElementById('hhChosenLabel').textContent=value==='__ALL__'?'Toute la classe sélectionnée':value+' sélectionné(e)';
        document.getElementById('hhAwardCard').scrollIntoView({behavior:'smooth',block:'nearest'});
      };
      document.querySelectorAll('[data-hh-student]').forEach(btn=>btn.onclick=()=>chooseStudent(btn.dataset.hhStudent,btn));
      document.getElementById('hhStudentSearch').oninput=e=>{
        const q=e.target.value.trim().toLocaleLowerCase('fr');
        document.querySelectorAll('.hh-student:not(.all)').forEach(btn=>{
          btn.style.display=(btn.textContent||'').toLocaleLowerCase('fr').includes(q)?'':'none';
        });
      };
      document.querySelectorAll('[data-hh-index]').forEach(btn=>btn.onclick=()=>{
        if(!chosen)return;
        const [key,label]=hh[Number(btn.dataset.hhIndex)];
        const targets=chosen==='__ALL__'?students:[chosen];
        if(!targets.length)return;
        const stamp=Date.now();
        targets.forEach((student,i)=>r.observations.unshift({
          id:stamp+i,semester:r.semester,student,key,label,note:'',date:new Date().toISOString()
        }));
        saveState();
        const success=document.getElementById('hhSuccess');
        success.textContent=chosen==='__ALL__'?`✓ ${label} ajouté à toute la classe (${targets.length} élèves).`:`✓ ${label} ajouté à ${chosen}.`;
        success.classList.add('show');
        setTimeout(()=>success.classList.remove('show'),2400);
      });
    } else if(r.tab==='historique'){
      panel.innerHTML=`
        <section class="hh-list-card">
          <div class="hh-section-title"><div><strong>Historique</strong><span>${r.semester===1?'1er':'2e'} semestre · ${semesterObs.length} observation${semesterObs.length===1?'':'s'}</span></div></div>
          <div class="hh-history">
          ${semesterObs.length?semesterObs.map(o=>`<article><strong>${esc(o.student||'Classe')}</strong><span>${esc(o.label||o.key||'')}</span><small>${new Date(o.date).toLocaleDateString('fr-CA')}</small><button data-del-obs="${o.id}">×</button></article>`).join(''):'<p class="muted-copy">Aucune observation pour ce semestre.</p>'}
          </div>
        </section>`;
      document.querySelectorAll('[data-del-obs]').forEach(b=>b.onclick=()=>{
        r.observations=r.observations.filter(o=>String(o.id)!==String(b.dataset.delObs));saveState();renderReussir();
      });
    } else {
      const byStudent={};
      students.forEach(s=>byStudent[s]={});
      semesterObs.forEach(o=>{
        byStudent[o.student]=byStudent[o.student]||{};
        const k=o.label||o.key||'';
        byStudent[o.student][k]=(byStudent[o.student][k]||0)+1;
      });
      panel.innerHTML=`
        <section class="hh-list-card">
          <div class="hh-section-title"><div><strong>Sommaire HH</strong><span>Nombre d’observations positives par élève</span></div></div>
          <div class="hh-summary-table">
            <div class="hh-summary-row header"><strong>Élève</strong>${hh.map(([k,l])=>`<span>${esc(l)}</span>`).join('')}</div>
            ${students.map(s=>`<div class="hh-summary-row"><strong>${esc(s)}</strong>${hh.map(([k,l])=>`<span>${byStudent[s]?.[l]||byStudent[s]?.[k]||0}</span>`).join('')}</div>`).join('')}
          </div>
        </section>`;
    }
  };

  document.querySelectorAll('[data-rtab]').forEach(b=>b.onclick=()=>{r.tab=b.dataset.rtab;saveState();renderReussir();});
  document.querySelectorAll('[data-sem]').forEach(b=>b.onclick=()=>{r.semester=Number(b.dataset.sem);saveState();renderReussir();});
  renderPanel();
}
function renderClassHub(){
  pageTitle.textContent='Centre de classe';

  const students=(state.class_students||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
  state.classhub=state.classhub||{};
  const hub=state.classhub;
  hub.checklist=Array.isArray(hub.checklist)?hub.checklist:[
    {text:'Agenda et devoirs vérifiés',done:false},
    {text:'Matériel prêt',done:false},
    {text:'Responsabilités vérifiées',done:false},
    {text:'Lecture silencieuse / tâche autonome',done:false}
  ];
  hub.points=Number.isFinite(Number(hub.points))?Number(hub.points):0;
  hub.goal=Number.isFinite(Number(hub.goal))?Number(hub.goal):20;
  hub.voice=hub.voice||'2';
  hub.mood=hub.mood||'';
  hub.relief=hub.relief||{important:'',routine:'',dismissal:''};

  const now=new Date();
  const cycle=tf8CycleDay(now);
  const ev=tf9SchoolEvent(now);
  const guard=tf8GuardForDate(now);
  const todaySchedule=cycle?tf8ScheduleRows().map(slot=>({
    time:tf8TimeOfSlot(slot),
    activity:tf8ActivityForSlot(slot,cycle)
  })).filter(x=>x.activity):[];

  content.innerHTML=`
    <div class="classhub-page">
      <div class="classhub-hero">
        <div>
          <span class="eyebrow">ENSEIGNER · ORGANISER · PRÉSENTER</span>
          <h2>Centre de classe</h2>
          <p>Un espace unique pour les routines, rotations, récompenses et outils de classe.</p>
        </div>
        <div class="classhub-today">
          <strong>${esc(capitalizeFirst(new Intl.DateTimeFormat('fr-CA',{weekday:'long',day:'numeric',month:'long'}).format(now)))}</strong>
          <span>${cycle?`Jour ${cycle}`:(ev?esc(ev.label):'Pas de classe')}</span>
        </div>
      </div>

      <div class="classhub-grid">
        <section class="hub-card hub-wide">
          <div class="hub-card-head"><div><strong>☀️ Coup d’œil aujourd’hui</strong><small>Horaire, cycle et garde</small></div></div>
          <div class="snapshot-grid">
            <div class="snapshot-meta">
              <div><span>Cycle</span><strong>${cycle?`Jour ${cycle}`:'—'}</strong></div>
              <div><span>Événement</span><strong>${ev?esc(ev.label):'Journée régulière'}</strong></div>
              <div><span>Garde</span><strong>${guard?esc(guard.place):'—'}</strong></div>
            </div>
            <div class="snapshot-schedule">
              ${todaySchedule.length?todaySchedule.map(x=>`<div><span>${esc(x.time)}</span><strong>${esc(x.activity)}</strong></div>`).join(''):'<p class="muted-copy">Aucun horaire scolaire aujourd’hui.</p>'}
            </div>
          </div>
        </section>

        <section class="hub-card">
          <div class="hub-card-head"><div><strong>✅ Routine / checklist</strong><small>Liste réutilisable</small></div><button class="mini-action" id="hubAddChecklist">+</button></div>
          <div class="hub-checklist" id="hubChecklist">
            ${hub.checklist.map((it,i)=>`<label><input type="checkbox" data-hub-check="${i}" ${it.done?'checked':''}><span>${esc(it.text)}</span><button type="button" data-hub-del="${i}">×</button></label>`).join('')}
          </div>
          <button class="ghost-btn full-btn" id="hubResetChecklist">Réinitialiser les coches</button>
        </section>

        <section class="hub-card">
          <div class="hub-card-head"><div><strong>🏆 Récompense de classe</strong><small>Objectif collectif</small></div></div>
          <div class="reward-score"><strong id="hubPoints">${hub.points}</strong><span>/ <input id="hubGoal" type="number" min="1" value="${hub.goal}"></span></div>
          <div class="reward-bar"><div id="hubRewardFill" style="width:${Math.min(100,(hub.points/hub.goal)*100)}%"></div></div>
          <div class="hub-row-actions"><button class="ghost-btn" id="hubMinusPoint">−1</button><button class="primary-btn" id="hubPlusPoint">+1</button><button class="ghost-btn" id="hubResetPoints">↺</button></div>
          <div id="hubRewardMessage" class="reward-message">${hub.points>=hub.goal?'🎉 Objectif atteint!':'Encore '+Math.max(0,hub.goal-hub.points)+' point(s)!'}</div>
        </section>

        <section class="hub-card">
          <div class="hub-card-head"><div><strong>🔊 Niveau de voix</strong><small>Attente visible pour les élèves</small></div></div>
          <div class="voice-buttons">
            <button data-voice="0">0<br><span>Silence</span></button>
            <button data-voice="1">1<br><span>Chuchoter</span></button>
            <button data-voice="2">2<br><span>Partenaire</span></button>
            <button data-voice="3">3<br><span>Équipe</span></button>
          </div>
          <div class="voice-display" id="voiceDisplay"></div>
        </section>

        <section class="hub-card">
          <div class="hub-card-head"><div><strong>💛 Météo intérieure</strong><small>Lecture rapide de l’ambiance du groupe</small></div></div>
          <div class="mood-buttons">
            <button data-mood="😄">😄<span>Énergique</span></button>
            <button data-mood="🙂">🙂<span>Bien</span></button>
            <button data-mood="😐">😐<span>Calme</span></button>
            <button data-mood="😕">😕<span>À recentrer</span></button>
            <button data-mood="😴">😴<span>Fatigué</span></button>
          </div>
          <p class="hub-selection" id="hubMoodText">${hub.mood?`Ambiance choisie : ${esc(hub.mood)}`:'Choisis l’ambiance générale de la classe.'}</p>
        </section>

        <section class="hub-card hub-wide">
          <div class="hub-card-head"><div><strong>🔄 Créateur de rotations</strong><small>Centres, ateliers ou équipes</small></div></div>
          <div class="rotation-controls">
            <label>Nombre de groupes<select id="rotationGroups"><option>2</option><option selected>3</option><option>4</option><option>5</option><option>6</option></select></label>
            <label>Nombre de stations<select id="rotationStations"><option>2</option><option selected>3</option><option>4</option><option>5</option><option>6</option></select></label>
            <label>Durée<input id="rotationMinutes" type="number" min="5" max="60" value="15"><span> min</span></label>
            <button class="primary-btn" id="buildRotation">Créer</button>
          </div>
          <div id="rotationOutput" class="rotation-output"><p class="muted-copy">Crée une rotation à partir de ta liste d’élèves.</p></div>
        </section>

        <section class="hub-card hub-wide">
          <div class="hub-card-head"><div><strong>📝 Remplacement / suppléance</strong><small>Passation rapide à une autre personne</small></div></div>
          <div class="relief-grid">
            <label>À savoir aujourd’hui<textarea id="reliefImportant">${esc(hub.relief.important||'')}</textarea></label>
            <label>Routine de la classe<textarea id="reliefRoutine">${esc(hub.relief.routine||'')}</textarea></label>
            <label>Fin de journée / autobus<textarea id="reliefDismissal">${esc(hub.relief.dismissal||'')}</textarea></label>
          </div>
          <div class="hub-row-actions"><button class="ghost-btn" id="saveRelief">Enregistrer</button><button class="primary-btn" id="printRelief">Imprimer la fiche</button></div>
        </section>
      </div>
    </div>`;

  // checklist
  document.querySelectorAll('[data-hub-check]').forEach(el=>el.onchange=()=>{
    hub.checklist[Number(el.dataset.hubCheck)].done=el.checked; saveState();
  });
  document.querySelectorAll('[data-hub-del]').forEach(btn=>btn.onclick=e=>{
    e.preventDefault(); e.stopPropagation();
    hub.checklist.splice(Number(btn.dataset.hubDel),1); saveState(); renderClassHub();
  });
  document.getElementById('hubAddChecklist').onclick=()=>{
    const t=prompt('Ajouter une étape :'); if(!t)return;
    hub.checklist.push({text:t,done:false}); saveState(); renderClassHub();
  };
  document.getElementById('hubResetChecklist').onclick=()=>{
    hub.checklist.forEach(x=>x.done=false); saveState(); renderClassHub();
  };

  // rewards
  const redrawReward=()=>{
    const goal=Math.max(1,Number(document.getElementById('hubGoal').value)||20);
    hub.goal=goal;
    document.getElementById('hubPoints').textContent=hub.points;
    document.getElementById('hubRewardFill').style.width=Math.min(100,(hub.points/goal)*100)+'%';
    document.getElementById('hubRewardMessage').textContent=hub.points>=goal?'🎉 Objectif atteint!':`Encore ${Math.max(0,goal-hub.points)} point(s)!`;
    saveState();
  };
  document.getElementById('hubPlusPoint').onclick=()=>{hub.points++;redrawReward();};
  document.getElementById('hubMinusPoint').onclick=()=>{hub.points=Math.max(0,hub.points-1);redrawReward();};
  document.getElementById('hubResetPoints').onclick=()=>{hub.points=0;redrawReward();};
  document.getElementById('hubGoal').onchange=redrawReward;

  // voice level
  const voiceLabels={'0':'🤫 Silence complet','1':'🤐 Chuchoter','2':'🗣️ Parler avec son partenaire','3':'👥 Discussion d’équipe'};
  const setVoice=v=>{
    hub.voice=v; saveState();
    document.querySelectorAll('[data-voice]').forEach(b=>b.classList.toggle('active',b.dataset.voice===v));
    document.getElementById('voiceDisplay').textContent=voiceLabels[v];
  };
  document.querySelectorAll('[data-voice]').forEach(b=>b.onclick=()=>setVoice(b.dataset.voice));
  setVoice(String(hub.voice||'2'));

  // mood
  document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{
    hub.mood=b.dataset.mood; saveState();
    document.querySelectorAll('[data-mood]').forEach(x=>x.classList.toggle('active',x.dataset.mood===hub.mood));
    document.getElementById('hubMoodText').textContent='Ambiance choisie : '+hub.mood;
  });
  document.querySelectorAll('[data-mood]').forEach(x=>x.classList.toggle('active',x.dataset.mood===hub.mood));

  // rotations
  document.getElementById('buildRotation').onclick=()=>{
    if(!students.length){document.getElementById('rotationOutput').innerHTML='<p class="muted-copy">Ajoute d’abord les élèves dans la section Élèves.</p>';return;}
    const gcount=Math.max(2,Number(document.getElementById('rotationGroups').value)||3);
    const scount=Math.max(2,Number(document.getElementById('rotationStations').value)||3);
    const mins=Math.max(5,Number(document.getElementById('rotationMinutes').value)||15);
    const names=[...students];
    for(let i=names.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[names[i],names[j]]=[names[j],names[i]];}
    const groups=Array.from({length:gcount},()=>[]);
    names.forEach((n,i)=>groups[i%gcount].push(n));
    const stations=Array.from({length:scount},(_,i)=>`Station ${i+1}`);
    const rounds=Math.max(gcount,scount);
    document.getElementById('rotationOutput').innerHTML=`
      <div class="rotation-groups">${groups.map((g,i)=>`<div><strong>Groupe ${i+1}</strong>${g.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`).join('')}</div>
      <div class="rotation-table">
        ${Array.from({length:rounds},(_,r)=>`<div class="rotation-round"><strong>Rotation ${r+1} · ${mins} min</strong>${groups.map((g,i)=>`<span>Groupe ${i+1} → ${stations[(i+r)%scount]}</span>`).join('')}</div>`).join('')}
      </div>`;
  };

  // relief handoff
  document.getElementById('saveRelief').onclick=()=>{
    hub.relief={
      important:document.getElementById('reliefImportant').value,
      routine:document.getElementById('reliefRoutine').value,
      dismissal:document.getElementById('reliefDismissal').value
    }; saveState(); alert('Fiche de suppléance enregistrée.');
  };
  document.getElementById('printRelief').onclick=()=>{
    hub.relief={
      important:document.getElementById('reliefImportant').value,
      routine:document.getElementById('reliefRoutine').value,
      dismissal:document.getElementById('reliefDismissal').value
    }; saveState(); window.print();
  };
}


function renderClassboard(){
  pageTitle.textContent='Tableau de classe';const localLinks=state.quick_links||[];const localStudents=state.class_students||'';
  content.innerHTML=`<div class="classboard-head"><div><h2>Outils de classe</h2><p>Widgets de classe : agenda, minuterie, liens rapides, choix aléatoire et rappels.</p></div><button class="ghost-btn" id="backToPlan">← Retour à la planification</button></div><div class="widget-grid"><section class="widget"><small>DATE ET HEURE</small><div class="big-clock" id="liveClock">--:--</div><div id="liveDate" class="widget-sub"></div></section><section class="widget"><small>MINUTERIE</small><div class="timer-display" id="timerDisplay">10:00</div><div class="widget-actions"><button class="primary-btn" id="timerStart">Démarrer</button><button class="ghost-btn" id="timerReset">Réinitialiser</button></div><div class="timer-presets"><button data-min="5">5 min</button><button data-min="10">10 min</button><button data-min="20">20 min</button></div></section><section class="widget widget-wide"><small>AGENDA DE LA SEMAINE</small><div id="agendaWidget" class="agenda-widget"></div></section><section class="widget"><small>LIENS RAPIDES</small><div id="quickLinks" class="quick-links">${localLinks.map((l,i)=>`<div class="quick-link-row"><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a><button data-remove-link="${i}">×</button></div>`).join('')||'<p class="muted-copy">Aucun lien ajouté.</p>'}</div><button class="ghost-btn full-btn" id="addQuickLink">+ Ajouter un lien</button></section><section class="widget"><small>CHOIX ALÉATOIRE</small><div class="picker-result" id="pickerResult">—</div><button class="primary-btn full-btn" id="pickStudent">Choisir un élève</button><details class="student-local-editor"><summary>Liste des élèves</summary><textarea id="localStudents">${esc(localStudents)}</textarea><button class="ghost-btn full-btn" id="saveStudents">Enregistrer</button></details></section><section class="widget"><small>À FAIRE / RAPPEL</small><textarea id="classReminder" class="widget-textarea">${esc(state.class_reminder||'')}</textarea><button class="ghost-btn full-btn" id="saveReminder">Enregistrer</button></section></div>`;
  document.getElementById('backToPlan').onclick=()=>{currentView='week';activateNav('week');render();};const tick=()=>{const now=new Date();const c=document.getElementById('liveClock');if(!c)return;c.textContent=now.toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'});document.getElementById('liveDate').textContent=capitalizeFirst(new Intl.DateTimeFormat('fr-CA',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now));};tick();clearInterval(window.__teachflowClock);window.__teachflowClock=setInterval(tick,1000);
  const weeks=state.planification_hebdomadaire||[],w=weeks[weekIndex]||weeks[0],agenda=document.getElementById('agendaWidget');if(w){const d=datesForWeek(w),labels=['Lecture / Écriture','Mathématiques','Sciences / Études sociales','Religion / Arts','Projet / Événements'];agenda.innerHTML=d.map((x,i)=>`<button class="agenda-day" data-agenda="${i}"><strong>${esc(capitalizeFirst(fmtDay(x)))}</strong><span>${esc(labels[i])}</span></button>`).join('');document.querySelectorAll('[data-agenda]').forEach(b=>b.onclick=()=>{currentView='week';activateNav('week');renderWeek();});}
  let timerSeconds=600,timerHandle=null,running=false;const updateTimer=()=>{const el=document.getElementById('timerDisplay');if(el)el.textContent=`${String(Math.floor(timerSeconds/60)).padStart(2,'0')}:${String(timerSeconds%60).padStart(2,'0')}
  <section class="advanced-widgets-panel">
    <div class="section-head"><div><h2>Widgets interactifs</h2><p>Outils rapides pour le tableau interactif.</p></div></div>
    <div class="advanced-widget-grid">
      <article class="adv-widget" id="groupMakerWidget"><div class="adv-widget-head"><strong>👥 Créateur de groupes</strong><span>Équipes aléatoires</span></div><label>Taille des groupes<select id="groupSizeSelect"><option value="2">2 élèves</option><option value="3" selected>3 élèves</option><option value="4">4 élèves</option><option value="5">5 élèves</option><option value="6">6 élèves</option></select></label><button class="primary-btn full-btn" type="button" id="makeGroupsBtn">Créer les groupes</button><div id="groupsOutput" class="groups-output"></div></article>
      <article class="adv-widget" id="soundMeterWidget"><div class="adv-widget-head"><strong>🎙️ Détecteur de sons</strong><span>Niveau sonore de la classe</span></div><div class="sound-meter-wrap"><div class="sound-meter-bar"><div id="soundMeterFill"></div></div><div class="sound-meter-reading"><strong id="soundLevelText">Micro désactivé</strong><span id="soundLevelPct">0%</span></div></div><div class="sound-thresholds"><button type="button" data-threshold="35">Silencieux</button><button type="button" data-threshold="55" class="active">Travail</button><button type="button" data-threshold="75">Discussion</button></div><button class="primary-btn full-btn" type="button" id="toggleSoundMeter">Activer le micro</button><small class="widget-note">Le son est analysé dans le navigateur seulement; rien n’est enregistré.</small></article>
      <article class="adv-widget" id="multiTimerWidget"><div class="adv-widget-head"><strong>⏱️ Minuteries multiples</strong><span>Jusqu’à 3 en même temps</span></div><div class="multi-timers">${[1,2,3].map(i=>`<div class="multi-timer" data-timer="${i}"><input class="timer-label" value="Minuterie ${i}" aria-label="Nom de la minuterie ${i}"><div class="timer-big" id="timerDisplay${i}">05:00</div><div class="timer-controls"><button type="button" data-timer-start="${i}">▶</button><button type="button" data-timer-reset="${i}">↺</button><select data-timer-min="${i}"><option value="1">1 min</option><option value="3">3 min</option><option value="5" selected>5 min</option><option value="10">10 min</option><option value="15">15 min</option><option value="20">20 min</option><option value="30">30 min</option></select></div></div>`).join('')}</div></article>
      <article class="adv-widget"><div class="adv-widget-head"><strong>🎲 Hasard</strong><span>Dé, pièce ou nombre</span></div><div class="random-big" id="randomToolResult">—</div><div class="random-tools"><button type="button" class="ghost-btn" id="rollDieBtn">🎲 Dé</button><button type="button" class="ghost-btn" id="flipCoinBtn">🪙 Pile/face</button><button type="button" class="ghost-btn" id="randomNumberBtn"># 1–100</button></div></article>
      <article class="adv-widget"><div class="adv-widget-head"><strong>🎯 Roue de noms</strong><span>Sélection visuelle</span></div><div class="wheel-display" id="wheelDisplay">Clique pour choisir</div><button class="primary-btn full-btn" type="button" id="spinNameBtn">Faire tourner</button></article>
      <article class="adv-widget"><div class="adv-widget-head"><strong>🧠 Pense • Paire • Partage</strong><span>Minuterie en 3 étapes</span></div><div class="tps-stage" id="tpsStage">Prêt</div><div class="tps-time" id="tpsTime">01:00</div><div class="tps-controls"><button type="button" class="ghost-btn" data-tps="think">Pense · 1 min</button><button type="button" class="ghost-btn" data-tps="pair">Paire · 2 min</button><button type="button" class="ghost-btn" data-tps="share">Partage · 3 min</button></div></article>
      <article class="adv-widget"><div class="adv-widget-head"><strong>✍️ Tableau blanc</strong><span>Notes rapides au TBI</span></div><textarea id="quickWhiteboard" class="quick-whiteboard" placeholder="Écris ou dessine avec le clavier/stylet...">${esc(state.quick_whiteboard||'')}</textarea><button class="ghost-btn full-btn" type="button" id="saveWhiteboard">Enregistrer</button></article>
      <article class="adv-widget"><div class="adv-widget-head"><strong>📢 Message de classe</strong><span>Grand affichage</span></div><input id="classMessageInput" class="class-message-input" placeholder="Ex. Sortez votre cahier de maths"><button class="primary-btn full-btn" type="button" id="showClassMessage">Afficher en grand</button></article>
    </div>
  </section>
`;};const stopTimer=()=>{if(timerHandle)clearInterval(timerHandle);timerHandle=null;running=false;const b=document.getElementById('timerStart');if(b)b.textContent='Démarrer';};document.getElementById('timerStart').onclick=()=>{if(running){stopTimer();return;}running=true;document.getElementById('timerStart').textContent='Pause';timerHandle=setInterval(()=>{if(timerSeconds>0){timerSeconds--;updateTimer();}else{stopTimer();alert('Minuterie terminée!');}},1000);};document.getElementById('timerReset').onclick=()=>{stopTimer();timerSeconds=600;updateTimer();};document.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{stopTimer();timerSeconds=Number(b.dataset.min)*60;updateTimer();});
  document.getElementById('addQuickLink').onclick=()=>{const label=prompt('Nom du lien :');if(!label)return;let url=prompt('Adresse web :','https://');if(!url)return;if(!/^https?:\/\//i.test(url))url='https://'+url;localLinks.push({label,url});state.quick_links=localLinks;saveState();renderClassboard();};document.querySelectorAll('[data-remove-link]').forEach(b=>b.onclick=()=>{localLinks.splice(Number(b.dataset.removeLink),1);state.quick_links=localLinks;saveState();renderClassboard();});document.getElementById('saveStudents').onclick=()=>{state.class_students=document.getElementById('localStudents').value;saveState();alert('Liste synchronisée avec ton compte TeachFlow.');};document.getElementById('pickStudent').onclick=()=>{const names=(state.class_students||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);document.getElementById('pickerResult').textContent=names.length?names[Math.floor(Math.random()*names.length)]:'Ajoute d’abord ta liste d’élèves.';};document.getElementById('saveReminder').onclick=()=>{state.class_reminder=document.getElementById('classReminder').value;saveState();};

  // Widgets avancés
  const classNames=(state.class_students||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const groupBtn=document.getElementById('makeGroupsBtn'); if(groupBtn)groupBtn.onclick=()=>{const size=Math.max(2,Number(document.getElementById('groupSizeSelect').value)||3);const names=[...classNames];for(let i=names.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[names[i],names[j]]=[names[j],names[i]];}const groups=[];for(let i=0;i<names.length;i+=size)groups.push(names.slice(i,i+size));document.getElementById('groupsOutput').innerHTML=groups.length?groups.map((g,i)=>`<div class="group-card"><strong>Groupe ${i+1}</strong>${g.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`).join(''):'<p class="muted-copy">Ajoute tes élèves dans Élèves.</p>';};
  let soundCtx=null,soundStream=null,soundAnalyser=null,soundFrame=null,soundThreshold=55;
  const stopSound=()=>{if(soundFrame)cancelAnimationFrame(soundFrame);soundFrame=null;if(soundStream)soundStream.getTracks().forEach(t=>t.stop());soundStream=null;if(soundCtx)soundCtx.close().catch(()=>{});soundCtx=null;soundAnalyser=null;const b=document.getElementById('toggleSoundMeter');if(b)b.textContent='Activer le micro';const t=document.getElementById('soundLevelText');if(t)t.textContent='Micro désactivé';};
  document.querySelectorAll('[data-threshold]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-threshold]').forEach(x=>x.classList.remove('active'));b.classList.add('active');soundThreshold=Number(b.dataset.threshold);});
  const soundBtn=document.getElementById('toggleSoundMeter'); if(soundBtn)soundBtn.onclick=async()=>{if(soundStream){stopSound();return;}if(!navigator.mediaDevices?.getUserMedia){alert('Le microphone n’est pas disponible dans ce navigateur.');return;}try{soundStream=await navigator.mediaDevices.getUserMedia({audio:true});soundCtx=new (window.AudioContext||window.webkitAudioContext)();const source=soundCtx.createMediaStreamSource(soundStream);soundAnalyser=soundCtx.createAnalyser();soundAnalyser.fftSize=1024;source.connect(soundAnalyser);const data=new Uint8Array(soundAnalyser.fftSize);soundBtn.textContent='Désactiver le micro';const tick=()=>{if(!soundAnalyser)return;soundAnalyser.getByteTimeDomainData(data);let sum=0;for(const v of data){const n=(v-128)/128;sum+=n*n;}const rms=Math.sqrt(sum/data.length);const pct=Math.max(0,Math.min(100,Math.round(rms*280)));const fill=document.getElementById('soundMeterFill');if(fill){fill.style.width=pct+'%';fill.classList.toggle('too-loud',pct>soundThreshold);}const p=document.getElementById('soundLevelPct');if(p)p.textContent=pct+'%';const txt=document.getElementById('soundLevelText');if(txt)txt.textContent=pct>soundThreshold?'Trop fort':'Bon niveau';soundFrame=requestAnimationFrame(tick);};tick();}catch(e){alert('Autorise le microphone dans le navigateur pour utiliser le détecteur de sons.');stopSound();}};
  const timerStates={}; [1,2,3].forEach(i=>{timerStates[i]={seconds:300,handle:null,running:false};const draw=()=>{const s=timerStates[i].seconds;const el=document.getElementById(`timerDisplay${i}`);if(el)el.textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};const stop=()=>{const st=timerStates[i];if(st.handle)clearInterval(st.handle);st.handle=null;st.running=false;};const startBtn=document.querySelector(`[data-timer-start="${i}"]`);const resetBtn=document.querySelector(`[data-timer-reset="${i}"]`);const minSel=document.querySelector(`[data-timer-min="${i}"]`);if(startBtn)startBtn.onclick=()=>{const st=timerStates[i];if(st.running){stop();startBtn.textContent='▶';return;}st.running=true;startBtn.textContent='⏸';st.handle=setInterval(()=>{if(st.seconds>0){st.seconds--;draw();}else{stop();startBtn.textContent='▶';alert((document.querySelector(`[data-timer="${i}"] .timer-label`)?.value||`Minuterie ${i}`)+' terminée!');}},1000);};if(resetBtn)resetBtn.onclick=()=>{stop();timerStates[i].seconds=(Number(minSel.value)||5)*60;draw();if(startBtn)startBtn.textContent='▶';};if(minSel)minSel.onchange=()=>{stop();timerStates[i].seconds=(Number(minSel.value)||5)*60;draw();if(startBtn)startBtn.textContent='▶';};});
  const rr=document.getElementById('randomToolResult');document.getElementById('rollDieBtn')?.addEventListener('click',()=>rr.textContent=String(1+Math.floor(Math.random()*6)));document.getElementById('flipCoinBtn')?.addEventListener('click',()=>rr.textContent=Math.random()<.5?'Pile':'Face');document.getElementById('randomNumberBtn')?.addEventListener('click',()=>rr.textContent=String(1+Math.floor(Math.random()*100)));
  document.getElementById('spinNameBtn')?.addEventListener('click',()=>{const out=document.getElementById('wheelDisplay');if(!classNames.length){out.textContent='Ajoute les élèves dans Élèves.';return;}let count=0;const h=setInterval(()=>{out.textContent=classNames[Math.floor(Math.random()*classNames.length)];if(++count>18){clearInterval(h);out.classList.add('wheel-picked');setTimeout(()=>out.classList.remove('wheel-picked'),700);}},70);});
  let tpsHandle=null;document.querySelectorAll('[data-tps]').forEach(b=>b.onclick=()=>{if(tpsHandle)clearInterval(tpsHandle);const cfg={think:['Pense',60],pair:['Paire',120],share:['Partage',180]}[b.dataset.tps];let sec=cfg[1];document.getElementById('tpsStage').textContent=cfg[0];const draw=()=>document.getElementById('tpsTime').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;draw();tpsHandle=setInterval(()=>{if(sec>0){sec--;draw();}else{clearInterval(tpsHandle);alert(cfg[0]+' terminé!');}},1000);});
  document.getElementById('saveWhiteboard')?.addEventListener('click',()=>{state.quick_whiteboard=document.getElementById('quickWhiteboard').value;saveState();});
  document.getElementById('showClassMessage')?.addEventListener('click',()=>{const msg=document.getElementById('classMessageInput').value.trim();if(!msg)return;const dlg=document.getElementById('classMessageDialog');document.getElementById('classMessageBig').textContent=msg;dlg.showModal();});

}

function renderSubjects(){
  pageTitle.textContent='Planification par matière';
  const units=ensureUnits();
  content.innerHTML=`<div class="section-card"><div class="section-head"><div><h2>Matières</h2><p class="muted-copy">Vois les unités de chaque matière et ajoute-les directement à ta planification hebdomadaire.</p></div><button class="primary-btn" id="newUnitFromSubjects">+ Nouvelle unité</button></div></div><div class="subject-grid">${SUBJECTS.filter(s=>s!=='Autre').map(subject=>{const us=units.filter(u=>u.subject===subject);const slug=subjectSlug(subject);return `<section class="subject-panel subject-${slug}"><div class="subject-panel-head"><div><small>${esc(subjectColorLabel(subject))}</small><h3>${esc(subject)}</h3></div><span class="subject-count">${us.length} unité${us.length===1?'':'s'}</span></div><div class="subject-unit-list">${us.length?us.map(unitMiniCard).join(''):'<p class="muted-copy">Aucune unité créée pour cette matière.</p>'}</div><button class="ghost-btn full-btn add-subject-unit" data-subject="${esc(subject)}">+ Ajouter une unité</button></section>`;}).join('')}</div>`;
  document.getElementById('newUnitFromSubjects').onclick=()=>openUnitDialog();
  document.querySelectorAll('.add-subject-unit').forEach(b=>b.onclick=()=>openUnitDialog(null,b.dataset.subject));
  bindUnitCardActions();
}
function unitMiniCard(u){const slug=subjectSlug(u.subject);return `<article class="unit-mini subject-${slug}" data-unit-id="${esc(u.id)}"><div><strong>${esc(u.title)}</strong><small>${esc(u.dates||'Sans dates')}</small></div><div class="unit-mini-actions"><button class="ghost-btn tiny" data-view-unit="${esc(u.id)}">Voir</button><button class="primary-btn tiny" data-plan-unit="${esc(u.id)}">Ajouter à ma planif</button></div></article>`;}
function renderUnits(){
  pageTitle.textContent='Unités';const units=ensureUnits();
  content.innerHTML=`<div class="section-card"><div class="section-head"><div><h2>Mes unités</h2><p class="muted-copy">Crée tes unités, regroupe les ressources et envoie leur contenu vers la planification de la matière.</p></div><button class="primary-btn" id="newUnit">+ Nouvelle unité</button></div></div>${units.length?`<div class="units-grid">${units.map(u=>{const slug=subjectSlug(u.subject);return `<article class="unit-card subject-${slug}" data-unit-id="${esc(u.id)}"><div class="unit-card-accent"></div><div class="unit-card-body"><div class="unit-card-head"><div><small>${esc(u.subject)} · ${esc(u.dates||'Sans dates')}</small><h3>${esc(u.title)}</h3></div><span class="subject-pill">${esc(subjectColorLabel(u.subject))}</span></div>${u.assessment?`<p class="unit-assessment"><strong>Évaluation :</strong> ${esc(u.assessment)}</p>`:''}<div class="unit-preview">${u.html||'<span class="muted-copy">Aucune note ajoutée.</span>'}</div><div class="unit-actions"><button class="primary-btn" data-plan-unit="${esc(u.id)}">Ajouter à ma planification</button><button class="ghost-btn" data-edit-unit="${esc(u.id)}">Modifier</button><button class="ghost-btn danger-soft" data-delete-unit="${esc(u.id)}">Supprimer</button></div></div></article>`;}).join('')}</div>`:'<div class="empty-state"><h2>Aucune unité pour le moment</h2><p>Crée une unité de français, maths, sciences, enseignement religieux, études sociales ou une autre matière.</p><button class="primary-btn" id="newUnitEmpty">+ Créer ma première unité</button></div>'}`;
  document.getElementById('newUnit').onclick=()=>openUnitDialog();const empty=document.getElementById('newUnitEmpty');if(empty)empty.onclick=()=>openUnitDialog();bindUnitCardActions();
}
function bindUnitCardActions(){
  document.querySelectorAll('[data-plan-unit]').forEach(b=>b.onclick=()=>openPlanningDialog(b.dataset.planUnit));
  document.querySelectorAll('[data-edit-unit]').forEach(b=>b.onclick=()=>openUnitDialog(b.dataset.editUnit));
  document.querySelectorAll('[data-view-unit]').forEach(b=>b.onclick=()=>{currentView='units';activateNav('units');renderUnits();setTimeout(()=>document.querySelector(`[data-unit-id="${CSS.escape(b.dataset.viewUnit)}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),50);});
  document.querySelectorAll('[data-delete-unit]').forEach(b=>b.onclick=()=>{const u=unitById(b.dataset.deleteUnit);if(u&&confirm(`Supprimer l’unité « ${u.title} »?`)){state.units=ensureUnits().filter(x=>x.id!==u.id);saveState();renderUnits();}});
}
function openUnitDialog(id=null,presetSubject=null){
  const dialog=document.getElementById('unitDialog'),existing=id?unitById(id):null;
  document.getElementById('unitDialogTitle').textContent=existing?'Modifier l’unité':'Nouvelle unité';
  document.getElementById('unitTitle').value=existing?.title||'';document.getElementById('unitSubject').value=existing?.subject||presetSubject||'Français';document.getElementById('unitDates').value=existing?.dates||'';document.getElementById('unitAssessment').value=existing?.assessment||'';document.getElementById('unitRichEditor').innerHTML=existing?.html||'';
  const editor=document.getElementById('unitRichEditor');document.querySelectorAll('[data-unit-cmd]').forEach(b=>b.onclick=()=>{editor.focus();document.execCommand(b.dataset.unitCmd,false,null);});document.getElementById('unitAddLink').onclick=()=>{editor.focus();let url=prompt('Adresse du lien :','https://');if(!url)return;if(!/^https?:\/\//i.test(url))url='https://'+url;const selected=window.getSelection()?.toString().trim();if(selected)document.execCommand('createLink',false,url);else{const label=prompt('Texte à afficher :','Ressource');if(label)document.execCommand('insertHTML',false,`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`);}};
  document.getElementById('saveUnitBtn').onclick=()=>{const title=document.getElementById('unitTitle').value.trim();if(!title){alert('Ajoute un titre à l’unité.');return;}const item=existing||{id:makeId(),createdAt:new Date().toISOString()};item.title=title;item.subject=document.getElementById('unitSubject').value;item.dates=document.getElementById('unitDates').value.trim();item.assessment=document.getElementById('unitAssessment').value.trim();item.html=editor.innerHTML;item.text=editor.innerText.trim();item.updatedAt=new Date().toISOString();if(!existing)ensureUnits().push(item);saveState();dialog.close();currentView='units';activateNav('units');renderUnits();};dialog.showModal();
}
function openPlanningDialog(id){
  const u=unitById(id);if(!u)return;const weeks=state.planification_hebdomadaire||[],dialog=document.getElementById('planningDialog'),weekSel=document.getElementById('planningWeekSelect'),fieldSel=document.getElementById('planningFieldSelect');weekSel.innerHTML=weeks.map((w,i)=>`<option value="${i}" ${i===weekIndex?'selected':''}>${esc(weekLabel(w))}</option>`).join('');const fields=fieldsForSubject(u.subject);fieldSel.innerHTML=fields.map(f=>`<option value="${esc(f)}">${esc(normalizeKey(f))}</option>`).join('');document.getElementById('planningContent').value=[u.title,u.text].filter(Boolean).join(' — ');document.getElementById('confirmAddPlanning').onclick=()=>{const wi=Number(weekSel.value),field=fieldSel.value,text=document.getElementById('planningContent').value.trim();if(!text)return;const w=weeks[wi];w[field]=[w[field],text].filter(Boolean).join('\n');u.scheduled=u.scheduled||[];u.scheduled.push({week:wi,field,at:new Date().toISOString()});weekIndex=wi;saveState();dialog.close();currentView='week';activateNav('week');renderWeek();};dialog.showModal();
}
function addLessonToUnit(subject,field,text){
  const units=ensureUnits().filter(u=>u.subject===subject);if(!units.length){if(confirm(`Aucune unité de ${subject} n’existe encore. En créer une maintenant?`))openUnitDialog(null,subject);return;}const names=units.map((u,i)=>`${i+1}. ${u.title}`).join('\n');const pick=prompt(`Ajouter cette leçon à quelle unité?\n\n${names}\n\nEntre le numéro :`,'1');const idx=Number(pick)-1;if(!Number.isInteger(idx)||!units[idx])return;const u=units[idx];const line=`<p><strong>${esc(normalizeKey(field))} :</strong> ${esc(text)}</p>`;u.html=(u.html||'')+line;u.text=((u.text||'')+'\n'+normalizeKey(field)+' : '+text).trim();u.updatedAt=new Date().toISOString();saveState();alert(`Leçon ajoutée à l’unité « ${u.title} ».`);
}

function renderAnnual(){
  pageTitle.textContent='Planification annuelle';
  const rows=state.planification_annuelle||[];
  content.innerHTML=`<div class="section-card"><div class="section-head"><h2>Vue annuelle</h2><span class="accent">Septembre → Juin</span></div></div><div class="month-card-grid">${rows.map(r=>`<article class="month-card"><h3>${esc(r.Mois||r.Mois_||'Mois')}</h3><div class="month-fields">${Object.entries(r).filter(([k])=>!/^Mois/.test(k)).map(([k,v])=>v?`<div class="field-box subject-${subjectSlug(canonicalSubjectFromKey(k))}"><small>${esc(normalizeKey(k))}</small><div>${esc(v)}</div></div>`:'').join('')}</div></article>`).join('')}</div>`;
}
function renderSchedule(){
  pageTitle.textContent='Horaire — cycle de 5 jours';
  const h=state.horaire_cycle_5_jours||{};
  const rows=h.lignes||h.horaire||h.periodes||[];
  content.innerHTML=`<div class="section-card"><div class="section-head"><h2>${esc(h.titre||'Horaire 5A')}</h2><span>${esc(h.chromebooks||'')}</span></div><div class="table-wrap"><table class="data-table"><thead><tr>${rows[0]?Object.keys(rows[0]).map(k=>`<th>${esc(k)}</th>`).join(''):'<th>Horaire</th>'}</tr></thead><tbody>${rows.map(r=>`<tr>${Object.values(r).map(v=>`<td class="schedule-cell subject-${subjectSlug(canonicalSubjectFromKey(String(v||'')))}">${esc(v||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>${h.notes?`<div class="section-card"><div class="section-head"><h2>Notes</h2></div><div style="padding:18px;white-space:pre-line;line-height:1.6">${esc(h.notes)}</div></div>`:''}`;
}
function renderHomework(){
  pageTitle.textContent='Graphèmes et devoirs';
  const rows=state.graphemes_devoirs||[]; const keys=rows[0]?Object.keys(rows[0]):[];
  content.innerHTML=`<div class="section-card"><div class="section-head"><h2>Progression annuelle</h2><span>${rows.length} semaines</span></div><div class="table-wrap"><table class="data-table"><thead><tr>${keys.map(k=>`<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${keys.map(k=>`<td>${esc(r[k]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
function renderStudents(){
  pageTitle.textContent='Élèves et anniversaires — données privées';
  const students=getPrivateStudents();
  content.innerHTML=`<div class="section-card student-private-card"><div class="section-head"><div><h2>🎂 Importer les élèves et anniversaires</h2><p>Ces données privées sont synchronisées avec ton compte TeachFlow. Elles ne sont pas ajoutées à GitHub.</p></div><span class="accent">${students.length} élève${students.length===1?'':'s'}</span></div><div class="student-import-grid"><section><label class="field-label" for="studentCsvFile">Importer un fichier CSV</label><input id="studentCsvFile" type="file" accept=".csv,text/csv,.txt,text/plain"/><p class="helper-text">Colonnes attendues : <strong>Prénom, DDN</strong>. Les dates comme 9/21/2016 sont acceptées.</p><button class="primary-btn" id="importStudentsFile">Importer le fichier</button></section><section><label class="field-label" for="studentPaste">Ou coller la liste</label><textarea id="studentPaste" class="large-textarea compact" placeholder="Prénom,DDN\nKurtis,9/9/2016\nJoseph,9/21/2016"></textarea><button class="ghost-btn" id="importStudentsPaste">Importer la liste collée</button></section></div></div><div class="section-card"><div class="section-head"><h2>Anniversaires synchronisés</h2>${students.length?'<button class="ghost-btn" id="clearStudents">Effacer les élèves</button>':''}</div>${students.length?`<div class="birthday-list">${[...students].sort((a,b)=>{const x=parseBirthdayDate(a.birthdate),y=parseBirthdayDate(b.birthdate);return (x.month*100+x.day)-(y.month*100+y.day)}).map(st=>`<div class="birthday-row"><strong>${esc(st.name)}</strong><span>🎂 ${esc(st.birthdate)}</span></div>`).join('')}</div>`:'<div class="empty-state"><p>Aucun anniversaire importé.</p></div>'}</div>`;
  const applyRows=rows=>{if(!rows.length){alert('Aucune ligne valide trouvée. Vérifie que le fichier contient deux colonnes : Prénom et DDN.');return;}savePrivateStudents(rows);alert(`${rows.length} élèves importés et synchronisés. Leurs anniversaires apparaîtront automatiquement dans la planification.`);renderStudents();};
  document.getElementById('importStudentsFile').onclick=async()=>{const f=document.getElementById('studentCsvFile').files[0];if(!f){alert('Choisis d’abord un fichier CSV.');return;}applyRows(parseStudentText(await f.text()));};
  document.getElementById('importStudentsPaste').onclick=()=>applyRows(parseStudentText(document.getElementById('studentPaste').value));
  const clear=document.getElementById('clearStudents');if(clear)clear.onclick=()=>{if(confirm('Effacer les élèves et anniversaires synchronisés?')){state.private_students=[];state.class_students='';saveState();renderStudents();}};
}
function renderSettings(){
  pageTitle.textContent='Réglages et sauvegardes';
  content.innerHTML=`<div class="settings-grid"><section class="setting"><h3>💾 Exporter mes changements</h3><p>Télécharge une copie de secours. Tes modifications sont aussi synchronisées automatiquement avec ton compte TeachFlow.</p><button class="primary-btn" id="settingsExport">Exporter</button></section><section class="setting"><h3>📥 Importer une sauvegarde</h3><p>Restaure une sauvegarde manuelle. En usage normal, la synchronisation entre tes appareils est automatique.</p><button class="ghost-btn" id="settingsImport">Importer</button></section><section class="setting"><h3>↩️ Revenir aux données de départ</h3><p>Réinitialise la planification puis synchronise ce nouvel état avec ton compte.</p><button class="ghost-btn" id="resetData">Réinitialiser</button></section><section class="setting"><h3>🔒 Confidentialité</h3><p>Tes données privées sont stockées dans Cloudflare D1 derrière ton compte TeachFlow. Elles ne sont pas ajoutées au dépôt GitHub.</p></section></div>`;
  document.getElementById('settingsExport').onclick=exportData; document.getElementById('settingsImport').onclick=()=>document.getElementById('importDialog').showModal();
  document.getElementById('resetData').onclick=()=>{if(confirm('Réinitialiser les modifications locales?')){localStorage.removeItem(STORAGE_KEY);state=structuredClone(seed);migrateLocalPrivateData();saveState();render();}};
}

function openDayDetail(key,dayIndex,dateObj){
  const detail=getDayDetail(key),dialog=document.getElementById('dayDialog');
  document.getElementById('dayDialogTitle').textContent=capitalizeFirst(fmtDay(dateObj));
  document.getElementById('dayCycleLabel').textContent=`Jour ${dayIndex+1} · ${key}`;
  const editor=document.getElementById('dayRichEditor');
  const fallback=detail.notes?esc(detail.notes).replace(/\n/g,'<br>'):'';
  editor.innerHTML=detail.notesHtml||fallback;
  const linkList=document.getElementById('dayLinkList');
  const paintLinks=()=>{linkList.innerHTML=detail.links.length?detail.links.map((l,i)=>`<div class="day-link-row"><a href="${esc(l.url)}" target="_blank" rel="noopener">🔗 ${esc(l.label||l.url)}</a><button type="button" data-remove-day-link="${i}" title="Supprimer">×</button></div>`).join(''):'<p class="muted-copy">Aucun lien ajouté pour cette journée.</p>';linkList.querySelectorAll('[data-remove-day-link]').forEach(b=>b.onclick=()=>{detail.links.splice(Number(b.dataset.removeDayLink),1);paintLinks();});};
  paintLinks();
  document.getElementById('addDayLink').onclick=()=>{const label=prompt('Nom du lien :','Ressource');if(!label)return;let url=prompt('Adresse du lien :','https://');if(!url)return;if(!/^https?:\/\//i.test(url))url='https://'+url;detail.links.push({label:label.trim(),url:url.trim()});paintLinks();};
  const useCmd=(cmd,value=null)=>{editor.focus();document.execCommand(cmd,false,value);};
  document.querySelectorAll('#dayRichToolbar [data-cmd]').forEach(b=>b.onclick=()=>useCmd(b.dataset.cmd));
  document.getElementById('formatBlock').onchange=e=>useCmd('formatBlock',e.target.value);
  document.getElementById('fontSize').onchange=e=>useCmd('fontSize',e.target.value);
  document.getElementById('hiliteColor').oninput=e=>useCmd('hiliteColor',e.target.value);
  document.getElementById('fontColor').oninput=e=>useCmd('foreColor',e.target.value);
  document.getElementById('richAddLink').onclick=()=>{const selection=window.getSelection()?.toString().trim();let url=prompt('Adresse du lien :','https://');if(!url)return;if(!/^https?:\/\//i.test(url))url='https://'+url;if(selection){useCmd('createLink',url);}else{const label=prompt('Texte à afficher :','Lien');if(!label)return;useCmd('insertHTML',`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`);}};
  document.getElementById('richSpecial').onclick=()=>{const ch=prompt('Caractère spécial à insérer :','★');if(ch)useCmd('insertText',ch);};
  document.getElementById('richAddTable').onclick=()=>useCmd('insertHTML','<table class="editor-table"><tbody><tr><td>Cellule</td><td>Cellule</td></tr><tr><td>Cellule</td><td>Cellule</td></tr></tbody></table><p><br></p>');
  const richImageInput=document.getElementById('richImageInput');document.getElementById('richAddImage').onclick=()=>richImageInput.click();richImageInput.value='';richImageInput.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>700000){alert('Choisis une image de moins de 700 Ko.');return;}const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);});useCmd('insertHTML',`<img src="${src}" alt="Image ajoutée à la journée" class="editor-inline-image">`);};
  const gallery=document.getElementById('dayImageGallery');const paint=()=>{gallery.innerHTML=(detail.images||[]).map((src,i)=>`<figure><img src="${src}" alt="Image ajoutée à cette journée"><button type="button" data-remove-image="${i}">Supprimer</button></figure>`).join('')||'<p class="muted-copy">Aucune image jointe pour cette journée.</p>';gallery.querySelectorAll('[data-remove-image]').forEach(b=>b.onclick=()=>{detail.images.splice(Number(b.dataset.removeImage),1);paint();});};paint();
  document.getElementById('dayImages').value='';document.getElementById('dayImages').onchange=async e=>{for(const f of Array.from(e.target.files||[])){if(f.size>700000){alert(`${f.name} est trop volumineuse. Choisis une image de moins de 700 Ko.`);continue;}const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);});detail.images.push(src);}paint();};
  document.getElementById('saveDayBtn').onclick=()=>{detail.notesHtml=editor.innerHTML;detail.notes=editor.innerText.trim();saveState();dialog.close();renderWeek();};dialog.showModal();
}

function openEditWeek(i){
  const w=state.planification_hebdomadaire[i]; const dialog=document.getElementById('editDialog');
  document.getElementById('editWeekLabel').textContent=weekLabel(w);
  const editable=Object.keys(w).filter(k=>!['Mois','Dates','Sem.'].includes(k));
  document.getElementById('editFields').innerHTML=editable.map(k=>`<div class="form-field"><label>${esc(normalizeKey(k))}</label><textarea data-key="${esc(k)}">${esc(w[k]||'')}</textarea></div>`).join('');
  document.getElementById('saveEditBtn').onclick=()=>{document.querySelectorAll('#editFields textarea').forEach(t=>w[t.dataset.key]=t.value);saveState();dialog.close();renderWeek();};
  dialog.showModal();
}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='TeachFlow_2026-2027_sauvegarde.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
document.getElementById('logoutBtn').onclick=async()=>{try{await api('/api/auth/logout',{method:'POST',body:'{}'});}catch(e){}cloudReady=false;cloudUser=null;showAuth(false);};
document.getElementById('confirmImport').onclick=async()=>{
  const f=document.getElementById('importFile').files[0]; if(!f){alert('Choisis un fichier JSON.');return;}
  try{const obj=JSON.parse(await f.text()); if(!obj.planification_hebdomadaire)throw new Error('Format invalide');state=obj;saveState();document.getElementById('importDialog').close();render();alert('Sauvegarde importée.');}catch(e){alert('Impossible d’importer ce fichier.');}
};

// Synchronisation Cloud désactivée dans cette version de déploiement rapide.


// ===== TeachFlow v8 : vues journée / semaine complète / par sujet + gardes =====
const TF8_NO_SCHOOL = new Set([
  '2026-09-07','2026-10-12','2026-11-20',
  '2026-12-21','2026-12-22','2026-12-23','2026-12-24','2026-12-25','2026-12-28','2026-12-29','2026-12-30','2026-12-31',
  '2027-01-01','2027-01-15','2027-02-15',
  '2027-03-15','2027-03-16','2027-03-17','2027-03-18','2027-03-19','2027-03-26','2027-03-29',
  '2027-04-30','2027-05-24','2027-06-04'
]);
function tf8IsSchoolDay(d){const wd=d.getDay();return wd>=1&&wd<=5&&!TF8_NO_SCHOOL.has(fmtDateKey(d));}
function tf8CycleDay(d){
  const start=new Date(2026,8,8,12); const target=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);
  if(target<start||!tf8IsSchoolDay(target))return null;
  let n=0; const cur=new Date(start);
  while(cur<=target){if(tf8IsSchoolDay(cur))n++;cur.setDate(cur.getDate()+1);}
  return ((n-1)%5)+1;
}
const TF8_GUARD_RANGES=[
  [1,['2026-09-07','2026-09-11'],['2026-10-12','2026-10-16'],['2026-11-16','2026-11-20'],['2027-01-04','2027-01-08'],['2027-02-08','2027-02-12'],['2027-03-22','2027-03-26'],['2027-04-26','2027-04-30'],['2027-05-31','2027-06-04']],
  [2,['2026-09-14','2026-09-18'],['2026-10-19','2026-10-23'],['2026-11-23','2026-11-27'],['2027-01-11','2027-01-15'],['2027-02-15','2027-02-19'],['2027-03-29','2027-04-02'],['2027-05-03','2027-05-07'],['2027-06-07','2027-06-11']],
  [3,['2026-09-21','2026-09-25'],['2026-10-26','2026-10-30'],['2026-11-30','2026-12-04'],['2027-01-18','2027-01-22'],['2027-02-22','2027-02-26'],['2027-04-05','2027-04-09'],['2027-05-10','2027-05-14'],['2027-06-14','2027-06-18']],
  [4,['2026-09-28','2026-10-02'],['2026-11-02','2026-11-06'],['2026-12-07','2026-12-11'],['2027-01-25','2027-01-29'],['2027-03-01','2027-03-05'],['2027-04-12','2027-04-16'],['2027-05-17','2027-05-21'],['2027-06-21','2027-06-25']],
  [5,['2026-10-05','2026-10-09'],['2026-11-09','2026-11-13'],['2026-12-14','2026-12-18'],['2027-02-01','2027-02-05'],['2027-03-08','2027-03-12'],['2027-04-19','2027-04-23'],['2027-05-24','2027-05-28'],['2027-06-28','2027-06-30']]
];
function tf8RotationForDate(d){const key=fmtDateKey(d);for(const [rot,...ranges] of TF8_GUARD_RANGES){for(const [a,b] of ranges){if(key>=a&&key<=b)return rot;}}return null;}
function tf8PersonalGuardForRotation(rot){
  if(rot===1)return {time:'13h30–13h45',place:'Cour M/J · zone E — Champ',note:''};
  if(rot===2)return {time:'9h45–10h00',place:'Cour M/J · zone D — Bac à sable',note:''};
  if(rot===3)return {time:'11h00–11h20',place:'Portative 507',note:'Échange avec Jessica'};
  if(rot===4)return {time:'—',place:'Aucune garde personnelle',note:'Portative 501 donnée à Jessica (échange)'};
  if(rot===5)return {time:'—',place:'Aucune garde personnelle',note:''};
  return null;
}
function tf8GuardForDate(d){const rot=tf8RotationForDate(d);return rot?{rotation:rot,...tf8PersonalGuardForRotation(rot)}:null;}
function tf8WeekPlanForSubject(w,subject){return fieldsForSubject(subject).map(f=>w[f]).filter(v=>v&&String(v).trim()).join(' · ');}
function tf8ScheduleRows(){const h=state.horaire_cycle_5_jours||{};return h.timeslots||h.lignes||h.horaire||h.periodes||[];}
function tf8ActivityForSlot(slot,cycle){if(!cycle)return '';return slot[`Jour ${cycle}`]||'';}
function tf8TimeOfSlot(slot){return slot.heure||slot.Heure||Object.values(slot)[0]||'';}
function tf8Short(s,n=105){s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'…':s;}
function tf8GuardBadge(d){const g=tf8GuardForDate(d);if(!g||g.place==='Aucune garde personnelle')return '';return `<span class="guard-mini">🛡️ ${esc(g.time)} · ${esc(g.place)}${g.note?` · ${esc(g.note)}`:''}</span>`;}



// === TeachFlow v9 : calendrier scolaire, fêtes et anniversaires ===
const TF9_SCHOOL_EVENTS = {
  '2026-09-07': {label:'Fête du travail', type:'holiday'},
  '2026-09-08': {label:'Rentrée des élèves', type:'school'},
  '2026-10-12': {label:'Action de grâces', type:'holiday'},
  '2026-11-20': {label:'Journée pédagogique', type:'pd'},
  '2027-01-15': {label:'Journée pédagogique', type:'pd'},
  '2027-02-15': {label:'Jour de la famille', type:'holiday'},
  '2027-03-26': {label:'Vendredi saint', type:'holiday'},
  '2027-03-29': {label:'Lundi de Pâques', type:'holiday'},
  '2027-04-30': {label:'Journée pédagogique', type:'pd'},
  '2027-05-24': {label:'Fête de la Reine', type:'holiday'},
  '2027-06-04': {label:'Journée pédagogique', type:'pd'},
  '2027-06-29': {label:'Dernière journée des classes', type:'school'},
  '2027-06-30': {label:'Journée pédagogique', type:'pd'}
};
function tf9InRange(key,start,end){return key>=start&&key<=end;}
function tf9SchoolEvent(d){
  const key=fmtDateKey(d);
  if(TF9_SCHOOL_EVENTS[key]) return TF9_SCHOOL_EVENTS[key];
  if(tf9InRange(key,'2026-12-21','2027-01-01')) return {label:'Congé de Noël',type:'break'};
  if(tf9InRange(key,'2027-03-15','2027-03-19')) return {label:'Congé de mars',type:'break'};
  return null;
}
function tf9DayBadges(d){
  const parts=[];
  const ev=tf9SchoolEvent(d); if(ev) parts.push(`<span class="calendar-badge ${ev.type}">📌 ${esc(ev.label)}</span>`);
  const b=birthdaysForDate(d); if(b.length) parts.push(`<span class="calendar-badge birthday">🎂 ${b.map(x=>esc(x.name)).join(' · ')}</span>`);
  return parts.join('');
}
function tf9WeekEvents(dates){
  const rows=[];
  dates.forEach(d=>{
    const ev=tf9SchoolEvent(d); const b=birthdaysForDate(d);
    if(ev) rows.push(`<span class="week-event ${ev.type}"><strong>${esc(capitalizeFirst(fmtDay(d)))}</strong> · ${esc(ev.label)}</span>`);
    if(b.length) rows.push(`<span class="week-event birthday"><strong>${esc(capitalizeFirst(fmtDay(d)))}</strong> · 🎂 ${b.map(x=>esc(x.name)).join(' · ')}</span>`);
  });
  return rows.join('');
}

const TF_PRAYERS = [{"title": "Prière générale de classe", "tag": "Pour commencer la journée", "text": "Seigneur,\nMerci pour cette belle journée que nous passons ensemble en 5e année.\nMerci pour la chance d'apprendre, de grandir et de découvrir le monde qui nous entoure.\nOuvre notre esprit et notre cœur aujourd'hui. Aide-nous à être persévérants quand un travail nous semble difficile, et donne-nous la sagesse de faire de bons choix, dans nos études comme dans nos jeux.\nApprends-nous à être de vrais amis : à écouter avec respect, à partager avec joie, et à inclure tout le monde. Que notre classe soit un endroit où chacun se sent en sécurité et encouragé.\nDonne-nous la créativité pour réaliser nos projets, et la générosité pour aider ceux qui en ont besoin.\nAmen."}, {"title": "Source de lumière", "tag": "Courte", "text": "Source de lumière,\nMerci pour ce nouveau jour à l'école.\nAide-moi à bien me concentrer pour apprendre.\nDonne-moi la force d'être un bon ami avec tout le monde.\nPermets-moi de faire de mon mieux aujourd'hui.\nAmen."}, {"title": "Prière de lundi", "tag": "Amitié", "text": "Seigneur,\nMerci pour les amis que tu m'as donnés. Aide-moi à être un bon ami, à respecter les autres et à toujours prêter main forte à ceux qui en ont besoin. Apprends-moi à pardonner et à résoudre les conflits avec gentillesse. Que notre école soit un lieu de joie, de compréhension et de solidarité.\nAmen."}, {"title": "Prière de mardi", "tag": "Aimer son prochain", "text": "Seigneur, tu nous as dit d’aimer son prochain comme soi-même. Fais en sorte que je garde cette parole dans mon cœur pour que je puisse aimer comme tu as aimé.\nAmen."}, {"title": "Prière de mercredi", "tag": "Persévérance", "text": "Seigneur,\nMerci pour chaque jour passé à l'école, pour les connaissances que je reçois et pour la chance d'apprendre. Donne-moi la persévérance de surmonter les difficultés, de rester motivé même quand les choses sont difficiles. Je sais que chaque effort compte et que tu es toujours là pour m'aider à avancer.\nAmen."}, {"title": "Prière de jeudi", "tag": "Études", "text": "Seigneur,\nJe viens devant toi aujourd'hui avec un cœur humble, cherchant ton aide pour mes études. Donne-moi la sagesse, la patience et la capacité de me concentrer pour bien apprendre et comprendre ce que mes enseignants(es) m'enseignent. Aide-moi à utiliser mon temps de manière sage et à ne pas me laisser distraire. Que je puisse toujours faire de mon mieux et réussir dans mes apprentissages.\nAmen."}, {"title": "Prière de gratitude", "tag": "Automne / Action de grâce", "text": "Seigneur,\nMerci pour la beauté de l’automne, pour les couleurs des arbres et la richesse de la terre.\nMerci pour la nourriture que nous partageons, pour nos familles, nos amis et notre école.\nAide-nous à être reconnaissants chaque jour et à partager avec ceux qui ont moins que nous.\nAmen."}, {"title": "Prière pour la vérité et la réconciliation", "tag": "30 septembre", "text": "Dieu créateur,\nTu vois les chandails que nous portons aujourd'hui, couleurs éclatantes de vie et de souvenir. Nous les portons en hommage aux enfants autochtones qui ont été enlevés à leurs familles et à leurs communautés, ainsi qu'à tout ce qu'ils ont subi dans les pensionnats au Canada. Nous nous souvenons de leur perte de culture, de liberté et d'estime de soi. Nous te prions pour la guérison et la réconciliation, et que chaque enfant compte.\nAide-nous à honorer les survivants, leurs familles, et à soutenir les communautés autochtones dans leur cheminement vers la vérité et la réconciliation.\nAu nom de Jésus,\nAmen."}];

function renderPrayers(){
  pageTitle.textContent='Prières';
  const today=new Date();
  const dayMap={1:'Prière de lundi',2:'Prière de mardi',3:'Prière de mercredi',4:'Prière de jeudi'};
  const suggested=dayMap[today.getDay()];
  content.innerHTML=`<div class="prayers-page">
    <div class="prayers-hero">
      <div><span class="eyebrow">5A · moment de recueillement</span><h2>Prières de la classe</h2><p>Choisis une prière à afficher au tableau.</p></div>
      <div class="prayer-date">${today.toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
    </div>
    <div class="prayer-grid">
      ${TF_PRAYERS.map((p,i)=>`<article class="prayer-card ${p.title===suggested?'suggested':''}">
        <div class="prayer-card-top"><span class="prayer-tag">${esc(p.tag)}</span>${p.title===suggested?'<span class="today-pill">Aujourd’hui</span>':''}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.text.split('\n').slice(0,3).join(' '))}${p.text.length>150?'…':''}</p>
        <button type="button" class="primary-btn open-prayer" data-prayer="${i}">Afficher</button>
      </article>`).join('')}
    </div>
  </div>`;
  document.querySelectorAll('.open-prayer').forEach(btn=>btn.onclick=()=>openPrayer(Number(btn.dataset.prayer)));
}

function openPrayer(i){
  const p=TF_PRAYERS[i]; if(!p)return;
  content.innerHTML=`<div class="prayer-display">
    <div class="prayer-display-actions">
      <button class="ghost-btn" id="backPrayers">← Toutes les prières</button>
      <button class="ghost-btn" id="printPrayer">Imprimer</button>
    </div>
    <div class="prayer-presentation">
      <div class="prayer-shape s1"></div><div class="prayer-shape s2"></div><div class="prayer-shape s3"></div>
      <div class="prayer-inner">
        <div class="prayer-symbol">✝</div>
        <h2>${esc(p.title)}</h2>
        <div class="prayer-fulltext">${esc(p.text).replace(/\n/g,'<br>')}</div>
      </div>
    </div>
  </div>`;
  document.getElementById('backPrayers').onclick=renderPrayers;
  document.getElementById('printPrayer').onclick=()=>window.print();
}

function renderWeek(){
  pageTitle.textContent='Planification de la semaine';
  const weeks=state.planification_hebdomadaire||[]; if(!weeks.length){content.innerHTML='<div class="empty-state"><h2>Aucune semaine</h2></div>';return;}
  weekIndex=Math.max(0,Math.min(weekIndex,weeks.length-1)); const w=weeks[weekIndex],dates=datesForWeek(w),rows=tf8ScheduleRows();
  const activeGuard=tf8GuardForDate(dates.find(tf8IsSchoolDay)||dates[0]);
  content.innerHTML=`<div class="week-toolbar tf8-toolbar"><div class="week-nav"><button class="ghost-btn" id="prevWeek">←</button><strong>${esc(weekLabel(w))}</strong><button class="ghost-btn" id="nextWeek">→</button></div><div class="tf8-view-actions"><button class="ghost-btn" id="toggleWeekWidgets">🧰 Widgets</button><button class="ghost-btn" id="toggleCompactWeek">↔ Semaine entière</button><button class="ghost-btn" id="openDayView">Voir une journée</button><button class="ghost-btn" id="openSubjectView">Par sujet</button><button class="primary-btn" id="editWeek">Modifier</button></div></div>
  ${activeGuard?`<div class="guard-banner"><div><strong>🛡️ Garde — semaine ${activeGuard.rotation}</strong><span>${esc(activeGuard.time)} · ${esc(activeGuard.place)}</span>${activeGuard.note?`<small>${esc(activeGuard.note)}</small>`:''}</div><button class="ghost-btn" id="manageGuards">Voir mes gardes</button></div>`:''}
  ${tf9WeekEvents(dates)?`<div class="week-events-strip">${tf9WeekEvents(dates)}</div>`:''}

  <section id="weekWidgetDock" class="week-widget-dock is-hidden" aria-label="Widgets de classe">
    <div class="week-widget-head">
      <div>
        <strong>Widgets de classe</strong>
        <small>Outils rapides pour le tableau interactif</small>
      </div>
      <button class="icon-btn" id="closeWeekWidgets" type="button" aria-label="Fermer les widgets">×</button>
    </div>
    <div class="week-widget-grid">
      <article class="mini-widget">
        <small>HEURE</small>
        <div class="mini-clock" id="weekClock">--:--</div>
        <div class="mini-date" id="weekDate"></div>
      </article>
      <article class="mini-widget">
        <small>MINUTERIE</small>
        <div class="mini-timer" id="weekTimerDisplay">10:00</div>
        <div class="mini-widget-actions">
          <button type="button" class="primary-btn" id="weekTimerStart">Démarrer</button>
          <button type="button" class="ghost-btn" id="weekTimerReset">↺</button>
        </div>
        <div class="mini-presets">
          <button type="button" data-week-min="5">5</button>
          <button type="button" data-week-min="10">10</button>
          <button type="button" data-week-min="20">20</button>
        </div>
      </article>
      <article class="mini-widget">
        <small>ÉLÈVE AU HASARD</small>
        <div class="mini-picker" id="weekPickerResult">—</div>
        <button type="button" class="primary-btn full-btn" id="weekPickStudent">Choisir</button>
      </article>
      <article class="mini-widget">
        <small>FEU DE CLASSE</small>
        <div class="traffic-widget" id="trafficWidget">
          <button type="button" data-light="vert" class="traffic-light green" aria-label="Vert"></button>
          <button type="button" data-light="jaune" class="traffic-light yellow" aria-label="Jaune"></button>
          <button type="button" data-light="rouge" class="traffic-light red" aria-label="Rouge"></button>
        </div>
        <div class="traffic-label" id="trafficLabel">Choisir un niveau</div>
      </article>
      <article class="mini-widget mini-widget-wide">
        <small>LIENS RAPIDES</small>
        <div class="week-quick-links" id="weekQuickLinks"></div>
      </article>
      <article class="mini-widget mini-widget-wide">
        <small>RAPPEL AU TABLEAU</small>
        <textarea id="weekReminder" class="mini-reminder" placeholder="Écris un rappel pour la classe...">${esc(state.class_reminder||'')}</textarea>
        <button type="button" class="ghost-btn full-btn" id="saveWeekReminder">Enregistrer</button>
      </article>
    </div>
  </section>

  <div class="week-grid tf8-week-grid compact-week" id="weekGrid">${dates.map((d,i)=>{const cyc=tf8CycleDay(d),key=fmtDateKey(d),badges=tf9DayBadges(d);if(!cyc)return `<div class="day-column tf8-day-column"><button class="day-head day-open" data-day-index="${i}"><span><strong>${esc(capitalizeFirst(fmtDay(d)))}</strong><small>Pas de classe</small>${badges}</span></button><div class="day-body tf8-day-body"><div class="closed-day">${esc(tf9SchoolEvent(d)?.label||'Congé / journée sans classe')}</div></div></div>`;return `<div class="day-column tf8-day-column" data-day-index="${i}"><button class="day-head day-open" data-day-index="${i}"><span><strong>${esc(capitalizeFirst(fmtDay(d)))}</strong><small>Jour ${cyc}</small>${badges}${tf8GuardBadge(d)}</span><span>›</span></button><div class="day-body tf8-day-body">${rows.map((slot,slotIndex)=>{const act=tf8ActivityForSlot(slot,cyc);if(!act)return '';const subj=canonicalSubjectFromKey(act);const plan=tf8WeekPlanForSubject(w,subj);const detail=getBlockDetail(key,tf11BlockKey(slot,slotIndex));return `<article class="schedule-week-card subject-${subjectSlug(subj)} week-clickable-block" data-day-index="${i}" data-slot-index="${slotIndex}" tabindex="0" role="button" aria-label="Modifier ${esc(String(act).replace(/\*/g,''))}"><div class="schedule-week-time">${esc(tf8TimeOfSlot(slot))}</div><div class="week-block-title"><strong>${esc(String(act).replace(/\*/g,''))}</strong><span class="week-edit-hint">✏️</span></div>${plan?`<small>${esc(tf8Short(plan))}</small>`:''}${detail.notesHtml?`<div class="week-block-added">${detail.notesHtml}</div>`:(detail.notes?`<div class="week-block-added">${esc(tf8Short(detail.notes))}</div>`:'')}${detail.links?.length?`<div class="week-block-links">${detail.links.slice(0,2).map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🔗 ${esc(l.label||'Lien')}</a>`).join('')}${detail.links.length>2?`<span>+${detail.links.length-2}</span>`:''}</div>`:''}</article>`;}).join('')}</div></div>`;}).join('')}</div>`;
  document.getElementById('prevWeek').onclick=()=>{weekIndex=Math.max(0,weekIndex-1);renderWeek()};
  document.getElementById('nextWeek').onclick=()=>{weekIndex=Math.min(weeks.length-1,weekIndex+1);renderWeek()};
  document.getElementById('editWeek').onclick=()=>openEditWeek(weekIndex);
  document.getElementById('openDayView').onclick=()=>{currentView='day';activateNav('day');renderDay();};
  document.getElementById('openSubjectView').onclick=()=>{currentView='subjects';activateNav('subjects');renderSubjects();};
  const dock=document.getElementById('weekWidgetDock');
  const openWidgets=()=>{dock.classList.remove('is-hidden');};
  const closeWidgets=()=>{dock.classList.add('is-hidden');};
  document.getElementById('toggleWeekWidgets').onclick=openWidgets;
  const compactBtn=document.getElementById('toggleCompactWeek');
  const weekGrid=document.getElementById('weekGrid');
  compactBtn.onclick=()=>{
    weekGrid.classList.toggle('compact-week');
    compactBtn.textContent=weekGrid.classList.contains('compact-week')?'↔ Semaine entière':'↔ Vue aérée';
  };
  document.getElementById('closeWeekWidgets').onclick=closeWidgets;

  const updateWeekClock=()=>{
    const now=new Date();
    const c=document.getElementById('weekClock'),dt=document.getElementById('weekDate');
    if(c)c.textContent=now.toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'});
    if(dt)dt.textContent=now.toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'});
  };
  updateWeekClock();
  const weekClockHandle=setInterval(()=>{if(document.getElementById('weekClock'))updateWeekClock();else clearInterval(weekClockHandle);},1000);

  let wtSeconds=600,wtHandle=null,wtRunning=false;
  const wtDisplay=()=>{const el=document.getElementById('weekTimerDisplay');if(el)el.textContent=`${String(Math.floor(wtSeconds/60)).padStart(2,'0')}:${String(wtSeconds%60).padStart(2,'0')}`;};
  const wtStop=()=>{if(wtHandle)clearInterval(wtHandle);wtHandle=null;wtRunning=false;const b=document.getElementById('weekTimerStart');if(b)b.textContent='Démarrer';};
  document.getElementById('weekTimerStart').onclick=()=>{if(wtRunning){wtStop();return;}wtRunning=true;document.getElementById('weekTimerStart').textContent='Pause';wtHandle=setInterval(()=>{if(wtSeconds>0){wtSeconds--;wtDisplay();}else{wtStop();alert('Minuterie terminée!');}},1000);};
  document.getElementById('weekTimerReset').onclick=()=>{wtStop();wtSeconds=600;wtDisplay();};
  document.querySelectorAll('[data-week-min]').forEach(b=>b.onclick=()=>{wtStop();wtSeconds=Number(b.dataset.weekMin)*60;wtDisplay();});

  document.getElementById('weekPickStudent').onclick=()=>{
    const names=(state.class_students||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
    document.getElementById('weekPickerResult').textContent=names.length?names[Math.floor(Math.random()*names.length)]:'Ajoute les élèves dans Élèves.';
  };

  document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('[data-light]').forEach(x=>x.classList.remove('is-active'));
    b.classList.add('is-active');
    const lab=document.getElementById('trafficLabel');
    const txt={vert:'On continue 👍',jaune:'On réduit le volume',rouge:'Silence / attention'}[b.dataset.light];
    lab.textContent=txt;
  });

  const ql=document.getElementById('weekQuickLinks');
  const quick=state.quick_links||[];
  ql.innerHTML=quick.length?quick.slice(0,8).map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(''):'<span class="muted-copy">Ajoute tes liens dans Tableau de classe ou Ressources / liens.</span>';

  document.getElementById('saveWeekReminder').onclick=()=>{
    state.class_reminder=document.getElementById('weekReminder').value;
    saveState();
  };
  const mg=document.getElementById('manageGuards');if(mg)mg.onclick=()=>{currentView='guards';activateNav('guards');renderGuards();};
  document.querySelectorAll('.day-open').forEach(btn=>btn.onclick=()=>{dayIndex=Number(btn.dataset.dayIndex);currentView='day';activateNav('day');renderDay();});
  document.querySelectorAll('.week-clickable-block').forEach(card=>{
    const open=()=>{
      const di=Number(card.dataset.dayIndex),slotIndex=Number(card.dataset.slotIndex),d=dates[di],cyc=tf8CycleDay(d),slot=rows[slotIndex],act=tf8ActivityForSlot(slot,cyc);
      if(!act)return;
      const subj=canonicalSubjectFromKey(act),plan=tf8WeekPlanForSubject(w,subj);
      openBlockEditor(d,slot,slotIndex,act,plan);
    };
    card.onclick=e=>{if(e.target.closest('a'))return;open();};
    card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
  });
}
function getBlockDetail(dateKey, blockKey){
  state.block_details = state.block_details || {};
  state.block_details[dateKey] = state.block_details[dateKey] || {};
  state.block_details[dateKey][blockKey] = state.block_details[dateKey][blockKey] || {notes:'',notesHtml:'',links:[]};
  const d = state.block_details[dateKey][blockKey];
  if(!Array.isArray(d.links)) d.links=[];
  return d;
}
function tf11BlockKey(slot, index){
  return `${index}__${tf8TimeOfSlot(slot)}`;
}
function openBlockEditor(dateObj, slot, slotIndex, subject, existingPlan){
  const dateKey=fmtDateKey(dateObj), blockKey=tf11BlockKey(slot,slotIndex), detail=getBlockDetail(dateKey,blockKey);
  const dialog=document.getElementById('blockDialog');
  document.getElementById('blockDialogTitle').textContent=String(subject||'Bloc').replace(/\*/g,'');
  document.getElementById('blockDialogMeta').textContent=`${capitalizeFirst(fmtDay(dateObj))} · ${tf8TimeOfSlot(slot)}`;
  document.getElementById('blockExistingPlan').textContent=existingPlan||'Aucune planification de base pour ce bloc.';
  const editor=document.getElementById('blockRichEditor');
  editor.innerHTML=detail.notesHtml||(detail.notes?esc(detail.notes).replace(/\n/g,'<br>'):'');
  const list=document.getElementById('blockLinkList');
  const paintLinks=()=>{
    list.innerHTML=detail.links.length
      ? detail.links.map((l,i)=>`<div class="day-link-row"><a href="${esc(l.url)}" target="_blank" rel="noopener">🔗 ${esc(l.label||l.url)}</a><button type="button" data-remove-block-link="${i}" title="Supprimer">×</button></div>`).join('')
      : '<p class="muted-copy">Aucun lien ajouté à ce bloc.</p>';
    list.querySelectorAll('[data-remove-block-link]').forEach(b=>b.onclick=()=>{detail.links.splice(Number(b.dataset.removeBlockLink),1);paintLinks();});
  };
  paintLinks();
  document.getElementById('addBlockLink').onclick=()=>{
    const label=prompt('Nom du lien :','Ressource');
    if(!label)return;
    let url=prompt('Adresse du lien :','https://');
    if(!url)return;
    if(!/^https?:\/\//i.test(url))url='https://'+url;
    detail.links.push({label:label.trim(),url:url.trim()});
    paintLinks();
  };
  document.getElementById('blockBold').onclick=()=>{editor.focus();document.execCommand('bold',false,null);};
  document.getElementById('blockItalic').onclick=()=>{editor.focus();document.execCommand('italic',false,null);};
  document.getElementById('blockBullets').onclick=()=>{editor.focus();document.execCommand('insertUnorderedList',false,null);};
  document.getElementById('blockNumbered').onclick=()=>{editor.focus();document.execCommand('insertOrderedList',false,null);};
  document.getElementById('blockAddLink').onclick=()=>{
    const selected=window.getSelection()?.toString().trim();
    let url=prompt('Adresse du lien :','https://');
    if(!url)return;
    if(!/^https?:\/\//i.test(url))url='https://'+url;
    editor.focus();
    if(selected) document.execCommand('createLink',false,url);
    else {
      const label=prompt('Texte à afficher :','Lien');
      if(label) document.execCommand('insertHTML',false,`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`);
    }
  };
  document.getElementById('saveBlockBtn').onclick=()=>{
    detail.notesHtml=editor.innerHTML;
    detail.notes=editor.innerText.trim();
    saveState();
    dialog.close();
    if(currentView==='week') renderWeek(); else renderDay();
  };
  dialog.showModal();
}

function renderDay(){
  pageTitle.textContent='Ma journée au complet';
  const weeks=state.planification_hebdomadaire||[];weekIndex=Math.max(0,Math.min(weekIndex,weeks.length-1));const w=weeks[weekIndex],dates=datesForWeek(w);dayIndex=Math.max(0,Math.min(4,dayIndex));const d=dates[dayIndex],cyc=tf8CycleDay(d),rows=tf8ScheduleRows(),key=fmtDateKey(d),detail=getDayDetail(key),g=tf8GuardForDate(d);
  content.innerHTML=`<div class="day-view-head"><div><button class="ghost-btn" id="prevDay">←</button><button class="ghost-btn" id="nextDay">→</button></div><div><h2>${esc(capitalizeFirst(fmtDay(d)))}</h2><p>${cyc?`Jour ${cyc}`:'Pas de classe'} · ${esc(weekLabel(w))}</p>${tf9DayBadges(d)?`<div class="day-view-badges">${tf9DayBadges(d)}</div>`:''}</div><div><button class="ghost-btn" id="backWeek">Semaine complète</button><button class="primary-btn" id="dayNotes">Notes / liens</button></div></div>
  ${g?`<div class="guard-banner"><div><strong>🛡️ Ma garde</strong><span>${esc(g.time)} · ${esc(g.place)}</span>${g.note?`<small>${esc(g.note)}</small>`:''}</div></div>`:''}
  ${!cyc?'<div class="closed-day big">Congé / journée sans classe</div>':`<div class="full-day-timeline">${rows.map((slot,slotIndex)=>{const act=tf8ActivityForSlot(slot,cyc);if(!act)return '';const subj=canonicalSubjectFromKey(act),plan=tf8WeekPlanForSubject(w,subj),blockKey=tf11BlockKey(slot,slotIndex),extra=getBlockDetail(key,blockKey);return `<article class="timeline-row subject-${subjectSlug(subj)} clickable-block" tabindex="0" role="button" data-slot-index="${slotIndex}" aria-label="Modifier ${esc(String(act).replace(/\*/g,''))}, ${esc(tf8TimeOfSlot(slot))}"><time>${esc(tf8TimeOfSlot(slot))}</time><div class="timeline-content"><div class="block-title-row"><strong>${esc(String(act).replace(/\*/g,''))}</strong><span class="block-edit-hint">✏️ Ajouter / modifier</span></div>${plan?`<p>${esc(plan)}</p>`:'<p class="muted-copy">Aucune note de planification ajoutée pour cette matière cette semaine.</p>'}${extra.notesHtml?`<div class="block-added-content">${extra.notesHtml}</div>`:(extra.notes?`<div class="block-added-content"><p>${esc(extra.notes)}</p></div>`:'')}${extra.links?.length?`<div class="block-links">${extra.links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🔗 ${esc(l.label||l.url)}</a>`).join('')}</div>`:''}</div></article>`;}).join('')}</div>`}
  ${(detail.notes||detail.notesHtml||detail.links?.length)?`<div class="section-card day-extra"><div class="section-head"><h2>Notes et ressources du jour</h2></div><div class="day-extra-body">${detail.notesHtml||`<p>${esc(detail.notes||'')}</p>`}${(detail.links||[]).map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">🔗 ${esc(l.label||l.url)}</a>`).join('')}</div></div>`:''}`;
  document.getElementById('prevDay').onclick=()=>{if(dayIndex>0)dayIndex--;else if(weekIndex>0){weekIndex--;dayIndex=4;}renderDay();};
  document.getElementById('nextDay').onclick=()=>{if(dayIndex<4)dayIndex++;else if(weekIndex<weeks.length-1){weekIndex++;dayIndex=0;}renderDay();};
  document.getElementById('backWeek').onclick=()=>{currentView='week';activateNav('week');renderWeek();};
  document.getElementById('dayNotes').onclick=()=>openDayDetail(key,dayIndex,d);
  document.querySelectorAll('.clickable-block').forEach(card=>{
    const open=()=>{const slotIndex=Number(card.dataset.slotIndex),slot=rows[slotIndex],act=tf8ActivityForSlot(slot,cyc),subj=canonicalSubjectFromKey(act),plan=tf8WeekPlanForSubject(w,subj);openBlockEditor(d,slot,slotIndex,act,plan);};
    card.onclick=e=>{if(e.target.closest('a'))return;open();};
    card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
  });
}
function renderSubjects(){
  pageTitle.textContent='Planification par sujet';
  const weeks=state.planification_hebdomadaire||[], units=ensureUnits();
  content.innerHTML=`<div class="section-card"><div class="section-head"><div><h2>Voir toute ma planification par matière</h2><p class="muted-copy">Choisis une matière pour voir les semaines, les unités et tout ce qui est prévu au même endroit.</p></div></div><div class="subject-tabs">${SUBJECTS.filter(s=>s!=='Autre').map(s=>`<button class="subject-tab subject-${subjectSlug(s)} ${s===subjectFilter?'active':''}" data-subject-tab="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;
  const s=subjectFilter, slug=subjectSlug(s), fields=fieldsForSubject(s), subjectUnits=units.filter(u=>u.subject===s);
  const weekly=weeks.map((w,i)=>({i,w,parts:fields.map(f=>({f,v:w[f]})).filter(x=>x.v&&String(x.v).trim())})).filter(x=>x.parts.length);
  content.innerHTML+=`<div class="subject-focus subject-${slug}"><div class="subject-focus-head"><div><small>${esc(subjectColorLabel(s))}</small><h2>${esc(s)}</h2></div><button class="primary-btn" id="newSubjectUnit">+ Nouvelle unité</button></div><div class="subject-focus-grid"><section><h3>Planification semaine par semaine</h3><div class="subject-week-list">${weekly.map(x=>`<article class="subject-week-card"><div class="subject-week-date"><strong>${esc(weekLabel(x.w))}</strong><button class="ghost-btn tiny" data-go-week="${x.i}">Voir la semaine</button></div>${x.parts.map(p=>`<div class="subject-week-part"><small>${esc(normalizeKey(p.f))}</small><p>${esc(p.v)}</p></div>`).join('')}</article>`).join('')||'<p class="muted-copy">Aucune planification hebdomadaire pour cette matière.</p>'}</div></section><section><h3>Unités de ${esc(s)}</h3><div class="subject-unit-list">${subjectUnits.map(unitMiniCard).join('')||'<p class="muted-copy">Aucune unité créée.</p>'}</div></section></div></div>`;
  document.querySelectorAll('[data-subject-tab]').forEach(b=>b.onclick=()=>{subjectFilter=b.dataset.subjectTab;renderSubjects();});
  document.querySelectorAll('[data-go-week]').forEach(b=>b.onclick=()=>{weekIndex=Number(b.dataset.goWeek);currentView='week';activateNav('week');renderWeek();});
  document.getElementById('newSubjectUnit').onclick=()=>openUnitDialog(null,s);bindUnitCardActions();
}

function renderGuards(){
  pageTitle.textContent='Mes gardes';
  const cards=[1,2,3,4,5].map(rot=>{const g=tf8PersonalGuardForRotation(rot);const ranges=TF8_GUARD_RANGES.find(x=>x[0]===rot).slice(1);return `<article class="guard-card ${rot===3||rot===4?'guard-swapped':''}"><div class="guard-card-head"><strong>Semaine ${rot}</strong>${g.note?'<span>Échange</span>':''}</div><h3>${esc(g.place)}</h3><p>${esc(g.time)}</p>${g.note?`<div class="swap-note">↔ ${esc(g.note)}</div>`:''}<details><summary>Dates de cette rotation</summary><div>${ranges.map(([a,b])=>`<small>${esc(a)} → ${esc(b)}</small>`).join('')}</div></details></article>`;}).join('');
  content.innerHTML=`<div class="section-card"><div class="section-head"><div><h2>Surveillances de Lisa</h2><p class="muted-copy">Rotation de 5 semaines. L’échange de garde avec Jessica est déjà appliqué.</p></div></div><div class="common-duty"><span>8h10–8h15 · accueil des élèves</span><span>14h45–14h50 · accompagnement aux autobus</span></div></div><div class="guard-grid">${cards}</div><div class="section-card"><div class="section-head"><h2>Échange Lisa ↔ Jessica</h2></div><div class="swap-explainer"><p><strong>Semaine 3 :</strong> Lisa prend la <strong>Portative 507</strong>, qui était à Jessica, de 11h00 à 11h20.</p><p><strong>Semaine 4 :</strong> Jessica prend la <strong>Portative 501</strong>, qui était à Lisa, de 11h00 à 11h20.</p></div></div>`;
}


// ===== Démarrage autonome (déploiement rapide sans D1) =====
(function startLocalTeachFlow(){
  migrateLocalPrivateData();
  cloudReady=false;
  const sync=document.getElementById('syncStatusBtn');
  if(sync){sync.textContent='💾 Mode local';sync.disabled=true;}
  const logout=document.getElementById('logoutBtn');
  if(logout)logout.style.display='none';
  const auth=document.getElementById('authDialog');
  if(auth?.open)auth.close();
  
// v20 — corrige aussi les anciennes données déjà sauvegardées dans le navigateur.
(function tf20MigrateArts(){
  const replaceDeep=(value)=>{
    if(typeof value==="string"){
      return value
        .replace(/Les arts/g,"Les arts")
        .replace(/Mme Rushnelle/g,"Mme Rushnelle");
    }
    if(Array.isArray(value)) return value.map(replaceDeep);
    if(value && typeof value==="object"){
      Object.keys(value).forEach(k=>value[k]=replaceDeep(value[k]));
    }
    return value;
  };
  try{
    replaceDeep(state);
    saveState();
  }catch(e){ console.warn("Migration Les arts",e); }
})();

render();
})();


// v16 — collage intelligent depuis Google Drive / Docs / Slides / Sheets
function tf16NormalizeUrl(raw){
  let s=(raw||"").trim();
  if(!s) return "";
  if(/^www\./i.test(s)) s="https://"+s;
  return /^https?:\/\//i.test(s) ? s : "";
}
function tf16DriveLabel(url){
  try{
    const u=new URL(url);
    if(u.hostname==="drive.google.com") return "📎 Fichier Google Drive";
    if(u.hostname==="docs.google.com"){
      if(u.pathname.startsWith("/document/")) return "📄 Google Docs";
      if(u.pathname.startsWith("/spreadsheets/")) return "📊 Google Sheets";
      if(u.pathname.startsWith("/presentation/")) return "📽️ Google Slides";
      if(u.pathname.startsWith("/forms/")) return "📝 Google Forms";
    }
  }catch(e){}
  return "🔗 Ouvrir le lien";
}
function tf16Esc(s){
  return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
function tf16LinkifyPlainText(text){
  return (text||"").split(/(https?:\/\/[^\s<]+)/g).map(p=>{
    const url=tf16NormalizeUrl(p);
    if(!url) return tf16Esc(p).replace(/\n/g,"<br>");
    return `<a href="${tf16Esc(url)}" target="_blank" rel="noopener noreferrer">${tf16Esc(tf16DriveLabel(url))}</a>`;
  }).join("");
}
function tf16InsertHtmlAtCursor(markup){
  const sel=window.getSelection();
  if(!sel || !sel.rangeCount) return false;
  const range=sel.getRangeAt(0);
  range.deleteContents();
  const temp=document.createElement("div");
  temp.innerHTML=markup;
  const frag=document.createDocumentFragment();
  let node,last;
  while((node=temp.firstChild)) last=frag.appendChild(node);
  range.insertNode(frag);
  if(last){
    range.setStartAfter(last); range.collapse(true);
    sel.removeAllRanges(); sel.addRange(range);
  }
  return true;
}
document.addEventListener("paste",e=>{
  const editor=e.target.closest?.('[contenteditable="true"], .rich-editor, #dayRichEditor');
  if(!editor) return;
  const cb=e.clipboardData;
  if(!cb) return;
  let clipHtml=cb.getData("text/html")||"";
  const text=cb.getData("text/plain")||"";

  if(clipHtml && /<a\b/i.test(clipHtml)){
    e.preventDefault();
    const box=document.createElement("div");
    box.innerHTML=clipHtml;
    box.querySelectorAll("script,style,iframe,object,embed").forEach(n=>n.remove());
    box.querySelectorAll("*").forEach(n=>{
      [...n.attributes].forEach(a=>{ if(/^on/i.test(a.name)) n.removeAttribute(a.name); });
    });
    box.querySelectorAll("a[href]").forEach(a=>{
      a.target="_blank"; a.rel="noopener noreferrer";
    });
    tf16InsertHtmlAtCursor(box.innerHTML);
    editor.dispatchEvent(new Event("input",{bubbles:true}));
    return;
  }

  if(text && /https?:\/\/[^\s]+/i.test(text)){
    e.preventDefault();
    tf16InsertHtmlAtCursor(tf16LinkifyPlainText(text));
    editor.dispatchEvent(new Event("input",{bubbles:true}));
  }
});



// v26 — aperçu au survol des contenus/liens d'un bloc de planification
function tf26EnhancePlanningCards(root=document){
  const cards=root.querySelectorAll('.schedule-week-card, .day-block, .subject-card');
  cards.forEach(card=>{
    if(card.dataset.tf26Ready) return;
    card.dataset.tf26Ready='1';

    // Gather visible links/content already rendered in the card.
    const links=[...card.querySelectorAll('a[href]')].filter(a=>/^https?:\/\//i.test(a.getAttribute('href')||''));
    const contentBits=[...card.querySelectorAll('.week-block-added,.block-added-content,.day-extra-body,.schedule-week-card small')]
      .map(el=>(el.textContent||'').trim()).filter(Boolean);

    if(!links.length && !contentBits.length) return;

    const preview=document.createElement('div');
    preview.className='tf26-hover-preview';
    preview.innerHTML=`
      <div class="tf26-preview-title">Contenu du bloc</div>
      ${contentBits.slice(0,4).map(t=>`<div class="tf26-preview-text">${tf26Esc(t)}</div>`).join('')}
      ${links.length?`<div class="tf26-preview-links">${links.map(a=>{
        const href=a.getAttribute('href');
        const label=(a.textContent||'Ouvrir le fichier').trim()||'Ouvrir le fichier';
        return `<a href="${tf26Esc(href)}" target="_blank" rel="noopener noreferrer">📎 ${tf26Esc(label)}</a>`;
      }).join('')}</div>`:''}
    `;
    card.appendChild(preview);

    // Link clicks in preview should open the file, not the block editor.
    preview.querySelectorAll('a[href]').forEach(a=>{
      a.addEventListener('click',e=>e.stopPropagation());
    });
  });
}
function tf26Esc(s){
  return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

// Re-run only after app renders; no click interception.
document.addEventListener('DOMContentLoaded',()=>tf26EnhancePlanningCards(document));
const tf26Observer=new MutationObserver(muts=>{
  let should=false;
  for(const m of muts){
    if([...m.addedNodes].some(n=>n.nodeType===1)){should=true;break;}
  }
  if(should) requestAnimationFrame(()=>tf26EnhancePlanningCards(document));
});
document.addEventListener('DOMContentLoaded',()=>{
  tf26Observer.observe(document.body,{childList:true,subtree:true});
});


// v27 mobile: links remain tappable without opening the parent planning block
document.addEventListener('click',e=>{
  const a=e.target.closest?.('a[href]');
  if(!a) return;
  const href=a.getAttribute('href')||'';
  if(/^https?:\/\//i.test(href)) e.stopPropagation();
},false);
