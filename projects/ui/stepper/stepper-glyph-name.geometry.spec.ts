import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStepper } from './stepper.component';

// Runs in a real Chromium (the `test-geometry` target). The chevron, chips and
// breadcrumb skins draw the done / errored status and the breadcrumb separator
// as `::before` / `::after` content of the step header. Without CSS alt text
// Chromium folds those glyphs into the header's accessible name; the status
// they carry is spoken by the header's status text instead.

@Component({
  selector: 'cngx-stepper-glyph-name-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  template: `
    <div [attr.dir]="dir()">
      <cngx-stepper aria-label="Wizard" [skin]="skin()" [activeStepIndex]="2">
        <div cngxStep label="Account" [completed]="true"></div>
        <div cngxStep label="Payment" [error]="true"></div>
        <div cngxStep label="Review"></div>
      </cngx-stepper>
    </div>
  `,
})
class GlyphNameHost {
  readonly skin = input<'path-chevron' | 'chips' | 'breadcrumb'>('chips');
  readonly dir = input<'ltr' | 'rtl'>('ltr');
}

let mountedRoot: HTMLElement | null = null;

function mount(skin: 'path-chevron' | 'chips' | 'breadcrumb', dir: 'ltr' | 'rtl' = 'ltr'): void {
  const fixture = TestBed.createComponent(GlyphNameHost);
  fixture.componentRef.setInput('skin', skin);
  fixture.componentRef.setInput('dir', dir);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
}

function header(index: number): HTMLElement {
  return mountedRoot!.querySelectorAll<HTMLElement>('button.cngx-stepper__step')[index];
}

function label(index: number): Element {
  return header(index).querySelector('.cngx-stepper__label')!;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('stepper status glyphs', () => {
  it('stay visible', () => {
    mount('chips');
    expect(getComputedStyle(label(0), '::before').content).toContain('✓');
    expect(getComputedStyle(label(1), '::before').content).toContain('!');
  });

  for (const skin of ['path-chevron', 'chips', 'breadcrumb'] as const) {
    it(`keep the ${skin} glyphs out of the step names`, async () => {
      mount(skin);
      const done = await accessibleName(`#${header(0).id}`);
      const errored = await accessibleName(`#${header(1).id}`);
      expect(done).not.toMatch(/[✓!›]/);
      expect(errored).not.toMatch(/[✓!›]/);
      expect(done).toContain('Done');
      expect(errored).toContain('Errored');
    });
  }
});

describe('breadcrumb separator', () => {
  it('points in reading direction', () => {
    mount('breadcrumb');
    expect(getComputedStyle(header(0), '::after').content).toContain('›');
  });

  it('mirrors under dir="rtl"', () => {
    mount('breadcrumb', 'rtl');
    expect(getComputedStyle(header(0), '::after').content).toContain('‹');
  });
});
