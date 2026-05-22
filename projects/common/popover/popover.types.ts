/** Lifecycle state of a popover element. */
export type PopoverState = 'closed' | 'opening' | 'open' | 'closing';

/** Native popover attribute mode. */
export type PopoverMode = 'manual' | 'auto';

/** Anchor-relative placement of a popover. */
export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * CSS `<try-tactic>` keywords for the `position-try-fallbacks` property
 * (CSS Anchor Positioning Level 1). Each entry is written verbatim into
 * the host's `position-try-fallbacks` style; entries are not resolved
 * through any cngx mapping table.
 *
 * The union enumerates both orderings of two-keyword composites
 * (`flip-block flip-inline` vs `flip-inline flip-block`) so consumers
 * can match the canonical ordering Chrome resolves to when it normalises
 * the cascaded value. Three-keyword composites are commutative enough
 * that one form suffices.
 *
 * Mirrors the precedent in `projects/forms/select/shared/select-base.css`
 * which already ships `position-try-fallbacks: flip-block, flip-inline,
 * flip-block flip-inline;` on select panels.
 */
export type PopoverPositionTryFallback =
  | 'flip-block'
  | 'flip-inline'
  | 'flip-start'
  | 'flip-block flip-inline'
  | 'flip-inline flip-block'
  | 'flip-block flip-start'
  | 'flip-start flip-block'
  | 'flip-inline flip-start'
  | 'flip-start flip-inline'
  | 'flip-block flip-inline flip-start';
