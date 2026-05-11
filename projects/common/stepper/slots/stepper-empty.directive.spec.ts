import { Component, provideZonelessChangeDetection, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxStepperEmpty } from './stepper-empty.directive';

@Component({
  standalone: true,
  imports: [CngxStepperEmpty],
  template: `
    <ng-template cngxStepperEmpty #tpl="cngxStepperEmpty">
      <p>No steps yet</p>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxStepperEmpty);
}

describe('CngxStepperEmpty', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxStepperEmpty);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });
});
