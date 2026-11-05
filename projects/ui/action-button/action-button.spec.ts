import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import {
  CNGX_BUTTON_HOST_STATE,
  CNGX_BUTTON_STATE,
  CngxButtonBrain,
  CngxButtonEnd,
  CngxButtonStart,
} from '@cngx/common/button';
import { CngxIcon } from '@cngx/common/display';
import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';
import { CngxIconMenuButton, CngxSplitButton } from '@cngx/common/menu-button';
import { CngxPopover } from '@cngx/common/popover';
import { CngxActionButton } from './action-button';
import {
  CNGX_ASYNC_RUN_STATE,
  CNGX_HOST_INTERACTION_STATE,
  CngxFailed,
  CngxPending,
  CngxSucceeded,
  provideInteractiveI18n,
  type CngxAsyncSettle,
  withInteractiveI18nLabels,
  type CngxInteractiveI18n,
} from '@cngx/common/interactive';
import {
  CNGX_LOADING_DEFAULTS,
  type CngxAsyncState,
  buildAsyncStateView,
  type AsyncStatus,
} from '@cngx/core/utils';
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
    <button
      cngxActionButton
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
  template: ` <button cngxActionButton [action]="action" [disabled]="!enabled">Click</button> `,
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
    <button
      cngxActionButton
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

// ── Slots and split-button main ─────────────────────────────────────────

