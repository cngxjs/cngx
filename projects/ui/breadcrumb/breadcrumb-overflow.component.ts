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

import {
  CNGX_BREADCRUMB,
  type CngxBreadcrumbHost,
  CngxMenu,
  CngxMenuItem,
} from '@cngx/common/interactive';
import { CngxIconMenuButton } from '@cngx/common/menu-button';
import { CngxPopoverPanel } from '@cngx/common/popover';
import { createControlledSource } from '@cngx/core/utils';
import { CngxRuntimeError } from '@cngx/utils';

import {
  CngxBreadcrumbOverflowItem,
  type CngxBreadcrumbOverflowItemContext,
} from './breadcrumb-overflow-item.directive';
import { injectBreadcrumbAriaLabels } from './config/inject-breadcrumb-config';

/**
 * Drop-in overflow menu for {@link CngxBreadcrumbBar}. Presents the crumbs the
 * headless trail collapsed as a real dropdown: an ellipsis
 * {@link CngxIconMenuButton} trigger plus a {@link CngxPopoverPanel} surface
 * hosting a {@link CngxMenu} of the collapsed crumbs. It reads the collapse set through the {@link CNGX_BREADCRUMB} DI
 * contract - never the concrete coordinator - so it stays decompose-clean, and
 * self-hides when nothing is collapsed, which makes it an unconditional drop-in.
 *
 * The default row lists `resolvedLabel()` and does not navigate. Project
 * `*cngxBreadcrumbOverflowItem` to render a navigable row (an `<a href>` or
 * `[routerLink]`) when the collapsed crumbs must link.
 *
 * ```html
 * <nav cngxBreadcrumb [maxVisible]="4">
 *   <a cngxBreadcrumbItem href="/">Home</a>
 *   <cngx-breadcrumb-overflow />
 *   ...
 * </nav>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-overflow.component.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbBar, CngxBreadcrumbOverflowItem, CngxIconMenuButton, CngxPopoverPanel, CngxMenu
 * @slot cngxBreadcrumbOverflowItem Replaces a row inside the collapsed-crumbs menu; gets the crumb.
 * <example-url>/#/ui/breadcrumb/overflow/collapsed-menu</example-url>
 */
@Component({
  selector: 'cngx-breadcrumb-overflow',
  exportAs: 'cngxBreadcrumbOverflow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgTemplateOutlet,
    CngxMenu,
    CngxMenuItem,
    CngxIconMenuButton,
    CngxPopoverPanel,
  ],
  templateUrl: './breadcrumb-overflow.component.html',
  styleUrl: './breadcrumb-overflow.component.css',
})
export class CngxBreadcrumbOverflow {
  /** Collapse-set contract, provided by the surrounding `cngxBreadcrumb`. */
  protected readonly breadcrumb = injectOverflowBreadcrumb();

  private readonly ariaLabels = injectBreadcrumbAriaLabels();

  /** Accessible name of the ellipsis trigger. Unbound (`undefined`), it falls back through the config cascade to the EN default. */
  readonly triggerLabel = input<string | undefined>(undefined);
  /** Accessible name of the collapsed-crumb menu. Unbound (`undefined`), it falls back through the config cascade to the EN default. */
  readonly menuLabel = input<string | undefined>(undefined);

  protected readonly resolvedTriggerLabel = computed(
    () => this.triggerLabel() ?? this.ariaLabels().overflowTrigger,
  );
  protected readonly resolvedMenuLabel = computed(
    () => this.menuLabel() ?? this.ariaLabels().overflowMenu,
  );

  /**
   * Per-row template forwarded by {@link CngxBreadcrumbBar}. Lets the bar pass a
   * consumer-projected `*cngxBreadcrumbOverflowItem` into this composed overflow,
   * which it cannot reach as `contentChild`. Wins over the directly-projected
   * slot (controlled/uncontrolled: input first, query fallback).
   */
  readonly itemTemplateInput = input<
    TemplateRef<CngxBreadcrumbOverflowItemContext> | undefined
  >(undefined, { alias: 'itemTemplate' });

  /** Per-row template projected directly into this component (headless drop-in use). */
  private readonly itemTemplateQuery = contentChild(CngxBreadcrumbOverflowItem, {
    read: TemplateRef,
  });

  /** Resolved row template: a bar-forwarded input wins, else the directly-projected slot. */
  protected readonly itemTemplate = createControlledSource(
    this.itemTemplateInput,
    this.itemTemplateQuery,
  );
}

/**
 * Inject the {@link CNGX_BREADCRUMB} of the surrounding breadcrumb for
 * {@link CngxBreadcrumbOverflow}. Throws a `CngxRuntimeError` with code
 * `CNGX3024` when no breadcrumb is above it, in development and production
 * alike.
 *
 * @internal
 */
function injectOverflowBreadcrumb(): CngxBreadcrumbHost {
  const breadcrumb = inject(CNGX_BREADCRUMB, { optional: true });
  if (!breadcrumb) {
    throw new CngxRuntimeError(
      'CNGX3024',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        '[cngx-breadcrumb-overflow] must be placed inside an element with [cngxBreadcrumb].',
    );
  }
  return breadcrumb;
}
