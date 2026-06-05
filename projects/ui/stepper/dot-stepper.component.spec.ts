import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CngxDotStepperDot,
  type CngxDotStepperDotContext,
  CngxStep,
  provideStepperConfig,
  withDotStepperDotTemplate,
} from '@cngx/common/stepper';

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

  it('host is keyboard-focusable so the arrow-key handler is reachable', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-dot-stepper') as HTMLElement;
    expect(host.getAttribute('tabindex')).toBe('0');
    host.focus();
    expect(document.activeElement).toBe(host);
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

  it('dots carry role="img" (name-permitting, sequential pattern, NOT a tab)', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dots = Array.from(
      fixture.nativeElement.querySelectorAll('.cngx-dot-stepper__dot'),
    ) as HTMLElement[];
    dots.forEach((d) => {
      expect(d.getAttribute('role')).toBe('img');
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

  it('renders the per-instance *cngxDotStepperDot slot inside every dot when provided', () => {
    @Component({
      standalone: true,
      imports: [CngxDotStepper, CngxStep, CngxDotStepperDot],
      template: `
        <cngx-dot-stepper [(activeStepIndex)]="active" aria-label="Slot host">
          <ng-template cngxDotStepperDot let-index let-isActive="active">
            <span class="slot-marker" [attr.data-active]="isActive">{{ index }}</span>
          </ng-template>
          <div cngxStep label="One"></div>
          <div cngxStep label="Two"></div>
          <div cngxStep label="Three"></div>
        </cngx-dot-stepper>
      `,
    })
    class SlotHost {
      active = signal(1);
    }

    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const markers = Array.from(
      fixture.nativeElement.querySelectorAll('.slot-marker'),
    ) as HTMLElement[];
    expect(markers.length).toBe(3);
    expect(markers.map((m) => m.textContent?.trim())).toEqual(['0', '1', '2']);
    expect(markers[1].getAttribute('data-active')).toBe('true');
    expect(markers[0].getAttribute('data-active')).toBe('false');
  });

  it('falls back to the CNGX_STEPPER_CONFIG.templates.dotStepperDot when no per-instance slot is bound', () => {
    @Component({
      standalone: true,
      imports: [CngxDotStepper, CngxStep],
      template: `
        <ng-template #fallbackTpl let-index>
          <span class="config-marker">{{ index }}</span>
        </ng-template>
        <cngx-dot-stepper [(activeStepIndex)]="active" aria-label="Config host">
          <div cngxStep label="One"></div>
          <div cngxStep label="Two"></div>
        </cngx-dot-stepper>
      `,
    })
    class ConfigHost {
      active = signal(0);
      readonly fallbackTpl = viewChild.required<TemplateRef<CngxDotStepperDotContext>>('fallbackTpl');
    }

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const proxyFixture = TestBed.createComponent(ConfigHost);
    proxyFixture.detectChanges();
    const tpl = proxyFixture.componentInstance.fallbackTpl();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(withDotStepperDotTemplate(tpl)),
      ],
    });
    const fixture = TestBed.createComponent(ConfigHost);
    fixture.detectChanges();
    const markers = Array.from(
      fixture.nativeElement.querySelectorAll('.config-marker'),
    ) as HTMLElement[];
    expect(markers.length).toBe(2);
    expect(markers.map((m) => m.textContent?.trim())).toEqual(['0', '1']);
  });

  it('renders an empty dot body when neither slot nor config template is bound', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dots = Array.from(
      fixture.nativeElement.querySelectorAll('.cngx-dot-stepper__dot'),
    ) as HTMLElement[];
    dots.forEach((d) => {
      expect(d.children.length).toBe(0);
      expect(d.textContent?.trim()).toBe('');
    });
  });

  describe('mobile-swipe routing on the dot row', () => {
    type SwipeDirection = 'left' | 'right' | 'up' | 'down';
    interface SwipeShape {
      readonly swipeNav: {
        readonly swipeEnabled: () => boolean;
        readonly handleSwipe: (direction: SwipeDirection) => void;
      };
      readonly presenter: { activeStepIndex: () => number };
    }
    function dotStepperOf(fixture: ReturnType<typeof TestBed.createComponent<Host>>): SwipeShape {
      return fixture.debugElement.children[0].componentInstance as unknown as SwipeShape;
    }

    it('handleSwipe("left") routes through presenter.selectNext on the standalone variant', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const stepper = dotStepperOf(fixture);
      expect(stepper.presenter.activeStepIndex()).toBe(1);
      stepper.swipeNav.handleSwipe('left');
      fixture.detectChanges();
      expect(stepper.presenter.activeStepIndex()).toBe(2);
    });

    it('handleSwipe("right") routes through presenter.selectPrevious on the standalone variant', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const stepper = dotStepperOf(fixture);
      stepper.swipeNav.handleSwipe('right');
      fixture.detectChanges();
      expect(stepper.presenter.activeStepIndex()).toBe(0);
    });

    it('swipeEnabled defaults to true (peer-parity with <cngx-stepper> mobile-collapse)', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      expect(dotStepperOf(fixture).swipeNav.swipeEnabled()).toBe(true);
    });

    it('the dot row advertises touch-action: pan-y when swipe is enabled', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const row = fixture.nativeElement.querySelector('.cngx-dot-stepper__row') as HTMLElement;
      expect(row.style.touchAction).toBe('pan-y');
    });
  });

  describe('aggregate error line', () => {
    @Component({
      standalone: true,
      imports: [CngxDotStepper, CngxStep],
      template: `
        <cngx-dot-stepper [(activeStepIndex)]="active" aria-label="Carousel">
          <div cngxStep label="One"></div>
          <div cngxStep label="Two" [error]="err()"></div>
          <div cngxStep label="Three"></div>
        </cngx-dot-stepper>
      `,
    })
    class ErrHost {
      active = signal(0);
      err = signal<string | boolean>('Card declined');
    }

    it('surfaces the real [error] message below the dot row', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(ErrHost);
      fixture.detectChanges();
      const line = fixture.nativeElement.querySelector(
        '.cngx-dot-stepper__error-text',
      ) as HTMLElement;
      expect(line).not.toBeNull();
      expect(line.textContent?.trim()).toBe('Card declined');
    });

    it('hides the error line when no step errors', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(ErrHost);
      fixture.componentInstance.err.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cngx-dot-stepper__error')).toBeNull();
    });
  });
});
