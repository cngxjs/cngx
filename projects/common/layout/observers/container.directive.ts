import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject, type Signal } from '@angular/core';

import { CNGX_CONTAINER_SIZE, type CngxContainerSize, createContainerSize } from './container-size';

/**
 * Declares the host as an inline-size query container and publishes its size
 * to descendants through {@link CNGX_CONTAINER_SIZE}.
 *
 * The directive sets `container-type` only. **The container name belongs in
 * the stylesheet**, next to the `@container` rules that use it, because the
 * name is API: an unnamed query matches the nearest container of any name, so
 * a consumer wrapping the component in their own container would silently
 * re-target it.
 *
 * ```css
 * cngx-thing-layout {
 *   container-name: cngx-thing-layout;
 * }
 *
 * cngx-thing-layout > cngx-thing { --cngx-thing-wide: 0; }
 *
 * @container cngx-thing-layout (min-inline-size: 64rem) {
 *   cngx-thing-layout > cngx-thing { --cngx-thing-wide: 1; }
 * }
 * ```
 *
 * ```html
 * <div cngxContainer>
 *   <app-panel />
 * </div>
 * ```
 *
 * A descendant reads the resolved value with `injectContainerSize()`, so the
 * breakpoint exists exactly once - in CSS. Note that `container-type:
 * inline-size` applies size containment: an element that must shrink-wrap its
 * content (an inline chip, a `width: max-content` bar) must not be a
 * container.
 *
 * @category common/layout
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/observers/container.directive.ts
 * @since 0.1.0
 * @relatedTo injectContainerSize, CngxResizeObserver, CngxMediaQuery
 * <example-url>http://localhost:4200/#/common/layout/container/css-decides-js-reads</example-url>
 */
@Directive({
  selector: '[cngxContainer]',
  exportAs: 'cngxContainer',
  standalone: true,
  providers: [{ provide: CNGX_CONTAINER_SIZE, useExisting: CngxContainer }],
  // Static host style, not a binding: the value never changes, so there is
  // nothing for change detection to re-evaluate.
  host: {
    style: 'container-type: inline-size',
  },
})
export class CngxContainer implements CngxContainerSize {
  private readonly size = createContainerSize(
    inject(ElementRef).nativeElement as Element,
    inject(DestroyRef),
    inject(DOCUMENT).defaultView,
  );

  /** Border-box inline size in pixels. `0` before the first observation. */
  readonly inlineSize = this.size.inlineSize;
  /** Border-box block size in pixels. `0` before the first observation. */
  readonly blockSize = this.size.blockSize;
  /** `true` once the first observation has arrived. */
  readonly isReady = this.size.isReady;

  /**
   * The resolved value of a custom property on `on` (default: this host),
   * re-read on every resize. The `@container` rule must style a descendant -
   * see {@link CngxContainerSize.property}.
   */
  property(name: string, on?: Element): Signal<string> {
    return this.size.property(name, on);
  }
}