@Component({
  template: `
    <button cngxActionButton [action]="action">
      <cngx-icon cngxButtonStart class="start-glyph" />
      Save
      <cngx-icon cngxButtonEnd class="end-glyph" />
    </button>
    <button id="plain" cngxActionButton [action]="action">Plain</button>
  `,
  imports: [CngxActionButton, CngxButtonStart, CngxButtonEnd, CngxIcon],
})
class SlotHost {
  readonly action = () => Promise.resolve();
}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <button id="main" cngxActionButton [action]="publish">Publish</button>
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
    </div>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Publish options'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="draft">Save as draft</li>
      </ul>
    </div>
  `,
  imports: [
    CngxActionButton,
    CngxSplitButton,
    CngxIconMenuButton,
    CngxMenu,
    CngxMenuItem,
    CngxPopover,
  ],
})
class SplitMainHost {
  release: () => void = () => undefined;
  readonly publish = (): Promise<void> => new Promise<void>((resolve) => (this.release = resolve));
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
    <button
      cngxActionButton
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
    <button
      cngxActionButton
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
  template: ` <button cngxActionButton [action]="action" #ab="cngxActionButton">Go</button> `,
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
      vi.useFakeTimers();
      const d = deferred();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
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
      vi.useFakeTimers();
      const d = deferred();
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
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
      vi.useFakeTimers();
      const d = deferred();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.componentInstance.actionImpl = () => d.promise;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      btn.click();
      flush(fixture);
      expect(btn.classList.contains('cngx-async--pending')).toBe(false);
      await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
      flush(fixture);
      expect(btn.classList.contains('cngx-async--pending')).toBe(true);
      d.resolve();
      await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.minDwell);
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
      vi.useFakeTimers();
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
      await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
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
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(ExternalStateHost);
      fixture.componentInstance.mock.status.set('pending');
      flush(fixture);
      vi.advanceTimersByTime(CNGX_LOADING_DEFAULTS.showDelay);
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

    it('renders data-pending from the brain for an external run, and clears it after', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      const brain = fixture.debugElement.query(By.css('button')).injector.get(CngxButtonBrain);
      expect(btn.hasAttribute('data-pending')).toBe(false);

      fixture.componentInstance.mock.status.set('pending');
      flush(fixture);
      expect(btn.getAttribute('data-pending')).toBe('true');
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      expect(brain.busy()).toBe(true);
      expect(brain.blocked()).toBe(true);

      fixture.componentInstance.mock.status.set('success');
      flush(fixture);
      expect(btn.hasAttribute('data-pending')).toBe(false);
      expect(btn.hasAttribute('aria-disabled')).toBe(false);
    });

    it('gates data-busy and the pending label of an external run behind the show delay', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(ExternalStateHost);
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      fixture.componentInstance.mock.status.set('pending');
      flush(fixture);
      expect(activeText(btn)).toBe('Idle');
      expect(btn.getAttribute('data-status')).toBe('pending');
      expect(btn.getAttribute('data-pending')).toBe('true');
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.hasAttribute('data-busy')).toBe(false);

      vi.advanceTimersByTime(CNGX_LOADING_DEFAULTS.showDelay);
      flush(fixture);
      expect(activeText(btn)).toBe('Ext pending');
      expect(btn.getAttribute('data-busy')).toBe('true');
      expect(btn.querySelector('.cngx-button__busy')).toBeNull();
    });

    it('goes idle -> result without a pending label for a run faster than the show delay', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(ExternalStateHost);
      flush(fixture);
      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      fixture.componentInstance.mock.status.set('pending');
      flush(fixture);
      vi.advanceTimersByTime(CNGX_LOADING_DEFAULTS.showDelay - 1);
      flush(fixture);
      expect(activeText(btn)).toBe('Idle');

      fixture.componentInstance.mock.status.set('success');
      flush(fixture);
      expect(activeText(btn)).toBe('Ext done');
      vi.advanceTimersByTime(CNGX_LOADING_DEFAULTS.minDwell);
      flush(fixture);
      expect(activeText(btn)).toBe('Ext done');
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

    // External state is state: it is spoken on an observed edge, so each
    // case mounts idle first.
    it('announces an external success in the live region', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      flush(fixture);
      fixture.componentInstance.mock.status.set('success');
      flush(fixture);
      // The region is written after the render that follows the edge.
      fixture.detectChanges();
      const live = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
      expect(live.textContent?.trim()).toBe('Ext done');
    });

    it('announces an external failure in the live region', () => {
      const fixture = TestBed.createComponent(ExternalStateHost);
      flush(fixture);
      fixture.componentInstance.mock.status.set('error');
      flush(fixture);
      fixture.detectChanges();
      const live = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
      expect(live.textContent?.trim()).toBe('Ext error');
    });
  });

  describe('slots and composition', () => {
    it('projects cngxButtonStart and cngxButtonEnd around the label cells', () => {
      const fixture = TestBed.createComponent(SlotHost);
      flush(fixture);
      const [btn, plain] = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
      ) as HTMLButtonElement[];
      const labels = btn.querySelector('.cngx-action-button__labels') as HTMLElement;
      const start = btn.querySelector('.start-glyph') as HTMLElement;
      const end = btn.querySelector('.end-glyph') as HTMLElement;
      expect(start.parentElement).toBe(btn);
      expect(end.parentElement).toBe(btn);
      expect(labels.contains(start)).toBe(false);
      expect(start.compareDocumentPosition(labels) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(end.compareDocumentPosition(labels) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
      expect(btn.hasAttribute('data-start')).toBe(true);
      expect(btn.hasAttribute('data-end')).toBe(true);
      expect(plain.hasAttribute('data-start')).toBe(false);
      expect(plain.hasAttribute('data-end')).toBe(false);
    });

    it('publishes CNGX_BUTTON_STATE through the brain', () => {
      const fixture = TestBed.createComponent(SlotHost);
      flush(fixture);
      const de = fixture.debugElement.query(By.css('#plain'));
      expect(de.injector.get(CNGX_BUTTON_STATE)).toBe(de.injector.get(CngxButtonBrain));
    });

    it('works as a split-button main: no CNGX1073, the caret blocks while it runs', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fixture = TestBed.createComponent(SplitMainHost);
      flush(fixture);
      await fixture.whenStable();
      expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1073'))).toEqual([]);
      warn.mockRestore();

      const root = fixture.nativeElement as HTMLElement;
      const main = root.querySelector('#main') as HTMLButtonElement;
      const caret = root.querySelector('#caret') as HTMLButtonElement;
      expect(caret.hasAttribute('aria-disabled')).toBe(false);
      main.click();
      flush(fixture);
      expect(caret.getAttribute('aria-disabled')).toBe('true');

      fixture.componentInstance.release();
      await fixture.whenStable();
      flush(fixture);
      expect(caret.hasAttribute('aria-disabled')).toBe(false);
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
      expect(calls[0][0]).toMatch(
        /^CNGX3008: \[cngxActionButton\] \[toastSuccess\]\/\[toastError\] inputs/,
      );
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

    // A render pass first: the region is written after the render that
    // follows the settle.
    const liveText = (fixture: ReturnType<typeof TestBed.createComponent>): string => {
      fixture.detectChanges();
      return (
        fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement
      ).textContent!.trim();
    };

    it('announces the EN default without labels or a translation', () => {
      const fixture = TestBed.createComponent(UnlabelledExternalHost);
      flush(fixture);
      fixture.componentInstance.mock.status.set('success');
      flush(fixture);
      expect(liveText(fixture)).toBe('Action succeeded');
    });

    it('keeps a shown announcement on a copy flip and speaks the new language next', () => {
      const fixture = TestBed.createComponent(UnlabelledExternalHost);
      flush(fixture);
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
      flush(fixture);
      fixture.componentInstance.mock.status.set('error');
      flush(fixture);
      expect(liveText(fixture)).toBe('Fehlgeschlagen');
    });
  });
});

// ── Settle lifecycle (H1 / C2 / I6 / A3 / F2) ──────────────────────────

