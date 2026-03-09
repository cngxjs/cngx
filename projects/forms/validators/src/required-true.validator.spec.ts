import { FormControl } from '@angular/forms';
import { requiredTrue } from './required-true.validator';

describe('requiredTrue', () => {
  const validator = requiredTrue();

  it('returns null when value is true', () => {
    const control = new FormControl(true);
    expect(validator(control)).toBeNull();
  });

  it('returns error when value is false', () => {
    const control = new FormControl(false);
    expect(validator(control)).toEqual({ requiredTrue: { actual: false } });
  });

  it('returns error when value is null', () => {
    const control = new FormControl(null);
    expect(validator(control)).toEqual({ requiredTrue: { actual: null } });
  });
});
