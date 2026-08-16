/* ============================================================
   ELO IA — MOTOR DE MATCHING (simulação local)
   ------------------------------------------------------------
   Não há API de IA conectada neste protótipo. O "entendimento"
   do objetivo roda 100% no navegador, usando uma base de
   conhecimento no formato CSV (tag,sinônimos) e os perfis já
   cadastrados em PEOPLE — a mesma fonte usada pelo Hub e pelo
   Painel Gestor. A função iaDetectTags() e o scoring abaixo são
   o ponto de troca: para ligar a uma IA real, basta substituir
   o corpo dessas duas funções por uma chamada de API mantendo
   a mesma assinatura (texto in -> tags/score out).
   ============================================================ */
const IA_KNOWLEDGE_CSV =
`tag,sinonimos
Python,python
SQL,sql|banco de dados|consulta de dados|big data|dados
Power BI,power bi|powerbi|dashboard|visualização de dados|dados
Auditoria de Receita,auditoria|receita|faturamento
Ressarcimento,ressarcimento|reembolso
AWS,aws|cloud|nuvem|big data
API/Integrações,api|integração|integrações|integracao
SAP,sap
Billing Pós-pago,billing|pós-pago|pos-pago|fatura
VBA/Macros,vba|macro|macros
Azure,azure|5g|rede|redes
Provisionamento,provisionamento|provisionar
Cobrança,cobrança|cobranca|fraude
RPA (UiPath),rpa|automação|automacao|robô|robo|uipath
Excel Avançado,excel
Planos Corporativos B2B,b2b|plano corporativo|planos corporativos
Qlik Sense,qlik
Portabilidade,portabilidade
R,linguagem r|estatística|estatistica`;

function iaParseKnowledgeCSV(csv){
  return csv.trim().split('\n').slice(1).map(line=>{
    const [tag, syns] = line.split(',');
    return { tag: tag.trim(), synonyms: syns.split('|').map(s=>s.trim().toLowerCase()) };
  });
}
/* A base acima é o fallback embutido (necessário para abrir o
   index.html direto do disco, onde fetch() é bloqueado por CORS).
   Quando o app roda sob um servidor HTTP, a mesma base é lida de
   data/knowledge-base.csv — que é o arquivo de fato editável por
   quem for manter o vocabulário. */
let IA_KNOWLEDGE = iaParseKnowledgeCSV(IA_KNOWLEDGE_CSV);

(async function loadKnowledgeBaseFromCSV(){
  try{
    const res = await fetch('data/knowledge-base.csv');
    if(!res.ok) return;                       // 404 → mantém fallback
    const text = await res.text();
    const parsed = iaParseKnowledgeCSV(text);
    if(parsed.length) IA_KNOWLEDGE = parsed;
  }catch(err){
    /* file:// ou offline → segue com o fallback embutido */
  }
})();

function iaDetectTags(text){
  const lower = ' ' + (text||'').toLowerCase() + ' ';
  const found = [];
  IA_KNOWLEDGE.forEach(({tag, synonyms})=>{
    const hit = synonyms.some(s => s.length <= 2 ? new RegExp('\\b'+s+'\\b','i').test(text||'') : lower.includes(s));
    if(hit) found.push(tag);
  });
  return [...new Set(found)];
}

function iaDetectLevel(text){
  const t=(text||'').toLowerCase();
  if(/(nunca (fiz|trabalhei|usei)|iniciante|começando|comecando|do zero|básico|basico|não sei|nao sei|sem experiência|sem experiencia)/.test(t)) return 'Iniciante';
  if(/(avançado|avancado|anos de experiência|anos de experiencia|especialista|domino|expert|sênior|senior)/.test(t)) return 'Avançado';
  if(/(intermediário|intermediario|já sei|ja sei|tenho experiência|tenho experiencia|conheço|conheco|algum conhecimento)/.test(t)) return 'Intermediário';
  return 'A definir';
}

function iaScorePerson(person, detectedTags){
  const overlap = person.tags.filter(t=>detectedTags.includes(t));
  let score = 0;
  if(detectedTags.length){
    score += (overlap.length/detectedTags.length)*62;
    score += (overlap.length/person.tags.length)*28;
    const bioLower = person.bio.toLowerCase();
    let bonus=0;
    detectedTags.forEach(t=>{ if(bioLower.includes(t.toLowerCase())) bonus+=2; });
    score += Math.min(bonus,10);
  } else {
    score = 28 + person.tags.length*3;
  }
  score = Math.max(12, Math.min(97, Math.round(score)));
  return { person, score, overlap };
}

function iaFindMatches(detectedTags, excludeNames){
  excludeNames = excludeNames || [];
  return PEOPLE
    .filter(p=>!excludeNames.includes(p.name))
    .map(p=>iaScorePerson(p, detectedTags))
    .sort((a,b)=>b.score-a.score)
    .slice(0,3);
}

function iaJustification(person, detectedTags, overlap){
  const firstName = person.name.split(' ')[0];
  if(!overlap.length){
    return `${firstName} atua como ${person.role} e traz uma experiência versátil que pode ajudar a destravar os primeiros passos do seu objetivo.`;
  }
  const focus = detectedTags.slice(0,3).join(', ');
  const skills = overlap.join(', ');
  return `Você quer desenvolver ${focus}. ${firstName} atua com ${skills} como ${person.role}, o que torna sua experiência altamente relevante para o seu objetivo.`;
}

function iaHandleGap(gapText, previousTags, excludeNames){
  const gapTags = iaDetectTags(gapText);
  let newTag = gapTags.find(t=>!previousTags.includes(t));
  if(!newTag){
    const lastConnected = PEOPLE.find(p=>p.name===excludeNames[excludeNames.length-1]);
    newTag = lastConnected && lastConnected.tags.find(t=>!previousTags.includes(t));
  }
  if(!newTag){
    const fallbackPool = ['Auditoria de Receita','API/Integrações','Power BI','SQL','Cobrança','Excel Avançado'];
    newTag = fallbackPool.find(t=>!previousTags.includes(t)) || 'Aprofundamento contínuo';
  }
  const matches = iaFindMatches([newTag], excludeNames);
  return { newTagLabel:newTag, match: matches[0] };
}
