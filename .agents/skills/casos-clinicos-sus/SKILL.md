---
name: casos-clinicos-sus
description: Ativa sempre que o usuário pedir para adicionar, editar ou revisar casos clínicos, doenças, medicamentos da farmácia RENAME ou Enciclopédia SUS.
---
# Skill: Especialista em Casos Clínicos SUS & RENAME
Sempre que criar ou editar casos clínicos em `src/data/cases.json` ou `src/data/clinical-cases.json`:
1. Use exclusivamente fontes oficiais: RENAME, protocolos do Ministério da Saúde, bulas da ANVISA e diretrizes da OMS, citando a fonte e a data de consulta.
2. Utilize apenas nomes genéricos de medicamentos, NUNCA inclua cálculo de dose e NUNCA use marcas comerciais.
3. Verifique se todos os medicamentos exigidos na conduta existem em `src/data/pharmacy.json` para manter 100% de integridade referencial e não quebrar a Auto-Resolução (`masteredCaseIds`).
4. Inclua explicação educativa curta após cada decisão explicando o porquê da conduta.
5. Mantenha o objeto `"_meta"` no topo do JSON e escreva testes unitários no Vitest validando que não há IDs duplicados nem medicamentos inexistentes.
