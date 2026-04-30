import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxTagLabel } from './slots/tag-label.directive';
import { CngxTagPrefix } from './slots/tag-prefix.directive';
import { CngxTagSuffix } from './slots/tag-suffix.directive';
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

@Component({
  imports: [CngxTag, CngxTagLabel],
  template: `
    <span cngxTag data-testid="tag">
      <ng-template cngxTagLabel>
        <bdi data-testid="custom-label">{{ name() }}</bdi>
      </ng-template>
    </span>
  `,
})
class LabelOverrideHost {
  readonly name = signal('Override');
}

@Component({
  imports: [CngxTag, CngxTagPrefix, CngxTagSuffix],
  template: `
    <span cngxTag data-testid="tag">
      <ng-template cngxTagPrefix>
        <span data-testid="prefix">P</span>
      </ng-template>
      Label
      <ng-template cngxTagSuffix>
        <span data-testid="suffix">S</span>
      </ng-template>
    </span>
  `,
})
class PrefixSuffixHost {}

@Component({
  imports: [CngxTag, CngxTagLabel],
  template: `
    <span
      cngxTag
      [variant]="variant()"
      [color]="color()"
      [size]="size()"
      [truncate]="truncate()"
      data-testid="tag"
    >
      <ng-template
        cngxTagLabel
        let-variant="variant"
        let-color="color"
        let-size="size"
        let-truncate="truncate"
      >
        <span
          data-testid="ctx"
          [attr.data-variant]="variant"
          [attr.data-color-ctx]="color"
          [attr.data-size]="size"
          [attr.data-truncate]="truncate"
        >ctx</span>
      </ng-template>
    </span>
  `,
})
class ContextProbeHost {
  readonly variant = signal<CngxTagVariant>('filled');
  readonly color = signal<CngxTagColor>('neutral');
  readonly size = signal<CngxTagSize>('md');
  readonly truncate = signal<boolean>(false);
}

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

  it('(i) *cngxTagLabel override replaces the default cngx-tag__label wrapper', () => {
    const fixture = TestBed.createComponent(LabelOverrideHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(host.querySelector('.cngx-tag__label')).toBeNull();
    const custom: HTMLElement | null = host.querySelector('[data-testid="custom-label"]');
    expect(custom).not.toBeNull();
    expect(custom!.textContent).toBe('Override');
  });

  it('(j) [truncate]="true" with default label keeps the cngx-tag__label wrapper for ellipsis hook', () => {
    const fixture = TestBed.createComponent(TagHost);
    fixture.componentInstance.truncate.set(true);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    const inner = host.querySelector('.cngx-tag__label');
    expect(inner).not.toBeNull();
    expect(inner!.textContent?.trim()).toBe('Label');
    expect(host.classList.contains('cngx-tag--truncate')).toBe(true);
  });

  it('(k) prefix / label / suffix project in DOM order', () => {
    const fixture = TestBed.createComponent(PrefixSuffixHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    const positioned = host.querySelectorAll(
      '[data-testid="prefix"], .cngx-tag__label, [data-testid="suffix"]',
    );
    expect(positioned.length).toBe(3);
    expect((positioned[0] as HTMLElement).getAttribute('data-testid')).toBe('prefix');
    expect((positioned[1] as HTMLElement).classList.contains('cngx-tag__label')).toBe(true);
    expect((positioned[2] as HTMLElement).getAttribute('data-testid')).toBe('suffix');
  });

  it('(l) slot context exposes variant/color/size/truncate reactively', () => {
    const fixture = TestBed.createComponent(ContextProbeHost);
    flush(fixture);
    const probe: HTMLElement = fixture.nativeElement.querySelector('[data-testid="ctx"]');
    expect(probe.getAttribute('data-variant')).toBe('filled');
    expect(probe.getAttribute('data-color-ctx')).toBe('neutral');
    expect(probe.getAttribute('data-size')).toBe('md');
    expect(probe.getAttribute('data-truncate')).toBe('false');

    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.color.set('success');
    fixture.componentInstance.size.set('lg');
    fixture.componentInstance.truncate.set(true);
    flush(fixture);

    expect(probe.getAttribute('data-variant')).toBe('outline');
    expect(probe.getAttribute('data-color-ctx')).toBe('success');
    expect(probe.getAttribute('data-size')).toBe('lg');
    expect(probe.getAttribute('data-truncate')).toBe('true');
  });

  it('(m) slotContext returns the same reference when inputs are stable; new reference on real change', () => {
    const fixture = TestBed.createComponent(TagHost);
    flush(fixture);
    const tagInstance = fixture.debugElement
      .query(By.directive(CngxTag))
      .injector.get(CngxTag) as unknown as { slotContext(): unknown };

    const ctx1 = tagInstance.slotContext();
    flush(fixture);
    const ctx2 = tagInstance.slotContext();
    expect(ctx2).toBe(ctx1);

    // Identical write — signal dedupes, computed never re-evaluates.
    fixture.componentInstance.variant.set('filled');
    flush(fixture);
    expect(tagInstance.slotContext()).toBe(ctx1);

    // Real change — equal fn rejects, new reference emitted.
    fixture.componentInstance.variant.set('outline');
    flush(fixture);
    expect(tagInstance.slotContext()).not.toBe(ctx1);
  });
});
