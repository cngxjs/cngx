import { ChangeDetectionStrategy, Component, LOCALE_ID } from '@angular/core';
import { CngxInputMask } from '@cngx/forms/input';

/**
 * The full CngxInputMask preset spectrum on one page.
 *
 * Each field uses a built-in preset string - no custom token map needed. The
 * locale-aware presets (`date`, `datetime`) follow the `en-US` `LOCALE_ID`
 * provided below; switch it to `de-DE` to see the separators flip. Region
 * presets (`phone:DE`, `iban:CH`, `zip:GB`) lazy-load their table on first
 * use, so they settle a tick after render; the static presets (`time`,
 * `creditcard`, `ip`, `mac`) and custom token patterns render immediately.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxInputMask],
  // en-US drives the locale-aware date/datetime separators. Try 'de-DE'.
  providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
  template: `
    <div style="display:grid;gap:0.85rem;max-width:30rem">
      @for (f of fields; track f.mask) {
        <label style="display:grid;gap:0.25rem">
          <span style="font-size:0.8125rem;font-weight:600">{{ f.label }}</span>
          <input
            [cngxInputMask]="f.mask"
            [prefix]="f.prefix ?? ''"
            #m="cngxInputMask"
            style="font:inherit;padding:0.4rem 0.55rem;border:1px solid #cbd5e1;border-radius:0.375rem"
          />
          <small style="opacity:0.65">
            <code>{{ f.mask }}</code> &middot; raw: {{ m.value() || '(empty)' }}
          </small>
        </label>
      }
    </div>
  `,
})
export class AllPresetsExample {
  protected readonly fields: ReadonlyArray<{ label: string; mask: string; prefix?: string }> = [
    { label: 'Date (locale)', mask: 'date' },
    { label: 'Date + time', mask: 'datetime' },
    { label: 'Time (24h)', mask: 'time' },
    { label: 'Credit card (Amex/Visa auto-switch)', mask: 'creditcard' },
    { label: 'Phone (Germany)', mask: 'phone:DE' },
    { label: 'IBAN (Switzerland)', mask: 'iban:CH' },
    { label: 'Postal code (UK)', mask: 'zip:GB' },
    { label: 'IPv4 address', mask: 'ip' },
    { label: 'MAC address', mask: 'mac' },
    { label: 'Custom pattern + prefix', mask: 'AA 000 000', prefix: 'CH-' },
  ];
}
