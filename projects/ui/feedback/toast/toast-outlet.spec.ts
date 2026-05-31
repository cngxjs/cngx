import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideToasts } from './toast.service';
import { CngxToastOutlet } from './toast-outlet';

@Component({
  template: `<cngx-toast-outlet />`,
  imports: [CngxToastOutlet],
})
class TestHost {}

describe('CngxToastOutlet', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideToasts()],
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const outletEl: HTMLElement = fixture.nativeElement.querySelector('cngx-toast-outlet');
    return { fixture, outletEl };
  }

  it('renders with the cngx-toast-outlet host class and Notifications landmark', () => {
    const { outletEl } = setup();
    expect(outletEl.classList.contains('cngx-toast-outlet')).toBe(true);
    expect(outletEl.getAttribute('role')).toBe('region');
    expect(outletEl.getAttribute('aria-label')).toBe('Notifications');
  });

  it('pins the dismiss close-button with flex-shrink: 0 to survive narrow widths', () => {
    setup();

    const styleText = Array.from(document.querySelectorAll('style'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(styleText).toMatch(/\.cngx-toast__dismiss\s*\{[^}]*flex-shrink:\s*0/);
  });
});
