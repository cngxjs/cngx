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
  createMatTabRejectionDecoration,
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

describe('createMatTabRejectionDecoration — aria-describedby contract (5.2)', () => {
  /**
   * Builds a host element carrying three `.mat-mdc-tab` buttons with
   * pre-existing `aria-describedby` tokens on tab 0 — used to prove
   * the projector's token-list-append path preserves consumer-supplied
   * tokens across decorate / clear cycles.
   */
  function buildHostWithButtons(
    extraDescribedby: readonly (string | null)[] = [null, null, null],
  ): HTMLElement {
    const hostEl = document.createElement('div');
    for (let i = 0; i < extraDescribedby.length; i++) {
      const btn = document.createElement('button');
      btn.classList.add('mat-mdc-tab');
      const prior = extraDescribedby[i];
      if (prior) {
        btn.setAttribute('aria-describedby', prior);
      }
      hostEl.appendChild(btn);
    }
    return hostEl;
  }

  it('mounts cngx-mat-tab--error class + descriptor span + aria-describedby (no aria-invalid)', () => {
    const { host } = setupHost();
    const hostEl = buildHostWithButtons();
    const failedHandleId = signal<string | null>(null);
    const failedIndex = signal<number | undefined>(undefined);
    const descriptorText = signal<string>('Reverted to "Profile".');

    createMatTabRejectionDecoration({
      hostEl,
      failedHandleId,
      failedIndex,
      descriptorText,
      renderer: host.renderer,
      injector: host.injector,
      destroyRef: host.destroyRef,
    });

    failedHandleId.set('cngx-mat-tab-1');
    failedIndex.set(1);
    TestBed.flushEffects();

    const buttons = hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab');
    const target = buttons[1];
    expect(target.classList.contains('cngx-mat-tab--error')).toBe(true);
    // aria-invalid is form-field vocabulary per ARIA 1.2 — must NOT
    // be set on a tab button. Regression fence: pre-fix this projector
    // wrote `aria-invalid="true"`; the new contract uses
    // aria-describedby + a hidden descriptor span instead.
    expect(target.getAttribute('aria-invalid')).toBeNull();

    const span = target.querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-1-rejected',
    );
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe('Reverted to "Profile".');
    expect(target.getAttribute('aria-describedby')).toBe(
      'cngx-mat-tab-1-rejected',
    );
    // Untouched tabs carry no class, no descriptor span, no
    // aria-describedby pollution.
    expect(buttons[0].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(
      buttons[0].querySelector('span.cngx-sr-only'),
    ).toBeNull();
    expect(buttons[0].getAttribute('aria-describedby')).toBeNull();
  });

  it('preserves consumer-supplied aria-describedby tokens across decorate / clear cycles', () => {
    const { host } = setupHost();
    // Tab 1 already carries a consumer descriptor (e.g. a tooltip
    // ref). The projector must append its descriptor id to the
    // token list, not replace the prior value.
    const hostEl = buildHostWithButtons([null, 'consumer-tooltip-7', null]);
    const failedHandleId = signal<string | null>(null);
    const failedIndex = signal<number | undefined>(undefined);
    const descriptorText = signal<string>('Reverted.');

    createMatTabRejectionDecoration({
      hostEl,
      failedHandleId,
      failedIndex,
      descriptorText,
      renderer: host.renderer,
      injector: host.injector,
      destroyRef: host.destroyRef,
    });

    failedHandleId.set('cngx-mat-tab-1');
    failedIndex.set(1);
    TestBed.flushEffects();

    const target =
      hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab')[1];
    const tokens = target
      .getAttribute('aria-describedby')
      ?.split(/\s+/)
      .filter(Boolean);
    expect(tokens).toEqual(['consumer-tooltip-7', 'cngx-mat-tab-1-rejected']);

    // Clear — restoration must drop the projector's id but keep the
    // consumer-supplied token.
    failedHandleId.set(null);
    failedIndex.set(undefined);
    TestBed.flushEffects();

    expect(target.classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(target.querySelector('span.cngx-sr-only')).toBeNull();
    expect(target.getAttribute('aria-describedby')).toBe(
      'consumer-tooltip-7',
    );
  });

  it('updates the descriptor span textContent reactively without recreating the span', () => {
    const { host } = setupHost();
    const hostEl = buildHostWithButtons();
    const failedHandleId = signal<string | null>('cngx-mat-tab-2');
    const failedIndex = signal<number | undefined>(2);
    // Initial fallback phrase, before the origin label resolves.
    const descriptorText = signal<string>('Tab change refused — retry?');

    createMatTabRejectionDecoration({
      hostEl,
      failedHandleId,
      failedIndex,
      descriptorText,
      renderer: host.renderer,
      injector: host.injector,
      destroyRef: host.destroyRef,
    });
    TestBed.flushEffects();

    const target = hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab')[2];
    const initialSpan = target.querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-2-rejected',
    );
    expect(initialSpan?.textContent).toBe('Tab change refused — retry?');

    // Origin label resolves later — text mutates in place; the span
    // identity must be stable so AT does not reset its descriptor
    // pointer.
    descriptorText.set('Reverted to "Settings".');
    TestBed.flushEffects();

    const updatedSpan = target.querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-2-rejected',
    );
    expect(updatedSpan).toBe(initialSpan);
    expect(updatedSpan?.textContent).toBe('Reverted to "Settings".');
  });

  it('moves the decoration when failedIndex shifts to a different tab', () => {
    const { host } = setupHost();
    const hostEl = buildHostWithButtons();
    const failedHandleId = signal<string | null>('cngx-mat-tab-2');
    const failedIndex = signal<number | undefined>(2);
    const descriptorText = signal<string>('Reverted to "A".');

    createMatTabRejectionDecoration({
      hostEl,
      failedHandleId,
      failedIndex,
      descriptorText,
      renderer: host.renderer,
      injector: host.injector,
      destroyRef: host.destroyRef,
    });
    TestBed.flushEffects();

    const buttons = hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab');
    expect(buttons[2].classList.contains('cngx-mat-tab--error')).toBe(true);

    failedHandleId.set('cngx-mat-tab-1');
    failedIndex.set(1);
    TestBed.flushEffects();

    expect(buttons[2].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(buttons[2].querySelector('span.cngx-sr-only')).toBeNull();
    expect(buttons[2].getAttribute('aria-describedby')).toBeNull();

    expect(buttons[1].classList.contains('cngx-mat-tab--error')).toBe(true);
    const movedSpan = buttons[1].querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-1-rejected',
    );
    expect(movedSpan).not.toBeNull();
    expect(buttons[1].getAttribute('aria-describedby')).toBe(
      'cngx-mat-tab-1-rejected',
    );
  });
});
