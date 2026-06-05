import { Component, provideZonelessChangeDetection, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxStepGroupHeader, type CngxStepGroupHeaderContext } from './step-group-header.directive';
import type { CngxStepNode } from '../stepper-host.token';

@Component({
  standalone: true,
  imports: [CngxStepGroupHeader],
  template: `
    <ng-template cngxStepGroupHeader #tpl="cngxStepGroupHeader" let-group="group" let-status="status">
      <h4>{{ group.label() }} - {{ status }}</h4>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxStepGroupHeader);
}

describe('CngxStepGroupHeader', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxStepGroupHeader);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('context interface fields are reachable at the type level', () => {
    const group: CngxStepNode = {
      id: 'g1',
      kind: 'group',
      label: signal('Onboarding'),
      disabled: signal(false),
      state: signal('idle'),
      children: [],
      depth: 0,
      parentId: null,
      flatIndex: -1,
    };
    const ctx: CngxStepGroupHeaderContext = {
      group,
      expanded: true,
      status: 'idle',
    };
    expect(ctx.group.kind).toBe('group');
    expect(ctx.expanded).toBe(true);
    expect(ctx.status).toBe('idle');
  });
});
