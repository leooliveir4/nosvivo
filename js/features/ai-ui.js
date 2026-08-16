/* ============================================================
   TELA · ELO IA — UI E FLUXO
   ============================================================ */
const iaState = { detectedTags:[], goalText:'', matches:[], connectedNames:[], journey:[] };

function iaScrollTo(id, opts){
  const el=document.getElementById(id);
  if(el && typeof el.scrollIntoView === 'function') el.scrollIntoView(opts||{behavior:'smooth',block:'start'});
}

function iaMiniMatchInner(m){
  const p=m.person;
  return `<div class="avatar" style="background:${p.color};width:38px;height:38px;font-size:12.5px">${p.initials}</div>
    <div class="ia-mini-match-info"><strong>${p.name}</strong><span>${p.role}</span></div>
    <div class="ia-mini-compat">${m.score}%</div>`;
}
function iaMiniMatchHTML(m){
  return `<div class="ia-mini-match" data-name="${m.person.name}">${iaMiniMatchInner(m)}</div>`;
}

function iaHandleSubmit(){
  const input=document.getElementById('ia-goal-input');
  const text=input.value.trim();
  if(!text){
    input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
    input.focus();
    return;
  }
  iaState.goalText=text;
  document.getElementById('ia-results').hidden=true;
  document.getElementById('ia-processing').hidden=false;
  iaScrollTo('ia-processing',{behavior:'smooth',block:'center'});
  iaRunProcessingSequence(()=>{
    iaState.detectedTags=iaDetectTags(text);
    iaState.matches=iaFindMatches(iaState.detectedTags);
    iaState.connectedNames=[];
    iaState.journey=[];
    iaRenderResults();
    document.getElementById('ia-processing').hidden=true;
    document.getElementById('ia-results').hidden=false;
    iaScrollTo('ia-results',{behavior:'smooth',block:'start'});
  });
}
document.getElementById('ia-submit-btn').addEventListener('click', iaHandleSubmit);

function iaRunProcessingSequence(done){
  const steps=['Analisando seu objetivo...','Identificando conhecimentos necessários...','Encontrando especialistas compatíveis...'];
  const textEl=document.getElementById('ia-processing-text');
  let i=0;
  textEl.textContent=steps[0];
  const interval=setInterval(()=>{
    i++;
    if(i<steps.length){ textEl.textContent=steps[i]; }
    else{ clearInterval(interval); done(); }
  },900);
}

function iaRenderResults(){
  const {detectedTags,goalText,matches}=iaState;
  document.getElementById('ia-objective-tags').innerHTML = detectedTags.length
    ? detectedTags.map(t=>`<span class="tag-pill">${t}</span>`).join('')
    : `<span class="tag-pill overflow">Explorando possibilidades</span>`;
  document.getElementById('ia-objective-quote').textContent = `"${goalText}"`;
  const level=iaDetectLevel(goalText);
  document.getElementById('ia-level-badge').innerHTML = `Nível identificado: <strong>${level}</strong>`;

  iaFillTopMatch(matches[0]);

  const others=matches.slice(1);
  document.getElementById('ia-other-matches').innerHTML = others.map(iaMiniMatchHTML).join('');

  document.getElementById('ia-confirmation').hidden=true;
  document.getElementById('ia-gap-section').hidden=true;
  document.getElementById('ia-new-gap-section').hidden=true;
  document.getElementById('ia-journey-section').hidden=true;
}
document.getElementById('ia-other-matches').addEventListener('click',e=>{
  const el=e.target.closest('.ia-mini-match');
  if(!el) return;
  const p=PEOPLE.find(x=>x.name===el.dataset.name);
  if(p) openModal(p);
});

