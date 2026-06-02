import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { CngxStep } from '@cngx/common/stepper';

import { CngxDotStepper } from './dot-stepper.component';

@Component({
  standalone: true,
  imports: [CngxDotStepper, CngxStep],
  template: `
    <cngx-dot-stepper [(activeStepIndex)]="active" aria-label="Carousel">
      <div cngxStep label="One"></div>
      <div cngxStep label="Two"></div>
      <div cngxStep label="Three"></div>
      <div cngxStep label="Four"></div>
    </cngx-dot-stepper>
  `,
})
class Host {
  active = signal(1);
}

@Component({
  standalone: true,
  imports: [CngxDotStepper, CngxStep],
  template: `
    <cngx-dot-stepper [(activeStepIndex)]="active" [linear]="linear()" aria-label="Linear">
      <div cngxStep label="One"></div>
      <div cngxStep label="Two"></div>
      <div cngxStep label="Three"></div>
    </cngx-dot-stepper>
  `,
})
class LinearHost {
  active = signal(1);
  linear = signal(true);
}

describe('CngxDotStepper', () => {
  it('host carries role="group" + aria-roledescription="Step indicator" (NOT tablist)', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-dot-stepper') as HTMLElement;
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-roledescription')).toBe('Step indicator');
    expect(host.getAttribute('role')).not.toBe('tablist');
  });

  it('renders one dot per step (no group nodes)', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.cngx-dot-stepper__dot');
    expect(dots.length).toBe(4);
  });

  it('lands aria-current="step" only on the active dot', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dots = Array.from(
      fixture.nativeElement.querySelectorAll('.cngx-dot-stepper__dot'),
    ) as HTMLElement[];
    const currents = dots.map((d) => d.getAttribute('aria-current'));
    expect(currents).toEqual([null, 'step', null, null]);
  });

  it('dots carry role="presentation" (sequential pattern, NOT a tab)', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dots = Array.from(
      fixture.nativeElement.querySelectorAll('.cngx-dot-stepper__dot'),
    ) as HTMLElement[];
    dots.forEach((d) => {
      expect(d.getAttribute('role')).toBe('presentation');
    });
  });

  it('arrow keys route to presenter.selectNext / selectPrevious when [linear]="false"', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-dot-stepper') as HTMLElement;

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe(2);

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe(1);
  });

  it('arrow keys are silent when [linear]="true"', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(LinearHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-dot-stepper') as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe(1);
  });

  it('each dot carries an aria-label describing position and label', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dots = Array.from(
      fixture.nativeElement.querySelectorAll('.cngx-dot-stepper__dot'),
    ) as HTMLElement[];
    expect(dots[0].getAttribute('aria-label')).toBe('Step 1 of 4: One');
    expect(dots[3].getAttribute('aria-label')).toBe('Step 4 of 4: Four');
  });
});
