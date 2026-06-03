import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  CngxStepperNext,
  CngxStepperPresenter,
  CngxStepperPrevious,
  type CngxStepperHost,
  type CngxStepRegistration,
} from '@cngx/common/stepper';

import { CngxStepperFooter } from './stepper-footer.component';
import {
  CngxStepperFooterCenter,
  CngxStepperFooterEnd,
  CngxStepperFooterStart,
} from './stepper-footer-regions';

function reg(id: string): CngxStepRegistration {
  return {
    id,
    kind: 'step',
    label: signal(id),
    disabled: signal(false),
    state: signal('idle'),
  };
}

@Component({
  standalone: true,
  imports: [
    CngxStepperFooter,
    CngxStepperFooterStart,
    CngxStepperFooterCenter,
    CngxStepperFooterEnd,
    CngxStepperPrevious,
    CngxStepperNext,
  ],
  template: `
    <cngx-stepper-footer>
      <button cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <span cngxStepperFooterCenter>Step 1 of 3</span>
      <button cngxStepperFooterEnd cngxStepperNext>Next</button>
    </cngx-stepper-footer>
  `,
})
class StandaloneFooterHost {}

@Component({
  standalone: true,
  imports: [
    CngxStepperFooter,
    CngxStepperFooterStart,
    CngxStepperFooterEnd,
    CngxStepperPrevious,
    CngxStepperNext,
  ],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <cngx-stepper-footer>
      <button cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <button cngxStepperFooterEnd cngxStepperNext>Next</button>
    </cngx-stepper-footer>
  `,
})
class AmbientHostFooterHost {}

@Component({
  standalone: true,
  imports: [CngxStepperFooter, CngxStepperFooterEnd, CngxStepperNext],
  template: `
    <cngx-stepper-footer [host]="mockHost">
      <button cngxStepperFooterEnd cngxStepperNext>Next</button>
    </cngx-stepper-footer>
  `,
})
class ExplicitHostFooterHost {
  readonly mockHost = {
    canGoNext: signal(true),
    canGoPrevious: signal(false),
    busy: signal(false),
    selectNext: () => undefined,
    selectPrevious: () => undefined,
  } as unknown as CngxStepperHost;
}

describe('CngxStepperFooter', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  describe('region projection', () => {
    it('projects content into the start / center / end regions', () => {
      const fixture = TestBed.createComponent(StandaloneFooterHost);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.cngx-stepper-footer__start')?.textContent).toContain('Back');
      expect(el.querySelector('.cngx-stepper-footer__center')?.textContent).toContain(
        'Step 1 of 3',
      );
      expect(el.querySelector('.cngx-stepper-footer__end')?.textContent).toContain('Next');
    });
  });

  describe('null host neutral set (disabled by default)', () => {
    it('renders nested nav buttons disabled when there is no host', () => {
      const fixture = TestBed.createComponent(StandaloneFooterHost);
      fixture.detectChanges();
      const prev = fixture.nativeElement.querySelector(
        '[cngxStepperPrevious]',
      ) as HTMLButtonElement;
      const next = fixture.nativeElement.querySelector('[cngxStepperNext]') as HTMLButtonElement;
      expect(prev.hasAttribute('disabled')).toBe(true);
      expect(prev.getAttribute('aria-disabled')).toBe('true');
      expect(next.hasAttribute('disabled')).toBe(true);
      expect(next.getAttribute('aria-disabled')).toBe('true');
    });

    it('clicking a disabled nav button is a no-op (method forward no-ops)', () => {
      const fixture = TestBed.createComponent(StandaloneFooterHost);
      fixture.detectChanges();
      const next = fixture.nativeElement.querySelector('[cngxStepperNext]') as HTMLButtonElement;
      expect(() => next.click()).not.toThrow();
    });
  });

  describe('host resolution', () => {
    it('child nav atoms resolve the ambient host re-provided through the proxy', () => {
      const fixture = TestBed.createComponent(AmbientHostFooterHost);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      presenter.register(reg('a'));
      presenter.register(reg('b'));
      fixture.detectChanges();

      const prev = fixture.nativeElement.querySelector(
        '[cngxStepperPrevious]',
      ) as HTMLButtonElement;
      const next = fixture.nativeElement.querySelector('[cngxStepperNext]') as HTMLButtonElement;

      // First step: Back disabled, Next live.
      expect(prev.hasAttribute('disabled')).toBe(true);
      expect(next.hasAttribute('disabled')).toBe(false);

      next.click();
      fixture.detectChanges();
      expect(presenter.activeStepIndex()).toBe(1);
      // Last step: Next disabled, Back live.
      expect(next.hasAttribute('disabled')).toBe(true);
      expect(prev.hasAttribute('disabled')).toBe(false);
    });

    it('resolves an explicit [host] for a footer placed outside any stepper', () => {
      const fixture = TestBed.createComponent(ExplicitHostFooterHost);
      fixture.detectChanges();
      const next = fixture.nativeElement.querySelector('[cngxStepperNext]') as HTMLButtonElement;
      expect(next.hasAttribute('disabled')).toBe(false);
    });
  });
});
