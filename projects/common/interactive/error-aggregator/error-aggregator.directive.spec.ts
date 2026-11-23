import { Component, effect, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { stripBidiIsolates } from '@cngx/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxErrorRegistry } from '../error-registry/error-registry';
import { provideErrorRegistry } from '../error-registry/provide-error-registry';
import { CngxErrorScope } from '../error-scope/error-scope.directive';
import { CngxErrorSource } from '../error-source/error-source.directive';
import {
  provideInteractiveI18n,
  withInteractiveI18nLabels,
  type CngxInteractiveI18n,
} from '../i18n/interactive-i18n';
import { CngxErrorAggregator } from './error-aggregator.directive';

@Component({
  template: `<div cngxErrorAggregator #agg="cngxErrorAggregator"></div>`,
  imports: [CngxErrorAggregator],
})
class BareHost {}

@Component({
  template: `
    @if (show()[0]) {
      <div cngxErrorAggregator cngxErrorAggregatorName="shared">
        <span [cngxErrorSource]="'a'" [when]="active()[0]" [label]="'A failed'"></span>
      </div>
    }
    @if (show()[1]) {
      <div cngxErrorAggregator cngxErrorAggregatorName="shared">
        <span [cngxErrorSource]="'b'" [when]="active()[1]" [label]="'B failed'"></span>
      </div>
    }
  `,
  imports: [CngxErrorAggregator, CngxErrorSource],
})
class DuplicateNameHost {
  readonly show = signal<readonly [boolean, boolean]>([true, true]);
  readonly active = signal<readonly [boolean, boolean]>([false, false]);
}

@Component({
  template: `
    <div cngxErrorAggregator #agg="cngxErrorAggregator">
      <span [cngxErrorSource]="'a'" [when]="aOn()" [label]="'A failed'"></span>
      <span [cngxErrorSource]="'b'" [when]="bOn()" [label]="'B failed'"></span>
    </div>
  `,
  imports: [CngxErrorAggregator, CngxErrorSource],
})
class TestHost {
  aOn = signal(false);
  bOn = signal(false);
}

@Component({
  template: `
    <form cngxErrorScope #scope="cngxErrorScope">
      <fieldset cngxErrorAggregator #agg="cngxErrorAggregator">
        <span [cngxErrorSource]="'a'" [when]="aOn()" [label]="'A'"></span>
      </fieldset>
    </form>
  `,
  imports: [CngxErrorScope, CngxErrorAggregator, CngxErrorSource],
})
class ScopedHost {
  aOn = signal(false);
}

@Component({
  template: `
    <div
      cngxErrorAggregator
      #agg="cngxErrorAggregator"
      [autoAnnounce]="auto()"
      [announcePoliteness]="politeness()"
    >
      <span [cngxErrorSource]="'a'" [when]="aOn()" [label]="'A failed'"></span>
    </div>
  `,
  imports: [CngxErrorAggregator, CngxErrorSource],
})
class AutoAnnounceHost {
  aOn = signal(false);
  auto = signal(true);
  politeness = signal<'polite' | 'assertive' | 'off'>('polite');
}

@Component({
  template: `
    <div cngxErrorAggregator [errorCountAnnouncement]="countFn()">
      <span [cngxErrorSource]="'a'" [when]="aOn()"></span>
      <span [cngxErrorSource]="'b'" [when]="bOn()"></span>
      <span [cngxErrorSource]="'c'" [when]="cOn()" [label]="'C failed'"></span>
    </div>
  `,
  imports: [CngxErrorAggregator, CngxErrorSource],
})
class CountHost {
  aOn = signal(false);
  bOn = signal(false);
  cOn = signal(false);
  countFn = signal<((count: number) => string) | undefined>(undefined);
}

function aggregatorOf(fixture: ReturnType<typeof TestBed.createComponent>): CngxErrorAggregator {
  const de = fixture.debugElement.query(By.directive(CngxErrorAggregator));
  return de.injector.get(CngxErrorAggregator);
}

describe('CngxErrorAggregator', () => {
  it('aggregates active error keys, count, and labels reactively', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const agg = aggregatorOf(fixture);

    expect(agg.hasError()).toBe(false);
    expect(agg.errorCount()).toBe(0);
    expect(agg.activeErrors()).toEqual([]);
    expect(agg.errorLabels()).toEqual([]);

    fixture.componentInstance.aOn.set(true);
    fixture.detectChanges();
    expect(agg.hasError()).toBe(true);
    expect(agg.errorCount()).toBe(1);
    expect(agg.activeErrors()).toEqual(['a']);
    expect(agg.errorLabels()).toEqual(['A failed']);

    fixture.componentInstance.bOn.set(true);
    fixture.detectChanges();
    expect(agg.errorCount()).toBe(2);
    expect(agg.errorLabels()).toEqual(['A failed', 'B failed']);
  });

  it('binds reactive class.cngx-error and aria-invalid to shouldShow()', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxErrorAggregator))
      .nativeElement as HTMLElement;

    expect(el.classList.contains('cngx-error')).toBe(false);
    expect(el.getAttribute('aria-invalid')).toBe('false');

    fixture.componentInstance.aOn.set(true);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-error')).toBe(true);
    expect(el.getAttribute('aria-invalid')).toBe('true');
  });

  it('shouldShow gates on the resolved scope (ancestor scope, hidden by default)', () => {
    const fixture = TestBed.createComponent(ScopedHost);
    fixture.detectChanges();
    const agg = aggregatorOf(fixture);
    const scope = fixture.debugElement
      .query(By.directive(CngxErrorScope))
      .injector.get(CngxErrorScope);
    void agg;

    fixture.componentInstance.aOn.set(true);
    fixture.detectChanges();
    expect(agg.hasError()).toBe(true);
    expect(agg.shouldShow()).toBe(false);
    expect(agg.announcement()).toBe('');

    scope.reveal();
    fixture.detectChanges();
    expect(agg.shouldShow()).toBe(true);
    expect(agg.announcement()).toBe('A');

    scope.reset();
    fixture.detectChanges();
    expect(agg.shouldShow()).toBe(false);
    expect(agg.announcement()).toBe('');
  });

  // Cascade-witness regression. The Map `equal` fn rejects redundant
  // addSource emissions whose entries hold the same condition Signal
  // reference per key. activeErrors's structural array `equal` then
  // suppresses downstream emission for any add that does not change the
  // active-error set. Together these prevent every effect reading
  // aggregator surface from re-firing on identical re-registrations.
  //
  // Mechanic: instrument an effect with a vi.fn spy; baseline + delta
  // assertions per the plan's Phase 6a commit-5 spec (lines 1042-1065
  // post-revision §State Surface insertion).
  it('cascade-witness: redundant adds do NOT re-fire downstream effects', () => {
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const agg = aggregatorOf(fixture);

    const conditionA = signal(false);
    const conditionB = signal(false);
    const conditionC = signal(false);
    const refA: Signal<boolean> = conditionA.asReadonly();
    const refB: Signal<boolean> = conditionB.asReadonly();
    const refC: Signal<boolean> = conditionC.asReadonly();

    agg.addSource({ key: 'a', condition: refA, label: 'A' });
    agg.addSource({ key: 'b', condition: refB, label: 'B' });

    const witness = vi.fn(() => agg.activeErrors());
    TestBed.runInInjectionContext(() => {
      effect(() => {
        witness();
      });
    });
    TestBed.flushEffects();
    const baseline = witness.mock.calls.length;
    expect(baseline).toBeGreaterThanOrEqual(1);

    // (1) Genuine change - A flips false → true. Witness MUST re-fire.
    conditionA.set(true);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    // (2) A.set(true) again - Object.is short-circuits the condition signal,
    // no upstream emission. Witness does NOT re-fire.
    conditionA.set(true);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    // (3) Re-add A with the same key + same condition Signal reference -
    // Map `equal` rejects the redundant emission. Witness does NOT re-fire.
    agg.addSource({ key: 'a', condition: refA, label: 'A' });
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    // (4) Add NEW key 'c' with condition value `false`. Map equal rejects
    // (new key set), but activeErrors stays ['a'] because c is inactive,
    // and the array `equal` short-circuits the downstream emission.
    // Witness does NOT re-fire.
    agg.addSource({ key: 'c', condition: refC, label: 'C' });
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 1);

    // (5) Flip C to true - real change to activeErrors → witness MUST fire.
    conditionC.set(true);
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 2);

    // (6) Remove C - real change → witness MUST fire.
    agg.removeSource('c');
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 3);

    // (7) Remove a non-existent key - no Map emission → witness does NOT fire.
    agg.removeSource('nonexistent');
    TestBed.flushEffects();
    expect(witness.mock.calls.length).toBe(baseline + 3);
  });

  describe('auto-announce', () => {
    function hostOf(fixture: ReturnType<typeof TestBed.createComponent>): HTMLElement {
      return fixture.debugElement.query(By.directive(CngxErrorAggregator))
        .nativeElement as HTMLElement;
    }

    function spanOf(fixture: ReturnType<typeof TestBed.createComponent>): HTMLSpanElement | null {
      return hostOf(fixture).querySelector('span[aria-live]');
    }

    it('appends a visually-hidden live-region span on init with the correct ARIA + inline sr-only styles', () => {
      const fixture = TestBed.createComponent(AutoAnnounceHost);
      fixture.detectChanges();

      const span = spanOf(fixture);
      expect(span).not.toBeNull();
      expect(span!.getAttribute('role')).toBe('status');
      expect(span!.getAttribute('aria-live')).toBe('polite');
      expect(span!.getAttribute('aria-atomic')).toBe('true');
      expect(span!.getAttribute('aria-relevant')).toBe('additions text');

      // Visually hidden via inline `--cngx-sr-only-*` custom properties, NOT
      // the global `.cngx-sr-only` utility class (a library directive cannot
      // require the consumer to ship `core/theming/utilities.css`).
      const cssText = span!.style.cssText;
      expect(cssText).toContain('var(--cngx-sr-only-position');
      expect(cssText).toContain('var(--cngx-sr-only-overflow');
      expect(span!.classList.contains('cngx-sr-only')).toBe(false);
    });

    it('updates span textContent reactively to announcement()', () => {
      const fixture = TestBed.createComponent(AutoAnnounceHost);
      fixture.detectChanges();
      const span = spanOf(fixture)!;
      expect(span.textContent).toBe('');

      fixture.componentInstance.aOn.set(true);
      fixture.detectChanges();
      expect(span.textContent).toBe('A failed');
    });

    // Loop-freedom guards the `untracked` wrap around the textContent write.
    // Without it the imperative DOM side effect would silently subscribe to
    // any signal it touches and re-enter on the next flush.
    it('is loop-free: repeated flushEffects with no source change does not re-enter', () => {
      const fixture = TestBed.createComponent(AutoAnnounceHost);
      fixture.detectChanges();

      expect(() => {
        TestBed.flushEffects();
        TestBed.flushEffects();
        TestBed.flushEffects();
      }).not.toThrow();
    });

    it('skips span creation entirely when [autoAnnounce]="false"', () => {
      const fixture = TestBed.createComponent(AutoAnnounceHost);
      fixture.componentInstance.auto.set(false);
      fixture.detectChanges();

      expect(spanOf(fixture)).toBeNull();
    });

    it('flips role="alert" and aria-live="assertive" when [announcePoliteness]="assertive"', () => {
      const fixture = TestBed.createComponent(AutoAnnounceHost);
      fixture.componentInstance.politeness.set('assertive');
      fixture.detectChanges();

      const span = spanOf(fixture)!;
      expect(span.getAttribute('role')).toBe('alert');
      expect(span.getAttribute('aria-live')).toBe('assertive');
    });

    it('removes the span from the host element on destroy', () => {
      const fixture = TestBed.createComponent(AutoAnnounceHost);
      fixture.detectChanges();
      const host = hostOf(fixture);
      expect(host.querySelector('span[aria-live]')).not.toBeNull();

      fixture.destroy();
      expect(host.querySelector('span[aria-live]')).toBeNull();
    });
  });

  // Regression: the source-map equal fn must compare entry.label too, otherwise
  // re-registering an active source with a fresh label silently drops the
  // update and errorLabels()/announcement() stay stale.
  it('label change on an active source propagates to errorLabels()', () => {
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const agg = aggregatorOf(fixture);

    const conditionA = signal(true);
    const refA: Signal<boolean> = conditionA.asReadonly();

    agg.addSource({ key: 'a', condition: refA, label: 'Old label' });
    TestBed.flushEffects();
    expect(agg.errorLabels()).toEqual(['Old label']);

    agg.addSource({ key: 'a', condition: refA, label: 'New label' });
    TestBed.flushEffects();
    expect(agg.errorLabels()).toEqual(['New label']);
  });
});

