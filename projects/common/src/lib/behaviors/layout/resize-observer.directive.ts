import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

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

  private readonly _entry = signal<ResizeObserverEntry | null>(null);

  /** The full `DOMRectReadOnly` of the content box. `null` before first observation. */
  readonly contentRect = computed(() => this._entry()?.contentRect ?? null);
  /** Current width in pixels. `0` before first observation. */
  readonly width = computed(() => this._entry()?.contentRect.width ?? 0);
  /** Current height in pixels. `0` before first observation. */
  readonly height = computed(() => this._entry()?.contentRect.height ?? 0);
  /** `true` after the first resize observation has been received. */
  readonly isReady = computed(() => this._entry() !== null);

  /** Emitted on every resize with the raw `ResizeObserverEntry`. */
  readonly resize = output<ResizeObserverEntry>();

  private readonly _el = inject(ElementRef<HTMLElement>);

  private readonly _observer = new ResizeObserver((entries) => {
    this._entry.set(entries[0]);
    this.resize.emit(entries[0]);
  });

  constructor() {
    // Re-observe when `box` input changes.
    toObservable(this.box).subscribe((box) => {
      this._observer.disconnect();
      this._observer.observe(this._el.nativeElement as HTMLElement, { box });
    });

    inject(DestroyRef).onDestroy(() => this._observer.disconnect());
  }
}
