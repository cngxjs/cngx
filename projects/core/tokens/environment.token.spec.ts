import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT, type Environment } from './environment.token';

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
});
