import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CngxStep,
  CngxStepperEmpty,
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

  it('renders no count line at all when there are no projected steps (no "Step 0 of 0")', () => {
    @Component({
      standalone: true,
      imports: [CngxTextStepper],
      template: `<cngx-text-stepper></cngx-text-stepper>`,
    })
    class EmptyHost {}
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cngx-text-stepper__text')).toBeNull();
  });

  it('renders the projected *cngxStepperEmpty template when there are no steps', () => {
    @Component({
      standalone: true,
      imports: [CngxTextStepper, CngxStepperEmpty],
      template: `
        <cngx-text-stepper>
          <ng-template cngxStepperEmpty><p class="empty-note">No steps yet</p></ng-template>
        </cngx-text-stepper>
      `,
    })
    class EmptySlotHost {}
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(EmptySlotHost);
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('.empty-note') as HTMLElement;
    expect(note.textContent).toBe('No steps yet');
    expect(fixture.nativeElement.querySelector('.cngx-text-stepper__text')).toBeNull();
  });

  it('folds a direct [error] string into the aggregate error line', () => {
    @Component({
      standalone: true,
      imports: [CngxTextStepper, CngxStep],
      template: `
        <cngx-text-stepper>
          <div cngxStep label="Customer"></div>
          <div cngxStep label="Payment" [error]="'Card declined'"></div>
          <div cngxStep label="Review"></div>
        </cngx-text-stepper>
      `,
    })
    class ErrHost {}
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ErrHost);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector(
      '.cngx-text-stepper__error-text',
    ) as HTMLElement;
    expect(text.textContent?.trim()).toBe('Card declined');
  });

  it('error line keeps the shipped markup contract (block class, role="status", hidden glyph)', () => {
    @Component({
      standalone: true,
      imports: [CngxTextStepper, CngxStep],
      template: `
        <cngx-text-stepper>
          <div cngxStep label="Payment" [error]="'Card declined'"></div>
        </cngx-text-stepper>
      `,
    })
    class ErrHost {}
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ErrHost);
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('.cngx-text-stepper__error') as HTMLElement;
    expect(line).not.toBeNull();
    expect(line.getAttribute('role')).toBe('status');
    expect(line.getAttribute('data-state')).toBe('error');
    const glyph = line.querySelector('.cngx-text-stepper__error-glyph') as HTMLElement;
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    expect(glyph.textContent?.trim()).not.toBe('');
  });
});
