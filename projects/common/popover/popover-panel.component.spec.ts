import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxPopoverPanel } from './popover-panel.component';
import { providePopoverPanel, withArrow, withCloseButton } from './popover-panel.config';
import {
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
    <cngx-popover-panel #panel="cngxPopoverPanel" [hasFooter]="true">
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
    <cngx-popover-panel #panel="cngxPopoverPanel">
      <p cngxPopoverBody>Config test</p>
    </cngx-popover-panel>
  `,
  imports: [CngxPopoverPanel, CngxPopoverBody],
})
class ConfigHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
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

  it('should set aria-labelledby to header id', () => {
    const { panelEl } = setup(BasicHost);
    const headerEl = panelEl.querySelector('.cngx-popover-panel__header');
    const headerId = headerEl!.getAttribute('id');
    expect(panelEl.getAttribute('aria-labelledby')).toBe(headerId);
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
});
