import {
  Component,
  Injector,
  isSignal,
  runInInjectionContext,
  signal,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
  type Type,
} from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { createManualState } from '@cngx/common/data';
import { CngxPopover } from '@cngx/common/popover';
import { coerceSignal } from '@cngx/core/utils';
import { stripBidiIsolates } from '@cngx/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCombobox } from '../combobox/combobox.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxSelect } from '../single-select/select.component';

import {
  CNGX_SELECT_CONFIG,
  CNGX_SELECT_DEFAULTS,
  type CngxSelectTemplateContexts,
  makeSelectConfig,
  provideSelectConfig,
  provideSelectConfigAt,
  withAnnouncer,
  withAriaLabels,
  withCaret,
  withChipOverflow,
  withCommitErrorAnnouncePolicy,
  withCommitErrorDisplay,
  withDismissOn,
  withEnterKeyHint,
  withFallbackLabels,
  withInputMode,
  withLoadingVariant,
  withMaxVisibleChips,
  withMobileSheet,
  withPanelWidth,
  withPopoverPlacement,
  withRefreshingVariant,
  withRestoreFocus,
  withSelectionIndicator,
  withSelectionIndicatorPosition,
  withSelectionIndicatorVariant,
  withSkeletonRowCount,
  withTemplates,
  withTypeaheadWhileClosed,
  type CngxSelectAnnouncerConfig,
  type CngxSelectConfig,
  type CngxSelectConfigFeature,
  type CngxSelectAriaLabels,
  type CngxSelectFallbackLabels,
} from './config';
import { resolveSelectConfig } from './internal/resolve-config';
import type { CngxMultiSelectChipContext, CngxSelectSheetCountContext } from './template-slots';
import type { CngxTreeSelectFooterContext } from '../tree-select/tree-select.model';
import type { CngxSelectOptionDef } from './option.model';

function resolveIn(providers: unknown[]): ReturnType<typeof resolveSelectConfig> {
  TestBed.configureTestingModule({ providers: providers as never[] });
  return TestBed.runInInjectionContext(() => resolveSelectConfig());
}

