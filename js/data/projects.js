/* ============================================================
   DADOS · CATÁLOGO DE PROJETOS E SOLUÇÕES
   ------------------------------------------------------------
   Base mock do repositório técnico. Em produção viria de uma API.
   ============================================================ */
const PROJECTS = [
 {title:'Robô de Conciliação de Receita Pré-pago',author:'Thiago Barbosa Melo',problem:'Conciliação manual de ~40 mil registros/dia entre plataforma de recarga e billing.',stack:['RPA (UiPath)','SQL','VBA/Macros'],rules:['Cobrança','Auditoria de Receita'],files:3,fileNames:['Fluxo_Conciliacao_Prepago.pdf','Log_Execucao_RPA.xlsx','Manual_Operacional.pdf']},
 {title:'Dashboard de Ressarcimento Automatizado',author:'Marina Rocha Torres',problem:'Falta de visibilidade sobre SLA de ressarcimento de cobranças indevidas.',stack:['Power BI','SQL'],rules:['Ressarcimento'],files:2,fileNames:['Dashboard_Ressarcimento.pbix','Especificacao_SLA.pdf']},
 {title:'API de Integração Billing × CRM',author:'Rafael Almeida Costa',problem:'Duplicidade de cobrança causada por dessincronização entre sistemas.',stack:['Python','AWS','API/Integrações'],rules:['Billing Pós-pago','Cobrança'],files:4,fileNames:['Arquitetura_API.pdf','Postman_Collection.json','Diagrama_Sequencia.png','Changelog.md']},
 {title:'Detecção de Fraude em Portabilidade',author:'Camila Duarte Santos',problem:'Fraudes recorrentes em solicitações de portabilidade numérica.',stack:['Python','SQL'],rules:['Portabilidade'],files:1,fileNames:['Modelo_Deteccao_Fraude.pdf']},
 {title:'Modelo de Precificação de Planos B2B',author:'Patrícia Gomes Ribeiro',problem:'Falta de padronização em propostas comerciais corporativas.',stack:['Qlik Sense','Power BI'],rules:['Planos Corporativos B2B'],files:2,fileNames:['Tabela_Precos_B2B.xlsx','Apresentacao_Comercial.pptx']},
 {title:'Auditoria Automatizada de Faturas SAP',author:'Fernanda Lopes Andrade',problem:'Auditoria manual de faturas sujeita a erro humano e baixa cobertura amostral.',stack:['SAP','R'],rules:['Auditoria de Receita'],files:3,fileNames:['Script_Auditoria.R','Relatorio_Divergencias.pdf','Base_Amostral.xlsx']},
];
