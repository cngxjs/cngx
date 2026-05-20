import {
  computed,
  DestroyRef,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';

import {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  type AsyncStatus,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';

import {
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CngxSelectAnnouncer } from './announcer';
import {
  CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitController,
} from './commit-controller.token';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitErrorDisplay,
} from './commit-action.types';
import {
  type CngxSelectAnnouncerConfig,
  type CngxSelectAriaLabels,
  type CngxSelectFallbackLabels,
} from './config';
import {
  flattenSelectOptions,
  isCngxSelectOptionGroupDef,
  mergeLocalItems,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from './option.model';
import { resolveSelectConfig } from './resolve-config';
import type {
  CngxSelectCommitErrorContext,
  CngxSelectErrorContext,
} from './template-slots';

/**
 * Value-to-option equality. Default `Object.is`; override via `[compareWith]`.
 */
export type CngxSelectCompareFn<T> = (a: T | undefined, b: T | undefined) => boolean;

/**
 * Identity comparator — `Object.is`.
 */
export const cngxSelectDefaultCompare: CngxSelectCompareFn<unknown> = (a, b) => Object.is(a, b);

/**
 * ARIA projection for the trigger. Bundle is structural-equal to keep
 * `[attr.aria-*]` bindings stable.
 */
export interface CngxSelectTriggerAria {
  readonly label: string | null;
  readonly labelledBy: string | null;
  readonly describedBy: string | null;
  readonly errorMessage: string | null;
  readonly expanded: boolean;
  readonly disabled: boolean | null;
  readonly invalid: boolean | null;
  readonly required: boolean | null;
  readonly busy: boolean | null;
}

/**
 * Signal inputs for {@link createSelectCore}. Core reads signals only —
 * never component instance fields.
 */
export interface CngxSelectCoreDeps<T, TCommit> {
  readonly label: Signal<string>;
  readonly ariaLabel: Signal<string | null>;
  readonly ariaLabelledBy: Signal<string | null>;
  readonly placeholder: Signal<string>;
  readonly idInput: Signal<string | null>;
  readonly disabledInput: Signal<boolean>;
  readonly requiredInput: Signal<boolean>;
  readonly tabIndex: Signal<number>;
  readonly options: Signal<CngxSelectOptionsInput<T>>;
  readonly state: Signal<CngxAsyncState<CngxSelectOptionsInput<T>> | null>;
  readonly loading: Signal<boolean>;
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  readonly skeletonRowCount: Signal<number>;
  readonly panelClass: Signal<string | readonly string[] | null>;
  readonly panelWidth: Signal<'trigger' | number | null>;
  readonly hideSelectionIndicator: Signal<boolean>;
  readonly hideCaret: Signal<boolean>;
  readonly commitErrorDisplay: Signal<CngxSelectCommitErrorDisplay>;
  readonly commitAction: Signal<CngxSelectCommitAction<TCommit> | null>;
  /** `popoverRef()?.isVisible() ?? false`. */
  readonly panelOpen: Signal<boolean>;
  /** `presenter?.showError() ?? false`. */
  readonly errorState: Signal<boolean>;
  /** Combobox uses this for inline search filtering. */
  readonly filter?: Signal<
    ((input: CngxSelectOptionsInput<T>) => CngxSelectOptionsInput<T>) | null
  >;

  /**
   * Local-items buffer folded onto server options before `filter`.
   * Action organisms feed it for optimistic quick-create; entries drop
   * out via `mergeLocalItems` dedup once the backend catches up.
   */
  readonly localItems?: Signal<readonly CngxSelectOptionDef<T>[]>;

  /** `true` for multi/combobox/tree; routes selection through the controller. */
  readonly multi: Signal<boolean>;

  /** Single: `T | undefined`. Multi/combobox: `readonly T[]`. */
  readonly currentSelection: Signal<T | undefined | readonly T[]>;

  /** Multi-mode only. Used to seed the {@link SelectionController}. */
  readonly multiValues?: WritableSignal<T[]>;

  /** `null` → inherit config. */
  readonly selectionIndicatorPosition: Signal<'before' | 'after' | null>;

  /** `null` → inherit config. */
  readonly selectionIndicatorVariant: Signal<'auto' | 'checkbox' | 'checkmark' | 'radio' | null>;
}

/**
 * Per-instance announcer inputs.
 */
export interface CngxSelectAnnouncerInputs {
  readonly announceChanges: Signal<boolean | null>;
  readonly announceTemplate: Signal<CngxSelectAnnouncerConfig['format'] | null>;
}

/**
 * Output of {@link createSelectCore} — pure-derivation signals shared by
 * every select-family component.
 */
export interface CngxSelectCore<T, TCommit> {
  readonly effectiveOptions: Signal<CngxSelectOptionsInput<T>>;
  readonly flatOptions: Signal<CngxSelectOptionDef<T>[]>;
  readonly valueToOptionMap: Signal<Map<unknown, CngxSelectOptionDef<T>> | null>;
  /**
   * Merged-but-unfiltered flat view (server + `localItems`). Used by
   * chip strips so selected chips stay visible while a search term
   * hides the matching option. Aliases `flatOptions` when no filter is
   * set.
   */
  readonly unfilteredFlatOptions: Signal<CngxSelectOptionDef<T>[]>;

  readonly activeView: Signal<AsyncView>;
  readonly showRefreshIndicator: Signal<boolean>;
  readonly showInlineError: Signal<boolean>;
  readonly skeletonIndices: Signal<number[]>;
  readonly panelClassList: Signal<string | readonly string[] | null>;
  readonly panelWidthCss: Signal<string | null>;
  /** Plain object — config is resolved per-injector and immutable. */
  readonly fallbackLabels: Required<CngxSelectFallbackLabels>;
  /** Mirrors `CNGX_SELECT_CONFIG.ariaLabels`. Forwarded onto the panel host. */
  readonly ariaLabels: CngxSelectAriaLabels;

  readonly resolvedId: Signal<string>;
  readonly resolvedAriaLabel: Signal<string | null>;
  readonly resolvedAriaLabelledBy: Signal<string | null>;
  readonly resolvedAriaRequired: Signal<boolean | null>;
  readonly resolvedListboxLabel: Signal<string>;
  readonly resolvedShowSelectionIndicator: Signal<boolean>;
  readonly resolvedShowCaret: Signal<boolean>;
  /**
   * `instance > config > 'auto'` cascade. `'auto'` → `'checkbox'` in
   * multi, `'checkmark'` in single.
   */
  readonly resolvedSelectionIndicatorVariant: Signal<'checkbox' | 'checkmark' | 'radio'>;
  /** `instance > config > 'before'` cascade. */
  readonly resolvedSelectionIndicatorPosition: Signal<'before' | 'after'>;
  readonly describedBy: Signal<string | null>;
  readonly ariaInvalid: Signal<boolean | null>;
  readonly ariaBusy: Signal<boolean | null>;
  readonly ariaReadonly: Signal<boolean | null>;
  readonly ariaErrorMessage: Signal<string | null>;
  readonly effectiveTabIndex: Signal<number | null>;
  readonly triggerAria: Signal<CngxSelectTriggerAria>;

  readonly disabled: Signal<boolean>;

  /**
   * Mode-agnostic membership test. Multi delegates to
   * {@link SelectionController}'s identity fast path; falls back to
   * `compareWith` scan for custom comparators.
   */
  isSelected(value: T): boolean;
  /** Always `false` without `childrenFn`. Tree-select propagates. */
  isIndeterminate(value: T): boolean;
  /**
   * Shared selection controller. `null` for single-select. Membership
   * is identity-based — consumers with custom `compareWith` should
   * prefer {@link isSelected}.
   */
  readonly selection: Signal<SelectionController<T> | null>;

  readonly commitController: CngxCommitController<TCommit>;
  readonly commitState: CngxAsyncState<TCommit | undefined>;
  readonly isCommitting: Signal<boolean>;
  readonly togglingOption: WritableSignal<CngxSelectOptionDef<T> | null>;
  readonly externalActivation: Signal<boolean>;
  readonly showCommitError: Signal<boolean>;
  readonly commitErrorValue: Signal<unknown>;

  /**
   * Builds a `commitErrorContext` signal bound to the caller's retry.
   * Cache the result per variant-specific retry signature.
   */
  bindCommitRetry(retry: () => void): Signal<CngxSelectCommitErrorContext<T>>;

  /** Panel-level `[state]` errors. Cache like `bindCommitRetry`. */
  makeErrorContext(retry: () => void): Signal<CngxSelectErrorContext>;

  isGroup(
    item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
  ): item is CngxSelectOptionGroupDef<T>;
  isCommittingOption(opt: CngxSelectOptionDef<T>): boolean;
  findOption(value: T): CngxSelectOptionDef<T> | null;
  commitErrorMessage(err: unknown): string;
  /**
   * Bound `isGroup`/`isSelected`/`isIndeterminate`/`isCommittingOption`
   * for spreading into a variant's `CngxSelectPanelHost`. Stable
   * identities for the core's lifetime.
   */
  readonly panelHostAdapter: CngxSelectPanelHostAdapter<T>;

  /**
   * Announce a selection change via the live-region. Cascade:
   * per-instance > config > default. `'reordered'` accepts
   * `fromIndex`/`toIndex`; `'created'` is fired by action organisms.
   */
  announce(
    option: CngxSelectOptionDef<T> | null,
    action: 'added' | 'removed' | 'reordered' | 'created',
    count: number,
    multi: boolean,
    fromIndex?: number,
    toIndex?: number,
  ): void;
}

/**
 * Pre-bound bundle for {@link CngxSelectCore.panelHostAdapter}.
 */
export interface CngxSelectPanelHostAdapter<T> {
  readonly isGroup: (
    item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
  ) => item is CngxSelectOptionGroupDef<T>;
  readonly isSelected: (opt: CngxSelectOptionDef<T>) => boolean;
  readonly isIndeterminate: (opt: CngxSelectOptionDef<T>) => boolean;
  readonly isCommittingOption: (opt: CngxSelectOptionDef<T>) => boolean;
}

/**
 * Stateless signal graph shared by every select-family component.
 *
 * Factory rather than hostDirective: hostDirective collapses generics
 * to `unknown` through the input/output decorator metadata slot, so a
 * typed factory wins. Injection context required.
 */
export function createSelectCore<T, TCommit>(
  deps: CngxSelectCoreDeps<T, TCommit>,
  announcerInputs: CngxSelectAnnouncerInputs,
): CngxSelectCore<T, TCommit> {
  const presenter = inject(CngxFormFieldPresenter, { optional: true });
  const announcer = inject(CngxSelectAnnouncer);
  const config = resolveSelectConfig();

  const disabled = computed<boolean>(
    () => deps.disabledInput() || (presenter?.disabled() ?? false),
  );

  // Pre-filter merge of server options + `localItems`. Flattened into
  // `unfilteredFlatOptions` so chip strips bypass the search filter.
  const mergedOptions = computed<CngxSelectOptionsInput<T>>(() => {
    const s = deps.state();
    const all = s?.data() ?? deps.options();
    const local = deps.localItems?.() ?? [];
    return local.length > 0
      ? mergeLocalItems(all, local, deps.compareWith())
      : all;
  });

  const effectiveOptions = computed<CngxSelectOptionsInput<T>>(() => {
    const merged = mergedOptions();
    const f = deps.filter?.();
    return f ? f(merged) : merged;
  });

  const flatOptionsEqual = (
    a: CngxSelectOptionDef<T>[],
    b: CngxSelectOptionDef<T>[],
  ): boolean => {
    if (a === b) {
      return true;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) {
        return false;
      }
    }
    return true;
  };

  const flatOptions = computed<CngxSelectOptionDef<T>[]>(
    () => flattenSelectOptions(effectiveOptions()),
    { equal: flatOptionsEqual },
  );

  const unfilteredFlatOptions = computed<CngxSelectOptionDef<T>[]>(
    () => flattenSelectOptions(mergedOptions()),
    { equal: flatOptionsEqual },
  );

  const valueToOptionMap = computed<Map<unknown, CngxSelectOptionDef<T>> | null>(
    () => {
      const eq = deps.compareWith();
      if (eq !== (cngxSelectDefaultCompare as unknown)) {
        return null;
      }
      const map = new Map<unknown, CngxSelectOptionDef<T>>();
      for (const opt of flatOptions()) {
        map.set(opt.value as unknown, opt);
      }
      return map;
    },
    {
      // Structural equal — same size + Object.is per (key, value).
      // Keeps the map ref stable across server refetches.
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a === null || b === null) {
          return false;
        }
        if (a.size !== b.size) {
          return false;
        }
        for (const [key, val] of a) {
          const other = b.get(key);
          if (!Object.is(val, other)) {
            return false;
          }
        }
        return true;
      },
    },
  );

  const activeView = computed<AsyncView>(() => {
    const s = deps.state();
    if (s) {
      return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
    }
    if (deps.loading()) {
      return 'skeleton';
    }
    if (effectiveOptions().length === 0) {
      return 'empty';
    }
    return 'content';
  });

  const showRefreshIndicator = computed<boolean>(() => {
    const s = deps.state();
    if (!s) {
      return false;
    }
    const status = s.status();
    return status === 'refreshing' || (status === 'loading' && !s.isFirstLoad());
  });

  const showInlineError = computed<boolean>(
    () => activeView() === 'content+error',
  );

  const skeletonIndices = computed<number[]>(
    () => Array.from({ length: Math.max(1, deps.skeletonRowCount()) }, (_, i) => i),
    { equal: (a, b) => a.length === b.length },
  );

  const panelClassList = computed<string | readonly string[] | null>(
    () => {
      const global = config.panelClass;
      const local = deps.panelClass();
      if (!global && !local) {
        return null;
      }
      if (!global) {
        return local;
      }
      if (!local) {
        return global;
      }
      const globalArr: readonly string[] = Array.isArray(global)
        ? (global as readonly string[])
        : [global as string];
      const localArr: readonly string[] = Array.isArray(local)
        ? (local as readonly string[])
        : [local as string];
      return [...globalArr, ...localArr];
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        const aArr = Array.isArray(a) ? a : a == null ? null : [a];
        const bArr = Array.isArray(b) ? b : b == null ? null : [b];
        if (aArr === null && bArr === null) {
          return true;
        }
        if (aArr === null || bArr === null) {
          return false;
        }
        if (aArr.length !== bArr.length) {
          return false;
        }
        for (let i = 0; i < aArr.length; i++) {
          if (aArr[i] !== bArr[i]) {
            return false;
          }
        }
        return true;
      },
    },
  );

  const panelWidthCss = computed<string | null>(() => {
    const w = deps.panelWidth();
    if (w === null) {
      return 'auto';
    }
    if (w === 'trigger') {
      return 'anchor-size(width)';
    }
    return `${w}px`;
  });

  const resolvedId = computed<string>(() => {
    const override = deps.idInput();
    if (override) {
      return override;
    }
    return presenter?.inputId() ?? '';
  });

  const resolvedAriaLabelledBy = computed<string | null>(
    () => deps.ariaLabelledBy() ?? presenter?.labelId() ?? null,
  );

  const resolvedAriaLabel = computed<string | null>(() => {
    const explicit = deps.ariaLabel();
    if (explicit) {
      return explicit;
    }
    if (resolvedAriaLabelledBy()) {
      return null;
    }
    return deps.label() || null;
  });

  const resolvedAriaRequired = computed<boolean | null>(() =>
    deps.requiredInput() || presenter?.required() ? true : null,
  );

  const resolvedListboxLabel = computed<string>(() => {
    const label = deps.label();
    if (label.length > 0) {
      return label;
    }
    const aria = deps.ariaLabel();
    if (aria && aria.length > 0) {
      return aria;
    }
    const placeholder = deps.placeholder();
    if (placeholder.length > 0) {
      return placeholder;
    }
    return 'Options';
  });

  const resolvedShowSelectionIndicator = computed<boolean>(
    () => !deps.hideSelectionIndicator(),
  );

  const resolvedShowCaret = computed<boolean>(() => !deps.hideCaret());

  const resolvedSelectionIndicatorPosition = computed<'before' | 'after'>(
    () => deps.selectionIndicatorPosition() ?? config.selectionIndicatorPosition,
  );

  const resolvedSelectionIndicatorVariant = computed<'checkbox' | 'checkmark' | 'radio'>(() => {
    const resolved = deps.selectionIndicatorVariant() ?? config.selectionIndicatorVariant;
    if (resolved === 'auto') {
      return deps.multi() ? 'checkbox' : 'checkmark';
    }
    return resolved;
  });

  // Controller eager-built when multiValues is supplied; single-select
  // leaves it null. Factory resolved through CNGX_SELECTION_CONTROLLER_FACTORY
  // for app-wide swap parity with the commit-controller token.
  const selectionFactory = inject(CNGX_SELECTION_CONTROLLER_FACTORY);
  const controllerInstance: SelectionController<T> | null = deps.multiValues
    ? selectionFactory<T>(deps.multiValues)
    : null;
  const selection = signal<SelectionController<T> | null>(controllerInstance).asReadonly();
  // Release per-value signal caches on teardown; post-destroy reads
  // flip to shared Signal<false> so late bindings stay safe.
  if (controllerInstance) {
    inject(DestroyRef).onDestroy(() => controllerInstance.destroy());
  }

  function isSelected(value: T): boolean {
    const eq = deps.compareWith();
    if (deps.multi()) {
      // Controller fast path is identity-only; custom compareWith
      // falls back to an O(n) scan.
      if (controllerInstance && (eq as unknown) === cngxSelectDefaultCompare) {
        return controllerInstance.isSelected(value)();
      }
      const values = (deps.currentSelection() as readonly T[] | undefined) ?? [];
      return values.some((v) => eq(v, value));
    }
    const current = deps.currentSelection() as T | undefined;
    if (current === undefined || current === null) {
      return false;
    }
    return eq(current, value);
  }

  function isIndeterminate(value: T): boolean {
    // Flat selection (no childrenFn) → shared Signal<false>.
    return controllerInstance?.isIndeterminate(value)() ?? false;
  }

  // Built early so ariaInvalid + ariaBusy below can read commit state.
  const commitController: CngxCommitController<TCommit> =
    inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY)<TCommit>();
  const commitState = commitController.state;
  const isCommitting = commitController.isCommitting;
  // Pillar 2: `aria-invalid` projects both form-field validation and a
  // failed commit. The trigger surface CSS keys off this single attribute
  // so the closed-panel error case stays visible to sighted users without
  // duplicating the predicate in every variant.
  const showCommitError = computed<boolean>(
    () => commitState.status() === 'error' && deps.commitErrorDisplay() !== 'none',
  );

  const describedBy = computed(() => presenter?.describedBy() ?? null);
  const ariaInvalid = computed<boolean | null>(() =>
    deps.errorState() || showCommitError() ? true : null,
  );
  const ariaReadonly = computed<boolean | null>(() =>
    presenter?.readonly() ? true : null,
  );
  const ariaErrorMessage = computed<string | null>(() =>
    deps.errorState() ? (presenter?.errorId() ?? null) : null,
  );

  const ariaBusy = computed<boolean | null>(() => {
    if (presenter?.pending()) {
      return true;
    }
    const s = deps.state();
    if (s?.isLoading() || s?.isPending() || s?.isRefreshing()) {
      return true;
    }
    if (commitController.isCommitting()) {
      return true;
    }
    return null;
  });

  const effectiveTabIndex = computed<number | null>(() =>
    disabled() ? -1 : deps.tabIndex(),
  );

  const triggerAria = computed<CngxSelectTriggerAria>(
    () => ({
      label: resolvedAriaLabel(),
      labelledBy: resolvedAriaLabelledBy(),
      describedBy: describedBy(),
      errorMessage: ariaErrorMessage(),
      expanded: deps.panelOpen(),
      disabled: disabled() || null,
      invalid: ariaInvalid(),
      required: resolvedAriaRequired(),
      busy: ariaBusy(),
    }),
    {
      equal: (a, b) =>
        a.label === b.label &&
        a.labelledBy === b.labelledBy &&
        a.describedBy === b.describedBy &&
        a.errorMessage === b.errorMessage &&
        a.expanded === b.expanded &&
        a.disabled === b.disabled &&
        a.invalid === b.invalid &&
        a.required === b.required &&
        a.busy === b.busy,
    },
  );

  const togglingOption = signal<CngxSelectOptionDef<T> | null>(null);

  const externalActivation = computed<boolean>(() => deps.commitAction() !== null);

  const commitErrorValue = computed<unknown>(() => commitState.error());

  function bindCommitRetry(
    retry: () => void,
  ): Signal<CngxSelectCommitErrorContext<T>> {
    return computed(
      () => ({
        $implicit: commitState.error(),
        error: commitState.error(),
        option: togglingOption(),
        retry,
      }),
      { equal: (a, b) => Object.is(a.error, b.error) && Object.is(a.option, b.option) },
    );
  }

  function makeErrorContext(retry: () => void): Signal<CngxSelectErrorContext> {
    return computed(
      () => ({
        $implicit: deps.state()?.error(),
        error: deps.state()?.error(),
        retry,
      }),
      { equal: (a, b) => Object.is(a.error, b.error) },
    );
  }

  function isGroup(
    item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
  ): item is CngxSelectOptionGroupDef<T> {
    return isCngxSelectOptionGroupDef(item);
  }

  function isCommittingOption(opt: CngxSelectOptionDef<T>): boolean {
    if (!isCommitting()) {
      return false;
    }
    const t = togglingOption();
    if (!t) {
      return false;
    }
    return deps.compareWith()(opt.value, t.value);
  }

  function findOption(value: T): CngxSelectOptionDef<T> | null {
    const map = valueToOptionMap();
    if (map) {
      return map.get(value as unknown) ?? null;
    }
    const eq = deps.compareWith();
    return flatOptions().find((o) => eq(o.value, value)) ?? null;
  }

  function commitErrorMessage(err: unknown): string {
    const label = deps.label();
    const aria = deps.ariaLabel();
    const fieldFallback = config.ariaLabels.fieldLabelFallback ?? 'Selection';
    const failedMessage =
      config.ariaLabels.commitFailedMessage ?? 'Save failed';
    const labelText = label !== '' ? label : (aria ?? fieldFallback);
    const detail = err instanceof Error ? err.message : undefined;
    return detail
      ? `${labelText}: ${failedMessage} — ${detail}`
      : `${labelText}: ${failedMessage}`;
  }

  // Stable identities for the core's lifetime. Adapter unwraps
  // opt.value for isSelected/isIndeterminate.
  const panelHostAdapter: CngxSelectPanelHostAdapter<T> = {
    isGroup,
    isSelected: (opt) => isSelected(opt.value),
    isIndeterminate: (opt) => isIndeterminate(opt.value),
    isCommittingOption,
  };

  function announce(
    option: CngxSelectOptionDef<T> | null,
    action: 'added' | 'removed' | 'reordered' | 'created',
    count: number,
    multi: boolean,
    fromIndex?: number,
    toIndex?: number,
  ): void {
    const announcerConfig = config.announcer;
    const perInstance = announcerInputs.announceChanges();
    const enabled = perInstance ?? announcerConfig.enabled ?? true;
    if (!enabled) {
      return;
    }
    const format = announcerInputs.announceTemplate() ?? announcerConfig.format;
    const label = deps.label();
    const aria = deps.ariaLabel();
    let fieldLabel = config.ariaLabels.fieldLabelFallback ?? 'Selection';
    if (label.length > 0) {
      fieldLabel = label;
    } else if (aria && aria.length > 0) {
      fieldLabel = aria;
    }
    const message = format({
      selectedLabel: option?.label ?? null,
      fieldLabel,
      multi,
      action,
      count,
      fromIndex,
      toIndex,
    });
    announcer.announce(message, announcerConfig.politeness);
  }

  return {
    effectiveOptions,
    flatOptions,
    unfilteredFlatOptions,
    valueToOptionMap,
    activeView,
    showRefreshIndicator,
    showInlineError,
    skeletonIndices,
    panelClassList,
    panelWidthCss,
    fallbackLabels: config.fallbackLabels,
    ariaLabels: config.ariaLabels,
    resolvedId,
    resolvedAriaLabel,
    resolvedAriaLabelledBy,
    resolvedAriaRequired,
    resolvedListboxLabel,
    resolvedShowSelectionIndicator,
    resolvedShowCaret,
    resolvedSelectionIndicatorVariant,
    resolvedSelectionIndicatorPosition,
    describedBy,
    ariaInvalid,
    ariaBusy,
    ariaReadonly,
    ariaErrorMessage,
    effectiveTabIndex,
    triggerAria,
    disabled,
    isSelected,
    isIndeterminate,
    selection,
    commitController,
    commitState,
    isCommitting,
    togglingOption,
    externalActivation,
    showCommitError,
    commitErrorValue,
    bindCommitRetry,
    makeErrorContext,
    isGroup,
    isCommittingOption,
    findOption,
    commitErrorMessage,
    announce,
    panelHostAdapter,
  };
}

/**
 * Form-field integration shape exposed by every select-family component.
 */
export type CngxSelectFormFieldControl = CngxFormFieldControl;

/**
 * Lifecycle status union for select-family outputs.
 */
export type CngxSelectStatus = AsyncStatus;
