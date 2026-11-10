import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createResizeObserverMock } from '@cngx/testing';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import type { CngxRecycler } from '@cngx/common/data';
import { createSlotRegistry } from '@cngx/core/utils';

import { CNGX_SELECT_PANEL_HOST } from '../panel-host';
import { CngxSelectAutoRecycler } from './auto-recycler.directive';
import type { CngxSelectAutoRecyclerHandle } from './auto-virtualize';

const recycler = { scrollToIndex: vi.fn() } as unknown as CngxRecycler;
const handle: CngxSelectAutoRecyclerHandle = {
  needed: signal(true),
  create: vi.fn(() => recycler),
  slot: createSlotRegistry<CngxRecycler>(),
};

@Component({
  imports: [CngxActiveDescendant, CngxSelectAutoRecycler],
  providers: [{ provide: CNGX_SELECT_PANEL_HOST, useValue: { autoRecycler: handle } }],
  template: `
    <div cngxActiveDescendant [virtualCount]="1000">
      @if (mounted()) {
        <ng-container cngxSelectAutoRecycler />
      }
    </div>
  `,
})
class Host {
  readonly mounted = signal(false);
  readonly ad = viewChild.required(CngxActiveDescendant);
}

describe('CngxSelectAutoRecycler', () => {
  beforeEach(() => {
    createResizeObserverMock().install(window);
    vi.useFakeTimers();
    vi.mocked(handle.create).mockClear();
    vi.mocked(recycler.scrollToIndex).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates nothing until the template mounts it', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(handle.create).not.toHaveBeenCalled();
    expect(handle.slot.current()).toBeNull();
  });

  it('registers the recycler on mount and releases it on destroy', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mounted.set(true);
    fixture.detectChanges();
    expect(handle.create).toHaveBeenCalledTimes(1);
    expect(handle.slot.current()).toBe(recycler);

    fixture.componentInstance.mounted.set(false);
    fixture.detectChanges();
    expect(handle.slot.current()).toBeNull();
  });

  it('scrolls a pending highlight of the enclosing active descendant', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mounted.set(true);
    fixture.detectChanges();

    fixture.componentInstance.ad().highlightLast();
    TestBed.flushEffects();
    vi.advanceTimersByTime(16);

    expect(recycler.scrollToIndex).toHaveBeenCalledExactlyOnceWith(999);
  });

  it('stays inert for a host without a handle', () => {
    TestBed.overrideComponent(Host, {
      set: { providers: [{ provide: CNGX_SELECT_PANEL_HOST, useValue: {} }] },
    });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mounted.set(true);
    fixture.detectChanges();
    expect(handle.create).not.toHaveBeenCalled();
  });
});
