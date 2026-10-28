import {
  computed,
  DestroyRef,
  inject,
  signal,
  untracked,
  type Signal,
  type WritableSignal,
} from '@angular/core';

import {
  CNGX_DEV_DESCRIPTORS,
  CNGX_SELECTION_CONTROLLER_FACTORY,
  nextUid,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import type {
  CngxPopoverPresentation,
  CngxPopoverPresentationRequest,
} from '@cngx/common/popover';

import { CngxFormFieldPresenter, createFieldControlAria } from '@cngx/forms/field';

import { CngxSelectAnnouncer } from '../announcer';
import { sameArrayContents } from './compare';
import {
  CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitController,
} from '../commit-controller.token';
import type { CngxSelectCommitAction, CngxSelectCommitErrorDisplay } from '../commit-action.types';
import { type CngxSelectAnnouncerConfig, type CngxSelectFallbackLabels } from '../config';
import {
  flattenSelectOptions,
  isCngxSelectOptionGroupDef,
  mergeLocalItems,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from '../option.model';
import { resolveSelectConfig } from './resolve-config';
import type { CngxResolvedSelectAriaLabels } from './resolve-labels';
import type { CngxSelectCommitErrorContext, CngxSelectErrorContext } from '../template-slots';

/**
 * Value-to-option equality. Default `Object.is`; override via `[compareWith]`.
 */
export type CngxSelectCompareFn<T> = (a: T | undefined, b: T | undefined) => boolean;

/**
 * Identity comparator - `Object.is`.
 *
 * @internal
 */
export const cngxSelectDefaultCompare: CngxSelectCompareFn<unknown> = (a, b) => Object.is(a, b);

/**
 * ARIA projection for the trigger. Bundle is structural-equal to keep
 * `[attr.aria-*]` bindings stable.
 *
 * @internal
 */
export interface CngxSelectTriggerAria {
  readonly label: string | null;
  readonly labelledBy: string | null;
  readonly describedBy: string | null;
  readonly errorMessage: string | null;
  readonly disabled: boolean | null;
  readonly invalid: boolean | null;
  readonly required: boolean | null;
  readonly busy: boolean | null;
}

/**
 * Signal inputs for {@link createSelectCore}. Core reads signals only -
 * never component instance fields.
 *
 * @internal
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

  /** Per-instance `[presentation]`; `undefined` → inherit `CNGX_SELECT_CONFIG.mobileSheet`. */
  readonly presentationInput?: Signal<CngxPopoverPresentationRequest | undefined>;

  /** Resolved sheet presentation. The trigger-width rule only applies while `'anchored'`. */
  readonly presentation?: Signal<CngxPopoverPresentation>;

  /**
   * Message of a failed quick-create (action variants), `null` while none
   * shows. Marks the trigger invalid and fills the commit-error node, but
   * never drives `showCommitError`: the banner's Retry replays the select
   * commit, not the create.
   */
  readonly createErrorMessage?: Signal<string | null>;

  /**
   * Id of the node that describes the whole selection while the input
   * variants show the one-line summary, `null` while it does not apply.
   * Joined after the field and commit-error references.
   */
  readonly summaryDescribedBy?: Signal<string | null>;
}

/**
 * Per-instance announcer inputs.
 *
 * @internal
 */
export interface CngxSelectAnnouncerInputs {
  readonly announceChanges: Signal<boolean | null>;
  readonly announceTemplate: Signal<CngxSelectAnnouncerConfig['format'] | null>;
}

/**
 * Output of {@link createSelectCore} - pure-derivation signals shared by
 * every select-family component.
 *
 * @internal
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
  /** `null` outside the anchored presentation: the sheet owns the inline size. */
  readonly panelWidthCss: Signal<string | null>;
  /**
   * Presentation the panel asks `CngxPopoverSheet` for:
   * `[presentation]` → `mobileSheet: 'off'` as `'anchored'` → `'auto'`.
   */
  readonly resolvedPresentationRequest: Signal<CngxPopoverPresentationRequest>;
  /** Resolved `CNGX_SELECT_CONFIG.fallbackLabels`; follows a language flip. */
  readonly fallbackLabels: Signal<Required<CngxSelectFallbackLabels>>;
  /** Resolved `CNGX_SELECT_CONFIG.ariaLabels`. Forwarded onto the panel host. */
  readonly ariaLabels: Signal<CngxResolvedSelectAriaLabels>;

  readonly resolvedId: Signal<string>;
  readonly resolvedAriaLabel: Signal<string | null>;
  readonly resolvedAriaLabelledBy: Signal<string | null>;
  readonly resolvedAriaRequired: Signal<boolean | null>;
  readonly resolvedListboxLabel: Signal<string>;
  /**
   * Placeholder text every variant shows while nothing is selected:
   * `placeholder || label || ''`, so an empty `placeholder` input falls back
   * to the visible label instead of leaving the field blank.
   */
  readonly resolvedPlaceholder: Signal<string>;
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
  /**
   * Id of the visually hidden commit-error node each host renders outside the
   * popover. Referenced from the trigger only while a commit error shows.
   */
  readonly commitErrorId: string;
  /** Text of the commit-error node; `''` while no commit error shows. */
  readonly commitErrorText: Signal<string>;
  /**
   * Id of the element carrying the popup role (`role="listbox"` or
   * `role="tree"`); the trigger's `aria-controls` names it while anchored.
   */
  readonly listboxId: string;
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
   * is identity-based - consumers with custom `compareWith` should
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
  /** Failed quick-create sentence for the draft label `option`. */
  createFailedMessage(option: string, err: unknown): string;
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
 *
 * @internal
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
 * @internal Sheet presentation cascade of the select family:
 * `[presentation]` → `mobileSheet: 'off'` as `'anchored'` → `'auto'`.
 * Read by {@link createSelectCore} as `resolvedPresentationRequest`.
 */
export function createPresentationRequest(
  input: Signal<CngxPopoverPresentationRequest | undefined> | undefined,
  mobileSheet: 'auto' | 'off',
): Signal<CngxPopoverPresentationRequest> {
  return computed(() => input?.() ?? (mobileSheet === 'off' ? 'anchored' : 'auto'));
}

/**
 * Stateless signal graph shared by every select-family component.
 *
 * Factory rather than hostDirective: hostDirective collapses generics
 * to `unknown` through the input/output decorator metadata slot, so a
 * typed factory wins. Injection context required.
 *
 * @internal
 */
export function createSelectCore<T, TCommit>(
  deps: CngxSelectCoreDeps<T, TCommit>,
  announcerInputs: CngxSelectAnnouncerInputs,
): CngxSelectCore<T, TCommit> {
  const presenter = inject(CngxFormFieldPresenter, { optional: true });
  const announcer = inject(CngxSelectAnnouncer);
  const config = resolveSelectConfig();

  // Built early so the field ARIA below can read commit state.
  const commitController: CngxCommitController<TCommit> = inject(
    CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  )<TCommit>();
  // A commit that settles after the host is gone must neither write, emit
  // nor announce: cancel supersedes it and keeps the last status.
  inject(DestroyRef).onDestroy(() => commitController.cancel());
  const commitState = commitController.state;
  const isCommitting = commitController.isCommitting;
  // `aria-invalid` projects both form-field validation and a
  // failed commit. The trigger surface CSS keys off this single attribute
  // so the closed-panel error case stays visible to sighted users without
  // duplicating the predicate in every variant.
  const showCommitError = computed<boolean>(
    () => commitState.status() === 'error' && deps.commitErrorDisplay() !== 'none',
  );

  // Field half of the trigger ARIA: the one projection every field control
  // shares, with the select's own id, labelledby, required, failed commit and
  // loading / committing state fed in as control-side hooks.
  const fieldAria = createFieldControlAria(presenter, {
    idOverride: deps.idInput,
    labelledByOverride: deps.ariaLabelledBy,
    localDisabled: deps.disabledInput,
    localRequired: deps.requiredInput,
    localInvalid: () => showCommitError() || (deps.createErrorMessage?.() ?? null) !== null,
    localBusy: () => {
      const s = deps.state();
      if (s && (s.isLoading() || s.isPending() || s.isRefreshing())) {
        return true;
      }
      return isCommitting();
    },
  });

  const disabled = fieldAria.disabled;

  // Pre-filter merge of server options + `localItems`. Flattened into
  // `unfilteredFlatOptions` so chip strips bypass the search filter.
  const mergedOptions = computed<CngxSelectOptionsInput<T>>(() => {
    const s = deps.state();
    const all = s?.data() ?? deps.options();
    const local = deps.localItems?.() ?? [];
    return local.length > 0 ? mergeLocalItems(all, local, deps.compareWith()) : all;
  });

  const effectiveOptions = computed<CngxSelectOptionsInput<T>>(() => {
    const merged = mergedOptions();
    const f = deps.filter?.();
    return f ? f(merged) : merged;
  });

  const flatOptionsEqual = (a: CngxSelectOptionDef<T>[], b: CngxSelectOptionDef<T>[]): boolean =>
    sameArrayContents(a, b, Object.is);

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
      // Unfiltered: a search term that hides the selected option must not
      // drop it from value resolution (the trigger would flicker to empty).
      const map = new Map<unknown, CngxSelectOptionDef<T>>();
      for (const opt of unfilteredFlatOptions()) {
        map.set(opt.value as unknown, opt);
      }
      return map;
    },
    {
      // Structural equal - same size + Object.is per (key, value).
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

  const showInlineError = computed<boolean>(() => activeView() === 'content+error');

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
    if ((deps.presentation?.() ?? 'anchored') !== 'anchored') {
      return null;
    }
    const w = deps.panelWidth();
    if (w === null) {
      return 'auto';
    }
    if (w === 'trigger') {
      return 'anchor-size(width)';
    }
    return `${w}px`;
  });

  const resolvedPresentationRequest = createPresentationRequest(
    deps.presentationInput,
    config.mobileSheet,
  );

  const resolvedId = fieldAria.id;
  const resolvedAriaLabelledBy = fieldAria.labelledBy;

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

  const resolvedAriaRequired = fieldAria.ariaRequired;

  const resolvedPlaceholder = computed<string>(() => deps.placeholder() || deps.label() || '');

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
    return config.ariaLabels().listboxFallback;
  });

  const resolvedShowSelectionIndicator = computed<boolean>(() => !deps.hideSelectionIndicator());

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
  const selection = signal<SelectionController<T> | null>(
    controllerInstance,
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? { debugName: 'selectCore.selection' }
      : undefined,
  ).asReadonly();
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

  // The commit-error node lives outside the popover, so a closed panel still
  // leaves the failure reachable from the trigger. The field error keeps the
  // single-IDREF aria-errormessage; the commit error then rides on
  // aria-describedby.
  const commitErrorId = nextUid('cngx-select-commit-error');
  const listboxId = nextUid('cngx-select-listbox');
  const commitErrorText = computed<string>(() => {
    const select = showCommitError() ? commitErrorMessage(commitState.error()) : null;
    return [select, deps.createErrorMessage?.() ?? null].filter(Boolean).join(' ');
  });
  const commitErrorShown = computed<boolean>(() => commitErrorText() !== '');
  const describedBy = computed<string | null>(() => {
    const commitRef = commitErrorShown() ? commitErrorId : null;
    const summaryRef = deps.summaryDescribedBy?.() ?? null;
    return [fieldAria.describedBy(), commitRef, summaryRef].filter(Boolean).join(' ') || null;
  });
  const ariaInvalid = fieldAria.ariaInvalid;
  const ariaReadonly = fieldAria.ariaReadonly;
  const ariaErrorMessage = computed<string | null>(
    () => fieldAria.ariaErrorMessage() ?? (commitErrorShown() ? commitErrorId : null),
  );
  const ariaBusy = fieldAria.ariaBusy;

  const effectiveTabIndex = computed<number | null>(() => (disabled() ? -1 : deps.tabIndex()));

  const triggerAria = computed<CngxSelectTriggerAria>(
    () => ({
      label: resolvedAriaLabel(),
      labelledBy: resolvedAriaLabelledBy(),
      describedBy: describedBy(),
      errorMessage: ariaErrorMessage(),
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
        a.disabled === b.disabled &&
        a.invalid === b.invalid &&
        a.required === b.required &&
        a.busy === b.busy,
    },
  );

  const togglingOption = signal<CngxSelectOptionDef<T> | null>(null);

  const externalActivation = computed<boolean>(() => deps.commitAction() !== null);

  const commitErrorValue = computed<unknown>(() => commitState.error());

  function bindCommitRetry(retry: () => void): Signal<CngxSelectCommitErrorContext<T>> {
    return computed(
      () => ({
        $implicit: commitState.error(),
        error: commitState.error(),
        option: togglingOption(),
        retry,
      }),
      {
        equal: (a, b) => Object.is(a.error, b.error) && Object.is(a.option, b.option),
        ...(typeof ngDevMode !== 'undefined' && ngDevMode
          ? { debugName: 'selectCore.commitErrorContext' }
          : {}),
      },
    );
  }

  function makeErrorContext(retry: () => void): Signal<CngxSelectErrorContext> {
    return computed(
      () => ({
        $implicit: deps.state()?.error(),
        error: deps.state()?.error(),
        retry,
      }),
      {
        equal: (a, b) => Object.is(a.error, b.error),
        ...(typeof ngDevMode !== 'undefined' && ngDevMode
          ? { debugName: 'selectCore.errorContext' }
          : {}),
      },
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
    return unfilteredFlatOptions().find((o) => eq(o.value, value)) ?? null;
  }

  // Read untracked by the commit-error announcer, so a language flip never
  // re-runs the effect that announced it.
  function commitErrorMessage(err: unknown): string {
    const detail = err instanceof Error ? err.message : undefined;
    return config.ariaLabels().commitFailedMessage(failureLabelText(), detail);
  }

  function createFailedMessage(option: string, err: unknown): string {
    const detail = err instanceof Error ? err.message : undefined;
    return config.ariaLabels().createFailedMessage(failureLabelText(), option, detail);
  }

  // An empty aria-label names nothing: same rule as `announce`.
  function failureLabelText(): string {
    const label = deps.label();
    if (label !== '') {
      return label;
    }
    const aria = deps.ariaLabel();
    if (aria && aria.length > 0) {
      return aria;
    }
    return config.ariaLabels().fieldLabelFallback;
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
    // Announcing is a side effect: nothing read here may subscribe a reactive
    // caller, so a language flip (copy or a consumer formatter) never re-runs
    // the effect that announced.
    untracked(() => {
      const enabled = announcerInputs.announceChanges() ?? config.announcer().enabled ?? true;
      if (!enabled) {
        return;
      }
      const format = announcerInputs.announceTemplate() ?? config.announcer().format;
      const label = deps.label();
      const aria = deps.ariaLabel();
      let fieldLabel = config.ariaLabels().fieldLabelFallback;
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
      announcer.announce(message, config.announcer().politeness);
    });
  }

  const core: CngxSelectCore<T, TCommit> = {
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
    resolvedPresentationRequest,
    fallbackLabels: config.fallbackLabels,
    ariaLabels: config.ariaLabels,
    resolvedId,
    resolvedAriaLabel,
    resolvedAriaLabelledBy,
    resolvedAriaRequired,
    resolvedListboxLabel,
    resolvedPlaceholder,
    resolvedShowSelectionIndicator,
    resolvedShowCaret,
    resolvedSelectionIndicatorVariant,
    resolvedSelectionIndicatorPosition,
    describedBy,
    ariaInvalid,
    ariaBusy,
    ariaReadonly,
    ariaErrorMessage,
    commitErrorId,
    commitErrorText,
    listboxId,
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
    createFailedMessage,
    announce,
    panelHostAdapter,
  };
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    CNGX_DEV_DESCRIPTORS.tag(core, {
      kind: 'cngx-dev:factory',
      factory: 'createSelectCore',
      inputs: { deps, announcerInputs },
    });
  }
  return core;
}
