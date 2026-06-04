import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxNavLabel } from './nav-label.directive';

@Component({
  template: `<span cngxNavLabel [heading]="heading()" [level]="level()">Section</span>`,
  imports: [CngxNavLabel],
})
class TestHost {
  heading = signal(false);
  level = signal(3);
}

describe('CngxNavLabel', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxNavLabel)).nativeElement as HTMLElement;
    return { fixture, el, host: fixture.componentInstance };
  }

  it('has cngx-nav-label class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-nav-label')).toBe(true);
  });

  it('does not set role="heading" by default', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBeNull();
  });

  it('does not set aria-level by default', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-level')).toBeNull();
  });

  it('sets role="heading" when opted in', () => {
    const { fixture, el, host } = setup();
    host.heading.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('role')).toBe('heading');
  });

  it('sets aria-level when heading is true', () => {
    const { fixture, el, host } = setup();
    host.heading.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-level')).toBe('3');
  });

  it('respects custom level', () => {
    const { fixture, el, host } = setup();
    host.heading.set(true);
    host.level.set(4);
    fixture.detectChanges();
    expect(el.getAttribute('aria-level')).toBe('4');
  });
});
