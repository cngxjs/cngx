import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { CngxAffixRow, CngxFormField, CngxHint, CngxLabel, CngxPrefix } from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';

interface SkinsModel {
  outline: string;
  fill: string;
  bare: string;
  amount: string;
}

/**
 * The three field skins side by side. `skin` on `cngx-form-field` travels to
 * every control inside through the field host token; `CngxInput` writes it to
 * the native input as `data-skin`, so the input itself is the box. With an
 * affix row the row becomes the box and the nested input drops its own
 * surface. `outline` is the default and writes no attribute. The skin CSS is
 * Track-B and comes from `@cngx/themes/cngx.css`; this playground adds layout
 * only.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxFormField, CngxLabel, CngxHint, CngxInput, CngxAffixRow, CngxPrefix, FormField],
  styles: `
    .demo {
      display: grid;
      gap: 20px;
      max-width: 360px;
      padding: 16px;
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

      <cngx-form-field [field]="f.amount" skin="fill">
        <label cngxLabel>Fill with an affix</label>
        <span cngxAffixRow>
          <span cngxPrefix>EUR</span>
          <input cngxInput [formField]="f.amount" inputmode="decimal" />
        </span>
      </cngx-form-field>
    </div>
  `,
})
export class SkinsExample {
  protected readonly model = signal<SkinsModel>({ outline: '', fill: '', bare: '', amount: '' });
  protected readonly f = form(this.model);
}
