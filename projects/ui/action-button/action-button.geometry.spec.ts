import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildAsyncStateView, type AsyncStatus } from '@cngx/core/utils';
import { afterEach, describe, expect, it } from 'vitest';

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
