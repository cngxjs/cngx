import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The has-errors flag of
// a Material tab is an `::after` glyph; without CSS alt text Chromium folds the
// `!` into the tab's accessible name. The error itself is spoken by the
// decoration's own screen-reader text. Static markup with Material's own
// classes; Material's stylesheet is not loaded here, except the unlayered
// strong-focus-indicator rule below, copied from
// @angular/material/core/focus-indicators/_private.scss. It owns `::before`
// on every `.mat-focus-indicator` and beats any layered cngx rule there.

@Component({
  selector: 'cngx-mat-tab-error-glyph-name-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="tablist">
      <button type="button" role="tab" class="mat-mdc-tab cngx-mat-tab--has-errors tab-flagged">
        Billing
      </button>
    </div>
  `,
})
class MatTabErrorGlyphHost {}

@Component({
  selector: 'cngx-mat-tab-error-glyph-focus-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  styles: `
    .mat-focus-indicator {
      position: relative;
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
  `,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="tablist">
      <button
        type="button"
        role="tab"
        class="mat-mdc-tab mat-focus-indicator cngx-mat-tab--has-errors tab-flagged"
      >
        Billing
      </button>
    </div>
  `,
})
class MatTabErrorGlyphFocusHost {}

let mountedRoot: HTMLElement | null = null;

function mount(host: typeof MatTabErrorGlyphHost = MatTabErrorGlyphHost): HTMLElement {
  const fixture = TestBed.createComponent(host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('mat-tab has-errors glyph', () => {
  it('stays visible', () => {
    const tab = mount().querySelector('.tab-flagged')!;
    expect(getComputedStyle(tab, '::after').content).toContain('!');
  });

  it('survives Material strong focus indicators, focused or not', () => {
    const tab = mount(MatTabErrorGlyphFocusHost).querySelector<HTMLElement>('.tab-flagged')!;
    const glyph = () => getComputedStyle(tab, '::after');
    expect(glyph().content).toContain('!');
    expect(glyph().display).not.toBe('none');
    tab.focus();
    expect(glyph().content).toContain('!');
    expect(glyph().display).not.toBe('none');
  });

  it('leaves the Material focus indicator its own pseudo-element', () => {
    const tab = mount(MatTabErrorGlyphFocusHost).querySelector<HTMLElement>('.tab-flagged')!;
    tab.focus();
    expect(getComputedStyle(tab, '::before').content).toBe('""');
  });

  it('stays out of the tab name', async () => {
    mount();
    expect(await accessibleName('.tab-flagged')).toBe('Billing');
  });
});
