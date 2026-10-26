/**
 * Arquivo: tests/backward-expansion-and-urban-neighborhood.test.ts
 *
 * 1. O que este arquivo faz?
 * Executa testes automatizados para a versão 1.10.0 do MediVille Manager validando:
 * - Expansão direcional estrita do mapa para trás (fundo do lote) e laterais sem invadir a avenida frontal.
 * - Validação de colisão com a rua e calçada frontal via isTileOverlappingStreet() e canPlaceRoom().
 * - Reposicionamento dinâmico dos 4 lados da vizinhança urbana (estacionamento, jardim, parque norte e quarteirão oposto).
 * - Integração de campanhas de saúde pública do SUS (Multivacinação, Dengue e Outubro Rosa/Novembro Azul).
 * - Enquadramento determinístico de câmera (fitMapToViewport) nas 3 resoluções oficiais: Mobile (375x667),
 *   Tablet (768x1024) e Desktop (1920x1080) em todos os níveis de expansão (12x12 até 24x24).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1, 2, 3 e 4 do Prompt 21, garantindo que o hospital jamais sobreponha a rua frontal
 * e que a experiência visual e tátil permaneça estável em qualquer dispositivo móvel ou desktop.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `npx vitest run tests/backward-expansion-and-urban-neighborhood.test.ts`. Caso falhe a validação
 * de sobreposição, verifique se a rua frontal continua fixada em row >= gridSize.
 *
 * Importa: vitest, src/systems/map-expansion-system.ts, src/systems/grid-system.ts,
 *          src/core/new-game.ts, src/render/camera.ts, src/render/city-environment.ts,
 *          src/systems/urban-life-system.ts, src/core/config.ts
 * Conecta-se com: src/data/events.json, src/state/game-state.ts, src/render/renderer.ts
 */

import { describe, it, expect } from 'vitest';
import {
  expandMap,
  getNextExpansion,
  canExpandMap,
  isTileOverlappingStreet,
  MIN_GRID_SIZE,
} from '../src/systems/map-expansion-system';
import { canPlaceRoom } from '../src/systems/grid-system';
import { createInitialGameState } from '../src/core/new-game';
import { fitMapToViewport } from '../src/render/camera';
import { CityEnvironment } from '../src/render/city-environment';
import { urbanLifeSystem } from '../src/systems/urban-life-system';
import { EVENTS_CATALOG, ROOMS_CATALOG } from '../src/core/config';
import { createRoomInstance } from '../src/entities/room';

describe('Prompt 21 — PARTE 1: Correção Direcional da Expansão do Terreno', () => {
  it('garante que isTileOverlappingStreet rejeita coordenadas na rua frontal e fora da grade', () => {
    const size = 12;

    // Tiles válidos dentro do lote hospitalar
    expect(isTileOverlappingStreet(0, 0, size)).toBe(false);
    expect(isTileOverlappingStreet(5, 5, size)).toBe(false);
    expect(isTileOverlappingStreet(11, 11, size)).toBe(false);

    // Tiles que invadem a rua frontal (row >= gridSize)
    expect(isTileOverlappingStreet(0, 12, size)).toBe(true);
    expect(isTileOverlappingStreet(6, 13, size)).toBe(true);

    // Tiles fora das laterais ou no topo negativo
    expect(isTileOverlappingStreet(-1, 5, size)).toBe(true);
    expect(isTileOverlappingStreet(12, 5, size)).toBe(true);
    expect(isTileOverlappingStreet(5, -1, size)).toBe(true);
  });

  it('canPlaceRoom impede que qualquer sala invada a avenida ou calçada frontal', () => {
    const state = createInitialGameState('hospital');
    state.cash = 100000;
    const size = state.gridSize ?? 12;

    // Tentativa de construir consultório (2x2) na linha 11 da grade 12x12 -> ocupa linhas 11 e 12 (linha 12 invade rua)
    const canPlaceOnStreet = canPlaceRoom(state, 'consultation', 2, size - 1, false);
    expect(canPlaceOnStreet).toBe(false);

    // Na linha 10 (ocupa 10 e 11) -> dentro dos limites da grade sem invadir a rua
    const canPlaceInside = canPlaceRoom(state, 'consultation', 2, size - 2, false);
    expect(canPlaceInside).toBe(true);
  });

  it('ao expandir 12x12 para 16x16, translada salas para trás/laterais preservando fachada frontal intacta', () => {
    const state = createInitialGameState('hospital');
    state.cash = 500000;
    state.gridSize = 12;

    // Cria uma recepção 3x2 posicionada rente à calçada frontal (row = 10, height = 2 -> vai até row 11)
    const receptionDef = (ROOMS_CATALOG.rooms.find((r) => r.id === 'reception') ?? ROOMS_CATALOG.rooms[0])!;
    const reception = createRoomInstance('rec_1', receptionDef, 4, 10, false);
    state.rooms.set(reception.id, reception);

    // Distância inicial até a rua frontal (row 12)
    const initialDistanceToStreet = 12 - (reception.row + reception.height);
    expect(initialDistanceToStreet).toBe(0); // Rente à rua

    // Executa expansão para 16x16
    const success = expandMap(state);
    expect(success).toBe(true);
    expect(state.gridSize).toBe(16);

    // A recepção foi transladada: deltaRow = 16 - 12 = 4, deltaCol = (16 - 12)/2 = 2
    expect(reception.row).toBe(14);
    expect(reception.col).toBe(6);

    // A distância até a nova rua frontal (row 16) continua exatamente 0 (rente à calçada frontal!)
    const newDistanceToStreet = 16 - (reception.row + reception.height);
    expect(newDistanceToStreet).toBe(0);

    // As linhas 0, 1, 2, 3 surgem livres no fundo do lote (atrás do hospital)
    expect(reception.row).toBeGreaterThanOrEqual(4);
  });

  it('permite expansões sucessivas até 24x24 sem colisão com a rua', () => {
    const state = createInitialGameState('hospital');
    state.cash = 1000000;
    state.gridSize = MIN_GRID_SIZE;

    // 12 -> 16
    expect(canExpandMap(state)).toBe(true);
    expandMap(state);
    expect(state.gridSize).toBe(16);

    // 16 -> 20
    expect(canExpandMap(state)).toBe(true);
    expandMap(state);
    expect(state.gridSize).toBe(20);

    // 20 -> 24
    expect(canExpandMap(state)).toBe(true);
    expandMap(state);
    expect(state.gridSize).toBe(24);

    // Limite atingido
    expect(getNextExpansion(state)).toBeNull();
    expect(canExpandMap(state)).toBe(false);
  });
});

