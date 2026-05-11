import { describe, it, expect } from 'vitest';
import { ensureObservable } from './rxjs-interop';
import { of, isObservable } from 'rxjs';

describe('ensureObservable', () => {
  it('should return the observable if input is observable', () => {
    const obs = of(1);
    expect(ensureObservable(obs)).toBe(obs);
  });

  it('should wrap value in observable if input is not observable', () => {
    const val = 1;
    const obs = ensureObservable(val);
    expect(isObservable(obs)).toBe(true);
  });
});
