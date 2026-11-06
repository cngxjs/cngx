import {
  Component,
  computed,
  type DestroyRef,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CngxHotkeyBinding, CngxHotkeyRef } from './hotkey-binding';
import {
  CNGX_HOTKEY_REGISTRY,
  createHotkeyRegistry,
  injectHotkey,
  type CngxHotkeyRegistry,
} from './hotkey-registry';
import { createHotkeyScope, type CngxHotkeyScopeNode } from './hotkey-scope';
import { CngxHotkeyScope } from './hotkey-scope.directive';

const created: CngxHotkeyRegistry[] = [];

function makeRegistry(doc: Document = document): CngxHotkeyRegistry {
  const registry = createHotkeyRegistry({ doc, isMac: false });
  created.push(registry);
  return registry;
}

function bind(
  id: string,
  combo: string | Signal<string>,
  extra: Partial<CngxHotkeyBinding> = {},
): CngxHotkeyBinding & { run: ReturnType<typeof vi.fn> } {
  return { id, combo, run: vi.fn(), ...extra } as CngxHotkeyBinding & {
    run: ReturnType<typeof vi.fn>;
  };
}

function source(...bindings: CngxHotkeyBinding[]): Signal<readonly CngxHotkeyBinding[]> {
  return signal<readonly CngxHotkeyBinding[]>(bindings).asReadonly();
}

function el(tag = 'div', parent: Element = document.body): HTMLElement {
  const node = document.createElement(tag);
  parent.appendChild(node);
  return node;
}

function scopeOn(
  element: Element,
  parent: CngxHotkeyScopeNode | null = null,
  flags: { modal?: Signal<boolean>; active?: Signal<boolean> } = {},
): CngxHotkeyScopeNode {
  return createHotkeyScope({ element, parent, ...flags });
}

