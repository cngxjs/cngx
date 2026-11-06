import {
  Component,
  computed,
  Directive,
  ErrorHandler,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CNGX_LOADING_DEFAULTS, provideLoadingConfigAt, withShowDelay } from '@cngx/core/utils';
import { of, type Observable } from 'rxjs';
import { provideInteractiveI18n, withInteractiveI18nLabels } from '../i18n/interactive-i18n';
import { createRetry } from '../retry/with-retry';
import {
  CNGX_ASYNC_CANCELLED,
  CngxAsyncClick,
  type AsyncAction,
  type CngxAsyncSettle,
} from './async-click.directive';
import { CNGX_HOST_INTERACTION_STATE } from './host-interaction-state.token';

// ── Deferred promise helper ─────────────────────────────────────────────

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ── Test hosts ──────────────────────────────────────────────────────────

@Component({
  template: `<button
    [cngxAsyncClick]="action"
    [enabled]="enabled()"
    [busy]="busy()"
    [autoAnnounce]="autoAnnounce()"
  >
    Go
  </button>`,
  imports: [CngxAsyncClick],
})
class ButtonHost {
  readonly enabled = signal(true);
  readonly busy = signal(false);
  readonly autoAnnounce = signal(true);
  readonly directive = viewChild.required(CngxAsyncClick);
  callCount = 0;
  actionImpl: () => Promise<unknown> | Observable<unknown> = () => Promise.resolve();
  readonly action: AsyncAction = () => {
    this.callCount++;
    return this.actionImpl();
  };
}

@Component({
  template: `<div [cngxAsyncClick]="action">Go</div>`,
  imports: [CngxAsyncClick],
})
class DivHost {
  readonly directive = viewChild.required(CngxAsyncClick);
  actionImpl: () => Promise<unknown> | Observable<unknown> = () => Promise.resolve();
  readonly action: AsyncAction = () => this.actionImpl();
}

function setupButton(overrides: { enabled?: boolean } = {}) {
  const fixture = TestBed.createComponent(ButtonHost);
  if (overrides.enabled != null) {
    fixture.componentInstance.enabled.set(overrides.enabled);
  }
  fixture.detectChanges();
  TestBed.flushEffects();
  const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, btn, directive, host: fixture.componentInstance };
}

