import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — sync quick-create',
  subtitle: 'Type a label and press the <strong>Create</strong> button inside the panel to materialise a new entry. The sync create returns a fresh value; the new option becomes the current selection, lands in the persistent local buffer, and the panel closes.',
  description: 'CngxActionSelect — single-value autocomplete with inline quick-create. Seventh sibling of the select family; thin organism on top of createSelectCore + createCreateCommitHandler.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionSelect',
    'CngxSelectAction',
    'provideActionSelectConfig',
    'createCreateCommitHandler',
  ],
  moduleImports: [
    'import { CngxActionSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxActionSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 't1', name: 'Design' }, label: 'Design' },
    { value: { id: 't2', name: 'Development' }, label: 'Development' },
    { value: { id: 't3', name: 'QA' }, label: 'QA' },
    { value: { id: 't4', name: 'Docs' }, label: 'Docs' },
  ];
  protected readonly basicValue = signal<{ id: string; name: string } | undefined>(undefined);
  protected basicCreateCounter = 0;
  protected readonly basicCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'local-' + ++this.basicCreateCounter, name: draft.label });
  protected readonly basicCompare = (
    a: { id: string; name: string } | undefined,
    b: { id: string; name: string } | undefined,
  ) => (a?.id ?? null) === (b?.id ?? null);
  protected readonly basicDisplay = (v: { id: string; name: string }) => v.name;`,
  template: `
  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>Type a non-existent tag (e.g. "Security")</span>
    <span>Press the <kbd>Create</kbd> button inside the panel</span>
    <span>The new tag becomes the selection and the panel closes</span>
  </div>

  <cngx-action-select
    [label]="'Tag'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="basicCreate"
    [clearable]="true"
    [(value)]="basicValue"
    placeholder="Choose or enter a tag…"
  >
    <ng-template
      cngxSelectAction
      let-term
      let-commit="commit"
      let-pending="isPending"
    >
      <button
        type="button"
        class="action-slot-btn"
        [disabled]="!term || pending"
        (click)="commit()"
        style="
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
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
        @if (pending) {
          <span>⏳ Wird angelegt…</span>
        } @else if (!term) {
          <span style="opacity:.6">Tippen, um einen neuen Tag anzulegen</span>
        } @else {
          <span>+ Create tag "<strong>{{ term }}</strong>"</span>
        }
      </button>
    </ng-template>
  </cngx-action-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">{{ basicValue()?.name ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">ID</span>
      <span class="event-value">{{ basicValue()?.id ?? '—' }}</span>
    </div>
  </div>`,
};
