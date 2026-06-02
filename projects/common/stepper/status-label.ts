import type { CngxStepperI18n } from './i18n/stepper-i18n';
import type { CngxStepNode } from './stepper-host.token';

/**
 * Resolve the status-pill label for a step node against the resolved
 * i18n bundle. Used by skins that surface a per-step status pill
 * (e.g. `stripe-status-rich`). Pure factory - no injection context,
 * no signal graph involvement.
 *
 * Resolution order:
 *  1. `success` data-state -> `statusLabels.done`
 *  2. `error` data-state -> `statusLabels.errored`
 *  3. `aria-current="step"` -> `statusLabels.inProgress`
 *  4. otherwise -> `statusLabels.upNext`
 *
 * Group nodes (non-step) return an empty string.
 *
 * @category common/stepper
 */
export function resolveStepperStatusLabel(
  node: CngxStepNode,
  i18n: CngxStepperI18n,
  isActive: boolean,
): string {
  if (node.kind !== 'step') {
    return '';
  }
  const labels = i18n.statusLabels;
  const state = node.state();
  return state === 'success'
    ? labels.done
    : state === 'error'
      ? labels.errored
      : isActive
        ? labels.inProgress
        : labels.upNext;
}