function setupDiv() {
  const fixture = TestBed.createComponent(DivHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const div = fixture.nativeElement.querySelector('div') as HTMLDivElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, div, directive, host: fixture.componentInstance };
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxAsyncClick', () => {
  // `[cngxAsyncClick]="fn"` leaves no attribute, so the class is the theme hook.
  it('carries the stable cngx-async host class in every phase', async () => {
    const { btn, fixture } = setupButton();
    expect(btn.hasAttribute('cngxasyncclick')).toBe(false);
    expect(btn.classList.contains('cngx-async')).toBe(true);
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(btn.classList.contains('cngx-async--success')).toBe(true);
    });
    expect(btn.classList.contains('cngx-async')).toBe(true);
  });

  it('should call the action on click', async () => {
    const { btn, host } = setupButton();
    btn.click();
    await vi.waitFor(() => expect(host.callCount).toBe(1));
  });

  it('should set pending during execution', async () => {
    const d = deferred();
    const { btn, directive, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    expect(directive.pending()).toBe(true);
    d.resolve();
    await d.promise;
    flush(fixture);
    expect(directive.pending()).toBe(false);
  });

  it('should guard against double-click', async () => {
    const d = deferred();
    const { btn, host } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    btn.click();
    btn.click();
    expect(host.callCount).toBe(1);
    d.resolve();
    await d.promise;
  });

  it('should set succeeded after resolve', async () => {
    const { btn, directive, fixture } = setupButton();
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(directive.succeeded()).toBe(true);
    });
  });

  it('should reset succeeded after feedbackDuration', async () => {
    vi.useFakeTimers();
    const d = deferred();
    const { btn, directive, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    expect(directive.pending()).toBe(true);
    // Resolve the action
    d.resolve();
    await vi.advanceTimersByTimeAsync(0);
    flush(fixture);
    expect(directive.succeeded()).toBe(true);
    // Advance past feedback duration
    vi.advanceTimersByTime(2001);
    expect(directive.succeeded()).toBe(false);
    vi.useRealTimers();
  });

  it('should set failed and error on rejection', async () => {
    const { btn, directive, host, fixture } = setupButton();
    host.actionImpl = () => Promise.reject('oops');
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(directive.failed()).toBe(true);
    });
    expect(directive.error()).toBe('oops');
  });

  it('communicates pending via aria, never the hard disabled attr (focus survives)', async () => {
    const d = deferred();
    const { btn, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.focus();
    btn.click();
    flush(fixture);
    // aria-busy + aria-disabled communicate the busy state; the hard
    // disabled attribute would drop keyboard focus to <body> mid-action.
    expect(btn.hasAttribute('disabled')).toBe(false);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(btn);
    d.resolve();
    await d.promise;
    flush(fixture);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
  });

  it('should NOT set disabled on div, but set aria-disabled', async () => {
    const d = deferred();
    const { div, host, fixture } = setupDiv();
    host.actionImpl = () => d.promise;
    div.click();
    flush(fixture);
    expect(div.hasAttribute('disabled')).toBe(false);
    expect(div.getAttribute('aria-disabled')).toBe('true');
    d.resolve();
    await d.promise;
  });

  it('should set aria-busy while pending', async () => {
    const d = deferred();
    const { btn, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    d.resolve();
    await d.promise;
  });

  it('should not call action when enabled is false', () => {
    const { btn, host } = setupButton({ enabled: false });
    btn.click();
    expect(host.callCount).toBe(0);
  });

  it('marks a disabled-by-intent control aria-disabled without the hard disabled attr', () => {
    const { btn } = setupButton({ enabled: false });
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.hasAttribute('disabled')).toBe(false);
    expect(btn.getAttribute('aria-busy')).toBeNull();
  });

  it('reflects the external busy override in aria-busy without blocking clicks', () => {
    const { fixture, btn, host } = setupButton();
    host.busy.set(true);
    fixture.detectChanges();
    expect(btn.getAttribute('aria-busy')).toBe('true');
    // busy is an ARIA hint, not a click guard - the action still runs.
    expect(btn.getAttribute('aria-disabled')).toBeNull();
    btn.click();
    expect(host.callCount).toBe(1);
  });

  it('should apply CSS classes', async () => {
    vi.useFakeTimers();
    const d = deferred();
    const { btn, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
    flush(fixture);
    expect(btn.classList.contains('cngx-async--pending')).toBe(true);
    d.resolve();
    await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.minDwell);
    flush(fixture);
    expect(btn.classList.contains('cngx-async--success')).toBe(true);
  });

  it('should work with Observable actions', async () => {
    const { btn, directive, host, fixture } = setupButton();
    host.actionImpl = () => of('done');
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(directive.succeeded()).toBe(true);
    });
  });

  it('auto-renders a polite region as a SIBLING of the host (not in the accname)', async () => {
    const { btn, host, fixture } = setupButton();
    const region = btn.nextElementSibling as HTMLElement | null;
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.getAttribute('role')).toBe('status');
    // Inside the button it would rename the control.
    expect(btn.contains(region)).toBe(false);
    expect(region?.textContent?.trim()).toBe('');

    host.actionImpl = () => Promise.resolve();
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(region?.textContent?.trim()).toBe('Action succeeded');
    });
  });

  it('emits (settled) once per run with a monotonic generation', async () => {
    const { btn, directive, host } = setupButton();
    const events: CngxAsyncSettle[] = [];
    directive.settled.subscribe((e) => events.push(e));
    const err = new Error('nope');

    btn.click();
    await vi.waitFor(() => expect(events).toHaveLength(1));
    host.actionImpl = () => Promise.reject(err);
    btn.click();
    await vi.waitFor(() => expect(events).toHaveLength(2));

    expect(events).toEqual([
      { generation: 1, status: 'success', error: undefined },
      { generation: 2, status: 'error', error: err },
    ]);
  });

  it('a throwing (settled) listener does not produce a second, error settle', async () => {
    const listenerError = new Error('listener');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ErrorHandler,
          useValue: {
            handleError: (err: unknown) => {
              throw err;
            },
          },
        },
      ],
    });
    const { directive } = setupButton();
    const events: CngxAsyncSettle[] = [];
    directive.settled.subscribe((e) => {
      events.push(e);
      if (events.length === 1) {
        throw listenerError;
      }
    });

    const run = (directive as unknown as { handleClick(e: Event): Promise<void> }).handleClick(
      new Event('click'),
    );

    await expect(run).rejects.toBe(listenerError);
    expect(events).toEqual([{ generation: 1, status: 'success', error: undefined }]);
    expect(directive.status()).toBe('success');
  });

  it('clears the region at the settle and writes it after the next render', async () => {
    const { btn, fixture, host } = setupButton();
    const region = btn.nextElementSibling as HTMLElement;
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(region.textContent).toBe('Action succeeded');
    });

    const run = deferred();
    host.actionImpl = () => run.promise;
    btn.click();
    run.resolve();
    await run.promise;
    await Promise.resolve();
    expect(region.textContent).toBe('');
    flush(fixture);
    expect(region.textContent).toBe('Action succeeded');
  });

  it('announce() speaks a host message once after the next render', () => {
    const { btn, directive, fixture } = setupButton();
    const region = btn.nextElementSibling as HTMLElement;
    directive.announce('Saved elsewhere');
    expect(region.textContent).toBe('');
    flush(fixture);
    expect(region.textContent).toBe('Saved elsewhere');
  });

  it('announce() is a no-op without the auto region', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.componentInstance.autoAnnounce.set(false);
    flush(fixture);
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    fixture.componentInstance.directive().announce('Saved elsewhere');
    flush(fixture);
    expect(btn.nextElementSibling).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Saved elsewhere');
  });

  it('removes the auto region when autoAnnounce is opted out', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.componentInstance.autoAnnounce.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.nextElementSibling).toBeNull();
  });
});

