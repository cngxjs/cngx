/**
 * How a commit-gated transition (a step change, a tab switch) ended when
 * it did not land.
 *
 * Modelled on the router: a guard answering `false` cancels a navigation
 * (`NavigationCancel`), only a throw is a `NavigationError`. Here a
 * `commitAction` answering `false` is `'refused'` - the action decided to
 * keep the user where they are, nothing failed and no error is stored -
 * while a throw, a rejected promise or an erroring observable is
 * `'failed'`. Both roll the transition back; only `'failed'` leaves the
 * commit state at `'error'`.
 *
 * `index` is the position the transition was rolled back to (the origin
 * the user stayed on). `sequence` is a per-host counter bumped exactly
 * once per settled refusal or failure, so two identical outcomes in a row
 * are still two events; a host that only moves the index (a closed tab
 * before the origin) copies the sequence instead of bumping it, so
 * nothing downstream treats the shift as a new outcome.
 *
 * @category common/data/commit
 */
export interface CngxTransitionOutcome {
  readonly kind: 'refused' | 'failed';
  readonly index: number;
  readonly sequence: number;
}
