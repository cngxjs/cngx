import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxCardHeader } from './card-header.directive';
import { CngxCardBody } from './card-body.directive';
import { CngxCardMedia } from './card-media.directive';
import { CngxCardFooter } from './card-footer.directive';
import { CngxCardActions } from './card-actions.directive';

@Component({
  template: `
    <header cngxCardHeader>Header</header>
    <div cngxCardBody>Body</div>
    <img cngxCardMedia [decorative]="false" [aspectRatio]="'16/9'" />
    <footer cngxCardFooter>Footer</footer>
    <div cngxCardActions [align]="'end'">Actions</div>
  `,
  imports: [CngxCardHeader, CngxCardBody, CngxCardMedia, CngxCardFooter, CngxCardActions],
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
    // decorative=false means no aria-hidden
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
});
