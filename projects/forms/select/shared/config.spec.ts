import { Injector, isSignal, runInInjectionContext, signal, type TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { coerceSignal } from '@cngx/core/utils';
import { stripBidiIsolates } from '@cngx/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_SELECT_CONFIG,
  makeSelectConfig,
  provideSelectConfig,
  provideSelectConfigAt,
  withAnnouncer,
  withAriaLabels,
  withFallbackLabels,
  withPanelWidth,
  withTemplates,
  type CngxSelectAnnouncerConfig,
  type CngxSelectAriaLabels,
  type CngxSelectFallbackLabels,
} from './config';
import { resolveSelectConfig } from './internal/resolve-config';
import type { CngxMultiSelectChipContext } from './template-slots';
import type { CngxSelectOptionDef } from './option.model';

function resolveIn(providers: unknown[]): ReturnType<typeof resolveSelectConfig> {
  TestBed.configureTestingModule({ providers: providers as never[] });
  return TestBed.runInInjectionContext(() => resolveSelectConfig());
}

describe('withAriaLabels', () => {
  it('resolves to library EN defaults for status/tree/fallback keys when no override is supplied', () => {
    const config = resolveIn([]);
    // clearButton intentionally stays undefined: its default differs per
    // variant (single 'Clear selection', multi 'Reset selection').
    expect(config.ariaLabels().clearButton).toBeUndefined();
    expect(config.ariaLabels().chipRemove).toBe('Remove');
    expect(stripBidiIsolates(config.ariaLabels().chipRemoveFor('Remove', 'Red'))).toBe(
      'Remove: Red',
    );
    // Library-defaulted keys are populated up-front so panel-shell,
    // select-core, and tree-select can read them directly.
    expect(config.ariaLabels().treeExpand).toBe('Expand node');
    expect(config.ariaLabels().treeCollapse).toBe('Collapse node');
    expect(config.ariaLabels().statusLoading).toBe('Loading options');
    expect(config.ariaLabels().statusRefreshing).toBe('Refreshing options');
    expect(config.ariaLabels().fieldLabelFallback).toBe('Selection');
    expect(
      stripBidiIsolates(config.ariaLabels().commitFailedMessage('Colours', 'server down')),
    ).toBe('Colours: Save failed - server down');
    expect(stripBidiIsolates(config.ariaLabels().commitFailedMessage('Colours', undefined))).toBe(
      'Colours: Save failed',
    );
    expect(config.ariaLabels().listboxFallback).toBe('Options');
  });

  it('carries a listboxFallback override into the resolved config', () => {
    const config = resolveIn([
      provideSelectConfig(withAriaLabels({ listboxFallback: 'Auswahlmöglichkeiten' })),
    ]);
    expect(config.ariaLabels().listboxFallback).toBe('Auswahlmöglichkeiten');
    expect(config.ariaLabels().searchInput).toBe('Search options');
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
    expect(config.ariaLabels().clearButton).toBe('Clear all');
    expect(config.ariaLabels().chipRemove).toBe('Delete');
    // Library defaults preserved for unset keys.
    expect(config.ariaLabels().treeExpand).toBe('Expand node');
  });

  it('preserves non-overridden keys when partial ariaLabels are supplied', () => {
    const config = resolveIn([
      provideSelectConfig(withAriaLabels({ chipRemove: 'Delete' })),
    ]);
    expect(config.ariaLabels().clearButton).toBeUndefined();
    expect(config.ariaLabels().chipRemove).toBe('Delete');
    expect(config.ariaLabels().treeExpand).toBe('Expand node');
  });

  it('merges multiple withAriaLabels calls in feature list order', () => {
    const config = resolveIn([
      provideSelectConfig(
        withAriaLabels({ clearButton: 'Clear', chipRemove: 'Remove' }),
        withAriaLabels({ chipRemove: 'Delete' }),
      ),
    ]);
    expect(config.ariaLabels().clearButton).toBe('Clear');
    expect(config.ariaLabels().chipRemove).toBe('Delete');
    expect(config.ariaLabels().treeExpand).toBe('Expand node');
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
          commitFailedMessage: (label, detail) =>
            `Speichern von ${label} fehlgeschlagen${detail ? ` (${detail})` : ''}`,
        }),
      ),
    ]);
    expect(config.ariaLabels().treeExpand).toBe('Knoten erweitern');
    expect(config.ariaLabels().treeCollapse).toBe('Knoten reduzieren');
    expect(config.ariaLabels().statusLoading).toBe('Lade Optionen');
    expect(config.ariaLabels().statusRefreshing).toBe('Aktualisiere Optionen');
    expect(config.ariaLabels().fieldLabelFallback).toBe('Auswahl');
    expect(config.ariaLabels().commitFailedMessage('Farben', 'Timeout')).toBe(
      'Speichern von Farben fehlgeschlagen (Timeout)',
    );
  });

  it('coexists with other features without bleed (withPanelWidth + withAriaLabels)', () => {
    const config = resolveIn([
      provideSelectConfig(
        withPanelWidth(480),
        withAriaLabels({ clearButton: 'Clear' }),
      ),
    ]);
    expect(config.panelWidth).toBe(480);
    expect(config.ariaLabels().clearButton).toBe('Clear');
  });

  it('survives provideSelectConfigAt (component-scoped)', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideSelectConfigAt(withAriaLabels({ clearButton: 'Leeren' })),
      ],
    });
    const injector = TestBed.inject(Injector);
    const config = runInInjectionContext(injector, () => resolveSelectConfig());
    expect(config.ariaLabels().clearButton).toBe('Leeren');
  });
});

