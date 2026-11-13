import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavRail: rail beside a secondary sidebar',
  subtitle:
    'A rail of sections next to a <code>cngx-sidenav</code> with the pages of the current section.',
  description:
    'Two navigation landmarks, each with its own name: the rail switches the section, the sidenav lists that section\'s pages and can collapse on its own. The two organisms share the nav atoms and know nothing of each other; the consumer derives the sidenav rows from the rail selection with one <code>computed()</code>.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'integration'],
  apiComponents: ['CngxNavRail', 'CngxSidenav', 'CngxSidenavLayout', 'CngxSidenavContent'],
  moduleImports: [
    "import { CngxNavRail } from '@cngx/ui/nav-rail';",
    "import { CngxSidenav, CngxSidenavContent, CngxSidenavLayout } from '@cngx/ui/sidenav';",
    "import { CngxNavIcon, CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxNavRail',
    'CngxSidenav',
    'CngxSidenavContent',
    'CngxSidenavLayout',
    'CngxNavIcon',
    'CngxNavLink',
    'CngxIcon',
    'MatIconModule',
  ],
  setup: `protected readonly sections = [
    { id: 'mail', icon: 'mail', label: 'Mail', pages: ['Inbox', 'Sent', 'Drafts'] },
    { id: 'calendar', icon: 'event', label: 'Calendar', pages: ['Day', 'Week', 'Month'] },
    { id: 'contacts', icon: 'contacts', label: 'Contacts', pages: ['All', 'Favourites'] },
  ];
  protected readonly section = signal('mail');
  protected readonly page = signal('Inbox');
  protected readonly current = computed(
    () => this.sections.find((s) => s.id === this.section()) ?? this.sections[0],
  );
  protected selectSection(id: string): void {
    this.section.set(id);
    this.page.set(this.sections.find((s) => s.id === id)?.pages[0] ?? '');
  }`,
  template: `
  <div class="demo-nav-rail__frame">
    <cngx-nav-rail ariaLabel="Sections">
      @for (s of sections; track s.id) {
        <a cngxNavLink href="#" [active]="section() === s.id"
           (click)="selectSection(s.id); $event.preventDefault()">
          <cngx-icon cngxNavIcon><mat-icon>{{ s.icon }}</mat-icon></cngx-icon>
          {{ s.label }}
        </a>
      }
    </cngx-nav-rail>

    <cngx-sidenav-layout class="demo-nav-rail__layout">
      <cngx-sidenav mode="side" [opened]="true" width="200px" [ariaLabel]="current().label">
        @for (p of current().pages; track p) {
          <a cngxNavLink href="#" [active]="page() === p"
             (click)="page.set(p); $event.preventDefault()">{{ p }}</a>
        }
      </cngx-sidenav>
      <cngx-sidenav-content class="demo-nav-rail__content">
        <p>{{ current().label }} / <code>{{ page() }}</code></p>
      </cngx-sidenav-content>
    </cngx-sidenav-layout>
  </div>`,
};
