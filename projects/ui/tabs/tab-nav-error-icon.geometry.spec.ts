import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxTabLink } from '@cngx/common/tabs';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTabNav } from './tab-nav.component';

// Runs in a real Chromium (the `test-geometry` target). An errored tab-nav link
// leads its label with the alert icon `[cngxTabLink]` builds from the shared
// icon data: sized like the tab-group error badge (1.15em box), centred on the
// label line, at the inline start in both directions, and out of the name.

@Component({
  selector: 'cngx-tab-nav-error-icon-host',
  standalone: true,
  imports: [CngxTabNav, CngxTabLink],
  template: `
    <div [attr.dir]="dir()">
      <cngx-tab-nav [activeIndex]="0" aria-label="Sections">
        <a cngxTabLink id="overview" href="#">Overview</a>
        <a cngxTabLink id="profile" href="#" [error]="'Unsaved'">Profile</a>
      </cngx-tab-nav>
    </div>
  `,
})
class ErrorIconHost {
  readonly dir = input<'ltr' | 'rtl'>('ltr');
}

let mountedRoot: HTMLElement | null = null;

function mount(dir: 'ltr' | 'rtl' = 'ltr'): HTMLAnchorElement {
  const fixture = TestBed.createComponent(ErrorIconHost);
  fixture.componentRef.setInput('dir', dir);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot.querySelector<HTMLAnchorElement>('#profile')!;
}

/** Text box of the link label (the text node after the icon). */
function labelRect(link: HTMLElement): DOMRect {
  const range = document.createRange();
  const text = Array.from(link.childNodes).find(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
  )!;
  range.selectNodeContents(text);
  return range.getBoundingClientRect();
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('tab-nav error icon', () => {
  it('draws a 1.15em box, the triangle centred on the label line', () => {
    const link = mount();
    const svg = link.querySelector<SVGSVGElement>('.cngx-tab-nav__error-icon > svg')!;
    const em = parseFloat(getComputedStyle(link).fontSize);
    const box = svg.getBoundingClientRect();
    expect(box.width).toBeCloseTo(1.15 * em, 0);
    expect(box.height).toBeCloseTo(1.15 * em, 0);
    const path = svg.querySelector('path')!.getBoundingClientRect();
    const text = labelRect(link);
    expect(Math.abs(path.top + path.height / 2 - (text.top + text.height / 2))).toBeLessThanOrEqual(
      1.5,
    );
    // Painted in the link's danger colour, as a stroke.
    expect(getComputedStyle(svg).stroke).toBe(getComputedStyle(link).color);
    expect(getComputedStyle(svg).fill).toBe('none');
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    it(`sits at the inline start of the label (${dir})`, () => {
      const link = mount(dir);
      const icon = link.querySelector('.cngx-tab-nav__error-icon')!.getBoundingClientRect();
      const text = labelRect(link);
      expect(dir === 'ltr' ? icon.right <= text.left : icon.left >= text.right).toBe(true);
    });
  }

  it('keeps the link name to its label', async () => {
    mount();
    expect(await accessibleName('#profile')).toBe('Profile');
  });
});
