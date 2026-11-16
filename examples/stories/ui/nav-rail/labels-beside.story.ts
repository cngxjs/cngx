import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavRail: Labels beside the icons, shown as a tooltip',
  subtitle:
    'A nav rail, not a collapsed sidenav: it never expands. Each row keeps its full label, clipped at the row edge, so it stays the accessible name; a tooltip repeats it on hover after a short delay and at once on keyboard focus.',
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
    "import { CngxAvatar, CngxIcon } from '@cngx/common/display';",
    "import { CngxStack } from '@cngx/ui/layout';",
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
    'CngxAvatar',
    'CngxIcon',
    'CngxStack',
    'MatIconModule',
  ],
  setup: `protected readonly active = signal('/inbox');`,
  template: `
  <cngx-stack direction="row" gap="none">
    <cngx-nav-rail>
      <cngx-nav-header>
        <cngx-avatar cngxNavMark initials="W" />
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
        <cngx-avatar cngxNavMark initials="CW" />
      </cngx-nav-footer>
    </cngx-nav-rail>

    <div style="flex: 1 1 auto; min-inline-size: 0; padding: var(--cngx-space-md, 1rem)">
      <p>Active: <code>{{ active() }}</code></p>
    </div>
  </cngx-stack>`,
};
