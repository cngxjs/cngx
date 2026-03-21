import { computed, Directive, ElementRef, inject, input, output, signal } from '@angular/core';

/** Position from which the drawer panel slides in. */
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * State owner for a drawer / sidebar system.
 *
 * Holds the open/close state and handles the Escape key. Supports both
 * **controlled** (`[cngxDrawerOpened]="signal()"`) and **uncontrolled**
 * (internal state via `open()` / `close()` / `toggle()`) modes.
 *
 * Child directives (`CngxDrawerPanel`, `CngxDrawerContent`) receive a
 * reference to this directive via an explicit input — no ancestor injection.
 *
 * @usageNotes
 *
 * ### Uncontrolled
 * ```html
 * <div cngxDrawer #drawer="cngxDrawer">
 *   <button (click)="drawer.toggle()">Menu</button>
 *   <nav [cngxDrawerPanel]="drawer" position="left">…</nav>
 *   <main [cngxDrawerContent]="drawer">…</main>
 * </div>
 * ```
 *
 * ### Controlled
 * ```html
 * <div cngxDrawer [cngxDrawerOpened]="sidebarOpen()"
 *      (openedChange)="sidebarOpen.set($event)">
 *   …
 * </div>
 * ```
 */
@Directive({
  selector: '[cngxDrawer]',
  exportAs: 'cngxDrawer',
  standalone: true,
  host: {
    '[class.cngx-drawer--opened]': 'opened()',
    '(keydown.escape)': 'close()',
  },
})
export class CngxDrawer {
  /** @internal Host element ref — used by `CngxDrawerPanel` for click-outside containment. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Controlled opened state. When bound, takes precedence over internal state. */
  readonly openedInput = input<boolean | undefined>(undefined, { alias: 'cngxDrawerOpened' });

  private readonly _opened = signal(false);

  /** Resolved opened state — controlled input wins over internal state. */
  readonly opened = computed(() => this.openedInput() ?? this._opened());

  /** Emitted when the opened state changes. Wire to a signal for two-way binding. */
  readonly openedChange = output<boolean>();
  /** Emitted when the drawer closes. Convenience shorthand for close-only listeners. */
  readonly closed = output<void>();

  /** Opens the drawer. */
  open(): void {
    this._opened.set(true);
    this.openedChange.emit(true);
  }

  /** Closes the drawer. */
  close(): void {
    if (!this.opened()) {
      return;
    }
    this._opened.set(false);
    this.openedChange.emit(false);
    this.closed.emit();
  }

  /** Toggles the drawer between open and closed. */
  toggle(): void {
    this.opened() ? this.close() : this.open();
  }
}
