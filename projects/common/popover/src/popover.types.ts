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
