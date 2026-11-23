import { effect, untracked, type Signal } from '@angular/core';

/**
 * Keeps `name` registered while it is set: registers the current name and
 * unregisters it on a rename, on an empty name and on destroy (one cleanup
 * path). The effect runs with the host's first change detection, before the
 * children's `ngOnInit`, so a name is resolvable from there on. Must run in
 * an injection context.
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
