import {
  computed,
  inject,
  InjectionToken,
  signal,
  type Signal,
  untracked,
} from '@angular/core';
import {
  type CngxTreeNode,
  type FlatTreeNode,
  collectDescendantValues,
  flattenTree,
  isNodeVisible,
} from '@cngx/utils';
import { CNGX_TREE_CONFIG } from './tree-config';

/**
 * Configuration for {@link createTreeController}.
 *
 * `nodeIdFn` is required on purpose: the controller hands its ids out to
 * `expandedIds`, to selection memoization (`keyFn` consumers), and to the
 * stable-identity `isExpanded(id)` signal cache. A non-stable id (e.g. the
 * path-based fallback from `flattenTree`) silently breaks all three the
 * moment the tree is sorted or filtered — exactly the Sort/Filter
 * integration pattern this stack is designed to support. Forcing the
 * caller to think about identity at construction eliminates that whole
 * class of heisenbugs.
 *
 * @category interactive
 */
export interface CngxTreeControllerOptions<T> {
  /** Source tree — the controller re-derives on every change. */
  readonly nodes: Signal<readonly CngxTreeNode<T>[]>;
  /**
   * Derives a stable id per flat node — must survive re-ordering and
   * filtering of the source tree. Use a domain id (`(v) => v.id`)
   * rather than a positional fallback.
   *
   * Resolution: per-options > app-wide `provideTreeConfig` default >
   * dev-mode error. At least one source must provide the function.
   */
  readonly nodeIdFn?: (value: T, path: readonly number[]) => string;
  /**
   * Visible label. Defaults (in resolution order): per-options >
   * `provideTreeConfig` default > `String(value)`.
   */
  readonly labelFn?: (value: T) => string;
  /**
   * Membership key. Defaults (in resolution order): per-options >
   * `provideTreeConfig` default > identity.
   */
  readonly keyFn?: (value: T) => unknown;
  /**
   * Initial expansion. Resolution: per-options >
   * `provideTreeConfig.defaultInitiallyExpanded` > `'none'`.
   * Evaluated once at construction; later tree changes do not re-apply.
   * Re-trigger via `expandAll()` if needed.
   */
  readonly initiallyExpanded?: 'all' | 'none' | readonly string[];
  /**
   * Bound the `isExpanded(id)` signal cache. Default: unlimited.
   * Resolution: per-options > `provideTreeConfig.cacheLimit` >
   * unlimited. See {@link CngxTreeConfig.cacheLimit} for trade-offs.
   */
  readonly cacheLimit?: number;
}

/**
 * Signal-native tree controller. Produces flat-projected views of a
 * hierarchical source, owns the expansion-set, and exposes value- and
 * id-based lookups used by the surrounding render / keyboard-nav layers.
 *
 * ## Derivation contract
 * - No `effect()`, no subscriptions. The only writable slot is the internal
 *   expandedIds set; every other accessor is a `computed()` or pure fn.
 * - `isExpanded(id)` returns the SAME `Signal` instance per id across the
 *   controller's lifetime — safe to pass into OnPush children without churn.
 * - Controller is a11y-agnostic — adapters like `createTreeAdItems` live
 *   in sibling files so `@cngx/core`-level reuse stays clean.
 *
 * ## Reactivity contract
 * The surface splits into two classes of accessors, **by design**:
 *
 * - **Reactive** (`Signal<…>` returners): `flatNodes`, `visibleNodes`,
 *   `expandedIds`, `isExpanded(id)`. Bind these in templates and wrap in
 *   `computed()` freely — Angular tracks their dependencies automatically.
 *
 * - **Snapshot** (plain-return methods): `findById`, `parentOf`,
 *   `firstChildOf`, `childrenOfValue`, `descendantsOfValue`. These read
 *   the underlying indexes reactively when called inside a tracked
 *   context, but intentionally return raw values rather than signals.
 *   They are intended for imperative call-sites — keydown handlers,
 *   commit flows, AD-activation dispatch — where the caller wants a
 *   one-shot lookup, not a subscription. If you *do* call them from
 *   inside an `effect()` that should NOT re-fire on tree changes, wrap
 *   the call in `untracked(() => ctrl.parentOf(id))`.
 *
 * ## Mutations
 * All mutators (`expand`, `collapse`, `toggle`, `expandAll`, `collapseAll`)
 * peek at the expansion set via `untracked()` so invoking them from
 * inside an `effect()` never latches that effect onto the expansion set.
 *
 * @category interactive
 */
