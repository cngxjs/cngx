import { signal, type Signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CngxHotkeyBinding } from './hotkey-binding';
import { createHotkeyRegistry, type CngxHotkeyRegistry } from './hotkey-registry';

const created: CngxHotkeyRegistry[] = [];

function makeRegistry(isMac = false): CngxHotkeyRegistry {
  const registry = createHotkeyRegistry({ doc: document, isMac });
  created.push(registry);
  return registry;
}

function source(
  ...bindings: Array<[id: string, combo: string]>
): Signal<readonly CngxHotkeyBinding[]> {
  return signal<readonly CngxHotkeyBinding[]>(
    bindings.map(([id, combo]) => ({ id, combo, run: () => undefined })),
  ).asReadonly();
}

function codes(warn: ReturnType<typeof vi.spyOn>): string[] {
  return warn.mock.calls.map((call: unknown[]) => String(call[0]).slice(0, 8));
}

function pressCtrlS(): void {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }),
  );
}

afterEach(() => {
  created.splice(0).forEach((r) => r.destroy());
  vi.restoreAllMocks();
});

describe('hotkey registry diagnostics', () => {
  it('warns CNGX1077 once per id pair when two bindings tie on a press', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const registry = makeRegistry();
    registry.register(source(['a.save', 'mod+s']), null);
    registry.register(source(['b.save', 'mod+s']), null);

    pressCtrlS();
    pressCtrlS();

    expect(codes(warn)).toEqual(['CNGX1077']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1077: createHotkeyRegistry\(\): /),
      expect.anything(),
    );
    expect(String(warn.mock.calls[0][0])).toContain('"b.save" (registered last) runs');
  });

  it('warns CNGX1078 for a browser-reserved combo on the current platform', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    makeRegistry(false).register(source(['close', 'mod+w'], ['tabs', 'ctrl+tab']), null);
    makeRegistry(true).register(source(['quit', 'meta+q'], ['fine', 'ctrl+w']), null);

    expect(codes(warn)).toEqual(['CNGX1078', 'CNGX1078', 'CNGX1078']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1078: createHotkeyRegistry\(\): /),
      expect.anything(),
    );
  });

  it('warns CNGX1079 for ctrl+alt and mod+alt combos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    makeRegistry().register(
      source(['euro', 'ctrl+alt+e'], ['mod-alt', 'mod+alt+k'], ['plain', 'alt+k']),
      null,
    );

    expect(codes(warn)).toEqual(['CNGX1079', 'CNGX1079']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1079: createHotkeyRegistry\(\): /),
      expect.anything(),
    );
  });

  it('warns CNGX1080 for unparseable combos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    makeRegistry().register(
      source(['dangling', 'ctrl+'], ['typo', 'hyper+k'], ['plus', 'mod++']),
      null,
    );

    expect(codes(warn)).toEqual(['CNGX1080', 'CNGX1080']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1080: createHotkeyRegistry\(\): /),
      expect.anything(),
    );
  });

  it('stays silent when ngDevMode is off, as in a production build', () => {
    vi.stubGlobal('ngDevMode', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const registry = makeRegistry();
    registry.register(source(['a', 'mod+s'], ['reserved', 'mod+w'], ['altgr', 'ctrl+alt+e']), null);
    registry.register(source(['b', 'mod+s'], ['bad', 'hyper+k']), null);

    pressCtrlS();

    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
