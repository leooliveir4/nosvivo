/* ============================================================
   TELA 1 · LOGIN — VALIDAÇÃO E AUTENTICAÇÃO
   ============================================================ */
const USERS=[
  {email:'leonardo.silva@vivo.com.br',password:'Vivo@2026'},
  {email:'marina.torres@vivo.com.br',password:'Vivo@2026'},
];
function isValidEmail(v){return /^[^\s@]+@vivo\.com\.br$/i.test(v.trim());}
function isValidPassword(v){return v.length>=6;}

function setFieldError(fieldId,hasError){
  const field=document.getElementById(fieldId);
  field.classList.toggle('has-error',hasError);
  if(hasError){
    field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake');
  }
}
function hideLoginAlert(){document.getElementById('login-alert').classList.remove('is-shown');}
function showLoginAlert(msg){
  document.getElementById('login-alert-text').textContent=msg;
  document.getElementById('login-alert').classList.add('is-shown');
}

const emailInput=document.getElementById('in-email');
const passInput=document.getElementById('in-pass');
emailInput.addEventListener('blur',()=>{ if(emailInput.value.trim()) setFieldError('field-email',!isValidEmail(emailInput.value)); });
passInput.addEventListener('blur',()=>{ if(passInput.value) setFieldError('field-pass',!isValidPassword(passInput.value)); });
emailInput.addEventListener('input',()=>{ if(document.getElementById('field-email').classList.contains('has-error')) setFieldError('field-email',!isValidEmail(emailInput.value)); hideLoginAlert(); });
passInput.addEventListener('input',()=>{ if(document.getElementById('field-pass').classList.contains('has-error')) setFieldError('field-pass',!isValidPassword(passInput.value)); hideLoginAlert(); });

document.getElementById('pw-toggle').addEventListener('click',()=>{
  const toEye = passInput.type==='password';
  passInput.type = toEye ? 'text' : 'password';
  document.getElementById('pw-toggle').innerHTML = `<svg class="icon" viewBox="0 0 24 24"><use href="#i-${toEye?'eye-off':'eye'}"/></svg>`;
  document.getElementById('pw-toggle').setAttribute('aria-label', toEye ? 'Ocultar senha' : 'Mostrar senha');
});

document.getElementById('login-form').addEventListener('submit',(e)=>{
  e.preventDefault();
  hideLoginAlert();
  const emailOk=isValidEmail(emailInput.value);
  const passOk=isValidPassword(passInput.value);
  setFieldError('field-email',!emailOk);
  setFieldError('field-pass',!passOk);
  if(!emailOk){ emailInput.focus(); return; }
  if(!passOk){ passInput.focus(); return; }

  const btn=document.getElementById('btn-login');
  const originalLabel=btn.textContent;
  btn.disabled=true;
  btn.innerHTML='<span class="spinner"></span> Entrando…';

  setTimeout(()=>{
    const emailNorm = emailInput.value.trim().toLowerCase();
    const account = USERS.find(u=>u.email.toLowerCase()===emailNorm);
    btn.disabled=false;
    btn.textContent=originalLabel;
    if(!account){
      showLoginAlert('E-mail não encontrado. Verifique e tente novamente.');
      return;
    }
    if(account.password !== passInput.value){
      showLoginAlert('Senha incorreta. Tente novamente.');
      return;
    }
    showToast('Login realizado com sucesso');
    setTimeout(()=>enterApp(account.email),650);
  },850);
});
document.getElementById('link-forgot').addEventListener('click',(e)=>{e.preventDefault();showToast('Fluxo de recuperação de senha simulado');});
