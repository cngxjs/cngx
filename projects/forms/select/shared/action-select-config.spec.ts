import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  provideActionSelectConfig,
  provideActionSelectConfigAt,
  resolveActionSelectConfig,
  withActionAriaLabel,
  withFocusTrapBehavior,
} from './action-select-config';

describe('provideActionSelectConfig', () => {
  it('falls back to library defaults (focusTrapBehavior: dirty, ariaLabel: Inline-Aktion) when nothing is provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const resolved = TestBed.runInInjectionContext(() =>
      resolveActionSelectConfig(),
    );
    expect(resolved.focusTrapBehavior).toBe('dirty');
    expect(resolved.ariaLabel).toBe('Inline-Aktion');
  });

  it('merges withFocusTrapBehavior + withActionAriaLabel app-wide', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideActionSelectConfig(
          withFocusTrapBehavior('always'),
          withActionAriaLabel('Quick action'),
        ),
      ],
    });
    const resolved = TestBed.runInInjectionContext(() =>
      resolveActionSelectConfig(),
    );
    expect(resolved.focusTrapBehavior).toBe('always');
    expect(resolved.ariaLabel).toBe('Quick action');
  });

  it('honours provideActionSelectConfigAt in component-scoped providers', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ...provideActionSelectConfigAt(withFocusTrapBehavior('never')),
      ],
    });
    const injector = TestBed.inject(Injector);
    const resolved = runInInjectionContext(injector, () =>
      resolveActionSelectConfig(),
    );
    expect(resolved.focusTrapBehavior).toBe('never');
    // Unspecified keys still fall back to library defaults.
    expect(resolved.ariaLabel).toBe('Inline-Aktion');
  });
});
