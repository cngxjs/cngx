import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxTag } from '../tag/tag.directive';
import {
  CngxTagGroup,
  type CngxTagGroupAlign,
  type CngxTagGroupGap,
} from './tag-group.component';

@Component({
  imports: [CngxTagGroup],
  template: `
    <cngx-tag-group
      [gap]="gap()"
      [align]="align()"
      [semanticList]="semanticList()"
      [label]="label()"
      data-testid="group"
    ></cngx-tag-group>
  `,
})
class GroupHost {
  readonly gap = signal<CngxTagGroupGap>('sm');
  readonly align = signal<CngxTagGroupAlign>('start');
  readonly semanticList = signal<boolean>(false);
  readonly label = signal<string | undefined>(undefined);
}

@Component({
  imports: [CngxTagGroup, CngxTag],
  template: `
    <cngx-tag-group [semanticList]="semanticList()" data-testid="group">
      <span cngxTag data-testid="tag">Label</span>
    </cngx-tag-group>
  `,
})
class CascadeHost {
  readonly semanticList = signal<boolean>(true);
}

@Component({
  imports: [CngxTag],
  template: `<span cngxTag data-testid="orphan-tag">Outside</span>`,
})
class OrphanTagHost {}

@Component({
  imports: [CngxTagGroup, CngxTag],
  template: `
    <cngx-tag-group [semanticList]="true" label="Tags" data-testid="group">
      <span cngxTag>One</span>
      <span cngxTag>Two</span>
      <span cngxTag>Three</span>
      <span cngxTag>Four</span>
      <span cngxTag>Five</span>
    </cngx-tag-group>
  `,
})
class FullContractHost {}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxTagGroup', () => {
  it('(a) default group host carries no role attribute', () => {
    const fixture = TestBed.createComponent(GroupHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="group"]');
    expect(host.getAttribute('role')).toBeNull();
    expect(host.classList.contains('cngx-tag-group')).toBe(true);
  });

  it('(b) [semanticList]="true" adds role="list"', () => {
    const fixture = TestBed.createComponent(GroupHost);
    flush(fixture);
    fixture.componentInstance.semanticList.set(true);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="group"]');
    expect(host.getAttribute('role')).toBe('list');
  });

  it('(c) [label]="Tags" emits aria-label="Tags"', () => {
    const fixture = TestBed.createComponent(GroupHost);
    flush(fixture);
    fixture.componentInstance.label.set('Tags');
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="group"]');
    expect(host.getAttribute('aria-label')).toBe('Tags');
  });

  it('(d) [gap]="md" toggles --gap-md modifier; sm carries no gap class', () => {
    const fixture = TestBed.createComponent(GroupHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="group"]');
    expect(host.classList.contains('cngx-tag-group--gap-md')).toBe(false);
    expect(host.classList.contains('cngx-tag-group--gap-xs')).toBe(false);

    fixture.componentInstance.gap.set('md');
    flush(fixture);
    expect(host.classList.contains('cngx-tag-group--gap-md')).toBe(true);

    fixture.componentInstance.gap.set('xs');
    flush(fixture);
    expect(host.classList.contains('cngx-tag-group--gap-md')).toBe(false);
    expect(host.classList.contains('cngx-tag-group--gap-xs')).toBe(true);

    fixture.componentInstance.gap.set('sm');
    flush(fixture);
    expect(host.classList.contains('cngx-tag-group--gap-md')).toBe(false);
    expect(host.classList.contains('cngx-tag-group--gap-xs')).toBe(false);
  });

  it('(e) all four align values resolve to the matching modifier class', () => {
    const fixture = TestBed.createComponent(GroupHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="group"]');

    const cases: ReadonlyArray<{ value: CngxTagGroupAlign; cls: string }> = [
      { value: 'start', cls: 'cngx-tag-group--align-start' },
      { value: 'center', cls: 'cngx-tag-group--align-center' },
      { value: 'end', cls: 'cngx-tag-group--align-end' },
      { value: 'between', cls: 'cngx-tag-group--align-between' },
    ];
    for (const { value, cls } of cases) {
      fixture.componentInstance.align.set(value);
      flush(fixture);
      expect(host.classList.contains(cls)).toBe(true);
      for (const other of cases) {
        if (other.value !== value) {
          expect(host.classList.contains(other.cls)).toBe(false);
        }
      }
    }
  });

  it('(f) child cngxTag inside [semanticList]="true" group carries role="listitem"', () => {
    const fixture = TestBed.createComponent(CascadeHost);
    flush(fixture);
    const tag: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(tag.getAttribute('role')).toBe('listitem');
  });

  it('(g) flipping semanticList true→false removes role="listitem" within one flushEffects tick', () => {
    const fixture = TestBed.createComponent(CascadeHost);
    flush(fixture);
    const tag: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tag"]');
    expect(tag.getAttribute('role')).toBe('listitem');

    fixture.componentInstance.semanticList.set(false);
    flush(fixture);
    expect(tag.getAttribute('role')).toBeNull();

    fixture.componentInstance.semanticList.set(true);
    flush(fixture);
    expect(tag.getAttribute('role')).toBe('listitem');
  });

  it('(h) cngxTag outside any TagGroup carries no role="listitem"', () => {
    const fixture = TestBed.createComponent(OrphanTagHost);
    flush(fixture);
    const tag: HTMLElement = fixture.nativeElement.querySelector('[data-testid="orphan-tag"]');
    expect(tag.getAttribute('role')).toBeNull();
  });

  it('(i) AT-string contract: role="list" + aria-label + exactly N role="listitem" descendants', () => {
    const fixture = TestBed.createComponent(FullContractHost);
    flush(fixture);
    const host: HTMLElement = fixture.nativeElement.querySelector('[data-testid="group"]');
    expect(host.getAttribute('role')).toBe('list');
    expect(host.getAttribute('aria-label')).toBe('Tags');
    const items = host.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(5);
  });
});
