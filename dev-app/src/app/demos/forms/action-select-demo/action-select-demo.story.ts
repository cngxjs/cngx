import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Action Select',
  navLabel: 'Action Select',
  navCategory: 'field',
  description:
    'CngxActionSelect — single-value autocomplete with inline quick-create. Seventh sibling of the select family; thin organism on top of createSelectCore + createCreateCommitHandler.',
  apiComponents: [
    'CngxActionSelect',
    'CngxSelectAction',
    'provideActionSelectConfig',
    'createCreateCommitHandler',
  ],
  overview:
    '<p><code>&lt;cngx-action-select&gt;</code> mirrors <code>CngxTypeahead</code>\'s inline-input ' +
    'autocomplete surface (<code>displayWith</code>, <code>clearOnBlur</code>, async commits, ' +
    '<code>searchMatchFn</code>) and adds an inline quick-create workflow via the ' +
    '<code>*cngxSelectAction</code> slot. Compose a template inside the panel, call ' +
    'its <code>commit()</code> callback, and the bound <code>[quickCreateAction]</code> ' +
    'materialises a new <code>T</code>. On success the new item lands in the persistent local ' +
    'buffer, becomes the current value, announces <code>\'created\'</code>, and (optionally) ' +
    'closes the panel.</p>' +
    '<p><strong>Dismiss guard:</strong> consumer templates that flip <code>setDirty(true)</code> ' +
    'intercept Escape and click-outside — the panel stays open until <code>cancel()</code> ' +
    'fires or the commit resolves. <strong>Focus trap:</strong> the shared panel shell\'s ' +
    '<code>CngxFocusTrap</code> activates when dirty (default) — configurable via ' +
    '<code>provideActionSelectConfig(withFocusTrapBehavior(\'always\'|\'dirty\'|\'never\'))</code>.</p>' +
    '<p><strong>Commit semantics:</strong> pessimistic — the panel stays open with an ' +
    '<code>isPending</code> flag in the slot context so a custom button can show a spinner. ' +
    'Supersede applies via the shared commit controller (consecutive creates cancel the ' +
    'in-flight one cleanly).</p>',
  moduleImports: [
    "import { CngxActionSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { CngxSelectAction } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
  ],
  setup: `
  protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 't1', name: 'Design' }, label: 'Design' },
    { value: { id: 't2', name: 'Development' }, label: 'Development' },
    { value: { id: 't3', name: 'QA' }, label: 'QA' },
    { value: { id: 't4', name: 'Docs' }, label: 'Docs' },
  ];

  // Basic sync quick-create — each create invents a fake id.
  protected readonly basicValue = signal<{ id: string; name: string } | undefined>(undefined);
  protected basicCreateCounter = 0;
  protected readonly basicCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'local-' + ++this.basicCreateCounter, name: draft.label });
  protected readonly basicCompare = (
    a: { id: string; name: string } | undefined,
    b: { id: string; name: string } | undefined,
  ) => (a?.id ?? null) === (b?.id ?? null);
  protected readonly basicDisplay = (v: { id: string; name: string }) => v.name;

  // Pre-seeded — starts with Development selected, consumer can replace via quick-create.
  protected readonly seededValue = signal<{ id: string; name: string } | undefined>(
    { id: 't2', name: 'Development' },
  );
  protected readonly seededLog = signal<string[]>([]);
  protected seededCounter = 0;
  protected readonly seededCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'created-' + ++this.seededCounter, name: draft.label });
  protected handleSeededCreated(opt: CngxSelectOptionDef<{ id: string; name: string }>): void {
    const ts = new Date().toLocaleTimeString();
    this.seededLog.update((l) =>
      [...l.slice(-4), ts + ' → created "' + opt.label + '" (id=' + opt.value.id + ')'],
    );
  }

  // Async + error — toggles a failure flag for rollback observation.
  protected readonly asyncValue = signal<{ id: string; name: string } | undefined>(undefined);
  protected readonly asyncShouldFail = signal(false);
  protected readonly asyncLog = signal<string[]>([]);
  protected asyncCounter = 0;
  protected readonly asyncCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => {
      if (this.asyncShouldFail()) {
        return throwError(() => new Error('Server rejected "' + draft.label + '"')).pipe(delay(600));
      }
      return of({ id: 'srv-' + ++this.asyncCounter, name: draft.label }).pipe(delay(600));
    };
  protected handleAsyncError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.asyncLog.update((l) => [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + msg]);
  }

  // Dirty guard — a form inside the action slot tracks dirty via setDirty.
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
  }

  // Custom template — rich action slot with icon + keyboard shortcut.
  protected readonly customValue = signal<{ id: string; name: string } | undefined>(undefined);
  protected customCounter = 0;
  protected readonly customCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'custom-' + ++this.customCounter, name: draft.label });
  `,
  sections: [
    {
      title: 'Basic — sync quick-create',
      subtitle:
        'Type a label and press the <strong>Create</strong> button inside the panel to materialise a new ' +
        'entry. The sync create returns a fresh value; the new option becomes the current selection, ' +
        'lands in the persistent local buffer, and the panel closes.',
      imports: ['CngxActionSelect', 'CngxSelectAction'],
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
    placeholder="Tag wählen oder eingeben…"
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
          border-top: 1px solid var(--cngx-border, #e5e7eb);
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
          <span>+ Tag „<strong>{{ term }}</strong>" anlegen</span>
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
    },
    {
      title: 'Pre-seeded + (created) output log',
      subtitle:
        'Component starts with <em>Development</em> already selected. The <code>(created)</code> output ' +
        'fires after every successful quick-create — dedicated channel for consumers that only care about ' +
        'creation events without branching on <code>action === \'create\'</code>.',
      imports: ['CngxActionSelect', 'CngxSelectAction'],
      template: `
  <cngx-action-select
    [label]="'Tag (pre-seeded)'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="seededCreate"
    [clearable]="true"
    [(value)]="seededValue"
    (created)="handleSeededCreated($event)"
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
  </cngx-action-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Current</span>
      <span class="event-value">{{ seededValue()?.name ?? '—' }}</span>
    </div>
    @for (line of seededLog(); track line) {
      <div class="event-row">
        <span class="event-label">created</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
    },
    {
      title: 'Async + error — rollback observation',
      subtitle:
        'Quick-create routes through an Observable with 600ms delay. Toggle the <strong>Server fails</strong> ' +
        'checkbox to make the next create reject — the error surfaces via <code>(commitError)</code>, the ' +
        'commit-error banner renders above the options, and the value stays untouched (pessimistic flow).',
      imports: ['CngxActionSelect', 'CngxSelectAction'],
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

  <cngx-action-select
    [label]="'Async Tag'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="asyncCreate"
    [clearable]="true"
    [(value)]="asyncValue"
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
  </cngx-action-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">{{ asyncValue()?.name ?? '—' }}</span>
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
      title: 'Dirty guard — Escape cancel + click-outside blocked',
      subtitle:
        'The action slot includes a free-text description field. Typing into it calls ' +
        '<code>setDirty(true)</code> through the slot context; while dirty, Escape intercepts (fires ' +
        '<code>cancel()</code>) and click-outside is silently blocked. Press the explicit <strong>Cancel</strong> ' +
        'button or successful create to release the guard.',
      imports: ['CngxActionSelect', 'CngxSelectAction'],
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
        border-top: 1px solid var(--cngx-border, #e5e7eb);
        background: var(--cngx-surface-variant, rgba(0,0,0,.02));
      ">
        <div style="font-weight:600; font-size:.875rem">
          + Neuen Eintrag „{{ term || '…' }}" anlegen
          @if (dirty) { <span style="color:var(--cngx-primary,#1976d2)">· ungespeichert</span> }
        </div>
        <input
          type="text"
          [value]="dirtyDescription()"
          (input)="handleDirtyInput($any($event.target).value, setDirty)"
          placeholder="Beschreibung (optional)…"
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
            (click)="handleDirtyCancel(setDirty)"
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
  </cngx-action-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Project</span>
      <span class="event-value">{{ dirtyValue()?.name ?? '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Custom action template — split actions',
      subtitle:
        'The action slot is just an <code>ng-template</code> with a rich context — project anything: a split ' +
        'button with both <em>Create &amp; close</em> and <em>Create &amp; keep open</em>, keyboard ' +
        'shortcuts, icons, mini-wizards. The component\'s <code>closeOnCreate</code> input is the default; ' +
        'consumer templates can call <code>close()</code> from the context to force-close after an ' +
        '<code>onCreated</code> emit.',
      imports: ['CngxActionSelect', 'CngxSelectAction'],
      template: `
  <cngx-action-select
    [label]="'Custom'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="customCreate"
    [closeOnCreate]="false"
    [clearable]="true"
    [(value)]="customValue"
    actionPosition="top"
  >
    <ng-template
      cngxSelectAction
      let-term
      let-commit="commit"
      let-pending="isPending"
      let-close="close"
    >
      <div style="
        display: flex;
        align-items: center;
        gap: .5rem;
        padding: .5rem .75rem;
        border-bottom: 1px solid var(--cngx-border, #e5e7eb);
        background: var(--cngx-surface-variant, rgba(0,0,0,.02));
      ">
        <span style="font-size:1.25rem" aria-hidden="true">✨</span>
        <span style="flex:1; font-weight:600">
          Neuer Tag @if (term) { · „{{ term }}" }
        </span>
        <button
          type="button"
          [disabled]="!term || pending"
          (click)="commit()"
          style="padding:.25rem .625rem; border:1px solid var(--cngx-border, #cbd5e1); border-radius:.25rem; background:transparent; cursor:pointer; font:inherit; font-size:.8125rem"
        >
          anlegen
        </button>
        <button
          type="button"
          [disabled]="!term || pending"
          (click)="commit(); close()"
          style="padding:.25rem .625rem; border:0; border-radius:.25rem; background:var(--cngx-primary,#1976d2); color:#fff; cursor:pointer; font:inherit; font-size:.8125rem"
        >
          anlegen &amp; schließen
        </button>
      </div>
    </ng-template>
  </cngx-action-select>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Custom</span>
      <span class="event-value">{{ customValue()?.name ?? '—' }}</span>
    </div>
  </div>`,
    },
  ],
};
