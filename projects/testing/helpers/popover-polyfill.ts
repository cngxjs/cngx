/**
 * jsdom does not implement the HTML Popover API, so `CngxPopover` cannot toggle
 * a panel under a non-browser `test` target. This installs a minimal,
 * idempotent polyfill on `HTMLElement.prototype`:
 *
 * - `showPopover` / `hidePopover` set and clear a `data-popover-open` attribute
 *   (the stand-in for the `:popover-open` pseudo jsdom cannot match) and fire
 *   the `beforetoggle` / `toggle` events the directive listens for;
 * - `togglePopover(force?)` returns the resulting open state.
 *
 * Idempotent by contract: it patches only when `showPopover` is absent, so a
 * real browser (the `test-geometry` target) keeps its native implementation and
 * a spec that still carries its own local copy is a no-op once this one ran.
 * The shared `vitest-setup` installs it before each file and restores it after;
 * `restorePopoverPolyfill` removes only what this module added.
 *
 * Runner-agnostic: pure DOM, no test-framework import, so it is safe to export
 * from the `@cngx/testing` helpers entry.
 */

const OPEN_ATTR = 'data-popover-open';

interface PopoverProto {
  showPopover?: (options?: unknown) => void;
  hidePopover?: () => void;
  togglePopover?: (force?: boolean | { force?: boolean }) => boolean;
}

let installedByUs = false;

/** Install the polyfill when the Popover API is absent. Safe to call repeatedly. */
export function installPopoverPolyfill(): void {
  const proto = HTMLElement.prototype as unknown as PopoverProto;
  if (typeof proto.showPopover === 'function') {
    return;
  }
  installedByUs = true;
  proto.showPopover = function (this: HTMLElement): void {
    if (this.hasAttribute(OPEN_ATTR)) {
      return;
    }
    this.dispatchEvent(new Event('beforetoggle', { bubbles: false }));
    this.setAttribute(OPEN_ATTR, 'true');
    this.dispatchEvent(new Event('toggle', { bubbles: false }));
  };
  proto.hidePopover = function (this: HTMLElement): void {
    if (!this.hasAttribute(OPEN_ATTR)) {
      return;
    }
    this.removeAttribute(OPEN_ATTR);
    this.dispatchEvent(new Event('toggle', { bubbles: false }));
  };
  proto.togglePopover = function (
    this: HTMLElement,
    force?: boolean | { force?: boolean },
  ): boolean {
    const requested = typeof force === 'object' ? force?.force : force;
    const shouldOpen = requested ?? !this.hasAttribute(OPEN_ATTR);
    const self = this as HTMLElement & PopoverProto;
    if (shouldOpen) {
      self.showPopover!();
    } else {
      self.hidePopover!();
    }
    return this.hasAttribute(OPEN_ATTR);
  };
}

/** Remove the polyfill, but only if this module installed it. */
export function restorePopoverPolyfill(): void {
  if (!installedByUs) {
    return;
  }
  const proto = HTMLElement.prototype as unknown as PopoverProto;
  delete proto.showPopover;
  delete proto.hidePopover;
  delete proto.togglePopover;
  installedByUs = false;
}