describe('runtime language switch', () => {
  it('follows a Signal of ariaLabels and keeps the defaults for unset keys', () => {
    const labels = signal<CngxSelectAriaLabels>({ statusLoading: 'Loading options' });
    const config = resolveIn([provideSelectConfig(withAriaLabels(labels))]);
    labels.set({ statusLoading: 'Lade Optionen' });
    expect(config.ariaLabels().statusLoading).toBe('Lade Optionen');
    expect(config.ariaLabels().treeExpand).toBe('Expand node');
  });

  it('merges a static and a Signal withAriaLabels key by key', () => {
    const labels = signal<CngxSelectAriaLabels>({ chipRemove: 'Remove' });
    const config = resolveIn([
      provideSelectConfig(withAriaLabels({ clearButton: 'Clear' }), withAriaLabels(labels)),
    ]);
    labels.set({ chipRemove: 'Entfernen' });
    expect(config.ariaLabels().clearButton).toBe('Clear');
    expect(config.ariaLabels().chipRemove).toBe('Entfernen');
  });

  it('follows a Signal of fallbackLabels over the defaults', () => {
    const labels = signal<CngxSelectFallbackLabels>({ empty: 'No options' });
    const config = resolveIn([provideSelectConfig(withFallbackLabels(labels))]);
    labels.set({ empty: 'Keine Optionen' });
    expect(config.fallbackLabels().empty).toBe('Keine Optionen');
    expect(config.fallbackLabels().loadFailedRetry).toBe('Retry');
  });

  it('keeps replace semantics for fallbackLabels across features', () => {
    const config = resolveIn([
      provideSelectConfig(
        withFallbackLabels({ empty: 'Nothing', loading: 'Wait' }),
        withFallbackLabels({ empty: 'Keine Optionen' }),
      ),
    ]);
    expect(config.fallbackLabels().empty).toBe('Keine Optionen');
    expect(config.fallbackLabels().loading).toBe('Loading…');
  });

  it('swaps the announcer formatter through a Signal and keeps the default without one', () => {
    const announcer = signal<CngxSelectAnnouncerConfig>({ politeness: 'assertive' });
    const config = resolveIn([provideSelectConfig(withAnnouncer(announcer))]);
    const input = { selectedLabel: 'Red', fieldLabel: 'Color', multi: false };
    expect(config.announcer().politeness).toBe('assertive');
    expect(stripBidiIsolates(config.announcer().format(input))).toBe('Color: Red selected');

    announcer.set({
      politeness: 'assertive',
      format: (i) => `${i.fieldLabel}: ${i.selectedLabel} gewählt`,
    });
    expect(config.announcer().format(input)).toBe('Color: Red gewählt');
    expect(config.announcer().enabled).toBe(true);
  });

  it('fills a defaulted key an override sets to undefined', () => {
    const config = resolveIn([
      provideSelectConfig(
        withAriaLabels({ statusLoading: undefined }),
        withFallbackLabels({ empty: undefined }),
      ),
    ]);
    expect(config.ariaLabels().statusLoading).toBe('Loading options');
    expect(config.fallbackLabels().empty).toBe('No options');
    expect(config.ariaLabels().clearButton).toBeUndefined();
  });

  it('shares one Signal per config and keeps its reference on an equal recompute', () => {
    const labels = signal<CngxSelectAriaLabels>({ statusLoading: 'Lade Optionen' });
    TestBed.configureTestingModule({ providers: [provideSelectConfig(withAriaLabels(labels))] });
    const [a, b] = TestBed.runInInjectionContext(() => [
      resolveSelectConfig(),
      resolveSelectConfig(),
    ]);
    expect(a.ariaLabels).toBe(b.ariaLabels);
    expect(a.fallbackLabels).toBe(b.fallbackLabels);
    expect(a.announcer).toBe(b.announcer);

    const before = a.ariaLabels();
    labels.set({ statusLoading: 'Lade Optionen' });
    expect(a.ariaLabels()).toBe(before);
  });
});

