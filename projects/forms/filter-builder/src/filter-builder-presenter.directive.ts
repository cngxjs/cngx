import {
  afterNextRender,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
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
import {
  CNGX_FILTER_BUILDER_HOST,
  type CngxFilterBuilderHost,
} from './filter-builder-host.token';
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
 */
@Directive({
  selector: '[cngxFilterBuilderPresenter]',
  exportAs: 'cngxFilterBuilder',
  standalone: true,
  providers: [
    { provide: CNGX_FILTER_BUILDER_HOST, useExisting: CngxFilterBuilderPresenter },
  ],
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
   * `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY` — swap for locale, telemetry,
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

  readonly id: Signal<string> = signal(nextUid('cngx-filter-builder-')).asReadonly();
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

  readonly disabled: Signal<boolean> = computed(
    () => this.formField?.disabled() ?? false,
  );

  /**
   * Driven by the opt-in `CngxFilterBuilderFormFieldControl` directive
   * via `setFocused`. Read-only `Signal` here.
   */
  private readonly focusedState = signal(false);
  readonly focused: Signal<boolean> = this.focusedState.asReadonly();
  setFocused(next: boolean): void {
    this.focusedState.set(next);
  }

  private readonly touched: Signal<boolean> = computed(
    () => this.formField?.touched() ?? false,
  );

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
   * Item-level predicate derived from `tree()` + `fields()`. Pillar 1 —
   * consumers read directly. No `equal:` needed, function identity is
   * sufficient.
   *
   * Returns `null` when the tree is empty (root clear), so a downstream
   * `CngxFilter.setPredicate(presenter.predicate())` drops to
   * `activeCount = 0` instead of latching a vacuous-true predicate.
   *
   * `fields()` read is try/catch — a `viewChild`-driven effect can hit
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
    // Cycle guard — ensureFilterTreeIds is identity-preserving, so the
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
        console.warn('[CngxFilterBuilder] no fields provided — empty-state branch will always render.');
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

  addGroup(path: readonly number[], group: FilterGroup): void {
    this.core.addGroup(path, group);
  }

  removeNode(path: readonly number[]): void {
    this.core.removeNode(path);
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
   * Focus the first incomplete expression's first focusable descendant;
   * falls back to the host element when no expression is incomplete. The
   * row↔presenter correlation runs through `data-cngx-filter-path` on each
   * rendered row — accepted-debt §15 for the deferred Level-2 abstraction.
   */
  focus(options?: FocusOptions): void {
    const path = findFirstIncompletePath(this.tree());
    const host = this.elementRef.nativeElement;
    if (!path) {
      host.focus(options);
      return;
    }
    const selector = `[data-cngx-filter-path="${path.join('.')}"] :is(input, [tabindex])`;
    const target = host.querySelector<HTMLElement>(selector);
    (target ?? host).focus(options);
  }
}

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

function isExpressionIncomplete(expression: FilterExpression): boolean {
  const value = expression.value;
  return value === null || value === undefined || value === '';
}

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
