import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxKeyboardShortcut } from './keyboard-shortcut.directive';

@Component({
  template: `
    <button
      [cngxKeyboardShortcut]="shortcut()"
      [shortcutScope]="scope()"
      [enabled]="enabled()"
      (shortcutTriggered)="handleShortcut($event)"
    >
      Action
    </button>
  `,
  imports: [CngxKeyboardShortcut],
})
class TestHost {
  readonly shortcut = signal('mod+s');
  readonly scope = signal<'global' | 'self'>('global');
  readonly enabled = signal(true);
  triggerCount = 0;
  lastEvent: KeyboardEvent | null = null;

  handleShortcut(event: KeyboardEvent): void {
    this.triggerCount++;
    this.lastEvent = event;
  }
}

describe('CngxKeyboardShortcut', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.directive(CngxKeyboardShortcut));
    const dir = button.injector.get(CngxKeyboardShortcut);
    return { fixture, button, dir };
  }

  function dispatchKeydown(target: EventTarget, key: string, opts: KeyboardEventInit = {}): void {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }),
    );
  }

  it('fires on matching global shortcut (Ctrl+S on non-Mac)', () => {
    const { fixture } = setup();
    dispatchKeydown(document, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(1);
  });

  it('does not fire on non-matching key', () => {
    const { fixture } = setup();
    dispatchKeydown(document, 'a', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(0);
  });

  it('does not fire when disabled', () => {
    const { fixture } = setup();
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    dispatchKeydown(document, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(0);
  });

  it('does not fire global shortcut when focus is in input element', () => {
    const { fixture } = setup();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    dispatchKeydown(input, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(0);
    document.body.removeChild(input);
  });

  it('fires escape shortcut', () => {
    const { fixture } = setup();
    fixture.componentInstance.shortcut.set('escape');
    fixture.detectChanges();
    dispatchKeydown(document, 'Escape');
    expect(fixture.componentInstance.triggerCount).toBe(1);
  });

  it('self scope only fires on host element', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.scope.set('self');
    fixture.detectChanges();

    // Global keydown should not fire
    dispatchKeydown(document, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(0);

    // Host element keydown should fire
    dispatchKeydown(button.nativeElement as HTMLElement, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(1);
  });

  it('prevents default on matching shortcut', () => {
    setup();
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    const spy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });
});
