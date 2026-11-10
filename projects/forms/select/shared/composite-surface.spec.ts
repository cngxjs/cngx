import {
  Component,
  isSignal,
  reflectComponentType,
  signal,
  type InjectionToken,
  type Injector,
  type Type,
} from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import {
  CNGX_OPTION_FILTER_HOST,
  CNGX_OPTION_INTERACTION_HOST,
  CNGX_OPTION_STATUS_HOST,
} from '@cngx/common/interactive';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CNGX_SELECT_SHELL_SEARCH_HOST } from '../declarative/select-search-host';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CNGX_TREE_SELECT_PANEL_HOST } from '../tree-select/tree-select-panel-host';
import { CngxTreeSelect } from '../tree-select/tree-select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';

import { KINDS, type Kind, type Mount, cleanupRoots, flush, mount } from './__test-helpers/review-probe-host';
import { provideSelectConfig, withOpenOn } from './config';
import { CNGX_SELECT_PANEL_HOST, CNGX_SELECT_PANEL_VIEW_HOST } from './panel-host';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

type Probe = Readonly<Record<string, unknown>>;

interface Surface {
  readonly key: string;
  readonly kind: Kind;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly hasPanelHost: boolean;
  readonly optional: Readonly<Record<string, OptionalExpectation>>;
  readonly indicator: Readonly<{
    show: boolean;
    variant: string;
    position: string;
  }>;
}

/** Optional-key expectation: absent, any defined signal, any defined object, or a signal carrying a value. */
type OptionalExpectation = 'absent' | 'signal' | 'object' | { readonly value: unknown };

const NO_ACTION: Record<string, OptionalExpectation> = {
  actionSearchTerm: 'absent',
  actionDirty: { value: false },
  actionCallbacks: 'signal',
  actionFocusTrapEnabled: { value: false },
  actionPosition: 'absent',
  actionError: 'absent',
  actionValue: 'absent',
};

const NO_ACTION_AT_ALL: Record<string, OptionalExpectation> = {
  actionSearchTerm: 'absent',
  actionDirty: 'absent',
  actionCallbacks: 'absent',
  actionFocusTrapEnabled: 'absent',
  actionPosition: 'absent',
  actionError: 'absent',
  actionValue: 'absent',
};

const BUTTON_OPTIONAL: Record<string, OptionalExpectation> = {
  searchTerm: 'absent',
  unfilteredCount: 'absent',
  previousLoadedCount: 'absent',
  isCommitting: { value: false },
  ...NO_ACTION,
  panelRenderer: 'object',
  autoRecycler: 'object',
};

const INPUT_OPTIONAL: Record<string, OptionalExpectation> = {
  ...BUTTON_OPTIONAL,
  searchTerm: { value: '' },
};

