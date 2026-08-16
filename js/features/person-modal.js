/* ============================================================
   MODAL — PERFIL DETALHADO
   ============================================================ */
const overlay=document.getElementById('modal-overlay');
function openModal(p,tab){
  document.getElementById('modal-avatar').textContent=p.initials;
  document.getElementById('modal-avatar').style.background=p.color;
  document.getElementById('modal-name').textContent=p.name;
  document.getElementById('modal-role').textContent=`${p.role} · ${p.team}`;
  document.getElementById('modal-crumb-dir').textContent=p.dir;
  document.getElementById('modal-crumb-area').textContent=p.area;
  document.getElementById('modal-crumb-team').textContent=p.team;
  document.getElementById('modal-bio').textContent=p.bio;
  document.getElementById('modal-availability').innerHTML=availabilityBadgeHTML(p);
  document.getElementById('modal-tags').innerHTML=tagPillsHTML(p.tags);
  document.getElementById('modal-teams').href=`https://teams.microsoft.com/l/chat/0/0?users=${p.email}`;
  document.getElementById('modal-mail').href=`mailto:${p.email}`;

  const projList=PROJECTS.filter(pr=>pr.author===p.name);
  document.getElementById('modal-projects').innerHTML = projList.length ? projList.map(pr=>`
    <div class="proj-item">
      <h5>${pr.title}</h5>
      <p>${pr.problem}</p>
      <div class="proj-stack">${pr.stack.map(s=>`<span class="tag-pill">${s}</span>`).join('')}${pr.rules.map(r=>`<span class="tag-pill tone-magenta">${r}</span>`).join('')}</div>
    </div>`).join('') : `<p style="font-size:13px;color:var(--text-600)">Nenhum projeto cadastrado no repositório ainda.</p>`;

  switchModalTab(tab||'perfil');
  overlay.classList.add('is-open');
}
function closeModal(){overlay.classList.remove('is-open');}
document.getElementById('modal-close').addEventListener('click',closeModal);
overlay.addEventListener('click',e=>{if(e.target===overlay) closeModal();});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  document.querySelectorAll('.modal-overlay.is-open').forEach(ov=>ov.classList.remove('is-open'));
});

function switchModalTab(name){
  document.querySelectorAll('.modal-tab-btn').forEach(b=>b.classList.toggle('is-active',b.dataset.mtab===name));
  document.querySelectorAll('.modal-pane').forEach(b=>b.classList.toggle('is-active',b.dataset.mpane===name));
}
document.querySelectorAll('.modal-tab-btn').forEach(btn=>btn.addEventListener('click',()=>switchModalTab(btn.dataset.mtab)));
