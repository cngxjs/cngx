import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxCard } from './card.component';
import { CngxCardHeader } from './card-header.directive';
import { CngxCardBody } from './card-body.directive';

@Component({
  template: `
    <cngx-card
      [as]="cardType()"
      [role]="role()"
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
  role = signal<string | undefined>(undefined);
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
  it('lets an explicit role input override the archetype role', () => {
    const { fixture, card, host } = setup();
    host.role.set('listitem');
    fixture.detectChanges();
    expect(card.getAttribute('role')).toBe('listitem');

    host.cardType.set('button');
    fixture.detectChanges();
    expect(card.getAttribute('role')).toBe('listitem');

    host.role.set(undefined);
    fixture.detectChanges();
    expect(card.getAttribute('role')).toBe('button');
  });

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

  it('does not announce selection state for a never-touched card when loading clears', () => {
    const { fixture, card, host } = setup();
    host.selectable.set(true);
    host.loading.set(true);
    fixture.detectChanges();
    const liveRegion = card.querySelector('[aria-live="polite"]')!;
    expect(liveRegion.textContent!.trim()).toBe('Loading');

    host.loading.set(false);
    fixture.detectChanges();
    expect(liveRegion.textContent!.trim()).toBe('');
  });

  it('announces selection only on real toggles', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('button');
    host.selectable.set(true);
    fixture.detectChanges();
    const liveRegion = card.querySelector('[aria-live="polite"]')!;
    expect(liveRegion.textContent!.trim()).toBe('');

    card.click();
    fixture.detectChanges();
    expect(liveRegion.textContent!.trim()).toBe('Selected');

    card.click();
    fixture.detectChanges();
    expect(liveRegion.textContent!.trim()).toBe('Deselected');
  });

  it('voices a selection change that happened during loading once loading clears', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('button');
    host.selectable.set(true);
    host.loading.set(true);
    fixture.detectChanges();
    const liveRegion = card.querySelector('[aria-live="polite"]')!;
    expect(liveRegion.textContent!.trim()).toBe('Loading');

    host.selected.set(true);
    fixture.detectChanges();
    expect(liveRegion.textContent!.trim()).toBe('Loading');

    host.loading.set(false);
    fixture.detectChanges();
    expect(liveRegion.textContent!.trim()).toBe('Selected');
  });

  it('does not re-announce a pre-loading selection phrase after a loading cycle', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('button');
    host.selectable.set(true);
    fixture.detectChanges();
    card.click();
    fixture.detectChanges();
    const liveRegion = card.querySelector('[aria-live="polite"]')!;
    expect(liveRegion.textContent!.trim()).toBe('Selected');

    host.loading.set(true);
    fixture.detectChanges();
    host.loading.set(false);
    fixture.detectChanges();
    // The loading START spent the already-voiced phrase - the clear
    // renders empty instead of re-announcing the stale 'Selected'.
    expect(liveRegion.textContent!.trim()).toBe('');
  });

  it('does not activate a link card on Space (Enter-only per APG)', () => {
    const { fixture, card, host } = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    host.cardType.set('link');
    host.href.set('/patients/5');
    fixture.detectChanges();

    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    card.dispatchEvent(space);
    expect(navigate).not.toHaveBeenCalled();
    expect(space.defaultPrevented).toBe(false);

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(navigate).toHaveBeenCalledWith('/patients/5');
  });

  it('activates a button card on Space', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('button');
    host.selectable.set(true);
    fixture.detectChanges();
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    card.dispatchEvent(space);
    fixture.detectChanges();
    expect(space.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selected()).toBe(true);
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

  it('has no aria-describedby when there is nothing to describe', () => {
    const { card } = setup();
    expect(card.hasAttribute('aria-describedby')).toBe(false);
  });

  it('does not describe itself when disabledReason is set but disabled is false', () => {
    const { fixture, card, host } = setup();
    host.disabledReason.set('No permission');
    fixture.detectChanges();
    // accname 1.2 §2A would traverse the referenced span even while hidden,
    // so the id must be gated on the disabled state, not just on aria-hidden.
    expect(card.hasAttribute('aria-describedby')).toBe(false);
  });

  // --- Href ---
  it('sets href attribute when as="link"', () => {
    const { fixture, card, host } = setup();
    host.cardType.set('link');
    host.href.set('/patients/1');
    fixture.detectChanges();
    expect(card.getAttribute('href')).toBe('/patients/1');
  });

  it('navigates through the Router on click for as="link" with an internal href', () => {
    const { fixture, card, host } = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    host.cardType.set('link');
    host.href.set('/patients/1');
    fixture.detectChanges();
    card.click();
    expect(navigate).toHaveBeenCalledWith('/patients/1');
  });

  it('navigates through the Router on Enter for as="link"', () => {
    const { fixture, card, host } = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    host.cardType.set('link');
    host.href.set('/patients/2');
    fixture.detectChanges();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(navigate).toHaveBeenCalledWith('/patients/2');
  });

  it('does not navigate without an href or when disabled', () => {
    const { fixture, card, host } = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    host.cardType.set('link');
    fixture.detectChanges();
    card.click();
    expect(navigate).not.toHaveBeenCalled();

    host.href.set('/patients/3');
    host.disabled.set(true);
    fixture.detectChanges();
    card.click();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('skips navigation on modified clicks (new-tab intent)', () => {
    const { fixture, card, host } = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    host.cardType.set('link');
    host.href.set('/patients/6');
    fixture.detectChanges();

    card.dispatchEvent(new MouseEvent('click', { metaKey: true, bubbles: true }));
    card.dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    card.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));
    card.dispatchEvent(new MouseEvent('click', { button: 1, bubbles: true }));
    expect(navigate).not.toHaveBeenCalled();

    card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('ignores key repeats (held Enter navigates once)', () => {
    const { fixture, card, host } = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    host.cardType.set('link');
    host.href.set('/patients/7');
    fixture.detectChanges();

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true }));
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true }));
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('does not navigate for the button archetype', () => {
    const { fixture, card, host } = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    host.cardType.set('button');
    host.href.set('/patients/4');
    fixture.detectChanges();
    card.click();
    expect(navigate).not.toHaveBeenCalled();
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
