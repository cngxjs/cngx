import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxDrawer } from './drawer.directive';

@Component({
  template: `<div cngxDrawer [cngxDrawerOpened]="controlled()" #d="cngxDrawer"></div>`,
  imports: [CngxDrawer],
})
class ControlledHost {
  controlled = signal<boolean | undefined>(undefined);
}

@Component({
  template: `<div cngxDrawer #d="cngxDrawer"></div>`,
  imports: [CngxDrawer],
})
class UncontrolledHost {}

describe('CngxDrawer', () => {
  function setupControlled() {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const dir = fixture.debugElement.query(By.directive(CngxDrawer)).injector.get(CngxDrawer);
    return { fixture, dir, host: fixture.componentInstance };
  }

  function setupUncontrolled() {
    const fixture = TestBed.createComponent(UncontrolledHost);
    fixture.detectChanges();
    const dir = fixture.debugElement.query(By.directive(CngxDrawer)).injector.get(CngxDrawer);
    return { fixture, dir };
  }

  it('starts closed by default', () => {
    const { dir } = setupUncontrolled();
    expect(dir.opened()).toBe(false);
  });

  it('open() sets opened to true', () => {
    const { dir } = setupUncontrolled();
    dir.open();
    expect(dir.opened()).toBe(true);
  });

  it('close() sets opened to false', () => {
    const { dir } = setupUncontrolled();
    dir.open();
    dir.close();
    expect(dir.opened()).toBe(false);
  });

  it('toggle() flips the state', () => {
    const { dir } = setupUncontrolled();
    dir.toggle();
    expect(dir.opened()).toBe(true);
    dir.toggle();
    expect(dir.opened()).toBe(false);
  });

  it('close() is a no-op when already closed', () => {
    const { dir } = setupUncontrolled();
    const spy = vi.fn();
    dir.openedChange.subscribe(spy);
    dir.close();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits openedChange on open/close', () => {
    const { dir } = setupUncontrolled();
    const values: boolean[] = [];
    dir.openedChange.subscribe((v) => values.push(v));
    dir.open();
    dir.close();
    expect(values).toEqual([true, false]);
  });

  it('emits closed on close', () => {
    const { dir } = setupUncontrolled();
    const spy = vi.fn();
    dir.closed.subscribe(spy);
    dir.open();
    dir.close();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('controlled input takes precedence over internal state', () => {
    const { dir, host, fixture } = setupControlled();
    host.controlled.set(true);
    fixture.detectChanges();
    expect(dir.opened()).toBe(true);

    // internal toggle should not override controlled
    dir.toggle();
    expect(dir.opened()).toBe(true);
  });

  it('falls back to internal state when controlled is undefined', () => {
    const { dir, host, fixture } = setupControlled();
    host.controlled.set(undefined);
    fixture.detectChanges();
    dir.open();
    expect(dir.opened()).toBe(true);
  });

  it('adds cngx-drawer--opened class when open', () => {
    const { fixture, dir } = setupUncontrolled();
    dir.open();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDrawer)).nativeElement as HTMLElement;
    expect(el.classList.contains('cngx-drawer--opened')).toBe(true);
  });

  it('Escape key closes the drawer', () => {
    const { fixture, dir } = setupUncontrolled();
    dir.open();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDrawer)).nativeElement as HTMLElement;
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(dir.opened()).toBe(false);
  });
});
