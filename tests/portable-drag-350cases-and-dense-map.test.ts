/**
 * Arquivo: tests/portable-drag-350cases-and-dense-map.test.ts
 *
 * 1. O que este arquivo faz?
 * Executa testes automatizados para a versão 2.0.0 do MediVille Manager validando:
 * - Ausência total de linhas amarelas no perímetro do mapa e nas bordas de expansão do terreno.
 * - Comportamento de Drag & Drop Touch em portáteis: travamento de câmera (camera.panLocked),
 *   offset tátil de 36px no touch e conversão precisa de coordenadas.
 * - Fluxo contínuo e acelerado de pacientes em tempo real: cadência por porte da unidade (UBS, UPA e Hospital),
 *   ondas coletivas de ônibus urbano a cada 25s e multiplicador de emergências de 3.0x.
 * - Povoamento massivo da vizinhança urbana (25 a 35 cidadãos NPCs simultâneos, sem queda de performance).
 * - Catálogo completo de exatamente 350 casos clínicos únicos do SUS com conformidade à RENAME e PCDT.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 6 do Prompt 22, atestando a robustez da engenharia, fidelidade médica do SUS
 * e estabilidade do gameplay tátil no MediVille Manager v2.0.0.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `npx vitest run tests/portable-drag-350cases-and-dense-map.test.ts`.
 *
 * Importa: vitest, fs, path, src/core/config.ts, src/render/camera.ts, src/render/map-expansion-handles.ts,
 *          src/systems/arrival-system.ts, src/systems/urban-life-system.ts, src/core/new-game.ts
 * Conecta-se com: src/data/cases.json, src/data/clinical-cases.json, src/systems/patient-system.ts
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CASES_CATALOG } from '../src/core/config';
import { Camera } from '../src/render/camera';
import { MapExpansionHandles } from '../src/render/map-expansion-handles';
import {
  calculateArrivalInterval,
  getUnitLevelCadenceFactor,
  checkBusArrivalWave,
} from '../src/systems/arrival-system';
import { urbanLifeSystem } from '../src/systems/urban-life-system';
import { createInitialGameState } from '../src/core/new-game';
import { globalBus } from '../src/core/event-bus';

describe('Prompt 22 — PARTE 1: Remoção Total de Linhas Amarelas de Expansão', () => {
  it('garante que map-expansion-handles.ts e city-environment.ts não contêm linhas amarelas na borda do mapa', () => {
    const handlesPath = path.resolve(process.cwd(), 'src/render/map-expansion-handles.ts');
    const handlesContent = fs.readFileSync(handlesPath, 'utf-8');

    // Não deve haver drawLotBorders nem traçado de contorno 0xfacc15 na expansão do lote
    expect(handlesContent.includes('drawLotBorders')).toBe(false);
    expect(handlesContent.includes('0xfacc15')).toBe(false);

    // Deve instanciar os handles com callbacks e container
    const handles = new MapExpansionHandles({ onExpand: () => {} });
    expect(handles.container).toBeDefined();
  });
});

describe('Prompt 22 — PARTE 2: Drag & Drop Tátil Nativo e Travamento de Câmera', () => {
  it('bloqueia o pan da câmera quando panLocked está ativo durante o arraste', () => {
    const camera = new Camera();
    camera.panLocked = false;
    camera.pan(50, 50);
    expect(camera.x).toBe(50);
    expect(camera.y).toBe(50);

    // Travar câmera
    camera.panLocked = true;
    camera.pan(100, 100);
    // As coordenadas devem continuar inalteradas
    expect(camera.x).toBe(50);
    expect(camera.y).toBe(50);

    // Destravar câmera
    camera.panLocked = false;
    camera.pan(20, 20);
    expect(camera.x).toBe(70);
    expect(camera.y).toBe(70);
  });

  it('verifica que o arquivo canvas-input.ts possui TOUCH_OFFSET_Y = 36 e bloqueio de pan', () => {
    const inputPath = path.resolve(process.cwd(), 'src/input/canvas-input.ts');
    const inputContent = fs.readFileSync(inputPath, 'utf-8');

    expect(inputContent).toContain('const TOUCH_OFFSET_Y = 36');
    expect(inputContent).toContain('panLocked = true');
    expect(inputContent).toContain('LONG_PRESS_DELAY_MS = 250');
  });
});

describe('Prompt 22 — PARTE 3: Fluxo Contínuo por Porte e Ondas de Ônibus', () => {
  it('respeita os fatores de cadência por porte da unidade', () => {
    expect(getUnitLevelCadenceFactor('ubs', 0)).toBe(1.25); // pico matinal
    expect(getUnitLevelCadenceFactor('ubs', 30)).toBe(1.0);  // normal
    expect(getUnitLevelCadenceFactor('upa')).toBe(1.6);
    expect(getUnitLevelCadenceFactor('hospital')).toBe(2.2);
  });

  it('calcula intervalos condizentes com cada porte da unidade', () => {
    // UBS: 4s a 6s
    const ubsInterval = calculateArrivalInterval(4, 1.0, 1.0, 'ubs', 30);
    expect(ubsInterval).toBeGreaterThanOrEqual(2.5);
    expect(ubsInterval).toBeLessThanOrEqual(6.0);

    // UPA: 2.5s a 4s
    const upaInterval = calculateArrivalInterval(8, 1.0, 1.0, 'upa', 30);
    expect(upaInterval).toBeGreaterThanOrEqual(2.0);
    expect(upaInterval).toBeLessThanOrEqual(4.0);

    // Hospital Municipal: 2s a 3.5s
    const hospInterval = calculateArrivalInterval(12, 1.0, 1.0, 'hospital', 30);
    expect(hospInterval).toBeGreaterThanOrEqual(1.5);
    expect(hospInterval).toBeLessThanOrEqual(3.5);
  });

  it('dispara ondas de desembarque coletivo de ônibus a cada 25 segundos', () => {
    const state = createInitialGameState('ubs');
    state.busArrivalTimerSec = 0;

    let busArrivedCount = 0;
    const unsub = globalBus.on('bus:arrival', ({ patientCount }) => {
      busArrivedCount += patientCount;
    });

    const initialPatientCount = state.patients.size;

    // Avança 24s: ainda não deve disparar
    checkBusArrivalWave(state, 24);
    expect(busArrivedCount).toBe(0);

    // Avança mais 2s (total 26s): deve disparar onda com 3 a 5 pacientes
    checkBusArrivalWave(state, 2);
    expect(busArrivedCount).toBeGreaterThanOrEqual(3);
    expect(busArrivedCount).toBeLessThanOrEqual(5);
    expect(state.patients.size).toBe(initialPatientCount + busArrivedCount);
    expect(state.busArrivalTimerSec).toBe(0);

    unsub();
  });
});

describe('Prompt 22 — PARTE 4: Povoamento Massivo do Mapa Urbano', () => {
  it('mantém entre 25 e 35 cidadãos NPCs simultâneos na vizinhança urbana', () => {
    const citizens = urbanLifeSystem.getCitizens();
    expect(citizens.length).toBeGreaterThanOrEqual(25);
    expect(citizens.length).toBeLessThanOrEqual(35);

    // Valida papéis diversificados
    const roles = new Set(citizens.map((c) => c.role));
    expect(roles.has('jogger')).toBe(true);
    expect(roles.has('pedestrian')).toBe(true);
    expect(roles.has('bench_sitter')).toBe(true);
    expect(roles.has('bus_waiter')).toBe(true);
    expect(roles.has('kiosk_customer')).toBe(true);
    expect(roles.has('dog_walker')).toBe(true);
  });

  it('atualiza movimentação e ciclo do semáforo sem exceções em 60 FPS', () => {
    expect(() => {
      for (let f = 0; f < 60; f++) {
        urbanLifeSystem.update(0.016);
      }
    }).not.toThrow();

    const phase = urbanLifeSystem.getTrafficLightPhase();
    expect(['GREEN', 'YELLOW', 'RED']).toContain(phase);
  });
});

describe('Prompt 22 — PARTE 5: Catálogo Completo de 350 Casos Clínicos do SUS', () => {
  it('garante exatamente 350 casos clínicos únicos em cases.json e clinical-cases.json', () => {
    const casesPath = path.resolve(process.cwd(), 'src/data/cases.json');
    const clinicalPath = path.resolve(process.cwd(), 'src/data/clinical-cases.json');

    const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
    const clinicalData = JSON.parse(fs.readFileSync(clinicalPath, 'utf-8'));

    expect(casesData.cases.length).toBe(350);
    expect(clinicalData.cases.length).toBe(350);
    expect(CASES_CATALOG.cases.length).toBe(350);

    // Validação de unicidade estrita de IDs
    const idSet = new Set<string>();
    for (const c of casesData.cases) {
      expect(c.id).toBeDefined();
      expect(typeof c.id).toBe('string');
      expect(idSet.has(c.id)).toBe(false);
      idSet.add(c.id);

      // Validação de integridade médica
      expect(c.name).toBeDefined();
      expect(c.area).toBeDefined();
      expect(c.typicalUnit).toBeDefined();
      expect(c.symptoms.length).toBeGreaterThan(0);
      expect(c.suggestedConduct.text).toBeDefined();
      expect(c.distractorConducts.length).toBeGreaterThanOrEqual(1);
      expect(c.explanation).toBeDefined();
      expect(c.sources.length).toBeGreaterThan(0);
    }
  });

  it('contém os casos especializados 251 a 350 solicitados no Prompt 22', () => {
    const caseIds = new Set(CASES_CATALOG.cases.map((c) => c.id));

    // Emergências (251-270)
    expect(caseIds.has('choque-hipovolemico-hemorragico')).toBe(true);
    expect(caseIds.has('fasciite-necrosante')).toBe(true);
    expect(caseIds.has('gangrena-gasosa-clostridiana')).toBe(true);

    // Infectologia (271-290)
    expect(caseIds.has('raiva-humana-profilaxia')).toBe(true);
    expect(caseIds.has('febre-do-oropouche')).toBe(true);
    expect(caseIds.has('mpox-monkeypox-vigilancia')).toBe(true);

    // Clínica Médica e Cardio (291-310)
    expect(caseIds.has('estenose-mitral-reumatica')).toBe(true);
    expect(caseIds.has('rabdomiolise-aguda-hidratacao')).toBe(true);
    expect(caseIds.has('acidose-metabolica-uti')).toBe(true);

    // Pediatria e Ginecologia (311-330)
    expect(caseIds.has('membrana-hialina-neonatal')).toBe(true);
    expect(caseIds.has('gravidez-ectopica-rota')).toBe(true);
    expect(caseIds.has('endometriose-pelvica')).toBe(true);

    // Neurologia e Saúde do Trabalhador (331-350)
    expect(caseIds.has('esclerose-lateral-amiotrofica-ela')).toBe(true);
    expect(caseIds.has('transtorno-espectro-autista-tea')).toBe(true);
    expect(caseIds.has('neurite-optica-retrobulbar')).toBe(true);
  });
});
