import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Checkbox group',
  navLabel: 'Checkbox group',
  navCategory: 'interactive',
  description:
    'Multi-value checkbox-group molecule. Owns selectedValues (multi-value model), exposes ' +
    'allSelected/someSelected/noneSelected/selectedCount as computed signals, plus a ' +
    'toggleAll/select/deselect API. The "select all" pattern wires a master CngxCheckbox to ' +
    "the group's [allSelected] (value) and [someSelected] (indeterminate) so " +
    'aria-checked="mixed" reflects partial state automatically. Provides CNGX_CONTROL_VALUE ' +
    'for forms-bridge integration. Composes CngxRovingTabindex via hostDirectives for arrow ' +
    'navigation across projected leaves.',
  apiComponents: ['CngxCheckboxGroup', 'CngxCheckbox', 'CNGX_CONTROL_VALUE'],
  moduleImports: [
    "import { CngxCheckboxGroup, CngxCheckbox } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly options = ['email', 'sms', 'push'] as const;
  protected readonly picked = signal<string[]>(['email']);
  protected readonly groupDisabled = signal(false);
  protected readonly checkedFor = (value: string) =>
    computed(() => this.picked().includes(value));
  protected readonly toggleValue = (value: string) => (next: boolean): void => {
    this.picked.update((curr) =>
      next ? [...curr, value] : curr.filter((v) => v !== value),
    );
  };
  `,
  sections: [
    {
      title: 'Basic — select-all master + projected leaves',
      subtitle:
        'The master <code>cngx-checkbox</code> binds <code>[value]="group.allSelected()"</code> ' +
        'and <code>[indeterminate]="group.someSelected()"</code> — its <code>aria-checked</code> ' +
        'flips between <code>true</code>, <code>false</code>, and <code>"mixed"</code> as the ' +
        "picked array changes. Each leaf's checked-ness is wired by the consumer via a " +
        'derived signal; no implicit identity injection.',
      imports: ['CngxCheckboxGroup', 'CngxCheckbox'],
      template: `
  <cngx-checkbox
    [value]="group.allSelected()"
    [indeterminate]="group.someSelected()"
    (valueChange)="group.toggleAll()"
  >Select all</cngx-checkbox>
  <cngx-checkbox-group
    #group="cngxCheckboxGroup"
    label="Notification channels"
    [allValues]="options"
    [(selectedValues)]="picked"
  >
    @for (opt of options; track opt) {
      <cngx-checkbox
        [value]="checkedFor(opt)()"
        (valueChange)="toggleValue(opt)($event)"
      >{{ opt }}</cngx-checkbox>
    }
  </cngx-checkbox-group>
  <p class="caption">Picked: <code>{{ picked().join(', ') || '(none)' }}</code></p>`,
      css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 12px; }`,
    },
    {
      title: 'Disabled cascade',
      subtitle:
        'Group <code>[disabled]</code> blocks all mutation pathways (<code>select</code>, ' +
        '<code>deselect</code>, <code>toggleAll</code>) and reflects <code>aria-disabled="true"</code> ' +
        'on the host. Projected children inherit the disabled state via the consumer-bound ' +
        '<code>[disabled]</code> on each leaf.',
      imports: ['CngxCheckboxGroup', 'CngxCheckbox'],
      template: `
  <button type="button" (click)="groupDisabled.set(!groupDisabled())">
    {{ groupDisabled() ? 'Enable group' : 'Disable group' }}
  </button>
  <cngx-checkbox-group
    label="Disabled-cascade demo"
    [allValues]="options"
    [(selectedValues)]="picked"
    [disabled]="groupDisabled()"
  >
    @for (opt of options; track opt) {
      <cngx-checkbox
        [value]="checkedFor(opt)()"
        [disabled]="groupDisabled()"
        (valueChange)="toggleValue(opt)($event)"
      >{{ opt }}</cngx-checkbox>
    }
  </cngx-checkbox-group>`,
      css: `button { margin-bottom: 16px; }`,
    },
  ],
};