describe('CngxErrorAggregator registry registration', () => {
  it('hands a shared name to the waiting aggregator once the holder is destroyed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: [provideErrorRegistry()] });
    const fixture = TestBed.createComponent(DuplicateNameHost);
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.flushEffects();

    const registry = TestBed.inject(CngxErrorRegistry);
    const aggregators = fixture.debugElement
      .queryAll(By.directive(CngxErrorAggregator))
      .map((de) => de.injector.get(CngxErrorAggregator));
    const holderIndex = aggregators.indexOf(
      registry.getAggregator('shared') as CngxErrorAggregator,
    );
    expect(holderIndex).toBeGreaterThanOrEqual(0);
    const waitingIndex = 1 - holderIndex;
    expect(warn).toHaveBeenCalledTimes(1);

    // Only the waiting aggregator has an error; the registry cannot see it yet.
    fixture.componentInstance.active.set(waitingIndex === 0 ? [true, false] : [false, true]);
    fixture.detectChanges();
    expect(registry.hasAnyError()).toBe(false);

    fixture.componentInstance.show.set(holderIndex === 0 ? [false, true] : [true, false]);
    fixture.detectChanges();
    expect(registry.getAggregator('shared')).toBe(aggregators[waitingIndex]);
    expect(registry.hasAnyError()).toBe(true);
    warn.mockRestore();
  });
});

