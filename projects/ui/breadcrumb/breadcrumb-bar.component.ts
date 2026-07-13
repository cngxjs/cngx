import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator } from '@cngx/common/interactive';
import { createControlledSource } from '@cngx/core/utils';

import { CngxBreadcrumbIcon } from './breadcrumb-icon.directive';
import { CngxBreadcrumbItemAccessory } from './breadcrumb-item-accessory.directive';
import { CngxBreadcrumbOverflow } from './breadcrumb-overflow.component';
import { CngxBreadcrumbOverflowItem } from './breadcrumb-overflow-item.directive';
import { CngxBreadcrumbSiblings } from './breadcrumb-siblings.component';
import { CNGX_BREADCRUMB_ITEMS_SOURCE } from './breadcrumb-items-source.token';
import type { CngxBreadcrumbSkin } from './config/breadcrumb.config';
import { injectBreadcrumbConfig } from './config/inject-breadcrumb-config';
import type { CngxBreadcrumbCrumb } from './breadcrumb.types';

/**
 * Breadcrumb bar organism. A thin `<cngx-breadcrumb [items]="...">` shell that
 * renders a trail through the headless `@cngx/common/interactive` trio
 * (`CngxBreadcrumb` / `CngxBreadcrumbItem` / `CngxBreadcrumbSeparator`) - the
 * bar forwards inputs and owns the skin, the trio owns the collapse, terminal
 * marking, and landmark a11y. Everything derives (Pillar 1); nothing here syncs.
 *
 * Two data modes without baking `@angular/router` into the base component:
 * the uncontrolled `[items]` input, and an opt-in controlled source provided
 * through {@link CNGX_BREADCRUMB_ITEMS_SOURCE} (the router-sync directive). The
 * source wins over the input via `computed`, so an external producer augments
 * the trail through a token, never by writing this component's `input()`.
 *
 * ```html
 * <cngx-breadcrumb [items]="crumbs" [maxVisible]="4" skin="pill" />
 * ```
 *
 * @category ui/breadcrumb
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-bar.component.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator, CngxBreadcrumbOverflow, CngxBreadcrumbSiblings, CngxBreadcrumbItemAccessory, CngxBreadcrumbOverflowItem, CngxBreadcrumbRouterSync
 * <example-url>http://localhost:4200/#/ui/breadcrumb/basic/explicit-items</example-url>
 */
@Component({
  selector: 'cngx-breadcrumb',
  exportAs: 'cngxBreadcrumbBar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgTemplateOutlet,
    CngxBreadcrumb,
    CngxBreadcrumbItem,
    CngxBreadcrumbSeparator,
    CngxBreadcrumbOverflow,
    CngxBreadcrumbSiblings,
  ],
  templateUrl: './breadcrumb-bar.component.html',
  styleUrl: './breadcrumb-bar.component.css',
  host: {
    class: 'cngx-breadcrumb',
    '[attr.data-skin]': 'resolvedSkin()',
  },
})
export class CngxBreadcrumbBar {
  /** Uncontrolled trail. Ignored when a {@link CNGX_BREADCRUMB_ITEMS_SOURCE} is provided. */
  readonly itemsInput = input<readonly CngxBreadcrumbCrumb[]>([], { alias: 'items' });
  /** Maximum crumbs to show before the middle collapses. Unset = never collapse. */
  readonly maxVisible = input<number | undefined>(undefined);

  private readonly cfg = injectBreadcrumbConfig();

  /** Accessible name of the `nav` landmark. Falls back through the config cascade to the EN default. */
  readonly label = input<string>(this.cfg.ariaLabels?.bar ?? 'Breadcrumb');
  /**
   * Visual skin, reflected onto `[data-skin]`. Cascade `input ?? config.skin ??
   * 'classic'`, resolved by {@link resolvedSkin}. Pure thematic concern -
   * structure, slots, and ARIA are identical across values.
   */
  readonly skin = input<CngxBreadcrumbSkin | undefined>(undefined);

  private readonly itemsSource = inject(CNGX_BREADCRUMB_ITEMS_SOURCE, { optional: true });

  /**
   * Projected per-crumb accessory template. When present it wins over the
   * declarative `crumb.siblings` auto-render for every crumb (one predictable
   * owner of the accessory area). The `contentChild` is already a
   * `Signal<TemplateRef | undefined>` - bound directly, no pass-through `computed`.
   */
  protected readonly accessory = contentChild(CngxBreadcrumbItemAccessory, { read: TemplateRef });

  /**
   * Projected leading per-crumb icon template. Rendered inside every crumb link
   * (`<a>`) before the label span, fed the `{ crumb, index }` context so the
   * consumer renders the opaque `crumb.icon` with any icon system. Direct
   * `Signal<TemplateRef | undefined>` - bound in the template, no pass-through.
   */
  protected readonly icon = contentChild(CngxBreadcrumbIcon, { read: TemplateRef });

  /**
   * Projected overflow-row template, forwarded to the composed
   * {@link CngxBreadcrumbOverflow} (which the consumer cannot reach as
   * `contentChild` through the bar). Lets a consumer customize the collapsed-crumb
   * rows without hand-composing the headless trail.
   */
  protected readonly overflowRow = contentChild(CngxBreadcrumbOverflowItem, { read: TemplateRef });

  /** The rendered trail: a provided source wins over the `[items]` input (controlled/uncontrolled). */
  protected readonly items = createControlledSource(this.itemsSource?.crumbs, this.itemsInput);

  /** Resolved skin (`input ?? config.skin ?? 'classic'`), reflected onto `[data-skin]`. */
  protected readonly resolvedSkin = computed<CngxBreadcrumbSkin>(
    () => this.skin() ?? this.cfg.skin ?? 'classic',
  );
}
