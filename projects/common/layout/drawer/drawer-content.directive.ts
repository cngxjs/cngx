import { computed, Directive, input } from '@angular/core';
import type { CngxDrawer } from './drawer.directive';

/**
 * Marks the main content area adjacent to a drawer panel.
 *
 * Adds a CSS class when the drawer is open so the consumer can offset
 * the content via CSS transitions or transforms. While a `push` panel is
 * open it also writes `data-drawer-push` with the panel's side (`left`,
 * `right`, `top`, `bottom`); `cngx-drawer.css` moves the content aside by
 * the panel size from it, so the panel itself slides at full size.
 *
 * ```html
 * <main [cngxDrawerContent]="drawer">
 *   Page content
 * </main>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/drawer/drawer-content.directive.ts
 * @since 0.3.0
 * @relatedTo CngxDrawer, CngxDrawerPanel
 * <example-url>/#/common/layout/drawer/basic-scroll-lock-backdrop</example-url>
 * <example-url>/#/common/layout/drawer/controlled-mode</example-url>
 * <example-url>/#/common/layout/drawer/direction-all-four-sides</example-url>
 * <example-url>/#/common/layout/drawer/events-openedchange-closed</example-url>
 * <example-url>/#/common/layout/drawer/app-header-clipped</example-url>
 * <example-url>/#/common/layout/drawer/full-height-modal</example-url>
 * <example-url>/#/common/layout/drawer/filter-panel-push</example-url>
 * <example-url>/#/common/layout/drawer/pattern-consumer-wiring</example-url>
 */
@Directive({
  selector: '[cngxDrawerContent]',
  exportAs: 'cngxDrawerContent',
  standalone: true,
  host: {
    '[class.cngx-drawer-content]': 'true',
    '[class.cngx-drawer-content--shifted]': 'isOpen()',
    '[attr.data-drawer-push]': 'pushSide()',
  },
})
export class CngxDrawerContent {
  /** Reference to the parent `CngxDrawer` state owner. */
  readonly drawerRef = input.required<CngxDrawer>({ alias: 'cngxDrawerContent' });

  /** Whether the drawer is currently open (derived from the drawer ref). */
  readonly isOpen = computed(() => this.drawerRef().opened());

  /** Side of the open `push` panel the content gives way to; `null` otherwise. */
  protected readonly pushSide = computed(() => {
    const drawer = this.drawerRef();
    const pushing = drawer.opened() && drawer.mode() === 'push';
    return pushing ? drawer.side() : null;
  });
}
