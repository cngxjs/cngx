/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName } from '@cngx/testing/geometry';
import { CNGX_ICON_ALERT, CNGX_ICON_BAN } from '@cngx/utils';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The has-errors badge
// and the commit-rejection icon of a Material tab are `aria-hidden` spans the
// decoration projectors append to the tab, after the label: standalone stroke
// icons from the shared icon data, no disc. A rejected tab is marked by colour
// only (no outline), with an outline under forced colors. Static markup in the
// shape the projectors write, with Material's own classes; Material's
// stylesheet is not loaded here, except the unlayered strong-focus-indicator
// rule below, copied from @angular/material/core/focus-indicators/_private.scss.
// It owns `::before` on every `.mat-focus-indicator`.

const ICON_CLASS = 'cngx-mat-tab__icon-svg cngx-mat-tab__icon-svg--stroke';

// Material's tab is a centring flex row with a flex label row inside.
const MAT_TAB_STYLES = `
  .mat-mdc-tab {
    position: relative;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    width: 240px;
    height: 48px;
    padding: 0 24px;
    border: 0;
    background: none;
    font-size: 14px;
  }
  .mdc-tab__content {
    position: relative;
    display: flex;
    align-items: center;
  }
  .mat-focus-indicator::before {
    inset: 0;
    position: absolute;
    box-sizing: border-box;
    pointer-events: none;
    display: var(--mat-focus-indicator-display, none);
    border: 3px solid transparent;
  }
  .mat-focus-indicator:focus-visible::before {
    content: '';
  }
`;

@Component({
  selector: 'cngx-mat-tab-error-icon-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  styles: MAT_TAB_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (dir of dirs; track dir) {
      <div role="tablist" [attr.dir]="dir" [class]="'strip-' + dir">
        <button type="button" role="tab" class="mat-mdc-tab tab-resting">
          <span class="mdc-tab__content">Notes</span>
        </button>
        <button
          type="button"
          role="tab"
          class="mat-mdc-tab mat-focus-indicator cngx-mat-tab--has-errors tab-flagged"
        >
          <span class="mdc-tab__content">Billing</span
          ><span class="cngx-mat-tab__error-badge" aria-hidden="true"
            ><svg [attr.class]="iconClass" viewBox="0 0 24 24" focusable="false">
              <path [attr.d]="alert.d" /></svg
          ></span>
        </button>
        <button
          type="button"
          role="tab"
          class="mat-mdc-tab cngx-mat-tab--error tab-failed"
          data-reason="failed"
        >
          <span class="mdc-tab__content">Profile</span
          ><span class="cngx-mat-tab__rejection-icon" aria-hidden="true" data-reason="failed"
            ><svg [attr.class]="iconClass" viewBox="0 0 24 24" focusable="false">
              <path [attr.d]="alert.d" /></svg
          ></span>
        </button>
        <button
          type="button"
          role="tab"
          class="mat-mdc-tab cngx-mat-tab--error tab-refused"
          data-reason="refused"
        >
          <span class="mdc-tab__content">Plan</span
          ><span class="cngx-mat-tab__rejection-icon" aria-hidden="true" data-reason="refused"
            ><svg [attr.class]="iconClass" viewBox="0 0 24 24" focusable="false">
              <path [attr.d]="ban.d" /></svg
          ></span>
        </button>
        <!-- Mounted rejection first, badge second: order keeps the badge first. -->
        <button
          type="button"
          role="tab"
          class="mat-mdc-tab cngx-mat-tab--error cngx-mat-tab--has-errors tab-both"
          data-reason="failed"
        >
          <span class="mdc-tab__content">Account</span
          ><span class="cngx-mat-tab__rejection-icon" aria-hidden="true" data-reason="failed"
            ><svg [attr.class]="iconClass" viewBox="0 0 24 24" focusable="false">
              <path [attr.d]="alert.d" /></svg></span
          ><span class="cngx-mat-tab__error-badge" aria-hidden="true"
            ><svg [attr.class]="iconClass" viewBox="0 0 24 24" focusable="false">
              <path [attr.d]="alert.d" /></svg
          ></span>
        </button>
      </div>
    }
  `,
})
class MatTabErrorIconHost {
  protected readonly dirs = ['ltr', 'rtl'] as const;
  protected readonly iconClass = ICON_CLASS;
  protected readonly alert = CNGX_ICON_ALERT;
  protected readonly ban = CNGX_ICON_BAN;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MatTabErrorIconHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function el<T extends Element = HTMLElement>(root: ParentNode, sel: string): T {
  const found = root.querySelector<T & Element>(sel);
  if (!found) {
    throw new Error(`${sel} did not render`);
  }
  return found as T;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('mat-tab error icons', () => {
  for (const sel of ['.tab-flagged .cngx-mat-tab__error-badge', '.tab-failed .cngx-mat-tab__rejection-icon', '.tab-refused .cngx-mat-tab__rejection-icon'] as const) {
    it(`draws ${sel} as a bare 1.15em icon at stroke 2`, () => {
      const icon = el(el(mount(), '.strip-ltr'), sel);
      expect(getComputedStyle(icon).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      const svg = el<SVGElement>(icon, 'svg');
      const path = el<SVGPathElement>(svg, 'path');
      const em = parseFloat(getComputedStyle(icon).fontSize);
      expect(svg.getBoundingClientRect().width).toBeCloseTo(1.15 * em, 0);
      expect(getComputedStyle(svg).strokeWidth).toBe('2px');
      expect(getComputedStyle(path).stroke).toBe(getComputedStyle(icon).color);
      expect(getComputedStyle(path).fill).toBe('none');
    });
  }

  for (const dir of ['ltr', 'rtl'] as const) {
    it(`follows the label, badge first, on the label's centre line (${dir})`, () => {
      const strip = el(mount(), `.strip-${dir}`);
      const tab = el(strip, '.tab-both');
      const label = el(tab, '.mdc-tab__content').getBoundingClientRect();
      const badge = el(tab, '.cngx-mat-tab__error-badge').getBoundingClientRect();
      const rejection = el(tab, '.cngx-mat-tab__rejection-icon').getBoundingClientRect();
      const after = (a: DOMRect, b: DOMRect) => (dir === 'ltr' ? b.left - a.right : a.left - b.right);
      expect(after(label, badge)).toBeCloseTo(4, 1);
      expect(after(badge, rejection)).toBeCloseTo(4, 1);
      for (const box of [badge, rejection]) {
        expect(box.top + box.height / 2).toBeCloseTo(label.top + label.height / 2, 1);
      }
    });
  }

  it('keeps the icons out of the tab name', async () => {
    mount();
    expect(await accessibleName('.strip-ltr .tab-flagged')).toBe('Billing');
    expect(await accessibleName('.strip-ltr .tab-refused')).toBe('Plan');
    expect(await accessibleName('.strip-ltr .tab-failed')).toBe('Profile');
  });

  it('leaves the Material focus indicator its own pseudo-element', () => {
    const tab = el(el(mount(), '.strip-ltr'), '.tab-flagged');
    tab.focus();
    expect(getComputedStyle(tab, '::before').content).toBe('""');
    expect(getComputedStyle(el(tab, '.cngx-mat-tab__error-badge')).display).not.toBe('none');
  });
});

