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
  CngxTabErrorBadge,
  type CngxTabErrorBadgeContext,
} from './tab-error-badge.directive';
import type { CngxTabHandle } from '../tab-group-host.token';

@Component({
  standalone: true,
  imports: [CngxTabErrorBadge],
  template: `
    <ng-template cngxTabErrorBadge #tpl="cngxTabErrorBadge" let-tab="tab">
      <span>{{ tab.id }}</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxTabErrorBadge);
}

describe('CngxTabErrorBadge', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxTabErrorBadge);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('context interface fields are reachable at the type level', () => {
    const tab: CngxTabHandle = {
      id: 'a',
      label: signal('A'),
      disabled: signal(false),
      errorAggregator: signal(undefined),
    };
    const ctx: CngxTabErrorBadgeContext = { tab };
    expect(ctx.tab.id).toBe('a');
  });
});
