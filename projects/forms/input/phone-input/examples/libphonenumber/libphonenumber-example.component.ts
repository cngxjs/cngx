import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, schema, required } from '@angular/forms/signals';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

import { CngxFormField, CngxLabel, CngxHint } from '@cngx/forms/field';
import {
  CngxPhoneInput,
  providePhoneMetadata,
  type CngxPhoneMetadata,
  type Country,
} from '@cngx/forms/input';

/**
 * CngxPhoneInput driven by a real libphonenumber-js line-type adapter.
 *
 * The metadata-adapter demo story ships a toy regex stub; this playground
 * wires the production library instead. The adapter receives the national
 * subscriber digits (CngxPhoneInput strips the dial code) and the region,
 * parses them with libphonenumber-js, and maps the parsed number type onto
 * the strategy contract. As you type, the mask switches to the mobile
 * grouping the moment libphonenumber can classify the prefix - the typed
 * digits stay put across the regroup.
 *
 * libphonenumber-js lives in the playground dependencies only; cngx never
 * adds it to its own graph - the adapter is consumer-authored by design.
 */
const libphonenumberAdapter: CngxPhoneMetadata = {
  lineType: (region, national) => {
    if (!national) {
      return 'unknown';
    }
    const parsed = parsePhoneNumberFromString(national, region as CountryCode);
    switch (parsed?.getType()) {
      case 'MOBILE':
        return 'mobile';
      case 'FIXED_LINE':
        return 'fixedLine';
      default:
        // Ambiguous (FIXED_LINE_OR_MOBILE) or not yet classifiable: keep the
        // length-based fallback rather than guessing.
        return 'unknown';
    }
  },
};

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxFormField, CngxLabel, CngxHint, CngxPhoneInput],
  viewProviders: [providePhoneMetadata(libphonenumberAdapter)],
  template: `
    <div style="max-width: 22rem; display: grid; gap: 0.75rem">
      <p style="margin: 0; opacity: 0.8; font-size: 0.875rem">
        libphonenumber-js classifies the number as you type. Pick Germany and
        type a number starting 15/16/17, or pick the UK and type one starting
        7 - the grouping switches to mobile and your digits are preserved.
      </p>
      <cngx-form-field [field]="phoneField">
        <label cngxLabel>Phone number</label>
        <cngx-phone-input [countries]="countries" [(country)]="country" />
        <span cngxHint>Line type comes from libphonenumber-js, not a fixed mask</span>
      </cngx-form-field>
      <span style="font-size: 0.8125rem; opacity: 0.7">
        Country: {{ country().label }} &middot; Value: {{ phoneField().value() || '(empty)' }}
      </span>
    </div>
  `,
})
export class LibphonenumberExample {
  protected readonly countries: Country[] = [
    { region: 'DE', dialCode: '+49', label: 'Germany' },
    { region: 'AT', dialCode: '+43', label: 'Austria' },
    { region: 'GB', dialCode: '+44', label: 'United Kingdom' },
    { region: 'US', dialCode: '+1', label: 'United States' },
  ];
  protected readonly country = signal<Country>(this.countries[0]);

  private readonly phoneModel = signal({ phone: '' });
  private readonly phoneSchema = schema<{ phone: string }>((root) => {
    required(root.phone);
  });
  protected readonly phoneForm = form(this.phoneModel, this.phoneSchema);
  protected readonly phoneField = this.phoneForm.phone;
}
