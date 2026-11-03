import { Component, signal, viewChild, type TemplateRef } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxTreeSelectFooterBar } from './tree-select-footer.component';
import { CNGX_TREE_SELECT_PANEL_HOST } from './tree-select-panel-host';
import type { CngxTreeSelectFooterContext } from './tree-select.model';

const count = signal(0);
const footerTpl = signal<TemplateRef<CngxTreeSelectFooterContext> | null>(null);
const clearAllInPanel = vi.fn();
const panelHost = {
  selectionCount: count,
  selectionCountText: signal('0 selected'),
  clearAllLabel: signal('Clear all'),
  footerTpl,
  clearAllInPanel,
};

@Component({
  template: `
    <ng-template #custom let-n let-ctx="countText" let-clear="clear" let-empty="empty">
      <span class="custom">{{ n }} | {{ ctx }} | {{ empty }}</span>
      <button type="button" class="custom-clear" (click)="clear()">x</button>
    </ng-template>
    <cngx-tree-select-footer />
  `,
  imports: [CngxTreeSelectFooterBar],
  providers: [{ provide: CNGX_TREE_SELECT_PANEL_HOST, useValue: panelHost }],
})
class Host {
  readonly custom = viewChild.required<TemplateRef<CngxTreeSelectFooterContext>>('custom');
}

function mount(selected: number): { fixture: ComponentFixture<Host>; el: HTMLElement } {
  count.set(selected);
  panelHost.selectionCountText.set(`${selected} selected`);
  footerTpl.set(null);
  clearAllInPanel.mockClear();
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('CngxTreeSelectFooterBar', () => {
  it('shows the count copy and the clear label', () => {
    const { el } = mount(2);
    expect(el.querySelector('.cngx-tree-select__footer-count')?.textContent).toBe('2 selected');
    expect(el.querySelector('.cngx-tree-select__footer-clear')?.textContent?.trim()).toBe(
      'Clear all',
    );
  });

  it('clears through the panel host while something is selected', () => {
    const { el } = mount(2);
    const button = el.querySelector<HTMLButtonElement>('.cngx-tree-select__footer-clear')!;
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(button.getAttribute('aria-describedby')).toBeNull();
    button.click();
    expect(clearAllInPanel).toHaveBeenCalledTimes(1);
  });

  it('keeps the empty clear focusable, explains it with the count and ignores a press', () => {
    const { el } = mount(0);
    const button = el.querySelector<HTMLButtonElement>('.cngx-tree-select__footer-clear')!;
    const countEl = el.querySelector('.cngx-tree-select__footer-count')!;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-describedby')).toBe(countEl.id);
    button.click();
    expect(clearAllInPanel).not.toHaveBeenCalled();
  });

  it('prevents the mousedown default so a press keeps focus where it is', () => {
    const { el } = mount(1);
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    el.querySelector('.cngx-tree-select__footer-clear')!.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('renders a footer template with the count, copy, empty flag and the guarded clear', () => {
    const { fixture, el } = mount(0);
    footerTpl.set(fixture.componentInstance.custom());
    fixture.detectChanges();
    expect(el.querySelector('.cngx-tree-select__footer')).toBeNull();
    expect(el.querySelector('.custom')?.textContent).toBe('0 | 0 selected | true');
    el.querySelector<HTMLButtonElement>('.custom-clear')!.click();
    expect(clearAllInPanel).not.toHaveBeenCalled();
  });
});
