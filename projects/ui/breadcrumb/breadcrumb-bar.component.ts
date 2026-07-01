import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';

import { CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator } from '@cngx/common/interactive';

import { CNGX_BREADCRUMB_ITEMS_SOURCE } from './breadcrumb-items-source.token';
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
 * <cngx-breadcrumb [items]="crumbs" [maxVisible]="4" variant="pill" />
 * ```
 *
 * @category ui/breadcrumb
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-bar.component.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator
 */
@Component({
  selector: 'cngx-breadcrumb',
  exportAs: 'cngxBreadcrumbBar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator],
  templateUrl: './breadcrumb-bar.component.html',
  styleUrl: './breadcrumb-bar.component.css',
  host: {
    '[class]': 'hostClass()',
  },
})
export class CngxBreadcrumbBar {
  /** Uncontrolled trail. Ignored when a {@link CNGX_BREADCRUMB_ITEMS_SOURCE} is provided. */
  readonly itemsInput = input<readonly CngxBreadcrumbCrumb[]>([], { alias: 'items' });
  /** Maximum crumbs to show before the middle collapses. Unset = never collapse. */
  readonly maxVisible = input<number | undefined>(undefined);
  /** Accessible name of the `nav` landmark. EN default. */
  readonly label = input<string>('Breadcrumb');
  /** Visual skin, mapped to a `cngx-breadcrumb--{variant}` host class. */
  readonly variant = input<string | undefined>(undefined);

  private readonly itemsSource = inject(CNGX_BREADCRUMB_ITEMS_SOURCE, { optional: true });

  /**
   * The rendered trail. A provided source wins over the `[items]` input
   * (controlled/uncontrolled pattern). Pass-through - it returns the underlying
   * signal's reference, never a fresh literal, so no `equal` fn is needed and
   * no downstream cascade fires.
   */
  readonly items = computed<readonly CngxBreadcrumbCrumb[]>(
    () => this.itemsSource?.crumbs() ?? this.itemsInput(),
  );

  protected readonly hostClass = computed(() => {
    const variant = this.variant();
    return variant ? `cngx-breadcrumb cngx-breadcrumb--${variant}` : 'cngx-breadcrumb';
  });
}
