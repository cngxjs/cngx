# CngxValidators - Custom Form Validators

Specialized validators for pattern matching, checkbox agreement and time-of-day range checks.

## Import

```typescript
import {
  patternMatch,
  requiredTrue,
  time,
  timeRange,
} from '@cngx/forms/validators';
```

## Signal Forms Integration

Signal Forms validates through schema rules. Use Angular's `required` / `pattern` for the basics and cngx `time()` for time-of-day ranges:

```typescript
import { signal } from '@angular/core';
import { form, pattern, required, schema } from '@angular/forms/signals';
import { time } from '@cngx/forms/validators';

readonly model = signal({ iban: '', start: '' });
readonly f = form(
  this.model,
  schema((root) => {
    required(root.iban);
    pattern(root.iban, /^[A-Z]{2}[0-9]{2}/);
    time(root.start, { cycle: 24 });
  }),
);
```

`patternMatch`, `requiredTrue` and `timeRange` are Reactive Forms `ValidatorFn`s:

```typescript
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { patternMatch, requiredTrue } from '@cngx/forms/validators';

readonly group = new FormGroup({
  iban: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, patternMatch(/^[A-Z]{2}[0-9]{2}/)],
  }),
  agreeToTerms: new FormControl(false, { nonNullable: true, validators: requiredTrue() }),
});
```

## Time range

A time mask (`cngxInputMask="time"`, `time:12`, `time:24`, `datetime`) checks one character per slot, so it lets `25:00`, `10:75`, `14:30 PM` and `00:15 AM` through: the allowed second hour digit depends on the first. `time` (Signal Forms) and `timeRange` (Reactive Forms) report those values with the error kind `timeRange`.

```typescript
import { form, schema, required } from '@angular/forms/signals';
import { time } from '@cngx/forms/validators';

readonly model = signal({ start: '' });
readonly f = form(this.model, schema((root) => {
  required(root.start);
  time(root.start, { cycle: 12 });
}));
```

```html
<cngx-form-field [field]="f.start">
  <label cngxLabel>Start</label>
  <input cngxInput cngxInputMask="time:12" [formField]="f.start" />
  <cngx-field-errors />
</cngx-form-field>
```

Reactive Forms:

```typescript
import { FormControl } from '@angular/forms';
import { adaptFormControl } from '@cngx/forms/field';
import { timeRange } from '@cngx/forms/validators';

readonly start = new FormControl('', { nonNullable: true, validators: [timeRange()] });
readonly startField = adaptFormControl(this.start, 'start', inject(DestroyRef));
```

How a value is read:

- The hour cycle comes from the value. AM/PM present means 1-12, absent means 0-23.
- Pass `cycle: 12` or `cycle: 24` only when the mask pins it (`time:12` / `time:24`). A bare `time` mask follows the locale, so leave `cycle` unset.
- Both shapes work: the raw mask value Signal Forms holds (`1430PM`) and a display string (`02:30 PM`).
- `datetime` values are checked on their time part only (the last `HH:MM`).
- An empty or incomplete value passes. Pair with `required` when a time must be entered.
- A 12-hour value whose AM/PM is still empty (`14:30 __`) reads as a 24-hour time unless `cycle: 12` is passed.

The message is the `timeRange` key of the `formField` language section (English `'Enter a valid time.'`). Replace it per app with `provideFormField(withErrorMessages({ timeRange: () => '...' }))`, or translate it in a language pack.

## See Also

- [CngxFormField documentation](/projects/forms/field/README.md)
- Angular Forms [Validators](https://angular.io/api/forms/Validators)
- Tests: `/projects/forms/validators/*.spec.ts`
