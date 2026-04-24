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
} from './commit-controller';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitErrorDisplay,
} from './commit-action.types';
import {
  type CngxSelectAnnouncerConfig,
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
 * Equality function used across the select family for value-to-option
 * matching. `Object.is` is the default; consumers may supply their own
 * via `[compareWith]`.
 *
 * @category interactive
 */
export type CngxSelectCompareFn<T> = (a: T | undefined, b: T | undefined) => boolean;

/**
 * Default identity-based comparator — `Object.is`. Exported so components
 * can reference it without redeclaring the helper.
 *
 * @category interactive
 */
export const cngxSelectDefaultCompare: CngxSelectCompareFn<unknown> = (a, b) => Object.is(a, b);

/**
 * Bundled ARIA projection for a select-family trigger element. Every
 * field is `computed` from the signal graph; consumers pipe the bundle
 * into `[attr.aria-*]` bindings. A structural `equal` on the enclosing
 * `triggerAria` signal prevents redundant template re-renders.
 *
 * @category interactive
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
 * Signal-shaped inputs required by {@link createSelectCore}. The core
 * reads only signals — never component instance fields — so the factory
 * stays pure and cross-component reusable.
 *
 * @category interactive
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
  /** From the component — `popoverRef()?.isVisible() ?? false`. */
  readonly panelOpen: Signal<boolean>;
  /** Form-field error state. Usually `presenter?.showError() ?? false`. */
  readonly errorState: Signal<boolean>;
  /**
   * Optional filter overlay for `effectiveOptions` — the combobox uses
   * this to apply the inline search term. Single/Multi pass `undefined`
   * and get unfiltered options.
   */
  readonly filter?: Signal<
    ((input: CngxSelectOptionsInput<T>) => CngxSelectOptionsInput<T>) | null
  >;

  /**
   * Optional persistent local-items buffer merged on top of the
   * server-provided options **before** the filter overlay runs — the
   * action-select organisms use this to insert optimistic quick-create
   * items that survive state refetches and drop out silently once the
   * server has caught up (via `mergeLocalItems`'s compareWith-based
   * dedup).
   *
   * Variants that don't host inline workflows leave this `undefined`
   * and the merge is skipped — `effectiveOptions` stays identity-stable
   * just like it was pre-action-select.
   */
  readonly localItems?: Signal<readonly CngxSelectOptionDef<T>[]>;

  /**
   * `true` when the component stores a list of selected values (multi,
   * combobox); `false` for single-select. Drives the cascade that
   * resolves `'auto'` for {@link CngxSelectCoreDeps.selectionIndicatorVariant}
   * and routes {@link CngxSelectCore.isSelected} to the selection
   * controller vs. a scalar compareWith check.
   */
  readonly multi: Signal<boolean>;

  /**
   * Current selection snapshot. Single: `T | undefined`. Multi/Combobox:
   * `readonly T[]`. The core discriminates by `multi()` before reading —
   * the runtime shape always matches.
   */
  readonly currentSelection: Signal<T | undefined | readonly T[]>;

  /**
   * Writable selection array — only read in multi-mode. Used to
   * instantiate the shared {@link SelectionController}. Single-select
   * components pass `undefined`.
   */
  readonly multiValues?: WritableSignal<T[]>;

  /** Per-instance override for `selectionIndicatorPosition`. `null` → inherit config. */
  readonly selectionIndicatorPosition: Signal<'before' | 'after' | null>;

  /** Per-instance override for `selectionIndicatorVariant`. `null` → inherit config. */
  readonly selectionIndicatorVariant: Signal<'auto' | 'checkbox' | 'checkmark' | null>;
}

/**
 * Per-instance config for the announcer helper. Mirrors the inputs
 * Single/Multi/Combobox expose publicly.
 *
 * @category interactive
 */
export interface CngxSelectAnnouncerInputs {
  readonly announceChanges: Signal<boolean | null>;
  readonly announceTemplate: Signal<CngxSelectAnnouncerConfig['format'] | null>;
}

/**
 * Shape returned by {@link createSelectCore}. All the pure-derivation
 * signals a select-family component needs to drive its trigger +
 * panel — bundled so the component's own body stays focused on
 * value-shape specifics (single vs multi, keyboard, commit routing).
 *
 * @category interactive
 */
