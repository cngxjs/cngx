import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { CngxStepperCount } from './stepper-count';
import { type CngxStepperHost } from './stepper-host.token';

function stubHost(active: number, total: number): CngxStepperHost {
  const steps = Array.from({ length: total }, (_, i) => ({ id: `s${i}` })) as unknown as CngxStepperHost['stepsOnly'] extends () => readonly (infer T)[] ? T[] : never;
  return {
    activeStepIndex: signal(active),
    stepsOnly: signal(steps),
  } as unknown as CngxStepperHost;
}

@Component({
  standalone: true,
  imports: [CngxStepperCount],
  template: `<cngx-stepper-count [live]="live" [host]="host" />`,
})
class CountHost {
  live = true;
  host: CngxStepperHost | null = stubHost(0, 3);
}

describe('CngxStepperCount aria-live', () => {
  it('wraps the caption in aria-live="polite" by default', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(CountHost);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('cngx-stepper-count > span') as HTMLElement;
    expect(span.getAttribute('aria-live')).toBe('polite');
  });

  it('drops aria-live when [live]="false" (silences nested counts)', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(CountHost);
    fixture.componentInstance.live = false;
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('cngx-stepper-count > span') as HTMLElement;
    expect(span.getAttribute('aria-live')).toBeNull();
  });
});
