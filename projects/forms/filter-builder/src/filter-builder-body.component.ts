import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';

import {
  injectFilterBuilderConfig,
  isNativeEditor,
  type CngxFilterEditor,
} from './filter-builder.config';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import type {
  CngxFilterBuilderAddFilterButtonContext as AddFilterButtonCtx,
  CngxFilterBuilderAddGroupButtonContext as AddGroupButtonCtx,
  CngxFilterBuilderExpressionTemplateContext as ExpressionTemplateCtx,
  CngxFilterBuilderGroupTemplateContext as GroupTemplateCtx,
  CngxFilterBuilderLogicToggleContext as LogicToggleCtx,
  CngxFilterBuilderNegationToggleContext as NegationToggleCtx,
  CngxFilterBuilderRemoveButtonContext as RemoveButtonCtx,
} from './filter-builder-slots';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { CngxFilterGroup } from './filter-builder-group.directive';
import { CngxFilterExpression } from './filter-builder-expression.directive';
import { CNGX_FILTER_BUILDER_GLYPHS } from './filter-builder.glyphs';
import { createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import { injectFilterEditors } from './filter-builder.tokens';
import type { FilterExpression, FilterGroup, FilterLogic, FilterNode } from './filter-builder.types';

/**
 * Recursive renderer for `<cngx-filter-builder>`. Owns the slot-cascade
 * machinery for every per-row visible region (`addFilterButton`,
 * `addGroupButton`, `removeButton`, `logicToggle`, `negationToggle`,
 * `expressionTemplate`, `groupTemplate`) plus path-keyed context caches.
 *
 * Internal — not exported through `public-api.ts`. The host component
 * (`CngxFilterBuilder`) wires this body inside its state-branch shell
 * (`loading` / `error` / `empty` / content). A consumer who needs to
 * eject the skin replaces the whole `CngxFilterBuilder` for now; a
 * future `CNGX_FILTER_BUILDER_BODY_HOST` token lifts this body behind
 * a swappable factory without changing the public surface.
 */
@Component({
  selector: 'cngx-filter-builder-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgTemplateOutlet, CngxFilterGroup, CngxFilterExpression],
  templateUrl: './filter-builder-body.component.html',
})
export class CngxFilterBuilderBody {
  protected readonly host = inject(CNGX_FILTER_BUILDER_HOST);
  protected readonly config = injectFilterBuilderConfig();
  protected readonly editors = injectFilterEditors();

  readonly templates = input.required<CngxFilterBuilderTemplateRegistry>();

  protected readonly rootPath: readonly number[] = Object.freeze([]);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.addFilterButtonContextCache.clear();
      this.addGroupButtonContextCache.clear();
      this.removeButtonContextCache.clear();
      this.logicToggleContextCache.clear();
      this.negationToggleContextCache.clear();
      this.groupTemplateContextCache.clear();
      this.expressionTemplateContextCache.clear();
    });
  }

  protected readonly isNativeEditor = isNativeEditor;
  protected readonly glyphs = CNGX_FILTER_BUILDER_GLYPHS;

  private readonly addFilterButtonContextCache = new Map<string, AddFilterButtonCtx>();
  private readonly addGroupButtonContextCache = new Map<string, AddGroupButtonCtx>();
  private readonly removeButtonContextCache = new Map<string, RemoveButtonCtx>();
  private readonly logicToggleContextCache = new Map<string, LogicToggleCtx>();
  private readonly negationToggleContextCache = new Map<string, NegationToggleCtx>();
  private readonly groupTemplateContextCache = new Map<string, GroupTemplateCtx>();
  private readonly expressionTemplateContextCache = new Map<string, ExpressionTemplateCtx>();

  private readonly pathCache = new WeakMap<
    FilterNode,
    { parent: readonly number[]; index: number; path: readonly number[] }
  >();

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
      ctx = { remove: () => this.host.removeNode(path), label };
      this.removeButtonContextCache.set(key, ctx);
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
        setLogic: (logic) => this.host.setLogic(path, logic),
      };
      this.logicToggleContextCache.set(key, ctx);
    }
    return ctx;
  }

  protected negationToggleContext(group: FilterGroup, path: readonly number[]): NegationToggleCtx {
    const key = `${path.join('.')}|${group.negated ? '1' : '0'}`;
    let ctx = this.negationToggleContextCache.get(key);
    if (ctx === undefined) {
      ctx = {
        negated: group.negated,
        toggle: () => this.host.toggleNegated(path),
        label: this.config.i18n.negate,
      };
      this.negationToggleContextCache.set(key, ctx);
    }
    return ctx;
  }

  protected groupTemplateContext(group: FilterGroup, path: readonly number[]): GroupTemplateCtx {
    const key = path.join('.');
    let ctx = this.groupTemplateContextCache.get(key);
    if (ctx?.group !== group) {
      ctx = {
        group,
        logic: group.logic,
        isRoot: path.length === 0,
        setLogic: (l) => this.host.setLogic(path, l),
        toggleNegated: () => this.host.toggleNegated(path),
        addFilter: () => this.addFilterAt(path),
        addGroup: () => this.addGroupAt(path),
        remove: () => this.host.removeNode(path),
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
      const fieldDef = this.host.fieldMap().get(expression.field);
      ctx = {
        expression,
        fieldDef,
        availableOperators: this.operatorsForField(expression.field),
        value: expression.value,
        setField: (k) => this.host.setField(path, k),
        setOperator: (op) => this.host.setOperator(path, op),
        setValue: (v) => this.host.setValue(path, v),
        remove: () => this.host.removeNode(path),
      };
      this.expressionTemplateContextCache.set(key, ctx);
    }
    return ctx;
  }

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

  protected operatorLabel(op: string): string {
    const map: Readonly<Record<string, string | undefined>> = this.config.i18n.operators;
    return map[op] ?? op;
  }

  protected operatorsForField(fieldKey: string): readonly string[] {
    const def = this.host.fieldMap().get(fieldKey);
    if (!def) {
      return [];
    }
    if (def.operators && def.operators.length > 0) {
      return def.operators;
    }
    return this.config.defaultOperators[def.editorType] ?? [];
  }

  protected editorForField(fieldKey: string): CngxFilterEditor | undefined {
    const def = this.host.fieldMap().get(fieldKey);
    if (!def) {
      return undefined;
    }
    return this.editors.get(def.editorType);
  }

  protected addFilterAt(path: readonly number[]): void {
    const first = this.host.fields()[0];
    if (!first) {
      return;
    }
    const operator = first.operators?.[0] ?? this.config.defaultOperators[first.editorType]?.[0] ?? 'eq';
    this.host.addExpression(path, createFilterExpression(first.key, operator));
  }

  protected addGroupAt(path: readonly number[]): void {
    this.host.addGroup(path, createFilterGroup());
  }

  protected setFieldFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.host.setField(path, target.value);
  }

  protected setOperatorFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.host.setOperator(path, target.value);
  }

  protected setStringValueFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLInputElement;
    this.host.setValue(path, target.value);
  }

  protected setNumberValueFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value;
    this.host.setValue(path, raw === '' ? null : Number(raw));
  }

  protected setLogicFromEvent(path: readonly number[], event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.host.setLogic(path, target.value as FilterLogic);
  }

  protected readonly negationEnabled = this.config.negationEnabled;

  protected readonly logicOptions = this.config.logicOptions;
}
