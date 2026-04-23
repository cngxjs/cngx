import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Action Multi Select',
  navLabel: 'Action Multi',
  navCategory: 'field',
  description:
    'CngxActionMultiSelect — multi-value combobox with inline quick-create. Eighth sibling of the select family; reuses createCreateCommitHandler with a dedicated commit controller so toggle/create lifecycles stay independent.',
  apiComponents: [
    'CngxActionMultiSelect',
    'CngxSelectAction',
    'provideActionSelectConfig',
  ],
  overview:
    '<p><code>&lt;cngx-action-multi-select&gt;</code> mirrors <code>CngxCombobox</code>\'s chip-strip + ' +
    'inline search surface and extends the action-slot protocol: quick-create items append to ' +
    '<code>values[]</code> instead of replacing a single value. <code>closeOnCreate</code> defaults to ' +
    '<code>false</code> — multi-pick UX keeps the panel open so consumers can continue adding.</p>' +
    '<p><strong>Dual commit controllers:</strong> toggle/clear runs through ' +
    '<code>core.commitController&lt;T[]&gt;</code> (array-commit-handler reconciles full arrays). ' +
    'Create runs through a dedicated <code>createCommitController&lt;T&gt;</code> so each path retains ' +
    'its own supersede lifecycle — a create in flight doesn\'t cancel a pending toggle. The public ' +
    '<code>isCommitting</code> signal is a computed OR over both.</p>' +
    '<p><strong>Change event:</strong> <code>action: \'toggle\' | \'clear\' | \'create\'</code>. The ' +
    'create branch carries <code>added: [newValue]</code> and <code>removed: []</code>, so consumers ' +
    'aggregating deltas treat it identically to a toggle-add.</p>',
  moduleImports: [
    "import { CngxActionMultiSelect, type CngxActionMultiSelectChange, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { CngxSelectAction } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
  ],
  setup: `
  protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
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

  // Basic — create appends; panel stays open.
  protected readonly basicValues = signal<{ id: string; name: string }[]>([]);
  protected basicCounter = 0;
  protected readonly basicCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'local-' + ++this.basicCounter, name: draft.label });

  // Pre-seeded + change log showing toggle vs create branches.
  protected readonly seededValues = signal<{ id: string; name: string }[]>([
    { id: 't1', name: 'Design' },
    { id: 't3', name: 'QA' },
  ]);
  protected readonly seededLog = signal<string[]>([]);
  protected seededCounter = 0;
  protected readonly seededCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'seeded-' + ++this.seededCounter, name: draft.label });
  protected handleSeededChange(ev: CngxActionMultiSelectChange<{ id: string; name: string }>): void {
    const ts = new Date().toLocaleTimeString();
    const line = ts + ' → ' + ev.action + ' | values=' + ev.values.map((v) => v.name).join(', ');
    this.seededLog.update((l) => [...l.slice(-4), line]);
  }

  // Async create + error rollback.
  protected readonly asyncValues = signal<{ id: string; name: string }[]>([]);
  protected readonly asyncShouldFail = signal(false);
  protected readonly asyncLog = signal<string[]>([]);
  protected asyncCounter = 0;
  protected readonly asyncCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => {
      if (this.asyncShouldFail()) {
        return throwError(() => new Error('Server rejected "' + draft.label + '"')).pipe(delay(500));
      }
      return of({ id: 'srv-' + ++this.asyncCounter, name: draft.label }).pipe(delay(500));
    };
  protected handleAsyncError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.asyncLog.update((l) => [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + msg]);
  }

  // Dirty-guard — same pattern as CngxActionSelect but with multi semantics.
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
  }

  // Close-on-create — opt-in for confirm-to-create workflows.
  protected readonly closeValues = signal<{ id: string; name: string }[]>([]);
  protected closeCounter = 0;
  protected readonly closeCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'close-' + ++this.closeCounter, name: draft.label });
  `,
  sections: [
    {
      title: 'Basic — create appends, panel stays open',
      subtitle:
        'Each successful quick-create appends to <code>values[]</code>. The panel keeps its state so ' +
        'consumers can continue typing + creating + picking without re-opening.',
      imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
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
    placeholder="Tags wählen oder eingeben…"
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
          border-top: 1px solid var(--cngx-border, #e5e7eb);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font: inherit;
        "
      >
        @if (pending) { ⏳ „{{ term }}" wird angelegt… }
        @else if (!term) { <span style="opacity:.6">Tippen, um einen neuen Tag anzulegen</span> }
        @else { + Tag „<strong>{{ term }}</strong>" anlegen }
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
    },
    {
      title: 'Pre-seeded + change-event log',
      subtitle:
        'Component starts with <em>Design</em> and <em>QA</em> selected. The <code>(selectionChange)</code> ' +
        'log shows the <code>action</code> discriminant for each event — toggle vs create vs clear. Use it ' +
        'to drive audit logs, analytics, or backend sync.',
      imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
      template: `
  <cngx-action-multi-select
    [label]="'Tags (pre-seeded)'"
    [options]="tags"
    [compareWith]="basicCompare"
    [quickCreateAction]="seededCreate"
    [clearable]="true"
    [(values)]="seededValues"
    (selectionChange)="handleSeededChange($event)"
  >
    <ng-template cngxSelectAction let-term let-commit="commit">
      <button
        type="button"
        [disabled]="!term"
        (click)="commit()"
        style="
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 0;
          border-top: 1px solid var(--cngx-border, #e5e7eb);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font: inherit;
        "
      >
        + „{{ term || '…' }}" anlegen
      </button>
    </ng-template>
  </cngx-action-multi-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Values</span>
      <span class="event-value">{{ seededValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
    @for (line of seededLog(); track line) {
      <div class="event-row">
        <span class="event-label">change</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
    },
    {
      title: 'Async + error — rollback observation',
      subtitle:
        'Quick-create routes through an Observable with 500ms delay. Toggle <strong>Server fails</strong> ' +
        'to trigger an error — <code>(commitError)</code> fires, the values array stays untouched ' +
        '(pessimistic), the commit-error banner surfaces above the options.',
      imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
      template: `
  <div class="button-row" style="margin-bottom:12px">
    <label>
      <input
        type="checkbox"
        [checked]="asyncShouldFail()"
        (change)="asyncShouldFail.set($any($event.target).checked)"
      />
      Server fails
    </label>
  </div>

  <cngx-action-multi-select
    [label]="'Async Tags'"
    [options]="tags"
    [compareWith]="basicCompare"
    [quickCreateAction]="asyncCreate"
    [clearable]="true"
    [(values)]="asyncValues"
    (commitError)="handleAsyncError($event)"
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
          border-top: 1px solid var(--cngx-border, #e5e7eb);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font: inherit;
        "
      >
        @if (pending) { ⏳ „{{ term }}" wird angelegt… }
        @else { + „{{ term || '…' }}" anlegen }
      </button>
    </ng-template>
  </cngx-action-multi-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Values</span>
      <span class="event-value">{{ asyncValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
    @for (line of asyncLog(); track line) {
      <div class="event-row">
        <span class="event-label">error</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
    },
    {
      title: 'Dirty guard — in-panel mini-form',
      subtitle:
        'Action slot hosts a free-text note + <strong>Cancel</strong> / <strong>Create</strong> buttons. ' +
        'Typing flips <code>setDirty(true)</code>; Escape intercepts to fire <code>cancel()</code>; ' +
        'click-outside is blocked until the workflow resolves.',
      imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
      template: `
  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>Open + type in the note field → dirty</span>
    <span><kbd>Esc</kbd> fires cancel (resets dirty, keeps panel open)</span>
    <span>Click outside — blocked while dirty</span>
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
        border-top: 1px solid var(--cngx-border, #e5e7eb);
        background: var(--cngx-surface-variant, rgba(0,0,0,.02));
      ">
        <div style="font-weight:600; font-size:.875rem">
          + Neuen Tag „{{ term || '…' }}" anlegen
          @if (dirty) { <span style="color:var(--cngx-primary,#1976d2)">· ungespeichert</span> }
        </div>
        <input
          #dirtyNoteInput
          type="text"
          (input)="handleDirtyInput($any($event.target).value, setDirty)"
          placeholder="Notiz (optional)…"
          style="
            width: 100%;
            padding: .35rem .5rem;
            border: 1px solid var(--cngx-border, #cbd5e1);
            border-radius: .25rem;
            font: inherit;
          "
        />
        <div style="display:flex; gap:.5rem; justify-content:flex-end">
          <button
            type="button"
            (click)="handleDirtyCancel(setDirty); dirtyNoteInput.value = ''"
            style="padding:.35rem .75rem; border:1px solid var(--cngx-border, #cbd5e1); border-radius:.25rem; background:transparent; cursor:pointer; font:inherit"
          >
            Cancel
          </button>
          <button
            type="button"
            [disabled]="!term || pending"
            (click)="commit()"
            style="padding:.35rem .75rem; border:0; border-radius:.25rem; background:var(--cngx-primary,#1976d2); color:#fff; cursor:pointer; font:inherit"
          >
            @if (pending) { Wird angelegt… } @else { Anlegen }
          </button>
        </div>
      </div>
    </ng-template>
  </cngx-action-multi-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Tags</span>
      <span class="event-value">{{ dirtyValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'closeOnCreate=true — confirm-to-create UX',
      subtitle:
        'Opt into <code>[closeOnCreate]="true"</code> for flows where each create is a discrete ' +
        'transaction — the panel closes after every successful create, matching the single-value ' +
        '<code>CngxActionSelect</code> default. Useful when your UX wants the consumer to pause and ' +
        'confirm before continuing.',
      imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
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
          border-top: 1px solid var(--cngx-border, #e5e7eb);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font: inherit;
        "
      >
        @if (pending) { ⏳ Einladen… }
        @else { + „{{ term || '…' }}" einladen (schließt Panel) }
      </button>
    </ng-template>
  </cngx-action-multi-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Invited</span>
      <span class="event-value">{{ closeValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
  </div>`,
    },
  ],
};
