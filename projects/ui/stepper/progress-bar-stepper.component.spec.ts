import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CngxStep,
  provideStepperI18n,
  withStepperI18nLabels,
} from '@cngx/common/stepper';

import { CngxProgressBarStepper } from './progress-bar-stepper.component';

@Component({
  standalone: true,
  imports: [CngxProgressBarStepper, CngxStep],
  template: `
    <cngx-progress-bar-stepper
      [(activeStepIndex)]="active"
      [showStepCount]="true"
      aria-label="Onboarding"
    >
      <div cngxStep label="A"></div>
      <div cngxStep label="B"></div>
      <div cngxStep label="C"></div>
      <div cngxStep label="D"></div>
    </cngx-progress-bar-stepper>
  `,
})
class Host {
  active = signal(0);
}

describe('CngxProgressBarStepper', () => {
  it('host carries role="group" + aria-roledescription="stepper"', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-progress-bar-stepper') as HTMLElement;
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-roledescription')).toBe('stepper');
    expect(host.getAttribute('aria-label')).toBe('Onboarding');
  });

  it('renders an inner <cngx-progress> with aria-valuenow derived from activeStepIndex', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const progress = fixture.nativeElement.querySelector('cngx-progress') as HTMLElement;
    expect(progress).toBeTruthy();
    // 4 steps, denominator = max(4-1, 1) = 3; active 0 -> 0%.
    expect(progress.getAttribute('aria-valuenow')).toBe('0');
  });

  it('advances the bar percentage as activeStepIndex grows', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.active.set(2);
    fixture.detectChanges();
    const progress = fixture.nativeElement.querySelector('cngx-progress') as HTMLElement;
    // 4 steps, active 2 -> 2/3 * 100 = 66.66...; cngx-progress floors when rendering.
    const value = Number(progress.getAttribute('aria-valuenow'));
    expect(value).toBeGreaterThan(60);
    expect(value).toBeLessThanOrEqual(67);
  });

  it('reaches 100% when activeStepIndex hits the last step', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.active.set(3);
    fixture.detectChanges();
    const progress = fixture.nativeElement.querySelector('cngx-progress') as HTMLElement;
    expect(progress.getAttribute('aria-valuenow')).toBe('100');
  });

  it('renders Step N of M caption when [showStepCount] is on', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.active.set(1);
    fixture.detectChanges();
    const caption = fixture.nativeElement.querySelector(
      '.cngx-progress-bar-stepper__caption',
    ) as HTMLElement;
    expect(caption.textContent?.trim()).toBe('Step 2 of 4');
  });

  it('respects withStepperI18nLabels({ textStepperFormat })', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperI18n(
          withStepperI18nLabels({
            textStepperFormat: (cur, total) => `Schritt ${cur}/${total}`,
          }),
        ),
      ],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.active.set(2);
    fixture.detectChanges();
    const caption = fixture.nativeElement.querySelector(
      '.cngx-progress-bar-stepper__caption',
    ) as HTMLElement;
    expect(caption.textContent?.trim()).toBe('Schritt 3/4');
  });

  it('omits the caption when [showStepCount] is off', () => {
    @Component({
      standalone: true,
      imports: [CngxProgressBarStepper, CngxStep],
      template: `
        <cngx-progress-bar-stepper aria-label="No caption">
          <div cngxStep label="A"></div>
          <div cngxStep label="B"></div>
        </cngx-progress-bar-stepper>
      `,
    })
    class NoCaptionHost {}

    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(NoCaptionHost);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.cngx-progress-bar-stepper__caption'),
    ).toBeNull();
  });
});
