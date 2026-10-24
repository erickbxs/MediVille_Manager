# Changelog — MediVille Manager

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

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
