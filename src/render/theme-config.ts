/**
 * Arquivo: src/render/theme-config.ts
 * O que faz: Exporta as constantes de estilo visual, cores claras/escuras e dimensões do canvas lidas de src/data/theme.json.
 * Para que foi criado: Isolar parâmetros puramente estéticos das regras de simulação.
 * Como modificar/debugar: Ajuste as cores ou tamanhos em src/data/theme.json.
 * Importa: src/data/theme.json
 * Conecta-se com: src/render/renderer.ts, src/render/grid-view.ts, src/render/rooms-view.ts
 */

import themeRaw from '../data/theme.json';

export interface ThemePalette {
  background: string;
  gridFill: string;
  gridLine: string;
  text: string;
  selection: string;
  ghostValid: string;
  ghostInvalid: string;
  patientCalm: string;
  patientWorried: string;
  patientAngry: string;
  patientOutline: string;
  progressTrack: string;
  progressFill: string;
  positive: string;
  negative: string;
}

export interface ThemeConfig {
  tileSize: number;
  maxResolution: number;
  textResolution: number;
  fontFamily: string;
  room: {
    inset: number;
    cornerRadius: number;
    borderWidth: number;
    fillAlpha: number;
    labelFontSize: number;
    labelTop: number;
    selectionWidth: number;
  };
  grid: {
    cornerRadius: number;
    lineWidth: number;
  };
  patient: {
    radius: number;
    spacing: number;
    padding: number;
    labelOffset: number;
    outlineWidth: number;
    badgeFontSize: number;
    badgeOffsetY: number;
    worriedRatio: number;
    angryRatio: number;
    progressHeight: number;
    progressMargin: number;
  };
  ghost: {
    alpha: number;
    borderWidth: number;
    fontSize: number;
  };
  palettes: {
    light: ThemePalette;
    dark: ThemePalette;
  };
}

export const THEME: ThemeConfig = themeRaw as unknown as ThemeConfig;
