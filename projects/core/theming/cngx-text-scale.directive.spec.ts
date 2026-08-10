import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxTextScale } from './cngx-text-scale.directive';

describe('CngxTextScale', () => {
  it('reflects [cngxTextScale] onto the host [data-text-size]', () => {
    @Component({ imports: [CngxTextScale], template: `<section cngxTextScale="lg"></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-text-size')).toBe('lg');
  });

  it('leaves [data-text-size] unset for a bare cngxTextScale attribute (empty-string -> undefined)', () => {
    @Component({ imports: [CngxTextScale], template: `<section cngxTextScale></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.hasAttribute('data-text-size')).toBe(false);
  });

  it('a nested directive overrides an ancestor', () => {
    @Component({
      imports: [CngxTextScale],
      template: `<section cngxTextScale="sm"><article cngxTextScale="lg"></article></section>`,
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const outer = fixture.nativeElement.querySelector('section') as HTMLElement;
    const inner = fixture.nativeElement.querySelector('article') as HTMLElement;
    expect(outer.getAttribute('data-text-size')).toBe('sm');
    expect(inner.getAttribute('data-text-size')).toBe('lg');
  });
});
