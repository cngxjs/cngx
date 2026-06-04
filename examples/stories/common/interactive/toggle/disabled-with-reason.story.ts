import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToggle: Disabled with reason',
  subtitle:
    'When <code>[disabled]</code> is true and <code>disabledReason</code> is non-empty, the host emits <code>aria-describedby</code> pointing to a hidden span so screen readers announce <em>why</em> the control is disabled.',
  description:
    'Demonstrates Pillar 2 (always-in-DOM hidden span) for the disabledReason. The describedby span is rendered unconditionally so reactive updates do not shuffle the DOM mid-flow; the host\'s aria-describedby is only emitted when a reason is set so AT does not announce an empty description. Library defaults are English; the reason text is consumer-supplied per the en-default locale rule.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxToggle'],
  moduleImports: ["import { CngxToggle } from '@cngx/common/interactive';"],
  imports: ['CngxToggle'],
  references: [
    { label: 'WAI-ARIA APG: Switch', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/' },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  setup: `protected readonly dark = signal(true);
  protected readonly systemLocked = signal(false);`,
  template: `
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <button type="button" (click)="systemLocked.set(!systemLocked())" class="sort-btn" style="align-self: flex-start;">
      {{ systemLocked() ? 'Unlock OS preference' : 'Lock OS preference' }}
    </button>
    <cngx-toggle
      [(value)]="dark"
      [disabled]="systemLocked()"
      [disabledReason]="systemLocked() ? 'Locked by your OS preference' : ''"
    >Dark mode</cngx-toggle>
  </div>`,
};
