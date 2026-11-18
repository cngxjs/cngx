import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxNavBadge, CngxNavGroup, CngxNavLabel, CngxNavLink } from '@cngx/common/interactive';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CngxSidenav } from './sidenav';

/**
 * Pins the class / attribute hooks that `sidenav.css` targets on the
 * `@cngx/common/interactive` nav directives. If a hook is renamed in
 * `@cngx/common`, this fails instead of silently breaking mini-mode and
 * active-state styling in the rail.
 */
@Component({
  template: `
    <cngx-sidenav mode="side">
      <span cngxNavLabel>Section</span>
      <a cngxNavLink [active]="true" href="#dashboard">Dashboard</a>
      <div cngxNavGroup>
        <a cngxNavLink href="#nested">Nested</a>
      </div>
      <a cngxNavLink href="#messages">Messages <span cngxNavBadge>3</span></a>
    </cngx-sidenav>
  `,
  imports: [CngxSidenav, CngxNavLink, CngxNavLabel, CngxNavGroup, CngxNavBadge],
})
class ContractHost {}

@Component({
  template: `
    <cngx-sidenav mode="side" [role]="role()" [ariaLabel]="label()">
      <a cngxNavLink href="#dashboard">Dashboard</a>
    </cngx-sidenav>
  `,
  imports: [CngxSidenav, CngxNavLink],
})
class LandmarkHost {
  readonly role = signal<string | null | undefined>(undefined);
  readonly label = signal<string | undefined>(undefined);
}

describe('CngxSidenav nav-class contract', () => {
  afterEach(() => vi.restoreAllMocks());

  async function setup() {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return { fixture, host };
  }

  it('emits the .cngx-nav-link class the rail CSS targets', async () => {
    const { host } = await setup();
    const links = host.querySelectorAll('a[cngxNavLink]');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link.classList.contains('cngx-nav-link')).toBe(true));
  });

  it('emits .cngx-nav-link--active on the active link', async () => {
    const { host } = await setup();
    const active = host.querySelector('a[href="#dashboard"]') as HTMLElement;
    expect(active.classList.contains('cngx-nav-link--active')).toBe(true);
  });

  it('populates [data-initial] after render for the mini-mode initial', async () => {
    const { host } = await setup();
    const active = host.querySelector('a[href="#dashboard"]') as HTMLElement;
    expect(active.dataset['initial']).toBe('D');
  });

  it('emits the label / group / badge host classes and attribute hooks', async () => {
    const { host } = await setup();

    const label = host.querySelector('[cngxNavLabel]') as HTMLElement;
    expect(label).not.toBeNull();
    expect(label.classList.contains('cngx-nav-label')).toBe(true);

    const group = host.querySelector('[cngxNavGroup]') as HTMLElement;
    expect(group).not.toBeNull();
    expect(group.classList.contains('cngx-nav-group')).toBe(true);

    const badge = host.querySelector('[cngxNavBadge]') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('cngx-nav-badge')).toBe(true);
  });
});

describe('CngxSidenav landmark', () => {
  function setup() {
    const fixture = TestBed.createComponent(LandmarkHost);
    fixture.detectChanges();
    const rail = (fixture.nativeElement as HTMLElement).querySelector(
      'cngx-sidenav',
    ) as HTMLElement;
    const set = (fn: (host: LandmarkHost) => void) => {
      fn(fixture.componentInstance);
      fixture.detectChanges();
    };
    return { rail, set };
  }

  it('is one navigation landmark named by position, without a nested nav element', () => {
    const { rail } = setup();
    expect(rail.getAttribute('role')).toBe('navigation');
    expect(rail.getAttribute('aria-label')).toBe('Navigation');
    expect(rail.querySelectorAll('nav, [role="navigation"]').length).toBe(0);
  });

  it('keeps a bound aria-label on the navigation landmark', () => {
    const { rail, set } = setup();
    set((h) => h.label.set('Main'));
    expect(rail.getAttribute('role')).toBe('navigation');
    expect(rail.getAttribute('aria-label')).toBe('Main');
  });

  it('lets a consumer role win and drops it again when unbound', () => {
    const { rail, set } = setup();
    set((h) => h.role.set('complementary'));
    expect(rail.getAttribute('role')).toBe('complementary');
    expect(rail.getAttribute('aria-label')).toBe('Navigation');
    set((h) => h.role.set(undefined));
    expect(rail.getAttribute('role')).toBe('navigation');
  });
});
