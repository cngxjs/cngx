import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CngxDotStepperDot,
  CngxStep,
  CngxStepContent,
  provideStepperConfigAt,
  withStepperMobileCollapse,
} from '@cngx/common/stepper';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxDotStepper } from './dot-stepper.component';
import { CngxStepper } from './stepper.component';

// Runs in a real Chromium (the `test-geometry` target). A `*cngxDotStepperDot`
// body replaces the inside of each dot - in the collapsed `<cngx-stepper>` dot
// row and in `<cngx-dot-stepper>`. The body must sit centred on its dot; as an
// inline box it rode the text baseline and hung below the dot.

const DOT_BODY = `
  <ng-template cngxDotStepperDot let-active="active" let-completed="completed">
    @if (active || completed) {
      <svg class="body" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
        <path d="M5 0l3 5-3 5-3-5z" fill="currentColor" />
      </svg>
    }
  </ng-template>
`;

@Component({
  selector: 'cngx-stepper-dot-body-host',
  standalone: true,
  imports: [CngxStepper, CngxDotStepper, CngxStep, CngxStepContent, CngxDotStepperDot],
  viewProviders: [provideStepperConfigAt(withStepperMobileCollapse('dots'))],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="width: 16rem">
      <cngx-stepper class="collapsed" aria-label="Checkout" [activeStepIndex]="1">
        ${DOT_BODY}
        <div cngxStep label="One"><ng-template cngxStepContent>One</ng-template></div>
        <div cngxStep label="Two"><ng-template cngxStepContent>Two</ng-template></div>
        <div cngxStep label="Three"><ng-template cngxStepContent>Three</ng-template></div>
      </cngx-stepper>
    </div>
    <cngx-dot-stepper class="standalone" aria-label="Tour" [activeStepIndex]="1">
      ${DOT_BODY}
      <div cngxStep label="One"></div>
      <div cngxStep label="Two"></div>
      <div cngxStep label="Three"></div>
    </cngx-dot-stepper>
  `,
})
class DotBodyHost {}

let mountedRoot: HTMLElement | null = null;

async function mount(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(DotBodyHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  // The collapse reads the container width after layout; wait for the dot row.
  for (
    let frame = 0;
    frame < 20 && !mountedRoot.querySelector('.collapsed .cngx-stepper__mobile-dot');
    frame++
  ) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    fixture.detectChanges();
  }
  for (const el of Array.from(mountedRoot.querySelectorAll<HTMLElement>('*'))) {
    el.style.transition = 'none';
  }
  return mountedRoot;
}

/** Centre offset of each projected body against the dot that holds it. */
function offsets(root: HTMLElement, dotSelector: string): { dx: number; dy: number }[] {
  const dots = Array.from(root.querySelectorAll<HTMLElement>(dotSelector)).filter((dot) =>
    dot.querySelector('svg.body'),
  );
  expect(dots.length).toBe(2);
  return dots.map((dot) => {
    const a = dot.getBoundingClientRect();
    const b = (dot.querySelector('svg.body') as SVGSVGElement).getBoundingClientRect();
    return {
      dx: Math.abs(a.left + a.width / 2 - (b.left + b.width / 2)),
      dy: Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)),
    };
  });
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('projected dot body', () => {
  it('centres on the collapsed stepper dot', async () => {
    const root = await mount();
    for (const { dx, dy } of offsets(root, '.collapsed .cngx-stepper__mobile-dot')) {
      expect(dx).toBeLessThan(0.5);
      expect(dy).toBeLessThan(0.5);
    }
  });

  it('centres on the dot-stepper dot', async () => {
    const root = await mount();
    for (const { dx, dy } of offsets(root, '.standalone .cngx-dot-stepper__dot')) {
      expect(dx).toBeLessThan(0.5);
      expect(dy).toBeLessThan(0.5);
    }
  });
});
