import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled cascade',
  subtitle: 'Group <code>[disabled]</code> blocks all mutation pathways (<code>select</code>, <code>deselect</code>, <code>toggleAll</code>) and reflects <code>aria-disabled="true"</code> on the host. Projected children inherit the disabled state via the consumer-bound <code>[disabled]</code> on each leaf.',
  description: 'Multi-value checkbox-group molecule. Owns selectedValues (multi-value model), exposes allSelected/someSelected/noneSelected/selectedCount as computed signals, plus a toggleAll/select/deselect API. The "select all" pattern wires a master CngxCheckbox to the group\'s [allSelected] (value) and [someSelected] (indeterminate) so aria-checked="mixed" reflects partial state automatically. Provides CNGX_CONTROL_VALUE for forms-bridge integration. Composes CngxRovingTabindex via hostDirectives for arrow navigation across projected leaves.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxCheckboxGroup',
    'CngxCheckbox',
    'CNGX_CONTROL_VALUE',
  ],
  moduleImports: [
    'import { CngxCheckboxGroup, CngxCheckbox } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCheckboxGroup', 'CngxCheckbox'],
  setup: `protected readonly options = ['email', 'sms', 'push'] as const;
  protected readonly picked = signal<string[]>(['email']);
  protected readonly groupDisabled = signal(false);
  protected readonly checkedFor = (value: string) =>
    computed(() => this.picked().includes(value));
  protected readonly toggleValue = (value: string) => (next: boolean): void => {
    this.picked.update((curr) =>
      next ? [...curr, value] : curr.filter((v) => v !== value),
    );
  };`,
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
};
