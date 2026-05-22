import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckboxGroup: disabled cascade',
  subtitle:
    'Toggle <code>[disabled]</code> on the group: <code>select</code>, <code>deselect</code>, and <code>toggleAll</code> all short-circuit, the host reflects <code>aria-disabled="true"</code>, and the consumer-bound <code>[disabled]</code> on each projected leaf propagates the same gate to the atoms.',
  description:
    'Demonstrates the disabled-mutation contract on <code>CngxCheckboxGroup</code>. The group does NOT auto-disable projected children; consumers wire <code>[disabled]="groupDisabled()"</code> on each leaf so the cascade is explicit and the leaf retains its own <code>aria-disabled</code> for AT. The button toggling <code>groupDisabled</code> carries an explicit <code>type="button"</code> so it never accidentally submits a containing form.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Checkbox Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    },
    {
      label: 'WCAG 1.3.1 Info and Relationships',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
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
  protected readonly groupDisabled = signal(false);
  protected readonly checkedFor = (value: string) =>
    computed(() => this.picked().includes(value));
  protected readonly toggleValue = (value: string) => (next: boolean): void => {
    this.picked.update((curr) =>
      next ? [...curr, value] : curr.filter((v) => v !== value),
    );
  };`,
  template: `
  <button type="button" [style.margin-bottom.px]="16" (click)="groupDisabled.set(!groupDisabled())">
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
};
