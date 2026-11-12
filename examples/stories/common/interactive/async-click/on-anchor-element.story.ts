import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: On anchor element',
  subtitle: 'The directive applies to any clickable element, not just <code>&lt;button&gt;</code>. On every host it sets <code>aria-busy</code> and <code>aria-disabled</code> while it runs and never the native <code>disabled</code> attribute.',
  description: 'There is no tag sniffing: the directive renders the same <code>aria-busy</code> and <code>aria-disabled</code> on a <code>&lt;button&gt;</code>, an anchor or a <code>div role="button"</code>, never <code>[attr.disabled]</code>, and swallows a second click while a run is pending. It listens to <code>click</code> only. An anchor gets Enter from the browser; <code>role="button"</code> promises Space as well, and keeping that promise is the page\'s job: the anchor below prevents the page scroll on Space keydown and clicks itself on Space keyup, the way a native button activates on release, so a held Space starts one run. <code>createActivationKeyHandler</code> from <code>@cngx/common/interactive</code> covers Enter and Space on keydown for hosts where a repeat is harmless; this story binds Space on keyup because the auto-repeat of a held key would start a new run after each settle. The click handler calls <code>preventDefault()</code>, so <code>href="#"</code> never moves the hash router off this story. The explicit <code>role="button"</code> makes assistive tech announce a clickable action, not a link.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { CngxAsyncClick } from \'@cngx/common/interactive\';',
    'import { of } from \'rxjs\';',
    'import { delay } from \'rxjs/operators\';',
  ],
  imports: ['CngxAsyncClick'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-busy`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-busy' },
    { label: 'WAI-ARIA 1.2: `aria-disabled`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-disabled' },
    { label: 'WAI-ARIA 1.2: `button` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#button' },
  ],
  setup: `
  protected readonly fetchAction = () => of(undefined).pipe(delay(900));

  protected handleKeepRoute(event: Event): void {
    event.preventDefault();
  }

  protected handleActivate(event: Event): void {
    (event.currentTarget as HTMLElement).click();
  }`,
  template: `
  <a
    href="#"
    role="button"
    [cngxAsyncClick]="fetchAction"
    #link="cngxAsyncClick"
    (click)="handleKeepRoute($event)"
    (keydown.space)="handleKeepRoute($event)"
    (keyup.space)="handleActivate($event)"
  >
    @switch (link.status()) {
      @case ('pending') { Loading... }
      @case ('success') { Loaded! }
      @case ('error') { Failed }
      @default { Fetch data }
    }
  </a>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status()</span>
      <span class="event-value">{{ link.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">pending()</span>
      <span class="event-value">{{ link.pending() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">aria-busy</span>
      <span class="event-value">{{ link.pending() ? 'true' : 'absent' }}</span>
    </div>
  </div>`,
};
