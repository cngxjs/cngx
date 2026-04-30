import { Component, signal, type TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { injectResolvedTagTemplate } from '../shared/inject-resolved-template';
import { CngxTag } from '../tag.directive';
import { withTagColors, withTagDefaults, withTagSlots } from './features';
import { injectTagConfig } from './inject-tag-config';
import { provideTagConfig, provideTagConfigAt } from './provide-tag-config';
import { CNGX_TAG_DEFAULTS } from './tag.config.defaults';

@Component({
  imports: [CngxTag],
  template: `<span cngxTag data-testid="tag">x</span>`,
})
class TagHost {}

@Component({
  imports: [CngxTag],
  viewProviders: [provideTagConfigAt(withTagDefaults({ variant: 'outline' }))],
  template: `<span cngxTag data-testid="tag-in-parent">x</span>`,
})
class ParentScopedHost {}

@Component({
  imports: [CngxTag],
  viewProviders: [provideTagConfigAt(withTagDefaults({ variant: 'outline' }))],
  template: `<span cngxTag variant="filled" data-testid="tag-override">x</span>`,
})
class InstanceOverrideHost {}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxTagConfig — resolution priority (Phase 4)', () => {
  it('(a) library default reaches the directive when no provider is present', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.classList.contains('cngx-tag--filled')).toBe(true);
    expect(host.classList.contains('cngx-tag--md')).toBe(true);
    expect(host.getAttribute('data-color')).toBe('neutral');
  });

  it('(b) provideTagConfig at root overrides library defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideTagConfig(withTagDefaults({ variant: 'subtle' }))],
    });
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.classList.contains('cngx-tag--subtle')).toBe(true);
    expect(host.classList.contains('cngx-tag--filled')).toBe(false);
  });

  it('(c) provideTagConfigAt in viewProviders overrides root provider', () => {
    TestBed.configureTestingModule({
      providers: [provideTagConfig(withTagDefaults({ variant: 'subtle' }))],
    });
    const fixture = TestBed.createComponent(ParentScopedHost);
    flush(fixture);
    const tag: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag-in-parent"]');
    expect(tag.classList.contains('cngx-tag--outline')).toBe(true);
    expect(tag.classList.contains('cngx-tag--subtle')).toBe(false);
    expect(tag.classList.contains('cngx-tag--filled')).toBe(false);
  });

  it('(d) per-instance [variant] override beats viewProviders cascade', () => {
    const fixture = TestBed.createComponent(InstanceOverrideHost);
    flush(fixture);
    const tag: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag-override"]');
    expect(tag.classList.contains('cngx-tag--filled')).toBe(true);
    expect(tag.classList.contains('cngx-tag--outline')).toBe(false);
  });

  it('(e) injectResolvedTagTemplate resolves to config.templates[key] when no slot directive is projected (tier-2 cascade)', () => {
    // Synthetic `TemplateRef` — the helper only checks reference
    // identity, never invokes `createEmbeddedView`. A mock object
    // exercises the cascade without TemplateRef materialisation
    // plumbing (capturing a real ref via viewChild before the
    // directive renders requires a two-stage fixture; the tier
    // semantic is identity-only, so the simpler proof suffices).
    const fakeTpl = {} as TemplateRef<unknown>;
    TestBed.configureTestingModule({
      providers: [provideTagConfig(withTagSlots({ label: fakeTpl }))],
    });

    const result = TestBed.runInInjectionContext(() => {
      // Empty content-child signal — simulates "no consumer projected
      // *cngxTagLabel": tier 1 misses, tier 2 wins.
      const noSlot = signal<undefined>(undefined);
      return injectResolvedTagTemplate(noSlot, 'label');
    });

    expect(result()).toBe(fakeTpl);
  });

  it('(e2) injectResolvedTagTemplate prefers instance slot over config tier (tier-1 wins over tier-2)', () => {
    const configTpl = {} as TemplateRef<unknown>;
    const instanceTpl = {} as TemplateRef<unknown>;
    TestBed.configureTestingModule({
      providers: [provideTagConfig(withTagSlots({ label: configTpl }))],
    });

    const result = TestBed.runInInjectionContext(() => {
      const slotSignal = signal<{ templateRef: TemplateRef<unknown> } | undefined>({
        templateRef: instanceTpl,
      });
      return injectResolvedTagTemplate(slotSignal, 'label');
    });

    expect(result()).toBe(instanceTpl);
    expect(result()).not.toBe(configTpl);
  });

  it('(f) withTagColors registers consumer entries on injectTagConfig().colors', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTagConfig(
          withTagColors({
            'my-brand': { bg: '#4f46e5', color: '#ffffff', border: 'transparent' },
          }),
        ),
      ],
    });
    const cfg = TestBed.runInInjectionContext(() => injectTagConfig());
    expect(cfg.colors?.['my-brand']).toEqual({
      bg: '#4f46e5',
      color: '#ffffff',
      border: 'transparent',
    });
  });

  it('(g) provideTagConfig() with zero features preserves CNGX_TAG_DEFAULTS reference identity', () => {
    TestBed.configureTestingModule({
      providers: [provideTagConfig()],
    });
    const cfg = TestBed.runInInjectionContext(() => injectTagConfig());
    // Reference equality — the empty-features guard skips re-providing the
    // token, so the root factory's `CNGX_TAG_DEFAULTS` reference flows
    // through unchanged. A fresh `mergeConfig(...)` would compare equal
    // structurally but break this `.toBe` identity check.
    expect(cfg).toBe(CNGX_TAG_DEFAULTS);
  });
});
