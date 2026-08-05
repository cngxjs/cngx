import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxTouchTarget } from './cngx-touch-target.directive';

describe('CngxTouchTarget', () => {
  it('reflects [cngxTouchTarget] onto the host [data-touch]', () => {
    @Component({ imports: [CngxTouchTarget], template: `<section cngxTouchTarget="on"></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-touch')).toBe('on');
  });

  it('leaves [data-touch] unset for a bare cngxTouchTarget attribute (empty-string -> undefined)', () => {
    @Component({ imports: [CngxTouchTarget], template: `<section cngxTouchTarget></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.hasAttribute('data-touch')).toBe(false);
  });

  it('a nested directive overrides an ancestor', () => {
    @Component({
      imports: [CngxTouchTarget],
      template: `<section cngxTouchTarget="on"><article cngxTouchTarget="off"></article></section>`,
    })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const outer = fixture.nativeElement.querySelector('section') as HTMLElement;
    const inner = fixture.nativeElement.querySelector('article') as HTMLElement;
    expect(outer.getAttribute('data-touch')).toBe('on');
    expect(inner.getAttribute('data-touch')).toBe('off');
  });
});
