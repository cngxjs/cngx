import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  provideSelectConfig,
  provideSelectConfigAt,
  withAriaLabels,
  withPanelWidth,
} from './config';
import { resolveSelectConfig } from './resolve-config';

function resolveIn(providers: unknown[]): ReturnType<typeof resolveSelectConfig> {
  TestBed.configureTestingModule({ providers: providers as never[] });
  return TestBed.runInInjectionContext(() => resolveSelectConfig());
}

describe('withAriaLabels', () => {
  it('resolves to an empty ariaLabels object by default (no overrides)', () => {
    const config = resolveIn([]);
    expect(config.ariaLabels).toEqual({});
    expect(config.ariaLabels.clearButton).toBeUndefined();
    expect(config.ariaLabels.chipRemove).toBeUndefined();
  });

  it('populates ariaLabels from withAriaLabels feature', () => {
    const config = resolveIn([
      provideSelectConfig(
        withAriaLabels({
          clearButton: 'Clear selection',
          chipRemove: 'Remove',
        }),
      ),
    ]);
    expect(config.ariaLabels).toEqual({
      clearButton: 'Clear selection',
      chipRemove: 'Remove',
    });
  });

  it('preserves non-overridden keys when partial ariaLabels are supplied', () => {
    const config = resolveIn([
      provideSelectConfig(withAriaLabels({ chipRemove: 'Remove' })),
    ]);
    expect(config.ariaLabels.clearButton).toBeUndefined();
    expect(config.ariaLabels.chipRemove).toBe('Remove');
  });

  it('merges multiple withAriaLabels calls in feature list order', () => {
    const config = resolveIn([
      provideSelectConfig(
        withAriaLabels({ clearButton: 'Clear', chipRemove: 'Remove' }),
        withAriaLabels({ chipRemove: 'Delete' }),
      ),
    ]);
    expect(config.ariaLabels).toEqual({
      clearButton: 'Clear',
      chipRemove: 'Delete',
    });
  });

  it('coexists with other features without bleed (withPanelWidth + withAriaLabels)', () => {
    const config = resolveIn([
      provideSelectConfig(
        withPanelWidth(480),
        withAriaLabels({ clearButton: 'Clear' }),
      ),
    ]);
    expect(config.panelWidth).toBe(480);
    expect(config.ariaLabels.clearButton).toBe('Clear');
  });

  it('survives provideSelectConfigAt (component-scoped)', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideSelectConfigAt(withAriaLabels({ clearButton: 'Leeren' })),
      ],
    });
    const injector = TestBed.inject(Injector);
    const config = runInInjectionContext(injector, () => resolveSelectConfig());
    expect(config.ariaLabels.clearButton).toBe('Leeren');
  });
});
