/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep, CngxStepIndicator } from '@cngx/common/stepper';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxStepper } from './stepper.component';

// Runs in a real Chromium (the `test-geometry` target) with the real stepper,
// since the rules hang on the host's [data-skin] / [data-connectors]. Under
// forced colors the step discs are background tints, so completed and upcoming
// discs kept only their glyph, linear-minimal dots lost the completed fill and
// the wizard rails vanished. Every disc now carries an inset CanvasText ring, a
// completed disc fills CanvasText with its glyph in Canvas, the rails draw in
// CanvasText, and the current step keeps its Highlight fill over all of it.
// path-chevron draws its own segments and stays untouched.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-stepper-forced-markers-host',
  standalone: true,
  imports: [CngxStepper, CngxStep, CngxStepIndicator],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-stepper class="wiz" [activeStepIndex]="1" [connectors]="true" aria-label="Wizard">
      <div cngxStep label="Method" [completed]="true"></div>
      <div cngxStep label="Details"></div>
      <div cngxStep label="Verify"></div>
    </cngx-stepper>
    <cngx-stepper class="lin" skin="linear-minimal" [activeStepIndex]="0" aria-label="Linear">
      <div cngxStep label="One" [completed]="true"></div>
      <div cngxStep label="Two" [completed]="true"></div>
      <div cngxStep label="Three"></div>
    </cngx-stepper>
    <cngx-stepper class="chev" skin="path-chevron" [activeStepIndex]="1" aria-label="Chevron">
      <div cngxStep label="One" [completed]="true"></div>
      <div cngxStep label="Two"></div>
    </cngx-stepper>
    <cngx-stepper class="slot" [activeStepIndex]="1" aria-label="Slot">
      <ng-template cngxStepIndicator let-position><span style="color: rgb(0, 160, 0)">{{ position }}</span></ng-template>
      <div cngxStep label="One" [completed]="true"></div>
      <div cngxStep label="Two"></div>
    </cngx-stepper>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
  `,
})
class StepperMarkersHost {}

let mountedRoot: HTMLElement | null = null;

async function mount(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(StepperMarkersHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  for (const indicator of Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-stepper__indicator'))) {
    indicator.style.transition = 'none';
  }
  return mountedRoot;
}

function indicators(root: ParentNode, stepper: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`.${stepper} .cngx-stepper__indicator`));
}

function steps(root: ParentNode, stepper: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`.${stepper} .cngx-stepper__step`));
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('stepper markers under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string => computedValue(one(root, `.probe-${name}`), 'color');

  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(probe(root, 'canvastext'));
  });

  it('renders the fixture states', async () => {
    const root = await mountForced();
    expect(indicators(root, 'wiz').map((el) => el.dataset['state'])).toEqual(['success', expect.any(String), expect.any(String)]);
    expect(steps(root, 'wiz')[1].getAttribute('aria-current')).toBe('step');
    expect(steps(root, 'lin')[0].getAttribute('aria-current')).toBe('step');
    expect(indicators(root, 'lin')[0].dataset['state']).toBe('success');
  });

  it('rings an upcoming disc with an inset CanvasText outline', async () => {
    const root = await mountForced();
    for (const disc of [indicators(root, 'wiz')[2], indicators(root, 'lin')[2]]) {
      expect(computedValue(disc, 'outline-style')).toBe('solid');
      expect(computedValue(disc, 'outline-color')).toBe(probe(root, 'canvastext'));
      expect(Number.parseFloat(computedValue(disc, 'outline-offset'))).toBe(-1);
    }
  });

  it('fills a completed disc with CanvasText, its glyph in Canvas', async () => {
    const root = await mountForced();
    for (const disc of [indicators(root, 'wiz')[0], indicators(root, 'lin')[1]]) {
      expect(computedValue(disc, 'forced-color-adjust')).toBe('none');
      expect(computedValue(disc, 'background-color')).toBe(probe(root, 'canvastext'));
      expect(computedValue(disc, 'color')).toBe(probe(root, 'canvas'));
    }
  });

  it('only rings a completed disc that renders a slot template (no opt-out leak)', async () => {
    const root = await mountForced();
    const [done] = indicators(root, 'slot');
    expect(done.dataset['state']).toBe('success');
    expect(computedValue(done, 'forced-color-adjust')).toBe('auto');
    expect(computedValue(done, 'outline-color')).toBe(probe(root, 'canvastext'));
    expect(computedValue(done, 'background-color')).not.toBe(probe(root, 'canvastext'));
    expect(computedValue(one(done, 'span'), 'color')).toBe(probe(root, 'canvastext'));
  });

  it('keeps the current step Highlight, even on a completed step', async () => {
    const root = await mountForced();
    for (const disc of [indicators(root, 'wiz')[1], indicators(root, 'lin')[0]]) {
      expect(computedValue(disc, 'background-color')).toBe(probe(root, 'highlight'));
    }
  });

  it('draws the wizard rails in CanvasText', async () => {
    const root = await mountForced();
    for (const step of steps(root, 'wiz').slice(1)) {
      expect(getComputedStyle(step, '::before').getPropertyValue('background-color')).toBe(probe(root, 'canvastext'));
    }
  });

  it('leaves the path-chevron segments alone', async () => {
    const root = await mountForced();
    const discs = indicators(root, 'chev');
    expect(discs.length).toBeGreaterThan(0);
    for (const disc of discs) {
      expect(computedValue(disc, 'outline-style')).toBe('none');
    }
  });
});

describe('stepper markers without forced colors', () => {
  it('keeps the author paint: no ring, author completed fill', async () => {
    const root = await mount();
    const [done, , upcoming] = indicators(root, 'wiz');
    expect(computedValue(upcoming, 'outline-style')).toBe('none');
    expect(computedValue(done, 'forced-color-adjust')).toBe('auto');
    expect(computedValue(done, 'background-color')).not.toBe(computedValue(one(root, '.probe-canvastext'), 'color'));
  });
});
