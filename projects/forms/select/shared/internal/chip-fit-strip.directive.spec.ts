import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createResizeObserverMock, type ResizeObserverMock } from '@cngx/testing';

import { CngxSelectChipFitSlot, CngxSelectChipFitStrip } from './chip-fit-strip.directive';

@Component({
  template: `
    <span class="strip" cngxSelectChipFitStrip [active]="active()">
      @for (w of widths(); track $index) {
        <span class="slot" cngxSelectChipFitSlot [attr.data-w]="w"></span>
      }
    </span>
  `,
  imports: [CngxSelectChipFitStrip, CngxSelectChipFitSlot],
})
class Host {
  readonly active = signal(true);
  readonly widths = signal<number[]>([40, 50, 60]);
  readonly strip = viewChild.required(CngxSelectChipFitStrip);
}

let stripWidth = 300;

function rect(width: number): DOMRect {
  return { width, height: 20, top: 0, left: 0, right: width, bottom: 20, x: 0, y: 0 } as DOMRect;
}

describe('CngxSelectChipFitStrip', () => {
  let mock: ResizeObserverMock;
  let instances: number;

  beforeEach(() => {
    stripWidth = 300;
    instances = 0;
    mock = createResizeObserverMock();
    mock.install(window);
    const Mocked = window.ResizeObserver;
    vi.stubGlobal(
      'ResizeObserver',
      class extends Mocked {
        constructor(cb: ResizeObserverCallback) {
          super(cb);
          instances++;
        }
      },
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('strip')) {
        return rect(stripWidth);
      }
      return rect(Number(this.getAttribute('data-w') ?? 0));
    });
  });

  afterEach(() => {
    mock.restore(window);
    vi.restoreAllMocks();
  });

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance };
  }

  function settle(fixture: { detectChanges: () => void }): void {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  }

  it('observes host and every slot with one observer instance', () => {
    render();
    expect(instances).toBe(1);
    expect(mock.observe).toHaveBeenCalledTimes(4);
  });

  it('follows a strip resize down and up', () => {
    const { host } = render();
    expect(host.strip().snapshot()?.available).toBe(300);
    stripWidth = 120;
    mock.triggerResize({});
    expect(host.strip().snapshot()?.available).toBe(120);
    stripWidth = 500;
    mock.triggerResize({});
    expect(host.strip().snapshot()?.available).toBe(500);
  });

  it('follows a slot width change', () => {
    const { fixture, host } = render();
    const slot = (fixture.nativeElement as HTMLElement).querySelectorAll('.slot')[1];
    slot.setAttribute('data-w', '90');
    mock.triggerResize({});
    expect(host.strip().snapshot()?.widths).toEqual([40, 90, 60]);
  });

  it('reads widths in DOM order after a slot is removed and re-added in the middle', () => {
    const { fixture, host } = render();
    host.widths.set([40, 60]);
    settle(fixture);
    expect(host.strip().snapshot()?.widths).toEqual([40, 60]);
    host.widths.set([40, 55, 60]);
    settle(fixture);
    expect(host.strip().snapshot()?.widths).toEqual([40, 55, 60]);
  });

  it('creates no observer until the strip turns active', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.active.set(false);
    settle(fixture);
    expect(instances).toBe(0);
    fixture.componentInstance.active.set(true);
    settle(fixture);
    expect(instances).toBe(1);
    fixture.componentInstance.active.set(false);
    settle(fixture);
    fixture.componentInstance.active.set(true);
    settle(fixture);
    expect(instances).toBe(1);
  });

  it('keeps null and observes nothing while inactive', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.active.set(false);
    settle(fixture);
    mock.triggerResize({});
    expect(fixture.componentInstance.strip().snapshot()).toBeNull();
    expect(mock.observe).not.toHaveBeenCalled();
  });

  it('reads null by derivation once deactivated and disconnects', () => {
    const { fixture, host } = render();
    expect(host.strip().snapshot()).not.toBeNull();
    host.active.set(false);
    settle(fixture);
    expect(host.strip().snapshot()).toBeNull();
    expect(mock.disconnect).toHaveBeenCalled();
  });

  it('keeps the snapshot reference across equal re-reads', () => {
    const { host } = render();
    const first = host.strip().snapshot();
    mock.triggerResize({});
    mock.triggerResize({});
    expect(host.strip().snapshot()).toBe(first);
  });

  it('treats a strip without layout as unmeasured', () => {
    stripWidth = 0;
    const { host } = render();
    expect(host.strip().snapshot()).toBeNull();
  });
});
