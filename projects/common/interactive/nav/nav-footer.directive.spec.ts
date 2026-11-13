import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxNavFooter } from './nav-footer.directive';

@Component({
  template: `<cngx-nav-footer class="el">v1</cngx-nav-footer>
    <footer cngxNavFooter class="attr">v1</footer>`,
  imports: [CngxNavFooter],
})
class TestHost {}

function render(): HTMLElement {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('CngxNavFooter', () => {
  it('styles the element form and the attribute form alike', () => {
    const root = render();
    expect(root.querySelector('.el')?.classList.contains('cngx-nav-footer')).toBe(true);
    expect(root.querySelector('.attr')?.classList.contains('cngx-nav-footer')).toBe(true);
  });
});