interface SettleModel {
  readonly toastSuccess: ReturnType<typeof signal<string | undefined>>;
  readonly toastError: ReturnType<typeof signal<string | undefined>>;
  readonly events: CngxAsyncSettle[];
  actionImpl: () => Promise<void>;
}

@Component({
  template: `
    <button
      cngxActionButton
      [action]="action"
      [toastSuccess]="toastSuccess()"
      [toastError]="toastError()"
      (settled)="events.push($event)"
    >
      Save
    </button>
  `,
  imports: [CngxActionButton],
})
class SettleHost implements SettleModel {
  readonly toastSuccess = signal<string | undefined>(undefined);
  readonly toastError = signal<string | undefined>(undefined);
  readonly events: CngxAsyncSettle[] = [];
  actionImpl: () => Promise<void> = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

@Component({
  template: `
    <button
      cngxActionButton
      [action]="action"
      [toastSuccess]="toastSuccess()"
      [toastError]="toastError()"
      [autoAnnounce]="true"
      (settled)="events.push($event)"
    >
      Save
    </button>
  `,
  imports: [CngxActionButton],
})
class SettleSpeakHost implements SettleModel {
  readonly toastSuccess = signal<string | undefined>(undefined);
  readonly toastError = signal<string | undefined>(undefined);
  readonly events: CngxAsyncSettle[] = [];
  actionImpl: () => Promise<void> = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

@Component({
  template: `
    <button
      cngxActionButton
      [action]="action"
      [toastSuccess]="toastSuccess()"
      [toastError]="toastError()"
      [autoAnnounce]="announce()"
      (settled)="events.push($event)"
    >
      Save
    </button>
  `,
  imports: [CngxActionButton],
})
class SettleSilentHost implements SettleModel {
  readonly announce = signal<boolean | undefined>(false);
  readonly toastSuccess = signal<string | undefined>(undefined);
  readonly toastError = signal<string | undefined>(undefined);
  readonly events: CngxAsyncSettle[] = [];
  actionImpl: () => Promise<void> = () => Promise.resolve();
  readonly action = () => this.actionImpl();
}

@Component({
  template: `
    <button cngxActionButton [action]="action" failedLabel="Failed">
      Save
      <ng-template cngxFailed> <span aria-hidden="true">!</span> Permission denied </ng-template>
    </button>
  `,
  imports: [CngxActionButton, CngxFailed],
})
class FailedTemplateTextHost {
  readonly action = () => Promise.reject(new Error('403'));
}

@Component({
  template: `
    <button cngxActionButton [action]="action" [externalState]="ext()" #ab="cngxActionButton">
      Save
    </button>
  `,
  imports: [CngxActionButton],
})
class LastUpdatedHost {
  readonly stamp = signal<Date | undefined>(undefined);
  readonly external = buildAsyncStateView<unknown>({
    status: signal<AsyncStatus>('idle').asReadonly(),
    data: signal(undefined).asReadonly(),
    error: signal<unknown>(undefined).asReadonly(),
    lastUpdated: this.stamp.asReadonly(),
  });
  readonly ext = signal<CngxAsyncState<unknown> | undefined>(this.external);
  readonly action = () => Promise.resolve();
}

describe('CngxActionButton host state', () => {
  it('publishes hostState and hostInteraction through the brain tokens', () => {
    const fixture = TestBed.createComponent(UnlabelledExternalHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxActionButton));
    const button = de.injector.get(CngxActionButton);
    const el = de.nativeElement as HTMLElement;
    expect(de.injector.get(CNGX_BUTTON_HOST_STATE)).toBe(button.hostState);
    expect(de.injector.get(CNGX_HOST_INTERACTION_STATE)).toBe(button.hostInteraction);

    fixture.componentInstance.mock.status.set('pending');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(button.hostState.refusing()).toBe(true);
    expect(button.hostInteraction.disabled()).toBe(true);
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });
});

describe('CngxActionButton settle lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setup(
    configure?: (host: SettleModel) => void,
    toaster = true,
    hostType: new () => SettleModel = SettleHost,
  ) {
    const show = vi.fn();
    if (toaster) {
      TestBed.configureTestingModule({ providers: [{ provide: CngxToaster, useValue: { show } }] });
    }
    const fixture = TestBed.createComponent(hostType);
    configure?.(fixture.componentInstance);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const btn = root.querySelector('button') as HTMLButtonElement;
    const region = (): HTMLElement | null => root.querySelector('[aria-live="polite"]');
    const run = async (outcome: 'success' | 'error'): Promise<void> => {
      fixture.componentInstance.actionImpl = () =>
        outcome === 'success' ? Promise.resolve() : Promise.reject(new Error('nope'));
      btn.click();
      await vi.waitFor(() => expect(fixture.componentInstance.events.length).toBeGreaterThan(0));
      fixture.componentInstance.events.length = 0;
      flush(fixture);
      fixture.detectChanges();
    };
    return { fixture, host: fixture.componentInstance, btn, region, run, show };
  }

