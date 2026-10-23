# Changelog — MediVille Manager

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

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
