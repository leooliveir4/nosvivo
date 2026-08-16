# NÓsVivo — Rede de Conhecimento

> **O conhecimento certo, com a pessoa certa, no momento certo.**

Protótipo funcional de uma plataforma corporativa de mapeamento de capital intelectual. O objetivo é reduzir o tempo que um colaborador leva para encontrar quem já resolveu o problema que ele tem agora, e expor à gestão onde o conhecimento está perigosamente concentrado.

---

## Sumário

- [O problema](#o-problema)
- [Como rodar](#como-rodar)
- [Credenciais de demonstração](#credenciais-de-demonstração)
- [Telas](#telas)
- [Controle de acesso (RBAC)](#controle-de-acesso-rbac)
- [NÓsVivo IA](#nósvivo-ia)
- [Arquitetura de pastas](#arquitetura-de-pastas)
- [Design system e temas](#design-system-e-temas)
- [Perfil, privacidade e disponibilidade](#perfil-privacidade-e-disponibilidade)
- [Persistência de dados](#persistência-de-dados)
- [Testes](#testes)
- [Roteiro de demonstração](#roteiro-de-demonstração-hackathon)
- [Histórico de alterações](#histórico-de-alterações)
- [Limitações conhecidas](#limitações-conhecidas)

---

## O problema

Em uma operação de grande porte, o conhecimento técnico e de negócio fica disperso: alguém já construiu o robô de conciliação que você precisa, alguém já auditou aquela regra de billing, alguém já integrou aquele sistema. Sem um mapa, esse conhecimento é redescoberto do zero — ou pior, some quando a pessoa sai.

O NÓsVivo ataca dois indicadores:

| Indicador | O que mede |
|---|---|
| **Tempo para encontrar conhecimento** | Quanto tempo até achar quem sabe |
| **Taxa de reuso de soluções** | Quanto do que já existe é reaproveitado |
| **Pontos únicos de falha (SPOF)** | Competências concentradas em uma só pessoa |

---

## Como rodar

### Opção 1 — abrir direto (mais simples)

```bash
# basta abrir o arquivo no navegador
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Funciona sem servidor, sem build, sem instalar nada. O projeto usa scripts clássicos carregados em ordem de dependência justamente para permitir isso.

### Opção 2 — servidor local (recomendado)

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

Servindo por HTTP, o motor da IA passa a ler o vocabulário de `data/knowledge-base.csv` em tempo de execução (via `fetch`). Aberto direto do disco, ele usa a cópia embutida como fallback — o comportamento é idêntico, muda só a origem do dado.

**Requisitos:** um navegador moderno. Sem dependências de build. As únicas dependências externas são carregadas por CDN: as fontes do Google Fonts e a biblioteca **Anime.js v4** (animação do fundo da tela de login).

---

## Credenciais de demonstração

Dois usuários, para demonstrar troca de conta e isolamento de perfis:

| E-mail | Senha | Papel |
|---|---|---|
| `leonardo.silva@nosvivo.com.br` | `Vivo@2026` | **ADMIN** (gestor) |
| `marina.torres@nosvivo.com.br` | `Vivo@2026` | **USER** (colaborador) |

A validação distingue os erros: e-mail fora do domínio `@nosvivo.com.br`, e-mail não cadastrado e **senha incorreta** têm mensagens diferentes.

---

## Telas

A navegação principal é composta por ícones (com tooltip), na seguinte ordem:

| Ícone | Tela | O que faz | Acesso |
|---|---|---|---|
| ✦ | **NÓsVivo IA** | Recebe seu objetivo de desenvolvimento e encontra quem pode te ajudar | Todos |
| 🏠 | **Central de colaboradores** | Busca de especialistas por hierarquia e por tags | Todos |
| ▦ | **Projetos & soluções** | Repositório de automações, scripts e sistemas já construídos | Todos |
| 📊 | **Painel gestor** | KPIs, mapa de calor de competências e alertas de concentração | Somente ADMIN |

**Menu do avatar** (canto superior direito) reúne o que é pessoal, nesta ordem: **Meu perfil**, **Configurações**, alternador de **tema** (no celular) e **Sair**.

A tela de **login** fica fora da navegação: é a porta de entrada. Ao autenticar, a barra aparece e o usuário é levado ao próprio perfil.

---

## Controle de acesso (RBAC)

Cada conta carrega um papel, definido em `js/features/auth.js`:

| Papel | Pode |
|---|---|
| **USER** | Ler todo o catálogo de pessoas e projetos; editar apenas o próprio perfil e os próprios projetos. **Não enxerga o Painel gestor** — a aba nem é renderizada. |
| **ADMIN** | Tudo que o USER faz, mais o **Painel gestor** com os indicadores gerenciais. |

A restrição é aplicada em duas camadas: a aba é escondida (`applyRoleVisibility`) e a própria navegação recusa o destino (`goToTela` verifica `canAccess`), então nem forçando a troca de tela um USER entra no painel.

> Como todo o protótipo roda no navegador, esse controle é de **experiência**, não de segurança. Em produção a checagem precisa acontecer no servidor.

---

## NÓsVivo IA

O diferencial do produto. O usuário escreve livremente o que quer desenvolver e o sistema devolve pessoas, não documentos.

**Fluxo:** objetivo → processamento → objetivo identificado (tags + nível) → melhor conexão com % de compatibilidade e justificativa → outras conexões → próximo passo sugerido → conexão → registro do que aprendeu → **novo gap identificado** → nova conexão.

Esse ciclo é o conceito central: o desenvolvimento não termina no primeiro match.

### ⚠️ Sobre a "IA": não há API de IA conectada

**Isto é uma simulação local, rodando 100% no navegador.** Está declarado na própria interface e é importante que fique claro em qualquer apresentação. Não existe chamada a nenhum modelo de linguagem.

Como funciona de verdade:

1. **Detecção de intenção** (`iaDetectTags`) — busca por palavras-chave e sinônimos definidos em `data/knowledge-base.csv`. É casamento de texto, não compreensão de linguagem natural.
2. **Nível de senioridade** (`iaDetectLevel`) — expressões regulares procurando marcadores como "nunca fiz", "tenho experiência", "sou especialista". Sem confiança suficiente, retorna `A definir`.
3. **Compatibilidade** (`iaScorePerson`) — fórmula determinística sobre as tags dos perfis:
   - 62% — quanto da sua necessidade a pessoa cobre
   - 28% — quão focado o perfil dela é naquilo
   - 10% — bônus se a bio menciona os termos
   - resultado limitado entre 12% e 97%
4. **Justificativa** — template de frase preenchido com nome, cargo e tags em comum. Texto montado, não gerado.
5. **Animação de processamento** — três mensagens em sequência via `setTimeout`, puramente cosmética. O cálculo real é instantâneo.

### Como plugar uma IA real

A arquitetura foi desenhada para essa substituição. Basta trocar o corpo de duas funções em `js/features/ai-engine.js`, mantendo as assinaturas:

```js
// entrada: texto livre  →  saída: array de tags
async function iaDetectTags(text) { /* chamada à API */ }

// entrada: pessoa + tags  →  saída: { person, score, overlap }
function iaScorePerson(person, detectedTags) { /* ranking do modelo */ }
```

Toda a camada de UI (`js/features/ai-ui.js`) consome apenas esse contrato e não precisa ser tocada.

---

## Arquitetura de pastas

```
nosvivo/
├── index.html                      # markup + orquestração (só estrutura)
├── README.md
│
├── assets/css/
│   ├── 01-tokens.css               # design tokens + temas claro/escuro
│   ├── 02-base.css                 # reset e ícones
│   ├── 03-layout.css               # topbar, navegação, alternador de tema
│   ├── 04-components.css           # botões, modais, toast
│   ├── 05-responsive.css           # breakpoints (1180 / 980 / 720px)
│   └── screens/
│       ├── login.css
│       ├── profile.css
│       ├── hub.css
│       ├── projects.css
│       ├── ai.css
│       └── dashboard.css
│
├── js/
│   ├── core/                       # infraestrutura, sem regra de negócio
│   │   ├── theme.js                # tema claro/escuro + persistência
│   │   ├── navigation.js           # troca de telas, sessão, menu do usuário
│   │   ├── toast.js                # notificações (com ação "desfazer")
│   │   └── background-animation.js # Anime.js — grafo de nós do login
│   │
│   ├── data/                       # camada de dados (mock; viria de API)
│   │   ├── people.js               # 10 especialistas
│   │   └── projects.js             # 6 soluções catalogadas
│   │
│   └── features/                   # uma pasta = uma capacidade do produto
│       ├── auth.js                 # validação e autenticação
│       ├── profile.js              # persistência do perfil do usuário
│       ├── onboarding.js           # wizard de 4 etapas
│       ├── hub.js                  # busca e filtros de especialistas
│       ├── projects.js             # repositório + modais de projeto
│       ├── person-modal.js         # perfil detalhado
│       ├── ai-engine.js            # motor de matching (lógica pura)
│       ├── ai-ui.js                # interface da NÓsVivo IA
│       └── dashboard.js            # KPIs e mapa de calor
│
├── data/
│   └── knowledge-base.csv          # vocabulário da IA (tag,sinonimos)
│
└── tests/
    └── smoke-test.js               # suíte de testes de integração
```

### Por que scripts clássicos e não ES Modules?

Decisão consciente. Módulos ES exigem servidor HTTP — abrir o `index.html` com duplo clique quebraria por CORS. Como o protótipo precisa ser aberto e demonstrado em qualquer máquina, sem preparo, os arquivos são carregados como scripts clássicos **na ordem de dependência** definida no final do `index.html`.

A separação de responsabilidades é real; apenas o mecanismo de carregamento é conservador. Migrar para módulos ES (ou para um bundler como Vite) é uma troca de mecanismo, não de arquitetura: os arquivos já estão desenhados como unidades independentes.

**Regra ao mexer:** `ai-engine.js` contém apenas lógica (sem DOM). `ai-ui.js` contém apenas interface. Manter essa fronteira é o que permite trocar a IA simulada por uma real sem reescrever a tela.

---

## Design system e temas

### Tokens

Toda cor, raio, sombra e fonte vem de variáveis CSS em `01-tokens.css`. Nenhum componente define cor própria — é o que torna o tema escuro viável sem duplicar folha de estilo.

**Paleta:** roxo `#660099` (primária), magenta `#EB0029` (destaque), neutros `#F5F5F7` / `#222222`.
**Tipografia:** Sora (títulos), Inter (corpo), IBM Plex Mono (dados e códigos).

### Tema claro / escuro

Controlado pelo atributo `data-theme` no `<html>`. Botão disponível na topbar e na tela de login.

- **Persistência:** a escolha é gravada em `localStorage` e replicada em `window.storage`.
- **Preferência do sistema:** quem nunca escolheu manualmente segue o `prefers-color-scheme` do sistema operacional, e continua acompanhando se ele mudar.
- **Anti-flash:** um script inline no `<head>` aplica o tema antes da primeira pintura, evitando o "piscar branco" ao abrir já configurado no escuro.

**O detalhe crítico do tema escuro:** os tokens `--purple-*` **invertem** no escuro (o roxo escuro vira lavanda clara, para ler bem sobre fundo escuro). Isso quebraria todo botão roxo com texto branco. Por isso existem tokens separados que **permanecem escuros nos dois temas**:

| Token | Uso |
|---|---|
| `--brand-solid` | Botões cheios, badges, abas ativas |
| `--brand-grad-a/b/c` | Gradientes de hero e cabeçalhos de modal |
| `--accent-solid` | Botões de destaque em magenta |

> **Ao criar um componente novo:** se ele tem **texto branco por cima**, use `--brand-solid`. Se é superfície ou texto comum, use `--surface` / `--purple-*`. Trocar isso é o erro mais fácil de cometer aqui.

O mapa de calor do Painel Gestor calcula cor em JavaScript, então lê o token `--heat-rgb` e se repinta automaticamente na troca de tema (via `MutationObserver`).

### Responsividade

Testado em desktop e celular. Breakpoints:

| Largura | O que muda |
|---|---|
| ≤1180px | Grids de 3 → 2 colunas |
| ≤980px | Login e sidebar de filtros empilham |
| ≤720px | Coluna única; topbar compacta; alternador de tema migra para o menu do perfil; rótulos do stepper ocultos; rodapé da IA empilha; interruptor de privacidade abaixo do texto; botão *Limpar busca* recolhido às margens |
| ≤400px | Abas e avatar reduzidos; KPIs em coluna única |
| Sem mouse | Tooltips desativados (evita `:hover` grudado em telas de toque) |

---

## Perfil, privacidade e disponibilidade

O perfil vive no menu do avatar e tem duas seções:

**Perfil** — modo de visualização (igual ao que os outros veem) com botão *Editar perfil* que reabre o formulário de 4 etapas.

**Configurações → Privacidade** — um interruptor liga/desliga controla sua **flag de disponibilidade**:

| Estado | Como aparece | Texto ao passar o cursor |
|---|---|---|
| Ativa | 🟢 Agenda disponível | *Agende dentro do meu horário de trabalho quando houver disponibilidade.* |
| Inativa | 🔴 Agenda indisponível | *No momento, estou indisponível para reuniões; entre em contato por mensagem pelo e-mail ou pelo Teams.* |

A flag aparece em três lugares, sempre a partir do mesmo dado: no seu perfil, nos cards da Central de colaboradores (em versão compacta) e no modal de perfil detalhado. A escolha é gravada junto do perfil, então persiste entre sessões.

### Taxonomia de tags

Competências e projetos usam o **mesmo código de cores** em todo o sistema:

- **Roxo** — tecnologias e ferramentas (Python, SQL, Power BI…)
- **Magenta** — regras de negócio e domínio (Cobrança, Auditoria de Receita…)

A classificação é centralizada em `tagPillsHTML()` (`js/features/profile.js`), que consulta a lista `TECH_TAGS`. Qualquer tela que renderize tags herda o padrão automaticamente.

---

## Persistência de dados

O perfil de cada usuário é salvo sob a chave `profile:<email>` via `window.storage` (dados pessoais, não compartilhados).

**Comportamento:**

1. **Primeiro acesso** — o wizard aparece pré-preenchido com os dados que já existem do usuário
2. **Ao concluir** — grava o perfil e alterna para o **modo de visualização**, igual ao que outras pessoas veem: avatar, cargo, hierarquia, e-mail de contato, escopo, competências e projetos
3. **Acessos seguintes** — vai direto para a visualização, com botão **Editar perfil**

O perfil salvo alimenta o restante do sistema: as competências cadastradas passam a valer na busca da Central de colaboradores, no matching da IA e nos indicadores do Painel Gestor. Projetos cadastrados são atribuídos automaticamente ao usuário logado.

---

## Testes

Suíte de integração que carrega o projeto real (resolvendo os `<link>` e `<script>` como o navegador faria) e exercita os fluxos ponta a ponta.

```bash
npm install jsdom
node tests/smoke-test.js
```

**Cobertura (48 verificações):** estrutura dos arquivos separados · RBAC nos dois papéis (aba oculta e navegação bloqueada) · login com senha incorreta e com sucesso · perfil salvo e relido · privacidade e flag de disponibilidade nos três pontos de exibição · taxonomia de tags por cor · projetos sem descrição no card e com todos os campos obrigatórios · KPI de projetos reagindo a remoção · fluxo completo da IA, do estado idle ao limpar busca · ausência de erros de JavaScript.

---

## Roteiro de demonstração (hackathon)

1. Abrir na tela de login e **alternar para o tema escuro** (mostra o cuidado com o produto)
2. Entrar como `leonardo.silva@nosvivo.com.br` (gestor)
3. Preencher o perfil — competências, escopo, contato
4. Ir para **NÓsVivo IA** e escrever: *"Quero aprender Python e Big Data para trabalhar com projetos reais."*
5. A IA identifica **Python + SQL + AWS**, encontra o especialista mais compatível e **explica por quê**
6. Conectar → o sistema sugere uma conversa de 30 minutos com tema específico
7. Registrar o que aprendeu → a IA identifica um **novo gap** e recomenda outra pessoa
8. Mostrar o **Painel gestor**: KPI de projetos compartilhados e alertas de conhecimento concentrado em uma só pessoa
9. Sair e entrar como `marina.torres@nosvivo.com.br` — perfil próprio e **sem acesso ao Painel gestor** (a aba desaparece)
10. Em *Configurações → Privacidade*, desligar a disponibilidade e mostrar a flag mudando de verde para vermelho na Central de colaboradores

**A frase que fecha:** *eu digo o que quero aprender → o sistema entende → encontra quem pode me ensinar → eu me conecto → aprendo → ele me mostra o próximo passo.*

---

## Histórico de alterações

Registro das mudanças solicitadas ao longo do desenvolvimento, em ordem cronológica.

### 1. Estrutura inicial
- Seis telas construídas como **abas de navegação** de um site único, não como páginas isoladas
- Identidade visual aplicada (roxo, magenta, neutros) com design responsivo

### 2. Projetos, perfil e navegação
- Opção de **remover** projetos, com confirmação por toast e ação de **desfazer**
- Perfil detalhado deixou de ser aba: passou a abrir pelo botão **Ver perfil**
- Removida a autenticação Microsoft/Azure AD; login próprio com validação em JavaScript
- Navegação redesenhada: **somente ícones**, em cápsula centralizada, com tooltip

### 3. Login, painel e navegação (refinamento)
- Login virou página independente, sem a barra de navegação
- Após autenticar, redireciona para o **cadastro de perfil**
- **Logout** adicionado ao menu do avatar
- Removido o filtro "Estado" da busca; "Ordenar por" alinhado à barra de pesquisa
- Removido o card de KPI de tempo médio no Painel gestor

### 4. Projetos, IA visual e identidade
- Cards de projeto passaram a ser **clicáveis**, abrindo popup de detalhes
- **Cadastrar solução** virou formulário real, com validação e anexos
- Gráficos de especialistas por tecnologia e por regra de negócio adicionados ao painel
- Animação dos pontos do login migrada para **Anime.js v4** (Enhanced Transforms)
- Logo e nome ampliados no login; título e subtítulo centralizados
- Logo branco da marca aplicado em **todas as notificações**

### 5. NÓsVivo IA
- Nova aba, posicionada como **primeira** e principal do produto
- Fluxo completo: objetivo → processamento → identificação → matching com justificativa → próximo passo → registro de aprendizado → novo gap → nova conexão
- Motor de matching alimentado por **base de conhecimento em CSV**
- Deixado explícito na interface que **não há IA real conectada**

### 6. Multiusuário, persistência e limpeza
- **Persistência de perfil**: cadastro salvo, visualização em acessos seguintes, edição sob demanda
- **Dois usuários** navegáveis, com perfis, projetos e competências isolados
- E-mail de contato adicionado ao cadastro e exibido no perfil
- **Checagem de senha** com mensagem específica de senha incorreta
- Removidos "Manter conectado" e o e-mail pré-preenchido (virou placeholder)
- Marca renomeada de **Elo** para **NÓsVivo** em todo o sistema
- "Buscar especialistas" → **Central de colaboradores**, com ícone de casa
- Removidos o fluxograma e os emojis da tela da IA (mantida só a estrela da marca)
- Removidos os dois últimos gráficos do Painel gestor
- Abas do perfil detalhado redesenhadas; "Projetos & regras de negócio" → **Projetos**
- **31 ícones corrigidos** que renderizavam como blocos pretos (classe CSS ausente)

### 7. Ajustes de conteúdo (feitos pelo autor)
- Prefixos "Tela 0X ·" removidos dos cabeçalhos
- "Lotação" → **Área de Atuação**
- "Time-to-Knowledge" → **tempo para encontrar conhecimento**
- Padronização de travessões e ajuste de opções de ordenação

### 8. Tema escuro e arquitetura *(esta entrega)*
- **Tema claro/escuro** com persistência, detecção da preferência do sistema e anti-flash
- Tokens de marca separados para preservar contraste de texto branco no escuro
- Mapa de calor tornado sensível ao tema
- Monolito de ~2.500 linhas **reorganizado em estrutura de projeto** (CSS por camada e por tela, JS em `core` / `data` / `features`)
- Base de conhecimento da IA extraída para **CSV externo**, com fallback embutido
- **Suíte de testes de integração** adicionada
- Este README

### 9. Correções de responsividade no celular
- **Stepper do cadastro**: no celular a linha de progresso cortava os rótulos das etapas. Como o card abaixo já exibe o título da etapa, os rótulos foram ocultados e ficou só a régua de bolinhas 1-2-3-4
- **Tela da IA**: dica e botão ficavam lado a lado, espremendo o texto numa coluna estreita e jogando o botão para fora do card — agora empilham, com o botão ocupando a largura total
- **Alternador de tema**: o botão redondo empurrava as abas na topbar. No celular ele sai da barra e vira um item dentro do **menu do perfil, acima de "Sair"**, com rótulo textual que acompanha o tema atual
- **Tooltips das abas**: em telas de toque o `:hover` "grudava" e o tooltip ficava preso sobrepondo o conteúdo — desativados via `@media (hover:none)`, mantendo os `aria-label` para leitores de tela
- Breakpoint extra em **400px** para as 5 abas caberem em aparelhos estreitos

---

### 10. RBAC, privacidade e refinamentos

- **Controle de acesso por papel (RBAC)**: conta de gestor (ADMIN) e de colaborador (USER); o Painel gestor fica indisponível para USER, com a aba oculta e a navegação bloqueada
- **Perfil movido para o menu do avatar**, junto com a nova aba **Configurações**, acima do "Sair"
- **Configurações → Privacidade** com interruptor de disponibilidade de agenda, refletido no perfil, nos cards e no modal, com as mensagens explicativas ao passar o cursor
- **Tags por cor** unificadas: tecnologia em roxo, regra de negócio em magenta, em todas as telas
- **Projetos**: a descrição saiu do card e passou a aparecer só no modal de detalhe; todos os campos do cadastro viraram obrigatórios, com erro visual por campo e submit bloqueado
- **Painel gestor**: novo KPI de **projetos compartilhados** com contagem em tempo real, que sobe e desce conforme soluções são cadastradas ou removidas
- **NÓsVivo IA**: corrigido o loading que aparecia antes mesmo da busca (o atributo `hidden` estava sendo vencido pelo `display:flex` do componente); adicionado botão flutuante **Limpar busca**, que só existe quando há resultado, acompanha o scroll e some ao ser usado
- Domínio dos e-mails de demonstração passou a ser o do próprio site

---

## Limitações conhecidas

Transparência sobre o que é protótipo e o que seria necessário em produção:

- **Não há IA real.** O matching é determinístico e local — ver [NÓsVivo IA](#nósvivo-ia).
- **Não há backend.** Dados de pessoas e projetos são mock em arquivos JavaScript; a persistência é local ao navegador. Sair do dispositivo significa perder os dados.
- **Autenticação e RBAC são simulados.** As credenciais e os papéis estão no código-fonte e a checagem roda no navegador. Em produção isso seria SSO corporativo com autorização validada no servidor.
- **Upload de arquivos é simulado.** Os anexos aparecem na interface, mas nenhum arquivo é realmente enviado ou armazenado.
- **Os KPIs do Painel gestor são ilustrativos**, não calculados a partir dos dados reais da aplicação.

---

*Protótipo interno · NÓsVivo*
