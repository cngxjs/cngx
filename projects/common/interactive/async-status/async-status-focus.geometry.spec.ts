import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildAsyncStateView, type AsyncStatus } from '@cngx/core/utils';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { CngxAsyncStatus } from './async-status.directive';

// Runs in a real Chromium (the `test-geometry` target): focus loss on a
// natively disabled button and the click a browser synthesises for Enter and
// Space only happen in a real engine, not in jsdom.

@Component({
  selector: 'cngx-async-status-focus-host',
  standalone: true,
  imports: [CngxAsyncStatus],
  template: `
    <button
      type="button"
      [cngxAsyncStatus]="state"
      [disableWhilePending]="true"
      (click)="count = count + 1"
    >
      Continue
    </button>
  `,
})
class FocusHost {
  readonly status = signal<AsyncStatus>('idle');
  readonly state = buildAsyncStateView<unknown>({
    status: this.status.asReadonly(),
    data: signal(undefined).asReadonly(),
    error: signal<unknown>(undefined).asReadonly(),
  });
  count = 0;
}

let mountedRoot: HTMLElement | null = null;

function mount(): {
  host: FocusHost;
  btn: HTMLButtonElement;
  set: (status: AsyncStatus) => void;
} {
  const fixture = TestBed.createComponent(FocusHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const btn = mountedRoot.querySelector('button') as HTMLButtonElement;
  const set = (status: AsyncStatus): void => {
    fixture.componentInstance.status.set(status);
    fixture.detectChanges();
  };
  return { host: fixture.componentInstance, btn, set };
}

// Chromium drops focus from a newly disabled element on the next rendering
// update, not synchronously, so a focus read waits two frames.
async function nextFrames(): Promise<void> {
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxAsyncStatus pending gate, real browser', () => {
  it('keeps focus on the host when it goes pending', async () => {
    const { btn, set } = mount();
    btn.focus();
    set('pending');
    await nextFrames();
    expect(document.activeElement).toBe(btn);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });

  it('refuses Enter, Space and pointer activation while pending', async () => {
    const { host, btn, set } = mount();
    btn.focus();
    set('pending');
    await nextFrames();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    // Playwright's actionability check treats aria-disabled as not enabled;
    // force skips the check, the pointer click is still real.
    await userEvent.click(btn, { force: true });
    expect(host.count).toBe(0);
    expect(document.activeElement).toBe(btn);
  });

  it('accepts Enter again after the state settles', async () => {
    const { host, btn, set } = mount();
    btn.focus();
    set('pending');
    await nextFrames();
    await userEvent.keyboard('{Enter}');
    set('success');
    await userEvent.keyboard('{Enter}');
    expect(host.count).toBe(1);
  });
});
