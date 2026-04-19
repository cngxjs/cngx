import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { Subject, type Observable } from 'rxjs';

import { CngxListbox } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { CNGX_STATEFUL } from '@cngx/core/utils';

import { CngxFormField } from '@cngx/forms/field';

import { CngxMultiSelect, type CngxMultiSelectChange } from './multi-select.component';
import type { CngxSelectOptionDef } from '../shared/option.model';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from '../shared/commit-action.types';
import {
  CngxMultiSelectChip,
  CngxMultiSelectTriggerLabel,
  CngxSelectClearButton,
  CngxSelectOptionError,
  CngxSelectOptionPending,
} from '../shared/template-slots';
import { CngxSelectAnnouncer } from '../shared/announcer';
import { createMockField, type MockFieldRef } from '../../../../field/src/testing/mock-field';

// jsdom has no Popover API — polyfill so CngxPopover can toggle.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: (force?: boolean) => boolean;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.dispatchEvent(new Event('beforetoggle', { bubbles: false }));
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.togglePopover = function (this: HTMLElement) {
      if (this.hasAttribute('data-popover-open')) {
        (this as HTMLElement & { hidePopover: () => void }).hidePopover();
        return false;
      }
      (this as HTMLElement & { showPopover: () => void }).showPopover();
      return true;
    };
  }
}

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Rot' },
  { value: 'green', label: 'Grün' },
  { value: 'blue', label: 'Blau', disabled: true },
];

@Component({
  template: `
    <cngx-multi-select
      [label]="'Farbe'"
      [options]="options"
      [placeholder]="placeholder"
      [clearable]="clearable"
      [(values)]="values"
      (selectionChange)="lastChange.set($event)"
      (openedChange)="openedLog.set($event)"
    />
  `,
  imports: [CngxMultiSelect],
})
class Host {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
  readonly placeholder = 'Bitte wählen';
  clearable = false;
  readonly lastChange = signal<CngxMultiSelectChange<string> | null>(null);
  readonly openedLog = signal<boolean | null>(null);
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

beforeEach(() => {
  polyfillPopover();
});

describe('CngxMultiSelect — skeleton', () => {
  it('renders the placeholder when no value is selected', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const placeholder: HTMLElement | null = fixture.nativeElement.querySelector(
      '.cngx-multi-select__placeholder',
    );
    expect(placeholder).not.toBeNull();
    expect(placeholder!.textContent!.trim()).toBe('Bitte wählen');
  });

  it('sets aria-multiselectable on the inner listbox', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    // Open the panel so the listbox is rendered.
    fixture.componentInstance.values.set([]);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.click();
    flush(fixture);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox));
    expect(listbox.nativeElement.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('renders a chip per selected value with a remove button', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const chips: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('cngx-chip'),
    );
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('Rot');
    expect(chips[1].textContent).toContain('Grün');
    const removes = fixture.nativeElement.querySelectorAll('.cngx-chip__remove');
    expect(removes.length).toBe(2);
  });

  it('removes a value when its chip × is clicked', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const firstRemove: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-chip__remove',
    );
    firstRemove.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['green']);
    const change = fixture.componentInstance.lastChange();
    expect(change).not.toBeNull();
    expect(change!.action).toBe('toggle');
    expect(change!.removed).toEqual(['red']);
  });

  it('renders a clear-all button only when clearable and not empty', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.clearable = true;
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const clear: HTMLElement | null = fixture.nativeElement.querySelector(
      '.cngx-multi-select__clear-all',
    );
    expect(clear).not.toBeNull();
  });

  it('clear-all empties values and emits a clear-action selectionChange', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.clearable = true;
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const clear: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__clear-all',
    );
    clear.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual([]);
    const change = fixture.componentInstance.lastChange();
    expect(change!.action).toBe('clear');
    expect(change!.removed).toEqual(['red', 'green']);
    expect(change!.values).toEqual([]);
  });

  it('mirrors programmatic values writes into the inner listbox', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.click();
    flush(fixture);
    const listbox = fixture.debugElement
      .query(By.directive(CngxListbox))
      .injector.get(CngxListbox);
    expect(listbox.selectedValues()).toEqual(['red']);
  });

  it('opens and closes the panel via toggle()', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect))
      .componentInstance as CngxMultiSelect<string>;
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    multi.open();
    flush(fixture);
    expect(popover.isVisible()).toBe(true);
    multi.close();
    flush(fixture);
    expect(popover.isVisible()).toBe(false);
  });

  it('keyboard: Escape closes the panel', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect))
      .componentInstance as CngxMultiSelect<string>;
    multi.open();
    flush(fixture);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flush(fixture);
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    expect(popover.isVisible()).toBe(false);
  });

  it('isSelected returns correct membership per option', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect))
      .componentInstance as CngxMultiSelect<string> & {
      isSelected: (opt: CngxSelectOptionDef<string>) => boolean;
    };
    expect(multi.isSelected(OPTIONS[0])).toBe(true); // red
    expect(multi.isSelected(OPTIONS[1])).toBe(false); // green
  });

  it('clicking a disabled option does not toggle the value', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.click();
    flush(fixture);
    // Third option (index 2) is 'blue' with disabled: true.
    const options = fixture.nativeElement.querySelectorAll('[cngxOption]');
    (options[2] as HTMLElement).click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual([]);
  });

  it('typeahead-while-closed toggles the matched option without opening the panel', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['red']);
    // Panel remained closed — aria-expanded is false.
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // Second press of 'r' toggles it back off.
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual([]);
  });

  it('PageDown from closed opens the panel and highlights an enabled option', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }),
    );
    flush(fixture);
    const lb = fixture.debugElement
      .query(By.directive(CngxListbox))
      .injector.get(CngxListbox);
    const options = lb.options();
    const activeId = lb.ad.activeId();
    const active = options.find((o) => o.id === activeId);
    expect(active).toBeDefined();
    expect(active!.disabled()).toBe(false);
  });
});