describe('CngxErrorAggregator count announcement', () => {
  function setupCount() {
    const fixture = TestBed.createComponent(CountHost);
    fixture.detectChanges();
    const agg = aggregatorOf(fixture);
    const region = (): string =>
      stripBidiIsolates(
        (fixture.debugElement.query(By.directive(CngxErrorAggregator)).nativeElement as HTMLElement)
          .querySelector('span[aria-live]')?.textContent ?? '',
      );
    return { fixture, host: fixture.componentInstance, agg, region };
  }

  it('speaks the count when no active source has a label', () => {
    const { fixture, host, agg, region } = setupCount();
    host.aOn.set(true);
    fixture.detectChanges();
    expect(stripBidiIsolates(agg.announcement())).toBe('1 error');
    expect(region()).toBe('1 error');

    host.bOn.set(true);
    fixture.detectChanges();
    expect(stripBidiIsolates(agg.announcement())).toBe('2 errors');
    expect(region()).toBe('2 errors');
  });

  it('speaks the labels only when at least one active source has a label', () => {
    const { fixture, host, region } = setupCount();
    host.aOn.set(true);
    host.cOn.set(true);
    fixture.detectChanges();
    expect(region()).toBe('C failed');
  });

  it('lets a bound [errorCountAnnouncement] win over the token', () => {
    const { fixture, host, region } = setupCount();
    host.countFn.set((count) => `Bound ${count}`);
    host.aOn.set(true);
    fixture.detectChanges();
    expect(region()).toBe('Bound 1');
  });

  it('lets a provideInteractiveI18n override win over the default', () => {
    TestBed.configureTestingModule({
      providers: [
        provideInteractiveI18n(
          withInteractiveI18nLabels({ errorCountAnnouncement: (count) => `Token ${count}` }),
        ),
      ],
    });
    const { fixture, host, region } = setupCount();
    host.aOn.set(true);
    fixture.detectChanges();
    expect(region()).toBe('Token 1');
  });

  it('does not re-announce on a language flip', () => {
    const labels = signal<Partial<CngxInteractiveI18n>>({
      errorCountAnnouncement: (count) => `First ${count}`,
    });
    TestBed.configureTestingModule({
      providers: [provideInteractiveI18n(withInteractiveI18nLabels(labels))],
    });
    const { fixture, host, region } = setupCount();
    host.aOn.set(true);
    fixture.detectChanges();
    expect(region()).toBe('First 1');

    labels.set({ errorCountAnnouncement: (count) => `Second ${count}` });
    fixture.detectChanges();
    expect(region()).toBe('First 1');

    host.bOn.set(true);
    fixture.detectChanges();
    expect(region()).toBe('Second 2');
  });
});
