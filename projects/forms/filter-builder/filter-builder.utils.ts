import type { FilterExpression, FilterGroup, FilterNode } from './filter-builder.types';

/**
 * Pure tree utilities for the filter-builder data model. Every mutator
 * returns a new tree; the originals are never modified. Identity is
 * preserved when no descendant changed — feeds the `filterTreeEqual`
 * short-circuit on `computed` / `linkedSignal` consumers (Pillar 1).
 *
 * Paths are arrays of child indices. The empty path `[]` addresses the
 * root group; `[2, 0]` addresses the first child of the root's third
 * child.
 */

/** Resolve the node at `path` against `root`. Returns `null` for invalid paths. */
export function getNodeAtPath(
  root: FilterGroup,
  path: readonly number[],
): FilterNode | null {
  if (path.length === 0) {
    return root;
  }

  let current: FilterNode = root;
  for (const index of path) {
    if (current.type !== 'group') {
      return null;
    }
    const next: FilterNode | undefined = current.filters[index];
    if (!next) {
      return null;
    }
    current = next;
  }
  return current;
}

/** Replace the node at `path` via `updater`. Returns the original `root` when no descendant changed (identity-preserving). */
export function updateAtPath(
  root: FilterGroup,
  path: readonly number[],
  updater: (node: FilterNode) => FilterNode,
): FilterGroup {
  if (path.length === 0) {
    const next = updater(root);
    if (next.type !== 'group') {
      throw new Error('updateAtPath: root replacement must remain a FilterGroup');
    }
    return next === root ? root : next;
  }
  return updateGroupAtPath(root, path, 0, updater);
}

function updateGroupAtPath(
  group: FilterGroup,
  path: readonly number[],
  depth: number,
  updater: (node: FilterNode) => FilterNode,
): FilterGroup {
  const index = path[depth] ?? -1;
  const child = group.filters[index];
  if (!child) {
    throw new Error(`updateAtPath: invalid path ${JSON.stringify(path)}`);
  }

  let nextChild: FilterNode;
  if (depth === path.length - 1) {
    nextChild = updater(child);
  } else {
    if (child.type !== 'group') {
      throw new Error(
        `updateAtPath: cannot descend into expression at ${JSON.stringify(path.slice(0, depth + 1))}`,
      );
    }
    nextChild = updateGroupAtPath(child, path, depth + 1, updater);
  }

  if (nextChild === child) {
    return group;
  }

  const nextFilters = group.filters.slice();
  nextFilters[index] = nextChild;
  return { ...group, filters: nextFilters };
}

/** Remove the node at `path`. Throws on empty path — the root cannot be removed. */
export function removeAtPath(root: FilterGroup, path: readonly number[]): FilterGroup {
  if (path.length === 0) {
    throw new Error('removeAtPath: cannot remove the root');
  }
  return removeFromGroupAtPath(root, path, 0);
}

function removeFromGroupAtPath(
  group: FilterGroup,
  path: readonly number[],
  depth: number,
): FilterGroup {
  const index = path[depth] ?? -1;
  const child = group.filters[index];
  if (!child) {
    return group;
  }

  if (depth === path.length - 1) {
    const nextFilters = group.filters.slice();
    nextFilters.splice(index, 1);
    return { ...group, filters: nextFilters };
  }

  if (child.type !== 'group') {
    return group;
  }

  const nextChild = removeFromGroupAtPath(child, path, depth + 1);
  if (nextChild === child) {
    return group;
  }

  const nextFilters = group.filters.slice();
  nextFilters[index] = nextChild;
  return { ...group, filters: nextFilters };
}

/** Append `child` to the group at `path`. Throws when `path` does not resolve to a group. */
export function appendAtPath(
  root: FilterGroup,
  path: readonly number[],
  child: FilterNode,
): FilterGroup {
  if (path.length === 0) {
    return { ...root, filters: [...root.filters, child] };
  }

  return updateAtPath(root, path, (node) => {
    if (node.type !== 'group') {
      throw new Error(
        `appendAtPath: cannot append to non-group at ${JSON.stringify(path)}`,
      );
    }
    return { ...node, filters: [...node.filters, child] };
  });
}

/**
 * Structural equality between two filter trees. Intended as the `equal`
 * option on `computed` / `linkedSignal` exposing a `FilterGroup`, per
 * the cngx signal-architecture equality rule (object/array computeds
 * MUST pass an explicit equal fn). Identity short-circuits.
 */
export function filterTreeEqual(a: FilterGroup, b: FilterGroup): boolean {
  if (a === b) {
    return true;
  }
  return groupsEqual(a, b);
}

function groupsEqual(a: FilterGroup, b: FilterGroup): boolean {
  if (a === b) {
    return true;
  }
  if (a.logic !== b.logic || a.negated !== b.negated) {
    return false;
  }
  if (a.filters.length !== b.filters.length) {
    return false;
  }
  for (let i = 0; i < a.filters.length; i += 1) {
    const childA = a.filters[i];
    const childB = b.filters[i];
    if (!childA || !childB) {
      return false;
    }
    if (!nodesEqual(childA, childB)) {
      return false;
    }
  }
  return true;
}

function expressionsEqual(a: FilterExpression, b: FilterExpression): boolean {
  if (a === b) {
    return true;
  }
  return a.field === b.field && a.operator === b.operator && Object.is(a.value, b.value);
}

function nodesEqual(a: FilterNode, b: FilterNode): boolean {
  if (a === b) {
    return true;
  }
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === 'group') {
    return groupsEqual(a, b as FilterGroup);
  }
  return expressionsEqual(a, b as FilterExpression);
}