const SURFACES: readonly Surface[] = [
  {
    key: 'select',
    kind: KINDS['select'],
    inputs: [
      'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus', 'caretGlyph',
      'clearButtonAriaLabel', 'clearGlyph', 'clearable', 'commitAction', 'commitErrorAnnouncePolicy',
      'commitErrorDisplay', 'commitMode', 'compareWith', 'disabled', 'hideCaret', 'hideSelectionIndicator',
      'id', 'label', 'loading', 'loadingVariant', 'options', 'panelClass', 'panelWidth', 'placeholder',
      'popoverPlacement', 'presentation', 'refreshingVariant', 'required', 'retryFn',
      'selectionIndicatorPosition', 'selectionIndicatorVariant', 'sheetLabel', 'skeletonRowCount', 'state',
      'tabIndex', 'typeaheadDebounceInterval', 'value',
    ],
    outputs: [
      'closed', 'commitError', 'opened', 'openedChange', 'optionSelected', 'retry', 'selectionChange',
      'stateChange', 'valueChange',
    ],
    hasPanelHost: true,
    optional: BUTTON_OPTIONAL,
    indicator: { show: true, variant: 'checkmark', position: 'after' },
  },
  {
    key: 'multi',
    kind: KINDS['multi'],
    inputs: [
      'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus', 'caretGlyph',
      'chipOverflow', 'chipRemoveAriaLabel', 'clearButtonAriaLabel', 'clearGlyph', 'clearable',
      'commitAction', 'commitErrorAnnouncePolicy', 'commitErrorDisplay', 'commitMode', 'compareWith',
      'disabled', 'hideCaret', 'hideSelectionIndicator', 'id', 'label', 'loading', 'loadingVariant',
      'maxVisibleChips', 'options', 'panelClass', 'panelWidth', 'placeholder', 'popoverPlacement',
      'presentation', 'refreshingVariant', 'required', 'retryFn', 'selectionIndicatorPosition',
      'selectionIndicatorVariant', 'sheetLabel', 'skeletonRowCount', 'state', 'tabIndex',
      'typeaheadDebounceInterval', 'values',
    ],
    outputs: [
      'cleared', 'closed', 'commitError', 'opened', 'openedChange', 'optionToggled', 'retry',
      'selectionChange', 'stateChange', 'valuesChange',
    ],
    hasPanelHost: true,
    optional: BUTTON_OPTIONAL,
    indicator: { show: true, variant: 'checkbox', position: 'after' },
  },
  {
    key: 'combobox',
    kind: KINDS['combobox'],
    inputs: [
      'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus', 'caretGlyph',
      'chipOverflow', 'chipRemoveAriaLabel', 'clearButtonAriaLabel', 'clearGlyph', 'clearable',
      'closeOnSelect', 'commitAction', 'commitErrorAnnouncePolicy', 'commitErrorDisplay', 'commitMode',
      'compareWith', 'disabled', 'enterKeyHint', 'hideCaret', 'hideSelectionIndicator', 'id', 'inputMode',
      'label', 'loading', 'loadingVariant', 'maxVisibleChips', 'options', 'panelClass', 'panelWidth',
      'placeholder', 'popoverPlacement', 'presentation', 'refreshingVariant', 'required', 'retryFn',
      'searchDebounceMs', 'searchMatchFn', 'selectionIndicatorPosition', 'selectionIndicatorVariant',
      'sheetLabel', 'skeletonRowCount', 'skipInitial', 'state', 'tabIndex', 'values',
    ],
    outputs: [
      'cleared', 'closed', 'commitError', 'opened', 'openedChange', 'optionToggled', 'retry',
      'searchTermChange', 'selectionChange', 'stateChange', 'valuesChange',
    ],
    hasPanelHost: true,
    optional: INPUT_OPTIONAL,
    indicator: { show: true, variant: 'checkbox', position: 'after' },
  },
  {
    key: 'typeahead',
    kind: KINDS['typeahead'],
    inputs: [
      'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus', 'caretGlyph',
      'clearButtonAriaLabel', 'clearGlyph', 'clearOnBlur', 'clearable', 'commitAction',
      'commitErrorAnnouncePolicy', 'commitErrorDisplay', 'commitMode', 'compareWith', 'disabled',
      'displayWith', 'enterKeyHint', 'hideCaret', 'hideSelectionIndicator', 'id', 'inputMode', 'label',
      'loading', 'loadingVariant', 'options', 'panelClass', 'panelWidth', 'placeholder',
      'popoverPlacement', 'presentation', 'refreshingVariant', 'required', 'retryFn', 'searchDebounceMs',
      'searchMatchFn', 'selectionIndicatorPosition', 'selectionIndicatorVariant', 'sheetLabel',
      'skeletonRowCount', 'skipInitial', 'state', 'tabIndex', 'value',
    ],
    outputs: [
      'cleared', 'closed', 'commitError', 'opened', 'openedChange', 'retry', 'searchTermChange',
      'selectionChange', 'stateChange', 'valueChange',
    ],
    hasPanelHost: true,
    optional: INPUT_OPTIONAL,
    indicator: { show: true, variant: 'checkmark', position: 'after' },
  },
  {
    key: 'tree',
    kind: KINDS['tree'],
    inputs: [
      'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus', 'caretGlyph',
      'cascadeChildren', 'checkGlyph', 'chipDisplay', 'chipRemoveAriaLabel', 'clearButtonAriaLabel',
      'clearGlyph', 'clearable', 'commitAction', 'commitErrorAnnouncePolicy', 'commitErrorDisplay',
      'commitMode', 'compareWith', 'dashGlyph', 'disabled', 'expandToReveal', 'hideCaret', 'id',
      'initiallyExpanded', 'keyFn', 'label', 'labelFn', 'loading', 'loadingVariant', 'maxVisibleChips',
      'nodeIdFn', 'nodes', 'panelClass', 'panelWidth', 'placeholder', 'popoverPlacement', 'presentation',
      'refreshingVariant', 'required', 'retryFn', 'sheetLabel', 'skeletonRowCount', 'state', 'tabIndex',
      'twistyGlyph', 'twistyOpenGlyph', 'values',
    ],
    outputs: [
      'cleared', 'closed', 'commitError', 'opened', 'openedChange', 'retry', 'selectionChange',
      'stateChange', 'valuesChange',
    ],
    hasPanelHost: false,
    optional: {
      searchTerm: 'absent',
      unfilteredCount: 'absent',
      previousLoadedCount: 'absent',
      isCommitting: { value: false },
      ...NO_ACTION_AT_ALL,
      panelRenderer: 'absent',
      autoRecycler: 'absent',
    },
    indicator: { show: false, variant: '', position: '' },
  },
  {
    key: 'reorder',
    kind: KINDS['reorder'],
    inputs: [
      'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus', 'caretGlyph',
      'chipDragHandle', 'chipOverflow', 'chipRemoveAriaLabel', 'clearButtonAriaLabel', 'clearGlyph',
      'clearable', 'commitAction', 'commitErrorAnnouncePolicy', 'commitErrorDisplay', 'commitMode',
      'compareWith', 'disabled', 'hideCaret', 'hideSelectionIndicator', 'id', 'label', 'loading',
      'loadingVariant', 'moveGlyph', 'options', 'panelClass', 'panelWidth', 'placeholder',
      'popoverPlacement', 'presentation', 'refreshingVariant', 'reorderAriaLabel',
      'reorderKeyboardModifier', 'required', 'retryFn', 'selectionIndicatorPosition',
      'selectionIndicatorVariant', 'sheetLabel', 'skeletonRowCount', 'state', 'tabIndex',
      'typeaheadDebounceInterval', 'values',
    ],
    outputs: [
      'cleared', 'closed', 'commitError', 'opened', 'openedChange', 'optionToggled', 'reordered', 'retry',
      'selectionChange', 'stateChange', 'valuesChange',
    ],
    hasPanelHost: true,
    optional: BUTTON_OPTIONAL,
    indicator: { show: true, variant: 'checkbox', position: 'after' },
  },
  {
    key: 'actionSelect',
    kind: KINDS['actionSelect'],
    inputs: [
      'actionPosition', 'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus',
      'caretGlyph', 'clearButtonAriaLabel', 'clearGlyph', 'clearOnBlur', 'clearable', 'closeOnCreate',
      'commitAction', 'commitErrorAnnouncePolicy', 'commitErrorDisplay', 'commitMode', 'compareWith',
      'disabled', 'displayWith', 'enterKeyHint', 'hideCaret', 'hideSelectionIndicator', 'id', 'inputMode',
      'label', 'liveInputFallback', 'loading', 'loadingVariant', 'options', 'panelClass', 'panelWidth',
      'placeholder', 'popoverPlacement', 'presentation', 'quickCreateAction', 'refreshingVariant',
      'required', 'retryFn', 'searchDebounceMs', 'searchMatchFn', 'selectionIndicatorPosition',
      'selectionIndicatorVariant', 'sheetLabel', 'skeletonRowCount', 'skipInitial', 'state', 'tabIndex',
      'value',
    ],
    outputs: [
      'cleared', 'closed', 'commitError', 'created', 'opened', 'openedChange', 'retry', 'searchTermChange',
      'selectionChange', 'stateChange', 'valueChange',
    ],
    hasPanelHost: true,
    optional: {
      ...INPUT_OPTIONAL,
      actionSearchTerm: { value: '' },
      actionPosition: { value: 'bottom' },
      actionError: { value: undefined },
      actionValue: { value: undefined },
    },
    indicator: { show: true, variant: 'checkmark', position: 'after' },
  },
  {
    key: 'actionMulti',
    kind: KINDS['actionMulti'],
    inputs: [
      'actionPosition', 'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus',
      'caretGlyph', 'chipOverflow', 'chipRemoveAriaLabel', 'clearButtonAriaLabel', 'clearGlyph',
      'clearable', 'closeOnCreate', 'commitAction', 'commitErrorAnnouncePolicy', 'commitErrorDisplay',
      'commitMode', 'compareWith', 'disabled', 'enterKeyHint', 'hideCaret', 'hideSelectionIndicator', 'id',
      'inputMode', 'label', 'liveInputFallback', 'loading', 'loadingVariant', 'maxVisibleChips', 'options',
      'panelClass', 'panelWidth', 'placeholder', 'popoverPlacement', 'presentation', 'quickCreateAction',
      'refreshingVariant', 'required', 'retryFn', 'searchDebounceMs', 'searchMatchFn',
      'selectionIndicatorPosition', 'selectionIndicatorVariant', 'sheetLabel', 'skeletonRowCount',
      'skipInitial', 'state', 'tabIndex', 'values',
    ],
    outputs: [
      'cleared', 'closed', 'commitError', 'created', 'opened', 'openedChange', 'optionToggled', 'retry',
      'searchTermChange', 'selectionChange', 'stateChange', 'valuesChange',
    ],
    hasPanelHost: true,
    optional: {
      ...INPUT_OPTIONAL,
      actionSearchTerm: { value: '' },
      actionPosition: { value: 'bottom' },
      actionError: { value: undefined },
      actionValue: { value: [] },
    },
    indicator: { show: true, variant: 'checkbox', position: 'after' },
  },
  {
    key: 'shell',
    kind: KINDS['shell'],
    inputs: [
      'announceChanges', 'announceTemplate', 'aria-label', 'aria-labelledby', 'autofocus', 'caretGlyph',
      'clearButtonAriaLabel', 'clearGlyph', 'clearable', 'commitAction', 'commitErrorAnnouncePolicy',
      'commitErrorDisplay', 'commitMode', 'compareWith', 'disabled', 'hideCaret', 'hideSelectionIndicator',
      'id', 'label', 'loading', 'loadingVariant', 'panelClass', 'panelWidth', 'placeholder',
      'popoverPlacement', 'presentation', 'refreshingVariant', 'required', 'retryFn', 'searchDebounceMs',
      'searchMatchFn', 'searchTerm', 'selectionIndicatorPosition', 'selectionIndicatorVariant',
      'sheetLabel', 'skeletonRowCount', 'state', 'tabIndex', 'typeaheadDebounceInterval', 'value',
    ],
    outputs: [
      'closed', 'commitError', 'opened', 'openedChange', 'retry', 'searchTermChange', 'selectionChange',
      'stateChange', 'valueChange',
    ],
    hasPanelHost: true,
    optional: {
      searchTerm: { value: '' },
      unfilteredCount: { value: 3 },
      previousLoadedCount: { value: 3 },
      isCommitting: { value: false },
      ...NO_ACTION_AT_ALL,
      panelRenderer: 'object',
      autoRecycler: 'absent',
    },
    indicator: { show: true, variant: 'checkmark', position: 'after' },
  },
];

