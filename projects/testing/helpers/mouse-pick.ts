const MOUSE_FOCUSABLE =
  'a[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable="false"])';

/**
 * Presses and releases the primary mouse button on `target` the way a browser
 * does, including the focus change jsdom leaves out: unless `mousedown` is
 * default-prevented, focus moves to the nearest mouse-focusable ancestor of
 * the target (a `tabindex="-1"` element counts), or leaves the active element
 * for `body` when there is none. Returns the `mousedown` event.
 *
 * ```typescript
 * const down = mousePick(optionEl);
 * fixture.detectChanges();
 * expect(down.defaultPrevented).toBe(true);
 * expect(document.activeElement).toBe(triggerEl);
 * ```
 */
export function mousePick(target: HTMLElement): MouseEvent {
  const init: MouseEventInit = { bubbles: true, cancelable: true, button: 0 };
  const down = new MouseEvent('mousedown', init);
  target.dispatchEvent(down);
  if (!down.defaultPrevented) {
    moveFocusLikeABrowser(target);
  }
  target.dispatchEvent(new MouseEvent('mouseup', init));
  target.dispatchEvent(new MouseEvent('click', init));
  return down;
}

function moveFocusLikeABrowser(target: HTMLElement): void {
  const focusable = target.closest<HTMLElement>(MOUSE_FOCUSABLE);
  if (focusable && !focusable.matches(':disabled')) {
    focusable.focus();
    return;
  }
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}
