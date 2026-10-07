import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject, PLATFORM_ID } from '@angular/core';

import { createScrollEdges } from './scroll-edges-core';

/**
 * Reports which edges of a scrollport still hide content and reflects them as
 * host attributes, so an edge shadow or fade appears only while there really
 * is something to scroll to in that direction.
 *
 * Put it on the element that scrolls (`overflow: auto` / `scroll`). The four
 * signals and the four logical host attributes are derived from one read of
 * the scroll metrics per animation frame; the attributes are present (empty
 * value) while true and absent otherwise:
 *
 * - `data-scroll-block-start` / `canScrollBlockStart()` - content hidden above
 * - `data-scroll-block-end` / `canScrollBlockEnd()` - content hidden below
 * - `data-scroll-inline-start` / `canScrollInlineStart()` - hidden toward inline start
 * - `data-scroll-inline-end` / `canScrollInlineEnd()` - hidden toward inline end
 *
 * Inline start / end follow the writing direction: in `dir="rtl"` the start
 * edge is on the right. The direction is derived from the scroll offset
 * itself, so a `dir="rtl"` subtree inside an LTR page reports correctly.
 *
 * The directive paints nothing. The four attributes (present only while true)
 * are its public, stable contract; every visual belongs to the consumer CSS,
 * keyed on them. Three common cues:
 *
 * Shadow (Material 2 elevate-on-scroll):
 *
 * ```css
 * .sheet[data-scroll-block-start] .bar { box-shadow: 0 2px 4px -2px rgb(0 0 0 / 0.3); }
 * ```
 *
 * Hairline that appears (iOS scroll-edge appearance; transparent border at rest):
 *
 * ```css
 * .sheet[data-scroll-block-start] .bar { border-block-end-color: var(--cngx-color-border); }
 * ```
 *
 * Tonal surface change (Material 3 top app bar):
 *
 * ```css
 * .sheet[data-scroll-block-start] .bar { background: var(--app-bar-scrolled-surface); }
 * ```
 *
 * Forced colors strips `box-shadow`, so a shadow-only cue disappears there;
 * prefer a border or pair the shadow with one under `forced-colors: active`.
 *
 * ```html
 * <div class="sheet" cngxScrollEdges #edges="cngxScrollEdges">...</div>
 * ```
 *
 * The edge state is purely visual and is not announced: the hidden content
 * stays in the DOM and in the reading order, and the scrollport remains
 * reachable by keyboard scrolling. Make the scrollport focusable (and named)
 * when it holds no focusable content of its own.
 *
 * Upgrade path: the attributes map 1:1 onto CSS
 * `@container scroll-state(scrollable: block-start)` and its siblings, so the
 * CSS can swap to native scroll-state queries once they are Baseline.
 *
 * @category common/layout
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/scroll-edges.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStickyHeader, CngxScrollSpy, createScrollEdges
 * <example-url>http://localhost:4200/#/common/layout/scroll-edges/edge-shadows</example-url>
 */
@Directive({
  selector: '[cngxScrollEdges]',
  exportAs: 'cngxScrollEdges',
  standalone: true,
  host: {
    '[attr.data-scroll-block-start]': "canScrollBlockStart() ? '' : null",
    '[attr.data-scroll-block-end]': "canScrollBlockEnd() ? '' : null",
    '[attr.data-scroll-inline-start]': "canScrollInlineStart() ? '' : null",
    '[attr.data-scroll-inline-end]': "canScrollInlineEnd() ? '' : null",
  },
})
export class CngxScrollEdges {
  private readonly edges = createScrollEdges(
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    inject(DestroyRef),
    isPlatformBrowser(inject(PLATFORM_ID)) ? inject(DOCUMENT).defaultView : null,
  );

  /** Content is hidden toward the block-start edge (above). */
  readonly canScrollBlockStart = this.edges.canScrollBlockStart;
  /** Content is hidden toward the block-end edge (below). */
  readonly canScrollBlockEnd = this.edges.canScrollBlockEnd;
  /** Content is hidden toward the inline-start edge (left in LTR, right in RTL). */
  readonly canScrollInlineStart = this.edges.canScrollInlineStart;
  /** Content is hidden toward the inline-end edge (right in LTR, left in RTL). */
  readonly canScrollInlineEnd = this.edges.canScrollInlineEnd;
}
