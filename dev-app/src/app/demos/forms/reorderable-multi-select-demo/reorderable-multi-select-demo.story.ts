import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Reorderable Multi Select',
  navLabel: 'Reorderable Multi',
  navCategory: 'field',
  description:
    'CngxReorderableMultiSelect — multi-value picker whose selected chips can be reordered via pointer drag and Ctrl+Arrow keyboard moves. Thin organism on top of createSelectCore + CngxReorder.',
  apiComponents: [
    'CngxReorderableMultiSelect',
    'CngxReorder',
    'CngxMultiSelectChip',
    'CngxMultiSelectTriggerLabel',
  ],
  overview:
    '<p><code>&lt;cngx-reorderable-multi-select&gt;</code> is a specialized multi-value variant ' +
    'whose trigger chip strip lets the user reorder the selection. Composition: ' +
    '<code>createSelectCore</code> (signal-graph, ARIA, panel view, commit lifecycle) + ' +
    '<code>CngxReorder</code> (pointer drag + modifier-gated keyboard) + shared template slots ' +
    '(<code>*cngxMultiSelectChip</code>, <code>*cngxMultiSelectTriggerLabel</code>, ' +
    '<code>*cngxSelectClearButton</code>, …).</p>' +
    '<p><strong>Why a specialized component instead of a <code>[reorderable]</code> flag on ' +
    '<code>CngxMultiSelect</code>:</strong> <code>CngxMultiSelect</code>\'s commit path routes ' +
    'through <code>createArrayCommitHandler.beginToggle</code>, which uses <code>sameArrayContents</code> ' +
    'to short-circuit writes on same-membership updates. A pure reorder (same values, new order) ' +
    'would be silently skipped. <code>CngxReorderableMultiSelect.dispatchReorder</code> bypasses the ' +
    'handler and talks to the commit controller directly, mirroring ' +
    '<code>CngxTreeSelect.dispatchValueChange</code>. Keeping the variants separate also keeps ' +
    '<code>CngxMultiSelect</code>\'s hot path free of reorder branches.</p>' +
    '<p><strong>Keyboard:</strong> plain <kbd>←</kbd> / <kbd>→</kbd> / <kbd>Home</kbd> / <kbd>End</kbd> ' +
    'move focus between chips (inline roving tabindex). <kbd>Ctrl</kbd> + the same keys reorder the ' +
    'focused chip (configurable via <code>[reorderKeyboardModifier]</code> — <code>\'ctrl\'</code>, ' +
    '<code>\'alt\'</code>, or <code>\'meta\'</code>). <kbd>Ctrl</kbd>+<kbd>Home</kbd>/<kbd>End</kbd> ' +
    'jump to the strip\'s extremes.</p>' +
    '<p><strong>Announcer:</strong> every reorder emits a <code>\'reordered\'</code> action through ' +
    'the shared <code>CngxSelectAnnouncer</code>. The default German formatter speaks ' +
    '"<em>{label} verschoben auf Position N</em>". Override via <code>[announceTemplate]</code> or ' +
    '<code>provideSelectConfig(withAnnouncer({ format: … }))</code>.</p>' +
    '<p><strong>Commit flow:</strong> with <code>[commitAction]</code>, reorder writes are supersede- ' +
    'aware (the same commit-controller as the rest of the family). <code>\'optimistic\'</code> ' +
    'applies immediately and rolls back on error; <code>\'pessimistic\'</code> freezes the whole ' +
    'chip strip (<code>reorderDisabled = disabled || isCommitting</code>) until success.</p>',
  moduleImports: [
    "import { CngxReorderableMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
  ],
  setup: `
  protected readonly recipients: CngxSelectOptionDef<string>[] = [
    { value: 'ops', label: 'Operations' },
    { value: 'eng', label: 'Engineering' },
    { value: 'legal', label: 'Legal' },
    { value: 'finance', label: 'Finance' },
    { value: 'sales', label: 'Sales' },
    { value: 'support', label: 'Customer Support' },
    { value: 'hr', label: 'Human Resources' },
  ];

  protected readonly songs: CngxSelectOptionDef<string>[] = [
    { value: 's1', label: 'Intro — Mogwai' },
    { value: 's2', label: 'Heart-Shaped Box — Nirvana' },
    { value: 's3', label: 'Midnight City — M83' },
    { value: 's4', label: 'Teardrop — Massive Attack' },
    { value: 's5', label: 'Breathe — Pink Floyd' },
    { value: 's6', label: 'Paranoid Android — Radiohead' },
  ];

  // Basic — user drags chips into preferred broadcast order.
  protected readonly basicValues = signal<string[]>(['ops', 'eng', 'legal']);

  // Keyboard-first — pre-seeded with four entries, user tabs into the
  // strip and reorders via Ctrl+Arrow.
  protected readonly keyboardValues = signal<string[]>(['eng', 'legal', 'finance', 'ops']);

  // Commit-action playground.
  protected readonly commitValues = signal<string[]>(['s1', 's2', 's3', 's4', 's5']);
  protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitLog = signal<string[]>([]);
  protected readonly commitAction = (intended: string[] | undefined) => {
    const ts = new Date().toLocaleTimeString();
    const line = ts + ' → [' + (intended ?? []).join(', ') + ']';
    this.commitLog.update((l) => [...l.slice(-4), line]);
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Save failed (demo)')).pipe(delay(700));
    }
    return of(intended).pipe(delay(700));
  };

  // Custom drag-handle playground — needs a viewChild on the ng-template.
  protected readonly customHandleValues = signal<string[]>(['ops', 'sales', 'support']);

  // Pre-seeded, with reorder-specific event log.
  protected readonly seededValues = signal<string[]>(['legal', 'finance', 'hr', 'ops', 'eng']);
  protected readonly seededLog = signal<string[]>([]);
  protected readonly handleSeededReorder = (
    evt: { fromIndex?: number; toIndex?: number; values: readonly string[] },
  ) => {
    const from = evt.fromIndex ?? -1;
    const to = evt.toIndex ?? -1;
    const line =
      new Date().toLocaleTimeString() + ' → [' + from + ' → ' + to + '] ' + evt.values.join(', ');
    this.seededLog.update((l) => [...l.slice(-4), line]);
  };
  `,
  sections: [
    {
      title: 'Basic — drag chips via mouse / touch',
      subtitle:
        'Grab the six-dot handle on any chip and drop it elsewhere in the strip. Order is written ' +
        'back into <code>[(values)]</code> — the signal is the single source of truth, everything else ' +
        'derives from it.',
      imports: ['CngxReorderableMultiSelect'],
      template: `
  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>Open the panel and select 3–5 recipients.</span>
    <span>Drag any chip — anywhere outside the ✕ button.</span>
  </div>

  <cngx-reorderable-multi-select
    [label]="'Broadcast-Reihenfolge'"
    [options]="recipients"
    [clearable]="true"
    [(values)]="basicValues"
    placeholder="Empfänger auswählen…"
  />

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Current order</span>
      <span class="event-value">{{ basicValues().join(' → ') || '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Keyboard reorder — Ctrl + Arrow / Home / End',
      subtitle:
        'Tab into the chip strip, then press <kbd>Ctrl</kbd>+<kbd>→</kbd> or <kbd>Ctrl</kbd>+<kbd>←</kbd> ' +
        'to reorder the focused chip. <kbd>Ctrl</kbd>+<kbd>Home</kbd> / <kbd>End</kbd> jump the chip to ' +
        'the strip extremes. Plain <kbd>←</kbd>/<kbd>→</kbd> keep moving focus without mutating the selection.',
      imports: ['CngxReorderableMultiSelect'],
      template: `
  <div class="kbd-hint">
    <strong>Keyboard:</strong>
    <span><kbd>Tab</kbd> into the strip</span>
    <span><kbd>←</kbd><kbd>→</kbd> move focus</span>
    <span><kbd>Ctrl</kbd>+<kbd>←</kbd><kbd>→</kbd> reorder</span>
    <span><kbd>Ctrl</kbd>+<kbd>Home</kbd>/<kbd>End</kbd> to extremes</span>
  </div>

  <cngx-reorderable-multi-select
    [label]="'Agenda-Reihenfolge'"
    [options]="recipients"
    [(values)]="keyboardValues"
    [reorderAriaLabel]="'Agenda-Reihenfolge ändern mit Strg und Pfeiltasten'"
  />

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Current order</span>
      <span class="event-value">{{ keyboardValues().join(' → ') || '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Commit action — optimistic / pessimistic with supersede',
      subtitle:
        'Each reorder hits the commit action. Optimistic applies immediately and rolls back on error; ' +
        'pessimistic freezes the whole strip until the write succeeds. Consecutive reorders supersede any ' +
        'in-flight commit — the state machine is shared with the rest of the select family.',
      imports: ['CngxReorderableMultiSelect'],
      template: `
  <div class="button-row" style="margin-bottom:12px">
    <label>
      <input
        type="radio"
        name="rm-commitMode"
        value="optimistic"
        [checked]="commitMode() === 'optimistic'"
        (change)="commitMode.set('optimistic')"
      />
      Optimistic
    </label>
    <label>
      <input
        type="radio"
        name="rm-commitMode"
        value="pessimistic"
        [checked]="commitMode() === 'pessimistic'"
        (change)="commitMode.set('pessimistic')"
      />
      Pessimistic
    </label>
    <label style="margin-left:1rem">
      <input
        type="checkbox"
        [checked]="commitShouldFail()"
        (change)="commitShouldFail.set($any($event.target).checked)"
      />
      Server fails
    </label>
  </div>

  <cngx-reorderable-multi-select
    [label]="'Playlist'"
    [options]="songs"
    [clearable]="true"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    [(values)]="commitValues"
  />

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Playlist order</span>
      <span class="event-value">{{ commitValues().join(' → ') || '—' }}</span>
    </div>
    @for (line of commitLog(); track line) {
      <div class="event-row">
        <span class="event-label">commit</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
    },
    {
      title: 'Optional drag-handle glyph',
      subtitle:
        'By default no grip glyph renders — the whole chip is the drag surface and the ✕ button\'s ' +
        'hover state visually divides "drag here" from "remove here". Project a ' +
        '<code>TemplateRef&lt;void&gt;</code> through the <code>[chipDragHandle]</code> input to add a ' +
        'custom glyph back when your design language calls for one. The slot stays ' +
        '<code>aria-hidden="true"</code> — the semantic reorder is owned by the chip wrapper\'s ' +
        'keyboard handler plus <code>CngxReorder</code>.',
      imports: ['CngxReorderableMultiSelect'],
      template: `
  <cngx-reorderable-multi-select
    [label]="'Teams'"
    [options]="recipients"
    [(values)]="customHandleValues"
    [chipDragHandle]="customGrip"
  />

  <ng-template #customGrip>
    <span style="
      display:inline-block;
      font-size:.875rem;
      letter-spacing:.1em;
      font-weight:700;
      color:var(--cngx-primary,#1976d2);
    ">&equiv;</span>
  </ng-template>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Team order</span>
      <span class="event-value">{{ customHandleValues().join(' → ') || '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Pre-seeded values + reorder log',
      subtitle:
        'Component starts with five selected teams. The <code>(reordered)</code> output fires every ' +
        'time a drag or keyboard move settles on a new position, carrying <code>fromIndex</code> / ' +
        '<code>toIndex</code> / the moved <code>option</code>. <code>(selectionChange)</code> fires ' +
        'with the same payload under <code>action: \'reorder\'</code>.',
      imports: ['CngxReorderableMultiSelect'],
      template: `
  <cngx-reorderable-multi-select
    [label]="'Eskalations-Reihenfolge'"
    [options]="recipients"
    [(values)]="seededValues"
    (reordered)="handleSeededReorder($event)"
  />

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Order</span>
      <span class="event-value">{{ seededValues().join(' → ') }}</span>
    </div>
    @for (line of seededLog(); track line) {
      <div class="event-row">
        <span class="event-label">reorder</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
    },
  ],
};
