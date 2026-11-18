import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { CngxRuntimeError } from '@cngx/utils';

import { CngxSidenavLayout } from './sidenav-layout';

/**
 * Main content area within a `CngxSidenavLayout`.
 *
 * Sits in flex flow beside sibling sidenavs docked in `side`
 * mode. Must be a direct child of `CngxSidenavLayout`.
 *
 * ```html
 * <cngx-sidenav-layout>
 *   <cngx-sidenav position="start">…</cngx-sidenav>
 *   <cngx-sidenav-content>
 *     <router-outlet />
 *   </cngx-sidenav-content>
 * </cngx-sidenav-layout>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/sidenav-content.ts
 * @since 0.1.0
 * @relatedTo CngxSidenavLayout, CngxSidenav
 */
@Component({
  selector: 'cngx-sidenav-content',
  exportAs: 'cngxSidenavContent',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.cngx-sidenav-content]': 'true',
  },
  template: `<ng-content />`,
})
export class CngxSidenavContent {
  private readonly layout = inject(CngxSidenavLayout, { optional: true });

  constructor() {
    if (!this.layout) {
      throw new CngxRuntimeError(
        'CNGX3014',
        typeof ngDevMode !== 'undefined' &&
          ngDevMode &&
          '[cngx-sidenav-content] must be placed inside <cngx-sidenav-layout>.',
      );
    }
  }
}
