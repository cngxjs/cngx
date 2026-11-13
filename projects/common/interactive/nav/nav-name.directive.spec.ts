import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxNavName } from './nav-name.directive';

@Component({
  template: `<span cngxNavName class="attr">Acme</span>`,
  imports: [CngxNavName],
})
class TestHost {}

function render(): HTMLElement {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('CngxNavName', () => {
  it('marks the host with the cngx-nav-name class', () => {
    expect(render().querySelector('.attr')?.classList.contains('cngx-nav-name')).toBe(true);
  });

  it('leaves the name in the accessibility tree', () => {
    expect(render().querySelector('.attr')?.hasAttribute('aria-hidden')).toBe(false);
  });
});
