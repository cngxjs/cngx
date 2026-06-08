import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createTabsHostAttrs } from './tabs-host-attrs';
import type {
  CngxTabAlign,
  CngxTabIconLayout,
  CngxTabsConfig,
  CngxTabsPanelMode,
  CngxTabsSkin,
} from './tabs-config';

const none = {
  skin: () => signal<CngxTabsSkin | undefined>(undefined),
  iconLayout: () => signal<CngxTabIconLayout | undefined>(undefined),
  panelMode: () => signal<CngxTabsPanelMode | undefined>(undefined),
  fitted: () => signal<boolean | undefined>(undefined),
  tabAlign: () => signal<CngxTabAlign | undefined>(undefined),
};

// Spread into each call so adding an axis doesn't touch every test.
const allNone = () => ({
  skin: none.skin(),
  iconLayout: none.iconLayout(),
  panelMode: none.panelMode(),
  fitted: none.fitted(),
  tabAlign: none.tabAlign(),
});

describe('createTabsHostAttrs', () => {
  describe('skin cascade (input > config > default)', () => {
    it('falls back to the library default when input and config are unset', () => {
      const attrs = createTabsHostAttrs({ ...allNone(), config: {} });
      expect(attrs.resolvedSkin()).toBe('line');
    });

    it('config wins over the library default', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        config: { skin: 'contained' } satisfies CngxTabsConfig,
      });
      expect(attrs.resolvedSkin()).toBe('contained');
    });

    it('per-instance input wins over config', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        skin: signal<CngxTabsSkin | undefined>('pill'),
        config: { skin: 'contained' },
      });
      expect(attrs.resolvedSkin()).toBe('pill');
    });

    it('reacts when the input changes', () => {
      const skin = signal<CngxTabsSkin | undefined>(undefined);
      const attrs = createTabsHostAttrs({
        ...allNone(),
        skin,
        config: { skin: 'contained' },
      });
      expect(attrs.resolvedSkin()).toBe('contained');
      skin.set('pill');
      expect(attrs.resolvedSkin()).toBe('pill');
    });
  });

  describe('iconLayout cascade (input > config > default)', () => {
    it('falls back to the library default when input and config are unset', () => {
      const attrs = createTabsHostAttrs({ ...allNone(), config: {} });
      expect(attrs.resolvedIconLayout()).toBe('start');
    });

    it('config wins over the library default', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        config: { iconLayout: 'top' },
      });
      expect(attrs.resolvedIconLayout()).toBe('top');
    });

    it('per-instance input wins over config', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        iconLayout: signal<CngxTabIconLayout | undefined>('only'),
        config: { iconLayout: 'top' },
      });
      expect(attrs.resolvedIconLayout()).toBe('only');
    });
  });

  describe('panelMode cascade (input > config > default)', () => {
    it('falls back to eager when input and config are unset', () => {
      const attrs = createTabsHostAttrs({ ...allNone(), config: {} });
      expect(attrs.resolvedPanelMode()).toBe('eager');
    });

    it('config wins over the default', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        config: { panelMode: 'lazy' },
      });
      expect(attrs.resolvedPanelMode()).toBe('lazy');
    });

    it('per-instance input wins over config', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        panelMode: signal<CngxTabsPanelMode | undefined>('lazy-destroy'),
        config: { panelMode: 'lazy' },
      });
      expect(attrs.resolvedPanelMode()).toBe('lazy-destroy');
    });
  });

  describe('fitted cascade (input > config > default)', () => {
    it('falls back to false when input and config are unset', () => {
      const attrs = createTabsHostAttrs({ ...allNone(), config: {} });
      expect(attrs.resolvedFitted()).toBe(false);
    });

    it('config wins over the default', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        config: { fitted: true },
      });
      expect(attrs.resolvedFitted()).toBe(true);
    });

    it('per-instance input wins over config', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        fitted: signal<boolean | undefined>(false),
        config: { fitted: true },
      });
      expect(attrs.resolvedFitted()).toBe(false);
    });
  });

  describe('tabAlign cascade (input > config > default)', () => {
    it('falls back to start when input and config are unset', () => {
      const attrs = createTabsHostAttrs({ ...allNone(), config: {} });
      expect(attrs.resolvedTabAlign()).toBe('start');
    });

    it('config wins over the default', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        config: { tabAlign: 'center' },
      });
      expect(attrs.resolvedTabAlign()).toBe('center');
    });

    it('per-instance input wins over config', () => {
      const attrs = createTabsHostAttrs({
        ...allNone(),
        tabAlign: signal<CngxTabAlign | undefined>('end'),
        config: { tabAlign: 'center' },
      });
      expect(attrs.resolvedTabAlign()).toBe('end');
    });
  });

  it('resolves all axes independently from one config', () => {
    const attrs = createTabsHostAttrs({
      ...allNone(),
      skin: signal<CngxTabsSkin | undefined>('pill'),
      panelMode: signal<CngxTabsPanelMode | undefined>('lazy'),
      config: { iconLayout: 'top', fitted: true, tabAlign: 'end' },
    });
    expect(attrs.resolvedSkin()).toBe('pill');
    expect(attrs.resolvedIconLayout()).toBe('top');
    expect(attrs.resolvedPanelMode()).toBe('lazy');
    expect(attrs.resolvedFitted()).toBe(true);
    expect(attrs.resolvedTabAlign()).toBe('end');
  });
});
