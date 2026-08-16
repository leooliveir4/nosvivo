/* ============================================================
   TELA 3 · HUB — RENDER + FILTROS + BUSCA
   ============================================================ */
const grid=document.getElementById('people-grid');
const activeFilters={dir:new Set(),area:new Set(),tech:new Set(),biz:new Set(),availability:new Set(),q:''};

function personCard(p){
  const shownTags=p.tags.slice(0,3);
  const extra=p.tags.length>3?`<span class="tag-pill overflow">+${p.tags.length-3}</span>`:'';
  return `<div class="person-card" data-name="${p.name}">
    <div class="person-top">
      <div class="avatar" style="background:${p.color};width:46px;height:46px;font-size:14px">${p.initials}</div>
      <div><div class="person-name">${p.name}</div><div class="person-role">${p.role}</div>
      <div class="person-org"><svg class="icon" style="width:12px;height:12px"><use href="#i-building"/></svg>${p.area}</div>
      <div style="margin-top:6px">${availabilityDotHTML(p)}</div></div>
    </div>
    <div class="person-tags">${tagPillsHTML(shownTags)}${extra}</div>
    <button class="btn btn-secondary btn-sm btn-block btn-view-profile">Ver perfil</button>
  </div>`;
}

function skeletonCards(n){
  return Array.from({length:n}).map(()=>`<div class="skeleton-card">
    <div style="display:flex;gap:12px;margin-bottom:14px"><div class="sk sk-avatar"></div>
    <div style="flex:1"><div class="sk sk-line" style="width:70%"></div><div class="sk sk-line" style="width:50%"></div></div></div>
    <div class="sk sk-line" style="width:90%"></div><div class="sk sk-line" style="width:40%;margin-top:16px"></div>
  </div>`).join('');
}

function matches(p){
  if(activeFilters.availability.size){
    const estado = p.available === false ? 'busy' : 'available';
    if(!activeFilters.availability.has(estado)) return false;
  }
  if(activeFilters.dir.size && !activeFilters.dir.has(p.dirKey)) return false;
  if(activeFilters.area.size && !activeFilters.area.has(p.areaKey)) return false;
  if(activeFilters.tech.size && ![...activeFilters.tech].every(t=>p.tags.includes(t))) return false;
  if(activeFilters.biz.size && ![...activeFilters.biz].every(t=>p.tags.includes(t))) return false;
  if(activeFilters.q){
    const q=activeFilters.q.toLowerCase();
    const hay=(p.name+' '+p.role+' '+p.tags.join(' ')).toLowerCase();
    if(!hay.includes(q)) return false;
  }
  return true;
}

function renderHub(){
  const countEl=document.getElementById('hub-count');
  const list=PEOPLE.filter(matches);
  countEl.textContent=list.length;
  if(!list.length){
    grid.innerHTML=`<div class="empty-state">
      <svg class="icon" viewBox="0 0 24 24"><use href="#i-empty"/></svg>
      <h3>Nenhum especialista encontrado</h3>
      <p>Ajuste os filtros ou tente outros termos de busca - talvez seja hora de cadastrar essa competência.</p>
      <button class="btn btn-secondary btn-sm" id="btn-clear-empty">Limpar filtros</button>
    </div>`;
    const c=document.getElementById('btn-clear-empty');
    if(c) c.addEventListener('click',clearFilters);
    return;
  }
  grid.innerHTML=list.map(personCard).join('');
  grid.querySelectorAll('.person-card').forEach(card=>{
    card.querySelector('.btn-view-profile').addEventListener('click',()=>{
      const p=PEOPLE.find(x=>x.name===card.dataset.name);
      openModal(p);
    });
  });
}

document.getElementById('hub-search').addEventListener('input',e=>{
  activeFilters.q=e.target.value;
  renderHub();
});
document.querySelectorAll('.f-dir').forEach(cb=>cb.addEventListener('change',()=>{
  cb.checked?activeFilters.dir.add(cb.value):activeFilters.dir.delete(cb.value); renderHub();
}));
document.querySelectorAll('.f-area').forEach(cb=>cb.addEventListener('change',()=>{
  cb.checked?activeFilters.area.add(cb.value):activeFilters.area.delete(cb.value); renderHub();
}));
document.querySelectorAll('#pick-tech button').forEach(btn=>btn.addEventListener('click',()=>{
  btn.classList.toggle('is-on');
  btn.classList.contains('is-on')?activeFilters.tech.add(btn.dataset.tag):activeFilters.tech.delete(btn.dataset.tag);
  renderHub();
}));
document.querySelectorAll('#pick-biz button').forEach(btn=>btn.addEventListener('click',()=>{
  btn.classList.toggle('is-on');
  btn.classList.contains('is-on')?activeFilters.biz.add(btn.dataset.tag):activeFilters.biz.delete(btn.dataset.tag);
  renderHub();
}));
/* delegação no container: sobrevive a qualquer re-render da sidebar */
document.getElementById('pick-availability').addEventListener('click',(e)=>{
  const btn = e.target.closest('button[data-availability]');
  if(!btn) return;
  btn.classList.toggle('is-on');
  const estado = btn.dataset.availability;
  btn.classList.contains('is-on')?activeFilters.availability.add(estado):activeFilters.availability.delete(estado);
  renderHub();
});
function clearFilters(){
  activeFilters.dir.clear();activeFilters.area.clear();activeFilters.tech.clear();activeFilters.biz.clear();activeFilters.availability.clear();activeFilters.q='';
  document.querySelectorAll('.f-dir,.f-area').forEach(cb=>cb.checked=false);
  document.querySelectorAll('#pick-tech button, #pick-biz button, #pick-availability button').forEach(b=>b.classList.remove('is-on'));
  document.getElementById('hub-search').value='';
  renderHub();
}
document.getElementById('btn-clear-filters').addEventListener('click',clearFilters);
renderHub();
