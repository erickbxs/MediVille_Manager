/**
 * Arquivo: src/render/voxel-character.ts
 *
 * 1. O que este arquivo faz?
 * Atua como camada de integração e compatibilidade para renderização de personagens 3D no hospital,
 * conectando as chamadas legadas ao novo motor Character3D (volume arredondado, catchlight nos olhos,
 * oclusão ambiental e acessórios específicos dos 7 cargos e pacientes).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Manter 100% de retrocompatibilidade com a API anterior (tests, patients-view.ts) ao mesmo tempo em que
 * entrega a rica estética 3D sobre cenário 2.5D exigida pelo Prompt 15.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Configurações e comportamentos específicos de geometria e iluminação estão em src/render/character-3d.ts.
 *
 * Importa: pixi.js, src/render/character-3d.ts
 * Conecta-se com: src/render/patients-view.ts, src/render/character-3d.ts
 */

import { Container } from 'pixi.js';
import { Character3D, type Character3DConfig, type Character3DRole, type AnimationState } from './character-3d';

export type CharacterRole = Character3DRole;
export type { AnimationState };

export interface VoxelCharacterConfig extends Character3DConfig {
  role: CharacterRole;
}

export class VoxelCharacter {
  public container = new Container();
  public character3d: Character3D;
  public config: VoxelCharacterConfig;

  constructor(config: VoxelCharacterConfig) {
    this.config = config;
    this.character3d = new Character3D(config);
    this.container.addChild(this.character3d.container);
  }

  public get animState(): AnimationState {
    return this.character3d.animState;
  }

  public set animState(state: AnimationState) {
    this.character3d.animState = state;
  }

  public get facing(): 'left' | 'right' {
    return this.character3d.facing;
  }

  public set facing(direction: 'left' | 'right') {
    this.character3d.facing = direction;
  }

  public update(timeSec: number, animState?: AnimationState): void {
    this.character3d.config = this.config;
    this.character3d.update(timeSec, animState ?? this.animState);
  }
}
