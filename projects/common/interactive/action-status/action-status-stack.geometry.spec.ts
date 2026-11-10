import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAsyncClick } from '../async-click/async-click.directive';
import {
  CNGX_HOST_INTERACTION_STATE,
  type CngxHostInteractionState,
} from '../async-click/host-interaction-state.token';
import { CngxActionStatusBrain } from './action-status-brain.directive';
import { CngxActionStatusStack } from './action-status-stack.component';
import { CNGX_ACTION_STATUS } from './action-status.token';

// Runs in a real Chromium (the `test-geometry` target). The stack ships its
// own one-grid-cell rule, so a host outside the button family (no
// `.cngx-button` sheet) still stacks the cells and hides the inactive ones.

let mountedRoot: HTMLElement | null = null;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testPlainStackHost]',
  imports: [CngxActionStatusStack],
  hostDirectives: [
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    { directive: CngxActionStatusBrain, inputs: ['pendingLabel', 'failedLabel'] },
  ],
  providers: [
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => {
        const status = inject(CNGX_ACTION_STATUS);
        return {
          disabled: signal(false),
          busy: status.externalBusy,
          announcement: status.announcement,
        };
      },
    },
  ],
  template: `<span class="labels" cngxActionStatusStack><ng-content /></span>`,
})
class PlainStackHost {}

@Component({
  imports: [PlainStackHost],
  template: `
    <button
      testPlainStackHost
      [action]="action"
      pendingLabel="A much longer pending label"
      failedLabel="Failed"
    >
      Go
    </button>
  `,
})
class Wrapper {
  readonly action = (): Promise<void> => Promise.resolve();
}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(Wrapper);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return mountedRoot.querySelector('.labels') as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxActionStatusStack geometry outside the button sheet', () => {
  it('stacks every cell in one grid cell, so the stack is as wide as its widest label', () => {
    const stack = mount();
    expect(computedValue(stack, 'display')).toBe('inline-grid');
    const cells = Array.from(stack.children) as HTMLElement[];
    expect(cells.length).toBe(3);
    const tops = new Set(cells.map((c) => Math.round(c.getBoundingClientRect().top)));
    expect(tops.size).toBe(1);
    const widest = Math.max(...cells.map((c) => c.getBoundingClientRect().width));
    expect(Math.round(stack.getBoundingClientRect().width)).toBe(Math.round(widest));
  });

  it('hides the inactive cells and keeps the active one visible', () => {
    const stack = mount();
    const cells = Array.from(stack.children) as HTMLElement[];
    const active = cells.filter((c) => c.hasAttribute('data-active'));
    expect(active.map((c) => c.textContent?.trim())).toEqual(['Go']);
    for (const c of cells) {
      expect(computedValue(c, 'visibility')).toBe(
        c.hasAttribute('data-active') ? 'visible' : 'hidden',
      );
    }
  });
});
