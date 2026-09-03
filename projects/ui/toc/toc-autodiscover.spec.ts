import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxToc } from './toc.component';
import type { CngxTocItem } from './toc.types';

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}

@Component({
  imports: [CngxToc],
  template: `
    <cngx-toc autoDiscover contentRoot=".article" />
    <article class="article">
      <h2 id="intro">Introduction</h2>
      <h2>Getting Started</h2>
      <h3>Install</h3>
      <h3>Configure</h3>
      <h2>Wrap Up</h2>
    </article>
  `,
})
class DiscoverHost {}

@Component({
  imports: [CngxToc],
  template: `
    <cngx-toc autoDiscover contentRoot=".article" />
    <article class="article">
      <h2 id="install">Setup</h2>
      <h2>Install</h2>
    </article>
  `,
})
class CollisionHost {}

@Component({
  imports: [CngxToc],
  template: `
    <cngx-toc [items]="items" contentRoot=".article" />
    <article class="article"><h2>Ignored heading</h2></article>
  `,
})
class ManualHost {
  readonly items: CngxTocItem[] = [{ id: 'a', label: 'Alpha' }];
}

@Component({
  imports: [CngxToc],
  template: `
    <cngx-toc autoDiscover contentRoot=".does-not-exist" />
    <article class="article"><h2>Overview</h2><h2>Usage</h2></article>
  `,
})
class MissingRootHost {}

function getToc(fixture: { debugElement: import('@angular/core').DebugElement }): CngxToc {
  return fixture.debugElement.query(By.directive(CngxToc)).componentInstance;
}

function linkTexts(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll('.cngx-toc__link')).map((el) =>
    (el.textContent ?? '').trim(),
  );
}

describe('CngxToc autoDiscover', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    (globalThis as Record<string, unknown>)['matchMedia'] = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>)['matchMedia'];
  });

  function setup(host: unknown) {
    const fixture = TestBed.createComponent(host as typeof DiscoverHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    return { fixture, toc: getToc(fixture) };
  }

  it('derives a level-nested outline from the headings under contentRoot', () => {
    const { fixture, toc } = setup(DiscoverHost);
    toc.refresh();
    fixture.detectChanges();

    expect(linkTexts(fixture.nativeElement)).toEqual([
      'Introduction',
      'Getting Started',
      'Install',
      'Configure',
      'Wrap Up',
    ]);
    // Install/Configure nest under Getting Started; h2s stay at the top level.
    const outline = toc['resolvedItems']();
    expect(outline.map((item) => item.label)).toEqual([
      'Introduction',
      'Getting Started',
      'Wrap Up',
    ]);
    expect(outline[1].children?.map((child) => child.label)).toEqual(['Install', 'Configure']);
  });

  it('writes a slug id onto a heading that has none and keeps an author id', () => {
    const { fixture } = setup(DiscoverHost);
    getToc(fixture).refresh();

    const headings = fixture.nativeElement.querySelectorAll('.article h2, .article h3');
    expect(headings[0].id).toBe('intro'); // author id preserved
    expect(headings[1].id).toBe('getting-started');
    expect(headings[2].id).toBe('install');
    expect(headings[4].id).toBe('wrap-up');
  });

  it('suffixes a generated id that collides with an existing document id', () => {
    const { fixture } = setup(CollisionHost);
    getToc(fixture).refresh();

    const headings = fixture.nativeElement.querySelectorAll('.article h2');
    expect(headings[0].id).toBe('install'); // author id
    expect(headings[1].id).toBe('install-2'); // slug 'install' taken -> -2
  });

  it('ignores headings and renders [items] when autoDiscover is off', () => {
    const { fixture } = setup(ManualHost);
    expect(linkTexts(fixture.nativeElement)).toEqual(['Alpha']);
  });

  it('drops a queued discovery re-scan when the component is destroyed first', async () => {
    // No await between creation and destroy: the effect's deferred scan is
    // still sitting in the microtask queue when the component goes away, and
    // it must not scan a detached DOM.
    const fixture = TestBed.createComponent(DiscoverHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const refresh = vi.spyOn(getToc(fixture), 'refresh');
    fixture.destroy();
    await Promise.resolve();

    expect(refresh).not.toHaveBeenCalled();
  });

  it('re-scans on refresh() after the DOM changes', () => {
    const { fixture, toc } = setup(DiscoverHost);
    toc.refresh();
    fixture.detectChanges();
    expect(linkTexts(fixture.nativeElement).length).toBe(5);

    const article = fixture.nativeElement.querySelector('.article');
    const extra = document.createElement('h2');
    extra.textContent = 'Appendix';
    article.appendChild(extra);

    toc.refresh();
    fixture.detectChanges();
    expect(linkTexts(fixture.nativeElement)).toContain('Appendix');
  });

  it('scans nothing when contentRoot matches no element (no whole-document fallback)', () => {
    const { fixture, toc } = setup(MissingRootHost);
    toc.refresh();
    fixture.detectChanges();

    // Headings exist under .article, but the set-but-unmatched root must not
    // sweep them in.
    expect(linkTexts(fixture.nativeElement)).toEqual([]);
  });

  it('keeps the discovered reference stable across an unchanged re-scan', () => {
    const { toc } = setup(DiscoverHost);
    toc.refresh();
    const first = toc['discovered']();

    toc.refresh();

    expect(toc['discovered']()).toBe(first);
  });

  it('no-ops off the browser (server platform)', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const { fixture, toc } = setup(DiscoverHost);
    toc.refresh();
    fixture.detectChanges();

    expect(linkTexts(fixture.nativeElement)).toEqual([]);
  });

  it('auto-scans once after the first render without a manual refresh', async () => {
    const { fixture } = setup(DiscoverHost);
    // The constructor effect scheduled the scan on a microtask; flush it.
    await Promise.resolve();
    fixture.detectChanges();

    expect(linkTexts(fixture.nativeElement).length).toBe(5);
  });
});
