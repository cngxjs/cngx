import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxTabLink, type CngxTabsSkin } from '@cngx/common/tabs';

import { CngxTabNav } from './tab-nav.component';

@Component({
  standalone: true,
  selector: 'nav-host',
  imports: [CngxTabNav, CngxTabLink],
  template: `
    <cngx-tab-nav [activeIndex]="active()" [skin]="skin()" aria-label="Sections">
      <a cngxTabLink id="overview" [label]="'Overview'">Overview</a>
      <a cngxTabLink id="profile" [label]="'Profile'" [error]="profileError()">Profile</a>
    </cngx-tab-nav>
  `,
})
class NavHost {
  readonly active = signal(0);
  readonly skin = signal<CngxTabsSkin | undefined>(undefined);
  readonly profileError = signal<string | boolean>(false);
}

describe('CngxTabNav', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<NavHost>>;
    navEl: HTMLElement;
    anchor: (i: number) => HTMLAnchorElement;
    liveRegion: HTMLElement;
  } {
    const fixture = TestBed.createComponent(NavHost);
    fixture.detectChanges();
    const navEl = fixture.debugElement.query(By.css('cngx-tab-nav')).nativeElement as HTMLElement;
    const anchors = fixture.debugElement
      .queryAll(By.directive(CngxTabLink))
      .map((d) => d.nativeElement as HTMLAnchorElement);
    return {
      fixture,
      navEl,
      anchor: (i) => anchors[i],
      liveRegion: navEl.querySelector('.cngx-tab-nav__live-region') as HTMLElement,
    };
  }

  it('is a role=navigation landmark with an accessible name', () => {
    const { navEl } = setup();
    expect(navEl.getAttribute('role')).toBe('navigation');
    expect(navEl.getAttribute('aria-label')).toBe('Sections');
  });

  it('renders no tab / tablist roles anywhere in the tree', () => {
    const { navEl } = setup();
    expect(navEl.querySelector('[role="tab"]')).toBeNull();
    expect(navEl.querySelector('[role="tablist"]')).toBeNull();
  });

  it('projects <a cngxTabLink> children and drives aria-current from activeIndex', () => {
    const { fixture, anchor } = setup();
    expect(anchor(0).getAttribute('aria-current')).toBe('page');
    expect(anchor(1).getAttribute('aria-current')).toBeNull();

    fixture.componentInstance.active.set(1);
    fixture.detectChanges();
    expect(anchor(0).getAttribute('aria-current')).toBeNull();
    expect(anchor(1).getAttribute('aria-current')).toBe('page');
  });

  it('reflects the resolved skin cascade onto [data-skin]', () => {
    const { fixture, navEl } = setup();
    expect(navEl.getAttribute('data-skin')).toBe('line');
    fixture.componentInstance.skin.set('pill');
    fixture.detectChanges();
    expect(navEl.getAttribute('data-skin')).toBe('pill');
  });

  it('reflects [skin]="pill-outline" onto [data-skin]', () => {
    const { fixture, navEl } = setup();
    fixture.componentInstance.skin.set('pill-outline');
    fixture.detectChanges();
    expect(navEl.getAttribute('data-skin')).toBe('pill-outline');
  });

  it('reflects [skin]="segmented" onto [data-skin]', () => {
    const { fixture, navEl } = setup();
    fixture.componentInstance.skin.set('segmented');
    fixture.detectChanges();
    expect(navEl.getAttribute('data-skin')).toBe('segmented');
  });

  it('the live-region span carries the active link label', () => {
    const { fixture, liveRegion } = setup();
    expect(liveRegion.getAttribute('role')).toBe('status');
    expect(liveRegion.textContent?.trim()).toBe('Overview');

    fixture.componentInstance.active.set(1);
    fixture.detectChanges();
    expect(liveRegion.textContent?.trim()).toBe('Profile');
  });

  it('marks an errored link with aria-invalid + the --error class', () => {
    const { fixture, anchor } = setup();
    expect(anchor(1).getAttribute('aria-invalid')).toBeNull();
    fixture.componentInstance.profileError.set(true);
    fixture.detectChanges();
    expect(anchor(1).getAttribute('aria-invalid')).toBe('true');
    expect(anchor(1).classList.contains('cngx-tab-nav__link--error')).toBe(true);
  });
});
