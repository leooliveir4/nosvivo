const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="(assets\/[^"]+)">/g,
  (m, p) => '<style>' + fs.readFileSync(path.join(ROOT, p), 'utf8') + '</style>');
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g,
  (m, p) => '<script>' + fs.readFileSync(path.join(ROOT, p), 'utf8') + '</script>');
html = html.replace(/<script src="https:\/\/cdnjs[^>]*><\/script>/,
  '<script>window.anime={animate:function(){return{then:function(){}}},stagger:function(){return 0}};</script>');
html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '');

const dom = new JSDOM(html, { runScripts:'dangerously', resources:'usable', pretendToBeVisual:true, url:'https://local.test/' });
const w = dom.window, doc = w.document;
w.matchMedia = w.matchMedia || function(){ return { matches:false, addEventListener(){}, addListener(){} }; };
w.HTMLElement.prototype.scrollIntoView = w.HTMLElement.prototype.scrollIntoView || function(){};

const store = new Map();
w.storage = {
  async get(k,s){ const kk=(s?'s:':'p:')+k; if(!store.has(kk)) throw new Error('nf'); return {key:k,value:store.get(kk),shared:!!s}; },
  async set(k,v,s){ store.set((s?'s:':'p:')+k, v); return {key:k,value:v,shared:!!s}; },
};

let errors = 0, pass = 0, fail = 0;
w.addEventListener('error', e => { errors++; console.log('JS ERROR:', e.error && e.error.stack); });

const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (label, cond, extra='') => {
  cond ? pass++ : fail++;
  console.log((cond ? '  ok  ' : ' FAIL ') + label + (extra ? '  ->  ' + extra : ''));
};
const login = (email, senha) => {
  doc.getElementById('in-email').value = email;
  doc.getElementById('in-pass').value = senha;
  doc.getElementById('login-form').dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
};
const logout = () => { doc.getElementById('user-chip-btn').click(); doc.getElementById('btn-logout').click(); };

