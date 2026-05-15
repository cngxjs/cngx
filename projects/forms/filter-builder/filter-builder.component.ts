import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import {
  CngxFilterBuilderAddFilterButton,
  CngxFilterBuilderAddGroupButton,
  CngxFilterBuilderEmpty,
  CngxFilterBuilderExpressionTemplate,
  CngxFilterBuilderGroupTemplate,
  CngxFilterBuilderLogicToggle,
  CngxFilterBuilderNegationToggle,
  CngxFilterBuilderRemoveButton,
} from './filter-builder-slots';
import { injectFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
import { CngxFilterBuilderValueEditor } from './filter-builder-value-editor.slot';
import { CNGX_FILTER_BUILDER_BODY_HOST } from './filter-builder-body.host';

/**
 * Recursive query-builder component. Brain lives entirely in
 * `CngxFilterBuilderPresenter` (host directive). This component is the
 * thin render shell: hosts the slot contentChildren and mounts the body
 * resolved through `CNGX_FILTER_BUILDER_BODY_HOST` (default
 * `CngxFilterBuilderBody`). State-driven UI (loading / error /
 * refreshing) is the consumer's concern — wrap with
 * `<cngx-async-container [state]>`. The live-region announcer is bound
 * here so AT updates stay outside the body's recursive render path.
 * @example-url http://localhost:4200/filter-builder-async-state/loading-error-content-branches-via-cngx-async-container
 * @example-url http://localhost:4200/filter-builder-json/builder-json
 * @example-url http://localhost:4200/filter-builder/basic-two-way-binding-json-inspection
 * @example-url http://localhost:4200/filter-builder/seeded-tree-and-or-composition
 */
@Component({
  selector: 'cngx-filter-builder',
  exportAs: 'cngxFilterBuilder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxFilterBuilderPresenter,
      inputs: ['fields', 'value'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    '[attr.aria-disabled]': 'ariaDisabled()',
  },
  imports: [NgComponentOutlet],
  templateUrl: './filter-builder.component.html',
  styleUrl: './filter-builder.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CngxFilterBuilder {
  protected readonly presenter = inject(CngxFilterBuilderPresenter);
  protected readonly bodyType = inject(CNGX_FILTER_BUILDER_BODY_HOST);

  protected readonly ariaDisabled = computed<'true' | null>(() =>
    this.presenter.disabled() ? 'true' : null,
  );

  protected readonly emptySlot = contentChild(CngxFilterBuilderEmpty);
  protected readonly expressionTemplateSlot = contentChild(CngxFilterBuilderExpressionTemplate);
  protected readonly groupTemplateSlot = contentChild(CngxFilterBuilderGroupTemplate);
  protected readonly addFilterButtonSlot = contentChild(CngxFilterBuilderAddFilterButton);
  protected readonly addGroupButtonSlot = contentChild(CngxFilterBuilderAddGroupButton);
  protected readonly removeButtonSlot = contentChild(CngxFilterBuilderRemoveButton);
  protected readonly logicToggleSlot = contentChild(CngxFilterBuilderLogicToggle);
  protected readonly negationToggleSlot = contentChild(CngxFilterBuilderNegationToggle);
  protected readonly valueEditorSlot = contentChild(CngxFilterBuilderValueEditor);

  protected readonly templates = injectFilterBuilderTemplateRegistry({
    empty: this.emptySlot,
    expressionTemplate: this.expressionTemplateSlot,
    groupTemplate: this.groupTemplateSlot,
    addFilterButton: this.addFilterButtonSlot,
    addGroupButton: this.addGroupButtonSlot,
    removeButton: this.removeButtonSlot,
    logicToggle: this.logicToggleSlot,
    negationToggle: this.negationToggleSlot,
    valueEditor: this.valueEditorSlot,
  });

  protected readonly bodyInputs = computed(() => ({ templates: this.templates }));
}
