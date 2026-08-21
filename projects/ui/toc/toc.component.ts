import { DOCUMENT } from '@angular/common';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  output,
  ViewEncapsulation,
  viewChild,
  type Signal,
} from '@angular/core';
import { CngxScrollSpy } from '@cngx/common/layout';

import { injectTocConfig } from './config/inject-toc-config';
import { CngxTocItemSlot } from './toc-item-slot';
import { CNGX_TOC, type CngxTocContract } from './toc-token';
import type { CngxTocItem } from './toc.types';

/** Shared empty result so the no-active-section trail is reference-stable. */
const EMPTY_IDS: readonly string[] = [];

/** Element-wise string-array compare - the shared comparator for both the flat-id list and the active trail. */
function idsEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * "On this page" navigation rail. Renders a `<nav>` of anchor links from a
 * {@link CngxTocItem} outline, tracks the most-visible section through an
 * internal {@link CngxScrollSpy}, and communicates the active link via
 * `aria-current` inside the `computed()` graph. Nested items render as
 * indented sub-lists; native link semantics and tab order stay intact (a toc
 * is a navigation landmark of links, not a treeview).
 *
 * Composition over configuration: the spy is bound in this component's own
 * template rather than via `hostDirectives`, because the organism - not the
 * consumer - owns the flat id list the spy observes, and `[cngxScrollSpy]` is
 * a required input. The spy resolves its targets through `getElementById`, so
 * its host placement is irrelevant to its function.
 *
 * @category ui/toc
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/toc/toc.component.ts
 * @since 0.1.0
 * @relatedTo CngxScrollSpy, CngxTocRouterSync, CngxSidenav
 * <example-url>http://localhost:4200/#/ui/toc/basic/on-this-page-rail</example-url>
 */
@Component({
  selector: 'cngx-toc',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, CngxScrollSpy],
  providers: [{ provide: CNGX_TOC, useExisting: CngxToc }],
  templateUrl: './toc.component.html',
  styleUrl: './toc.component.css',
})
export class CngxToc implements CngxTocContract {
  private readonly doc = inject(DOCUMENT);
  private readonly cfg = injectTocConfig();

  /** The outline to render. Tree-shaped; nested `children` become sub-lists. */
  readonly items = input.required<readonly CngxTocItem[]>();
  /**
   * CSS selector for the scroll container the spy observes. `null` (default)
   * uses the viewport. Forwarded to the spy's `[root]`.
   */
  readonly contentRoot = input<string | null>(null);
  /** Root margin forwarded to the spy. Defaults to the config cascade. */
  readonly rootMargin = input<string>(this.cfg.spy?.rootMargin ?? '0px');
  /** Minimum visibility ratio forwarded to the spy. Defaults to the config cascade. */
  readonly threshold = input<number>(this.cfg.spy?.threshold ?? 0.3);

  /** Fires when a link is activated (click / Enter). */
  readonly activated = output<CngxTocItem>();

  private readonly spy = viewChild(CngxScrollSpy);
  private readonly itemSlot = contentChild(CngxTocItemSlot);

  /** Accessible name of the `nav` landmark, from the config cascade. */
  protected readonly navLabel = computed(() => this.cfg.ariaLabels?.nav ?? 'On this page');

  /**
   * Depth-first flat id list feeding `[cngxScrollSpy]`. `equal: idsEqual`
   * keeps the reference stable across same-shape re-sets so a re-render does
   * not re-create the observer.
   */
  protected readonly flatIds = computed(() => this.collectIds(this.items()), { equal: idsEqual });

  /**
   * The active section, or `null`. `viewChild` is a view query, so `spy()` is
   * `undefined` during the creation pass; `?? null` makes that an explicit
   * value every downstream computed is defined at.
   */
  readonly activeId: Signal<string | null> = computed(() => this.spy()?.activeId() ?? null);

  /**
   * Ancestor-id chain of the active leaf - the parent links that get
   * `data-active-trail`. Same `equal` as `flatIds`: an array-valued computed
   * feeding an attribute binding must not allocate a fresh array every spy
   * tick (reference_signal_architecture Equality Rule).
   */
  protected readonly activeTrail = computed(() => this.computeTrail(), { equal: idsEqual });

  /** Resolved item template: instance slot -> config default -> built-in label. */
  protected readonly resolvedItemTpl = computed(
    () => this.itemSlot()?.templateRef ?? this.cfg.templates?.item ?? null,
  );

  /** Scroll the section with this id into view. Enriched with reduced-motion + focus handoff in a later commit. */
  scrollTo(id: string): void {
    const target = this.doc.getElementById(id);
    if (target === null) {
      return;
    }
    target.scrollIntoView({ behavior: this.cfg.scrollBehavior ?? 'smooth' });
  }

  /** Depth-first collect of every id in the outline. */
  private collectIds(items: readonly CngxTocItem[], acc: string[] = []): string[] {
    for (const item of items) {
      acc.push(item.id);
      if (item.children?.length) {
        this.collectIds(item.children, acc);
      }
    }
    return acc;
  }

  /** Ancestor ids of the active leaf (path from root, excluding the leaf itself). */
  private computeTrail(): readonly string[] {
    const id = this.activeId();
    if (id === null) {
      return EMPTY_IDS;
    }
    const path = this.pathTo(id, this.items());
    return path ? path.slice(0, -1) : EMPTY_IDS;
  }

  /** Root-to-target id path, or `null` when the id is not in the outline. */
  private pathTo(target: string, items: readonly CngxTocItem[]): readonly string[] | null {
    for (const item of items) {
      if (item.id === target) {
        return [item.id];
      }
      const childPath = item.children?.length ? this.pathTo(target, item.children) : null;
      if (childPath) {
        return [item.id, ...childPath];
      }
    }
    return null;
  }
}