describe('withAriaLabels', () => {
  it('resolves to library EN defaults for status/fallback keys when no override is supplied', () => {
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
    expect(config.ariaLabels().sheetClose).toBe('Close');
    expect(config.ariaLabels().sheetDone).toBe('Done');
  });

  it('carries sheetClose / sheetDone overrides into the resolved config', () => {
    const config = resolveIn([
      provideSelectConfig(withAriaLabels({ sheetClose: 'Dismiss', sheetDone: 'Apply' })),
    ]);
    expect(config.ariaLabels().sheetClose).toBe('Dismiss');
    expect(config.ariaLabels().sheetDone).toBe('Apply');
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
    expect(config.ariaLabels().statusLoading).toBe('Loading options');
  });

  it('preserves non-overridden keys when partial ariaLabels are supplied', () => {
    const config = resolveIn([
      provideSelectConfig(withAriaLabels({ chipRemove: 'Delete' })),
    ]);
    expect(config.ariaLabels().clearButton).toBeUndefined();
    expect(config.ariaLabels().chipRemove).toBe('Delete');
    expect(config.ariaLabels().statusLoading).toBe('Loading options');
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
    expect(config.ariaLabels().statusLoading).toBe('Loading options');
  });

  it('routes status/fallback keys through a DE locale override roundtrip', () => {
    const config = resolveIn([
      provideSelectConfig(
        withAriaLabels({
          statusLoading: 'Lade Optionen',
          statusRefreshing: 'Aktualisiere Optionen',
          fieldLabelFallback: 'Auswahl',
          commitFailedMessage: (label, detail) =>
            `Speichern von ${label} fehlgeschlagen${detail ? ` (${detail})` : ''}`,
        }),
      ),
    ]);
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
    expect(config.ariaLabels().statusRefreshing).toBe('Refreshing options');
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

describe('withMobileSheet', () => {
  it('defaults to auto', () => {
    expect(resolveIn([]).mobileSheet).toBe('auto');
  });

  it('turns the sheet off app-wide', () => {
    expect(resolveIn([provideSelectConfig(withMobileSheet('off'))]).mobileSheet).toBe('off');
  });
});

describe('maxVisibleChips coercion', () => {
  it.each([
    [0, 1],
    [-2, 1],
    [2.7, 2],
    [Number.NaN, 3],
    [Number.POSITIVE_INFINITY, 3],
  ])('a raw CNGX_SELECT_CONFIG value of %s resolves to %s', (raw, expected) => {
    const config = resolveIn([{ provide: CNGX_SELECT_CONFIG, useValue: { maxVisibleChips: raw } }]);
    expect(config.maxVisibleChips).toBe(expected);
  });

  it('an unset key resolves to the default 3', () => {
    expect(resolveIn([]).maxVisibleChips).toBe(3);
  });

  it.each([
    [0, 1],
    [2.7, 2],
    [Number.NaN, 3],
  ])('withMaxVisibleChips(%s) resolves to %s', (count, expected) => {
    const config = resolveIn([provideSelectConfig(withMaxVisibleChips(count))]);
    expect(config.maxVisibleChips).toBe(expected);
  });
});

// jsdom has no Popover API.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: () => boolean;
  };
  if (typeof proto.showPopover === 'function') {
    return;
  }
  proto.showPopover = function (this: HTMLElement) {
    this.setAttribute('data-popover-open', 'true');
  };
  proto.hidePopover = function (this: HTMLElement) {
    this.removeAttribute('data-popover-open');
  };
  proto.togglePopover = function (this: HTMLElement) {
    const open = !this.hasAttribute('data-popover-open');
    if (open) {
      this.setAttribute('data-popover-open', 'true');
    } else {
      this.removeAttribute('data-popover-open');
    }
    return open;
  };
}

@Component({ selector: 'config-feature-host', template: '' })
class ConfigFeatureHost {
  readonly options: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly state = createManualState<CngxSelectOptionDef<string>[]>();
  readonly value = signal<string | undefined>(undefined);
  readonly values = signal<string[]>(['red']);
}

interface MountedFeatureHost {
  readonly fixture: ComponentFixture<ConfigFeatureHost>;
  readonly host: ConfigFeatureHost;
  readonly el: HTMLElement;
  readonly cmp: unknown;
  readonly flush: () => void;
  readonly open: () => void;
  readonly panel: () => HTMLElement;
}

type CompositeName = 'select' | 'multi' | 'combobox';

const COMPOSITES: Record<CompositeName, { readonly type: Type<unknown>; readonly tag: string }> = {
  select: {
    type: CngxSelect,
    tag: `<cngx-select [label]="'Colour'" [options]="options" [(value)]="value" />`,
  },
  multi: {
    type: CngxMultiSelect,
    tag: `<cngx-multi-select [label]="'Colour'" [options]="options" [(values)]="values" />`,
  },
  combobox: {
    type: CngxCombobox,
    tag: `<cngx-combobox [label]="'Colour'" [options]="options" [(values)]="values" />`,
  },
};

const mountedFeatureRoots: HTMLElement[] = [];

function mountComposite(
  composite: CompositeName,
  providers: readonly (Provider | EnvironmentProviders)[],
  tag = COMPOSITES[composite].tag,
): MountedFeatureHost {
  TestBed.resetTestingModule();
  polyfillPopover();
  TestBed.configureTestingModule({ providers: [...providers] });
  TestBed.overrideComponent(ConfigFeatureHost, {
    set: { template: tag, imports: [COMPOSITES[composite].type] },
  });
  const fixture = TestBed.createComponent(ConfigFeatureHost);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  mountedFeatureRoots.push(root);
  const flush = (): void => {
    TestBed.flushEffects();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  flush();
  const de = fixture.debugElement.query(By.directive(COMPOSITES[composite].type));
  const cmp = de.componentInstance as { open(): void };
  return {
    fixture,
    host: fixture.componentInstance,
    el: de.nativeElement as HTMLElement,
    cmp,
    flush,
    open: () => {
      cmp.open();
      flush();
    },
    panel: () => (de.nativeElement as HTMLElement).querySelector<HTMLElement>('.cngx-select__panel')!,
  };
}

interface ConfigFeatureRow {
  readonly name: string;
  readonly feature: CngxSelectConfigFeature;
  /** The resolved `CngxSelectConfig` key and the value the feature writes. */
  readonly key: keyof CngxSelectConfig;
  readonly value: unknown;
  readonly composite: CompositeName;
  readonly tag?: string;
  /** Features the row needs in both runs to make its effect observable. */
  readonly base?: readonly CngxSelectConfigFeature[];
  /** Observes the mounted composite; the result must differ between the runs. */
  readonly observe: (m: MountedFeatureHost) => unknown;
  readonly withFeature: unknown;
  readonly withoutFeature: unknown;
}

function firstOption(m: MountedFeatureHost): HTMLElement {
  m.open();
  return m.panel().querySelector<HTMLElement>('.cngx-select__option')!;
}

const CONFIG_FEATURE_ROWS: readonly ConfigFeatureRow[] = [
  {
    name: 'withSkeletonRowCount',
    feature: withSkeletonRowCount(5),
    key: 'skeletonRowCount',
    value: 5,
    composite: 'select',
    tag: `<cngx-select [label]="'Colour'" [state]="state" [(value)]="value" />`,
    base: [withLoadingVariant('skeleton')],
    observe: (m) => {
      m.host.state.set('loading');
      m.open();
      return m.panel().querySelectorAll('.cngx-select__skeleton-row').length;
    },
    withFeature: 5,
    withoutFeature: 3,
  },
  {
    name: 'withRefreshingVariant',
    feature: withRefreshingVariant('spinner'),
    key: 'refreshingVariant',
    value: 'spinner',
    composite: 'select',
    tag: `<cngx-select [label]="'Colour'" [state]="state" [(value)]="value" />`,
    observe: (m) => {
      m.host.state.setSuccess(m.host.options);
      m.host.state.set('refreshing');
      m.open();
      return m.panel().querySelector('.cngx-select__refreshing-spinner') !== null;
    },
    withFeature: true,
    withoutFeature: false,
  },
  {
    name: 'withCommitErrorDisplay',
    feature: withCommitErrorDisplay('inline'),
    key: 'commitErrorDisplay',
    value: 'inline',
    composite: 'select',
    observe: (m) => (m.cmp as { commitErrorDisplay(): unknown }).commitErrorDisplay(),
    withFeature: 'inline',
    withoutFeature: 'banner',
  },
  {
    name: 'withCommitErrorAnnouncePolicy',
    feature: withCommitErrorAnnouncePolicy({ kind: 'soft' }),
    key: 'commitErrorAnnouncePolicy',
    value: { kind: 'soft' },
    composite: 'select',
    observe: (m) =>
      (m.cmp as { commitErrorAnnouncePolicy(): { kind: string } }).commitErrorAnnouncePolicy().kind,
    withFeature: 'soft',
    withoutFeature: 'verbose',
  },
  {
    name: 'withPopoverPlacement',
    feature: withPopoverPlacement('top'),
    key: 'popoverPlacement',
    value: 'top',
    composite: 'select',
    observe: (m) =>
      m.fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover).placement(),
    withFeature: 'top',
    withoutFeature: 'bottom',
  },
  {
    name: 'withInputMode',
    feature: withInputMode('text'),
    key: 'inputMode',
    value: 'text',
    composite: 'combobox',
    observe: (m) => m.el.querySelector('input.cngx-combobox__input')!.getAttribute('inputmode'),
    withFeature: 'text',
    withoutFeature: 'search',
  },
  {
    name: 'withEnterKeyHint',
    feature: withEnterKeyHint('search'),
    key: 'enterKeyHint',
    value: 'search',
    composite: 'combobox',
    observe: (m) => m.el.querySelector('input.cngx-combobox__input')!.getAttribute('enterkeyhint'),
    withFeature: 'search',
    withoutFeature: 'enter',
  },
  {
    name: 'withChipOverflow',
    feature: withChipOverflow('scroll-x'),
    key: 'chipOverflow',
    value: 'scroll-x',
    composite: 'multi',
    observe: (m) => m.el.querySelector('.cngx-select__chip-list')!.getAttribute('data-overflow'),
    withFeature: 'scroll-x',
    withoutFeature: 'wrap',
  },
  {
    name: 'withTypeaheadWhileClosed',
    feature: withTypeaheadWhileClosed(false),
    key: 'typeaheadWhileClosed',
    value: false,
    composite: 'select',
    observe: (m) => {
      const trigger = m.el.querySelector<HTMLElement>('.cngx-select__trigger')!;
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
      m.flush();
      return m.host.value();
    },
    withFeature: undefined,
    withoutFeature: 'green',
  },
  {
    name: 'withSelectionIndicator',
    feature: withSelectionIndicator(false),
    key: 'showSelectionIndicator',
    value: false,
    composite: 'select',
    observe: (m) => firstOption(m).querySelector('.cngx-select__check') !== null,
    withFeature: false,
    withoutFeature: true,
  },
  {
    name: 'withSelectionIndicatorPosition',
    feature: withSelectionIndicatorPosition('before'),
    key: 'selectionIndicatorPosition',
    value: 'before',
    composite: 'select',
    observe: (m) => firstOption(m).classList.contains('cngx-select__option--indicator-after'),
    withFeature: false,
    withoutFeature: true,
  },
  {
    name: 'withSelectionIndicatorVariant',
    feature: withSelectionIndicatorVariant('radio'),
    key: 'selectionIndicatorVariant',
    value: 'radio',
    composite: 'select',
    observe: (m) => firstOption(m).querySelector('cngx-radio-indicator') !== null,
    withFeature: true,
    withoutFeature: false,
  },
  {
    name: 'withCaret',
    feature: withCaret(false),
    key: 'showCaret',
    value: false,
    composite: 'select',
    observe: (m) => m.el.querySelector('.cngx-select__caret') !== null,
    withFeature: false,
    withoutFeature: true,
  },
  {
    name: 'withRestoreFocus',
    feature: withRestoreFocus(false),
    key: 'restoreFocus',
    value: false,
    composite: 'select',
    observe: (m) => {
      const trigger = m.el.querySelector<HTMLElement>('.cngx-select__trigger')!;
      trigger.focus();
      m.open();
      const panel = m.panel();
      panel.tabIndex = -1;
      panel.focus();
      (m.cmp as { close(): void }).close();
      m.flush();
      return document.activeElement === trigger;
    },
    withFeature: false,
    withoutFeature: true,
  },
  {
    name: 'withDismissOn',
    feature: withDismissOn('outside'),
    key: 'dismissOn',
    value: 'outside',
    composite: 'select',
    observe: (m) => {
      m.open();
      const trigger = m.el.querySelector<HTMLElement>('[role="combobox"]')!;
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
      m.flush();
      return (m.cmp as { panelOpen(): boolean }).panelOpen();
    },
    withFeature: true,
    withoutFeature: false,
  },
];

describe('every select config feature reaches a mounted composite', () => {
  afterEach(() => {
    mountedFeatureRoots.splice(0).forEach((el) => el.remove());
  });

  it.each(CONFIG_FEATURE_ROWS)('$name writes its key', (row) => {
    expect(makeSelectConfig(row.feature)[row.key]).toEqual(row.value);
  });

  it.each(CONFIG_FEATURE_ROWS)('$name changes what the composite renders', (row) => {
    expect(row.withFeature).not.toEqual(row.withoutFeature);
    const base = row.base ?? [];
    const without = mountComposite(row.composite, [provideSelectConfig(...base)], row.tag);
    expect(row.observe(without)).toEqual(row.withoutFeature);

    const withIt = mountComposite(
      row.composite,
      [provideSelectConfig(...base, row.feature)],
      row.tag,
    );
    expect(row.observe(withIt)).toEqual(row.withFeature);
  });
});

describe('provideSelectConfigAt merges over the parent config', () => {
  function childConfig(parent: unknown[], child: ReturnType<typeof provideSelectConfigAt>) {
    TestBed.configureTestingModule({ providers: parent as never[] });
    const injector = Injector.create({ providers: child, parent: TestBed.inject(Injector) });
    return runInInjectionContext(injector, () => resolveSelectConfig());
  }

  it('keeps app-wide German ariaLabels under a component-scope withPanelWidth', () => {
    const config = childConfig(
      [provideSelectConfig(withAriaLabels({ clearButton: 'Leeren' }), withPanelWidth(480))],
      provideSelectConfigAt(withPanelWidth(300)),
    );
    expect(config.panelWidth).toBe(300);
    expect(config.ariaLabels().clearButton).toBe('Leeren');
  });

  it('merges ariaLabels per key: the nearest key wins, the others inherit', () => {
    const config = childConfig(
      [provideSelectConfig(withAriaLabels({ clearButton: 'Leeren', searchInput: 'Suchen' }))],
      provideSelectConfigAt(withAriaLabels({ clearButton: 'Entfernen' })),
    );
    expect(config.ariaLabels().clearButton).toBe('Entfernen');
    expect(config.ariaLabels().searchInput).toBe('Suchen');
  });

  it('falls back to the library defaults without a parent config', () => {
    const config = childConfig([], provideSelectConfigAt(withPanelWidth(300)));
    expect(config.panelWidth).toBe(300);
    expect(config.openOn).toBe(CNGX_SELECT_DEFAULTS.openOn);
  });
});

describe('CngxSelectTemplateContexts - derived from the config templates', () => {
  type ConfigTemplateKey = keyof NonNullable<CngxSelectConfig['templates']>;
  type SameKeys<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

  it('carries one context key per CngxSelectConfig.templates entry', () => {
    const sameKeys: SameKeys<keyof CngxSelectTemplateContexts, ConfigTemplateKey> = true;
    const contexts: Record<keyof CngxSelectTemplateContexts, true> = {
      check: true,
      caret: true,
      optgroup: true,
      placeholder: true,
      empty: true,
      loading: true,
      triggerLabel: true,
      optionLabel: true,
      error: true,
      retryButton: true,
      loadingGlyph: true,
      refreshing: true,
      commitError: true,
      clearButton: true,
      optionPending: true,
      optionError: true,
      action: true,
      sheetHandle: true,
      treeNodeCount: true,
      sheetCount: true,
      treeFooter: true,
    };
    expect(sameKeys).toBe(true);
    expect(Object.keys(contexts).sort()).toEqual(Object.keys(CNGX_SELECT_DEFAULTS.templates).sort());
  });

  it('maps each key to the context of its TemplateRef', () => {
    const footer: CngxSelectTemplateContexts['treeFooter'] = {} as CngxTreeSelectFooterContext;
    const count: CngxSelectTemplateContexts['sheetCount'] = {} as CngxSelectSheetCountContext;
    const glyph: CngxSelectTemplateContexts['loadingGlyph'] = {};
    expect([footer, count, glyph]).toHaveLength(3);
  });
});
