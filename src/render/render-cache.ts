/**
 * Arquivo: src/render/render-cache.ts
 *
 * 1. O que este arquivo faz?
 * Cache genérico de objetos de exibição (ex.: Container de cada sala) indexado por id e por uma "assinatura"
 * de conteúdo. Quando a assinatura muda (sala movida, girada, estoque alterado) ou o id some (sala demolida),
 * o objeto antigo é destruído com destroy({ children: true }).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Evitar redesenhar toda a geometria 2.5D a cada quadro e impedir vazamento de memória de Graphics/Text,
 * mantendo 60 FPS estáveis em celulares e desktops.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Se uma sala não atualizar visualmente, verifique a assinatura gerada em room-renderer-3d.ts.
 * Se houver vazamento, confirme que prune() é chamado a cada quadro com os ids ativos.
 *
 * Importa: nenhum (independente de PixiJS para ser testável)
 * Conecta-se com: src/render/room-renderer-3d.ts, tests/render-3d.test.ts
 */

export interface Destroyable {
  destroy(options?: { children?: boolean }): void;
}

interface CacheEntry<T> {
  signature: string;
  value: T;
}

export class DisplayCache<T extends Destroyable> {
  private entries = new Map<string, CacheEntry<T>>();

  /** Retorna o objeto em cache ou cria um novo (destruindo o anterior se a assinatura mudou). */
  public getOrCreate(id: string, signature: string, factory: () => T, onEvict?: (old: T) => void): { value: T; created: boolean } {
    const existing = this.entries.get(id);
    if (existing && existing.signature === signature) return { value: existing.value, created: false };
    if (existing) this.evict(id, existing.value, onEvict);
    const value = factory();
    this.entries.set(id, { signature, value });
    return { value, created: true };
  }

  /** Remove e destrói tudo que não está em activeIds. Retorna quantos foram destruídos. */
  public prune(activeIds: ReadonlySet<string>, onEvict?: (old: T) => void): number {
    let removed = 0;
    for (const [id, entry] of this.entries) {
      if (activeIds.has(id)) continue;
      this.evict(id, entry.value, onEvict);
      removed++;
    }
    return removed;
  }

  public get size(): number {
    return this.entries.size;
  }

  public clear(onEvict?: (old: T) => void): void {
    for (const [id, entry] of this.entries) this.evict(id, entry.value, onEvict);
  }

  private evict(id: string, value: T, onEvict?: (old: T) => void): void {
    onEvict?.(value);
    value.destroy({ children: true });
    this.entries.delete(id);
  }
}
