import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxErrorRegistry } from './error-registry';
import { injectErrorAggregator } from './inject-error-aggregator';
import { injectErrorScope } from './inject-error-scope';

describe('injectErrorAggregator', () => {
  describe('reactive contract (no registry)', () => {
    it('exposes empty surface when no sources are supplied', () => {
      @Component({ template: '', standalone: true })
      class Host {
        readonly agg = injectErrorAggregator();
      }
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(Host);
      const { agg } = fixture.componentInstance;

      expect(agg.hasError()).toBe(false);
      expect(agg.errorCount()).toBe(0);
      expect(agg.activeErrors()).toEqual([]);
      expect(agg.errorLabels()).toEqual([]);
      expect(agg.shouldShow()).toBe(false);
      expect(agg.announcement()).toBe('');
    });

    it('reflects active sources reactively without scope (shouldShow == hasError)', () => {
      const a = signal(false);
      const b = signal(false);

      @Component({ template: '', standalone: true })
      class Host {
        readonly agg = injectErrorAggregator(
          undefined,
          { a: a.asReadonly(), b: b.asReadonly() },
          undefined,
          { a: 'A', b: 'B' },
        );
      }
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(Host);
      const { agg } = fixture.componentInstance;

      expect(agg.hasError()).toBe(false);
      expect(agg.shouldShow()).toBe(false);

      a.set(true);
      TestBed.flushEffects();
      expect(agg.hasError()).toBe(true);
      expect(agg.errorCount()).toBe(1);
      expect(agg.activeErrors()).toEqual(['a']);
      expect(agg.errorLabels()).toEqual(['A']);
      expect(agg.shouldShow()).toBe(true);
      expect(agg.announcement()).toBe('A');

      b.set(true);
      TestBed.flushEffects();
      expect(agg.errorCount()).toBe(2);
      expect(agg.errorLabels()).toEqual(['A', 'B']);
      expect(agg.announcement()).toBe('A, B');
    });

    it('addSource / removeSource mutate the source map at runtime', () => {
      @Component({ template: '', standalone: true })
      class Host {
        readonly agg = injectErrorAggregator();
      }
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(Host);
      const { agg } = fixture.componentInstance;

      const cond = signal(true);
      agg.addSource({ key: 'k', condition: cond.asReadonly(), label: 'K' });
      TestBed.flushEffects();
      expect(agg.hasError()).toBe(true);
      expect(agg.activeErrors()).toEqual(['k']);

      agg.removeSource('k');
      TestBed.flushEffects();
      expect(agg.hasError()).toBe(false);
      expect(agg.activeErrors()).toEqual([]);
    });

    it('omits labels for entries without a label string', () => {
      const a = signal(true);
      const b = signal(true);

      @Component({ template: '', standalone: true })
      class Host {
        readonly agg = injectErrorAggregator(
          undefined,
          { a: a.asReadonly(), b: b.asReadonly() },
          undefined,
          { a: 'A' },
        );
      }
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(Host);
      const { agg } = fixture.componentInstance;

      expect(agg.errorLabels()).toEqual(['A']);
      expect(agg.announcement()).toBe('A');
    });
  });

  describe('scope override gating', () => {
    it('shouldShow gates on the supplied scope contract', () => {
      const a = signal(true);

      @Component({ template: '', standalone: true })
      class Host {
        readonly scope = injectErrorScope();
        readonly agg = injectErrorAggregator(
          undefined,
          { a: a.asReadonly() },
          this.scope,
          { a: 'A' },
        );
      }
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(Host);
      const { scope, agg } = fixture.componentInstance;

      expect(agg.hasError()).toBe(true);
      expect(agg.shouldShow()).toBe(false);
      expect(agg.announcement()).toBe('');

      scope.reveal();
      TestBed.flushEffects();
      expect(agg.shouldShow()).toBe(true);
      expect(agg.announcement()).toBe('A');

      scope.reset();
      TestBed.flushEffects();
      expect(agg.shouldShow()).toBe(false);
      expect(agg.announcement()).toBe('');
    });
  });

  describe('registry auto-registration', () => {
    @Component({ template: '', standalone: true })
    class HostWithName {
      readonly registry = inject(CngxErrorRegistry, { optional: true });
      readonly agg = injectErrorAggregator('field-a');
    }

    it('does not register when no registry is provided', () => {
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(HostWithName);
      expect(fixture.componentInstance.registry).toBeNull();
      expect(fixture.componentInstance.agg.hasError()).toBe(false);
    });

    it('auto-registers under the supplied name when a registry is provided', () => {
      TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
      const registry = TestBed.inject(CngxErrorRegistry);
      expect(registry.getAggregator('field-a')).toBeUndefined();

      const fixture = TestBed.createComponent(HostWithName);
      expect(registry.getAggregator('field-a')).toBe(fixture.componentInstance.agg);
    });

    it('auto-deregisters on host destroy', () => {
      TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
      const registry = TestBed.inject(CngxErrorRegistry);
      const fixture = TestBed.createComponent(HostWithName);
      expect(registry.getAggregator('field-a')).toBeDefined();

      fixture.destroy();
      expect(registry.getAggregator('field-a')).toBeUndefined();
    });

    it('skips registration when no name is given even with a registry present', () => {
      @Component({ template: '', standalone: true })
      class Host {
        readonly agg = injectErrorAggregator();
      }
      TestBed.configureTestingModule({ providers: [CngxErrorRegistry] });
      const registry = TestBed.inject(CngxErrorRegistry);

      const fixture = TestBed.createComponent(Host);
      void fixture.componentInstance.agg;
      expect(registry.errorAggregators()).toEqual([]);
    });
  });
});
