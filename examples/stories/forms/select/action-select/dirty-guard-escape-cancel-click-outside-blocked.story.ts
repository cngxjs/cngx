import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionSelect: dirty guard escape cancel click outside blocked',
  subtitle: 'The action slot includes a free-text description field. Typing into it calls <code>setDirty(true)</code> through the slot context; while dirty, Escape intercepts (fires <code>cancel()</code>) and click-outside is silently blocked. Press the explicit <strong>Cancel</strong> button or successful create to release the guard.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionSelect',
    'CngxSelectAction',
  ],
  moduleImports: [
    'import { CngxActionSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
    'import { delay, of } from \'rxjs\';',
  ],
  imports: ['CngxActionSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 't1', name: 'Design' }, label: 'Design' },
    { value: { id: 't2', name: 'Development' }, label: 'Development' },
    { value: { id: 't3', name: 'QA' }, label: 'QA' },
    { value: { id: 't4', name: 'Docs' }, label: 'Docs' },
  ];
  protected readonly basicCompare = (
    a: { id: string; name: string } | undefined,
    b: { id: string; name: string } | undefined,
  ) => (a?.id ?? null) === (b?.id ?? null);
  protected readonly basicDisplay = (v: { id: string; name: string }) => v.name;
  protected readonly dirtyValue = signal<{ id: string; name: string } | undefined>(undefined);
  protected readonly dirtyDescription = signal('');
  protected dirtyCounter = 0;
  protected readonly dirtyCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => of({ id: 'dirty-' + ++this.dirtyCounter, name: draft.label }).pipe(delay(400));
  protected handleDirtyInput(value: string, setDirty: (v: boolean) => void): void {
    this.dirtyDescription.set(value);
    setDirty(value.length > 0);
  }
  protected handleDirtyCancel(setDirty: (v: boolean) => void): void {
    this.dirtyDescription.set('');
    setDirty(false);
  }`,
  template: `  <div class="demo-hint">
    <p>The trigger input holds the project <strong>name</strong>. The note in the panel is optional and drives the dirty guard.</p>
    <ol>
      <li>Type a name in the trigger (e.g. "Mobile").</li>
      <li>Add a note in the panel - this flips <code>dirty</code>.</li>
      <li>Click outside while dirty - the panel stays open. <kbd>Esc</kbd> clears the note, a second <kbd>Esc</kbd> closes.</li>
      <li><kbd>Cancel</kbd> clears the note and closes; <kbd>Create</kbd> adds the project.</li>
    </ol>
  </div>

  <cngx-action-select
    [label]="'Project'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="dirtyCreate"
    [clearable]="true"
    [(value)]="dirtyValue"
    placeholder="Type a project name…"
  >
    <ng-template
      cngxSelectAction
      let-term
      let-commit="commit"
      let-close="close"
      let-pending="isPending"
      let-dirty="dirty"
      let-setDirty="setDirty"
    >
      <div style="
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
      ">
        <div class="demo-mini-form-heading">
          + Create project "{{ term || '…' }}"
          @if (dirty) { <span class="demo-mini-form-marker">· unsaved note</span> }
        </div>
        <label class="demo-label" for="dirty-note-input">Optional note</label>
        <input
          id="dirty-note-input"
          type="text"
          [value]="dirty ? dirtyDescription() : ''"
          (input)="handleDirtyInput($any($event.target).value, setDirty)"
          placeholder="Anything you want to remember…"
          class="demo-mini-form-input"
        />
        <div class="demo-mini-form-actions">
          <button
            type="button"
            (click)="handleDirtyCancel(setDirty); close()"
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
  </cngx-action-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Project</span>
      <span class="event-value">{{ dirtyValue()?.name ?? '—' }}</span>
    </div>
  </div>`,
};