// ── [commitAction] per-toggle + supersede ─────────────────────────────

@Component({
  selector: 'multi-commit-host',
  template: `
    <cngx-multi-select
      [label]="'Farben'"
      [options]="options"
      [clearable]="true"
      [commitAction]="commitAction"
      [commitMode]="mode()"
      [(values)]="values"
      (commitError)="errors.push($event)"
      (stateChange)="statuses.push($event)"
      (selectionChange)="changes.push($event)"
      (optionToggled)="toggles.push($event)"
    />
  `,
  imports: [CngxMultiSelect],
})
class MultiCommitHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
  readonly mode = signal<CngxSelectCommitMode>('optimistic');
  readonly errors: unknown[] = [];
  readonly statuses: string[] = [];
  readonly changes: CngxMultiSelectChange<string>[] = [];
  readonly toggles: { option: CngxSelectOptionDef<string>; added: boolean }[] = [];
  pending: Subject<string[] | undefined> | null = null;
  commitCallCount = 0;
  readonly commitAction: CngxSelectCommitAction<string[]> = (intended) => {
    this.commitCallCount += 1;
    const subject = new Subject<string[] | undefined>();
    this.pending = subject;
    void intended;
    return subject.asObservable() as Observable<string[] | undefined>;
  };
}

describe('CngxMultiSelect — commit action producer', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [MultiCommitHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<MultiCommitHost>>;
    multi: CngxMultiSelect<string>;
    host: MultiCommitHost;
    triggerBtn: HTMLButtonElement;
    optionAt: (idx: number) => HTMLElement;
  } {
    const fixture = TestBed.createComponent(MultiCommitHost);
    fixture.detectChanges();
    flush(fixture);
    const multiDe = fixture.debugElement.query(By.directive(CngxMultiSelect));
    return {
      fixture,
      multi: multiDe.componentInstance as CngxMultiSelect<string>,
      host: fixture.componentInstance,
      triggerBtn: multiDe.nativeElement.querySelector(
        'button.cngx-multi-select__trigger',
      ) as HTMLButtonElement,
      optionAt: (idx) => {
        const options = multiDe.nativeElement.querySelectorAll('[cngxOption]');
        return options[idx] as HTMLElement;
      },
    };
  }

  it('optimistic success: values updated immediately, selectionChange emits on success', () => {
    const { fixture, host, triggerBtn, optionAt } = setup();

    triggerBtn.click();
    flush(fixture);
    optionAt(0).click(); // red
    flush(fixture);

    // Optimistic: values already reflects the intended next-array,
    // but selectionChange fires only after commit success.
    expect(host.values()).toEqual(['red']);
    expect(host.changes).toEqual([]);
    expect(host.statuses[host.statuses.length - 1]).toBe('pending');

    host.pending!.next(['red']);
    host.pending!.complete();
    flush(fixture);

    expect(host.values()).toEqual(['red']);
    expect(host.changes.length).toBe(1);
    expect(host.changes[0].added).toEqual(['red']);
    expect(host.changes[0].action).toBe('toggle');
    expect(host.statuses[host.statuses.length - 1]).toBe('success');
  });

  it('optimistic error: values roll back to previous, commitError fires', () => {
    const { fixture, host, triggerBtn, optionAt } = setup();

    triggerBtn.click();
    flush(fixture);
    optionAt(0).click(); // red
    flush(fixture);

    expect(host.values()).toEqual(['red']);

    const err = new Error('server down');
    host.pending!.error(err);
    flush(fixture);

    expect(host.values()).toEqual([]);
    expect(host.errors).toEqual([err]);
    expect(host.statuses[host.statuses.length - 1]).toBe('error');
  });

  it('pessimistic: panel stays open, togglingOption drives per-row spinner, values deferred', () => {
    const { fixture, host, multi, triggerBtn, optionAt } = setup();
    host.mode.set('pessimistic');
    flush(fixture);

    triggerBtn.click();
    flush(fixture);
    optionAt(0).click();
    flush(fixture);

    expect(multi.panelOpen()).toBe(true);
    expect(host.values()).toEqual([]); // deferred
    expect(multi.isCommitting()).toBe(true);

    host.pending!.next(['red']);
    host.pending!.complete();
    flush(fixture);

    // Panel stays open in multi on success (unlike single).
    expect(multi.panelOpen()).toBe(true);
    expect(host.values()).toEqual(['red']);
    expect(multi.isCommitting()).toBe(false);
    expect(host.changes.length).toBe(1);
    expect(host.changes[0].action).toBe('toggle');
  });

  it('pessimistic error: values stay at previous (no rollback needed), panel remains open', () => {
    const { fixture, host, multi, triggerBtn, optionAt } = setup();
    host.mode.set('pessimistic');
    flush(fixture);

    triggerBtn.click();
    flush(fixture);
    optionAt(0).click();
    flush(fixture);

    expect(host.values()).toEqual([]);

    host.pending!.error(new Error('nope'));
    flush(fixture);

    // Pessimistic never wrote in the first place — values unchanged.
    expect(host.values()).toEqual([]);
    expect(multi.panelOpen()).toBe(true);
    expect(host.statuses[host.statuses.length - 1]).toBe('error');
  });

  it('supersede: a second toggle while the first is pending aborts the first', () => {
    const { fixture, host, triggerBtn, optionAt } = setup();

    triggerBtn.click();
    flush(fixture);
    optionAt(0).click(); // red — pending 1
    flush(fixture);
    const firstPending = host.pending!;
    const firstCount = host.commitCallCount;

    // Second toggle while first is still pending (panel stays open in multi).
    optionAt(1).click(); // green — pending 2, supersedes
    flush(fixture);
    expect(host.commitCallCount).toBeGreaterThan(firstCount);

    // Late resolve of the first pending must be ignored.
    const changesBefore = host.changes.length;
    const statusesBefore = [...host.statuses];
    firstPending.next(['red']);
    firstPending.complete();
    flush(fixture);
    expect(host.changes.length).toBe(changesBefore);
    expect(host.statuses).toEqual(statusesBefore);
  });

  it('provides CNGX_STATEFUL that resolves to commitState', () => {
    const { fixture, multi } = setup();
    const stateful = fixture.debugElement
      .query(By.directive(CngxMultiSelect))
      .injector.get(CNGX_STATEFUL);
    expect(stateful.state).toBe(multi.commitState);
  });

  it('chip-remove optimistic rollback: chip × on failing commit restores value', () => {
    const { fixture, host } = setup();
    host.values.set(['red', 'green']);
    flush(fixture);

    const firstRemove: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-chip__remove',
    );
    firstRemove.click();
    flush(fixture);

    // Optimistic: values already reflect removal.
    expect(host.values()).toEqual(['green']);

    host.pending!.error(new Error('retry'));
    flush(fixture);

    expect(host.values()).toEqual(['red', 'green']);
    expect(host.errors.length).toBe(1);
  });

  it('clear-all optimistic success: values empty stays and selectionChange fires action=clear', () => {
    const { fixture, host } = setup();
    host.values.set(['red', 'green']);
    flush(fixture);

    const clear: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__clear-all',
    );
    clear.click();
    flush(fixture);

    expect(host.values()).toEqual([]);
    expect(host.statuses[host.statuses.length - 1]).toBe('pending');

    host.pending!.next([]);
    host.pending!.complete();
    flush(fixture);

    expect(host.values()).toEqual([]);
    const clearChange = host.changes.find((c) => c.action === 'clear');
    expect(clearChange).toBeDefined();
    expect(clearChange!.removed).toEqual(['red', 'green']);
  });

  it('clear-all optimistic error: values roll back to previous selection', () => {
    const { fixture, host } = setup();
    host.values.set(['red', 'green']);
    flush(fixture);

    const clear: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__clear-all',
    );
    clear.click();
    flush(fixture);
    expect(host.values()).toEqual([]);

    host.pending!.error(new Error('nope'));
    flush(fixture);

    expect(host.values()).toEqual(['red', 'green']);
  });
});

