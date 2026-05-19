import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Reactive Forms — same atom, just bind [formControl]',
  subtitle: 'A full <code>FormGroup</code> wired through <code>[formControlName]</code> on every kind of value-bearing atom: boolean (toggle, checkbox, chip), single-pick group (radio, button-toggle, chip-group), multi-pick group (checkbox-group, button-multi-toggle, multi-chip). Import <code>CngxFormBridge</code> in the component and the binding works. The three required atoms (terms, payment, channels) are wrapped in <code>&lt;cngx-form-field [field]&gt;</code> via <code>adaptFormControl</code> so error messages render per atom — exactly like the Signal Forms section above. Click <strong>Validate</strong> to mark every control touched at once; the readout shows the form-state and the live error visibility per field.',
  description: 'Nine cngx form controls — toggle, checkbox, radio group, two flavours of checkbox/button-toggle/chip group, plus the standalone chip — bind to whatever forms paradigm your app uses. Drop them into <cngx-form-field [field]> for Signal Forms, or bind [formControl] for Reactive Forms. Same atom, same template. No CVA-per-control boilerplate, and switching paradigms later costs nothing in the atom layer.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'integration'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxFormBridge',
    'CngxFormField',
    'CngxToggle',
    'CngxCheckbox',
    'CngxChipInteraction',
    'CngxRadioGroup',
    'CngxRadio',
    'CngxCheckboxGroup',
    'CngxButtonToggleGroup',
    'CngxButtonMultiToggleGroup',
    'CngxChipGroup',
    'CngxMultiChipGroup',
    'CngxChipInGroup',
  ],
  moduleImports: [
    'import { form, required } from \'@angular/forms/signals\';',
    'import { ReactiveFormsModule } from \'@angular/forms\';',
    'import { JsonPipe } from \'@angular/common\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl } from \'@cngx/forms/field\';',
    'import { CngxFormBridge } from \'@cngx/forms/controls\';',
    'import { CngxToggle, CngxCheckbox, CngxChipInteraction, CngxRadioGroup, CngxRadio, CngxCheckboxGroup, CngxButtonToggleGroup, CngxButtonMultiToggleGroup, CngxButtonToggle, CngxChipGroup, CngxMultiChipGroup, CngxChipInGroup } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
    'import { createFormPrimitivesFormGroup } from \'../_fixtures/form-primitives-form-group\';',
  ],
  imports: ['ReactiveFormsModule', 'CngxFormBridge', 'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'JsonPipe', 'CngxToggle', 'CngxCheckbox', 'CngxChip', 'CngxChipInteraction', 'CngxRadioGroup', 'CngxRadio', 'CngxCheckboxGroup', 'CngxButtonToggleGroup', 'CngxButtonMultiToggleGroup', 'CngxButtonToggle', 'CngxChipGroup', 'CngxMultiChipGroup', 'CngxChipInGroup'],
  setup: `private readonly destroyRef = inject(DestroyRef);
  protected readonly rfForm = createFormPrimitivesFormGroup();
  protected readonly rfTermsField = adaptFormControl(this.rfForm.controls.terms, 'terms', this.destroyRef);
  protected readonly rfPaymentField = adaptFormControl(this.rfForm.controls.payment, 'payment', this.destroyRef);
  protected readonly rfChannelsField = adaptFormControl(this.rfForm.controls.notificationChannels, 'notificationChannels', this.destroyRef);
  protected readonly paymentOptions = ['card', 'cash', 'invoice'];
  protected readonly viewOptions = ['grid', 'list', 'table'];
  protected readonly sizeOptions = ['sm', 'md', 'lg'];
  protected readonly channelOptions = ['email', 'sms', 'push'];
  protected readonly filterOptions = ['open', 'closed', 'archived'];
  protected readonly tagOptions = ['ng', 'rx', 'ts', 'cdk'];`,
  setupChrome: `  protected handleRfValidate(): void {
    // Touching the raw FormControls fires TouchedChangeEvent, which
    // adaptFormControl now subscribes to — adapted accessors update
    // synchronously inside the subscribe callback. No accessor-side touch
    // call needed.
    Object.values(this.rfForm.controls).forEach((c) => c.markAsTouched());
  }
  protected handleRfReset(): void {
    this.rfForm.reset();
  }`,
  template: `  <form [formGroup]="rfForm" style="display:grid;gap:16px;max-width:560px">
    <!-- Boolean atom (no validator → bare bridge) -->
    <cngx-toggle [formControlName]="'notifications'">
      Benachrichtigungen
    </cngx-toggle>

    <!-- Required: wrap in cngx-form-field via adaptFormControl so per-atom errors render -->
    <cngx-form-field [field]="rfTermsField">
      <label cngxLabel>Bedingungen</label>
      <cngx-checkbox [formControlName]="'terms'">
        Ich akzeptiere die Bedingungen
      </cngx-checkbox>
      <cngx-field-errors />
    </cngx-form-field>

    <!-- Boolean chip (no validator → bare bridge) -->
    <cngx-chip cngxChipInteraction
      [formControlName]="'featured'"
      [value]="'feat'"
    >Featured</cngx-chip>

    <!-- Required scalar group: wrapped for per-atom error rendering -->
    <cngx-form-field [field]="rfPaymentField">
      <label cngxLabel>Zahlungsart</label>
      <cngx-radio-group [formControlName]="'payment'" name="rf-payment">
        @for (opt of paymentOptions; track opt) {
          <cngx-radio [value]="opt">{{ opt }}</cngx-radio>
        }
      </cngx-radio-group>
      <cngx-field-errors />
    </cngx-form-field>

    <!-- Non-required scalar group → bare bridge -->
    <cngx-button-toggle-group [formControlName]="'view'" label="Ansicht">
      @for (opt of viewOptions; track opt) {
        <button cngxButtonToggle [value]="opt">{{ opt }}</button>
      }
    </cngx-button-toggle-group>

    <cngx-chip-group [formControlName]="'size'" label="Size">
      @for (opt of sizeOptions; track opt) {
        <cngx-chip cngxChipInGroup [value]="opt">{{ opt }}</cngx-chip>
      }
    </cngx-chip-group>

    <!-- Required multi-group: wrapped for per-atom error rendering -->
    <cngx-form-field [field]="rfChannelsField">
      <label cngxLabel>Channels</label>
      <cngx-checkbox-group
        [formControlName]="'notificationChannels'"
        [allValues]="channelOptions"
      >
        @for (opt of channelOptions; track opt) {
          <cngx-checkbox [value]="rfForm.controls.notificationChannels.value.includes(opt)">{{ opt }}</cngx-checkbox>
        }
      </cngx-checkbox-group>
      <cngx-field-errors />
    </cngx-form-field>

    <!-- Non-required multi-groups → bare bridge -->
    <cngx-button-multi-toggle-group [formControlName]="'filters'" label="Filter">
      @for (opt of filterOptions; track opt) {
        <button cngxButtonToggle [value]="opt">{{ opt }}</button>
      }
    </cngx-button-multi-toggle-group>

    <cngx-multi-chip-group [formControlName]="'tags'" label="Tags">
      @for (opt of tagOptions; track opt) {
        <cngx-chip cngxChipInGroup [value]="opt">{{ opt }}</cngx-chip>
      }
    </cngx-multi-chip-group>

  </form>`,
  templateChrome: `<div class="button-row" style="margin-top:8px;display:flex;gap:8px">
      <button type="button" class="chip" (click)="handleRfValidate()">Validate (mark touched)</button>
      <button type="button" class="chip" (click)="handleRfReset()">Reset</button>
    </div>
<div class="event-grid" style="margin-top:16px">
    <div class="event-row">
      <span class="event-label">FormGroup value</span>
      <span class="event-value">{{ rfForm.value | json }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Valid</span>
      <span class="event-value">{{ rfForm.valid ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Touched</span>
      <span class="event-value">{{ rfForm.touched ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Errors visible</span>
      <span class="event-value">
        terms: {{ rfTermsField().touched() && rfTermsField().invalid() ? 'shown' : '—' }},
        payment: {{ rfPaymentField().touched() && rfPaymentField().invalid() ? 'shown' : '—' }},
        channels: {{ rfChannelsField().touched() && rfChannelsField().invalid() ? 'shown' : '—' }}
      </span>
    </div>
  </div>`,
};
