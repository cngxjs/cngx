import { computed, type Signal } from '@angular/core';

import type { CngxStepperGroupSummary } from './stepper-config';
import type { CngxStepNode } from './stepper-host.token';

/**
 * Collapsed-group summary view consumed by `<cngx-stepper>`. Resolves
 * the `groupCollapseSummary` mode and the per-group `progress` / `count`
 * text, the `status`-dot gate, and the SR phrase. Pure derivation over
 * the group's subtree step states; rendered only on collapsed groups.
 *
 * @category common/stepper
 */
export interface CngxStepperGroupSummaryView {
  /** Resolved summary mode (config cascade, default `'progress'`). */
  readonly mode: Signal<CngxStepperGroupSummary>;
  /** Visible badge text for `progress`/`count`, else `null`. */
  text(node: CngxStepNode): string | null;
  /** `true` when a status dot should render (mode `status`, group collapsed). */
  showStatus(node: CngxStepNode): boolean;
  /** Screen-reader phrase for `progress`/`count`, else `null`. */
  srText(node: CngxStepNode): string | null;
}

/**
 * Options for {@link createStepperGroupSummary}.
 *
 * @internal
 */
export interface CngxStepperGroupSummaryOptions {
  /** Raw `groupCollapseSummary` config value (may be undefined). */
  readonly summaryMode: () => CngxStepperGroupSummary | undefined;
  /** Whether a given group node is currently collapsed. */
  readonly isCollapsed: (node: CngxStepNode) => boolean;
}

/** Terminal-step totals for a group's subtree; reads each step `state()`. */
function subtreeStats(node: CngxStepNode): { total: number; completed: number } {
  let total = 0;
  let completed = 0;
  const visit = (n: CngxStepNode): void => {
    if (n.kind === 'step') {
      total++;
      if (n.state() === 'success') {
        completed++;
      }
    }
    n.children.forEach(visit);
  };
  node.children.forEach(visit);
  return { total, completed };
}

/**
 * Builds the collapsed-group summary view. Level-2 helper so the
 * organism stays a thin renderer. `status` mode defers its SR phrasing
 * to the group's existing status-phrase span, so {@link srText} returns
 * `null` there. English defaults (locale via the i18n cascade is a
 * follow-up).
 *
 * @category common/stepper
 */
export function createStepperGroupSummary(
  options: CngxStepperGroupSummaryOptions,
): CngxStepperGroupSummaryView {
  const mode = computed<CngxStepperGroupSummary>(() => options.summaryMode() ?? 'progress');

  const text = (node: CngxStepNode): string | null => {
    const current = mode();
    if (current === 'off' || current === 'status' || !options.isCollapsed(node)) {
      return null;
    }
    const { total, completed } = subtreeStats(node);
    return current === 'count' ? String(total) : `${completed}/${total}`;
  };

  const showStatus = (node: CngxStepNode): boolean =>
    mode() === 'status' && options.isCollapsed(node);

  const srText = (node: CngxStepNode): string | null => {
    const current = mode();
    if (current === 'off' || current === 'status' || !options.isCollapsed(node)) {
      return null;
    }
    const { total, completed } = subtreeStats(node);
    return current === 'count' ? `${total} steps` : `${completed} of ${total} steps complete`;
  };

  return { mode, text, showStatus, srText };
}