// ── Chip template override + announcer formatter ──────────────────────

@Component({
  template: `
    <cngx-multi-select [label]="'Farben'" [options]="options" [(values)]="values">
      <ng-template cngxMultiSelectChip let-opt let-remove="remove">
        <span class="my-tag">
          <span class="my-tag__label">{{ opt.label }}</span>
          <button type="button" class="my-tag__close" (click)="remove()">×</button>
        </span>
      </ng-template>
    </cngx-multi-select>
  `,
  imports: [CngxMultiSelect, CngxMultiSelectChip],
})
class ChipTemplateHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green']);
}

describe('CngxMultiSelect — chip template + announcer', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  it('renders chip template override instead of the default pill', () => {
    const fixture = TestBed.createComponent(ChipTemplateHost);
    flush(fixture);
    const defaults = fixture.nativeElement.querySelectorAll('cngx-chip');
    const customs = fixture.nativeElement.querySelectorAll('.my-tag');
    expect(defaults.length).toBe(0);
    expect(customs.length).toBe(2);
    expect(customs[0].textContent).toContain('Rot');
  });

  it('chip template remove() callback removes the value', () => {
    const fixture = TestBed.createComponent(ChipTemplateHost);
    flush(fixture);
    const firstClose: HTMLButtonElement =
      fixture.nativeElement.querySelector('.my-tag__close');
    firstClose.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['green']);
  });

  it('announcer default formatter receives action + count for multi-toggles', () => {
    const announcer = TestBed.inject(CngxSelectAnnouncer);
    const captured: string[] = [];
    const originalAnnounce = announcer.announce.bind(announcer);
    announcer.announce = (message: string, politeness?: 'polite' | 'assertive'): void => {
      captured.push(message);
      void politeness;
    };

    try {
      const fixture = TestBed.createComponent(Host);
      flush(fixture);
      fixture.componentInstance.values.set(['red']);
      flush(fixture);

      // Click the chip × to trigger the removal path which invokes the announcer.
      const firstRemove: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.cngx-chip__remove',
      );
      firstRemove.click();
      flush(fixture);

      const msg = captured[captured.length - 1];
      expect(msg).toContain('Rot');
      expect(msg).toContain('entfernt');
      expect(msg).toContain('0 ausgewählt');
    } finally {
      announcer.announce = originalAnnounce;
    }
  });
});

