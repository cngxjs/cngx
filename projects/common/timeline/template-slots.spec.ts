import { Component, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CngxTimelineDateHeader,
  CngxTimelineEmpty,
  CngxTimelineError,
  CngxTimelineItemTpl,
  CngxTimelineLoadingTail,
  CngxTimelineMarkerTpl,
  CngxTimelineRetryButton,
} from './template-slots';
import {
  injectTimelineConfig,
  provideTimelineConfig,
  withTimelineLabels,
  withTimelineTemplates,
} from './timeline-config';

interface Event {
  readonly id: number;
}

@Component({
  selector: 'cngx-timeline-slot-host',
  standalone: true,
  imports: [
    CngxTimelineItemTpl,
    CngxTimelineDateHeader,
    CngxTimelineMarkerTpl,
    CngxTimelineEmpty,
    CngxTimelineError,
    CngxTimelineRetryButton,
    CngxTimelineLoadingTail,
  ],
  template: `
    <ng-template cngxTimelineItem let-i="index" let-last="last" let-group="group">
      {{ i }}/{{ last }}/{{ group.key }}
    </ng-template>
    <ng-template cngxTimelineDateHeader let-group>{{ group.key }}</ng-template>
    <ng-template cngxTimelineMarkerTpl let-status="status">{{ status }}</ng-template>
    <ng-template cngxTimelineEmpty let-reason>{{ reason }}</ng-template>
    <ng-template cngxTimelineError let-error let-retry="retry">{{ error }}</ng-template>
    <ng-template cngxTimelineRetryButton let-retry>retry</ng-template>
    <ng-template cngxTimelineLoadingTail>tail</ng-template>
  `,
})
class SlotHost {
  readonly item = viewChild.required(CngxTimelineItemTpl<Event>);
  readonly dateHeader = viewChild.required(CngxTimelineDateHeader<Event>);
  readonly marker = viewChild.required(CngxTimelineMarkerTpl<Event>);
  readonly empty = viewChild.required(CngxTimelineEmpty);
  readonly error = viewChild.required(CngxTimelineError);
  readonly retryButton = viewChild.required(CngxTimelineRetryButton);
  readonly loadingTail = viewChild.required(CngxTimelineLoadingTail);
}

describe('timeline template slots', () => {
  it('every slot directive matches its selector and exposes a TemplateRef', () => {
    TestBed.configureTestingModule({ imports: [SlotHost] });
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    const slots = [
      host.item(),
      host.dateHeader(),
      host.marker(),
      host.empty(),
      host.error(),
      host.retryButton(),
      host.loadingTail(),
    ];

    expect(slots).toHaveLength(7);
    for (const slot of slots) {
      expect(slot.templateRef).toBeInstanceOf(TemplateRef);
    }
  });

  it('renders the item template against its typed context', () => {
    TestBed.configureTestingModule({ imports: [SlotHost] });
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const event: Event = { id: 7 };

    const view = fixture.componentInstance.item().templateRef.createEmbeddedView({
      $implicit: event,
      index: 2,
      first: false,
      last: true,
      group: { key: '2026-07-20', start: new Date(2026, 6, 20), items: [event] },
    });
    view.detectChanges();

    expect(view.context.$implicit).toBe(event);
    expect(view.context.group.items[0]).toBe(event);
    expect(view.rootNodes.map((n: Node) => n.textContent).join('')).toContain('2/true/2026-07-20');
  });

  it('renders the empty template against the shared EmptyReason vocabulary', () => {
    TestBed.configureTestingModule({ imports: [SlotHost] });
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();

    const view = fixture.componentInstance
      .empty()
      .templateRef.createEmbeddedView({ $implicit: 'no-results' });
    view.detectChanges();

    expect(view.rootNodes.map((n: Node) => n.textContent).join('')).toContain('no-results');
  });

  describe('config.templates middle tier', () => {
    it('is an empty bag by default', () => {
      TestBed.configureTestingModule({});

      expect(TestBed.runInInjectionContext(() => injectTimelineConfig()).templates).toEqual({});
    });

    it('accepts a slot TemplateRef through withTimelineTemplates', () => {
      TestBed.configureTestingModule({ imports: [SlotHost] });
      const fixture = TestBed.createComponent(SlotHost);
      fixture.detectChanges();
      const emptyTpl = fixture.componentInstance.empty().templateRef;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideTimelineConfig(withTimelineTemplates({ empty: emptyTpl }))],
      });

      expect(TestBed.runInInjectionContext(() => injectTimelineConfig()).templates?.empty).toBe(
        emptyTpl,
      );
    });

    it('merges across features instead of replacing the bag', () => {
      TestBed.configureTestingModule({ imports: [SlotHost] });
      const fixture = TestBed.createComponent(SlotHost);
      fixture.detectChanges();
      const emptyTpl = fixture.componentInstance.empty().templateRef;
      const errorTpl = fixture.componentInstance.error().templateRef;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideTimelineConfig(
            withTimelineTemplates({ empty: emptyTpl }),
            withTimelineTemplates({ error: errorTpl }),
          ),
        ],
      });
      const { templates } = TestBed.runInInjectionContext(() => injectTimelineConfig());

      expect(templates?.empty).toBe(emptyTpl);
      expect(templates?.error).toBe(errorTpl);
    });

    it('composes with the label features without clobbering them', () => {
      TestBed.configureTestingModule({ imports: [SlotHost] });
      const fixture = TestBed.createComponent(SlotHost);
      fixture.detectChanges();
      const tailTpl = fixture.componentInstance.loadingTail().templateRef;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideTimelineConfig(
            withTimelineLabels({ retry: 'Again' }),
            withTimelineTemplates({ loadingTail: tailTpl }),
          ),
        ],
      });
      const config = TestBed.runInInjectionContext(() => injectTimelineConfig());

      expect(config.labels?.retry).toBe('Again');
      expect(config.labels?.emptyFallback).toBe('No events yet.');
      expect(config.templates?.loadingTail).toBe(tailTpl);
    });
  });
});
