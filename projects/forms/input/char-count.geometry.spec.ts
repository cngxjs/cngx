import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { CngxFormField, type CngxFieldAccessor } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxInput } from './input.directive';
import { CngxCharCount } from './char-count.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root: "12/100" is a raw ASCII ratio, definitionally LTR (bucket B). The host
// stays `display: contents` (no box), so the forced LTR island lives on the
// span that actually renders the ratio and must compute `unicode-bidi: isolate`
// AND `direction: ltr` - asserting the resolved `direction` on the span (not
// just the property) is the order proof that the count stays before the max.
// The `display: contents` host has no box to isolate, which is why the island
// lives on the span. jsdom reports `''`.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxFormField, CngxInput, CngxCharCount],
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput />
      <cngx-char-count [max]="100" />
    </cngx-form-field>
  `,
})
class CharCountHost {
  readonly field = signal<CngxFieldAccessor>(createMockField({ name: 'bio', maxLength: 100 }).accessor);
}

async function mountSpan(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(CharCountHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  await fixture.whenStable();
  fixture.detectChanges();
  const span = mountedRoot.querySelector('.cngx-char-count__readout');
  if (!span) {
    throw new Error('cngx-char-count readout span did not render');
  }
  return span as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxCharCount geometry (rtl)', () => {
  it('forces a LTR island on the ratio readout under dir=rtl (bucket B)', async () => {
    document.documentElement.dir = 'rtl';
    const span = await mountSpan();
    expect(computedValue(span, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(span, 'direction')).toBe('ltr');
  });
});
