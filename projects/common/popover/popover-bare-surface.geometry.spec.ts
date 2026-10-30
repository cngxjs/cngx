import { Component, viewChild, ViewEncapsulation } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxPopover } from './popover.directive';

// Runs in a real Chromium (the `test-geometry` target): the UA `[popover]`
// sheet only applies to a real native popover.

const HARNESS_STYLES = ['../../core/theming/reset.css', '../theming/components/cngx-popover.css'];

@Component({
  selector: 'cngx-popover-bare-surface-host',
  standalone: true,
  imports: [CngxPopover],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div cngxPopover #pop="cngxPopover" class="bare">
      <div class="surface" style="box-shadow: 0 4px 12px rgb(0 0 0 / 0.2)">Content</div>
    </div>
  `,
})
class BareSurfaceHost {
  readonly popover = viewChild.required(CngxPopover);
}

let fixture: ComponentFixture<BareSurfaceHost> | null = null;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

afterEach(() => {
  const root = fixture?.nativeElement as HTMLElement | undefined;
  fixture?.destroy();
  root?.remove();
  fixture = null;
});

describe('bare CngxPopover host', () => {
  it('does not clip the shadow of the surface it hosts', async () => {
    fixture = TestBed.createComponent(BareSurfaceHost);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.componentInstance.popover().show();
    fixture.detectChanges();
    await nextFrame();

    const host = (fixture.nativeElement as HTMLElement).querySelector('.bare') as HTMLElement;
    const style = getComputedStyle(host);
    expect(host.matches(':popover-open')).toBe(true);
    expect(style.overflowX).toBe('visible');
    expect(style.overflowY).toBe('visible');
    expect(style.borderTopWidth).toBe('0px');
    expect(style.paddingTop).toBe('0px');
  });
});