export interface CngxTreeController<T> {
  /** Flat DFS projection with ARIA metadata + backref to the source node. */
  readonly flatNodes: Signal<readonly FlatTreeNode<T>[]>;
  /** Flat nodes minus those under a collapsed ancestor. */
  readonly visibleNodes: Signal<readonly FlatTreeNode<T>[]>;
  /** Read-only view of the expansion set. */
  readonly expandedIds: Signal<ReadonlySet<string>>;
  /** Stable-identity membership signal per id. */
  isExpanded(id: string): Signal<boolean>;
  /**
   * Direct-children values of a node, for selection `childrenFn`.
   *
   * Returns a fresh array per call. SelectionController's cascade
   * `isIndeterminate` walk invokes `childrenFn` once per tree node on
   * every membership change — a cascade-toggle on a 10k-descendant root
   * triggers O(n) fresh allocations per recompute. Tracked as a perf
   * follow-up: memoize by (tree-version, value-key) if the 10k demo
   * surfaces measurable jitter; spec `tree-controller.spec.ts` carries
   * a reserved baseline-benchmark slot (`it.todo`).
   */
  childrenOfValue(value: T): T[];
  /**
   * All descendant values (DFS, exclusive of self), for cascade-select.
   * Same allocation caveat as `childrenOfValue` — returns a fresh array;
   * cascade-select on wide subtrees allocates O(descendants) per call.
   */
  descendantsOfValue(value: T): T[];
  expand(id: string): void;
  collapse(id: string): void;
  toggle(id: string): void;
  /** Expand every node that has children. No-op when already fully expanded. */
  expandAll(): void;
  collapseAll(): void;
  findById(id: string): FlatTreeNode<T> | undefined;
  /**
   * O(1) lookup of the flat projection for a value, using the same
   * `keyFn` that backs selection membership. Returns `undefined` when
   * the value is not in the current tree (stale selection, swapped
   * source, etc.). Prefer this over a linear scan of `flatNodes()`.
   */
  findByValue(value: T): FlatTreeNode<T> | undefined;
  parentOf(id: string): FlatTreeNode<T> | undefined;
  firstChildOf(id: string): FlatTreeNode<T> | undefined;
  /**
   * Release the `isExpanded(id)` signal-cache. **Soft contract** — matches
   * `createSelectionController`'s destroy semantics:
   * - New `isExpanded(id)` queries return a shared `Signal<false>` constant.
   * - Existing signal bindings created before destroy keep working — the
   *   underlying `expandedIds` signal is still live, so downstream updates
   *   continue to propagate.
   * - Mutators (`expand` / `collapse` / `toggle` / `expandAll` /
   *   `collapseAll`) continue to function; post-destroy writes do NOT
   *   repopulate the cache.
   *
   * Idempotent. Prefer this over a hard teardown so long-lived consumer
   * bindings that outlive the controller's active phase degrade
   * gracefully rather than throwing.
   */
  destroy(): void;
}

/** Factory signature carried by the DI token. */
export type CngxTreeControllerFactory = <T>(
  opts: CngxTreeControllerOptions<T>,
) => CngxTreeController<T>;

/**
 * Injection token that resolves the factory used to instantiate a
 * {@link CngxTreeController}. Defaults to {@link createTreeController};
 * override via `providers`/`viewProviders` for telemetry wrappers, audit
 * logging, or server-synced expansion state.
 *
 * Symmetrical to `CNGX_SELECTION_CONTROLLER_FACTORY` in `@cngx/core/utils` —
 * same override surface, one concern below: tree-aware derived views.
 *
 * @category interactive
 */
export const CNGX_TREE_CONTROLLER_FACTORY = new InjectionToken<CngxTreeControllerFactory>(
  'CngxTreeControllerFactory',
  {
    providedIn: 'root',
    factory: () => createTreeController,
  },
);

