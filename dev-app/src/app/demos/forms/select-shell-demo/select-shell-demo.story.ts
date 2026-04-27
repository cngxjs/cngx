import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select Shell',
  navLabel: 'Select Shell',
  navCategory: 'field',
  description:
    'CngxSelectShell — single-value declarative-options dropdown. Project user-authored <cngx-option> / <cngx-optgroup> children directly; the shell derives a hierarchy-aware option model and runs the same family-level intelligence (createSelectCore, createFieldSync, createScalarCommitHandler, announcer) as CngxSelect.',
  apiComponents: [
    'CngxSelectShell',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
  ],
  overview:
    '<p><code>&lt;cngx-select-shell&gt;</code> is the ninth member of the select family. ' +
    'Where <code>&lt;cngx-select&gt;</code> consumes options through the data-driven ' +
    '<code>[options]</code> input, the shell projects user <code>&lt;cngx-option&gt;</code> ' +
    'and <code>&lt;cngx-optgroup&gt;</code> children directly via <code>&lt;ng-content/&gt;</code>. ' +
    'Internally it queries <code>CNGX_OPTION_CONTAINER</code> on its direct content children to derive ' +
    'a hierarchy-preserving <code>CngxSelectOptionsInput&lt;T&gt;</code> array, then feeds that into ' +
    '<code>createSelectCore&lt;T, T&gt;</code> — the same factory <code>CngxSelect</code> consumes.</p>' +
    '<p><strong>Why a separate variant.</strong> Angular content-projection scoping prevents direct use of ' +
    '<code>&lt;cngx-option&gt;</code> as a child of <code>&lt;cngx-select&gt;</code>. The shell sidesteps ' +
    'this by querying its own content-children, feeding the derived array as <code>[explicitOptions]</code> + ' +
    '<code>[items]</code> to the inner <code>cngxListbox</code>, and event-delegating click + hover so ' +
    'projected options are interactive end-to-end.</p>' +
    '<p><strong>Plain-text trigger guarantee.</strong> The closed-trigger label renders ' +
    '<code>option.label()</code> via text interpolation only — never <code>[innerHTML]</code>. Rich markup inside ' +
    '<code>&lt;cngx-option&gt;</code> only appears in the open panel; the trigger shows the textContent. ' +
    'XSS-safe by construction.</p>' +
    '<p><strong>Shared family surface.</strong> Provides <code>CNGX_FORM_FIELD_CONTROL</code> directly, ' +
    'wires <code>createFieldSync</code> for Signal-Forms / Reactive-Forms round-trip, and routes commits ' +
    'through <code>createScalarCommitHandler</code>. Per-option pending and error glyphs reach individual ' +
    '<code>CngxOption</code> instances via the Phase-2 reserved internal status slot — not alongside user content.</p>',
  moduleImports: [
    "import { FormControl } from '@angular/forms';",
    "import { CngxFormField, CngxLabel, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxSelectShell, CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider, CngxSelectSearch, CngxSelectOptionError, CngxSelectOptionPending, CngxSelectPlaceholder, CngxSelectEmpty, CngxSelectCaret, type CngxSelectCommitAction, type CngxSelectCommitMode, type CngxSelectShellChange } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
  ],
  setup: `
  // Basic — flat options.
  protected readonly basicValue = signal<string | undefined>(undefined);
  protected readonly basicLog = signal<string | null>(null);
  protected handleBasicChange(e: CngxSelectShellChange<string>): void {
    this.basicLog.set(
      new Date().toLocaleTimeString() + ' → ' + (e.option?.label ?? '—'),
    );
  }

  // Grouped — optgroups projected via <cngx-optgroup>.
  protected readonly groupedValue = signal<string | undefined>(undefined);

  // Rich-content trigger — closed trigger renders plain text from textContent.
  protected readonly richValue = signal<string | undefined>(undefined);

  // Form-field — Reactive Forms via adaptFormControl.
  protected readonly rfControl = new FormControl<string | null>('green');
  protected readonly rfField = adaptFormControl(this.rfControl, 'color');

  // Commit + error — async commit with toggleable failure + commit mode.
  protected readonly commitValue = signal<string | undefined>('red');
  protected readonly commitMode = signal<CngxSelectCommitMode>('pessimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitErrors = signal<string[]>([]);
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    void intended;
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server rejected the commit')).pipe(delay(1500));
    }
    return of(intended).pipe(delay(1500));
  };
  protected handleCommitError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.commitErrors.update((l) => [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + msg]);
  }

  // Empty + loading + state-driven.
  protected readonly emptyValue = signal<string | undefined>(undefined);
  protected readonly loadingFlag = signal(false);

  // Custom glyphs.
  protected readonly customValue = signal<string | undefined>(undefined);

  // Search — case-insensitive substring filter via CNGX_OPTION_FILTER_HOST.
  protected readonly searchValue = signal<string | undefined>(undefined);
  protected readonly searchTerm = signal<string>('');
  protected readonly cities = [
    'Amsterdam', 'Berlin', 'Cologne', 'Dresden', 'Edinburgh', 'Frankfurt',
    'Geneva', 'Hamburg', 'Innsbruck', 'Jena', 'Krakow', 'Lisbon', 'Madrid',
    'Munich', 'Nice', 'Oslo', 'Paris', 'Reykjavik', 'Stockholm', 'Tallinn',
    'Utrecht', 'Vienna', 'Warsaw', 'Zurich',
  ];

  // Showcase — combines all the bells.
  protected readonly showcaseValue = signal<string | undefined>('design');
  protected readonly showcaseLog = signal<string[]>([]);
  protected readonly showcaseAction: CngxSelectCommitAction<string> = (intended) => {
    return of(intended).pipe(delay(800));
  };
  protected handleShowcaseChange(e: CngxSelectShellChange<string>): void {
    this.showcaseLog.update((l) =>
      [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + (e.option?.label ?? 'cleared')],
    );
  }
  `,
  sections: [
    {
      title: 'Basic — flat declarative options',
      subtitle:
        'Project <code>&lt;cngx-option&gt;</code> children directly. The shell builds the option model ' +
        'via <code>contentChildren(CNGX_OPTION_CONTAINER)</code> and feeds the result into the inner ' +
        '<code>cngxListbox</code>. Click + hover delegated by the shell so projected options are interactive ' +
        'end-to-end.',
      imports: ['CngxSelectShell', 'CngxSelectOption'],
      template: `
  <cngx-select-shell
    [label]="'Farbe'"
    [clearable]="true"
    [(value)]="basicValue"
    (selectionChange)="handleBasicChange($event)"
    placeholder="Bitte wählen…"
  >
    <cngx-option [value]="'red'">Rot</cngx-option>
    <cngx-option [value]="'green'">Grün</cngx-option>
    <cngx-option [value]="'blue'">Blau</cngx-option>
    <cngx-option [value]="'disabled'" [disabled]="true">Nicht verfügbar</cngx-option>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ basicValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">last selectionChange</span>
      <span class="event-value">{{ basicLog() ?? '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Grouped + divider — projected hierarchy',
      subtitle:
        'Hierarchy preserved through the projection. <code>&lt;cngx-select-divider /&gt;</code> renders a ' +
        'visual separator that ATs ignore (<code>role="presentation"</code>, <code>aria-hidden</code>). ' +
        'Nested <code>&lt;cngx-optgroup&gt;</code> inside another group dev-warns; use <code>CngxTreeSelect</code> ' +
        'for arbitrary tree shapes.',
      imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectOptgroup', 'CngxSelectDivider'],
      template: `
  <cngx-select-shell [label]="'Priorität'" [(value)]="groupedValue" placeholder="Priorität…">
    <cngx-optgroup label="Normal">
      <cngx-option [value]="'low'">Niedrig</cngx-option>
      <cngx-option [value]="'medium'">Mittel</cngx-option>
    </cngx-optgroup>
    <cngx-select-divider />
    <cngx-optgroup label="Eskalation">
      <cngx-option [value]="'high'">Hoch</cngx-option>
      <cngx-option [value]="'critical'">Kritisch</cngx-option>
    </cngx-optgroup>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ groupedValue() ?? '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Rich-content option — plain-text trigger',
      subtitle:
        'Markup inside <code>&lt;cngx-option&gt;</code> renders in the open panel only. The closed trigger ' +
        'reads <code>option.label()</code> (a <code>Signal&lt;string&gt;</code> with a textContent fallback) and ' +
        'renders it via <code>{{ ... }}</code> text interpolation — XSS-safe by construction.',
      imports: ['CngxSelectShell', 'CngxSelectOption'],
      template: `
  <cngx-select-shell [label]="'Plan'" [clearable]="true" [(value)]="richValue">
    <cngx-option [value]="'p'"><b>Premium</b> Service</cngx-option>
    <cngx-option [value]="'b'">Basic</cngx-option>
    <cngx-option [value]="'f'">Free</cngx-option>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ richValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">trigger renders</span>
      <span class="event-value">plain text only — no &lt;b&gt; in the closed trigger</span>
    </div>
  </div>`,
    },
    {
      title: 'Inside <cngx-form-field> — Reactive Forms',
      subtitle:
        '<code>adaptFormControl(control, name)</code> bridges a Reactive-Forms <code>FormControl</code> into the ' +
        'shell\'s Signal-Forms-first <code>[field]</code> contract. Bidirectional sync runs through ' +
        '<code>createFieldSync</code> with <code>compareWith</code>-aware equality.',
      imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxFormField', 'CngxLabel'],
      template: `
  <cngx-form-field [field]="rfField">
    <label cngxLabel>Farbe</label>
    <cngx-select-shell>
      <cngx-option [value]="'red'">Rot</cngx-option>
      <cngx-option [value]="'green'">Grün</cngx-option>
      <cngx-option [value]="'blue'">Blau</cngx-option>
    </cngx-select-shell>
  </cngx-form-field>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">FormControl.value</span>
      <span class="event-value">{{ rfControl.value ?? '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Async commit — pending + error inline glyphs',
      subtitle:
        'Bind <code>[commitAction]</code> + <code>[commitMode]</code>. <strong>Pessimistic</strong> keeps the panel ' +
        'open during the commit so the projected <code>*cngxSelectOptionPending</code> glyph is visible inside the ' +
        'option\'s reserved internal slot; <strong>optimistic</strong> closes the panel immediately and rolls back ' +
        'on error. Toggle <strong>Server fails</strong> to observe the failure path: the failed option carries ' +
        '<code>data-status="error"</code> and the projected <code>*cngxSelectOptionError</code> glyph renders ' +
        '— never alongside user content.',
      imports: [
        'CngxSelectShell',
        'CngxSelectOption',
        'CngxSelectOptionError',
        'CngxSelectOptionPending',
      ],
      template: `
  <div class="button-row" style="margin-bottom:12px; display:flex; gap:1rem; align-items:center">
    <label style="display:inline-flex; gap:.5rem; align-items:center">
      <span>Mode:</span>
      <select
        [value]="commitMode()"
        (change)="commitMode.set($any($event.target).value)"
        style="padding:.25rem .5rem; border:1px solid var(--cngx-border, #cbd5e1); border-radius:.25rem; font: inherit"
      >
        <option value="pessimistic">pessimistic (recommended for visible pending)</option>
        <option value="optimistic">optimistic</option>
      </select>
    </label>
    <label>
      <input
        type="checkbox"
        [checked]="commitShouldFail()"
        (change)="commitShouldFail.set($any($event.target).checked)"
      />
      Server fails next commit
    </label>
  </div>

  <cngx-select-shell
    [label]="'Farbe (committable)'"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    [clearable]="true"
    [(value)]="commitValue"
    (commitError)="handleCommitError($event)"
  >
    <ng-template cngxSelectOptionPending>
      <span aria-hidden="true" class="pending-glyph">⏳</span>
    </ng-template>
    <ng-template cngxSelectOptionError>
      <span aria-hidden="true" class="error-glyph">⚠</span>
    </ng-template>
    <cngx-option [value]="'red'">Rot</cngx-option>
    <cngx-option [value]="'green'">Grün</cngx-option>
    <cngx-option [value]="'blue'">Blau</cngx-option>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ commitValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">commitMode</span>
      <span class="event-value">{{ commitMode() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">tip</span>
      <span class="event-value">Pessimistic + click an option → glyph visible for 1.5s</span>
    </div>
    @for (line of commitErrors(); track line) {
      <div class="event-row">
        <span class="event-label">commitError</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
      css: `
.pending-glyph {
  display: inline-block;
  animation: cngx-spin 1.2s linear infinite;
}
.error-glyph {
  color: var(--cngx-error, #d32f2f);
  font-size: 1.1em;
}
@keyframes cngx-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`,
    },
    {
      title: 'Empty state + loading flag',
      subtitle:
        'Project <code>*cngxSelectEmpty</code> for the no-options state and <code>*cngxSelectPlaceholder</code> ' +
        'for the empty trigger. Toggle <code>[loading]</code> to render the family-shared loading view ' +
        '(spinner / bar / dots / skeleton — configurable via <code>provideSelectConfig(withLoadingVariant(...))</code>).',
      imports: [
        'CngxSelectShell',
        'CngxSelectOption',
        'CngxSelectEmpty',
        'CngxSelectPlaceholder',
      ],
      template: `
  <div class="button-row" style="margin-bottom:12px">
    <label>
      <input
        type="checkbox"
        [checked]="loadingFlag()"
        (change)="loadingFlag.set($any($event.target).checked)"
      />
      Loading
    </label>
  </div>

  <cngx-select-shell
    [label]="'Item'"
    [loading]="loadingFlag()"
    [(value)]="emptyValue"
  >
    <ng-template cngxSelectPlaceholder let-ph>
      <em style="opacity:.6">— select an item —</em>
    </ng-template>
    <ng-template cngxSelectEmpty>
      <div style="padding:.75rem; opacity:.6; text-align:center">
        Keine Optionen verfügbar
      </div>
    </ng-template>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ emptyValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">tip</span>
      <span class="event-value">No projected options → empty template renders in the panel.</span>
    </div>
  </div>`,
    },
    {
      title: 'Search — declarative <cngx-select-search>',
      subtitle:
        'Project <code>&lt;cngx-select-search /&gt;</code> as a child to add a filter input as the first item ' +
        'in the panel. The search element finds the shell via <code>CNGX_SELECT_SHELL_SEARCH_HOST</code>, ' +
        'two-way binds the term, and forwards <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Home</kbd> <kbd>End</kbd> ' +
        '<kbd>Enter</kbd> <kbd>Esc</kbd> into the listbox AD. Each projected <code>&lt;cngx-option&gt;</code> ' +
        'reads <code>CNGX_OPTION_FILTER_HOST</code> and hides itself when the resolved label does not match — ' +
        'AD nav and visual filter stay in lockstep.',
      imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectSearch'],
      template: `
  <cngx-select-shell
    [label]="'City'"
    [(value)]="searchValue"
    [(searchTerm)]="searchTerm"
    [clearable]="true"
    placeholder="Pick a city…"
  >
    <cngx-select-search [placeholder]="'Filter cities…'" />
    @for (city of cities; track city) {
      <cngx-option [value]="city">{{ city }}</cngx-option>
    }
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">searchTerm</span>
      <span class="event-value">{{ searchTerm() || '(none)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ searchValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">tip</span>
      <span class="event-value">Open + type "be" → only Berlin / Berlin-prefixed remain. Press <kbd>↓</kbd> + <kbd>Enter</kbd> to pick.</span>
    </div>
  </div>`,
    },
    {
      title: 'Custom glyphs — clearGlyph + caretGlyph',
      subtitle:
        'Replace the built-in ✕ clear button glyph and ▾ caret with consumer-authored templates. The button ' +
        'frame, ARIA wiring, and click handlers stay intact — only the glyph swaps. <code>*cngxSelectClearButton</code> ' +
        'replaces the entire button when full control is needed.',
      imports: ['CngxSelectShell', 'CngxSelectOption'],
      template: `
  <ng-template #customClear>
    <span aria-hidden="true" style="font-weight:700; font-family:monospace">×</span>
  </ng-template>
  <ng-template #customCaret>
    <span aria-hidden="true" style="display:inline-block; transition: transform .15s">⌄</span>
  </ng-template>

  <cngx-select-shell
    [label]="'Farbe'"
    [clearable]="true"
    [clearGlyph]="customClear"
    [caretGlyph]="customCaret"
    [(value)]="customValue"
    placeholder="Custom-glyph trigger…"
  >
    <cngx-option [value]="'red'">Rot</cngx-option>
    <cngx-option [value]="'green'">Grün</cngx-option>
    <cngx-option [value]="'blue'">Blau</cngx-option>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ customValue() ?? '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Showcase — every feature combined',
      subtitle:
        'Reactive ARIA, optgroups, divider, async commit (pessimistic so pending is visible), pending + error ' +
        'glyphs, custom caret, custom placeholder, change-event log, keyboard nav (↑↓/Home/End/PageUp/PageDown, ' +
        'typeahead-while-closed), click-outside dismiss, focus restoration on close.',
      imports: [
        'CngxSelectShell',
        'CngxSelectOption',
        'CngxSelectOptgroup',
        'CngxSelectDivider',
        'CngxSelectOptionPending',
        'CngxSelectOptionError',
        'CngxSelectPlaceholder',
        'CngxSelectCaret',
      ],
      template: `
  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>focus the trigger and press a letter (typeahead-while-closed)</span>
    <span>open + use <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Home</kbd> <kbd>End</kbd> <kbd>PgUp</kbd> <kbd>PgDn</kbd></span>
    <span><kbd>Enter</kbd> commits · <kbd>Esc</kbd> closes · click outside dismisses</span>
  </div>

  <cngx-select-shell
    [label]="'Department'"
    [commitAction]="showcaseAction"
    [commitMode]="'pessimistic'"
    [clearable]="true"
    [required]="true"
    aria-label="Department picker"
    [(value)]="showcaseValue"
    (selectionChange)="handleShowcaseChange($event)"
  >
    <ng-template cngxSelectPlaceholder>
      <em style="opacity:.6">— pick a department —</em>
    </ng-template>
    <ng-template cngxSelectCaret let-open>
      <span aria-hidden="true" style="display:inline-block; transition: transform .15s; transform: rotate({{ open ? 180 : 0 }}deg)">⌄</span>
    </ng-template>
    <ng-template cngxSelectOptionPending>
      <span aria-hidden="true" class="pending-glyph">⏳</span>
    </ng-template>
    <ng-template cngxSelectOptionError>
      <span aria-hidden="true" class="error-glyph">⚠</span>
    </ng-template>

    <cngx-optgroup label="Product">
      <cngx-option [value]="'design'">Design</cngx-option>
      <cngx-option [value]="'research'">Research</cngx-option>
      <cngx-option [value]="'product'">Product Management</cngx-option>
    </cngx-optgroup>
    <cngx-select-divider />
    <cngx-optgroup label="Engineering">
      <cngx-option [value]="'frontend'">Frontend</cngx-option>
      <cngx-option [value]="'backend'">Backend</cngx-option>
      <cngx-option [value]="'platform'">Platform</cngx-option>
      <cngx-option [value]="'data'" [disabled]="true">Data — frozen requisitions</cngx-option>
    </cngx-optgroup>
    <cngx-select-divider />
    <cngx-optgroup label="Operations">
      <cngx-option [value]="'people'">People Ops</cngx-option>
      <cngx-option [value]="'finance'">Finance</cngx-option>
      <cngx-option [value]="'legal'">Legal</cngx-option>
    </cngx-optgroup>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ showcaseValue() ?? '—' }}</span>
    </div>
    @for (line of showcaseLog(); track line) {
      <div class="event-row">
        <span class="event-label">change</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
      css: `
.pending-glyph {
  display: inline-block;
  animation: cngx-spin 1.2s linear infinite;
}
.error-glyph {
  color: var(--cngx-error, #d32f2f);
}
@keyframes cngx-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`,
    },
  ],
};
