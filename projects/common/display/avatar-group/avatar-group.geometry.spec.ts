import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAvatar } from '../avatar/avatar.component';
import { CngxAvatarGroup } from './avatar-group.component';

// Runs in a real Chromium (the `test-geometry` target). Mounted under an RTL
// root so the `+N` order-fix is exercised: the box inherits direction:rtl and
// detaches the `+` to the right, so the pill must compute `direction: ltr` on
// top of `unicode-bidi: isolate`. An ltr mount would make the direction read
// vacuous.

@Component({
  standalone: true,
  imports: [CngxAvatarGroup, CngxAvatar],
  template: `
    <cngx-avatar-group [max]="3" label="teammates">
      @for (person of people(); track person) {
        <cngx-avatar [initials]="person" />
      }
    </cngx-avatar-group>
  `,
})
class AvatarGroupHost {
  people = signal(['AK', 'JD', 'MR', 'PL', 'ST']);
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AvatarGroupHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const pill = mountedRoot.querySelector('.cngx-avatar-group__overflow');
  if (!pill) {
    throw new Error('avatar-group overflow pill did not render');
  }
  return pill as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxAvatarGroup geometry (rtl)', () => {
  it('pins the +N overflow pill to isolate + direction:ltr under dir=rtl', () => {
    document.documentElement.dir = 'rtl';
    const pill = mount();
    expect(computedValue(pill, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(pill, 'direction')).toBe('ltr');
  });
});
