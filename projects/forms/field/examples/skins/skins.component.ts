import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import {
  CngxFieldBox,
  CngxFormField,
  CngxHint,
  CngxLabel,
  CngxPrefix,
  CngxSuffix,
} from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';

interface SkinsModel {
  outline: string;
  fill: string;
  bare: string;
  rent: string;
  amount: string;
  reference: string;
  filter: string;
}

/**
 * The three field skins side by side. `skin` on `cngx-form-field` travels to
 * every control inside through the field host token; `CngxInput` writes it to
 * the native input as `data-skin`, so the input itself is the box. With a
 * `CngxFieldBox` the box is the painted element in every skin and the nested
 * input drops its own surface. A label placed inside the box becomes an inner
 * static label on its own line above the value. `outline` is the default and
 * writes no attribute on a lone control. The skin CSS is Track-B and comes
 * from `@cngx/themes/cngx.css`; this playground adds layout only.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxFormField,
    CngxLabel,
    CngxHint,
    CngxInput,
    CngxFieldBox,
    CngxPrefix,
    CngxSuffix,
    FormField,
  ],
  styles: `
    .demo {
      display: grid;
      gap: 20px;
      max-width: 360px;
      padding: 16px;
    }

    .demo table {
      border-collapse: collapse;
    }

    .demo th,
    .demo td {
      border: 1px solid var(--cngx-color-border, #d0d4da);
      padding: 8px 16px;
      text-align: start;
    }

    .demo td:has([data-skin='bare']) {
      padding: 0;
    }
  `,
  template: `
    <div class="demo">
      <cngx-form-field [field]="f.outline">
        <label cngxLabel>Outline (default)</label>
        <input cngxInput [formField]="f.outline" />
        <span cngxHint>Hairline border on all sides.</span>
      </cngx-form-field>

      <cngx-form-field [field]="f.fill" skin="fill">
        <label cngxLabel>Fill</label>
        <input cngxInput [formField]="f.fill" />
        <span cngxHint>Tinted surface with a focus underline.</span>
      </cngx-form-field>

      <cngx-form-field [field]="f.bare" skin="bare">
        <label cngxLabel>Bare</label>
        <input cngxInput [formField]="f.bare" />
        <span cngxHint>No surface, no border; the container owns the edge.</span>
      </cngx-form-field>

      <cngx-form-field [field]="f.rent">
        <label cngxLabel>Outline box with affixes</label>
        <span cngxFieldBox>
          <span cngxPrefix>CHF</span>
          <input cngxInput [formField]="f.rent" inputmode="decimal" />
          <span cngxSuffix>/ month</span>
        </span>
      </cngx-form-field>

      <cngx-form-field [field]="f.amount" skin="fill">
        <label cngxLabel>Fill box with an affix</label>
        <span cngxFieldBox>
          <span cngxPrefix>EUR</span>
          <input cngxInput [formField]="f.amount" inputmode="decimal" />
        </span>
      </cngx-form-field>

      <cngx-form-field [field]="f.reference" skin="fill">
        <span cngxFieldBox>
          <label cngxLabel>Fill box with an inner label</label>
          <input cngxInput [formField]="f.reference" />
        </span>
        <span cngxHint>The label sits inside the surface, above the value.</span>
      </cngx-form-field>

      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Filter</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bare box in a table cell</td>
            <td>
              <cngx-form-field [field]="f.filter" skin="bare">
                <label cngxLabel class="cngx-sr-only">Filter</label>
                <span cngxFieldBox>
                  <input cngxInput [formField]="f.filter" type="search" />
                </span>
              </cngx-form-field>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class SkinsExample {
  protected readonly model = signal<SkinsModel>({
    outline: '',
    fill: '',
    bare: '',
    rent: '',
    amount: '',
    reference: '',
    filter: '',
  });
  protected readonly f = form(this.model);
}
