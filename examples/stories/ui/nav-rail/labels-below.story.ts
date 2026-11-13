import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavRail: labels below the icons',
  subtitle:
    'The stacked look, <code>labelPlacement="below"</code>: the icon over a short, centred label, no tooltip.',
  description:
    'Use it when the labels are short enough to read at rail width. The rail is <code>--cngx-nav-rail-below-size</code> wide (5rem), the label takes <code>--cngx-nav-rail-below-font-size</code>, and a badge moves to the icon corner. Rows keep the touch-target floor (<code>--cngx-target-min</code>). A nav group still opens as a flyout beside its head.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxNavRail'],
  moduleImports: [
    "import { CngxNavRail } from '@cngx/ui/nav-rail';",
    "import { CngxNavBadge, CngxNavGroup, CngxNavGroupContent, CngxNavIcon, CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxNavRail',
    'CngxNavBadge',
    'CngxNavGroup',
    'CngxNavGroupContent',
    'CngxNavIcon',
    'CngxNavLink',
    'CngxIcon',
    'MatIconModule',
  ],
  setup: `protected readonly active = signal('/home');
  protected readonly rows = [
    { path: '/home', icon: 'home', label: 'Home' },
    { path: '/search', icon: 'search', label: 'Search' },
    { path: '/library', icon: 'video_library', label: 'Library' },
  ];`,
  template: `
  <div class="demo-nav-rail__frame">
    <cngx-nav-rail labelPlacement="below">
      @for (row of rows; track row.path) {
        <a cngxNavLink href="#" [active]="active() === row.path"
           (click)="active.set(row.path); $event.preventDefault()">
          <cngx-icon cngxNavIcon><mat-icon>{{ row.icon }}</mat-icon></cngx-icon>
          {{ row.label }}
          @if (row.path === '/library') {
            <span cngxNavBadge [value]="3" ariaLabel="3 new">3</span>
          }
        </a>
      }

      <button type="button" cngxNavGroup #more="cngxNavGroup">
        <cngx-icon cngxNavIcon><mat-icon>more_horiz</mat-icon></cngx-icon>
        More
      </button>
      <div [cngxNavGroupContent]="more">
        <div>
          @for (sub of ['History', 'Downloads', 'Settings']; track sub) {
            <a cngxNavLink href="#" [depth]="1" [active]="active() === '/' + sub"
               (click)="active.set('/' + sub); $event.preventDefault()">{{ sub }}</a>
          }
        </div>
      </div>
    </cngx-nav-rail>

    <div class="demo-nav-rail__content">
      <p>Active: <code>{{ active() }}</code></p>
    </div>
  </div>`,
};
