import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxNavIcon } from './nav-icon.directive';
import { CngxNavLink } from './nav-link.directive';

@Component({
  template: `
    <a cngxNavLink href="#inbox">
      <span cngxNavIcon>I</span>
      Inbox
    </a>
  `,
  imports: [CngxNavLink, CngxNavIcon],
})
class TestHost {}

function iconOf(): HTMLElement {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  return fixture.debugElement.query(By.directive(CngxNavIcon)).nativeElement as HTMLElement;
}

describe('CngxNavIcon', () => {
  it('marks the host as the row icon slot', () => {
    expect(iconOf().classList.contains('cngx-nav-icon')).toBe(true);
  });

  it('hides the icon from assistive technology, so the row text is the name', () => {
    expect(iconOf().getAttribute('aria-hidden')).toBe('true');
  });
});
