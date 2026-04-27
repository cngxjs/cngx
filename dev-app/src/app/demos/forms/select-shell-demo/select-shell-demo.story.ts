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
    'this by querying its own content-children (which works because options are direct children of the shell ' +
    'host) and feeding the derived array as <code>[explicitOptions]</code> + <code>[items]</code> to the inner ' +
    '<code>cngxListbox</code>. AT and keyboard navigation work end-to-end.</p>' +
    '<p><strong>Plain-text trigger guarantee.</strong> The closed-trigger label renders ' +
    '<code>option.label()</code> via text interpolation only — never <code>[innerHTML]</code>. Rich markup inside ' +
    '<code>&lt;cngx-option&gt;</code> (e.g. <code>&lt;b&gt;Premium&lt;/b&gt; Service</code>) only appears in the ' +
    'open panel; the trigger shows <code>"Premium Service"</code>. XSS-safe by construction.</p>' +
    '<p><strong>Shared family surface.</strong> Provides <code>CNGX_FORM_FIELD_CONTROL</code> directly, ' +
    'wires <code>createFieldSync</code> for Signal-Forms / Reactive-Forms round-trip, and routes commits ' +
    'through <code>createScalarCommitHandler</code>. Per-option pending and error glyphs reach individual ' +
    '<code>CngxOption</code> instances via the Phase-2 reserved internal status slot — not alongside user content.</p>',
  moduleImports: [
    "import { FormControl } from '@angular/forms';",
    "import { CngxFormField, CngxLabel, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxSelectShell, CngxSelectOption, CngxSelectOptgroup, CngxSelectOptionError, CngxSelectOptionPending, type CngxSelectCommitAction, type CngxSelectShellChange } from '@cngx/forms/select';",
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

  // Commit + error — async commit with toggleable failure.
  protected readonly commitValue = signal<string | undefined>('red');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitErrors = signal<string[]>([]);
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    void intended;
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server rejected the commit')).pipe(delay(600));
    }
    return of(intended).pipe(delay(600));
  };
  protected handleCommitError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.commitErrors.update((l) => [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + msg]);
  }
  `,
  sections: [
    {
      title: 'Basic — flat declarative options',
      subtitle:
        'Project <code>&lt;cngx-option&gt;</code> children directly. The shell builds the option model ' +
        'via <code>contentChildren(CNGX_OPTION_CONTAINER)</code> and feeds the result into the inner ' +
        '<code>cngxListbox</code> as <code>[explicitOptions]</code>.',
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
      title: 'Grouped — projected <cngx-optgroup>',
      subtitle:
        'Hierarchy preserved through the projection. Nested <code>&lt;cngx-optgroup&gt;</code> inside another ' +
        'group is unsupported — a dev-mode warning fires; use <code>CngxTreeSelect</code> for arbitrary tree shapes.',
      imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectOptgroup'],
      template: `
  <cngx-select-shell [label]="'Priorität'" [(value)]="groupedValue">
    <cngx-optgroup label="Normal">
      <cngx-option [value]="'low'">Niedrig</cngx-option>
      <cngx-option [value]="'medium'">Mittel</cngx-option>
    </cngx-optgroup>
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
        'Markup inside <code>&lt;cngx-option&gt;</code> is rendered in the open panel only. The closed trigger ' +
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
      title: 'Async commit + status-host inline error',
      subtitle:
        'Bind <code>[commitAction]</code> to route picks through <code>createScalarCommitHandler</code>. ' +
        'Toggle the <strong>Server fails</strong> checkbox to make the next commit reject — the failed ' +
        'option carries <code>data-status="error"</code> and the projected <code>*cngxSelectOptionError</code> ' +
        'glyph renders inside the option\'s reserved internal slot, never alongside user content.',
      imports: [
        'CngxSelectShell',
        'CngxSelectOption',
        'CngxSelectOptionError',
        'CngxSelectOptionPending',
      ],
      template: `
  <div class="button-row" style="margin-bottom:12px">
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
    [clearable]="true"
    [(value)]="commitValue"
    (commitError)="handleCommitError($event)"
  >
    <ng-template cngxSelectOptionPending>
      <span aria-hidden="true">⏳</span>
    </ng-template>
    <ng-template cngxSelectOptionError>
      <span aria-hidden="true">⚠</span>
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
    @for (line of commitErrors(); track line) {
      <div class="event-row">
        <span class="event-label">commitError</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
    },
  ],
};
