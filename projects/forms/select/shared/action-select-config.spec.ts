import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { injectActionSelectConfig } from './inject-helpers';
import {
  provideActionSelectConfig,
  provideActionSelectConfigAt,
  resolveActionSelectConfig,
  withActionAriaLabel,
  withFocusTrapBehavior,
} from './action-select-config';

describe('provideActionSelectConfig', () => {
  it('falls back to library defaults (focusTrapBehavior: dirty, ariaLabel: Inline action) when nothing is provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const resolved = TestBed.runInInjectionContext(() =>
      resolveActionSelectConfig(),
    );
    expect(resolved.focusTrapBehavior).toBe('dirty');
    expect(resolved.ariaLabel()).toBe('Inline action');
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
    expect(resolved.ariaLabel()).toBe('Quick action');
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
    expect(resolved.ariaLabel()).toBe('Inline action');
  });
});

describe('injectActionSelectConfig', () => {
  it('returns the resolved config merged with defaults', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideActionSelectConfig(withActionAriaLabel('Quick action'))],
    });
    const resolved = TestBed.runInInjectionContext(() => injectActionSelectConfig());
    expect(resolved.ariaLabel()).toBe('Quick action');
    expect(resolved.focusTrapBehavior).toBe('dirty');
  });
});

describe('resolveActionSelectConfig - runtime language switch', () => {
  it('follows a Signal of ariaLabel', () => {
    const label = signal('Reorder');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideActionSelectConfig(withActionAriaLabel(label))] });
    const resolved = TestBed.runInInjectionContext(() => resolveActionSelectConfig());
    label.set('Neu anordnen');
    expect(resolved.ariaLabel()).toBe('Neu anordnen');
  });

  it('shares one Signal for equal plain labels', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideActionSelectConfig(withActionAriaLabel('Reorder'))] });
    const [a, b] = TestBed.runInInjectionContext(() => [resolveActionSelectConfig(), resolveActionSelectConfig()]);
    expect(a.ariaLabel).toBe(b.ariaLabel);
  });
});
