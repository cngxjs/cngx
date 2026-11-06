import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxListbox, CngxOption } from '@cngx/common/interactive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxSelect } from '../../../single-select/select.component';
import { provideSelectConfig, withVirtualization } from '../../config';
import type { CngxSelectOptionDef } from '../../option.model';
import { CngxSelectOptionLabel } from '../../template-slots';

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.setAttribute('data-popover-open', 'true');
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
    };
  }
}

const OPTIONS: CngxSelectOptionDef<number>[] = Array.from({ length: 200 }, (_, i) => ({
  value: i,
  label: `Option ${i}`,
}));

@Component({
  template: `
    <cngx-select [label]="'Pick'" [options]="options">
      <ng-template cngxSelectOptionLabel let-option let-highlighted="highlighted">
        <span [attr.data-hl]="highlighted">{{ option.label }}</span>
      </ng-template>
    </cngx-select>
  `,
  imports: [CngxSelect, CngxSelectOptionLabel],
})
class LabelSlotHost {
  readonly options = OPTIONS;
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxSelectPanel - highlighted option in the label slot', () => {
  beforeEach(() => {
    polyfillPopover();
    // Identity render: this pass asserts the highlighted option is resolved
    // once per change, not once per row, across all 200 rows. Default
    // virtualization windows a 200-option list, so opt out to keep the full
    // list in the DOM.
    TestBed.configureTestingModule({
      imports: [LabelSlotHost],
      providers: [provideSelectConfig(withVirtualization(false))],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('resolves the highlighted option once per pass, not once per row', () => {
    const fixture = TestBed.createComponent(LabelSlotHost);
    flush(fixture);
    const select = fixture.debugElement.query(By.directive(CngxSelect))
      .componentInstance as CngxSelect<number>;
    select.open();
    flush(fixture);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxListbox);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('[data-hl]').length).toBe(200);

    const nativeFind = Array.prototype.find;
    let optionScans = 0;
    vi.spyOn(Array.prototype, 'find').mockImplementation(function (
      this: unknown[],
      ...args: Parameters<typeof nativeFind>
    ) {
      if (this.length > 0 && this[0] instanceof CngxOption) {
        optionScans++;
      }
      return nativeFind.apply(this, args);
    });

    listbox.ad.highlightByIndex(5);
    flush(fixture);
    vi.restoreAllMocks();

    expect(root.querySelectorAll('[data-hl="true"]').length).toBe(1);
    expect(optionScans).toBeLessThanOrEqual(2);
  });
});

const GROUPED_OPTIONS = [
  { label: 'First', children: OPTIONS.slice(0, 100) },
  { label: 'Second', children: OPTIONS.slice(100) },
];

@Component({
  template: `<cngx-select [label]="'Pick'" [options]="options" />`,
  imports: [CngxSelect],
})
class GroupedHost {
  readonly options = GROUPED_OPTIONS;
}

describe('CngxSelectPanel - CNGX2028 on open', () => {
  beforeEach(() => polyfillPopover());
  afterEach(() => vi.restoreAllMocks());

  function openGrouped(): unknown[][] {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(GroupedHost);
    flush(fixture);
    (fixture.debugElement.query(By.directive(CngxSelect)).componentInstance as CngxSelect<number>).open();
    flush(fixture);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.cngx-select__option').length).toBe(200);
    return warn.mock.calls.filter((c) => /^CNGX2028: /.test(String(c[0])));
  }

  it('does not warn on a grouped list without a virtualization config', () => {
    expect(openGrouped().length).toBe(0);
  });

  it('warns once on a grouped list under an explicit withVirtualization', () => {
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withVirtualization({ threshold: 200 }))],
    });
    expect(openGrouped().length).toBe(1);
  });
});
