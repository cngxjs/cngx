import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Computed tier. Runs in a real Chromium (the `test-geometry` target) against
// the exact Track-B file loaded through `styleUrls` under
// `ViewEncapsulation.None`, because this CSS ships in the aggregated
// `cngx.css` and sits on no component styleUrl. jsdom reports `''` for these
// reads. The source-text tier - density derivation, @media placement,
// :scope-only outline suppression - lives in `cngx-field-skin.css.spec.ts`,
// which runs under node and can read the file.

@Component({
  selector: 'cngx-field-skin-geometry-host',
  standalone: true,
  // The reset comes along because the skins are authored against it: it owns
  // `box-sizing: border-box` and the `:focus-visible` ring the fill and bare
  // scopes suppress on their own root.
  styleUrls: [
    '../../../core/theming/reset.css',
    './cngx-field-skin.css',
    './cngx-field-affix.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <input class="solo-fill" type="text" data-skin="fill" />
    <input class="solo-bare" type="text" data-skin="bare" />
    <span class="cngx-field-affix-row row" data-skin="fill">
      <span class="cngx-field-prefix">$</span>
      <input class="nested-fill" type="text" data-skin="fill" />
    </span>
    <table>
      <tbody>
        <tr>
          <td style="padding: 0; width: 200px">
            <input class="cell-bare" type="text" data-skin="bare" />
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
class SkinHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SkinHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

// box-shadow transitions over 150ms; reading the moment focus lands catches
// the pre-state frame, not the resolved underline.
function settle(): Promise<void> {
  return new Promise((done) => setTimeout(done, 250));
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

describe('field skin geometry', () => {
  it('draws the fill skin as an underline, not a box', () => {
    const input = query(mount(), '.solo-fill');
    expect(computedValue(input, 'border-bottom-width')).toBe('1px');
    expect(computedValue(input, 'border-top-width')).toBe('0px');
  });

  it('grows the underline into the focus colour on focus', async () => {
    const input = query(mount(), '.solo-fill') as HTMLInputElement;
    input.focus();
    await settle();
    expect(computedValue(input, 'box-shadow')).toContain('-2px');
    expect(computedValue(input, 'outline-style')).toBe('none');
  });

  it('strips surface and border on the bare skin', () => {
    const input = query(mount(), '.solo-bare');
    expect(computedValue(input, 'border-bottom-width')).toBe('0px');
    expect(computedValue(input, 'background-color')).toBe('rgba(0, 0, 0, 0)');
  });

  it('lets the affix row alone draw the underline', async () => {
    const root = mount();
    const nested = query(root, '.nested-fill') as HTMLInputElement;
    const row = query(root, '.row');
    nested.focus();
    await settle();
    expect(computedValue(nested, 'box-shadow')).toBe('none');
    expect(computedValue(nested, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(row, 'border-bottom-width')).toBe('1px');
  });

  it('fills a zero-padding table cell on the inline axis', () => {
    const root = mount();
    const cell = query(root, 'td');
    const input = query(root, '.cell-bare');
    expect(input.getBoundingClientRect().width).toBeCloseTo(
      cell.getBoundingClientRect().width,
      0,
    );
  });
});
