import { booleanAttribute, contentChildren, Directive, ElementRef, inject, input } from '@angular/core';

import { CngxNavGroup } from './nav-group.directive';
import { CngxNavGroupContent } from './nav-group-content.directive';
import { CNGX_NAV_RAIL_FLYOUT_FACTORY } from './nav-rail-flyout';
import { CNGX_NAV_RAIL_TOOLTIP_FACTORY } from './nav-rail-tooltip';

/**
 * Gives a nav container of your own the rail behaviour of `cngx-nav-rail`:
 * while `[cngxNavRailed]` is `true`, a row shows its clipped label in a
 * tooltip and an open `cngxNavGroupContent` shows as a flyout beside its
 * head. Put it on the element that holds the rows, typically a
 * `cngxSidebar`, and bind the rail state you already have; the directive
 * derives nothing and syncs nothing.
 *
 * The host renders `data-nav-railed` (`'true'` while railed, `'false'`
 * otherwise); `cngx-nav.css` reads it, crops the rows to their icon box while
 * railed and SETs `--cngx-nav-railed-size` on the host, the rail width that
 * centres the icon box (border not included). The container's own skin needs
 * no nav selectors; it sizes its rail from that token.
 *
 * It runs the same two pieces as the organisms
 * (`CNGX_NAV_RAIL_TOOLTIP_FACTORY`, `CNGX_NAV_RAIL_FLYOUT_FACTORY`), so an
 * override of either token reaches it too. The tooltip and flyout open away
 * from `cngxNavRailedSide`; the pointer dwell is `cngxNavRailedHoverDelay` ms.
 *
 * ```html
 * <aside cngxSidebar #sidebar="cngxSidebar" class="cngx-sidebar"
 *        [cngxNavRailed]="sidebar.state() === 'rail'">
 *   <a cngxNavLink routerLink="/inbox">Inbox</a>
 * </aside>
 * ```
 *
 * <example-url>/#/common/interactive/nav/nav-railed-rail-of-your-own</example-url>
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/nav/nav-railed.directive.ts
 * @selector [cngxNavRailed]
 * @since 0.3.0
 * @relatedTo injectNavRailTooltip, injectNavRailFlyout, CngxNavGroup, CngxNavGroupContent, CngxSidebar
 * @axis level molecule
 */
@Directive({
  selector: '[cngxNavRailed]',
  exportAs: 'cngxNavRailed',
  standalone: true,
  host: {
    '[attr.data-nav-railed]': "railed() ? 'true' : 'false'",
  },
})
export class CngxNavRailed {
  /** `true` while the rows are railed: labels clipped, tooltip and flyout wanted. */
  readonly railed = input(false, { alias: 'cngxNavRailed', transform: booleanAttribute });

  /** The edge the rows sit on, logical; tooltip and flyout open away from it. */
  readonly side = input<'start' | 'end'>('start', { alias: 'cngxNavRailedSide' });

  /** Pointer dwell in ms before the tooltip shows. Keyboard focus shows it at once. */
  readonly hoverDelay = input(300, { alias: 'cngxNavRailedHoverDelay' });

  // Each directive query has a `read: ElementRef` twin over the same selector,
  // so the flyout pairs a directive with its host by index.
  private readonly groups = contentChildren(CngxNavGroup, { descendants: true });
  private readonly groupElements = contentChildren(CngxNavGroup, {
    descendants: true,
    read: ElementRef,
  });
  private readonly contents = contentChildren(CngxNavGroupContent, { descendants: true });
  private readonly contentElements = contentChildren(CngxNavGroupContent, {
    descendants: true,
    read: ElementRef,
  });

  constructor() {
    inject(CNGX_NAV_RAIL_TOOLTIP_FACTORY)({
      railed: this.railed,
      side: this.side,
      hoverDelay: this.hoverDelay,
    });
    inject(CNGX_NAV_RAIL_FLYOUT_FACTORY)({
      railed: this.railed,
      side: this.side,
      groups: this.groups,
      groupElements: this.groupElements,
      contents: this.contents,
      contentElements: this.contentElements,
    });
  }
}
