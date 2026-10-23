# Changelog — MediVille Manager

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [0.1.0] - 2026-10-23
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
