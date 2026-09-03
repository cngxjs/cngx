import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CngxAsyncState } from '@cngx/core/utils';
import { createAsyncStateMock, type AsyncStateMock } from '@cngx/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxChartPanel, type CngxChartPanelLegendPosition } from './chart-panel.component';
import {
  CngxChartPanelActions,
  CngxChartPanelFooter,
  CngxChartPanelSubtitle,
  CngxChartPanelTitle,
} from './chart-panel-slots';

@Component({
  standalone: true,
  imports: [
    CngxChartPanel,
    CngxChartPanelTitle,
    CngxChartPanelSubtitle,
    CngxChartPanelActions,
    CngxChartPanelFooter,
  ],
  template: `
    <cngx-chart-panel>
      @if (showTitle()) {
        <h3 cngxChartPanelTitle>Revenue by quarter</h3>
      }
      <span cngxChartPanelSubtitle>EUR, net</span>
      <button cngxChartPanelActions type="button">Refresh</button>

      <div class="fake-chart">chart body</div>

      <small cngxChartPanelFooter>Source: warehouse</small>
    </cngx-chart-panel>
  `,
})
class TestHost {
  showTitle = signal(true);
}

describe('CngxChartPanel', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('cngx-chart-panel');
    return { fixture, panel, host: fixture.componentInstance };
  }

  it('names the region from the projected title slot', () => {
    const { panel } = setup();
    const titleId = panel.querySelector('[cngxChartPanelTitle]')!.id;

    expect(titleId).toBeTruthy();
    expect(panel.getAttribute('role')).toBe('group');
    expect(panel.getAttribute('aria-labelledby')).toBe(titleId);
  });

  it('leaves the region unnamed rather than pointing at a missing id', () => {
    const { fixture, panel, host } = setup();
    host.showTitle.set(false);
    fixture.detectChanges();

    expect(panel.querySelector('[cngxChartPanelTitle]')).toBeNull();
    expect(panel.getAttribute('aria-labelledby')).toBeNull();
  });

  it('projects subtitle, actions and footer into their own slots', () => {
    const { panel } = setup();
    expect(panel.querySelector('.cngx-chart-panel__subtitle')!.textContent).toContain('EUR, net');
    expect(panel.querySelector('.cngx-chart-panel__actions')!.textContent).toContain('Refresh');
    expect(panel.querySelector('.cngx-chart-panel__footer')!.textContent).toContain('warehouse');
  });

  it('places the chart body in the body slot, between header and footer', () => {
    const { panel } = setup();
    const body = panel.querySelector('.cngx-chart-panel__body')!;
    expect(body.textContent).toContain('chart body');

    // The header must precede the body in DOM order so tab order reaches the
    // actions before the chart.
    const header = panel.querySelector('.cngx-chart-panel__header')!;
    expect(header.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does not duplicate the chart async envelope', () => {
    const { panel } = setup();
    // The panel owns no view switch: no skeleton, empty or error body of its
    // own. Whatever the projected chart renders is what shows.
    expect(panel.querySelector('[class*="skeleton"]')).toBeNull();
    expect(panel.querySelector('[class*="empty"]')).toBeNull();
    expect(panel.querySelector('[class*="error"]')).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [CngxChartPanel, CngxChartPanelActions],
  template: `
    <cngx-chart-panel [state]="state()" [legendPosition]="legend()">
      <button cngxChartPanelActions type="button">Refresh</button>
      <div class="fake-chart">chart body</div>
    </cngx-chart-panel>
  `,
})
class ChromeHost {
  state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  legend = signal<CngxChartPanelLegendPosition>('bottom');
}

describe('CngxChartPanel chrome', () => {
  let state: AsyncStateMock;

  beforeEach(() => {
    state = createAsyncStateMock();
    TestBed.configureTestingModule({ imports: [ChromeHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(ChromeHost);
    fixture.componentInstance.state.set(state);
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('cngx-chart-panel');
    return { fixture, panel, host: fixture.componentInstance };
  }

  it('exposes the legend placement as a host attribute for the skin', () => {
    const { fixture, panel, host } = setup();
    expect(panel.getAttribute('data-legend')).toBe('bottom');

    host.legend.set('top');
    fixture.detectChanges();
    expect(panel.getAttribute('data-legend')).toBe('top');

    host.legend.set('none');
    fixture.detectChanges();
    expect(panel.getAttribute('data-legend')).toBe('none');
  });

  it('marks the action cluster aria-disabled only while the panel is busy', () => {
    const { fixture, panel } = setup();
    const slot = panel.querySelector('.cngx-chart-panel__action-slot')!;
    expect(slot.getAttribute('aria-disabled')).toBeNull();

    state.set({ status: 'refreshing', firstLoad: false });
    fixture.detectChanges();
    expect(slot.getAttribute('aria-disabled')).toBe('true');

    state.set({ status: 'success', firstLoad: false });
    fixture.detectChanges();
    expect(slot.getAttribute('aria-disabled')).toBeNull();
  });

  it('confines busy to the header, leaving the chart region unmarked', () => {
    const { fixture, panel } = setup();
    state.set({ status: 'refreshing', firstLoad: false });
    fixture.detectChanges();

    // aria-busy on the group would suppress the projected chart's own live
    // announcements and claim a stable chart is updating.
    expect(panel.getAttribute('aria-busy')).toBeNull();
    expect(panel.querySelector('.cngx-chart-panel__header')!.getAttribute('aria-busy')).toBe(
      'true',
    );
  });

  it('keeps the action cluster in the DOM while busy, rather than removing it', () => {
    const { fixture, panel } = setup();
    state.set({ status: 'refreshing', firstLoad: false });
    fixture.detectChanges();
    expect(panel.querySelector('[cngxChartPanelActions]')!.textContent).toContain('Refresh');
  });

  it('leaves a projected chart body untouched while the panel is busy', () => {
    const { fixture, panel } = setup();
    state.set({ status: 'refreshing', firstLoad: false });
    fixture.detectChanges();

    // The demarcation: panel busy dims chrome only. The chart body neither
    // disappears nor gains a panel-owned placeholder over it.
    expect(panel.querySelector('.fake-chart')!.textContent).toContain('chart body');
  });

  it('announces the configured busy label through a hidden status region', () => {
    const { fixture, panel } = setup();
    const sr = panel.querySelector('.cngx-chart-panel__status')!;
    expect(sr.getAttribute('role')).toBe('status');
    expect(sr.textContent?.trim()).toBe('');

    state.set({ status: 'refreshing', firstLoad: false });
    fixture.detectChanges();
    expect(sr.textContent?.trim()).toBe('Updating');

    // Outside the busy header - a live region inside an aria-busy container
    // has its announcements suppressed.
    expect(sr.closest('[aria-busy="true"]')).toBeNull();

    state.set({ status: 'success', firstLoad: false });
    fixture.detectChanges();
    expect(sr.textContent?.trim()).toBe('');
  });

  it('blocks Enter/Space activation in the action cluster while busy', () => {
    const { fixture, panel } = setup();
    const button = panel.querySelector<HTMLButtonElement>('[cngxChartPanelActions]')!;

    // Not busy: keys pass through untouched.
    let event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);

    state.set({ status: 'pending', firstLoad: false });
    fixture.detectChanges();

    // Busy: pointer-events already blocks clicks; the guard must stop the
    // keyboard modality too (Enter keydown, Space keydown + keyup).
    event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    event = new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    // Unrelated keys (e.g. Tab to leave the cluster) stay untouched.
    event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('holds against consumer key handlers on the projected actions (capture phase)', () => {
    const { fixture, panel } = setup();
    const button = panel.querySelector<HTMLButtonElement>('[cngxChartPanelActions]')!;
    let consumerCalls = 0;
    button.addEventListener('keydown', () => {
      consumerCalls += 1;
    });

    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(consumerCalls).toBe(1);

    state.set({ status: 'pending', firstLoad: false });
    fixture.detectChanges();

    // The guard runs on the wrapper in the capture phase, before the
    // button's own handler - a bubble guard would fire after it and only
    // cancel the native activation.
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(consumerCalls).toBe(1);
  });

  it('names why the actions are disabled while busy via aria-describedby', () => {
    const { fixture, panel } = setup();
    const slot = panel.querySelector('.cngx-chart-panel__action-slot')!;
    expect(slot.getAttribute('aria-describedby')).toBeNull();

    state.set({ status: 'refreshing', firstLoad: false });
    fixture.detectChanges();

    // The description target is always in the DOM; only the reference is
    // gated on the state it describes.
    const describedBy = slot.getAttribute('aria-describedby')!;
    expect(describedBy).toBeTruthy();
    const description = panel.querySelector(`#${describedBy}`)!;
    expect(description.textContent?.trim()).toBe('Updating');

    state.set({ status: 'success', firstLoad: false });
    fixture.detectChanges();
    expect(slot.getAttribute('aria-describedby')).toBeNull();
    expect(panel.querySelector(`#${describedBy}`)).not.toBeNull();
  });

  it('owns no async view switch of its own', () => {
    const { fixture, panel } = setup();
    state.set({ status: 'error', firstLoad: true });
    fixture.detectChanges();

    // An error on the panel state must not replace the body - the chart decides
    // what an error looks like for its own data.
    expect(panel.querySelector('.fake-chart')).not.toBeNull();
  });
});
