import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionMultiSelect: basic',
  subtitle:
    'A multi-select whose panel carries an inline create action: type a tag that is not in the list and the projected <code>*cngxSelectAction</code> button materialises it and appends it to <code>values[]</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxActionMultiSelect', 'CngxSelectAction'],
  moduleImports: [
    "import { CngxActionMultiSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { CngxSelectAction } from '@cngx/forms/select';",
  ],
  imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'qa', label: 'QA' },
    { value: 'docs', label: 'Docs' },
  ];
  protected readonly values = signal<string[]>(['design']);
  protected readonly create: CngxSelectCreateAction<string> = (_term, draft) => draft.label.toLowerCase();`,
  template: `  <cngx-action-multi-select
    [label]="'Tags'"
    [options]="tags"
    [quickCreateAction]="create"
    [clearable]="true"
    [(values)]="values"
    placeholder="Choose or create tags…"
  >
    <ng-template cngxSelectAction let-term let-commit="commit" let-pending="isPending">
      <button
        type="button"
        [disabled]="!term || pending"
        (click)="commit()"
        style="width:100%; padding:0.5rem 0.75rem; text-align:left; cursor:pointer; font:inherit"
      >
        @if (pending) { Creating "{{ term }}"… }
        @else if (!term) { Type to create a tag }
        @else { + Create "{{ term }}" }
      </button>
    </ng-template>
  </cngx-action-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Values</span>
      <span class="event-value">{{ values().join(', ') || '—' }}</span>
    </div>
  </div>`,
};