describe('withTemplates', () => {
  const checkTpl = { name: 'check' } as unknown as TemplateRef<never>;
  const emptyTpl = { name: 'empty' } as unknown as TemplateRef<never>;
  const otherEmptyTpl = { name: 'empty-2' } as unknown as TemplateRef<never>;

  it('populates templates from the withTemplates feature', () => {
    const config = resolveIn([
      provideSelectConfig(withTemplates({ check: checkTpl, empty: emptyTpl })),
    ]);
    expect(config.templates.check).toBe(checkTpl);
    expect(config.templates.empty).toBe(emptyTpl);
  });

  it('keeps library defaults (null) for slots a partial does not set', () => {
    const config = resolveIn([provideSelectConfig(withTemplates({ check: checkTpl }))]);
    expect(config.templates.check).toBe(checkTpl);
    expect(config.templates.empty).toBeNull();
    expect(config.templates.caret).toBeNull();
    expect(config.templates.clearButton).toBeNull();
  });

  it('merges multiple withTemplates calls per slot in feature-list order', () => {
    const config = resolveIn([
      provideSelectConfig(
        withTemplates({ check: checkTpl, empty: emptyTpl }),
        withTemplates({ empty: otherEmptyTpl }),
      ),
    ]);
    expect(config.templates.check).toBe(checkTpl);
    expect(config.templates.empty).toBe(otherEmptyTpl);
  });

  it('coexists with other features without bleed', () => {
    const config = resolveIn([
      provideSelectConfig(withPanelWidth(240), withTemplates({ empty: emptyTpl })),
    ]);
    expect(config.panelWidth).toBe(240);
    expect(config.templates.empty).toBe(emptyTpl);
  });

  it('At-scope config shadows a root config wholesale (nearest-wins, no cross-level merge)', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSelectConfig(withTemplates({ check: checkTpl, empty: emptyTpl })),
        ...provideSelectConfigAt(withTemplates({ empty: otherEmptyTpl })),
      ],
    });
    const injector = TestBed.inject(Injector);
    const config = runInInjectionContext(injector, () => resolveSelectConfig());
    // At scope wins for the slot it sets ...
    expect(config.templates.empty).toBe(otherEmptyTpl);
    // ... but does NOT inherit root slots: the At token shadows the root
    // token entirely, so unset slots fall back to the library default.
    expect(config.templates.check).toBeNull();
  });
});

