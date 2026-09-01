import { Component, inject, signal, type AfterViewInit } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxStepperPresenter } from './presenter.directive';
import { CngxStep } from './step.directive';
import { CngxStepperRouterSync } from './router-sync.directive';
import {
  provideStepperConfig,
  withStepperRouterSync,
} from './stepper-config';
import type { CngxStepRegistration } from './stepper-host.token';

/** Minimal step registration for a late-added step (no template atom). */
function reg(id: string, disabled = false): CngxStepRegistration {
  return {
    id,
    kind: 'step',
    label: signal(id),
    disabled: signal(disabled),
    state: signal('idle'),
  };
}

@Component({
  standalone: true,
  selector: 'host-cmp',
  imports: [CngxStep],
  hostDirectives: [CngxStepperPresenter, CngxStepperRouterSync],
  template: `
    <div cngxStep label="A"></div>
    <div cngxStep label="B"></div>
  `,
})
class HostCmp {}

// The seed reads the URL against the registered step ids, so the test
// needs deterministic ids present *before* ngAfterContentInit runs.
// `CngxStep` registers in its own constructor with an auto-generated
// `nextUid` id (a static `id="a"` attribute is not applied until after
// construction), so this shell reproduces the "registry populated by
// content-init" precondition the way the presenter spec does: it
// registers named steps in its own constructor, which runs before the
// host directive's content-init hook.
@Component({
  standalone: true,
  selector: 'seed-shell',
  hostDirectives: [
    { directive: CngxStepperPresenter, inputs: ['commitAction', 'commitMode'] },
    CngxStepperRouterSync,
  ],
  template: '',
})
class SeedShell {
  readonly presenter = inject(CngxStepperPresenter);
  constructor() {
    this.presenter.register(reg('a'));
    this.presenter.register(reg('b'));
    this.presenter.register(reg('c'));
  }
}

// Registers its steps in ngAfterViewInit - after the host directive's
// content-init seed has already run and bailed (empty registry), but
// before the afterNextRender fallback fires. Isolates the fallback path:
// only the render-time seed can pick these up.
@Component({
  standalone: true,
  selector: 'late-seed-shell',
  hostDirectives: [CngxStepperPresenter, CngxStepperRouterSync],
  template: '',
})
class LateSeedShell implements AfterViewInit {
  readonly presenter = inject(CngxStepperPresenter);
  ngAfterViewInit(): void {
    this.presenter.register(reg('x'));
    this.presenter.register(reg('late'));
  }
}

// Drains pending microtasks so the directive's effect() chain (which
// reads activeStepId, then calls router.navigate inside untracked()) has
// a chance to fire and the spy captures the call. Avoids
// `fixture.whenStable()` because it has been observed to hang under
// Node 20 + zoneless tests with a Router in providers.
async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

