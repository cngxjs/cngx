import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonMultiToggleGroup: disabled cascade vs per-toggle',
  subtitle:
    'Group <code>[disabled]</code> blocks every leaf\'s <code>toggle()</code> dispatch and reflects <code>aria-disabled="true"</code> on each toggle. Per-toggle <code>[disabled]</code> blocks only that leaf. Both also reflect the native <code>disabled</code> attribute so form-submission engines see it.',
  description:
    'Disabled propagation contract for the multi-select group. Group-level <code>[disabled]</code> short-circuits the group\'s own <code>toggle()</code> entry-point and propagates into every leaf\'s <code>toggleDisabled</code> computed; Space, Enter, and click on a disabled leaf are all suppressed. Per-toggle <code>[disabled]</code> blocks only that leaf without affecting siblings. Accepted debt mirrors the single-mode group: a fully-disabled toolbar still admits visual focus transit because <code>CngxRovingItem.disabled</code> is not yet a writable host-directive surface; every selection pathway short-circuits silently.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Toolbar Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: [
    'CngxButtonMultiToggleGroup',
    'CngxButtonToggle',
    'CNGX_BUTTON_MULTI_TOGGLE_GROUP',
  ],
  moduleImports: [
    "import { CngxButtonMultiToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: ['CngxButtonMultiToggleGroup', 'CngxButtonToggle'],
  setup: `protected readonly filters = signal<string[]>(['open']);
  protected readonly groupDisabled = signal(false);`,
  template: `
  <button type="button" style="display: block; margin-bottom: 16px;" (click)="groupDisabled.set(!groupDisabled())">
    {{ groupDisabled() ? 'Enable group' : 'Disable group' }}
  </button>
  <cngx-button-multi-toggle-group
    class="demo-button-toggle-group"
    label="Status filters (disabled-cascade demo)"
    [(selectedValues)]="filters"
    [disabled]="groupDisabled()"
  >
    <button type="button" cngxButtonToggle value="open">Open</button>
    <button type="button" cngxButtonToggle value="closed">Closed</button>
    <button type="button" cngxButtonToggle value="archived" [disabled]="true">Archived (locked)</button>
  </cngx-button-multi-toggle-group>`,
};
