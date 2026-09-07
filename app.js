(() => {
  'use strict';

  const KEYS = [
    { id:'francais', letter:'R', title:'Rayonner en français', skill:'Utilisation du français oral', icon:'FR', color:'#6f8f68', description:'Je parle français avec confiance.' },
    { id:'fiabilite', letter:'É', title:'Être fiable', skill:'Fiabilité', icon:'✓', color:'#d9784a', description:'On peut compter sur moi.' },
    { id:'autonomie', letter:'U', title:'Utiliser les ressources', skill:'Autonomie', icon:'⌛', color:'#4d9b9a', description:'Je trouve des solutions et je respecte les routines de façon autonome.' },
    { id:'initiative', letter:'S', title:'Saisir les occasions d’agir', skill:'Sens de l’initiative', icon:'✦', color:'#dfa52c', description:'J’ose essayer et je prends des initiatives.' },
    { id:'organisation', letter:'S', title:'Structurer mon matériel, mon temps et mon travail', skill:'Sens de l’organisation', icon:'▣', color:'#77906e', description:'Je planifie et je m’organise pour réussir.' },
    { id:'collaboration', letter:'I', title:'Interagir positivement avec les autres', skill:'Esprit de collaboration', icon:'◆', color:'#d66f45', description:'Je contribue positivement au travail avec les autres.' },
    { id:'autoregulation', letter:'R', title:'Réguler mes émotions et me fixer des objectifs', skill:'Autorégulation', icon:'◎', color:'#56a2a0', description:'Je connais mes besoins, je m’ajuste et je progresse.' }
  ];

  const BEHAVIORS = [
    ['fr1','francais','Parle français pendant les échanges en classe'],
    ['fr2','francais','Utilise le français avec confiance, même si ce n’est pas parfait'],
    ['fr3','francais','Encourage les autres à s’exprimer en français'],
    ['fr4','francais','Choisit spontanément le français dans la vie de classe'],

    ['fi1','fiabilite','Respecte ses engagements et ses responsabilités'],
    ['fi2','fiabilite','Termine ce qu’il ou elle a commencé'],
    ['fi3','fiabilite','Est prêt ou prête au bon moment avec le matériel nécessaire'],
    ['fi4','fiabilite','Fait ce qui est attendu sans rappels répétés'],

    ['au1','autonomie','Cherche une solution avant de demander de l’aide'],
    ['au2','autonomie','Utilise les ressources et outils disponibles'],
    ['au3','autonomie','Suit les routines de façon autonome'],
    ['au4','autonomie','Se met au travail et progresse de façon indépendante'],

    ['in1','initiative','Ose essayer une nouvelle stratégie'],
    ['in2','initiative','Propose une idée ou une solution'],
    ['in3','initiative','Commence une action utile sans attendre une consigne détaillée'],
    ['in4','initiative','Saisit une occasion d’aider ou de contribuer'],

    ['or1','organisation','Prépare le matériel nécessaire'],
    ['or2','organisation','Gère efficacement son temps'],
    ['or3','organisation','Range et entretient son espace de travail'],
    ['or4','organisation','Planifie les étapes de son travail'],

    ['co1','collaboration','Écoute les idées des autres avec respect'],
    ['co2','collaboration','Participe activement au travail d’équipe'],
    ['co3','collaboration','Aide son groupe à avancer vers le but commun'],
    ['co4','collaboration','Règle les désaccords avec respect et ouverture'],

    ['ar1','autoregulation','Identifie ce qu’il ou elle ressent et choisit une stratégie appropriée'],
    ['ar2','autoregulation','Se calme, se recentre et revient à la tâche'],
    ['ar3','autoregulation','Se fixe un objectif réaliste et utile'],
    ['ar4','autoregulation','Observe ses progrès et ajuste ses stratégies']
  ].map(([id,key,label]) => ({id,key,label}));

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
  const behaviorById = Object.fromEntries(BEHAVIORS.map(b => [b.id,b]));

  let state = loadState();
  let selected = new Set();
  let activeTab = 'class';

  function loadState(){
    let raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) raw = localStorage.getItem(LEGACY_KEY);
    if(raw){
      try {
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed.students) && Array.isArray(parsed.logs)){
          parsed.students = reconcileStudents(parsed.students);
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

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function toast(message){
    const el = byId('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.hidden = true, 2200);
  }

  function renderKeyBar(){
    byId('forces').innerHTML = KEYS.map(k => `
      <div style="--c:${k.color}" title="${escapeHtml(k.description)}">
        <b>${k.icon} ${k.letter}</b>
        <span>${escapeHtml(k.title)}</span>
      </div>`).join('');
  }

  function renderControls(){
    byId('behavior-select').innerHTML = KEYS.map(k => `
      <optgroup label="${k.letter} — ${escapeHtml(k.title)} · ${escapeHtml(k.skill)}">
        ${BEHAVIORS.filter(b=>b.key===k.id).map(b=>`<option value="${b.id}">${escapeHtml(b.label)}</option>`).join('')}
      </optgroup>`).join('');
    byId('rating-select').innerHTML = RATINGS.map(r=>`<option value="${r.value}" ${r.value===3?'selected':''}>${r.label}</option>`).join('');
  }

  function observationCount(name){ return state.logs.filter(l => l.student === name).length; }
  function studentAverage(name){
    const logs = state.logs.filter(l=>l.student===name);
    if(!logs.length) return null;
    return logs.reduce((a,l)=>a+Number(l.rating||0),0)/logs.length;
  }

  function renderStudents(){
    byId('selection-summary').textContent = selected.size ? `${selected.size} élève${selected.size>1?'s':''} choisi${selected.size>1?'s':''}` : 'Aucun élève choisi';
    byId('select-all').textContent = selected.size === STUDENTS.length ? 'Tout désélectionner' : 'Choisir toute la classe';
    byId('student-grid').innerHTML = state.students.map((s,i)=>{
      const avg = studentAverage(s.name);
      return `<article class="student ${selected.has(s.name)?'selected':''}" role="button" tabindex="0" data-student="${escapeHtml(s.name)}" aria-pressed="${selected.has(s.name)}">
        <button class="quick" aria-label="Observation rapide pour ${escapeHtml(s.name)}" data-quick="${escapeHtml(s.name)}">+</button>
        <div class="check">✓</div>
        <div class="avatar" style="background:${AVATAR_COLORS[i%AVATAR_COLORS.length]}">${escapeHtml(s.name[0])}</div>
        <h2 title="${escapeHtml(s.name)}">${escapeHtml(s.name)}</h2>
        <div class="score">${avg===null?'—':avg.toFixed(1)}<small>/4</small></div>
        <small class="count">${observationCount(s.name)} observation${observationCount(s.name)!==1?'s':''}</small>
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
      rating: Number(rating),
      at: now.toISOString(),
      displayDate: now.toLocaleString('fr-CA')
    }));
    selected.clear();
    save();
    closeModal();
    renderAll();
    toast(`${names.length} observation${names.length>1?'s':''} consignée${names.length>1?'s':''}.`);
  }

  function renderHistory(){
    byId('observation-count').textContent = state.logs.length;
    const target = byId('history-list');
    if(!state.logs.length){ target.innerHTML = '<div class="empty">Aucune observation consignée pour le moment.</div>'; return; }
    target.innerHTML = state.logs.map(log=>{
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
    const logs = state.logs.filter(l=>l.student===student && l.keyId===keyId);
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
    root.innerHTML = `<div class="modalbg" role="dialog" aria-modal="true" aria-label="Observation rapide">
      <div class="modal">
        <button class="close" aria-label="Fermer">×</button>
        <p>Consigner une observation pour</p><h2>${escapeHtml(name)}</h2>
        <label class="modalRating">Cote<select id="modal-rating">${RATINGS.map(r=>`<option value="${r.value}" ${r.value===3?'selected':''}>${r.label}</option>`).join('')}</select></label>
        <div class="modalList">${KEYS.map(k=>`<section><h3 style="color:${k.color}">${k.icon} ${k.letter} — ${escapeHtml(k.title)} <small>(${escapeHtml(k.skill)})</small></h3>${BEHAVIORS.filter(b=>b.key===k.id).map(b=>`<button data-modal-behavior="${b.id}"><span>${escapeHtml(b.label)}</span><b>Consigner</b></button>`).join('')}</section>`).join('')}</div>
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

  function exportCsv(){
    const rows = [['Date','Élève','Lettre','Clé RÉUSSIR','HH','Comportement observé','Cote']];
    [...state.logs].reverse().forEach(log=>{
      const k = keyById[log.keyId] || {};
      rows.push([log.displayDate || log.at,log.student,k.letter||'',k.title||'',k.skill||'',log.behavior||'',log.rating||'']);
    });
    const csv = '\ufeff' + rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`observations_REUSSIR_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function csvCell(v){ return `"${String(v??'').replaceAll('"','""')}"`; }
  function escapeHtml(v){ return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

  function renderAll(){ renderKeyBar(); renderStudents(); renderHistory(); if(activeTab==='summary') renderSummary(); }

  byId('select-all').addEventListener('click',()=>{
    if(selected.size===STUDENTS.length) selected.clear(); else STUDENTS.forEach(n=>selected.add(n));
    renderStudents();
  });
  byId('record-selected').addEventListener('click',()=>record([...selected],byId('behavior-select').value,byId('rating-select').value));
  document.querySelectorAll('.tabs button').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));
  document.querySelectorAll('.export-csv').forEach(btn=>btn.addEventListener('click',exportCsv));

  renderControls();
  save();
  renderAll();
})();
