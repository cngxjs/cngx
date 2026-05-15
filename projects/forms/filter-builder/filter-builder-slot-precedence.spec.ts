import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxFilterBuilder } from './filter-builder.component';
import { CngxFilterExpressionRow } from './filter-builder-expression-row.component';
import {
  CngxFilterBuilderExpressionTemplate,
  type CngxFilterBuilderExpressionTemplateContext,
} from './filter-builder-slots';
import {
  CngxFilterBuilderValueEditor,
  type CngxFilterBuilderValueEditorContext,
} from './filter-builder-value-editor.slot';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import {
  provideFilterBuilderConfig,
  withTemplates,
} from './filter-builder.config';
import { createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import type { FilterFieldDef, FilterGroup } from './filter-builder.types';

const FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
];

function singleExpressionTree(): FilterGroup {
  return createFilterGroup('and', [createFilterExpression('name', 'eq', 'foo')]);
}

@Component({
  standalone: true,
  template: `
    <ng-template #expressionTemplate let-expression="expression">
      <span data-test="config-tier-template">{{ expression.field }}</span>
    </ng-template>
  `,
})
class ConfigTemplateSource {
  readonly expressionTemplate =
    viewChild.required<TemplateRef<CngxFilterBuilderExpressionTemplateContext>>('expressionTemplate');
}

describe('filter-builder slot precedence — expression template cascade', () => {
  it('default cascade mounts CngxFilterExpressionRow', () => {
    @Component({
      standalone: true,
      template: `<cngx-filter-builder [fields]="fields" [(value)]="value"></cngx-filter-builder>`,
      imports: [CngxFilterBuilder],
    })
    class DefaultHost {
      readonly fields = FIELDS;
      readonly value = signal<FilterGroup>(singleExpressionTree());
    }

    const fixture = TestBed.createComponent(DefaultHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.debugElement.query(By.directive(CngxFilterExpressionRow))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-test="config-tier-template"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-test="content-tier-template"]'))).toBeNull();
  });

  it('contentChild cngxFilterBuilderExpressionTemplate wins — row is NOT mounted', () => {
    @Component({
      standalone: true,
      template: `
        <cngx-filter-builder [fields]="fields" [(value)]="value">
          <ng-template cngxFilterBuilderExpressionTemplate let-expression="expression">
            <span data-test="content-tier-template">{{ expression.field }}</span>
          </ng-template>
        </cngx-filter-builder>
      `,
      imports: [CngxFilterBuilder, CngxFilterBuilderExpressionTemplate],
    })
    class CustomSlotHost {
      readonly fields = FIELDS;
      readonly value = signal<FilterGroup>(singleExpressionTree());
    }

    const fixture = TestBed.createComponent(CustomSlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.debugElement.query(By.css('[data-test="content-tier-template"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(CngxFilterExpressionRow))).toBeNull();
  });

  it('CONFIG.templates.expressionTemplate wins over the row default when no contentChild is provided', () => {
    const sourceFixture = TestBed.createComponent(ConfigTemplateSource);
    sourceFixture.detectChanges();
    const tpl = sourceFixture.componentInstance.expressionTemplate();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideFilterBuilderConfig(withTemplates({ expressionTemplate: tpl }))],
    });

    @Component({
      standalone: true,
      template: `<cngx-filter-builder [fields]="fields" [(value)]="value"></cngx-filter-builder>`,
      imports: [CngxFilterBuilder],
    })
    class ConfigHost {
      readonly fields = FIELDS;
      readonly value = signal<FilterGroup>(singleExpressionTree());
    }

    const fixture = TestBed.createComponent(ConfigHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.debugElement.query(By.css('[data-test="config-tier-template"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(CngxFilterExpressionRow))).toBeNull();
  });

  it('contentChild beats CONFIG.templates (slot cascade order: content → config → default)', () => {
    const sourceFixture = TestBed.createComponent(ConfigTemplateSource);
    sourceFixture.detectChanges();
    const tpl = sourceFixture.componentInstance.expressionTemplate();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideFilterBuilderConfig(withTemplates({ expressionTemplate: tpl }))],
    });

    @Component({
      standalone: true,
      template: `
        <cngx-filter-builder [fields]="fields" [(value)]="value">
          <ng-template cngxFilterBuilderExpressionTemplate let-expression="expression">
            <span data-test="content-tier-template">{{ expression.field }}</span>
          </ng-template>
        </cngx-filter-builder>
      `,
      imports: [CngxFilterBuilder, CngxFilterBuilderExpressionTemplate],
    })
    class CombinedHost {
      readonly fields = FIELDS;
      readonly value = signal<FilterGroup>(singleExpressionTree());
    }

    const fixture = TestBed.createComponent(CombinedHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.debugElement.query(By.css('[data-test="content-tier-template"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('[data-test="config-tier-template"]'))).toBeNull();
    expect(fixture.debugElement.query(By.directive(CngxFilterExpressionRow))).toBeNull();
  });
});

@Component({
  standalone: true,
  template: `
    <ng-template #valueEditor>
      <span data-test="config-tier-value-editor">config-value-editor</span>
    </ng-template>
  `,
})
class ConfigValueEditorSource {
  readonly valueEditor =
    viewChild.required<TemplateRef<CngxFilterBuilderValueEditorContext<unknown>>>('valueEditor');
}

describe('filter-builder slot precedence — valueEditor cascade', () => {
  it('contentChild cngxFilterBuilderValueEditor wins over the CONFIG.templates valueEditor on the resolved registry', () => {
    const sourceFixture = TestBed.createComponent(ConfigValueEditorSource);
    sourceFixture.detectChanges();
    const configTpl = sourceFixture.componentInstance.valueEditor();
    let resolvedRegistry: CngxFilterBuilderTemplateRegistry | null = null;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideFilterBuilderConfig(withTemplates({ valueEditor: configTpl }))],
    });

    @Component({
      selector: 'value-editor-probe',
      standalone: true,
      template: `
        <cngx-filter-builder #fb [fields]="fields" [(value)]="value">
          <ng-template cngxFilterBuilderValueEditor>
            <span data-test="content-tier-value-editor">content-value-editor</span>
          </ng-template>
        </cngx-filter-builder>
      `,
      imports: [CngxFilterBuilder, CngxFilterBuilderValueEditor],
    })
    class CombinedHost {
      readonly fields = FIELDS;
      readonly value = signal<FilterGroup>(singleExpressionTree());
      readonly fb = viewChild.required(CngxFilterBuilder);
    }

    const fixture = TestBed.createComponent(CombinedHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    // Reach into the resolved template registry — content-tier wins.
    const registry = (fixture.componentInstance.fb() as unknown as {
      templates: CngxFilterBuilderTemplateRegistry;
    }).templates;
    resolvedRegistry = registry;
    expect(resolvedRegistry.valueEditor()).not.toBe(configTpl);
    expect(resolvedRegistry.valueEditor()).not.toBeNull();
  });
});
