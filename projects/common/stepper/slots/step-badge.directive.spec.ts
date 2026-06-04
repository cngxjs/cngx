import { Component, provideZonelessChangeDetection, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxStepBadge, type CngxStepBadgeContext } from './step-badge.directive';
import type { CngxStepNode } from '../stepper-host.token';

@Component({
  standalone: true,
  imports: [CngxStepBadge],
  template: `
    <ng-template cngxStepBadge #tpl="cngxStepBadge" let-count="count">
      <span>{{ count }}</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxStepBadge);
}

describe('CngxStepBadge', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxStepBadge);
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
      flatIndex: 0,
    };
    const ctx: CngxStepBadgeContext = { count: 3, node };
    expect(ctx.count).toBe(3);
    expect(ctx.node.id).toBe('a');
  });
});
