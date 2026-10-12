import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMatTabNav: error badge on a nav link',
  subtitle:
    "<code>cngxMatTabNav</code> on a <code>&lt;nav mat-tab-nav-bar&gt;</code> and <code>cngxMatTabLink</code> on each <code>&lt;a mat-tab-link&gt;</code> layer the cngx error and announcement surface onto Material's link tabs. Clear the name on Profile: the Profile link gains the error badge and a screen-reader descriptor. Switch links: the change is announced.",
  description:
    'A nav bar has no <code>MatTab</code> and no <code>selectedIndex</code> - the links are the tabs - so each link registers itself as a tab handle, and the error decoration lands on <code>.mat-mdc-tab-link</code>. The Profile link binds <code>[errorAggregator]</code> to an aggregator fed by the name check, so while the name is invalid the link carries the <code>cngx-mat-tab--has-errors</code> badge and an SR-only descriptor referenced through <code>aria-describedby</code>; both go away when the name is valid again. Each change of the active link is spoken through the shared polite live region; the initial active link at mount is not announced. This sandbox has no child routes, so a click writes the active index directly. In an app each anchor is a <code>routerLink</code> with <code>routerLinkActive</code> feeding <code>[active]</code>, and <code>[cngxTabsRouteSync]</code> on the same <code>&lt;nav&gt;</code> reflects the route onto <code>activeIndex</code> (give each link an <code>id</code> equal to its route segment). Route guards stay the router\'s job; the bridge adds no guard of its own.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'error-handling', 'a11y-pattern'],
  apiComponents: ['CngxMatTabNav', 'CngxMatTabLink'],
  moduleImports: [
    "import { MatTabsModule } from '@angular/material/tabs';",
    "import { injectErrorAggregator } from '@cngx/common/interactive';",
    "import { CngxMatTabLink, CngxMatTabNav } from '@cngx/ui/mat-tabs';",
  ],
  imports: ['MatTabsModule', 'CngxMatTabNav', 'CngxMatTabLink'],
  references: [
    {
      label: 'WAI-ARIA APG: Tabs pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    },
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly name = signal('Jane Doe');
  protected readonly nameInvalid = computed(() => this.name().trim().length < 2);

  // Feeds the Profile link's badge and descriptor while the name is invalid.
  protected readonly profileErrors = injectErrorAggregator(
    undefined,
    { name: this.nameInvalid },
    undefined,
    { name: 'Name is required (min 2 characters)' },
  );

  // Stands in for routerLink navigation in this sandbox.
  protected handleNavigate(event: MouseEvent, index: number): void {
    event.preventDefault();
    this.active.set(index);
  }`,
  template: `
  <nav
    mat-tab-nav-bar
    cngxMatTabNav
    [(activeIndex)]="active"
    [tabPanel]="tabPanel"
    aria-label="Account navigation"
  >
    <a
      mat-tab-link
      cngxMatTabLink
      id="overview"
      label="Overview"
      href="#/overview"
      [active]="active() === 0"
      (click)="handleNavigate($event, 0)"
    >
      Overview
    </a>
    <a
      mat-tab-link
      cngxMatTabLink
      id="profile"
      label="Profile"
      href="#/profile"
      [errorAggregator]="profileErrors"
      [active]="active() === 1"
      (click)="handleNavigate($event, 1)"
    >
      Profile
    </a>
    <a
      mat-tab-link
      cngxMatTabLink
      id="settings"
      label="Settings"
      href="#/settings"
      [active]="active() === 2"
      (click)="handleNavigate($event, 2)"
    >
      Settings
    </a>
  </nav>

  <mat-tab-nav-panel #tabPanel>
    <div class="cngx-ex-stack-form">
      @switch (active()) {
        @case (0) {
          <p>Each link is a real anchor, so middle-click and open-in-new-tab keep working.</p>
        }
        @case (1) {
          <label for="nav-profile-name">Name</label>
          <input
            id="nav-profile-name"
            type="text"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
            [attr.aria-invalid]="nameInvalid()"
          />
        }
        @case (2) {
          <p>No form on this page.</p>
        }
      }
    </div>
  </mat-tab-nav-panel>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    Open Profile and clear the name: the Profile link shows the error badge, also after you
    switch to another link. Type a name again to clear it.
  </p>`,
  setupChrome: `
  protected readonly activeId = computed(
    () => ['overview', 'profile', 'settings'][this.active()],
  );
  protected readonly announced = signal('');

  constructor() {
    const doc = (inject(ElementRef).nativeElement as HTMLElement).ownerDocument;
    const read = () => {
      const region = doc.body.querySelector(':scope > span.cngx-sr-only[aria-live="polite"]');
      const text = region?.textContent ?? '';
      if (text) {
        this.announced.set(text);
      }
    };
    const observer = new MutationObserver(read);
    observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active link</span><span class="event-value">{{ activeId() }} (activeIndex {{ active() }})</span></div>
    <div class="event-row"><span class="event-label">Name invalid</span><span class="event-value">{{ nameInvalid() }}</span></div>
    <div class="event-row"><span class="event-label">Last polite announcement</span><span class="event-value">{{ announced() || '-' }}</span></div>
  </div>`,
};
