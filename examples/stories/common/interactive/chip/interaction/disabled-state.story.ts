import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChipInteraction: Disabled state',
  subtitle: 'When <code>[disabled]="true"</code>, click + keyboard + remove are silently short-circuited; <code>aria-disabled="true"</code> and <code>tabindex=-1</code> reflect the state.',
  description: 'Disabled-state surface on <code>[cngxChipInteraction]</code>. When <code>[disabled]</code> is true, the host writes <code>aria-disabled="true"</code> and forces <code>tabindex="-1"</code> so the chip drops out of the tab order; <code>handleClick</code>, the Space/Enter toggle, and the Backspace/Delete remove path all short-circuit silently. Pair with <code>[cngxDescribedBy]</code> (or <code>[disabledReason]</code>, which injects an sr-only span) to communicate <em>why</em> a chip is disabled instead of leaving the state silent.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxChipInteraction',
    'CngxChip',
    'CNGX_CONTROL_VALUE',
  ],
  moduleImports: [
    'import { CngxChipInteraction } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChipInteraction', 'CngxChip'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-disabled`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-disabled' },
    { label: 'WAI-ARIA 1.2: `aria-describedby`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-describedby' },
    { label: 'WCAG 2.1 SC 2.4.3 Focus Order', href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html' },
  ],
  setup: `protected readonly favourite = signal(false);`,
  setupChrome: `protected readonly locked = signal(false);`,
  template: `
  <cngx-chip cngxChipInteraction [value]="'locked'" [disabled]="locked()" [(selected)]="favourite">
    Locked tag
  </cngx-chip>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">disabled</span>
      <span class="event-value">{{ locked() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">selected</span>
      <span class="event-value">{{ favourite() }}</span>
    </div>
  </div>
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="locked.set(!locked())">toggle disabled</button>
  </div>`,
};
