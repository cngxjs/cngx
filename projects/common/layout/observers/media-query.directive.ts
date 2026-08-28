import { DOCUMENT } from '@angular/common';
import { Directive, effect, inject, input, signal } from '@angular/core';
import { observeMediaQuery } from '@cngx/core/utils';

/**
 * Reactive media query directive that exposes a `matches` signal.
 *
 * Wraps `window.matchMedia()` with automatic cleanup. Usable for
 * responsive layouts, drawer mode switching, conditional rendering,
 * or any behavior that depends on viewport/preference queries.
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
 *
 * @category common/layout
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/observers/media-query.directive.ts
 * @since 0.1.0
 * @relatedTo CngxResizeObserver, CngxIntersectionObserver
 * <example-url>http://localhost:4200/#/common/layout/media-query/viewport-breakpoints</example-url>
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
      onCleanup(
        observeMediaQuery(this.win, this.query(), (matches) => this.matchesState.set(matches)),
      );
    });
  }
}
