import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
} from '@angular/core';

import { isNativeEditor, type CngxFilterEditor } from './filter-builder.config';
import { injectFilterBuilderConfig } from './filter-builder.config';
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
import type { FilterLogic, FilterNode } from './filter-builder.types';

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

  protected readonly emptyContext = computed(() => ({
    addFilter: () => this.addFilterAt([]),
    addGroup: () => this.addGroupAt([]),
  }));

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

  protected childPath(parent: readonly number[], index: number): readonly number[] {
    return [...parent, index];
  }

  protected trackNode(_index: number, node: FilterNode): string {
    return `${node.type}:${_index}`;
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
