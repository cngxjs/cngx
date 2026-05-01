import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { describe, expect, it } from 'vitest';

import { CNGX_CONTROL_VALUE } from '../control-value/control-value.token';
import { CngxButtonMultiToggleGroup } from './button-multi-toggle-group.component';
import { CngxButtonToggleGroup } from './button-toggle-group.component';
import { CNGX_BUTTON_TOGGLE_GROUP } from './button-toggle-group.token';
import { CngxButtonToggle } from './button-toggle.directive';

@Component({
  template: `
    <cngx-button-toggle-group label="Layout" [(value)]="v" [disabled]="off()">
      <button cngxButtonToggle value="grid">Grid</button>
      <button cngxButtonToggle value="list">List</button>
      <button cngxButtonToggle value="table" [disabled]="cOff()">Table</button>
    </cngx-button-toggle-group>
  `,
  imports: [CngxButtonToggleGroup, CngxButtonToggle],
})
class Host {
  v = signal<string | undefined>(undefined);
  off = signal(false);
  cOff = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const groupDe = fixture.debugElement.query(By.directive(CngxButtonToggleGroup));
  const toggleDes = fixture.debugElement.queryAll(By.directive(CngxButtonToggle));
  return {
    fixture,
    host: fixture.componentInstance,
    group: groupDe.injector.get(CngxButtonToggleGroup),
    groupEl: groupDe.nativeElement as HTMLElement,
    toggles: toggleDes.map((de) => ({
      dir: de.injector.get(CngxButtonToggle),
      el: de.nativeElement as HTMLElement,
    })),
    groupDe,
  };
}

