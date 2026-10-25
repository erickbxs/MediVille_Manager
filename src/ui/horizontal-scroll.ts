/**
 * Arquivo: src/ui/horizontal-scroll.ts
 *
 * 1. O que este arquivo faz?
 * Fornece um utilitário universal de rolagem horizontal fluida com suporte à roda do mouse (wheel to horizontal),
 * navegação com setas do teclado (ArrowLeft/ArrowRight), botões laterais com auto-ocultação e arraste (grab & drag).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Atender à Parte 1 do Prompt 14, permitindo rolagem horizontal suave no carrossel de Obras, abas da Enciclopédia
 * e menus sem disparar zoom acidental no canvas do PixiJS ao fundo.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ajuste step (padrão 240px) ou wheelMultiplier (padrão 1.2). Verifique os listeners de wheel e pointer.
 *
 * Importa: (nenhum)
 * Conecta-se com: src/ui/build-menu.ts, src/ui/encyclopedia-modal.ts
 */

export interface HorizontalScrollOptions {
  step?: number;
  wheelMultiplier?: number;
  prevButton?: HTMLElement | null;
  nextButton?: HTMLElement | null;
  autoHideButtons?: boolean;
  enableArrows?: boolean;
  enableDrag?: boolean;
}

const DEFAULT_STEP = 240;
const DEFAULT_WHEEL_MULTIPLIER = 1.2;
const DRAG_THRESHOLD_PX = 5;
const SCROLL_MARGIN_PX = 4;

interface DragState {
  isDown: boolean;
  startX: number;
  scrollLeftStart: number;
  hasDragged: boolean;
}

function updateButtonsVisibility(container: HTMLElement, prev?: HTMLElement | null, next?: HTMLElement | null): void {
  const maxScroll = container.scrollWidth - container.clientWidth;
  if (prev) {
    const isAtStart = container.scrollLeft <= SCROLL_MARGIN_PX;
    prev.classList.toggle('opacity-0', isAtStart);
    prev.classList.toggle('pointer-events-none', isAtStart);
  }
  if (next) {
    const isAtEnd = container.scrollLeft >= maxScroll - SCROLL_MARGIN_PX;
    next.classList.toggle('opacity-0', isAtEnd);
    next.classList.toggle('pointer-events-none', isAtEnd);
  }
}

function attachWheelListener(container: HTMLElement, multiplier: number, onScroll: () => void): () => void {
  const handleWheel = (e: WheelEvent): void => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      e.stopPropagation();
      container.scrollLeft += e.deltaY * multiplier;
      onScroll();
    }
  };
  container.addEventListener('wheel', handleWheel, { passive: false });
  return () => container.removeEventListener('wheel', handleWheel);
}

function attachKeyListeners(container: HTMLElement, step: number, onScroll: () => void): () => void {
  let isHovered = false;
  const onEnter = (): void => { isHovered = true; };
  const onLeave = (): void => { isHovered = false; };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (!isHovered && document.activeElement !== container && !container.contains(document.activeElement)) {
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.key === 'ArrowLeft' ? -step : step;
      container.scrollBy({ left: delta, behavior: 'smooth' });
      setTimeout(onScroll, 150);
    }
  };

  container.addEventListener('mouseenter', onEnter);
  container.addEventListener('mouseleave', onLeave);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('mouseenter', onEnter);
    container.removeEventListener('mouseleave', onLeave);
    window.removeEventListener('keydown', handleKeyDown);
  };
}

function attachDragListeners(container: HTMLElement, onScroll: () => void): () => void {
  const drag: DragState = { isDown: false, startX: 0, scrollLeftStart: 0, hasDragged: false };
  container.style.cursor = 'grab';

  const onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.button !== 1) return;
    drag.isDown = true;
    drag.hasDragged = false;
    drag.startX = e.pageX - container.offsetLeft;
    drag.scrollLeftStart = container.scrollLeft;
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!drag.isDown) return;
    const currentX = e.pageX - container.offsetLeft;
    const walk = currentX - drag.startX;
    if (Math.abs(walk) > DRAG_THRESHOLD_PX) {
      drag.hasDragged = true;
    }
    container.scrollLeft = drag.scrollLeftStart - walk;
    onScroll();
  };

  const endDrag = (): void => {
    drag.isDown = false;
    container.style.cursor = 'grab';
    container.style.removeProperty('user-select');
  };

  const onClickCapture = (e: MouseEvent): void => {
    if (drag.hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      drag.hasDragged = false;
    }
  };

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  container.addEventListener('click', onClickCapture, true);

  return () => {
    container.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    container.removeEventListener('click', onClickCapture, true);
  };
}

export function enableHorizontalScroll(container: HTMLElement, options: HorizontalScrollOptions = {}): () => void {
  const step = options.step ?? DEFAULT_STEP;
  const multiplier = options.wheelMultiplier ?? DEFAULT_WHEEL_MULTIPLIER;
  const { prevButton, nextButton, autoHideButtons = true } = options;

  const onScroll = (): void => {
    if (autoHideButtons) {
      updateButtonsVisibility(container, prevButton, nextButton);
    }
  };

  const cleanupWheel = attachWheelListener(container, multiplier, onScroll);
  const cleanupKeys = (options.enableArrows ?? true) ? attachKeyListeners(container, step, onScroll) : () => {};
  const cleanupDrag = (options.enableDrag ?? true) ? attachDragListeners(container, onScroll) : () => {};

  const onPrevClick = (): void => {
    container.scrollBy({ left: -step, behavior: 'smooth' });
    setTimeout(onScroll, 150);
  };
  const onNextClick = (): void => {
    container.scrollBy({ left: step, behavior: 'smooth' });
    setTimeout(onScroll, 150);
  };

  prevButton?.addEventListener('click', onPrevClick);
  nextButton?.addEventListener('click', onNextClick);
  container.addEventListener('scroll', onScroll, { passive: true });

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(onScroll);
  } else {
    onScroll();
  }

  return () => {
    cleanupWheel();
    cleanupKeys();
    cleanupDrag();
    prevButton?.removeEventListener('click', onPrevClick);
    nextButton?.removeEventListener('click', onNextClick);
    container.removeEventListener('scroll', onScroll);
  };
}
