import {
  Component,
  provideZonelessChangeDetection,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxTabIcon, type CngxTabIconContext } from './tab-icon.directive';
import type { CngxTabHandle } from '../tab-group-host.token';

@Component({
  standalone: true,
  imports: [CngxTabIcon],
  template: `
    <ng-template
      cngxTabIcon
      #tpl="cngxTabIcon"
      let-tab="tab"
      let-active="active"
      let-index="index"
    >
      <span>{{ tab.id }}-{{ active }}-{{ index }}</span>
    </ng-template>
  `,
})
class HostComponent {
  readonly slot = viewChild.required(CngxTabIcon);
}

describe('CngxTabIcon', () => {
  it('exposes a typed templateRef when applied to an ng-template', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const slot = fixture.componentInstance.slot();
    expect(slot).toBeInstanceOf(CngxTabIcon);
    expect(slot.templateRef).toBeInstanceOf(TemplateRef);
  });

  it('context interface fields are reachable at the type level', () => {
    const tab: CngxTabHandle = {
      id: 'a',
      label: signal('A'),
      disabled: signal(false),
      errorAggregator: signal(undefined),
    };
    const ctx: CngxTabIconContext = { tab, active: true, index: 0 };
    expect(ctx.tab.id).toBe('a');
    expect(ctx.active).toBe(true);
    expect(ctx.index).toBe(0);
  });
});
