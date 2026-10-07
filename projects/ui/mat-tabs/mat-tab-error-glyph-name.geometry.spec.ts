import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The has-errors flag of
// a Material tab is a `::before` glyph; without CSS alt text Chromium folds the
// `!` into the tab's accessible name. The error itself is spoken by the
// decoration's own screen-reader text. Static markup with Material's own
// classes; Material's stylesheet is not loaded here.

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

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MatTabErrorGlyphHost);
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
    expect(getComputedStyle(tab, '::before').content).toContain('!');
  });

  it('stays out of the tab name', async () => {
    mount();
    expect(await accessibleName('.tab-flagged')).toBe('Billing');
  });
});
