import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: On an anchor',
  subtitle: '<code>a[cngxButton]</code> keeps link semantics: <code>href</code>, <code>routerLink</code>, middle click, no <code>type</code>.',
  description: 'Navigation belongs on an <code>&lt;a&gt;</code>, even when it looks like a button. On an anchor host the button renders no <code>type</code> attribute and leaves link behaviour to the browser and the router. The Installation guide link is a <code>routerLink</code> to this page with a <code>visit</code> query parameter, so every navigation it makes shows up in the URL readout below; a <code>(click)</code> listener on the same anchor counts every click it receives, and a co-hosted <code>cngxAsyncClick</code> runs a 2 s prefetch on each click. A blocked anchor keeps focus and swallows the click before the router and the listener see it: tick Offline to disable it (the reason is read through <code>aria-describedby</code>), or click twice quickly so the second click lands while the prefetch is pending. Either way the URL and the counter stay put, and a middle click is swallowed too. The <code>link</code> variant in the sentence reads as inline text and is the only variant without the control height and touch floor (inline links are exempt under WCAG 2.5.8). The dashed box mirrors what a screen reader gets for the guide link.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxButton', 'CngxAsyncClick'],
  moduleImports: [
    "import { NavigationEnd, Router, RouterLink } from '@angular/router';",
    "import { CngxButton } from '@cngx/common/button';",
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxButton', 'CngxAsyncClick', 'RouterLink'],
  setup: `
  protected readonly offline = signal(false);
  protected readonly clicks = signal(0);

  protected readonly prefetch = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 2000));

  protected handleGuideClick(): void {
    this.clicks.update((n) => n + 1);
  }`,
  template: `
  <div style="display:flex; flex-direction:column; gap:16px">
    <div>
      <a
        cngxButton
        tone="primary"
        routerLink="."
        [queryParams]="{ visit: clicks() + 1 }"
        [cngxAsyncClick]="prefetch"
        #guide="cngxAsyncClick"
        [disabled]="offline()"
        disabledReason="The guide is offline for maintenance."
        (click)="handleGuideClick()"
      >Installation guide</a>
    </div>
    <p style="margin:0">
      Read the <a cngxButton="link" tone="primary" href="https://angular.dev/installation" target="_blank" rel="noopener">Angular installation docs</a> before you upgrade.
    </p>
  </div>`,
  setupChrome: `
  private readonly router = inject(Router);

  // The URL the router last landed on; a swallowed click leaves it unchanged.
  protected readonly url = signal(this.router.url);

  // Mirrors the accessibility layer of the guide link into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'guide', selector: 'a[cngxbutton]' },
  ]);

  constructor() {
    const sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.url.set(event.urlAfterRedirects);
      }
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  protected handleOfflineToggle(): void {
    this.offline.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label><input type="checkbox" [checked]="offline()" (change)="handleOfflineToggle()" /> Offline (disable the guide link)</label>
  </div>
  <div class="event-grid">
    <div class="event-row"><span class="event-label">Route</span><span class="event-value">{{ url() }}</span></div>
    <div class="event-row"><span class="event-label">(click) listener fired</span><span class="event-value">{{ clicks() }} time(s)</span></div>
    <div class="event-row"><span class="event-label">Prefetch run</span><span class="event-value">{{ guide.pending() ? 'pending (clicks are swallowed)' : 'idle' }}</span></div>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
        <dt>{{ row.label }} description</dt>
        <dd>{{ row.description }}</dd>
        <dt>{{ row.label }} state</dt>
        <dd>aria-disabled {{ row.disabled }}, aria-busy {{ row.busy }}</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes; none of it is painted. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
