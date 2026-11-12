import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxNavLabel, CngxNavLink } from '@cngx/common/interactive';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';
import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';

// Runs in a real Chromium (the `test-geometry` target). The nav row skin
// (cngx-nav.css) draws a link's first letter as `::before` content in the icon
// box, and the mini rail pushes the link text past the clipped row end; the
// text stays in the accessibility tree. Without CSS alt
// text Chromium folds the initial into the link name ("D Dashboard").

@Component({
  selector: 'cngx-sidenav-initial-name-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxNavLink],
  styleUrls: ['../../core/theming/layers.css', '../../common/theming/components/cngx-nav.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav
        mode="side"
        [collapsed]="true"
        [miniWidth]="'72px'"
        [expandOnHover]="false"
        ariaLabel="Nav"
      >
        <a cngxNavLink class="initial-link" href="#dashboard">Dashboard</a>
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
})
class InitialNameHost {}

@Component({
  selector: 'cngx-sidenav-collapse-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxNavLabel, CngxNavLink],
  styleUrls: ['../../core/theming/layers.css', '../../common/theming/components/cngx-nav.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav mode="side" [collapsed]="collapsed()" [expandOnHover]="false" ariaLabel="Nav">
        <span cngxNavLabel class="section">Main</span>
        <a cngxNavLink class="row" href="#dashboard">Dashboard</a>
        <a cngxNavLink class="row" href="#inbox">Inbox</a>
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
})
class CollapseHost {
  readonly collapsed = signal(false);
}

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

describe('sidenav rail collapse', () => {
  it('keeps every row at its y and height, and the section label box, when the rail collapses', () => {
    const fixture = TestBed.createComponent(CollapseHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const boxes = () =>
      Array.from(mountedRoot!.querySelectorAll<HTMLElement>('.row, .section')).map((el) => {
        const box = el.getBoundingClientRect();
        return [Math.round(box.top), Math.round(box.height)];
      });
    const expanded = boxes();
    fixture.componentInstance.collapsed.set(true);
    fixture.detectChanges();
    expect(mountedRoot.querySelector('cngx-sidenav')!.getAttribute('data-sidebar-state')).toBe(
      'rail',
    );
    expect(boxes()).toEqual(expanded);
  });
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