@Component({
  template: `<button
    [cngxAsyncClick]="action"
    [showDelay]="showDelay()"
    [minDwell]="minDwell()"
    [feedbackDuration]="feedbackDuration()"
  >
    Go
  </button>`,
  imports: [CngxAsyncClick],
})
class GateHost {
  readonly showDelay = signal<number | undefined>(undefined);
  readonly minDwell = signal<number | undefined>(undefined);
  readonly feedbackDuration = signal(2000);
  readonly directive = viewChild.required(CngxAsyncClick);
  callCount = 0;
  actionImpl: () => Promise<unknown> = () => Promise.resolve();
  readonly action: AsyncAction = () => {
    this.callCount++;
    return this.actionImpl();
  };
}

@Component({
  template: `<button [cngxAsyncClick]="action">Go</button>`,
  imports: [CngxAsyncClick],
  viewProviders: [...provideLoadingConfigAt(withShowDelay(300))],
})
class ScopedConfigGateHost {
  readonly directive = viewChild.required(CngxAsyncClick);
  readonly action: AsyncAction = () => new Promise(() => undefined);
}

describe('CngxAsyncClick busy visibility gate', () => {
  const { showDelay, minDwell } = CNGX_LOADING_DEFAULTS;

  function setup(configure?: (host: GateHost) => void) {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(GateHost);
    configure?.(fixture.componentInstance);
    flush(fixture);
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const run = deferred();
    fixture.componentInstance.actionImpl = () => run.promise;
    const advance = async (ms: number): Promise<void> => {
      await vi.advanceTimersByTimeAsync(ms);
      flush(fixture);
    };
    const click = (): void => {
      btn.click();
      flush(fixture);
    };
    const host = fixture.componentInstance;
    return { fixture, btn, run, advance, click, host, directive: host.directive() };
  }

  it('never shows the busy visual for a run that settles before showDelay', async () => {
    const { btn, run, advance, click, host, directive } = setup();
    click();
    expect(directive.pending()).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    btn.click();
    expect(host.callCount).toBe(1);

    await advance(showDelay - 20);
    expect(directive.busyVisible()).toBe(false);
    expect(btn.classList.contains('cngx-async--pending')).toBe(false);

    run.resolve();
    await advance(showDelay + minDwell);
    expect(directive.busyVisible()).toBe(false);
    expect(btn.classList.contains('cngx-async--pending')).toBe(false);
    expect(directive.succeeded()).toBe(true);
  });

  it('shows the busy visual after showDelay and holds it for minDwell past the settle', async () => {
    const { btn, run, advance, click, directive } = setup();
    click();
    await advance(showDelay - 1);
    expect(directive.busyVisible()).toBe(false);
    await advance(1);
    expect(directive.busyVisible()).toBe(true);
    expect(btn.classList.contains('cngx-async--pending')).toBe(true);

    await advance(10);
    run.resolve();
    await advance(0);
    expect(directive.pending()).toBe(false);
    expect(directive.succeeded()).toBe(true);
    expect(directive.announcement()).not.toBe('');
    // pending() cleared, but aria-busy is held until the busy visual releases
    // (E4): the control reads as busy for the whole dwell.
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(directive.busyVisible()).toBe(true);
    expect(btn.classList.contains('cngx-async--pending')).toBe(true);
    expect(btn.classList.contains('cngx-async--success')).toBe(false);

    await advance(minDwell - 11);
    expect(directive.busyVisible()).toBe(true);
    await advance(1);
    expect(directive.busyVisible()).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
    expect(btn.classList.contains('cngx-async--pending')).toBe(false);
    expect(btn.classList.contains('cngx-async--success')).toBe(true);
  });

  it('refuses a second run and stays busy for the whole dwell after settle (E4)', async () => {
    const { btn, run, advance, click, host, directive } = setup();
    click();
    await advance(showDelay + 10);
    run.resolve();
    await advance(0);
    // Settled, but the busy visual is still held.
    expect(directive.pending()).toBe(false);
    expect(directive.busyVisible()).toBe(true);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.getAttribute('aria-busy')).toBe('true');

    // A click inside the dwell starts no second run.
    click();
    expect(host.callCount).toBe(1);

    // On release both attributes clear on the same tick as the pending class.
    await advance(minDwell);
    expect(directive.busyVisible()).toBe(false);
    expect(btn.classList.contains('cngx-async--pending')).toBe(false);
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
  });

  it('honours [showDelay]="0" and [minDwell]="0"', async () => {
    const { run, advance, click, directive } = setup((h) => {
      h.showDelay.set(0);
      h.minDwell.set(0);
    });
    click();
    await advance(0);
    expect(directive.busyVisible()).toBe(true);

    run.resolve();
    await advance(1);
    expect(directive.busyVisible()).toBe(false);
  });

  it('retimes through provideLoadingConfigAt(withShowDelay)', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ScopedConfigGateHost);
    flush(fixture);
    const directive = fixture.componentInstance.directive();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    flush(fixture);

    await vi.advanceTimersByTimeAsync(299);
    flush(fixture);
    expect(directive.busyVisible()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    flush(fixture);
    expect(directive.busyVisible()).toBe(true);
  });

  it('refuses a click in the dwell tail, so no second run extends the layer (E4)', async () => {
    const { run, advance, click, host, directive } = setup();
    click();
    await advance(showDelay + 10);
    run.resolve();
    await advance(0);
    expect(directive.busyVisible()).toBe(true);

    // A click deep in the dwell tail is refused: no second run starts, so the
    // held layer is not re-extended and releases on the original schedule.
    const second = deferred();
    host.actionImpl = () => second.promise;
    await advance(100);
    click();
    expect(host.callCount).toBe(1);
    expect(directive.pending()).toBe(false);

    await advance(minDwell);
    expect(directive.busyVisible()).toBe(false);
  });

  it('paints the success tint for feedbackDuration after the busy visual releases (C2)', async () => {
    const { btn, run, advance, click, directive } = setup((h) => h.feedbackDuration.set(100));
    click();
    await advance(showDelay + 10);
    run.resolve();
    await advance(0);
    expect(directive.succeeded()).toBe(true);
    expect(directive.announcement()).not.toBe('');
    // Held dwell: the tint is suppressed behind the still-shown busy visual.
    expect(btn.classList.contains('cngx-async--success')).toBe(false);

    // Release edge: shown at showDelay, held for minDwell past the settle.
    await advance(minDwell - 10);
    expect(directive.busyVisible()).toBe(false);
    expect(directive.succeeded()).toBe(true);
    expect(btn.classList.contains('cngx-async--success')).toBe(true);

    // The window runs for the full feedbackDuration from the release, not from
    // the earlier settle (which under the old timing reset it mid-dwell, so the
    // tint was never painted when feedbackDuration < the remaining dwell).
    await advance(99);
    expect(btn.classList.contains('cngx-async--success')).toBe(true);
    await advance(2);
    expect(directive.succeeded()).toBe(false);
    expect(btn.classList.contains('cngx-async--success')).toBe(false);
  });

  it('leaves no timer and writes no state when destroyed mid-run', async () => {
    const { fixture, run, advance, click, directive } = setup();
    click();
    await advance(showDelay + 10);
    expect(directive.pending()).toBe(true);
    expect(directive.busyVisible()).toBe(true);

    fixture.destroy();
    // The gate's delay/minDwell timers are cleared on destroy; the pending run
    // has armed no feedback timer yet (it arms only after settle + release).
    expect(vi.getTimerCount()).toBe(0);

    run.resolve();
    await vi.advanceTimersByTimeAsync(showDelay + minDwell + 2000);
    // The destroyed guard drops the resolve: the state is frozen as it was at
    // destroy (pending, never settled), no late success write, no new timer.
    expect(directive.succeeded()).toBe(false);
    expect(directive.pending()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the first error when a second run starts', async () => {
    const { advance, click, host, directive } = setup();
    const first = deferred();
    host.actionImpl = () => first.promise;
    click();
    await advance(showDelay + 10);
    first.reject('first');
    await advance(minDwell + 1);
    expect(directive.failed()).toBe(true);
    expect(directive.error()).toBe('first');

    const second = deferred();
    host.actionImpl = () => second.promise;
    click();
    // The new run clears the prior feedback at click.
    expect(directive.failed()).toBe(false);
    expect(directive.error()).toBeUndefined();
    expect(directive.pending()).toBe(true);

    await advance(showDelay + 10);
    second.reject('second');
    await advance(minDwell + 1);
    expect(directive.failed()).toBe(true);
    expect(directive.error()).toBe('second');
  });

  it('keeps separate gates for two instances', async () => {
    const one = setup();
    const two = setup();
    one.click();
    await one.advance(showDelay + 1);
    // Only the clicked instance opens its gate; the idle one stays closed.
    expect(one.directive.busyVisible()).toBe(true);
    expect(two.directive.busyVisible()).toBe(false);

    one.run.resolve();
    await one.advance(minDwell);
    expect(one.directive.busyVisible()).toBe(false);
    expect(two.directive.busyVisible()).toBe(false);
  });

  it('never opens the busy visual from the [busy] ARIA hint (negative)', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.componentInstance.busy.set(true);
    flush(fixture);
    const directive = fixture.componentInstance.directive();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    await vi.advanceTimersByTimeAsync(showDelay + minDwell + 1);
    flush(fixture);
    // [busy] is an ARIA hint only: aria-busy reflects it, but no gate opens.
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(directive.busyVisible()).toBe(false);
    expect(btn.classList.contains('cngx-async--pending')).toBe(false);
  });
});

