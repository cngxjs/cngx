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

import { CngxPopoverPanel, CngxPopoverTrigger } from '@cngx/common/popover';
import { createControlledSource } from '@cngx/core/utils';

import { CngxBreadcrumbSiblingItem } from './breadcrumb-sibling-item.directive';
import { CNGX_BREADCRUMB_SIBLINGS_SOURCE } from './breadcrumb-siblings-source.token';
import { injectBreadcrumbConfig } from './config/inject-breadcrumb-config';
import type { CngxBreadcrumbSibling } from './breadcrumb.types';

/**
 * Per-crumb lateral-navigation dropdown for a hand-composed breadcrumb trail.
 * Where {@link CngxBreadcrumbOverflow} lists the *collapsed ancestors* of the
 * current trail, this lists the *siblings at one level* - the alternatives a
 * user can jump sideways to (`Home > Region EU > Berlin` offering `Munich`,
 * `Hamburg`). It is a disclosure over lateral navigation: a
 * {@link CngxPopoverTrigger}-owned chevron reveals a {@link CngxPopoverPanel}
 * surface holding a `role="list"` of native `<a href>` anchors, and it
 * self-hides when there are no siblings. Native link semantics give keyboard
 * activation, screen-reader link roles, and middle-click for free - a command
 * menu would intercept activation and never navigate.
 *
 * It owns its own sibling data and never injects the collapse coordinator, so it
 * drops in anywhere a crumb needs a sideways picker. Rows come from the static
 * `[siblings]` input, or - opt-in - from a `CNGX_BREADCRUMB_SIBLINGS_SOURCE`
 * provider (the router-sync directive); the controlled source wins over the
 * input via a `computed` (Pillar 1: no effect writes). The active level carries
 * `aria-current="page"` and renders no link.
 *
 * ```html
 * <nav cngxBreadcrumb>
 *   <a cngxBreadcrumbItem href="/">Home</a>
 *   <a cngxBreadcrumbItem href="/eu">Region EU</a>
 *   <cngx-breadcrumb-siblings [siblings]="cities" />
 * </nav>
 * ```
 *
 * @category ui/breadcrumb
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-siblings.component.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbSiblingItem, CngxBreadcrumbSiblingsRouterSync, CngxBreadcrumbSiblingsSource, CngxBreadcrumbBar, CngxPopoverPanel, CngxPopoverTrigger
 * <example-url>http://localhost:4200/#/ui/breadcrumb/siblings/static-siblings</example-url>
 */
@Component({
  selector: 'cngx-breadcrumb-siblings',
  exportAs: 'cngxBreadcrumbSiblings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, CngxPopoverPanel, CngxPopoverTrigger],
  templateUrl: './breadcrumb-siblings.component.html',
  styleUrl: './breadcrumb-siblings.component.css',
})
export class CngxBreadcrumbSiblings {
  /** Static sibling rows. Superseded by a provided `CNGX_BREADCRUMB_SIBLINGS_SOURCE`. */
  readonly siblingsInput = input<readonly CngxBreadcrumbSibling[]>([], { alias: 'siblings' });

  private readonly cfg = injectBreadcrumbConfig();

  /** Accessible name of the chevron trigger. Falls back through the config cascade to the EN default. */
  readonly triggerLabel = input(this.cfg.ariaLabels?.siblingsTrigger ?? 'Show sibling pages');
  /** Accessible name of the sibling list (kept as `menuLabel` for overflow symmetry). Falls back through the config cascade to the EN default. */
  readonly menuLabel = input(this.cfg.ariaLabels?.siblingsMenu ?? 'Sibling pages');

  /** Opt-in controlled source (router-sync directive) - wins over `[siblings]`. */
  private readonly source = inject(CNGX_BREADCRUMB_SIBLINGS_SOURCE, { optional: true });

  /** Rows the dropdown renders: controlled source wins, else the static input. */
  protected readonly items = createControlledSource(this.source?.siblings, this.siblingsInput);

  /** Drives the self-hide: no trigger, no panel when there are no siblings. */
  protected readonly hasSiblings = computed(() => this.items().length > 0);

  /** Per-row template overriding the default sibling row, when projected. */
  protected readonly itemTemplate = contentChild(CngxBreadcrumbSiblingItem, { read: TemplateRef });
}
