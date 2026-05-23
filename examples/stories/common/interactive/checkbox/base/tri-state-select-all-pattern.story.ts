import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckbox: tri-state select-all pattern',
  subtitle:
    'The header binds <code>[indeterminate]="someChecked() &amp;&amp; !allChecked()"</code> so its <code>aria-checked</code> flips through <code>true</code>, <code>false</code>, and <code>"mixed"</code> as the leaves change. A click on a <code>mixed</code> checkbox advances straight to <code>true</code> in one step, per WAI-ARIA tristate semantics.',
  description:
    'Builds the master/leaves tristate pattern entirely from <code>CngxCheckbox</code> atoms and consumer-owned <code>computed()</code> signals - no group molecule. <code>allChecked()</code> and <code>someChecked()</code> derive off the three item signals; <code>groupIndeterminate()</code> derives off those. The master\'s <code>(valueChange)</code> mirrors the next boolean into every leaf via <code>toggleAll()</code>. Read this demo as the contract every projected-leaves group has to honour at the ARIA layer.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  references: [
    {
      label: 'WAI-ARIA APG: Tri-State Checkbox Example',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: ['CngxCheckbox'],
  moduleImports: [
    "import { CngxCheckbox } from '@cngx/common/interactive';",
  ],
  imports: ['CngxCheckbox'],
  setup: `protected readonly itemA = signal(true);
  protected readonly itemB = signal(false);
  protected readonly itemC = signal(false);
  protected readonly allChecked = computed(() => this.itemA() && this.itemB() && this.itemC());
  protected readonly someChecked = computed(() => this.itemA() || this.itemB() || this.itemC());
  protected readonly groupIndeterminate = computed(() => this.someChecked() && !this.allChecked());
  protected toggleAll(next: boolean): void {
    this.itemA.set(next);
    this.itemB.set(next);
    this.itemC.set(next);
  }`,
  template: `
  <cngx-checkbox
    [value]="allChecked()"
    [indeterminate]="groupIndeterminate()"
    (valueChange)="toggleAll($event)"
  >Select all</cngx-checkbox>
  <div [style.display]="'flex'" [style.flex-direction]="'column'" [style.gap.px]="8" [style.padding-inline-start.px]="24" [style.margin-top.px]="8">
    <cngx-checkbox [(value)]="itemA">Item A</cngx-checkbox>
    <cngx-checkbox [(value)]="itemB">Item B</cngx-checkbox>
    <cngx-checkbox [(value)]="itemC">Item C</cngx-checkbox>
  </div>
  <p class="demo-checkbox-caption">aria-checked = <code>{{ groupIndeterminate() ? 'mixed' : allChecked() ? 'true' : 'false' }}</code></p>`,
};