describe('CngxButtonToggleGroup + CngxButtonToggle (single mode)', () => {
  it('group provides CNGX_BUTTON_TOGGLE_GROUP and CNGX_CONTROL_VALUE useExisting', () => {
    const { group, groupDe } = setup();
    expect(groupDe.injector.get(CNGX_BUTTON_TOGGLE_GROUP)).toBe(group);
    expect(groupDe.injector.get(CNGX_CONTROL_VALUE)).toBe(group);
  });

  it('renders role="radiogroup" on the group and aria-checked on each leaf', () => {
    const { groupEl, toggles } = setup();
    expect(groupEl.getAttribute('role')).toBe('radiogroup');
    toggles.forEach(({ el }) => {
      expect(el.getAttribute('aria-checked')).toBe('false');
      expect(el.getAttribute('aria-selected')).toBeNull();
    });
  });

  it('clicking a toggle sets the group value and reflects aria-checked', () => {
    const { fixture, host, toggles } = setup();
    toggles[1].el.click();
    fixture.detectChanges();
    expect(host.v()).toBe('list');
    expect(toggles[0].el.getAttribute('aria-checked')).toBe('false');
    expect(toggles[1].el.getAttribute('aria-checked')).toBe('true');
  });

  it('Space and Enter on a focused toggle pick it', () => {
    const { fixture, host, toggles } = setup();
    toggles[0].el.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.v()).toBe('grid');
    toggles[1].el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.v()).toBe('list');
  });

  it('arrow keydown raises pendingArrowSelect; focused leaf consumes it (W3C APG auto-select)', () => {
    const { fixture, host, group, groupEl, toggles } = setup();
    groupEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(group.consumePendingArrowSelect('list')).toBe(true);
    fixture.detectChanges();
    expect(host.v()).toBe('list');
    expect(toggles[1].el.getAttribute('aria-checked')).toBe('true');
  });

  it('Tab-into-group does NOT auto-select (no preceding arrow keydown)', () => {
    const { group, host } = setup();
    expect(group.consumePendingArrowSelect('grid')).toBe(false);
    expect(host.v()).toBeUndefined();
  });

  it('group disabled cascades to toggleDisabled and blocks click + ARIA', () => {
    const { fixture, host, toggles } = setup();
    host.off.set(true);
    fixture.detectChanges();
    toggles.forEach(({ el }) =>
      expect(el.getAttribute('aria-disabled')).toBe('true'),
    );
    toggles[0].el.click();
    fixture.detectChanges();
    expect(host.v()).toBeUndefined();
  });

  it('per-toggle disabled blocks only that leaf', () => {
    const { fixture, host, toggles } = setup();
    host.cOff.set(true);
    fixture.detectChanges();
    expect(toggles[2].el.getAttribute('aria-disabled')).toBe('true');
    toggles[2].el.click();
    fixture.detectChanges();
    expect(host.v()).toBeUndefined();
    toggles[0].el.click();
    fixture.detectChanges();
    expect(host.v()).toBe('grid');
  });

  it('aria-busy reflects state.status() === "loading" reactively', () => {
    @Component({
      template: `
        <cngx-button-toggle-group label="Async" [state]="state">
          <button cngxButtonToggle value="x">X</button>
        </cngx-button-toggle-group>
      `,
      imports: [CngxButtonToggleGroup, CngxButtonToggle],
    })
    class StateHost {
      readonly state: ManualAsyncState<string> = createManualState<string>();
    }

    const fixture = TestBed.createComponent(StateHost);
    fixture.detectChanges();
    const groupEl = fixture.debugElement.query(By.directive(CngxButtonToggleGroup))
      .nativeElement as HTMLElement;
    expect(groupEl.getAttribute('aria-busy')).toBeNull();

    fixture.componentInstance.state.set('loading');
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.state.setSuccess('ok');
    fixture.detectChanges();
    expect(groupEl.getAttribute('aria-busy')).toBeNull();
  });

  it('CngxButtonToggle binds [attr.aria-describedby] reactively from cngxDescribedBy input', () => {
    @Component({
      template: `
        <cngx-button-toggle-group label="Layout" [(value)]="v">
          <button cngxButtonToggle value="grid" [cngxDescribedBy]="hint()">
            Grid
          </button>
        </cngx-button-toggle-group>
      `,
      imports: [CngxButtonToggleGroup, CngxButtonToggle],
    })
    class DescribedHost {
      v = signal<string | undefined>(undefined);
      hint = signal<string | null>(null);
    }

    const fixture = TestBed.createComponent(DescribedHost);
    fixture.detectChanges();
    const buttonEl = fixture.debugElement.query(By.directive(CngxButtonToggle))
      .nativeElement as HTMLElement;
    expect(buttonEl.getAttribute('aria-describedby')).toBeNull();

    fixture.componentInstance.hint.set('reason-1');
    fixture.detectChanges();
    expect(buttonEl.getAttribute('aria-describedby')).toBe('reason-1');
  });

  it('CNGX_CONTROL_VALUE.value carries the single ModelSignal<T | undefined> shape', () => {
    const { fixture, host, groupDe } = setup();
    const cv = groupDe.injector.get(CNGX_CONTROL_VALUE);
    expect(cv.value()).toBeUndefined();
    cv.value.set('grid');
    fixture.detectChanges();
    expect(host.v()).toBe('grid');
  });

  it('CngxButtonToggle (without parent group) throws a dev-mode error', () => {
    @Component({
      template: `<button cngxButtonToggle [value]="'x'">X</button>`,
      imports: [CngxButtonToggle],
    })
    class Orphan {}

    expect(() => {
      TestBed.createComponent(Orphan).detectChanges();
    }).toThrow(/CngxButtonToggle requires a parent/);
  });

  it('CngxButtonToggle with both single AND multi parents throws (exactly-one contract)', () => {
    @Component({
      template: `
        <cngx-button-toggle-group label="Outer" [(value)]="v">
          <cngx-button-multi-toggle-group label="Inner" [(selectedValues)]="m">
            <button cngxButtonToggle value="x">X</button>
          </cngx-button-multi-toggle-group>
        </cngx-button-toggle-group>
      `,
      imports: [
        CngxButtonToggleGroup,
        CngxButtonMultiToggleGroup,
        CngxButtonToggle,
      ],
    })
    class DualParent {
      v = signal<string | undefined>(undefined);
      m = signal<string[]>([]);
    }

    expect(() => {
      TestBed.createComponent(DualParent).detectChanges();
    }).toThrow(/both CngxButtonToggleGroup and CngxButtonMultiToggleGroup/);
  });
});
