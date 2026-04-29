import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxTagIcon } from './tag-icon.directive';

@Component({
  imports: [CngxTagIcon],
  template: `
    <svg cngxTagIcon viewBox="0 0 16 16" focusable="false" data-testid="svg-icon">
      <circle cx="8" cy="8" r="4" />
    </svg>
    <img cngxTagIcon src="data:image/png;base64," alt="" data-testid="img-icon" />
    <span cngxTagIcon data-testid="span-icon">should not match</span>
  `,
})
class IconHost {}

describe('CngxTagIcon', () => {
  it('(a) svg[cngxTagIcon] gets cngx-tag__icon class + aria-hidden="true"', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const host: SVGElement = fixture.nativeElement.querySelector('[data-testid="svg-icon"]');
    expect(host.classList.contains('cngx-tag__icon')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('(b) img[cngxTagIcon] gets cngx-tag__icon class + aria-hidden="true"', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const host: HTMLImageElement = fixture.nativeElement.querySelector('[data-testid="img-icon"]');
    expect(host.classList.contains('cngx-tag__icon')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('(c) selector contract: span[cngxTagIcon] does NOT match — no class, no aria-hidden', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="span-icon"]');
    expect(host.classList.contains('cngx-tag__icon')).toBe(false);
    expect(host.getAttribute('aria-hidden')).toBeNull();
  });
});