function iaFillTopMatch(m){
  const {detectedTags}=iaState;
  const p=m.person;
  const avatar=document.getElementById('ia-top-avatar');
  avatar.textContent=p.initials;
  avatar.style.background=p.color;
  document.getElementById('ia-top-name').textContent=p.name;
  document.getElementById('ia-top-role').textContent=p.role;
  document.getElementById('ia-top-compat').textContent=`${m.score}% de compatibilidade`;
  document.getElementById('ia-top-tags').innerHTML = p.tags.map(t=>`<span class="tag-pill${m.overlap.includes(t)?'':' overflow'}">${t}</span>`).join('');
  document.getElementById('ia-top-justification').textContent = iaJustification(p, detectedTags, m.overlap);
  document.getElementById('ia-top-connect').onclick = ()=>iaConnect(m);
  document.getElementById('ia-top-profile').onclick = ()=>openModal(p);

  document.getElementById('ia-connect-name').textContent = p.name.split(' ')[0];
  const topicTag = m.overlap[0] || detectedTags[0];
  document.getElementById('ia-next-topic').textContent = topicTag
    ? `"Como ${topicTag} é utilizado na prática em projetos reais?"`
    : `"Trocar experiências sobre ${p.role.toLowerCase()}"`;
  document.getElementById('ia-connect-btn').onclick = ()=>iaConnect(m);
  document.getElementById('ia-view-profile-btn').onclick = ()=>openModal(p);
  iaState.currentTopMatch = m;
}

function iaConnect(m){
  const p=m.person;
  if(!iaState.connectedNames.includes(p.name)) iaState.connectedNames.push(p.name);
  iaState.journey.push({ person:p, tag: m.overlap[0] || iaState.detectedTags[0] || 'Novo conhecimento' });
  document.getElementById('ia-confirmation').hidden=false;
  showToast(`Conexão com ${p.name.split(' ')[0]} realizada!`);
  document.getElementById('ia-gap-section').hidden=false;
  document.getElementById('ia-new-gap-section').hidden=true;
  document.getElementById('ia-gap-input').value='';
  iaRenderJourney();
  setTimeout(()=>iaScrollTo('ia-gap-section',{behavior:'smooth',block:'center'}),350);
}

function iaRenderJourney(){
  const section=document.getElementById('ia-journey-section');
  if(!iaState.journey.length){ section.hidden=true; return; }
  section.hidden=false;
  document.getElementById('ia-journey-list').innerHTML = iaState.journey.map((j,idx)=>`
    <div class="ia-timeline-item">
      <div class="ia-timeline-dot">${idx+1}</div>
      <div class="ia-timeline-body"><strong>Conexão com ${j.person.name}</strong><span>${j.tag}</span></div>
    </div>`).join('');
}

document.getElementById('ia-gap-submit').addEventListener('click',()=>{
  const input=document.getElementById('ia-gap-input');
  const text=input.value.trim();
  if(!text){
    input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
    input.focus();
    return;
  }
  const {newTagLabel, match} = iaHandleGap(text, iaState.detectedTags, iaState.connectedNames);
  document.getElementById('ia-new-gap-tag').textContent = newTagLabel;
  const matchEl=document.getElementById('ia-new-gap-match');
  matchEl.innerHTML = iaMiniMatchInner(match);
  matchEl.dataset.name = match.person.name;
  document.getElementById('ia-new-gap-connect').onclick = ()=>{
    iaState.detectedTags = [...new Set([...iaState.detectedTags, newTagLabel])];
    document.getElementById('ia-new-gap-section').hidden=true;
    iaConnect(match);
  };
  document.getElementById('ia-new-gap-section').hidden=false;
  document.getElementById('ia-gap-section').hidden=true;
  setTimeout(()=>iaScrollTo('ia-new-gap-section',{behavior:'smooth',block:'center'}),200);
});
document.getElementById('ia-new-gap-match').addEventListener('click',()=>{
  const name=document.getElementById('ia-new-gap-match').dataset.name;
  const p=PEOPLE.find(x=>x.name===name);
  if(p) openModal(p);
});
