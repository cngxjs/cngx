import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { createStepperHostProxy } from './create-stepper-host-proxy';
import type { CngxStepperHost } from './stepper-host.token';

describe('createStepperHostProxy', () => {
  describe('null supplier neutral set', () => {
    const proxy = createStepperHostProxy(() => null);

    it('renders every nav affordance inert (canGo* → false, bounds flags → true)', () => {
      expect(proxy.canGoNext()).toBe(false);
      expect(proxy.canGoPrevious()).toBe(false);
      expect(proxy.isFirstStep()).toBe(true);
      expect(proxy.isLastStep()).toBe(true);
      expect(proxy.busy()).toBe(false);
    });

    it('exposes empty / out-of-range projection state', () => {
      expect(proxy.stepCount()).toBe(0);
      expect(proxy.stepsOnly()).toEqual([]);
      expect(proxy.flatSteps()).toEqual([]);
      expect(proxy.activeStepIndex()).toBe(-1);
      expect(proxy.activeStepId()).toBeNull();
      expect(proxy.linear()).toBe(false);
      expect(proxy.orientation()).toBe('horizontal');
      expect(proxy.nextStepLabel()).toBeUndefined();
      expect(proxy.previousStepLabel()).toBeUndefined();
    });

    it('exposes an idle commit state + transition', () => {
      expect(proxy.commitState.status()).toBe('idle');
      expect(proxy.commitState.error()).toBeUndefined();
      expect(proxy.commitState.lastUpdated()).toBeUndefined();
      expect(proxy.commitTransition.current()).toBe('idle');
      expect(proxy.commitTransition.previous()).toBe('idle');
    });

    it('no-ops every method', () => {
      expect(() => {
        proxy.select(2);
        proxy.selectNext();
        proxy.selectPrevious();
        proxy.selectById('x');
        proxy.reset();
        proxy.clearLastFailed();
        proxy.unregister('x');
      }).not.toThrow();
    });
  });

  describe('delegation to a live supplier', () => {
    it('tracks the supplier signals and forwards methods', () => {
      const selectNext = vi.fn();
      const real = {
        canGoNext: signal(true),
        canGoPrevious: signal(false),
        busy: signal(false),
        nextStepLabel: signal<string | undefined>('Two'),
        stepCount: signal(3),
        selectNext,
      } as unknown as CngxStepperHost;

      const supplier = signal<CngxStepperHost | null>(null);
      const proxy = createStepperHostProxy(() => supplier());

      // Null first: inert.
      expect(proxy.canGoNext()).toBe(false);
      expect(proxy.nextStepLabel()).toBeUndefined();

      // Swap in the live host: proxy reflects it without re-provisioning.
      supplier.set(real);
      expect(proxy.canGoNext()).toBe(true);
      expect(proxy.nextStepLabel()).toBe('Two');
      expect(proxy.stepCount()).toBe(3);

      proxy.selectNext();
      expect(selectNext).toHaveBeenCalledTimes(1);
    });
  });
});
