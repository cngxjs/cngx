import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNGX_ARIA_EXPANDED_DRIVER, CngxAriaExpanded } from './aria-expanded.directive';

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

@Component({
  template: `<button cngxAriaExpanded>Toggle</button>`,
  imports: [CngxAriaExpanded],
})
class BareHost {}

describe('CngxAriaExpanded bare attribute', () => {
  it('reads the bare attribute as expanded', () => {
    TestBed.configureTestingModule({ imports: [BareHost] });
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('button')).nativeElement as HTMLElement;
    expect(el.getAttribute('aria-expanded')).toBe('true');
  });
});

const driven = signal<boolean | null>(true);

@Directive({
  selector: '[testExpandedDriver]',
  hostDirectives: [{ directive: CngxAriaExpanded, inputs: ['cngxAriaExpanded'] }],
  providers: [{ provide: CNGX_ARIA_EXPANDED_DRIVER, useExisting: TestExpandedDriver }],
})
class TestExpandedDriver {
  readonly ariaExpanded = driven.asReadonly();
}

@Component({
  template: `<button testExpandedDriver [cngxAriaExpanded]="false">Toggle</button>`,
  imports: [TestExpandedDriver],
})
class DriverHost {}

describe('CngxAriaExpanded driver', () => {
  it('writes the driver value over the input and omits the attribute on null', () => {
    TestBed.configureTestingModule({ imports: [DriverHost] });
    const fixture = TestBed.createComponent(DriverHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('button')).nativeElement as HTMLElement;
    expect(el.getAttribute('aria-expanded')).toBe('true');

    driven.set(null);
    fixture.detectChanges();
    expect(el.hasAttribute('aria-expanded')).toBe(false);
    driven.set(true);
  });
});
