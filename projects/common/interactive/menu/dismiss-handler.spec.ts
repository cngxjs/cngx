import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMenuDismissHandler,
  createMenuTriggerDismissBinding,
  type CngxMenuDismissHandlerOptions,
  type CngxMenuDismissPopoverRef,
  type CngxMenuDismissSource,
} from './dismiss-handler';
import { DEFAULT_MENU_CONFIG, type CngxMenuConfig } from './menu-config';

type FakePopover = CngxMenuDismissPopoverRef & {
  hide: ReturnType<typeof vi.fn>;
  setVisible: (v: boolean) => void;
};

function makePopover(): { popover: FakePopover; element: HTMLElement } {
  const element = document.createElement('div');
  element.className = 'cngx-fake-popover';
  document.body.appendChild(element);
  let visible = true;
  const popover: FakePopover = {
    isVisible: () => visible,
    hide: vi.fn(() => {
      visible = false;
    }),
    elementRef: { nativeElement: element },
    setVisible: (v: boolean) => {
      visible = v;
    },
  };
  return { popover, element };
}

function makeHost(): HTMLElement {
  const host = document.createElement('button');
  host.type = 'button';
  host.className = 'cngx-fake-trigger';
  document.body.appendChild(host);
  return host;
}

function dispatchPointerDownOn(target: Element): void {
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
}

