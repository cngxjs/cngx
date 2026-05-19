import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tri-state — Select-all pattern',
  subtitle: 'The header checkbox is <code>indeterminate</code> when some-but-not-all items are selected. Clicking it cascades: indeterminate → checked (selects all), checked → unchecked (clears all), unchecked → checked (selects all).',
  description: 'Single-value boolean checkbox atom with WAI-ARIA tristate semantics. Composes <code>cngx-checkbox-indicator</code> from @cngx/common/display for the visual state. Click on an indeterminate checkbox advances to <code>value=true, indeterminate=false</code> in a single step — there is no path that lands the checkbox back in <code>mixed</code> from a user click.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxCheckbox',
  ],
  moduleImports: [
    'import { CngxCheckbox } from \'@cngx/common/interactive\';',
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
  <div class="children">
    <cngx-checkbox [(value)]="itemA">Item A</cngx-checkbox>
    <cngx-checkbox [(value)]="itemB">Item B</cngx-checkbox>
    <cngx-checkbox [(value)]="itemC">Item C</cngx-checkbox>
  </div>
  <p class="caption">aria-checked = <code>{{ groupIndeterminate() ? 'mixed' : allChecked() ? 'true' : 'false' }}</code></p>`,
  css: `.children { display: flex; flex-direction: column; gap: 8px; padding-inline-start: 24px; margin-top: 8px; }
.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 12px; }`,
};
