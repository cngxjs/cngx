import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: auto mode',
  subtitle:
    'Nothing is bound. <code>mode</code> defaults to <code>auto</code>, so the rail follows the width class of the layout: an overlay below <code>48rem</code>, docked beside the content from there. Drag the right edge of the dashed frame across the thresholds, or use the width presets.',
  description:
    'The thresholds live in one place: a <code>@container cngx-sidenav-layout</code> rule block in <code>sidenav-layout.css</code> that writes <code>--cngx-sidenav-width-class</code> (<code>compact</code> below 48rem, <code>medium</code> from 48rem, <code>expanded</code> from 64rem) on the rail. The component reads that resolved value through <code>CngxContainer.property()</code> and derives <code>widthClass()</code> and <code>effectiveMode()</code> from it in <code>computed()</code>s - it never re-evaluates a condition in TypeScript, so overriding the CSS rules moves the thresholds for both. The rule targets the rail rather than the layout because a container query resolves against an ancestor container, never against the container itself. The switch needs no announcement: it flips aria-modal, the focus trap and the backdrop, and the side-to-over transition auto-opens the rail so focus inside it is never orphaned.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition', 'a11y-pattern'],
  apiComponents: ['CngxSidenav', 'CngxSidenavLayout', 'CngxSidenavContent'],
  moduleImports: [
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent } from '@cngx/ui';",
    "import { CngxNavLink } from '@cngx/common';",
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxNavLink'],
  setup: `protected readonly navOpen = signal(true);
  protected readonly nav = viewChild(CngxSidenav);`,
  setupChrome: `protected readonly pinned = signal(false);
  protected togglePinned(): void {
    this.pinned.update((v) => !v);
    // The pin button sits outside the rail, so its pointerdown dismisses an
    // open overlay; reopen it so pinning shows the overlay with its backdrop.
    if (this.pinned()) {
      this.navOpen.set(true);
    }
  }
  private readonly frame = viewChild<ElementRef<HTMLElement>>('frame');
  protected setFrameWidth(width: string): void {
    const el = this.frame()?.nativeElement;
    if (el) {
      el.style.width = width;
    }
  }`,
  template: `  <div #frame class="demo-sidenav-resizable">
    <cngx-sidenav-layout class="demo-sidenav__container demo-sidenav__container--short">
      <cngx-sidenav position="start" [(opened)]="navOpen" [mode]="pinned() ? 'over' : 'auto'" width="180px">
        <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">Dashboard</a>
        <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">Orders</a>
        <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">Reports</a>
      </cngx-sidenav>

      <cngx-sidenav-content class="demo-sidenav__content--compact">
        <h3 class="demo-sidenav__content-title demo-sidenav__content-title--small">Content</h3>
        <p class="demo-sidenav__content-hint">
          Drag the right edge of the frame. From 48rem of layout width the rail docks
          beside this text; below it the rail becomes an overlay with a backdrop.
        </p>
      </cngx-sidenav-content>
    </cngx-sidenav-layout>
  </div>`,
  templateChromeBefore: `<p class="demo-sidenav__content-hint" style="margin: 0 0 12px">
    The dashed frame is the layout's width. Drag its right edge or pick a preset to cross 48rem and 64rem.
  </p>`,
  templateChrome: `<div class="button-row" style="margin-top: 12px">
    <button class="sort-btn" type="button" (click)="setFrameWidth('40rem')">Width 40rem</button>
    <button class="sort-btn" type="button" (click)="setFrameWidth('56rem')">Width 56rem</button>
    <button class="sort-btn" type="button" (click)="setFrameWidth('72rem')">Width 72rem</button>
    <button class="sort-btn" type="button"
            [attr.aria-controls]="nav()?.id()"
            [attr.aria-expanded]="navOpen()"
            (click)="navOpen.set(!navOpen())">
      {{ navOpen() ? 'Close' : 'Open' }}
    </button>
    <button class="sort-btn" type="button" (click)="togglePinned()">
      {{ pinned() ? 'Back to auto' : 'Pin mode="over"' }}
    </button>
  </div>
<div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge active">mode: {{ pinned() ? 'over (pinned)' : 'auto' }}</span>
    <span class="status-badge active">widthClass: {{ nav()?.widthClass() }}</span>
    <span class="status-badge active">effectiveMode: {{ nav()?.effectiveMode() }}</span>
    <span class="status-badge" [class.active]="navOpen()">{{ navOpen() ? 'opened' : 'closed' }}</span>
  </div>`,
};
