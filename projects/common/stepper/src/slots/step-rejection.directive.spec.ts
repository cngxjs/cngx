import { Component, provideZonelessChangeDetection, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxStepRejection, type CngxStepRejectionContext } from './step-rejection.directive';
import type { CngxStepNode } from '../stepper-host.token';

@Component({
  standalone: true,
  imports: [CngxStepRejection],
  template: `
    <ng-template cngxStepRejection #tpl="cngxStepRejection" let-failedIndex="failedIndex" let-originLabel="originLabel">
      <span data-testid="rollback">{{ failedIndex }}@if (originLabel) { → {{ originLabel }} }</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxStepRejection);
}

describe('CngxStepRejection', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxStepRejection);
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
    const ctx: CngxStepRejectionContext = {
      failedIndex: 2,
      originLabel: 'Step One',
      node,
    };
    expect(ctx.failedIndex).toBe(2);
    expect(ctx.originLabel).toBe('Step One');
    expect(ctx.node.id).toBe('a');
  });

  it('originLabel may be undefined when the origin index is out of range', () => {
    const node: CngxStepNode = {
      id: 'b',
      kind: 'step',
      label: signal('B'),
      disabled: signal(false),
      state: signal('error'),
      children: [],
      depth: 0,
      parentId: null,
      flatIndex: 1,
    };
    const ctx: CngxStepRejectionContext = {
      failedIndex: 1,
      originLabel: undefined,
      node,
    };
    expect(ctx.originLabel).toBeUndefined();
  });
});
