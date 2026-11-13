import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxNavMark } from './nav-mark.directive';

@Component({
  template: `<span cngxNavMark class="attr">A</span>`,
  imports: [CngxNavMark],
})
class TestHost {}

function render(): HTMLElement {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('CngxNavMark', () => {
  it('marks the host with the cngx-nav-mark class', () => {
    expect(render().querySelector('.attr')?.classList.contains('cngx-nav-mark')).toBe(true);
  });

  it('hides the mark from assistive technology, so the name beside it is read', () => {
    expect(render().querySelector('.attr')?.getAttribute('aria-hidden')).toBe('true');
  });
});
