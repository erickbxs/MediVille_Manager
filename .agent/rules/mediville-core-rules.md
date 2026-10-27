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
- Ao atualizar a versão semântica ou concluir entregas de release, siga obrigatoriamente a Skill `release-e-deploy-web` executando `npm run sync:version`, deploy no Cloudflare Pages (`wrangler pages deploy dist`) e commit/push no Git.
- **PASSO 0 (ANTES DE QUALQUER MUDANÇA)**: Sempre execute `npm run checkpoint:save` antes de iniciar edições de um novo prompt, criando um ponto de restauração imediato. Caso o usuário peça para voltar atrás, execute `npm run rollback`.