export interface CngxSelectCore<T, TCommit> {
  // ── Option model ────────────────────────────────────────────────────
  readonly effectiveOptions: Signal<CngxSelectOptionsInput<T>>;
  readonly flatOptions: Signal<CngxSelectOptionDef<T>[]>;
  readonly valueToOptionMap: Signal<Map<unknown, CngxSelectOptionDef<T>> | null>;
  /**
   * Flat view of the merged-but-unfiltered options (server options +
   * `localItems` buffer). Unlike {@link flatOptions}, this is NOT
   * affected by the consumer's inline search-term filter — used by the
   * combobox-family chip strip (and `CngxActionMultiSelect`) so chips
   * for selected values stay visible even when the panel's search
   * filter temporarily hides the matching option from the listbox.
   *
   * For single-value variants without a filter, this aliases
   * `flatOptions`. Always fold-safe — `selectedOptions` computeds can
   * use it uniformly.
   */
  readonly unfilteredFlatOptions: Signal<CngxSelectOptionDef<T>[]>;

  // ── Panel view ─────────────────────────────────────────────────────
  readonly activeView: Signal<AsyncView>;
  readonly showRefreshIndicator: Signal<boolean>;
  readonly showInlineError: Signal<boolean>;
  readonly skeletonIndices: Signal<number[]>;
  readonly panelClassList: Signal<string | readonly string[] | null>;
  readonly panelWidthCss: Signal<string | null>;
  /**
   * Resolved panel-shell fallback labels — library defaults merged
   * with the app's `CngxSelectConfig.fallbackLabels`. The shell reads
   * these when no custom template is projected for the corresponding
   * async view. Plain object (not a signal) because the underlying
   * config is resolved per-injector at component construction and
   * never mutates — same lifecycle contract as `panelClass`.
   */
  readonly fallbackLabels: Required<CngxSelectFallbackLabels>;

  // ── ARIA / identity ────────────────────────────────────────────────
  readonly resolvedId: Signal<string>;
  readonly resolvedAriaLabel: Signal<string | null>;
  readonly resolvedAriaLabelledBy: Signal<string | null>;
  readonly resolvedAriaRequired: Signal<boolean | null>;
  readonly resolvedListboxLabel: Signal<string>;
  readonly resolvedShowSelectionIndicator: Signal<boolean>;
  readonly resolvedShowCaret: Signal<boolean>;
  /**
   * Resolved concrete variant after the `instance > config > 'auto'`
   * cascade. `'auto'` resolves to `'checkbox'` in multi-mode, `'checkmark'`
   * in single-mode. Panel consumers bind this directly to
   * `<cngx-checkbox-indicator [variant]="…">`.
   */
  readonly resolvedSelectionIndicatorVariant: Signal<'checkbox' | 'checkmark'>;
  /**
   * Resolved position after the `instance > config > 'before'` cascade.
   */
  readonly resolvedSelectionIndicatorPosition: Signal<'before' | 'after'>;
  readonly describedBy: Signal<string | null>;
  readonly ariaInvalid: Signal<boolean | null>;
  readonly ariaBusy: Signal<boolean | null>;
  readonly ariaReadonly: Signal<boolean | null>;
  readonly ariaErrorMessage: Signal<string | null>;
  readonly effectiveTabIndex: Signal<number | null>;
  readonly triggerAria: Signal<CngxSelectTriggerAria>;

  // ── Derived disabled / empty ───────────────────────────────────────
  readonly disabled: Signal<boolean>;

  // ── Selection ──────────────────────────────────────────────────────
  /**
   * Mode-agnostic membership test. The panel always calls this — it
   * never branches on `multi()`. Single mode reads `currentSelection`
   * via `compareWith`; multi mode delegates to the
   * {@link SelectionController} fast path (identity) with a
   * `compareWith` fallback for non-default comparators.
   */
  isSelected(value: T): boolean;
  /**
   * Partial-selection test. `true` when the value represents a group
   * whose descendants are partially selected. Delegates to
   * {@link SelectionController.isIndeterminate} — for multi / combobox
   * without a `childrenFn` it is always `false`. Future tree-select
   * consumers supply `childrenFn` and this propagates automatically.
   */
  isIndeterminate(value: T): boolean;
  /**
   * Shared selection controller — `null` for single-select. Exposed as
   * an escape hatch for consumers building custom panels or advanced
   * behaviours (e.g. row-level Select-All in a future grid). The
   * controller's membership check is identity-based — consumers with a
   * custom `compareWith` should prefer {@link isSelected}.
   */
  readonly selection: Signal<SelectionController<T> | null>;

  // ── Commit infrastructure ──────────────────────────────────────────
  readonly commitController: CngxCommitController<TCommit>;
  readonly commitState: CngxAsyncState<TCommit | undefined>;
  readonly isCommitting: Signal<boolean>;
  readonly togglingOption: WritableSignal<CngxSelectOptionDef<T> | null>;
  readonly externalActivation: Signal<boolean>;
  readonly showCommitError: Signal<boolean>;
  readonly commitErrorValue: Signal<unknown>;

