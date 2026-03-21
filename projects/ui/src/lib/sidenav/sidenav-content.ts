import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { CngxSidenavLayout } from './sidenav-layout';

/**
 * Main content area within a `CngxSidenavLayout`.
 *
 * Auto-adjusts margins when sibling sidenavs are in `push` or `side`
 * mode. Must be a direct child of `CngxSidenavLayout`.
 *
 * @usageNotes
 * ```html
 * <cngx-sidenav-layout>
 *   <cngx-sidenav position="start">…</cngx-sidenav>
 *   <cngx-sidenav-content>
 *     <router-outlet />
 *   </cngx-sidenav-content>
 * </cngx-sidenav-layout>
 * ```
 */
@Component({
  selector: 'cngx-sidenav-content',
  exportAs: 'cngxSidenavContent',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.cngx-sidenav-content]': 'true',
    '[style.margin-inline-start]': 'marginStart()',
    '[style.margin-inline-end]': 'marginEnd()',
  },
  template: `<ng-content />`,
})
export class CngxSidenavContent {
  private readonly _layout = inject(CngxSidenavLayout, { optional: true });

  constructor() {
    if (!this._layout) {
      throw new Error(
        'cngx-sidenav-content must be placed inside a cngx-sidenav-layout.',
      );
    }
  }

  /** Margin for the start (left in LTR) sidenav in push/side mode. */
  readonly marginStart = computed(() => {
    const nav = this._layout!.startSidenav();
    if (!nav || nav.isOverlay() || !nav.opened()) {
      return '0';
    }
    return nav.width();
  });

  /** Margin for the end (right in LTR) sidenav in push/side mode. */
  readonly marginEnd = computed(() => {
    const nav = this._layout!.endSidenav();
    if (!nav || nav.isOverlay() || !nav.opened()) {
      return '0';
    }
    return nav.width();
  });
}
