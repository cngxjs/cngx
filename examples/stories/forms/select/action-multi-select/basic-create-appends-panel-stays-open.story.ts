import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — create appends, panel stays open',
  subtitle: 'Each successful quick-create appends to <code>values[]</code>. The panel keeps its state so consumers can continue typing + creating + picking without re-opening.',
  description: 'CngxActionMultiSelect — multi-value combobox with inline quick-create. Eighth sibling of the select family; reuses createCreateCommitHandler with a dedicated commit controller so toggle/create lifecycles stay independent.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionMultiSelect',
    'CngxSelectAction',
    'provideActionSelectConfig',
  ],
  moduleImports: [
    'import { CngxActionMultiSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 't1', name: 'Design' }, label: 'Design' },
    { value: { id: 't2', name: 'Development' }, label: 'Development' },
    { value: { id: 't3', name: 'QA' }, label: 'QA' },
    { value: { id: 't4', name: 'Docs' }, label: 'Docs' },
    { value: { id: 't5', name: 'Review' }, label: 'Review' },
  ];
  protected readonly basicCompare = (
    a: { id: string; name: string } | undefined,
    b: { id: string; name: string } | undefined,
  ) => (a?.id ?? null) === (b?.id ?? null);
  protected readonly basicValues = signal<{ id: string; name: string }[]>([]);
  protected basicCounter = 0;
  protected readonly basicCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'local-' + ++this.basicCounter, name: draft.label });`,
  template: `
  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>Type a new tag name (e.g. "Security")</span>
    <span>Press the <kbd>Create</kbd> button inside the panel</span>
    <span>New chip appends; panel stays open for the next pick</span>
  </div>

  <cngx-action-multi-select
    [label]="'Tags'"
    [options]="tags"
    [compareWith]="basicCompare"
    [quickCreateAction]="basicCreate"
    [clearable]="true"
    [(values)]="basicValues"
    placeholder="Choose or enter tags…"
  >
    <ng-template
      cngxSelectAction
      let-term
      let-commit="commit"
      let-pending="isPending"
    >
      <button
        type="button"
        [disabled]="!term || pending"
        (click)="commit()"
        style="
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 0;
          border-top: 1px solid var(--cngx-color-border, #e5e7eb);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font: inherit;
        "
      >
        @if (pending) { ⏳ „{{ term }}" wird angelegt… }
        @else if (!term) { <span style="opacity:.6">Tippen, um einen neuen Tag anzulegen</span> }
        @else { + Create tag "<strong>{{ term }}</strong>" }
      </button>
    </ng-template>
  </cngx-action-multi-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Count</span>
      <span class="event-value">{{ basicValues().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Values</span>
      <span class="event-value">{{ basicValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
  </div>`,
};
