import { Directive } from '@angular/core';

/** Marks content to be projected into the sidenav's sticky header area. */
@Directive({
  selector: 'cngx-sidenav-header, [cngxSidenavHeader]',
  standalone: true,
  host: { '[class.cngx-sidenav-header]': 'true' },
})
export class CngxSidenavHeader {}
