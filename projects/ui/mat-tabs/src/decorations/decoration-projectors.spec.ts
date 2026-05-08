import {
  Component,
  DestroyRef,
  Injector,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createMatTabAggregatorDecoration,
  type CngxMatTabAggregatorErrorEntry,
} from './decoration-projectors';
import type { CngxMatTabAggregatorContentContext } from './mat-tab-aggregator-content.directive';

@Component({
  standalone: true,
  template: `
    <ng-template #tpl let-count="count" let-label="label"
      >slot {{ label }}={{ count }}</ng-template
    >
  `,
})
class HostCmp {
  readonly injector = inject(Injector);
  readonly renderer = inject(Renderer2);
  readonly destroyRef = inject(DestroyRef);
  readonly vcr = inject(ViewContainerRef);
  @ViewChild('tpl', { static: true })
  tpl!: TemplateRef<CngxMatTabAggregatorContentContext>;
}

function setupHost(): { host: HostCmp; hostEl: HTMLElement } {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  const hostEl = document.createElement('div');
  return { host: fixture.componentInstance, hostEl };
}

describe('createMatTabAggregatorDecoration — half-wired slot warning', () => {
  it('fires onHalfWiredSlot once when contentTemplate is bound but viewContainerRef is missing', () => {
    const { host, hostEl } = setupHost();
    const onHalfWired =
      vi.fn<(missing: 'contentTemplate' | 'viewContainerRef') => void>();
    const errorTabs = signal<readonly CngxMatTabAggregatorErrorEntry[]>([]);
    const contentTemplate = signal<TemplateRef<
      CngxMatTabAggregatorContentContext
    > | null>(host.tpl);

    createMatTabAggregatorDecoration({
      hostEl,
      errorTabs,
      renderer: host.renderer,
      injector: host.injector,
      destroyRef: host.destroyRef,
      contentTemplate,
      onHalfWiredSlot: onHalfWired,
    });

    expect(onHalfWired).toHaveBeenCalledTimes(1);
    expect(onHalfWired).toHaveBeenCalledWith('viewContainerRef');
  });

  it('fires onHalfWiredSlot once when viewContainerRef is bound but contentTemplate is missing', () => {
    const { host, hostEl } = setupHost();
    const onHalfWired =
      vi.fn<(missing: 'contentTemplate' | 'viewContainerRef') => void>();
    const errorTabs = signal<readonly CngxMatTabAggregatorErrorEntry[]>([]);

    createMatTabAggregatorDecoration({
      hostEl,
      errorTabs,
      renderer: host.renderer,
      injector: host.injector,
      destroyRef: host.destroyRef,
      viewContainerRef: host.vcr,
      onHalfWiredSlot: onHalfWired,
    });

    expect(onHalfWired).toHaveBeenCalledTimes(1);
    expect(onHalfWired).toHaveBeenCalledWith('contentTemplate');
  });

  it('does not fire when both halves are bound (slot fully wired)', () => {
    const { host, hostEl } = setupHost();
    const onHalfWired =
      vi.fn<(missing: 'contentTemplate' | 'viewContainerRef') => void>();
    const errorTabs = signal<readonly CngxMatTabAggregatorErrorEntry[]>([]);
    const contentTemplate = signal<TemplateRef<
      CngxMatTabAggregatorContentContext
    > | null>(host.tpl);

    createMatTabAggregatorDecoration({
      hostEl,
      errorTabs,
      renderer: host.renderer,
      injector: host.injector,
      destroyRef: host.destroyRef,
      contentTemplate,
      viewContainerRef: host.vcr,
      onHalfWiredSlot: onHalfWired,
    });

    expect(onHalfWired).not.toHaveBeenCalled();
  });

  it('does not fire when neither half is bound (imperative-only path)', () => {
    const { host, hostEl } = setupHost();
    const onHalfWired =
      vi.fn<(missing: 'contentTemplate' | 'viewContainerRef') => void>();
    const errorTabs = signal<readonly CngxMatTabAggregatorErrorEntry[]>([]);

    createMatTabAggregatorDecoration({
      hostEl,
      errorTabs,
      renderer: host.renderer,
      injector: host.injector,
      destroyRef: host.destroyRef,
      onHalfWiredSlot: onHalfWired,
    });

    expect(onHalfWired).not.toHaveBeenCalled();
  });
});
