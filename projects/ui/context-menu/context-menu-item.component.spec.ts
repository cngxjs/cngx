import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuDivider } from './context-menu-divider.component';
import { CngxContextMenuItem } from './context-menu-item.component';

@Component({
  template: `
    <cngx-context-menu ariaLabel="Actions" #menu="cngxContextMenu">
      <cngx-context-menu-item value="copy" (select)="log('copy')">Copy</cngx-context-menu-item>
      <button cngxContextMenuItem value="paste" (select)="log('paste')">Paste</button>
      <cngx-context-menu-divider />
      <cngx-context-menu-item value="delete" [disabled]="locked()" (select)="log('delete')">
        Delete
      </cngx-context-menu-item>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuItem, CngxContextMenuDivider],
})
class ItemsHost {
  readonly locked = signal(true);
  readonly fired: string[] = [];
  log(action: string): void {
    this.fired.push(action);
  }
}

describe('CngxContextMenuItem / CngxContextMenuDivider', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ItemsHost>>;
  let host: ItemsHost;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ItemsHost] });
    fixture = TestBed.createComponent(ItemsHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    host = fixture.componentInstance;
  });

  function panel(): CngxContextMenu {
    return fixture.debugElement.query(By.directive(CngxContextMenu)).componentInstance;
  }

  function items(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="menuitem"]'));
  }

  it('registers both selector forms with the surrounding active-descendant', () => {
    expect(items()).toHaveLength(3);
    expect(panel().menuHost.ad.resolvedItems()).toHaveLength(3);
  });

  it('renders the divider as a role=separator, skipped by navigation', () => {
    const separators = fixture.nativeElement.querySelectorAll('[role="separator"]');
    expect(separators).toHaveLength(1);
  });

  it('fires select on click for the element form', () => {
    items()[0].click();
    TestBed.flushEffects();
    expect(host.fired).toContain('copy');
    expect(host.fired).not.toContain('paste');
  });

  it('fires select on click for the button-attribute form', () => {
    items()[1].click();
    TestBed.flushEffects();
    expect(host.fired).toEqual(['paste']);
  });

  it('fires select on Enter for the highlighted item', () => {
    panel().menuHost.ad.highlightFirst();
    TestBed.flushEffects();
    const menuHostEl = fixture.debugElement.query(By.directive(CngxContextMenu)).nativeElement as HTMLElement;
    menuHostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.flushEffects();
    expect(host.fired).toEqual(['copy']);
  });

  it('forwards disabled to the brain and suppresses activation', () => {
    const deleteItem = items()[2];
    expect(deleteItem.getAttribute('aria-disabled')).toBe('true');

    deleteItem.click();
    TestBed.flushEffects();
    expect(host.fired).not.toContain('delete');

    host.locked.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(deleteItem.getAttribute('aria-disabled')).toBeNull();

    deleteItem.click();
    TestBed.flushEffects();
    expect(host.fired).toContain('delete');
  });
});
