import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionMultiSelect: custom chip',
  subtitle:
    'A <code>*cngxMultiSelectChip</code> template restyles the chips of the action multi-select, including the ones created from the panel. Type a new label and press <kbd>Enter</kbd> to create it; the new chip uses the same template.',
  description:
    'The slot context is <code>{ $implicit, option, remove }</code>; call <code>remove()</code> from your own remove control so the select keeps one removal path (commit, announcement, focus hand-off). The template replaces the chip only: the strip, its overflow mode and the search input stay owned by the select. <code>*cngxComboboxTriggerLabel</code>, when projected, replaces the whole strip and wins over this slot.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'programmatic',
  apiComponents: ['CngxActionMultiSelect', 'CngxMultiSelectChip'],
  moduleImports: [
    "import { CngxActionMultiSelect, CngxMultiSelectChip, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { CngxChip } from '@cngx/common/display';",
  ],
  imports: ['CngxActionMultiSelect', 'CngxMultiSelectChip', 'CngxChip'],
  setup: `protected readonly labels: CngxSelectOptionDef<string>[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'docs', label: 'Docs' },
];
protected readonly picked = signal<string[]>(['bug', 'docs']);
protected readonly createLabel: CngxSelectCreateAction<string> = (_term, draft) =>
  draft.label.toLowerCase();`,
  template: `<cngx-action-multi-select
  [label]="'Labels'"
  [options]="labels"
  [(values)]="picked"
  [quickCreateAction]="createLabel"
  placeholder="Find or create a label…"
>
  <ng-template cngxMultiSelectChip let-opt let-remove="remove">
    <cngx-chip [removable]="true" (remove)="remove()">
      <strong>{{ opt.label }}</strong>
    </cngx-chip>
  </ng-template>
</cngx-action-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ picked().join(', ') || '-' }}</span></div>
  </div>`,
};
