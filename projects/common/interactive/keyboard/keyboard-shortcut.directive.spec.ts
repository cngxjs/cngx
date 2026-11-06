import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_HOTKEY_REGISTRY } from './hotkeys/hotkey-registry';
import { CngxHotkeyScope } from './hotkeys/hotkey-scope.directive';
import { CngxKeyboardShortcut } from './keyboard-shortcut.directive';

@Component({
  template: `
    <button
      [cngxKeyboardShortcut]="shortcut()"
      [shortcutScope]="scope()"
      [enabled]="enabled()"
      [shortcutId]="id()"
      [shortcutDescription]="description()"
      [shortcutGroup]="group()"
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
  readonly id = signal<string | undefined>(undefined);
  readonly description = signal<string | undefined>(undefined);
  readonly group = signal<string | undefined>(undefined);
  triggerCount = 0;
  lastEvent: KeyboardEvent | null = null;

  handleShortcut(event: KeyboardEvent): void {
    this.triggerCount++;
    this.lastEvent = event;
  }
}

@Component({
  template: `
    <section cngxHotkeyScope [cngxHotkeyScopeActive]="active()">
      <button [cngxKeyboardShortcut]="'mod+s'" (shortcutTriggered)="count = count + 1">Save</button>
    </section>
  `,
  imports: [CngxKeyboardShortcut, CngxHotkeyScope],
})
class ScopedHost {
  readonly active = signal(true);
  count = 0;
}

@Component({
  template: `
    <button [cngxKeyboardShortcut]="'mod+j'" (shortcutTriggered)="fired.push('j')">J</button>
    <button [cngxKeyboardShortcut]="'mod+k'" (shortcutTriggered)="fired.push('k')">K</button>
    <button [cngxKeyboardShortcut]="'mod+l'" (shortcutTriggered)="fired.push('l')">L</button>
  `,
  imports: [CngxKeyboardShortcut],
})
class TripleHost {
  readonly fired: string[] = [];
}

describe('CngxKeyboardShortcut', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost, ScopedHost, TripleHost] }));

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

  it('does not fire during IME composition', () => {
    const { fixture } = setup();
    dispatchKeydown(document, 's', { ctrlKey: true, isComposing: true });
    expect(fixture.componentInstance.triggerCount).toBe(0);
  });

  it('does not fire when disabled', () => {
    const { fixture } = setup();
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    dispatchKeydown(document, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(0);
  });

  it('fires a modifier combo while focus is in a text field', () => {
    const { fixture } = setup();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    dispatchKeydown(input, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(1);
    document.body.removeChild(input);
  });

  it('keeps a bare key silent while focus is in a text field', () => {
    const { fixture } = setup();
    fixture.componentInstance.shortcut.set('/');
    fixture.detectChanges();
    const input = document.createElement('input');
    document.body.appendChild(input);
    dispatchKeydown(input, '/');
    expect(fixture.componentInstance.triggerCount).toBe(0);
    dispatchKeydown(document, '/');
    expect(fixture.componentInstance.triggerCount).toBe(1);
    document.body.removeChild(input);
  });

  it('fires a self-scoped escape from a text field inside the host', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.shortcut.set('escape');
    fixture.componentInstance.scope.set('self');
    fixture.detectChanges();
    const input = document.createElement('input');
    (button.nativeElement as HTMLElement).appendChild(input);
    dispatchKeydown(input, 'Escape');
    expect(fixture.componentInstance.triggerCount).toBe(1);
  });

  it('keeps a self-scoped bare key silent in a text field inside the host', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.shortcut.set('x');
    fixture.componentInstance.scope.set('self');
    fixture.detectChanges();
    const host = button.nativeElement as HTMLElement;
    const input = document.createElement('input');
    host.appendChild(input);
    dispatchKeydown(input, 'x');
    expect(fixture.componentInstance.triggerCount).toBe(0);
    dispatchKeydown(host, 'x');
    expect(fixture.componentInstance.triggerCount).toBe(1);
  });

  it('sets aria-keyshortcuts while enabled and drops it while disabled', () => {
    const { fixture, button } = setup();
    const host = button.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-keyshortcuts')).toBe('Control+S');

    fixture.componentInstance.shortcut.set('mod+shift+?');
    fixture.detectChanges();
    expect(host.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+?');

    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    expect(host.hasAttribute('aria-keyshortcuts')).toBe(false);
  });

  it('drops aria-keyshortcuts and stays silent inside an inactive hotkey scope', () => {
    const fixture = TestBed.createComponent(ScopedHost);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLElement;
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Control+S');

    fixture.componentInstance.active.set(false);
    fixture.detectChanges();
    dispatchKeydown(document, 's', { ctrlKey: true });
    expect(button.hasAttribute('aria-keyshortcuts')).toBe(false);
    expect(fixture.componentInstance.count).toBe(0);
  });

  it('shares one document listener between directive instances', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const fixture = TestBed.createComponent(TripleHost);
    fixture.detectChanges();
    expect(add.mock.calls.filter((call) => call[0] === 'keydown')).toHaveLength(1);

    dispatchKeydown(document, 'k', { ctrlKey: true });
    expect(fixture.componentInstance.fired).toEqual(['k']);
    add.mockRestore();
  });

  it('lists a described shortcut under its id and group', () => {
    const { fixture } = setup();
    fixture.componentInstance.id.set('editor.save');
    fixture.componentInstance.description.set('Save');
    fixture.componentInstance.group.set('Editing');
    fixture.detectChanges();
    expect(TestBed.inject(CNGX_HOTKEY_REGISTRY).liveGroupsFor(null)).toEqual([
      {
        group: 'Editing',
        bindings: [{ id: 'editor.save', combo: 'mod+s', description: 'Save', group: 'Editing' }],
      },
    ]);
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

  it('emits the matching keyboard event through shortcutTriggered', () => {
    const { fixture } = setup();
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    expect(fixture.componentInstance.lastEvent).toBe(event);
  });

  it('self scope fires for a keydown from inside the host and not from outside it', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.scope.set('self');
    fixture.detectChanges();
    const host = button.nativeElement as HTMLElement;
    const inside = document.createElement('span');
    host.appendChild(inside);
    const outside = document.createElement('div');
    document.body.appendChild(outside);

    dispatchKeydown(outside, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(0);

    dispatchKeydown(inside, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(1);
    document.body.removeChild(outside);
  });

  it('follows a runtime switch from self back to global scope', () => {
    const { fixture } = setup();
    fixture.componentInstance.scope.set('self');
    fixture.detectChanges();
    dispatchKeydown(document, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(0);

    fixture.componentInstance.scope.set('global');
    fixture.detectChanges();
    dispatchKeydown(document, 's', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(1);
  });

  it('follows a runtime change of the combo', () => {
    const { fixture } = setup();
    fixture.componentInstance.shortcut.set('mod+k');
    fixture.detectChanges();
    dispatchKeydown(document, 's', { ctrlKey: true });
    dispatchKeydown(document, 'k', { ctrlKey: true });
    expect(fixture.componentInstance.triggerCount).toBe(1);
  });

  it('fires again after being re-enabled', () => {
    const { fixture } = setup();
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    fixture.componentInstance.enabled.set(true);
    fixture.detectChanges();
    dispatchKeydown(document, 's', { ctrlKey: true });
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

  it('does not prevent default or emit for an unmatched modifier chord', () => {
    const { fixture } = setup();
    fixture.componentInstance.shortcut.set('b');
    fixture.detectChanges();

    // A bare 'b' shortcut must leave Cmd+B / Ctrl+B to the browser: the
    // consumer cannot recover the chord because preventDefault runs before
    // shortcutTriggered emits.
    const event = new KeyboardEvent('keydown', {
      key: 'b',
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(fixture.componentInstance.triggerCount).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });
});
