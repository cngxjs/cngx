import { computed, Injectable, signal, type Provider } from '@angular/core';

/**
 * Tracks open dialog instances as a stack for backdrop management.
 *
 * Provided in root — always available, no manual provider setup needed.
 * When multiple modal dialogs are stacked, only the topmost shows
 * its `::backdrop`. Each `CngxDialog` reads `isTopmost` from this service
 * to control `--cngx-dialog-backdrop-opacity`.
 *
 * @category common/dialog
 * <example-url>http://localhost:4200/#/common/dialog/alert-dialog</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/bottom-sheet</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/cngxdialogopener-programmatic</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/draggable-dialog</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/fully-declarative</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/grid-snap-live-vs-release</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/nested-dialogs-cngxdialogstack</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/non-modal-panel</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/programmatic-control</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/template-directives</example-url>
 */
@Injectable({ providedIn: 'root' })
export class CngxDialogStack {
  private readonly stackState = signal<readonly string[]>([]);

  /** Readonly snapshot of the current stack (bottom → top). */
  readonly stack = this.stackState.asReadonly();

  /** ID of the topmost (most recently opened) dialog, or `null`. */
  readonly topmost = computed(() => this.stackState().at(-1) ?? null);

  /** Push a dialog ID onto the stack (called on open). */
  push(id: string): void {
    this.stackState.update((s) => [...s, id]);
  }

  /** Remove a dialog ID from the stack (called on close). */
  pop(id: string): void {
    this.stackState.update((s) => s.filter((x) => x !== id));
  }
}

/**
 * Provide a scoped `CngxDialogStack` instance for nested dialog backdrop management.
 *
 * By default, `CngxDialogStack` is `providedIn: 'root'`, so all dialogs share
 * one stack. Call `provideDialogStack()` in a component's `providers` array to
 * create an isolated stack scope (e.g., for a sub-application or dialog group).
 *
 * ```typescript
 * @Component({
 *   providers: [provideDialogStack()],
 * })
 * export class NestedDialogHost { }
 * ```
 *
 * @category common/dialog
 */
export function provideDialogStack(): Provider {
  return CngxDialogStack;
}
