import type { CngxStepNode } from './stepper-host.token';

/**
 * DFS-flatten a step tree into a single ordered list. Group nodes
 * are emitted before their children; the consumer iterates `flat`
 * to render strip + panels and uses `kind` to decide whether to
 * render a panel container or a group header.
 *
 * @category interactive
 */
export function flattenStepTree(
  nodes: readonly CngxStepNode[],
): readonly CngxStepNode[] {
  const out: CngxStepNode[] = [];
  let flatIndex = 0;
  const visit = (list: readonly CngxStepNode[]): void => {
    for (const node of list) {
      // Re-emit with the live flatIndex; the original node carries
      // -1 as a placeholder so the registry-builder doesn't need to
      // know the final ordering.
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
 * Structural equality for the step-tree registry signal. Compares
 * shape only — id, kind, depth, parentId, and children-length per
 * node. Reactive fields (`label`, `disabled`, `state`,
 * `errorAggregator`) are signals; their identity changes are
 * tracked by their own subscribers, not by this comparator.
 *
 * @category interactive
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
 * Structural equality for the `flatSteps` projection. Same identity
 * fields as {@link stepTreeEqual} plus `flatIndex` (which can shift
 * when a sibling is inserted before this node).
 *
 * @category interactive
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
