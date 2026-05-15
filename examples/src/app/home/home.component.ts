import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CngxActiveDescendant } from '@cngx/common/a11y';
import {
  CngxHierarchicalNav,
  createTreeAdItems,
  createTreeController,
} from '@cngx/common/interactive';
import type { CngxTreeNode } from '@cngx/utils';
import { ROUTES_META, type RouteMeta } from '../_routes-meta';

const STORAGE_KEY = 'cngx-examples-tree-open';

function loadOpenIds(): readonly string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : null;
  } catch {
    return null;
  }
}

function saveOpenIds(ids: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* quota / private mode — ignore */
  }
}

interface NodeValue {
  /** Stable id — full slash-joined path from root. */
  readonly key: string;
  /** Filesystem-style segment for this level. */
  readonly name: string;
  /** True at depth 0 (lib level — rendered as `@cngx/<lib>/`). */
  readonly isLib: boolean;
  /** Present only on leaves; carries the navigation target. */
  readonly route?: RouteMeta;
}

interface TreeBuilder {
  children: Map<string, TreeBuilder>;
  value: NodeValue;
}

/** Build a CngxTreeNode tree from the flat route list. */
function buildCngxTree(routes: readonly RouteMeta[]): readonly CngxTreeNode<NodeValue>[] {
  const roots = new Map<string, TreeBuilder>();
  for (const r of routes) {
    const segments = r.path.split('/');
    let parent = roots;
    let cumKey = '';
    for (let i = 0; i < segments.length; i++) {
      const name = segments[i];
      const key = cumKey === '' ? name : cumKey + '/' + name;
      let node = parent.get(name);
      if (!node) {
        node = {
          children: new Map(),
          value: { key, name, isLib: i === 0 },
        };
        parent.set(name, node);
      }
      cumKey = key;
      if (i === segments.length - 1) {
        node.value = { ...node.value, route: r };
      }
      parent = node.children;
    }
  }
  function toTree(map: Map<string, TreeBuilder>): readonly CngxTreeNode<NodeValue>[] {
    return [...map.values()]
      .sort((a, b) => a.value.name.localeCompare(b.value.name))
      .map((b) => ({
        value: b.value,
        label: b.value.name,
        children: b.children.size > 0 ? toTree(b.children) : undefined,
      }));
  }
  return toTree(roots);
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, CngxActiveDescendant, CngxHierarchicalNav],
  template: `
    <h1>Index of /cngx-examples</h1>

    <div class="filter-row">
      <label for="q">Filter:</label>
      <input
        id="q"
        name="q"
        #search
        type="search"
        autofocus
        placeholder="lib · category · demo · section · API symbol"
        [value]="term()"
        (input)="setTerm(search.value)"
      />
      <button type="button" class="toggle-all" (click)="toggleAll()">
        {{ allOpen() ? 'Collapse all' : 'Expand all' }}
      </button>
      <span class="meta">{{ routesMatched() }} of {{ totalRoutes }} entries</span>
    </div>

    <hr />

    <div class="row head">
      <span class="ico">[ICO]</span>
      <span class="name">Name</span>
      <span class="size">Sections</span>
    </div>

    <hr />

    @if (visibleNodes().length === 0) {
      <div class="row"><span class="ico">[ ]</span><span class="name empty">No matches.</span></div>
    } @else {
      <div
        #tree
        class="tree"
        role="tree"
        aria-label="cngx examples"
        tabindex="0"
        cngxActiveDescendant
        #ad="cngxActiveDescendant"
        [items]="adItems()"
        [autoHighlightFirst]="true"
        [cngxHierarchicalNav]="controller"
        (activated)="handleActivated($event)"
      >
        @for (n of visibleNodes(); track n.id) {
          @if (n.value.route) {
            <a
              role="treeitem"
              [id]="n.id"
              [attr.aria-level]="n.depth + 1"
              [attr.aria-setsize]="n.setsize"
              [attr.aria-posinset]="n.posinset"
              [routerLink]="['/', ...n.value.route.path.split('/')]"
              class="row leaf"
              [class.is-active]="ad.activeId() === n.id"
            >
              <span class="ico">[&nbsp;&nbsp;&nbsp;]</span>
              <span class="name" [style.padding-left.px]="n.depth * 18">{{ n.value.name }}</span>
              <span class="size">—</span>
            </a>
          } @else {
            <div
              role="treeitem"
              [id]="n.id"
              [attr.aria-level]="n.depth + 1"
              [attr.aria-setsize]="n.setsize"
              [attr.aria-posinset]="n.posinset"
              [attr.aria-expanded]="controller.isExpanded(n.id)()"
              (click)="controller.toggle(n.id)"
              class="row folder"
              [class.lvl-0]="n.depth === 0"
              [class.is-active]="ad.activeId() === n.id"
            >
              <span
                class="ico"
                [attr.data-state]="controller.isExpanded(n.id)() ? 'open' : 'closed'"
              ></span>
              <span class="name" [style.padding-left.px]="n.depth * 18">{{
                n.depth === 0 ? '&#64;cngx/' + n.value.name + '/' : n.value.name + '/'
              }}</span>
              <span class="size">{{ leafCountFor(n.id) }}</span>
            </div>
          }
        }
      </div>
    }

    <hr />
    <address>cngx/examples · {{ totalRoutes }} routes</address>
    <footer class="site-footer">
      <a
        class="site-footer__link"
        href="https://github.com/cngxjs/cngx"
        rel="noopener noreferrer"
        (click)="$event.stopPropagation()"
      >
        <svg
          class="site-footer__ico"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2 .37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
        github.com/cngxjs/cngx
      </a>
      <span class="site-footer__sep">·</span>
      <a
        class="site-footer__link"
        href="https://cngxjs.github.io/cngx/"
        rel="noopener noreferrer"
        (click)="$event.stopPropagation()"
      >
        Documentation
      </a>
      <span class="site-footer__sep">·</span>
      <code class="site-footer__motto">Built with ❤️ and architectural precision</code>
    </footer>
  `,
  styles: [
    `
      :host {
        --col-bg: #fff;
        --col-text: #000;
        --col-muted: #555;
        --col-faint: #888;
        --col-border: #888;
        --col-hover: #f4f4f4;
        --col-active: #e8e8e8;
        --col-pressed: #ddd;
        --col-link: #0000ee;
        --col-link-visited: #551a8b;
        --col-link-hover: #cc0000;
        --col-link-hover-bg: #ffffcc;
        --col-focus: #000;

        display: block;
        max-width: 980px;
        margin: 0 auto;
        padding: 14px 16px 32px;
        font-family: Verdana, Geneva, Arial, sans-serif;
        font-size: 14px;
        color: var(--col-text);
        background: var(--col-bg);
        box-sizing: border-box;
        color-scheme: light dark;
      }
      @media (prefers-color-scheme: dark) {
        :host {
          --col-bg: #111;
          --col-text: #e6e6e6;
          --col-muted: #aaa;
          --col-faint: #777;
          --col-border: #555;
          --col-hover: #1f1f1f;
          --col-active: #2a2a2a;
          --col-pressed: #333;
          --col-link: #79c0ff;
          --col-link-visited: #c39df0;
          --col-link-hover: #ff7b72;
          --col-link-hover-bg: #2d1f1f;
          --col-focus: #fff;
        }
      }
      h1 {
        margin: 0 0 12px;
        font-size: 1.5rem;
        font-weight: 700;
      }
      .filter-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 0.875rem;
      }
      .filter-row label {
        color: var(--col-text);
      }
      .filter-row input {
        flex: 1;
        max-width: 420px;
        padding: 2px 6px;
        font: inherit;
        font-size: 0.875rem;
        border: 1px solid var(--col-border);
        background: var(--col-bg);
        color: var(--col-text);
        border-radius: 0;
      }
      .filter-row input:focus-visible {
        outline: 1px dotted var(--col-focus);
        outline-offset: 1px;
      }
      .filter-row .meta {
        color: var(--col-muted);
        font-size: 0.8125rem;
      }
      .filter-row .toggle-all {
        padding: 2px 10px;
        font: inherit;
        font-size: 0.8125rem;
        color: var(--col-text);
        background: var(--col-hover);
        border: 1px solid var(--col-border);
        border-radius: 0;
        cursor: pointer;
      }
      .filter-row .toggle-all:hover {
        background: var(--col-active);
      }
      .filter-row .toggle-all:active {
        background: var(--col-pressed);
      }
      .filter-row .toggle-all:focus-visible {
        outline: 1px dotted var(--col-focus);
        outline-offset: 1px;
      }
      hr {
        border: none;
        border-top: 1px solid var(--col-border);
        margin: 6px 0;
      }
      .tree {
        outline: none;
      }
      .tree:focus-visible {
        outline: 1px dotted var(--col-focus);
        outline-offset: 2px;
      }
      .row {
        display: grid;
        grid-template-columns: 56px 1fr 100px;
        gap: 12px;
        align-items: baseline;
        padding: 1px 4px;
        line-height: 1.5;
        text-decoration: none;
        color: inherit;
      }
      .row.head {
        font-weight: 700;
        color: var(--col-text);
      }
      .row .ico {
        font-family: 'Courier New', Courier, monospace;
        color: var(--col-muted);
        font-size: 0.8125rem;
      }
      .row.folder .ico::before {
        content: '[+] ';
        font-family: 'Courier New', monospace;
      }
      .row.folder .ico[data-state='open']::before {
        content: '[-] ';
      }
      .row.folder.lvl-0 .name {
        font-weight: 700;
      }
      .row .size {
        text-align: right;
        color: var(--col-muted);
        font-size: 0.8125rem;
      }
      .row .name {
        color: var(--col-text);
        font-size: 0.875rem;
      }
      .row .name.empty {
        color: var(--col-faint);
        font-style: italic;
      }
      .row.folder {
        cursor: pointer;
      }
      .row.folder:hover,
      .row.folder.is-active {
        background: var(--col-hover);
      }
      a.row.leaf .name {
        color: var(--col-link);
        text-decoration: underline;
      }
      a.row.leaf:visited .name {
        color: var(--col-link-visited);
      }
      a.row.leaf:hover .name,
      a.row.leaf.is-active .name {
        color: var(--col-link-hover);
      }
      a.row.leaf:hover,
      a.row.leaf.is-active {
        background: var(--col-link-hover-bg);
      }
      address {
        font-style: normal;
        font-size: 0.75rem;
        color: var(--col-muted);
        margin-top: 8px;
      }
      .site-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        font-size: 0.8125rem;
        color: var(--col-muted);
      }
      .site-footer__link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--col-link);
        text-decoration: underline;
      }
      .site-footer__link:visited {
        color: var(--col-link-visited);
      }
      .site-footer__link:hover {
        color: var(--col-link-hover);
        background: var(--col-link-hover-bg);
      }
      .site-footer__ico {
        flex-shrink: 0;
      }
      .site-footer__sep {
        color: var(--col-faint);
      }
      .site-footer__motto {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.75rem;
        color: var(--col-muted);
      }
    `,
  ],
})
export class HomeComponent {
  private readonly router = inject(Router);
  protected readonly totalRoutes = ROUTES_META.length;
  protected readonly term = signal('');

