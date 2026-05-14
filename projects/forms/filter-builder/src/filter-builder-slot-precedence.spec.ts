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
