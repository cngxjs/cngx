import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionMultiSelect: action multi chip overflow fit',
  subtitle:
    'An action multi-select capped at <code>max-width: 300px</code> with <code>chipOverflow="fit"</code>: the trigger stays one row, the chips that fit next to the input show, the rest fold into the <code>+N</code> badge. Tags created from the panel join the same strip.',
  description:
    'The strip is measured, not counted: a new tag from the create action folds the last chips that no longer fit into the badge. The input keeps its own minimum width; the hidden chips are out of the tab order and the whole selection reaches AT as the input description.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  framework: 'programmatic',
  apiComponents: ['CngxActionMultiSelect', 'CngxSelectAction'],
  moduleImports: [
    "import { CngxActionMultiSelect, CngxSelectAction, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<string>[] = [
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'qa', label: 'Quality assurance' },
  { value: 'docs', label: 'Documentation' },
  { value: 'ops', label: 'Operations' },
];
protected readonly values = signal<string[]>(['design', 'development', 'qa', 'docs']);
protected readonly create: CngxSelectCreateAction<string> = (_term, draft) => draft.label.toLowerCase();`,
  template: `<cngx-action-multi-select
  [label]="'Tags'"
  [options]="tags"
  [quickCreateAction]="create"
  [(values)]="values"
  chipOverflow="fit"
  style="max-width: 300px"
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
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ values().length }}</span></div>
  </div>`,
};
