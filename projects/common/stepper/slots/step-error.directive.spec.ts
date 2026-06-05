import { Component, provideZonelessChangeDetection, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxStepError, type CngxStepErrorContext } from './step-error.directive';
import type { CngxStepNode } from '../stepper-host.token';

@Component({
  standalone: true,
  imports: [CngxStepError],
  template: `
    <ng-template cngxStepError #tpl="cngxStepError" let-message="message" let-errorLabels="errorLabels">
      <span data-testid="error">{{ message }}@if (errorLabels.length) { ({{ errorLabels.length }}) }</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxStepError);
}

describe('CngxStepError', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxStepError);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('context interface fields are reachable at the type level', () => {
    const node: CngxStepNode = {
      id: 'a',
      kind: 'step',
      label: signal('A'),
      disabled: signal(false),
      state: signal('error'),
      children: [],
      depth: 0,
      parentId: null,
      flatIndex: 2,
    };
    const ctx: CngxStepErrorContext = {
      node,
      message: 'Card declined',
      errorLabels: ['email', 'phone'],
      announcement: 'Two validation errors',
    };
    expect(ctx.message).toBe('Card declined');
    expect(ctx.errorLabels.length).toBe(2);
    expect(ctx.announcement).toBe('Two validation errors');
    expect(ctx.node.id).toBe('a');
  });
});
