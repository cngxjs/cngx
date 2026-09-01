import {
  afterNextRender,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  isDevMode,
  model,
  signal,
  untracked,
  type Signal,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';
import { CngxFormFieldPresenter, type CngxFormFieldControl } from '@cngx/forms/field';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';
import { injectFilterBuilderConfig } from './filter-builder.config';
import { isExpressionIncomplete } from './filter-builder-internal';
import { CNGX_FILTER_BUILDER_HOST, type CngxFilterBuilderHost } from './filter-builder-host.token';
import { EMPTY_ROOT, ensureFilterTreeIds, toFilterPredicate } from './filter-builder.helpers';
import {
  CNGX_FILTER_BUILDER_STATE_FACTORY,
  type CngxFilterBuilderState,
} from './filter-builder-state';
import { injectFilterBuilderAnnouncerFactory } from './filter-builder-announcer';

/**
 * Brain of `<cngx-filter-builder>`. Hosts the state factory bound to a
 * `model<FilterGroup>` for `[(value)]` two-way binding, and provides
 * `CNGX_FILTER_BUILDER_HOST` via `useExisting` so the recursive context
 * atoms read one source of truth. Implements `CngxFormFieldControl`
 * (id / empty / disabled / focused / errorState / focus); the
 * disabled / focused / errorState scalars derive from the ambient
 * `CngxFormFieldPresenter` when the opt-in
 * `CngxFilterBuilderFormFieldControl` directive is applied.
 *
 * @category forms/filter-builder
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-presenter.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilder, CngxFilterBuilderFormFieldControl, CngxFilterGroup, CngxFilterExpression
 * <example-url>http://localhost:4200/#/forms/filter-builder/basic-two-way-binding-json-inspection</example-url>
 * <example-url>http://localhost:4200/#/forms/filter-builder/seeded-tree-and-or-composition</example-url>
 */
@Directive({
  selector: '[cngxFilterBuilderPresenter]',
  exportAs: 'cngxFilterBuilder',
  standalone: true,
  providers: [{ provide: CNGX_FILTER_BUILDER_HOST, useExisting: CngxFilterBuilderPresenter }],
})
export class CngxFilterBuilderPresenter<TValue = unknown>
  implements CngxFilterBuilderHost<TValue>, CngxFormFieldControl
{
  readonly fields = input.required<readonly FilterFieldDef<TValue>[]>();

  readonly value = model<FilterGroup>(EMPTY_ROOT);

  private readonly config = injectFilterBuilderConfig();

  private readonly stateFactory = inject(CNGX_FILTER_BUILDER_STATE_FACTORY);

  private readonly core: CngxFilterBuilderState<TValue> = this.stateFactory<TValue>({
    source: this.value,
    fields: this.fields,
  });

  readonly tree = this.core.tree;
  readonly fieldMap = this.core.fieldMap;
  readonly lastMutation = this.core.lastMutation;
  readonly isEmpty = this.core.isEmpty;

  /**
   * Live-region announcement text. Built via
   * `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY` - swap for locale, telemetry,
   * or test doubles. Default formatter resolves `fieldKey` through
   * `fieldMap` for human-readable labels.
   */
  private readonly announcerFactory = injectFilterBuilderAnnouncerFactory();
  private readonly announcer = this.announcerFactory<TValue>({
    lastMutation: this.lastMutation,
    fieldMap: this.fieldMap,
    i18n: this.config.i18n,
  });
  readonly announcement: Signal<string> = this.announcer.announcement;

  /** `CngxFormFieldControl` id - stable per-instance, generated once. */
  readonly id: Signal<string> = signal(nextUid('cngx-filter-builder-')).asReadonly();

  /** `CngxFormFieldControl` empty - true while the tree carries no expressions. */
  readonly empty: Signal<boolean> = this.core.isEmpty;

  /**
   * Ambient form-field presenter, if any. `disabled` / `touched` reads run
   * through `computed()` so the derivation graph stays pure.
   */
  private readonly formField = inject(CngxFormFieldPresenter, {
    optional: true,
    skipSelf: true,
  });

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly injector = inject(Injector);

  /**
   * `CngxFormFieldControl` disabled - mirrors the ambient form-field
   * presenter when the opt-in `CngxFilterBuilderFormFieldControl` is
   * applied; `false` otherwise.
   */
  readonly disabled: Signal<boolean> = computed(() => this.formField?.disabled() ?? false);

  /**
   * Driven by the opt-in `CngxFilterBuilderFormFieldControl` directive
   * via `setFocused`. Read-only `Signal` here.
   */
  private readonly focusedState = signal(false);
  readonly focused: Signal<boolean> = this.focusedState.asReadonly();

  /**
   * @internal Write surface for the `focused` signal, called by the
   * `CngxFilterBuilderFormFieldControl` directive's host listeners. Not
   * a consumer API - flip the input the directive owns instead.
   */
  setFocused(next: boolean): void {
    this.focusedState.set(next);
  }

  private readonly touched: Signal<boolean> = computed(() => this.formField?.touched() ?? false);

  /**
   * `touched && incompleteCount > 0`. The touched gate keeps the initial
   * empty tree from surfacing as invalid before any user interaction.
   * Without an ambient form-field presenter, `touched` is `false`, so
   * standalone use never flips `errorState`.
   */
  readonly errorState: Signal<boolean> = computed(
    () => this.touched() && countIncompleteExpressions(this.tree()) > 0,
  );

  /**
   * Item-level predicate derived from `tree()` + `fields()`. Pillar 1 -
   * consumers read directly. No `equal:` needed, function identity is
   * sufficient.
   *
   * Returns `null` when the tree is empty (root clear), so a downstream
   * `CngxFilter.setPredicate(presenter.predicate())` drops to
   * `activeCount = 0` instead of latching a vacuous-true predicate.
   *
   * `fields()` read is try/catch - a `viewChild`-driven effect can hit
   * `predicate()` before the host-directive input setter propagates, and
   * `input.required` throws NG0950. Returning `null` until the binding
   * lands matches the "no filter" semantics.
   */
  readonly predicate: Signal<((item: TValue) => boolean) | null> = computed(() => {
    if (this.isEmpty()) {
      return null;
    }
    let fields: readonly FilterFieldDef<TValue>[];
    try {
      fields = this.fields();
    } catch {
      return null;
    }
    return toFilterPredicate<TValue>(this.tree(), fields);
  });

  constructor() {
    // Cycle guard - ensureFilterTreeIds is identity-preserving, so the
    // write-back only fires for foreign values and the effect re-runs no-op.
    effect(() => {
      const current = this.value();
      const normalised = ensureFilterTreeIds(current);
      if (normalised !== current) {
        untracked(() => this.value.set(normalised));
      }
    });

    afterNextRender(() => {
      if (!isDevMode()) {
        return;
      }
      if (this.fields().length === 0) {
        console.warn(
          '[CngxFilterBuilder] no fields provided - empty-state branch will always render.',
        );
      }
      const fieldKeys = new Set(this.fields().map((f) => f.key));
      const unknown = new Set<string>();
      collectExpressionFieldKeys(this.tree(), fieldKeys, unknown);
      if (unknown.size > 0) {
        console.warn(
          `[CngxFilterBuilder] value() references unknown field key(s): ${[...unknown].join(', ')}`,
        );
      }
    });
  }

  addExpression(path: readonly number[], expression: FilterExpression): void {
    this.core.addExpression(path, expression);
  }

  /**
   * Adds `group` under the group at `path`. No-op beyond
   * `maxNestingDepth`: a group appended at `path` sits at depth
   * `path.length + 1` (root is depth 0), and the config cap applies to
   * programmatic writes exactly like to the add-group UI.
   */
  addGroup(path: readonly number[], group: FilterGroup): void {
    if (path.length >= this.config.maxNestingDepth) {
      if (isDevMode()) {
        console.warn(
          `[CngxFilterBuilder] addGroup at depth ${path.length + 1} exceeds maxNestingDepth ` +
            `${this.config.maxNestingDepth} - ignored. Raise it via withMaxNestingDepth(...).`,
        );
      }
      return;
    }
    this.core.addGroup(path, group);
  }

  /**
   * Removes the node at `path`. When the removal unmounts the DOM that
   * currently holds focus (the row's remove button, an editor input), focus
   * is restored after the next render: to the sibling that slid into the
   * removed index, else the previous sibling, else the parent group
   * container - instead of dropping to `<body>`.
   */
  removeNode(path: readonly number[]): void {
    const restoreFocus = this.shouldRestoreFocusAfterRemove(path);
    this.core.removeNode(path);
    if (restoreFocus) {
      this.scheduleRemovalFocusRestore(path);
    }
  }

  setLogic(path: readonly number[], logic: FilterLogic): void {
    this.core.setLogic(path, logic);
  }

  toggleNegated(path: readonly number[]): void {
    this.core.toggleNegated(path);
  }

  setField(path: readonly number[], fieldKey: string): void {
    this.core.setField(path, fieldKey);
  }

  setOperator(path: readonly number[], operator: string): void {
    this.core.setOperator(path, operator);
  }

  setValue(path: readonly number[], value: unknown): void {
    this.core.setValue(path, value);
  }

  getNodeAtPath(path: readonly number[]): FilterNode | null {
    return this.core.getNodeAtPath(path);
  }

  getFieldDef(fieldKey: string): FilterFieldDef<TValue> | undefined {
    return this.core.getFieldDef(fieldKey);
  }

  /**
   * True when the node at `path` exists and the DOM about to be unmounted
   * contains the active element. Read before the tree write so the check
   * sees the pre-removal DOM.
   */
  private shouldRestoreFocusAfterRemove(path: readonly number[]): boolean {
    if (path.length === 0 || !this.core.getNodeAtPath(path)) {
      return false;
    }
    const host = this.elementRef.nativeElement;
    const active = host.ownerDocument.activeElement;
    const removedEl = host.querySelector(`[data-cngx-filter-path="${path.join('.')}"]`);
    return !!active && !!removedEl && removedEl.contains(active);
  }

  /**
   * After the next render, focus the first focusable inside the node that
   * now occupies the removed index (or the last remaining sibling), falling
   * back to the parent group container, then the host.
   */
  private scheduleRemovalFocusRestore(path: readonly number[]): void {
    const parentPath = path.slice(0, -1);
    const removedIndex = path[path.length - 1];
    afterNextRender(
      () => {
        const host = this.elementRef.nativeElement;
        const parent = this.core.getNodeAtPath(parentPath);
        const siblingCount = parent?.type === 'group' ? parent.filters.length : 0;
        const containerPath =
          siblingCount > 0
            ? [...parentPath, Math.min(removedIndex, siblingCount - 1)]
            : parentPath;
        const container = host.querySelector<HTMLElement>(
          `[data-cngx-filter-path="${containerPath.join('.')}"]`,
        );
        // When the tree emptied, the group container is gone too (the empty
        // state renders instead) - fall back to the first focusable in the
        // host, which is the empty state's add-filter button.
        const target =
          container?.querySelector<HTMLElement>(':is(input, button, [tabindex])') ??
          container ??
          host.querySelector<HTMLElement>(':is(input, button, [tabindex])') ??
          host;
        target.focus();
      },
      { injector: this.injector },
    );
  }

  /**
   * Focus the first incomplete expression's first focusable descendant;
   * falls back to the host element when no expression is incomplete. The
   * row↔presenter correlation runs through the `data-cngx-filter-path`
   * attribute each rendered row carries.
   */
  focus(options?: FocusOptions): void {
    const path = findFirstIncompletePath(this.tree());
    const host = this.elementRef.nativeElement;
    if (!path) {
      host.focus(options);
      return;
    }
    // Include <button> so the call lands on the remove control / cngx-select
    // trigger button instead of degrading to the host when no <input> sits
    // on the incomplete row (boolean editor, empty field).
    const selector = `[data-cngx-filter-path="${path.join('.')}"] :is(input, button, [tabindex])`;
    const target = host.querySelector<HTMLElement>(selector);
    (target ?? host).focus(options);
  }
}

/** @internal */
function findFirstIncompletePath(
  group: FilterGroup,
  path: readonly number[] = [],
): readonly number[] | null {
  for (let i = 0; i < group.filters.length; i++) {
    const child = group.filters[i];
    const childPath = [...path, i];
    if (child.type === 'expression') {
      if (isExpressionIncomplete(child)) {
        return childPath;
      }
    } else {
      const inner = findFirstIncompletePath(child, childPath);
      if (inner) {
        return inner;
      }
    }
  }
  return null;
}

/** @internal */
function countIncompleteExpressions(group: FilterGroup): number {
  let count = 0;
  for (const child of group.filters) {
    if (child.type === 'expression') {
      if (isExpressionIncomplete(child)) {
        count += 1;
      }
    } else {
      count += countIncompleteExpressions(child);
    }
  }
  return count;
}

/** @internal */
function collectExpressionFieldKeys(
  group: FilterGroup,
  knownKeys: ReadonlySet<string>,
  unknown: Set<string>,
): void {
  for (const child of group.filters) {
    if (child.type === 'expression') {
      if (!knownKeys.has(child.field)) {
        unknown.add(child.field);
      }
    } else {
      collectExpressionFieldKeys(child, knownKeys, unknown);
    }
  }
}
