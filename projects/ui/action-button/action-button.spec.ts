import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, vi } from 'vitest';
import { CngxActionButton } from './action-button';
import {
  CngxFailed,
  CngxPending,
  CngxSucceeded,
  provideInteractiveI18n,
  withInteractiveI18nLabels,
  type CngxInteractiveI18n,
} from '@cngx/common/interactive';
import { type CngxAsyncState, buildAsyncStateView, type AsyncStatus } from '@cngx/core/utils';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';
import { stripBidiIsolates } from '@cngx/testing';
import { CngxToastOn, CngxToaster, provideFeedback, withErrorDetail } from '@cngx/ui/feedback';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Text of the visible status cell; the inactive cells stay in the DOM, stacked. */
function activeText(btn: HTMLElement): string {
  return btn.querySelector('.cngx-action-button__label[data-active]')?.textContent?.trim() ?? '';
}

function buildMockState(initial: AsyncStatus = 'idle'): {
  state: CngxAsyncState<unknown>;
  status: ReturnType<typeof signal<AsyncStatus>>;
  error: ReturnType<typeof signal<unknown>>;
} {
  const status = signal<AsyncStatus>(initial);
  const error = signal<unknown>(undefined);
  const state = buildAsyncStateView<unknown>({
    status: status.asReadonly(),
    data: signal(undefined).asReadonly(),
    error: error.asReadonly(),
  });
  return { state, status, error };
}

// ── Simple host (string labels) ─────────────────────────────────────────

