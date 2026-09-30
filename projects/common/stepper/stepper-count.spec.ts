import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { provideStepperI18n, withStepperI18nLabels } from './i18n/stepper-i18n';
import { CngxStepperCount, type CngxStepperCountHost } from './stepper-count';
import { type CngxStepNode } from './stepper-host.token';

function stubHost(active: number, total: number): CngxStepperCountHost {
  const steps = Array.from(
    { length: total },
    (_, i) => ({ id: `s${i}` }) as unknown as CngxStepNode,
  );
  return {
    activeStepIndex: signal(active),
    stepsOnly: signal(steps),
  };
}

@Component({
  standalone: true,
  imports: [CngxStepperCount],
  template: `<cngx-stepper-count [live]="live" [host]="host" />`,
})
class CountHost {
  live = true;
  host: CngxStepperCountHost | null = stubHost(0, 3);
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

describe('CngxStepperCount language switch', () => {
  it('does not re-announce on a language flip', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperI18n(
          withStepperI18nLabels(
            computed(() =>
              lang() === 'de'
                ? { textStepperFormat: (c: number, t: number) => `Schritt ${c} von ${t}` }
                : {},
            ),
          ),
        ),
      ],
    });
    const fixture = TestBed.createComponent(CountHost);
    const host = stubHost(0, 3);
    fixture.componentInstance.host = host;
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('cngx-stepper-count > span') as HTMLElement;
    expect(span.textContent).toBe('Step 1 of 3');

    lang.set('de');
    fixture.detectChanges();
    expect(span.textContent).toBe('Step 1 of 3');

    (host.activeStepIndex as ReturnType<typeof signal<number>>).set(1);
    fixture.detectChanges();
    expect(span.textContent).toBe('Schritt 2 von 3');
  });
});

describe('CngxStepperCount non-live caption', () => {
  it('follows a language flip at once when [live]="false"', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperI18n(
          withStepperI18nLabels(
            computed(() =>
              lang() === 'de'
                ? { textStepperFormat: (c: number, t: number) => `Schritt ${c} von ${t}` }
                : {},
            ),
          ),
        ),
      ],
    });
    const fixture = TestBed.createComponent(CountHost);
    fixture.componentInstance.live = false;
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('cngx-stepper-count > span') as HTMLElement;
    expect(span.textContent).toBe('Step 1 of 3');

    lang.set('de');
    fixture.detectChanges();
    expect(span.textContent).toBe('Schritt 1 von 3');
  });
});
