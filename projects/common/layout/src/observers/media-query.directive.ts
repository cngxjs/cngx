import { DOCUMENT } from '@angular/common';
import { Directive, effect, inject, input, signal } from '@angular/core';

/**
 * Reactive media query directive that exposes a `matches` signal.
 *
 * Wraps `window.matchMedia()` with automatic cleanup. Usable for
 * responsive layouts, drawer mode switching, conditional rendering,
 * or any behavior that depends on viewport/preference queries.
 *
 * @category layout
 *
 * @usageNotes
 *
 * ### Responsive drawer mode
 * ```html
 * <div cngxMediaQuery="(min-width: 1024px)" #mq="cngxMediaQuery">
 *   <nav [cngxDrawerPanel]="drawer"
 *        [mode]="mq.matches() ? 'side' : 'over'">
 *     …
 *   </nav>
 * </div>
 * ```
 *
 * ### Conditional content
 * ```html
 * <div cngxMediaQuery="(prefers-color-scheme: dark)" #dark="cngxMediaQuery">
 *   @if (dark.matches()) { <span>Dark mode active</span> }
 * </div>
 * ```
 */
@Directive({
  selector: '[cngxMediaQuery]',
  exportAs: 'cngxMediaQuery',
  standalone: true,
})
export class CngxMediaQuery {
  /** The CSS media query string to evaluate. */
  readonly query = input.required<string>({ alias: 'cngxMediaQuery' });

  private readonly matchesState = signal(false);
  private readonly win = inject(DOCUMENT).defaultView;

  /** Whether the media query currently matches. */
  readonly matches = this.matchesState.asReadonly();

  constructor() {
    effect((onCleanup) => {
      const win = this.win;
      if (!win) {
        this.matchesState.set(false);
        return;
      }

      const mql = win.matchMedia(this.query());
      this.matchesState.set(mql.matches);

      const handler = (e: MediaQueryListEvent): void => this.matchesState.set(e.matches);
      mql.addEventListener('change', handler);
      onCleanup(() => mql.removeEventListener('change', handler));
    });
  }
}
