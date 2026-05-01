import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { describe, expect, it } from 'vitest';

import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxButtonMultiToggleGroup } from './button-multi-toggle-group.component';
import { CNGX_BUTTON_MULTI_TOGGLE_GROUP } from './button-multi-toggle-group.token';
import { CngxButtonToggle } from './button-toggle.directive';

@Component({
  template: `
    <cngx-button-multi-toggle-group
      label="Filters"
      [(selectedValues)]="picked"
      [disabled]="off()"
    >
      <button cngxButtonToggle value="open">Open</button>
      <button cngxButtonToggle value="closed">Closed</button>
      <button cngxButtonToggle value="archived" [disabled]="archivedOff()">
        Archived
      </button>
    </cngx-button-multi-toggle-group>
  `,
  imports: [CngxButtonMultiToggleGroup, CngxButtonToggle],
})
class Host {
  picked = signal<string[]>([]);
  off = signal(false);
  archivedOff = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const groupDe = fixture.debugElement.query(
    By.directive(CngxButtonMultiToggleGroup),
  );
  const toggleDes = fixture.debugElement.queryAll(By.directive(CngxButtonToggle));
  return {
    fixture,
    host: fixture.componentInstance,
    group: groupDe.injector.get(CngxButtonMultiToggleGroup),
    groupEl: groupDe.nativeElement as HTMLElement,
    toggles: toggleDes.map((de) => ({
      dir: de.injector.get(CngxButtonToggle),
      el: de.nativeElement as HTMLElement,
    })),
    groupDe,
  };
}

describe('CngxButtonMultiToggleGroup + CngxButtonToggle (multi mode)', () => {
  it('group provides CNGX_BUTTON_MULTI_TOGGLE_GROUP and CNGX_CONTROL_VALUE useExisting', () => {
    const { group, groupDe } = setup();
    expect(groupDe.injector.get(CNGX_BUTTON_MULTI_TOGGLE_GROUP)).toBe(group);
    expect(groupDe.injector.get(CNGX_CONTROL_VALUE)).toBe(group);
  });

  it('renders role="toolbar" on the group and aria-selected on each leaf (NOT aria-checked)', () => {
    const { groupEl, toggles } = setup();
    expect(groupEl.getAttribute('role')).toBe('toolbar');
    toggles.forEach(({ el }) => {
      expect(el.getAttribute('aria-selected')).toBe('false');
      expect(el.getAttribute('aria-checked')).toBeNull();
    });
  });

  it('clicking a toggle adds it; clicking again removes it (toggle semantics)', () => {
    const { fixture, host, toggles } = setup();
    toggles[0].el.click();
    fixture.detectChanges();
    expect(host.picked()).toEqual(['open']);
    expect(toggles[0].el.getAttribute('aria-selected')).toBe('true');

    toggles[1].el.click();
    fixture.detectChanges();
    expect(host.picked()).toEqual(['open', 'closed']);

    toggles[0].el.click();
    fixture.detectChanges();
    expect(host.picked()).toEqual(['closed']);
    expect(toggles[0].el.getAttribute('aria-selected')).toBe('false');
  });

  it('Space and Enter on a focused toggle toggle membership (no auto-select on arrow)', () => {
    const { fixture, host, toggles } = setup();
    toggles[0].el.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.picked()).toEqual(['open']);

    toggles[1].el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.picked()).toEqual(['open', 'closed']);
  });

  it('CngxButtonToggle resolves the multi-token (not the single-token) when hosted here', () => {
    const { toggles, groupDe } = setup();
    const leafInjector = groupDe.queryAll(By.directive(CngxButtonToggle))[0]
      .injector;
    expect(leafInjector.get(CNGX_BUTTON_MULTI_TOGGLE_GROUP)).toBe(
      groupDe.injector.get(CngxButtonMultiToggleGroup),
    );
    // aria-selected is the multi-mode marker; aria-checked stays null.
    expect(toggles[0].el.getAttribute('aria-selected')).toBe('false');
    expect(toggles[0].el.getAttribute('aria-checked')).toBeNull();
  });

  it('group disabled cascades to all leaves and blocks toggle()', () => {
    const { fixture, host, toggles } = setup();
    host.off.set(true);
    fixture.detectChanges();
    toggles.forEach(({ el }) =>
      expect(el.getAttribute('aria-disabled')).toBe('true'),
    );
    toggles[0].el.click();
    fixture.detectChanges();
    expect(host.picked()).toEqual([]);
  });

  it('per-toggle disabled blocks only that leaf', () => {
    const { fixture, host, toggles } = setup();
    host.archivedOff.set(true);
    fixture.detectChanges();
    expect(toggles[2].el.getAttribute('aria-disabled')).toBe('true');
    toggles[2].el.click();
    fixture.detectChanges();
    expect(host.picked()).toEqual([]);

    toggles[0].el.click();
    fixture.detectChanges();
    expect(host.picked()).toEqual(['open']);
  });

  it('CNGX_CONTROL_VALUE.value carries the multi ModelSignal<T[]> shape', () => {
    const { fixture, host, groupDe } = setup();
    const cv = groupDe.injector.get(CNGX_CONTROL_VALUE);
    expect(cv.value()).toEqual([]);
    cv.value.set(['open', 'closed']);
    fixture.detectChanges();
    expect(host.picked()).toEqual(['open', 'closed']);
  });

  it('aria-orientation reflects the orientation input default', () => {
    const { groupEl } = setup();
    expect(groupEl.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('aria-busy reflects state.status() === "loading" reactively', () => {
    @Component({
      template: `
        <cngx-button-multi-toggle-group label="Async" [state]="state">
          <button cngxButtonToggle value="x">X</button>
        </cngx-button-multi-toggle-group>
      `,
      imports: [CngxButtonMultiToggleGroup, CngxButtonToggle],
    })
    class StateHost {
      readonly state: ManualAsyncState<string> = createManualState<string>();
    }

    const fixture = TestBed.createComponent(StateHost);
    fixture.detectChanges();
    const groupEl = fixture.debugElement.query(
      By.directive(CngxButtonMultiToggleGroup),
    ).nativeElement as HTMLElement;
    expect(groupEl.getAttribute('aria-busy')).toBeNull();

    fixture.componentInstance.state.set('loading');
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.state.setSuccess('ok');
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-busy')).toBeNull();
  });

  it('isSelected returns a stable signal identity per value (selection-controller invariant)', () => {
    const { group } = setup();
    const a = group.isSelected('open');
    const b = group.isSelected('open');
    expect(a).toBe(b);
  });
});
