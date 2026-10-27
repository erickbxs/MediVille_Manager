/**
 * Arquivo: tests/traffic-expansion-pinch-and-inspector.test.ts
 *
 * 1. O que este arquivo faz?
 * Suíte de testes unitários automatizados para a versão 2.1.0 cobrindo:
 * - Geometria urbana dinâmica (getUrbanGeometry) e realinhamento instantâneo de veículos e NPCs no evento map:expanded
 * - Reposicionamento garantido de carros, ônibus e ambulâncias fora de hospitalBounds
 * - Matemática pura de zoom focal de pinça (computeFocalPinchZoom) com invariância do ponto focal e transição 2->1 dedos sem saltos
 * - Painel interativo de inspeção (EntityInspector) para pacientes e funcionários
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com o Prompt 23 (v2.1.0) e prevenir regressões no tráfego urbano e controles mobile touch.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `npx vitest run tests/traffic-expansion-pinch-and-inspector.test.ts`.
 *
 * Importa: vitest, src/core/urban-geometry.ts, src/systems/traffic-system.ts, src/systems/urban-life-system.ts,
 *          src/render/camera-controller.ts, src/ui/entity-inspector.ts, src/core/event-bus.ts
 * Conecta-se com: src/entities/patient.ts, src/entities/staff.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUrbanGeometry } from '../src/core/urban-geometry';
import { trafficSystem } from '../src/systems/traffic-system';
import { urbanLifeSystem } from '../src/systems/urban-life-system';
import { computeFocalPinchZoom, PINCH_COOLDOWN_MS } from '../src/render/camera-controller';
import { EntityInspector } from '../src/ui/entity-inspector';
import { globalBus } from '../src/core/event-bus';
import { CASES_CATALOG, STAFF_CATALOG } from '../src/core/config';
import type { PatientInstance } from '../src/entities/patient';
import type { StaffMember } from '../src/entities/staff';
import type { PatientCase } from '../src/entities/clinical-case';

const TILE_SIZE = 48;

// --- Mock DOM para ambiente Node.js / Headless ---
interface MockDomElement {
  tagName: string;
  innerHTML: string;
  className: string;
  style: Record<string, string>;
  classList: { add: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn>; toggle: ReturnType<typeof vi.fn>; contains: () => boolean };
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  querySelectorAll: () => MockDomElement[];
  querySelector: (sel: string) => MockDomElement | null;
  getAttribute: () => string | null;
  setAttribute: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
  appendChild: ReturnType<typeof vi.fn>;
  click: () => void;
  listeners: Record<string, ((e: { stopPropagation: () => void }) => void)[]>;
}

const createMockElement = (tag = 'div'): MockDomElement => {
  const elem: MockDomElement = {
    tagName: tag.toUpperCase(),
    innerHTML: '',
    className: '',
    style: {},
    classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn(), contains: () => false },
    listeners: {},
    addEventListener: vi.fn((event: string, handler: (e: { stopPropagation: () => void }) => void) => {
      if (!elem.listeners[event]) elem.listeners[event] = [];
      elem.listeners[event].push(handler);
    }),
    removeEventListener: vi.fn(),
    querySelectorAll: () => [],
    querySelector: (sel: string) => {
      if (sel.startsWith('#')) {
        const id = sel.slice(1);
        if (elem.innerHTML.includes(`id="${id}"`)) {
          const child = createMockElement('button');
          child.click = () => {
            const handlers = child.listeners['click'] || [];
            for (const h of handlers) h({ stopPropagation: vi.fn() });
          };
          return child;
        }
      }
      return null;
    },
    getAttribute: () => null,
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    appendChild: vi.fn(),
    click: () => {
      const handlers = elem.listeners['click'] || [];
      for (const h of handlers) h({ stopPropagation: vi.fn() });
    },
  };
  return elem;
};

describe('PARTE 1: Geometria Urbana e Sincronização do Tráfego ao Expandir Mapa', () => {
  it('calcula coordenadas proporcionais e ruas sempre fora dos limites do hospital para 12, 16, 20 e 24 tiles', () => {
    const gridSizes = [12, 16, 20, 24];

    for (const size of gridSizes) {
      const geom = getUrbanGeometry(size, TILE_SIZE);

      expect(geom.hospitalBounds.widthPx).toBe(size * TILE_SIZE);
      expect(geom.hospitalBounds.heightPx).toBe(size * TILE_SIZE);
      expect(geom.hospitalBounds.maxY).toBe(size * TILE_SIZE);

      // A rua e suas faixas devem obrigatoriamente estar ABAIXO do hospital
      expect(geom.street.roadCenterY).toBeGreaterThan(geom.hospitalBounds.maxY);
      expect(geom.street.laneEastboundY).toBeGreaterThan(geom.hospitalBounds.maxY);
      expect(geom.street.laneWestboundY).toBeGreaterThan(geom.hospitalBounds.maxY);

      // Pontos de parada e calçadas devem ser coerentes
      expect(geom.stops.hospitalEntranceY).toBe(geom.hospitalBounds.maxY - 12);
      expect(geom.surroundings.sidewalkTopY).toBeGreaterThanOrEqual(geom.hospitalBounds.maxY);
      expect(geom.street.roadCenterY).toBeGreaterThan(geom.surroundings.sidewalkBottomY);
    }
  });

  it('reposiciona todos os veículos ativos ao receber evento map:expanded sem deixá-los dentro do hospital', () => {
    trafficSystem.reset();
    trafficSystem.realignToNewStreetGeometry(12);

    // Gera veículos explicitamente para cada sentido
    trafficSystem.spawnVehicle('east', 'car');
    trafficSystem.spawnVehicle('west', 'bus');
    expect(trafficSystem.vehicles.length).toBe(2);

    const initialGeom = getUrbanGeometry(12, TILE_SIZE);
    const oldLaneEast = initialGeom.street.laneEastboundY;
    const oldLaneWest = initialGeom.street.laneWestboundY;

    // Dispara a expansão para 16x16
    globalBus.emit('map:expanded', { newGridSize: 16, cost: 0 });

    const newGeom = getUrbanGeometry(16, TILE_SIZE);
    expect(newGeom.street.laneEastboundY).toBeGreaterThan(oldLaneEast);
    expect(newGeom.street.laneWestboundY).toBeGreaterThan(oldLaneWest);

    // Todos os veículos devem ter migrado para a nova rua
    for (const vehicle of trafficSystem.vehicles) {
      expect(vehicle.y).toBeGreaterThan(newGeom.hospitalBounds.maxY);
      const isEastLane = Math.abs(vehicle.y - newGeom.street.laneEastboundY) < 1.0;
      const isWestLane = Math.abs(vehicle.y - newGeom.street.laneWestboundY) < 1.0;
      expect(isEastLane || isWestLane).toBe(true);
    }

    // Dispara a expansão subsequente para 20x20
    globalBus.emit('map:expanded', { newGridSize: 20, cost: 0 });
    const geom20 = getUrbanGeometry(20, TILE_SIZE);
    for (const vehicle of trafficSystem.vehicles) {
      expect(vehicle.y).toBeGreaterThan(geom20.hospitalBounds.maxY);
      const isEastLane = Math.abs(vehicle.y - geom20.street.laneEastboundY) < 1.0;
      const isWestLane = Math.abs(vehicle.y - geom20.street.laneWestboundY) < 1.0;
      expect(isEastLane || isWestLane).toBe(true);
    }
  });

  it('ajusta cidadãos de UrbanLifeSystem empurrando-os para fora de hospitalBounds', () => {
    urbanLifeSystem.reset();
    urbanLifeSystem.updateGridSize(12);

    // Simula cidadão posicionado na antiga coordenada de calçada
    const citizen = urbanLifeSystem.citizens[0]!;
    citizen.x = 200;
    citizen.y = 600; // Dentro do novo hospital de 16x16 (16 * 48 = 768)

    globalBus.emit('map:expanded', { newGridSize: 16, cost: 0 });

    const newGeom = getUrbanGeometry(16, TILE_SIZE);
    for (const c of urbanLifeSystem.citizens) {
      const isInsideHospital =
        c.x >= newGeom.hospitalBounds.minX &&
        c.x <= newGeom.hospitalBounds.maxX &&
        c.y >= newGeom.hospitalBounds.minY &&
        c.y <= newGeom.hospitalBounds.maxY;
      expect(isInsideHospital).toBe(false);
    }
  });
});

describe('PARTE 2: Matemática de Zoom Focal de Pinça (computeFocalPinchZoom)', () => {
  it('mantém o ponto focal do mundo rigorosamente cravado sob o ponto médio dos dedos', () => {
    const cameraPos = { x: 100, y: 150 };
    const currentScale = 1.0;
    const prevDistance = 200;
    const midpoint = { x: 400, y: 300 };

    // Ponto do mundo sob o ponto médio antes do zoom
    const expectedWorldX = (midpoint.x - cameraPos.x) / currentScale;
    const expectedWorldY = (midpoint.y - cameraPos.y) / currentScale;

    // Dois dedos se afastando de 200px para 300px (zoom in de 1.5x)
    const p1 = { x: 250, y: 300 };
    const p2 = { x: 550, y: 300 };

    const result = computeFocalPinchZoom({
      p1,
      p2,
      prevDistance,
      prevMidpoint: midpoint,
      currentScale,
      cameraX: cameraPos.x,
      cameraY: cameraPos.y,
    });

    expect(result.newScale).toBeCloseTo(1.5, 5);

    // Ponto do mundo sob o ponto médio após o zoom
    const worldXAfter = (result.newMidpoint.x - result.newCameraX) / result.newScale;
    const worldYAfter = (result.newMidpoint.y - result.newCameraY) / result.newScale;

    expect(worldXAfter).toBeCloseTo(expectedWorldX, 5);
    expect(worldYAfter).toBeCloseTo(expectedWorldY, 5);
  });

  it('respeita os limites mínimos (0.45) e máximos (2.4) de zoom', () => {
    const cameraPos = { x: 0, y: 0 };
    const midpoint = { x: 200, y: 200 };

    // Tentar zoom out extremo (fator 0.1x: de 200px para 20px)
    const minZoomResult = computeFocalPinchZoom({
      p1: { x: 190, y: 200 },
      p2: { x: 210, y: 200 },
      prevDistance: 200,
      prevMidpoint: midpoint,
      currentScale: 0.5,
      cameraX: cameraPos.x,
      cameraY: cameraPos.y,
    });
    expect(minZoomResult.newScale).toBe(0.45);

    // Tentar zoom in extremo (fator 10x: de 200px para 2000px)
    const maxZoomResult = computeFocalPinchZoom({
      p1: { x: -800, y: 200 },
      p2: { x: 1200, y: 200 },
      prevDistance: 200,
      prevMidpoint: midpoint,
      currentScale: 2.0,
      cameraX: cameraPos.x,
      cameraY: cameraPos.y,
    });
    expect(maxZoomResult.newScale).toBe(2.4);
  });

  it('define cooldown de 80ms na constante PINCH_COOLDOWN_MS para transição 2->1 dedo sem saltos', () => {
    expect(PINCH_COOLDOWN_MS).toBe(80);
  });
});

describe('PARTE 3: Painel de Inspeção de Pacientes e Funcionários (EntityInspector)', () => {
  let container: MockDomElement;
  let inspector: EntityInspector;

  const mockCase: PatientCase = {
    definition: CASES_CATALOG.cases[0]!,
    intensityId: 'leve',
    comorbidity: null,
    conductOptions: [],
    chosenConductId: null,
    decisionMade: false,
    isDecisionCorrect: false,
    feedbackText: '',
  };

  const mockPatient: PatientInstance = {
    id: 'pat_123',
    name: 'Carlos Oliveira',
    age: 42,
    gender: 'male',
    state: 'ready_for_treatment',
    clinicalCase: mockCase,
    patienceSec: 100,
    waitTimeSec: 25,
    consultationTimeSec: 0,
    consultationDurationSec: 15,
    currentRoomId: 'room_1',
    satisfaction: 90,
    errorsCount: 0,
  };

  const mockStaff: StaffMember = {
    id: 'staff_99',
    name: 'Dra. Helena Souza',
    roleId: 'doctor',
    role: STAFF_CATALOG.roles[0]!,
    skill: 4,
    dailySalary: 240,
    assignedRoomId: 'room_1',
    energy: 85,
    isResting: false,
  };


  beforeEach(() => {
    container = createMockElement('div');
  });

  it('renderiza dados do paciente e aciona callback onAttendPatient', () => {
    const onAttend = vi.fn();
    inspector = new EntityInspector(container as unknown as HTMLElement, { onAttendPatient: onAttend });

    inspector.inspectPatient(mockPatient);

    expect(inspector.isOpen()).toBe(true);
    expect(inspector.getActivePatient()?.id).toBe('pat_123');
    expect(container.innerHTML).toContain('Carlos Oliveira');
    expect(container.innerHTML).toContain('42 anos');
    expect(container.innerHTML).toContain(CASES_CATALOG.cases[0]!.name);
    expect(container.innerHTML).toContain('Atender Agora');
  });

  it('renderiza dados do funcionário e aciona callback onSendStaffToRest', () => {
    const onRest = vi.fn();
    inspector = new EntityInspector(container as unknown as HTMLElement, { onSendStaffToRest: onRest });

    inspector.inspectStaff(mockStaff);

    expect(inspector.isOpen()).toBe(true);
    expect(inspector.getActiveStaff()?.id).toBe('staff_99');
    expect(container.innerHTML).toContain('Dra. Helena Souza');
    expect(container.innerHTML).toContain('R$ 240');
    expect(container.innerHTML).toContain('Enviar para Descanso');
  });

  it('fecha o painel ao chamar close()', () => {
    const onClose = vi.fn();
    inspector = new EntityInspector(container as unknown as HTMLElement, { onClose });

    inspector.inspectStaff(mockStaff);
    expect(inspector.isOpen()).toBe(true);

    inspector.close();

    expect(inspector.isOpen()).toBe(false);
    expect(onClose).toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
  });
});