const VIEW_SIGNALS = [
  'activeView', 'skeletonIndices', 'showInlineError', 'showCommitError', 'showRefreshIndicator',
  'errorContext', 'commitErrorContext', 'loadingVariant', 'refreshingVariant', 'commitErrorDisplay',
  'fallbackLabels', 'ariaLabels',
] as const;

const VIEW_TPL_KEYS = [
  'loading', 'empty', 'error', 'refreshing', 'commitError', 'retryButton', 'loadingGlyph', 'action',
] as const;

const HOST_TPL_KEYS = [
  'check', 'caret', 'optgroup', 'placeholder', 'empty', 'loading', 'optionLabel', 'error', 'retryButton',
  'loadingGlyph', 'refreshing', 'commitError', 'clearButton', 'optionPending', 'optionError', 'action',
  'sheetHandle', 'sheetCount',
] as const;

const HOST_SIGNALS = [
  'effectiveOptions', 'flatOptions', 'panelClassList', 'panelWidthCss', 'resolvedListboxLabel',
  'resolvedShowSelectionIndicator', 'resolvedSelectionIndicatorVariant',
  'resolvedSelectionIndicatorPosition', 'listboxCompareWith', 'externalActivation', 'commitErrorValue',
  'activeId', 'panelOpen',
] as const;

const HOST_METHODS = [
  'isGroup', 'isSelected', 'isIndeterminate', 'isCommittingOption', 'patchData', 'clearLocalItems',
] as const;

const OPTIONAL_VIEW_KEYS = [
  'searchTerm', 'unfilteredCount', 'previousLoadedCount', 'isCommitting', 'actionSearchTerm',
  'actionDirty', 'actionCallbacks', 'actionFocusTrapEnabled', 'actionPosition', 'actionError', 'actionValue',
] as const;

const OPTIONAL_HOST_ONLY_KEYS = ['panelRenderer', 'autoRecycler'] as const;

const ABC_OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

