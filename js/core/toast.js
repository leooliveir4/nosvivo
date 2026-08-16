/* ============================================================
   TOAST (com ação opcional de desfazer)
   ============================================================ */
let toastTimer;
function showToast(msg,actionLabel,actionFn){
  const t=document.getElementById('toast');
  const actionBtn=document.getElementById('toast-action');
  document.getElementById('toast-text').textContent=msg;
  if(actionLabel && actionFn){
    actionBtn.textContent=actionLabel;
    actionBtn.style.display='inline-flex';
    actionBtn.onclick=()=>{ actionFn(); t.classList.remove('is-shown'); clearTimeout(toastTimer); };
  } else {
    actionBtn.style.display='none';
    actionBtn.onclick=null;
  }
  t.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('is-shown'),actionLabel?5200:3200);
}
