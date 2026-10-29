import type { CngxStepperI18n } from './i18n/stepper-i18n';
import type { CngxStepNode } from './stepper-host.token';

/**
 * Resolve the status-pill label for a step node against the resolved
 * i18n bundle. Used by skins that surface a per-step status pill
 * (e.g. `stripe-status-rich`). Pure factory - no injection context,
 * no signal graph involvement.
 *
 * Resolution order:
 *  1. `error` data-state -> `statusLabels.errored`
 *  2. a failed commit rejection -> `statusLabels.errored`
 *  3. a refused commit rejection -> `statusLabels.refused`
 *  4. `success` data-state -> `statusLabels.done`
 *  5. `aria-current="step"` -> `statusLabels.inProgress`
 *  6. otherwise -> `statusLabels.upNext`
 *
 * The rejection outranks `done` and the position words because it is the
 * most recent event on the step: a rejected step must never read "Up next".
 *
 * Group nodes (non-step) return an empty string.
 */
export function resolveStepperStatusLabel(
  node: CngxStepNode,
  i18n: CngxStepperI18n,
  isActive: boolean,
  rejection: 'refused' | 'failed' | null = null,
): string {
  if (node.kind !== 'step') {
    return '';
  }
  const labels = i18n.statusLabels;
  const state = node.state();
  if (state === 'error' || rejection === 'failed') {
    return labels.errored;
  }
  if (rejection === 'refused') {
    return labels.refused;
  }
  if (state === 'success') {
    return labels.done;
  }
  return isActive ? labels.inProgress : labels.upNext;
}
