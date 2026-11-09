import { Component, signal, TemplateRef, viewChild, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createManualState } from '@cngx/common/data';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxPopoverPanel } from './popover-panel.component';
import {
  providePopoverPanel,
  withArrow,
  withArrowTemplate,
  withCloseButton,
  withPopoverPanelLabels,
} from './popover-panel.config';
import {
  CngxPopoverArrow,
  type CngxPopoverArrowContext,
  CngxPopoverBody,
  CngxPopoverEmpty,
  CngxPopoverError,
  CngxPopoverFooter,
  CngxPopoverHeader,
  CngxPopoverLoading,
} from './popover-panel-slots';

// ── Test helpers ────────────────────────────────────────────────────────

function stubPopoverElement(el: HTMLElement): void {
  const rec = el as unknown as Record<string, unknown>;
  rec['showPopover'] ??= vi.fn();
  rec['hidePopover'] ??= vi.fn();
  rec['togglePopover'] ??= vi.fn();

  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

// ── Test hosts ──────────────────────────────────────────────────────────

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel">
      <span cngxPopoverHeader>Title</span>
      <p cngxPopoverBody>Body content</p>
      <div cngxPopoverFooter>Footer</div>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter],
})
class BasicHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel">
      <p cngxPopoverBody>Body only</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class BodyOnlyHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" variant="danger">
      <p cngxPopoverBody>Danger zone</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class VariantHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [showClose]="true">
      <p cngxPopoverBody>With close</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class CloseButtonHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel [showClose]="true"><p cngxPopoverBody>One</p></cngx-popover-panel>
    <cngx-popover-panel [showClose]="true"><p cngxPopoverBody>Two</p></cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class TwoPanelsHost {
  readonly panels = viewChildren(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [showClose]="false">
      <p cngxPopoverBody>No close</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class NoCloseButtonHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [loading]="true">
      <p cngxPopoverBody>Normal content</p>
      <ng-template cngxPopoverLoading>Loading...</ng-template>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody, CngxPopoverLoading],
})
class LoadingHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [error]="'Something broke'">
      <p cngxPopoverBody>Normal content</p>
      <ng-template cngxPopoverError let-err>Error: {{ err }}</ng-template>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody, CngxPopoverError],
})
class ErrorHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [empty]="true">
      <p cngxPopoverBody>Normal content</p>
      <ng-template cngxPopoverEmpty>Nothing here</ng-template>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody, CngxPopoverEmpty],
})
class EmptyHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [state]="state">
      <p cngxPopoverBody>Normal content</p>
      <ng-template cngxPopoverLoading>Loading...</ng-template>
      <ng-template cngxPopoverError let-err>Error: {{ err }}</ng-template>
      <ng-template cngxPopoverEmpty>Nothing here</ng-template>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody, CngxPopoverLoading, CngxPopoverError, CngxPopoverEmpty],
})
class StateHost {
  readonly state = createManualState<string[]>();
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [loading]="true" [error]="'Something broke'">
      <p cngxPopoverBody>Normal content</p>
      <ng-template cngxPopoverLoading>Loading...</ng-template>
      <ng-template cngxPopoverError let-err>Error: {{ err }}</ng-template>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody, CngxPopoverLoading, CngxPopoverError],
})
class LoadingWithErrorHost {}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel">
      <p cngxPopoverBody>Config test</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class ConfigHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [showArrow]="true">
      <ng-template cngxPopoverArrow let-edge="edge" let-offsetPx="offsetPx">
        <i
          data-testid="slot-arrow"
          [attr.data-edge]="edge"
          [attr.data-offset]="offsetPx"
        ></i>
      </ng-template>
      <p cngxPopoverBody>Body</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody, CngxPopoverArrow],
})
class ArrowSlotInstanceHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [showArrow]="true">
      <p cngxPopoverBody>Body</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class ArrowDefaultHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <cngx-popover-panel #panel="cngxPopoverPanel" [closeOnOutsideClick]="true">
      <p cngxPopoverBody>Light dismiss</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class OutsideClickHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
}

