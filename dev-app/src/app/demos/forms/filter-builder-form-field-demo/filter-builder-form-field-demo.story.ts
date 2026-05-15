import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Builder — form-field bridge',
  navLabel: 'Filter Builder Form Field',
  navCategory: 'filter-builder',
  description:
    'Wraps <cngx-filter-builder> in <cngx-form-field> via the opt-in ' +
    'cngxFilterBuilderFormFieldControl directive. Shows the disabled / ' +
    'focused / errorState contract live, plus presenter.focus() landing ' +
    'on the first incomplete expression.',
  apiComponents: [
    'CngxFilterBuilder',
    'CngxFilterBuilderFormFieldControl',
    'CngxFormField',
  ],
  overview:
    '<p>The opt-in <code>cngxFilterBuilderFormFieldControl</code> directive ' +
    'exposes <code>CngxFilterBuilderPresenter</code> as the form-field control ' +
    'and owns the <code>(focusin)</code> / <code>(focusout)</code> host ' +
    'listeners that drive the presenter\'s <code>focused</code> signal. The ' +
    'presenter mirrors the form-field\'s <code>disabled</code> / <code>touched</code> ' +
    'state via <code>inject(CngxFormFieldPresenter, { optional: true, skipSelf: true })</code>; ' +
    '<code>errorState</code> is <code>touched && incompleteCount > 0</code> ' +
    '— so an empty initial tree never surfaces as invalid before the user ' +
    'interacts.</p>' +
    '<p>Section 1 drives the bridge with Signal Forms (<code>form()</code> + ' +
    '<code>schema()</code>). Section 2 mirrors the same wiring against ' +
    'Reactive Forms via the one-shot <code>adaptFormControl()</code> adapter.</p>' +
    '<p><code>presenter.focus()</code> walks the tree for the first incomplete ' +
    'expression and lands on its first focusable descendant — input, button, ' +
    'or select trigger — via the <code>data-cngx-filter-path</code> DOM ' +
    'correlation.</p>',
  moduleImports: [
    "import { DestroyRef, effect, untracked, viewChild } from '@angular/core';",
    "import { form, schema } from '@angular/forms/signals';",
    "import { FormControl } from '@angular/forms';",
    "import { CngxFormField, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxFilterBuilder, CngxFilterBuilderFormFieldControl, CngxFilterBuilderPresenter, createEmptyFilterRoot, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS } from '../../../fixtures';",
  ],
  setup: `
  protected readonly fields = FILTER_BUILDER_FIELDS;

  // ── Signal Forms ─────────────────────────────────────────
  private readonly sfModel = signal<FilterGroup>(createEmptyFilterRoot());
  private readonly sfSchema = schema<FilterGroup>(() => undefined);
  protected readonly sfField = form(this.sfModel, this.sfSchema);
  protected readonly sfTree = signal<FilterGroup>(createEmptyFilterRoot());
  protected readonly sfPresenter = viewChild.required('sfBuilder', {
    read: CngxFilterBuilderPresenter,
  });

  // ── Reactive Forms ───────────────────────────────────────
  protected readonly rfControl = new FormControl<FilterGroup>(createEmptyFilterRoot(), { nonNullable: true });
  protected readonly rfField = adaptFormControl(this.rfControl, 'rfFilter', inject(DestroyRef));
  protected readonly rfTree = signal<FilterGroup>(createEmptyFilterRoot());
  protected readonly rfPresenter = viewChild.required('rfBuilder', {
    read: CngxFilterBuilderPresenter,
  });

  protected readonly sfTouched = computed(() => this.sfField().touched());
  protected readonly sfErrorState = computed(() => {
    // Mirror the presenter's read so the demo surfaces the AND-gate
    // (touched && incompleteCount > 0) without poking at internals.
    return this.sfPresenter().errorState();
  });

  constructor() {
    // Mirror tree → field model so Signal Forms sees the edits.
    effect(() => {
      const next = this.sfTree();
      untracked(() => this.sfModel.set(next));
    });
    // Mirror RF control → tree so the wrapped builder reflects external writes.
    this.rfControl.valueChanges.subscribe((next) => {
      if (next && next !== untracked(() => this.rfTree())) {
        this.rfTree.set(next);
      }
    });
    effect(() => {
      const next = this.rfTree();
      untracked(() => {
        if (next !== this.rfControl.value) {
          this.rfControl.setValue(next, { emitEvent: false });
        }
      });
    });
  }

  protected markSfTouched(): void {
    this.sfField().markAsTouched();
  }

  protected focusSfFirstIncomplete(): void {
    this.sfPresenter().focus();
  }

  protected toggleRfDisabled(): void {
    if (this.rfControl.disabled) {
      this.rfControl.enable();
    } else {
      this.rfControl.disable();
    }
  }

  protected focusRfFirstIncomplete(): void {
    this.rfPresenter().focus();
  }
  `,
  sections: [
    {
      title: 'Signal Forms — Field<FilterGroup> + form-field bridge',
      subtitle:
        'Add at least one filter, leave a value empty, then click <strong>Mark touched</strong>. ' +
        'The presenter\'s <code>errorState()</code> flips true and the form-field shell ' +
        'gets the <code>cngx-field--error</code> class. <strong>Focus first incomplete</strong> ' +
        'calls <code>presenter.focus()</code>.',
      template: `
  <cngx-form-field [field]="sfField">
    <cngx-filter-builder
      #sfBuilder
      cngxFilterBuilderFormFieldControl
      [fields]="fields"
      [(value)]="sfTree"
    />
  </cngx-form-field>

  <div class="demo-actions">
    <button type="button" (click)="markSfTouched()">Mark touched</button>
    <button type="button" (click)="focusSfFirstIncomplete()">Focus first incomplete</button>
  </div>

  <div class="status-row">
    <span class="status-badge">touched: {{ sfTouched() }}</span>
    <span class="status-badge">errorState: {{ sfErrorState() }}</span>
    <span class="status-badge">focused: {{ sfPresenter().focused() }}</span>
    <span class="status-badge">disabled: {{ sfPresenter().disabled() }}</span>
  </div>

  <pre class="code-block"><code>{{ sfTree() | json }}</code></pre>
      `,
      imports: ['CngxFilterBuilder', 'CngxFilterBuilderFormFieldControl', 'CngxFormField', 'JsonPipe'],
      css: `
.demo-actions { display: flex; gap: var(--cngx-demo-actions-gap, 8px); margin: var(--cngx-demo-actions-m, 12px 0); }
.demo-actions button { padding: var(--cngx-demo-button-pad, 4px 10px); cursor: pointer; }
      `,
    },
    {
      title: 'Reactive Forms — adaptFormControl(FormControl<FilterGroup>)',
      subtitle:
        'Same bridge surface, driven from a Reactive Forms <code>FormControl</code>. ' +
        'Toggle <strong>disabled</strong> and watch <code>presenter.disabled()</code> ' +
        'follow without any consumer-side wiring.',
      template: `
  <cngx-form-field [field]="rfField">
    <cngx-filter-builder
      #rfBuilder
      cngxFilterBuilderFormFieldControl
      [fields]="fields"
      [(value)]="rfTree"
    />
  </cngx-form-field>

  <div class="demo-actions">
    <button type="button" (click)="toggleRfDisabled()">Toggle disabled</button>
    <button type="button" (click)="focusRfFirstIncomplete()">Focus first incomplete</button>
  </div>

  <div class="status-row">
    <span class="status-badge">control.disabled: {{ rfControl.disabled }}</span>
    <span class="status-badge">presenter.disabled: {{ rfPresenter().disabled() }}</span>
    <span class="status-badge">presenter.focused: {{ rfPresenter().focused() }}</span>
  </div>

  <pre class="code-block"><code>{{ rfControl.value | json }}</code></pre>
      `,
      imports: ['CngxFilterBuilder', 'CngxFilterBuilderFormFieldControl', 'CngxFormField', 'JsonPipe'],
    },
  ],
};
