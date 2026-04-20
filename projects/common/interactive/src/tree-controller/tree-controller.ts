import { computed, InjectionToken, signal, type Signal } from '@angular/core';
import { type ActiveDescendantItem } from '@cngx/common/a11y';
import {
  type CngxTreeNode,
  type FlatTreeNode,
  collectDescendantValues,
  flattenTree,
  isNodeVisible,
  walkTree,
} from '@cngx/utils';

/**
 * Configuration for {@link createTreeController}.
 *
 * @category interactive
 */
export interface CngxTreeControllerOptions<T> {
  /** Source tree — the controller re-derives on every change. */
  readonly nodes: Signal<readonly CngxTreeNode<T>[]>;
  /** Derives a stable id per flat node. Defaults to `path.join('.')`. */
  readonly nodeIdFn?: (value: T, path: readonly number[]) => string;
  /** Visible label. Defaults to `String(value)`. */
  readonly labelFn?: (value: T) => string;
  /** Membership key for value-based lookups. Defaults to the value itself. */
  readonly keyFn?: (value: T) => unknown;
  /**
   * Initial expansion. Evaluated once at construction; later tree changes
   * do not re-apply. Re-trigger via `expandAll()` if needed.
   */
  readonly initiallyExpanded?: 'all' | 'none' | readonly string[];
}

/**
 * Signal-native tree controller. Produces flat-projected views of a
 * hierarchical source, owns the expansion-set, and exposes value- and
 * id-based lookups used by the surrounding render / keyboard-nav layers.
 *
 * Pure-derivation contract:
 * - No `effect()`, no subscriptions. The only writable slot is the internal
 *   expandedIds set; every other accessor is a `computed()` or pure fn.
 * - `isExpanded(id)` returns the SAME `Signal` instance per id across the
 *   controller's lifetime — safe to pass into OnPush children without churn.
 *
 * @category interactive
 */
export interface CngxTreeController<T> {
  /** Flat DFS projection with ARIA metadata. */
  readonly flatNodes: Signal<readonly FlatTreeNode<T>[]>;
  /** Flat nodes minus those under a collapsed ancestor. */
  readonly visibleNodes: Signal<readonly FlatTreeNode<T>[]>;
  /** Passthrough descriptors for `CngxActiveDescendant.items`. */
  readonly adItems: Signal<readonly ActiveDescendantItem[]>;
  /** Read-only view of the expansion set. */
  readonly expandedIds: Signal<ReadonlySet<string>>;
  /** Stable-identity membership signal per id. */
  isExpanded(id: string): Signal<boolean>;
  /** Direct-children values of a node, for selection `childrenFn`. */
  childrenOfValue(value: T): T[];
  /** All descendant values (DFS, exclusive of self), for cascade-select. */
  descendantsOfValue(value: T): T[];
  expand(id: string): void;
  collapse(id: string): void;
  toggle(id: string): void;
  /** Expand every node that has children. */
  expandAll(): void;
  collapseAll(): void;
  findById(id: string): FlatTreeNode<T> | undefined;
  parentOf(id: string): FlatTreeNode<T> | undefined;
  firstChildOf(id: string): FlatTreeNode<T> | undefined;
  /**
   * Release memoization caches. After `destroy()`, `isExpanded(id)` returns
   * a shared `Signal<false>` constant so existing bindings keep working.
   * Idempotent.
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

function adEq(
  a: readonly ActiveDescendantItem[],
  b: readonly ActiveDescendantItem[],
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
      ai.label !== bi.label
    ) {
      return false;
    }
  }
  return true;
}

export function createTreeController<T>(
  opts: CngxTreeControllerOptions<T>,
): CngxTreeController<T> {
  const { nodes, nodeIdFn, labelFn, initiallyExpanded } = opts;
  const keyFn = opts.keyFn ?? ((v: T) => v as unknown);

  const flatNodes = computed(() => flattenTree(nodes(), nodeIdFn, labelFn), {
    equal: flatEq,
  });

  const flatById = computed(() => {
    const map = new Map<string, FlatTreeNode<T>>();
    for (const n of flatNodes()) {
      map.set(n.id, n);
    }
    return map;
  });

  const valueToNode = computed(() => {
    const map = new Map<unknown, CngxTreeNode<T>>();
    walkTree(nodes(), (node) => {
      map.set(keyFn(node.value), node);
    });
    return map;
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

  const initialSet = (() => {
    if (initiallyExpanded === 'all') {
      return collectExpandAllIds();
    }
    if (Array.isArray(initiallyExpanded)) {
      return new Set(initiallyExpanded);
    }
    return new Set<string>();
  })();

  const expandedIdsWritable = signal<ReadonlySet<string>>(initialSet);
  const expandedIds = expandedIdsWritable.asReadonly();

  const visibleNodes = computed(
    () => flatNodes().filter((n) => isNodeVisible(n, expandedIds())),
    { equal: flatEq },
  );

  const adItems = computed<ActiveDescendantItem[]>(
    () =>
      visibleNodes().map((n) => ({
        id: n.id,
        value: n.value,
        label: n.label,
        disabled: n.disabled,
      })),
    { equal: adEq },
  );

  const expandedCache = new Map<string, Signal<boolean>>();
  let destroyed = false;

  const isExpanded = (id: string): Signal<boolean> => {
    if (destroyed) {
      return POST_DESTROY_FALSE;
    }
    let sig = expandedCache.get(id);
    if (!sig) {
      sig = computed(() => expandedIds().has(id));
      expandedCache.set(id, sig);
    }
    return sig;
  };

  const childrenOfValue = (v: T): T[] => {
    const node = valueToNode().get(keyFn(v));
    const children = node?.children ?? [];
    return children.map((c) => c.value);
  };

  const descendantsOfValue = (v: T): T[] => {
    const node = valueToNode().get(keyFn(v));
    return node ? collectDescendantValues(node) : [];
  };

  const findById = (id: string): FlatTreeNode<T> | undefined =>
    flatById().get(id);

  const parentOf = (id: string): FlatTreeNode<T> | undefined => {
    const node = findById(id);
    if (!node || node.parentIds.length === 0) {
      return undefined;
    }
    return findById(node.parentIds[node.parentIds.length - 1]);
  };

  const firstChildOf = (id: string): FlatTreeNode<T> | undefined => {
    for (const n of flatNodes()) {
      const pids = n.parentIds;
      if (pids.length > 0 && pids[pids.length - 1] === id) {
        return n;
      }
    }
    return undefined;
  };

  const expand = (id: string): void => {
    if (expandedIdsWritable().has(id)) {
      return;
    }
    expandedIdsWritable.update((s) => {
      const next = new Set(s);
      next.add(id);
      return next;
    });
  };

  const collapse = (id: string): void => {
    if (!expandedIdsWritable().has(id)) {
      return;
    }
    expandedIdsWritable.update((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };

  const toggle = (id: string): void => {
    if (expandedIdsWritable().has(id)) {
      collapse(id);
    } else {
      expand(id);
    }
  };

  const expandAll = (): void => {
    expandedIdsWritable.set(collectExpandAllIds());
  };

  const collapseAll = (): void => {
    if (expandedIdsWritable().size === 0) {
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
    adItems,
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
    parentOf,
    firstChildOf,
    destroy,
  };
}
