import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { CngxNavGroup, CngxNavGroupContent } from '@cngx/common/interactive';

import { CNGX_NAV_RAIL_I18N } from './nav-rail-i18n';
import { injectNavRailFlyout } from './nav-rail-flyout';
import { injectNavRailTooltip } from './nav-rail-tooltip';

/** How a `cngx-nav-rail` lays out a row's label. */
export type CngxNavRailLabelPlacement = 'end' | 'below';

/**
 * A navigation rail: a narrow, always-collapsed column of nav rows for apps
 * whose primary navigation never expands. Use `cngx-sidenav` when the same
 * navigation also opens to full width; the rail is the organism that only
 * ever is a rail.
 *
 * The rows are the nav atoms of `@cngx/common/interactive` (`cngxNavLink`,
 * `cngxNavGroup` with `cngxNavGroupContent`, `cngxNavLabel`,
 * `cngxNavBadge`, `cngxNavIcon`), skinned by `cngx-nav.css`; the rail only
 * SETs their tokens and its own width. `cngx-nav-header` / `[cngxNavHeader]`
 * projects above the rows and `cngx-nav-footer` / `[cngxNavFooter]` below
 * them, with `[cngxNavMark]` at the row icon x.
 *
 * Two looks through `labelPlacement`:
 * - `'end'` (default): icon only. Each row keeps its full label, clipped at
 *   the row edge, so it stays the accessible name; a tooltip shows it on
 *   hover and focus. The width derives from the row tokens
 *   (`--cngx-nav-rail-size`), so the icon box sits centred.
 * - `'below'`: the icon stacked over a short label, no tooltip
 *   (`--cngx-nav-rail-below-size`).
 *
 * A nav group opens as a flyout beside its head in both looks; its
 * `aria-expanded` stays the one state. The host is a `navigation` landmark
 * named by `[ariaLabel]` or the `navRail` section of the language pack.
 *
 * ```html
 * <cngx-nav-rail>
 *   <cngx-nav-header><img cngxNavMark src="/logo.svg" alt="" /></cngx-nav-header>
 *   <a cngxNavLink routerLink="/inbox" routerLinkActive #inbox="routerLinkActive"
 *      [active]="inbox.isActive">
 *     <cngx-icon cngxNavIcon><mat-icon>inbox</mat-icon></cngx-icon>
 *     Inbox
 *   </a>
 *   <button cngxNavGroup #reports="cngxNavGroup">Reports</button>
 *   <div [cngxNavGroupContent]="reports">
 *     <div><a cngxNavLink [depth]="1" routerLink="/reports/weekly">Weekly</a></div>
 *   </div>
 * </cngx-nav-rail>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/nav-rail.ts
 * @selector cngx-nav-rail
 * @since 0.3.0
 * @relatedTo CngxNavLink, CngxNavGroup, CngxNavHeader, CngxNavFooter, CngxSidenav, injectNavRailTooltip, injectNavRailFlyout
 * @axis level organism
 */
@Component({
  selector: 'cngx-nav-rail',
  exportAs: 'cngxNavRail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './nav-rail.css',
  template: `
    <ng-content select="cngx-nav-header, [cngxNavHeader]" />
    <div class="cngx-nav-rail__body">
      <ng-content />
    </div>
    <ng-content select="cngx-nav-footer, [cngxNavFooter]" />
  `,
  host: {
    class: 'cngx-nav-rail',
    role: 'navigation',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.data-label-placement]': 'labelPlacement()',
  },
})
export class CngxNavRail {
  /** Accessible name of the landmark. Unbound, the `navRail` language-pack copy applies. */
  readonly ariaLabel = input<string | undefined>(undefined);

  /** `'end'`: icon only with a tooltip. `'below'`: icon over a short label. */
  readonly labelPlacement = input<CngxNavRailLabelPlacement>('end');

  private readonly i18n = inject(CNGX_NAV_RAIL_I18N);

  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() ?? this.i18n().ariaLabel);

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
    injectNavRailTooltip(computed(() => this.labelPlacement() === 'end'));
    injectNavRailFlyout({
      railed: signal(true).asReadonly(),
      groups: this.groups,
      groupElements: this.groupElements,
      contents: this.contents,
      contentElements: this.contentElements,
    });
  }
}
