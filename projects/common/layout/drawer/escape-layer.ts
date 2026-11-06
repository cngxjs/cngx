// Escape is dismissed one layer at a time. Host listeners bubble from the
// innermost surface outwards and run before CngxPopover's document listener,
// so each layer checks for a closer owner before it acts.
const claimed = new WeakSet<Event>();

/**
 * @internal Whether a layer closer to the keypress than `host` owns this
 * Escape: an inner surface or drawer already handled it, or an open popover
 * inside `host` (a menu, a select panel) takes it through its own listener.
 */
export function escapeOwnedAbove(event: Event, host: HTMLElement): boolean {
  return claimed.has(event) || hasOpenPopover(host);
}

/** @internal Marks the Escape as handled for the layers around the handler. */
export function claimEscape(event: Event): void {
  claimed.add(event);
}

function hasOpenPopover(host: HTMLElement): boolean {
  return Array.from(host.querySelectorAll('[popover]')).some(isOpenPopover);
}

// Engines without the Popover API reject the pseudo-class.
function isOpenPopover(element: Element): boolean {
  try {
    return element.matches(':popover-open');
  } catch {
    return false;
  }
}
