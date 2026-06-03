import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Subject } from 'rxjs';

import { CngxAsyncClick } from '@cngx/common/interactive';

import { CngxStepperPresenter } from '../presenter.directive';
import type { CngxStepRegistration, CngxStepStatus } from '../stepper-host.token';
import { CngxStepperNext } from './stepper-next.directive';
import { CngxStepperPrevious } from './stepper-previous.directive';

function reg(
  id: string,
  stateValue: CngxStepStatus = 'idle',
  disabled = false,
): CngxStepRegistration {
  return {
    id,
    kind: 'step',
    label: signal(id),
    disabled: signal(disabled),
    state: signal(stateValue),
  };
}

@Component({
  standalone: true,
  imports: [CngxStepperPrevious, CngxStepperNext],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <button cngxStepperPrevious>Back</button>
    <button cngxStepperNext>Next</button>
  `,
})
class NavHost {}

function navSetup(): {
  fixture: ReturnType<typeof TestBed.createComponent<NavHost>>;
  presenter: CngxStepperPresenter;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
} {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(NavHost);
  fixture.detectChanges();
  const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
  presenter.register(reg('a'));
  presenter.register(reg('b'));
  presenter.register(reg('c'));
  fixture.detectChanges();
  const prev = fixture.nativeElement.querySelector('[cngxStepperPrevious]') as HTMLButtonElement;
  const next = fixture.nativeElement.querySelector('[cngxStepperNext]') as HTMLButtonElement;
  return { fixture, presenter, prev, next };
}

describe('stepper nav controls', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  describe('CngxStepperNext', () => {
    it('click advances the active step', () => {
      const { fixture, presenter, next } = navSetup();
      expect(presenter.activeStepIndex()).toBe(0);
      next.click();
      fixture.detectChanges();
      expect(presenter.activeStepIndex()).toBe(1);
    });

    it('is disabled at the last step', () => {
      const { fixture, presenter, next } = navSetup();
      presenter.select(2);
      fixture.detectChanges();
      expect(next.hasAttribute('disabled')).toBe(true);
      expect(next.getAttribute('aria-disabled')).toBe('true');
    });

    it('never writes aria-busy', () => {
      const { fixture, presenter, next } = navSetup();
      expect(next.getAttribute('aria-busy')).toBeNull();
      presenter.select(2);
      fixture.detectChanges();
      expect(next.getAttribute('aria-busy')).toBeNull();
    });
  });

  describe('CngxStepperPrevious', () => {
    it('click retreats the active step', () => {
      const { fixture, presenter, prev } = navSetup();
      presenter.select(2);
      fixture.detectChanges();
      prev.click();
      fixture.detectChanges();
      expect(presenter.activeStepIndex()).toBe(1);
    });

    it('is disabled at the first step', () => {
      const { prev } = navSetup();
      expect(prev.hasAttribute('disabled')).toBe(true);
      expect(prev.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('busy gating', () => {
    @Component({
      standalone: true,
      imports: [CngxStepperPrevious, CngxStepperNext],
      hostDirectives: [{ directive: CngxStepperPresenter, inputs: ['commitAction', 'commitMode'] }],
      template: `
        <button cngxStepperPrevious>Back</button>
        <button cngxStepperNext>Next</button>
      `,
    })
    class BusyNavHost {}

    it('disables both nav controls while a commit is pending, without aria-busy on Next', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const subj = new Subject<boolean>();
      const fixture = TestBed.createComponent(BusyNavHost);
      fixture.componentRef.setInput('commitAction', () => subj);
      fixture.componentRef.setInput('commitMode', 'pessimistic');
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      presenter.register(reg('a'));
      presenter.register(reg('b'));
      presenter.register(reg('c'));
      fixture.detectChanges();
      const prev = fixture.nativeElement.querySelector(
        '[cngxStepperPrevious]',
      ) as HTMLButtonElement;
      const next = fixture.nativeElement.querySelector('[cngxStepperNext]') as HTMLButtonElement;

      presenter.select(1);
      fixture.detectChanges();
      expect(presenter.busy()).toBe(true);
      expect(next.hasAttribute('disabled')).toBe(true);
      expect(prev.hasAttribute('disabled')).toBe(true);
      expect(next.getAttribute('aria-busy')).toBeNull();

      subj.next(true);
      subj.complete();
    });
  });

  describe('dev-mode co-placement guard', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('warns when [cngxStepperNext] and [cngxAsyncClick] share an element', () => {
      @Component({
        standalone: true,
        imports: [CngxStepperNext, CngxAsyncClick],
        hostDirectives: [CngxStepperPresenter],
        template: `<button cngxStepperNext [cngxAsyncClick]="action">Next</button>`,
      })
      class CoPlacedHost {
        readonly action = () => Promise.resolve();
      }
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(CoPlacedHost);
      fixture.detectChanges();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('both write [disabled]');
    });
  });
});