// ── *cngxMultiSelectTriggerLabel (text-vs-chip switch) ───────────────

@Component({
  template: `
    <cngx-multi-select
      [label]="'Themen'"
      [options]="options"
      [(values)]="values"
    >
      <ng-template cngxMultiSelectTriggerLabel let-opts let-count="count">
        <span class="trigger-summary">{{ count }} ausgewählt: {{ opts.length }} items</span>
      </ng-template>
    </cngx-multi-select>
  `,
  imports: [CngxMultiSelect, CngxMultiSelectTriggerLabel],
})
class TriggerLabelHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green']);
}

describe('CngxMultiSelect — trigger label slot', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  it('renders the trigger-label template instead of the default chip strip', () => {
    const fixture = TestBed.createComponent(TriggerLabelHost);
    flush(fixture);
    // Chip molecules are gone — summary span replaces them.
    expect(fixture.nativeElement.querySelectorAll('cngx-chip').length).toBe(0);
    const summary: HTMLElement = fixture.nativeElement.querySelector('.trigger-summary');
    expect(summary).not.toBeNull();
    expect(summary.textContent).toContain('2 ausgewählt');
    expect(summary.textContent).toContain('2 items');
  });

  it('falls back to the placeholder when the selection is empty, even with a trigger-label projected', () => {
    const fixture = TestBed.createComponent(TriggerLabelHost);
    fixture.componentInstance.values.set([]);
    flush(fixture);
    // Empty-state placeholder wins over the trigger-label template so
    // consumers don't have to branch on count=0 inside their template.
    expect(fixture.nativeElement.querySelector('.trigger-summary')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.cngx-multi-select__placeholder'),
    ).not.toBeNull();
  });
});

