import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, schema, required, minLength, type ValidationError } from '@angular/forms/signals';

import { CngxFormField, CngxLabel, CngxFieldErrors, CngxListboxFieldBridge } from '@cngx/forms/field';
import { CngxListbox, CngxOption } from '@cngx/common/interactive';

interface PrefsModel {
  // `string` (empty = unselected), NOT `string | undefined`: a Maybe-typed field
  // is not assignable to cngx-form-field's [field].
  size: string;
  toppings: string[];
}

/**
 * The specialised bridge: `cngxListboxFieldBridge` OWNS the value sync between a
 * `CngxListbox` and the bound field - single-value via `listbox.value`,
 * multi-value via `listbox.selectedValues`, both equality-guarded. Because it
 * syncs the value itself, it runs cleanly on Signal Forms with no RF adapter,
 * and projects the form-field ARIA/state onto the listbox host.
 *
 * Two fields show both modes: a single-select (required) and a multi-select
 * (`[multiple]`, min 2). Each readout reads the bridge signals
 * (`#bf="cngxListboxFieldBridge"`) plus the Signal Forms field state. The size
 * field is pre-touched so its error shows on load.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxFormField, CngxLabel, CngxFieldErrors, CngxListboxFieldBridge, CngxListbox, CngxOption],
  styles: `
    .demo {
      display: grid;
      gap: 24px;
      max-width: 420px;
      padding: 16px;
      font: 14px/1.4 system-ui, sans-serif;
    }
    .demo .block {
      display: grid;
      gap: 6px;
    }
    .demo label {
      font-weight: 500;
    }
    .demo .listbox {
      display: grid;
      gap: 2px;
      max-width: 260px;
      padding: 4px;
      border: 1px solid #b0b0b0;
      border-radius: 6px;
    }
    .demo .listbox:focus-visible {
      outline: 2px solid #1a56c4;
      outline-offset: 1px;
    }
    .demo .cngx-field--error .listbox {
      border-color: var(--cngx-field-error-color, #c0392b);
    }
    .demo .option {
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .demo .option:hover {
      background: #eef2ff;
    }
    .demo .option[aria-selected='true'] {
      background: #1a56c4;
      color: #fff;
    }
    .demo .state {
      margin: 4px 0 0;
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 3px 16px;
      font: 12px/1.5 ui-monospace, monospace;
    }
    .demo .state dt {
      margin: 0;
      opacity: 0.55;
    }
    .demo .state dd {
      margin: 0;
      font-weight: 600;
      color: #1a56c4;
    }
  `,
  template: `
    <div class="demo">
      <div class="block">
        <cngx-form-field [field]="f.size">
          <label cngxLabel>Size (single)</label>
          <div
            cngxListbox
            cngxListboxFieldBridge
            #sizeBf="cngxListboxFieldBridge"
            [label]="'Size'"
            tabindex="0"
            class="listbox"
          >
            <div cngxOption value="s" class="option">Small</div>
            <div cngxOption value="m" class="option">Medium</div>
            <div cngxOption value="l" class="option">Large</div>
          </div>
          <cngx-field-errors />
        </cngx-form-field>

        <dl class="state">
          <dt>value</dt><dd>{{ model().size || '—' }}</dd>
          <dt>empty</dt><dd>{{ sizeBf.empty() }}</dd>
          <dt>focused</dt><dd>{{ sizeBf.focused() }}</dd>
          <dt>touched</dt><dd>{{ f.size().touched() }}</dd>
          <dt>valid</dt><dd>{{ f.size().valid() }}</dd>
          <dt>errorState</dt><dd>{{ sizeBf.errorState() }}</dd>
          <dt>errors</dt><dd>{{ kinds(f.size().errors()) }}</dd>
        </dl>
      </div>

      <div class="block">
        <cngx-form-field [field]="f.toppings">
          <label cngxLabel>Toppings (multi)</label>
          <div
            cngxListbox
            cngxListboxFieldBridge
            #topBf="cngxListboxFieldBridge"
            [label]="'Toppings'"
            [multiple]="true"
            tabindex="0"
            class="listbox"
          >
            <div cngxOption value="cheese" class="option">Cheese</div>
            <div cngxOption value="mushroom" class="option">Mushroom</div>
            <div cngxOption value="olive" class="option">Olive</div>
            <div cngxOption value="onion" class="option">Onion</div>
          </div>
          <cngx-field-errors />
        </cngx-form-field>

        <dl class="state">
          <dt>value</dt><dd>{{ model().toppings.join(', ') || '—' }}</dd>
          <dt>empty</dt><dd>{{ topBf.empty() }}</dd>
          <dt>focused</dt><dd>{{ topBf.focused() }}</dd>
          <dt>touched</dt><dd>{{ f.toppings().touched() }}</dd>
          <dt>valid</dt><dd>{{ f.toppings().valid() }}</dd>
          <dt>errorState</dt><dd>{{ topBf.errorState() }}</dd>
          <dt>errors</dt><dd>{{ kinds(f.toppings().errors()) }}</dd>
        </dl>
      </div>
    </div>
  `,
})
export class ListboxBridgeExample {
  protected readonly model = signal<PrefsModel>({ size: '', toppings: [] });

  protected readonly f = form(
    this.model,
    schema<PrefsModel>((root) => {
      required(root.size, { message: 'Pick a size' });
      minLength(root.toppings, 2, { message: 'Pick at least two toppings' });
    }),
  );

  constructor() {
    this.f.size().markAsTouched();
  }

  /** Joins the active error kinds for the readout, or a dash when valid. */
  protected kinds(errors: readonly ValidationError[]): string {
    return errors.length ? errors.map((e) => e.kind).join(', ') : '—';
  }
}
