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
  template: `  <div class="kbd-hint">
    <strong>How it works:</strong>
    <span>The trigger input drives the entry <strong>name</strong> (term). The panel-body input is an optional <strong>note</strong> that demonstrates the dirty-guard.</span>
    <span>1. Type a name in the trigger above (e.g. "Mobile")</span>
    <span>2. Optional: add a note in the panel body - this flips <code>dirty</code></span>
    <span>3. Try <kbd>Esc</kbd> or click-outside while dirty - the panel stays open</span>
    <span>4. Press <kbd>Cancel</kbd> (also clears the note) or <kbd>Create</kbd> to release</span>
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
          + Create project "{{ term || '…' }}"
          @if (dirty) { <span class="demo-mini-form-marker">· unsaved note</span> }
        </div>
        <label class="demo-label" for="dirty-note-input">Optional note</label>
        <input
          id="dirty-note-input"
          #dirtyInput
          type="text"
          (input)="handleDirtyInput($any($event.target).value, setDirty)"
          placeholder="Anything you want to remember…"
          class="demo-mini-form-input"
        />
        <div class="demo-mini-form-actions">
          <button
            type="button"
            (click)="handleDirtyCancel(setDirty); dirtyInput.value = ''"
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
