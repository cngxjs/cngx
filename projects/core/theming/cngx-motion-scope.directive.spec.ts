import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxMotionScope } from './cngx-motion-scope.directive';

describe('CngxMotionScope', () => {
  it('reflects [cngxMotionScope] onto the host [data-motion]', () => {
    @Component({ imports: [CngxMotionScope], template: `<section cngxMotionScope="reduced"></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-motion')).toBe('reduced');
  });

  it('leaves [data-motion] unset for a bare cngxMotionScope attribute (empty-string -> undefined)', () => {
    @Component({ imports: [CngxMotionScope], template: `<section cngxMotionScope></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.hasAttribute('data-motion')).toBe(false);
  });

  it('a nested directive overrides an ancestor', () => {
    @Component({
      imports: [CngxMotionScope],
      template: `<section cngxMotionScope="reduced"><article cngxMotionScope="full"></article></section>`,
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const outer = fixture.nativeElement.querySelector('section') as HTMLElement;
    const inner = fixture.nativeElement.querySelector('article') as HTMLElement;
    expect(outer.getAttribute('data-motion')).toBe('reduced');
    expect(inner.getAttribute('data-motion')).toBe('full');
  });
  it('follows a runtime change of the bound value and removes the attribute for undefined', () => {
    @Component({ imports: [CngxMotionScope], template: `<section [cngxMotionScope]="value()"></section>` })
    class Host {
      readonly value = signal<'reduced' | 'full' | undefined>('reduced');
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-motion')).toBe('reduced');

    fixture.componentInstance.value.set('full');
    fixture.detectChanges();
    expect(section.getAttribute('data-motion')).toBe('full');

    fixture.componentInstance.value.set(undefined);
    fixture.detectChanges();
    expect(section.hasAttribute('data-motion')).toBe(false);
  });
});
