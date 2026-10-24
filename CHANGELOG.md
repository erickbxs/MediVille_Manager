# Changelog — MediVille Manager

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [0.5.0] - 2026-10-23
### Deploy Online
- URL de Produção: [https://mediville-manager.pages.dev](https://mediville-manager.pages.dev)

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
