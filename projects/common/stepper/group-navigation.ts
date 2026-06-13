import type { CngxStepNode, CngxStepperHost } from './stepper-host.token';

/**
 * Collapsed-group pointer-navigation view consumed by `<cngx-stepper>`
 * under `groupCollapse: 'expand-active'`. A folded group header becomes a
 * click shortcut into its branch: activating it selects the group's first
 * navigable step, which then becomes the active group and expands as a
 * consequence (no in-place disclosure). Keyboard users reach the same
 * steps via the arrow-key contract, which already steps into a collapsed
 * group, so this is a supplementary pointer affordance.
 *
 * @category common/stepper
 */
export interface CngxStepperGroupNavigationView {
  /**
   * `true` when a collapsed group header offers a click shortcut: header
   * navigation is on, the group is folded, and at least one descendant
   * step is navigable right now. The expanded (active) group header is
   * never navigable - its steps are already on screen and clickable.
   */
  isNavigable(node: CngxStepNode): boolean;
  /**
   * Selects the group's first navigable step. No-op for an expanded
   * header, a navigation-off header, or a group with no reachable step.
   */
  select(node: CngxStepNode): void;
  /**
   * `true` when the group owns the active step (`activeGroupId`). Drives
   * the active-branch chip treatment on the header, independent of
   * `groupCollapse`, so the branch in focus reads distinctly even when
   * every group stays expanded.
   */
  isActive(node: CngxStepNode): boolean;
}

/**
 * Options for {@link createStepperGroupNavigation}.
 *
 * @internal
 */
export interface CngxStepperGroupNavigationOptions {
  /**
   * Host slice owning the flat projection (`flatSteps`, DFS order with
   * live `flatIndex`), the reachability predicate (`canNavigateTo`), the
   * commit-in-flight gate (`busy`), and the selection method (`select`).
   */
  readonly presenter: Pick<
    CngxStepperHost,
    'flatSteps' | 'canNavigateTo' | 'busy' | 'select' | 'activeGroupId'
  >;
  /** Whether a given group node is currently folded. */
  readonly isCollapsed: (node: CngxStepNode) => boolean;
  /** `false` when `headerNavigation: 'none'` keeps every header inert. */
  readonly navigationEnabled: () => boolean;
}

/**
 * Builds the collapsed-group pointer-navigation view. Level-2 helper so
 * the organism stays a thin renderer.
 *
 * Indices resolve against `flatSteps` (DFS order, live `flatIndex`) rather
 * than `group.children` - the flattener spreads group nodes but leaves
 * their `children` as the tree projection where every step still carries
 * the seeded `-1`. Each candidate is gated by `canNavigateTo` + `busy`
 * (mirroring the step-header reachability), so a linear-blocked leading
 * step is skipped to the first reachable one.
 *
 * @category common/stepper
 */
export function createStepperGroupNavigation(
  options: CngxStepperGroupNavigationOptions,
): CngxStepperGroupNavigationView {
  const { presenter } = options;
  const firstNavigableStepIndex = (group: CngxStepNode): number => {
    const flat = presenter.flatSteps();
    const byId = new Map(flat.map((node) => [node.id, node] as const));
    const isInGroup = (node: CngxStepNode): boolean => {
      let cur: CngxStepNode | undefined = node;
      while (cur && cur.parentId !== null) {
        if (cur.parentId === group.id) {
          return true;
        }
        cur = byId.get(cur.parentId);
      }
      return false;
    };
    for (const node of flat) {
      if (
        node.kind === 'step' &&
        isInGroup(node) &&
        presenter.canNavigateTo(node.flatIndex) &&
        !presenter.busy()
      ) {
        return node.flatIndex;
      }
    }
    return -1;
  };

  const isNavigable = (node: CngxStepNode): boolean =>
    options.navigationEnabled() &&
    options.isCollapsed(node) &&
    firstNavigableStepIndex(node) !== -1;

  const select = (node: CngxStepNode): void => {
    if (!isNavigable(node)) {
      return;
    }
    presenter.select(firstNavigableStepIndex(node));
  };

  const isActive = (node: CngxStepNode): boolean =>
    node.kind === 'group' && presenter.activeGroupId() === node.id;

  return { isNavigable, select, isActive };
}
