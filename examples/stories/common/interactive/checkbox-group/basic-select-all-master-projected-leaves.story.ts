import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — select-all master + projected leaves',
  subtitle: 'The master <code>cngx-checkbox</code> binds <code>[value]="group.allSelected()"</code> and <code>[indeterminate]="group.someSelected()"</code> — its <code>aria-checked</code> flips between <code>true</code>, <code>false</code>, and <code>"mixed"</code> as the picked array changes. Each leaf\'s checked-ness is wired by the consumer via a derived signal; no implicit identity injection.',
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
  protected readonly checkedFor = (value: string) =>
    computed(() => this.picked().includes(value));
  protected readonly toggleValue = (value: string) => (next: boolean): void => {
    this.picked.update((curr) =>
      next ? [...curr, value] : curr.filter((v) => v !== value),
    );
  };`,
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
};
