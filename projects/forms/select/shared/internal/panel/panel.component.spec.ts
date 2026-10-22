import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxListbox, CngxOption } from '@cngx/common/interactive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxSelect } from '../../../single-select/select.component';
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
    TestBed.configureTestingModule({ imports: [LabelSlotHost] });
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