@Component({
  template: `
    <ng-template #t let-edge="edge">
      <i data-testid="config-arrow" [attr.data-edge]="edge"></i>
    </ng-template>
  `,
  standalone: true,
})
class ConfigArrowTplSource {
  readonly t = viewChild.required<TemplateRef<CngxPopoverArrowContext>>('t');
}

@Component({
  template: `
    <cngx-popover-panel (opened)="opened = opened + 1" (closed)="closed = closed + 1">
      <p cngxPopoverBody>Events</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class EventsHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
  opened = 0;
  closed = 0;
}

@Component({
  template: `
    <cngx-popover-panel
      #panel="cngxPopoverPanel"
      [showClose]="true"
      [loading]="loading()"
      [error]="error()"
      [empty]="empty()"
    >
      <span cngxPopoverHeader>Recent activity</span>
      <p cngxPopoverBody>Body content</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverHeader, CngxPopoverBody],
})
class HeaderViewsHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
  readonly loading = signal(false);
  readonly error = signal<unknown>(undefined);
  readonly empty = signal(false);
}

@Component({
  template: `
    <cngx-popover-panel
      #panel="cngxPopoverPanel"
      [loading]="loading()"
      [error]="error()"
      [empty]="empty()"
      [loadingText]="loadingText()"
      [errorText]="errorText()"
      [emptyText]="emptyText()"
    >
      <span cngxPopoverHeader>Title</span>
      <p cngxPopoverBody>Body content</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverHeader, CngxPopoverBody],
})
class DefaultCopyHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
  readonly loading = signal(false);
  readonly error = signal<unknown>(undefined);
  readonly empty = signal(false);
  readonly loadingText = signal<string | undefined>(undefined);
  readonly errorText = signal<string | undefined>(undefined);
  readonly emptyText = signal<string | undefined>(undefined);
}

@Component({
  template: `
    <cngx-popover-panel [empty]="true" [emptyText]="'Keine Daten'">
      <p cngxPopoverBody>Body content</p>
      <ng-template cngxPopoverEmpty>Slot wins</ng-template>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody, CngxPopoverEmpty],
})
class SlotBeatsInputHost {}

@Component({
  template: `
    <cngx-popover-panel
      [loading]="loading()"
      [error]="error()"
      [empty]="empty()"
      [loadingText]="'Bitte warten'"
    >
      <p cngxPopoverBody>Body content</p>
      <ng-template cngxPopoverLoading let-copy let-text="text">[{{ copy }}|{{ text }}]</ng-template>
      <ng-template cngxPopoverError let-err let-error="error" let-text="text">
        [{{ err }}|{{ error }}|{{ text }}]
      </ng-template>
      <ng-template cngxPopoverEmpty let-copy let-text="text">[{{ copy }}|{{ text }}]</ng-template>
    </cngx-popover-panel>
  `,
  imports: [
    CngxPopoverPanel,
    CngxPopoverBody,
    CngxPopoverLoading,
    CngxPopoverError,
    CngxPopoverEmpty,
  ],
})
class SlotContextHost {
  readonly loading = signal(false);
  readonly error = signal<unknown>(undefined);
  readonly empty = signal(false);
}

