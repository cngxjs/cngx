import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxCard } from './card.component';
import { CngxCardHeader } from './card-header.directive';
import { CngxCardBody } from './card-body.directive';

@Component({
  template: `
    <cngx-card
      [as]="cardType()"
      [href]="href()"
      [ariaLabel]="ariaLabel()"
      [selectable]="selectable()"
      [(selected)]="selected"
      [loading]="loading()"
      [disabled]="disabled()"
      [disabledReason]="disabledReason()"
    >
      <header cngxCardHeader>Title</header>
      <div cngxCardBody>Body</div>
    </cngx-card>
  `,
  imports: [CngxCard, CngxCardHeader, CngxCardBody],
})
class TestHost {
  cardType = signal<'article' | 'link' | 'button'>('article');
  href = signal<string | undefined>(undefined);
  ariaLabel = signal<string | undefined>(undefined);
  selectable = signal(false);
  selected = signal(false);
  loading = signal(false);
  disabled = signal(false);
  disabledReason = signal<string | undefined>(undefined);
}

describe('CngxCard', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const card: HTMLElement = fixture.nativeElement.querySelector('cngx-card');
    return { fixture, card, host: fixture.componentInstance };
  }

  // --- Role ---
  it('defaults to role="article"', () => {
    const { card } = setup();
    expect(card.getAttribute('role')).toBe('article');
  });

  it('sets role="button" when as="button"', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('button');
    fixture.detectChanges();
    expect(card.getAttribute('role')).toBe('button');
  });

  it('sets role="link" when as="link"', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('link');
    fixture.detectChanges();
    expect(card.getAttribute('role')).toBe('link');
  });

  // --- Interactive class ---
  it('does not add interactive class for article', () => {
    const { card } = setup();
    expect(card.classList.contains('cngx-card--interactive')).toBe(false);
  });

  it('adds interactive class for button', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('button');
    fixture.detectChanges();
    expect(card.classList.contains('cngx-card--interactive')).toBe(true);
  });

  // --- Selection ---
  it('toggles selected on click when selectable', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('button');
    host.selectable.set(true);
    fixture.detectChanges();

    card.click();
    fixture.detectChanges();
    expect(host.selected()).toBe(true);
    expect(card.getAttribute('aria-selected')).toBe('true');

    card.click();
    fixture.detectChanges();
    expect(host.selected()).toBe(false);
  });

  it('does not set aria-selected when not selectable', () => {
    const { card } = setup();
    expect(card.hasAttribute('aria-selected')).toBe(false);
  });

  // --- Loading ---
  it('sets aria-busy when loading', () => {
    const { fixture, card, host } = setup();
    host.loading.set(true);
    fixture.detectChanges();
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(card.classList.contains('cngx-card--loading')).toBe(true);
  });

  it('has live region with loading announcement', () => {
    const { fixture, card, host } = setup();
    host.loading.set(true);
    fixture.detectChanges();
    const liveRegion = card.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion!.textContent!.trim()).toContain('Loading');
  });

  // --- Disabled ---
  it('sets aria-disabled when disabled', () => {
    const { fixture, card, host } = setup();
    host.disabled.set(true);
    fixture.detectChanges();
    expect(card.getAttribute('aria-disabled')).toBe('true');
    expect(card.classList.contains('cngx-card--disabled')).toBe(true);
  });

  it('prevents click when disabled', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('button');
    host.selectable.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    card.click();
    fixture.detectChanges();
    expect(host.selected()).toBe(false);
  });

  it('sets aria-describedby to disabled reason', () => {
    const { fixture, card, host } = setup();
    host.disabled.set(true);
    host.disabledReason.set('No permission');
    fixture.detectChanges();

    const describedBy = card.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const reasonEl = card.querySelector(`#${describedBy}`);
    expect(reasonEl).toBeTruthy();
    expect(reasonEl!.textContent!.trim()).toContain('No permission');
  });

  // --- Href ---
  it('sets href attribute when as="link"', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('link');
    host.href.set('/patients/1');
    fixture.detectChanges();
    expect(card.getAttribute('href')).toBe('/patients/1');
  });

  // --- Slots ---
  it('projects header and body slots', () => {
    const { card } = setup();
    expect(card.querySelector('.cngx-card__header')).toBeTruthy();
    expect(card.querySelector('.cngx-card__body')).toBeTruthy();
  });

  // --- Unique IDs ---
  it('generates unique IDs across instances', () => {
    const fixture1 = TestBed.createComponent(TestHost);
    const fixture2 = TestBed.createComponent(TestHost);
    fixture1.detectChanges();
    fixture2.detectChanges();

    const card1: HTMLElement = fixture1.nativeElement.querySelector('cngx-card');
    const card2: HTMLElement = fixture2.nativeElement.querySelector('cngx-card');

    const live1 = card1.querySelector('[aria-live]')!.id;
    const live2 = card2.querySelector('[aria-live]')!.id;
    expect(live1).not.toBe(live2);
  });
});
