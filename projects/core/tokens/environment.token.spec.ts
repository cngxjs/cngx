import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT, provideEnvironment, type Environment } from './environment.token';

describe('ENVIRONMENT token', () => {
  it('can be provided and injected', () => {
    const env: Environment = { production: false, apiUrl: 'http://localhost' };

    TestBed.configureTestingModule({
      providers: [{ provide: ENVIRONMENT, useValue: env }],
    });

    const injected = TestBed.inject(ENVIRONMENT);
    expect(injected).toBe(env);
    expect(injected.production).toBe(false);
    expect(injected['apiUrl']).toBe('http://localhost');
  });

  it('provideEnvironment wires the value onto the token', () => {
    const env: Environment = { production: true };

    TestBed.configureTestingModule({
      providers: [provideEnvironment(env)],
    });

    expect(TestBed.inject(ENVIRONMENT)).toBe(env);
  });

  it('throws without a provider - the token has no default factory', () => {
    expect(() => TestBed.inject(ENVIRONMENT)).toThrowError(/No provider/);
  });

  it('resolves to null for an optional read without a provider', () => {
    expect(TestBed.inject(ENVIRONMENT, null, { optional: true })).toBeNull();
  });
});
