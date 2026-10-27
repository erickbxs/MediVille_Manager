/**
 * Arquivo: src/core/urban-geometry.ts
 *
 * 1. O que este arquivo faz?
 * Atua como fonte única de verdade geométrica para o entorno urbano do hospital, calculando coordenadas
 * precisas para a avenida, faixas de tráfego, paradas de ônibus, baia do SAMU, calçadas e limites do terreno.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 23, eliminando números mágicos e garantindo que ao expandir a grade (12 -> 16 -> 20 -> 24),
 * tanto os sistemas visuais (PixiJS) quanto lógicos (tráfego, NPCs, waypoints de pacientes) leiam a mesma geometria urbana.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ajuste as constantes proporcionais (SIDEWALK_GAP, AVENUE_HEIGHT, etc.) e valide com tests/traffic-expansion-pinch-and-inspector.test.ts.
 *
 * Importa: src/render/theme-config.ts
 * Conecta-se com: src/render/city-environment.ts, src/systems/traffic-system.ts, src/systems/urban-life-system.ts,
 *                 src/systems/npc-movement-system.ts, src/systems/arrival-system.ts
 */

import { THEME } from '../render/theme-config';

export interface UrbanGeometry {
  gridSize: number;
  tileSize: number;
  hospitalBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    widthPx: number;
    heightPx: number;
  };
  street: {
    roadCenterY: number;
    laneEastboundY: number;
    laneWestboundY: number;
    roadStartX: number;
    roadEndX: number;
    curbY: number;
    crosswalkX: number;
    avenueY: number;
    avenueH: number;
  };
  stops: {
    patientDropOffX: number;
    patientDropOffY: number;
    busStopX: number;
    busStopY: number;
    samuBayX: number;
    samuBayY: number;
    hospitalEntranceX: number;
    hospitalEntranceY: number;
  };
  surroundings: {
    sidewalkTopY: number;
    sidewalkBottomY: number;
    sidewalkH: number;
    oppositeSidewalkY: number;
    parkingLotBounds: { minX: number; maxX: number; minY: number; maxY: number };
    gardenBounds: { minX: number; maxX: number; minY: number; maxY: number };
    backParkBounds: { minX: number; maxX: number; minY: number; maxY: number };
  };
}

const DEFAULT_GRID_SIZE = 12;
const HALF_DIVISOR = 2;
const SIDEWALK_GAP = 16;
const SIDEWALK_HEIGHT = 36;
const ROAD_GAP = 4;
const AVENUE_HEIGHT = 100;
const LANE_EAST_OFFSET = 28;
const LANE_WEST_OFFSET = 74;
const SAMU_BAY_X = -130;
const SAMU_BAY_Y_OFFSET = 14;
const BUS_STOP_OFFSET_X = 180;
const BUS_STOP_Y_OFFSET = 4;
const BUS_STOP_BORDER_MARGIN = 40;
const ENTRANCE_OFFSET_Y = 12;
const CROSSWALK_OFFSET_X = 20;
const WORLD_EXTENT = 2400;
const PARKING_WIDTH = 300;
const PARKING_MARGIN_X = 20;
const GARDEN_WIDTH = 220;
const GARDEN_MARGIN_X = 24;
const GARDEN_MARGIN_Y = 20;
const PARK_HEIGHT = 180;

function buildStreetData(widthPx: number, heightPx: number): {
  street: UrbanGeometry['street'];
  sidewalkTopY: number;
  sidewalkBottomY: number;
  oppositeSidewalkY: number;
} {
  const sidewalkTopY = heightPx + SIDEWALK_GAP;
  const sidewalkBottomY = sidewalkTopY + SIDEWALK_HEIGHT;
  const avenueY = sidewalkBottomY + ROAD_GAP;
  const avenueH = AVENUE_HEIGHT;
  const roadCenterY = avenueY + avenueH / HALF_DIVISOR;
  const laneEastboundY = avenueY + LANE_EAST_OFFSET;
  const laneWestboundY = avenueY + LANE_WEST_OFFSET;
  const oppositeSidewalkY = avenueY + avenueH + ROAD_GAP;
  const crosswalkX = widthPx / HALF_DIVISOR - CROSSWALK_OFFSET_X;

  return {
    street: {
      roadCenterY,
      laneEastboundY,
      laneWestboundY,
      roadStartX: -WORLD_EXTENT,
      roadEndX: widthPx + WORLD_EXTENT,
      curbY: sidewalkBottomY,
      crosswalkX,
      avenueY,
      avenueH,
    },
    sidewalkTopY,
    sidewalkBottomY,
    oppositeSidewalkY,
  };
}

function buildSurroundingsData(
  widthPx: number,
  heightPx: number,
  sidewalkTopY: number,
  sidewalkBottomY: number,
  oppositeSidewalkY: number
): UrbanGeometry['surroundings'] {
  return {
    sidewalkTopY,
    sidewalkBottomY,
    sidewalkH: SIDEWALK_HEIGHT,
    oppositeSidewalkY,
    parkingLotBounds: {
      minX: -PARKING_WIDTH - PARKING_MARGIN_X,
      maxX: -PARKING_MARGIN_X,
      minY: 0,
      maxY: heightPx,
    },
    gardenBounds: {
      minX: widthPx + GARDEN_MARGIN_X,
      maxX: widthPx + GARDEN_MARGIN_X + GARDEN_WIDTH,
      minY: GARDEN_MARGIN_Y,
      maxY: heightPx,
    },
    backParkBounds: {
      minX: -PARKING_WIDTH,
      maxX: widthPx + GARDEN_WIDTH,
      minY: -PARK_HEIGHT,
      maxY: 0,
    },
  };
}

export function getUrbanGeometry(gridSize = DEFAULT_GRID_SIZE, tileSize = THEME.tileSize): UrbanGeometry {
  const widthPx = gridSize * tileSize;
  const heightPx = gridSize * tileSize;
  const { street, sidewalkTopY, sidewalkBottomY, oppositeSidewalkY } = buildStreetData(widthPx, heightPx);

  return {
    gridSize,
    tileSize,
    hospitalBounds: {
      minX: 0,
      minY: 0,
      maxX: widthPx,
      maxY: heightPx,
      widthPx,
      heightPx,
    },
    street,
    stops: {
      patientDropOffX: street.crosswalkX,
      patientDropOffY: street.laneEastboundY,
      busStopX: Math.min(widthPx - BUS_STOP_BORDER_MARGIN, street.crosswalkX + BUS_STOP_OFFSET_X),
      busStopY: sidewalkTopY + BUS_STOP_Y_OFFSET,
      samuBayX: SAMU_BAY_X,
      samuBayY: sidewalkTopY + SAMU_BAY_Y_OFFSET,
      hospitalEntranceX: street.crosswalkX,
      hospitalEntranceY: heightPx - ENTRANCE_OFFSET_Y,
    },
    surroundings: buildSurroundingsData(widthPx, heightPx, sidewalkTopY, sidewalkBottomY, oppositeSidewalkY),
  };
}