function press(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  created.splice(0).forEach((r) => r.destroy());
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('createHotkeyRegistry', () => {
  describe('resolution', () => {
    it('fires an app binding from anywhere and prevents the default', () => {
      const registry = makeRegistry();
      const save = bind('save', 'mod+s');
      registry.register(source(save), null);

      const event = press(el(), 's', { ctrlKey: true });

      expect(save.run).toHaveBeenCalledOnce();
      expect(save.run).toHaveBeenCalledWith(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('leaves a non-matching press alone', () => {
      const registry = makeRegistry();
      const save = bind('save', 'mod+s');
      registry.register(source(save), null);

      const event = press(document, 'a', { ctrlKey: true });

      expect(save.run).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it('fires a global binding of a non-modal scope from outside it', () => {
      const registry = makeRegistry();
      const region = el();
      const outside = el();
      const run = bind('region.save', 'mod+s');
      registry.register(source(run), scopeOn(region));

      press(outside, 's', { ctrlKey: true });

      expect(run.run).toHaveBeenCalledOnce();
    });

    it('cuts the chain at a modal scope: outside bindings stay quiet, inside ones fire', () => {
      const registry = makeRegistry();
      const app = bind('app.save', 'mod+s');
      const sibling = bind('sibling.save', 'mod+s');
      const dialogEnter = bind('dialog.enter', 'mod+enter');
      const nestedK = bind('nested.k', 'mod+k');
      const dialogEl = el();
      const nestedEl = el('div', dialogEl);
      const target = el('button', nestedEl);
      const dialog = scopeOn(dialogEl, null, { modal: signal(true) });
      registry.register(source(app), null);
      registry.register(source(sibling), scopeOn(el()));
      registry.register(source(dialogEnter), dialog);
      registry.register(source(nestedK), scopeOn(nestedEl, dialog));

      press(target, 's', { ctrlKey: true });
      press(target, 'Enter', { ctrlKey: true });
      press(target, 'k', { ctrlKey: true });

      expect(app.run).not.toHaveBeenCalled();
      expect(sibling.run).not.toHaveBeenCalled();
      expect(dialogEnter.run).toHaveBeenCalledOnce();
      expect(nestedK.run).toHaveBeenCalledOnce();
    });

    it('lets the deeper scope shadow an outer binding without a warning', () => {
      const warn = vi.spyOn(console, 'warn');
      const registry = makeRegistry();
      const inner = el();
      const outer = bind('app.save', 'mod+s');
      const shadow = bind('editor.save', 'mod+s');
      registry.register(source(shadow), scopeOn(inner));
      registry.register(source(outer), null);

      press(el('button', inner), 's', { ctrlKey: true });

      expect(shadow.run).toHaveBeenCalledOnce();
      expect(outer.run).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    it('fires a focus-reach binding only while focus is inside its scope', () => {
      const registry = makeRegistry();
      const list = el('ul');
      const next = bind('list.next', 'n', { reach: 'focus' });
      registry.register(source(next), scopeOn(list));

      press(el(), 'n');
      expect(next.run).not.toHaveBeenCalled();

      press(el('li', list), 'n');
      expect(next.run).toHaveBeenCalledOnce();
    });

    it('orders scopes sharing one element innermost first, whatever their creation order', () => {
      const registry = makeRegistry();
      const host = el();
      const outer = scopeOn(host, null, { modal: signal(true) });
      const inner = scopeOn(host, outer);
      const own = bind('own.escape', 'escape', { reach: 'focus' });
      const outerKey = bind('outer.save', 'mod+s');
      const innerKey = bind('inner.save', 'mod+s');
      registry.register(source(own), inner);
      registry.register(source(innerKey), inner);
      registry.register(source(outerKey), outer);

      const target = el('button', host);
      press(target, 'Escape');
      press(target, 's', { ctrlKey: true });

      expect(own.run).toHaveBeenCalledOnce();
      expect(innerKey.run).toHaveBeenCalledOnce();
      expect(outerKey.run).not.toHaveBeenCalled();
    });

    it('treats the app scope as focused until a modal cuts it', () => {
      const registry = makeRegistry();
      const dialogEl = el();
      scopeOn(dialogEl, null, { modal: signal(true) });
      const help = bind('help', '?', { reach: 'focus' });
      registry.register(source(help), null);

      press(el(), '?', { shiftKey: true });
      press(el('button', dialogEl), '?', { shiftKey: true });

      expect(help.run).toHaveBeenCalledOnce();
    });

    it('skips a binding while enabled() is false', () => {
      const registry = makeRegistry();
      const enabled = signal(false);
      const save = bind('save', 'mod+s', { enabled });
      registry.register(source(save), null);

      press(document, 's', { ctrlKey: true });
      expect(save.run).not.toHaveBeenCalled();

      enabled.set(true);
      press(document, 's', { ctrlKey: true });
      expect(save.run).toHaveBeenCalledOnce();
    });

    it('never fires a malformed combo', () => {
      const registry = makeRegistry();
      const typo = bind('typo', 'hyper+k');
      const dangling = bind('dangling', 'ctrl+');
      registry.register(source(typo, dangling), null);

      press(document, 'k');
      press(document, '+', { ctrlKey: true });

      expect(typo.run).not.toHaveBeenCalled();
      expect(dangling.run).not.toHaveBeenCalled();
    });

    it('skips an event the page already handled', () => {
      const registry = makeRegistry();
      const save = bind('save', 'mod+s');
      registry.register(source(save), null);
      const target = el('div');
      target.addEventListener('keydown', (e) => e.preventDefault());

      press(target, 's', { ctrlKey: true });

      expect(save.run).not.toHaveBeenCalled();
    });

    it('drops auto-repeat unless the binding allows it', () => {
      const registry = makeRegistry();
      const once = bind('once', 'arrowdown');
      const repeat = bind('repeat', 'arrowup', { allowRepeat: true });
      registry.register(source(once, repeat), null);

      press(document, 'ArrowDown', { repeat: true });
      press(document, 'ArrowUp', { repeat: true });

      expect(once.run).not.toHaveBeenCalled();
      expect(repeat.run).toHaveBeenCalledOnce();
    });

    it('skips IME composition', () => {
      const registry = makeRegistry();
      const save = bind('save', 'mod+s');
      registry.register(source(save), null);

      press(document, 's', { ctrlKey: true, isComposing: true });

      expect(save.run).not.toHaveBeenCalled();
    });
  });

  describe('text entry', () => {
    function fieldsUnder(parent: Element): HTMLElement[] {
      const text = el('input', parent);
      const search = el('input', parent) as HTMLInputElement;
      search.type = 'search';
      const area = el('textarea', parent);
      const select = el('select', parent);
      const editable = el('div', parent);
      editable.setAttribute('contenteditable', 'true');
      return [text, search, area, select, el('span', editable)];
    }

    it.each(['global', 'focus'] as const)(
      'lets primary-modifier combos, escape and function keys through (%s reach)',
      (reach) => {
        const registry = makeRegistry();
        const region = el();
        const save = bind('save', 'mod+s', { reach });
        const cancel = bind('cancel', 'escape', { reach });
        const rename = bind('rename', 'f2', { reach });
        registry.register(source(save, cancel, rename), scopeOn(region));

        for (const field of fieldsUnder(region)) {
          press(field, 's', { ctrlKey: true });
          press(field, 'Escape');
          press(field, 'F2');
        }

        expect(save.run).toHaveBeenCalledTimes(5);
        expect(cancel.run).toHaveBeenCalledTimes(5);
        expect(rename.run).toHaveBeenCalledTimes(5);
      },
    );

    it.each(['global', 'focus'] as const)(
      'keeps bare keys, shift-only and alt-only combos out (%s reach)',
      (reach) => {
        const registry = makeRegistry();
        const region = el();
        const search = bind('search', '/', { reach });
        const shiftA = bind('shift-a', 'shift+a', { reach });
        const altB = bind('alt-b', 'alt+b', { reach });
        const space = bind('space', 'space', { reach });
        registry.register(source(search, shiftA, altB, space), scopeOn(region));

        for (const field of fieldsUnder(region)) {
          press(field, '/');
          press(field, 'A', { shiftKey: true });
          press(field, 'b', { altKey: true });
          press(field, ' ');
        }

        expect(search.run).not.toHaveBeenCalled();
        expect(shiftA.run).not.toHaveBeenCalled();
        expect(altB.run).not.toHaveBeenCalled();
        expect(space.run).not.toHaveBeenCalled();
      },
    );

    it('fires bare keys on a non-text input', () => {
      const registry = makeRegistry();
      const search = bind('search', '/');
      registry.register(source(search), null);
      const checkbox = el('input') as HTMLInputElement;
      checkbox.type = 'checkbox';

      press(checkbox, '/');

      expect(search.run).toHaveBeenCalledOnce();
    });
  });

  describe('muted scopes', () => {
    it('mutes bindings in an inactive scope and its descendants until it turns active', () => {
      const registry = makeRegistry();
      const active = signal(false);
      const outerEl = el();
      const innerEl = el('div', outerEl);
      const outer = scopeOn(outerEl, null, { active });
      const inner = scopeOn(innerEl, outer);
      const own = bind('own', 'mod+s', { description: 'Own' });
      const nested = bind('nested', 'mod+k', { description: 'Nested' });
      registry.register(source(own), outer);
      registry.register(source(nested), inner);
      const target = el('button', innerEl);

      press(target, 's', { ctrlKey: true });
      press(target, 'k', { ctrlKey: true });
      expect(own.run).not.toHaveBeenCalled();
      expect(nested.run).not.toHaveBeenCalled();
      expect(registry.liveGroupsFor(target)).toEqual([]);

      active.set(true);
      press(target, 's', { ctrlKey: true });
      press(target, 'k', { ctrlKey: true });
      expect(own.run).toHaveBeenCalledOnce();
      expect(nested.run).toHaveBeenCalledOnce();
      expect(registry.liveGroupsFor(target)[0].bindings.map((b) => b.id)).toEqual([
        'own',
        'nested',
      ]);
    });
  });

  describe('scope lifetime', () => {
    function fakeDestroyRef(): { ref: DestroyRef; destroy: () => void } {
      const callbacks: Array<() => void> = [];
      const ref = {
        onDestroy: (fn: () => void) => {
          callbacks.push(fn);
          return () => undefined;
        },
      } as unknown as DestroyRef;
      return { ref, destroy: () => callbacks.forEach((fn) => fn()) };
    }

    it('drops a released modal scope from resolution while its element lives on', () => {
      const registry = makeRegistry();
      const container = el();
      const owner = fakeDestroyRef();
      createHotkeyScope({
        element: container,
        modal: signal(true),
        parent: null,
        destroyRef: owner.ref,
      });
      const save = bind('save', 'mod+s');
      registry.register(source(save), null);
      const target = el('button', container);

      press(target, 's', { ctrlKey: true });
      expect(save.run).not.toHaveBeenCalled();

      owner.destroy();
      press(target, 's', { ctrlKey: true });
      expect(save.run).toHaveBeenCalledOnce();
    });

    it('re-derives the listing when a scope is created or released on the context path', () => {
      const registry = makeRegistry();
      const region = el();
      const ctx = el('button', region);
      registry.register(source(bind('save', 'mod+s', { description: 'Save' })), null);
      const ids = computed(() =>
        registry.liveGroupsFor(ctx).flatMap((g) => g.bindings.map((b) => b.id)),
      );
      expect(ids()).toEqual(['save']);

      const owner = fakeDestroyRef();
      createHotkeyScope({
        element: region,
        modal: signal(true),
        parent: null,
        destroyRef: owner.ref,
      });
      expect(ids()).toEqual([]);

      owner.destroy();
      expect(ids()).toEqual(['save']);
    });
  });

  describe('listener lifetime', () => {
    function keydownCalls(spy: ReturnType<typeof vi.spyOn>): number {
      return spy.mock.calls.filter((call: unknown[]) => call[0] === 'keydown').length;
    }

    it('adds one listener for the first registration and removes it after the last', () => {
      const add = vi.spyOn(document, 'addEventListener');
      const remove = vi.spyOn(document, 'removeEventListener');
      const registry = makeRegistry();

      const a = registry.register(source(bind('a', 'a')), null);
      const b = registry.register(source(bind('b', 'b')), null);
      expect(keydownCalls(add)).toBe(1);

      a.unregister();
      expect(keydownCalls(remove)).toBe(0);
      b.unregister();
      b.unregister();
      expect(keydownCalls(remove)).toBe(1);

      registry.register(source(bind('c', 'c')), null);
      expect(keydownCalls(add)).toBe(2);
    });

    it('removes the listener and the registrations on destroy, twice safely', () => {
      const remove = vi.spyOn(document, 'removeEventListener');
      const registry = makeRegistry();
      const save = bind('save', 'mod+s', { description: 'Save' });
      registry.register(source(save), null);

      registry.destroy();
      registry.destroy();
      press(document, 's', { ctrlKey: true });

      expect(keydownCalls(remove)).toBe(1);
      expect(save.run).not.toHaveBeenCalled();
      expect(registry.liveGroupsFor(null)).toEqual([]);
    });

    it('stays inert after destroy', () => {
      const add = vi.spyOn(document, 'addEventListener');
      const registry = makeRegistry();
      registry.destroy();

      const late = bind('late', 'mod+s');
      registry.register(source(late), null);
      press(document, 's', { ctrlKey: true });

      expect(keydownCalls(add)).toBe(0);
      expect(late.run).not.toHaveBeenCalled();
    });

    it('never listens without a window (server)', () => {
      const serverDoc = document.implementation.createHTMLDocument('server');
      expect(serverDoc.defaultView).toBeNull();
      const add = vi.spyOn(serverDoc, 'addEventListener');
      const registry = makeRegistry(serverDoc);

      registry.register(source(bind('save', 'mod+s')), null);

      expect(keydownCalls(add)).toBe(0);
    });
  });

  describe('sources', () => {
    it('resolves a changing source without re-registration', () => {
      const registry = makeRegistry();
      const first = bind('first', 'mod+1');
      const second = bind('second', 'mod+2');
      const list: WritableSignal<readonly CngxHotkeyBinding[]> = signal([first]);
      registry.register(list.asReadonly(), null);

      list.set([second]);
      press(document, '1', { ctrlKey: true });
      press(document, '2', { ctrlKey: true });

      expect(first.run).not.toHaveBeenCalled();
      expect(second.run).toHaveBeenCalledOnce();
    });

    it('follows a Signal combo', () => {
      const registry = makeRegistry();
      const combo = signal('mod+b');
      const toggle = bind('toggle', combo);
      registry.register(source(toggle), null);

      combo.set('mod+j');
      press(document, 'b', { ctrlKey: true });
      press(document, 'j', { ctrlKey: true });

      expect(toggle.run).toHaveBeenCalledOnce();
    });
  });

  describe('liveGroupsFor', () => {
    it('groups described bindings, dedupes by id and skips undescribed ones', () => {
      const registry = makeRegistry();
      const group = signal('Editing');
      registry.register(
        source(
          bind('save', 'mod+s', { description: 'Save', group }),
          bind('silent', 'mod+u'),
          bind('help', '?', { description: 'Help' }),
        ),
        null,
      );
      registry.register(source(bind('save', 'mod+s', { description: 'Save', group })), null);

      expect(registry.liveGroupsFor(null)).toEqual([
        {
          group: 'Editing',
          bindings: [{ id: 'save', combo: 'mod+s', description: 'Save', group: 'Editing' }],
        },
        { group: null, bindings: [{ id: 'help', combo: '?', description: 'Help', group: null }] },
      ]);
    });

    it('lists what is live for the context: focus reach on its chain, nothing behind a modal', () => {
      const registry = makeRegistry();
      const list = el('ul');
      const dialogEl = el();
      scopeOn(dialogEl, null, { modal: signal(true) });
      registry.register(source(bind('save', 'mod+s', { description: 'Save' })), null);
      registry.register(
        source(bind('next', 'n', { description: 'Next', reach: 'focus' })),
        scopeOn(list),
      );
      const ids = (ctx: Element | null) =>
        registry.liveGroupsFor(ctx).flatMap((g) => g.bindings.map((b) => b.id));

      expect(ids(null)).toEqual(['save']);
      expect(ids(el('li', list))).toEqual(['save', 'next']);
      expect(ids(el('button', dialogEl))).toEqual([]);
    });

    it('keeps its array reference for unrelated registrations and new run identities', () => {
      const registry = makeRegistry();
      const ctx = el('button');
      const list: WritableSignal<readonly CngxHotkeyBinding[]> = signal([
        bind('save', 'mod+s', { description: 'Save' }),
      ]);
      registry.register(list.asReadonly(), null);
      const groups = computed(() => registry.liveGroupsFor(ctx));
      const first = groups();

      registry.register(
        source(bind('next', 'n', { description: 'Next', reach: 'focus' })),
        scopeOn(el('ul')),
      );
      expect(groups()).toBe(first);

      list.set([bind('save', 'mod+s', { description: 'Save' })]);
      expect(groups()).toBe(first);

      list.set([bind('save', 'mod+s', { description: 'Save now' })]);
      expect(groups()).not.toBe(first);
    });
  });

  describe('sidenav-shaped consumer', () => {
    it('fires inside its page-modal overlay, from outside while docked, never behind another modal', () => {
      const registry = makeRegistry();
      const surfaceEl = el('aside');
      const main = el('main');
      const dialogEl = el();
      const engaged = signal(false);
      const combo = signal('mod+b');
      const toggle = bind('sidenav.toggle', combo);
      registry.register(source(toggle), scopeOn(surfaceEl, null, { modal: engaged }));
      scopeOn(dialogEl, null, { modal: signal(true) });

      press(el('button', main), 'b', { ctrlKey: true });
      expect(toggle.run).toHaveBeenCalledTimes(1);

      engaged.set(true);
      press(el('a', surfaceEl), 'b', { ctrlKey: true });
      expect(toggle.run).toHaveBeenCalledTimes(2);

      press(el('button', dialogEl), 'b', { ctrlKey: true });
      expect(toggle.run).toHaveBeenCalledTimes(2);
    });
  });
});

describe('CNGX_HOTKEY_REGISTRY', () => {
  @Component({
    selector: 'cngx-hotkey-probe',
    template: '',
  })
  class Probe {
    readonly run = vi.fn();
    readonly ref: CngxHotkeyRef = injectHotkey({ id: 'probe', combo: 'mod+s', run: this.run });
  }

  @Component({
    template: `<section cngxHotkeyScope [cngxHotkeyScopeActive]="active()">
      @if (shown()) {
        <cngx-hotkey-probe />
      }
    </section>`,
    imports: [CngxHotkeyScope, Probe],
  })
  class Host {
    readonly active = signal(true);
    readonly shown = signal(true);
  }

  it('removes the listener on root teardown', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    TestBed.inject(CNGX_HOTKEY_REGISTRY).register(source(bind('a', 'a')), null);

    TestBed.resetTestingModule();

    expect(remove.mock.calls.some((call) => call[0] === 'keydown')).toBe(true);
  });

  it('registers in the [cngxHotkeyScope] subtree and unregisters with the component', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const probe = fixture.debugElement.children[0].children[0].componentInstance as Probe;

    expect(probe.ref.effectiveCombo()).toBe('mod+s');
    expect(probe.ref.muted()).toBe(false);
    press(document, 's', { ctrlKey: true });
    expect(probe.run).toHaveBeenCalledTimes(1);

    fixture.componentInstance.active.set(false);
    fixture.detectChanges();
    expect(probe.ref.muted()).toBe(true);
    press(document, 's', { ctrlKey: true });
    expect(probe.run).toHaveBeenCalledTimes(1);

    fixture.componentInstance.active.set(true);
    fixture.componentInstance.shown.set(false);
    fixture.detectChanges();
    press(document, 's', { ctrlKey: true });
    expect(probe.run).toHaveBeenCalledTimes(1);
  });
});
