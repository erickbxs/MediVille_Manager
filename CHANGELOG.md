# Changelog — MediVille Manager

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

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
