import { effect, untracked, type Signal } from '@angular/core';

/**
 * Keeps `name` registered while it is set: registers the current name and
 * unregisters it on a rename, on an empty name and on destroy (one cleanup
 * path). The effect runs with the host view's first change detection, after
 * the `ngOnInit` hooks of that view, so a name is resolvable from the host's
 * `ngAfterViewInit` on. Must run in an injection context.
 *
 * @internal
 */
export function registerByName(
  name: Signal<string | undefined>,
  register: (name: string) => void,
  unregister: (name: string) => void,
): void {
  effect((onCleanup) => {
    const current = name();
    if (!current) {
      return;
    }
    untracked(() => register(current));
    onCleanup(() => untracked(() => unregister(current)));
  });
}
