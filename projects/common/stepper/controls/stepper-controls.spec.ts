import { Component, computed, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Subject } from 'rxjs';

import { CNGX_ASYNC_RUN_STATE, CngxAsyncClick } from '@cngx/common/interactive';

import { provideStepperI18n, withStepperI18nLabels } from '../i18n/stepper-i18n';
import { CngxStepperPresenter } from '../presenter.directive';
import type { CngxStepRegistration, CngxStepStatus } from '../stepper-host.token';
import { CngxStepperComplete } from './stepper-complete.directive';
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

@Component({
  standalone: true,
  imports: [CngxStepperComplete],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <button [cngxStepperComplete]="action" (completed)="onCompleted()" #cmp="cngxStepperComplete">
      Finish
    </button>
  `,
})
class CompleteHost {
  ran = 0;
  completedCount = 0;
  readonly action = (): Promise<void> => {
    this.ran++;
    return Promise.resolve();
  };
  onCompleted(): void {
    this.completedCount++;
  }
}

@Component({
  standalone: true,
  imports: [CngxStepperComplete],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <button
      [cngxStepperComplete]="action"
      [enabled]="enabled()"
      (completed)="completedCount = completedCount + 1"
    >
      Finish
    </button>
  `,
})
class LifecycleCompleteHost {
  readonly enabled = signal(true);
  ran = 0;
  completedCount = 0;
  actionImpl: () => Promise<void> = () => Promise.resolve();
  readonly action = (): Promise<void> => {
    this.ran++;
    return this.actionImpl();
  };
}

@Component({
  standalone: true,
  imports: [CngxStepperComplete],
  hostDirectives: [CngxStepperPresenter],
  template: `<button [cngxStepperComplete]="action" [showDelay]="0">Finish</button>`,
})
class ImmediateBusyCompleteHost {
  readonly action = (): Promise<void> => new Promise<void>(() => undefined);
}

@Component({
  standalone: true,
  imports: [CngxStepperComplete],
  hostDirectives: [CngxStepperPresenter],
  template: `<button [cngxStepperComplete]="action" [showDelay]="0" [minDwell]="50">
    Finish
  </button>`,
})
class DwellCompleteHost {
  ran = 0;
  release: () => void = () => undefined;
  readonly action = (): Promise<void> => {
    this.ran++;
    return new Promise<void>((resolve) => (this.release = resolve));
  };
}

