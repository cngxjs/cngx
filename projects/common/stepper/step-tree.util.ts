import type { CngxStepNode } from './stepper-host.token';

/**
 * DFS-flatten a step tree. Group nodes emit before their children;
 * the consumer keys off `kind` to render a panel container vs. a
 * group header.
 */
export function flattenStepTree(
  nodes: readonly CngxStepNode[],
): readonly CngxStepNode[] {
  const out: CngxStepNode[] = [];
  let flatIndex = 0;
  const visit = (list: readonly CngxStepNode[]): void => {
    for (const node of list) {
      // Re-emit with the live flatIndex; registry-builder seeds -1
      // so it doesn't need to know the final ordering.
      out.push({ ...node, flatIndex: node.kind === 'step' ? flatIndex : -1 });
      if (node.kind === 'step') {
        flatIndex++;
      }
      if (node.children.length > 0) {
        visit(node.children);
      }
    }
  };
  visit(nodes);
  return out;
}

/**
 * Structural equality for the step-tree registry signal. Shape only —
 * id, kind, depth, parentId, children length. Reactive fields
 * (`label`, `disabled`, `state`, `errorAggregator`) are signals; their
 * own subscribers track identity changes.
 */
export function stepTreeEqual(
  a: readonly CngxStepNode[],
  b: readonly CngxStepNode[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.kind !== y.kind || x.depth !== y.depth || x.parentId !== y.parentId) {
      return false;
    }
    if (!stepTreeEqual(x.children, y.children)) {
      return false;
    }
  }
  return true;
}

/**
 * Structural equality for `flatSteps`. Adds `flatIndex` (shifts when
 * a sibling is inserted) on top of the {@link stepTreeEqual} fields.
 *
 * Use only on projections where every step carries a real
 * DFS-assigned `flatIndex` and `depth` — for `-1` placeholders, use
 * {@link stepNodesEqual}.
 *
 * @internal Exported from `public-api.ts` so the cngx-stepper and
 * cngx-mat-stepper organisms share the comparator across the
 * secondary-entry boundary (Sheriff forbids deep-relative imports).
 *
 * @category common/stepper
 */
export function flatStepsEqual(
  a: readonly CngxStepNode[],
  b: readonly CngxStepNode[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].kind !== b[i].kind ||
      a[i].depth !== b[i].depth ||
      a[i].flatIndex !== b[i].flatIndex
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Structural equality for any flat node array — `id`, `kind`,
 * `parentId` only, ignoring `flatIndex` and `depth`. Use for
 * `CngxStepGroup.children` and other `-1`-placeholder projections.
 */
export function stepNodesEqual(
  a: readonly CngxStepNode[],
  b: readonly CngxStepNode[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].kind !== b[i].kind ||
      a[i].parentId !== b[i].parentId
    ) {
      return false;
    }
  }
  return true;
}