(async () => {
  await wait(300);

  console.log('\n== ESTRUTURA ==');
  ok('4 abas na navegação (perfil saiu)', doc.querySelectorAll('.tab-btn').length === 4, doc.querySelectorAll('.tab-btn').length);
  ok('menu tem "Meu perfil"', !!doc.getElementById('btn-open-profile'));
  ok('menu tem "Configurações"', !!doc.getElementById('btn-open-settings'));
  ok('loading da IA começa oculto', doc.getElementById('ia-processing').hidden);
  ok('botão limpar começa oculto', doc.getElementById('ia-clear-btn').hidden);

  console.log('\n== RBAC: USER (Marina) ==');
  login('marina.torres@nosvivo.com.br', 'Vivo@2026');
  await wait(1900);
  ok('logou como colaborador', doc.getElementById('topbar-name').textContent === 'Marina Rocha Torres', doc.getElementById('topbar-name').textContent);
  ok('badge = Colaborador', doc.getElementById('user-role-badge').textContent === 'Colaborador');
  const dashTab = doc.querySelector('.tab-btn[data-target="tela-dashboard"]');
  ok('aba Painel gestor escondida', dashTab.classList.contains('is-hidden'));
  dashTab.click();
  ok('acesso direto ao painel bloqueado', !doc.getElementById('tela-dashboard').classList.contains('is-active'));

  console.log('\n== PERFIL VIA MENU DO HEADER ==');
  doc.getElementById('btn-open-profile').click();
  ok('abre tela de perfil', doc.getElementById('tela-onboarding').classList.contains('is-active'));
  for (let i=0;i<4;i++){ doc.getElementById('btn-step-next').click(); await wait(110); }
  await wait(400);
  ok('perfil salvo -> modo visualização', !doc.getElementById('profile-view').hidden);
  ok('flag de disponibilidade no perfil', /Agenda disponível/.test(doc.getElementById('pv-me-availability').textContent));

  console.log('\n== CONFIGURAÇÕES E PRIVACIDADE ==');
  doc.getElementById('btn-open-settings').click();
  ok('abre aba Configurações', !doc.getElementById('profile-settings').hidden);
  ok('perfil fica oculto', doc.getElementById('profile-view').hidden);
  const toggle = doc.getElementById('toggle-availability');
  ok('toggle começa ligado', toggle.checked);
  toggle.checked = false;
  toggle.dispatchEvent(new w.Event('change', {bubbles:true}));
  await wait(250);
  ok('prévia vira indisponível', /Agenda indisponível/.test(doc.getElementById('settings-availability-preview').textContent));
  ok('tooltip da flag inativa correto', /indisponível para reuniões/.test(doc.getElementById('settings-availability-preview').innerHTML));
  doc.querySelector('.profile-section-btn[data-section="perfil"]').click();
  ok('volta para o perfil', !doc.getElementById('profile-view').hidden);
  ok('perfil reflete indisponibilidade', /Agenda indisponível/.test(doc.getElementById('pv-me-availability').textContent));

  console.log('\n== TAGS POR COR ==');
  doc.querySelector('.tab-btn[data-target="tela-hub"]').click();
  const card = doc.querySelector('.person-card');
  ok('card mostra disponibilidade', !!card.querySelector('.availability-dot'));
  const pills = [...doc.querySelectorAll('.person-card .tag-pill')];
  ok('tags de negócio em magenta', pills.some(t=>t.classList.contains('tone-magenta')));
  ok('tags de tecnologia em roxo', pills.some(t=>!t.classList.contains('tone-magenta') && !t.classList.contains('overflow')));

  console.log('\n== PROJETOS ==');
  doc.querySelector('.tab-btn[data-target="tela-projetos"]').click();
  ok('descrição fora do card', !doc.querySelector('.proj-card .proj-problem'));
  doc.querySelector('.proj-card').dispatchEvent(new w.Event('click', {bubbles:true}));
  ok('descrição aparece no modal', doc.getElementById('pv-problem').textContent.length > 10);
  doc.getElementById('project-view-close').click();

  const before = doc.querySelectorAll('.proj-card').length;
  doc.getElementById('btn-new-project').click();
  doc.getElementById('new-project-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  ok('submit vazio bloqueado', doc.getElementById('new-project-overlay').classList.contains('is-open'));
  ok('erro em título', doc.getElementById('np-field-title').classList.contains('has-error'));
  ok('erro em stack', doc.getElementById('np-field-stack').classList.contains('has-error'));
  ok('erro em regras', doc.getElementById('np-field-rules').classList.contains('has-error'));
  ok('erro em anexos', doc.getElementById('np-field-files').classList.contains('has-error'));

  doc.getElementById('np-title').value = 'Projeto de Teste';
  doc.getElementById('np-problem').value = 'Descrição do problema de teste.';
  doc.getElementById('np-in-stack').value = 'Python';
  doc.getElementById('np-in-stack').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  doc.getElementById('np-in-rules').value = 'Cobrança';
  doc.getElementById('np-in-rules').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  doc.getElementById('np-upload-zone').click();
  doc.getElementById('new-project-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await wait(100);
  ok('cadastro completo aceito', !doc.getElementById('new-project-overlay').classList.contains('is-open'));
  ok('projeto entrou na lista', doc.querySelectorAll('.proj-card').length === before + 1);

  console.log('\n== NÓSVIVO IA ==');
  doc.querySelector('.tab-btn[data-target="tela-ia"]').click();
  ok('loading segue oculto no idle', doc.getElementById('ia-processing').hidden);
  ok('limpar oculto no idle', doc.getElementById('ia-clear-btn').hidden);
  doc.getElementById('ia-goal-input').value = 'Quero aprender Python e Big Data.';
  doc.getElementById('ia-submit-btn').click();
  ok('loading aparece após envio', !doc.getElementById('ia-processing').hidden);
  await wait(3200);
  ok('loading some com o resultado', doc.getElementById('ia-processing').hidden);
  ok('resultado exibido', !doc.getElementById('ia-results').hidden);
  ok('botão limpar aparece', !doc.getElementById('ia-clear-btn').hidden);
  ok('match encontrado', doc.getElementById('ia-top-name').textContent.length > 3, doc.getElementById('ia-top-name').textContent);
  doc.getElementById('ia-clear-btn').click();
  await wait(100);
  ok('limpar esconde resultado', doc.getElementById('ia-results').hidden);
  ok('limpar esconde o próprio botão', doc.getElementById('ia-clear-btn').hidden);
  ok('campo esvaziado', doc.getElementById('ia-goal-input').value === '');

  console.log('\n== RBAC: ADMIN (Leonardo) ==');
  logout();
  await wait(150);
  login('leonardo.silva@nosvivo.com.br', 'Vivo@2026');
  await wait(1900);
  ok('badge = Gestor', doc.getElementById('user-role-badge').textContent === 'Gestor');
  const dashTab2 = doc.querySelector('.tab-btn[data-target="tela-dashboard"]');
  ok('aba Painel gestor visível', !dashTab2.classList.contains('is-hidden'));
  dashTab2.click();
  ok('painel acessível', doc.getElementById('tela-dashboard').classList.contains('is-active'));
  ok('KPI de projetos existe', !!doc.getElementById('kpi-projects-value'));
  ok('KPI conta projetos', Number(doc.getElementById('kpi-projects-value').textContent) > 0,
     doc.getElementById('kpi-projects-value').textContent + ' projetos');

  const kpiBefore = Number(doc.getElementById('kpi-projects-value').textContent);
  doc.querySelector('.tab-btn[data-target="tela-projetos"]').click();
  doc.querySelector('.btn-remove-project').dispatchEvent(new w.Event('click',{bubbles:true}));
  await wait(300);
  ok('KPI cai ao remover projeto', Number(doc.getElementById('kpi-projects-value').textContent) === kpiBefore - 1,
     kpiBefore + ' -> ' + doc.getElementById('kpi-projects-value').textContent);

  console.log('\n== SENHA ==');
  logout();
  await wait(150);
  login('leonardo.silva@nosvivo.com.br', 'errada');
  await wait(1000);
  ok('senha incorreta sinalizada', /Senha incorreta/.test(doc.getElementById('login-alert-text').textContent));

  console.log('\n== RESULTADO ==');
  console.log(pass + ' passaram, ' + fail + ' falharam, ' + errors + ' erro(s) de JavaScript');
  process.exit(fail || errors ? 1 : 0);
})();
