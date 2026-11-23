import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxActionStatusCell } from './action-status-cell.directive';
import {
  CNGX_ACTION_STATUS,
  type CngxActionStatus,
  type CngxActionStatusCellKind,
} from './action-status.token';

function stubStatus(): {
  status: CngxActionStatus;
  activeCell: ReturnType<typeof signal<CngxActionStatusCellKind>>;
  registerCell: ReturnType<typeof vi.fn>;
  unregisterCell: ReturnType<typeof vi.fn>;
} {
  const activeCell = signal<CngxActionStatusCellKind>('idle');
  const registerCell = vi.fn();
  const unregisterCell = vi.fn();
  const status = {
    activeCell: activeCell.asReadonly(),
    registerCell,
    unregisterCell,
  } as unknown as CngxActionStatus;
  return { status, activeCell, registerCell, unregisterCell };
}

@Component({
  standalone: true,
  imports: [CngxActionStatusCell],
  template: `
    <span class="idle" cngxActionStatusCell="idle">Save</span>
    <span class="pending" cngxActionStatusCell="pending">Saving</span>
    <span class="success" cngxActionStatusCell="success">Saved</span>
    <span class="error" cngxActionStatusCell="error">Failed</span>
  `,
})
class AllCells {}

@Component({
  standalone: true,
  imports: [CngxActionStatusCell],
  template: `<span class="cell" [cngxActionStatusCell]="kind()">Label</span>`,
})
class BoundCell {
  readonly kind = signal<CngxActionStatusCellKind>('success');
}

function setup<T>(host: new () => T): {
  fixture: ReturnType<typeof TestBed.createComponent<T>>;
  stub: ReturnType<typeof stubStatus>;
  cell: (name: string) => HTMLElement;
} {
  const stub = stubStatus();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: CNGX_ACTION_STATUS, useValue: stub.status },
    ],
  });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const root = fixture.nativeElement as HTMLElement;
  const cell = (name: string): HTMLElement => root.querySelector<HTMLElement>(`.${name}`)!;
  return { fixture, stub, cell };
}

describe('CngxActionStatusCell', () => {
  it('carries the cell class on every host', () => {
    const { cell } = setup(AllCells);
    for (const name of ['idle', 'pending', 'success', 'error']) {
      expect(cell(name).classList.contains('cngx-action-status-cell'), name).toBe(true);
    }
  });

  it('marks only the active cell and hides the others from AT', () => {
    const { fixture, stub, cell } = setup(AllCells);
    for (const active of ['idle', 'pending', 'success', 'error'] as const) {
      stub.activeCell.set(active);
      fixture.detectChanges();
      for (const name of ['idle', 'pending', 'success', 'error']) {
        const el = cell(name);
        if (name === active) {
          expect(el.getAttribute('data-active'), `${active}: ${name}`).toBe('');
          expect(el.hasAttribute('aria-hidden'), `${active}: ${name}`).toBe(false);
        } else {
          expect(el.hasAttribute('data-active'), `${active}: ${name}`).toBe(false);
          expect(el.getAttribute('aria-hidden'), `${active}: ${name}`).toBe('true');
        }
      }
    }
  });

  it('registers the success and error cells, not idle and pending', () => {
    const { stub, cell } = setup(AllCells);
    expect(stub.registerCell).toHaveBeenCalledTimes(2);
    expect(stub.registerCell).toHaveBeenCalledWith('success', cell('success'));
    expect(stub.registerCell).toHaveBeenCalledWith('error', cell('error'));
    expect(stub.unregisterCell).not.toHaveBeenCalled();
  });

  it('unregisters its element on destroy', () => {
    const { fixture, stub, cell } = setup(AllCells);
    const success = cell('success');
    const error = cell('error');
    fixture.destroy();
    expect(stub.unregisterCell).toHaveBeenCalledTimes(2);
    expect(stub.unregisterCell).toHaveBeenCalledWith('success', success);
    expect(stub.unregisterCell).toHaveBeenCalledWith('error', error);
  });

  it('registers a bound result kind once', () => {
    const { stub, cell } = setup(BoundCell);
    expect(stub.registerCell).toHaveBeenCalledTimes(1);
    expect(stub.registerCell).toHaveBeenCalledWith('success', cell('cell'));
  });
});
