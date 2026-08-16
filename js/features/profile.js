/* ============================================================
   PERFIL DO USUÁRIO — PERSISTÊNCIA (window.storage)
   ------------------------------------------------------------
   Cada usuário logado tem seu perfil salvo sob a chave
   "profile:<email>" (dado pessoal, não compartilhado). Na
   ausência de um perfil salvo, o assistente mostra o formulário
   de cadastro pré-preenchido com os dados já existentes em
   PEOPLE; ao concluir, o formulário grava no armazenamento e
   atualiza o registro de PEOPLE correspondente, então todo o
   sistema (Hub, Projetos, Painel) passa a refletir o perfil real.
   ============================================================ */
const DIR_KEY_MAP = {
  'Diretoria Financeira & Controladoria':'Financeira',
  'Diretoria de Operações e TI':'TI',
  'Diretoria Comercial B2C':'Comercial',
  'Diretoria de Redes & Engenharia':'Redes',
  'Diretoria de Atendimento & Experiência':'Atendimento',
};
const TECH_TAGS = ['Python','SQL','Power BI','AWS','API/Integrações','SAP','VBA/Macros','Azure','RPA (UiPath)','Excel Avançado','Qlik Sense','R'];

let currentUser = null;

function getCurrentPerson(){
  return PEOPLE.find(p=>p.email && currentUser && p.email.toLowerCase()===currentUser.toLowerCase());
}

function applyProfileToPerson(person, data){
  person.dir = data.dir || person.dir;
  person.area = data.area || person.area;
  person.team = data.team || person.team;
  person.dirKey = DIR_KEY_MAP[person.dir] || person.dirKey;
  person.areaKey = person.area;
  person.role = data.role || person.role;
  person.email = data.email || person.email;
  const tags = [...(data.techTags||[]), ...(data.bizTags||[])];
  if(tags.length) person.tags = tags;
  if(data.bio) person.bio = data.bio;
}

async function saveProfile(email, data){
  try{
    if(!window.storage) return false;
    await window.storage.set('profile:'+email.toLowerCase(), JSON.stringify(data), false);
    return true;
  }catch(err){
    console.error('Falha ao salvar perfil', err);
    return false;
  }
}
async function loadProfile(email){
  try{
    if(!window.storage) return null;
    const res = await window.storage.get('profile:'+email.toLowerCase(), false);
    return res ? JSON.parse(res.value) : null;
  }catch(err){
    return null;
  }
}

function setSelectByText(id, text){
  const sel=document.getElementById(id);
  if(!sel || !text) return;
  const opt=[...sel.options].find(o=>o.textContent.trim()===text.trim());
  if(opt) sel.value=opt.value;
}

function populateWizard(person){
  setSelectByText('sel-dir', person.dir);
  setSelectByText('sel-area', person.area);
  setSelectByText('sel-team', person.team);
  document.getElementById('onb-cargo').value = person.role || '';
  document.getElementById('onb-email').value = person.email || '';
  document.getElementById('onb-bio').value = person.bio || '';
  resetChipWrap('chips-tech');
  resetChipWrap('chips-biz');
  const techSet = new Set(TECH_TAGS);
  (person.tags||[]).forEach(t=>{ addChip(techSet.has(t) ? 'chips-tech' : 'chips-biz', t); });
}

function collectWizardData(){
  return {
    dir: document.getElementById('sel-dir').value,
    area: document.getElementById('sel-area').value,
    team: document.getElementById('sel-team').value,
    role: document.getElementById('onb-cargo').value.trim(),
    email: document.getElementById('onb-email').value.trim(),
    techTags: chipValues('chips-tech'),
    bizTags: chipValues('chips-biz'),
    bio: document.getElementById('onb-bio').value.trim(),
  };
}

function showProfileWizard(person){
  document.getElementById('profile-view').hidden = true;
  document.getElementById('profile-wizard').hidden = false;
  populateWizard(person);
  curStep = 1;
  renderStep();
}

function showProfileView(person){
  document.getElementById('profile-wizard').hidden = true;
  document.getElementById('profile-view').hidden = false;
  const avatar=document.getElementById('pv-me-avatar');
  avatar.textContent = person.initials;
  avatar.style.background = person.color;
  document.getElementById('pv-me-name').textContent = person.name;
  document.getElementById('pv-me-role').textContent = `${person.role} · ${person.team}`;
  document.getElementById('pv-me-crumb').innerHTML = `
    <svg class="icon" viewBox="0 0 24 24"><use href="#i-building"/></svg><span>${person.dir}</span>
    <svg class="icon" viewBox="0 0 24 24"><use href="#i-chevron-right"/></svg><span>${person.area}</span>
    <svg class="icon" viewBox="0 0 24 24"><use href="#i-chevron-right"/></svg><span>${person.team}</span>`;
  document.getElementById('pv-me-email').innerHTML = `<svg class="icon" style="width:14px;height:14px"><use href="#i-mail"/></svg>${person.email||'—'}`;
  document.getElementById('pv-me-bio').textContent = person.bio;
  document.getElementById('pv-me-tags').innerHTML = person.tags.map(t=>`<span class="tag-pill">${t}</span>`).join('');
  const myProjects = PROJECTS.filter(pr=>pr.author===person.name && !removedProjects.has(pr.title));
  document.getElementById('pv-me-projects').innerHTML = myProjects.length
    ? myProjects.map(pr=>`<div class="proj-item"><h5>${pr.title}</h5><p>${pr.problem}</p></div>`).join('')
    : `<p style="font-size:13px;color:var(--text-600)">Nenhum projeto cadastrado ainda. Cadastre em Projetos &amp; soluções.</p>`;
}

function updateTopbarForUser(person){
  const av=document.getElementById('topbar-avatar');
  if(av){ av.textContent=person.initials; av.style.background=person.color; }
  const nm=document.getElementById('topbar-name');
  if(nm) nm.textContent=person.name;
  const rl=document.getElementById('topbar-role');
  if(rl) rl.textContent = person.team || person.area;
}

async function loadProfileForCurrentUser(){
  const person = getCurrentPerson();
  if(!person) return;
  updateTopbarForUser(person);
  const saved = await loadProfile(currentUser);
  if(saved){
    applyProfileToPerson(person, saved);
    showProfileView(person);
  } else {
    showProfileWizard(person);
  }
  if(typeof renderHub==='function') renderHub();
  if(typeof renderProjects==='function') renderProjects();
}