function injectorOf(m: Mount): Injector {
  return m.fixture.debugElement.query(By.directive(m.kind.component)).injector;
}

function tokenOf<T>(m: Mount, token: InjectionToken<T>): Probe | null {
  return injectorOf(m).get(token, null, { self: true }) as Probe | null;
}

function need(host: Probe | null, label: string): Probe {
  if (!host) {
    expect.fail(`token ${label} is not provided`);
  }
  return host;
}

function read(host: Probe, key: string): unknown {
  const member = host[key];
  if (!isSignal(member)) {
    expect.fail(`${key} is not a signal`);
  }
  return (member as () => unknown)();
}

function callable(host: Probe, key: string): (...args: unknown[]) => unknown {
  const member = host[key];
  if (typeof member !== 'function') {
    expect.fail(`${key} is not a function`);
  }
  return (member as (...args: unknown[]) => unknown).bind(host);
}

function signalKeys(host: Probe, key: string): Probe {
  const member = host[key];
  if (member === null || typeof member !== 'object') {
    expect.fail(`${key} is not an object`);
  }
  return member as Probe;
}

function assertOptional(host: Probe, key: string, expected: OptionalExpectation, label: string): void {
  const member = host[key];
  if (expected === 'absent') {
    expect(member, `${label} ${key} absent`).toBeUndefined();
    return;
  }
  expect(member, `${label} ${key} present`).toBeDefined();
  if (expected === 'object') {
    expect(isSignal(member), `${label} ${key} is a plain object`).toBe(false);
    expect(typeof member).toBe('object');
    return;
  }
  expect(isSignal(member), `${label} ${key} is a signal`).toBe(true);
  if (expected !== 'signal') {
    expect((member as () => unknown)(), `${label} ${key} default value`).toEqual(expected.value);
  }
}

function comboOf(m: Mount): HTMLElement {
  const el = m.el.querySelector<HTMLElement>('[role="combobox"]');
  if (!el) {
    expect.fail(`no role=combobox for ${m.kind.name}`);
  }
  return el;
}

function isOpen(m: Mount): boolean {
  return comboOf(m).getAttribute('aria-expanded') === 'true';
}

function triggerOf(m: Mount): HTMLElement {
  const el = m.el.querySelector<HTMLElement>('.cngx-field-trigger');
  if (!el) {
    expect.fail(`no trigger for ${m.kind.name}`);
  }
  return el;
}

function inputOf(m: Mount): HTMLInputElement {
  const el = m.el.querySelector<HTMLInputElement>('input');
  if (!el) {
    expect.fail(`no input for ${m.kind.name}`);
  }
  return el;
}

function optionsFor(surface: Surface): { options?: unknown[]; initial: unknown } {
  const multi = surface.kind.model === 'values';
  if (surface.key === 'shell') {
    return { initial: 'red' };
  }
  if (surface.key === 'tree') {
    return { initial: ['red'] };
  }
  return { options: ABC_OPTIONS, initial: multi ? ['a'] : 'a' };
}

describe('composite surface: public inputs and outputs', () => {
  for (const surface of SURFACES) {
    it(`${surface.kind.name}: input names`, () => {
      const mirror = reflectComponentType(surface.kind.component);
      const names = (mirror?.inputs ?? []).map((i) => i.templateName).sort();
      expect(names).toEqual([...surface.inputs].sort());
    });

    it(`${surface.kind.name}: output names`, () => {
      const mirror = reflectComponentType(surface.kind.component);
      const names = (mirror?.outputs ?? []).map((o) => o.templateName).sort();
      expect(names).toEqual([...surface.outputs].sort());
    });
  }
});

describe('composite surface: which tokens each composite provides', () => {
  for (const surface of SURFACES) {
    it(`${surface.kind.name}: panel-host family`, () => {
      const m = mount(surface.kind);
      const panelHost = tokenOf(m, CNGX_SELECT_PANEL_HOST);
      expect(panelHost !== null, 'CNGX_SELECT_PANEL_HOST provided').toBe(surface.hasPanelHost);
      expect(tokenOf(m, CNGX_SELECT_PANEL_VIEW_HOST), 'CNGX_SELECT_PANEL_VIEW_HOST provided').not.toBeNull();
      const tree = tokenOf(m, CNGX_TREE_SELECT_PANEL_HOST);
      expect(tree !== null, 'CNGX_TREE_SELECT_PANEL_HOST provided').toBe(surface.key === 'tree');
    });

    it(`${surface.kind.name}: shell-only option and search hosts`, () => {
      const m = mount(surface.kind);
      const isShell = surface.key === 'shell';
      expect(tokenOf(m, CNGX_OPTION_STATUS_HOST) !== null).toBe(isShell);
      expect(tokenOf(m, CNGX_OPTION_FILTER_HOST) !== null).toBe(isShell);
      expect(tokenOf(m, CNGX_OPTION_INTERACTION_HOST) !== null).toBe(isShell);
      expect(tokenOf(m, CNGX_SELECT_SHELL_SEARCH_HOST) !== null).toBe(isShell);
    });
  }
});

