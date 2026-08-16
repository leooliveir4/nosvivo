const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// resolve <link> de CSS locais para <style> inline
html = html.replace(/<link rel="stylesheet" href="(assets\/[^"]+)">/g, (m, p) => {
  return '<style>' + fs.readFileSync(path.join(ROOT, p), 'utf8') + '</style>';
});
// resolve <script src> locais para script inline
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (m, p) => {
  return '<script>' + fs.readFileSync(path.join(ROOT, p), 'utf8') + '</script>';
});
// stubs de CDN
html = html.replace(/<script src="https:\/\/cdnjs[^>]*><\/script>/,
  '<script>window.anime={animate:function(){return{then:function(){}}},stagger:function(){return 0}};</script>');
html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '');

const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'https://local.test/' });
const w = dom.window;
w.matchMedia = w.matchMedia || function(){ return { matches:false, addEventListener(){}, addListener(){} }; };
w.HTMLElement.prototype.scrollIntoView = w.HTMLElement.prototype.scrollIntoView || function(){};

const store = new Map();
w.storage = {
  async get(k, s){ const kk=(s?'s:':'p:')+k; if(!store.has(kk)) throw new Error('nf'); return {key:k, value:store.get(kk), shared:!!s}; },
  async set(k, v, s){ store.set((s?'s:':'p:')+k, v); return {key:k, value:v, shared:!!s}; },
};

let errors = 0;
w.addEventListener('error', e => { errors++; console.log('❌ JS ERROR:', e.error && e.error.stack); });

const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (label, cond, extra='') => console.log((cond ? '✅' : '❌') + ' ' + label + (extra ? ' → ' + extra : ''));

