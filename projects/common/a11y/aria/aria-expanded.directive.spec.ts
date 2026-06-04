import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxAriaExpanded } from './aria-expanded.directive';

@Component({
  template: `<button [cngxAriaExpanded]="open()" [controls]="controlsId()">Toggle</button>`,
  imports: [CngxAriaExpanded],
})
class TestHost {
  open = signal(false);
  controlsId = signal<string | undefined>(undefined);
}

describe('CngxAriaExpanded', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    return { fixture, el, host: fixture.componentInstance };
  }

  it('sets aria-expanded=false by default', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-expanded')).toBe('false');
  });

  it('sets aria-expanded=true when expanded is true', () => {
    const { fixture, el, host } = setup();
    host.open.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-expanded')).toBe('true');
  });

  it('does not set aria-controls when controls is undefined', () => {
    const { el } = setup();
    expect(el.hasAttribute('aria-controls')).toBe(false);
  });

  it('sets aria-controls when controls is provided', () => {
    const { fixture, el, host } = setup();
    host.controlsId.set('my-panel');
    fixture.detectChanges();
    expect(el.getAttribute('aria-controls')).toBe('my-panel');
  });
});
