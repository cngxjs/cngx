import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
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
    '[style.margin-inline-start]': 'marginStart',
    '[style.margin-inline-end]': 'marginEnd',
  },
  template: `<ng-content />`,
})
export class CngxSidenavContent {
  private readonly layout = inject(CngxSidenavLayout, { optional: true });

  constructor() {
    if (!this.layout) {
      throw new Error('cngx-sidenav-content must be placed inside a cngx-sidenav-layout.');
    }
  }

  /**
   * Margin offset for the start sidenav.
   *
   * Push and side modes use `position: relative` — the sidenav sits in
   * the flex flow and the content shrinks naturally via `flex: 1`.
   * No margin needed. Over mode uses `position: absolute` — no margin needed
   * either since the sidenav floats above content.
   *
   * Kept as a public computed so tests and consumers can still read it.
   */
  readonly marginStart = '0';

  /** Margin offset for the end sidenav — same rationale as start. */
  readonly marginEnd = '0';
}
