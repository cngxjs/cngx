import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_PANEL_RENDERER_FACTORY, createIdentityPanelRenderer } from './panel-renderer';
import type { CngxSelectOptionDef } from './option.model';

type T = string;

function opt(value: T): CngxSelectOptionDef<T> {
  return { value, label: value, disabled: false };
}

describe('createIdentityPanelRenderer', () => {
  it('passes flatOptions through as renderOptions verbatim', () => {
    const flat = signal<readonly CngxSelectOptionDef<T>[]>([opt('a'), opt('b')]);
    const renderer = createIdentityPanelRenderer({ flatOptions: flat });
    // Identity renderer must not copy - same signal reference feeds the panel.
    expect(renderer.renderOptions).toBe(flat);
    expect(renderer.renderOptions()).toBe(flat());
  });

  it('reflects flatOptions updates reactively', () => {
    const flat = signal<readonly CngxSelectOptionDef<T>[]>([opt('a')]);
    const renderer = createIdentityPanelRenderer({ flatOptions: flat });
    flat.set([opt('a'), opt('b'), opt('c')]);
    expect(renderer.renderOptions().map((o) => o.value)).toEqual(['a', 'b', 'c']);
  });

  it('exposes no windowing metadata (pass-through has no virtualiser)', () => {
    const renderer = createIdentityPanelRenderer({
      flatOptions: signal<readonly CngxSelectOptionDef<T>[]>([]),
    });
    expect(renderer.totalCount).toBeUndefined();
    expect(renderer.virtualizer).toBeUndefined();
  });
});

describe('CNGX_PANEL_RENDERER_FACTORY', () => {
  it('defaults to createIdentityPanelRenderer', () => {
    expect(TestBed.inject(CNGX_PANEL_RENDERER_FACTORY)).toBe(createIdentityPanelRenderer);
  });
});
