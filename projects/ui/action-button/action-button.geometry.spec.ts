import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildAsyncStateView, type AsyncStatus } from '@cngx/core/utils';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxActionButton } from './action-button';

// Runs in a real Chromium (the `test-geometry` target). The status labels sit
// stacked in one grid cell, so the button is as wide as its widest label in
// every status and never jumps after a run. jsdom has no layout.

const STATUSES: readonly AsyncStatus[] = ['idle', 'pending', 'success', 'error'];

@Component({
  selector: 'cngx-action-button-geometry-host',
  standalone: true,
  imports: [CngxActionButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="display: flex; align-items: flex-start">
      <button
        cngxActionButton
        class="labels"
        [action]="action"
        [externalState]="state"
        pendingLabel="Saving the draft..."
        succeededLabel="Saved"
        failedLabel="Could not save, retry"
      >
        Save
      </button>
    </div>
    <div style="display: flex; align-items: flex-start">
      <button cngxActionButton class="bare" [action]="action" [externalState]="state">
        Save draft
      </button>
    </div>
  `,
})
class GeometryHost {
  readonly status = signal<AsyncStatus>('idle');
  readonly state = buildAsyncStateView<unknown>({
    status: this.status.asReadonly(),
    data: signal(undefined).asReadonly(),
    error: signal<unknown>(undefined).asReadonly(),
  });
  readonly action = () => Promise.resolve();
}

// The button family owns the paint of its own states: cngx-async.css skips a
// `.cngx-button` host, so a real run keeps the variant paint and shows the
// button busy treatment while pending. A twin without a run is the reference.
@Component({
  selector: 'cngx-action-button-async-paint-host',
  standalone: true,
  imports: [CngxActionButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../common/theming/components/cngx-async.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <p class="solid">
      <button cngxActionButton class="ref" [action]="hang">Save</button>
      <button cngxActionButton class="ok" [action]="succeed" [feedbackDuration]="60000">
        Save
      </button>
      <button cngxActionButton class="fail" [action]="fail" [feedbackDuration]="60000">Save</button>
      <button cngxActionButton class="busy" [action]="hang">Save</button>
    </p>
    <p class="outline-danger">
      <button cngxActionButton="outline" tone="danger" class="ref" [action]="hang">Save</button>
      <button
        cngxActionButton="outline"
        tone="danger"
        class="ok"
        [action]="succeed"
        [feedbackDuration]="60000"
      >
        Save
      </button>
      <button
        cngxActionButton="outline"
        tone="danger"
        class="fail"
        [action]="fail"
        [feedbackDuration]="60000"
      >
        Save
      </button>
      <button cngxActionButton="outline" tone="danger" class="busy" [action]="hang">Save</button>
    </p>
  `,
})
class AsyncPaintHost {
  readonly succeed = () => Promise.resolve();
  readonly fail = () => Promise.reject(new Error('nope'));
  readonly hang = () => new Promise<void>(() => undefined);
}

let mountedRoot: HTMLElement | null = null;

function mount() {
  const fixture = TestBed.createComponent(GeometryHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  return fixture;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxActionButton geometry', () => {
  it('keeps one width across idle, pending, success and error', () => {
    const fixture = mount();
    const btn = query(mountedRoot!, '.labels');
    const widths: number[] = [];
    for (const status of STATUSES) {
      fixture.componentInstance.status.set(status);
      fixture.detectChanges();
      TestBed.flushEffects();
      widths.push(btn.getBoundingClientRect().width);
    }
    expect(new Set(widths).size).toBe(1);
  });

  it('is as wide as its widest label', () => {
    const fixture = mount();
    const btn = query(mountedRoot!, '.labels');
    const cells = Array.from(btn.querySelectorAll<HTMLElement>('.cngx-action-button__label'));
    expect(cells.length).toBe(4);
    const widest = Math.max(...cells.map((c) => c.getBoundingClientRect().width));
    const labels = query(btn, '.cngx-action-button__labels');
    expect(labels.getBoundingClientRect().width).toBeCloseTo(widest, 0);
    fixture.componentInstance.status.set('error');
    fixture.detectChanges();
    expect(labels.getBoundingClientRect().width).toBeCloseTo(widest, 0);
  });

  it('shows only the active label; the others keep their box but stay invisible', () => {
    const fixture = mount();
    const btn = query(mountedRoot!, '.labels');
    fixture.componentInstance.status.set('pending');
    fixture.detectChanges();
    TestBed.flushEffects();
    const visible = Array.from(
      btn.querySelectorAll<HTMLElement>('.cngx-action-button__label'),
    ).filter((c) => getComputedStyle(c).visibility === 'visible');
    expect(visible.map((c) => c.textContent?.trim())).toEqual(['Saving the draft...']);
    expect(btn.querySelector('.cngx-button__busy')).toBeNull();
  });

  it('keeps the idle label under the spinner without a pending label', () => {
    const fixture = mount();
    const btn = query(mountedRoot!, '.bare');
    const idleWidth = btn.getBoundingClientRect().width;
    fixture.componentInstance.status.set('pending');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(btn.querySelector('.cngx-button__busy')).not.toBeNull();
    expect(getComputedStyle(query(btn, '.cngx-action-button__labels')).visibility).toBe('hidden');
    expect(btn.getBoundingClientRect().width).toBe(idleWidth);
  });
});

function mountAsyncPaint(): void {
  const fixture = TestBed.createComponent(AsyncPaintHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
}

const PAINT = ['background-color', 'color', 'border-top-color'] as const;

function paintOf(el: HTMLElement): Record<string, string> {
  return Object.fromEntries(PAINT.map((p) => [p, computedValue(el, p)]));
}

async function run(el: HTMLElement, stateClass: string): Promise<HTMLElement> {
  el.click();
  await vi.waitFor(() => {
    TestBed.tick();
    expect(el.classList.contains(stateClass)).toBe(true);
  });
  await Promise.all(el.getAnimations().map((a) => a.finished));
  return el;
}

describe.each(['solid', 'outline-danger'])('CngxActionButton async paint, %s', (variant) => {
  const at = (selector: string): HTMLElement => query(mountedRoot!, `.${variant} ${selector}`);

  it('keeps the variant paint after a successful run', async () => {
    mountAsyncPaint();
    const el = await run(at('.ok'), 'cngx-async--success');
    expect(el.getAttribute('data-status')).toBe('success');
    expect(paintOf(el)).toEqual(paintOf(at('.ref')));
  });

  it('keeps the variant paint after a failed run', async () => {
    mountAsyncPaint();
    const el = await run(at('.fail'), 'cngx-async--error');
    expect(el.getAttribute('data-status')).toBe('error');
    expect(paintOf(el)).toEqual(paintOf(at('.ref')));
  });

  it('shows the button busy treatment while a run is pending', async () => {
    mountAsyncPaint();
    const el = await run(at('.busy'), 'cngx-async--pending');
    expect(el.getAttribute('data-busy')).toBe('true');
    expect(el.querySelector('.cngx-button__busy')).not.toBeNull();
    expect(computedValue(el, 'opacity')).toBe('1');
    expect(computedValue(el, 'cursor')).toBe('progress');
    expect(paintOf(el)).toEqual(paintOf(at('.ref')));
  });
});
