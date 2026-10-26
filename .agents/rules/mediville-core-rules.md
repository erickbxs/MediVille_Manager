---
description: Regras arquiteturais e de código limpo obrigatórias em todas as tarefas do MediVille Manager.
---
# Regras Globais — MediVille Manager
- Todo arquivo `.ts` criado ou editado DEVE iniciar com um bloco de comentário no topo contendo: caminho do arquivo, explicação curta do que ele faz e a lista exata de arquivos que ele importa ou com os quais se conecta.
- Todo arquivo `.json` DEVE conter no topo um objeto `"_meta"` com os campos `"description"` e `"connectedFiles"`.
- TypeScript estrito: zero `any`, zero variáveis globais e cada função com uma responsabilidade e até 30-35 linhas.
- Nenhum número fixo no código; leia parâmetros de `src/data/balance.json`.
- A simulação (`src/core/`, `src/systems/`) deve permanecer 100% separada do desenho (`src/render/`, `src/ui/`) comunicando-se via `EventBus`.
- Nunca escreva strings visíveis ao usuário fixas no código: use sempre `t('chave')` do sistema `i18n` (`pt.json`, `es.json`, `en.json`).
- Sempre rode `npm run verify` ao finalizar qualquer alteração e corrija todos os erros antes de entregar.
