/* ============================================================
   TELA 2 · STEPPER ONBOARDING
   ============================================================ */
let curStep=1;
const totalSteps=4;
function renderStep(){
  document.querySelectorAll('.step-item').forEach(el=>{
    const n=+el.dataset.step;
    el.classList.toggle('is-active',n===curStep);
    el.classList.toggle('is-done',n<curStep);
  });
  document.querySelectorAll('.onboard-step').forEach(el=>{
    el.classList.toggle('is-active',+el.dataset.step===curStep);
  });
  document.getElementById('btn-step-back').disabled=curStep===1;
  document.getElementById('btn-step-next').textContent = curStep===totalSteps ? 'Concluir cadastro' : 'Salvar e continuar';
}
document.getElementById('btn-step-next').addEventListener('click', async ()=>{
  if(curStep<totalSteps){curStep++;renderStep();return;}
  const person = getCurrentPerson();
  if(!person){ showToast('Faça login para salvar seu perfil'); return; }
  const data = collectWizardData();
  if(!data.email) data.email = currentUser;
  applyProfileToPerson(person, data);
  const btn=document.getElementById('btn-step-next');
  const original=btn.textContent;
  btn.disabled=true;
  btn.innerHTML='<span class="spinner"></span> Salvando…';
  const ok = await saveProfile(currentUser, data);
  btn.disabled=false;
  btn.textContent=original;
  showToast(ok ? 'Perfil salvo com sucesso' : 'Perfil salvo nesta sessão (armazenamento indisponível)');
  showProfileView(person);
  if(typeof renderHub==='function') renderHub();
  if(typeof renderProjects==='function') renderProjects();
});
document.getElementById('btn-step-back').addEventListener('click',()=>{
  if(curStep>1){curStep--;renderStep();}
});
document.getElementById('btn-edit-profile').addEventListener('click',()=>{
  const person = getCurrentPerson();
  if(person) showProfileWizard(person);
});

function addChip(wrapId,text){
  const wrap=document.getElementById(wrapId);
  const input=wrap.querySelector('input');
  const chip=document.createElement('span');
  chip.className='chip'+((wrapId==='chips-biz'||wrapId==='np-chips-rules')?' tone-magenta':'');
  chip.innerHTML=`${text}<button aria-label="remover">✕</button>`;
  chip.querySelector('button').addEventListener('click',()=>chip.remove());
  wrap.insertBefore(chip,input);
}
['in-tech','in-biz'].forEach(id=>{
  document.getElementById(id).addEventListener('keydown',e=>{
    if(e.key==='Enter' && e.target.value.trim()){
      addChip(id==='in-tech'?'chips-tech':'chips-biz',e.target.value.trim());
      e.target.value='';
    }
  });
});
document.querySelectorAll('.suggest-chip').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const target=btn.dataset.add==='tech'?'chips-tech':'chips-biz';
    addChip(target,btn.textContent.replace('+ ','').trim());
  });
});
document.getElementById('upload-zone').addEventListener('click',()=>showToast('Seletor de arquivos simulado'));