describe('CngxAsyncClick language switch', () => {
  it('does not re-announce on a language flip', async () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideInteractiveI18n(
          withInteractiveI18nLabels(
            computed(() =>
              lang() === 'de'
                ? { asyncClickSucceeded: 'Erledigt', asyncClickFailed: 'Fehlgeschlagen' }
                : {},
            ),
          ),
        ),
      ],
    });
    const { btn, host, fixture } = setupButton();
    const region = btn.nextElementSibling as HTMLElement;
    host.actionImpl = () => Promise.resolve();
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(region.textContent?.trim()).toBe('Action succeeded');
    });

    lang.set('de');
    flush(fixture);
    flush(fixture);
    expect(region.textContent?.trim()).toBe('Action succeeded');

    host.actionImpl = () => Promise.reject(new Error('nope'));
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(region.textContent?.trim()).toBe('Fehlgeschlagen');
    });
  });
});

@Directive({
  selector: '[testHostState]',
  providers: [{ provide: CNGX_HOST_INTERACTION_STATE, useExisting: TestHostState }],
})
class TestHostState {
  readonly disabled = input(false, { alias: 'testHostState' });
}

@Component({
  template: `
    <button id="state-first" [testHostState]="disabled()" [cngxAsyncClick]="action">A</button>
    <button id="click-first" [cngxAsyncClick]="action" [testHostState]="disabled()">B</button>
    <span [testHostState]="disabled()"
      ><button id="outside" [cngxAsyncClick]="action">C</button></span
    >
  `,
  imports: [CngxAsyncClick, TestHostState],
})
class HostStateHost {
  readonly disabled = signal(true);
  callCount = 0;
  readonly action: AsyncAction = () => {
    this.callCount++;
    return Promise.resolve();
  };
}

