import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxMeta } from './meta.component';
import { CngxMetaList } from './meta-list.component';

@Component({
  imports: [CngxMetaList, CngxMeta],
  template: `
    <cngx-meta-list>
      <cngx-meta term="trace">9f31c0d4</cngx-meta>
      <cngx-meta>value-only</cngx-meta>
    </cngx-meta-list>
  `,
})
class Host {}

function render(): HTMLElement {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('CngxMeta / CngxMetaList', () => {
  it('renders the term before the projected value', () => {
    const el = render();
    const first = el.querySelector('cngx-meta')!;
    expect(first.querySelector('.cngx-meta__term')?.textContent?.trim()).toBe('trace');
    expect(first.querySelector('.cngx-meta__value')?.textContent?.trim()).toBe('9f31c0d4');
  });

  it('omits the term span when no term is given', () => {
    const valueOnly = render().querySelectorAll('cngx-meta')[1];
    expect(valueOnly.querySelector('.cngx-meta__term')).toBeNull();
    expect(valueOnly.querySelector('.cngx-meta__value')?.textContent?.trim()).toBe('value-only');
  });

  it('lays out its projected items on the meta-list host', () => {
    const list = render().querySelector('cngx-meta-list')!;
    expect(list.querySelectorAll('cngx-meta').length).toBe(2);
  });
});
