/**
 * Lifecycle state of a popover element.
 *
 * @category common/popover
 */
export type PopoverState = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Native popover attribute mode.
 *
 * @category common/popover
 */
export type PopoverMode = 'manual' | 'auto';

/**
 * Permitted values for `aria-haspopup` on a popover trigger. Mirrors the
 * W3C-spec union for popup-container roles plus the bare `'true'`
 * compatibility value. Composers (such as `CngxPopoverPanel`) write the
 * popover's `haspopup` signal to hint the trigger toward the right value
 * without forcing the consumer to repeat it.
 *
 * @category common/popover
 */
export type PopoverHaspopup = 'dialog' | 'listbox' | 'menu' | 'tree' | 'true';

/**
 * ARIA roles applicable to a `CngxPopoverPanel` host element.
 *
 * @category common/popover
 */
export type PopoverPanelRole = 'dialog' | 'alertdialog' | 'tooltip' | 'menu' | 'group' | 'region';

/**
 * Primary edge of the popover panel that faces the trigger after browser-
 * driven shift / flip recovery. Driven by `CngxPopover.resolvedEdge`;
 * consumers projecting a `cngxPopoverArrow` template receive this value in
 * the slot context so they can rotate or position their glyph accordingly.
 *
 * @category common/popover
 */
export type ArrowEdge = 'top' | 'bottom' | 'left' | 'right';

/**
 * Which event sources may open `CngxTooltip`.
 *
 * - `'auto'` (default) - hover and focus open the tooltip with the
 *   configured `tooltipDelay` / `closeDelay`. `show()` and `hide()`
 *   remain available for programmatic overrides.
 * - `'manual'` - hover and focus are inert. Only `show()` / `hide()`
 *   open or close the tooltip. Escape still dismisses an open tooltip
 *   for keyboard accessibility.
 *
 * @category common/popover
 */
export type TooltipTriggerMode = 'auto' | 'manual';

/**
 * Anchor-relative placement of a popover.
 *
 * @category common/popover
 */
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
 *
 * @category common/popover
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