describe('CngxAsyncClick with a co-hosted CNGX_HOST_INTERACTION_STATE', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostStateHost);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    const button = (id: string) => el.querySelector(`#${id}`) as HTMLButtonElement;
    return { fixture, host: fixture.componentInstance, button };
  }

  it('sets aria-disabled from the host state in both attribute orders', () => {
    const { button } = setup();
    expect(button('state-first').getAttribute('aria-disabled')).toBe('true');
    expect(button('click-first').getAttribute('aria-disabled')).toBe('true');
  });

  it('swallows clicks while the host state is disabled', () => {
    const { button, host } = setup();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    button('state-first').dispatchEvent(event);
    button('click-first').click();
    expect(host.callCount).toBe(0);
    expect(event.defaultPrevented).toBe(true);
  });

  it('releases aria-disabled and runs the action once the host state enables', () => {
    const { fixture, button, host } = setup();
    host.disabled.set(false);
    flush(fixture);
    expect(button('state-first').hasAttribute('aria-disabled')).toBe(false);
    button('state-first').click();
    expect(host.callCount).toBe(1);
  });

  it('ignores a host state provided on an ancestor element', () => {
    const { button } = setup();
    expect(button('outside').hasAttribute('aria-disabled')).toBe(false);
  });
});

@Directive({
  selector: '[testHostBusy]',
  providers: [{ provide: CNGX_HOST_INTERACTION_STATE, useExisting: TestHostBusy }],
})
class TestHostBusy {
  readonly busy = input(false, { alias: 'testHostBusy' });
  readonly announcementText = input('', { alias: 'testHostAnnouncement' });
  readonly disabled = computed(() => false);
  readonly announcement = computed(() => this.announcementText());
}

