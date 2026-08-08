import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterBuilder: the form-field bridge under Signal Forms and Reactive Forms',
  subtitle:
    'Applying <code>cngxFilterBuilderFormFieldControl</code> registers the builder as the ambient <code>&lt;cngx-form-field&gt;</code> control, so <code>touched</code> / <code>errorState</code> / <code>focused</code> / <code>disabled</code> surface on <code>CngxFilterBuilderPresenter</code> with no manual wiring. The same directive provides <code>CNGX_SELECT_DISABLE_FIELD_SYNC</code>, which stops the builder’s inner logic <code>&lt;cngx-select&gt;</code> from syncing the ambient <code>FilterGroup</code> into its own scalar value (issue #98). Signal Forms binds through <code>form()</code>; Reactive Forms bridges a <code>FormControl</code> with <code>adaptFormControl</code>, and toggling the control’s disabled state propagates straight to <code>presenter.disabled</code>.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxFilterBuilder', 'CngxFilterBuilderFormFieldControl', 'CngxFilterBuilderPresenter'],
  moduleImports: [
    "import { FormControl } from '@angular/forms';",
    "import { form } from '@angular/forms/signals';",
    "import { CngxFormField, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxFilterBuilder, CngxFilterBuilderFormFieldControl, CngxFilterBuilderPresenter, createEmptyFilterRoot, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS } from '../../../../fixtures';",
  ],
  imports: ['CngxFormField', 'CngxFilterBuilder', 'CngxFilterBuilderFormFieldControl'],
  setup: `protected readonly fields = FILTER_BUILDER_FIELDS;

  // Signal Forms: form() wraps the tree signal; [field] hands it to the
  // form-field, and the builder becomes its control via the opt-in directive.
  protected readonly sfModel = signal<FilterGroup>(createEmptyFilterRoot());
  protected readonly sfForm = form(this.sfModel);

  // Reactive Forms: adaptFormControl bridges a FormControl into the same
  // [field] contract. Toggling control.disabled propagates to presenter.disabled.
  protected readonly rfControl = new FormControl<FilterGroup>(createEmptyFilterRoot(), {
    nonNullable: true,
  });
  protected readonly rfField = adaptFormControl(this.rfControl, 'filter', inject(DestroyRef));
  protected readonly rfModel = signal<FilterGroup>(createEmptyFilterRoot());

  // Each builder hosts its own CngxFilterBuilderPresenter (a host directive);
  // read it off the element through a template ref.
  protected readonly sfPresenter = viewChild('sfBuilder', { read: CngxFilterBuilderPresenter });
  protected readonly rfPresenter = viewChild('rfBuilder', { read: CngxFilterBuilderPresenter });

  protected toggleRfDisabled(): void {
    if (this.rfControl.disabled) {
      this.rfControl.enable();
    } else {
      this.rfControl.disable();
    }
  }`,
  template: `  <section aria-label="Signal Forms" class="demo-form">
    <h2>Signal Forms</h2>
    <cngx-form-field [field]="sfForm">
      <cngx-filter-builder #sfBuilder cngxFilterBuilderFormFieldControl [fields]="fields" [(value)]="sfModel" />
    </cngx-form-field>
    <div class="event-grid" style="margin-top:12px">
      <p class="status-badge">touched: {{ sfForm().touched() }}</p>
      <p class="status-badge">errorState: {{ sfPresenter()?.errorState() ?? false }}</p>
      <p class="status-badge">focused: {{ sfPresenter()?.focused() ?? false }}</p>
      <p class="status-badge">disabled: {{ sfPresenter()?.disabled() ?? false }}</p>
    </div>
  </section>

  <section aria-label="Reactive Forms" class="demo-form" style="margin-top:24px">
    <h2>Reactive Forms</h2>
    <cngx-form-field [field]="rfField">
      <cngx-filter-builder #rfBuilder cngxFilterBuilderFormFieldControl [fields]="fields" [(value)]="rfModel" />
    </cngx-form-field>
    <button type="button" (click)="toggleRfDisabled()">Toggle disabled</button>
    <div class="event-grid" style="margin-top:12px">
      <p class="status-badge">control.disabled: {{ rfControl.disabled }}</p>
      <p class="status-badge">presenter.disabled: {{ rfPresenter()?.disabled() ?? false }}</p>
    </div>
  </section>`,
};
