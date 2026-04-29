import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxTag, type CngxTagColor, type CngxTagSize, type CngxTagVariant } from './tag.directive';

@Component({
  imports: [CngxTag],
  template: `
    <span
      cngxTag
      [variant]="variant()"
      [color]="color()"
      [size]="size()"
      [truncate]="truncate()"
      [maxWidth]="maxWidth()"
      data-testid="tag"
    >
      Label
    </span>
  `,
})
class TagHost {
  readonly variant = signal<CngxTagVariant>('filled');
  readonly color = signal<CngxTagColor>('neutral');
  readonly size = signal<CngxTagSize>('md');
  readonly truncate = signal<boolean>(false);
  readonly maxWidth = signal<string | null>(null);
}

@Component({
  imports: [CngxTag],
  template: `<a cngxTag href="/category/red" data-testid="link-tag">Red</a>`,
})
class LinkTagHost {}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxTag', () => {
  it('(a) applies default filled / neutral / md host class set + data-color="neutral"', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.classList.contains('cngx-tag')).toBe(true);
    expect(host.classList.contains('cngx-tag--filled')).toBe(true);
    expect(host.classList.contains('cngx-tag--outline')).toBe(false);
    expect(host.classList.contains('cngx-tag--subtle')).toBe(false);
    expect(host.classList.contains('cngx-tag--sm')).toBe(false);
    expect(host.getAttribute('data-color')).toBe('neutral');
  });

  it('(b) [variant]="outline" flips host class set from filled to outline', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    fixture.componentInstance.variant.set('outline');
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.classList.contains('cngx-tag--outline')).toBe(true);
    expect(host.classList.contains('cngx-tag--filled')).toBe(false);
  });

  it('(c) [size]="sm"/"lg"/"xl" adds the matching modifier; "md" carries no size class', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');

    fixture.componentInstance.size.set('sm');
    flush(fixture);
    expect(host.classList.contains('cngx-tag--sm')).toBe(true);
    expect(host.classList.contains('cngx-tag--lg')).toBe(false);
    expect(host.classList.contains('cngx-tag--xl')).toBe(false);

    fixture.componentInstance.size.set('lg');
    flush(fixture);
    expect(host.classList.contains('cngx-tag--lg')).toBe(true);
    expect(host.classList.contains('cngx-tag--sm')).toBe(false);

    fixture.componentInstance.size.set('xl');
    flush(fixture);
    expect(host.classList.contains('cngx-tag--xl')).toBe(true);
    expect(host.classList.contains('cngx-tag--lg')).toBe(false);

    fixture.componentInstance.size.set('md');
    flush(fixture);
    expect(host.classList.contains('cngx-tag--sm')).toBe(false);
    expect(host.classList.contains('cngx-tag--lg')).toBe(false);
    expect(host.classList.contains('cngx-tag--xl')).toBe(false);
  });

  it('(d) [truncate]="true" adds the --truncate modifier', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    fixture.componentInstance.truncate.set(true);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.classList.contains('cngx-tag--truncate')).toBe(true);
  });

  it('(e) [maxWidth]="12rem" writes inline max-width', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    fixture.componentInstance.maxWidth.set('12rem');
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.style.maxWidth).toBe('12rem');
  });

  it('(f) [color]="my-brand" (open-string) sets data-color verbatim', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    fixture.componentInstance.color.set('my-brand');
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.getAttribute('data-color')).toBe('my-brand');
  });

  it('(g) <a cngxTag> preserves native anchor semantics — no synthetic role attr', () => {
    const fixture = TestBed.createComponent(LinkTagHost);
    flush(fixture);
    const host: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="link-tag"]');
    expect(host.tagName).toBe('A');
    expect(host.getAttribute('href')).toBe('/category/red');
    expect(host.getAttribute('role')).toBeNull();
    expect(host.classList.contains('cngx-tag')).toBe(true);
  });

  it('(h) without CNGX_TAG_GROUP provider, host carries no role="listitem"', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.getAttribute('role')).toBeNull();
  });
});
