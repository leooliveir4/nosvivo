/* ============================================================
   CORE · TEMA CLARO / ESCURO
   ------------------------------------------------------------
   Define data-theme no <html>. A preferência é gravada no
   window.storage (mesmo mecanismo usado pelos perfis) e, quando
   o usuário nunca escolheu, segue a preferência do sistema
   operacional via prefers-color-scheme.

   O script inline no <head> (anti-flash) já aplica o tema salvo
   antes da primeira pintura; este módulo cuida do botão, da
   persistência e da sincronia com o sistema.
   ============================================================ */
const THEME_STORAGE_KEY = 'ui:theme';

function getStoredThemeSync(){
  try{ return localStorage.getItem(THEME_STORAGE_KEY); }catch(e){ return null; }
}

function systemPrefersDark(){
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function currentTheme(){
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeButtons(theme);
}

function updateThemeButtons(theme){
  const isDark = theme === 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    btn.setAttribute('data-tooltip', isDark ? 'Tema claro' : 'Tema escuro');
    const use = btn.querySelector('use');
    if(use) use.setAttribute('href', isDark ? '#i-sun' : '#i-moon');
    // item do menu do perfil (celular) tem rótulo textual
    const label = btn.querySelector('[data-theme-label]');
    if(label) label.textContent = isDark ? 'Tema claro' : 'Tema escuro';
  });
}

async function persistTheme(theme){
  // localStorage garante o boot sem flash; window.storage mantém
  // a preferência junto dos demais dados do protótipo.
  try{ localStorage.setItem(THEME_STORAGE_KEY, theme); }catch(e){}
  try{
    if(window.storage) await window.storage.set(THEME_STORAGE_KEY, theme, false);
  }catch(e){}
}

function toggleTheme(){
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  persistTheme(next);
  if(typeof showToast === 'function'){
    showToast(next === 'dark' ? 'Tema escuro ativado' : 'Tema claro ativado');
  }
}

function initTheme(){
  const saved = getStoredThemeSync();
  applyTheme(saved || (systemPrefersDark() ? 'dark' : 'light'));

  document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      toggleTheme();
      // quando acionado pelo menu do perfil (celular), fecha o menu
      if(btn.closest('.user-dropdown') && typeof closeUserMenu === 'function') closeUserMenu();
    });
  });

  // se o usuário nunca escolheu manualmente, acompanha o sistema
  if(!saved && typeof window.matchMedia === 'function'){
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = e => { if(!getStoredThemeSync()) applyTheme(e.matches ? 'dark' : 'light'); };
    if(mq.addEventListener) mq.addEventListener('change', onChange);
    else if(mq.addListener) mq.addListener(onChange);
  }
}

initTheme();
