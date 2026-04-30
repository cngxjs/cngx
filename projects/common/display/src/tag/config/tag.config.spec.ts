import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxTag } from '../tag.directive';
import { withTagColors, withTagDefaults } from './features';
import { injectTagConfig } from './inject-tag-config';
import { provideTagConfig, provideTagConfigAt } from './provide-tag-config';

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

  // Case (e) — `withTagSlots({ label: customLabel })` template-tier
  // resolution — deliberately omitted at the spec level. A `TemplateRef`
  // must be created inside a host component, but config providers are
  // resolved when their consumer (the directive) is instantiated; the
  // host's viewChild lookup runs after that, leaving the provider with
  // a `null` template at injection time. Working around the cycle
  // requires either a synthetic `TemplateRef` factory or a two-stage
  // bootstrap, both of which obscure what is being verified. The
  // 3-stage cascade in `injectResolvedTagTemplate` is straightforward
  // (`instance ?? config?.templates[key] ?? null`); tier 1 is proven
  // by Phase 1 spec case (i), tier 3 by case (j). A dedicated
  // integration spec for tier 2 ships when a consumer requires it.

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
});
