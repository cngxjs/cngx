import { Component, provideZonelessChangeDetection, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxStepIndicator, type CngxStepIndicatorContext } from './step-indicator.directive';

@Component({
  standalone: true,
  imports: [CngxStepIndicator],
  template: `
    <ng-template cngxStepIndicator #tpl="cngxStepIndicator" let-position>
      <span>{{ position }}</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxStepIndicator);
}

describe('CngxStepIndicator', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxStepIndicator);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('exposes the directive via exportAs cngxStepIndicator', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.slot()).toBeDefined();
  });

  it('context interface fields are reachable at the type level', () => {
    const ctx: CngxStepIndicatorContext = {
      $implicit: 1,
      position: 1,
      node: null as never,
      active: false,
      status: 'idle',
      busy: false,
    };
    expect(ctx.position).toBe(1);
    expect(ctx.status).toBe('idle');
  });
});
