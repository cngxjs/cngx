import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxFilterEditorComponent } from './filter-builder-editor.contract';

import {
  CNGX_FILTER_BUILDER_CONFIG,
  CNGX_FILTER_BUILDER_DEFAULTS,
  injectFilterBuilderConfig,
  isNativeEditor,
  provideFilterBuilderConfig,
  provideFilterBuilderConfigAt,
  withDefaultOperators,
  withFilterBuilderI18n,
  withLogicOptions,
  withMaxNestingDepth,
  withNegation,
  withSkeletonCount,
  withTemplates,
  type CngxFilterBuilderConfig,
} from './filter-builder.config';

@Component({ template: '' })
class TokenProbe {
  readonly config: CngxFilterBuilderConfig = injectFilterBuilderConfig();
  readonly resolvedConfig = inject(CNGX_FILTER_BUILDER_CONFIG);
}

function setupRoot(...providers: ReturnType<typeof provideFilterBuilderConfig>[]): TokenProbe {
  TestBed.configureTestingModule({ providers });
  return TestBed.createComponent(TokenProbe).componentInstance;
}

describe('filter-builder.config', () => {
  describe('library defaults', () => {
    it('resolves CNGX_FILTER_BUILDER_DEFAULTS through the root token without explicit provide', () => {
      const probe = setupRoot();
      expect(probe.config).toBe(CNGX_FILTER_BUILDER_DEFAULTS);
    });

    it('ships English defaults for the i18n surface', () => {
      const i18n = CNGX_FILTER_BUILDER_DEFAULTS.i18n;
      expect(i18n.addFilter).toBe('Add filter');
      expect(i18n.removeGroup).toBe('Remove filter group');
      expect(i18n.xor).toBe('XOR');
      expect(i18n.operators['contains']).toBe('Contains');
      expect(i18n.operators['gte']).toBe('Greater than or equal');
    });

    it('does not expose nand / nor labels', () => {
      const operators = CNGX_FILTER_BUILDER_DEFAULTS.i18n.operators;
      expect(operators).not.toHaveProperty('nand');
      expect(operators).not.toHaveProperty('nor');
    });

    it('logicOptions defaults to and / or', () => {
      expect(CNGX_FILTER_BUILDER_DEFAULTS.logicOptions).toEqual(['and', 'or']);
    });

    it('negation defaults to disabled', () => {
      expect(CNGX_FILTER_BUILDER_DEFAULTS.negationEnabled).toBe(false);
    });

    it('skeletonCount defaults to 3', () => {
      expect(CNGX_FILTER_BUILDER_DEFAULTS.skeletonCount).toBe(3);
    });
  });

  describe('isNativeEditor narrowing', () => {
    it('returns true for the three native sentinels', () => {
      expect(isNativeEditor('native:string')).toBe(true);
      expect(isNativeEditor('native:number')).toBe(true);
      expect(isNativeEditor('native:date')).toBe(true);
    });

    it('returns false for component classes', () => {
      @Component({
        selector: 'cngx-fixture-editor',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: '',
      })
      class FixtureEditor implements CngxFilterEditorComponent<unknown> {
        readonly value = model<unknown | null>(null);
      }
      expect(isNativeEditor(FixtureEditor)).toBe(false);
    });
  });

  describe('provideFilterBuilderConfig + features', () => {
    it('withFilterBuilderI18n deep-merges operator labels across stacked calls', () => {
      const probe = setupRoot(
        provideFilterBuilderConfig(
          withFilterBuilderI18n({ addFilter: 'Filter hinzufügen' }),
          withFilterBuilderI18n({ operators: { contains: 'Enthält' } }),
        ),
      );
      expect(probe.config.i18n.addFilter).toBe('Filter hinzufügen');
      expect(probe.config.i18n.operators['contains']).toBe('Enthält');
      expect(probe.config.i18n.operators['eq']).toBe('Equals');
    });

    it('withMaxNestingDepth replaces the scalar', () => {
      const probe = setupRoot(provideFilterBuilderConfig(withMaxNestingDepth(3)));
      expect(probe.config.maxNestingDepth).toBe(3);
    });

    it('withDefaultOperators adds new editor keys without dropping builtins', () => {
      const probe = setupRoot(
        provideFilterBuilderConfig(withDefaultOperators({ duration: ['gt', 'lt'] })),
      );
      expect(probe.config.defaultOperators['duration']).toEqual(['gt', 'lt']);
      expect(probe.config.defaultOperators['string']).toContain('contains');
    });

    it('withLogicOptions overrides the surfaced operator list', () => {
      const probe = setupRoot(provideFilterBuilderConfig(withLogicOptions(['and', 'or', 'xor'])));
      expect(probe.config.logicOptions).toEqual(['and', 'or', 'xor']);
    });

    it('withNegation toggles the surface flag', () => {
      const probe = setupRoot(provideFilterBuilderConfig(withNegation(true)));
      expect(probe.config.negationEnabled).toBe(true);
    });

    it('withSkeletonCount overrides the loading-skeleton row count', () => {
      const probe = setupRoot(provideFilterBuilderConfig(withSkeletonCount(7)));
      expect(probe.config.skeletonCount).toBe(7);
    });

    it('withTemplates merges template refs into the slot map', () => {
      const probe = setupRoot(
        provideFilterBuilderConfig(withTemplates({ removeButton: null })),
      );
      expect(probe.config.templates).toHaveProperty('removeButton', null);
    });
  });

  describe('provideFilterBuilderConfigAt', () => {
    it('returns a Provider array suitable for viewProviders', () => {
      const providers = provideFilterBuilderConfigAt(withNegation(true));
      expect(providers).toHaveLength(1);
      expect(providers[0]).toHaveProperty('provide', CNGX_FILTER_BUILDER_CONFIG);
    });
  });
});
