---
name: auditor-ui-mobile-canvas
description: Ativa sempre que o usuário pedir melhorias visuais, gráficos 2.5D/3D no PixiJS, ajustes de layout, responsividade para celular/tablet, construção na grade ou correção de bugs visuais.
---
# Skill: Auditor de UI Mobile, Construção Tátil e Renderização PixiJS
Sempre que modificar `src/ui/` ou `src/render/`:
1. Garanta que todos os botões interativos tenham área mínima de toque de `44x44px` e contraste mínimo de `4,5:1`.
2. Evite qualquer corte de abas ou subtipos: use `shrink-0` em abas, `min-h-0` em containers flexíveis roláveis e o utilitário de rolagem horizontal com roda do mouse (`wheel`) e setas do teclado.
3. No modo de construção mobile/tablet, preserve o fluxo de pré-visualização (`BUILD_PREVIEW`) com setas de ajuste fino e botão de confirmação para evitar posicionamento acidental pelo toque.
4. No PixiJS v8, chame sempre `.moveTo(x, y)` antes de `.arc()` ou `.lineTo()` para evitar linhas espúrias ligadas ao ponto `(0,0)`, ative `roundPixels: true` e limpe objetos com `.destroy({ children: true })`.
5. Teste o layout nas resoluções mobile (`375x667`), tablet (`768x1024`) e desktop (`1920x1080`).
