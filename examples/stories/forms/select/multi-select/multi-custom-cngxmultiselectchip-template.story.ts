import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multi — custom *cngxMultiSelectChip template',
  subtitle: 'Replace the default <code>&lt;cngx-chip&gt;</code> pill per instance with any content. The template context gives you the full option plus a commit-aware <code>remove</code> callback.',
  description: 'CngxMultiSelect — multi-value selection with a chip strip trigger. Same async/commit machinery as CngxSelect; multi-specific slot overrides for chip + summary templates.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxMultiSelect',
    'CngxMultiSelectChip',
    'CngxMultiSelectTriggerLabel',
  ],
  moduleImports: [
    'import { CngxMultiSelect, CngxMultiSelectChip, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxMultiSelect', 'CngxMultiSelectChip'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Nicht mehr gepflegt', disabled: true },
  ];
  protected readonly multiCustomChipValues = signal<string[]>(['angular', 'signals', 'rxjs']);`,
  template: `  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiCustomChipValues"
    placeholder="Choose topics…"
  >
    <ng-template cngxMultiSelectChip let-opt let-remove="remove">
      <span style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.125rem 0.5rem;border-radius:0.25rem;background:color-mix(in oklch, var(--cngx-color-info) 15%, transparent);color:var(--cngx-color-info);font-weight:500;">
        <span>#{{ opt.label }}</span>
        <button type="button" (click)="remove()" style="border:0;background:transparent;color:inherit;cursor:pointer;padding:0 0.125rem;">✕</button>
      </span>
    </ng-template>
  </cngx-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiCustomChipValues().join(', ') || '—' }}</span></div>
  </div>`,
};
