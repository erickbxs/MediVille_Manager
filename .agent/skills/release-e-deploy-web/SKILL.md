---
name: release-e-deploy-web
description: Ativa OBRIGATORIAMENTE toda vez que uma versão do projeto for incrementada, ao concluir um prompt de evolução ou quando o usuário pedir para atualizar/publicar a página web.
---
# Skill: Pipeline Obrigatório de Release, Cache-Busting PWA e Deploy Web

Sempre que finalizar uma entrega ou atualizar a versão do **MediVille Manager**, execute rigorosamente todos os 7 passos abaixo antes de encerrar sua resposta:

1. **Sincronização de Versão (`package.json`)**:
   - Incremente o campo `"version"` no `package.json` (ex.: `1.9.0`, `1.10.0`, etc.).
   - Certifique-se de que nenhum arquivo em `src/` ou `index.html` tenha número de versão hardcoded; toda a UI deve exibir a constante injetada `__APP_VERSION__`.
2. **Atualização do Cache do Service Worker (`public/sw.js`)**:
   - Atualize a constante `CACHE_NAME = 'mediville-cache-v' + version` em `public/sw.js` com a exata mesma versão do `package.json` (executando `npm run sync:version`).
   - Mantenha `self.skipWaiting()`, `clients.claim()`, exclusão de caches de versões anteriores no evento `activate` e estratégia **Network-First** para `index.html`, `.js` e `.css`.
3. **Documentação no `CHANGELOG.md`**:
   - Adicione a seção da nova versão no topo do `CHANGELOG.md` com a data atual e todos os itens adicionados/corrigidos.
4. **Verificação de Qualidade (`npm run verify`)**:
   - Execute `npm run verify` (`tsc`, `eslint`, `vitest`, `build` e `check-bundle`) e corrija qualquer erro até obter 100% de aprovação.
5. **Commit e Push no Git**:
   - Execute `git add .` e `git commit -m "chore(release): publica versao vX.Y.Z"` (e `git push origin main` se houver repositório remoto configurado).
6. **Deploy Online Obrigatório no Cloudflare Pages**:
   - Execute o deploy na branch de produção (`master`) para atualizar o domínio raiz `https://mediville-manager.pages.dev` e na branch (`main`) para o alias:
     `npx wrangler pages deploy dist --project-name=mediville-manager --branch=master`
     `npx wrangler pages deploy dist --project-name=mediville-manager --branch=main`
   - Ou simplesmente execute `npm run deploy` que orquestra verificação completa e ambos os deploys automaticamente.
7. **Relatório Final de Entrega**:
   - Informe ao usuário a nova versão publicada, a URL de produção/preview gerada pelo Cloudflare Pages e o resultado dos testes.