@Component({
  template: `
    <div>
      <button [testHostBusy]="busy()" [testHostAnnouncement]="text()" [cngxAsyncClick]="action">
        Go
      </button>
    </div>
  `,
  imports: [CngxAsyncClick, TestHostBusy],
})
class HostBusyHost {
  readonly busy = signal(false);
  readonly text = signal('');
  readonly action: AsyncAction = () => Promise.resolve();
}

describe('CngxAsyncClick with a host-reflected run and announcement', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostBusyHost);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      button: el.querySelector('button') as HTMLButtonElement,
      region: () => el.querySelector('[aria-live="polite"]') as HTMLElement | null,
    };
  }

  it('folds the host busy flag into aria-busy', () => {
    const { fixture, host, button } = setup();
    expect(button.hasAttribute('aria-busy')).toBe(false);
    host.busy.set(true);
    flush(fixture);
    expect(button.getAttribute('aria-busy')).toBe('true');
    host.busy.set(false);
    flush(fixture);
    expect(button.hasAttribute('aria-busy')).toBe(false);
  });

  it('speaks the host announcement in its sibling region instead of its own', async () => {
    const { fixture, host, button, region } = setup();
    expect(region()).not.toBeNull();
    expect(region()!.textContent).toBe('');
    host.text.set('Saved by the host');
    flush(fixture);
    // Read per settle, not per change: no settle, nothing spoken.
    expect(region()!.textContent).toBe('');
    button.click();
    await fixture.whenStable();
    flush(fixture);
    expect(
      fixture.debugElement
        .query((de) => de.nativeElement === button)
        .injector.get(CngxAsyncClick)
        .succeeded(),
    ).toBe(true);
    expect(region()!.textContent).toBe('Saved by the host');
    expect(button.contains(region())).toBe(false);
  });

  it('keeps the region empty when the host announcement is an empty string', async () => {
    const { fixture, button, region } = setup();
    button.click();
    await fixture.whenStable();
    flush(fixture);
    const directive = fixture.debugElement
      .query((de) => de.nativeElement === button)
      .injector.get(CngxAsyncClick);
    expect(directive.succeeded()).toBe(true);
    expect(directive.announcement()).not.toBe('');
    expect(region()!.textContent).toBe('');
  });
});

