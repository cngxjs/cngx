import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxIcon } from './icon.component';

@Component({
  template: `<cngx-icon [label]="label()" [size]="size()">star</cngx-icon>`,
  imports: [CngxIcon],
})
class IconHost {
  readonly label = signal<string | undefined>(undefined);
  readonly size = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
}

describe('CngxIcon', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [IconHost] }));

  function setup(): { fixture: ReturnType<typeof TestBed.createComponent<IconHost>>; el: HTMLElement } {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return {
      fixture,
      el: fixture.debugElement.query(By.directive(CngxIcon)).nativeElement as HTMLElement,
    };
  }

  it('is decorative by default (aria-hidden, no role)', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('becomes informative when label is set', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.label.set('Favorite');
    fixture.detectChanges();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Favorite');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  it('toggles size modifier class', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(el.classList.contains('cngx-icon--lg')).toBe(true);
    expect(el.classList.contains('cngx-icon--md')).toBe(false);
    fixture.componentInstance.size.set('md');
    fixture.detectChanges();
    expect(el.classList.contains('cngx-icon--md')).toBe(true);
  });

  it('projects content', () => {
    const { el } = setup();
    expect(el.textContent?.trim()).toBe('star');
  });
});
