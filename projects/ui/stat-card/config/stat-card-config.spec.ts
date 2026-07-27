import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxStatCard } from '../stat-card.component';
import { withStatCardAriaLabels, withStatCardLoadingTreatment } from './features';
import { injectStatCardConfig } from './inject-stat-card-config';
import { provideStatCardConfig, provideStatCardConfigAt } from './provide-stat-card-config';
import { CNGX_STAT_CARD_DEFAULTS } from './stat-card.config.defaults';

describe('CNGX_STAT_CARD_CONFIG cascade', () => {
  function read() {
    return TestBed.runInInjectionContext(() => injectStatCardConfig());
  }

  it('exposes the English library defaults without any provider', () => {
    expect(read()).toEqual({
      ariaLabels: {
        busy: 'Loading',
        errorFallback: 'Could not load',
        staleFallback: 'Showing last known value',
      },
      loadingTreatment: 'auto',
    });
  });

  it('keeps the defaults reference intact for an empty provider call', () => {
    TestBed.configureTestingModule({ providers: [provideStatCardConfig()] });
    expect(read()).toBe(CNGX_STAT_CARD_DEFAULTS);
  });

  it('deep-merges a partial ariaLabels override, keeping untouched keys', () => {
    TestBed.configureTestingModule({
      providers: [provideStatCardConfig(withStatCardAriaLabels({ errorFallback: 'Nicht da' }))],
    });
    const cfg = read();
    expect(cfg.ariaLabels?.errorFallback).toBe('Nicht da');
    expect(cfg.ariaLabels?.busy).toBe('Loading');
    expect(cfg.loadingTreatment).toBe('auto');
  });

  it('overrides the flat loadingTreatment scalar', () => {
    TestBed.configureTestingModule({
      providers: [provideStatCardConfig(withStatCardLoadingTreatment('skeleton'))],
    });
    expect(read().loadingTreatment).toBe('skeleton');
    expect(read().ariaLabels?.busy).toBe('Loading');
  });

  it('lets a later feature win over an earlier one', () => {
    TestBed.configureTestingModule({
      providers: [
        provideStatCardConfig(
          withStatCardLoadingTreatment('spinner'),
          withStatCardLoadingTreatment('skeleton'),
        ),
      ],
    });
    expect(read().loadingTreatment).toBe('skeleton');
  });
});

@Component({
  standalone: true,
  imports: [CngxStatCard],
  viewProviders: [provideStatCardConfigAt(withStatCardAriaLabels({ errorFallback: 'Scoped' }))],
  template: `<cngx-stat-card />`,
})
class ScopedHost {}

@Component({
  standalone: true,
  imports: [CngxStatCard],
  viewProviders: [provideStatCardConfigAt(withStatCardAriaLabels({ errorFallback: 'Scoped' }))],
  template: `<cngx-stat-card [errorText]="override()" />`,
})
class ScopedHostWithInput {
  override = signal('Instance');
}

describe('stat-card config resolution order', () => {
  it('layers provideStatCardConfigAt on top of the root cascade', () => {
    TestBed.configureTestingModule({
      imports: [ScopedHost],
      providers: [
        provideStatCardConfig(
          withStatCardAriaLabels({ errorFallback: 'Root', busy: 'Root busy' }),
        ),
      ],
    });
    const fixture = TestBed.createComponent(ScopedHost);
    fixture.detectChanges();

    const card = fixture.debugElement
      .query((node) => node.name === 'cngx-stat-card')
      .componentInstance as CngxStatCard;

    // At-scope wins for the key it sets; the root value survives for the rest.
    expect(card.errorText()).toBe('Scoped');
    expect(card.busyLabel()).toBe('Root busy');
  });

  it('gives a per-instance input precedence over both provider levels', () => {
    TestBed.configureTestingModule({
      imports: [ScopedHostWithInput],
      providers: [provideStatCardConfig(withStatCardAriaLabels({ errorFallback: 'Root' }))],
    });
    const fixture = TestBed.createComponent(ScopedHostWithInput);
    fixture.detectChanges();

    const card = fixture.debugElement
      .query((node) => node.name === 'cngx-stat-card')
      .componentInstance as CngxStatCard;

    expect(card.errorText()).toBe('Instance');
  });
});
