import { Component, TemplateRef, contentChild, inject, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CngxSelectCaret,
  CngxSelectCheck,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectLoading,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
} from './template-slots';
import {
  CNGX_TEMPLATE_REGISTRY_FACTORY,
  createTemplateRegistry,
  type CngxSelectTemplateRegistry,
  type CngxTemplateRegistryFactory,
} from './template-registry';
import { provideSelectConfig } from './config';

// Probe that performs all 14 contentChild queries AT class-field level
// (Angular's AOT-enforced constraint — see NG8110) and hands them into
// the factory. Mirrors how every real select-family variant will wire.
@Component({
  selector: 'registry-probe',
  standalone: true,
  template: `<ng-content />`,
})
class RegistryProbe<T> {
  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly optionLabelDirective = contentChild<CngxSelectOptionLabel<T>>(
    CngxSelectOptionLabel,
  );
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly refreshingDirective =
    contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDirective = contentChild<CngxSelectCommitError<T>>(
    CngxSelectCommitError,
  );
  private readonly clearButtonDirective =
    contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly optionPendingDirective = contentChild<CngxSelectOptionPending<T>>(
    CngxSelectOptionPending,
  );
  private readonly optionErrorDirective = contentChild<CngxSelectOptionError<T>>(
    CngxSelectOptionError,
  );

  readonly registry: CngxSelectTemplateRegistry<T> = inject(
    CNGX_TEMPLATE_REGISTRY_FACTORY,
  )<T>({
    check: this.checkDirective,
    caret: this.caretDirective,
    optgroup: this.optgroupDirective,
    placeholder: this.placeholderDirective,
    empty: this.emptyDirective,
    loading: this.loadingDirective,
    optionLabel: this.optionLabelDirective,
    error: this.errorDirective,
    refreshing: this.refreshingDirective,
    commitError: this.commitErrorDirective,
    clearButton: this.clearButtonDirective,
    optionPending: this.optionPendingDirective,
    optionError: this.optionErrorDirective,
  });
}

const SLOT_MARKUP = `
  <ng-template cngxSelectCheck>check-proj</ng-template>
  <ng-template cngxSelectCaret>caret-proj</ng-template>
  <ng-template cngxSelectOptgroup>optgroup-proj</ng-template>
  <ng-template cngxSelectPlaceholder>placeholder-proj</ng-template>
  <ng-template cngxSelectEmpty>empty-proj</ng-template>
  <ng-template cngxSelectLoading>loading-proj</ng-template>
  <ng-template cngxSelectOptionLabel>option-label-proj</ng-template>
  <ng-template cngxSelectError>error-proj</ng-template>
  <ng-template cngxSelectRefreshing>refreshing-proj</ng-template>
  <ng-template cngxSelectCommitError>commit-error-proj</ng-template>
  <ng-template cngxSelectClearButton>clear-button-proj</ng-template>
  <ng-template cngxSelectOptionPending>option-pending-proj</ng-template>
  <ng-template cngxSelectOptionError>option-error-proj</ng-template>
`;

@Component({
  standalone: true,
  imports: [
    RegistryProbe,
    CngxSelectCheck,
    CngxSelectCaret,
    CngxSelectOptgroupTemplate,
    CngxSelectPlaceholder,
    CngxSelectEmpty,
    CngxSelectLoading,
    CngxSelectOptionLabel,
    CngxSelectError,
    CngxSelectRefreshing,
    CngxSelectCommitError,
    CngxSelectClearButton,
    CngxSelectOptionPending,
    CngxSelectOptionError,
  ],
  template: `
    <registry-probe>
      ${SLOT_MARKUP}
    </registry-probe>
  `,
})
class AllSlotsHost {
  readonly probe = viewChild.required<RegistryProbe<string>>(RegistryProbe);
}

@Component({
  standalone: true,
  imports: [RegistryProbe],
  template: `<registry-probe />`,
})
class NoSlotsHost {
  readonly probe = viewChild.required<RegistryProbe<string>>(RegistryProbe);
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
}

