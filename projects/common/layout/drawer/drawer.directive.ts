import { computed, Directive, ElementRef, inject, input, output, signal } from '@angular/core';

import { CNGX_PANEL_TARGET, type CngxPanelTarget } from '../panel-trigger/panel-target';

/**
 * Position from which the drawer panel slides in.
 */
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * State owner for a drawer / sidebar system.
 *
 * Holds the open/close state and handles the Escape key. Supports both
 * **controlled** (`[cngxDrawerOpened]="signal()"`) and **uncontrolled**
 * (internal state via `open()` / `close()` / `toggle()`) modes.
 *
 * Child directives (`CngxDrawerPanel`, `CngxDrawerContent`) receive a
 * reference to this directive via an explicit input - no ancestor injection.
 *
 * The drawer is a `CngxPanelTarget`: a `[cngxPanelTrigger]="drawer"` button
 * mirrors `opened` as `aria-expanded` and points `aria-controls` at
 * `panelId`, which the panel takes as its `id`. Inside the drawer it provides
 * `CNGX_PANEL_TARGET` for a bare `cngxPanelTrigger`.
 *
 * ### With a panel trigger
 * ```html
 * <button type="button" [cngxPanelTrigger]="drawer">Menu</button>
 * <div cngxDrawer #drawer="cngxDrawer" panelId="main-nav">
 *   <nav [cngxDrawerPanel]="drawer">…</nav>
 * </div>
 * ```
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
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/drawer/drawer.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDrawerPanel, CngxDrawerContent, CngxBackdrop, CngxScrollLock
 * <example-url>/#/common/layout/drawer/basic-scroll-lock-backdrop</example-url>
 * <example-url>/#/common/layout/drawer/controlled-mode</example-url>
 * <example-url>/#/common/layout/drawer/direction-all-four-sides</example-url>
 * <example-url>/#/common/layout/drawer/events-openedchange-closed</example-url>
 * <example-url>/#/common/layout/drawer/mode-over-push</example-url>
 * <example-url>/#/common/layout/drawer/pattern-consumer-wiring</example-url>
 * @axis level organism
 */
@Directive({
  selector: '[cngxDrawer]',
  exportAs: 'cngxDrawer',
  standalone: true,
  providers: [{ provide: CNGX_PANEL_TARGET, useExisting: CngxDrawer }],
  host: {
    '[class.cngx-drawer--opened]': 'opened()',
    '(keydown.escape)': 'close()',
  },
})
export class CngxDrawer implements CngxPanelTarget {
  /** @internal Host element ref. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  /**
   * The `id` of the drawer's panel element. `CngxDrawerPanel` renders it as
   * its `id` unless the panel carries a static one, and a panel trigger
   * points `aria-controls` at it.
   */
  readonly panelId = input<string | undefined>(undefined);

  /** Controlled opened state. When bound, takes precedence over internal state. */
  readonly openedInput = input<boolean | undefined>(undefined, { alias: 'cngxDrawerOpened' });

  private readonly openedState = signal(false);

  /** Resolved opened state - controlled input wins over internal state. */
  readonly opened = computed(() => this.openedInput() ?? this.openedState());

  /** {@link CngxPanelTarget} view of {@link panelId}; empty when unset. */
  readonly id = computed(() => this.panelId() ?? '');

  /** {@link CngxPanelTarget} view of {@link opened}. */
  readonly expanded = this.opened;

  /** Emitted when the opened state changes. Wire to a signal for two-way binding. */
  readonly openedChange = output<boolean>();
  /** Emitted when the drawer closes. Convenience shorthand for close-only listeners. */
  readonly closed = output<void>();

  /** Opens the drawer. No-op when already open. */
  open(): void {
    if (this.opened()) {
      return;
    }
    this.openedState.set(true);
    this.openedChange.emit(true);
  }

  /** Closes the drawer. */
  close(): void {
    if (!this.opened()) {
      return;
    }
    this.openedState.set(false);
    this.openedChange.emit(false);
    this.closed.emit();
  }

  /** Toggles the drawer between open and closed. */
  toggle(): void {
    if (this.opened()) {
      this.close();
    } else {
      this.open();
    }
  }
}
