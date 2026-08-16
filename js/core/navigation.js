/* ============================================================
   NAVEGAÇÃO ENTRE TELAS + CONTROLE DE ACESSO (RBAC)
   ------------------------------------------------------------
   currentRole guarda o papel do usuário logado. Telas marcadas
   com data-role="ADMIN" só ficam acessíveis para gestores; a aba
   correspondente é removida da barra para quem não tem acesso.
   ============================================================ */
const tabBtns=document.querySelectorAll('.tab-btn');
const telas=document.querySelectorAll('.tela');
const appTopbar=document.getElementById('app-topbar');

let currentRole = null;
function isAdmin(){ return currentRole === 'ADMIN'; }

/* telas restritas e a aba correspondente */
const ADMIN_ONLY_TELAS = ['tela-dashboard'];

function canAccess(telaId){
  return !ADMIN_ONLY_TELAS.includes(telaId) || isAdmin();
}

function applyRoleVisibility(){
  tabBtns.forEach(btn=>{
    const restricted = ADMIN_ONLY_TELAS.includes(btn.dataset.target);
    btn.classList.toggle('is-hidden', restricted && !isAdmin());
  });
  document.querySelectorAll('[data-admin-only]').forEach(el=>{
    el.classList.toggle('is-hidden', !isAdmin());
  });
  const badge = document.getElementById('user-role-badge');
  if(badge){
    badge.textContent = isAdmin() ? 'Gestor' : 'Colaborador';
    badge.classList.toggle('is-admin', isAdmin());
  }
}

function goToTela(id){
  if(!canAccess(id)){
    showToast('Você não tem permissão para acessar o Painel gestor');
    return;
  }
  tabBtns.forEach(b=>b.classList.toggle('is-active',b.dataset.target===id));
  telas.forEach(t=>t.classList.toggle('is-active',t.id===id));
  // o botão flutuante da IA não pode pairar sobre as outras telas
  const iaClear = document.getElementById('ia-clear-btn');
  if(iaClear && id !== 'tela-ia') iaClear.hidden = true;
  else if(iaClear && id === 'tela-ia'){
    const results = document.getElementById('ia-results');
    iaClear.hidden = !results || results.hidden;
  }
  // o perfil saiu da barra de abas: quando ele está aberto, nenhuma
  // aba fica marcada como ativa
  window.scrollTo({top:0,behavior:'smooth'});
}
tabBtns.forEach(btn=>btn.addEventListener('click',()=>goToTela(btn.dataset.target)));

async function enterApp(email, role){
  currentUser = email;
  currentRole = role || 'USER';
  appTopbar.classList.remove('is-hidden');
  applyRoleVisibility();
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
  currentRole = null;
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

/* perfil e configurações agora moram no menu do header */
document.getElementById('btn-open-profile').addEventListener('click',()=>{
  closeUserMenu();
  goToTela('tela-onboarding');
  if(typeof showProfileSection === 'function') showProfileSection('perfil');
});
document.getElementById('btn-open-settings').addEventListener('click',()=>{
  closeUserMenu();
  goToTela('tela-onboarding');
  if(typeof showProfileSection === 'function') showProfileSection('config');
});
