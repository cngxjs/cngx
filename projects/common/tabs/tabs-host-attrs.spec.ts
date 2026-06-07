import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createTabsHostAttrs } from './tabs-host-attrs';
import type {
  CngxTabIconLayout,
  CngxTabsConfig,
  CngxTabsPanelMode,
  CngxTabsSkin,
} from './tabs-config';

const none = {
  skin: () => signal<CngxTabsSkin | undefined>(undefined),
  iconLayout: () => signal<CngxTabIconLayout | undefined>(undefined),
  panelMode: () => signal<CngxTabsPanelMode | undefined>(undefined),
};

describe('createTabsHostAttrs', () => {
  describe('skin cascade (input > config > default)', () => {
    it('falls back to the library default when input and config are unset', () => {
      const attrs = createTabsHostAttrs({
        skin: none.skin(),
        iconLayout: none.iconLayout(),
        panelMode: none.panelMode(),
        config: {},
      });
      expect(attrs.resolvedSkin()).toBe('line');
    });

    it('config wins over the library default', () => {
      const attrs = createTabsHostAttrs({
        skin: none.skin(),
        iconLayout: none.iconLayout(),
        panelMode: none.panelMode(),
        config: { skin: 'contained' } satisfies CngxTabsConfig,
      });
      expect(attrs.resolvedSkin()).toBe('contained');
    });

    it('per-instance input wins over config', () => {
      const attrs = createTabsHostAttrs({
        skin: signal<CngxTabsSkin | undefined>('pill'),
        iconLayout: none.iconLayout(),
        panelMode: none.panelMode(),
        config: { skin: 'contained' },
      });
      expect(attrs.resolvedSkin()).toBe('pill');
    });

    it('reacts when the input changes', () => {
      const skin = signal<CngxTabsSkin | undefined>(undefined);
      const attrs = createTabsHostAttrs({
        skin,
        iconLayout: none.iconLayout(),
        panelMode: none.panelMode(),
        config: { skin: 'contained' },
      });
      expect(attrs.resolvedSkin()).toBe('contained');
      skin.set('pill');
      expect(attrs.resolvedSkin()).toBe('pill');
    });
  });

  describe('iconLayout cascade (input > config > default)', () => {
    it('falls back to the library default when input and config are unset', () => {
      const attrs = createTabsHostAttrs({
        skin: none.skin(),
        iconLayout: none.iconLayout(),
        panelMode: none.panelMode(),
        config: {},
      });
      expect(attrs.resolvedIconLayout()).toBe('start');
    });

    it('config wins over the library default', () => {
      const attrs = createTabsHostAttrs({
        skin: none.skin(),
        iconLayout: none.iconLayout(),
        panelMode: none.panelMode(),
        config: { iconLayout: 'top' },
      });
      expect(attrs.resolvedIconLayout()).toBe('top');
    });

    it('per-instance input wins over config', () => {
      const attrs = createTabsHostAttrs({
        skin: none.skin(),
        iconLayout: signal<CngxTabIconLayout | undefined>('only'),
        panelMode: none.panelMode(),
        config: { iconLayout: 'top' },
      });
      expect(attrs.resolvedIconLayout()).toBe('only');
    });
  });

  describe('panelMode cascade (input > config > default)', () => {
    it('falls back to eager when input and config are unset', () => {
      const attrs = createTabsHostAttrs({
        skin: none.skin(),
        iconLayout: none.iconLayout(),
        panelMode: none.panelMode(),
        config: {},
      });
      expect(attrs.resolvedPanelMode()).toBe('eager');
    });

    it('config wins over the default', () => {
      const attrs = createTabsHostAttrs({
        skin: none.skin(),
        iconLayout: none.iconLayout(),
        panelMode: none.panelMode(),
        config: { panelMode: 'lazy' },
      });
      expect(attrs.resolvedPanelMode()).toBe('lazy');
    });

    it('per-instance input wins over config', () => {
      const attrs = createTabsHostAttrs({
        skin: none.skin(),
        iconLayout: none.iconLayout(),
        panelMode: signal<CngxTabsPanelMode | undefined>('lazy-destroy'),
        config: { panelMode: 'lazy' },
      });
      expect(attrs.resolvedPanelMode()).toBe('lazy-destroy');
    });
  });

  it('resolves all three axes independently from one config', () => {
    const attrs = createTabsHostAttrs({
      skin: signal<CngxTabsSkin | undefined>('pill'),
      iconLayout: none.iconLayout(),
      panelMode: signal<CngxTabsPanelMode | undefined>('lazy'),
      config: { iconLayout: 'top' },
    });
    expect(attrs.resolvedSkin()).toBe('pill');
    expect(attrs.resolvedIconLayout()).toBe('top');
    expect(attrs.resolvedPanelMode()).toBe('lazy');
  });
});
