/* ============================================================
   TELA 4 · PROJETOS — RENDER + FILTRO DE STACK + BUSCA
   ============================================================ */
const projGrid=document.getElementById('proj-grid');
let activeStack='all', projQuery='';
const removedProjects=new Set();
/* Colaborador (USER) só remove o que é dele; gestor (ADMIN) remove
   qualquer solução do repositório. */
function canRemoveProject(pr){
  if(typeof isAdmin === 'function' && isAdmin()) return true;
  const me = getCurrentPerson();
  return !!me && pr.author === me.name;
}

function projCard(pr){
  const person=PEOPLE.find(p=>p.name===pr.author);
  const removeBtn = canRemoveProject(pr)
    ? `<button class="icon-btn btn-remove-project" aria-label="Remover projeto ${pr.title}" data-tooltip-title="Remover">
        <svg class="icon"><use href="#i-trash"/></svg>
      </button>`
    : '';
  return `<div class="proj-card" data-title="${pr.title}" tabindex="0" role="button" aria-label="Ver detalhes do projeto ${pr.title}">
    <h3>${pr.title}</h3>
    <div class="proj-stack">${pr.stack.map(s=>`<span class="tag-pill">${s}</span>`).join('')}${pr.rules.map(r=>`<span class="tag-pill tone-magenta">${r}</span>`).join('')}</div>
    <div class="proj-foot">
      <div class="proj-author"><div class="avatar" style="background:${person?person.color:'#660099'};width:26px;height:26px;font-size:9.5px">${person?person.initials:'??'}</div><span>${pr.author}</span></div>
      <div class="proj-meta"><svg class="icon" style="width:13px;height:13px"><use href="#i-paperclip"/></svg>${pr.files}</div>
      ${removeBtn}
    </div>
  </div>`;
}
function removeProject(title){
  const pr = PROJECTS.find(p=>p.title===title);
  // trava também no ato da remoção, não só na renderização do botão
  if(pr && !canRemoveProject(pr)){
    showToast('Você só pode remover as soluções que cadastrou');
    return;
  }
  removedProjects.add(title);
  renderProjects();
  showToast('Projeto removido do repositório','Desfazer',()=>{
    removedProjects.delete(title);
    renderProjects();
  });
}
function renderProjects(){
  // mantém o KPI do Painel gestor em sincronia com o repositório
  if(typeof renderProjectsKPI === 'function') renderProjectsKPI();
  let list=PROJECTS.filter(p=>!removedProjects.has(p.title));
  list=list.filter(p=>activeStack==='all'||p.stack.includes(activeStack));
  if(projQuery){
    const q=projQuery.toLowerCase();
    list=list.filter(p=>(p.title+p.problem+p.stack.join(' ')+p.rules.join(' ')).toLowerCase().includes(q));
  }
  if(!list.length){
    projGrid.innerHTML=`<div class="empty-state">
      <svg class="icon" viewBox="0 0 24 24"><use href="#i-empty"/></svg>
      <h3>Nenhuma solução encontrada</h3>
      <p>Tente outra stack ou outro termo - ou cadastre a solução que faltou.</p>
    </div>`;
    return;
  }
  projGrid.innerHTML=list.map(projCard).join('');
  projGrid.querySelectorAll('.btn-remove-project').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      const card=btn.closest('.proj-card');
      const title=card.dataset.title;
      card.style.transition='opacity .18s ease, transform .18s ease';
      card.style.opacity='0';
      card.style.transform='scale(.96)';
      setTimeout(()=>removeProject(title),160);
    });
  });
  projGrid.querySelectorAll('.proj-card').forEach(card=>{
    const openThisCard=()=>{
      const pr=PROJECTS.find(x=>x.title===card.dataset.title);
      if(pr) openProjectView(pr);
    };
    card.addEventListener('click',openThisCard);
    card.addEventListener('keydown',(e)=>{
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openThisCard(); }
    });
  });
}
document.querySelectorAll('.stack-chip').forEach(chip=>{
  chip.classList.toggle('is-on',chip.dataset.stack==='all');
  chip.addEventListener('click',()=>{
    document.querySelectorAll('.stack-chip').forEach(c=>c.classList.remove('is-on'));
    chip.classList.add('is-on');
    activeStack=chip.dataset.stack;
    renderProjects();
  });
});
document.getElementById('proj-search').addEventListener('input',e=>{projQuery=e.target.value;renderProjects();});
renderProjects();

/* ============================================================
   MODAL — VISUALIZAÇÃO DE PROJETO
   ============================================================ */