/** Shared `Signal<false>` returned post-destroy and as an always-false fallback. */
const POST_DESTROY_FALSE: Signal<boolean> = signal(false).asReadonly();

function flatEq<T>(
  a: readonly FlatTreeNode<T>[],
  b: readonly FlatTreeNode<T>[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (
      ai.id !== bi.id ||
      !Object.is(ai.value, bi.value) ||
      ai.disabled !== bi.disabled ||
      ai.hasChildren !== bi.hasChildren ||
      ai.depth !== bi.depth
    ) {
      return false;
    }
  }
  return true;
}

interface TreeIndexes<T> {
  readonly byId: ReadonlyMap<string, FlatTreeNode<T>>;
  /** `keyFn(value)` → flat-projected node. Source `CngxTreeNode` is reachable via `.node`. */
  readonly byValue: ReadonlyMap<unknown, FlatTreeNode<T>>;
  readonly firstChildById: ReadonlyMap<string, FlatTreeNode<T>>;
}

export function createTreeController<T>(
  opts: CngxTreeControllerOptions<T>,
): CngxTreeController<T> {
  const { nodes } = opts;
  const config = inject(CNGX_TREE_CONFIG, { optional: true }) ?? {};

  // Resolution: per-options > provideTreeConfig default > library default.
  const resolvedNodeIdFn = opts.nodeIdFn
    ?? (config.defaultNodeIdFn as ((v: T, path: readonly number[]) => string) | undefined);
  if (!resolvedNodeIdFn) {
    throw new Error(
      'createTreeController: `nodeIdFn` is required. Provide it via ' +
        'CngxTreeControllerOptions.nodeIdFn or app-wide through ' +
        '`provideTreeConfig(withDefaultNodeIdFn(...))`.',
    );
  }
  const resolvedLabelFn = opts.labelFn
    ?? (config.defaultLabelFn as ((v: T) => string) | undefined);
  const resolvedKeyFn: (v: T) => unknown =
    opts.keyFn ?? (config.defaultKeyFn as ((v: T) => unknown) | undefined) ?? ((v: T) => v as unknown);
  const resolvedInitiallyExpanded = opts.initiallyExpanded ?? config.defaultInitiallyExpanded;
  const resolvedCacheLimit = opts.cacheLimit ?? config.cacheLimit;

  const keyFn = resolvedKeyFn;

  const flatNodes = computed(() => flattenTree(nodes(), resolvedNodeIdFn, resolvedLabelFn), {
    equal: flatEq,
  });

  // One pass over flatNodes produces every index the controller needs:
  // id → FlatTreeNode, value-key → source CngxTreeNode, parentId →
  // first-child FlatTreeNode. All lookups are O(1); the old linear
  // scan in firstChildOf is gone.
  const indexes = computed<TreeIndexes<T>>(() => {
    const byId = new Map<string, FlatTreeNode<T>>();
    const byValue = new Map<unknown, FlatTreeNode<T>>();
    const firstChildById = new Map<string, FlatTreeNode<T>>();
    for (const n of flatNodes()) {
      byId.set(n.id, n);
      byValue.set(keyFn(n.value), n);
      const pids = n.parentIds;
      if (pids.length > 0) {
        const parentId = pids[pids.length - 1];
        if (!firstChildById.has(parentId)) {
          firstChildById.set(parentId, n);
        }
      }
    }
    return { byId, byValue, firstChildById };
  });

  const collectExpandAllIds = (): Set<string> => {
    const next = new Set<string>();
    for (const n of flatNodes()) {
      if (n.hasChildren) {
        next.add(n.id);
      }
    }
    return next;
  };

  // Seed the expansion set once. `untracked` is defensive — if the factory
  // is mistakenly called from an outer reactive context, this read must not
  // leak `flatNodes` / `nodes` into that context's dependency graph.
  const initialSet = untracked(() => {
    if (resolvedInitiallyExpanded === 'all') {
      return collectExpandAllIds();
    }
    if (Array.isArray(resolvedInitiallyExpanded)) {
      return new Set(resolvedInitiallyExpanded);
    }
    return new Set<string>();
  });

  const expandedIdsWritable = signal<ReadonlySet<string>>(initialSet);
  const expandedIds = expandedIdsWritable.asReadonly();

  const visibleNodes = computed(
    () => flatNodes().filter((n) => isNodeVisible(n, expandedIds())),
    { equal: flatEq },
  );

  // `Map` preserves insertion order → FIFO eviction when `cacheLimit`
  // is set. Without a limit the cache grows unbounded over the
  // controller's lifetime (bounded by unique-id count in practice).
  // Re-inserting an existing key via `set` does NOT re-order the entry
  // in modern JS engines, which keeps the eviction order predictable
  // (oldest-inserted, not least-recently-used).
  const expandedCache = new Map<string, Signal<boolean>>();
  let destroyed = false;

  const evictOldestIfOverLimit = (): void => {
    if (resolvedCacheLimit === undefined) {
      return;
    }
    while (expandedCache.size > resolvedCacheLimit) {
      const oldestKey = expandedCache.keys().next().value;
      if (oldestKey === undefined) {
        return;
      }
      expandedCache.delete(oldestKey);
    }
  };

  const isExpanded = (id: string): Signal<boolean> => {
    if (destroyed) {
      return POST_DESTROY_FALSE;
    }
    let sig = expandedCache.get(id);
    if (!sig) {
      sig = computed(() => expandedIds().has(id));
      expandedCache.set(id, sig);
      evictOldestIfOverLimit();
    }
    return sig;
  };

  const childrenOfValue = (v: T): T[] => {
    const flat = indexes().byValue.get(keyFn(v));
    const children = flat?.node.children ?? [];
    return children.map((c) => c.value);
  };

  const descendantsOfValue = (v: T): T[] => {
    const flat = indexes().byValue.get(keyFn(v));
    return flat ? collectDescendantValues(flat.node) : [];
  };

  const findById = (id: string): FlatTreeNode<T> | undefined =>
    indexes().byId.get(id);

  const findByValue = (v: T): FlatTreeNode<T> | undefined =>
    indexes().byValue.get(keyFn(v));

  const parentOf = (id: string): FlatTreeNode<T> | undefined => {
    const byId = indexes().byId;
    const node = byId.get(id);
    if (!node || node.parentIds.length === 0) {
      return undefined;
    }
    return byId.get(node.parentIds[node.parentIds.length - 1]);
  };

  const firstChildOf = (id: string): FlatTreeNode<T> | undefined =>
    indexes().firstChildById.get(id);

  // Mutation helpers read the writable signal via `untracked()` — these
  // methods can be invoked from anywhere (event handlers, effects, async
  // callbacks); reading outside a tracked context keeps consumer `effect()`
  // graphs from latching onto the expansion set accidentally.
  const peekExpanded = (): ReadonlySet<string> =>
    untracked(() => expandedIdsWritable());

  const expand = (id: string): void => {
    if (peekExpanded().has(id)) {
      return;
    }
    expandedIdsWritable.update((s) => {
      const next = new Set(s);
      next.add(id);
      return next;
    });
  };

  const collapse = (id: string): void => {
    if (!peekExpanded().has(id)) {
      return;
    }
    expandedIdsWritable.update((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };

  const toggle = (id: string): void => {
    if (peekExpanded().has(id)) {
      collapse(id);
    } else {
      expand(id);
    }
  };

  const setsEqual = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean => {
    if (a === b) {
      return true;
    }
    if (a.size !== b.size) {
      return false;
    }
    for (const id of a) {
      if (!b.has(id)) {
        return false;
      }
    }
    return true;
  };

  const expandAll = (): void => {
    const next = untracked(() => collectExpandAllIds());
    if (setsEqual(peekExpanded(), next)) {
      return;
    }
    expandedIdsWritable.set(next);
  };

  const collapseAll = (): void => {
    if (peekExpanded().size === 0) {
      return;
    }
    expandedIdsWritable.set(new Set());
  };

  const destroy = (): void => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    expandedCache.clear();
  };

  return {
    flatNodes,
    visibleNodes,
    expandedIds,
    isExpanded,
    childrenOfValue,
    descendantsOfValue,
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll,
    findById,
    findByValue,
    parentOf,
    firstChildOf,
    destroy,
  };
}
