import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavRail: icon-only rail',
  subtitle:
    'A rail that never expands. Each row keeps its full label, clipped at the row edge, so it stays the accessible name; a tooltip repeats it on hover and focus.',
  description:
    'The default <code>labelPlacement="end"</code> look. The rail width derives from the row tokens, so every icon box sits centred. A badge sits on the icon corner, section labels keep their text for assistive technology but paint nothing. <code>Reports</code> is a <code>cngxNavGroup</code>: it opens as a flyout beside its head, a disclosure with the links in tab order. Escape on the head or in the flyout closes it and returns focus to the head; focus leaving the flyout or a press outside closes it too.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG - Disclosure', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/' },
  ],
  apiComponents: ['CngxNavRail'],
  moduleImports: [
    "import { CngxNavRail } from '@cngx/ui/nav-rail';",
    "import { CngxNavBadge, CngxNavFooter, CngxNavGroup, CngxNavGroupContent, CngxNavHeader, CngxNavIcon, CngxNavLabel, CngxNavLink, CngxNavMark } from '@cngx/common/interactive';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxNavRail',
    'CngxNavBadge',
    'CngxNavFooter',
    'CngxNavGroup',
    'CngxNavGroupContent',
    'CngxNavHeader',
    'CngxNavIcon',
    'CngxNavLabel',
    'CngxNavLink',
    'CngxNavMark',
    'CngxIcon',
    'MatIconModule',
  ],
  setup: `protected readonly active = signal('/inbox');`,
  template: `
  <div class="demo-nav-rail__frame">
    <cngx-nav-rail>
      <cngx-nav-header>
        <span cngxNavMark class="demo-nav-rail__mark" aria-hidden="true">W</span>
      </cngx-nav-header>

      <span cngxNavLabel>Mail</span>
      <a cngxNavLink href="#" [active]="active() === '/inbox'"
         (click)="active.set('/inbox'); $event.preventDefault()">
        <cngx-icon cngxNavIcon><mat-icon>inbox</mat-icon></cngx-icon>
        Inbox
        <span cngxNavBadge [value]="7" ariaLabel="7 unread">7</span>
      </a>
      <a cngxNavLink href="#" [active]="active() === '/calendar'"
         (click)="active.set('/calendar'); $event.preventDefault()">
        <cngx-icon cngxNavIcon><mat-icon>event</mat-icon></cngx-icon>
        Calendar
      </a>

      <button type="button" cngxNavGroup #reports="cngxNavGroup">
        <cngx-icon cngxNavIcon><mat-icon>bar_chart</mat-icon></cngx-icon>
        Reports
      </button>
      <div [cngxNavGroupContent]="reports">
        <div>
          @for (sub of ['Weekly', 'Monthly', 'Yearly']; track sub) {
            <a cngxNavLink href="#" [depth]="1" [active]="active() === '/reports/' + sub"
               (click)="active.set('/reports/' + sub); $event.preventDefault()">{{ sub }}</a>
          }
        </div>
      </div>

      <cngx-nav-footer>
        <span cngxNavMark class="demo-nav-rail__mark" aria-hidden="true">CW</span>
      </cngx-nav-footer>
    </cngx-nav-rail>

    <div class="demo-nav-rail__content">
      <p>Active: <code>{{ active() }}</code></p>
    </div>
  </div>`,
};
