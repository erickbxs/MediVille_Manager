/**
 * Arquivo: src/render/traffic-view.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza a frota de veículos procedurais Voxel 2.5D na avenida frontal do hospital, sincronizando as posições,
 * faróis noturnos, sirenes de emergência e animação de portas de desembarque de passageiros a partir do TrafficSystem.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Camada visual desacoplada que representa o tráfego da cidade no canvas PixiJS v8.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para testar posições ou adicionar animações de escapamento/rodas, ajuste update() ou renderVehicles().
 *
 * Importa: pixi.js, src/render/voxel-vehicles.ts, src/systems/traffic-system.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container } from 'pixi.js';
import { VoxelVehicle } from './voxel-vehicles';
import type { TrafficVehicleInstance } from '../systems/traffic-system';

export class TrafficView {
  public container = new Container();
  private vehicleMap = new Map<string, VoxelVehicle>();

  public render(vehicles: TrafficVehicleInstance[], timeSec: number, isNight = false): void {
    const activeIds = new Set(vehicles.map((v) => v.id));

    // Remove veículos que saíram de cena
    for (const [id, voxel] of this.vehicleMap.entries()) {
      if (!activeIds.has(id)) {
        this.container.removeChild(voxel.container);
        voxel.container.destroy({ children: true });
        this.vehicleMap.delete(id);
      }
    }

    // Atualiza ou cria instâncias visuais
    for (const v of vehicles) {
      let voxel = this.vehicleMap.get(v.id);
      if (!voxel) {
        voxel = new VoxelVehicle({
          type: v.type,
          colorIndex: v.colorIndex,
          direction: v.direction,
          isNight,
          isSirenActive: v.type === 'ambulance',
          doorOpenFactor: v.doorOpenFactor,
        });
        this.vehicleMap.set(v.id, voxel);
        this.container.addChild(voxel.container);
      }

      voxel.setConfig({
        direction: v.direction,
        isNight,
        doorOpenFactor: v.doorOpenFactor,
      });

      voxel.container.x = v.x;
      voxel.container.y = v.y;
      voxel.render(timeSec);
    }
  }
}
