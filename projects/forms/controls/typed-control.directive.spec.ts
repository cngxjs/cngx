import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxTypedControl } from './typed-control.directive';

@Component({
  template: `
    <form [formGroup]="form">
      <input formControlName="email" cngxTypedControl="email" />
    </form>
  `,
  imports: [ReactiveFormsModule, CngxTypedControl],
})
class PresentHost {
  readonly form = new FormGroup({ email: new FormControl('') });
}

@Component({
  template: `
    <form [formGroup]="form">
      <input [cngxTypedControl]="'missing'" />
    </form>
  `,
  imports: [ReactiveFormsModule, CngxTypedControl],
})
class MissingHost {
  readonly form = new FormGroup({ email: new FormControl('') });
}

function render<T>(component: new () => T) {
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  TestBed.flushEffects();
  return fixture;
}

describe('CngxTypedControl', () => {
  it('resolves the named control from the parent FormGroup', () => {
    const fixture = render(PresentHost);
    const dir = fixture.debugElement
      .query(By.directive(CngxTypedControl))
      .injector.get(CngxTypedControl);
    expect(dir.control()).toBe(fixture.componentInstance.form.controls.email);
  });

  it('throws CNGX2007 when no control of that name exists', () => {
    expect(() => render(MissingHost)).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX2007',
        message: expect.stringMatching(
          /^CNGX2007: \[cngxTypedControl\] No control found with name "missing" in the parent FormGroup\./,
        ),
      }),
    );
  });
});