@Component({
  template: `
    <button cngxActionButton
      [action]="action"
      pendingLabel="Saving..."
      succeededLabel="Done!"
      failedLabel="Error"
    >
      Save
    </button>
  `,
  imports: [CngxActionButton],
})
class SimpleHost {
  actionImpl = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

// ── Template host ───────────────────────────────────────────────────────

@Component({
  template: `
    <button cngxActionButton [action]="action" #ab="cngxActionButton">
      Save
      <ng-template cngxPending>Loading...</ng-template>
      <ng-template cngxSucceeded>OK</ng-template>
      <ng-template cngxFailed let-err>Err: {{ err }}</ng-template>
    </button>
  `,
  imports: [CngxActionButton, CngxPending, CngxSucceeded, CngxFailed],
})
class TemplateHost {
  actionImpl = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

// ── Variant host ────────────────────────────────────────────────────────

@Component({
  template: `<button cngxActionButton [action]="action" cngxActionButton="ghost">Delete</button>`,
  imports: [CngxActionButton],
})
class VariantHost {
  readonly action = () => Promise.resolve();
}

// ── Enabled host ────────────────────────────────────────────────────────

@Component({
  template: `
    <button cngxActionButton [action]="action" [disabled]="!enabled">Click</button>
  `,
  imports: [CngxActionButton],
})
class EnabledHost {
  enabled = true;
  callCount = 0;
  readonly action = () => {
    this.callCount++;
    return Promise.resolve();
  };
}

// ── External state host ─────────────────────────────────────────────────

@Component({
  template: `
    <button cngxActionButton
      [action]="action"
      [externalState]="mockState"
      pendingLabel="Ext pending"
      succeededLabel="Ext done"
      failedLabel="Ext error"
      #ab="cngxActionButton"
    >
      Idle
    </button>
  `,
  imports: [CngxActionButton],
})
class ExternalStateHost {
  readonly mock = buildMockState();
  readonly mockState = this.mock.state;
  callCount = 0;
  readonly action = () => {
    this.callCount++;
    return Promise.resolve();
  };
}

// ── Unlabelled external-state host (i18n fallback) ───────────────────────

@Component({
  template: `
    <button cngxActionButton [action]="action" [externalState]="mockState">Idle</button>
  `,
  imports: [CngxActionButton],
})
class UnlabelledExternalHost {
  readonly mock = buildMockState();
  readonly mockState = this.mock.state;
  readonly action = () => Promise.resolve();
}

// ── Disabled-reason host ────────────────────────────────────────────────

@Component({
  template: `
    <button cngxActionButton [action]="action" [disabled]="!enabled" [disabledReason]="reason">
      Save
    </button>
  `,
  imports: [CngxActionButton],
})
class DisabledReasonHost {
  enabled = false;
  reason: string | undefined = 'Complete the form first';
  readonly action = () => Promise.resolve();
}

// ── External state + failed template host ───────────────────────────────

@Component({
  template: `
    <button cngxActionButton [action]="action" [externalState]="mockState">
      Idle
      <ng-template cngxFailed let-err>Err: {{ err }}</ng-template>
    </button>
  `,
  imports: [CngxActionButton, CngxFailed],
})
class ExternalFailedTemplateHost {
  readonly mock = buildMockState();
  readonly mockState = this.mock.state;
  readonly action = () => Promise.resolve();
}

@Component({
  template: `
    <button cngxActionButton
      [action]="action"
      #btn="cngxActionButton"
      [cngxToastOn]="btn.state"
      toastSuccess="Saved!"
    >
      Save
    </button>
  `,
  imports: [CngxActionButton, CngxToastOn],
})
class DoubleToastHost {
  readonly action = () => Promise.resolve();
}

@Component({
  template: `
    <button cngxActionButton [action]="action" #btn="cngxActionButton" [cngxToastOn]="btn.state">
      Save
    </button>
  `,
  imports: [CngxActionButton, CngxToastOn],
})
class BridgeOnlyHost {
  readonly action = () => Promise.resolve();
}

// ── Toast host ──────────────────────────────────────────────────────────

@Component({
  template: `
    <button cngxActionButton
      [action]="action"
      toastSuccess="Saved!"
      toastError="Save failed"
      [toastErrorDetail]="true"
    >
      Save
    </button>
  `,
  imports: [CngxActionButton],
})
class ToastHost {
  actionImpl = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

@Component({
  template: `
    <button cngxActionButton [action]="action" [toastSuccess]="toastMsg()" #ab="cngxActionButton">
      Save
    </button>
  `,
  imports: [CngxActionButton],
})
class ToastRebindHost {
  actionImpl = () => Promise.resolve();
  readonly action = () => this.actionImpl();
  readonly toastMsg = signal('Saved!');
}

// ── State exposition host ───────────────────────────────────────────────

@Component({
  template: `
    <button cngxActionButton [action]="action" #ab="cngxActionButton">Go</button>
  `,
  imports: [CngxActionButton],
})
class StateHost {
  actionImpl = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

describe('CngxActionButton', () => {
  describe('simple labels', () => {
    it('should show idle content by default', () => {
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(activeText(btn)).toContain('Save');
    });

    it('should show pendingLabel while pending', async () => {
      const d = deferred();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(activeText(btn)).toBe('Saving...');
      // Busy communicates via aria; the hard disabled attr would drop focus.
      expect(btn.disabled).toBe(false);
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      d.resolve();
      await d.promise;
    });

    it('should show succeededLabel after success', async () => {
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(activeText(btn)).toContain('Done!');
      });
    });

    it('should show failedLabel after failure', async () => {
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => Promise.reject('err');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(activeText(btn)).toContain('Error');
      });
    });
  });

  describe('template slots', () => {
    it('should show pending template', async () => {
      const d = deferred();
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(activeText(btn)).toBe('Loading...');
      d.resolve();
      await d.promise;
    });

    it('should show succeeded template', async () => {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(activeText(btn)).toContain('OK');
      });
    });