describe('CngxStepperRouterSync', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('calls router.navigate with a fragment when activeStepId changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockResolvedValue(true);

    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const calls = navigateSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastCall = calls[calls.length - 1];
    const extras = lastCall[1] as { fragment?: string; queryParams?: Record<string, string> };
    expect(extras.fragment).toMatch(/^step=cngx-step-/);
  });

  it('is a graceful no-op when Router is not provided', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    expect(() => {
      const fixture = TestBed.createComponent(HostCmp);
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('falls back to provideStepperConfig defaults when Inputs unbound', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStepperConfig(withStepperRouterSync('queryParam', 'phase')),
      ],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockResolvedValue(true);

    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const calls = navigateSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastCall = calls[calls.length - 1];
    const extras = lastCall[1] as { fragment?: string; queryParams?: Record<string, string> };
    expect(extras.queryParams).toEqual({ phase: expect.stringMatching(/^cngx-step-/) });
    expect(extras.fragment).toBeUndefined();
  });

  it('emits (syncError) when router.navigate rejects', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const failure = new Error('navigation refused');
    vi.spyOn(router, 'navigate').mockReturnValue(Promise.reject(failure));

    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await flushMicrotasks();
    const sync = fixture.debugElement.injector.get(CngxStepperRouterSync);
    const errors: unknown[] = [];
    sync.syncError.subscribe((err) => errors.push(err));

    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();
    expect(errors).toEqual([failure]);
  });

  describe('deep-link seed', () => {
    it('resolves the deep-linked step on the first change-detection pass', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideRouter([])],
      });
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
        get: () => 'step=c',
        configurable: true,
      });

      const fixture = TestBed.createComponent(SeedShell);
      fixture.detectChanges();

      // The content-init seed selects the URL step inside the first CD pass,
      // before the host view renders any panels. This pins that a deep link
      // resolves on the first pass; the panelMode="lazy" ordering (default
      // panel never mounts) is observable at the ui/render level, not here.
      expect(fixture.componentInstance.presenter.activeStepId()).toBe('c');
      expect(fixture.componentInstance.presenter.activeStepIndex()).toBe(2);
    });

    it('falls back to the afterNextRender seed for a step registered after content-init', async () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideRouter([])],
      });
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
        get: () => 'step=late',
        configurable: true,
      });

      // LateSeedShell registers 'late' in ngAfterViewInit, so it is absent
      // at content-init (seed bails, latch un-set) and present when the
      // afterNextRender fallback runs.
      const fixture = TestBed.createComponent(LateSeedShell);
      fixture.detectChanges();
      TestBed.tick();
      await flushMicrotasks();

      expect(fixture.componentInstance.presenter.activeStepId()).toBe('late');
    });

    it('runs a bound commit action exactly once for the content-init seed', async () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideRouter([])],
      });
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
        get: () => 'step=b',
        configurable: true,
      });

      // Held open, not resolved: a pessimistic action that settles inside
      // the first microtask drain lets activeStepIndex land before the
      // afterNextRender fallback runs, which would hide a double-fire. Hold
      // it open so the fallback observes the in-flight state (index still 0)
      // exactly as a real HTTP-backed action would.
      let release!: (ok: boolean) => void;
      const commitAction = vi.fn(
        () =>
          new Promise<boolean>((resolve) => {
            release = resolve;
          }),
      );

      const fixture = TestBed.createComponent(SeedShell);
      fixture.componentRef.setInput('commitAction', commitAction);
      fixture.componentRef.setInput('commitMode', 'pessimistic');
      fixture.detectChanges();
      TestBed.tick();
      await flushMicrotasks();
      TestBed.tick();

      // The content-init seed goes through selectById -> select(), so it
      // does run the consumer's action - but the fallback must not run it
      // again while the first is still pending.
      expect(commitAction).toHaveBeenCalledTimes(1);
      expect(commitAction.mock.calls[0]).toEqual([0, 1]);

      release(true);
      await flushMicrotasks();
      fixture.detectChanges();
      await flushMicrotasks();

      expect(fixture.componentInstance.presenter.activeStepId()).toBe('b');
      expect(commitAction).toHaveBeenCalledTimes(1);
    });

    it('ngAfterContentInit is a no-op without a Router', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let fixture: ReturnType<typeof TestBed.createComponent<SeedShell>>;
      expect(() => {
        fixture = TestBed.createComponent(SeedShell);
        fixture.detectChanges();
      }).not.toThrow();

      // No Router - the seed never runs, the default step stays active.
      expect(fixture!.componentInstance.presenter.activeStepId()).toBe('a');

      warnSpy.mockRestore();
    });
  });
});

describe('CngxStepperRouterSync - fragment hygiene and refused seed', () => {
  it('preserves foreign fragment params and URI-encodes the step id on write', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
      get: () => 'foo=1&step=a&bar=2',
      configurable: true,
    });

    const fixture = TestBed.createComponent(SeedShell);
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.componentInstance.presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const calls = navigateSpy.mock.calls;
    const extras = calls[calls.length - 1][1] as { fragment?: string };
    expect(extras.fragment).toContain('foo=1');
    expect(extras.fragment).toContain('bar=2');
    expect(extras.fragment).toContain('step=b');
  });

  it('round-trips an encoded step id through the fragment', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
      get: () => `step=${encodeURIComponent('a b')}`,
      configurable: true,
    });

    @Component({
      standalone: true,
      selector: 'encoded-seed-shell',
      hostDirectives: [CngxStepperPresenter, CngxStepperRouterSync],
      template: '',
    })
    class EncodedSeedShell {
      readonly presenter = inject(CngxStepperPresenter);
      constructor() {
        this.presenter.register(reg('x'));
        this.presenter.register(reg('a b'));
      }
    }

    const fixture = TestBed.createComponent(EncodedSeedShell);
    fixture.detectChanges();
    expect(fixture.componentInstance.presenter.activeStepId()).toBe('a b');
  });

  it('rewrites the URL from the actual step after a refused (disabled) seed', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    Object.defineProperty(router.routerState.snapshot.root, 'fragment', {
      get: () => 'step=locked',
      configurable: true,
    });

    @Component({
      standalone: true,
      selector: 'refused-seed-shell',
      hostDirectives: [CngxStepperPresenter, CngxStepperRouterSync],
      template: '',
    })
    class RefusedSeedShell {
      readonly presenter = inject(CngxStepperPresenter);
      constructor() {
        this.presenter.register(reg('start'));
        this.presenter.register(reg('locked', true));
      }
    }

    const fixture = TestBed.createComponent(RefusedSeedShell);
    fixture.detectChanges();
    await flushMicrotasks();

    // The disabled target refused the seed; the URL must reflect the
    // step the stepper actually sits on.
    expect(fixture.componentInstance.presenter.activeStepId()).toBe('start');
    const fragments = navigateSpy.mock.calls
      .map((c) => (c[1] as { fragment?: string }).fragment)
      .filter((f): f is string => f !== undefined);
    expect(fragments.some((f) => f.includes('step=start'))).toBe(true);
    expect(fragments[fragments.length - 1]).not.toContain('step=locked');
  });
});
