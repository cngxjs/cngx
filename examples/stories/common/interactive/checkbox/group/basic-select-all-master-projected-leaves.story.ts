import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckboxGroup: basic select-all master + projected leaves',
  subtitle:
    'The master <code>cngx-checkbox</code> binds <code>[value]="group.allSelected()"</code> and <code>[indeterminate]="group.someSelected()"</code>; clicking it routes through <code>group.toggleAll()</code>, which select-or-clears via the controller-owned membership keyed by <code>[keyFn]</code>.',
  description:
    'Shows how to lift the tristate select-all pattern into a group molecule. The host carries <code>role="group"</code> and an <code>aria-label</code>; <code>selectedValues</code> is the canonical multi-value model and aliases to <code>value</code> so the group satisfies <code>CngxControlValue&lt;T[]&gt;</code>. <code>allSelected</code>, <code>someSelected</code>, and <code>selectedCount</code> are all <code>computed()</code> off the controller snapshot, so the master\'s tristate flips reactively without manual sync. Leaves are projected from the consumer; each leaf\'s checked-ness comes from a derived <code>checkedFor()</code> signal rather than ancestor injection.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Tri-State Checkbox Example',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/',
    },
    {
      label: 'WAI-ARIA 1.2: group role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#group',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: ['CngxCheckboxGroup', 'CngxCheckbox'],
  moduleImports: [
    "import { CngxCheckboxGroup, CngxCheckbox } from '@cngx/common/interactive';",
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
  <p class="demo-checkbox-caption">Picked: <code>{{ picked().join(', ') || '(none)' }}</code></p>`,
};
