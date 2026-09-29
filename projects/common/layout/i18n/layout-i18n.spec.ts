import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { createResizeObserverMock } from '@cngx/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxExpandableText } from '../text/expandable-text';
import {
  CNGX_LAYOUT_I18N,
  injectLayoutI18n,
  provideLayoutI18n,
  withLayoutI18nLabels,
  type CngxLayoutI18n,
} from './layout-i18n';

@Component({
  template: `<cngx-expandable-text>Long text content.</cngx-expandable-text>`,
  imports: [CngxExpandableText],
})
class Host {}

function expandableText(): CngxExpandableText {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture.debugElement
    .query(By.directive(CngxExpandableText))
    .injector.get(CngxExpandableText);
}

describe('CNGX_LAYOUT_I18N', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    createResizeObserverMock().install(window);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('ships the English labels without a provider', () => {
    expect(TestBed.inject(CNGX_LAYOUT_I18N)()).toEqual({
      expandableTextMore: 'Show more',
      expandableTextLess: 'Show less',
    });
  });

  it('defaults the expandable-text labels from a partial override', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideLayoutI18n(withLayoutI18nLabels({ expandableTextMore: 'Mehr anzeigen' }))],
    });
    const cmp = expandableText();
    expect(cmp.moreLabel()).toBe('Mehr anzeigen');
    expect(cmp.lessLabel()).toBe('Show less');
  });

  it('flips live through a Signal override', () => {
    const overrides = signal<Partial<CngxLayoutI18n>>({});
    TestBed.configureTestingModule({
      providers: [provideLayoutI18n(withLayoutI18nLabels(overrides))],
    });
    const bundle = TestBed.runInInjectionContext(() => injectLayoutI18n());
    expect(bundle().expandableTextLess).toBe('Show less');
    overrides.set({ expandableTextLess: 'Weniger anzeigen' });
    expect(bundle().expandableTextLess).toBe('Weniger anzeigen');
  });

  it('shares one Signal across readers under one injector', () => {
    TestBed.configureTestingModule({
      providers: [provideLayoutI18n(withLayoutI18nLabels({ expandableTextMore: 'x' }))],
    });
    const first = TestBed.runInInjectionContext(() => injectLayoutI18n());
    const second = TestBed.runInInjectionContext(() => injectLayoutI18n());
    expect(first).toBe(second);
  });
});
