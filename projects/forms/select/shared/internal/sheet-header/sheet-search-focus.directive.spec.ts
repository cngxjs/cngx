import { Component, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxPopoverSheet } from '@cngx/common/popover';
import { createKeyedRegistry } from '@cngx/core/utils';

import { CngxSelectSheetSearchFocus } from './sheet-search-focus.directive';

interface FocusHandle {
  readonly element: HTMLElement;
  readonly enabled?: Signal<boolean>;
}

const registry = createKeyedRegistry<FocusHandle>({ name: 'test sheet' });

@Component({
  template: `
    @if (shown()) {
      <input class="search" [cngxSelectSheetSearchFocus]="leads" />
    }
  `,
  imports: [CngxSelectSheetSearchFocus],
  providers: [{ provide: CngxPopoverSheet, useValue: { initialFocusRegistry: registry } }],
})
class Host {
  readonly shown = signal(true);
  readonly leads = signal(false);
}

describe('CngxSelectSheetSearchFocus', () => {
  it('registers the input as an initial-focus candidate gated by the bound signal', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input.search');
    const handles = registry.values();
    expect(handles.length).toBe(1);
    expect(handles[0].element).toBe(input);
    expect(handles[0].enabled?.()).toBe(false);

    fixture.componentInstance.leads.set(true);
    expect(handles[0].enabled?.()).toBe(true);
  });

  it('unregisters when the input leaves the view', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const before = registry.values().length;
    fixture.componentInstance.shown.set(false);
    fixture.detectChanges();
    expect(registry.values().length).toBe(before - 1);
    fixture.destroy();
  });
});
