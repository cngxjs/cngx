import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'closeOnCreate=true — confirm-to-create UX',
  subtitle: 'Opt into <code>[closeOnCreate]="true"</code> for flows where each create is a discrete transaction — the panel closes after every successful create, matching the single-value <code>CngxActionSelect</code> default. Useful when your UX wants the consumer to pause and confirm before continuing.',
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
  protected readonly closeValues = signal<{ id: string; name: string }[]>([]);
  protected closeCounter = 0;
  protected readonly closeCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'close-' + ++this.closeCounter, name: draft.label });`,
  template: `
  <cngx-action-multi-select
    [label]="'Invitees'"
    [options]="tags"
    [compareWith]="basicCompare"
    [quickCreateAction]="closeCreate"
    [closeOnCreate]="true"
    [clearable]="true"
    [(values)]="closeValues"
    placeholder="Invite user…"
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
        @if (pending) { ⏳ Inviting… }
        @else { + „{{ term || '…' }}" invite (closes panel) }
      </button>
    </ng-template>
  </cngx-action-multi-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Invited</span>
      <span class="event-value">{{ closeValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
  </div>`,
};
