import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CngxDotStepperDot,
  CngxStep,
  provideStepperConfigAt,
  withStepperMobileCollapse,
} from '@cngx/common/stepper';
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

@Component({
  selector: 'cngx-stepper-dots-geometry-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  providers: [provideStepperConfigAt(withStepperMobileCollapse('dots'))],
  template: `
    <cngx-stepper aria-label="Wizard" style="inline-size: 320px">
      <div cngxStep label="A">Panel A</div>
      <div cngxStep label="B">Panel B</div>
      <div cngxStep label="C" [disabled]="true">Panel C</div>
      <div cngxStep label="D" [error]="true">Panel D</div>
    </cngx-stepper>
  `,
})
class DotsStepperHost {}

@Component({
  selector: 'cngx-stepper-dot-body-geometry-host',
  standalone: true,
  imports: [CngxStepper, CngxStep, CngxDotStepperDot],
  providers: [provideStepperConfigAt(withStepperMobileCollapse('dots'))],
  template: `
    <cngx-stepper aria-label="Wizard" style="inline-size: 320px">
      <ng-template cngxDotStepperDot>
        <svg class="dot-body" viewBox="0 0 10 10" width="10" height="10"></svg>
      </ng-template>
      <div cngxStep label="A">Panel A</div>
      <div cngxStep label="B">Panel B</div>
      <div cngxStep label="C">Panel C</div>
    </cngx-stepper>
  `,
})
class DotBodyStepperHost {}

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

function mountSteps(
  component: typeof ChevronStepperHost | typeof VerticalChevronStepperHost,
): HTMLElement[] {
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

  it('compacts the panel padding below the 48rem container rung', () => {
    const { host, panel } = mount(800);
    const wide = computedValue(panel, 'padding-top');
    host.style.inlineSize = '400px';
    const narrow = computedValue(panel, 'padding-top');
    expect(parseFloat(wide)).toBeGreaterThan(0);
    expect(narrow).not.toBe(wide);
  });
});

describe('CngxStepper container collapse', () => {
  // The collapse threshold is a @container rule writing --cngx-stepper-collapse
  // on ::after; the component reads it back and switches template. Only a real
  // engine resolves that, so the switch is asserted here and nowhere else.
  const nextFrame = (): Promise<void> =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  it('keeps the classic strip above the 30rem rung', async () => {
    const { host } = mount(40 * 16);
    await nextFrame();
    expect(
      getComputedStyle(host, '::after').getPropertyValue('--cngx-stepper-collapse').trim(),
    ).toBe('0');
    expect(host.querySelector('.cngx-stepper__strip')).not.toBeNull();
    expect(host.querySelector('.cngx-stepper__mobile-text')).toBeNull();
  });

  it('swaps to the compact count below the 30rem rung', async () => {
    const { host } = mount(25 * 16);
    await nextFrame();
    expect(
      getComputedStyle(host, '::after').getPropertyValue('--cngx-stepper-collapse').trim(),
    ).toBe('1');
    expect(host.querySelector('cngx-stepper-count.cngx-stepper__mobile-text')).not.toBeNull();
    expect(host.querySelector('.cngx-stepper__strip')).toBeNull();
  });
});

describe('CngxStepper path-chevron direction', () => {
  // Pin root font-size so the authored 0.75rem resolves to a deterministic 12px
  // in the computed clip-path, independent of the browser default. Reset below.
  // Expected forms are the browser-serialized authored polygons and their exact
  // x -> 100% - x mirrors.
  const MID_LTR =
    'polygon(0px 0px, calc(100% - 12px) 0px, 100% 50%, calc(100% - 12px) 100%, 0px 100%, 12px 50%)';
  const MID_RTL =
    'polygon(100% 0px, 12px 0px, 0px 50%, 12px 100%, 100% 100%, calc(100% - 12px) 50%)';
  const FIRST_LTR =
    'polygon(0px 0px, calc(100% - 12px) 0px, 100% 50%, calc(100% - 12px) 100%, 0px 100%)';
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

describe('CngxStepper mobile dots target size', () => {
  const nextFrame = (): Promise<void> =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  async function mountDots(touch: boolean): Promise<HTMLElement[]> {
    const fixture = TestBed.createComponent(DotsStepperHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    if (touch) {
      // What system-tokens.css resolves on a coarse pointer or `data-touch='on'`.
      mountedRoot.style.setProperty('--cngx-target-min', '44px');
    }
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    await nextFrame();
    fixture.detectChanges();
    await nextFrame();
    const dots = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-stepper__mobile-dot'));
    if (dots.length !== 4) {
      throw new Error('cngx-stepper did not collapse to four mobile dots');
    }
    return dots;
  }

  const centreX = (el: Element): number => {
    const rect = el.getBoundingClientRect();
    return rect.left + rect.width / 2;
  };
  const hitSize = (dot: HTMLElement): { width: number; height: number } => {
    const before = getComputedStyle(dot, '::before');
    return { width: parseFloat(before.width), height: parseFloat(before.height) };
  };

  it('spaces the dot centres at least 24px apart on a fine pointer and keeps the 10px dot', async () => {
    const dots = await mountDots(false);
    for (let i = 1; i < dots.length; i++) {
      expect(centreX(dots[i]) - centreX(dots[i - 1])).toBeGreaterThanOrEqual(24);
    }
    const upcoming = dots[1];
    expect(upcoming.offsetWidth).toBe(10);
    expect(hitSize(upcoming).width).toBe(16);
  });

  it('lifts each dot hit box to 44px under the touch floor', async () => {
    const dots = await mountDots(true);
    for (const dot of dots) {
      const hit = hitSize(dot);
      expect(hit.width).toBeGreaterThanOrEqual(44);
      expect(hit.height).toBeGreaterThanOrEqual(44);
    }
    for (let i = 1; i < dots.length; i++) {
      expect(centreX(dots[i]) - centreX(dots[i - 1])).toBeGreaterThanOrEqual(44);
    }
    expect(dots[1].offsetWidth).toBe(10);
  });

  it('keeps the disabled ring and the error fill on the dot box', async () => {
    const dots = await mountDots(false);
    const disabled = dots[2];
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.offsetWidth).toBe(10);
    expect(getComputedStyle(disabled).boxShadow).toContain('inset');
    expect(getComputedStyle(disabled).backgroundClip).toBe('border-box');
    const errored = dots[3];
    expect(errored.dataset['state']).toBe('error');
    expect(errored.offsetWidth).toBe(16);
    expect(getComputedStyle(errored).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('centres a projected dot body inside every dot, the active one included', async () => {
    const fixture = TestBed.createComponent(DotBodyStepperHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    await nextFrame();
    fixture.detectChanges();
    await nextFrame();
    const dots = Array.from(
      mountedRoot.querySelectorAll<HTMLElement>('.cngx-stepper__mobile-dot'),
    );
    expect(dots).toHaveLength(3);
    expect(dots[0].classList).toContain('cngx-stepper__mobile-dot--active');
    for (const dot of dots) {
      const body = dot.querySelector('.dot-body')!.getBoundingClientRect();
      const box = dot.getBoundingClientRect();
      expect(Math.abs(body.left + body.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(body.top + body.height / 2 - (box.top + box.height / 2))).toBeLessThanOrEqual(0.5);
    }
  });
});
