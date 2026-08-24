import type { CngxDirection } from './direction';

/**
 * Resolve a horizontal arrow key into an inline-axis index step, honouring
 * the writing direction. Under `ltr`, `ArrowRight` advances (`+1`) and
 * `ArrowLeft` retreats (`-1`); under `rtl` the two swap, because the first
 * item in reading order sits on the right. Any non-horizontal key (including
 * `ArrowUp` / `ArrowDown` / `Home` / `End`) returns `null` - the block axis
 * is the caller's concern and never direction-aware.
 *
 * This is the mechanical kernel every direction-aware keyboard strategy shares
 * (roving, tabs, stepper strip, slider, reorder); it is a pure function, not a
 * DI chokepoint - each strategy injects its own direction and calls this.
 *
 * @param key The `KeyboardEvent.key` value.
 * @param direction The document writing direction from {@link injectDirection}.
 * @returns `1` for inline-forward, `-1` for inline-back, `null` for any other key.
 *
 * @category core/bidi
 * @relatedTo resolveInlineArrowKey
 * @relatedTo injectDirection
 * @since 0.1.0
 */
export function resolveInlineStep(key: string, direction: CngxDirection): 1 | -1 | null {
  const rtl = direction === 'rtl';
  if (key === 'ArrowRight') {
    return rtl ? -1 : 1;
  }
  if (key === 'ArrowLeft') {
    return rtl ? 1 : -1;
  }
  return null;
}

/**
 * Resolve a physical arrow key into its logical inline counterpart, honouring
 * the writing direction. Under `rtl` the physical `ArrowLeft` and `ArrowRight`
 * swap, so a dispatch site can route a physical key to the handler that owns
 * its *logical* intent (inline-forward / inline-back). Any other key - vertical
 * arrows, `Home`, `End`, letters - is returned verbatim.
 *
 * Tier-2 semantic strategies (menu submenu open/close, tree expand/collapse)
 * resolve the key here at the dispatch site, so the strategy contract stays
 * logical and custom strategy overrides get RTL for free.
 *
 * @param key The physical `KeyboardEvent.key` value.
 * @param direction The document writing direction from {@link injectDirection}.
 * @returns The logical key: swapped horizontal arrow under `rtl`, else `key` unchanged.
 *
 * @category core/bidi
 * @relatedTo resolveInlineStep
 * @relatedTo injectDirection
 * @since 0.1.0
 */
export function resolveInlineArrowKey(key: string, direction: CngxDirection): string {
  if (direction !== 'rtl') {
    return key;
  }
  if (key === 'ArrowLeft') {
    return 'ArrowRight';
  }
  if (key === 'ArrowRight') {
    return 'ArrowLeft';
  }
  return key;
}