@Component({
  template: `<button
    [testHostBusy]="hostBusy()"
    [cngxAsyncClick]="action"
    [showDelay]="0"
    [minDwell]="50"
    [feedbackDuration]="100"
  >Go</button>`,
  imports: [CngxAsyncClick, TestHostBusy],
})
class ReArmHost {
  readonly hostBusy = signal(false);
  readonly directive = viewChild.required(CngxAsyncClick);
  actionImpl: () => Promise<unknown> = () => Promise.resolve();
  readonly action: AsyncAction = () => this.actionImpl();
}

describe('CngxAsyncClick feedback window re-arm (C2)', () => {
  it('restarts the window on a host-busy reopen and keeps exactly one timer', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ReArmHost);
    flush(fixture);
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const host = fixture.componentInstance;
    const directive = host.directive();
    const run = deferred();
    host.actionImpl = () => run.promise;
    const advance = async (ms: number): Promise<void> => {
      await vi.advanceTimersByTimeAsync(ms);
      flush(fixture);
    };

    btn.click();
    flush(fixture);
    await advance(0);
    expect(directive.busyVisible()).toBe(true);

    run.resolve();
    await advance(0);
    expect(directive.succeeded()).toBe(true);
    expect(directive.busyVisible()).toBe(true);

    // First release at minDwell (t=50): the feedback window arms here.
    await advance(50);
    expect(directive.busyVisible()).toBe(false);
    expect(btn.classList.contains('cngx-async--success')).toBe(true);

    // Reopen the busy visual inside the window (hostBusy): the tint hides
    // while it shows, and the first timer is still pending.
    host.hostBusy.set(true);
    flush(fixture);
    await advance(0);
    expect(directive.busyVisible()).toBe(true);
    expect(btn.classList.contains('cngx-async--success')).toBe(false);

    // Let the reopen settle; its own minDwell (50) brings the second release
    // at t=100, which re-arms the window (clearing the first timer).
    host.hostBusy.set(false);
    await advance(50);
    expect(directive.busyVisible()).toBe(false);
    expect(directive.succeeded()).toBe(true);
    expect(btn.classList.contains('cngx-async--success')).toBe(true);

    // Past the FIRST window's end (t=50+100=150) the tint still stands: the
    // original timer was cleared, so only the re-armed one is pending.
    await advance(60);
    expect(directive.succeeded()).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    // The re-armed window ends at the second release + feedbackDuration (t=200).
    await advance(45);
    expect(directive.succeeded()).toBe(false);
    expect(btn.classList.contains('cngx-async--success')).toBe(false);
    vi.useRealTimers();
  });
});

