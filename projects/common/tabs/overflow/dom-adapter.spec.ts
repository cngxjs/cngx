import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CngxTabHandle } from '../tab-group-host.token';
import type { CngxTabPanelHost } from '../tab-panel-host.token';

import {
  CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
  createCngxTabOverflowDefaultDomAdapter,
} from './dom-adapter';

function makeHandle(id: string): CngxTabHandle {
  return {
    id,
    label: () => id,
    disabled: () => false,
    errorAggregator: () => undefined,
  } as unknown as CngxTabHandle;
}

const stubPanelHost = {} as CngxTabPanelHost;

describe('CngxTabOverflowDomAdapter — default factory', () => {
  let wrapper: HTMLElement;
  let strip: HTMLElement;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    wrapper = document.createElement('div');
    wrapper.className = 'cngx-tabs__strip-wrapper';
    strip = document.createElement('div');
    strip.className = 'cngx-tabs__strip';
    host = document.createElement('div');
    wrapper.appendChild(strip);
    wrapper.appendChild(host);
    document.body.appendChild(wrapper);
  });

  afterEach(() => {
    wrapper.remove();
  });

  it('resolveStripRoot walks closest(.cngx-tabs__strip-wrapper) then queries .cngx-tabs__strip', () => {
    const adapter = createCngxTabOverflowDefaultDomAdapter();
    expect(adapter.resolveStripRoot(stubPanelHost, host)).toBe(strip);
  });

  it('resolveStripRoot returns null when host is detached from the wrapper', () => {
    const detached = document.createElement('div');
    const adapter = createCngxTabOverflowDefaultDomAdapter();
    expect(adapter.resolveStripRoot(stubPanelHost, detached)).toBeNull();
  });

  it('resolveTabButton resolves by handle.id (cngx-native id contract)', () => {
    const button = document.createElement('button');
    button.id = 'tab-1-header';
    strip.appendChild(button);

    const adapter = createCngxTabOverflowDefaultDomAdapter();
    expect(adapter.resolveTabButton(makeHandle('tab-1'), strip, 0)).toBe(button);
  });

  it('resolveTabButton ignores idx — id contract is positional-independent', () => {
    const buttonA = document.createElement('button');
    buttonA.id = 'tab-1-header';
    const buttonB = document.createElement('button');
    buttonB.id = 'tab-2-header';
    strip.appendChild(buttonA);
    strip.appendChild(buttonB);

    const adapter = createCngxTabOverflowDefaultDomAdapter();
    expect(adapter.resolveTabButton(makeHandle('tab-2'), strip, 0)).toBe(buttonB);
    expect(adapter.resolveTabButton(makeHandle('tab-1'), strip, 99)).toBe(buttonA);
  });

  it('CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY token resolves to the default factory function', () => {
    const factory = TestBed.inject(CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY);
    const adapter = factory();
    expect(adapter.resolveStripRoot(stubPanelHost, host)).toBe(strip);
  });
});
