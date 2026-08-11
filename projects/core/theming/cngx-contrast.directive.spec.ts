import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxContrast } from './cngx-contrast.directive';

describe('CngxContrast', () => {
  it('reflects [cngxContrast] onto the host [data-contrast]', () => {
    @Component({ imports: [CngxContrast], template: `<section cngxContrast="more"></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-contrast')).toBe('more');
  });

  it('leaves [data-contrast] unset for a bare cngxContrast attribute (empty-string -> undefined)', () => {
    @Component({ imports: [CngxContrast], template: `<section cngxContrast></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.hasAttribute('data-contrast')).toBe(false);
  });

  it('a nested directive overrides an ancestor', () => {
    @Component({
      imports: [CngxContrast],
      template: `<section cngxContrast="more"><article cngxContrast="normal"></article></section>`,
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const outer = fixture.nativeElement.querySelector('section') as HTMLElement;
    const inner = fixture.nativeElement.querySelector('article') as HTMLElement;
    expect(outer.getAttribute('data-contrast')).toBe('more');
    expect(inner.getAttribute('data-contrast')).toBe('normal');
  });
});
