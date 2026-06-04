import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxDivider } from './divider.directive';

@Component({
  template: `<cngx-divider [orientation]="orientation()" [inset]="inset()"></cngx-divider>`,
  imports: [CngxDivider],
})
class DividerHost {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly inset = signal(false);
}

describe('CngxDivider', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [DividerHost] }));

  function setup(): { fixture: ReturnType<typeof TestBed.createComponent<DividerHost>>; el: HTMLElement } {
    const fixture = TestBed.createComponent(DividerHost);
    fixture.detectChanges();
    return {
      fixture,
      el: fixture.debugElement.query(By.directive(CngxDivider)).nativeElement as HTMLElement,
    };
  }

  it('sets role="separator" on host', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('separator');
  });

  it('defaults orientation to horizontal', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.classList.contains('cngx-divider--vertical')).toBe(false);
  });

  it('switches to vertical orientation', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.classList.contains('cngx-divider--vertical')).toBe(true);
  });

  it('toggles inset modifier', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.inset.set(true);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-divider--inset')).toBe(true);
  });
});
