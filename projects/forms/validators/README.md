# CngxValidators - Custom Form Validators

Specialized validators for pattern matching and checkbox agreement validation.

## Import

```typescript
import {
  patternMatch,
  requiredTrue,
} from '@cngx/forms/validators';
```

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



## See Also

- [CngxFormField documentation](/projects/forms/field/README.md)
- Angular Forms [Validators](https://angular.io/api/forms/Validators)
- Tests: `/projects/forms/validators/*.spec.ts`
