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

import { CNGX_BREADCRUMB, CngxMenu, CngxMenuItem, CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverPanel, CngxPopoverTrigger } from '@cngx/common/popover';

import {
  CngxBreadcrumbOverflowItem,
  type CngxBreadcrumbOverflowItemContext,
} from './breadcrumb-overflow-item.directive';

/**
 * Drop-in overflow menu for {@link CngxBreadcrumbBar}. Presents the crumbs the
 * headless trail collapsed as a real dropdown: an ellipsis trigger plus a
 * {@link CngxPopoverPanel} surface hosting a {@link CngxMenu} of the collapsed
 * crumbs. It reads the collapse set through the {@link CNGX_BREADCRUMB} DI
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
 * @category ui/breadcrumb
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-overflow.component.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbBar, CngxBreadcrumbOverflowItem, CngxPopoverPanel, CngxPopoverTrigger, CngxMenu, CngxMenuTrigger
 * <example-url>http://localhost:4200/#/ui/breadcrumb/overflow/collapsed-menu</example-url>
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
    CngxMenuTrigger,
    CngxPopoverPanel,
    CngxPopoverTrigger,
  ],
  templateUrl: './breadcrumb-overflow.component.html',
  styleUrl: './breadcrumb-overflow.component.css',
})
export class CngxBreadcrumbOverflow {
  /** Collapse-set contract, provided by the surrounding `cngxBreadcrumb`. */
  protected readonly breadcrumb = inject(CNGX_BREADCRUMB);

  /** Accessible name of the ellipsis trigger. EN default. */
  readonly triggerLabel = input('Show collapsed breadcrumbs');
  /** Accessible name of the collapsed-crumb menu. EN default. */
  readonly menuLabel = input('Collapsed breadcrumbs');

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
  protected readonly itemTemplate = computed(
    () => this.itemTemplateInput() ?? this.itemTemplateQuery(),
  );
}