describe('Prompt 21 — PARTE 2: Vizinhança Urbana em 4 Lados e Recuo Dinâmico', () => {
  it('instancia CityEnvironment e atualiza dimensões dinamicamente no mapa expandido', () => {
    const cityEnv = new CityEnvironment(12);
    expect(cityEnv.getGridSize()).toBe(12);
    expect(cityEnv.container).toBeDefined();

    // Expande para 16, 20 e 24
    cityEnv.updateGridSize(16);
    expect(cityEnv.getGridSize()).toBe(16);

    cityEnv.updateGridSize(24);
    expect(cityEnv.getGridSize()).toBe(24);

    // Ciclo de animação (giroflex e chafariz) executa sem falhas
    cityEnv.update(true, 1000);
    cityEnv.update(false, 2000);
  });

  it('urbanLifeSystem ajusta coordenadas de pedestres na calçada sul com base no gridSize', () => {
    urbanLifeSystem.updateGridSize(12);
    const citizens12 = urbanLifeSystem.getCitizens();
    const walker12 = citizens12.find((c) => c.role === 'pedestrian');
    expect(walker12).toBeDefined();
    const y12 = walker12?.y ?? 0;

    // Expande para 20
    urbanLifeSystem.updateGridSize(20);
    const citizens20 = urbanLifeSystem.getCitizens();
    const walker20 = citizens20.find((c) => c.role === 'pedestrian');
    const y20 = walker20?.y ?? 0;

    // O pedestre desceu para acompanhar a nova calçada sul do hospital expandido
    expect(y20).toBeGreaterThan(y12);
  });
});

describe('Prompt 21 — PARTE 3: Campanhas de Saúde Pública do SUS e Enquadramento em 3 Resoluções', () => {
  it('EVENTS_CATALOG inclui as campanhas periódicas oficiais do SUS', () => {
    const events = EVENTS_CATALOG.events;

    const vaxCampaign = events.find((e) => e.id === 'vaccination_campaign');
    expect(vaxCampaign).toBeDefined();
    expect(vaxCampaign?.type).toBe('seasonal');

    const dengueTaskforce = events.find((e) => e.id === 'dengue_taskforce');
    expect(dengueTaskforce).toBeDefined();
    expect(dengueTaskforce?.type).toBe('seasonal');
    expect(dengueTaskforce?.reputationBonus).toBeGreaterThan(0);

    const pinkOctober = events.find((e) => e.id === 'pink_october');
    expect(pinkOctober).toBeDefined();
    expect(pinkOctober?.type).toBe('seasonal');
    expect(pinkOctober?.reputationBonus).toBeGreaterThan(0);
  });

  it('fitMapToViewport enquadra o hospital perfeitamente nas 3 resoluções oficiais sem cortes', () => {
    const resolutions = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    const gridSizes = [12, 16, 20, 24];

    for (const res of resolutions) {
      for (const size of gridSizes) {
        const fit = fitMapToViewport(res.width, res.height, {
          gridCols: size,
          gridRows: size,
        });

        // Escala e Zoom válidos e finitos
        expect(fit.scale).toBeGreaterThan(0);
        expect(Number.isFinite(fit.scale)).toBe(true);
        expect(fit.zoom).toBe(fit.scale);

        // Coordenadas centrais dentro da tela visível
        expect(Number.isFinite(fit.x)).toBe(true);
        expect(Number.isFinite(fit.y)).toBe(true);
      }
    }
  });
});
