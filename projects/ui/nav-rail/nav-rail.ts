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

import { injectNavRailConfig } from './config/inject-nav-rail-config';
import { CNGX_NAV_RAIL_DEFAULTS } from './config/nav-rail.config.defaults';
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
 * Two looks through `labelPlacement` (app-wide default through
 * `provideNavRailConfig(withNavRailLabelPlacement(...))`):
 * - `'end'` (default): icon only. Each row keeps its full label, clipped at
 *   the row edge, so it stays the accessible name; a tooltip shows it on
 *   hover after a short delay and at once on keyboard focus (`[tooltip]` or
 *   `withNavRailTooltip(false)` switches it off). The width
 *   derives from the row tokens
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
 * @relatedTo CngxNavLink, CngxNavGroup, CngxNavHeader, CngxNavFooter, CngxSidenav, injectNavRailTooltip, injectNavRailFlyout, provideNavRailConfig, withNavRailTooltip
 * <example-url>/#/ui/nav-rail/labels-beside</example-url>
 * <example-url>/#/ui/nav-rail/labels-below</example-url>
 * <example-url>/#/ui/nav-rail/rail-with-secondary-sidebar</example-url>
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
    '[attr.data-label-placement]': 'resolvedLabelPlacement()',
  },
})
export class CngxNavRail {
  /** Accessible name of the landmark. Unbound, the `navRail` language-pack copy applies. */
  readonly ariaLabel = input<string | undefined>(undefined);

  /**
   * `'end'`: icon only with a tooltip (unless `tooltip` is off). `'below'`:
   * icon over a short label, never a tooltip.
   * Unbound, `withNavRailLabelPlacement` of the config in scope applies, else
   * `'end'`.
   */
  readonly labelPlacement = input<CngxNavRailLabelPlacement | undefined>(undefined);

  /**
   * Whether a row shows its label in a tooltip in the `'end'` look; the
   * `'below'` look never shows one. Unbound, `withNavRailTooltip` of the
   * config in scope applies, else `true`. Switching it off removes the
   * tooltip element and its listeners.
   */
  readonly tooltip = input<boolean | undefined>(undefined);

  private readonly i18n = inject(CNGX_NAV_RAIL_I18N);
  private readonly config = injectNavRailConfig();

  /** The look in effect: `[labelPlacement]`, then the config, then `'end'`. */
  protected readonly resolvedLabelPlacement = computed(
    () =>
      this.labelPlacement() ?? this.config.labelPlacement ?? CNGX_NAV_RAIL_DEFAULTS.labelPlacement,
  );

  /** Whether the tooltip is on: `[tooltip]`, then the config, then `true`. */
  protected readonly resolvedTooltip = computed(
    () => this.tooltip() ?? this.config.tooltip ?? CNGX_NAV_RAIL_DEFAULTS.tooltip,
  );

  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() ?? this.i18n().ariaLabel);

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
    injectNavRailTooltip(
      computed(() => this.resolvedLabelPlacement() === 'end' && this.resolvedTooltip()),
    );
    injectNavRailFlyout({
      railed: signal(true).asReadonly(),
      groups: this.groups,
      groupElements: this.groupElements,
      contents: this.contents,
      contentElements: this.contentElements,
    });
  }
}
