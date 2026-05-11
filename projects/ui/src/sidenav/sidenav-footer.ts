import { Directive } from '@angular/core';

/**
 * Marks content to be projected into the sidenav's sticky footer area.
 *
 * @category layout
 */
@Directive({
  selector: 'cngx-sidenav-footer, [cngxSidenavFooter]',
  standalone: true,
  host: { '[class.cngx-sidenav-footer]': 'true' },
})
export class CngxSidenavFooter {}
