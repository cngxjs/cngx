import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxPopover } from './popover.directive';
import { CngxPopoverAnchor } from './popover-anchor.directive';
import { CngxPopoverTrigger } from './popover-trigger.directive';

// Runs in a real Chromium (the `test-geometry` target), where
// `SUPPORTS_ANCHOR` is true and `anchor-name` is a real computed value
// (jsdom owns the floating-ui path in popover-anchor.directive.spec.ts).
// The reset ships in `cngx.css`; under ViewEncapsulation.None it reaches the
// top-layer panel, so the panel's border box is what the anchor aligns.

const HARNESS_STYLES = ['../../core/theming/reset.css', '../theming/components/cngx-popover.css'];

@Component({
  selector: 'cngx-popover-anchor-ancestor-host',
  standalone: true,
  imports: [CngxPopover, CngxPopoverTrigger, CngxPopoverAnchor],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="row"
      [cngxPopoverAnchor]="pop"
      style="display: flex; width: 320px; padding: 0 17px; margin-left: 40px; border: 1px solid"
    >
      <input
        class="input"
        [cngxPopoverTrigger]="pop"
        aria-label="City"
        style="flex: 1; min-width: 0"
      />
    </div>
    <div
      cngxPopover
      #pop="cngxPopover"
      class="panel"
      placement="bottom-start"
      style="width: 200px; height: 40px"
    >
      Content
    </div>
  `,
})
class AncestorAnchorHost {
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  selector: 'cngx-popover-anchor-sibling-host',
  standalone: true,
  imports: [CngxPopover, CngxPopoverTrigger, CngxPopoverAnchor],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <input class="input" [cngxPopoverTrigger]="pop" aria-label="City" />
    @if (showAnchor()) {
      <div class="box" [cngxPopoverAnchor]="pop" style="width: 240px; height: 32px"></div>
    }
    <div cngxPopover #pop="cngxPopover" class="panel" placement="bottom-start">Content</div>
  `,
})
class SiblingAnchorHost {
  readonly showAnchor = signal(false);
  readonly popover = viewChild.required(CngxPopover);
}

let mountedRoot: HTMLElement | null = null;

function mount<T>(type: new () => T) {
  const fixture = TestBed.createComponent(type);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const q = (selector: string) => mountedRoot?.querySelector(selector) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxPopoverAnchor geometry', () => {
  it('moves anchor-name from the trigger to an ancestor anchor', () => {
    const { host, q } = mount(AncestorAnchorHost);
    const name = `--cngx-pop-${host.popover().id()}`;
    expect(computedValue(q('.row'), 'anchor-name')).toBe(name);
    expect(computedValue(q('.input'), 'anchor-name')).toBe('none');
  });

  it('aligns the panel start edge with the anchor, not the inset trigger', async () => {
    const { fixture, host, q } = mount(AncestorAnchorHost);
    host.popover().show();
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const row = q('.row').getBoundingClientRect();
    const input = q('.input').getBoundingClientRect();
    const panel = q('.panel').getBoundingClientRect();
    expect(Math.abs(input.left - row.left)).toBeGreaterThan(10);
    expect(Math.abs(panel.left - row.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.left - input.left)).toBeGreaterThan(10);
    expect(panel.top).toBeGreaterThanOrEqual(row.bottom - 1);
    host.popover().hide();
  });

  it('yields and restores the trigger anchor-name as a sibling anchor mounts and unmounts', () => {
    const { fixture, host, q } = mount(SiblingAnchorHost);
    const name = `--cngx-pop-${host.popover().id()}`;
    expect(computedValue(q('.input'), 'anchor-name')).toBe(name);

    host.showAnchor.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(computedValue(q('.input'), 'anchor-name')).toBe('none');
    expect(computedValue(q('.box'), 'anchor-name')).toBe(name);

    host.showAnchor.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(computedValue(q('.input'), 'anchor-name')).toBe(name);
    expect(q('.box')).toBeNull();
  });
});