describe('rejected mat-tab, colour only', () => {
  it('drops the outline and colours the label in the reason colour', () => {
    const strip = el(mount(), '.strip-ltr');
    const resting = getComputedStyle(el(strip, '.tab-resting')).color;
    for (const sel of ['.tab-failed', '.tab-refused']) {
      const tab = el(strip, sel);
      expect(getComputedStyle(tab).outlineStyle).toBe('none');
      expect(getComputedStyle(tab).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(el(tab, '.mdc-tab__content')).color).not.toBe(resting);
    }
    // A failed label and its icon share the error colour.
    const failed = el(strip, '.tab-failed');
    expect(getComputedStyle(failed).color).toBe(
      getComputedStyle(el(failed, '.cngx-mat-tab__rejection-icon')).color,
    );
  });

  it('tells a refused tab from a failed one in icon and label', () => {
    const strip = el(mount(), '.strip-ltr');
    const icon = (sel: string) => getComputedStyle(el(strip, `${sel} .cngx-mat-tab__rejection-icon`)).color;
    expect(icon('.tab-refused')).not.toBe(icon('.tab-failed'));
    expect(getComputedStyle(el(strip, '.tab-refused')).color).not.toBe(
      getComputedStyle(el(strip, '.tab-failed')).color,
    );
  });

  it('forced colors: an outline marks the rejected tab, the icons paint CanvasText', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const strip = el(mount(), '.strip-ltr');
    for (const sel of ['.tab-failed', '.tab-refused']) {
      const tab = el(strip, sel);
      expect(getComputedStyle(tab).outlineStyle).toBe('solid');
      expect(getComputedStyle(tab).outlineWidth).toBe('2px');
    }
    expect(getComputedStyle(el(strip, '.tab-flagged')).outlineStyle).not.toBe('solid');
    const canvasText = getComputedStyle(strip).color;
    expect(getComputedStyle(el(strip, '.tab-flagged .cngx-mat-tab__error-badge')).color).toBe(
      canvasText,
    );
  });
});
