import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
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
});
