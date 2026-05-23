import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxPopoverDivider } from './popover-divider.directive';

@Component({
  template: `<span id="div" cngxPopoverDivider></span>`,
  imports: [CngxPopoverDivider],
})
class DefaultHost {}

@Component({
  template: `<span id="div" cngxPopoverDivider orientation="vertical" [inset]="true"></span>`,
  imports: [CngxPopoverDivider],
})
class ConfiguredHost {}

function setup<T>(hostType: new () => T) {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('#div') as HTMLElement;
  return { fixture, el };
}

describe('CngxPopoverDivider', () => {
  it('inherits role="separator" + aria-orientation from CngxDivider hostDirective', () => {
    const { el } = setup(DefaultHost);
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('carries both the cngx-divider and cngx-popover-divider host classes', () => {
    const { el } = setup(DefaultHost);
    expect(el.classList.contains('cngx-divider')).toBe(true);
    expect(el.classList.contains('cngx-popover-divider')).toBe(true);
  });

  it('forwards orientation and inset inputs to the underlying CngxDivider', () => {
    const { el } = setup(ConfiguredHost);
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.classList.contains('cngx-divider--vertical')).toBe(true);
    expect(el.classList.contains('cngx-divider--inset')).toBe(true);
  });
});
