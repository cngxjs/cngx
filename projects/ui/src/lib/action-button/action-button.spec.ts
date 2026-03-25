import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CngxActionButton } from './action-button';
import { CngxFailed, CngxPending, CngxSucceeded } from './action-button-status';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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
      expect(btn.classList.contains('cngx-async--succeeded')).toBe(true);
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
});
