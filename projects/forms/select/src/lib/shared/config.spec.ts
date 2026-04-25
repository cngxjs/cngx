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
  it('resolves to library EN defaults for status/tree/fallback keys when no override is supplied', () => {
    const config = resolveIn([]);
    // Variant-defaulted keys (clearButton, chipRemove) intentionally
    // stay undefined so per-variant input fallbacks remain authoritative.
    expect(config.ariaLabels.clearButton).toBeUndefined();
    expect(config.ariaLabels.chipRemove).toBeUndefined();
    // Library-defaulted keys are populated up-front so panel-shell,
    // select-core, and tree-select can read them directly.
    expect(config.ariaLabels.treeExpand).toBe('Expand node');
    expect(config.ariaLabels.treeCollapse).toBe('Collapse node');
    expect(config.ariaLabels.statusLoading).toBe('Loading options');
    expect(config.ariaLabels.statusRefreshing).toBe('Refreshing options');
    expect(config.ariaLabels.fieldLabelFallback).toBe('Selection');
    expect(config.ariaLabels.commitFailedMessage).toBe('Save failed');
  });

  it('populates ariaLabels from withAriaLabels feature', () => {
    const config = resolveIn([
      provideSelectConfig(
        withAriaLabels({
          clearButton: 'Clear all',
          chipRemove: 'Delete',
        }),
      ),
    ]);
    expect(config.ariaLabels.clearButton).toBe('Clear all');
    expect(config.ariaLabels.chipRemove).toBe('Delete');
    // Library defaults preserved for unset keys.
    expect(config.ariaLabels.treeExpand).toBe('Expand node');
  });

  it('preserves non-overridden keys when partial ariaLabels are supplied', () => {
    const config = resolveIn([
      provideSelectConfig(withAriaLabels({ chipRemove: 'Delete' })),
    ]);
    expect(config.ariaLabels.clearButton).toBeUndefined();
    expect(config.ariaLabels.chipRemove).toBe('Delete');
    expect(config.ariaLabels.treeExpand).toBe('Expand node');
  });

  it('merges multiple withAriaLabels calls in feature list order', () => {
    const config = resolveIn([
      provideSelectConfig(
        withAriaLabels({ clearButton: 'Clear', chipRemove: 'Remove' }),
        withAriaLabels({ chipRemove: 'Delete' }),
      ),
    ]);
    expect(config.ariaLabels.clearButton).toBe('Clear');
    expect(config.ariaLabels.chipRemove).toBe('Delete');
    expect(config.ariaLabels.treeExpand).toBe('Expand node');
  });

  it('routes tree/status/fallback keys through a DE locale override roundtrip', () => {
    const config = resolveIn([
      provideSelectConfig(
        withAriaLabels({
          treeExpand: 'Knoten erweitern',
          treeCollapse: 'Knoten reduzieren',
          statusLoading: 'Lade Optionen',
          statusRefreshing: 'Aktualisiere Optionen',
          fieldLabelFallback: 'Auswahl',
          commitFailedMessage: 'Speichern fehlgeschlagen',
        }),
      ),
    ]);
    expect(config.ariaLabels.treeExpand).toBe('Knoten erweitern');
    expect(config.ariaLabels.treeCollapse).toBe('Knoten reduzieren');
    expect(config.ariaLabels.statusLoading).toBe('Lade Optionen');
    expect(config.ariaLabels.statusRefreshing).toBe('Aktualisiere Optionen');
    expect(config.ariaLabels.fieldLabelFallback).toBe('Auswahl');
    expect(config.ariaLabels.commitFailedMessage).toBe('Speichern fehlgeschlagen');
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
  it('speaks the new 1-based position when toIndex is supplied', () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: 'Admins',
      fieldLabel: 'Recipients',
      multi: true,
      action: 'reordered',
      count: 3,
      fromIndex: 0,
      toIndex: 2,
    });
    expect(message).toBe('Recipients: Admins moved to position 3');
  });

  it('falls back to a positionless message when toIndex is omitted', () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: 'Admins',
      fieldLabel: 'Recipients',
      multi: true,
      action: 'reordered',
      count: 3,
    });
    expect(message).toBe('Recipients: Admins moved');
  });

  it('leaves existing added/removed messages unchanged (backward compat)', () => {
    const config = resolveIn([]);
    expect(
      config.announcer.format({
        selectedLabel: 'Red',
        fieldLabel: 'Color',
        multi: true,
        action: 'added',
        count: 1,
      }),
    ).toBe('Color: Red added, 1 selected');
    expect(
      config.announcer.format({
        selectedLabel: null,
        fieldLabel: 'Color',
        multi: true,
        action: 'removed',
      }),
    ).toBe('Color: selection cleared');
  });
});

describe('default announcer format — created action', () => {
  it("speaks 'created and selected' for single-select when a label is supplied", () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: 'Violet',
      fieldLabel: 'Color',
      multi: false,
      action: 'created',
    });
    expect(message).toBe('Color: Violet created and selected');
  });

  it("speaks the same sentence for multi-select ('created' short-circuits the multi branch)", () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: 'Design',
      fieldLabel: 'Topics',
      multi: true,
      action: 'created',
      count: 5,
    });
    expect(message).toBe('Topics: Design created and selected');
  });

  it("falls back to a labelless 'created' sentence when no label is available", () => {
    const config = resolveIn([]);
    const message = config.announcer.format({
      selectedLabel: null,
      fieldLabel: 'Color',
      multi: false,
      action: 'created',
    });
    expect(message).toBe('Color: created');
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