@Component({
  template: `<button [cngxAsyncClick]="action">Go</button>`,
  imports: [CngxAsyncClick],
})
class LifecycleHost {
  readonly directive = viewChild.required(CngxAsyncClick);
  signal: AbortSignal | undefined;
  actionImpl: AsyncAction = () => Promise.resolve();
  readonly action: AsyncAction = (signal) => {
    this.signal = signal;
    return this.actionImpl(signal);
  };
}

describe('CngxAsyncClick run end without an outcome', () => {
  function setup() {
    const fixture = TestBed.createComponent(LifecycleHost);
    flush(fixture);
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const region = btn.nextElementSibling as HTMLElement;
    const host = fixture.componentInstance;
    const directive = host.directive();
    const events: CngxAsyncSettle[] = [];
    directive.settled.subscribe((e) => events.push(e));
    return { fixture, btn, region, host, directive, events };
  }

  it('maps a resolved CNGX_ASYNC_CANCELLED to idle with no settle and no write', async () => {
    const { fixture, btn, region, host, directive, events } = setup();
    host.actionImpl = () => Promise.resolve(CNGX_ASYNC_CANCELLED);
    btn.click();
    await fixture.whenStable();
    flush(fixture);
    expect(directive.status()).toBe('idle');
    expect(events).toHaveLength(0);
    expect(region.textContent).toBe('');
  });

  it('settles idle on a createRetry reset mid-run (A7)', async () => {
    vi.useFakeTimers();
    const { fixture, btn, region, host, directive, events } = setup();
    const [retryable, retryState] = createRetry(() => Promise.reject(new Error('fail')), {
      maxAttempts: 3,
      delay: 100,
    });
    host.actionImpl = retryable;
    btn.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(retryState.retrying()).toBe(true);

    retryState.reset();
    await vi.advanceTimersByTimeAsync(500);
    flush(fixture);

    expect(directive.status()).toBe('idle');
    expect(directive.pending()).toBe(false);
    expect(events).toHaveLength(0);
    expect(region.textContent).toBe('');
  });

  it('destroyed mid-run: aborts the signal, no write, no emit, no timer (F2)', async () => {
    vi.useFakeTimers();
    const { fixture, btn, region, host, events } = setup();
    const run = deferred();
    host.actionImpl = () => run.promise;
    btn.click();
    flush(fixture);
    expect(host.signal?.aborted).toBe(false);

    fixture.destroy();
    expect(host.signal?.aborted).toBe(true);
    run.resolve();
    await vi.advanceTimersByTimeAsync(0);

    expect(events).toHaveLength(0);
    expect(region.textContent).toBe('');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops a createRetry backoff loop when the runner is destroyed', async () => {
    vi.useFakeTimers();
    const { fixture, btn, host, events } = setup();
    const attempt = vi.fn(() => Promise.reject(new Error('fail')));
    const [retryable, retryState] = createRetry(attempt, { maxAttempts: 5, delay: 1000 });
    host.actionImpl = retryable;
    btn.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(retryState.retrying()).toBe(true);

    fixture.destroy();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(attempt).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
