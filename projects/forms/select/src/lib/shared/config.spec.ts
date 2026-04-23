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
import type { CngxMultiSelectChipContext } from './template-slots';
import type { CngxSelectOptionDef } from './option.model';

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

describe('default announcer format — reordered action', () => {
  it("speaks the new 1-based position when toIndex is supplied", () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: 'Admins',
      fieldLabel: 'Empfänger',
      multi: true,
      action: 'reordered',
      count: 3,
      fromIndex: 0,
      toIndex: 2,
    });
    expect(message).toBe('Empfänger: Admins verschoben auf Position 3');
  });

  it("falls back to a positionless message when toIndex is omitted", () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: 'Admins',
      fieldLabel: 'Empfänger',
      multi: true,
      action: 'reordered',
      count: 3,
    });
    expect(message).toBe('Empfänger: Admins verschoben');
  });

  it('leaves existing added/removed messages unchanged (backward compat)', () => {
    const config = resolveIn([]);
    expect(
      config.announcer.format({
        selectedLabel: 'Red',
        fieldLabel: 'Farbe',
        multi: true,
        action: 'added',
        count: 1,
      }),
    ).toBe('Farbe: Red hinzugefügt, 1 ausgewählt');
    expect(
      config.announcer.format({
        selectedLabel: null,
        fieldLabel: 'Farbe',
        multi: true,
        action: 'removed',
      }),
    ).toBe('Farbe: Auswahl geleert');
  });
});

describe("default announcer format — created action", () => {
  it("speaks 'erstellt und ausgewählt' for single-select when a label is supplied", () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: 'Violett',
      fieldLabel: 'Farbe',
      multi: false,
      action: 'created',
    });
    expect(message).toBe('Farbe: Violett erstellt und ausgewählt');
  });

  it("speaks the same sentence for multi-select ('created' short-circuits the multi branch)", () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: 'Design',
      fieldLabel: 'Themen',
      multi: true,
      action: 'created',
      count: 5,
    });
    expect(message).toBe('Themen: Design erstellt und ausgewählt');
  });

  it('falls back to a labelless "erstellt" sentence when no label is available', () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: null,
      fieldLabel: 'Farbe',
      multi: false,
      action: 'created',
    });
    expect(message).toBe('Farbe: erstellt');
  });
});

describe('CngxMultiSelectChipContext — optional index', () => {
  it('accepts contexts without an index (CngxMultiSelect back-compat)', () => {
    const opt: CngxSelectOptionDef<string> = { value: 'a', label: 'A' };
    const ctx: CngxMultiSelectChipContext<string> = {
      $implicit: opt,
      option: opt,
      remove: () => {
        /* no-op */
      },
    };
    expect(ctx.index).toBeUndefined();
  });

  it('accepts contexts carrying a numeric index (CngxReorderableMultiSelect)', () => {
    const opt: CngxSelectOptionDef<string> = { value: 'a', label: 'A' };
    const ctx: CngxMultiSelectChipContext<string> = {
      $implicit: opt,
      option: opt,
      remove: () => {
        /* no-op */
      },
      index: 4,
    };
    expect(ctx.index).toBe(4);
  });
});
