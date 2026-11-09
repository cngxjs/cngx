import { computed, Directive, ElementRef, inject, input, output, signal } from '@angular/core';
import { createSlotRegistry } from '@cngx/core/utils';

import {
  CNGX_PANEL_TARGET,
  type CngxPanelMode,
  type CngxPanelSide,
  type CngxPanelTarget,
} from '../panel-trigger/panel-target';
import {
  CNGX_DRAWER_HOST,
  type CngxDrawerHost,
  type CngxDrawerPanelPresentation,
} from './drawer-host';
import { claimEscape, escapeOwnedAbove } from './escape-layer';

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
 * The panel reads it through the `CngxDrawerHost` contract, which the drawer
 * also provides as `CNGX_DRAWER_HOST` for a panel on its own element.
 *
 * The drawer is a `CngxPanelTarget`: a `[cngxPanelTrigger]="drawer"` button
 * mirrors `opened` as `aria-expanded` and points `aria-controls` at
 * `panelId`, which the panel takes as its `id`. Inside the drawer it provides
 * `CNGX_PANEL_TARGET` for a bare `cngxPanelTrigger`. Its `mode`, `modal`
 * and `side` follow the panel's `mode`, resolved modality and `position`,
 * so a `CngxPanelToggle` draws the glyph of the current presentation.
 *
 * The drawer host is also the boundary of a `'contained'` panel and the
 * area its scrim covers: with the opt-in `cngx-drawer` class (stylesheet
 * `@cngx/common/theming/components/cngx-drawer.css`, part of the cngx
 * bundle) the host paints a scrim over itself while a modal panel inside it
 * is open. Keep an app header that must stay live outside the host.
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
 * <example-url>/#/common/layout/drawer/app-header-clipped</example-url>
 * <example-url>/#/common/layout/drawer/full-height-modal</example-url>
 * <example-url>/#/common/layout/drawer/filter-panel-push</example-url>
 * <example-url>/#/common/layout/drawer/pattern-consumer-wiring</example-url>
 * @axis level organism
 */
@Directive({
  selector: '[cngxDrawer]',
  exportAs: 'cngxDrawer',
  standalone: true,
  providers: [
    { provide: CNGX_PANEL_TARGET, useExisting: CngxDrawer },
    { provide: CNGX_DRAWER_HOST, useExisting: CngxDrawer },
  ],
  host: {
    '[class.cngx-drawer--opened]': 'opened()',
    '(keydown.escape)': 'handleEscape($event)',
  },
})
export class CngxDrawer implements CngxPanelTarget, CngxDrawerHost {
  /** @internal Host element ref. */
  readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

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

  private readonly panelSlot = createSlotRegistry<CngxDrawerPanelPresentation>();

  /** {@link CngxPanelTarget} view of the panel's `mode`; `over` until a panel registers. */
  readonly mode = computed<CngxPanelMode>(() => this.panelSlot.current()?.mode() ?? 'over');

  /**
   * {@link CngxPanelTarget}: whether the panel's resolved modality blocks
   * anything; `false` until a panel connects, like an unset `modal`.
   */
  readonly modal = computed(() => this.panelSlot.current()?.modal() ?? false);

  /** {@link CngxPanelTarget} view of the panel's `position`; `left` until a panel registers. */
  readonly side = computed<CngxPanelSide>(() => this.panelSlot.current()?.position() ?? 'left');

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

  // The open panel's surface already closed the drawer for an Escape inside
  // it. A controlled drawer still reads the bound input as open until the
  // owner writes it back, so a second close() here would emit twice. An open
  // popover inside the drawer (a menu in the content) takes the keypress
  // first.
  protected handleEscape(event: Event): void {
    if (!this.opened() || escapeOwnedAbove(event, this.host)) {
      return;
    }
    const panel = this.panelSlot.current()?.element;
    if (panel && event.target instanceof Node && panel.contains(event.target)) {
      return;
    }
    claimEscape(event);
    this.close();
  }

  /** {@link CngxDrawerHost}: connects a panel; the latest panel wins. */
  connectPanel(panel: CngxDrawerPanelPresentation): () => void {
    this.panelSlot.register(panel);
    return () => this.panelSlot.unregister(panel);
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
