import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxNavGroup } from './nav-group.directive';

@Component({
  template: `
    <button
      cngxNavGroup
      #group="cngxNavGroup"
      [controls]="'group-content'"
      [depth]="depth()"
      id="group-label"
    >
      Settings
    </button>
    @if (group.disclosure.opened()) {
      <div id="group-content" role="group" [attr.aria-labelledby]="'group-label'">
        <a>General</a>
        <a>Security</a>
      </div>
    }
  `,
  imports: [CngxNavGroup],
})
class TestHost {
  depth = signal(0);
}

describe('CngxNavGroup', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.directive(CngxNavGroup));
    const dir = btn.injector.get(CngxNavGroup);
    const el = btn.nativeElement as HTMLElement;
    return { fixture, dir, el, host: fixture.componentInstance };
  }

  it('has cngx-nav-group class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-nav-group')).toBe(true);
  });

  it('starts closed', () => {
    const { dir } = setup();
    expect(dir.disclosure.opened()).toBe(false);
  });

  it('opens on click via composed CngxDisclosure', () => {
    const { fixture, dir, el } = setup();
    el.click();
    fixture.detectChanges();
    expect(dir.disclosure.opened()).toBe(true);
    expect(el.classList.contains('cngx-nav-group--open')).toBe(true);
  });

  it('sets aria-expanded via CngxDisclosure', () => {
    const { fixture, el } = setup();
    expect(el.getAttribute('aria-expanded')).toBe('false');
    el.click();
    fixture.detectChanges();
    expect(el.getAttribute('aria-expanded')).toBe('true');
  });

  it('sets aria-controls via CngxDisclosure', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-controls')).toBe('group-content');
  });

  it('sets --cngx-nav-depth CSS variable', () => {
    const { fixture, el, host } = setup();
    expect(el.style.getPropertyValue('--cngx-nav-depth')).toBe('0');
    host.depth.set(1);
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--cngx-nav-depth')).toBe('1');
  });

  it('renders content when opened', () => {
    const { fixture, el } = setup();
    expect(fixture.debugElement.query(By.css('#group-content'))).toBeNull();
    el.click();
    fixture.detectChanges();
    const content = fixture.debugElement.query(By.css('#group-content'));
    expect(content).not.toBeNull();
    expect(content.nativeElement.getAttribute('role')).toBe('group');
    expect(content.nativeElement.getAttribute('aria-labelledby')).toBe('group-label');
  });
});
