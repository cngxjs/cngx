import { DOCUMENT } from '@angular/common';
import { computed, Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';
import { outputToObservable, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { fromEvent, switchMap } from 'rxjs';
import { createTransitionTracker } from '@cngx/core/utils';
import { CngxFocusTrap } from '@cngx/common/a11y';
import type { CngxDrawer, DrawerPosition } from './drawer.directive';

/**
 * How the drawer panel interacts with the content area.
 *
 * @category common/layout
 */
export type DrawerMode = 'over' | 'push' | 'side';

/**
 * The sliding panel of a drawer. Reads its open state from an explicit
 * `[cngxDrawerPanel]` reference - no ancestor injection.
 *
 * Composes `CngxFocusTrap` as a `hostDirective` - the consumer controls
 * the `[enabled]` and `[autoFocus]` inputs from the template.
 *
 * Optionally closes the drawer when the user clicks outside the panel
 * (`closeOnClickOutside`, default `true`). The click that opened the
 * drawer never counts as an outside click. While closed (except in
 * `side` mode) the panel is `aria-hidden` AND `inert`, so its focusable
 * children are unreachable for keyboard and AT alike. On close, focus
 * returns to the element that was focused when the drawer opened -
 * unless the user moved focus to another focusable element themselves
 * (a click on a focusable outside target keeps its focus).
 *
 * ```html
 * <nav [cngxDrawerPanel]="drawer" position="left" mode="over"
 *      [enabled]="drawer.opened()" [autoFocus]="true">
 *   <a href="/home">Home</a>
 * </nav>
 * ```
 *
 * @category common/layout
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/drawer/drawer-panel.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDrawer, CngxDrawerContent, CngxFocusTrap
 * <example-url>http://localhost:4200/#/common/layout/drawer/basic-scroll-lock-backdrop</example-url>
 * <example-url>http://localhost:4200/#/common/layout/drawer/controlled-mode</example-url>
 * <example-url>http://localhost:4200/#/common/layout/drawer/direction-all-four-sides</example-url>
 * <example-url>http://localhost:4200/#/common/layout/drawer/events-openedchange-closed</example-url>
 * <example-url>http://localhost:4200/#/common/layout/drawer/mode-over-push-side</example-url>
 * <example-url>http://localhost:4200/#/common/layout/drawer/pattern-consumer-wiring</example-url>
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
    '[attr.aria-hidden]': "mode() !== 'side' && !isOpen() ? true : null",
    '[attr.inert]': "mode() !== 'side' && !isOpen() ? '' : null",
    '[attr.role]': 'role()',
  },
})
export class CngxDrawerPanel {
  /** Reference to the parent `CngxDrawer` state owner. */
  readonly drawerRef = input.required<CngxDrawer>({ alias: 'cngxDrawerPanel' });

  /** Direction the panel slides from. */
  readonly position = input<DrawerPosition>('left');

  /**
   * How the panel interacts with the content area:
   * - `'over'` (default) - overlays content (absolute positioned)
   * - `'push'` - pushes content aside (content gets margin)
   * - `'side'` - always visible, no toggle behavior
   */
  readonly mode = input<DrawerMode>('over');

  /** Whether clicking outside the panel closes the drawer. */
  readonly closeOnClickOutside = input<boolean>(true);

  /**
   * Landmark role rendered on the panel. Defaults to `complementary`;
   * pass `navigation` for nav drawers or `null` to keep the element's
   * implicit role (e.g. on a `<nav>` host).
   */
  readonly role = input<string | null>('complementary');

  /** Whether the drawer is currently open (derived from the drawer ref). In `side` mode, always `true`. */
  readonly isOpen = computed(() => this.mode() === 'side' || this.drawerRef().opened());

  private suppressOutsideClick = false;
  private restoreTarget: HTMLElement | null = null;

  constructor() {
    const doc = inject(DOCUMENT);
    const el = inject(ElementRef<HTMLElement>);

    // Focus restoration: closing puts `inert` on the panel, which would
    // silently drop focus to <body>. Capture the focused element at the
    // open transition and hand focus back at the close transition when
    // focus is still inside the panel (Escape) or already fell to <body>
    // (outside click on a non-focusable area). A focusable outside target
    // the user clicked keeps its focus.
    const openTransition = createTransitionTracker(() => this.isOpen());
    effect(() => {
      const open = openTransition.current();
      const wasOpen = openTransition.previous();
      if (open === wasOpen) {
        return;
      }
      untracked(() => {
        if (open) {
          const active = doc.activeElement;
          this.restoreTarget = active instanceof HTMLElement ? active : null;
          return;
        }
        const active = doc.activeElement;
        const focusLost =
          active === null ||
          active === doc.body ||
          (el.nativeElement as HTMLElement).contains(active);
        if (focusLost && this.restoreTarget?.isConnected) {
          this.restoreTarget.focus();
        }
        this.restoreTarget = null;
      });
    });

    // A click on a toggle OUTSIDE the container opens the drawer and then
    // bubbles on to the document listener below within the same dispatch -
    // without suppression it would close its own drawer instantly. The
    // openedChange emit is synchronous inside that dispatch; the flag is
    // lifted on the next macrotask, after the bubble phase has finished
    // (a microtask checkpoint can run between listeners of a native event).
    toObservable(this.drawerRef)
      .pipe(
        switchMap((drawer) => outputToObservable(drawer.openedChange)),
        takeUntilDestroyed(),
      )
      .subscribe((opened) => {
        if (opened) {
          this.suppressOutsideClick = true;
          setTimeout(() => (this.suppressOutsideClick = false));
        }
      });

    // Hit-test against the container, not the panel - toggle buttons and backdrops
    // sit inside the container and must not count as outside clicks.
    fromEvent<MouseEvent>(doc, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe((e) => {
        if (
          !this.suppressOutsideClick &&
          this.mode() !== 'side' &&
          this.isOpen() &&
          this.closeOnClickOutside() &&
          !(this.drawerRef().elementRef.nativeElement as HTMLElement).contains(e.target as Node)
        ) {
          this.drawerRef().close();
        }
      });
  }
}
