import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusVisible: Form fields custom focus ring',
  subtitle:
    'Applying <code>[cngxFocusVisible]</code> to form controls toggles a <code>cngx-focus-visible</code> class on keyboard focus only. Style hangs off that class, mouse clicks land focus without painting the ring.',
  description:
    'The directive\'s real contract is the host-level <code>cngx-focus-visible</code> CSS class hook, automatically toggled on keyboard focus and absent on mouse / touch. The story styles the demo ring on that class so consumers see the canonical pattern: wire the directive, style the class. The signal exported via <code>#ref="cngxFocusVisible"</code> is also available for any case where CSS alone is not enough.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxFocusVisible'],
  imports: ['CngxFocusVisible'],
  references: [
    {
      label: 'WCAG 2.1 SC 2.4.7 Focus Visible',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
    },
    {
      label: 'CSS Selectors Level 4: :focus-visible',
      href: 'https://www.w3.org/TR/selectors-4/#the-focus-visible-pseudo',
    },
  ],
  setup: `protected readonly name = signal('');
  protected readonly email = signal('');`,
  template: `  <div style="display:flex;flex-direction:column;gap:12px;max-width:320px">
    <label for="cngx-focus-visible-name" style="display:flex;flex-direction:column;gap:4px;font-size:0.8125rem">
      Name
      <input id="cngx-focus-visible-name"
             cngxFocusVisible
             #fvName="cngxFocusVisible"
             class="cngx-ex-keyboard-ring"
             [value]="name()"
             (input)="name.set($any($event.target).value)"
             placeholder="Jane Doe" />
    </label>

    <label for="cngx-focus-visible-email" style="display:flex;flex-direction:column;gap:4px;font-size:0.8125rem">
      Email
      <input id="cngx-focus-visible-email"
             type="email"
             cngxFocusVisible
             #fvEmail="cngxFocusVisible"
             class="cngx-ex-keyboard-ring"
             [value]="email()"
             (input)="email.set($any($event.target).value)"
             placeholder="jane@example.com" />
    </label>

    <button type="button"
            id="cngx-focus-visible-submit"
            cngxFocusVisible
            #fvSubmit="cngxFocusVisible"
            class="chip cngx-ex-keyboard-ring"
            style="align-self:flex-start">
      Submit
    </button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Name field</span>
      <span class="event-value">{{ fvName.focusVisible() ? 'keyboard focus' : 'no keyboard focus' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Email field</span>
      <span class="event-value">{{ fvEmail.focusVisible() ? 'keyboard focus' : 'no keyboard focus' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Submit button</span>
      <span class="event-value">{{ fvSubmit.focusVisible() ? 'keyboard focus' : 'no keyboard focus' }}</span>
    </div>
  </div>`,
};
