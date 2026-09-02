import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxToast } from './toast.component';
import { CngxToastOutlet } from './toast-outlet';
import { provideToasts, CngxToaster } from './toast.service';

@Component({
  selector: 'test-toast-message',
  template: `<cngx-toast [when]="show()" message="Saved" severity="success" />`,
  imports: [CngxToast],
})
class MessageHost {
  readonly show = signal(false);
}

@Component({
  selector: 'test-toast-projected',
  template: `
    <cngx-toast [when]="show()" message="Fallback">
      Something went <strong>wrong</strong>.
    </cngx-toast>
    <cngx-toast-outlet />
  `,
  imports: [CngxToast, CngxToastOutlet],
})
class ProjectedHost {
  readonly show = signal(false);
}

@Component({
  selector: 'test-toast-empty-projection',
  template: `<cngx-toast [when]="show()" message="Plain message" /><cngx-toast-outlet />`,
  imports: [CngxToast, CngxToastOutlet],
})
class EmptyProjectionHost {
  readonly show = signal(false);
}

function setup<T>(host: new () => T) {
  TestBed.configureTestingModule({
    imports: [host],
    providers: [provideToasts()],
  });
  const toaster = TestBed.inject(CngxToaster);
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return { toaster, fixture };
}

describe('CngxToast', () => {
  it('shows nothing while [when] is false', () => {
    const { toaster } = setup(MessageHost);
    expect(toaster.toasts().length).toBe(0);
  });

  it('shows a toast on the rising edge of [when]', () => {
    const { toaster, fixture } = setup(MessageHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(toaster.toasts().length).toBe(1);
    expect(toaster.toasts()[0].config.message).toBe('Saved');
    expect(toaster.toasts()[0].config.severity).toBe('success');
  });

  it('does not re-show while [when] stays true', () => {
    const { toaster, fixture } = setup(MessageHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(toaster.toasts().length).toBe(1);
  });

  it('dismisses the toast on the falling edge of [when]', () => {
    const { toaster, fixture } = setup(MessageHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(toaster.toasts().length).toBe(1);

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    expect(toaster.toasts().length).toBe(0);
  });

  it('falling edge after auto-dismiss is a no-op', () => {
    vi.useFakeTimers();
    const { toaster, fixture } = setup(MessageHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);
    expect(toaster.toasts().length).toBe(0);

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    expect(toaster.toasts().length).toBe(0);
  });

  it('re-arms after a full show/hide cycle', () => {
    const { toaster, fixture } = setup(MessageHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(toaster.toasts().length).toBe(1);
  });

  it('emits dismissed when the toast auto-dismisses while [when] stays true', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [MessageHost], providers: [provideToasts()] });
    const fixture = TestBed.createComponent(MessageHost);
    fixture.detectChanges();
    const toast = fixture.debugElement.children[0].componentInstance as CngxToast;
    let emitted = 0;
    toast.dismissed.subscribe(() => emitted++);

    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);
    expect(emitted).toBe(1);
  });

  it('dismisses the active toast on destroy', () => {
    const { toaster, fixture } = setup(MessageHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(toaster.toasts().length).toBe(1);
    fixture.destroy();
    expect(toaster.toasts().length).toBe(0);
  });

  // ── Projected content ────────────────────────────────────

  it('captures projected content and renders it in the outlet', () => {
    const { toaster, fixture } = setup(ProjectedHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();

    expect(toaster.toasts()[0].config.contentTemplate).toBeDefined();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.cngx-toast__body')?.textContent).toContain('Something went');
    expect(el.querySelector('.cngx-toast__body strong')?.textContent).toBe('wrong');
    // message is ignored when content is projected
    expect(el.querySelector('.cngx-toast__message')).toBeNull();
  });

  it('renders projected content again after a hide/show cycle', () => {
    const { fixture } = setup(ProjectedHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.cngx-toast__body')?.textContent).toContain('Something went');
  });

  it('does not dedup two toasts with equal text but distinct content templates', () => {
    @Component({
      selector: 'test-toast-twins',
      template: `
        <cngx-toast [when]="show()" message="Same"><em>First body</em></cngx-toast>
        <cngx-toast [when]="show()" message="Same"><em>Second body</em></cngx-toast>
        <cngx-toast-outlet />
      `,
      imports: [CngxToast, CngxToastOutlet],
    })
    class TwinsHost {
      readonly show = signal(false);
    }

    const { toaster, fixture } = setup(TwinsHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();

    expect(toaster.toasts().length).toBe(2);
  });

  it('falls back to message when nothing is projected', () => {
    const { toaster, fixture } = setup(EmptyProjectionHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();

    expect(toaster.toasts()[0].config.contentTemplate).toBeUndefined();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.cngx-toast__message')?.textContent?.trim()).toBe('Plain message');
  });

  it('renders nothing at the host position', () => {
    const { fixture } = setup(ProjectedHost);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement.querySelector('cngx-toast');
    expect(host.textContent?.trim()).toBe('');
  });

  it('throws without a CngxToaster provider', () => {
    TestBed.configureTestingModule({ imports: [MessageHost] });
    expect(() => TestBed.createComponent(MessageHost)).toThrowError(/withToasts/);
  });
});
