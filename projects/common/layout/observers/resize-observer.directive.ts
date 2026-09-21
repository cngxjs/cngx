import { DOCUMENT } from '@angular/common';
import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { observeResize } from './resize-signal';

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
 *
 * @category common/layout
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/observers/resize-observer.directive.ts
 * @since 0.1.0
 * @relatedTo CngxIntersectionObserver, CngxMediaQuery
 * <example-url>http://localhost:4200/#/common/layout/resize-observer/live-size</example-url>
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

    // One subscription per `box` value: `onCleanup` disconnects the previous
    // observer before `observeResize` wires the next, which is also the
    // teardown on destroy. The kernel no-ops when the host ships no
    // `ResizeObserver` (SSR, jsdom), so no host guard is needed here.
    effect((onCleanup) => {
      onCleanup(
        observeResize(win, this.el.nativeElement as HTMLElement, this.box(), (entry) => {
          this.entryState.set(entry);
          this.resize.emit(entry);
        }),
      );
    });
  }
}
