import { DOCUMENT } from '@angular/common';
import { computed, Directive, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { CngxFocusTrap } from '../../a11y/focus-trap.directive';
import type { CngxDrawer, DrawerPosition } from './drawer.directive';

/** How the drawer panel interacts with the content area. */
export type DrawerMode = 'over' | 'push' | 'side';

/**
 * The sliding panel of a drawer. Reads its open state from an explicit
 * `[cngxDrawerPanel]` reference — no ancestor injection.
 *
 * Composes `CngxFocusTrap` as a `hostDirective` — the consumer controls
 * the `[enabled]` and `[autoFocus]` inputs from the template.
 *
 * Optionally closes the drawer when the user clicks outside the panel
 * (`closeOnClickOutside`, default `true`).
 *
 * @usageNotes
 *
 * ```html
 * <nav [cngxDrawerPanel]="drawer" position="left" mode="over"
 *      [enabled]="drawer.opened()" [autoFocus]="true">
 *   <a href="/home">Home</a>
 * </nav>
 * ```
 */
@Directive({
  selector: '[cngxDrawerPanel]',
  exportAs: 'cngxDrawerPanel',
  standalone: true,
  hostDirectives: [{ directive: CngxFocusTrap, inputs: ['enabled', 'autoFocus'] }],
  host: {
    '[class.cngx-drawer-panel]': 'true',
    '[class.cngx-drawer-panel--open]': 'isOpen()',
    '[class.cngx-drawer-panel--left]': "position() === 'left'",
    '[class.cngx-drawer-panel--right]': "position() === 'right'",
    '[class.cngx-drawer-panel--top]': "position() === 'top'",
    '[class.cngx-drawer-panel--bottom]': "position() === 'bottom'",
    '[class.cngx-drawer-panel--over]': "mode() === 'over'",
    '[class.cngx-drawer-panel--push]': "mode() === 'push'",
    '[class.cngx-drawer-panel--side]': "mode() === 'side'",
    '[attr.aria-hidden]': "mode() === 'side' ? null : !isOpen()",
    'role': 'complementary',
  },
})
export class CngxDrawerPanel {
  /** Reference to the parent `CngxDrawer` state owner. */
  readonly drawerRef = input.required<CngxDrawer>({ alias: 'cngxDrawerPanel' });

  /** Direction the panel slides from. */
  readonly position = input<DrawerPosition>('left');

  /**
   * How the panel interacts with the content area:
   * - `'over'` (default) — overlays content (absolute positioned)
   * - `'push'` — pushes content aside (content gets margin)
   * - `'side'` — always visible, no toggle behavior
   */
  readonly mode = input<DrawerMode>('over');

  /** Whether clicking outside the panel closes the drawer. */
  readonly closeOnClickOutside = input<boolean>(true);

  /** Whether the drawer is currently open (derived from the drawer ref). In `side` mode, always `true`. */
  readonly isOpen = computed(() => this.mode() === 'side' || this.drawerRef().opened());

  constructor() {
    const doc = inject(DOCUMENT);

    // Listen for clicks outside the **drawer container** (not just the panel).
    // This ensures toggle buttons, backdrop elements, and other controls
    // inside the drawer container don't trigger an unwanted close.
    // Clicks truly outside the drawer container close the panel.
    fromEvent<MouseEvent>(doc, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe((e) => {
        if (
          this.isOpen() &&
          this.closeOnClickOutside() &&
          !(this.drawerRef().elementRef.nativeElement as HTMLElement).contains(e.target as Node)
        ) {
          this.drawerRef().close();
        }
      });
  }
}
