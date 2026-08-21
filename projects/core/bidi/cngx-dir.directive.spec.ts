import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxDir } from './cngx-dir.directive';

describe('CngxDir', () => {
  it('reflects [cngxDir] onto the host [dir]', () => {
    @Component({ imports: [CngxDir], template: `<section cngxDir="rtl"></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('dir')).toBe('rtl');
  });

  it('leaves [dir] unset for a bare cngxDir attribute (empty-string -> undefined)', () => {
    @Component({ imports: [CngxDir], template: `<section cngxDir></section>` })
    class Host {}
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.hasAttribute('dir')).toBe(false);
  });

  it('updates the host [dir] when the bound value changes', () => {
    @Component({
      imports: [CngxDir],
      template: `<section [cngxDir]="dir()"></section>`,
    })
    class Host {
      readonly dir = signal<'ltr' | 'rtl'>('rtl');
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('dir')).toBe('rtl');

    fixture.componentInstance.dir.set('ltr');
    fixture.detectChanges();
    expect(section.getAttribute('dir')).toBe('ltr');
  });
});
