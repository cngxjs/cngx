import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CngxStep,
  provideStepperI18n,
  withStepperI18nLabels,
} from '@cngx/common/stepper';

import { CngxTextStepper } from './text-stepper.component';

@Component({
  standalone: true,
  imports: [CngxTextStepper, CngxStep],
  template: `
    <cngx-text-stepper [(activeStepIndex)]="active">
      <div cngxStep label="Customer"></div>
      <div cngxStep label="Payment"></div>
      <div cngxStep label="Review"></div>
    </cngx-text-stepper>
  `,
})
class Host {
  active = signal(0);
}

@Component({
  standalone: true,
  imports: [CngxTextStepper, CngxStep],
  template: `
    <cngx-text-stepper [(activeStepIndex)]="active" [showCurrentLabel]="true">
      <div cngxStep label="Customer"></div>
      <div cngxStep label="Payment"></div>
      <div cngxStep label="Review"></div>
    </cngx-text-stepper>
  `,
})
class HostWithLabel {
  active = signal(1);
}

describe('CngxTextStepper', () => {
  it('renders the i18n-sourced "Step N of M" text', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.cngx-text-stepper__text') as HTMLElement;
    expect(text.textContent?.trim()).toBe('Step 1 of 3');
  });

  it('updates the text reactively when activeStepIndex changes', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.componentInstance.active.set(2);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.cngx-text-stepper__text') as HTMLElement;
    expect(text.textContent?.trim()).toBe('Step 3 of 3');
  });

  it('uses aria-live="polite" so transitions announce', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.cngx-text-stepper__text') as HTMLElement;
    expect(text.getAttribute('aria-live')).toBe('polite');
  });

  it('[showCurrentLabel] appends the active step label after a colon', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostWithLabel);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.cngx-text-stepper__text') as HTMLElement;
    expect(text.textContent?.trim()).toBe('Step 2 of 3: Payment');
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
    const text = fixture.nativeElement.querySelector('.cngx-text-stepper__text') as HTMLElement;
    expect(text.textContent?.trim()).toBe('Schritt 1/3');
  });

  it('renders "Step 0 of 0" when there are no projected steps', () => {
    @Component({
      standalone: true,
      imports: [CngxTextStepper],
      template: `<cngx-text-stepper></cngx-text-stepper>`,
    })
    class EmptyHost {}
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.cngx-text-stepper__text') as HTMLElement;
    expect(text.textContent?.trim()).toBe('Step 0 of 0');
  });
});
