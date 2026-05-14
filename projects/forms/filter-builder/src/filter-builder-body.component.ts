import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { CngxSelect } from '@cngx/forms/select';

import { injectFilterBuilderConfig } from './filter-builder.config';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import type {
  CngxFilterBuilderAddFilterButtonContext as AddFilterButtonCtx,
  CngxFilterBuilderAddGroupButtonContext as AddGroupButtonCtx,
  CngxFilterBuilderEmptyContext as EmptyCtx,
  CngxFilterBuilderExpressionTemplateContext as ExpressionTemplateCtx,
  CngxFilterBuilderGroupTemplateContext as GroupTemplateCtx,
  CngxFilterBuilderLogicToggleContext as LogicToggleCtx,
  CngxFilterBuilderNegationToggleContext as NegationToggleCtx,
  CngxFilterBuilderRemoveButtonContext as RemoveButtonCtx,
} from './filter-builder-slots';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { CngxFilterGroup } from './filter-builder-group.directive';
import { CngxFilterExpressionRow } from './filter-builder-expression-row.component';
import { CNGX_FILTER_BUILDER_GLYPHS } from './filter-builder.glyphs';
import { createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import type { FilterExpression, FilterGroup, FilterLogic, FilterNode } from './filter-builder.types';

const EMPTY_OPERATORS: readonly string[] = Object.freeze([]) as readonly string[];

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
  imports: [NgTemplateOutlet, CngxFilterGroup, CngxFilterExpressionRow, CngxSelect],
  templateUrl: './filter-builder-body.component.html',
})
export class CngxFilterBuilderBody {
  protected readonly host = inject(CNGX_FILTER_BUILDER_HOST);
  protected readonly config = injectFilterBuilderConfig();

  readonly templates = input.required<CngxFilterBuilderTemplateRegistry>();

  protected readonly rootPath: readonly number[] = Object.freeze([]);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearAllCaches());

    effect(() => {
      const event = this.host.lastMutation();
      if (
        event?.kind === 'remove-filter' ||
        event?.kind === 'remove-group' ||
        event?.kind === 'clear'
      ) {
        untracked(() => this.clearAllCaches());
      }
    });
  }

  private clearAllCaches(): void {
    this.groupTemplateContextCache.clear();
    this.expressionTemplateContextCache.clear();
  }

  protected readonly glyphs = CNGX_FILTER_BUILDER_GLYPHS;

  protected readonly emptyContext: EmptyCtx = {
    addFilter: () => this.addFilterAt(this.rootPath),
    addGroup: () => this.addGroupAt(this.rootPath),
  };

  private readonly groupTemplateContextCache = new Map<string, GroupTemplateCtx>();
  private readonly expressionTemplateContextCache = new Map<string, ExpressionTemplateCtx>();

  private readonly pathCache = new WeakMap<
    FilterNode,
    { parent: readonly number[]; index: number; path: readonly number[] }
  >();

  protected addFilterButtonContext(path: readonly number[]): AddFilterButtonCtx {
    return {
      add: () => this.addFilterAt(path),
      label: this.config.i18n.addFilter,
      disabled: false,
    };
  }

  protected addGroupButtonContext(path: readonly number[]): AddGroupButtonCtx {
    return {
      add: () => this.addGroupAt(path),
      label: this.config.i18n.addGroup,
      disabled: false,
    };
  }

  protected removeButtonContext(path: readonly number[], label: string): RemoveButtonCtx {
    return { remove: () => this.host.removeNode(path), label };
  }

  protected logicToggleContext(group: FilterGroup, path: readonly number[]): LogicToggleCtx {
    return {
      logic: group.logic,
      options: this.config.logicOptions,
      setLogic: (logic) => this.host.setLogic(path, logic),
    };
  }

  protected negationToggleContext(group: FilterGroup, path: readonly number[]): NegationToggleCtx {
    return {
      negated: group.negated,
      toggle: () => this.host.toggleNegated(path),
      label: this.config.i18n.negate,
    };
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
        availableOperators: this.operatorsForExpression(expression.field),
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

  private operatorsForExpression(fieldKey: string): readonly string[] {
    const def = this.host.fieldMap().get(fieldKey);
    if (!def) {
      return EMPTY_OPERATORS;
    }
    if (def.operators && def.operators.length > 0) {
      return def.operators;
    }
    return this.config.defaultOperators[def.editorType] ?? EMPTY_OPERATORS;
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

  protected setLogic(path: readonly number[], next: FilterLogic | undefined): void {
    if (next === undefined) {
      return;
    }
    this.host.setLogic(path, next);
  }

  protected readonly negationEnabled = this.config.negationEnabled;

  protected readonly logicOptions = this.config.logicOptions;

  protected readonly logicSelectOptions = computed<
    readonly { readonly value: FilterLogic; readonly label: string }[]
  >(() => this.logicOptions.map((option) => ({ value: option, label: option.toUpperCase() })), {
    equal: (a, b) => {
      if (a === b) {
        return true;
      }
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i].value !== b[i].value || a[i].label !== b[i].label) {
          return false;
        }
      }
      return true;
    },
  });
}
