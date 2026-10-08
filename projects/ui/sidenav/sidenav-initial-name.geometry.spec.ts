import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxNavLink } from '@cngx/common/interactive';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';
import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';

// Runs in a real Chromium (the `test-geometry` target). The mini rail shows a
// link's first letter as `::before` content and shrinks the link text to
// `font-size: 0`; the text stays in the accessibility tree. Without CSS alt
// text Chromium folds the initial into the link name ("D Dashboard").

@Component({
  selector: 'cngx-sidenav-initial-name-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxNavLink],
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav mode="mini" [miniWidth]="'72px'" [expandOnHover]="false" ariaLabel="Nav">
        <a cngxNavLink class="initial-link" href="#dashboard">Dashboard</a>
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
})
class InitialNameHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(InitialNameHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot.querySelector<HTMLElement>('.initial-link')!;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('sidenav mini-rail initial', () => {
  it('stays visible', () => {
    const link = mount();
    expect(getComputedStyle(link, '::before').content).toContain('D');
  });

  it('stays out of the link name', async () => {
    mount();
    expect(await accessibleName('.initial-link')).toBe('Dashboard');
  });
});
