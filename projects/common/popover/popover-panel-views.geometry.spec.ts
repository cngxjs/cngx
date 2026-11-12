import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { contrastRatio } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxPopoverPanel } from './popover-panel.component';
import {
  CngxPopoverBody,
  CngxPopoverEmpty,
  CngxPopoverError,
  CngxPopoverHeader,
  CngxPopoverLoading,
} from './popover-panel-slots';

// Runs in a real Chromium (the `test-geometry` target): the header row sits
// above the view switch, so its box must not move or shrink when the panel
// flips between loading, error, empty and content.

type PanelView = 'loading' | 'error' | 'empty' | 'content';

const SURFACE: Record<PanelView, string> = {
  loading: '.cngx-popover-panel__loading',
  error: '.cngx-popover-panel__error',
  empty: '.cngx-popover-panel__empty',
  content: '.cngx-popover-panel__body',
};

@Component({
  selector: 'cngx-popover-panel-views-host',
  standalone: true,
  imports: [
    CngxPopoverPanel,
    CngxPopoverHeader,
    CngxPopoverBody,
    CngxPopoverLoading,
    CngxPopoverError,
    CngxPopoverEmpty,
  ],
  styleUrls: ['../../core/theming/system-tokens.css', '../../core/theming/reset.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-popover-panel
      [showClose]="true"
      [loading]="view() === 'loading'"
      [error]="view() === 'error' ? 'x' : undefined"
      [empty]="view() === 'empty'"
      style="inset: 0 auto auto 0; inline-size: 280px"
    >
      <span cngxPopoverHeader>{{ title() }}</span>
      <p cngxPopoverBody>Body content</p>
      <ng-template cngxPopoverLoading>Loading</ng-template>
      <ng-template cngxPopoverError>Could not load</ng-template>
      <ng-template cngxPopoverEmpty>Nothing to show</ng-template>
    </cngx-popover-panel>
  `,
})
class ViewsHost {
  readonly panel = viewChild.required(CngxPopoverPanel);
  readonly view = signal<PanelView>('content');
  readonly title = signal('Recent activity');
}

let fixture: ComponentFixture<ViewsHost> | null = null;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

async function mountOpen(): Promise<HTMLElement> {
  fixture = TestBed.createComponent(ViewsHost);
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.componentInstance.panel().popover.show();
  fixture.detectChanges();
  await nextFrame();
  return one(fixture.nativeElement as HTMLElement, 'cngx-popover-panel');
}

async function enter(view: PanelView): Promise<void> {
  fixture!.componentInstance.view.set(view);
  fixture!.detectChanges();
  await nextFrame();
}

afterEach(() => {
  const root = fixture?.nativeElement as HTMLElement | undefined;
  fixture?.destroy();
  root?.remove();
  fixture = null;
  document.documentElement.removeAttribute('data-color-scheme');
});

describe('CngxPopoverPanel header row across views', () => {
  it('sits above the state surface with the same block size in every view', async () => {
    const panel = await mountOpen();
    const views: PanelView[] = ['loading', 'error', 'empty', 'content'];
    const sizes: number[] = [];

    for (const view of views) {
      await enter(view);
      const row = one(panel, '.cngx-popover-panel__header-row').getBoundingClientRect();
      const surface = one(panel, SURFACE[view]).getBoundingClientRect();
      expect(row.height, `${view} header row has a box`).toBeGreaterThan(0);
      expect(row.bottom, `${view} header row ends before the surface`).toBeLessThanOrEqual(
        surface.top + 0.5,
      );
      sizes.push(row.height);
    }

    for (const size of sizes) {
      expect(Math.abs(size - sizes[0])).toBeLessThanOrEqual(1);
    }
  });

  it('keeps the close button box at the --cngx-target-min floor in every view', async () => {
    const panel = await mountOpen();
    panel.style.setProperty('--cngx-target-min', '44px');

    for (const view of ['loading', 'error', 'empty', 'content'] as const) {
      await enter(view);
      const box = one(panel, 'button.cngx-popover-panel__close').getBoundingClientRect();
      expect(box.width, `${view} close inline size`).toBeGreaterThanOrEqual(44 - 0.5);
      expect(box.height, `${view} close block size`).toBeGreaterThanOrEqual(44 - 0.5);
    }
  });
});

describe('CngxPopoverPanel close floor on touch', () => {
  it('keeps a long title and the body clear of the floored close box', async () => {
    const panel = await mountOpen();
    panel.style.setProperty('--cngx-target-min', '44px');
    fixture!.componentInstance.title.set(
      'A long panel title that wraps across the full inline size of the header row',
    );
    fixture!.detectChanges();
    await nextFrame();

    const close = one(panel, 'button.cngx-popover-panel__close').getBoundingClientRect();
    const title = one(panel, '.cngx-popover-panel__header');
    const range = document.createRange();
    range.selectNodeContents(title);
    const textEnd = Math.max(...Array.from(range.getClientRects(), (r) => r.right));
    const body = one(panel, '.cngx-popover-panel__body').getBoundingClientRect();

    expect(close.width).toBeGreaterThanOrEqual(44 - 0.5);
    expect(textEnd).toBeLessThanOrEqual(close.left - 8 + 0.5);
    expect(body.top).toBeGreaterThanOrEqual(close.bottom - 0.5);
  });

  it('ends the header row below the close box under a panel padding override', async () => {
    const panel = await mountOpen();
    panel.style.setProperty('--cngx-target-min', '44px');
    panel.style.setProperty('--cngx-popover-panel-padding', '4px');
    await nextFrame();

    const close = one(panel, 'button.cngx-popover-panel__close').getBoundingClientRect();
    const row = one(panel, '.cngx-popover-panel__header-row').getBoundingClientRect();

    expect(row.bottom).toBeGreaterThanOrEqual(close.bottom - 0.5);
  });
});

describe('CngxPopoverPanel state copy contrast', () => {
  it.each(['light', 'dark'] as const)(
    'paints the error copy at 4.5:1 or more against the %s panel surface',
    async (scheme) => {
      document.documentElement.setAttribute('data-color-scheme', scheme);
      const panel = await mountOpen();
      await enter('error');
      const error = one(panel, '.cngx-popover-panel__error');
      const ratio = contrastRatio(
        getComputedStyle(error).color,
        getComputedStyle(panel).backgroundColor,
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
