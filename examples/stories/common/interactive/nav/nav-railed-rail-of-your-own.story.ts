import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavRailed: a rail of your own',
  subtitle:
    '<code>[cngxNavRailed]</code> on a plain <code>&lt;nav&gt;</code>: bind the rail state you already have, and the rows crop to their icon, show their label as a tooltip and open a group as a flyout. The container only sets its width.',
  description:
    'The directive derives nothing: <code>railed()</code> here is a signal of the story, in an app it is the state of whatever holds the rows. It writes <code>data-nav-railed</code> on the host; <code>cngx-nav.css</code> crops every row to its icon box while it is <code>true</code>, so nothing moves and the label stays in the accessible name. A row without <code>[cngxNavIcon]</code> shows its first letter in the icon box. The section label paints nothing on the rail. The nav SETs <code>--cngx-nav-railed-size</code> on the host, the width that centres the icon box; the story reads it for the railed width. Focus a row on the rail to see its tooltip; open Reports to see the flyout, Escape closes it and returns focus to the head. Side names the edge the rows sit on; tooltip and flyout open away from it.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Disclosure navigation', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/' },
  ],
  apiComponents: ['CngxNavRailed', 'CngxNavLink', 'CngxNavIcon', 'CngxNavGroup', 'CngxNavGroupContent', 'CngxNavLabel'],
  moduleImports: [
    "import { CngxNavGroup, CngxNavGroupContent, CngxNavIcon, CngxNavLabel, CngxNavLink, CngxNavRailed } from '@cngx/common/interactive';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: ['CngxNavRailed', 'CngxNavLink', 'CngxNavIcon', 'CngxNavGroup', 'CngxNavGroupContent', 'CngxNavLabel', 'CngxIcon', 'MatIconModule'],
  setup: `
  protected readonly railed = signal(true);
  protected readonly side = signal<'start' | 'end'>('start');
  protected readonly current = signal('Inbox');

  protected go(event: Event, label: string): void {
    event.preventDefault();
    this.current.set(label);
  }`,
  template: `
  <nav aria-label="Main" [cngxNavRailed]="railed()" [cngxNavRailedSide]="side()"
       [style.inline-size]="railed() ? 'var(--cngx-nav-railed-size)' : '15rem'"
       [style.margin-inline-start]="side() === 'end' ? 'auto' : null">
    <a cngxNavLink href="#" [active]="current() === 'Inbox'" (click)="go($event, 'Inbox')">
      <cngx-icon cngxNavIcon size="sm"><mat-icon>inbox</mat-icon></cngx-icon>
      Inbox
    </a>
    <a cngxNavLink href="#" [active]="current() === 'Calendar'" (click)="go($event, 'Calendar')">
      <cngx-icon cngxNavIcon size="sm"><mat-icon>calendar_month</mat-icon></cngx-icon>
      Calendar
    </a>
    <a cngxNavLink href="#" [active]="current() === 'Archive'" (click)="go($event, 'Archive')">
      Archive
    </a>

    <span cngxNavLabel>Insights</span>

    <button cngxNavGroup #reports="cngxNavGroup" type="button" id="railed-reports-trigger"
            [controls]="'railed-reports-items'">
      <cngx-icon cngxNavIcon size="sm"><mat-icon>bar_chart</mat-icon></cngx-icon>
      Reports
    </button>
    <div [cngxNavGroupContent]="reports">
      <div id="railed-reports-items" role="group" aria-labelledby="railed-reports-trigger">
        <a cngxNavLink [depth]="1" href="#" [active]="current() === 'Weekly'" (click)="go($event, 'Weekly')">Weekly</a>
        <a cngxNavLink [depth]="1" href="#" [active]="current() === 'Monthly'" (click)="go($event, 'Monthly')">Monthly</a>
      </div>
    </div>
  </nav>`,
  templateChrome: `
  <div class="filter-row" role="group" aria-label="Railed" style="margin-top: 12px">
    <button type="button" class="chip" [attr.aria-pressed]="railed()" (click)="railed.set(true)">railed</button>
    <button type="button" class="chip" [attr.aria-pressed]="!railed()" (click)="railed.set(false)">expanded</button>
  </div>
  <div class="filter-row" role="group" aria-label="Side" style="margin-top: 12px">
    <button type="button" class="chip" [attr.aria-pressed]="side() === 'start'" (click)="side.set('start')">start</button>
    <button type="button" class="chip" [attr.aria-pressed]="side() === 'end'" (click)="side.set('end')">end</button>
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">data-nav-railed</span>
      <span class="event-value">{{ railed() ? 'true' : 'false' }}</span>
    </div>
  </div>`,
};
