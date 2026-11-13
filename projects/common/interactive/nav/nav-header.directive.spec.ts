import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxNavHeader } from './nav-header.directive';

@Component({
  template: `<cngx-nav-header class="el">Acme</cngx-nav-header>
    <header cngxNavHeader class="attr">Acme</header>`,
  imports: [CngxNavHeader],
})
class TestHost {}

function render(): HTMLElement {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('CngxNavHeader', () => {
  it('styles the element form and the attribute form alike', () => {
    const root = render();
    expect(root.querySelector('.el')?.classList.contains('cngx-nav-header')).toBe(true);
    expect(root.querySelector('.attr')?.classList.contains('cngx-nav-header')).toBe(true);
  });
});