@Component({
  template: `
    <cngx-popover-panel [state]="state">
      <p cngxPopoverBody>Body content</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class DefaultCopyStateHost {
  readonly state = createManualState<string[]>();
}

function setup<T>(hostType: new () => T, providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const panelEl = fixture.nativeElement.querySelector('cngx-popover-panel') as HTMLElement;
  stubPopoverElement(panelEl);
  return { fixture, panelEl };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxPopoverPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('forwards the popover opened and closed outputs to a binding on the panel', () => {
    const { fixture } = setup(EventsHost);
    const host = fixture.componentInstance as EventsHost;

    host.panel().popover.show();
    expect(host.opened).toBe(1);
    expect(host.closed).toBe(0);

    host.panel().popover.hide();
    expect(host.closed).toBe(1);
  });

  it('should create with default variant class', () => {
    const { panelEl } = setup(BasicHost);
    expect(panelEl.classList.contains('cngx-popover-panel--default')).toBe(true);
  });

  it('should apply custom variant class', () => {
    const { panelEl } = setup(VariantHost);
    expect(panelEl.classList.contains('cngx-popover-panel--danger')).toBe(true);
    expect(panelEl.classList.contains('cngx-popover-panel--default')).toBe(false);
  });

  it('should show close button when showClose is true', () => {
    const { panelEl } = setup(CloseButtonHost);
    const closeBtn = panelEl.querySelector('.cngx-popover-panel__close');
    expect(closeBtn).toBeTruthy();
  });

  it('shares one label merge between panels under the same config', () => {
    const fixture = TestBed.createComponent(TwoPanelsHost);
    fixture.detectChanges();
    const [first, second] = fixture.componentInstance.panels();
    expect(first['labels']).toBe(second['labels']);
  });

  it('names the close button with the English default', () => {
    const { panelEl } = setup(CloseButtonHost);
    const btn = panelEl.querySelector('button.cngx-popover-panel__close');
    expect(btn?.getAttribute('aria-label')).toBe('Close');
  });

  it('names the close button from withPopoverPanelLabels, live through a Signal', () => {
    const labels = signal<{ close?: string }>({ close: 'Schliessen' });
    const { fixture, panelEl } = setup(CloseButtonHost, [
      providePopoverPanel(withPopoverPanelLabels(labels)),
    ]);
    const btn = panelEl.querySelector('button.cngx-popover-panel__close');
    expect(btn?.getAttribute('aria-label')).toBe('Schliessen');

    labels.set({});
    fixture.detectChanges();
    expect(btn?.getAttribute('aria-label')).toBe('Close');
  });

  it('names the close button from the popover section of the active pack', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    const { fixture, panelEl } = setup(CloseButtonHost, [
      provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
    ]);
    const btn = panelEl.querySelector('button.cngx-popover-panel__close');
    expect(btn?.getAttribute('aria-label')).toBe('Close');

    pack.set({ locale: 'de', popover: { close: 'Schließen' } });
    fixture.detectChanges();
    expect(btn?.getAttribute('aria-label')).toBe('Schließen');
  });

  it('applies withPopoverPanelLabels on top of the active pack', () => {
    const labels = signal<{ close?: string }>({ close: 'Zu' });
    const { fixture, panelEl } = setup(CloseButtonHost, [
      provideCngxI18n(
        withPartialPack({ locale: 'de', popover: { close: 'Schließen' } }),
        withDocumentLanguage('off'),
      ),
      providePopoverPanel(withPopoverPanelLabels(labels)),
    ]);
    const btn = panelEl.querySelector('button.cngx-popover-panel__close');
    expect(btn?.getAttribute('aria-label')).toBe('Zu');

    labels.set({});
    fixture.detectChanges();
    expect(btn?.getAttribute('aria-label')).toBe('Schließen');
  });

  it('should hide close button when showClose is false', () => {
    const { panelEl } = setup(NoCloseButtonHost);
    const closeBtn = panelEl.querySelector('.cngx-popover-panel__close');
    expect(closeBtn).toBeNull();
  });

  it('should render header/body/footer slots', () => {
    const { panelEl } = setup(BasicHost);
    const header = panelEl.querySelector('.cngx-popover-panel__header');
    const body = panelEl.querySelector('.cngx-popover-panel__body');
    const footer = panelEl.querySelector('.cngx-popover-panel__footer');
    expect(header).toBeTruthy();
    expect(body).toBeTruthy();
    expect(footer).toBeTruthy();
    expect(header!.textContent).toContain('Title');
    expect(body!.textContent).toContain('Body content');
    expect(footer!.textContent).toContain('Footer');
  });

  it('should show loading template when loading=true', () => {
    const { panelEl } = setup(LoadingHost);
    const loading = panelEl.querySelector('.cngx-popover-panel__loading');
    const body = panelEl.querySelector('.cngx-popover-panel__body');
    expect(loading).toBeTruthy();
    expect(loading!.textContent).toContain('Loading...');
    expect(body).toBeNull();
  });

  it('should show error template when error is set', () => {
    const { panelEl } = setup(ErrorHost);
    const error = panelEl.querySelector('.cngx-popover-panel__error');
    const body = panelEl.querySelector('.cngx-popover-panel__body');
    expect(error).toBeTruthy();
    expect(error!.textContent).toContain('Something broke');
    expect(body).toBeNull();
  });

  it('should show empty template when empty=true', () => {
    const { panelEl } = setup(EmptyHost);
    const empty = panelEl.querySelector('.cngx-popover-panel__empty');
    const body = panelEl.querySelector('.cngx-popover-panel__body');
    expect(empty).toBeTruthy();
    expect(empty!.textContent).toContain('Nothing here');
    expect(body).toBeNull();
  });

  it('should render the error slot for a [state] error on the first load', () => {
    const { fixture, panelEl } = setup(StateHost);
    fixture.componentInstance.state.set('loading');
    fixture.detectChanges();
    expect(panelEl.querySelector('.cngx-popover-panel__loading')).not.toBeNull();
    expect(panelEl.getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.state.setError('Network down');
    fixture.detectChanges();
    const error = panelEl.querySelector('.cngx-popover-panel__error');
    expect(error?.textContent).toContain('Network down');
    expect(panelEl.querySelector('.cngx-popover-panel__loading')).toBeNull();
    expect(panelEl.querySelector('.cngx-popover-panel__body')).toBeNull();
    expect(panelEl.getAttribute('aria-busy')).toBeNull();
    expect(panelEl.getAttribute('aria-describedby')).toBe(error?.id);
  });

  it('should render the body for [state] success data and the empty slot for empty data', () => {
    const { fixture, panelEl } = setup(StateHost);
    fixture.componentInstance.state.setSuccess(['a']);
    fixture.detectChanges();
    const body = panelEl.querySelector('.cngx-popover-panel__body');
    expect(body?.textContent).toContain('Normal content');
    expect(panelEl.getAttribute('aria-describedby')).toBe(body?.id);

    fixture.componentInstance.state.setSuccess([]);
    fixture.detectChanges();
    expect(panelEl.querySelector('.cngx-popover-panel__empty')?.textContent).toContain(
      'Nothing here',
    );
    expect(panelEl.querySelector('.cngx-popover-panel__body')).toBeNull();
  });

  it('should render neither body nor slot and not be busy for an idle [state]', () => {
    const { panelEl } = setup(StateHost);
    expect(panelEl.querySelector('.cngx-popover-panel__loading')).toBeNull();
    expect(panelEl.querySelector('.cngx-popover-panel__body')).toBeNull();
    expect(panelEl.getAttribute('aria-busy')).toBeNull();
  });

  it('should render loading when the manual inputs set loading and error together', () => {
    const { panelEl } = setup(LoadingWithErrorHost);
    expect(panelEl.querySelector('.cngx-popover-panel__loading')?.textContent).toContain(
      'Loading...',
    );
    expect(panelEl.querySelector('.cngx-popover-panel__error')).toBeNull();
    expect(panelEl.getAttribute('aria-busy')).toBe('true');
  });

  it('should set aria-labelledby to header id', () => {
    const { panelEl } = setup(BasicHost);
    const headerEl = panelEl.querySelector('.cngx-popover-panel__header');
    const headerId = headerEl!.getAttribute('id');
    expect(panelEl.getAttribute('aria-labelledby')).toBe(headerId);
  });

  describe('header row in every view', () => {
    const views: [string, (host: HeaderViewsHost) => void][] = [
      ['loading', (host) => host.loading.set(true)],
      ['error', (host) => host.error.set('x')],
      ['empty', (host) => host.empty.set(true)],
      ['content', () => undefined],
    ];

    for (const [name, enter] of views) {
      it(`keeps the header, its name and the close button in the ${name} view`, () => {
        const { fixture, panelEl } = setup(HeaderViewsHost);
        enter(fixture.componentInstance);
        fixture.detectChanges();

        expect(panelEl.querySelector('.cngx-popover-panel__header')).not.toBeNull();
        const labelledBy = panelEl.getAttribute('aria-labelledby');
        expect(labelledBy).not.toBeNull();
        expect(document.getElementById(labelledBy!)?.textContent).toContain('Recent activity');

        const popover = fixture.componentInstance.panel().popover;
        const hide = vi.spyOn(popover, 'hide');
        const close = panelEl.querySelector<HTMLButtonElement>('button.cngx-popover-panel__close');
        expect(close).not.toBeNull();
        close!.click();
        expect(hide).toHaveBeenCalledTimes(1);
      });
    }
  });

  describe('default state copy', () => {
    const surfaceText = (panelEl: HTMLElement, cls: string): string | undefined =>
      panelEl.querySelector(`.cngx-popover-panel__${cls}`)?.textContent?.trim();

    it('renders the English copy in each state view without a template', () => {
      const { fixture, panelEl } = setup(DefaultCopyHost);
      const host = fixture.componentInstance;

      host.loading.set(true);
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'loading')).toBe('Loading');

      host.loading.set(false);
      host.error.set('boom');
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'error')).toBe('Could not load');

      host.error.set(undefined);
      host.empty.set(true);
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'empty')).toBe('Nothing to show');
    });

    it('takes withPopoverPanelLabels over the default', () => {
      const { fixture, panelEl } = setup(DefaultCopyHost, [
        providePopoverPanel(withPopoverPanelLabels({ empty: 'Leer' })),
      ]);
      fixture.componentInstance.empty.set(true);
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'empty')).toBe('Leer');
    });

    it('takes the per-instance inputs over config and falls back when unbound', () => {
      const { fixture, panelEl } = setup(DefaultCopyHost, [
        providePopoverPanel(
          withPopoverPanelLabels({ loading: 'Lädt', error: 'Fehler', empty: 'Leer' }),
        ),
      ]);
      const host = fixture.componentInstance;
      host.loadingText.set('Bitte warten');
      host.errorText.set('Kaputt');
      host.emptyText.set('Keine Daten');

      host.loading.set(true);
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'loading')).toBe('Bitte warten');

      host.loading.set(false);
      host.error.set('boom');
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'error')).toBe('Kaputt');

      host.error.set(undefined);
      host.empty.set(true);
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'empty')).toBe('Keine Daten');

      host.emptyText.set(undefined);
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'empty')).toBe('Leer');
    });

    it('lets a projected slot template win over the per-instance input', () => {
      const { panelEl } = setup(SlotBeatsInputHost);
      expect(surfaceText(panelEl, 'empty')).toBe('Slot wins');
    });

    it('hands each state template the resolved copy as $implicit and text', () => {
      const { fixture, panelEl } = setup(SlotContextHost, [
        providePopoverPanel(withPopoverPanelLabels({ empty: 'Leer' })),
      ]);
      const host = fixture.componentInstance;

      host.loading.set(true);
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'loading')).toBe('[Bitte warten|Bitte warten]');

      host.loading.set(false);
      host.error.set('boom');
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'error')).toBe('[boom|boom|Could not load]');

      host.error.set(undefined);
      host.empty.set(true);
      fixture.detectChanges();
      expect(surfaceText(panelEl, 'empty')).toBe('[Leer|Leer]');
    });

    it('flips the visible copy in place on a language switch, with no live region', () => {
      const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
      const { fixture, panelEl } = setup(DefaultCopyHost, [
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ]);
      fixture.componentInstance.empty.set(true);
      fixture.detectChanges();
      const surface = panelEl.querySelector('.cngx-popover-panel__empty');
      expect(surface?.textContent?.trim()).toBe('Nothing to show');

      pack.set({ locale: 'de', popover: { empty: 'Nichts anzuzeigen' } });
      fixture.detectChanges();
      expect(panelEl.querySelector('.cngx-popover-panel__empty')).toBe(surface);
      expect(surface?.textContent?.trim()).toBe('Nichts anzuzeigen');
      expect(panelEl.querySelector('[aria-live]')).toBeNull();
      expect(panelEl.hasAttribute('aria-live')).toBe(false);
    });

    it('points aria-describedby at the surface that describes the view', () => {
      const { fixture, panelEl } = setup(DefaultCopyHost);
      const host = fixture.componentInstance;
      const describedText = (): string | undefined => {
        const id = panelEl.getAttribute('aria-describedby');
        return id ? document.getElementById(id)?.textContent?.trim() : undefined;
      };

      expect(describedText()).toBe('Body content');

      host.loading.set(true);
      fixture.detectChanges();
      expect(panelEl.getAttribute('aria-describedby')).toBeNull();
      expect(panelEl.getAttribute('aria-busy')).toBe('true');

      host.loading.set(false);
      host.error.set('boom');
      fixture.detectChanges();
      expect(describedText()).toBe('Could not load');

      host.error.set(undefined);
      host.empty.set(true);
      fixture.detectChanges();
      expect(describedText()).toBe('Nothing to show');
    });

    it('describes a [state] refresh error by the error surface and renders empty data as default copy', () => {
      const { fixture, panelEl } = setup(DefaultCopyStateHost);
      const state = fixture.componentInstance.state;

      state.setSuccess([]);
      fixture.detectChanges();
      expect(panelEl.querySelector('.cngx-popover-panel__empty')?.textContent?.trim()).toBe(
        'Nothing to show',
      );

      state.setSuccess(['a']);
      state.setError('Network down');
      fixture.detectChanges();
      const error = panelEl.querySelector('.cngx-popover-panel__error');
      expect(error?.textContent?.trim()).toBe('Could not load');
      expect(panelEl.getAttribute('aria-describedby')).toBe(error?.id);
    });
  });

  it('should not emit aria-labelledby without a projected header', () => {
    // aria-hidden does not suppress a directly-referenced node, and here the
    // header row never renders at all - the reference must be gated, not the
    // target.
    const { panelEl } = setup(BodyOnlyHost);
    expect(panelEl.getAttribute('aria-labelledby')).toBeNull();
  });

  it('should set role="dialog" on the host by default', () => {
    const { panelEl } = setup(BasicHost);
    expect(panelEl.getAttribute('role')).toBe('dialog');
  });

  it('should forward closeOnOutsideClick to the composed popover', () => {
    const { fixture } = setup(OutsideClickHost);
    const panel = fixture.componentInstance.panel();
    expect(panel.popover.closeOnOutsideClick()).toBe(true);
  });

  it('should hint the composed popover haspopup signal to "dialog"', () => {
    const { fixture } = setup(BasicHost);
    const host = fixture.componentInstance as BasicHost;
    expect(host.panel().popover.haspopup()).toBe('dialog');
  });

  it('should auto-render header + footer slots when content is projected', () => {
    const { panelEl } = setup(BasicHost);
    expect(panelEl.querySelector('.cngx-popover-panel__header')).not.toBeNull();
    expect(panelEl.querySelector('.cngx-popover-panel__footer')).not.toBeNull();
  });

  it('should skip header + footer slot wrappers when no marker content is projected', () => {
    const { panelEl } = setup(BodyOnlyHost);
    expect(panelEl.querySelector('.cngx-popover-panel__header')).toBeNull();
    expect(panelEl.querySelector('.cngx-popover-panel__footer')).toBeNull();
  });

  it('should set aria-describedby to null when loading', () => {
    const { panelEl } = setup(LoadingHost);
    expect(panelEl.getAttribute('aria-describedby')).toBeNull();
  });

  it('should set aria-busy when loading', () => {
    const { panelEl } = setup(LoadingHost);
    expect(panelEl.getAttribute('aria-busy')).toBe('true');
  });

  it('should use config defaults for showClose/showArrow via providePopoverPanel', () => {
    const { panelEl } = setup(ConfigHost, [providePopoverPanel(withCloseButton(), withArrow())]);
    const closeBtn = panelEl.querySelector('.cngx-popover-panel__close');
    const arrow = panelEl.querySelector('.cngx-popover-panel__arrow');
    expect(closeBtn).toBeTruthy();
    expect(arrow).toBeTruthy();
    expect(panelEl.classList.contains('cngx-popover-panel--arrow')).toBe(true);
  });

  describe('arrow slot cascade', () => {
    it('per-instance cngxPopoverArrow template wins over the default diamond', () => {
      const { panelEl } = setup(ArrowSlotInstanceHost);
      expect(panelEl.querySelector('.cngx-popover-panel__arrow')).toBeNull();
      const slotArrow = panelEl.querySelector('[data-testid="slot-arrow"]');
      expect(slotArrow).toBeTruthy();
      expect(slotArrow!.getAttribute('data-edge')).toBe('bottom');
    });

    it('CNGX_POPOVER_PANEL_CONFIG.templates.arrow wins over the default diamond when no contentChild', () => {
      // Step 1 - extract a real TemplateRef from a throwaway source component.
      const sourceFixture = TestBed.createComponent(ConfigArrowTplSource);
      sourceFixture.detectChanges();
      const tpl = sourceFixture.componentInstance.t();
      sourceFixture.destroy();

      // Step 2 - re-configure TestBed with that template wired into the cascade.
      TestBed.resetTestingModule();
      const { panelEl } = setup(ArrowDefaultHost, [
        providePopoverPanel(withArrow(), withArrowTemplate(tpl)),
      ]);

      expect(panelEl.querySelector('.cngx-popover-panel__arrow')).toBeNull();
      const configArrow = panelEl.querySelector('[data-testid="config-arrow"]');
      expect(configArrow).toBeTruthy();
      expect(configArrow!.getAttribute('data-edge')).toBe('bottom');
    });

    it('default rotated-diamond renders when neither tier is set', () => {
      const { panelEl } = setup(ArrowDefaultHost);
      expect(panelEl.querySelector('.cngx-popover-panel__arrow')).toBeTruthy();
      expect(panelEl.querySelector('[data-testid="slot-arrow"]')).toBeNull();
      expect(panelEl.querySelector('[data-testid="config-arrow"]')).toBeNull();
    });

    it('arrowContext returns a stable reference when edge + offsetPx round-trip to the same values', () => {
      const { fixture } = setup(ArrowSlotInstanceHost);
      const panel = fixture.componentInstance.panel();
      const reader = panel as unknown as {
        arrowContext: () => CngxPopoverArrowContext;
      };

      const first = reader.arrowContext();
      panel.popover.setAnchorElement(null);
      TestBed.flushEffects();
      const second = reader.arrowContext();

      expect(Object.is(first, second)).toBe(true);
      expect(first.edge).toBe('bottom');
      expect(first.offsetPx).toBeNull();
    });
  });

  describe('Close-button skin', () => {
    it('expresses the popover-panel close variant via --cngx-close-button-* overrides, not a duplicate skin', () => {
      TestBed.configureTestingModule({ imports: [CloseButtonHost] });
      TestBed.createComponent(CloseButtonHost).detectChanges();

      const styleText = Array.from(document.querySelectorAll('style'))
        .map((node) => node.textContent ?? '')
        .join('\n');

      expect(styleText).toMatch(
        /\.cngx-popover-panel__close\.cngx-close-button\s*\{[\s\S]*?--cngx-close-button-radius:\s*999px/,
      );
      expect(styleText).toMatch(
        /\.cngx-popover-panel__close\.cngx-close-button\s*\{[\s\S]*?--cngx-close-button-size:\s*var\(--cngx-popover-panel-close-size/,
      );
      expect(styleText).toMatch(
        /\.cngx-popover-panel__close\.cngx-close-button\s*\{[\s\S]*?--cngx-close-button-hover-bg:\s*var\(--cngx-popover-panel-close-hover-bg/,
      );
      expect(styleText).not.toMatch(/\.cngx-popover-panel__close:hover\s*\{/);
      expect(styleText).not.toMatch(/\.cngx-popover-panel__close:focus-visible\s*\{/);
    });

    it('pins the popover close-button host to the panel corner via absolute positioning', () => {
      TestBed.configureTestingModule({ imports: [CloseButtonHost] });
      TestBed.createComponent(CloseButtonHost).detectChanges();

      const styleText = Array.from(document.querySelectorAll('style'))
        .map((node) => node.textContent ?? '')
        .join('\n');

      expect(styleText).toMatch(/\.cngx-popover-panel__close\.cngx-close-button\s*\{[\s\S]*?position:\s*absolute/);
      expect(styleText).toMatch(
        /\.cngx-popover-panel__close\.cngx-close-button\s*\{[\s\S]*?inset-inline-end:\s*var\(--cngx-popover-panel-close-offset/,
      );
    });
  });
});
