import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  inject,
} from '@angular/core';

import {
  injectFilterBuilderConfig,
  isNativeEditor,
  type CngxFilterEditor,
} from './filter-builder.config';
import type {
  CngxFilterBuilderAddFilterButtonContext as AddFilterButtonCtx,
  CngxFilterBuilderAddGroupButtonContext as AddGroupButtonCtx,
  CngxFilterBuilderErrorContext as ErrorCtx,
  CngxFilterBuilderExpressionTemplateContext as ExpressionTemplateCtx,
  CngxFilterBuilderGroupTemplateContext as GroupTemplateCtx,
  CngxFilterBuilderLogicToggleContext as LogicToggleCtx,
  CngxFilterBuilderRemoveButtonContext as RemoveButtonCtx,
} from './filter-builder-slots';
import {
  CngxFilterBuilderAddFilterButton,
  CngxFilterBuilderAddGroupButton,
  CngxFilterBuilderEmpty,
  CngxFilterBuilderError,
  CngxFilterBuilderExpressionTemplate,
  CngxFilterBuilderGroupTemplate,
  CngxFilterBuilderLoading,
  CngxFilterBuilderLogicToggle,
  CngxFilterBuilderRemoveButton,
} from './filter-builder-slots';
import { injectFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
import { CngxFilterGroup } from './filter-builder-group.directive';
import { CngxFilterExpression } from './filter-builder-expression.directive';
import { createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import { injectFilterEditors } from './filter-builder.tokens';
import type { FilterExpression, FilterGroup, FilterLogic, FilterNode } from './filter-builder.types';

/**
 * Recursive query-builder component. Brain lives entirely in
 * `CngxFilterBuilderPresenter` (host directive); this component owns the
 * skin: recursive template, native default editor rendering, slot
 * fall-through, and the live-region announcer text-bind.
 *
 * Phase 5 ships a working synchronous announcer driven by
 * `presenter.announcement` (a `computed` over `lastMutation` + config
 * i18n). Phase 6 lifts the formatter behind a swappable factory token
 * without changing this component's template.
 */
@Component({
  selector: 'cngx-filter-builder',
  exportAs: 'cngxFilterBuilder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxFilterBuilderPresenter,
      inputs: ['fields', 'value', 'cngxFilterBuilderState'],
      outputs: ['valueChange'],
    },
  ],
  imports: [NgComponentOutlet, NgTemplateOutlet, CngxFilterGroup, CngxFilterExpression],
  templateUrl: './filter-builder.component.html',
  styleUrl: './filter-builder.component.css',
})
export class CngxFilterBuilder {
  protected readonly presenter = inject(CngxFilterBuilderPresenter);
  protected readonly config = injectFilterBuilderConfig();
  protected readonly editors = injectFilterEditors();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.addFilterButtonContextCache.clear();
      this.addGroupButtonContextCache.clear();
      this.removeButtonContextCache.clear();
      this.logicToggleContextCache.clear();
      this.groupTemplateContextCache.clear();
      this.expressionTemplateContextCache.clear();
    });
  }

  protected readonly loadingSlot = contentChild(CngxFilterBuilderLoading);
  protected readonly errorSlot = contentChild(CngxFilterBuilderError);
  protected readonly emptySlot = contentChild(CngxFilterBuilderEmpty);
  protected readonly expressionTemplateSlot = contentChild(CngxFilterBuilderExpressionTemplate);
  protected readonly groupTemplateSlot = contentChild(CngxFilterBuilderGroupTemplate);
  protected readonly addFilterButtonSlot = contentChild(CngxFilterBuilderAddFilterButton);
  protected readonly addGroupButtonSlot = contentChild(CngxFilterBuilderAddGroupButton);
  protected readonly removeButtonSlot = contentChild(CngxFilterBuilderRemoveButton);
  protected readonly logicToggleSlot = contentChild(CngxFilterBuilderLogicToggle);

  protected readonly templates = injectFilterBuilderTemplateRegistry({
    loading: this.loadingSlot,
    error: this.errorSlot,
    empty: this.emptySlot,
    expressionTemplate: this.expressionTemplateSlot,
    groupTemplate: this.groupTemplateSlot,
    addFilterButton: this.addFilterButtonSlot,
    addGroupButton: this.addGroupButtonSlot,
    removeButton: this.removeButtonSlot,
    logicToggle: this.logicToggleSlot,
  });

  protected readonly logicOptions = computed(() => this.config.logicOptions);
  protected readonly negationEnabled = computed(() => this.config.negationEnabled);

  protected readonly emptyContext = computed(
    () => ({
      addFilter: () => this.addFilterAt([]),
      addGroup: () => this.addGroupAt([]),
    }),
    { equal: () => true },
  );

  protected readonly loadingContext = computed(
    () => ({
      skeletonCount: 3,
    }),
    { equal: () => true },
  );

  protected readonly errorSlotContext = computed<ErrorCtx>(() => ({
    error: this.presenter.state.error(),
    retry: () => undefined,
  }));

  private readonly addFilterButtonContextCache = new Map<string, AddFilterButtonCtx>();
  private readonly addGroupButtonContextCache = new Map<string, AddGroupButtonCtx>();
  private readonly removeButtonContextCache = new Map<string, RemoveButtonCtx>();
  private readonly logicToggleContextCache = new Map<string, LogicToggleCtx>();

  protected addFilterButtonContext(path: readonly number[]): AddFilterButtonCtx {
    const key = path.join('.');
    let ctx = this.addFilterButtonContextCache.get(key);
    if (ctx === undefined) {
      ctx = {
        add: () => this.addFilterAt(path),
        label: this.config.i18n.addFilter,
        disabled: false,
      };
      this.addFilterButtonContextCache.set(key, ctx);
    }
    return ctx;
  }

  protected addGroupButtonContext(path: readonly number[]): AddGroupButtonCtx {
    const key = path.join('.');
    let ctx = this.addGroupButtonContextCache.get(key);
    if (ctx === undefined) {
      ctx = {
        add: () => this.addGroupAt(path),
        label: this.config.i18n.addGroup,
        disabled: false,
      };
      this.addGroupButtonContextCache.set(key, ctx);
    }
    return ctx;
  }

  protected removeButtonContext(path: readonly number[], label: string): RemoveButtonCtx {
    const key = `${path.join('.')}|${label}`;
    let ctx = this.removeButtonContextCache.get(key);
    if (ctx === undefined) {
      ctx = { remove: () => this.presenter.removeNode(path), label };
      this.removeButtonContextCache.set(key, ctx);
    }
    return ctx;
  }

  private readonly groupTemplateContextCache = new Map<string, GroupTemplateCtx>();
  private readonly expressionTemplateContextCache = new Map<string, ExpressionTemplateCtx>();

  protected groupTemplateContext(group: FilterGroup, path: readonly number[]): GroupTemplateCtx {
    const key = path.join('.');
    let ctx = this.groupTemplateContextCache.get(key);
    if (ctx?.group !== group) {
      ctx = {
        group,
        logic: group.logic,
        isRoot: path.length === 0,
        setLogic: (l) => this.presenter.setLogic(path, l),
        toggleNegated: () => this.presenter.toggleNegated(path),
        addFilter: () => this.addFilterAt(path),
        addGroup: () => this.addGroupAt(path),
        remove: () => this.presenter.removeNode(path),
      };
      this.groupTemplateContextCache.set(key, ctx);
    }
    return ctx;
  }

  protected expressionTemplateContext(
    expression: FilterExpression,
    path: readonly number[],
  ): ExpressionTemplateCtx {
    const key = path.join('.');
    let ctx = this.expressionTemplateContextCache.get(key);
    if (ctx?.expression !== expression) {
      const fieldDef = this.presenter.fieldMap().get(expression.field);
      ctx = {
        expression,
        fieldDef,
        availableOperators: this.operatorsForField(expression.field),
        value: expression.value,
        setField: (k) => this.presenter.setField(path, k),
        setOperator: (op) => this.presenter.setOperator(path, op),
        setValue: (v) => this.presenter.setValue(path, v),
        remove: () => this.presenter.removeNode(path),
      };
      this.expressionTemplateContextCache.set(key, ctx);
    }
    return ctx;
  }

  protected logicToggleContext(group: FilterGroup, path: readonly number[]): LogicToggleCtx {
    const key = `${path.join('.')}|${group.logic}`;
    let ctx = this.logicToggleContextCache.get(key);
    if (ctx === undefined) {
      ctx = {
        logic: group.logic,
        options: this.config.logicOptions,
        setLogic: (logic) => this.presenter.setLogic(path, logic),
      };
      this.logicToggleContextCache.set(key, ctx);
    }
    return ctx;
  }

  protected operatorLabel(op: string): string {
    const map: Readonly<Record<string, string | undefined>> = this.config.i18n.operators;
    return map[op] ?? op;
  }

  protected readonly isNativeEditor = isNativeEditor;

  protected operatorsForField(fieldKey: string): readonly string[] {
    const def = this.presenter.fieldMap().get(fieldKey);
    if (!def) {
      return [];
    }
    if (def.operators && def.operators.length > 0) {
      return def.operators;
    }
    return this.config.defaultOperators[def.editorType] ?? [];
  }

  protected editorForField(fieldKey: string): CngxFilterEditor | undefined {
    const def = this.presenter.fieldMap().get(fieldKey);
    if (!def) {
      return undefined;
    }
    return this.editors.get(def.editorType);
  }

  protected readonly rootPath: readonly number[] = Object.freeze([]);

  private readonly pathCache = new WeakMap<
    FilterNode,
    { parent: readonly number[]; index: number; path: readonly number[] }
  >();

  protected childPath(
    parent: readonly number[],
    child: FilterNode,
    index: number,
  ): readonly number[] {
    const entry = this.pathCache.get(child);
    if (entry?.parent === parent && entry?.index === index) {
      return entry.path;
    }
    const path = Object.freeze([...parent, index]);
    this.pathCache.set(child, { parent, index, path });
    return path;
  }

  protected addFilterAt(path: readonly number[]): void {
    const first = this.presenter.fields()[0];
    if (!first) {
      return;
    }
    const operator = first.operators?.[0] ?? this.config.defaultOperators[first.editorType]?.[0] ?? 'eq';
    this.presenter.addExpression(path, createFilterExpression(first.key, operator));
  }

  protected addGroupAt(path: readonly number[]): void {
    this.presenter.addGroup(path, createFilterGroup());
  }

  protected setFieldFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.setField(path, target.value);
  }

  protected setOperatorFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.setOperator(path, target.value);
  }

  protected setStringValueFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLInputElement;
    this.presenter.setValue(path, target.value);
  }

  protected setNumberValueFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value;
    this.presenter.setValue(path, raw === '' ? null : Number(raw));
  }

  protected setLogicFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.setLogic(path, target.value as FilterLogic);
  }
}
