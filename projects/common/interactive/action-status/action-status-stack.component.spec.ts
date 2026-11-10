import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxAsyncClick } from '../async-click/async-click.directive';
import {
  CNGX_HOST_INTERACTION_STATE,
  type CngxHostInteractionState,
} from '../async-click/host-interaction-state.token';
import { CngxFailed, CngxSucceeded } from '../async-click/async-status-templates';
import { CngxActionStatusBrain } from './action-status-brain.directive';
import { CngxActionStatusStack } from './action-status-stack.component';
import { CNGX_ACTION_STATUS } from './action-status.token';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testStackHost]',
  imports: [CngxActionStatusStack],
  hostDirectives: [
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    {
      directive: CngxActionStatusBrain,
      inputs: ['pendingLabel', 'succeededLabel', 'failedLabel'],
    },
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
  template: `<span class="labels" cngxActionStatusStack [cellClass]="cellClass()"
    ><ng-content
  /></span>`,
})
class TestStackHost {
  readonly cellClass = signal<string | undefined>('my-cell');
}

@Component({
  imports: [TestStackHost, CngxSucceeded, CngxFailed],
  template: `
    <button testStackHost [action]="action" pendingLabel="Saving" failedLabel="Failed">
      Save
      @if (withTemplates) {
        <ng-template cngxSucceeded>Saved tpl</ng-template>
        <ng-template cngxFailed let-err>Err: {{ err }}</ng-template>
      }
    </button>
  `,
})
class Wrapper {
  withTemplates = false;
  outcome: 'success' | 'error' = 'success';
  readonly action = (): Promise<void> =>
    this.outcome === 'success' ? Promise.resolve() : Promise.reject('boom');
}

function setup(withTemplates = false) {
  const fixture = TestBed.createComponent(Wrapper);
  fixture.componentInstance.withTemplates = withTemplates;
  const render = (): void => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  render();
  const root = fixture.nativeElement as HTMLElement;
  const labels = root.querySelector('.labels') as HTMLElement;
  const cells = (): HTMLElement[] => Array.from(labels.children) as HTMLElement[];
  const cell = (kind: string): HTMLElement | undefined =>
    cells().find((c) => c.getAttribute('cngxActionStatusCell') === kind);
  const active = (): string =>
    cells()
      .find((c) => c.hasAttribute('data-active'))
      ?.textContent?.trim() ?? '';
  return { fixture, root, labels, cells, cell, active, render };
}

describe('CngxActionStatusStack', () => {
  it('renders the cells as direct children of its own element, no wrapper', () => {
    const { labels, cells } = setup();
    expect(labels.classList).toContain('labels');
    expect(cells().map((c) => c.getAttribute('cngxActionStatusCell'))).toEqual([
      'idle',
      'pending',
      'error',
    ]);
  });

  it('projects the host content into the idle cell, the active one at rest', () => {
    const { cell, active } = setup();
    expect(cell('idle')?.textContent?.trim()).toBe('Save');
    expect(active()).toBe('Save');
  });

  it('puts the cell class and the cell hook on every cell', () => {
    const { cells } = setup();
    for (const c of cells()) {
      expect(c.classList).toContain('my-cell');
      expect(c.classList).toContain('cngx-action-status-cell');
    }
  });

  it('adds no class beyond the cell hook without a cellClass', () => {
    const { fixture, cells, render } = setup();
    (fixture.debugElement.children[0].componentInstance as TestStackHost).cellClass.set(undefined);
    render();
    for (const c of cells()) {
      expect(c.className).toBe('cngx-action-status-cell');
    }
  });

  it('renders the label fallbacks', () => {
    const { cell } = setup();
    expect(cell('pending')?.textContent?.trim()).toBe('Saving');
    expect(cell('error')?.textContent?.trim()).toBe('Failed');
  });

  it('renders the cngxSucceeded template in the success cell', async () => {
    const { root, active, render } = setup(true);
    (root.querySelector('button') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      render();
      expect(active()).toBe('Saved tpl');
    });
  });

  it('hands the error to the cngxFailed template as $implicit', async () => {
    const { fixture, root, active, render } = setup(true);
    fixture.componentInstance.outcome = 'error';
    (root.querySelector('button') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      render();
      expect(active()).toBe('Err: boom');
    });
  });
});
