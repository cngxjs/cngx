import { Injector, runInInjectionContext, signal, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type {
  CngxFilterBuilderEmpty,
  CngxFilterBuilderEmptyContext,
  CngxFilterBuilderLoading,
  CngxFilterBuilderLoadingContext,
} from './filter-builder-slots';
import {
  CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY,
  createFilterBuilderTemplateRegistry,
  type CngxFilterBuilderTemplateRegistryQueries,
} from './filter-builder-template-registry';
import {
  provideFilterBuilderConfig,
  withTemplates,
} from './filter-builder.config';

function emptyQueries(): CngxFilterBuilderTemplateRegistryQueries {
  return {
    loading: signal(undefined),
    error: signal(undefined),
    empty: signal(undefined),
    expressionTemplate: signal(undefined),
    groupTemplate: signal(undefined),
    addFilterButton: signal(undefined),
    addGroupButton: signal(undefined),
    removeButton: signal(undefined),
    logicToggle: signal(undefined),
    negationToggle: signal(undefined),
    valueEditor: signal(undefined),
  };
}

function fakeTemplate<Ctx>(): TemplateRef<Ctx> {
  return { elementRef: undefined } as unknown as TemplateRef<Ctx>;
}

describe('createFilterBuilderTemplateRegistry — 3-stage cascade', () => {
  it('returns the directive templateRef when contentChild signal resolves', () => {
    TestBed.configureTestingModule({});
    const injector = TestBed.inject(Injector);
    const directiveTpl = fakeTemplate<CngxFilterBuilderLoadingContext>();
    const directive = {
      templateRef: directiveTpl,
    } as unknown as CngxFilterBuilderLoading;

    runInInjectionContext(injector, () => {
      const queries: CngxFilterBuilderTemplateRegistryQueries = {
        ...emptyQueries(),
        loading: signal(directive),
      };
      const registry = createFilterBuilderTemplateRegistry(queries);
      expect(registry.loading()).toBe(directiveTpl);
    });
  });

  it('falls through to CONFIG.templates.<key> when contentChild is undefined', () => {
    const configTpl = fakeTemplate<CngxFilterBuilderEmptyContext>();
    TestBed.configureTestingModule({
      providers: [provideFilterBuilderConfig(withTemplates({ empty: configTpl }))],
    });
    const injector = TestBed.inject(Injector);

    runInInjectionContext(injector, () => {
      const registry = createFilterBuilderTemplateRegistry(emptyQueries());
      expect(registry.empty()).toBe(configTpl);
    });
  });

  it('returns null when neither contentChild nor CONFIG.templates provide a ref', () => {
    TestBed.configureTestingModule({});
    const injector = TestBed.inject(Injector);

    runInInjectionContext(injector, () => {
      const registry = createFilterBuilderTemplateRegistry(emptyQueries());
      expect(registry.loading()).toBeNull();
      expect(registry.error()).toBeNull();
      expect(registry.empty()).toBeNull();
      expect(registry.expressionTemplate()).toBeNull();
      expect(registry.groupTemplate()).toBeNull();
      expect(registry.addFilterButton()).toBeNull();
      expect(registry.addGroupButton()).toBeNull();
      expect(registry.removeButton()).toBeNull();
      expect(registry.logicToggle()).toBeNull();
    });
  });

  it('instance contentChild wins over CONFIG.templates when both are set', () => {
    const configTpl = fakeTemplate<CngxFilterBuilderEmptyContext>();
    const directiveTpl = fakeTemplate<CngxFilterBuilderEmptyContext>();
    TestBed.configureTestingModule({
      providers: [provideFilterBuilderConfig(withTemplates({ empty: configTpl }))],
    });
    const injector = TestBed.inject(Injector);

    runInInjectionContext(injector, () => {
      const directive = {
        templateRef: directiveTpl,
      } as unknown as CngxFilterBuilderEmpty;
      const queries: CngxFilterBuilderTemplateRegistryQueries = {
        ...emptyQueries(),
        empty: signal(directive),
      };
      const registry = createFilterBuilderTemplateRegistry(queries);
      expect(registry.empty()).toBe(directiveTpl);
    });
  });
});

describe('CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY', () => {
  it('resolves to createFilterBuilderTemplateRegistry by default', () => {
    TestBed.configureTestingModule({});
    const factory = TestBed.inject(CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY);
    expect(factory).toBe(createFilterBuilderTemplateRegistry);
  });

  it('accepts a consumer-supplied wrapper that wraps the default', () => {
    let wrapperCalls = 0;
    const wrapper = (queries: CngxFilterBuilderTemplateRegistryQueries) => {
      wrapperCalls += 1;
      return createFilterBuilderTemplateRegistry(queries);
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY, useValue: wrapper },
      ],
    });
    const injector = TestBed.inject(Injector);
    const factory = TestBed.inject(CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY);
    expect(factory).toBe(wrapper);

    runInInjectionContext(injector, () => {
      factory(emptyQueries());
    });
    expect(wrapperCalls).toBe(1);
  });
});