(async () => {
  await wait(300);
  const doc = w.document;

  console.log('\n──── ESTRUTURA / CARREGAMENTO ────');
  ok('CSS carregado', doc.querySelectorAll('style').length >= 10, doc.querySelectorAll('style').length + ' folhas');
  ok('sprite de ícones presente', !!doc.getElementById('i-elo-mark'));
  ok('ícone lua presente', !!doc.getElementById('i-moon'));
  ok('ícone sol presente', !!doc.getElementById('i-sun'));
  ok('nav com 5 abas', doc.querySelectorAll('.tab-btn').length === 5, doc.querySelectorAll('.tab-btn').length);
  const nPeople = w.eval('PEOPLE.length'), nProj = w.eval('PROJECTS.length'), nKb = w.eval('IA_KNOWLEDGE.length');
  ok('PEOPLE carregado', nPeople === 10, nPeople);
  ok('PROJECTS carregado', nProj === 6, nProj);
  ok('base de conhecimento parseada', nKb === 19, nKb + ' tags');

  console.log('\n──── TEMA CLARO / ESCURO ────');
  ok('tema inicial = light', doc.documentElement.getAttribute('data-theme') === 'light');
  const toggles = doc.querySelectorAll('.theme-toggle');
  ok('2 botões de tema (topbar + login)', toggles.length === 2, toggles.length);
  toggles[0].click();
  ok('alternou para dark', doc.documentElement.getAttribute('data-theme') === 'dark');
  ok('ícone virou sol', toggles[0].querySelector('use').getAttribute('href') === '#i-sun');
  ok('aria-pressed=true', toggles[0].getAttribute('aria-pressed') === 'true');
  ok('preferência persistida', w.localStorage.getItem('ui:theme') === 'dark');
  toggles[0].click();
  ok('voltou para light', doc.documentElement.getAttribute('data-theme') === 'light');
  ok('ícone voltou p/ lua', toggles[0].querySelector('use').getAttribute('href') === '#i-moon');
  // volta pra dark pra testar heatmap
  toggles[0].click();

  console.log('\n──── LOGIN ────');
  doc.getElementById('in-email').value = 'leonardo.silva@vivo.com.br';
  doc.getElementById('in-pass').value = 'senhaerrada';
  doc.getElementById('login-form').dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  await wait(1000);
  ok('senha incorreta detectada', /Senha incorreta/.test(doc.getElementById('login-alert-text').textContent),
     doc.getElementById('login-alert-text').textContent);

  doc.getElementById('in-pass').value = 'Vivo@2026';
  doc.getElementById('login-form').dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  await wait(1900);
  ok('logou e foi p/ perfil', doc.getElementById('tela-onboarding').classList.contains('is-active'));
  ok('topbar mostra usuário', doc.getElementById('topbar-name').textContent === 'Leonardo Silva');
  ok('wizard visível (1º acesso)', !doc.getElementById('profile-wizard').hidden);

  console.log('\n──── PERFIL: SALVAR E REVISITAR ────');
  for (let i=0;i<4;i++){ doc.getElementById('btn-step-next').click(); await wait(120); }
  await wait(400);
  ok('virou modo visualização', !doc.getElementById('profile-view').hidden);
  ok('perfil persistido', store.has('p:profile:leonardo.silva@vivo.com.br'));
  ok('e-mail no perfil', /leonardo\.silva@vivo\.com\.br/.test(doc.getElementById('pv-me-email').textContent));

  console.log('\n──── NÓSVIVO IA ────');
  doc.querySelector('.tab-btn[data-target="tela-ia"]').click();
  doc.getElementById('ia-goal-input').value = 'Quero aprender Python e Big Data para projetos reais.';
  doc.getElementById('ia-submit-btn').click();
  await wait(3200);
  ok('resultado exibido', !doc.getElementById('ia-results').hidden);
  ok('match encontrado', doc.getElementById('ia-top-name').textContent.length > 3,
     doc.getElementById('ia-top-name').textContent + ' / ' + doc.getElementById('ia-top-compat').textContent);
  doc.getElementById('ia-connect-btn').click();
  ok('conexão confirmada', !doc.getElementById('ia-confirmation').hidden);
  doc.getElementById('ia-gap-input').value = 'Aprendi Python mas preciso entender SAP e auditoria.';
  doc.getElementById('ia-gap-submit').click();
  ok('novo gap identificado', doc.getElementById('ia-new-gap-tag').textContent.length > 2,
     doc.getElementById('ia-new-gap-tag').textContent);

  console.log('\n──── HUB / PROJETOS / PAINEL ────');
  doc.querySelector('.tab-btn[data-target="tela-hub"]').click();
  ok('cards de pessoas', doc.querySelectorAll('.person-card').length === 10, doc.querySelectorAll('.person-card').length);
  doc.querySelector('.tab-btn[data-target="tela-projetos"]').click();
  ok('cards de projetos', doc.querySelectorAll('.proj-card').length === 6, doc.querySelectorAll('.proj-card').length);
  doc.querySelector('.proj-card').dispatchEvent(new w.Event('click', {bubbles:true}));
  ok('modal de projeto abre', doc.getElementById('project-view-overlay').classList.contains('is-open'));
  doc.getElementById('project-view-close').click();

  doc.querySelector('.tab-btn[data-target="tela-dashboard"]').click();
  const cell = doc.querySelector('.heatmap .hcell');
  ok('heatmap renderizado', !!cell);
  ok('heatmap usa cor do tema escuro', /184,\s*136,\s*224/.test(cell.getAttribute('style')),
     cell.getAttribute('style'));

  console.log('\n──── LOGOUT / 2º USUÁRIO ────');
  doc.getElementById('user-chip-btn').click();
  doc.getElementById('btn-logout').click();
  await wait(100);
  doc.getElementById('in-email').value = 'marina.torres@vivo.com.br';
  doc.getElementById('in-pass').value = 'Vivo@2026';
  doc.getElementById('login-form').dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  await wait(1900);
  ok('2º usuário entra', doc.getElementById('topbar-name').textContent === 'Marina Rocha Torres',
     doc.getElementById('topbar-name').textContent);
  ok('perfil dela pede cadastro', !doc.getElementById('profile-wizard').hidden);

  doc.getElementById('user-chip-btn').click();
  doc.getElementById('btn-logout').click();
  await wait(100);
  doc.getElementById('in-email').value = 'leonardo.silva@vivo.com.br';
  doc.getElementById('in-pass').value = 'Vivo@2026';
  doc.getElementById('login-form').dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  await wait(1900);
  ok('Leonardo volta direto p/ visualização', !doc.getElementById('profile-view').hidden);

  console.log('\n──── RESULTADO ────');
  console.log(errors === 0 ? '✅ Nenhum erro de JavaScript' : `❌ ${errors} erro(s) de JavaScript`);
  process.exit(0);
})();
