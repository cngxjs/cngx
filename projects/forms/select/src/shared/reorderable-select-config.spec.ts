import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_REORDERABLE_SELECT_DEFAULTS,
  provideReorderableSelectConfig,
  provideReorderableSelectConfigAt,
  resolveReorderableSelectConfig,
  withReorderAriaLabel,
  withReorderKeyboardModifier,
  withReorderStripFreeze,
} from './reorderable-select-config';

describe('resolveReorderableSelectConfig', () => {
  it('returns library defaults when no provider is present', () => {
    TestBed.configureTestingModule({});
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier);
    expect(cfg.ariaLabel).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.ariaLabel);
    expect(cfg.dragHandle).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.dragHandle);
    expect(cfg.freezeStripOnCommit).toBe(
      CNGX_REORDERABLE_SELECT_DEFAULTS.freezeStripOnCommit,
    );
  });

  it('applies a single feature app-wide via provideReorderableSelectConfig', () => {
    TestBed.configureTestingModule({
      providers: [provideReorderableSelectConfig(withReorderKeyboardModifier('alt'))],
    });
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe('alt');
    // Non-overridden keys stay at the library default.
    expect(cfg.ariaLabel).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.ariaLabel);
  });

  it('merges multiple features in feature-list order', () => {
    TestBed.configureTestingModule({
      providers: [
        provideReorderableSelectConfig(
          withReorderKeyboardModifier('alt'),
          withReorderAriaLabel('Reorder with Alt + arrows'),
          withReorderStripFreeze(false),
        ),
      ],
    });
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe('alt');
    expect(cfg.ariaLabel).toBe('Reorder with Alt + arrows');
    expect(cfg.freezeStripOnCommit).toBe(false);
  });

  it('last feature wins when the same key is overridden twice', () => {
    TestBed.configureTestingModule({
      providers: [
        provideReorderableSelectConfig(
          withReorderKeyboardModifier('alt'),
          withReorderKeyboardModifier('meta'),
        ),
      ],
    });
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe('meta');
  });

  it('supports component-scoped overrides via provideReorderableSelectConfigAt', () => {
    TestBed.configureTestingModule({
      providers: [...provideReorderableSelectConfigAt(withReorderStripFreeze(false))],
    });
    const injector = TestBed.inject(Injector);
    const cfg = runInInjectionContext(injector, () =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.freezeStripOnCommit).toBe(false);
  });
});