describe('composite surface: CNGX_SELECT_PANEL_VIEW_HOST', () => {
  for (const surface of SURFACES) {
    it(`${surface.kind.name}: required members`, () => {
      const m = mount(surface.kind);
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_VIEW_HOST), 'CNGX_SELECT_PANEL_VIEW_HOST');
      for (const key of VIEW_SIGNALS) {
        expect(isSignal(host[key]), `${key} is a signal`).toBe(true);
      }
      expect(typeof host['handleRetry']).toBe('function');
      const tpl = signalKeys(host, 'tpl');
      for (const key of VIEW_TPL_KEYS) {
        expect(isSignal(tpl[key]), `tpl.${key} is a signal`).toBe(true);
      }
    });

    it(`${surface.kind.name}: optional members in the default mounted state`, () => {
      const m = mount(surface.kind);
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_VIEW_HOST), 'CNGX_SELECT_PANEL_VIEW_HOST');
      for (const key of OPTIONAL_VIEW_KEYS) {
        assertOptional(host, key, surface.optional[key], 'view');
      }
    });

    it(`${surface.kind.name}: default async view reads idle-like values`, () => {
      const m = mount(surface.kind);
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_VIEW_HOST), 'CNGX_SELECT_PANEL_VIEW_HOST');
      expect(read(host, 'showInlineError')).toBe(false);
      expect(read(host, 'showCommitError')).toBe(false);
      expect(read(host, 'showRefreshIndicator')).toBe(false);
      expect(Array.isArray(read(host, 'skeletonIndices'))).toBe(true);
      expect(typeof read(host, 'commitErrorDisplay')).toBe('string');
      expect(typeof read(host, 'loadingVariant')).toBe('string');
      expect(typeof read(host, 'refreshingVariant')).toBe('string');
    });
  }
});

describe('composite surface: CNGX_SELECT_PANEL_HOST', () => {
  for (const surface of SURFACES.filter((s) => s.hasPanelHost)) {
    it(`${surface.kind.name}: required members`, () => {
      const m = mount(surface.kind);
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_HOST), 'CNGX_SELECT_PANEL_HOST');
      for (const key of [...VIEW_SIGNALS, ...HOST_SIGNALS]) {
        expect(isSignal(host[key]), `${key} is a signal`).toBe(true);
      }
      for (const key of ['handleRetry', ...HOST_METHODS]) {
        expect(typeof host[key], `${key} is a method`).toBe('function');
      }
      const tpl = signalKeys(host, 'tpl');
      for (const key of HOST_TPL_KEYS) {
        expect(isSignal(tpl[key]), `tpl.${key} is a signal`).toBe(true);
      }
    });

    it(`${surface.kind.name}: optional members in the default mounted state`, () => {
      const m = mount(surface.kind);
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_HOST), 'CNGX_SELECT_PANEL_HOST');
      for (const key of [...OPTIONAL_VIEW_KEYS, ...OPTIONAL_HOST_ONLY_KEYS]) {
        assertOptional(host, key, surface.optional[key], 'host');
      }
    });

    it(`${surface.kind.name}: indicator and listbox defaults`, () => {
      const m = mount(surface.kind);
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_HOST), 'CNGX_SELECT_PANEL_HOST');
      expect(read(host, 'resolvedShowSelectionIndicator')).toBe(surface.indicator.show);
      expect(read(host, 'resolvedSelectionIndicatorVariant')).toBe(surface.indicator.variant);
      expect(read(host, 'resolvedSelectionIndicatorPosition')).toBe(surface.indicator.position);
      expect(read(host, 'resolvedListboxLabel')).toBe('Colour');
      expect(read(host, 'activeId')).toBeNull();
      expect(read(host, 'panelOpen')).toBe(false);
      expect(typeof read(host, 'listboxCompareWith')).toBe('function');
      expect(typeof read(host, 'externalActivation')).toBe('boolean');
    });

    it(`${surface.kind.name}: panelOpen follows open and close`, () => {
      const m = mount(surface.kind);
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_HOST), 'CNGX_SELECT_PANEL_HOST');
      m.open();
      expect(read(host, 'panelOpen')).toBe(true);
      expect(isOpen(m)).toBe(true);
      m.v.close();
      m.settle();
      expect(read(host, 'panelOpen')).toBe(false);
      expect(isOpen(m)).toBe(false);
    });

    it(`${surface.kind.name}: option predicates`, () => {
      const { options, initial } = optionsFor(surface);
      const m = mount(surface.kind, { options, initial });
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_HOST), 'CNGX_SELECT_PANEL_HOST');
      const flat = read(host, 'flatOptions') as { value: unknown; label: string }[];
      expect(flat.length).toBeGreaterThanOrEqual(2);
      const isSelected = callable(host, 'isSelected');
      expect(isSelected(flat[0])).toBe(true);
      expect(isSelected(flat[1])).toBe(false);
      expect(callable(host, 'isGroup')(flat[0])).toBe(false);
      expect(callable(host, 'isGroup')({ label: 'G', children: [flat[0]] })).toBe(true);
      expect(callable(host, 'isIndeterminate')(flat[0])).toBe(false);
      expect(callable(host, 'isCommittingOption')(flat[0])).toBe(false);
    });

    it(`${surface.kind.name}: shared keys read the same on both tokens`, () => {
      const m = mount(surface.kind);
      const view = need(tokenOf(m, CNGX_SELECT_PANEL_VIEW_HOST), 'CNGX_SELECT_PANEL_VIEW_HOST');
      const host = need(tokenOf(m, CNGX_SELECT_PANEL_HOST), 'CNGX_SELECT_PANEL_HOST');
      for (const key of VIEW_SIGNALS) {
        if (key === 'errorContext' || key === 'commitErrorContext') {
          continue;
        }
        expect(read(host, key), `${key} before open`).toEqual(read(view, key));
      }
      m.open();
      for (const key of VIEW_SIGNALS) {
        if (key === 'errorContext' || key === 'commitErrorContext') {
          continue;
        }
        expect(read(host, key), `${key} after open`).toEqual(read(view, key));
      }
      for (const key of OPTIONAL_VIEW_KEYS) {
        expect(host[key] === undefined, `${key} presence parity`).toBe(view[key] === undefined);
      }
    });
  }
});

