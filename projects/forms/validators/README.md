# CngxValidators — Custom Form Validators

Specialized validators for pattern matching and checkbox agreement validation.

## Import

```typescript
import {
  patternMatch,
  requiredTrue,
} from '@cngx/forms/validators';
```

## API

### patternMatch()

Validates that a string control value matches a regular expression.

**Parameters:**
- `pattern: RegExp` — Regular expression to test against.

**Returns:** `ValidatorFn` — Validation function.

**Behavior:**
- Returns `null` (valid) when value is empty or falsy.
- Returns `{ patternMatch: { pattern, actual } }` when value does not match.
- Intended for paired use with `Validators.required` for full validation.

**Example:**

```typescript
import { patternMatch } from '@cngx/forms/validators';
import { FormControl, Validators } from '@angular/forms';

// IBAN validation
const iban = new FormControl('', [
  Validators.required,
  patternMatch(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/),
]);

// Email pattern (beyond Validators.email)
const customEmail = new FormControl('', [
  Validators.required,
  patternMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
]);

// Hex color
const hexColor = new FormControl('', [
  Validators.required,
  patternMatch(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
]);
```

**Error Object:**

```typescript
interface PatternMatchError {
  patternMatch: {
    pattern: string;    // pattern.source for regex source
    actual: string;     // the actual value that failed
  }
}
```

**Error Message Example:**

```typescript
import { CNGX_ERROR_MESSAGES } from '@cngx/forms/field';

provideErrorMessages({
  patternMatch: (e: any) => `Must match pattern: ${e.patternMatch.pattern}`,
})
```

---

### requiredTrue()

Validates that a control value is strictly `true` (not just truthy).

**Returns:** `ValidatorFn` — Validation function.

**Behavior:**
- Returns `null` (valid) when value is `true`.
- Returns `{ requiredTrue: { actual } }` for any value other than `true`.
- Intended for checkbox agreement fields.

**Example:**

```typescript
import { requiredTrue } from '@cngx/forms/validators';
import { FormControl } from '@angular/forms';

// Terms of service checkbox
const agreeToTerms = new FormControl(false, requiredTrue());

// Will be valid only when checked
agreeToTerms.setValue(true);  // valid
agreeToTerms.setValue(false); // invalid
agreeToTerms.setValue(1);     // invalid (not strictly true)
```

**Error Object:**

```typescript
interface RequiredTrueError {
  requiredTrue: {
    actual: unknown;  // the actual value that failed
  }
}
```

**Error Message Example:**

```typescript
import { CNGX_ERROR_MESSAGES } from '@cngx/forms/field';

provideErrorMessages({
  requiredTrue: () => 'You must agree to continue.',
})
```

---

## Signal Forms Integration

Both validators work with Signal Forms `FormControl`:

```typescript
import { FormControl } from '@angular/forms/signals';
import { Validators } from '@angular/forms';
import { patternMatch, requiredTrue } from '@cngx/forms/validators';

const schema = formGroup({
  iban: formControl('', {
    validators: [Validators.required, patternMatch(/^[A-Z]{2}[0-9]{2}/)],
    nonNullable: true,
  }),
  agreeToTerms: formControl(false, {
    validators: requiredTrue(),
  }),
});
```

---

## See Also

- [CngxFormField documentation](/projects/forms/field/README.md)
- Angular Forms [Validators](https://angular.io/api/forms/Validators)
- Tests: `/projects/forms/validators/src/*.spec.ts`
