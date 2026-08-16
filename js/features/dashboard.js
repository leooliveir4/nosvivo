/* ============================================================
   TELA 6 · DASHBOARD — HEATMAP + GRÁFICO
   ============================================================ */
const heatCats=['Dados & BI','Automação & RPA','Billing & Receita','Redes & Infra'];
const heatDirs=[
  {name:'Financeira',vals:[78,64,92,20]},
  {name:'Operações e TI',vals:[70,45,30,55]},
  {name:'Comercial B2C',vals:[52,18,40,10]},
  {name:'Redes & Eng.',vals:[35,22,15,88]},
  {name:'Atendimento',vals:[40,30,58,25]},
];
function heatColor(v){
  // lê o canal RGB do tema ativo (--heat-rgb muda no tema escuro)
  const rgb = getComputedStyle(document.documentElement)
                .getPropertyValue('--heat-rgb').trim() || '102,0,153';
  const alpha = 0.18 + (v/100)*0.82;
  return `rgba(${rgb},${alpha.toFixed(2)})`;
}
function renderHeatmap(){
  let html=`<div></div>`;
  heatCats.forEach(c=>html+=`<div class="hcol-label">${c}</div>`);
  heatDirs.forEach(row=>{
    html+=`<div class="hlabel">${row.name}</div>`;
    row.vals.forEach(v=>{html+=`<div class="hcell" style="background:${heatColor(v)}">${v}</div>`;});
  });
  document.getElementById('heatmap').innerHTML=html;
}
renderHeatmap();

// o heatmap usa cor calculada em JS, então precisa ser repintado
// quando o tema muda (o resto da UI reage sozinho via CSS vars)
new MutationObserver(renderHeatmap).observe(document.documentElement,
  { attributes:true, attributeFilter:['data-theme'] });