describe('composite surface: CNGX_TREE_SELECT_PANEL_HOST', () => {
  const TREE_SIGNALS = [
    'panelOpen', 'disabled', 'rowTapExpands', 'expandToReveal', 'nodeTpl', 'twistyGlyph', 'twistyOpenGlyph',
    'checkGlyph', 'dashGlyph', 'resolvedListboxLabel', 'adCompareWith', 'nodeCountTpl', 'selectionCount',
    'selectionCountText', 'clearAllLabel', 'footerTpl', 'escapeEnabled', 'writeBlocked',
  ] as const;
  const TREE_METHODS = [
    'nodeCount', 'nodeCountText', 'clearAllInPanel', 'isSelected', 'isIndeterminate', 'handleSelect',
    'close', 'escapeClose',
  ] as const;

  it('CngxTreeSelect: required members', () => {
    const m = mount(KINDS['tree']);
    const host = need(tokenOf(m, CNGX_TREE_SELECT_PANEL_HOST), 'CNGX_TREE_SELECT_PANEL_HOST');
    for (const key of TREE_SIGNALS) {
      expect(isSignal(host[key]), `${key} is a signal`).toBe(true);
    }
    for (const key of TREE_METHODS) {
      expect(typeof host[key], `${key} is a method`).toBe('function');
    }
    expect(host['treeController']).toBeDefined();
    expect(typeof host['listboxId']).toBe('string');
  });

  it('CngxTreeSelect: default values and selection predicates', () => {
    const m = mount(KINDS['tree'], { initial: ['red'] });
    const host = need(tokenOf(m, CNGX_TREE_SELECT_PANEL_HOST), 'CNGX_TREE_SELECT_PANEL_HOST');
    expect(read(host, 'panelOpen')).toBe(false);
    expect(read(host, 'disabled')).toBe(false);
    expect(read(host, 'writeBlocked')).toBe(false);
    expect(read(host, 'expandToReveal')).toBe(false);
    expect(read(host, 'selectionCount')).toBe(1);
    expect(read(host, 'resolvedListboxLabel')).toBe('Colour');
    expect(callable(host, 'isSelected')('red')).toBe(true);
    expect(callable(host, 'isSelected')('green')).toBe(false);
    expect(callable(host, 'isIndeterminate')('red')).toBe(false);
  });

  it('CngxTreeSelect: panelOpen and the view host stay in step', () => {
    const m = mount(KINDS['tree']);
    const host = need(tokenOf(m, CNGX_TREE_SELECT_PANEL_HOST), 'CNGX_TREE_SELECT_PANEL_HOST');
    m.open();
    expect(read(host, 'panelOpen')).toBe(true);
    expect(isOpen(m)).toBe(true);
    callable(host, 'close')();
    m.settle();
    expect(read(host, 'panelOpen')).toBe(false);
  });

  it('CngxTreeSelect: disabled reflects the input', () => {
    const m = mount(KINDS['tree']);
    const host = need(tokenOf(m, CNGX_TREE_SELECT_PANEL_HOST), 'CNGX_TREE_SELECT_PANEL_HOST');
    m.h.disabled.set(true);
    m.settle();
    expect(read(host, 'disabled')).toBe(true);
    expect(read(host, 'writeBlocked')).toBe(true);
  });
});

describe('composite surface: select-shell option and search hosts', () => {
  it('CNGX_OPTION_STATUS_HOST: statusFor resolves to no status for an idle option', () => {
    const m = mount(KINDS['shell']);
    const host = need(tokenOf(m, CNGX_OPTION_STATUS_HOST), 'CNGX_OPTION_STATUS_HOST');
    const status = callable(host, 'statusFor')('red');
    expect(isSignal(status)).toBe(true);
    expect((status as () => unknown)()).toBeNull();
  });

  it('CNGX_OPTION_FILTER_HOST: term signal and matcher', () => {
    const m = mount(KINDS['shell']);
    const host = need(tokenOf(m, CNGX_OPTION_FILTER_HOST), 'CNGX_OPTION_FILTER_HOST');
    expect(read(host, 'searchTerm')).toBe('');
    const matches = callable(host, 'matches');
    expect(matches('red', 'Red', '')).toBe(true);
    expect(matches('red', 'Red', 're')).toBe(true);
    expect(matches('red', 'Red', 'zz')).toBe(false);
  });

  it('CNGX_OPTION_INTERACTION_HOST: activeId signal and activation methods', () => {
    const m = mount(KINDS['shell']);
    const host = need(tokenOf(m, CNGX_OPTION_INTERACTION_HOST), 'CNGX_OPTION_INTERACTION_HOST');
    expect(read(host, 'activeId')).toBeNull();
    expect(typeof host['activate']).toBe('function');
    expect(typeof host['highlight']).toBe('function');
  });

  it('CNGX_SELECT_SHELL_SEARCH_HOST: members and live panelOpen', () => {
    const m = mount(KINDS['shell']);
    const host = need(tokenOf(m, CNGX_SELECT_SHELL_SEARCH_HOST), 'CNGX_SELECT_SHELL_SEARCH_HOST');
    expect(isSignal(host['searchTerm'])).toBe(true);
    expect(read(host, 'searchTerm')).toBe('');
    expect(isSignal(host['listboxRef'])).toBe(true);
    expect(isSignal(host['searchDebounceMs'])).toBe(true);
    expect(isSignal(host['panelOpen'])).toBe(true);
    expect(isSignal(host['listboxId'])).toBe(true);
    expect(typeof read(host, 'listboxId')).toBe('string');
    expect(typeof host['close']).toBe('function');
    expect(typeof host['focus']).toBe('function');
    expect(typeof host['registerInitialFocus']).toBe('function');
    expect(read(host, 'panelOpen')).toBe(false);
    m.open();
    expect(read(host, 'panelOpen')).toBe(true);
  });

  it('CNGX_SELECT_SHELL_SEARCH_HOST: writing the term reaches the filter host', () => {
    const m = mount(KINDS['shell']);
    const search = need(tokenOf(m, CNGX_SELECT_SHELL_SEARCH_HOST), 'CNGX_SELECT_SHELL_SEARCH_HOST');
    const filter = need(tokenOf(m, CNGX_OPTION_FILTER_HOST), 'CNGX_OPTION_FILTER_HOST');
    (search['searchTerm'] as unknown as { set(v: string): void }).set('gr');
    m.settle();
    expect(read(filter, 'searchTerm')).toBe('gr');
  });
});

