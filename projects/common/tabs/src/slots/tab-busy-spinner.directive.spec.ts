import {
  Component,
  provideZonelessChangeDetection,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CngxTabBusySpinner,
  type CngxTabBusySpinnerContext,
} from './tab-busy-spinner.directive';
import type { CngxTabHandle } from '../tab-group-host.token';

@Component({
  standalone: true,
  imports: [CngxTabBusySpinner],
  template: `
    <ng-template cngxTabBusySpinner #tpl="cngxTabBusySpinner">
      <span data-testid="busy">…</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxTabBusySpinner);
}

describe('CngxTabBusySpinner', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxTabBusySpinner);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('context interface fields are reachable at the type level', () => {
    const tab: CngxTabHandle = {
      id: 'a',
      label: signal('A'),
      disabled: signal(false),
      errorAggregator: signal(undefined),
    };
    const ctx: CngxTabBusySpinnerContext = { tab, intendedIndex: 0 };
    expect(ctx.tab.id).toBe('a');
    expect(ctx.intendedIndex).toBe(0);
  });
});
