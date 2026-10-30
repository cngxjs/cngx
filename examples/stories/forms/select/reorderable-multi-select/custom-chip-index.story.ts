import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: custom chip index',
  subtitle:
    'A <code>*cngxMultiSelectChip</code> template on the reorderable select reads <code>index</code> from its context and prints each chip\'s rank. Drag a chip or press <kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd> on a focused chip: the ranks follow the new order.',
  description:
    'The reorderable select passes <code>{ $implicit, option, remove, index }</code> to the chip slot; <code>CngxMultiSelect</code> leaves <code>index</code> out because its order has no meaning. The drag handle, the roving tabindex and the move announcements stay on the wrapper the select renders around each chip, so the template only draws the chip itself. Keep the rank <code>aria-hidden</code>: the position is announced by the reorder live region.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'programmatic',
  apiComponents: ['CngxReorderableMultiSelect', 'CngxMultiSelectChip'],
  moduleImports: [
    "import { CngxMultiSelectChip, CngxReorderableMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { CngxChip } from '@cngx/common/display';",
  ],
  imports: ['CngxReorderableMultiSelect', 'CngxMultiSelectChip', 'CngxChip'],
  setup: `protected readonly steps: CngxSelectOptionDef<string>[] = [
  { value: 'lint', label: 'Lint' },
  { value: 'test', label: 'Unit tests' },
  { value: 'build', label: 'Build' },
  { value: 'e2e', label: 'End-to-end' },
  { value: 'deploy', label: 'Deploy' },
];
protected readonly pipeline = signal<string[]>(['lint', 'test', 'build']);`,
  template: `<cngx-reorderable-multi-select
  [label]="'Pipeline order'"
  [options]="steps"
  [(values)]="pipeline"
  placeholder="Add a step…"
>
  <ng-template cngxMultiSelectChip let-opt let-remove="remove" let-i="index">
    <cngx-chip [removable]="true" (remove)="remove()">
      <span aria-hidden="true">{{ i + 1 }}.</span> {{ opt.label }}
    </cngx-chip>
  </ng-template>
</cngx-reorderable-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Order</span><span class="event-value">{{ pipeline().join(', ') || '-' }}</span></div>
  </div>`,
};
