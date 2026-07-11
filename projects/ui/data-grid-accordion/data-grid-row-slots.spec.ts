import { Component, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxDgaRowBusy } from './data-grid-row-busy.directive';
import { CngxDgaRowError } from './data-grid-row-error.directive';

@Component({
  template: `
    <ng-template cngxDgaRowBusy #busy="cngxDgaRowBusy"></ng-template>
    <ng-template cngxDgaRowError #error="cngxDgaRowError"></ng-template>
  `,
  imports: [CngxDgaRowBusy, CngxDgaRowError],
})
class Host {
  readonly busy = viewChild.required<CngxDgaRowBusy>('busy');
  readonly error = viewChild.required<CngxDgaRowError>('error');
}

describe('CngxDgaRow slots', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('exposes the busy template ref', () => {
    expect(setup().busy().templateRef).toBeInstanceOf(TemplateRef);
  });

  it('exposes the error template ref', () => {
    expect(setup().error().templateRef).toBeInstanceOf(TemplateRef);
  });

  it('narrows the template context via the guards', () => {
    expect(CngxDgaRowBusy.ngTemplateContextGuard({} as CngxDgaRowBusy, {})).toBe(true);
    expect(CngxDgaRowError.ngTemplateContextGuard({} as CngxDgaRowError, {})).toBe(true);
  });
});
