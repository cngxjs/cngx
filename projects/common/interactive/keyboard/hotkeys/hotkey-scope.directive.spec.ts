import { Component, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CngxHotkeyBinding } from './hotkey-binding';
import { injectHotkeys } from './hotkey-registry';
import { CNGX_HOTKEY_SCOPE, type CngxHotkeyScopeNode } from './hotkey-scope';
import { CngxHotkeyScope } from './hotkey-scope.directive';

function press(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

@Component({
  selector: 'cngx-scope-probe',
  template: '<button type="button">probe</button>',
})
class Probe {
  readonly runs: string[] = [];
  readonly bindings = signal<readonly CngxHotkeyBinding[]>([
    { id: 'next', combo: 'n', reach: 'focus', run: () => this.runs.push('next') },
  ]);
  readonly registration = injectHotkeys(this.bindings);
}

@Component({
  selector: 'cngx-global-probe',
  template: '',
})
class GlobalProbe {
  readonly run = vi.fn();
  readonly registration = injectHotkeys(
    signal<readonly CngxHotkeyBinding[]>([
      { id: 'save', combo: 'mod+s', run: this.run },
    ]).asReadonly(),
  );
}

@Component({
  template: `
    <cngx-global-probe />
    <section cngxHotkeyScope data-testid="outer">
      <div cngxHotkeyScope cngxHotkeyScopeModal data-testid="inner">
        @if (shown()) {
          <cngx-scope-probe />
        }
      </div>
    </section>
    <button type="button" data-testid="outside">outside</button>
  `,
  imports: [CngxHotkeyScope, Probe, GlobalProbe],
})
class Host {
  readonly shown = signal(true);
}

describe('CngxHotkeyScope', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    const root = fixture.nativeElement as HTMLElement;
    const byTestId = (id: string): HTMLElement =>
      root.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    const nodeOf = (id: string): CngxHotkeyScopeNode =>
      fixture.debugElement.query(By.css(`[data-testid="${id}"]`)).injector.get(CNGX_HOTKEY_SCOPE);
    const probe = (): Probe => fixture.debugElement.query(By.directive(Probe)).componentInstance;
    const global = (): GlobalProbe =>
      fixture.debugElement.query(By.directive(GlobalProbe)).componentInstance;
    return { fixture, byTestId, nodeOf, probe, global };
  }

  it('provides its node to the subtree and links it to the enclosing scope', () => {
    const { byTestId, nodeOf } = setup();
    const outer = nodeOf('outer');
    const inner = nodeOf('inner');
    expect(outer.element).toBe(byTestId('outer'));
    expect(inner.element).toBe(byTestId('inner'));
    expect(inner.parent).toBe(outer);
    expect(outer.parent).toBeNull();
  });

  it('reads the bare cngxHotkeyScopeModal attribute as true', () => {
    const { nodeOf } = setup();
    expect(nodeOf('inner').modal()).toBe(true);
    expect(nodeOf('outer').modal()).toBe(false);
  });

  it('fires a focus-reach binding only from inside its scope', () => {
    const { fixture, byTestId, probe } = setup();
    const inside = fixture.debugElement.query(By.css('cngx-scope-probe button'))
      .nativeElement as HTMLElement;

    press(byTestId('outside'), 'n');
    expect(probe().runs).toEqual([]);

    press(inside, 'n');
    expect(probe().runs).toEqual(['next']);
  });

  it('cuts global bindings registered outside while focus is in the modal scope', () => {
    const { fixture, byTestId, global } = setup();
    const inside = fixture.debugElement.query(By.css('cngx-scope-probe button'))
      .nativeElement as HTMLElement;

    press(inside, 's', { ctrlKey: true });
    expect(global().run).not.toHaveBeenCalled();

    press(byTestId('outside'), 's', { ctrlKey: true });
    expect(global().run).toHaveBeenCalledOnce();
  });
});

describe('injectHotkeys', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads a changing source per press without re-registration and unregisters with its context', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    const probe = fixture.debugElement.query(By.directive(Probe)).componentInstance as Probe;
    const inside = fixture.debugElement.query(By.css('cngx-scope-probe button'))
      .nativeElement as HTMLElement;
    const bindings: Signal<readonly CngxHotkeyBinding[]> = probe.bindings;

    probe.bindings.set([
      ...bindings(),
      { id: 'prev', combo: 'p', reach: 'focus', run: () => probe.runs.push('prev') },
    ]);
    press(inside, 'p');
    expect(probe.runs).toEqual(['prev']);

    fixture.componentInstance.shown.set(false);
    fixture.detectChanges();
    press(fixture.nativeElement as HTMLElement, 'p');
    press(fixture.nativeElement as HTMLElement, 'n');
    expect(probe.runs).toEqual(['prev']);
  });
});
