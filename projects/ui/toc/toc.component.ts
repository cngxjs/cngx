import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
  viewChild,
  type Signal,
} from '@angular/core';
import { CngxScrollSpy, injectMediaQuery } from '@cngx/common/layout';

import { injectTocConfig } from './config/inject-toc-config';
import { CngxTocItemSlot } from './toc-item-slot';
import { CNGX_TOC, type CngxTocContract } from './toc-token';
import type { CngxTocItem } from './toc.types';

/** Shared empty result so the no-active-section trail is reference-stable. */
const EMPTY_IDS: readonly string[] = [];

/** Shared empty outline so the pre-scan / no-headings state is reference-stable. */
const EMPTY_ITEMS: readonly CngxTocItem[] = [];

/** Mutable node used while building the discovered tree, before it is frozen to CngxTocItem. */
interface MutableItem {
  id: string;
  label: string;
  children: MutableItem[];
}

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
  private readonly reducedMotion = injectMediaQuery('(prefers-reduced-motion: reduce)');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * The outline to render. Tree-shaped; nested `children` become sub-lists.
   * Ignored when `[autoDiscover]` is set - the headings under `contentRoot`
   * become the outline instead.
   */
  readonly items = input<readonly CngxTocItem[]>(EMPTY_ITEMS);
  /**
   * Derive the outline from the heading elements under `contentRoot` instead
   * of a hand-maintained `[items]` array. Headings nest by their level
   * (`h2 > h3`), and a heading with no `id` gets a slugified one written onto
   * it so the link can target it. Scans once after the first render; call
   * {@link refresh} after you inject or remove sections at runtime.
   */
  readonly autoDiscover = input(false, { transform: booleanAttribute });
  /** Which headings `[autoDiscover]` collects, in CSS-selector form. */
  readonly headingSelector = input<string>('h2, h3');
  /**
   * CSS selector for the scroll container the spy observes. `null` (default)
   * uses the viewport. Forwarded to the spy's `[root]`; also the root the
   * `[autoDiscover]` scan walks for headings.
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

  /** Headings discovered by the last `[autoDiscover]` scan. */
  private readonly discovered = signal<readonly CngxTocItem[]>(EMPTY_ITEMS);

  /** The outline actually rendered: the discovered headings when `[autoDiscover]` is on, else `[items]`. */
  protected readonly resolvedItems = computed(() =>
    this.autoDiscover() ? this.discovered() : this.items(),
  );

  /** Accessible name of the `nav` landmark, from the config cascade. */
  protected readonly navLabel = computed(() => this.cfg.ariaLabels?.nav ?? 'On this page');

  /**
   * Depth-first flat id list feeding `[cngxScrollSpy]`. `equal: idsEqual`
   * keeps the reference stable across same-shape re-sets so a re-render does
   * not re-create the observer.
   */
  protected readonly flatIds = computed(() => this.collectIds(this.resolvedItems()), {
    equal: idsEqual,
  });

  constructor() {
    // Re-scan whenever the discovery inputs change. The DOM read + discovered
    // write are deferred to a microtask so no signal is written during effect
    // execution (Pillar 1) and the just-rendered content has settled - the same
    // queueMicrotask discipline the panel-lifecycle focus restore uses.
    effect(() => {
      if (!this.autoDiscover()) {
        return;
      }
      this.contentRoot();
      this.headingSelector();
      queueMicrotask(() => this.refresh());
    });
  }

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

  /**
   * Scroll the section with this id into view and move focus to it. Honours
   * `prefers-reduced-motion` - the configured `scrollBehavior` is swapped for
   * `'auto'` (instant) whenever reduced motion is requested. A visual-only
   * jump is a silent state change for screen-reader users, so focus follows
   * the scroll (Pillar 2).
   */
  scrollTo(id: string): void {
    const target = this.doc.getElementById(id);
    if (target === null) {
      return;
    }
    const behavior = this.reducedMotion() ? 'auto' : (this.cfg.scrollBehavior ?? 'smooth');
    target.scrollIntoView({ behavior });
    this.focusTarget(target);
  }

  /** Click / Enter handler: takes over the native anchor jump, scrolls, and announces the activation. */
  protected handleActivate(item: CngxTocItem, event?: Event): void {
    event?.preventDefault();
    this.scrollTo(item.id);
    this.activated.emit(item);
  }

  /**
   * Move focus to the scrolled-to section. `preventScroll` keeps `focus()`
   * from fighting the smooth `scrollIntoView` above with a second instant
   * jump. Section elements are consumer-owned DOM, so `tabindex="-1"` is set
   * imperatively only when the element is not focusable by default and the
   * consumer set no `tabindex` - an author-set value is never overwritten.
   * That persistent attribute on borrowed DOM is the entry's tracked debt.
   */
  private focusTarget(target: HTMLElement): void {
    const needsTabindex = !target.hasAttribute('tabindex') && !this.isFocusableByDefault(target);
    if (needsTabindex) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }

  /** Elements that take focus without an author `tabindex`. */
  private isFocusableByDefault(el: HTMLElement): boolean {
    return /^(a|button|input|select|textarea|summary|iframe)$/i.test(el.tagName);
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
    const path = this.pathTo(id, this.resolvedItems());
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

  /**
   * Re-run the `[autoDiscover]` heading scan. No-op unless `[autoDiscover]` is
   * set and we are on the browser. Call it after injecting or removing sections
   * at runtime - discovery is one-shot by design, not a live observer.
   */
  refresh(): void {
    if (!this.autoDiscover() || !this.isBrowser) {
      return;
    }
    this.discovered.set(this.scanHeadings());
  }

  /** Walk the headings under `contentRoot` into a level-nested outline. */
  private scanHeadings(): readonly CngxTocItem[] {
    const rootSelector = this.contentRoot();
    const root: ParentNode = rootSelector ? (this.doc.querySelector(rootSelector) ?? this.doc) : this.doc;
    const headings = Array.from(root.querySelectorAll<HTMLElement>(this.headingSelector()));
    if (headings.length === 0) {
      return EMPTY_ITEMS;
    }

    const roots: MutableItem[] = [];
    const stack: { level: number; node: MutableItem }[] = [];
    const used = new Set<string>();

    for (const el of headings) {
      const level = this.headingLevel(el);
      const node: MutableItem = { id: this.ensureId(el, used), label: this.headingLabel(el), children: [] };
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.node.children.push(node);
      } else {
        roots.push(node);
      }
      stack.push({ level, node });
    }

    return roots.map((node) => this.freeze(node));
  }

  /** Numeric level of a heading element (`h2` -> 2). Non-heading matches read as level 1. */
  private headingLevel(el: HTMLElement): number {
    const match = /^h([1-6])$/i.exec(el.tagName);
    return match ? Number(match[1]) : 1;
  }

  /** Visible text of a heading, collapsed to a single spaced line. */
  private headingLabel(el: HTMLElement): string {
    return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Return the heading's id, generating and writing a slug when it has none.
   * The write mutates consumer-owned DOM (tracked debt); an author-set id is
   * kept verbatim. Collisions against prior scan ids and existing document ids
   * get a `-2`, `-3`, ... suffix.
   */
  private ensureId(el: HTMLElement, used: Set<string>): string {
    if (el.id) {
      used.add(el.id);
      return el.id;
    }
    const base = this.slugify(this.headingLabel(el)) || 'section';
    let candidate = base;
    let n = 2;
    while (used.has(candidate) || this.doc.getElementById(candidate) !== null) {
      candidate = `${base}-${n++}`;
    }
    used.add(candidate);
    el.setAttribute('id', candidate);
    return candidate;
  }

  /** Lowercase, strip diacritics-free non-alphanumerics to hyphens, collapse and trim. */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Freeze a mutable node into a CngxTocItem, dropping empty children arrays. */
  private freeze(node: MutableItem): CngxTocItem {
    if (node.children.length === 0) {
      return { id: node.id, label: node.label };
    }
    return { id: node.id, label: node.label, children: node.children.map((child) => this.freeze(child)) };
  }
}
