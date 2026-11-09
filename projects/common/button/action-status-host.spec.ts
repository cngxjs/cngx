import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxActionStatusBrain, CngxAsyncClick } from '@cngx/common/interactive';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

import { provideActionStatusHost } from './action-status-host';
import { CngxButtonBrain } from './button-brain.directive';
import { provideButtonHost } from './button-host.token';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testStatusHost]',
  hostDirectives: [
    CngxButtonBrain,
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    { directive: CngxActionStatusBrain, inputs: ['succeededLabel', 'externalState'] },
  ],
  providers: [
    provideButtonHost('testStatusHost', { defaultVariant: 'solid' }),
    provideActionStatusHost(),
  ],
  template: `<ng-content />`,
})
class TestStatusHost {}

@Component({
  imports: [TestStatusHost],
  template: `
    <button testStatusHost [action]="action" succeededLabel="Saved" [externalState]="ext()">
      Save
    </button>
  `,
})
class Host {
  readonly action = (): Promise<void> => Promise.resolve();
  readonly ext = signal<CngxAsyncState<unknown> | undefined>(undefined);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  const render = (): void => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  render();
  const root = fixture.nativeElement as HTMLElement;
  const btn = root.querySelector('button') as HTMLButtonElement;
  const region = (): string => root.querySelector('[aria-live="polite"]')?.textContent ?? '';
  return { fixture, btn, region, render };
}

describe('provideActionStatusHost', () => {
  it('lets the runner region speak what the status brain resolves', async () => {
    const { btn, region, render } = setup();
    btn.click();
    await vi.waitFor(() => {
      render();
      expect(region()).toBe('Saved');
    });
  });

  it('refuses clicks and reads as busy while a bound external state is pending', () => {
    const status = signal<AsyncStatus>('idle');
    const { fixture, btn, render } = setup();
    fixture.componentInstance.ext.set(
      buildAsyncStateView<unknown>({
        status: status.asReadonly(),
        data: computed(() => undefined),
        error: computed(() => undefined),
        lastUpdated: computed(() => undefined),
      }),
    );
    render();
    status.set('pending');
    render();
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });
});
