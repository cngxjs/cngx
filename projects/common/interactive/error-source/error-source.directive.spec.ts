import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CngxErrorAggregator } from '../error-aggregator/error-aggregator.directive';
import { CngxErrorSource } from './error-source.directive';

@Component({
  template: `
    <div cngxErrorAggregator #agg="cngxErrorAggregator">
      <span
        [cngxErrorSource]="'src-a'"
        [when]="aOn()"
        [label]="'A'"
      ></span>
      @if (showB()) {
        <span
          [cngxErrorSource]="'src-b'"
          [when]="bOn()"
          [label]="'B'"
        ></span>
      }
    </div>
  `,
  imports: [CngxErrorAggregator, CngxErrorSource],
})
class TestHost {
  aOn = signal(false);
  bOn = signal(false);
  showB = signal(true);
}

@Component({
  template: ` <span [cngxErrorSource]="'orphan'" [when]="false"></span> `,
  imports: [CngxErrorSource],
})
class OrphanHost {}

@Component({
  template: `
    <div cngxErrorAggregator>
      @if (showFirst()) {
        <span [cngxErrorSource]="'email'" [when]="firstOn()" [label]="firstLabel()"></span>
      }
      @if (showSecond()) {
        <span [cngxErrorSource]="'email'" [when]="secondOn()" [label]="'Second'"></span>
      }
    </div>
  `,
  imports: [CngxErrorAggregator, CngxErrorSource],
})
class DuplicateKeyHost {
  showFirst = signal(true);
  showSecond = signal(true);
  firstOn = signal(true);
  secondOn = signal(false);
  firstLabel = signal('First');
}

@Component({
  template: `
    <div cngxErrorAggregator>
      <span [cngxErrorSource]="key()" [when]="true" [label]="'Key'"></span>
    </div>
  `,
  imports: [CngxErrorAggregator, CngxErrorSource],
})
class RenameKeyHost {
  key = signal('old');
}

function aggregatorOf(fixture: ReturnType<typeof TestBed.createComponent>): CngxErrorAggregator {
  const de = fixture.debugElement.query(By.directive(CngxErrorAggregator));
  return de.injector.get(CngxErrorAggregator);
}

describe('CngxErrorSource', () => {
  it('registers with the ancestor aggregator and reflects condition changes', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const agg = aggregatorOf(fixture);
    expect(agg.errorCount()).toBe(0);

    fixture.componentInstance.aOn.set(true);
    fixture.detectChanges();
    expect(agg.errorCount()).toBe(1);
    expect(agg.activeErrors()).toEqual(['src-a']);
    expect(agg.errorLabels()).toEqual(['A']);

    fixture.componentInstance.bOn.set(true);
    fixture.detectChanges();
    expect(agg.errorCount()).toBe(2);
    expect(agg.errorLabels()).toEqual(['A', 'B']);
  });

  it('removes its registration when destroyed', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const agg = aggregatorOf(fixture);
    fixture.componentInstance.aOn.set(true);
    fixture.componentInstance.bOn.set(true);
    fixture.detectChanges();
    expect(agg.errorCount()).toBe(2);

    fixture.componentInstance.showB.set(false);
    fixture.detectChanges();
    expect(agg.errorCount()).toBe(1);
    expect(agg.activeErrors()).toEqual(['src-a']);
  });

  it('is a no-op when no aggregator ancestor is present', () => {
    expect(() => {
      const fixture = TestBed.createComponent(OrphanHost);
      fixture.detectChanges();
      fixture.destroy();
    }).not.toThrow();
  });

  it('moves its entry to the new key on a key rename', () => {
    const fixture = TestBed.createComponent(RenameKeyHost);
    fixture.detectChanges();
    const agg = aggregatorOf(fixture);
    expect(agg.activeErrors()).toEqual(['old']);

    fixture.componentInstance.key.set('new');
    fixture.detectChanges();
    expect(agg.activeErrors()).toEqual(['new']);
    expect(agg.errorCount()).toBe(1);
  });

  describe('duplicate keys', () => {
    afterEach(() => vi.restoreAllMocks());

    function setupDuplicates() {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fixture = TestBed.createComponent(DuplicateKeyHost);
      fixture.detectChanges();
      return { fixture, host: fixture.componentInstance, agg: aggregatorOf(fixture) };
    }

    it('re-surfaces the earlier source when the later one is destroyed', () => {
      const { fixture, host, agg } = setupDuplicates();
      expect(agg.hasError()).toBe(false);

      host.showSecond.set(false);
      fixture.detectChanges();
      expect(agg.hasError()).toBe(true);
      expect(agg.errorLabels()).toEqual(['First']);
    });

    it('keeps the later source when the earlier one is destroyed', () => {
      const { fixture, host, agg } = setupDuplicates();
      host.secondOn.set(true);
      host.showFirst.set(false);
      fixture.detectChanges();
      expect(agg.hasError()).toBe(true);
      expect(agg.errorLabels()).toEqual(['Second']);
    });

    it('keeps one entry per key when a duplicate changes its label', () => {
      const { fixture, host, agg } = setupDuplicates();
      host.secondOn.set(true);
      host.firstLabel.set('First renamed');
      fixture.detectChanges();
      expect(agg.activeErrors()).toEqual(['email']);
      expect(agg.errorCount()).toBe(1);
    });
  });
});
