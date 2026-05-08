import {
  Component,
  provideZonelessChangeDetection,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CngxTabRejectionIcon,
  type CngxTabRejectionIconContext,
} from './tab-rejection-icon.directive';

@Component({
  standalone: true,
  imports: [CngxTabRejectionIcon],
  template: `
    <ng-template
      cngxTabRejectionIcon
      #tpl="cngxTabRejectionIcon"
      let-failedIndex="failedIndex"
      let-originLabel="originLabel"
    >
      <span data-testid="rollback"
        >{{ failedIndex }}@if (originLabel) { → {{ originLabel }} }</span
      >
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxTabRejectionIcon);
}

describe('CngxTabRejectionIcon', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxTabRejectionIcon);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('context interface fields are reachable at the type level', () => {
    const ctx: CngxTabRejectionIconContext = {
      failedIndex: 2,
      originLabel: 'Tab One',
    };
    expect(ctx.failedIndex).toBe(2);
    expect(ctx.originLabel).toBe('Tab One');
  });

  it('originLabel may be undefined when the origin index is out of range', () => {
    const ctx: CngxTabRejectionIconContext = {
      failedIndex: 1,
      originLabel: undefined,
    };
    expect(ctx.originLabel).toBeUndefined();
  });
});
