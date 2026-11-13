import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxDensity } from './cngx-density.directive';

describe('CngxDensity', () => {
  it('reflects [cngxDensity] onto the host [data-density]', () => {
    @Component({ imports: [CngxDensity], template: `<section cngxDensity="compact"></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-density')).toBe('compact');
  });

  it('leaves [data-density] unset for a bare cngxDensity attribute (empty-string -> undefined)', () => {
    @Component({ imports: [CngxDensity], template: `<section cngxDensity></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.hasAttribute('data-density')).toBe(false);
  });

  it('a nested directive overrides an ancestor', () => {
    @Component({
      imports: [CngxDensity],
      template: `<section cngxDensity="compact"><article cngxDensity="spacious"></article></section>`,
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const outer = fixture.nativeElement.querySelector('section') as HTMLElement;
    const inner = fixture.nativeElement.querySelector('article') as HTMLElement;
    expect(outer.getAttribute('data-density')).toBe('compact');
    expect(inner.getAttribute('data-density')).toBe('spacious');
  });
  it('follows a runtime change of the bound value and removes the attribute for undefined', () => {
    @Component({ imports: [CngxDensity], template: `<section [cngxDensity]="value()"></section>` })
    class Host {
      readonly value = signal<'compact' | 'spacious' | undefined>('compact');
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-density')).toBe('compact');

    fixture.componentInstance.value.set('spacious');
    fixture.detectChanges();
    expect(section.getAttribute('data-density')).toBe('spacious');

    fixture.componentInstance.value.set(undefined);
    fixture.detectChanges();
    expect(section.hasAttribute('data-density')).toBe(false);
  });
});
