# Changelog — MediVille Manager

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [1.10.0] - 2026-10-26
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)
- Alias da Release: [https://main.mediville-manager.pages.dev](https://main.mediville-manager.pages.dev)

### Versão 1.10.0 — Correção Direcional da Expansão do Terreno (Crescimento Exclusivo para Trás/Laterais sem Invadir a Rua), Vizinhança Urbana Rica em 2.5D/3D e Campanhas SUS
- **PARTE 1: Correção Definitiva da Expansão do Mapa (`src/systems/map-expansion-system.ts` & `src/systems/grid-system.ts`)**:
  - **Linha de Fachada Frontal Imutável (`FRONT_STREET_ANCHOR = 'south'`)**: A avenida frontal, calçadas, faixa de pedestres e baia do SAMU permanecem ancoradas de forma fixa, com garantia estrita de não invasão pelo hospital.
  - **Crescimento Exclusivo para Trás (Norte) e Laterais (Leste/Oeste)**: Ao expandir de $N \times N$ para $(N+4) \times (N+4)$, as salas já construídas são transladadas preservando intacta a fachada da recepção rente à calçada frontal. As novas células construíveis surgem exclusivamente atrás e aos lados.
  - **Placas de Expansão e Bloqueio de Invasão**: As placas interativas `➕ Expandir Terreno (+4x4)` surgem apenas na borda traseira (norte) e nas laterais. Removida qualquer alça do lado sul da rua. A função `isTileOverlappingStreet(col, row, gridSize)` impede qualquer sala fantasma ou colocação que sobreponha a rua.
- **PARTE 2: Vizinhança Urbana em 4 Lados em 2.5D/3D (`src/render/city-environment.ts` & `src/systems/urban-life-system.ts`)**:
  - **Lado Frontal (Sul)**: Avenida asfaltada dupla, calçadão, semáforo com temporizador e do outro lado da rua um quarteirão comercial completo: **Cafeteria / Bistrô 2.5D** com mesas e guarda-sóis coloridos, **Farmácia Popular Comunitária do SUS**, **Edifícios Residenciais/Comerciais** com janelas iluminadas ao entardecer, ponto de táxi com veículo amarelo e canteiros floridos.
  - **Lado Esquerdo (Oeste)**: **Estacionamento do Hospital SUS** com vagas demarcadas em branco (incluindo vagas prioritárias para idosos/PCD e médicos), guarita com cancela automática e 4 a 6 carros voxel.
  - **Lado Direito (Leste)**: **Jardim Terapêutico e Ciclovia** com pergolado de madeira, bancos de descanso, canteiros de flores, chafariz/fonte circular com água animada e ciclovia vermelha com bicicletário.
  - **Fundo do Terreno (Norte)**: **Parque Municipal Arborizado** com bosque de árvores voxel em vários tons de verde, pista de cooper e quiosque, que recua dinamicamente a cada nível de expansão da grade (`16x16`, `20x20`, `24x24`).
- **PARTE 3: Campanhas de Saúde Pública e Enquadramento em 3 Resoluções (`src/data/events.json` & `src/render/camera.ts`)**:
  - Inclusão das campanhas oficiais do SUS: *Mutirão de Combate à Dengue* (`dengue_taskforce`) e *Outubro Rosa & Novembro Azul* (`pink_october`), com bônus de repasse e reputação municipal para hospitais equipados com Laboratório, Consultório, Vacinação e Triagem.
  - Verificação e garantia de enquadramento do hospital e do bairro circundante nas 3 resoluções oficiais: Mobile (`375x667`), Tablet (`768x1024`) e Desktop (`1920x1080`).
- **PARTE 4: Testes Automatizados e Deploy Online**:
  - Nova suíte `tests/backward-expansion-and-urban-neighborhood.test.ts` cobrindo 8 cenários de expansão direcional, translação de salas, não invasão da rua frontal, dinâmica do bairro e enquadramento em 3 resoluções.
  - Suíte total: **204 testes unitários e de integração aprovados (100%) em 24 arquivos de teste**.
  - Pipeline de verificação `npm run verify` e release duplo no Cloudflare Pages para as branches `master` (produção) e `main`.

## [1.9.0] - 2026-10-26
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)
- Alias da Release: [https://main.mediville-manager.pages.dev](https://main.mediville-manager.pages.dev)

### Versão 1.9.0 — Skill Permanente de Release/Deploy Automático, Destravamento da Web, Expurgo de Cache PWA e Fechamento das Fases 5 e 6 do GDD
- **PARTE 1: Criação da Skill Permanente e Regra Global de Release (`.agent/`)**:
  - Nova Skill oficial [release-e-deploy-web](file:///.agent/skills/release-e-deploy-web/SKILL.md) obrigatória para toda atualização semântica ou encerramento de prompt.
  - Regra global integrada em [.agent/rules/mediville-core-rules.md](file:///.agent/rules/mediville-core-rules.md) estabelecendo o pipeline automático de sincronização e deploy web no Cloudflare Pages.
- **PARTE 2: Destravamento Definitivo da Web & Expurgo Agressivo de Cache PWA (`public/sw.js`)**:
  - Atualização do Service Worker para estratégia **Network-First** em requisições de páginas, scripts e estilos.
  - Expurgo automático de todos os caches legados (`mediville-cache-v*`) no evento `activate` com `self.skipWaiting()` e `self.clients.claim()`.
  - Configuração de cabeçalhos anti-cache em `public/_headers` (`Cache-Control: no-cache, no-store, must-revalidate`) para `/sw.js`, `/index.html` e `/manifest.webmanifest`.
- **PARTE 3: Script Automatizado de Sincronização (`scripts/sync-version.mjs`)**:
  - Script autônomo `npm run sync:version` executado antes de cada `build`, sincronizando o `package.json`, o `CACHE_NAME` de `public/sw.js`, o `dist/sw.js` e o `tauri.conf.json`.
  - Injeção em tempo de compilação da constante `__APP_VERSION__` via `vite.config.ts` e `src/vite-env.d.ts`, eliminando qualquer versão hardcoded na interface gráfica.
- **PARTE 4: Testes Automatizados e Deploy Online**:
  - Nova suíte `tests/release-and-version-sync.test.ts` validando a integridade da Skill, alinhamento dos manifestos, ausência de versões estáticas na UI e políticas de cache HTTP.
  - **196 testes unitários aprovados (100%) em 23 suítes**.
  - Deploy online executado com sucesso no Cloudflare Pages via Wrangler para a branch `main`.

## [1.8.0] - 2026-10-26
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.8.0 — Animações Médicas Procedurais nos Setores, Sistema de Cansaço e Sala de Descanso, Calibragem Oficial do balance.json, Clima Sazonal e Expansão para 6 Idiomas
- **PARTE 1: Animações Médicas Procedurais nos Setores & Clima Sazonal (`src/render/medical-animations.ts` & `src/render/weather-view.ts`)**:
  - **Vida Visual aos Setores em Atendimento (`WORKING` / `in_consultation`)**:
    - *Consultório e Triagem*: prancheta animada e micro-ícones flutuantes suaves (`🩺`, `📋`, `❤️`).
    - *Sala de Raio-X (`xray`)*: luz vermelha de advertência na porta, feixe de varredura azul-celeste luminoso (1,5s) e negatoscópio iluminado na parede.
    - *Laboratório (`laboratory`)*: centrífuga giratória na bancada e tubos de ensaio fluorescentes.
    - *Centro Cirúrgico (`surgery`), Trauma, Emergência e UTI*: cone de luz do foco cirúrgico de teto sobre a mesa de cirurgia e traçado acelerado de ECG no monitor multiparamétrico.
    - *Maternidade (`maternity`)*: partículas estelares azuis e cor-de-rosa em volta do berço com ícone celebratório `👶`.
    - *Vacinação (`vaccination`) e Curativo (`wound_care`)*: selos visuais procedurais `💉 Imunizado!` e `🩹 Curativo concluído!`.
  - **Clima Sazonal Sincronizado com Eventos (`weather-view.ts`)**:
    - *Chuva / Dengue / Inverno*: gotas de chuva diagonais suaves em `PIXI.Graphics` e poças reflexivas no asfalto externo.
    - *Onda de Calor / Verão*: atmosfera ensolarada dourada vibrante.
    - *Carnaval / Feriado*: bandeirolas festivas coloridas nos postes da avenida externa.
- **PARTE 2: Sistema de Energia/Cansaço da Equipe e Sala de Descanso (`src/systems/staff-fatigue-system.ts` & `src/ui/staff-modal.ts`)**:
  - **Barra de Energia por Profissional (`energy: 0 a 100%`)**: dedução contínua de 8% por consulta concluída (`lossPerPatient`).
  - **Impacto no Desempenho Clínico**:
    - `energy < 40%`: equipe cansada exibe ícone `💤` / `☕`, sofre penalidade de 25% na velocidade de atendimento e dispara conselho preventivo de gestão.
    - `energy < 35%`: roteamento automático para Sala de Descanso (`staff_room`), onde o funcionário descansa por 8s restaurando 100% de energia.
  - **Gestão na Interface de Equipe**: barra de progresso de energia verde/âmbar no modal `👥 Equipe` e botão interativo `"☕ Dar Pausa / Energizar Equipe (R$ 500)"`.
- **PARTE 3: Calibragem Matemática Estrita em `balance.json` e 4 Fórmulas Puras (`src/utils/formulas.ts`)**:
  - Eliminação de números mágicos: leitura integral dos parâmetros de `src/data/balance.json` (`dayDurationSec: 60`, `startingCash: 100000`, `baseIntervalSec: 15`, `baseTimeSec: 20`, `patienceSec: 90`, `skillReductionPerLevel: 0.05`).
  - Implementação das 4 fórmulas oficiais do GDD com funções puras e determinísticas:
    - $T_{atend} = T_{base} \times (1 - 0.05 \times (H - 1))$
    - $S = \text{clamp}(100 - 20 \times \frac{T_{espera}}{T_{paciencia}} - 15 \times N_{erros}, 0, 100)$
    - $R_{dia+1} = \text{clamp}(R_{dia} + 0.1 \times (S_{media} - R_{dia}), 0, 100)$
    - $\lambda = \lambda_{base} \times (1 + 0.1 \times N_{setores})$
- **PARTE 4: Internacionalização Completa para os 6 Idiomas do GDD (`src/i18n/`)**:
  - Suporte completo a **6 idiomas**: Português (`pt`), Espanhol (`es`), Inglês (`en`), Francês (`fr`), Alemão (`de`) e Chinês Simplificado (`zh`).
  - **Paridade Absoluta de 100%**: 149 chaves idênticas em todos os 6 arquivos JSON.
  - Glossário com explicação das siglas brasileiras (`SUS`, `UBS`, `UPA`) adaptado para cada idioma.
  - Aplicação automática da pilha de fontes de sistema para Chinês (`system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif`).
  - Seletores ergonômicos com botões `🇫🇷 FR`, `🇩🇪 DE` e `🇨🇳 中文` com `truncate` e `min-w-0` na Tela Inicial e Configurações.
- **PARTE 5: Testes Automatizados (Vitest) e Orçamento de Desempenho**:
  - Nova suíte `tests/fatigue-weather-balance-and-6langs.test.ts` com 18 testes automatizados.
  - **100% dos testes aprovados** (188 testes em 22 suítes).
  - Pacote final compilado em **1.43 MB**, mantendo a alta velocidade de carregamento muito abaixo do teto de 5.00 MB.

## [1.7.0] - 2026-10-26
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.7.0 — Overhaul Estético Premium & Refatoração de Interface Baseada nas 20 Leis de UI/UX
- **PARTE 1: Design System Visual, Cores Semânticas e Micro-Interações (< 100ms)**:
  - **Limiar de Doherty (< 100ms)**: botões, abas e cartões com classe `.btn-interactive` e respostas imediatas (`transition-all duration-100 active:scale-95 hover:brightness-105`).
  - **Navalha de Occam & Carga Cognitiva**: eliminação de bordas pesadas e sombras excessivas em favor de superfícies *Glassmorphism* limpas (`bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md rounded-2xl`).
  - **Paleta Semântica Unificada**:
    - Azul Institucional SUS (`#0284C7` / `sky-600`) para serviços clínicos, fichas e especialidades.
    - Verde Esmeralda (`#059669` / `emerald-600`) para receitas, confirmações de obra, estoque disponível e alta médica.
    - Âmbar Atenção (`#D97706` / `amber-600`) para desabastecimento, filas e alertas.
    - Vermelho Coral (`#E11D48` / `rose-600`) para emergências, demolição e erros.
  - **Conectividade Uniforme & Proximidade na Top Bar**:
    - Cápsula Esquerda: `💰 Caixa` + `⭐ Reputação` + `💊 Estoque RENAME`.
    - Cápsula Central: `🏥 Porte da Unidade (UBS/UPA/Hospital)` com `Barra de Progresso do Próximo Nível` (Zeigarnik + Gradiente de Meta).
    - Cápsula Direita: `📅 Dia + Turno (☀️ Manhã / 🌤️ Tarde / 🌙 Noite)` + Controles de velocidade conectados `⏸ | 1x | 2x | 3x` + Ações rápidas `📐 +Mapa`, `🎵`, `🔊` e `▾ Detalhes`.
- **PARTE 2: Arquitetura de Decisão e Ergonomia Tátil (Hick, Miller, Fitts, Posição Serial e Von Restorff)**:
  - **Lei de Hick & Lei de Miller na Gaveta `🏗️ Obras`**: 4 pílulas de filtro rápido (`🏥 Base`, `🩺 Clínico`, `🔬 Exames & Leitos`, `🚨 Alta Complexidade`, mais `"Todas"`), agrupando as 20 salas em 3 a 7 opções confortáveis ($7 \pm 2$).
  - **Lei de Postel (Tolerância de Entrada)**: busca inteligente na Enciclopédia via `normalizeText`, tolerante a maiúsculas, minúsculas e acentuação diacrítica.
  - **Efeito de Posição Serial no Dock Inferior**: ações mais frequentes posicionadas nas extremidades:
    - Início (Esquerda): `🏗️ Obras` e `🩺 Atender (N)`.
    - Meio: `👥 Equipe`, `💊 Farmácia`, `📖 Enciclopédia`.
    - Fim (Direita): `💰 Finanças` e `🎯 Centralizar`.
  - **Efeito Von Restorff (Destaque por Isolamento)**: quando há pacientes aguardando conduta (`N > 0`), o botão `🩺 Atender (N)` ganha anel pulsante esmeralda brilhante (`ring-2 ring-emerald-500 animate-pulse bg-emerald-50 border-emerald-400`).
- **PARTE 3: Psicologia de Engajamento, Prevenção de Erros e Estética 3D/2.5D**:
  - **Efeito Zeigarnik & Gradiente de Meta (`progression-bar.ts`)**: evolução contínua da unidade hospitalar e dos protocolos dominados; quando o progresso atinge $\ge 75\%$, a barra ativa um gradiente dourado/esmeralda com brilho animado (`animate-pulse`).
  - **Regra do Pico-Fim (Peak-End Rule)**:
    - *No Pico*: ao dominar novo protocolo ou subir de nível hospitalar, acorde triunfante suave e selo de conquista elegante no canto direito.
    - *No Fim do Turno Diário*: Resumo Rápido de Fim de Dia compacto no canto superior direito (`NotificationCenter.pushDailySummary`) exibindo pacientes salvos, caixa, bônus de metas e reputação, com fechamento automático em 5s ou 1 clique.
  - **Lei de Tesler**: no modal de Caso Clínico (`DecisionModal`) e na Farmácia, destaque visual claro se o medicamento está disponível (`✅ Em estoque: X un`) ou em falta (`⚠️ Sem estoque — Comprar 1 lote agora`), permitindo adquirir o lote em 1 clique sem sair do atendimento.
  - **Lei de Murphy**: tentativa de posicionar sala em local inválido dispara animação de *shake* suave de 200ms (`animate-shake`) com mensagem de orientação, sem cancelar a pré-visualização.
  - **Upgrade Estético 2.5D/3D (`room-renderer-3d.ts`)**: sombreamento em dupla camada de oclusão de contato (*ambient occlusion*) sob fundações, móveis e paredes.
- **PARTE 4: Testes Automatizados (Vitest) e Orçamento Técnico**:
  - Nova suíte `tests/ux-20-laws-and-aesthetics.test.ts` cobrindo as 20 leis de UI/UX, filtros de Hick/Miller, busca tolerante de Postel, limiares de gradiente de meta ($\ge 75\%$) e dimensões ergonômicas táteis ($\ge 44\text{px}$ e $\ge 48\text{px}$).
  - 100% dos 170 testes unitários aprovados em 21 arquivos.
  - Pacote final compilado em **1.42 MB**, muito abaixo do orçamento máximo de 5.00 MB.

## [1.6.0] - 2026-10-26
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.6.0 — Mobilidade Touchscreen de Obras (Tap-to-Move), Expansão Direta no Mapa, Vida Urbana com Cidadãos NPCs, Pop-ups de Emergência no Canto Direito, Polimento Gráfico Interno/Externo e Correção da Linha nos NPCs
- **PARTE 1: Correção Definitiva da Linha nos NPCs (`Character3D`, `renderer.ts`)**:
  - Eliminação de conexões diagonais espúrias atravessando os avatares no PixiJS v8 causadas por subcaminhos abertos e `.stroke()` compartilhado.
  - Substituição de 100% dos detalhes lineares (estetoscópio, cruz de enfermagem, boca, sobrancelhas, divisórias de jaleco, crachá, sapatos e bengala) por formas preenchidas com `.fill()` (`roundRect`, `circle` e `ellipse`).
  - Renderização limpa de todos os personagens nos estados `IDLE`, `WALKING` e `WORKING` sem artefatos gráficos.
- **PARTE 2: Mobilidade Total de Obras em Touchscreen (`build-controller.ts`, `room-context-menu.ts` & `ghost-view.ts`)**:
  - **Tap-to-Move Instantâneo**: tocar em qualquer bloco da grade durante a pré-visualização teleporta a sala fantasma para as coordenadas selecionadas sem exigir arraste manual por toda a tela.
  - **Trava da Câmera (`panLocked = true`)**: ao iniciar o arraste sobre a sala fantasma no modo `ACTIVE_PLACEMENT`, o arraste da câmera é bloqueado para mover apenas a sala.
  - **Menu Contextual de Sala Existente (`RoomContextMenu`)**: tocar em uma sala construída (quando não há atendimento clínico pendente) abre um menu flutuante ergonômico sobre a sala com 3 botões táteis diretos:
    - `✋ Mover Sala` (destaca a sala no modo `ACTIVE_PLACEMENT` permitindo reposicioná-la de graça).
    - `🔄 Girar 90°` (rotaciona a sala no próprio eixo se houver espaço).
    - `🗑️ Demolir (+50%)` (reembolso imediato de metade do valor investido).
- **PARTE 3: Expansão do Mapa Direta nas Bordas 3D (`map-expansion-handles.ts` & `hud.ts`)**:
  - Placas e faixas tracejadas de loteamento nas 4 bordas do terreno com gatilhos táteis interativos no PixiJS: **`➕ Expandir Terreno (+4x4) — R$ 45k`**.
  - Confirmação direta de 1 clique com expansão imediata da laje, recuo automático das ruas/árvores e recentralização suave da câmera.
  - Botão fixo **`📐 +Mapa`** na Top Bar e na gaveta `🏗️ Obras` para acesso rápido.
- **PARTE 4: Pilha de Notificações e Emergências no Canto Direito (`notification-center.ts`)**:
  - **Zero Pop-ups Bloqueando o Centro**: eventos de emergência, conquistas e alertas agora empilham ordenadamente no canto superior direito (`fixed top-14 right-3 z-40 w-72 sm:w-80 pointer-events-none`).
  - **Fechamento Ágil**: cada cartão possui botão `✕` amplo ($\ge 44\times 44\text{px}$) e suporte a arrastar/deslizar com o dedo para a direita (`Swipe-to-Dismiss`).
  - **Auto-Minimização de Emergência**: o banner de emergência recolhe automaticamente após 4 segundos em um selo circular pulsante `🚨 00:32s` no canto direito, liberando 100% da área útil do hospital.
  - Botão `"Limpar Tudo"` quando houver mais de 2 avisos acumulados.
- **PARTE 5: Dimensionamento Perfeito de Abas e Modais (`build-menu.ts`, `hud.ts`)**:
  - Cartões de salas na gaveta de obras com dimensões padronizadas e uniformes (`w-24 sm:w-28 h-24 shrink-0`).
  - Botão `📐 Expandir Terreno` fixado à esquerda do carrossel, seguido pelos botões de navegação horizontal `◀` e `▶`.
  - Abas e botões táteis elásticos e responsivos para telas de `360px` até `1920px`.
- **PARTE 6: Vida Urbana com Cidadãos NPCs e Qualidade Gráfica (`urban-life-system.ts`, `urban-life-view.ts`)**:
  - **10 a 18 Cidadãos Ambientais**: pedestres caminhando pelas calçadas externas, corredores (*joggers*) esportivos na borda do parque, passeadores com cães Voxel, passageiros aguardando no ponto de ônibus e quiosque de café com clientes.
  - **Interações na Praça**: NPCs sentados nos bancos conversando com balões animados (`💬`, `🎵`, `☕`).
  - **Semáforo Funcional**: alternância determinística de luzes (verde, amarelo e vermelho) na faixa de pedestres sincronizada com o tráfego urbano.
  - **Ambiente Rico e Vivo**: árvores com folhagem oscilante pelo vento (`Math.sin`), fonte decorativa de água com ondas pulsantes na praça de entrada, e interiores hospitalares com pisos brilhantes e rodapés sombreados.
- **PARTE 7: Testes Automatizados e Orçamento do GDD**:
  - Nova suíte `tests/touch-mobility-urban-life-and-toasts.test.ts` cobrindo Tap-to-Move, expansão de mapa, ciclo de vida dos cidadãos, notificações e ausência de linhas nos NPCs.
  - 100% dos 157 testes unitários aprovados em 20 arquivos.
  - Pacote final otimizado em **1.40 MB**, respeitando com folga o limite de 5.00 MB.

## [1.5.0] - 2026-10-26
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.5.0 — Construção Tátil de Precisão ("Tap, Nudge & Confirm"), Expansão Paga do Mapa (12x12 até 24x24), Internacionalização Global Reativa, Autoplay Unlock da Música e +100 Doenças SUS (250 Casos Clínicos)
- **PARTE 1: Construção Ergonômica Mobile/Tablet — Modo "Tap, Nudge & Confirm" (`build-controller.ts`, `ghost-view.ts` & `canvas-input.ts`)**:
  - Fluxo de duas etapas `BUILD_PREVIEW`: ao selecionar uma sala ou acionar a ferramenta mover, a gaveta `🏗️ Obras` é recolhida para liberar 100% de visão da grade sem colocar a sala por acidente ao soltar o dedo.
  - Pré-visualização com sala fantasma (`GhostView`): contorno em **Verde Esmeralda** (`#10b981`) para posições válidas ou **Vermelho** (`#ef4444`) para colisões/limites do mapa, com destaque da grade de 1 bloco ao redor.
  - Offset visual tátil: arraste com o dedo no mapa aplica deslocamento de `-40px` no eixo Y em dispositivos touch para não obstruir a visão da sala que está sendo posicionada.
  - Barra Flutuante de Precisão (`Build Confirm Bar`): container fixo na base com botões ergonômicos ($\ge 48\times 48\text{px}$):
    - D-Pad de Ajuste Fino bloco a bloco (`⬅️`, `⬆️`, `⬇️`, `➡️`).
    - Botão `🔄 Girar (90°)` com revalidação imediata de colisões.
    - Botão `✅ Construir (R$ X)` habilitado apenas com saldo suficiente e sem colisão.
    - Botão `❌ Cancelar` sem débito financeiro.
    - Suporte a PC e atalhos de teclado: `WASD`/Setas para deslocar, `R` para girar, `Enter` para confirmar e `Esc` para cancelar.
- **PARTE 2: Expansão Paga do Mapa Dinâmico (`12x12` ➔ `16x16` ➔ `20x20` ➔ `24x24`) (`map-expansion-system.ts`, `grid-system.ts` & `renderer.ts`)**:
  - Substituição da grade estática `12x12` por sistema progressivo de 4 patamares de expansão:
    - *Nível 1 (Inicial)*: Grade `12x12` (144 blocos).
    - *Nível 2 (Terreno Ampliado)*: Grade `16x16` (256 blocos) — Custo: `R$ 45.000`.
    - *Nível 3 (Quadra Hospitalar)*: Grade `20x20` (400 blocos) — Custo: `R$ 95.000`.
    - *Nível 4 (Complexo Metropolitano)*: Grade `24x24` (576 blocos) — Custo: `R$ 180.000`.
  - Botão de destaque `📐 Expandir Mapa (+4x4 — R$ X)` integrado na gaveta `🏗️ Obras` e na aba de Finanças.
  - Disparo de `map:expanded` no `EventBus`: preservação das coordenadas de todas as salas existentes e NPCs, redimensionamento imediato das camadas do PixiJS (`GridView`, `Camera`, `HospitalRenderer`), ajuste suave de zoom (`fitMapToScreen`) e persistência no `IndexedDB` e `localStorage`.
- **PARTE 3: Internacionalização Global Reativa Completa (`i18n.ts`, `pt.json`, `es.json`, `en.json`)**:
  - Função central reativa `t(key, vars)` com interpolação de variáveis dinâmicas.
  - Atualização do idioma raiz `document.documentElement.lang = lang` e método global `refreshAppLanguage()` para sincronizar instantaneamente todos os componentes de UI (`TitleScreen`, `TopBar`, `BottomDock`, `BuildDrawer`, `DecisionModal`, `StaffModal`, `PharmacyModal`, `FinancesModal`, `EncyclopediaModal`, `SettingsModal`, `GameOverModal`, `EventBanner`, `TutorialView`).
  - Tradução dos nomes de salas, cargos, termos da grade, eventos dinâmicos e novos setores nos dicionários em Português, Espanhol e Inglês.
- **PARTE 4: Correção Definitiva da Música de Fundo e Autoplay Unlock (`music-system.ts` & `hud.ts`)**:
  - Sistema `setupAutoplayUnlock()` com desbloqueio global de `AudioContext` no primeiro toque ou clique (`['pointerdown', 'touchstart', 'keydown', 'click']`).
  - Calibração de ganho audível agradável (`DEFAULT_GAIN = 0.18`) com envoltória ADSR suave estilo piano elétrico Rhodes e melodia pentatônica contínua.
  - Botão `🎵` na Top Bar com indicador verde ativo/mudo e toast de status `"🎵 Música Ambiente: Ativada / Desativada"`.
- **PARTE 5: Expansão para 250 Doenças Reais na Enciclopédia SUS (`cases.json` & `clinical-cases.json`)**:
  - Adição de 100 novas patologias clínicas reais do SUS/APS/UPA/Hospital (casos 151 a 250), totalizando exatamente **250 casos clínicos únicos**:
    - *Cardiologia, Vascular e Hematologia (151–165)*: Endocardite Infecciosa Subaguda, Dissecção Aguda de Aorta, DAOP, Úlcera Varicosa, Tromboflebite, BAVT, TV Sustentada, Cor Pulmonale, Miocardite Viral, Estenose Aórtica, Anemia Falciforme, Anemia Megaloblástica, PTI, Leucemia Aguda e Neutropenia Febril.
    - *Pneumologia, Alergia e Otorrinolaringologia (166–180)*: Bronquiectasia, Abscesso Pulmonar, Derrame Pleural TB, Rinite Alérgica, Laringite Viral, Abscesso Periamigdaliano, Mastoidite, Labirintite, Doença de Ménière, Perfuração Timpânica, Corpo Estranho Nasal, SAOS, Silicose, APLV e Angioedema por IECA.
    - *Gastroenterologia, Hepatologia e Cirurgia Geral (181–195)*: Megaesôfago Chagásico, Esofagite Erosiva, Mallory-Weiss, Hepatite B, Hepatite C, Cirrose com Ascite, PBE, Colangite Aguda, Obstrução por Bridas, Hérnia Encarcerada, Hérnia Umbilical Infantil, Doença de Crohn, Retocolite Ulcerativa, Abscesso Anorretal e Doença Celíaca.
    - *Nefrologia, Urologia e Endocrinologia (196–210)*: Pielonefrite Aguda, GNDA, Síndrome Nefrótica, Injúria Renal Aguda, DRC Estágio 4, HPB, Prostatite, Orquiepididimite, Torção Testicular, Bexigoma, EHH, De Quervain, Tempestade Tireoidiana, Hiperparatireoidismo e SOP.
    - *Neurologia, Psiquiatria e Geriatria (211–225)*: AIT, HSA, Guillain-Barré, Miastenia Gravis, Parkinson, Alzheimer, Delirium no Idoso, Esclerose Múltipla, HPN, TAG, TOC, Esquizofrenia, Intoxicação por Benzodiazepínicos, Intoxicação por Opioides e Intoxicação por Organofosforados.
    - *Reumatologia, Ortopedia, Trauma e Emergências (226–240)*: LES, Espondilite Anquilosante, Fibromialgia, Osteoartrite, Osteoporose, Artrite Séptica, Osteomielite, Luxação de Ombro, Fratura de Fêmur no Idoso, Síndrome Compartimental, Tamponamento Cardíaco, Hemotórax Maciço, Afogamento Grau 3, Acidente por Loxosceles e Acidente por Cascavel.
    - *Ginecologia, Obstetrícia, Pediatria e Especialidades (241–250)*: Placenta Prévia Sangrante, DPP, Atonia Uterina com Ocitocina, Icterícia Neonatal, Estenose Hipertrófica de Piloro, Intussuscepção, Psoríase Vulgar, Acne Grau 3, Úlcera de Córnea e Uveíte Anterior.
  - Integração aos novos marcos de auto-resolução de condutas SUS (`milestone_protocols_250`) e categorias completas na Enciclopédia.
- **PARTE 6: Verificação Completa e Testes Automatizados**:
  - Nova suíte `tests/mobile-build-expansion-i18n-250cases.test.ts` cobrindo preview, D-Pad, rotação, expansão progressiva, i18n e catálogo clínico.
  - **149 testes automatizados aprovados (100% de sucesso em 19 arquivos)**.
  - Tamanho final do pacote: **1.38 MB total**, com carregamento inicial ultraleve e estritamente abaixo do orçamento de 5.00 MB.

## [1.4.0] - 2026-10-25
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.4.0 — Nomes Simples na Aba Obras, Troca de Idioma Reativa Instantânea, Personagens 3D em Cenário 2.5D, Riqueza Gráfica, Música Bossa-Lounge Suave e Conformidade Multiplataforma
- **PARTE 1: Nomes Simples (1 Palavra) na Aba Obras & Ergonomia do Menu (`rooms.json`, `build-menu.ts` & `room-renderer-3d.ts`)**:
  - Padronização do campo `shortName` em todas as 20 salas do catálogo hospitalar (`Recepção`, `Espera`, `Triagem`, `Consultório`, `Farmácia`, `Leitos`, `Vacina`, `Curativo`, `Odonto`, `Medicação`, `Emergência`, `Lab`, `Raio-X`, `Cirurgia`, `UTI`, `Maternidade`, `Trauma`, `Sangue`, `Descanso`, `Heliponto`), com limite rígido de até 12 caracteres.
  - Redesenho ergonômico dos cartões da gaveta `🏗️ Obras`: ícone grande, nome simples de 1 palavra (`font-semibold text-sm truncate`), preço curto (`R$ 5k`) e dimensões (`2x2`), deixando o nome formal completo e detalhes apenas no tooltip (`title`).
  - Etiquetas sobre as salas no mapa 2.5D padronizadas com os nomes curtos e sincronizadas com a internacionalização ativa.
- **PARTE 2: Troca de Idioma 100% Reativa e Instantânea em Tempo Real (`i18n.ts`, `*.json`)**:
  - Implementação de `setLanguage(lang: 'pt' | 'es' | 'en' | 'fr' | 'de' | 'zh')` com carregamento sob demanda, persistência no `localStorage` (`mediville_lang`), atualização direta de atributos DOM `[data-i18n]` e emissão desacoplada de `eventBus.emit('i18n:changed', { lang })`.
  - Assinatura reativa imediata sem recarregar a página em `TitleScreen`, `HospitalHUD`, `BuildMenu`, `DecisionModal`, `SettingsModal` e `RoomRenderer3D` (invalidação instantânea de cache de etiquetas das salas).
  - Tradução dos nomes curtos das 20 salas, alertas do conselheiro e casos clínicos nos 6 idiomas suportados (PT, ES, EN, FR, DE, ZH).
- **PARTE 3: Personagens 3D em Ambiente 2.5D & Detalhes Gráficos das Salas (`character-3d.ts`, `furniture-factory.ts` & `room-renderer-3d.ts`)**:
  - Criação do componente procedural `Character3D`: avatares com volume 3D arredondado e sombreamento suave em múltiplas faces (cápsulas e cilindros 3D, destaques especulares e oclusão ambiental entre cabeça e tronco).
  - Cabeça 3D esférica/arredondada: olhos expressivos com catchlight (brilho branco na pupila), sobrancelhas animadas e máscara cirúrgica automática em salas estéreis (Cirurgia e UTI).
  - Vestimentas e acessórios específicos dos 7 cargos de saúde:
    - *Médico*: Jaleco branco aberto com gola 3D, estetoscópio metálico no pescoço e prancheta/tablet digital durante atendimento.
    - *Enfermeiro e Técnico*: Scrubs com sombreamento 3D, crachá pendurado e bandeja/termômetro.
    - *Farmacêutico*: Jaleco com bolso e caixa de medicamento 3D ao dispensar.
    - *Recepcionista e Gestor*: Traje executivo social com gravata.
    - *Zeladoria*: Uniforme de limpeza com carrinho e mop animado.
    - *Pacientes*: Variação de estatura (crianças, adultos, idosos com bengala) e postura cansada em casos de urgência/emergência.
  - Refinamentos gráficos nas salas:
    - Oclusão ambiental (AO) suave no encontro das paredes e sob os móveis.
    - Monitores cardíacos com linha de ECG verde pulsante animada em Consultórios, Emergência, UTI e Cirurgia.
    - Divisórias de vidro clínico com faixas diagonais translúcidas.
    - Suportes de soro cromados com bolsas de solução fisiológica nos leitos e halo luminoso suave de foco cirúrgico sobre a mesa cirúrgica.
- **PARTE 4: Música Suave de Fundo — Estilo Hospital / Elevador Bossa-Lounge (`music-system.ts`)**:
  - Sintetizador Web Audio API procedural (sem MP3s externos, zero peso adicional):
    - Timbre aveludado de piano elétrico Rhodes (ondas senoidais/triangulares com LPF em 900 Hz) em ~72 BPM com progressão acolhedora (`Fmaj7` ➔ `Em7` ➔ `Dm9` ➔ `G13` ➔ `Cmaj9` ➔ `Am7`).
    - Contrabaixo acústico suave e ritmo sutil de vassourinha/chocalho.
    - Volume suave padrão calibrado (`gain: 0.08`), controle de volume de 0% a 100% no modal de Configurações e botão `🎵` de Música On/Off na Top Bar ao lado de `🔊`.
    - *Audio Ducking* automático: redução de 50% no volume da música sempre que a ficha de um caso clínico (`DecisionModal`) estiver aberta.
- **PARTE 5: Segurança, Privacidade LGPD/GDPR e Multiplataforma (`_headers`, `legal-modal.ts`, `tauri.conf.json` & `capacitor.config.ts`)**:
  - Cabeçalhos de segurança HTTP em `public/_headers` (Content-Security-Policy, HSTS, X-Content-Type-Options: nosniff, Referrer-Policy e Permissions-Policy).
  - Modal oficial `LegalModal` com Política de Privacidade e Termos de Uso em PT, ES e EN, com aviso institucional educativo do SUS/MS, acessível na Tela Inicial e nas Configurações.
  - Arquivos de configuração base para desktop (`tauri.conf.json`) e mobile nativo (`capacitor.config.ts`) apontando para `dist/`.
- **PARTE 6: Testes Automatizados (Vitest) e Verificação**:
  - Nova suíte `tests/i18n-3d-music-and-shortnames.test.ts` com 14 testes cobrindo shortNames, i18n reativo, MusicSystem, Character3D e segurança.
  - **138 testes automatizados aprovados (100% de sucesso em 18 arquivos)**.
  - Novo teto de orçamento técnico de 5.00 MB em `check-bundle-size.mjs` (tamanho final gerado: **1.18 MB total**, com carregamento inicial super leve).

## [1.3.0] - 2026-10-25
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.3.0 — Rolagem Horizontal Fluida no Navegador, Alerta Pré-Derrota & Game Over, Ranking Global (Cloudflare D1), i18n On-Demand (PT/ES/EN) e Páginas Estáticas de SEO
- **PARTE 1: Ergonomia de Rolagem Horizontal no Navegador (`horizontal-scroll.ts`)**:
  - Utilitário universal `enableHorizontalScroll` aplicado à gaveta `🏗️ Obras` e às abas de categoria da `Enciclopédia`.
  - Conversão do giro vertical da rodinha do mouse (`wheel`) em rolagem horizontal suave (`scrollLeft += deltaY * 1.2`) com `preventDefault()` e `stopPropagation()`, impedindo zoom indesejado no mapa 3D PixiJS ao fundo.
  - Navegação suave por teclado com `ArrowLeft` e `ArrowRight` (`scrollBy({ left: ±240, behavior: 'smooth' })`).
  - Botões flutuantes laterais discretos `◀` e `▶` ($\ge 44\times 44\text{px}$) com auto-ocultação nas extremidades da lista.
  - Arraste com ponteiro (`Grab & Drag`) via `pointerdown`/`pointermove` com estilos `cursor-grab` e `active:cursor-grabbing`, diferenciando arraste de clique para evitar seleções acidentais de salas.
- **PARTE 2: Sistema de Alerta Pré-Derrota, Marcos e Tela de Fim de Jogo (`defeat-system.ts` & `game-over-modal.ts`)**:
  - Monitoramento contínuo de caixa negativo e reputação crítica (&lt; 10) rumo a 7 dias consecutivos.
  - Alerta crítico preventivo aos 5 e 6 dias com contagem regressiva e oferta das 3 saídas oficiais do GDD:
    1. `🏛️ Solicitar Repasse de Emergência` (+R$ 15.000 do Ministério da Saúde com reset imediato do contador de falência).
    2. `🏚️ Vender/Demolir Sala Ociosa (+50% reembolso imediato)`.
    3. `👥 Ajustar Folha Salarial (Abrir modal de Equipe)`.
  - Rastreamento de marcos históricos da partida (*Porte de hospital*, *100 / 500 / 1.000 pacientes atendidos*, *50 / 100 / 150 protocolos dominados*).
  - Transição para máquina de estados `GAME_OVER` no 7º dia com `GameOverModal` exibindo resumo estatístico, pontuação calculada, submissão ao Leaderboard e reinício rápido.
- **PARTE 3: Ranking Global Cloudflare D1 e Privacidade LGPD (`ranking-service.ts`, `nickname-filter.ts` & `server/`)**:
  - Validador de apelidos públicos (3 a 16 caracteres, alfanumérico) bloqueando termos ofensivos, e-mails, CPFs e telefones.
  - Proteção de menores de 13 anos e Modo Convidado: desativação automática de chamadas de rede no envio de pontuações, mantendo os dados salvos exclusivamente no aparelho.
  - Esquema SQL Cloudflare D1 (`server/schema.sql`) e Worker Cloudflare (`server/worker.ts`) com endpoints `/api/leaderboard` e CORS configurado.
  - Fallback gracioso offline com pontuações salvas e lidas do `localStorage` quando sem conexão com a internet.
  - Opções de conformidade LGPD/GDPR no modal de Configurações: `📥 Exportar Meus Dados (JSON)` e `🗑️ Excluir Conta e Dados`.
- **PARTE 4: Internacionalização Sob Demanda PT / ES / EN (`i18n.ts`, `pt.json`, `es.json`, `en.json`)**:
  - Carregador dinâmico assíncrono sob demanda com divisão de código (code-splitting): apenas o JSON do idioma ativo é carregado na memória (&lt; 4 KB cada).
  - Paridade rigorosa de 100% das chaves traduzidas entre os 3 idiomas com terminologia médica e institucional oficial.
  - Seletor de idioma reativo na Tela Inicial (PT 🇧🇷 / ES 🇪🇸 / EN 🇺🇸) e nas Configurações.
- **PARTE 5: Estrutura HTML Estática e SEO Técnico para Motores de Busca**:
  - 12 páginas HTML estáticas multilíngues (`/pt/`, `/es/`, `/en/`) para `index.html`, `catalogo-de-salas.html`, `guia-de-doencas.html` e `como-jogar.html`.
  - Checklist estrito de SEO: `<h1>` único, `<title>` $\le 60$ caracteres, `<meta description>` $\le 155$ caracteres, `canonical`, `hreflang` e Open Graph.
  - Aviso médico visível em destaque nas páginas clínicas: *"Conteúdo meramente educativo, não substitui orientação médica"*.
  - JSON-LD Schema.org estruturado (`VideoGame`, `WebApplication`, `MedicalWebPage`, `FAQPage`).
  - Arquivos `robots.txt` e `sitemap.xml` canônicos na raiz pública.
- **PARTE 6: Testes Automatizados (Vitest) e Orçamento de Peso**:
  - Nova suíte `tests/scroll-i18n-seo-and-ranking.test.ts` com 16 testes unitários e de integração.
  - **124 testes automatizados aprovados (100% de sucesso em 17 arquivos)**.
  - Bundle final: **1.15 MB total** (&lt; 2.00 MB).

## [1.2.0] - 2026-10-25
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.2.0 — Economia Mista Diferenciada, 7 Cargos de Equipa, Setores de Alta Complexidade (Heliponto SAMU) e Persistência Dupla em IndexedDB
- **Economia Mista Diferenciada por Tipo de Unidade (`economy-system.ts` & `finances-modal.ts`)**:
  - **Clínica Particular (`private_clinic`)**: Sem repasse público fixo PAB. Receita gerada exclusivamente via pacientes particulares e convênios médicos. Controle de precificação de consulta (R$ 1.800 a R$ 6.000) no modal de Finanças, com variação dinâmica da demanda (+25% de chegada com preços baixos ou penalidade de chegada se o preço for alto e a reputação < 75). Contratação de até 3 planos de convênio (*Convênio Popular*, *Convênio Empresarial*, *Convênio Premium*) com volume diário fixo garantido.
  - **UBS e UPA (`ubs` / `upa`)**: Financiamento 100% público com repasse diário fixo do PAB/MAC (R$ 3.500/dia), procedimentos BPA/SIGTAP e negociação tripartite governamental a cada 30 dias.
  - **Hospital Geral (`hospital`)**: Economia mista tripartite combinando faturamentos SUS (BPA/AIH), pacientes particulares e contratos de convênios médicos.
- **Expansão para 7 Categorias Oficiais de Equipa (`staff.json`, `staff-system.ts` & `voxel-character.ts`)**:
  - 1. **Médico (`doctor`)**: Consultórios, emergência, centro cirúrgico e UTI.
  - 2. **Enfermeiro (`nurse`)**: Triagem de Manchester, supervisão de observação e encaminhamentos.
  - 3. **Técnico de Enfermagem (`tech`) — NOVO**: Uniforme azul-celeste claro em voxel; atua em setores de apoio (Vacina, Curativo, Medicação e Observação), acelerando em 20% a vazão de atendimento.
  - 4. **Farmacêutico (`pharmacist`)**: Dispensação RENAME e controle de estoque de lotes.
  - 5. **Recepcionista (`receptionist`)**: Acolhimento inicial e organização de senhas.
  - 6. **Zeladoria / Limpeza (`janitor`) — NOVO**: Uniforme cinza/verde com vassoura/mop procedural; mantém o índice de Biossegurança e Higiene Hospitalar (0 a 100%), garantindo bônus de +10 na satisfação de todos os pacientes quando o índice está acima de 80%.
  - 7. **Gestor Hospitalar (`manager`) — NOVO**: Traje executivo com gravata vermelha; reduz em 10% por estrela de habilidade o custo de manutenção predial diária e concede +15% de chance de sucesso nas negociações governamentais de repasse.
- **Setores Finais da Progressão Hospitalar & Heliponto SAMU (`rooms.json`, `room-layout.ts` & `furniture-factory.ts`)**:
  - **Sala de Curativo (`wound_care`) — Nível UBS**: Maca de procedimentos, carrinho de curativos em inox e foco clínico.
  - **Consultório Odontológico (`dental`) — Nível UBS**: Cadeira odontológica reclinável turquesa, refletor de teto articulado e cuspideira com pia em louça.
  - **Sala de Medicação / Reidratação (`medication_room`) — Nível UPA**: Poltronas de hidratação reclináveis com suporte suspenso de soro fisiológico e bancada de preparo.
  - **Sala de Emergência / Sala Vermelha (`emergency_room`) — Nível UPA**: Maca de trauma, carro de parada com desfibrilador e monitores cardíacos.
  - **Maternidade (`maternity`) — Nível Hospital**: Leito obstétrico acolchoado, berço aquecido neonatal em acrílico translúcido e monitor fetal com cardiotocografia.
  - **Centro de Trauma (`trauma_center`) — Nível Hospital**: Maca pesada de trauma com cintas, foco duplo cirúrgico e carrinho de anestesia.
  - **Banco de Sangue (`blood_bank`) — Nível Hospital**: Geladeiras de hemocomponentes com temperatura controlada, centrífuga de bolsas e poltrona de transfusão.
  - **Heliponto SAMU 192 (`helipad`) — Nível Hospital**: Plataforma 4x4 demarcada com "H" hospitalar e luzes de balizamento noturno piscantes. Durante emergências ou periodicamente, um **Helicóptero Aeromédico Voxel 3D com rotor animado** pousa trazendo pacientes críticos com recompensa dobrada (+R$ 7.200).
- **Salvamento Duplo em IndexedDB e Recuperação Automática de Falhas (`indexeddb-save.ts` & `error-boundary.ts`)**:
  - Persistência nativa assíncrona em IndexedDB (banco `MediVilleDB`, store `game_saves`) com fallback gracioso para `localStorage`.
  - Dois slots rotativos de segurança: `slot_current` (ativo) e `slot_backup` (anterior), com verificação de integridade via checksum FNV-1a.
  - Restauração automática silenciosa do `slot_backup` caso o `slot_current` apresente falha de checksum ou parsing, sem travar o jogo.
  - Error Boundary global (`window.onerror` e `window.onunhandledrejection`) salvando imediatamente o estado válido no backup e exibindo modal limpo de *"Recuperar Turno"*.
- **Testes Automatizados (Vitest) e Orçamento de Peso**:
  - Nova suíte `tests/mixed-economy-and-indexeddb.test.ts` com 13 testes cobrindo todas as novas mecânicas.
  - Total de **108 testes automatizados aprovados (100% de sucesso)**.
  - Bundle final: **1.05 MB**, cumprindo com folga o limite orçamentário do GDD (< 2.00 MB).
- **Tipografia Oficial `Fredoka` e Escala de Acessibilidade (`index.html`, `styles.css` e `settings-modal.ts`)**:
  - Integração da família tipográfica **Fredoka** (pesos 400, 500, 600 e 700) no CSS e nos textos do PixiJS v8 (`'Fredoka', system-ui, sans-serif`).
  - Ativação de números tabulares (`font-variant-numeric: tabular-nums` / `font-feature-settings: "tnum"`) no relógio, caixa hospitalar, estoque da farmácia e estatísticas financeiras, eliminando saltos visuais na atualização numérica.
  - Novo seletor de **Tamanho da Fonte (`Padrão`, `Grande`, `Extra Grande`)** no modal de Configurações, com persistência no `localStorage` e aplicação imediata no `document.documentElement` (`data-font-scale`).
- **Correção Definitiva de Layout e Dimensionamento da Enciclopédia SUS (`encyclopedia-modal.ts`)**:
  - Estrutura sem cortes nem truncamento: `max-h-[88dvh] w-full max-w-4xl overflow-hidden`.
  - Cabeçalho fixo (`shrink-0`) com contador `X/150 Protocolos Dominados`, barra visual de progresso e **busca rápida reativa por nome, sintoma ou conduta**.
  - Barra de subtipos categorizados (*Todas, Respiratória, Viral, Bacteriana, IST, Tropical, Parasitária, Digestiva, Cardiovascular, Neurológica, Endócrina, Trauma, Toxicologia, Alergia, Obstetrícia, Pediatria, Saúde Mental, Urologia, Dermatologia, Oftalmologia/ORL*):
    - Desktop e tablet: quebra inteligente em pílulas compactas (`flex-wrap gap-1.5 max-h-28 overflow-y-auto`).
    - Celular: carrossel horizontal fluido com snap (`flex-nowrap overflow-x-auto snap-x touch-pan-x`) com `shrink-0 whitespace-nowrap` em cada botão.
    - Exibição da contagem exata por categoria (ex: `Respiratória (4/12)`).
  - Corpo rolável isolado (`overscroll-contain`) em grade responsiva (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) com cartões exibindo Nome, Gravidade, Unidade Típica, Sintomas, Conduta RENAME, Explicação Educativa e Fonte Oficial.
- **UX Mobile Avançada e Refinamento PixiJS v8**:
  - Ativação de `roundPixels: true` na aplicação PixiJS e nos elementos gráficos para máxima nitidez em telas retina e celulares.
  - Correção na detecção tátil em `canvas-input.ts`: diferenciação matemática estrita entre toque simples (`tap` < 8px) e arraste de câmera (`pan` > 8px), evitando acionar cliques ou abrir salas acidentalmente durante a navegação.
  - Ajuste de safe-area insets no container raiz (`w-[100dvw] h-[100dvh] touch-none`) e modais bottom-sheet ergonômicos em telas `< 640px`.
- **Expansão de +50 Casos Clínicos Reais do SUS (Total de 150 Casos em `cases.json` e `clinical-cases.json`)**:
  - **Casos 101 a 110 (Pediatria e PNI)**: Coqueluche, Caxumba, Rubéola, Eritema Infeccioso, Doença Mão-Pé-Boca, Crupe Viral, Broncoespasmo Viral, Dermatite de Fraldas por Candida, Anemia Ferropriva na Infância e Escarlatina Pediátrica.
  - **Casos 111 a 120 (Saúde da Mulher, Obstetrícia e ISTs)**: Hiperêmese Gravídica, Bacteriúria Assintomática na Gestante, Doença Inflamatória Pélvica (DIP), Herpes Genital Primário, Cancro Mole, Linfogranuloma Venéreo, Donovanose, Dismenorreia Primária, Sangramento Uterino Disfuncional e Eclâmpsia Hospitalar.
  - **Casos 121 a 130 (Infectologia, Dermatologia e Negligenciadas)**: Esporotricose Cutânea Felina, Tungíase (Bicho-de-pé), Larva Migrans Cutânea, Pediculose Capilar, Tinea Corporis, Pitiríase Versicolor, Furunculose/Abscesso, Febre Maculosa Brasileira, Toxoplasmose Aguda Adquirida e Teníase Intestinal.
  - **Casos 131 a 140 (Clínica Médica, Cardiologia e Gastroenterologia)**: Pericardite Viral Aguda, Bradicardia Sintomática Instável, Taquicardia Paroxística Supraventricular (TPSV), Derrame Pleural Parapneumônico, Encefalopatia Hepática Aguda, Hemorroida Trombosada, Fissura Anal Aguda, Síndrome do Intestino Irritável, Crise Addisoniana e Hipercalemia Aguda.
  - **Casos 141 a 150 (Neurologia, Saúde Mental, Ortopedia e Oftalmo/ORL)**: Neuralgia do Trigêmeo, Cefaleia em Salvas, Abstinência Alcoólica Aguda, Transtorno Bipolar (Mania Aguda), Insônia Primária na APS, Tendinite do Manguito Rotador, Epicondilite Lateral, Cerume Impactado, Otite Externa Difusa e Hordéolo Agudo (Terçol).
  - Todos os 150 casos integrados com a mecânica de Auto-Resolução por Protocolo Dominado (`masteredCaseIds`) e estoque da farmácia.
- **Testes Automatizados (Vitest)**:
  - Adicionado `tests/polish-150-cases-and-encyclopedia.test.ts` cobrindo catálogo de 150 casos, integridade RENAME, setores, governo, conselheiro e escala tipográfica.
  - Total de **95 testes automatizados aprovados (100% de sucesso)** e bundle de 1.03 MB (< 2.00 MB).

## [1.1.0] - 2026-10-24
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.1.0 — Novos Setores Hospitalares 3D, Negociação Governamental SUS e Conselheiro Hospitalar Inteligente
- **Novos Setores Hospitalares 3D por Evolução de Unidade (`rooms.json` & `furniture-factory.ts`)**:
  - **Sala de Vacinação (`vaccination`) — Nível UBS**: Geladeira térmica de imunobiológicos PNI com visor digital de temperatura (+2°C a +8°C), maca/poltrona de aplicação e arquivo fichário vertical de cartões de vacina. Concede bônus diário de meta de cobertura vacinal (+R$ 1.200 e +0.5 de Reputação).
  - **Laboratório de Análises Clínicas (`laboratory`) — Nível UPA / Hospital**: Bancada em aço inox com suporte de tubos de ensaio coloridos, microscópio óptico voxel e centrífuga clínica com tampa âmbar. Acelera em 25% o diagnóstico automático de casos de Infectologia e Endocrinologia.
  - **Sala de Raio-X e Imagem (`xray`) — Nível UPA / Hospital**: Aparelho de radiografia volumétrico com coluna telescópica e cabeçote colimador articulado, biombo plumbífero móvel com visor de chumbo âmbar translúcido e negatoscópio luminoso na parede com radiografia de tórax. Destrava bônus de faturamento BPA/SIGTAP (+R$ 1.200) em casos respiratórios e de trauma.
  - **Centro Cirúrgico (`surgery`) — Nível Hospital Médio/Grande**: Mesa cirúrgica em inox com colchão impermeável, foco cirúrgico de teto duplo com feixe luminoso suave e monitor cirúrgico multiparamétrico. Permite atender casos graves com faturamento hospitalar AIH de +R$ 7.200.
  - **UTI - Terapia Intensiva (`icu`) — Nível Hospital Médio/Grande**: Cama hospitalar elétrica articulada com grades de segurança laterais, ventilador mecânico com traqueias e monitor cardíaco multiparamétrico com onda de ECG pulsante. Permite resolver casos de gravidade `Grave` e `Crítica` com alto repasse financeiro (+R$ 7.200).
  - **Sala de Descanso da Equipe (`staff_room`) — Disponível desde UBS**: Sofá acolchoado moderno de 2 lugares, mesa com cafeteira e canecas e armários de vestiário metálicos. Recupera a energia da equipe médica e de enfermagem, reduzindo o tempo de consulta em 15%.
- **Sistema de Negociação Governamental de Repasses (Ciclo de 30 Dias do GDD)**:
  - Adicionado painel de Negociação no modal de Finanças SUS (`finances-modal.ts` e `economy-system.ts`).
  - Permite pactuação de aumento permanente do repasse diário PAB/MAC com o Ministério da Saúde / Secretaria de Saúde.
  - Probabilidades calculadas matematicamente a partir da **Reputação Atual ($R$)**, dos **Protocolos Clínicos Dominados ($M$)** e do número de pacientes atendidos ($T$):
    - 🟢 **Aceite Total (+40% no repasse diário)**.
    - 🟡 **Aceite Parcial (+20% no repasse diário)**.
    - 🔴 **Negado (0%)**.
  - Intervalo rigoroso de **30 dias de jogo** (`governmentNegotiationCooldownDays`) entre renegociações consecutivas, decrementado a cada virada de dia.
- **Conselheiro Hospitalar Inteligente (Máximo 3 Sugestões por Ordem de Urgência)**:
  - Novo sistema analítico `advisor-system.ts` detectando gargalos em tempo real:
    - Caixa baixo / risco de déficit orçamentário.
    - Fila congestionada na recepção com risco de desistência.
    - Estoque de medicamentos RENAME zerado na farmácia.
    - Casos graves chegando sem leito de UTI ou Centro Cirúrgico.
    - Diagnósticos lentos de infectologia/endocrinologia sem laboratório clínico.
    - Casos de trauma/tórax sem sala de Raio-X.
    - Equipe sobrecarregada sem sala de descanso.
    - Reputação alta pronta para pactuação de repasse.
  - Filtro e ordenação estrita por gravidade (`Crítica/Alta > Média > Oportunidade`) com **teto máximo de 3 alertas simultâneos**.
  - Botões de ação direta no card do conselheiro:
    - **Resolver**: dispara diretamente a ação correta (abrir menu de construção na sala indicada, abrir modal da farmácia ou painel de finanças).
    - **Adiar**: silencia temporariamente o aviso.
    - **Ignorar (`✕`)**: dispensa o card da interface.
- **Testes Automatizados (Vitest)**:
  - Adicionado `tests/sectors-and-negotiation.test.ts` com 9 testes cobrindo catálogo, rendering 3D procedural, bônus clínicos, cálculo probabilístico e cooldown da negociação e limite de 3 alertas do conselheiro.
  - Suíte total expandida para **88 testes 100% aprovados**.

## [1.0.0] - 2026-10-24
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Versão 1.0.0 — Mecânica de Protocolo Dominado (Auto-Resolução), Catálogo de 100 Casos Clínicos SUS, Tela Inicial, Tráfego Voxel e Limpeza Visual
- **Nova Mecânica Core: "Marco de Protocolo Clínico" e Auto-Resolução (`masteredCaseIds`)**:
  - `masteredCaseIds: string[]` integrado ao estado do jogo (`GameState`) com persistência completa em `save-system.ts`.
  - **Caso Inédito (`!masteredCaseIds.includes(caseId)`)**: Paciente entra no consultório e exibe o balão `🆕 Novo Caso! 🩺 Atender` sobre a sala e no botão do dock. Ao acertar a conduta clínica pela 1ª vez:
    1. O `caseId` é adicionado permanentemente a `masteredCaseIds`.
    2. Emite notificação comemorativa: `🏆 Novo Protocolo Instituído: [Nome]! Próximos casos serão atendidos automaticamente pela equipe (X/100)`.
    3. Deduz medicamento RENAME, credita SIGTAP (+R$ 3.600) e libera a fila.
  - **Auto-Resolução para Casos Dominados (`masteredCaseIds.includes(caseId)`)**:
    - Não exige clique manual nem abre popup intrusivo.
    - O médico realiza o atendimento automaticamente em tempo modulado pela habilidade $H$ ($T_{atend} = \max(1.5, T_{base} \times (1 - 0.05 \times (H - 1)))$).
    - Barra de progresso verde esmeralda procedural sobre o consultório com label `⚡ Protocolo em andamento...`.
    - Ao concluir: consome automaticamente a medicação RENAME, fatura BPA/SIGTAP (+R$ 3.600), exibe texto flutuante no mapa `⚡ Auto +R$ 3.600` e avança o próximo paciente.
- **Catálogo Oficial dos 100 Casos Clínicos Reais do SUS**:
  - Base de dados expandida de 15 para **exatamente 100 casos clínicos únicos** em `src/data/cases.json` e `src/data/clinical-cases.json`:
    - *50 Casos Canônicos do GDD*: Respiratórios (1-7), Virais (8-12), Bacterianos (13-18), ISTs e Tropicais (19-23), Digestivos (24-27), Cardiovasculares (28-31), Neurológicos (32-34), Endócrinos (35-37), Trauma/Alergia (38-44), Obstetrícia/Pediatria/Saúde Mental (45-50).
    - *50 Casos Complementares do SUS*: Rinossinusite bacteriana, Febre reumática, Cefaleia tensional, Roséola, Golpe de calor, Zika, Febre amarela, Coqueluche, Mononucleose, Herpes-zóster, Impetigo, Escabiose, Candidíase, Tricomoníase, Gonorreia/clamídia, Hanseníase, Leishmanioses, Chagas, Esquistossomose, Parasitoses intestinais, Úlcera por H. pylori, Colecistite, Pancreatite, Diverticulite, Constipação, Angina estável, TVP, TEP, Edema de pulmão, Pericardite, Paralisia de Bell, VPPB, Estado de mal epiléptico, Hipotireoidismo, Hipertireoidismo, Gota, Artrite reumatoide, Lombalgia mecânica, Entorse, Pneumotórax hipertensivo, Acidentes por jararaca e escorpião, Conjuntivite, Glaucoma agudo, Epistaxe, Diabetes gestacional, Mastite puerperal e Depressão maior.
  - **Integridade Referencial 100% Estrita**: Todos os 100 casos referenciam exclusivamente medicamentos válidos cadastrados em `pharmacy.json` da RENAME.
  - **Balanceamento Dinâmico de Sorteio (`selectWeightedCase`)**: Prioriza casos compatíveis com o nível da unidade (`UBS`, `UPA`, `Hospital`) e concede multiplicador de peso para casos inéditos (estimulando o progresso rumo aos 100/100) enquanto intercala casos dominados para sustentar o faturamento contínuo.
- **Tela Inicial (Main Menu) Tycoon & Enciclopédia SUS Expandida**:
  - Tela Inicial em `src/ui/title-screen.ts` com painel Apple-style sob hospital 3D e trânsito vivo:
    - `▶️ Continuar Hospital` com Dia, Caixa e contagem de `Protocolos Dominados: X/100`.
    - `🏥 Novo Hospital` com seleção de tipo de unidade (*UBS*, *UPA 24h*, *Clínica Integrada*, *Hospital Geral SUS*).
    - `📖 Enciclopédia SUS (X/100)` com abas de filtro por especialidade médica e botão `"🔄 Praticar Novamente"` para revisar manualmente casos já dominados.
- **Tráfego Urbano Voxel 3D e Desembarque de Pacientes (`Drop-off`)**:
  - Carros de passeio Voxel, ônibus e ambulâncias SAMU transitando na avenida frontal em `src/systems/traffic-system.ts` e `src/render/voxel-vehicles.ts`.
  - Desaceleração suave na faixa de pedestres e ciclo de desembarque: veículos encostam no meio-fio em frente à entrada, param por ~1,5s, abrem a porta e o paciente desce na calçada caminhando até a recepção.
- **Limpeza Visual na Recepção**:
  - Remoção de qualquer vetor ou linha verde residual em `src/render/room-renderer-3d.ts`.
- **Efeitos Sonoros Procedurais Web Audio API (`src/core/sound-system.ts`)**:
  - Áudio procedural leve sintetizado em tempo real (clique, caixa registradora, vitória de protocolo e sirene SAMU) com controle Mute (`🔊/🔇`).
- **Suíte de Testes Automatizados (Vitest)**:
  - Adicionado `tests/auto-protocol-and-100-cases.test.ts` validando os 100 casos únicos, integridade de medicamentos RENAME, transição de caso inédito para dominado, auto-resolução rápida com receita SIGTAP (+R$ 3.600) e tráfego urbano.
  - 100% dos testes aprovados (79 testes em 13 suítes).
  - Bundle compilado em **0.90 MB**, cumprindo com folga o teto de 2.00 MB do GDD.

## [0.9.0] - 2026-10-24
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Evolução Core & Visual 3D — Mecânica On-Click, Relógio Determinístico, Personagens Voxel 2.5D, Mapa CityRT 3D e UI Compacta Mobile/Tablet
- **Atendimento Clínico On-Click & Fim de Popups Automáticos**:
  - Quando um paciente entra no consultório médico com médico disponível, ele entra no estado `ready_for_treatment` sem disparar popups intrusivos.
  - Balão pulsante `🩺 Atender` renderizado de forma interativa diretamente sobre o consultório (área de toque `>= 44x44px`), além do botão de ação rápida no dock inferior com badge numérico em tempo real.
  - A resolução do caso deduz os medicamentos correspondentes da RENAME em `pharmacy.json`, credita a consulta médica SIGTAP (+R$ 3.600) e exibe texto flutuante animado sobre a sala.
- **Relógio Determinístico & Auto-Pausa Inteligente**:
  - Pausa absoluta (`0x`): acumulador de ticks zerado determinísticamente, congelando tempo, chegada de pacientes, queda de paciência, fechamento do dia e temporizadores de eventos sem dependência de `setInterval` ou `setTimeout`.
  - Auto-pausa inteligente em modais clínicos e administrativos (`DecisionModal`, `StaffModal`, `PharmacyModal`, `FinancesModal`), preservando e restaurando `previousSpeed`.
  - Escalamento rigoroso em `1x`, `2x` e `3x` com `maxDeltaTime = 100ms` prevenindo saltos abruptos por perda de foco na janela.
- **Personagens Voxel 2.5D Procedurais (Estilo Crossy Road / Minecraft)**:
  - Nova fábrica procedural `src/render/voxel-character.ts` usando exclusivamente `PIXI.Container` e `PIXI.Graphics` (cubos com face superior iluminada, frontal base e lateral sombreada + sombra elíptica).
  - 5 papéis com estética única e reconhecível: Médico (jaleco sobre roupa azul e estetoscópio), Enfermeiro (uniforme teal `#0D9488` com cruz branca), Farmacêutico (jaleco com camisa azul royal), Recepcionista (camisa âmbar e crachá) e Paciente (roupas casuais variadas com indicador visual de paciência: calmo, gota de suor ou alerta).
  - Animações determinísticas proceduralmente sincronizadas com o relógio: `WALKING` (balanço oposto de membros e bobbing vertical), `IDLE` (respiração) e `WORKING` (atendimento dinâmico).
- **Coreografia e Rotas dos NPCs (`src/systems/npc-movement-system.ts`)**:
  - Navegação fluida por waypoints (`lerp`) entre salas na grade 12x12 sincronizada com a equipe contratada e o ciclo dos pacientes SUS (Entrada ➔ Recepção ➔ Espera ➔ Consultório ➔ Farmácia).
- **UI Compacta Mobile & Tablet (> 82% da Tela Livre)**:
  - **Top Bar Ultra-Compacta**: Pílula horizontal única de 48px com caixa curto (`formatShortCash`), reputação, estoque RENAME, relógio e botão de detalhes colapsável.
  - **Dock Inferior Colapsável (56px)**: Botões icônicos mínimos (`>= 44x44px`) para `🏗️ Obras`, `🩺 Atender (N)`, `👥 Equipe`, `💊 Farmácia`, `💰 Finanças` e `🎯 Centralizar`.
  - **Build Drawer Sob Demanda**: As cartas de salas permanecem ocultas e deslizam em carrossel horizontal compacto (`snap-x`) somente quando o jogador toca em `🏗️ Obras`, recolhendo-se automaticamente ao posicionar uma sala ou fechar.
  - **Event Banner Compacto**: Pílula de linha única sob a Top Bar com contagem regressiva e toque para expandir.
  - **Auto-Enquadramento**: Função `fitMapToViewport` calcula a escala da câmera descontando Top Bar (48px) e Dock (56px), garantindo mais de 82% de área útil em telas mobile (`375x667`, `390x844`) e tablets.
- **Suíte de Testes Automatizados (Vitest)**:
  - Adicionado `tests/voxel-and-mobile-evolution.test.ts` cobrindo os 5 papéis de voxel, animações, sistema de movimentação, congelamento em pausa, garantia de >82% de tela livre e formatação de caixa.
  - Total de 66 testes passando com 100% de sucesso.
- **Orçamento de Peso**:
  - Bundle compilado em apenas 0.73 MB (limite GDD: 2.00 MB), sem dependências pesadas externas.

## [0.8.0] - 2026-10-24
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Correções & Melhorias (Estabilização, Casos SUS, Refinamento Visual & Responsividade Mobile)
- **Correção da Linha Azul ao Ponto de Origem (0,0)**:
  - Eliminado o artefato visual do estetoscópio médico em `src/render/patients-view.ts`: adicionada chamada explícita `this.graphics.moveTo(x + 4, y - 4)` imediatamente antes do traçado `.arc(...)`, isolando o subcaminho do canvas PixiJS v8.
  - Validação estrita de coordenadas finitas e não-nulas (`!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)`) antes de desenhar caracteres para evitar ligação a nós não inicializados.
  - Validação de coordenadas da grade em `GhostView` prevenindo traçados espúrios fora da área utilizável do mapa.
- **Expansão de Casos Clínicos Reais da Atenção Primária à Saúde (APS/SUS)**:
  - Catálogo ampliado para 15 casos reais com condutas baseadas estritamente em protocolos do Ministério da Saúde (`src/data/cases.json` e espelho `src/data/clinical-cases.json`):
    1. Gastroenterite Aguda Viral (Plano A - Sais de Reidratação Oral)
    2. Sífilis Primária / Secundária na APS (Benzilpenicilina Benzatina intramuscular)
    3. Otite Média Aguda Purulenta Pediátrica (Amoxicilina + Dipirona)
    4. Síndrome Gripal / Influenza com Fatores de Risco (Oseltamivir precoce + Dipirona)
    5. Rinossinusite Aguda Bacteriana (Amoxicilina + Lavagem com Soro Fisiológico)
    6. Cefaleia Tensional Aguda sem Sinais de Alarme (Dipirona / analgesia de primeira linha)
    7. Febre Reumática - Profilaxia Secundária Recorrente (Benzilpenicilina Benzatina)
    8. Desidratação Moderada / Golpe de Calor - Plano B (SRO + Soro Fisiológico)
    9. Infecção do Trato Urinário Baixo Recorrente - Cistite (Nitrofurantoína oral)
    10. Exantema Súbito / Febre Viral Benigna Pediátrica (Paracetamol)
    11. Resfriado Comum em Adulto (Soro Fisiológico + Paracetamol)
    12. Faringoamigdalite Estreptocócica Aguda (Amoxicilina + Paracetamol)
    13. Dengue Clássica sem Sinais de Alarme - Grupo A (SRO + Dipirona)
    14. Pneumonia Adquirida na Comunidade - PAC Leve (Amoxicilina + Dipirona)
    15. COVID-19 Leve na APS (Isolamento + Dipirona + Paracetamol)
  - Integridade referencial 100% com os 8 medicamentos da RENAME em `src/data/pharmacy.json`.
  - Seleção aleatória ponderada (`selectWeightedCase`) que nunca repete o caso imediatamente anterior.
- **Responsividade Mobile-First & Auto-Fit Dinâmico**:
  - Implementada função pura e testada `fitMapToScreen(viewportWidth, viewportHeight)` calculando com precisão a escala e o centramento do hospital 12x12 descontando o HUD superior e a barra de construção inferior.
  - Suporte sem cortes nem desbordamento para telas de 360px a 430px de largura e integração com `ResizeObserver` e `window.addEventListener('resize')`.
  - Botão de atalho rápido `🎯 Centralizar` adicionado ao dock de construção para centralização e auto-fit instantâneos do mapa.
  - Dock de construção com rolagem horizontal tátil suave (`snap-x`, `touch-pan-x`, `scrollbar-none`) e botões com dimensões mínimas de toque (`>= 44x44px`).
  - Adaptação dos modais (`DecisionModal`, `StaffModal`, `PharmacyModal`, `FinancesModal`) para comportamento nativo de *Bottom Sheet* no mobile (`items-end sm:items-center`, `rounded-t-3xl sm:rounded-3xl`, `max-h-[85dvh]` e `overflow-y-auto`).
- **Qualidade, Tipagem Estrita & Testes**:
  - 10 novos testes automatizados em `tests/cases-and-mobile.test.ts` validando integridade referencial, sorteio sem repetição e auto-fit em telas mobile (`375x667`), telas estreitas (`360x740`) e monitores desktop (`1920x1080`).
  - Total de 58 testes automatizados (10 arquivos) 100% aprovados com Vitest.
  - TypeScript rigoroso com zero `any` e conformidade completa com regras do ESLint (limite <= 35 linhas por função).
  - Tamanho final do pacote: **0.72 MB** (muito abaixo do limite de 2.00 MB).

## [0.7.0] - 2026-10-24
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Adicionado & Aprimorado (Prompt 10: Mapa Urbano CityRT, Arquitetura 2.5D & Mobília Volumétrica)
- **Entorno Urbano Exterior Estilo CityRT (`src/render/city-environment.ts`)**:
  - Geração procedural 100% vetorial com `PIXI.Graphics` de todo o lote urbano externo ao hospital: gramado verde texturizado, avenida asfaltada com faixas de pedestres, meio-fio em 2.5D e calçadas conectadas à entrada da unidade.
  - Baia de ambulância de emergência com demarcação no piso `AMBULÂNCIA / SUS` e veículo SAMU em bloco 3D com giroflex reativo animado (luzes vermelhas/brancas piscando durante eventos dinâmicos de Acidentes e Surtos).
  - Mobiliário urbano e vegetação voxel: árvores cúbicas com copa em camadas e sombra projetada, bancos de praça em madeira, postes de luz de aço e ponto de ônibus com cobertura azul.
- **Estrutura Hospitalar 2.5D em Corte Arquitetônico (`src/render/room-renderer-3d.ts` & `src/render/room-layout.ts`)**:
  - Substituição das caixas planas por paredes extrudadas em corte baixo (cutaway mode): paredes traseiras e laterais com altura e volume clínico (topo claro, face interna na cor do setor e rodapé), e paredes frontais em corte rebaixado para permitir visão perfeita dos interiores sem obstruir os cliques do jogador.
  - Vãos de portas reais com batentes calculados proceduralmente conforme o ângulo de rotação da sala (`0°`, `90°`, `180°`, `270°`).
  - Pisos hospitalares diferenciados: porcelanato com tapete SUS na Recepção, baldosas acolhedoras na Sala de Espera, piso clínico asséptico com reflexo sutil no Consultório, piso cinza técnico com faixa azul na Farmácia e laje de concreto com quadrícula sutil para o terreno livre.
- **Mobília Hospitalar Volumétrica 3D (`src/render/furniture-factory.ts`)**:
  - Modelagem procedural 2.5D com sombras suaves: balcão em "L" com monitor e totem de senhas na Recepção; fileiras de cadeiras azuis, bebedouro e TV na Espera; mesa médica, cadeira, maca com travesseiro, biombo e pia no Consultório; leitos de observação e mesa de triagem.
  - Prateleiras da Farmácia RENAME reativas: número de caixas de medicamentos diminui visualmente conforme o estoque geral decresce até o esgotamento (0 un).
- **Iluminação Dinâmica Diurna & Y-Sorting (`src/render/day-lighting-view.ts`)**:
  - Ciclo diurno sincronizado com o relógio (`state.dayTimeSec`): manhã fresca, tarde dourada e entardecer suave, acendendo postes de iluminação e luz interna das salas no final do turno.
  - Sistema de Y-sorting com `sortableChildren = true` para sobreposição perfeita de profundidade.
- **Gerenciamento de Memória & Performance 60 FPS (`src/render/render-cache.ts`)**:
  - Sistema de cache por assinatura com limpeza estrita via `destroy({ children: true })` ao mover, girar ou demolir salas, eliminando vazamento de memória em sessões longas.
- **Suíte de Testes Automatizados (Vitest)**:
  - 11 novos testes em `tests/render-3d.test.ts` cobrindo cálculo de portas e móveis nas 4 rotações, destruição de memória no cache, alerta SAMU, estantes reativas e iluminação (totalizando 48 testes 100% aprovados).
- **Orçamento de Peso**:
  - Bundle total otimizado em **0.71 MB** (orçamento GDD < 2.00 MB).

## [0.6.0] - 2026-10-23
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

### Refatoração Core (Atendimento Sob Demanda & Relógio Determinístico)
- **Eliminação de Popups Automáticos & Atendimento On-Demand (`On-Demand Treatment`)**:
  - Pacientes não abrem mais o modal clínico intrusivamente na tela do jogador.
  - Novo estado `ready_for_treatment` para pacientes posicionados no consultório médico.
  - Indicador visual interativo com balão pulsante `🩺` sobre o consultório/paciente e botão de ação rápida de toque mínimo no HUD (`🩺 Atender: ${count}`).
  - Abertura de caso clínico estritamente por clique do jogador no consultório ou no botão rápido do HUD.
  - Decaimento de paciência modulado pela habilidade médica $H$ de 1 a 5 estrelas: $T_{atend} = T_{base} \times (1 - 0.05 \times (H - 1))$.
  - Liberação imediata do consultório ao resolver a consulta, avanço de 1 na fila, dedução de estoque de medicamentos RENAME e registro de faturamento SIGTAP (+R$ 3.600) com feedback flutuante na tela.
- **Correção Integral do Relógio Central (`Pausa`, `1x`, `2x`, `3x`)**:
  - **Pausa Absoluta (0x)**: Acumulador de simulação zerado e congelamento total de chegadas, paciência, duração de consultas, temporizadores dos 12 eventos dinâmicos e fechamento do dia (0 ticks).
  - **Auto-Pausa Inteligente em Modais**: Abertura de modais (Casos Clínicos, Finanças, Farmácia, Equipe, Configurações) memoriza a velocidade atual (`previousSpeed`), pausa automaticamente o jogo para leitura tranquila e restaura a velocidade exata ao fechar.
  - **Proteção Anti-Espiral da Morte**: Limitador `maxFrameDeltaSec = 0.1s` (100ms) e teto de 5 passos com descarte de tempo excedente ao retornar de abas inativas do navegador.
  - **Sincronização dos Botões de Velocidade**: Estado visual unificado no HUD refletindo a fonte única de verdade do relógio via evento `simulation:speed_changed`.
- **Suíte de Testes Automatizados (Vitest)**:
  - 37 testes automatizados cobrindo atendimento sob demanda, liberação de sala, dedução RENAME, faturamento SIGTAP, pausa absoluta e taxas proporcionais em 2x e 3x.
- **Orçamento de Peso**:
  - 0.70 MB de bundle total (muito abaixo do limite de 2.00 MB).

## [0.5.0] - 2026-10-23
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)
- Deployment Preview v0.5.0: [https://9ef90a06.mediville-manager.pages.dev](https://9ef90a06.mediville-manager.pages.dev)

### Adicionado (Fase 3: Salvamento, Modo Convidado & PWA Instalável)
- **Sistema de Salvamento Completo & Backup JSON (Prompt 12 do GDD)**:
  - Salvamento automático contínuo (`save-system.ts`) ao fechamento de cada dia (`day:end`) e a cada 45 segundos de jogo real.
  - Carregamento automático da partida salva ao abrir ou recarregar o navegador (`loadGameState()`), restaurando salas, pacientes, equipe, reputação, caixa e finanças.
  - **Exportação de Backup**: Download de arquivo `.json` com timestamp e dia de jogo para salvar no computador ou celular.
  - **Importação de Backup**: Leitor de arquivos JSON com validação de esquema para restaurar hospitais antigos ou migrar de aparelho.
  - **Reinício de Hospital**: Ação com confirmação para apagar o save e iniciar um novo hospital do zero.
- **Modal Apple-Style de Configurações & Save (`src/ui/settings-modal.ts`)**:
  - Novo botão `⚙️` no HUD superior dando acesso rápido às opções de salvamento manual, exportação, importação e reinício.
- **Tela Neutra de Idade & Modo Convidado (Prompt 13 do GDD)**:
  - Verificação amigável de ano de nascimento (`age-gate-modal.ts` e `player-profile.ts`) sem armazenamento de dados pessoais ou sensíveis.
  - Ativação automática do **Modo Convidado** para menores de 13 anos (armazenamento estritamente local no aparelho, sem telemetria nem envio de dados a servidores, conforme LGPD e ECA Digital).
- **Progressive Web App (PWA) Instalável para Celular e PC**:
  - `manifest.webmanifest` com modo `display: standalone`, orientação adaptável e paleta de cores hospitalar.
  - Service Worker (`sw.js`) com cache estratégico para funcionamento offline e inicialização ultrarrápida.
  - Ícones vetoriais de alta resolução (`icon-192.svg` e `icon-512.svg`) integrados nas tags de cabeçalho do `index.html`.
- **Suíte de Testes Expandida**:
  - 32 testes automatizados cobrindo serialização de dados, exportação/importação JSON, verificação de idade e Modo Convidado.
- **Orçamento de Peso**:
  - Pacote otimizado com **0.69 MB** (muito abaixo do teto de 2.00 MB).

## [0.4.0] - 2026-10-23
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)
- Deployment Preview v0.4.0: [https://a627c349.mediville-manager.pages.dev](https://a627c349.mediville-manager.pages.dev)

### Adicionado & Aprimorado (Conclusão da Fase 2 do GDD + Melhorias de Jogabilidade & Gráficos)
- **Fila de Espera de Casos Clínicos (Fim dos Popups Sobrepostos)**:
  - Eliminação completa de popups médicos abrindo em cascata ou sobrepostos.
  - Implementação de fila de espera de decisões clínicas (`pendingDecisionPatientIds` e `getNextPendingDecision`).
  - Badge interativa no HUD `📋 Casos:` com indicador numérico em tempo real e pulso visual quando houver pacientes aguardando conduta.
  - O modal clínico nunca fecha sem o consentimento do jogador; após o feedback do protocolo SUS, exibe botões `📋 Atender Próximo Caso (${restantes} na espera)` e `Voltar ao Hospital`.
- **Ferramenta de Mover / Reposicionar Salas Existentes**:
  - Nova ação no dock de construção `✋ Mover`: permite clicar em qualquer sala já construída para selecioná-la e reposicioná-la livremente na grade sem cobrar novo custo de construção.
  - Suporte completo a girar (`tecla R` ou botão) durante a movimentação da sala fantasma.
  - Validação de colisão inteligente (`canMoveRoom`) que ignora a própria sala durante a verificação de sobreposição.
- **Evolução Hospitalar & Novas Salas da Fase 2 (Prompt 9)**:
  - Progressão em 3 níveis: **Unidade Básica de Saúde (UBS)** $\rightarrow$ **Unidade de Pronto Atendimento (UPA 24h)** $\rightarrow$ **Hospital Geral Municipal**.
  - Novas salas introduzidas no catálogo `src/data/rooms.json`: **Triagem de Manchester** (`triage`) e **Leitos Clínicos / Observação** (`observation`), desbloqueadas no nível UPA.
  - Subida de nível dinâmica baseada em metas de pacientes atendidos e reputação institucional SUS.
- **Catálogo Expandido com 10 Casos Clínicos Reais da Atenção Básica e Urgência**:
  - Inclusão dos 5 novos casos em `src/data/cases.json`: COVID-19 Leve, Pneumonia Adquirida na Comunidade (PAC), Gastroenterite Aguda Infantil, Crise Hipertensiva e Desidratação Pediátrica com condutas baseadas na RENAME e protocolos do Ministério da Saúde.
- **Sistema de Tutorial Contextual (Prompt 10)**:
  - Integração das 15 dicas contextuais oficiais do GDD em `src/data/tutorial.json`.
  - Apresentação estilo Apple através de cards discretos no canto inferior esquerdo (`src/ui/tutorial-view.ts`) que surgem apenas na primeira ocorrência de cada mecânica.
- **Upgrade Gráfico Completo no PixiJS**:
  - **Piso do Hospital**: Grade refinada com ladrilhos brancos e cinzas suaves, rejunte sutil, calçada externa e emblema hospitalar no centro da recepção.
  - **Salas Volumétricas com Mobília Detalhada**: Paredes 3D ortogonais com profundidade, pisos coloridos higiênicos, capachos de entrada e mobília vetorial desenhada para cada setor (mesa com monitor + maca com travesseiro no consultório, balcão de recepção, cadeiras de espera em fileira, estantes de medicamentos na farmácia e leitos de observação).
  - **Pacientes e Médicos**: Projeção de sombras suaves no piso, médicos de jaleco branco no consultório e balões de status flutuantes (`🩺`).
- **Suíte de Testes Expandida**:
  - 27 testes automatizados cobrindo a Fase 2, movimentação de salas, fila de espera, progressão de unidade, dicas de tutorial e dados clínicos.
- **Orçamento de Peso**:
  - Pacote otimizado totalizando **0.67 MB** (meta do GDD < 2.00 MB).

## [0.3.0] - 2026-10-23
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)
- Deployment Preview v0.3.0: [https://81ab38f4.mediville-manager.pages.dev](https://81ab38f4.mediville-manager.pages.dev)

### Adicionado
- **Economia Aprofundada & Tabela SIGTAP/SUS (Prompt 6)**:
  - Integração da tabela oficial de procedimentos do SUS em `src/data/sigtap.json` com códigos SIGTAP reais (`03.01.01.007-2` para consulta médica, `03.01.01.004-8` para dispensação farmacêutica e `02.14.01.001-5` para triagem/acolhimento).
  - **Faturamento Quadruplicado**: O valor repassado por consulta médica básica subiu 4x (de R$ 900 para R$ 3.600 por paciente atendido), proporcionando sustentabilidade financeira na expansão da unidade.
  - Modal Apple-style de Finanças SUS (`src/ui/finances-modal.ts`) com extrato discriminado de receitas BPA, repasses federais e custos.
- **Estoque & Compra de Medicamentos da Farmácia RENAME**:
  - Catálogo de 8 medicamentos essenciais da Atenção Básica em `src/data/pharmacy.json` (Paracetamol, Dipirona, Soro Fisiológico, Sais de Reidratação Oral, Amoxicilina, Benzilpenicilina, Nitrofurantoína e Oseltamivir).
  - Consumo procedural de estoque na alta do paciente de acordo com o caso clínico tratado.
  - Penalidade de satisfação por desabastecimento caso falte medicamento em estoque no hospital (`missingMedicationPenalty`).
  - Modal da Farmácia Básica (`src/ui/pharmacy-modal.ts`) para monitorar níveis de estoque com alertas visuais e compra instantânea de lotes.
  - Indicador de estoque total em tempo real no HUD com alerta pulsante se algum medicamento estiver zerado.
- **Repasses Periódicos do Ministério da Saúde**:
  - Crédito diário no fechamento do dia do Piso da Atenção Básica (PAB fixo de R$ 3.500/dia) somado a bônus de desempenho por satisfação média elevada.
- **Solicitação Imediata de Verba com a Secretaria de Saúde para Reforma**:
  - Botão de acesso rápido no HUD e no modal financeiro (`🏛️ Verba Reforma`) que libera imediatamente +R$ 25.000 em recursos municipais para ampliação física e contratação.
- **Suíte de Testes Expandida**:
  - 21 testes automatizados cobrindo fórmulas, simulação, casos clínicos, eventos, equipe, compra/consumo de medicamentos da RENAME, repasse do ministério e verba emergencial.

## [0.2.0] - 2026-10-23
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)
- Deployment Preview v0.2.0: [https://c2b2e1f7.mediville-manager.pages.dev](https://c2b2e1f7.mediville-manager.pages.dev)

### Adicionado
- **Gestão Completa de Equipe (Prompt 5)**:
  - Sistema de contratação e demissão de 4 categorias profissionais de saúde: Médicos, Enfermeiros, Farmacêuticos e Recepcionistas em `src/data/staff.json`.
  - Habilidade de 1 a 5 estrelas gerada proceduralmente e impacto dinâmico na velocidade de atendimento pela fórmula oficial do GDD: $T_{atend} = T_{base} \times (1 - 0.05 \times (H - 1))$.
  - Dedução diária de salários no fechamento do dia (`day-system.ts`) somada à manutenção de salas construídas.
  - Modal Apple-style (`src/ui/staff-modal.ts`) com visualização de habilidades em estrelas douradas, custo diário, filtros e ações rápidas com alvos de toque mobile ≥ 44px.
  - Indicador numérico em tempo real no HUD com botão de acesso rápido à equipe.
- **Sistema de 12 Eventos Dinâmicos Oficiais do SUS (Prompt 8)**:
  - Catálogo em `src/data/events.json` com 12 eventos distribuídos nas 4 categorias do GDD: Acidentes (ex: colisão na rodovia, desabamento), Surtos & Epidemias (surto de dengue, surto de gastroenterite), Crises de Recursos (falta de insumos, greve parcial de transporte) e Sazonais (inverno respiratório, onda de calor extrema).
  - Multiplicadores em tempo real de taxa de chegada de pacientes e duração de consultas médicas.
  - Banner animado com visual de emergência (`src/ui/event-banner.ts`) exibindo ícone, título, descrição e contagem regressiva em segundos.
  - Total integração desacoplada via EventBus (`event:started` e `event:ended`).
- **Suíte de Testes Expandida**:
  - 16 testes automatizados cobrindo fórmulas matemáticas, simulação de fila, casos clínicos e agora contratação/demissão de equipe e temporização/expiração de eventos dinâmicos.

## [0.1.0] - 2026-10-23
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)
- Deployment Preview: [https://e00c69f7.mediville-manager.pages.dev](https://e00c69f7.mediville-manager.pages.dev)

### Adicionado
- **Arquitetura Base**: Setup completo com Vite, TypeScript estrito (zero `any`), PixiJS v8, Tailwind CSS v4 e Vitest.
- **Orçamento de Peso**: Bundle estático de apenas 0,60 MB (632 KB), bem abaixo do limite de 2 MB do GDD.
- **Desacoplamento por Observer**: Barramento de eventos (`EventBus`) isolando 100% a simulação (`src/core/`, `src/systems/`) da renderização.
- **Relógio em Passo Fixo**: Simulação determinística com suporte a Pausa, 1x, 2x e 3x.
- **Grade 12x12 e Construção Livre**: Arraste, posicionamento com validação de colisões e custos, rotação de salas (`Girar / R`) e demolição com reembolso de 50%.
- **Salas Iniciais do Hospital**: Recepção, Sala de Espera, Consultório e Farmácia com dados definidos em `src/data/rooms.json`.
- **Fluxo de Pacientes e Fila**: Chegada progressiva de pacientes conforme número de setores, medição de tempo de espera e paciência.
- **Casos Clínicos Oficiais (SUS/RENAME)**: 5 casos clínicos base reais (Resfriado comum, Gripe influenza, Dengue sem alarme, Amigdalite estreptocócica, Cistite/ITU) com nomes genéricos sem dose, condutas corretas e distratoras com justificativa educativa.
- **Fórmulas Matemáticas do GDD**: Cálculo de satisfação $S = 100 - 20 \times \frac{T_{espera}}{T_{paciencia}} - 15 \times N_{erros}$, reputação diária $R_{dia+1} = R_{dia} + 0,1 \times (S_{media} - R_{dia})$ e limites de derrota por 7 dias consecutivos de caixa negativo ou reputação crítica.
- **UI & Acessibilidade**: HUD estilo Apple, botões acessíveis para toque mobile (≥ 44px), avisos de gargalo (conselheiro inteligente) e modal clínico de tomada de decisão.
- **Automação e Deploy**: Scripts `verify` (tsc, eslint, vitest, build e check-bundle) e integração preparada para Cloudflare Pages.
