import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Observes size changes of the host element via the `ResizeObserver` API.
 *
 * Exposes `width()`, `height()`, `contentRect()`, and `isReady()` as Angular
 * signals that update on every resize. The observer is automatically
 * disconnected on destroy and recreated when the `box` input changes.
 *
 * Use cases: responsive component logic in TypeScript (not just CSS),
 * container queries without CSS support, dynamic canvas/chart sizing,
 * resize-aware layouts.
 *
 * @usageNotes
 *
 * ### Display current size
 * ```html
 * <div cngxResizeObserver #ro="cngxResizeObserver" style="resize: horizontal; overflow: auto;">
 *   {{ ro.width() | number:'1.0-0' }} × {{ ro.height() | number:'1.0-0' }} px
 * </div>
 * ```
 *
 * ### Responsive logic in TypeScript
 * ```typescript
 * readonly ro = viewChild(CngxResizeObserver);
 * readonly columns = computed(() => (this.ro()?.width() ?? 0) > 600 ? 3 : 1);
 * ```
 */
@Directive({
  selector: '[cngxResizeObserver]',
  exportAs: 'cngxResizeObserver',
  standalone: true,
})
export class CngxResizeObserver {
  /** Which box model to observe. `'content-box'` (default), `'border-box'`, or `'device-pixel-content-box'`. */
  readonly box = input<ResizeObserverBoxOptions>('content-box');

  private readonly entryState = signal<ResizeObserverEntry | null>(null);

  /** The full `DOMRectReadOnly` of the content box. `null` before first observation. */
  readonly contentRect = computed(() => this.entryState()?.contentRect ?? null);
  /** Current width in pixels. `0` before first observation. */
  readonly width = computed(() => this.entryState()?.contentRect.width ?? 0);
  /** Current height in pixels. `0` before first observation. */
  readonly height = computed(() => this.entryState()?.contentRect.height ?? 0);
  /** `true` after the first resize observation has been received. */
  readonly isReady = computed(() => this.entryState() !== null);

  /** Emitted on every resize with the raw `ResizeObserverEntry`. */
  readonly resize = output<ResizeObserverEntry>();

  private readonly el = inject(ElementRef<HTMLElement>);

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    if (!win) {
      return;
    }

    const observer = new win.ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.entryState.set(entries[0]);
      this.resize.emit(entries[0]);
    });

    effect(() => {
      observer.disconnect();
      observer.observe(this.el.nativeElement as HTMLElement, { box: this.box() });
    });

    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
