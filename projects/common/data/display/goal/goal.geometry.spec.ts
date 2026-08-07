import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxGoal } from './goal.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-goal)` block (goal.component.css:104) lays out a determinate
// attainment bar: the host is a full-width block, the track is a full-width
// groove, and the fill's inline-size is driven from the `--cngx-goal-fill`
// percent the component binds inline. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxGoal],
  template: `<cngx-goal [value]="73" [max]="100" />`,
})
class GoalHost {}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(GoalHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-goal');
  if (!host) {
    throw new Error('cngx-goal did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxGoal geometry', () => {
  it('is a full-width block bar', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('block');
    const track = query(host, '.cngx-goal__track');
    expect(computedValue(track, 'display')).toBe('block');
  });

  it('sizes the fill from the bound attainment percent', () => {
    const host = mount();
    const track = query(host, '.cngx-goal__track');
    const fill = query(host, '.cngx-goal__fill');
    // The component binds --cngx-goal-fill = 73% inline; the fill's inline-size
    // resolves to 73% of the track's used width. The token must inherit for
    // the descendant fill to see it.
    const trackWidth = track.getBoundingClientRect().width;
    const fillWidth = fill.getBoundingClientRect().width;
    expect(trackWidth).toBeGreaterThan(0);
    expect(fillWidth / trackWidth).toBeCloseTo(0.73, 1);
  });
});
