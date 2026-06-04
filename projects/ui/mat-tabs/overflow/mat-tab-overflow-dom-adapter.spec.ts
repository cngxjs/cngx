import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CngxTabHandle, CngxTabPanelHost } from '@cngx/common/tabs';

import { createCngxMatTabOverflowDomAdapter } from './mat-tab-overflow-dom-adapter';

function makeHandle(id: string): CngxTabHandle {
  return {
    id,
    label: () => id,
    disabled: () => false,
    errorAggregator: () => undefined,
  } as unknown as CngxTabHandle;
}

const stubPanelHost = {} as CngxTabPanelHost;

describe('CngxMatTabOverflowDomAdapter', () => {
  let header: HTMLElement;
  let labelContainer: HTMLElement;
  let host: HTMLElement;
  let tabButtons: HTMLElement[];

  beforeEach(() => {
    header = document.createElement('div');
    header.className = 'mat-mdc-tab-header';
    labelContainer = document.createElement('div');
    labelContainer.className = 'mat-mdc-tab-label-container';
    const tabList = document.createElement('div');
    tabList.className = 'mat-mdc-tab-list';
    const tabLabels = document.createElement('div');
    tabLabels.className = 'mat-mdc-tab-labels';

    tabButtons = ['alpha', 'beta', 'gamma'].map((label) => {
      const btn = document.createElement('div');
      btn.className = 'mat-mdc-tab';
      btn.setAttribute('role', 'tab');
      btn.dataset['label'] = label;
      tabLabels.appendChild(btn);
      return btn;
    });

    tabList.appendChild(tabLabels);
    labelContainer.appendChild(tabList);
    header.appendChild(labelContainer);

    host = document.createElement('cngx-tab-overflow');
    header.appendChild(host);
    document.body.appendChild(header);
  });

  afterEach(() => {
    header.remove();
  });

  it('resolveStripRoot walks .mat-mdc-tab-header → any .mat-mdc-tab → .mat-mdc-tab-label-container', () => {
    const adapter = createCngxMatTabOverflowDomAdapter();
    expect(adapter.resolveStripRoot(stubPanelHost, host)).toBe(labelContainer);
  });

  it('resolveStripRoot returns null when host is detached from any .mat-mdc-tab-header', () => {
    const detached = document.createElement('div');
    document.body.appendChild(detached);
    const adapter = createCngxMatTabOverflowDomAdapter();
    expect(adapter.resolveStripRoot(stubPanelHost, detached)).toBeNull();
    detached.remove();
  });

  it('resolveStripRoot returns null when the header has not yet rendered any .mat-mdc-tab', () => {
    const emptyHeader = document.createElement('div');
    emptyHeader.className = 'mat-mdc-tab-header';
    const emptyHost = document.createElement('cngx-tab-overflow');
    emptyHeader.appendChild(emptyHost);
    document.body.appendChild(emptyHeader);

    const adapter = createCngxMatTabOverflowDomAdapter();
    expect(adapter.resolveStripRoot(stubPanelHost, emptyHost)).toBeNull();
    emptyHeader.remove();
  });

  it('resolveTabButton indexes positionally into .mat-mdc-tab — handle.id ignored', () => {
    const adapter = createCngxMatTabOverflowDomAdapter();
    // Handle id deliberately does NOT match any DOM id; positional
    // resolution must still return the correct button.
    const handle = makeHandle('handle-id-not-on-dom');
    expect(adapter.resolveTabButton(handle, labelContainer, 0)).toBe(tabButtons[0]);
    expect(adapter.resolveTabButton(handle, labelContainer, 1)).toBe(tabButtons[1]);
    expect(adapter.resolveTabButton(handle, labelContainer, 2)).toBe(tabButtons[2]);
  });

  it('resolveTabButton returns null when idx is out of range', () => {
    const adapter = createCngxMatTabOverflowDomAdapter();
    expect(
      adapter.resolveTabButton(makeHandle('x'), labelContainer, 99),
    ).toBeNull();
  });
});
