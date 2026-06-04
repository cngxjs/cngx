import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxCardHeader } from './card-header.directive';
import { CngxCardBody } from './card-body.directive';
import { CngxCardMedia } from './card-media.directive';
import { CngxCardFooter } from './card-footer.directive';
import { CngxCardActions } from './card-actions.directive';
import { CngxCardBadge } from './card-badge.directive';

@Component({
  template: `
    <header cngxCardHeader>Header</header>
    <div cngxCardBody>Body</div>
    <img cngxCardMedia [decorative]="false" [aspectRatio]="'16/9'" />
    <footer cngxCardFooter>Footer</footer>
    <div cngxCardActions [align]="'end'">Actions</div>
    <span cngxCardBadge data-testid="badge-default">P</span>
    <span cngxCardBadge position="top-start" intent="danger" size="sm" data-testid="badge-explicit">!</span>
  `,
  imports: [
    CngxCardHeader,
    CngxCardBody,
    CngxCardMedia,
    CngxCardFooter,
    CngxCardActions,
    CngxCardBadge,
  ],
})
class TestHost {}

describe('Card slot directives', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('CngxCardHeader adds host class', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-card__header')).toBeTruthy();
  });

  it('CngxCardBody adds host class', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-card__body')).toBeTruthy();
  });

  it('CngxCardMedia sets aria-hidden when not decorative', () => {
    const { el } = setup();
    const media = el.querySelector('.cngx-card__media') as HTMLElement;
    expect(media).toBeTruthy();
    expect(media.hasAttribute('aria-hidden')).toBe(false);
  });

  it('CngxCardMedia sets aspect-ratio', () => {
    const { el } = setup();
    const media = el.querySelector('.cngx-card__media') as HTMLElement;
    expect(media.style.aspectRatio).toBe('16/9');
  });

  it('CngxCardFooter adds host class', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-card__footer')).toBeTruthy();
  });

  it('CngxCardActions adds host class and end alignment', () => {
    const { el } = setup();
    const actions = el.querySelector('.cngx-card__actions') as HTMLElement;
    expect(actions).toBeTruthy();
    expect(actions.classList.contains('cngx-card__actions--end')).toBe(true);
  });

  it('CngxCardBadge applies default intent + size + position when inputs are omitted', () => {
    const { el } = setup();
    const badge = el.querySelector('[data-testid="badge-default"]') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.classList.contains('cngx-card__badge')).toBe(true);
    expect(badge.classList.contains('cngx-card__badge--top-end')).toBe(true);
    expect(badge.classList.contains('cngx-card__badge--intent-primary')).toBe(true);
    expect(badge.classList.contains('cngx-card__badge--size-md')).toBe(true);
  });

  it('CngxCardBadge projects explicit position + intent + size inputs onto host classes', () => {
    const { el } = setup();
    const badge = el.querySelector('[data-testid="badge-explicit"]') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.classList.contains('cngx-card__badge--top-start')).toBe(true);
    expect(badge.classList.contains('cngx-card__badge--intent-danger')).toBe(true);
    expect(badge.classList.contains('cngx-card__badge--size-sm')).toBe(true);
  });

  it('CngxCardBadge intent + size modifier classes are mutually exclusive', () => {
    const { el } = setup();
    const explicit = el.querySelector('[data-testid="badge-explicit"]') as HTMLElement;
    const defaultBadge = el.querySelector('[data-testid="badge-default"]') as HTMLElement;

    expect(explicit.classList.contains('cngx-card__badge--intent-primary')).toBe(false);
    expect(explicit.classList.contains('cngx-card__badge--intent-warning')).toBe(false);
    expect(explicit.classList.contains('cngx-card__badge--intent-success')).toBe(false);
    expect(explicit.classList.contains('cngx-card__badge--intent-neutral')).toBe(false);
    expect(explicit.classList.contains('cngx-card__badge--size-md')).toBe(false);
    expect(explicit.classList.contains('cngx-card__badge--size-lg')).toBe(false);

    expect(defaultBadge.classList.contains('cngx-card__badge--intent-danger')).toBe(false);
    expect(defaultBadge.classList.contains('cngx-card__badge--size-sm')).toBe(false);
    expect(defaultBadge.classList.contains('cngx-card__badge--top-start')).toBe(false);
    expect(defaultBadge.classList.contains('cngx-card__badge--bottom-start')).toBe(false);
    expect(defaultBadge.classList.contains('cngx-card__badge--bottom-end')).toBe(false);
  });
});