describe('makeSelectConfig', () => {
  const emptyTpl = { name: 'empty' } as unknown as TemplateRef<never>;

  it('merges features into a plain config value without DI', () => {
    const config = makeSelectConfig(
      withPanelWidth(240),
      withTemplates({ empty: emptyTpl }),
      withAriaLabels({ chipRemove: 'Delete' }),
    );
    expect(config.panelWidth).toBe(240);
    expect(config.templates?.empty).toBe(emptyTpl);
    expect(coerceSignal(config.ariaLabels ?? {})().chipRemove).toBe('Delete');
  });

  it('stores every copy key as a Signal', () => {
    const config = makeSelectConfig(
      withAriaLabels({ chipRemove: 'Delete' }),
      withFallbackLabels({ empty: 'Nothing' }),
      withFallbackLabels({ empty: 'Keine Optionen' }),
      withAnnouncer({ politeness: 'assertive' }),
    );
    expect(isSignal(config.ariaLabels)).toBe(true);
    expect(isSignal(config.announcer)).toBe(true);
    expect(isSignal(config.fallbackLabels)).toBe(true);
    expect(coerceSignal(config.fallbackLabels ?? {})()).toEqual({ empty: 'Keine Optionen' });
  });

  it('produces the same resolved config as provideSelectConfig when provided via useFactory', () => {
    const config = resolveIn([
      {
        provide: CNGX_SELECT_CONFIG,
        useFactory: () => makeSelectConfig(withTemplates({ empty: emptyTpl })),
      },
    ]);
    expect(config.templates.empty).toBe(emptyTpl);
    // Unset keys still fall back to library defaults through resolution.
    expect(config.templates.check).toBeNull();
    expect(config.panelWidth).toBe('trigger');
  });
});

describe('default announcer format - reordered action', () => {
  it('speaks the new 1-based position when toIndex is supplied', () => {
    const config = resolveIn([]);
    const message = config.announcer().format({
      selectedLabel: 'Admins',
      fieldLabel: 'Recipients',
      multi: true,
      action: 'reordered',
      count: 3,
      fromIndex: 0,
      toIndex: 2,
    });
    expect(stripBidiIsolates(message)).toBe('Recipients: Admins moved to position 3');
  });

  it('falls back to a positionless message when toIndex is omitted', () => {
    const config = resolveIn([]);
    const message = config.announcer().format({
      selectedLabel: 'Admins',
      fieldLabel: 'Recipients',
      multi: true,
      action: 'reordered',
      count: 3,
    });
    expect(stripBidiIsolates(message)).toBe('Recipients: Admins moved');
  });

  it('leaves existing added/removed messages unchanged (backward compat)', () => {
    const config = resolveIn([]);
    expect(
      stripBidiIsolates(
        config.announcer().format({
          selectedLabel: 'Red',
          fieldLabel: 'Color',
          multi: true,
          action: 'added',
          count: 1,
        }),
      ),
    ).toBe('Color: Red added, 1 selected');
    expect(
      stripBidiIsolates(
        config.announcer().format({
          selectedLabel: null,
          fieldLabel: 'Color',
          multi: true,
          action: 'removed',
        }),
      ),
    ).toBe('Color: selection cleared');
  });
});

describe('default announcer format - created action', () => {
  it("speaks 'created and selected' for single-select when a label is supplied", () => {
    const config = resolveIn([]);
    const message = config.announcer().format({
      selectedLabel: 'Violet',
      fieldLabel: 'Color',
      multi: false,
      action: 'created',
    });
    expect(stripBidiIsolates(message)).toBe('Color: Violet created and selected');
  });

  it("speaks the same sentence for multi-select ('created' short-circuits the multi branch)", () => {
    const config = resolveIn([]);
    const message = config.announcer().format({
      selectedLabel: 'Design',
      fieldLabel: 'Topics',
      multi: true,
      action: 'created',
      count: 5,
    });
    expect(stripBidiIsolates(message)).toBe('Topics: Design created and selected');
  });

  it("falls back to a labelless 'created' sentence when no label is available", () => {
    const config = resolveIn([]);
    const message = config.announcer().format({
      selectedLabel: null,
      fieldLabel: 'Color',
      multi: false,
      action: 'created',
    });
    expect(stripBidiIsolates(message)).toBe('Color: created');
  });
});

describe('CngxMultiSelectChipContext - optional index', () => {
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
