import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionMultiSelect: dirty guard in panel mini form',
  subtitle: 'Action slot hosts a free-text note + <strong>Cancel</strong> / <strong>Create</strong> buttons. Typing flips <code>setDirty(true)</code>; Escape intercepts to fire <code>cancel()</code>; click-outside is blocked until the workflow resolves.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionMultiSelect',
    'CngxSelectAction',
  ],
  moduleImports: [
    'import { CngxActionMultiSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
    'import { delay, of } from \'rxjs\';',
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
  protected readonly dirtyValues = signal<{ id: string; name: string }[]>([]);
  protected readonly dirtyNote = signal('');
  protected dirtyCounter = 0;
  protected readonly dirtyCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => of({ id: 'dirty-' + ++this.dirtyCounter, name: draft.label }).pipe(delay(400));
  protected handleDirtyInput(value: string, setDirty: (v: boolean) => void): void {
    this.dirtyNote.set(value);
    setDirty(value.length > 0);
  }
  protected handleDirtyCancel(setDirty: (v: boolean) => void): void {
    this.dirtyNote.set('');
    setDirty(false);
  }`,
  template: `  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>Open + type in the note field → dirty</span>
    <span><kbd>Esc</kbd> fires cancel (resets dirty, keeps panel open)</span>
    <span>Click outside - blocked while dirty</span>
  </div>

  <cngx-action-multi-select
    [label]="'Notes on tags'"
    [options]="tags"
    [compareWith]="basicCompare"
    [quickCreateAction]="dirtyCreate"
    [clearable]="true"
    [(values)]="dirtyValues"
  >
    <ng-template
      cngxSelectAction
      let-term
      let-commit="commit"
      let-pending="isPending"
      let-dirty="dirty"
      let-setDirty="setDirty"
    >
      <div style="
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        border-top: 1px solid var(--cngx-color-border, #e5e7eb);
        background: var(--cngx-surface-variant, rgba(0,0,0,.02));
      ">
        <div class="demo-mini-form-heading">
          + Create new tag "{{ term || '…' }}"
          @if (dirty) { <span class="demo-mini-form-marker">· unsaved</span> }
        </div>
        <input
          #dirtyNoteInput
          type="text"
          (input)="handleDirtyInput($any($event.target).value, setDirty)"
          placeholder="Note (optional)…"
          aria-label="Tag note"
          class="demo-mini-form-input"
        />
        <div class="demo-mini-form-actions">
          <button
            type="button"
            (click)="handleDirtyCancel(setDirty); dirtyNoteInput.value = ''"
            class="demo-mini-form-btn demo-mini-form-btn--ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            [disabled]="!term || pending"
            (click)="commit()"
            class="demo-mini-form-btn demo-mini-form-btn--primary"
          >
            @if (pending) { Creating… } @else { Create }
          </button>
        </div>
      </div>
    </ng-template>
  </cngx-action-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Tags</span>
      <span class="event-value">{{ dirtyValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
  </div>`,
};
