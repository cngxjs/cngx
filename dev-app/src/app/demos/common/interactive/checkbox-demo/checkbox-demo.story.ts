import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Checkbox',
  navLabel: 'Checkbox',
  navCategory: 'interactive',
  description:
    'Single-value boolean checkbox atom with WAI-ARIA tristate semantics. Composes ' +
    '<code>cngx-checkbox-indicator</code> from @cngx/common/display for the visual state. ' +
    'Click on an indeterminate checkbox advances to <code>value=true, indeterminate=false</code> ' +
    'in a single step — there is no path that lands the checkbox back in <code>mixed</code> ' +
    'from a user click.',
  apiComponents: ['CngxCheckbox'],
  moduleImports: ["import { CngxCheckbox } from '@cngx/common/interactive';"],
  setup: `
  protected readonly accept = signal(false);
  protected readonly itemA = signal(true);
  protected readonly itemB = signal(false);
  protected readonly itemC = signal(false);
  protected readonly allChecked = computed(() => this.itemA() && this.itemB() && this.itemC());
  protected readonly someChecked = computed(() => this.itemA() || this.itemB() || this.itemC());
  protected readonly groupIndeterminate = computed(() => this.someChecked() && !this.allChecked());
  protected toggleAll(next: boolean): void {
    this.itemA.set(next);
    this.itemB.set(next);
    this.itemC.set(next);
  }
  `,
  sections: [
    {
      title: 'Basic — two-way binding',
      subtitle: 'Click the box or focus + press <strong>Space</strong>/<strong>Enter</strong>.',
      imports: ['CngxCheckbox'],
      template: `
  <cngx-checkbox [(value)]="accept">I accept the terms</cngx-checkbox>
  <p class="caption">Bound: <code>{{ accept() }}</code></p>`,
      css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 8px; }`,
    },
    {
      title: 'Tri-state — Select-all pattern',
      subtitle:
        'The header checkbox is <code>indeterminate</code> when some-but-not-all items are selected. ' +
        'Clicking it cascades: indeterminate → checked (selects all), checked → unchecked (clears all), ' +
        'unchecked → checked (selects all).',
      imports: ['CngxCheckbox'],
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
    },
    {
      title: 'Disabled',
      subtitle: 'Disabled checkboxes ignore click + keydown and reflect <code>aria-disabled="true"</code>.',
      imports: ['CngxCheckbox'],
      template: `
  <cngx-checkbox [value]="true" [disabled]="true">Locked-on</cngx-checkbox>
  <cngx-checkbox [value]="false" [disabled]="true">Locked-off</cngx-checkbox>
  <cngx-checkbox [value]="false" [indeterminate]="true" [disabled]="true">Locked-mixed</cngx-checkbox>`,
      css: `cngx-checkbox { display: inline-flex; margin-right: 24px; }`,
    },
  ],
};
