import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';
import { CNGX_SIDENAV } from './sidenav-token';

@Component({
  template: `<cngx-sidenav [mode]="'over'">x</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class Host {}

describe('CNGX_SIDENAV token', () => {
  it('resolves via useExisting to the CngxSidenav instance', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxSidenav));
    const contract = de.injector.get(CNGX_SIDENAV);
    expect(contract).toBe(de.componentInstance as CngxSidenav);
  });

  it('exposes a writable opened and a readonly isOverlay on the contract', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const contract = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CNGX_SIDENAV);

    expect(contract.isOverlay()).toBe(true);
    contract.opened.set(true);
    expect(contract.opened()).toBe(true);
  });
});
