import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFieldSkinHost: bare anatomy in a table and a toolbar',
  subtitle: 'Every control and every box composition in the <code>bare</code> skin, where it lives: in table cells, one control per row, and in a toolbar above the table. No paint at rest, an inset ring on focus, a ring plus danger text on error.',
  description: 'Bare is outline metrics with transparent borders: the box model is the same, only the paint is gone, so a bare control keeps the height of an outlined one and the cell hands its padding to it. A <code>cngxFieldBox</code> in a bare field is still the box, so affixes, the clear button and the nested currency picker sit on one line without their own borders. Each control keeps a real label, visually hidden because the row header or the toolbar context already names it. The readout below lists the measured height of every box.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxFieldSkinHost', 'CngxFieldBox', 'CngxFormField', 'CngxInput', 'CngxSelect', 'CngxMultiSelect'],
  moduleImports: [
    'import { form, schema, required, email, disabled, readonly, FormField } from \'@angular/forms/signals\';',
    'import { CngxIcon } from \'@cngx/common/display\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, CngxFieldBox, CngxPrefix, CngxSuffix } from \'@cngx/forms/field\';',
    'import { CngxInput, CngxInputClear } from \'@cngx/forms/input\';',
    'import { CngxSelect, CngxMultiSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { DemoAffixDetach } from \'../affix/_affix-detach.directive\';',
  ],
  imports: [
    'CngxFormField',
    'CngxLabel',
    'CngxFieldErrors',
    'CngxFieldBox',
    'CngxPrefix',
    'CngxSuffix',
    'CngxInput',
    'CngxInputClear',
    'CngxIcon',
    'CngxSelect',
    'CngxMultiSelect',
    'FormField',
    'DemoAffixDetach',
  ],
  references: [
    { label: 'WCAG 1.3.1 Info and Relationships', href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html' },
    { label: 'WCAG 2.4.7 Focus Visible', href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html' },
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
  ],
  css: `/* The cell hands its padding to the bare control, which carries the
   same box padding, so the text sits where read-only cell text sits. */
td:has([data-skin='bare']) {
  padding: 0;
}`,
  setup: `protected readonly currencies: CngxSelectOptionDef<string>[] = [
    { value: 'EUR', label: 'EUR' },
    { value: 'CHF', label: 'CHF' },
    { value: 'USD', label: 'USD' },
  ];
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly topics: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'a11y', label: 'Accessibility' },
  ];
  protected readonly currency = signal<string | undefined>('EUR');
  private readonly model = signal({
    query: '',
    coupon: '',
    name: '',
    note: '',
    amount: '',
    transfer: '',
    color: '',
    topics: ['angular', 'signals'],
    account: 'DE-4471',
    invoice: 'INV-2041',
    email: 'not-an-address',
  });
  protected readonly anatomyForm = form(this.model, schema<{
    query: string; coupon: string; name: string; note: string; amount: string; transfer: string;
    color: string; topics: string[]; account: string; invoice: string; email: string;
  }>((root) => {
    disabled(root.account, () => true);
    readonly(root.invoice, () => true);
    required(root.email, { message: 'Email is required.' });
    email(root.email, { message: 'Enter a valid email address.' });
  }));`,
  template: `  <div style="display:grid;gap:16px">
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;--cngx-field-bare-inline-size:16rem">
      <cngx-form-field [field]="anatomyForm.query" skin="bare">
        <label cngxLabel class="cngx-sr-only">Icon and clear button</label>
        <span cngxFieldBox>
          <span cngxPrefix>
            <cngx-icon>
              <svg viewBox="0 0 24 24" width="1em" height="1em">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </cngx-icon>
          </span>
          <input cngxInput #query type="search" [formField]="anatomyForm.query" />
          <button type="button" cngxSuffix cngxSuffixInteractive [cngxInputClear]="query" #clr="cngxInputClear"
            [disabled]="!clr.hasValue()">
            <cngx-icon>
              <svg viewBox="0 0 24 24" width="1em" height="1em">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </cngx-icon>
          </button>
        </span>
      </cngx-form-field>

      <cngx-form-field [field]="anatomyForm.coupon" skin="bare">
        <label cngxLabel class="cngx-sr-only">Text button</label>
        <span cngxFieldBox>
          <input cngxInput [formField]="anatomyForm.coupon" autocomplete="off" />
          <button type="button" cngxSuffix cngxSuffixInteractive>Apply</button>
        </span>
      </cngx-form-field>
    </div>

    <table class="demo-skin-table">
      <thead>
        <tr>
          <th scope="col">Composition</th>
          <th scope="col">Control</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Plain input</th>
          <td>
            <cngx-form-field [field]="anatomyForm.name" skin="bare">
              <label cngxLabel class="cngx-sr-only">Plain input</label>
              <input cngxInput [formField]="anatomyForm.name" autocomplete="name" />
            </cngx-form-field>
          </td>
        </tr>
        <tr>
          <th scope="row">Textarea</th>
          <td>
            <cngx-form-field [field]="anatomyForm.note" skin="bare">
              <label cngxLabel class="cngx-sr-only">Textarea</label>
              <textarea cngxInput [formField]="anatomyForm.note" rows="2"></textarea>
            </cngx-form-field>
          </td>
        </tr>
        <tr>
          <th scope="row">Text affixes with divider</th>
          <td>
            <cngx-form-field [field]="anatomyForm.amount" skin="bare">
              <label cngxLabel class="cngx-sr-only">Text affixes with divider</label>
              <span cngxFieldBox style="--cngx-field-affix-divider: 1px">
                <span cngxPrefix>EUR</span>
                <input cngxInput [formField]="anatomyForm.amount" inputmode="decimal" />
                <span cngxSuffix>/ month</span>
              </span>
            </cngx-form-field>
          </td>
        </tr>
        <tr>
          <th scope="row">Nested select picker</th>
          <td>
            <cngx-form-field [field]="anatomyForm.transfer" skin="bare">
              <label cngxLabel class="cngx-sr-only">Nested select picker</label>
              <span cngxFieldBox>
                <cngx-select cngxPrefix cngxPrefixInteractive demoAffixDetach
                  [label]="'Currency'" [options]="currencies" [(value)]="currency" />
                <input cngxInput [formField]="anatomyForm.transfer" inputmode="decimal" />
              </span>
            </cngx-form-field>
          </td>
        </tr>
        <tr>
          <th scope="row">Single select</th>
          <td>
            <cngx-form-field [field]="anatomyForm.color" skin="bare">
              <label cngxLabel class="cngx-sr-only">Single select</label>
              <cngx-select [label]="'Single select'" [options]="colors" placeholder="Pick a color" />
            </cngx-form-field>
          </td>
        </tr>
        <tr>
          <th scope="row">Multi select with chips</th>
          <td>
            <cngx-form-field [field]="anatomyForm.topics" skin="bare">
              <label cngxLabel class="cngx-sr-only">Multi select with chips</label>
              <cngx-multi-select [label]="'Multi select with chips'" [options]="topics" placeholder="Choose topics" />
            </cngx-form-field>
          </td>
        </tr>
        <tr>
          <th scope="row">Disabled</th>
          <td>
            <cngx-form-field [field]="anatomyForm.account" skin="bare">
              <label cngxLabel class="cngx-sr-only">Disabled</label>
              <input cngxInput [formField]="anatomyForm.account" />
            </cngx-form-field>
          </td>
        </tr>
        <tr>
          <th scope="row">Readonly</th>
          <td>
            <cngx-form-field [field]="anatomyForm.invoice" skin="bare">
              <label cngxLabel class="cngx-sr-only">Readonly</label>
              <input cngxInput [formField]="anatomyForm.invoice" />
            </cngx-form-field>
          </td>
        </tr>
        <tr>
          <th scope="row">Invalid</th>
          <td>
            <cngx-form-field [field]="anatomyForm.email" skin="bare">
              <label cngxLabel class="cngx-sr-only">Invalid</label>
              <input cngxInput type="email" [formField]="anatomyForm.email" autocomplete="email" />
              <cngx-field-errors />
            </cngx-form-field>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`,
  setupChrome: `  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly boxHeights = signal<readonly { label: string; height: number }[]>([]);
  private readonly revealInvalid = afterNextRender(() => this.anatomyForm.email().markAsTouched());
  private readonly heightProbe = afterNextRender(() => {
    const boxes = Array.from(this.host.nativeElement.querySelectorAll('cngx-form-field'), (field) => ({
      label: field.querySelector('label')?.textContent?.trim() ?? '',
      box: field.querySelector<HTMLElement>('.cngx-field-box') ?? field.querySelector<HTMLElement>('.cngx-field-trigger, input, textarea'),
    }));
    const measure = (): void =>
      this.boxHeights.set(boxes.map(({ label, box }) => ({ label, height: Math.round(box?.getBoundingClientRect().height ?? 0) })));
    const observer = new ResizeObserver(measure);
    boxes.forEach(({ box }) => box && observer.observe(box));
    this.destroyRef.onDestroy(() => observer.disconnect());
  });`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Field skin</span><span class="event-value">bare</span></div>
    @for (row of boxHeights(); track row.label) {
      <div class="event-row"><span class="event-label">{{ row.label }}</span><span class="event-value">{{ row.height }}px</span></div>
    }
  </div>`,
};