// ── Clear-button / option-pending / option-error slots ──────────────

@Component({
  template: `
    <cngx-multi-select
      [label]="'Themen'"
      [options]="options"
      [clearable]="true"
      [(values)]="values"
    >
      <ng-template cngxSelectClearButton let-clear let-disabled="disabled">
        <button type="button" class="custom-clear" [disabled]="disabled" (click)="clear()">
          CLEAR
        </button>
      </ng-template>
    </cngx-multi-select>
  `,
  imports: [CngxMultiSelect, CngxSelectClearButton],
})
class ClearButtonHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green']);
}

describe('CngxMultiSelect — clear-button / option-pending / option-error slots', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  it('clear-button slot replaces the default ✕ and routes clear() through commit-aware path', () => {
    const fixture = TestBed.createComponent(ClearButtonHost);
    flush(fixture);
    // Default button is gone; consumer markup took over.
    expect(fixture.nativeElement.querySelector('.cngx-multi-select__clear-all')).toBeNull();
    const custom: HTMLButtonElement = fixture.nativeElement.querySelector('.custom-clear');
    expect(custom).not.toBeNull();
    custom.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual([]);
  });

  it('option-pending slot replaces the default spinner glyph during a commit', async () => {
    @Component({
      template: `
        <cngx-multi-select
          [label]="'Tags'"
          [options]="options"
          [(values)]="values"
          [commitAction]="commitAction"
          commitMode="pessimistic"
        >
          <ng-template cngxSelectOptionPending let-opt>
            <span class="custom-spinner">loading: {{ opt.label }}</span>
          </ng-template>
        </cngx-multi-select>
      `,
      imports: [CngxMultiSelect, CngxSelectOptionPending],
    })
    class Host2 {
      readonly options = OPTIONS;
      readonly values = signal<string[]>([]);
      pending: Subject<string[] | undefined> | null = null;
      readonly commitAction: CngxSelectCommitAction<string[]> = () => {
        const s = new Subject<string[] | undefined>();
        this.pending = s;
        return s.asObservable() as Observable<string[] | undefined>;
      };
    }
    TestBed.configureTestingModule({ imports: [Host2] });
    const fixture = TestBed.createComponent(Host2);
    fixture.detectChanges();
    flush(fixture);
    // Open + click first option — pessimistic commit, spinner slot shows.
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.click();
    flush(fixture);
    const options = fixture.nativeElement.querySelectorAll('[cngxOption]');
    (options[0] as HTMLElement).click();
    flush(fixture);
    const customSpinner: HTMLElement | null = fixture.nativeElement.querySelector(
      '.custom-spinner',
    );
    expect(customSpinner).not.toBeNull();
    expect(customSpinner!.textContent).toContain('loading: Rot');
    // Default spinner glyph gone.
    expect(fixture.nativeElement.querySelector('.cngx-select__option-spinner')).toBeNull();
  });

  it('option-error slot replaces the default ! glyph on commit error with inline display', () => {
    @Component({
      template: `
        <cngx-multi-select
          [label]="'Tags'"
          [options]="options"
          [(values)]="values"
          [commitAction]="commitAction"
          commitMode="optimistic"
          commitErrorDisplay="inline"
        >
          <ng-template cngxSelectOptionError let-opt let-err="error">
            <span class="custom-error">{{ opt.label }}: {{ err.message }}</span>
          </ng-template>
        </cngx-multi-select>
      `,
      imports: [CngxMultiSelect, CngxSelectOptionError],
    })
    class Host3 {
      readonly options = OPTIONS;
      readonly values = signal<string[]>([]);
      pending: Subject<string[] | undefined> | null = null;
      readonly commitAction: CngxSelectCommitAction<string[]> = () => {
        const s = new Subject<string[] | undefined>();
        this.pending = s;
        return s.asObservable() as Observable<string[] | undefined>;
      };
    }
    TestBed.configureTestingModule({ imports: [Host3] });
    const fixture = TestBed.createComponent(Host3);
    fixture.detectChanges();
    flush(fixture);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.click();
    flush(fixture);
    const options = fixture.nativeElement.querySelectorAll('[cngxOption]');
    (options[0] as HTMLElement).click();
    flush(fixture);
    // Optimistic wrote 'red'. Commit errors — inline error glyph shows on the selected row.
    fixture.componentInstance.pending!.error(new Error('nope'));
    flush(fixture);
    // Values rolled back, but commitErrorDisplay='inline' + showCommitError triggers the slot
    // only when isSelected(opt) is true. Rollback empties values, so inline glyph won't render.
    // Re-select to reproduce the isSelected=true + error condition:
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const customError: HTMLElement | null = fixture.nativeElement.querySelector('.custom-error');
    expect(customError).not.toBeNull();
    expect(customError!.textContent).toContain('Rot');
    expect(customError!.textContent).toContain('nope');
    expect(fixture.nativeElement.querySelector('.cngx-select__option-error')).toBeNull();
  });
});

