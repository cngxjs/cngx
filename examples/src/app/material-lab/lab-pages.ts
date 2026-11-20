import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

const LAB_PAGES = [
  { path: '/material-lab', label: 'Forms and overlays', exact: true },
  { path: '/material-lab/display', label: 'Display', exact: false },
  { path: '/material-lab/data', label: 'Data', exact: false },
  { path: '/material-lab/overlay-nav', label: 'Overlay and navigation', exact: false },
] as const;

/**
 * The page row every material-lab page shows first. One list, so a new lab
 * page is linked from every sibling at once. Styled by `.lab-pages` in
 * `_lab-base.scss`.
 */
@Component({
  selector: 'nav[appLabPages]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  host: {
    class: 'lab-row lab-pages',
    'aria-label': 'Material lab pages',
  },
  template: `
    @for (page of pages; track page.path) {
      <a
        [routerLink]="page.path"
        ariaCurrentWhenActive="page"
        [routerLinkActiveOptions]="{ exact: page.exact }"
        routerLinkActive="lab-page-active"
        >{{ page.label }}</a
      >
    }
  `,
})
export class LabPages {
  protected readonly pages = LAB_PAGES;
}
