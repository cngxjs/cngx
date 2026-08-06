import { TestBed } from '@angular/core/testing';
import { resolvedToken } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStatus, type StatusTone } from './status.component';

// Runs in a real Chromium (the `test-geometry` target): every read here is a
// resolved CSSOM value that jsdom returns as `''`.
//
// The strongest guard target in the repo - a token cascade that already broke
// once and was fixed in `fix(common/data): make CngxStatus dot-size and gap
// tokens inheritable (#250)` (commit 002e5f78). Nothing observed the fix until
// this spec: the resolved value is exactly what jsdom cannot see. It also
// covers the two recorded traps in their general form - a host-set token that
// must reach a descendant (inherits: false would freeze it) and a registered
// token whose fixed light initial must not defeat the dark-mode SET.

let mountedRoot: HTMLElement | null = null;

function mount(tone: StatusTone = 'neutral'): { host: HTMLElement; dot: HTMLElement } {
  const fixture = TestBed.createComponent(CngxStatus);
  fixture.componentRef.setInput('tone', tone);
  fixture.componentRef.setInput('label', 'Status');
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const dot = mountedRoot.querySelector('.cngx-status__dot');
  if (!dot) {
    throw new Error('cngx-status dot did not render');
  }
  return { host: mountedRoot, dot: dot as HTMLElement };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxStatus geometry', () => {
  it('sizes the dot from the registered dot-size default', () => {
    const { dot } = mount();
    expect(parseFloat(resolvedToken(dot, 'inline-size'))).toBeCloseTo(16, 1);
  });

  it('lets a host-set dot-size reach the dot - the #250 inherits contract', () => {
    // The regression: with `inherits: false` the descendant dot would ignore a
    // host-set token and stay at the 16px registered initial.
    const { host, dot } = mount();
    host.style.setProperty('--cngx-status-dot-size', '40px');
    expect(resolvedToken(dot, '--cngx-status-dot-size')).toBe('40px');
    expect(parseFloat(resolvedToken(dot, 'inline-size'))).toBeCloseTo(40, 1);
  });

  it('derives the gap from the space scale rather than the registered initial', () => {
    const { host } = mount();
    const before = parseFloat(resolvedToken(host, 'column-gap'));
    host.style.setProperty('--cngx-space-sm', '20px');
    const after = parseFloat(resolvedToken(host, 'column-gap'));
    expect(after).toBeCloseTo(20, 1);
    expect(after).not.toBeCloseTo(before, 1);
  });

  it('adapts the success dot to dark mode via the SET, not the light initial', () => {
    // A registered `<color>` token with a fixed light initial-value defeats any
    // use-site fallback, so dark mode has to SET it. If a future change dropped
    // that SET and leaned on a use-site fallback, the dot would stay light and
    // this divergence would vanish.
    const { host, dot } = mount('success');
    host.setAttribute('data-color-scheme', 'light');
    const light = resolvedToken(dot, 'background-color');
    host.setAttribute('data-color-scheme', 'dark');
    const dark = resolvedToken(dot, 'background-color');
    expect(light).not.toBe('');
    expect(dark).not.toBe('');
    expect(dark).not.toBe(light);
  });
});
