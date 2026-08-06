import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { resolvedToken, winningValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';
import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';

// Runs in a real Chromium (the `test-geometry` target). Guards the recorded
// mini-rail trap: `--cngx-sidenav-mini-width` is registered `inherits: true`
// precisely so the collapsed `.cngx-sidenav__body` (a descendant) reads the
// host-configured width for its `min-width` reserve instead of freezing at the
// 56px registered initial. `inherits: false` reintroduced the overflow bug the
// memory records; this asserts the configured width reaches the body.

@Component({
  selector: 'cngx-sidenav-geometry-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav mode="mini" [miniWidth]="'72px'" [expandOnHover]="false" ariaLabel="Nav">
        Nav
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
})
class SidenavHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): { host: HTMLElement; body: HTMLElement } {
  const fixture = TestBed.createComponent(SidenavHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-sidenav.cngx-sidenav--mini');
  const body = host?.querySelector('.cngx-sidenav__body');
  if (!host || !body) {
    throw new Error('mini cngx-sidenav did not render a body');
  }
  return { host: host as HTMLElement, body: body as HTMLElement };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxSidenav mini-rail geometry', () => {
  it('collapses to the mini rail without expanding', () => {
    const { host } = mount();
    expect(host.classList.contains('cngx-sidenav--mini')).toBe(true);
    expect(host.classList.contains('cngx-sidenav--expanded')).toBe(false);
  });

  it('inherits the configured mini-width down to the collapsed body', () => {
    const { body } = mount();
    // The token set on the host must reach the body; inherits: false would leave
    // it at the 56px registered initial.
    expect(resolvedToken(body, '--cngx-sidenav-mini-width')).toBe('72px');
    expect(parseFloat(winningValue(body, 'min-width'))).toBeCloseTo(72, 1);
  });
});
