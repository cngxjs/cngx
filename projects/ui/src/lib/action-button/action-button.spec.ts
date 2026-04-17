import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CngxActionButton } from './action-button';
import { CngxFailed, CngxPending, CngxSucceeded } from '@cngx/common/interactive';
import { type CngxAsyncState, buildAsyncStateView, type AsyncStatus } from '@cngx/core/utils';
import { CngxToaster } from '@cngx/ui/feedback';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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
    <cngx-action-button
      [action]="action"
      pendingLabel="Saving..."
      succeededLabel="Done!"
      failedLabel="Error"
    >
      Save
    </cngx-action-button>
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
    <cngx-action-button [action]="action" #ab="cngxActionButton">
      Save
      <ng-template cngxPending>Loading...</ng-template>
      <ng-template cngxSucceeded>OK</ng-template>
      <ng-template cngxFailed let-err>Err: {{ err }}</ng-template>
    </cngx-action-button>
  `,
  imports: [CngxActionButton, CngxPending, CngxSucceeded, CngxFailed],
})
class TemplateHost {
  actionImpl = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

// ── Variant host ────────────────────────────────────────────────────────

@Component({
  template: `<cngx-action-button [action]="action" variant="ghost">Delete</cngx-action-button>`,
  imports: [CngxActionButton],
})
class VariantHost {
  readonly action = () => Promise.resolve();
}

// ── Enabled host ────────────────────────────────────────────────────────

@Component({
  template: `
    <cngx-action-button [action]="action" [enabled]="enabled">Click</cngx-action-button>
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
    <cngx-action-button
      [action]="action"
      [externalState]="mockState"
      pendingLabel="Ext pending"
      succeededLabel="Ext done"
      failedLabel="Ext error"
      #ab="cngxActionButton"
    >
      Idle
    </cngx-action-button>
  `,
  imports: [CngxActionButton],
})
class ExternalStateHost {
  readonly mock = buildMockState();
  readonly mockState = this.mock.state;
  readonly action = () => Promise.resolve();
}

// ── Toast host ──────────────────────────────────────────────────────────

@Component({
  template: `
    <cngx-action-button
      [action]="action"
      toastSuccess="Saved!"
      toastError="Save failed"
      [toastErrorDetail]="true"
    >
      Save
    </cngx-action-button>
  `,
  imports: [CngxActionButton],
})
class ToastHost {
  actionImpl = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

// ── State exposition host ───────────────────────────────────────────────

@Component({
  template: `
    <cngx-action-button [action]="action" #ab="cngxActionButton">Go</cngx-action-button>
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
      expect(btn.textContent).toContain('Save');
    });

    it('should show pendingLabel while pending', async () => {
      const d = deferred();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(btn.textContent?.trim()).toBe('Saving...');
      expect(btn.disabled).toBe(true);
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
        expect(btn.textContent).toContain('Done!');
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
        expect(btn.textContent).toContain('Error');
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
      expect(btn.textContent?.trim()).toBe('Loading...');
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
        expect(btn.textContent).toContain('OK');
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
        expect(btn.textContent).toContain('Err: boom');
      });
    });
  });

  describe('variant', () => {
    it('should apply variant CSS class on inner button', () => {
      const fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.classList.contains('cngx-action-button')).toBe(true);
      expect(btn.classList.contains('cngx-action-button--ghost')).toBe(true);
    });

    it('should default to primary variant', () => {
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.classList.contains('cngx-action-button--primary')).toBe(true);
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

    it('should use display: contents on host', () => {
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('cngx-action-button') as HTMLElement;
      expect(host.style.display).toBe('contents');
    });

    it('should render aria-live announcement container', () => {
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
      const srOnly = fixture.nativeElement.querySelector(
        '.cngx-action-button__sr-only',
      ) as HTMLElement;
      expect(srOnly).toBeTruthy();
      expect(srOnly.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('enabled input', () => {
    it('should ignore clicks when enabled is false', () => {
      const fixture = TestBed.createComponent(EnabledHost);
      fixture.componentInstance.enabled = false;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(fixture.componentInstance.callCount).toBe(0);
    });

    it('should execute action when enabled is true', async () => {
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
      expect(btn.textContent?.trim()).toBe('Ext pending');
    });

    it('should show external success label when external state is success', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('success');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.textContent?.trim()).toBe('Ext done');
    });

    it('should show external error label when external state is error', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('error');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.textContent?.trim()).toBe('Ext error');
    });

    it('should show idle content when external state is idle', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('idle');
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.textContent?.trim()).toBe('Idle');
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
            message: 'Save failed: DB timeout',
            severity: 'error',
          }),
        );
      });
    });

    it('should not toast when toaster is not provided', async () => {
      const fixture = TestBed.createComponent(ToastHost);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      // Should not throw — toaster is optional
      btn.click();
      await vi.waitFor(() => {
        flush(fixture);
        expect(btn.textContent).toBeDefined();
      });
    });
  });
});