// ── handler parity: input hosts ───────────────────────────────────────────

const INPUT_HOSTS = ['typeahead', 'combobox', 'actionSelect', 'actionMulti'] as const;
const BUTTON_HOSTS = ['select', 'multi', 'reorder', 'tree', 'shell'] as const;

function focusOut(target: HTMLElement, related: Element | null): void {
  target.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: related }));
}

function blur(target: HTMLElement, related: Element | null): void {
  target.dispatchEvent(new FocusEvent('blur', { relatedTarget: related }));
  focusOut(target, related);
}

function typeInto(m: Mount, text: string): void {
  const input = inputOf(m);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  m.settle();
}

describe('composite surface: input-host handlers', () => {
  for (const key of INPUT_HOSTS) {
    const kind = KINDS[key];

    describe(kind.name, () => {
      it('focus does not open under the default openOn', () => {
        const m = mount(kind);
        inputOf(m).dispatchEvent(new FocusEvent('focus'));
        m.settle();
        expect(isOpen(m)).toBe(false);
      });

      for (const mode of ['focus', 'click+focus'] as const) {
        it(`input focus opens under openOn ${mode}`, () => {
          const m = mount(kind, { providers: [provideSelectConfig(withOpenOn(mode))] });
          inputOf(m).dispatchEvent(new FocusEvent('focus'));
          m.settle();
          expect(isOpen(m)).toBe(true);
        });
      }

      it('input focus does not open under openOn click', () => {
        const m = mount(kind, { providers: [provideSelectConfig(withOpenOn('click'))] });
        inputOf(m).dispatchEvent(new FocusEvent('focus'));
        m.settle();
        expect(isOpen(m)).toBe(false);
      });

      it('a focus leaving the host closes the open panel', () => {
        const m = mount(kind);
        m.open();
        expect(isOpen(m)).toBe(true);
        const outside = m.fixture.nativeElement.querySelector('.outside-btn') as HTMLElement;
        blur(inputOf(m), outside);
        m.settle();
        expect(isOpen(m)).toBe(false);
      });

      it('focus moving to a node inside the open panel keeps it open', () => {
        const m = mount(kind);
        m.open();
        const inside = m.el.querySelector<HTMLElement>('.cngx-select__panel [role="option"], .cngx-select__panel');
        if (!inside) {
          expect.fail(`no panel node for ${kind.name}`);
        }
        blur(inputOf(m), inside);
        m.settle();
        expect(isOpen(m)).toBe(true);
      });

      it('a click on the wrapper focuses the input and opens the panel', () => {
        const m = mount(kind);
        triggerOf(m).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        m.settle();
        expect(document.activeElement).toBe(inputOf(m));
        expect(isOpen(m)).toBe(true);
      });

      it('a click on the wrapper keeps an already open panel open', () => {
        const m = mount(kind);
        m.open();
        triggerOf(m).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        m.settle();
        expect(isOpen(m)).toBe(true);
      });

      it('a click on the wrapper does nothing while disabled', () => {
        const m = mount(kind);
        m.h.disabled.set(true);
        m.settle();
        triggerOf(m).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        m.settle();
        expect(isOpen(m)).toBe(false);
      });
    });
  }

  for (const key of ['typeahead', 'actionSelect'] as const) {
    const kind = KINDS[key];

    describe(`${kind.name} blur guard`, () => {
      it('snaps the typed term back when focus leaves the host', () => {
        const m = mount(kind, { initial: 'red' });
        m.open();
        typeInto(m, 'xyz');
        const outside = m.fixture.nativeElement.querySelector('.outside-btn') as HTMLElement;
        blur(inputOf(m), outside);
        m.settle();
        expect(inputOf(m).value).toBe('red');
      });

      it('keeps the typed term when focus moves to a node inside the host', () => {
        const m = mount(kind, { initial: 'red' });
        m.open();
        typeInto(m, 'xyz');
        const inside = (m.el.querySelector('.cngx-select__panel') ?? m.el) as HTMLElement;
        blur(inputOf(m), inside);
        m.settle();
        expect(inputOf(m).value).toBe('xyz');
      });

      it('snaps the typed term back on a blur without a related target', () => {
        const m = mount(kind, { initial: 'red' });
        m.open();
        typeInto(m, 'xyz');
        blur(inputOf(m), null);
        m.settle();
        expect(inputOf(m).value).toBe('red');
      });
    });
  }

  for (const key of ['combobox', 'actionMulti'] as const) {
    const kind = KINDS[key];

    describe(`${kind.name} blur`, () => {
      it('a blur leaving the host keeps the typed term', () => {
        const m = mount(kind);
        m.open();
        typeInto(m, 'xyz');
        const outside = m.fixture.nativeElement.querySelector('.outside-btn') as HTMLElement;
        blur(inputOf(m), outside);
        m.settle();
        expect(inputOf(m).value).toBe('xyz');
      });

      it('a blur inside the host keeps the typed term', () => {
        const m = mount(kind);
        m.open();
        typeInto(m, 'xyz');
        const inside = (m.el.querySelector('.cngx-select__panel') ?? m.el) as HTMLElement;
        blur(inputOf(m), inside);
        m.settle();
        expect(inputOf(m).value).toBe('xyz');
      });
    });
  }
});

// ── handler parity: retry (every host) ────────────────────────────────────

interface RetryHost {
  readonly state: ManualAsyncState<unknown>;
  readonly retryCount: ReturnType<typeof signal<number>>;
  reloadCalls: number;
  readonly retryFn: () => void;
}

