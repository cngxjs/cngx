import { coerceSignal } from '@cngx/core/utils';
import { Component, computed, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { TimelineGroup } from './grouping';
import {
  CNGX_TIMELINE_CONFIG,
  injectTimelineConfig,
  provideTimelineConfig,
  provideTimelineConfigAt,
  withTimelineLabels,
  type CngxTimelineConfig,
  type CngxTimelineLabels,
} from './timeline-config';

const lbl = (config: CngxTimelineConfig): CngxTimelineLabels =>
  coerceSignal<CngxTimelineLabels>(config.labels ?? {})();

function group(start: Date): TimelineGroup<unknown> {
  return { key: 'k', start, items: [] };
}

function readConfig(): CngxTimelineConfig {
  return TestBed.runInInjectionContext(() => injectTimelineConfig());
}

describe('timeline config cascade', () => {
  describe('library defaults', () => {
    it('resolves without any provider', () => {
      TestBed.configureTestingModule({});

      expect(TestBed.inject(CNGX_TIMELINE_CONFIG)).toBe(readConfig());
    });

    it('ships English text for every label', () => {
      TestBed.configureTestingModule({});
      const labels = lbl(readConfig());

      expect(labels).toMatchObject({
        timelineRegion: 'Timeline',
        retry: 'Retry',
        errorFallback: 'Could not load the timeline.',
        emptyFallback: 'No events yet.',
        loading: 'Loading timeline',
        refreshing: 'Updating…',
        itemBusy: 'Updating',
        itemErrorFallback: 'Could not load this event.',
      });
    });

    it('formats a group header from its start date in the passed locale', () => {
      TestBed.configureTestingModule({});
      const format = lbl(readConfig()).groupLabel;
      const start = new Date(2026, 6, 20);

      expect(format?.(group(start), 'en-US')).toBe('7/20/2026');
      expect(format?.(group(start), 'de-DE')).toBe('20.7.2026');
    });

    it('reserves an empty templates bag for the slot stage', () => {
      TestBed.configureTestingModule({});

      expect(readConfig().templates).toEqual({});
    });
  });

  describe('withTimelineLabels', () => {
    it('merges partially, leaving untouched keys at their default', () => {
      TestBed.configureTestingModule({
        providers: [provideTimelineConfig(withTimelineLabels({ retry: 'Erneut versuchen' }))],
      });
      const labels = lbl(readConfig());

      expect(labels?.retry).toBe('Erneut versuchen');
      expect(labels?.emptyFallback).toBe('No events yet.');
    });

    it('composes across several features, last write wins per key', () => {
      TestBed.configureTestingModule({
        providers: [
          provideTimelineConfig(
            withTimelineLabels({ retry: 'One', emptyFallback: 'Nothing here.' }),
            withTimelineLabels({ retry: 'Two' }),
          ),
        ],
      });
      const labels = lbl(readConfig());

      expect(labels?.retry).toBe('Two');
      expect(labels?.emptyFallback).toBe('Nothing here.');
    });

    it('overrides the group-header formatter', () => {
      TestBed.configureTestingModule({
        providers: [
          provideTimelineConfig(
            withTimelineLabels({ groupLabel: (g) => `Week of ${g.start.getFullYear()}` }),
          ),
        ],
      });

      expect(lbl(readConfig()).groupLabel?.(group(new Date(2026, 6, 20)), 'en-US')).toBe('Week of 2026');
    });

    it('leaves the library defaults untouched for the next injector', () => {
      TestBed.configureTestingModule({
        providers: [provideTimelineConfig(withTimelineLabels({ retry: 'Mutated?' }))],
      });
      expect(lbl(readConfig()).retry).toBe('Mutated?');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});

      expect(lbl(readConfig()).retry).toBe('Retry');
    });
  });

  describe('provideTimelineConfigAt', () => {
    it('wins over the root provider inside the component scope', () => {
      @Component({
        selector: 'cngx-timeline-scope-host',
        template: '',
        viewProviders: [...provideTimelineConfigAt(withTimelineLabels({ retry: 'Scoped' }))],
      })
      class ScopeHost {
        readonly config = inject(CNGX_TIMELINE_CONFIG);
      }

      TestBed.configureTestingModule({
        imports: [ScopeHost],
        providers: [provideTimelineConfig(withTimelineLabels({ retry: 'Root' }))],
      });
      const fixture = TestBed.createComponent(ScopeHost);

      expect(lbl(fixture.componentInstance.config).retry).toBe('Scoped');
      expect(lbl(readConfig()).retry).toBe('Root');
    });

    it('merges a scoped override onto the root config instead of replacing it', () => {
      @Component({
        selector: 'cngx-timeline-scope-host',
        template: '',
        viewProviders: [...provideTimelineConfigAt(withTimelineLabels({ retry: 'Scoped' }))],
      })
      class ScopeHost {
        readonly config = inject(CNGX_TIMELINE_CONFIG);
      }

      TestBed.configureTestingModule({
        imports: [ScopeHost],
        providers: [provideTimelineConfig(withTimelineLabels({ emptyFallback: 'Root empty.' }))],
      });
      const fixture = TestBed.createComponent(ScopeHost);

      // Re-phrasing one label must not reset the rest of the app's wording.
      expect(lbl(fixture.componentInstance.config).retry).toBe('Scoped');
      expect(lbl(fixture.componentInstance.config).emptyFallback).toBe('Root empty.');
    });

    it('falls back to the library defaults when no parent config is provided', () => {
      @Component({
        selector: 'cngx-timeline-scope-host',
        template: '',
        viewProviders: [...provideTimelineConfigAt(withTimelineLabels({ retry: 'Scoped' }))],
      })
      class ScopeHost {
        readonly config = inject(CNGX_TIMELINE_CONFIG);
      }

      TestBed.configureTestingModule({ imports: [ScopeHost] });
      const fixture = TestBed.createComponent(ScopeHost);

      expect(lbl(fixture.componentInstance.config).retry).toBe('Scoped');
      expect(lbl(fixture.componentInstance.config).emptyFallback).toBe('No events yet.');
    });
  });

  describe('Signal labels', () => {
    it('keeps the other status defaults on a partial status override', () => {
      TestBed.configureTestingModule({
        providers: [provideTimelineConfig(withTimelineLabels({ status: { done: 'Erledigt' } }))],
      });
      expect(lbl(readConfig()).status).toEqual({
        done: 'Erledigt',
        active: 'In progress',
        upcoming: 'Upcoming',
        rejected: 'Rejected',
      });
    });

    it('resolves plain features to the same bundle as the eager merge did', () => {
      TestBed.configureTestingModule({
        providers: [
          provideTimelineConfig(
            withTimelineLabels({ retry: 'Nochmal', status: { active: 'Läuft' } }),
            withTimelineLabels({ emptyFallback: 'Leer', status: { done: 'Erledigt' } }),
          ),
        ],
      });
      const labels = lbl(readConfig());
      expect(labels).toMatchObject({
        timelineRegion: 'Timeline',
        retry: 'Nochmal',
        emptyFallback: 'Leer',
        status: { done: 'Erledigt', active: 'Läuft', upcoming: 'Upcoming', rejected: 'Rejected' },
      });
    });

    it('follows a Signal override and keeps the nested status defaults', () => {
      const lang = signal<'en' | 'de'>('en');
      TestBed.configureTestingModule({
        providers: [
          provideTimelineConfig(
            withTimelineLabels(
              computed(() =>
                lang() === 'de' ? { retry: 'Erneut versuchen', status: { done: 'Erledigt' } } : {},
              ),
            ),
          ),
        ],
      });
      const labels = coerceSignal<CngxTimelineLabels>(readConfig().labels ?? {});
      expect(labels().retry).toBe('Retry');

      lang.set('de');
      expect(labels().retry).toBe('Erneut versuchen');
      expect(labels().status?.done).toBe('Erledigt');
      expect(labels().status?.active).toBe('In progress');
    });
  });
});
