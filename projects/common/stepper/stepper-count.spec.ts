import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

describe('CngxStepperCount consumer format', () => {
  @Component({
    standalone: true,
    imports: [CngxStepperCount],
    template: `<cngx-stepper-count [host]="host" [format]="format()" />`,
  })
  class FormatHost {
    readonly lang = signal<'en' | 'de'>('en');
    readonly format = computed(() =>
      this.lang() === 'de'
        ? (c: number, t: number) => `${c} von ${t}`
        : (c: number, t: number) => `${c} of ${t}`,
    );
    host = stubHost(0, 3);
  }

  it('does not re-announce on a language flip of a consumer format', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(FormatHost);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('cngx-stepper-count > span') as HTMLElement;
    expect(span.textContent).toBe('1 of 3');

    fixture.componentInstance.lang.set('de');
    fixture.detectChanges();
    expect(span.textContent).toBe('1 of 3');

    (fixture.componentInstance.host.activeStepIndex as ReturnType<typeof signal<number>>).set(1);
    fixture.detectChanges();
    expect(span.textContent).toBe('2 von 3');
  });
});

@Component({
  standalone: true,
  imports: [CngxStepperCount],
  template: `<cngx-stepper-count />`,
})
class UnhostedCount {}

describe('CngxStepperCount without a stepper (CNGX1056)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setup<T>(host: new () => T): string[] {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    warnSpy.mockClear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(host);
    fixture.detectChanges();
    TestBed.tick();
    return warnSpy.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => message.startsWith('CNGX1056: '));
  }

  it('warns when neither [host] nor an ambient stepper exists', () => {
    const warnings = setup(UnhostedCount);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^CNGX1056: \[cngx-stepper-count\] has no stepper\./);
  });

  it('stays silent with a bound [host]', () => {
    expect(setup(CountHost)).toHaveLength(0);
  });
});
