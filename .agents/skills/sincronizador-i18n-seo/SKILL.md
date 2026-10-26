---
name: sincronizador-i18n-seo
description: Ativa sempre que o usuário pedir traduções, correção de mudança de idioma, textos da interface ou páginas estáticas de SEO.
---
# Skill: Sincronizador Global de Idiomas (i18n) e SEO
Sempre que criar novos textos na interface ou mexer em idiomas:
1. Adicione a chave correspondente simultaneamente em `src/i18n/pt.json`, `src/i18n/es.json` e `src/i18n/en.json` mantendo os termos médicos corretos em cada língua.
2. Certifique-se de que o componente escuta o evento `i18n:changed` no `EventBus` (ou é atualizado por `refreshAppLanguage()`) para trocar o idioma da tela inteira instantaneamente sem recarregar a página.
3. Nas páginas estáticas de SEO (`/pt/`, `/es/`, `/en/`), valide: uma única tag `<h1>` por página, `<title>` até 60 caracteres, `<meta name="description">` até 155 caracteres, tags `canonical` e `hreflang`, e `Schema.org`.