@Component({
  standalone: true,
  imports: [CngxStepperPrevious, CngxStepperComplete],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <button cngxStepperPrevious>Back</button>
    <button [cngxStepperComplete]="action" [showDelay]="0">Finish</button>
  `,
})
class BackDuringFinishHost {
  release: () => void = () => undefined;
  readonly action = (): Promise<void> => new Promise<void>((resolve) => (this.release = resolve));
}

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
      expect(next.getAttribute('aria-disabled')).toBe('true');
    });

    it('reflects disabled via aria-disabled only: focusable + click no-op, never native disabled', () => {
      const { fixture, presenter, next } = navSetup();
      presenter.select(2);
      fixture.detectChanges();
      // Native `disabled` would steal focus; the control must stay reachable.
      expect(next.hasAttribute('disabled')).toBe(false);
      expect(next.tabIndex).not.toBe(-1);
      next.click();
      fixture.detectChanges();
      expect(presenter.activeStepIndex()).toBe(2); // handleClick guard blocks advance
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
      expect(prev.getAttribute('aria-disabled')).toBe('true');
      expect(prev.hasAttribute('disabled')).toBe(false); // aria-disabled only, stays focusable
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
      expect(next.getAttribute('aria-disabled')).toBe('true');
      expect(prev.getAttribute('aria-disabled')).toBe('true');
      expect(next.getAttribute('aria-busy')).toBeNull();

      subj.next(true);
      subj.complete();
    });
  });

  describe('CngxStepperComplete', () => {
    function completeSetup(stepCount: number): {
      fixture: ReturnType<typeof TestBed.createComponent<CompleteHost>>;
      presenter: CngxStepperPresenter;
      dir: CngxStepperComplete;
      btn: HTMLButtonElement;
    } {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(CompleteHost);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      for (let i = 0; i < stepCount; i++) {
        presenter.register(reg(String.fromCharCode(97 + i)));
      }
      fixture.detectChanges();
      const dir = fixture.debugElement.children[0].references['cmp'] as CngxStepperComplete;
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      return { fixture, presenter, dir, btn };
    }

    it('isActive reflects the last-step state', () => {
      const { fixture, presenter, dir } = completeSetup(3);
      expect(dir.isActive()).toBe(false);
      presenter.select(2);
      fixture.detectChanges();
      expect(dir.isActive()).toBe(true);
    });

    it('runs the finish action and emits (completed) on success', async () => {
      const { fixture, presenter, btn } = completeSetup(2);
      presenter.select(1);
      fixture.detectChanges();
      btn.click();
      await vi.waitFor(() => {
        fixture.detectChanges();
        TestBed.flushEffects();
        expect(fixture.componentInstance.ran).toBe(1);
        expect(fixture.componentInstance.completedCount).toBe(1);
      });
    });
  });

  describe('Back while Finish runs', () => {
    // I30: expected to fail until PR 8 (T10) feeds the Finish run into the stepper busy state.
    it.fails('refuses Back while the finish run is pending', async () => {
      vi.useFakeTimers();
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(BackDuringFinishHost);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      presenter.register(reg('a'));
      presenter.register(reg('b'));
      presenter.select(1);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const [prev, finish] = Array.from(root.querySelectorAll('button'));
      expect(prev.hasAttribute('aria-disabled')).toBe(false);

      finish.click();
      fixture.detectChanges();
      TestBed.flushEffects();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      expect(finish.getAttribute('aria-busy')).toBe('true');
      expect(prev.getAttribute('aria-disabled')).toBe('true');
      prev.click();
      fixture.detectChanges();
      expect(presenter.activeStepIndex()).toBe(1);
      fixture.componentInstance.release();
    });
  });

  describe('CngxStepperComplete run lifecycle', () => {
    async function drainMicrotasks(): Promise<void> {
      for (let i = 0; i < 20; i++) {
        await Promise.resolve();
      }
    }

    function lifecycleSetup() {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(LifecycleCompleteHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      const runner = fixture.debugElement.children[0].injector.get(CNGX_ASYNC_RUN_STATE);
      return { fixture, host: fixture.componentInstance, btn, runner };
    }

    it('emits nothing on a failed run and reports the error status', async () => {
      const { fixture, host, btn, runner } = lifecycleSetup();
      host.actionImpl = () => Promise.reject(new Error('nope'));
      btn.click();
      await drainMicrotasks();
      fixture.detectChanges();
      expect(host.ran).toBe(1);
      expect(runner.state.status()).toBe('error');
      expect(host.completedCount).toBe(0);
    });

    it('does not run the action with [enabled]="false"', () => {
      const { fixture, host, btn } = lifecycleSetup();
      host.enabled.set(false);
      fixture.detectChanges();
      btn.click();
      expect(host.ran).toBe(0);
      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });

    it('emits once per success, also for two runs with no change detection between', async () => {
      const { fixture, host, btn } = lifecycleSetup();
      btn.click();
      await drainMicrotasks();
      btn.click();
      await drainMicrotasks();
      expect(host.ran).toBe(2);
      expect(host.completedCount).toBe(2);
      fixture.detectChanges();
      expect(host.completedCount).toBe(2);
    });

    it('emits nothing when destroyed mid-run', async () => {
      const { fixture, host, btn } = lifecycleSetup();
      let resolve!: () => void;
      host.actionImpl = () => new Promise<void>((r) => (resolve = r));
      btn.click();
      fixture.detectChanges();
      fixture.destroy();
      resolve();
      await drainMicrotasks();
      expect(host.completedCount).toBe(0);
    });
  });

  it('forwards [showDelay] to the composed CngxAsyncClick', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(ImmediateBusyCompleteHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.register(reg('a'));
    presenter.register(reg('b'));
    presenter.select(1);
    fixture.detectChanges();
    const asyncClick = fixture.debugElement.children[0].injector.get(CNGX_ASYNC_RUN_STATE);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(asyncClick.pending()).toBe(true);

    await vi.advanceTimersByTimeAsync(0);
    expect(asyncClick.busyVisible()).toBe(true);
  });

  it('forwards [minDwell] to the composed CngxAsyncClick', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(DwellCompleteHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.register(reg('a'));
    presenter.register(reg('b'));
    presenter.select(1);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const asyncClick = fixture.debugElement.children[0].injector.get(CngxAsyncClick);
    const advance = async (ms: number): Promise<void> => {
      await vi.advanceTimersByTimeAsync(ms);
      fixture.detectChanges();
      TestBed.flushEffects();
    };

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    TestBed.flushEffects();
    await advance(0);
    expect(asyncClick.busyVisible()).toBe(true);

    host.release();
    // The forwarded 50 ms dwell holds the visual, not the 400 ms default.
    await advance(49);
    expect(asyncClick.busyVisible()).toBe(true);
    await advance(1);
    expect(asyncClick.busyVisible()).toBe(false);
    vi.useRealTimers();
  });

  it('refuses a second finish run through the dwell and clears aria-busy on release (E4)', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(DwellCompleteHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.register(reg('a'));
    presenter.register(reg('b'));
    presenter.select(1);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const asyncClick = fixture.debugElement.children[0].injector.get(CngxAsyncClick);
    const advance = async (ms: number): Promise<void> => {
      await vi.advanceTimersByTimeAsync(ms);
      fixture.detectChanges();
      TestBed.flushEffects();
    };

    btn.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.ran).toBe(1);
    await advance(0);
    expect(asyncClick.busyVisible()).toBe(true);

    host.release();
    await advance(0);
    expect(asyncClick.pending()).toBe(false);
    // The finish action settled but its busy visual is held: it must not
    // submit a second time, and aria-busy stands for the whole dwell.
    expect(asyncClick.busyVisible()).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');

    btn.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.ran).toBe(1);

    await advance(50);
    expect(asyncClick.busyVisible()).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
    vi.useRealTimers();
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
      expect(warnSpy.mock.calls[0][0]).toMatch(/^CNGX1038: \[cngxStepperNext\]/);
      expect(warnSpy.mock.calls[0][0]).toContain('both gate aria-disabled');
    });

    it('warns when [cngxStepperPrevious] and [cngxAsyncClick] share an element', () => {
      @Component({
        standalone: true,
        imports: [CngxStepperPrevious, CngxAsyncClick],
        hostDirectives: [CngxStepperPresenter],
        template: `<button cngxStepperPrevious [cngxAsyncClick]="action">Back</button>`,
      })
      class CoPlacedPrevHost {
        readonly action = () => Promise.resolve();
      }
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(CoPlacedPrevHost);
      fixture.detectChanges();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/^CNGX1038: \[cngxStepperPrevious\]/);
      expect(warnSpy.mock.calls[0][0]).toContain('both gate aria-disabled');
    });
  });

  describe('unhosted controls (CNGX1056)', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      warnSpy.mockClear();
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    function unhostedWarnings(): string[] {
      return warnSpy.mock.calls
        .map((call: unknown[]) => String(call[0]))
        .filter((message: string) => message.startsWith('CNGX1056: '));
    }

    @Component({
      standalone: true,
      imports: [CngxStepperPrevious, CngxStepperNext, CngxStepperComplete],
      template: `
        <button cngxStepperPrevious>Back</button>
        <button cngxStepperNext>Next</button>
        <button [cngxStepperComplete]="action">Finish</button>
      `,
    })
    class UnhostedControls {
      readonly action = (): Promise<void> => Promise.resolve();
    }

    @Component({
      standalone: true,
      imports: [CngxStepperPresenter, CngxStepperNext],
      template: `
        <div cngxStepper #s="cngxStepper"></div>
        <button cngxStepperNext [host]="s">Next</button>
      `,
    })
    class BoundHostControl {}

    it('warns once per control that has neither [host] nor an ambient stepper', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(UnhostedControls);
      fixture.detectChanges();
      TestBed.tick();
      const warnings = unhostedWarnings();
      expect(warnings).toHaveLength(3);
      expect(warnings[0]).toMatch(/^CNGX1056: \[cngxStepperPrevious\] has no stepper\./);
      expect(warnings[1]).toMatch(/^CNGX1056: \[cngxStepperNext\] has no stepper\./);
      expect(warnings[2]).toMatch(/^CNGX1056: \[cngxStepperComplete\] has no stepper\./);
      fixture.detectChanges();
      TestBed.tick();
      expect(unhostedWarnings()).toHaveLength(3);
    });

    it('stays silent inside a stepper', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(NavHost);
      fixture.detectChanges();
      TestBed.tick();
      expect(unhostedWarnings()).toHaveLength(0);
    });

    it('stays silent with a bound [host]', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(BoundHostControl);
      fixture.detectChanges();
      TestBed.tick();
      expect(unhostedWarnings()).toHaveLength(0);
    });
  });

  describe('icon-only fallback label', () => {
    @Component({
      standalone: true,
      imports: [CngxStepperPrevious, CngxStepperNext],
      hostDirectives: [CngxStepperPresenter],
      template: `
        <button cngxStepperPrevious></button>
        <button cngxStepperNext></button>
      `,
    })
    class IconNavHost {}

    it('follows a language flip', async () => {
      const lang = signal<'en' | 'de'>('en');
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperI18n(
            withStepperI18nLabels(
              computed(() =>
                lang() === 'de' ? { previousStep: 'Zurueck', nextStep: 'Weiter' } : {},
              ),
            ),
          ),
        ],
      });
      const fixture = TestBed.createComponent(IconNavHost);
      await fixture.whenStable();
      const prev = fixture.nativeElement.querySelector('[cngxStepperPrevious]') as HTMLElement;
      const next = fixture.nativeElement.querySelector('[cngxStepperNext]') as HTMLElement;
      expect(prev.getAttribute('aria-label')).toBe('Previous step');
      expect(next.getAttribute('aria-label')).toBe('Next step');

      lang.set('de');
      await fixture.whenStable();
      expect(prev.getAttribute('aria-label')).toBe('Zurueck');
      expect(next.getAttribute('aria-label')).toBe('Weiter');
    });
  });
});
