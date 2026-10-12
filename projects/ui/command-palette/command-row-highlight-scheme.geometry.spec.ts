/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The keyboard-highlighted
// command row tints its background and inherits the text colour, so the tint
// must read in both schemes: a translucent wash over the panel surface, never
// an opaque light fill that leaves the dark scheme's light text on a light row.
// The `--cngx-command-row-active-bg` override still wins.

const SCHEMES = ['light', 'dark'] as const;
// The old dead fallback (`#eef2ff`) the row painted whatever the scheme.
const LIGHT_LITERAL = 'rgb(238, 242, 255)';

@Component({
  selector: 'cngx-command-row-highlight-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './panel/command-panel.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="background: var(--cngx-color-surface); color: var(--cngx-color-text)"
      >
        <div class="cngx-command-row cngx-option--highlighted row-active">
          <span class="cngx-command-row-label">Open file</span>
        </div>
        <div
          class="cngx-command-row cngx-option--highlighted row-override"
          style="--cngx-command-row-active-bg: rgb(1, 2, 3)"
        >
          <span class="cngx-command-row-label">Close file</span>
        </div>
      </div>
    }
  `,
})
class CommandRowHighlightHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CommandRowHighlightHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

// Alpha channel of a computed colour string (`rgb()` reads as opaque).
function alphaOf(colour: string): number {
  const slash = /\/\s*([\d.]+)\s*\)$/.exec(colour);
  if (slash) {
    return parseFloat(slash[1]);
  }
  const rgba = /^rgba\(.*,\s*([\d.]+)\)$/.exec(colour);
  return rgba ? parseFloat(rgba[1]) : 1;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('highlighted command row, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints a translucent tint, not the opaque light literal', () => {
    const root = mount();
    const bg = computedValue(at(root, '.row-active'), 'background-color');
    expect(bg).not.toBe(LIGHT_LITERAL);
    const alpha = alphaOf(bg);
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1);
  });

  it('keeps the scheme text colour on the highlighted row', () => {
    const root = mount();
    const scope = one(root, `.scheme-${scheme}`);
    expect(computedValue(at(root, '.row-active'), 'color')).toBe(computedValue(scope, 'color'));
  });

  it('lets --cngx-command-row-active-bg override the tint', () => {
    const root = mount();
    expect(computedValue(at(root, '.row-override'), 'background-color')).toBe('rgb(1, 2, 3)');
  });
});
