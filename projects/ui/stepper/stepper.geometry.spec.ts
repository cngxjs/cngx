import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { computedValue, containerState } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStepper } from './stepper.component';

// Runs in a real Chromium (the `test-geometry` target). A container query
// resolves against the nearest ancestor carrying `container-type`, so the spec
// sizes that ancestor (the stepper host) explicitly and asserts the descendant
// panel padding flips across the breakpoint - the effect of the query, never
// `container-type` alone, which would prove nothing about the break.

@Component({
  selector: 'cngx-stepper-geometry-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  template: `
    <cngx-stepper aria-label="Wizard">
      <div cngxStep label="A">Panel A</div>
      <div cngxStep label="B">Panel B</div>
    </cngx-stepper>
  `,
})
class StepperHost {}

let mountedRoot: HTMLElement | null = null;

function mount(width: number): { host: HTMLElement; panel: HTMLElement } {
  const fixture = TestBed.createComponent(StepperHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-stepper');
  const panel = mountedRoot.querySelector('.cngx-stepper__panel');
  if (!host || !panel) {
    throw new Error('cngx-stepper did not render a panel');
  }
  (host as HTMLElement).style.inlineSize = `${width}px`;
  return { host: host as HTMLElement, panel: panel as HTMLElement };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxStepper geometry', () => {
  it('declares an inline-size container named cngx-stepper', () => {
    const { host } = mount(800);
    const state = containerState(host);
    expect(state.type).toBe('inline-size');
    expect(state.name).toBe('cngx-stepper');
  });

  it('compacts the panel padding below the 600px container breakpoint', () => {
    const { host, panel } = mount(800);
    const wide = computedValue(panel, 'padding-top');
    host.style.inlineSize = '400px';
    const narrow = computedValue(panel, 'padding-top');
    expect(parseFloat(wide)).toBeGreaterThan(0);
    expect(narrow).not.toBe(wide);
  });
});
