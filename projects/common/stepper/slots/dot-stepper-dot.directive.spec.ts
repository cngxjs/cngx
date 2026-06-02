import { Component, provideZonelessChangeDetection, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxDotStepperDot, type CngxDotStepperDotContext } from './dot-stepper-dot.directive';

@Component({
  standalone: true,
  imports: [CngxDotStepperDot],
  template: `
    <ng-template cngxDotStepperDot #tpl="cngxDotStepperDot" let-index>
      <span>{{ index }}</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxDotStepperDot);
}

describe('CngxDotStepperDot', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxDotStepperDot);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('exposes the directive via exportAs cngxDotStepperDot', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.slot()).toBeDefined();
  });

  it('context interface fields are reachable at the type level', () => {
    const ctx: CngxDotStepperDotContext = {
      $implicit: 0,
      index: 0,
      node: null as never,
      active: true,
      completed: false,
    };
    expect(ctx.index).toBe(0);
    expect(ctx.active).toBe(true);
    expect(ctx.completed).toBe(false);
  });
});