  /**
   * Produce a `commitErrorContext` signal wired to the caller's
   * `retryCommit` method. Call once in the component constructor and
   * cache the returned signal — the template context shape requires a
   * retry callback which is component-specific (each variant composes
   * its own commit arguments), so the core can't predefine it.
   */
  bindCommitRetry(retry: () => void): Signal<CngxSelectCommitErrorContext<T>>;

  /**
   * Produce an `errorContext` signal wired to the caller's `handleRetry`
   * method (for panel-level `[state]` errors, NOT commit-action
   * errors). Same rationale as `bindCommitRetry`.
   */
  makeErrorContext(retry: () => void): Signal<CngxSelectErrorContext>;

  // ── Helpers ────────────────────────────────────────────────────────
  isGroup(
    item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
  ): item is CngxSelectOptionGroupDef<T>;
  isCommittingOption(opt: CngxSelectOptionDef<T>): boolean;
  findOption(value: T): CngxSelectOptionDef<T> | null;
  commitErrorMessage(err: unknown): string;
  /**
   * Pre-bundled pass-through helpers the four shipped panel-hosting
   * variants expose on their `CngxSelectPanelHost` contract
   * (`isGroup`, `isSelected`, `isIndeterminate`, `isCommittingOption`).
   * Every variant used to redeclare four identical 2-line protected
   * methods delegating to the core — the bundle lets them spread these
   * into the class as a single field. Mirrors the factory style of
   * `SelectionController` / `TypeaheadController` — method identities
   * stay stable for the lifetime of the core instance, safe to pass
   * through `@Input` or bind into `ngTemplateOutlet` context without
   * churning embedded views.
   */
  readonly panelHostAdapter: CngxSelectPanelHostAdapter<T>;

  /**
   * Announce a selection change via the global live-region. The core
   * owns the cascade (per-instance input > config > library default);
   * the component only has to pass option / action / count / multi.
   *
   * `'reordered'` carries optional `fromIndex` / `toIndex` so a
   * consumer's `announceTemplate` can speak the positional delta.
   * `'created'` is emitted by the action-select organisms after a
   * successful inline `quickCreateAction` commit — the default
   * formatter reads it as "erstellt und ausgewählt". Existing
   * `'added' | 'removed'` callers keep their four-argument signature
   * untouched — the extra parameters are optional.
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
 * Bound method bundle exposed on {@link CngxSelectCore.panelHostAdapter}
 * for pass-through into each variant's `CngxSelectPanelHost` contract.
 * Methods are bound at factory-call time and stable thereafter — safe
 * to spread into a class via `= this.core.panelHostAdapter.xxx`.
 *
 * @category interactive
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
 * Factory producing the stateless signal graph shared by every
 * select-family component.
 *
 * **Why a factory (not a hostDirective).**
 * A hostDirective would force every computed into an `input/output`
 * decorator metadata slot, and the generics would collapse to
 * `unknown`. Factories preserve full typing (`<T, TCommit>`) and
 * return exactly the shape we need. Callers live in an injection
 * context (component constructor / field init), which is all the
 * factory needs — `inject(CngxFormFieldPresenter)` /
 * `inject(CngxSelectAnnouncer)` / `inject(CNGX_SELECT_CONFIG)` resolve
 * just like inside a `@Component`. The rest of cngx's `create*`
 * helpers (`createCommitController`, `createManualState`,
 * `createAsyncState`, `createTransitionTracker`) follow the same
 * convention — see `reference_api_prefix_convention.md`.
 *
 * @category interactive
 */
export function createSelectCore<T, TCommit>(
  deps: CngxSelectCoreDeps<T, TCommit>,
  announcerInputs: CngxSelectAnnouncerInputs,
): CngxSelectCore<T, TCommit> {
  const presenter = inject(CngxFormFieldPresenter, { optional: true });
  const announcer = inject(CngxSelectAnnouncer);
  const config = resolveSelectConfig();

  // ── Disabled ────────────────────────────────────────────────────────
  const disabled = computed<boolean>(
    () => deps.disabledInput() || (presenter?.disabled() ?? false),
  );

  // ── Option model ────────────────────────────────────────────────────

  /**
   * Pre-filter merge of server options + `localItems` buffer. Exposed
   * through the core as `unfilteredFlatOptions` (via flatten) so
   * chip-strip consumers (combobox, action-multi-select) can look up
   * selected options without the inline search-filter hiding chips
   * for values that don't match the current term.
   */
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
  );