  it('keeps the region silent under a bound [autoAnnounce] false', async () => {
    const { region, run } = setup(undefined, true, SettleSilentHost);
    expect(region()).not.toBeNull();
    await run('success');
    expect(region()!.textContent).toBe('');
    await run('error');
    expect(region()!.textContent).toBe('');
  });

  it('applies the toast rule when a bound [autoAnnounce] signal turns undefined', async () => {
    const { fixture, region, run } = setup(
      (h) => h.toastError.set('Save failed'),
      true,
      SettleSilentHost,
    );
    (fixture.componentInstance as SettleSilentHost).announce.set(undefined);
    flush(fixture);
    await run('success');
    expect(region()!.textContent).toBe('Action succeeded');
    await run('error');
    expect(region()!.textContent).toBe('');
  });

  it('does not speak an outcome a shown toast covers', async () => {
    const { region, run, show } = setup((h) => {
      h.toastSuccess.set('Saved');
      h.toastError.set('Save failed');
    });
    await run('success');
    expect(region()!.textContent).toBe('');
    await run('error');
    expect(region()!.textContent).toBe('');
    expect(show).toHaveBeenCalledTimes(2);
  });

  it('still speaks a success when only toastError is set', async () => {
    const { region, run } = setup((h) => h.toastError.set('Save failed'));
    await run('success');
    expect(region()!.textContent).toBe('Action succeeded');
    await run('error');
    expect(region()!.textContent).toBe('');
  });

  it('speaks next to the toast with [autoAnnounce]="true"', async () => {
    const { region, run, show } = setup(
      (h) => h.toastError.set('Save failed'),
      true,
      SettleSpeakHost,
    );
    await run('error');
    expect(region()!.textContent).toBe('Action failed');
    expect(show).toHaveBeenCalledTimes(1);
  });

  it('speaks a toast-covered outcome when no toaster is provided', async () => {
    const { region, run } = setup((h) => h.toastError.set('Save failed'), false);
    await run('error');
    expect(region()!.textContent).toBe('Action failed');
  });

  it('re-exports (settled) with the generation of each run', async () => {
    const { btn, host } = setup();
    const seen: number[] = [];
    host.actionImpl = () => Promise.resolve();
    btn.click();
    await vi.waitFor(() => expect(host.events).toHaveLength(1));
    seen.push(host.events[0].generation);
    btn.click();
    await vi.waitFor(() => expect(host.events).toHaveLength(2));
    seen.push(host.events[1].generation);
    expect(seen).toEqual([1, 2]);
    expect(host.events[1].status).toBe('success');
  });

  it('speaks the rendered cngxFailed text, aria-hidden glyph excluded, over failedLabel', async () => {
    const fixture = TestBed.createComponent(FailedTemplateTextHost);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('button')!.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect((root.querySelector('[aria-live="polite"]') as HTMLElement).textContent).toBe(
        'Permission denied',
      );
    });
  });

  it('lastUpdated follows [externalState] without falling through to own runs', async () => {
    const fixture = TestBed.createComponent(LastUpdatedHost);
    flush(fixture);
    const host = fixture.componentInstance;
    const ab = fixture.debugElement.children[0].references['ab'] as CngxActionButton;
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(
        fixture.debugElement.children[0].injector.get(CNGX_ASYNC_RUN_STATE).state.status(),
      ).toBe('success');
    });
    expect(ab.state.lastUpdated()).toBeUndefined();

    const stamp = new Date(2026, 0, 1);
    host.stamp.set(stamp);
    expect(ab.state.lastUpdated()).toBe(stamp);

    host.ext.set(undefined);
    flush(fixture);
    expect(ab.state.lastUpdated()).toBeInstanceOf(Date);
    expect(ab.state.lastUpdated()).not.toBe(stamp);
  });

  it('destroyed mid-run: no toast, no region write, no settle, no error', async () => {
    const errors = vi.spyOn(console, 'error');
    const pending = deferred();
    const { fixture, host, btn, region, show } = setup(
      (h) => h.toastError.set('Save failed'),
      true,
      SettleSpeakHost,
    );
    host.actionImpl = () => pending.promise;
    btn.click();
    flush(fixture);
    const live = region()!;
    fixture.destroy();

    pending.reject(new Error('late'));
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(show).not.toHaveBeenCalled();
    expect(host.events).toHaveLength(0);
    expect(live.textContent).toBe('');
    expect(errors).not.toHaveBeenCalled();
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