  private readonly filtered = computed<readonly RouteMeta[]>(() => {
    const t = this.term().trim().toLowerCase();
    if (!t) {
      return ROUTES_META;
    }
    return ROUTES_META.filter((r) => {
      const haystack =
        `${r.lib} ${r.category} ${r.demo} ${r.section} ${r.apiComponents.join(' ')}`.toLowerCase();
      return haystack.includes(t);
    });
  });

  protected readonly routesMatched = computed(() => this.filtered().length);
  private readonly treeNodes = computed(() => buildCngxTree(this.filtered()));

  protected readonly controller = createTreeController<NodeValue>({
    nodes: this.treeNodes,
    nodeIdFn: (v) => v.key,
    labelFn: (v) => v.name,
    initiallyExpanded: loadOpenIds() ?? 'none',
  });
  protected readonly adItems = createTreeAdItems(this.controller);
  protected readonly visibleNodes = this.controller.visibleNodes;

  /** Cached leaf counts per folder id — derived from the unfiltered tree. */
  private readonly fullLeafCounts = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    const fullTree = buildCngxTree(ROUTES_META);
    function walk(nodes: readonly CngxTreeNode<NodeValue>[]): number {
      let n = 0;
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          const sub = walk(node.children);
          map.set(node.value.key, sub);
          n += sub;
        } else {
          n += 1;
        }
      }
      return n;
    }
    walk(fullTree);
    return map;
  });

  protected leafCountFor(id: string): number {
    return this.fullLeafCounts().get(id) ?? 0;
  }

  protected readonly allOpen = computed(() => {
    const expanded = this.controller.expandedIds();
    // "All open" = every folder in the FULL (unfiltered) tree is expanded.
    for (const id of this.fullLeafCounts().keys()) {
      if (!expanded.has(id)) {
        return false;
      }
    }
    return this.fullLeafCounts().size > 0;
  });

  private filterSnapshot: ReadonlySet<string> | null = null;

  constructor() {
    // Persist user-driven expansion to localStorage, but ignore writes while
    // a filter is active so the snapshot survives the auto-expand churn.
    effect(() => {
      const ids = this.controller.expandedIds();
      const filtering = this.term().trim().length > 0;
      if (!filtering) {
        untracked(() => saveOpenIds(ids));
      }
    });

    // Filter mode: snapshot the current expanded set, then expand everything
    // so matches stay visible. Restore the snapshot when the filter clears.
    effect(() => {
      const filtering = this.term().trim().length > 0;
      untracked(() => {
        if (filtering && this.filterSnapshot === null) {
          this.filterSnapshot = new Set(this.controller.expandedIds());
          this.controller.expandAll();
        } else if (!filtering && this.filterSnapshot !== null) {
          this.controller.collapseAll();
          for (const id of this.filterSnapshot) {
            this.controller.expand(id);
          }
          this.filterSnapshot = null;
        }
      });
    });
  }

  protected setTerm(value: string): void {
    this.term.set(value);
  }

  /**
   * CngxActiveDescendant `activated` (Enter / Space on a treeitem):
   * - Leaf  → router-navigate to the section
   * - Folder → toggle expand
   */
  protected handleActivated(value: unknown): void {
    const v = value as NodeValue | null | undefined;
    if (!v) {
      return;
    }
    if (v.route) {
      this.router.navigateByUrl('/' + v.route.path);
    } else {
      this.controller.toggle(v.key);
    }
  }

  protected toggleAll(): void {
    if (this.allOpen()) {
      this.controller.collapseAll();
    } else {
      this.controller.expandAll();
    }
  }
}
