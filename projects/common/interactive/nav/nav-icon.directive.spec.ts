import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxIcon } from '@cngx/common/display';

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

@Component({
  template: `
    <a cngxNavLink href="#inbox">
      <cngx-icon cngxNavIcon label="Inbox icon">I</cngx-icon>
      Inbox
    </a>
  `,
  imports: [CngxNavLink, CngxNavIcon, CngxIcon],
})
class LabelledIconHost {}

describe('CngxNavIcon on a labelled cngx-icon', () => {
  it('keeps the icon hidden, so its label never joins the row name', () => {
    const fixture = TestBed.createComponent(LabelledIconHost);
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.directive(CngxNavIcon)).nativeElement as HTMLElement;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
