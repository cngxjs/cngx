import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxDgCell } from './data-grid-cell.directive';

@Component({
  template: `
    <span cngxDgaCell>plain</span>
    <span cngxDgaCell col="md">sized</span>
    <span cngxDgaCell col="grow" align="end">flex</span>
  `,
  imports: [CngxDgCell],
})
class Host {}

describe('CngxDgCell', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function cells() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.debugElement
      .queryAll(By.directive(CngxDgCell))
      .map((de) => de.injector.get(CngxDgCell));
  }

  it('leaves col unset by default so the group applies the derived default', () => {
    expect(cells()[0].col()).toBeUndefined();
  });

  it('reads a bound col track off the cell', () => {
    const [, sized, flex] = cells();
    expect(sized.col()).toBe('md');
    expect(flex.col()).toBe('grow');
  });

  it('keeps col orthogonal to align', () => {
    const [, , flex] = cells();
    expect(flex.col()).toBe('grow');
    expect(flex.align()).toBe('end');
  });
});
