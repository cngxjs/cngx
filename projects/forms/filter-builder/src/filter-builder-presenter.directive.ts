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
 * Thin presenter directive. Instantiates `createFilterBuilderState` against
 * its own `model<FilterGroup>` so two-way `[(value)]` binding writes through
 * mutators. Provides `CNGX_FILTER_BUILDER_HOST` via `useExisting` so the
 * recursive context atoms bind against one source of truth.
 *
 * The `CngxFormFieldControl` surface ships minimal scalars here
 * (id/empty/disabled/focused/errorState); Phase 6 wires error derivation,
 * focus delegation, and reactive-required against the field's
 * validator graph.
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
   * Live-region announcement text. Built via the swappable
   * `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY` token — consumers override
   * the factory for locale, telemetry, or test doubles without touching
   * the presenter. Default formatter resolves `fieldKey` through `fieldMap`
   * to surface human-readable labels.
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
   * Ambient form-field presenter the builder sits inside, if any. Looked up
   * once at construction; reads on `disabled`/`touched` flow through
   * `computed()` so the presenter stays a pure derivation graph.
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
   * Toggled by `CngxFilterBuilderFormFieldControl` host `(focusin)` /
   * `(focusout)` bindings. The form-field-control directive owns the
   * write surface; the presenter exposes it as a read-only `Signal`.
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
   * `true` when at least one expression in the tree has an empty value
   * AND the field has been touched. The `touched()` gate keeps an empty
   * initial tree from surfacing as invalid before the consumer interacts.
   * When no form-field presenter is present (standalone use without the
   * `CngxFilterBuilderFormFieldControl` directive), `touched` is `false`
   * so `errorState` stays `false`.
   */
  readonly errorState: Signal<boolean> = computed(
    () => this.touched() && countIncompleteExpressions(this.tree()) > 0,
  );

  /**
   * Item-level predicate derived from the current `tree()` and `fields()`.
   * Pillar 1 — derive, do not push: consumers read this signal directly
   * (e.g. `filter.setPredicate(presenter.predicate())` inside an `effect`,
   * or as a dependency of any `computed` reading the filtered list). No
   * `equal:` is required — function identity is sufficient downstream
   * because every consumer treats the predicate as an opaque callable.
   *
   * Returns `null` when the tree carries no expressions (root-level clear),
   * so `CngxFilter.setPredicate(presenter.predicate())` cascades to
   * `activeCount = 0` instead of latching a vacuous-true predicate that
   * still counts as an active filter.
   *
   * Defensive read of `fields()`: a `viewChild`-driven effect can resolve
   * the presenter and read `predicate()` before the host-directive `fields`
   * input setter has propagated, in which case `input.required` throws
   * NG0950. Returning `null` until the binding lands matches the
   * "no filter" semantics consumers already handle.
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
    // Normalise consumer-supplied trees so every node carries a stable id.
    // `ensureFilterTreeIds` short-circuits to the same reference when the
    // tree is already normalised, so the write-back only fires once per
    // foreign value and the effect re-runs without writing.
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
   * Move DOM focus to the first incomplete expression's first focusable
   * descendant. Falls back to the host element when the tree has no
   * incomplete expression. The row↔presenter correlation runs through the
   * `data-cngx-filter-path` attribute on each rendered expression row —
   * see accepted-debt §15 for the deferred Level-2 abstraction.
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
