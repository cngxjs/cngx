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

@Component({
  selector: 'cngx-stepper-chevron-geometry-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  template: `
    <cngx-stepper aria-label="Wizard" skin="path-chevron">
      <div cngxStep label="A">Panel A</div>
      <div cngxStep label="B">Panel B</div>
      <div cngxStep label="C">Panel C</div>
    </cngx-stepper>
  `,
})
class ChevronStepperHost {}

@Component({
  selector: 'cngx-stepper-chevron-vertical-geometry-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  template: `
    <cngx-stepper aria-label="Wizard" skin="path-chevron" orientation="vertical">
      <div cngxStep label="A">Panel A</div>
      <div cngxStep label="B">Panel B</div>
      <div cngxStep label="C">Panel C</div>
    </cngx-stepper>
  `,
})
class VerticalChevronStepperHost {}

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

function mountSteps(component: typeof ChevronStepperHost | typeof VerticalChevronStepperHost): HTMLElement[] {
  const fixture = TestBed.createComponent(component);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const steps = Array.from(mountedRoot.querySelectorAll('.cngx-stepper__step')) as HTMLElement[];
  if (steps.length < 3) {
    throw new Error('cngx-stepper did not render three steps');
  }
  return steps;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  // isolate:false shares the browser env across specs; reset the forced dir so
  // a later geometry read never sees a leaked RTL root.
  document.documentElement.removeAttribute('dir');
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

describe('CngxStepper path-chevron direction', () => {
  // Pin root font-size so the authored 0.75rem resolves to a deterministic 12px
  // in the computed clip-path, independent of the browser default. Reset below.
  // Expected forms are the browser-serialized authored polygons and their exact
  // x -> 100% - x mirrors.
  const MID_LTR = 'polygon(0px 0px, calc(100% - 12px) 0px, 100% 50%, calc(100% - 12px) 100%, 0px 100%, 12px 50%)';
  const MID_RTL = 'polygon(100% 0px, 12px 0px, 0px 50%, 12px 100%, 100% 100%, calc(100% - 12px) 50%)';
  const FIRST_LTR = 'polygon(0px 0px, calc(100% - 12px) 0px, 100% 50%, calc(100% - 12px) 100%, 0px 100%)';
  const FIRST_RTL = 'polygon(100% 0px, 12px 0px, 0px 50%, 12px 100%, 100% 100%)';
  const LAST_LTR = 'polygon(0px 0px, 100% 0px, 100% 100%, 0px 100%, 12px 50%)';
  const LAST_RTL = 'polygon(100% 0px, 0px 0px, 0px 100%, 100% 100%, calc(100% - 12px) 50%)';

  afterEach(() => {
    document.documentElement.style.removeProperty('font-size');
  });

  it('reflects each horizontal chevron tile under dir=rtl and keeps LTR byte-stable', () => {
    document.documentElement.style.fontSize = '16px';
    const [first, mid, last] = mountSteps(ChevronStepperHost);

    expect(computedValue(first, 'clip-path')).toBe(FIRST_LTR);
    expect(computedValue(mid, 'clip-path')).toBe(MID_LTR);
    expect(computedValue(last, 'clip-path')).toBe(LAST_LTR);

    document.documentElement.dir = 'rtl';
    expect(computedValue(first, 'clip-path')).toBe(FIRST_RTL);
    expect(computedValue(mid, 'clip-path')).toBe(MID_RTL);
    expect(computedValue(last, 'clip-path')).toBe(LAST_RTL);

    document.documentElement.dir = 'ltr';
    expect(computedValue(mid, 'clip-path')).toBe(MID_LTR);
  });

  it('leaves the vertical (block-axis) chevron tiles identical LTR vs RTL', () => {
    const [, mid] = mountSteps(VerticalChevronStepperHost);
    const ltr = computedValue(mid, 'clip-path');
    expect(ltr).not.toBe('');
    expect(ltr).not.toBe('none');

    document.documentElement.dir = 'rtl';
    // The vertical polygon is notch-at-50%, symmetric about the vertical axis:
    // no :dir(rtl) override, so it must render identically. This is the guard
    // that a future blanket mirror does not touch the neutral skin.
    expect(computedValue(mid, 'clip-path')).toBe(ltr);
  });
});