    it('should show failed template with error context', async () => {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.actionImpl = () => Promise.reject('boom');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(activeText(btn)).toContain('Err: boom');
      });
    });
  });

  describe('variant', () => {
    it('binds the variant through the selector onto the native button', () => {
      const fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.classList.contains('cngx-button')).toBe(true);
      expect(btn.classList.contains('cngx-action-button')).toBe(true);
      expect(btn.dataset['variant']).toBe('ghost');
    });

    it('defaults to the button family axes and type="button"', () => {
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.dataset['variant']).toBe('solid');
      expect(btn.dataset['tone']).toBe('neutral');
      expect(btn.dataset['size']).toBe('md');
      expect(btn.getAttribute('type')).toBe('button');
      expect(btn.querySelector('button')).toBeNull();
    });
  });

  describe('behavior', () => {
    it('should guard against double-click', async () => {
      const d = deferred();
      let callCount = 0;
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => {
        callCount++;
        return d.promise;
      };
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      btn.click();
      btn.click();
      expect(callCount).toBe(1);
      d.resolve();
      await d.promise;
    });

    it('should apply async CSS classes from directive', async () => {
      const d = deferred();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(btn.classList.contains('cngx-async--pending')).toBe(true);
      d.resolve();
      await d.promise;
      flush(fixture);
      expect(btn.classList.contains('cngx-async--success')).toBe(true);
    });

    it('should set aria-busy while pending', async () => {
      const d = deferred();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(btn.getAttribute('aria-busy')).toBe('true');
      d.resolve();
      await d.promise;
    });

    it('renders the announcement region next to the button, outside its name', () => {
      const fixture = TestBed.createComponent(SimpleHost);
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      const live = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
      expect(live).toBeTruthy();
      expect(btn.contains(live)).toBe(false);
    });

    it('keeps one width: every status label sits stacked in the label cell', async () => {
      const d = deferred();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      const cells = () =>
        Array.from(btn.querySelectorAll<HTMLElement>('.cngx-action-button__label'));
      const active = () => cells().filter((c) => c.hasAttribute('data-active'));
      expect(cells().length).toBeGreaterThan(1);
      expect(active().length).toBe(1);
      expect(cells().filter((c) => c.getAttribute('aria-hidden') === 'true').length).toBe(
        cells().length - 1,
      );
      btn.click();
      flush(fixture);
      expect(active().length).toBe(1);
      expect(btn.hasAttribute('data-status-label')).toBe(true);
      d.resolve();
      await d.promise;
    });
  });

  describe('disabled input', () => {
    it('should ignore clicks while disabled', () => {
      const fixture = TestBed.createComponent(EnabledHost);
      fixture.componentInstance.enabled = false;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(fixture.componentInstance.callCount).toBe(0);
    });

    it('should execute the action once enabled', async () => {
      const fixture = TestBed.createComponent(EnabledHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(fixture.componentInstance.callCount).toBe(1);
      });
    });
  });

  describe('externalState', () => {
    it('should show external pending label when external state is pending', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('pending');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(activeText(btn)).toBe('Ext pending');
    });

    it('should show external success label when external state is success', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('success');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(activeText(btn)).toBe('Ext done');
    });

    it('should show external error label when external state is error', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('error');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(activeText(btn)).toBe('Ext error');
    });

    it('should show idle content when external state is idle', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('idle');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(activeText(btn)).toBe('Idle');
    });

    it('should render the failed template with the EXTERNAL error context', () => {
      // Closes the effectiveError-external gap: the inner-state failed
      // axis only exercises CngxAsyncClick's own error. Here the error
      // is owned by [externalState] and must reach the template $implicit.
      const fixture = TestBed.createComponent(ExternalFailedTemplateHost);
      fixture.componentInstance.mock.error.set('ext-boom');
      fixture.componentInstance.mock.status.set('error');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(activeText(btn)).toContain('Err: ext-boom');
    });

    it('marks the button busy and disabled while the external state is pending', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('pending');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });

    it('blocks clicks while the external state is pending', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('pending');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(fixture.componentInstance.callCount).toBe(0);
    });

    it('announces an external success in the live region', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('success');
      flush(fixture);
      const live = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
      expect(live.textContent?.trim()).toBe('Ext done');
    });

    it('announces an external failure in the live region', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('error');
      flush(fixture);
      const live = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
      expect(live.textContent?.trim()).toBe('Ext error');
    });
  });

  describe('disabled reason', () => {
    it('marks the button disabled and points aria-describedby at the reason', () => {
      const fixture = TestBed.createComponent(DisabledReasonHost);
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      const reason = fixture.nativeElement.querySelector('.cngx-button__reason') as HTMLElement;
      expect(reason.textContent?.trim()).toBe('Complete the form first');
      expect(btn.getAttribute('aria-describedby')).toBe(reason.id);
    });

    it('drops the aria-describedby reference once enabled, keeping the region gated', () => {
      const fixture = TestBed.createComponent(DisabledReasonHost);
      fixture.componentInstance.enabled = true;
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.getAttribute('aria-disabled')).toBeNull();
      expect(btn.getAttribute('aria-describedby')).toBeNull();
    });

    it('emits no reference when no reason is supplied', () => {
      const fixture = TestBed.createComponent(DisabledReasonHost);
      fixture.componentInstance.reason = undefined;
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('state exposition', () => {
    it('should expose CngxAsyncState reflecting inner lifecycle', async () => {
      const d = deferred();
      const fixture = TestBed.createComponent(StateHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const ab = fixture.debugElement.children[0].references['ab'] as CngxActionButton;
      expect(ab.state.status()).toBe('idle');

      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(ab.state.status()).toBe('pending');

      d.resolve();
      await vi.waitFor(() => {
        flush(fixture);
        expect(ab.state.status()).toBe('success');
      });
    });

    it('should set lastUpdated after success', async () => {
      const fixture = TestBed.createComponent(StateHost);
      fixture.detectChanges();
      const ab = fixture.debugElement.children[0].references['ab'] as CngxActionButton;
      expect(ab.state.lastUpdated()).toBeUndefined();

      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(ab.state.lastUpdated()).toBeInstanceOf(Date);
      });
    });
  });

  describe('toast integration', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should call toaster.show on success', async () => {
      const showSpy = vi.fn();
      TestBed.overrideProvider(CngxToaster, { useValue: { show: showSpy } });
      const fixture = TestBed.createComponent(ToastHost);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(showSpy).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Saved!', severity: 'success' }),
        );
      });
    });

    it('should call toaster.show on error with detail', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const showSpy = vi.fn();
      TestBed.overrideProvider(CngxToaster, { useValue: { show: showSpy } });
      const fixture = TestBed.createComponent(ToastHost);
      fixture.componentInstance.actionImpl = () => Promise.reject(new Error('DB timeout'));
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(showSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: '\u2068Save failed\u2069: \u2068DB timeout\u2069',
            severity: 'error',
          }),
        );
      });
    });

    it('does not re-fire the toast when a toast input rebinds inside the settled window', async () => {
      const showSpy = vi.fn();
      TestBed.overrideProvider(CngxToaster, { useValue: { show: showSpy } });
      const fixture = TestBed.createComponent(ToastRebindHost);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(showSpy).toHaveBeenCalledTimes(1);
      });
      const ab = fixture.debugElement.children[0].references['ab'] as CngxActionButton;
      const stamp = ab.state.lastUpdated();

      // previous() stays stale for the whole settled window; before the
      // untracked() wrap, any tracked toast-input read re-ran the body here.
      fixture.componentInstance.toastMsg.set('Saved again!');
      flush(fixture);
      flush(fixture);

      expect(showSpy).toHaveBeenCalledTimes(1);
      expect(ab.state.lastUpdated()).toBe(stamp);
    });

    it('warns CNGX3008 when [cngxToastOn] and toastSuccess share the element', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: CngxToaster, useValue: { show: vi.fn() } }],
      });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fixture = TestBed.createComponent(DoubleToastHost);
      fixture.detectChanges();
      TestBed.tick();

      const calls = warn.mock.calls.filter(([m]) => /^CNGX3008: /.test(String(m)));
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toMatch(/^CNGX3008: \[cngxActionButton\] \[toastSuccess\]\/\[toastError\] inputs/);
    });

    it('stays silent for [cngxToastOn] without the button toast inputs', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: CngxToaster, useValue: { show: vi.fn() } }],
      });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fixture = TestBed.createComponent(BridgeOnlyHost);
      fixture.detectChanges();
      TestBed.tick();

      expect(warn.mock.calls.some(([m]) => /^CNGX3008: /.test(String(m)))).toBe(false);
    });

    it('should not toast when toaster is not provided', async () => {
      const fixture = TestBed.createComponent(ToastHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      // Should not throw - toaster is optional
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(btn.textContent).toBeDefined();
      });
    });
  });

  describe('toast error detail', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const failWith = async (error: unknown): Promise<string> => {
      const showSpy = vi.fn();
      TestBed.overrideProvider(CngxToaster, { useValue: { show: showSpy } });
      const fixture = TestBed.createComponent(ToastHost);
      fixture.componentInstance.actionImpl = () => Promise.reject(error);
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(showSpy).toHaveBeenCalled();
      });
      return showSpy.mock.calls[0][0].message;
    };

    it('routes the detail through withErrorDetail', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideFeedback(withErrorDetail((error) => (error === 503 ? 'Server busy' : undefined))),
        ],
      });
      expect(stripBidiIsolates(await failWith(503))).toBe('Save failed: Server busy');
    });

    it('shows the message alone when the mapping returns no detail', async () => {
      TestBed.configureTestingModule({
        providers: [provideFeedback(withErrorDetail(() => undefined))],
      });
      expect(await failWith(new Error('HTTP 500 Internal Server Error'))).toBe('Save failed');
    });

    it('warns once in development when the raw error text shows', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      await failWith(new Error('Timeout'));
      const warnings = warn.mock.calls.filter(([text]) => String(text).includes('withErrorDetail'));
      expect(warnings).toHaveLength(1);
    });

    it('joins message and detail with the active language pack', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideFeedback(withErrorDetail(() => 'Zeitlimit')),
          provideCngxI18n(
            withPartialPack({
              locale: 'de',
              feedback: { errorWithDetail: '{message} ({detail})' },
            }),
            withDocumentLanguage('off'),
          ),
        ],
      });
      expect(stripBidiIsolates(await failWith(new Error('x')))).toBe('Save failed (Zeitlimit)');
    });
  });

  describe('i18n fallback', () => {
    const i18nOverrides = signal<Partial<CngxInteractiveI18n>>({});

    beforeEach(() => {
      i18nOverrides.set({});
      TestBed.configureTestingModule({
        providers: [provideInteractiveI18n(withInteractiveI18nLabels(i18nOverrides))],
      });
    });

    const liveText = (fixture: ReturnType<typeof TestBed.createComponent>): string =>
      (
        fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement
      ).textContent!.trim();

    it('announces the EN default without labels or a translation', () => {
      const fixture = TestBed.createComponent(UnlabelledExternalHost);
      fixture.componentInstance.mock.status.set('success');
      flush(fixture);
      expect(liveText(fixture)).toBe('Action succeeded');
    });

    it('keeps a shown announcement on a copy flip and speaks the new language next', () => {
      const fixture = TestBed.createComponent(UnlabelledExternalHost);
      const { status } = fixture.componentInstance.mock;
      status.set('success');
      flush(fixture);
      expect(liveText(fixture)).toBe('Action succeeded');

      i18nOverrides.set({ asyncClickSucceeded: 'Erledigt', asyncClickFailed: 'Fehlgeschlagen' });
      flush(fixture);
      expect(liveText(fixture)).toBe('Action succeeded');

      status.set('idle');
      flush(fixture);
      status.set('success');
      flush(fixture);
      expect(liveText(fixture)).toBe('Erledigt');
    });

    it('falls back to the translated failure phrase', () => {
      i18nOverrides.set({ asyncClickFailed: 'Fehlgeschlagen' });
      const fixture = TestBed.createComponent(UnlabelledExternalHost);
      fixture.componentInstance.mock.status.set('error');
      flush(fixture);
      expect(liveText(fixture)).toBe('Fehlgeschlagen');
    });
  });
});

describe('CngxActionButton language switch', () => {
  it('does not re-announce on a language flip', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      imports: [UnlabelledExternalHost],
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
    const fixture = TestBed.createComponent(UnlabelledExternalHost);
    fixture.detectChanges();
    const live = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;

    fixture.componentInstance.mock.status.set('success');
    fixture.detectChanges();
    expect(live.textContent?.trim()).toBe('Action succeeded');

    lang.set('de');
    fixture.detectChanges();
    expect(live.textContent?.trim()).toBe('Action succeeded');

    fixture.componentInstance.mock.status.set('error');
    fixture.detectChanges();
    expect(live.textContent?.trim()).toBe('Fehlgeschlagen');
  });
});