describe('createTemplateRegistry', () => {
  it('resolves every projected slot via the contentChild queries handed in', () => {
    const fixture = TestBed.createComponent(AllSlotsHost);
    flush(fixture);
    const registry = fixture.componentInstance.probe().registry;

    expect(registry.check()).toBeInstanceOf(TemplateRef);
    expect(registry.caret()).toBeInstanceOf(TemplateRef);
    expect(registry.optgroup()).toBeInstanceOf(TemplateRef);
    expect(registry.placeholder()).toBeInstanceOf(TemplateRef);
    expect(registry.empty()).toBeInstanceOf(TemplateRef);
    expect(registry.loading()).toBeInstanceOf(TemplateRef);
    expect(registry.optionLabel()).toBeInstanceOf(TemplateRef);
    expect(registry.error()).toBeInstanceOf(TemplateRef);
    expect(registry.refreshing()).toBeInstanceOf(TemplateRef);
    expect(registry.commitError()).toBeInstanceOf(TemplateRef);
    expect(registry.clearButton()).toBeInstanceOf(TemplateRef);
    expect(registry.optionPending()).toBeInstanceOf(TemplateRef);
    expect(registry.optionError()).toBeInstanceOf(TemplateRef);
  });

  it('returns null for every unprojected slot (no cascade fallback configured)', () => {
    const fixture = TestBed.createComponent(NoSlotsHost);
    flush(fixture);
    const registry = fixture.componentInstance.probe().registry;

    expect(registry.check()).toBeNull();
    expect(registry.caret()).toBeNull();
    expect(registry.optgroup()).toBeNull();
    expect(registry.placeholder()).toBeNull();
    expect(registry.empty()).toBeNull();
    expect(registry.loading()).toBeNull();
    expect(registry.optionLabel()).toBeNull();
    expect(registry.error()).toBeNull();
    expect(registry.refreshing()).toBeNull();
    expect(registry.commitError()).toBeNull();
    expect(registry.clearButton()).toBeNull();
    expect(registry.optionPending()).toBeNull();
    expect(registry.optionError()).toBeNull();
  });

  it('CNGX_TEMPLATE_REGISTRY_FACTORY defaults to createTemplateRegistry', () => {
    const fixture = TestBed.createComponent(AllSlotsHost);
    flush(fixture);
    const factory = TestBed.inject(CNGX_TEMPLATE_REGISTRY_FACTORY);
    expect(factory).toBe(createTemplateRegistry);
  });

  it('CNGX_TEMPLATE_REGISTRY_FACTORY override lets consumers wrap the cascade', () => {
    const calls: string[] = [];
    const wrapped: CngxTemplateRegistryFactory = (queries) => {
      calls.push('factory-invoked');
      return createTemplateRegistry(queries);
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_TEMPLATE_REGISTRY_FACTORY, useValue: wrapped }],
    });
    const fixture = TestBed.createComponent(NoSlotsHost);
    flush(fixture);
    // Probe's field init calls the factory once per instance.
    expect(calls).toEqual(['factory-invoked']);
    // And the resulting registry still behaves correctly (null-slot semantics).
    expect(fixture.componentInstance.probe().registry.check()).toBeNull();
  });

  it('falls back to CNGX_SELECT_CONFIG.templates when no content is projected', () => {
    @Component({
      standalone: true,
      template: `
        <ng-template #check>config-check</ng-template>
        <ng-template #empty>config-empty</ng-template>
      `,
    })
    class Factory {
      readonly check = viewChild.required<TemplateRef<unknown>>('check');
      readonly empty = viewChild.required<TemplateRef<unknown>>('empty');
    }
    const factory = TestBed.createComponent(Factory);
    factory.detectChanges();
    const checkTpl = factory.componentInstance.check() as unknown as TemplateRef<never>;
    const emptyTpl = factory.componentInstance.empty() as unknown as TemplateRef<never>;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideSelectConfig({
          config: { templates: { check: checkTpl, empty: emptyTpl } },
        }),
      ],
    });
    const fixture = TestBed.createComponent(NoSlotsHost);
    flush(fixture);
    const registry = fixture.componentInstance.probe().registry;

    expect(registry.check()).toBe(checkTpl);
    expect(registry.empty()).toBe(emptyTpl);
    // Slots not configured remain null.
    expect(registry.caret()).toBeNull();
  });
});
