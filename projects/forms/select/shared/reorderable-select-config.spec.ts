import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { injectReorderableSelectConfig } from './inject-helpers';
import {
  CNGX_REORDERABLE_SELECT_DEFAULTS,
  provideReorderableSelectConfig,
  provideReorderableSelectConfigAt,
  resolveReorderableSelectConfig,
  withReorderAriaLabel,
  withReorderKeyboardModifier,
  withReorderListLabels,
  withReorderStripFreeze,
} from './reorderable-select-config';

describe('resolveReorderableSelectConfig', () => {
  it('returns library defaults when no provider is present', () => {
    TestBed.configureTestingModule({});
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier);
    expect(cfg.ariaLabel()).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.ariaLabel);
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
    expect(cfg.ariaLabel()).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.ariaLabel);
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
    expect(cfg.ariaLabel()).toBe('Reorder with Alt + arrows');
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

describe('injectReorderableSelectConfig', () => {
  it('returns the resolved config merged with defaults', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideReorderableSelectConfig(withReorderAriaLabel('Reorder entries'))],
    });
    const cfg = TestBed.runInInjectionContext(() => injectReorderableSelectConfig());
    expect(cfg.ariaLabel()).toBe('Reorder entries');
    expect(cfg.keyboardModifier).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier);
  });
});

describe('resolveReorderableSelectConfig - runtime language switch', () => {
  it('follows a Signal of ariaLabel', () => {
    const label = signal('Reorder');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideReorderableSelectConfig(withReorderAriaLabel(label))] });
    const resolved = TestBed.runInInjectionContext(() => resolveReorderableSelectConfig());
    label.set('Neu anordnen');
    expect(resolved.ariaLabel()).toBe('Neu anordnen');
  });

  it('shares one Signal for equal plain labels', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideReorderableSelectConfig(withReorderAriaLabel('Reorder'))] });
    const [a, b] = TestBed.runInInjectionContext(() => [resolveReorderableSelectConfig(), resolveReorderableSelectConfig()]);
    expect(a.ariaLabel).toBe(b.ariaLabel);
  });
});

describe('resolveReorderableSelectConfig - sortable list copy', () => {
  it('defaults every list key to the English section', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const cfg = TestBed.runInInjectionContext(() => resolveReorderableSelectConfig());
    expect(cfg.listLabel()).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.listLabel);
    expect(cfg.atStart()).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.atStart);
    expect(cfg.atEnd()).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.atEnd);
    expect(typeof cfg.moveUp()).toBe('function');
    expect(typeof cfg.moveDown()).toBe('function');
  });

  it('lets withReorderListLabels replace single keys and keeps the rest', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideReorderableSelectConfig(
          withReorderListLabels({ listLabel: 'Order', moveUp: (label) => `Up ${label}` }),
        ),
      ],
    });
    const cfg = TestBed.runInInjectionContext(() => resolveReorderableSelectConfig());
    expect(cfg.listLabel()).toBe('Order');
    expect(cfg.moveUp()('Red')).toBe('Up Red');
    expect(cfg.atEnd()).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.atEnd);
  });

  it('follows Signal values of the list keys', () => {
    const listLabel = signal('Order');
    const moveDown = signal((label: string) => `Down ${label}`);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideReorderableSelectConfigAt(withReorderListLabels({ listLabel, moveDown }))],
    });
    const cfg = TestBed.runInInjectionContext(() => resolveReorderableSelectConfig());
    listLabel.set('Reihenfolge');
    moveDown.set((label) => `Runter ${label}`);
    expect(cfg.listLabel()).toBe('Reihenfolge');
    expect(cfg.moveDown()('Rot')).toBe('Runter Rot');
  });
});