describe('createMenuDismissHandler', () => {
  let popoverFake: ReturnType<typeof makePopover>;
  let hostEl: HTMLElement;
  let outside: HTMLElement;

  beforeEach(() => {
    popoverFake = makePopover();
    hostEl = makeHost();
    outside = document.createElement('div');
    outside.className = 'cngx-fake-outside';
    document.body.appendChild(outside);
  });

  afterEach(() => {
    popoverFake.element.remove();
    hostEl.remove();
    outside.remove();
  });

  function build(
    overrides: Partial<CngxMenuDismissHandlerOptions> = {},
  ): {
    onDismiss: ReturnType<typeof vi.fn<(source: CngxMenuDismissSource) => void>>;
    teardown: () => void;
  } {
    const onDismiss = vi.fn<(source: CngxMenuDismissSource) => void>();
    const handler = createMenuDismissHandler({
      popover: popoverFake.popover,
      hostElement: hostEl,
      dismissOnOutsideClick: false,
      dismissOnScroll: false,
      dismissOnBlur: false,
      onDismiss,
      ...overrides,
    });
    return { onDismiss, teardown: handler.attach() };
  }

  describe('outside-click', () => {
    it('does NOT dismiss when target is inside the popover', () => {
      const { onDismiss, teardown } = build({ dismissOnOutsideClick: true });
      const inner = document.createElement('span');
      popoverFake.element.appendChild(inner);
      try {
        dispatchPointerDownOn(inner);
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('does NOT dismiss when target is inside the trigger host', () => {
      const { onDismiss, teardown } = build({ dismissOnOutsideClick: true });
      const inner = document.createElement('span');
      hostEl.appendChild(inner);
      try {
        dispatchPointerDownOn(inner);
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('dismisses on left-button pointerdown outside both popover and host', () => {
      const { onDismiss, teardown } = build({ dismissOnOutsideClick: true });
      try {
        outside.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, button: 0 }),
        );
        expect(popoverFake.popover.hide).toHaveBeenCalledTimes(1);
        expect(onDismiss).toHaveBeenCalledWith('outside-click');
      } finally {
        teardown();
      }
    });

    it('dismisses on right-button pointerdown outside both popover and host', () => {
      const { onDismiss, teardown } = build({ dismissOnOutsideClick: true });
      try {
        outside.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, button: 2 }),
        );
        expect(popoverFake.popover.hide).toHaveBeenCalledTimes(1);
        expect(onDismiss).toHaveBeenCalledWith('outside-click');
      } finally {
        teardown();
      }
    });

    it('is a no-op when the popover reports closed at fire time', () => {
      const { onDismiss, teardown } = build({ dismissOnOutsideClick: true });
      popoverFake.popover.setVisible(false);
      try {
        dispatchPointerDownOn(outside);
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });
  });

  describe('scroll', () => {
    it('dismisses on window scroll', () => {
      const { onDismiss, teardown } = build({ dismissOnScroll: true });
      try {
        window.dispatchEvent(new Event('scroll'));
        expect(popoverFake.popover.hide).toHaveBeenCalledTimes(1);
        expect(onDismiss).toHaveBeenCalledWith('scroll');
      } finally {
        teardown();
      }
    });

    it('is a no-op when the popover reports closed', () => {
      const { onDismiss, teardown } = build({ dismissOnScroll: true });
      popoverFake.popover.setVisible(false);
      try {
        window.dispatchEvent(new Event('scroll'));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });
  });

  describe('blur + pointercancel (bundled)', () => {
    it('dismisses on window blur', () => {
      const { onDismiss, teardown } = build({ dismissOnBlur: true });
      try {
        window.dispatchEvent(new Event('blur'));
        expect(popoverFake.popover.hide).toHaveBeenCalledTimes(1);
        expect(onDismiss).toHaveBeenCalledWith('blur');
      } finally {
        teardown();
      }
    });

    it('dismisses on document pointercancel originating outside the popover', () => {
      const { onDismiss, teardown } = build({ dismissOnBlur: true });
      try {
        outside.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(popoverFake.popover.hide).toHaveBeenCalledTimes(1);
        expect(onDismiss).toHaveBeenCalledWith('pointer-cancel');
      } finally {
        teardown();
      }
    });

    it('does NOT dismiss on pointercancel inside the popover', () => {
      const { onDismiss, teardown } = build({ dismissOnBlur: true });
      const inner = document.createElement('span');
      popoverFake.element.appendChild(inner);
      try {
        inner.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('does NOT dismiss on pointercancel inside the trigger host', () => {
      const { onDismiss, teardown } = build({ dismissOnBlur: true });
      const inner = document.createElement('span');
      hostEl.appendChild(inner);
      try {
        inner.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('disabling dismissOnBlur removes BOTH blur and pointercancel listeners', () => {
      const { onDismiss, teardown } = build({ dismissOnBlur: false });
      try {
        window.dispatchEvent(new Event('blur'));
        document.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });
  });

  describe('escape (factory-owned, always on)', () => {
    it('records escape as the dismissal source on Escape keydown', () => {
      const { onDismiss, teardown } = build();
      try {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(onDismiss).toHaveBeenCalledWith('escape');
      } finally {
        teardown();
      }
    });

    it('does NOT call popover.hide() for escape (popover owns closeOnEscape)', () => {
      const { teardown } = build();
      try {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('ignores non-Escape keys', () => {
      const { onDismiss, teardown } = build();
      try {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('is a no-op when the popover is closed', () => {
      const { onDismiss, teardown } = build();
      popoverFake.popover.setVisible(false);
      try {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('fires from any target, not just the trigger host', () => {
      const { onDismiss, teardown } = build();
      try {
        outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(onDismiss).toHaveBeenCalledWith('escape');
      } finally {
        teardown();
      }
    });
  });

  describe('skipSources (granular per-source opt-out)', () => {
    it('skipping pointer-cancel keeps blur installed', () => {
      const { onDismiss, teardown } = build({
        dismissOnBlur: true,
        skipSources: new Set(['pointer-cancel']),
      });
      try {
        window.dispatchEvent(new Event('blur'));
        expect(onDismiss).toHaveBeenCalledWith('blur');
        outside.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(onDismiss).toHaveBeenCalledTimes(1);
      } finally {
        teardown();
      }
    });

    it('skipping blur keeps pointer-cancel installed', () => {
      const { onDismiss, teardown } = build({
        dismissOnBlur: true,
        skipSources: new Set(['blur']),
      });
      try {
        window.dispatchEvent(new Event('blur'));
        expect(onDismiss).not.toHaveBeenCalled();
        outside.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(onDismiss).toHaveBeenCalledWith('pointer-cancel');
      } finally {
        teardown();
      }
    });

    it('skipping escape stops the keydown listener from recording', () => {
      const { onDismiss, teardown } = build({
        skipSources: new Set(['escape']),
      });
      try {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('skipping outside-click stops the pointerdown listener', () => {
      const { onDismiss, teardown } = build({
        dismissOnOutsideClick: true,
        skipSources: new Set(['outside-click']),
      });
      try {
        dispatchPointerDownOn(outside);
        expect(onDismiss).not.toHaveBeenCalled();
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });
  });

  describe('teardown', () => {
    it('removes every installed listener', () => {
      const { onDismiss, teardown } = build({
        dismissOnOutsideClick: true,
        dismissOnScroll: true,
        dismissOnBlur: true,
      });
      teardown();

      dispatchPointerDownOn(outside);
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('blur'));
      outside.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(popoverFake.popover.hide).not.toHaveBeenCalled();
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('per-flag independence', () => {
    it('outside-click only: scroll and blur do nothing', () => {
      const { teardown } = build({ dismissOnOutsideClick: true });
      try {
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('blur'));
        outside.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('scroll only: outside-click and blur do nothing', () => {
      const { teardown } = build({ dismissOnScroll: true });
      try {
        dispatchPointerDownOn(outside);
        window.dispatchEvent(new Event('blur'));
        outside.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('blur only: outside-click and scroll do nothing', () => {
      const { teardown } = build({ dismissOnBlur: true });
      try {
        dispatchPointerDownOn(outside);
        window.dispatchEvent(new Event('scroll'));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });

    it('all three off: nothing fires', () => {
      const { teardown } = build();
      try {
        dispatchPointerDownOn(outside);
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('blur'));
        outside.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        expect(popoverFake.popover.hide).not.toHaveBeenCalled();
      } finally {
        teardown();
      }
    });
  });
});

describe('createMenuTriggerDismissBinding', () => {
  let popoverFake: ReturnType<typeof makePopover>;
  let hostEl: HTMLElement;
  let outside: HTMLElement;

  beforeEach(() => {
    popoverFake = makePopover();
    hostEl = makeHost();
    outside = document.createElement('div');
    document.body.appendChild(outside);
  });

  afterEach(() => {
    popoverFake.element.remove();
    hostEl.remove();
    outside.remove();
  });

  function build(configOverrides: Partial<CngxMenuConfig> = {}) {
    return createMenuTriggerDismissBinding({
      popover: () => popoverFake.popover,
      hostElement: hostEl,
      menuConfig: { ...DEFAULT_MENU_CONFIG, ...configOverrides },
      factory: createMenuDismissHandler,
    });
  }

  it('starts with lastSource = null', () => {
    const binding = build();
    expect(binding.lastSource()).toBeNull();
  });

  it('attach() installs listeners; outside-click writes lastSource', () => {
    const binding = build({ dismissOnOutsideClick: true });
    binding.attach();
    try {
      dispatchPointerDownOn(outside);
      expect(binding.lastSource()).toBe('outside-click');
      expect(popoverFake.popover.hide).toHaveBeenCalledTimes(1);
    } finally {
      binding.detach();
    }
  });

  it('attach() is idempotent within a single open cycle', () => {
    const binding = build({ dismissOnOutsideClick: true });
    binding.attach();
    binding.attach();
    binding.attach();
    try {
      dispatchPointerDownOn(outside);
      expect(popoverFake.popover.hide).toHaveBeenCalledTimes(1);
    } finally {
      binding.detach();
    }
  });

  it('detach() is idempotent', () => {
    const binding = build({ dismissOnOutsideClick: true });
    binding.attach();
    binding.detach();
    binding.detach();
    dispatchPointerDownOn(outside);
    expect(popoverFake.popover.hide).not.toHaveBeenCalled();
  });

  it('records escape via the factory listener while attached', () => {
    const binding = build({ dismissOnOutsideClick: true });
    binding.attach();
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(binding.lastSource()).toBe('escape');
    } finally {
      binding.detach();
    }
  });

  it('reattaches across open cycles and keeps lastSource sticky between cycles', () => {
    const binding = build({ dismissOnOutsideClick: true });
    binding.attach();
    dispatchPointerDownOn(outside);
    expect(binding.lastSource()).toBe('outside-click');
    binding.detach();
    // lastSource sticks between opens — consumer telemetry reads the
    // most recent close even when the menu is closed.
    expect(binding.lastSource()).toBe('outside-click');
    popoverFake.popover.setVisible(true);
    binding.attach();
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(binding.lastSource()).toBe('escape');
    } finally {
      binding.detach();
    }
  });
});
