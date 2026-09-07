(() => {
  'use strict';

  const KEYS = [
    { id:'francais', letter:'R', title:'Rayonner en français', skill:'Utilisation du français oral', color:'#6f8f68', description:'Je parle français avec confiance.', meaning:'Drapeau franco-ontarien' },
    { id:'fiabilite', letter:'É', title:'Être fiable', skill:'Fiabilité', color:'#d9784a', description:'On peut compter sur moi.', meaning:'Responsabilités terminées' },
    { id:'autonomie', letter:'U', title:'Utiliser les ressources', skill:'Autonomie', color:'#4d9b9a', description:'Je trouve des solutions et je respecte les routines de façon autonome.', meaning:'Outils et ressources' },
    { id:'initiative', letter:'S', title:'Saisir les occasions d’agir', skill:'Sens de l’initiative', color:'#dfa52c', description:'J’ose essayer et je prends des initiatives.', meaning:'Idées et participation' },
    { id:'organisation', letter:'S', title:'Structurer mon matériel, mon temps et mon travail', skill:'Sens de l’organisation', color:'#77906e', description:'Je planifie et je m’organise pour réussir.', meaning:'Agenda et matériel en ordre' },
    { id:'collaboration', letter:'I', title:'Interagir positivement avec les autres', skill:'Esprit de collaboration', color:'#d66f45', description:'Je contribue positivement au travail avec les autres.', meaning:'Travail d’équipe' },
    { id:'autoregulation', letter:'R', title:'Réguler mes émotions et me fixer des objectifs', skill:'Autorégulation', color:'#56a2a0', description:'Je connais mes besoins, je m’ajuste et je progresse.', meaning:'Émotions et objectifs' }
  ];

  const BEHAVIORS = {
    1: [
      ['s1-fr1','francais','Je parle français pendant les échanges en classe.'],
      ['s1-fr2','francais','J’utilise le français avec confiance, même si ce n’est pas parfait.'],
      ['s1-fi1','fiabilite','Je respecte mes engagements et mes responsabilités.'],
      ['s1-fi2','fiabilite','Je termine ce que j’ai commencé et je suis prêt·e au bon moment.'],
      ['s1-au1','autonomie','Je cherche une solution et j’utilise les ressources avant de demander de l’aide.'],
      ['s1-au2','autonomie','Je suis les routines et je me mets au travail de façon autonome.'],
      ['s1-in1','initiative','J’ose essayer une nouvelle stratégie ou proposer une idée.'],
      ['s1-in2','initiative','Je saisis les occasions d’aider ou de contribuer.'],
      ['s1-or1','organisation','Je prépare mon matériel et je garde mon espace organisé.'],
      ['s1-or2','organisation','Je gère mon temps et je planifie les étapes de mon travail.'],
      ['s1-co1','collaboration','J’écoute les idées des autres et je participe activement au travail d’équipe.'],
      ['s1-co2','collaboration','J’aide mon groupe à avancer et je règle les désaccords avec respect.'],
      ['s1-ar1','autoregulation','Je reconnais mes émotions et j’utilise une stratégie pour me recentrer.'],
      ['s1-ar2','autoregulation','Je me fixe un objectif, j’observe mes progrès et j’ajuste mes stratégies.']
    ],
    2: [
      ['s2-fr1','francais','Je choisis spontanément de parler français, même dans les moments moins structurés.'],
      ['s2-fr2','francais','Je reformule mes idées et j’utilise un vocabulaire précis pour mieux me faire comprendre.'],
      ['s2-fi1','fiabilite','Je respecte mes échéances et je peux compter sur moi pour accomplir mes responsabilités.'],
      ['s2-fi2','fiabilite','Je vérifie la qualité de mon travail et je corrige ce qui doit être amélioré avant de le remettre.'],
      ['s2-au1','autonomie','Je choisis les outils, stratégies ou ressources qui m’aident le mieux à avancer.'],
      ['s2-au2','autonomie','Quand je rencontre une difficulté, j’essaie plusieurs solutions avant de demander de l’aide.'],
      ['s2-in1','initiative','Je prends l’initiative de commencer, d’approfondir ou d’améliorer une tâche sans attendre un rappel.'],
      ['s2-in2','initiative','Je propose des idées et je saisis des occasions de contribuer positivement à la classe.'],
      ['s2-or1','organisation','J’anticipe ce dont j’aurai besoin et j’organise mon matériel avant de commencer.'],
      ['s2-or2','organisation','Je répartis mon temps, j’établis mes priorités et j’ajuste mon plan pour terminer mon travail.'],
      ['s2-co1','collaboration','Je fais avancer mon équipe en partageant mes idées, en écoutant et en encourageant les autres.'],
      ['s2-co2','collaboration','Je m’adapte aux rôles et aux points de vue des autres afin de trouver des solutions ensemble.'],
      ['s2-ar1','autoregulation','Je remarque ce qui influence ma concentration ou mes émotions et je choisis une stratégie efficace.'],
      ['s2-ar2','autoregulation','Je me fixe un objectif précis, j’évalue mes progrès et je modifie mes actions pour continuer à progresser.']
    ]
  };
  Object.keys(BEHAVIORS).forEach(s => BEHAVIORS[s] = BEHAVIORS[s].map(([id,key,label])=>({id,key,label,semester:Number(s)})));

  const RATINGS = [
    { value:1, label:'1 — Avec beaucoup de soutien' },
    { value:2, label:'2 — En développement' },
    { value:3, label:'3 — De façon autonome' },
    { value:4, label:'4 — De façon constante' }
  ];

  const STUDENTS = ['Adefarayola','Anna','Kalliope','Madilynn','Oliver','Lexi','Naomi','Odin','Maève','Sophie','Dominic','Tegan','Eileigh','Joseph','Emilie','Léa','Ewelina','Emma','Deacon','Kurtis','Wyatt','Isla','Araotanlowooluwa','Jayden','Benjamin'];
  const AVATAR_COLORS = ['#c68b31','#3ca493','#d25f6c','#657cca','#9569b7','#559759'];
  const STORAGE_KEY = 'tableau-reussir-hh-2026';
  const LEGACY_KEY = 'tableau-force-hh-2026';

  const byId = id => document.getElementById(id);
  const keyById = Object.fromEntries(KEYS.map(k => [k.id,k]));
  const allBehaviors = [...BEHAVIORS[1], ...BEHAVIORS[2]];
  const behaviorById = Object.fromEntries(allBehaviors.map(b => [b.id,b]));

  let state = loadState();
  let selected = new Set();
  let activeTab = 'class';
  let activeSemester = Number(localStorage.getItem('tableau-reussir-semester') || 1);
  if(![1,2].includes(activeSemester)) activeSemester = 1;

  function loadState(){
    let raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) raw = localStorage.getItem(LEGACY_KEY);
    if(raw){
      try {
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed.students) && Array.isArray(parsed.logs)){
          parsed.students = reconcileStudents(parsed.students);
          parsed.logs = parsed.logs.map(l=>({ ...l, semester:Number(l.semester||1) }));
          return parsed;
        }
      } catch(e) {}
    }
    return { students: STUDENTS.map(name => ({name})), logs:[] };
  }

  function reconcileStudents(existing){
    const map = new Map(existing.map(s => [s.name === 'Noami' ? 'Naomi' : s.name, s]));
    return STUDENTS.map(name => ({...(map.get(name)||{}), name}));
  }

  function currentBehaviors(){ return BEHAVIORS[activeSemester]; }
  function semesterLabel(s=activeSemester){ return Number(s)===2 ? '2e semestre' : '1er semestre'; }
  function semesterLogs(){ return state.logs.filter(l=>Number(l.semester||1)===activeSemester); }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function toast(message){
    const el = byId('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.hidden = true, 2200);
  }

  function renderSemester(){
    byId('semester-title').textContent = semesterLabel();
    byId('history-semester').textContent = semesterLabel();
    byId('summary-semester').textContent = semesterLabel();
    document.querySelectorAll('[data-semester]').forEach(b=>b.classList.toggle('on',Number(b.dataset.semester)===activeSemester));
  }

  function renderKeyBar(){
    byId('forces').innerHTML = KEYS.map(k => `
      <div style="--c:${k.color}" title="${escapeHtml(k.description)}">
        <b>${k.letter}</b>
        <span>${escapeHtml(k.title)}</span>
        <small>${escapeHtml(k.meaning)}</small>
      </div>`).join('');
  }

  function renderControls(){
    const behaviors = currentBehaviors();
    byId('behavior-select').innerHTML = KEYS.map(k => `
      <optgroup label="${k.letter} — ${escapeHtml(k.title)} · ${escapeHtml(k.skill)}">
        ${behaviors.filter(b=>b.key===k.id).map(b=>`<option value="${b.id}">${escapeHtml(b.label)}</option>`).join('')}
      </optgroup>`).join('');
    byId('rating-select').innerHTML = RATINGS.map(r=>`<option value="${r.value}" ${r.value===3?'selected':''}>${r.label}</option>`).join('');
  }

  function observationCount(name){ return semesterLogs().filter(l => l.student === name).length; }
  function studentAverage(name){
    const logs = semesterLogs().filter(l=>l.student===name);
    if(!logs.length) return null;
    return logs.reduce((a,l)=>a+Number(l.rating||0),0)/logs.length;
  }

  function renderStudents(){
    byId('selection-summary').textContent = selected.size ? `${selected.size} élève${selected.size>1?'s':''} choisi${selected.size>1?'s':''}` : 'Aucun élève choisi';
    byId('select-all').textContent = selected.size === STUDENTS.length ? 'Tout désélectionner' : 'Choisir toute la classe';
    byId('student-grid').innerHTML = state.students.map((s,i)=>{
      const avg = studentAverage(s.name);
      const count = observationCount(s.name);
      return `<article class="student ${selected.has(s.name)?'selected':''}" role="button" tabindex="0" data-student="${escapeHtml(s.name)}" aria-pressed="${selected.has(s.name)}">
        <button class="quick" aria-label="Observation rapide pour ${escapeHtml(s.name)}" data-quick="${escapeHtml(s.name)}">+</button>
        <div class="check">✓</div>
        <div class="avatar" style="background:${AVATAR_COLORS[i%AVATAR_COLORS.length]}">${escapeHtml(s.name[0])}</div>
        <h2 title="${escapeHtml(s.name)}">${escapeHtml(s.name)}</h2>
        <div class="score">${avg===null?'—':avg.toFixed(1)}<small>/4</small></div>
        <small class="count">${count} observation${count!==1?'s':''}</small>
      </article>`;
    }).join('');

    document.querySelectorAll('.student').forEach(card=>{
      const toggle = () => {
        const name = card.dataset.student;
        selected.has(name) ? selected.delete(name) : selected.add(name);
        renderStudents();
      };
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();} });
    });
    document.querySelectorAll('[data-quick]').forEach(btn=>btn.addEventListener('click', e=>{
      e.stopPropagation();
      openQuickModal(btn.dataset.quick);
    }));
  }

  function record(names, behaviorId, rating){
    if(!names.length) return toast('Choisis au moins un élève.');
    const behavior = behaviorById[behaviorId];
    if(!behavior) return;
    const now = new Date();
    names.forEach(student => state.logs.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      student,
      behaviorId,
      keyId: behavior.key,
      behavior: behavior.label,
      semester: activeSemester,
      rating: Number(rating),
      at: now.toISOString(),
      displayDate: now.toLocaleString('fr-CA')
    }));
    selected.clear();
    save();
    closeModal();
    renderAll();
    toast(`${names.length} observation${names.length>1?'s':''} consignée${names.length>1?'s':''} — ${semesterLabel()}.`);
  }

  function renderHistory(){
    const logs = semesterLogs();
    byId('observation-count').textContent = logs.length;
    const target = byId('history-list');
    if(!logs.length){ target.innerHTML = `<div class="empty">Aucune observation consignée pour le ${semesterLabel()}.</div>`; return; }
    target.innerHTML = logs.map(log=>{
      const k = keyById[log.keyId] || {letter:'★',color:'#69caff',title:'Observation'};
      return `<article>
        <div class="badge" style="background:${k.color}">${k.letter}</div>
        <div><b>${escapeHtml(log.student)}</b><p>${escapeHtml(log.behavior||'Observation')}</p><small>${escapeHtml(log.displayDate || new Date(log.at).toLocaleString('fr-CA'))} · ${escapeHtml(k.title)}</small></div>
        <strong>${Number(log.rating||0)}/4</strong>
        <button data-delete="${log.id}">Annuler</button>
      </article>`;
    }).join('');
    document.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',()=>{
      state.logs = state.logs.filter(l=>l.id!==btn.dataset.delete);
      save(); renderAll(); toast('Observation annulée.');
    }));
  }

  function averageFor(student,keyId){
    const logs = semesterLogs().filter(l=>l.student===student && l.keyId===keyId);
    if(!logs.length) return null;
    return logs.reduce((a,l)=>a+Number(l.rating||0),0)/logs.length;
  }

  function renderSummary(){
    byId('summary-head').innerHTML = `<tr><th>Élève</th>${KEYS.map(k=>`<th style="color:${k.color}">${k.letter}<small>${escapeHtml(k.skill)}</small></th>`).join('')}<th>Moyenne</th></tr>`;
    byId('summary-body').innerHTML = state.students.map(s=>{
      const vals = KEYS.map(k=>averageFor(s.name,k.id));
      const available = vals.filter(v=>v!==null);
      const overall = available.length ? available.reduce((a,b)=>a+b,0)/available.length : null;
      return `<tr><th>${escapeHtml(s.name)}</th>${vals.map(v=>`<td>${v===null?'—':v.toFixed(1)}</td>`).join('')}<td class="overall">${overall===null?'—':overall.toFixed(1)}</td></tr>`;
    }).join('');
  }

  function openQuickModal(name){
    const root = byId('modal-root');
    const behaviors = currentBehaviors();
    root.innerHTML = `<div class="modalbg" role="dialog" aria-modal="true" aria-label="Observation rapide">
      <div class="modal">
        <button class="close" aria-label="Fermer">×</button>
        <p>Consigner une observation — <b>${semesterLabel()}</b></p><h2>${escapeHtml(name)}</h2>
        <label class="modalRating">Cote<select id="modal-rating">${RATINGS.map(r=>`<option value="${r.value}" ${r.value===3?'selected':''}>${r.label}</option>`).join('')}</select></label>
        <div class="modalList">${KEYS.map(k=>`<section><h3 style="color:${k.color}">${k.letter} — ${escapeHtml(k.title)} <small>(${escapeHtml(k.skill)})</small></h3><p class="meaning-note">${escapeHtml(k.meaning)}</p>${behaviors.filter(b=>b.key===k.id).map(b=>`<button data-modal-behavior="${b.id}"><span>${escapeHtml(b.label)}</span><b>Consigner</b></button>`).join('')}</section>`).join('')}</div>
      </div></div>`;
    root.querySelector('.close').addEventListener('click', closeModal);
    root.querySelector('.modalbg').addEventListener('click',e=>{ if(e.target===e.currentTarget) closeModal(); });
    root.querySelectorAll('[data-modal-behavior]').forEach(btn=>btn.addEventListener('click',()=>record([name],btn.dataset.modalBehavior,byId('modal-rating').value)));
  }

  function closeModal(){ byId('modal-root').innerHTML=''; }

  function switchTab(tab){
    activeTab = tab;
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    byId(`view-${tab}`).classList.add('active');
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
    if(tab==='summary') renderSummary();
    if(tab==='history') renderHistory();
  }

  function switchSemester(semester){
    activeSemester = Number(semester)===2 ? 2 : 1;
    localStorage.setItem('tableau-reussir-semester', String(activeSemester));
    selected.clear();
    closeModal();
    renderControls();
    renderAll();
    toast(`${semesterLabel()} activé.`);
  }


  function resetSemester(){
    const label = semesterLabel();
    const count = semesterLogs().length;
    if(!count){
      toast(`Aucune observation à réinitialiser pour le ${label}.`);
      return;
    }
    const ok = window.confirm(`Réinitialiser le ${label} ?\n\nCela effacera définitivement les ${count} observation${count>1?'s':''} de ce semestre. Les données de l’autre semestre seront conservées.`);
    if(!ok) return;
    state.logs = state.logs.filter(l=>Number(l.semester||1)!==activeSemester);
    selected.clear();
    save();
    renderAll();
    toast(`${label} réinitialisé. Les données de l’autre semestre sont intactes.`);
  }

  function exportCsv(){
    const rows = [['Semestre','Date','Élève','Lettre','Clé RÉUSSIR','HH','Comportement observé','Cote']];
    [...semesterLogs()].reverse().forEach(log=>{
      const k = keyById[log.keyId] || {};
      rows.push([semesterLabel(log.semester),log.displayDate || log.at,log.student,k.letter||'',k.title||'',k.skill||'',log.behavior||'',log.rating||'']);
    });
    const csv = '\ufeff' + rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`observations_REUSSIR_semestre_${activeSemester}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function csvCell(v){ return `"${String(v??'').replaceAll('"','""')}"`; }
  function escapeHtml(v){ return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

  function renderAll(){ renderSemester(); renderKeyBar(); renderStudents(); renderHistory(); if(activeTab==='summary') renderSummary(); }

  byId('select-all').addEventListener('click',()=>{
    if(selected.size===STUDENTS.length) selected.clear(); else STUDENTS.forEach(n=>selected.add(n));
    renderStudents();
  });
  byId('record-selected').addEventListener('click',()=>record([...selected],byId('behavior-select').value,byId('rating-select').value));
  document.querySelectorAll('.tabs button').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));
  document.querySelectorAll('[data-semester]').forEach(btn=>btn.addEventListener('click',()=>switchSemester(btn.dataset.semester)));
  document.querySelectorAll('.export-csv').forEach(btn=>btn.addEventListener('click',exportCsv));
  byId('reset-semester').addEventListener('click',resetSemester);

  renderControls();
  save();
  renderAll();
})();
