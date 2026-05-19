import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Signal Forms — drop the atom into <cngx-form-field>',
  subtitle: 'You write <code>&lt;cngx-form-field [field]="f.payment"&gt;&lt;cngx-radio-group ...&gt;</code> and that is it. The form-field finds the atom on its own, projects ARIA onto the host, and shows validator messages through <code>&lt;cngx-field-errors&gt;</code>. Three fields are required (terms, payment, channels). Either tab into and out of a field to surface its error, or click <strong>Validate</strong> below to mark every required field touched at once. Pick a value (or check the box / select a chip) to see the error clear instantly.',
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
    'import { form, schema, required } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors } from \'@cngx/forms/field\';',
    'import { CngxToggle, CngxCheckbox, CngxRadioGroup, CngxRadio, CngxCheckboxGroup } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxToggle', 'CngxCheckbox', 'CngxRadioGroup', 'CngxRadio', 'CngxCheckboxGroup'],
  setup: `protected readonly sfModel = signal<{
    notifications: boolean;
    terms: boolean;
    payment: string;
    notificationChannels: string[];
  }>({
    notifications: false,
    terms: false,
    payment: '',
    notificationChannels: [],
  });
  protected readonly sfForm = form(this.sfModel, schema((root) => {
    required(root.terms, { message: 'Please agree' });
    required(root.payment, { message: 'Wahl erforderlich' });
    required(root.notificationChannels, { message: 'Choose at least one channel' });
  }));
  protected readonly channelOptions = ['email', 'sms', 'push'];`,
  setupChrome: `  protected handleSfValidate(): void {
    // Mark every required SF field touched so cngx-field-errors renders.
    this.sfForm.terms().markAsTouched();
    this.sfForm.payment().markAsTouched();
    this.sfForm.notificationChannels().markAsTouched();
  }
  protected handleSfReset(): void {
    this.sfModel.set({ notifications: false, terms: false, payment: '', notificationChannels: [] });
  }`,
  template: `  <div style="display:grid;gap:16px;max-width:480px">
    <cngx-form-field [field]="sfForm.notifications">
      <label cngxLabel>Benachrichtigungen</label>
      <cngx-toggle [(value)]="sfForm.notifications().value">
        E-Mails empfangen
      </cngx-toggle>
      <cngx-field-errors />
    </cngx-form-field>

    <cngx-form-field [field]="sfForm.terms">
      <label cngxLabel>Bedingungen</label>
      <cngx-checkbox [(value)]="sfForm.terms().value">
        Ich akzeptiere die Bedingungen
      </cngx-checkbox>
      <cngx-field-errors />
    </cngx-form-field>

    <cngx-form-field [field]="sfForm.payment">
      <label cngxLabel>Zahlungsart</label>
      <cngx-radio-group [(value)]="sfForm.payment().value" name="sf-payment">
        <cngx-radio value="card">Karte</cngx-radio>
        <cngx-radio value="cash">Bar</cngx-radio>
        <cngx-radio value="invoice">Rechnung</cngx-radio>
      </cngx-radio-group>
      <cngx-field-errors />
    </cngx-form-field>

    <cngx-form-field [field]="sfForm.notificationChannels">
      <label cngxLabel>Channels</label>
      <cngx-checkbox-group
        [(selectedValues)]="sfForm.notificationChannels().value"
        [allValues]="channelOptions"
      >
        @for (opt of channelOptions; track opt) {
          <cngx-checkbox
            [value]="sfForm.notificationChannels().value().includes(opt)"
            (valueChange)="$event
              ? sfForm.notificationChannels().value.update((v) => [...v, opt])
              : sfForm.notificationChannels().value.update((v) => v.filter((x) => x !== opt))"
          >{{ opt }}</cngx-checkbox>
        }
      </cngx-checkbox-group>
      <cngx-field-errors />
    </cngx-form-field>

  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:8px;display:flex;gap:8px">
      <button type="button" class="chip" (click)="handleSfValidate()">Validate (mark touched)</button>
      <button type="button" class="chip" (click)="handleSfReset()">Reset</button>
    </div>
<div class="event-grid" style="margin-top:8px">
      <div class="event-row">
        <span class="event-label">Form valid</span>
        <span class="event-value">{{ sfForm().valid() ? 'yes' : 'no' }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Errors visible</span>
        <span class="event-value">
          terms: {{ sfForm.terms().touched() && sfForm.terms().invalid() ? 'shown' : '—' }},
          payment: {{ sfForm.payment().touched() && sfForm.payment().invalid() ? 'shown' : '—' }},
          channels: {{ sfForm.notificationChannels().touched() && sfForm.notificationChannels().invalid() ? 'shown' : '—' }}
        </span>
      </div>
    </div>`,
};
