import { Component, DestroyRef, type Signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { createTouchFloorSignal } from './touch-floor';

// Runs in a real Chromium (the `test-geometry` target) against the real
// system-tokens cascade. Each probe carries the floor as its min-height, the
// way a select trigger does, so a floor flip resizes the probe and the signal
// re-reads the resolved `--cngx-target-min`.

@Component({
  selector: 'cngx-touch-floor-signal-host',
  standalone: true,
  styleUrls: ['../../../../core/theming/layers.css', '../../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="width: 10rem">
      <div data-touch="on"><span class="probe" data-probe="attr-on"></span></div>
      <div class="cngx-touch-on"><span class="probe" data-probe="class-on"></span></div>
      <div data-touch="on">
        <div data-touch="off" id="island">
          <span class="probe" data-probe="off-island"></span>
        </div>
      </div>
      <div data-touch="on">
        <div class="cngx-touch-off"><span class="probe" data-probe="class-off"></span></div>
      </div>
      <div><span class="probe" data-probe="fine"></span></div>
    </div>
  `,
  styles: [
    `
      .probe {
        display: block;
        min-height: max(1rem, var(--cngx-target-min, 0px));
      }
    `,
  ],
})
class TouchFloorSignalHost {}

let mountedRoot: HTMLElement | null = null;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(): Promise<void> {
  await nextFrame();
  await nextFrame();
}

function mount(): Record<string, Signal<boolean>> {
  const fixture = TestBed.createComponent(TouchFloorSignalHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const destroyRef = TestBed.inject(DestroyRef);
  const signals: Record<string, Signal<boolean>> = {};
  for (const probe of Array.from(mountedRoot.querySelectorAll<HTMLElement>('.probe'))) {
    signals[probe.dataset['probe']!] = createTouchFloorSignal(probe, destroyRef, window);
  }
  return signals;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('createTouchFloorSignal in a real cascade', () => {
  it('follows every on and off signal of the floor', async () => {
    const signals = mount();
    await settle();
    expect(
      Object.fromEntries(Object.entries(signals).map(([name, active]) => [name, active()])),
    ).toEqual({
      'attr-on': true,
      'class-on': true,
      'off-island': false,
      'class-off': false,
      fine: false,
    });
  });

  it('flips once an ancestor attribute flip resizes the host', async () => {
    const signals = mount();
    await settle();
    expect(signals['off-island']()).toBe(false);

    mountedRoot!.querySelector<HTMLElement>('#island')!.setAttribute('data-touch', 'on');
    await settle();
    expect(signals['off-island']()).toBe(true);

    mountedRoot!.querySelector<HTMLElement>('#island')!.setAttribute('data-touch', 'off');
    await settle();
    expect(signals['off-island']()).toBe(false);
  });
});
