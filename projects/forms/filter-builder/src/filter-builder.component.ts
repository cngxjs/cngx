import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
} from '@angular/core';

import { injectFilterBuilderConfig } from './filter-builder.config';
import type {
  CngxFilterBuilderErrorContext as ErrorCtx,
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
  CngxFilterBuilderNegationToggle,
  CngxFilterBuilderRemoveButton,
} from './filter-builder-slots';
import { injectFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
import { CngxFilterBuilderBody } from './filter-builder-body.component';
import { createFilterExpression, createFilterGroup } from './filter-builder.helpers';

/**
 * Recursive query-builder component. Brain lives entirely in
 * `CngxFilterBuilderPresenter` (host directive). This component is the
 * thin state-branch shell: chooses between `loading` / `error` / `empty`
 * / content branches; the recursive body lives in `CngxFilterBuilderBody`
 * (internal sub-component). The live-region announcer is bound here so
 * AT updates stay outside the conditional branches.
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
  host: {
    '[attr.aria-busy]': 'ariaBusy()',
    '[attr.aria-disabled]': 'ariaDisabled()',
  },
  imports: [NgTemplateOutlet, CngxFilterBuilderBody],
  templateUrl: './filter-builder.component.html',
  styleUrl: './filter-builder.component.css',
})
export class CngxFilterBuilder {
  protected readonly presenter = inject(CngxFilterBuilderPresenter);
  protected readonly config = injectFilterBuilderConfig();

  protected readonly ariaBusy = computed<'true' | null>(() =>
    this.presenter.state.status() === 'loading' ? 'true' : null,
  );

  protected readonly ariaDisabled = computed<'true' | null>(() =>
    this.presenter.disabled() ? 'true' : null,
  );

  protected readonly loadingSlot = contentChild(CngxFilterBuilderLoading);
  protected readonly errorSlot = contentChild(CngxFilterBuilderError);
  protected readonly emptySlot = contentChild(CngxFilterBuilderEmpty);
  protected readonly expressionTemplateSlot = contentChild(CngxFilterBuilderExpressionTemplate);
  protected readonly groupTemplateSlot = contentChild(CngxFilterBuilderGroupTemplate);
  protected readonly addFilterButtonSlot = contentChild(CngxFilterBuilderAddFilterButton);
  protected readonly addGroupButtonSlot = contentChild(CngxFilterBuilderAddGroupButton);
  protected readonly removeButtonSlot = contentChild(CngxFilterBuilderRemoveButton);
  protected readonly logicToggleSlot = contentChild(CngxFilterBuilderLogicToggle);
  protected readonly negationToggleSlot = contentChild(CngxFilterBuilderNegationToggle);

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
    negationToggle: this.negationToggleSlot,
  });

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
  }));

  protected readonly rootAddFilterContext = computed(
    () => ({
      add: () => this.addFilterAt([]),
      label: this.config.i18n.addFilter,
      disabled: false,
    }),
    { equal: () => true },
  );

  protected readonly rootAddGroupContext = computed(
    () => ({
      add: () => this.addGroupAt([]),
      label: this.config.i18n.addGroup,
      disabled: false,
    }),
    { equal: () => true },
  );

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
}
