import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStepperCount, type CngxStepperCountHost } from './stepper-count';
import { type CngxStepNode } from './stepper-host.token';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root so the `N/M` ratio order-fix is actually exercised: the `/` between two
// number groups swaps under `dir=rtl`, so the caption span must compute
// `direction: ltr` on top of `unicode-bidi: isolate`. An ltr-mounted direction
// read would be vacuous (a missing declaration also inherits ltr there).

function stubHost(active: number, total: number): CngxStepperCountHost {
  const steps = Array.from(
    { length: total },
    (_, i) => ({ id: `s${i}` }) as unknown as CngxStepNode,
  );
  return {
    activeStepIndex: signal(active),
    stepsOnly: signal(steps),
  };
}

@Component({
  standalone: true,
  imports: [CngxStepperCount],
  template: `<cngx-stepper-count [host]="host" [format]="ratio" />`,
})
class CountHost {
  host: CngxStepperCountHost | null = stubHost(1, 9);
  ratio = (c: number, t: number) => `${c}/${t}`;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CountHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const span = mountedRoot.querySelector('cngx-stepper-count > span');
  if (!span) {
    throw new Error('cngx-stepper-count span did not render');
  }
  return span as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxStepperCount geometry (rtl)', () => {
  it('pins the N/M ratio to isolate + direction:ltr under dir=rtl', () => {
    document.documentElement.dir = 'rtl';
    const span = mount();
    // `2 / 9 -> 9 / 2` is the reorder the direction:ltr guards; the rtl mount is
    // what makes the direction assertion discriminating.
    expect(computedValue(span, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(span, 'direction')).toBe('ltr');
  });
});
