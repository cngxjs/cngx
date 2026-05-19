import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Dirty guard — Escape cancel + click-outside blocked',
  subtitle: 'The action slot includes a free-text description field. Typing into it calls <code>setDirty(true)</code> through the slot context; while dirty, Escape intercepts (fires <code>cancel()</code>) and click-outside is silently blocked. Press the explicit <strong>Cancel</strong> button or successful create to release the guard.',
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
  template: `
  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>Open the panel + type into the description field</span>
    <span>Press <kbd>Esc</kbd> or click outside — panel stays open</span>
    <span>Press <kbd>Cancel</kbd> or complete create to release</span>
  </div>

  <cngx-action-select
    [label]="'Project'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="dirtyCreate"
    [clearable]="true"
    [(value)]="dirtyValue"
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
        <div style="font-weight:600; font-size:.875rem">
          + Create new entry "{{ term || '…' }}"
          @if (dirty) { <span style="color:var(--cngx-color-primary)">· unsaved</span> }
        </div>
        <input
          #dirtyInput
          type="text"
          (input)="handleDirtyInput($any($event.target).value, setDirty)"
          placeholder="Beschreibung (optional)…"
          style="
            width: 100%;
            padding: .35rem .5rem;
            border: 1px solid var(--cngx-color-border, #cbd5e1);
            border-radius: .25rem;
            font: inherit;
          "
        />
        <div style="display:flex; gap:.5rem; justify-content:flex-end">
          <button
            type="button"
            (click)="handleDirtyCancel(setDirty); dirtyInput.value = ''"
            style="padding:.35rem .75rem; border:1px solid var(--cngx-color-border, #cbd5e1); border-radius:.25rem; background:transparent; cursor:pointer; font:inherit"
          >
            Cancel
          </button>
          <button
            type="button"
            [disabled]="!term || pending"
            (click)="commit()"
            style="padding:.35rem .75rem; border:0; border-radius:.25rem; background:var(--cngx-color-primary); color:#fff; cursor:pointer; font:inherit"
          >
            @if (pending) { Wird angelegt… } @else { Anlegen }
          </button>
        </div>
      </div>
    </ng-template>
  </cngx-action-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Project</span>
      <span class="event-value">{{ dirtyValue()?.name ?? '—' }}</span>
    </div>
  </div>`,
};