  // ── Panel view ─────────────────────────────────────────────────────
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

  // ── ARIA / identity ────────────────────────────────────────────────
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

  const resolvedSelectionIndicatorVariant = computed<'checkbox' | 'checkmark'>(() => {
    const resolved = deps.selectionIndicatorVariant() ?? config.selectionIndicatorVariant;
    if (resolved === 'auto') {
      return deps.multi() ? 'checkbox' : 'checkmark';
    }
    return resolved;
  });

  // ── Selection ──────────────────────────────────────────────────────
  // Controller is instantiated once, eagerly, when multiValues is supplied
  // (i.e. the component is a multi-select or combobox). Single-select
  // passes no multiValues → controller stays null. The `selection` signal
  // is a constant readonly view — no computed needed, no closure-mutation
  // side effect inside a computed.
  //
  // Factory resolved via CNGX_SELECTION_CONTROLLER_FACTORY (DI token,
  // `providedIn: 'root'`) so consumers can swap the engine app-wide —
  // same override surface as CNGX_SELECT_COMMIT_CONTROLLER_FACTORY.
  const selectionFactory = inject(CNGX_SELECTION_CONTROLLER_FACTORY);
  const controllerInstance: SelectionController<T> | null = deps.multiValues
    ? selectionFactory<T>(deps.multiValues)
    : null;
  const selection = signal<SelectionController<T> | null>(controllerInstance).asReadonly();
  // Release the controller's per-value signal caches when the host
  // component tears down. Post-destroy reads flip to a shared
  // `Signal<false>` no-op (see selection-controller.ts), so late bindings
  // on lingering references stay safe.
  if (controllerInstance) {
    inject(DestroyRef).onDestroy(() => controllerInstance.destroy());
  }

  function isSelected(value: T): boolean {
    const eq = deps.compareWith();
    if (deps.multi()) {
      // Multi / Combobox. Controller fast path only valid for identity-
      // based compareWith — fall back to an O(n) scan for custom eqs so
      // `(a, b) => a.id === b.id` keeps working exactly like before.
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
    // Flat selection (no childrenFn wired through) → controller always
    // returns the shared Signal<false> constant. Reading () here is cheap.
    return controllerInstance?.isIndeterminate(value)() ?? false;
  }

  const describedBy = computed(() => presenter?.describedBy() ?? null);
  const ariaInvalid = computed<boolean | null>(() =>
    deps.errorState() ? true : null,
  );
  const ariaReadonly = computed<boolean | null>(() =>
    presenter?.readonly() ? true : null,
  );
  const ariaErrorMessage = computed<string | null>(() =>
    deps.errorState() ? (presenter?.errorId() ?? null) : null,
  );

  // Commit controller (needed early so ariaBusy can read commitState).
  const commitController: CngxCommitController<TCommit> =
    inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY)<TCommit>();

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

  // ── Commit infrastructure ──────────────────────────────────────────
  const togglingOption = signal<CngxSelectOptionDef<T> | null>(null);
  const commitState = commitController.state;
  const isCommitting = commitController.isCommitting;

  const externalActivation = computed<boolean>(() => deps.commitAction() !== null);

  const showCommitError = computed<boolean>(
    () => commitState.status() === 'error' && deps.commitErrorDisplay() !== 'none',
  );

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

  // ── Helpers ────────────────────────────────────────────────────────
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
    const labelText = label !== '' ? label : (aria ?? 'Auswahl');
    const detail = err instanceof Error ? err.message : undefined;
    return detail
      ? `${labelText}: Speichern fehlgeschlagen — ${detail}`
      : `${labelText}: Speichern fehlgeschlagen`;
  }

  // Pass-through bundle — methods bound once to the core's own
  // isSelected / isIndeterminate (both of which take `value: T`, so
  // the adapter unwraps `opt.value`) and the existing isGroup /
  // isCommittingOption (already opt-shaped). Stable identities for
  // the lifetime of the core — safe to destructure into a class
  // field.
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
    let fieldLabel = 'Auswahl';
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
 * Shape that every select-family component exposes to form-field
 * integration. Core derivations feed directly into the contract —
 * components expose them via the `CngxFormFieldControl` interface with
 * minimal pass-through.
 *
 * @category interactive
 */
export type CngxSelectFormFieldControl = CngxFormFieldControl;

/**
 * Union alias — every lifecycle output in the select family emits one
 * of these. Re-exported for consumer convenience.
 *
 * @category interactive
 */
export type CngxSelectStatus = AsyncStatus;