// ── FormField integration ─────────────────────────────────────────────

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-multi-select [label]="'Farben'" [options]="options" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxMultiSelect],
})
class MultiFormFieldHost {
  readonly options = OPTIONS;
  readonly _mock = createMockField<string[]>({
    name: 'colors',
    value: ['red'],
  });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string[]> = this._mock.ref;
}

describe('CngxMultiSelect — form-field integration', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [MultiFormFieldHost] });
  });

  it('syncs initial field value into the multi-select', () => {
    const fixture = TestBed.createComponent(MultiFormFieldHost);
    fixture.detectChanges();
    flush(fixture);
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect))
      .componentInstance as CngxMultiSelect<string>;
    expect(multi.values()).toEqual(['red']);
  });

  it('external field mutation reflects in the multi-select', () => {
    const fixture = TestBed.createComponent(MultiFormFieldHost);
    fixture.detectChanges();
    flush(fixture);
    fixture.componentInstance.ref.value.set(['red', 'green']);
    flush(fixture);
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect))
      .componentInstance as CngxMultiSelect<string>;
    expect(multi.values()).toEqual(['red', 'green']);
  });

  it('internal toggle pushes into the field', () => {
    const fixture = TestBed.createComponent(MultiFormFieldHost);
    fixture.detectChanges();
    flush(fixture);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.click();
    flush(fixture);
    const options = fixture.nativeElement.querySelectorAll('[cngxOption]');
    // Second option = 'green' — toggles ON (not yet in [red]).
    (options[1] as HTMLElement).click();
    flush(fixture);
    expect(fixture.componentInstance.ref.value()).toEqual(['red', 'green']);
  });
});

