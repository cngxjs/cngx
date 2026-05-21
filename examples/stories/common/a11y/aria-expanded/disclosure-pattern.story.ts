import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAriaExpanded: Disclosure pattern',
  subtitle:
    '<code>[cngxAriaExpanded]</code> paints <code>aria-expanded</code> on the host. Pair with <code>controls="…"</code> to link a single trigger to its panel by id.',
  description:
    'The single-trigger disclosure pattern: one button, one panel, a static <code>controls</code> attribute. Panel stays in the DOM so the trigger\'s <code>aria-controls</code> always resolves to a live <code>role="region"</code> with an accessible name.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern'],
  apiComponents: ['CngxAriaExpanded'],
  imports: ['CngxAriaExpanded'],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
    {
      label: 'WCAG 2.1 SC 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  setup: `protected readonly open = signal(false);`,
  template: `  <button
    type="button"
    id="details-trigger"
    [cngxAriaExpanded]="open()"
    controls="details-panel"
    (click)="open.set(!open())">
    Toggle details
  </button>

  <div
    id="details-panel"
    role="region"
    aria-labelledby="details-trigger"
    [hidden]="!open()">
    Panel content. Only shown when open. A screen reader announces
    <code>aria-expanded="true"</code> on the button and can navigate
    to the controlled region via <code>aria-controls</code>.
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">aria-expanded</span>
      <span class="event-value">{{ open() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">aria-controls</span>
      <span class="event-value">details-panel</span>
    </div>
  </div>`,
};
