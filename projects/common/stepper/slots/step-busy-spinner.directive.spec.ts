import { Component, provideZonelessChangeDetection, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxStepBusySpinner, type CngxStepBusySpinnerContext } from './step-busy-spinner.directive';
import type { CngxStepNode } from '../stepper-host.token';

@Component({
  standalone: true,
  imports: [CngxStepBusySpinner],
  template: `
    <ng-template cngxStepBusySpinner #tpl="cngxStepBusySpinner">
      <span class="my-spin"></span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxStepBusySpinner);
}

describe('CngxStepBusySpinner', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxStepBusySpinner);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('context interface fields are reachable at the type level', () => {
    const node: CngxStepNode = {
      id: 'a',
      kind: 'step',
      label: signal('A'),
      disabled: signal(false),
      state: signal('pending'),
      children: [],
      depth: 0,
      parentId: null,
      flatIndex: 0,
    };
    const ctx: CngxStepBusySpinnerContext = { node };
    expect(ctx.node.id).toBe('a');
  });
});
