import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';

@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenavContent],
})
class InLayoutHost {}

@Component({
  template: `<cngx-sidenav-content>Main</cngx-sidenav-content>`,
  imports: [CngxSidenavContent],
})
class OrphanHost {}

describe('CngxSidenavContent', () => {
  it('renders inside a sidenav layout', () => {
    const fixture = TestBed.createComponent(InLayoutHost);
    fixture.detectChanges();
    const content: HTMLElement = fixture.nativeElement.querySelector('cngx-sidenav-content');
    expect(content.textContent?.trim()).toBe('Main');
  });

  it('throws CNGX3014 outside a sidenav layout', () => {
    expect(() => TestBed.createComponent(OrphanHost)).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX3014',
        message: expect.stringMatching(
          /^CNGX3014: \[cngx-sidenav-content\] must be placed inside <cngx-sidenav-layout>\./,
        ),
      }),
    );
  });
});
