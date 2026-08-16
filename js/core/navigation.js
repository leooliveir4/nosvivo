/* ============================================================
   NAVEGAÇÃO ENTRE TELAS
   ============================================================ */
const tabBtns=document.querySelectorAll('.tab-btn');
const telas=document.querySelectorAll('.tela');
const appTopbar=document.getElementById('app-topbar');
function goToTela(id){
  tabBtns.forEach(b=>b.classList.toggle('is-active',b.dataset.target===id));
  telas.forEach(t=>t.classList.toggle('is-active',t.id===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
tabBtns.forEach(btn=>btn.addEventListener('click',()=>goToTela(btn.dataset.target)));

async function enterApp(email){
  currentUser = email;
  appTopbar.classList.remove('is-hidden');
  goToTela('tela-onboarding');
  await loadProfileForCurrentUser();
}
function logout(){
  closeUserMenu();
  appTopbar.classList.add('is-hidden');
  goToTela('tela-login');
  document.getElementById('in-pass').value='';
  document.getElementById('in-email').value='';
  setFieldError('field-email',false);
  setFieldError('field-pass',false);
  hideLoginAlert();
  currentUser = null;
  showToast('Você saiu do NÓsVivo');
}

/* menu do usuário (logout) */
const userMenu=document.querySelector('.user-menu');
const userChipBtn=document.getElementById('user-chip-btn');
function closeUserMenu(){userMenu.classList.remove('is-open');userChipBtn.setAttribute('aria-expanded','false');}
userChipBtn.addEventListener('click',(e)=>{
  e.stopPropagation();
  const willOpen=!userMenu.classList.contains('is-open');
  userMenu.classList.toggle('is-open',willOpen);
  userChipBtn.setAttribute('aria-expanded',String(willOpen));
});
document.addEventListener('click',(e)=>{ if(!userMenu.contains(e.target)) closeUserMenu(); });
document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeUserMenu(); });
document.getElementById('btn-logout').addEventListener('click',logout);
