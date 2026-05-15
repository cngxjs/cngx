import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ROUTES_META, type RouteMeta } from '../_routes-meta';

const STORAGE_KEY = 'cngx-examples-tree-open';

function loadOpenSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null as unknown as Set<string>;
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === 'string')) : (null as unknown as Set<string>);
  } catch {
    return null as unknown as Set<string>;
  }
}

function saveOpenSet(set: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* quota / private mode — ignore */
  }
}

/**
 * Generic path-driven tree node. Internal nodes are folders (have children);
 * leaf nodes carry a `route` reference. Every level uses the same `name` =
 * filesystem-style slug, so `_uncategorised` buckets disappear automatically
 * and flatDemo collapses (card/card → card) fall out of the path layout.
 */
interface TreeNode {
  /** Slug segment for this level — matches the filesystem name. */
  name: string;
  /** Accumulated key for localStorage persistence. */
  key: string;
  children: TreeNode[];
  /** Leaf only: the originating route. */
  route?: RouteMeta;
  /** Folder only: total leaf count under this subtree. */
  leafCount: number;
  /** Distance from the root, starting at 0 for the lib level. */
  depth: number;
}

function buildTree(routes: readonly RouteMeta[]): TreeNode[] {
  const root = new Map<string, TreeNode>();

  function getOrCreate(map: Map<string, TreeNode>, name: string, key: string, depth: number): TreeNode {
    let node = map.get(name);
    if (!node) {
      node = { name, key, children: [], leafCount: 0, depth };
      map.set(name, node);
    }
    return node;
  }

  for (const r of routes) {
    const segments = r.path.split('/');
    let parentMap = root;
    let parentKey = '';
    for (let i = 0; i < segments.length; i++) {
      const name = segments[i];
      const key = parentKey === '' ? name : parentKey + '/' + name;
      const isLeaf = i === segments.length - 1;
      const childMap = i === 0 ? parentMap : (parentMap as unknown as Map<string, TreeNode>);
      const node = getOrCreate(childMap, name, key, i);
      if (isLeaf) {
        node.route = r;
      } else if (!(node as unknown as { _map?: Map<string, TreeNode> })._map) {
        // Stash a working child map on the node so we can find/insert children
        // efficiently during construction. Stripped before return.
        Object.assign(node, { _map: new Map<string, TreeNode>() });
      }
      const map = (node as unknown as { _map?: Map<string, TreeNode> })._map;
      parentMap = (map ?? parentMap) as Map<string, TreeNode>;
      parentKey = key;
    }
  }

  // Drain the working maps into ordered `children` arrays + compute leafCount.
  function finalize(node: TreeNode): number {
    const map = (node as unknown as { _map?: Map<string, TreeNode> })._map;
    if (map) {
      node.children = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
      delete (node as unknown as { _map?: Map<string, TreeNode> })._map;
    }
    if (node.route) {
      node.leafCount = 1;
    } else {
      node.leafCount = node.children.reduce((n, c) => n + finalize(c), 0);
    }
    return node.leafCount;
  }

  const tops = [...root.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const t of tops) finalize(t);
  return tops;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink],
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

    @if (tree().length === 0) {
      <div class="row"><span class="ico">[ ]</span><span class="name empty">No matches.</span></div>
    }

    @for (top of tree(); track top.key) {
      <ng-container *ngTemplateOutlet="node; context: { $implicit: top }" />
    }

    <ng-template #node let-n>
      @if (n.route) {
        <div class="row leaf" [style.padding-left.px]="56 + n.depth * 18">
          <span class="ico">[&nbsp;&nbsp;&nbsp;]</span>
          <span class="name">
            <a [routerLink]="['/', ...n.route.path.split('/')]">{{ n.name }}</a>
          </span>
          <span class="size">—</span>
        </div>
      } @else {
        <details
          [attr.open]="isOpen(n.key) ? '' : null"
          (toggle)="onToggle(n.key, $event)"
        >
          <summary class="row folder" [class.lvl-0]="n.depth === 0">
            <span class="ico">[DIR]</span>
            <span class="name" [style.padding-left.px]="n.depth * 18">{{ n.depth === 0 ? '&#64;cngx/' + n.name + '/' : n.name + '/' }}</span>
            <span class="size">{{ n.leafCount }}</span>
          </summary>
          @for (child of n.children; track child.key) {
            <ng-container *ngTemplateOutlet="node; context: { $implicit: child }" />
          }
        </details>
      }
    </ng-template>

    <hr />
    <address>cngx/examples · {{ totalRoutes }} routes</address>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 980px;
        margin: 0 auto;
        padding: 14px 16px 32px;
        font-family: Verdana, Geneva, Arial, sans-serif;
        font-size: 14px;
        color: #000;
        background: #fff;
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
      .filter-row label { color: #000; }
      .filter-row input {
        flex: 1;
        max-width: 420px;
        padding: 2px 6px;
        font: inherit;
        font-size: 0.875rem;
        border: 1px solid #888;
        background: #fff;
        color: #000;
        border-radius: 0;
      }
      .filter-row input:focus-visible {
        outline: 1px dotted #000;
        outline-offset: 1px;
      }
      .filter-row .meta { color: #555; font-size: 0.8125rem; }
      .filter-row .toggle-all {
        padding: 2px 10px;
        font: inherit;
        font-size: 0.8125rem;
        color: #000;
        background: #f4f4f4;
        border: 1px solid #888;
        border-radius: 0;
        cursor: pointer;
      }
      .filter-row .toggle-all:hover { background: #e8e8e8; }
      .filter-row .toggle-all:active { background: #ddd; }
      .filter-row .toggle-all:focus-visible { outline: 1px dotted #000; outline-offset: 1px; }
      hr {
        border: none;
        border-top: 1px solid #888;
        margin: 6px 0;
      }
      .row {
        display: grid;
        grid-template-columns: 56px 1fr 100px;
        gap: 12px;
        align-items: baseline;
        padding: 1px 4px;
        line-height: 1.5;
      }
      .row.head {
        font-weight: 700;
        color: #000;
      }
      .row .ico {
        font-family: 'Courier New', Courier, monospace;
        color: #555;
        font-size: 0.8125rem;
      }
      .row .size {
        text-align: right;
        color: #555;
        font-size: 0.8125rem;
      }
      .row .name {
        color: #000;
        font-size: 0.875rem;
      }
      .row .name.empty { color: #888; font-style: italic; }
      .row.folder.lvl-0 .name { font-weight: 700; }
      details > summary {
        list-style: none;
        cursor: pointer;
      }
      details > summary::-webkit-details-marker { display: none; }
      details > summary:hover { background: #f4f4f4; }
      details > summary .ico::before {
        content: '[+] ';
        font-weight: normal;
        color: #555;
        font-family: 'Courier New', monospace;
        font-size: 0.8125rem;
      }
      details[open] > summary .ico::before { content: '[-] '; }
      details > summary .ico {
        position: relative;
      }
      /* Pre-marker eats space; hide the original [DIR] text after the toggle. */
      details > summary .ico { font-size: 0; }
      details > summary .ico::after {
        content: '';
      }
      a {
        color: #0000ee;
        text-decoration: underline;
      }
      a:visited { color: #551a8b; }
      a:hover { color: #cc0000; background: #ffffcc; }
      address {
        font-style: normal;
        font-size: 0.75rem;
        color: #555;
        margin-top: 8px;
      }
    `,
  ],
})
export class HomeComponent {
  protected readonly totalRoutes = ROUTES_META.length;
  protected readonly term = signal('');

  protected readonly filtered = computed<readonly RouteMeta[]>(() => {
    const t = this.term().trim().toLowerCase();
    if (!t) return ROUTES_META;
    return ROUTES_META.filter((r) => {
      const haystack = `${r.lib} ${r.category} ${r.demo} ${r.section} ${r.apiComponents.join(' ')}`.toLowerCase();
      return haystack.includes(t);
    });
  });

  protected readonly tree = computed(() => buildTree(this.filtered()));
  protected readonly routesMatched = computed(() => this.filtered().length);
  protected readonly autoOpen = computed(() => this.term().trim().length > 0);

  /** Every collapsible node key in the *unfiltered* tree. Used by toggle-all. */
  private readonly allKeys = computed<readonly string[]>(() => {
    const keys: string[] = [];
    const walk = (n: TreeNode) => {
      if (!n.route) {
        keys.push(n.key);
        for (const c of n.children) walk(c);
      }
    };
    for (const t of buildTree(ROUTES_META)) walk(t);
    return keys;
  });

  private readonly persistedOpen = signal<Set<string>>(
    loadOpenSet() ?? new Set(buildTree(ROUTES_META).map((t) => t.key)),
  );

  protected readonly allOpen = computed(() => {
    const open = this.persistedOpen();
    return this.allKeys().every((k) => open.has(k));
  });

  constructor() {
    effect(() => saveOpenSet(this.persistedOpen()));
  }

  protected isOpen(key: string): boolean {
    return this.autoOpen() || this.persistedOpen().has(key);
  }

  protected onToggle(key: string, event: Event): void {
    if (this.autoOpen()) return;
    const open = (event.target as HTMLDetailsElement).open;
    this.persistedOpen.update((set) => {
      const next = new Set(set);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  protected toggleAll(): void {
    if (this.allOpen()) {
      this.persistedOpen.set(new Set());
    } else {
      this.persistedOpen.set(new Set(this.allKeys()));
    }
  }

  protected setTerm(value: string): void {
    this.term.set(value);
  }
}