const projectViewOverlay=document.getElementById('project-view-overlay');
function openProjectView(pr){
  const person=PEOPLE.find(p=>p.name===pr.author);
  document.getElementById('pv-title').textContent=pr.title;
  const pvAvatar=document.getElementById('pv-avatar');
  pvAvatar.textContent=person?person.initials:'??';
  pvAvatar.style.background=person?person.color:'#660099';
  document.getElementById('pv-author').textContent=pr.author;
  document.getElementById('pv-author-role').textContent=person?person.role:'Especialista Vivo';
  document.getElementById('pv-problem').textContent=pr.problem;
  document.getElementById('pv-tags').innerHTML=pr.stack.map(s=>`<span class="tag-pill">${s}</span>`).join('')+pr.rules.map(r=>`<span class="tag-pill tone-magenta">${r}</span>`).join('');
  const fileNames=(pr.fileNames&&pr.fileNames.length) ? pr.fileNames : Array.from({length:pr.files||0}).map((_,i)=>`Anexo_${i+1}.pdf`);
  document.getElementById('pv-files').innerHTML = fileNames.length
    ? fileNames.map(f=>`<div class="upload-item"><svg class="icon" viewBox="0 0 24 24"><use href="#i-paperclip"/></svg><span class="fname">${f}</span></div>`).join('')
    : `<p style="font-size:12.5px;color:var(--text-600)">Nenhum anexo cadastrado.</p>`;
  const viewProfileBtn=document.getElementById('pv-view-profile');
  viewProfileBtn.style.display=person?'inline-flex':'none';
  viewProfileBtn.onclick=()=>{
    closeProjectView();
    if(person) setTimeout(()=>openModal(person),220);
  };
  projectViewOverlay.classList.add('is-open');
}
function closeProjectView(){projectViewOverlay.classList.remove('is-open');}
document.getElementById('project-view-close').addEventListener('click',closeProjectView);
projectViewOverlay.addEventListener('click',e=>{if(e.target===projectViewOverlay) closeProjectView();});

/* ============================================================
   MODAL — CADASTRAR NOVA SOLUÇÃO
   ============================================================ */
const newProjectOverlay=document.getElementById('new-project-overlay');
let npFileCount=0;

function resetChipWrap(wrapId){
  document.querySelectorAll(`#${wrapId} .chip`).forEach(c=>c.remove());
}
function chipValues(wrapId){
  return [...document.querySelectorAll(`#${wrapId} .chip`)].map(c=>c.firstChild.textContent.trim());
}
function openNewProjectModal(){
  document.getElementById('new-project-form').reset();
  document.getElementById('np-title').value='';
  document.getElementById('np-problem').value='';
  resetChipWrap('np-chips-stack');
  resetChipWrap('np-chips-rules');
  document.getElementById('np-upload-list').innerHTML='';
  npFileCount=0;
  setFieldError('np-field-title',false);
  setFieldError('np-field-problem',false);
  const me = getCurrentPerson();
  document.getElementById('np-author-name').textContent = me ? me.name : 'você';
  newProjectOverlay.classList.add('is-open');
  setTimeout(()=>document.getElementById('np-title').focus(),150);
}
function closeNewProjectModal(){newProjectOverlay.classList.remove('is-open');}
document.getElementById('btn-new-project').addEventListener('click',openNewProjectModal);
document.getElementById('new-project-close').addEventListener('click',closeNewProjectModal);
document.getElementById('np-cancel').addEventListener('click',closeNewProjectModal);
newProjectOverlay.addEventListener('click',e=>{if(e.target===newProjectOverlay) closeNewProjectModal();});

['np-in-stack','np-in-rules'].forEach(id=>{
  document.getElementById(id).addEventListener('keydown',e=>{
    if(e.key==='Enter' && e.target.value.trim()){
      e.preventDefault();
      addChip(id==='np-in-stack'?'np-chips-stack':'np-chips-rules', e.target.value.trim());
      e.target.value='';
    }
  });
});
document.getElementById('np-upload-zone').addEventListener('click',()=>{
  npFileCount++;
  const item=document.createElement('div');
  item.className='upload-item';
  item.innerHTML=`<svg class="icon" viewBox="0 0 24 24"><use href="#i-paperclip"/></svg><span class="fname">Anexo_${npFileCount}.pdf</span><span class="fsize">${(180+npFileCount*35)} KB</span>`;
  document.getElementById('np-upload-list').appendChild(item);
});

document.getElementById('new-project-form').addEventListener('submit',(e)=>{
  e.preventDefault();
  const title=document.getElementById('np-title').value.trim();
  const problem=document.getElementById('np-problem').value.trim();
  const stack=chipValues('np-chips-stack');
  const rules=chipValues('np-chips-rules');
  const fileNames=[...document.querySelectorAll('#np-upload-list .fname')].map(el=>el.textContent);

  /* todos os campos são obrigatórios — o submit fica bloqueado
     enquanto houver qualquer um vazio */
  const checks = [
    ['np-field-title',   title.length>0,   ()=>document.getElementById('np-title').focus()],
    ['np-field-problem', problem.length>0, ()=>document.getElementById('np-problem').focus()],
    ['np-field-stack',   stack.length>0,   ()=>document.getElementById('np-in-stack').focus()],
    ['np-field-rules',   rules.length>0,   ()=>document.getElementById('np-in-rules').focus()],
    ['np-field-files',   fileNames.length>0, ()=>document.getElementById('np-upload-zone').focus()],
  ];
  checks.forEach(([fieldId, valid])=>setFieldError(fieldId, !valid));
  const firstInvalid = checks.find(([,valid])=>!valid);
  if(firstInvalid){
    firstInvalid[2]();
    showToast('Preencha todos os campos para cadastrar a solução');
    return;
  }

  const me = getCurrentPerson();
  PROJECTS.unshift({
    title, author: me ? me.name : 'Você', problem,
    stack, rules,
    files: fileNames.length, fileNames
  });
  closeNewProjectModal();
  renderProjects();
  showToast('Solução cadastrada com sucesso');
});
