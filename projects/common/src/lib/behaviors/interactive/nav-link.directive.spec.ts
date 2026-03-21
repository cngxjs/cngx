import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxNavLink } from './nav-link.directive';

@Component({
  template: `<a cngxNavLink [active]="active()" [depth]="depth()">Link</a>`,
  imports: [CngxNavLink],
})
class TestHost {
  active = signal(false);
  depth = signal(0);
}

describe('CngxNavLink', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxNavLink)).nativeElement as HTMLElement;
    return { fixture, el, host: fixture.componentInstance };
  }

  it('has cngx-nav-link class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-nav-link')).toBe(true);
  });

  it('adds active class when active', () => {
    const { fixture, el, host } = setup();
    expect(el.classList.contains('cngx-nav-link--active')).toBe(false);
    host.active.set(true);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-nav-link--active')).toBe(true);
  });

  it('sets --cngx-nav-depth CSS variable', () => {
    const { fixture, el, host } = setup();
    expect(el.style.getPropertyValue('--cngx-nav-depth')).toBe('0');
    host.depth.set(2);
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--cngx-nav-depth')).toBe('2');
  });
});
