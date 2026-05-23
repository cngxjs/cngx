import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: On anchor element',
  subtitle: 'The directive applies to any clickable element, not just <code>&lt;button&gt;</code>. On an anchor it sets <code>aria-busy</code> + <code>aria-disabled</code> but skips the native <code>disabled</code> attribute (anchors do not support it).',
  description: 'Native form controls (<code>button</code>, <code>input</code>, <code>select</code>, <code>textarea</code>) accept the <code>disabled</code> attribute; everything else does not. The directive sniffs the host tag at construction time and only emits <code>[attr.disabled]</code> on form controls; for an anchor or a <code>div role="button"</code> it relies on <code>aria-busy</code> + <code>aria-disabled</code> plus an internal pending check to swallow double-clicks. The anchor below carries an explicit <code>role="button"</code> so assistive tech recognises it as a clickable action, not as a link.',
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
  protected readonly fetchAction = () => of(undefined).pipe(delay(900));`,
  template: `
  <a
    href="#"
    role="button"
    [cngxAsyncClick]="fetchAction"
    #link="cngxAsyncClick"
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
