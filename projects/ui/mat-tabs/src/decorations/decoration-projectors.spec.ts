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

  it('preserves third-party aria-describedby tokens written between decoration apply and clear (diff-restore, not whole-attribute restore)', () => {
    const { host } = setupHost();
    // Pre-existing consumer token at apply time — captured by the
    // projector as `priorAriaDescribedby`.
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

    const target = hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab')[1];
    expect(target.getAttribute('aria-describedby')).toBe(
      'consumer-tooltip-7 cngx-mat-tab-1-rejected',
    );

    // Third party (e.g. a CDK overlay binding, an external a11y
    // toolkit, a Material upgrade that itself appends to the tab
    // button's aria-describedby) appends a token AFTER the projector
    // mounted. Pre-fix the clear path overwrote the attribute with
    // its `priorAriaDescribedby` snapshot, dropping this token. The
    // diff-restore path must keep it.
    const current =
      target.getAttribute('aria-describedby') ?? '';
    target.setAttribute(
      'aria-describedby',
      `${current} third-party-cdk-overlay-42`,
    );

    failedHandleId.set(null);
    failedIndex.set(undefined);
    TestBed.flushEffects();

    expect(target.classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(target.querySelector('span.cngx-sr-only')).toBeNull();
    const restoredTokens = target
      .getAttribute('aria-describedby')
      ?.split(/\s+/)
      .filter(Boolean);
    // Decoration's own id is gone; consumer's apply-time token AND
    // the third-party clear-time token both survive in token order.
    expect(restoredTokens).toEqual([
      'consumer-tooltip-7',
      'third-party-cdk-overlay-42',
    ]);
  });

  it('removes aria-describedby entirely when no priorAriaDescribedby and no surviving third-party tokens', () => {
    const { host } = setupHost();
    // Tab 0 has no aria-describedby at apply time — priorAriaDescribedby = null.
    const hostEl = buildHostWithButtons();
    const failedHandleId = signal<string | null>('cngx-mat-tab-0');
    const failedIndex = signal<number | undefined>(0);
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
    TestBed.flushEffects();

    const target = hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab')[0];
    expect(target.getAttribute('aria-describedby')).toBe(
      'cngx-mat-tab-0-rejected',
    );

    failedHandleId.set(null);
    failedIndex.set(undefined);
    TestBed.flushEffects();

    // No prior tokens, no third-party additions — attribute must be
    // removed entirely. An empty `aria-describedby=""` would leave a
    // dangling reference some AT readers misinterpret as malformed.
    expect(target.hasAttribute('aria-describedby')).toBe(false);
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

  it('skips DOM mutation when the same failedHandleId is re-emitted (short-circuit on identical input)', () => {
    const { host } = setupHost();
    const hostEl = buildHostWithButtons();
    // `equal: () => false` bypasses signal's default Object.is dedup
    // so every `set()` re-fires the consuming effect — simulating an
    // upstream where `tabs()`-driven churn re-evaluates a `computed`
    // whose memoization the projector cannot rely on (e.g. a future
    // consumer pushing a custom equality fn). Without the projector's
    // own short-circuit slot, the second identical emission would
    // clear+remount the decoration mid-flight.
    const failedHandleId = signal<string | null>(null, {
      equal: () => false,
    });
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

    const target = hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab')[1];
    const initialSpan = target.querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-1-rejected',
    );
    expect(initialSpan).not.toBeNull();

    // Re-emit the same id — the slot guard returns early, the
    // descriptor span identity is preserved, and AT readers
    // mid-announcement keep their referenced node.
    failedHandleId.set('cngx-mat-tab-1');
    TestBed.flushEffects();

    const sameSpan = target.querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-1-rejected',
    );
    expect(sameSpan).toBe(initialSpan);
    expect(target.classList.contains('cngx-mat-tab--error')).toBe(true);
  });

  it('A→null→A re-emissions remount the decoration fresh after clearing', () => {
    const { host } = setupHost();
    const hostEl = buildHostWithButtons();
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

    const target = hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab')[1];

    failedHandleId.set('cngx-mat-tab-1');
    failedIndex.set(1);
    TestBed.flushEffects();
    const firstSpan = target.querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-1-rejected',
    );
    expect(firstSpan).not.toBeNull();

    // Clear — decoration leaves the DOM, slot returns to null.
    failedHandleId.set(null);
    failedIndex.set(undefined);
    TestBed.flushEffects();
    expect(
      target.querySelector('span.cngx-sr-only#cngx-mat-tab-1-rejected'),
    ).toBeNull();
    expect(target.classList.contains('cngx-mat-tab--error')).toBe(false);

    // Re-mount the same id — must produce a fresh decoration. The
    // short-circuit slot was reset to null on the clear, so the
    // re-application path runs in full.
    failedHandleId.set('cngx-mat-tab-1');
    failedIndex.set(1);
    TestBed.flushEffects();
    const remountedSpan = target.querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-1-rejected',
    );
    expect(remountedSpan).not.toBeNull();
    expect(remountedSpan).not.toBe(firstSpan);
    expect(target.classList.contains('cngx-mat-tab--error')).toBe(true);
  });

  it('A→B→A re-emissions clear+apply twice — moving the decoration each transition', () => {
    const { host } = setupHost();
    const hostEl = buildHostWithButtons();
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

    const buttons = hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab');

    // Mount A on tab 0.
    failedHandleId.set('cngx-mat-tab-A');
    failedIndex.set(0);
    TestBed.flushEffects();
    const spanA1 = buttons[0].querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-A-rejected',
    );
    expect(spanA1).not.toBeNull();
    expect(buttons[0].classList.contains('cngx-mat-tab--error')).toBe(true);

    // Move to B on tab 1 — clears tab 0, applies tab 1.
    failedHandleId.set('cngx-mat-tab-B');
    failedIndex.set(1);
    TestBed.flushEffects();
    expect(buttons[0].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(
      buttons[0].querySelector('span.cngx-sr-only#cngx-mat-tab-A-rejected'),
    ).toBeNull();
    const spanB = buttons[1].querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-B-rejected',
    );
    expect(spanB).not.toBeNull();
    expect(buttons[1].classList.contains('cngx-mat-tab--error')).toBe(true);

    // Move back to A on tab 0 — clears tab 1, applies tab 0 fresh.
    failedHandleId.set('cngx-mat-tab-A');
    failedIndex.set(0);
    TestBed.flushEffects();
    expect(buttons[1].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(
      buttons[1].querySelector('span.cngx-sr-only#cngx-mat-tab-B-rejected'),
    ).toBeNull();
    const spanA2 = buttons[0].querySelector<HTMLSpanElement>(
      'span.cngx-sr-only#cngx-mat-tab-A-rejected',
    );
    expect(spanA2).not.toBeNull();
    // The mid-cycle clear means the second mount is a fresh element,
    // not the original span — distinguishes this axis from the
    // identical-id short-circuit case above.
    expect(spanA2).not.toBe(spanA1);
    expect(buttons[0].classList.contains('cngx-mat-tab--error')).toBe(true);
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
