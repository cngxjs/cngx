/**
 * Creates the Enter / Space handler of a host that activates on click.
 *
 * A native `<button>` already turns Enter and Space into a `click`, so a
 * handler that activates on the key too would activate twice, and one that
 * cancels the key would starve consumer `(click)` listeners. On a native
 * button host the returned handler does nothing. On any other host
 * (`<div role="button">`, a `<th>`, a link-styled span) it cancels the key's
 * default (Space would scroll) and calls `activate`.
 *
 * Bind the handler to both keys next to the host's `(click)`:
 *
 * ```ts
 * host: {
 *   '(click)': 'toggle()',
 *   '(keydown.enter)': 'handleActivationKey($event)',
 *   '(keydown.space)': 'handleActivationKey($event)',
 * }
 * protected readonly handleActivationKey = createActivationKeyHandler(
 *   inject(ElementRef).nativeElement,
 *   () => this.toggle(),
 * );
 * ```
 *
 * @param host - The element the keys are bound on.
 * @param activate - Runs for Enter / Space on a non-button host.
 * @returns The key handler.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/activation-key.ts
 * @since 0.1.0
 * @relatedTo CngxDisclosure, CngxPanelTrigger
 */
export function createActivationKeyHandler(
  host: HTMLElement,
  activate: (event: Event) => void,
): (event: Event) => void {
  return (event) => {
    if (host.tagName === 'BUTTON') {
      return;
    }
    event.preventDefault();
    activate(event);
  };
}
