import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStepperCount, type CngxStepperCountHost } from './stepper-count';
import { type CngxStepNode } from './stepper-host.token';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root so the direction read discriminates: the caption is translated text and
// must follow the page direction, while a bare `N/M` ratio stays pinnable to
// ltr through --cngx-stepper-count-direction. An ltr mount would be vacuous.

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
  document.documentElement.style.removeProperty('--cngx-stepper-count-direction');
});

describe('CngxStepperCount geometry (rtl)', () => {
  it('isolates the caption and lets it follow dir=rtl', () => {
    document.documentElement.dir = 'rtl';
    const span = mount();
    expect(computedValue(span, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(span, 'direction')).toBe('rtl');
  });

  it('pins a ratio caption to ltr through the direction token', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-stepper-count-direction', 'ltr');
    const span = mount();
    expect(computedValue(span, 'direction')).toBe('ltr');
  });
});