function mountRetry(kind: Kind): { fixture: ComponentFixture<unknown>; host: RetryHost; el: HTMLElement } {
  const binding = kind.model === 'value' ? '[(value)]="model"' : '[(values)]="model"';
  const inputs = kind.inputs.replace('[options]="options"', '').replace('[nodes]="nodes"', '');
  @Component({ template: '' })
  class Host implements RetryHost {
    readonly state = createManualState<unknown>();
    readonly retryCount = signal(0);
    reloadCalls = 0;
    readonly retryFn = (): void => {
      this.reloadCalls += 1;
    };
    readonly model = signal<unknown>(kind.model === 'value' ? undefined : []);
    readonly nodes = [{ value: 'red' }];
    readonly idFn = (v: unknown): string => String(v);
    readonly labelFn = (v: unknown): string => String(v);
  }
  TestBed.overrideComponent(Host, {
    set: {
      template: `
        <button type="button" class="outside-btn">Outside</button>
        <${kind.selector}
          [label]="'Colour'"
          ${inputs}
          ${binding}
          [presentation]="'anchored'"
          [state]="state"
          [retryFn]="retryFn"
          (retry)="retryCount.set(retryCount() + 1)"
        >${kind.content ?? ''}</${kind.selector}>`,
      imports: [kind.component, ...(kind.contentImports ?? [])],
    },
  });
  const fixture = TestBed.createComponent(Host) as ComponentFixture<unknown>;
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  fixture.detectChanges();
  flush(fixture);
  const el = fixture.debugElement.query(By.directive(kind.component)).nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance as unknown as RetryHost, el };
}

describe('composite surface: retry from the load-error panel', () => {
  const owners: Record<string, 'input' | 'button'> = {
    select: 'button', multi: 'button', reorder: 'button', tree: 'button', shell: 'button',
    typeahead: 'input', combobox: 'input', actionSelect: 'input', actionMulti: 'input',
  };

  for (const [key, kind] of Object.entries(KINDS)) {
    it(`${kind.name}: retry runs retryFn, emits retry and refocuses the owner`, () => {
      const { fixture, host, el } = mountRetry(kind);
      host.state.setError(new Error('network'));
      flush(fixture);
      const instance = fixture.debugElement.query(By.directive(kind.component)).componentInstance as {
        open(): void;
      };
      instance.open();
      flush(fixture);

      const retryBtn = el.querySelector<HTMLElement>('button.cngx-select__error-retry');
      if (!retryBtn) {
        expect.fail(`no retry button for ${kind.name}`);
      }
      retryBtn.focus();
      expect(document.activeElement).toBe(retryBtn);
      retryBtn.click();
      flush(fixture);

      expect(host.reloadCalls).toBe(1);
      expect(host.retryCount()).toBe(1);
      const owner = owners[key] === 'input' ? el.querySelector('input') : el.querySelector('.cngx-field-trigger');
      expect(document.activeElement).toBe(owner);
    });
  }
});

// ── handler parity: button hosts ──────────────────────────────────────────

function click(m: Mount): void {
  triggerOf(m).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  m.settle();
}

describe('composite surface: button-trigger handlers', () => {
  for (const key of BUTTON_HOSTS) {
    const kind = KINDS[key];

    describe(kind.name, () => {
      it('a trigger click opens the closed panel and a second click closes it', () => {
        const m = mount(kind);
        expect(isOpen(m)).toBe(false);
        click(m);
        expect(isOpen(m)).toBe(true);
        click(m);
        expect(isOpen(m)).toBe(false);
      });

      it('a trigger click does nothing while disabled', () => {
        const m = mount(kind);
        m.h.disabled.set(true);
        m.settle();
        click(m);
        expect(isOpen(m)).toBe(false);
      });

      it('trigger focus does not open under the default openOn', () => {
        const m = mount(kind);
        triggerOf(m).dispatchEvent(new FocusEvent('focus'));
        m.settle();
        expect(isOpen(m)).toBe(false);
      });

      for (const mode of ['focus', 'click+focus'] as const) {
        it(`trigger focus opens under openOn ${mode}`, () => {
          const m = mount(kind, { providers: [provideSelectConfig(withOpenOn(mode))] });
          triggerOf(m).dispatchEvent(new FocusEvent('focus'));
          m.settle();
          expect(isOpen(m)).toBe(true);
        });
      }

      it('trigger focus does not open under openOn click', () => {
        const m = mount(kind, { providers: [provideSelectConfig(withOpenOn('click'))] });
        triggerOf(m).dispatchEvent(new FocusEvent('focus'));
        m.settle();
        expect(isOpen(m)).toBe(false);
      });

      it('a click after a focus-open under openOn focus keeps the panel open', () => {
        const m = mount(kind, { providers: [provideSelectConfig(withOpenOn('focus'))] });
        triggerOf(m).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        triggerOf(m).dispatchEvent(new FocusEvent('focus'));
        m.settle();
        click(m);
        expect(isOpen(m)).toBe(true);
      });

      it('a blur with focus leaving the host closes the open panel', () => {
        const m = mount(kind);
        click(m);
        expect(isOpen(m)).toBe(true);
        const outside = m.fixture.nativeElement.querySelector('.outside-btn') as HTMLElement;
        blur(triggerOf(m), outside);
        m.settle();
        expect(isOpen(m)).toBe(false);
      });
    });
  }
});

const COMPONENTS: readonly Type<unknown>[] = [
  CngxSelect, CngxMultiSelect, CngxCombobox, CngxTypeahead, CngxTreeSelect, CngxReorderableMultiSelect,
  CngxActionSelect, CngxActionMultiSelect, CngxSelectShell,
];

describe('composite surface: coverage of the nine composites', () => {
  it('every composite is pinned exactly once', () => {
    const pinned = SURFACES.map((s) => s.kind.component);
    expect(new Set(pinned).size).toBe(COMPONENTS.length);
    for (const component of COMPONENTS) {
      expect(pinned).toContain(component);
    }
  });
});
