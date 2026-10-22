import { Component, OutputEmitterRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxListbox } from '@cngx/common/interactive';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxComboboxTriggerLabel, CngxSelectAction } from '../shared/template-slots';
import { CngxSelectAnnouncer } from '../shared/announcer';
import { stripBidiIsolates } from '@cngx/testing';
import { describeCommitControllerCascade } from '../shared/__test-helpers/commit-controller-cascade';
import { createMockField } from '@cngx/forms/field/testing';
import { describeFieldSkinHost } from '../shared/__test-helpers/field-skin-host';
import { describeFieldAriaHost } from '../shared/__test-helpers/field-aria-host';
import { describeSelectBehaviourHost } from '../shared/__test-helpers/select-behaviour-host';
import { describeMobileSheet } from '../shared/__test-helpers/mobile-sheet';
import { stubTouchFloor } from '../shared/__test-helpers/touch-floor';
import {
  CngxActionMultiSelect,
  type CngxActionMultiSelectChange,
} from './action-multi-select.component';
import type { CngxSelectCreateAction } from '../shared/create-action.types';
import type { CngxSelectOptionDef, CngxSelectOptionsInput } from '../shared/option.model';

type Tag = { readonly id: string; readonly name: string };

const TAGS: CngxSelectOptionsInput<Tag> = [
  { value: { id: 't1', name: 'Design' }, label: 'Design' },
  { value: { id: 't2', name: 'Dev' }, label: 'Dev' },
  { value: { id: 't3', name: 'QA' }, label: 'QA' },
];

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: () => void;
  };
  if (proto.showPopover) {
    return;
  }
  proto.showPopover = function (this: HTMLElement): void {
    this.setAttribute('data-popover-shown', 'true');
    Object.defineProperty(this, 'matches', {
      value: (s: string) => s === ':popover-open',
      configurable: true,
    });
  };
  proto.hidePopover = function (this: HTMLElement): void {
    this.removeAttribute('data-popover-shown');
    Object.defineProperty(this, 'matches', {
      value: (_s: string) => false,
      configurable: true,
    });
  };
  proto.togglePopover = function (this: HTMLElement): void {
    if (this.getAttribute('data-popover-shown') === 'true') {
      proto.hidePopover!.call(this);
    } else {
      proto.showPopover!.call(this);
    }
  };
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
}

@Component({
  template: `
    <cngx-action-multi-select
      [label]="'Tag'"
      [options]="options()"
      [compareWith]="compareWith"
      [quickCreateAction]="quickCreateAction()"
      [closeOnCreate]="closeOnCreate()"
      [actionPosition]="actionPosition()"
      [(values)]="values"
      (selectionChange)="onChange($event)"
      (created)="onCreated($event)"
      (commitError)="onCommitError($event)"
      (stateChange)="onStateChange($event)"
    >
      <ng-template
        cngxSelectAction
        let-term
        let-commit="commit"
        let-pending="isPending"
        let-setDirty="setDirty"
      >
        <button
          type="button"
          class="action-button"
          [attr.data-term]="term"
          [attr.data-pending]="pending"
          (click)="commit()"
        >
          Create "{{ term }}"
        </button>
        <button
          type="button"
          class="mark-dirty"
          (click)="setDirty(true)"
        >
          dirty
        </button>
      </ng-template>
    </cngx-action-multi-select>
  `,
  imports: [CngxActionMultiSelect, CngxSelectAction],
})
class Host {
  readonly options = signal<CngxSelectOptionsInput<Tag>>(TAGS);
  readonly compareWith: (a: Tag | undefined, b: Tag | undefined) => boolean =
    (a, b) => (a?.id ?? null) === (b?.id ?? null);
  readonly quickCreateAction = signal<CngxSelectCreateAction<Tag> | null>(null);
  readonly closeOnCreate = signal(false);
  readonly actionPosition = signal<'top' | 'bottom' | 'both' | 'none'>('bottom');
  readonly values = signal<Tag[]>([]);
  readonly changeLog: CngxActionMultiSelectChange<Tag>[] = [];
  readonly createdLog: CngxSelectOptionDef<Tag>[] = [];
  readonly errorLog: unknown[] = [];
  readonly stateLog: string[] = [];

  onChange(ev: CngxActionMultiSelectChange<Tag>): void {
    this.changeLog.push(ev);
  }
  onCreated(opt: CngxSelectOptionDef<Tag>): void {
    this.createdLog.push(opt);
  }
  onCommitError(err: unknown): void {
    this.errorLog.push(err);
  }
  onStateChange(status: string): void {
    this.stateLog.push(status);
  }
}

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  host: Host;
  select: CngxActionMultiSelect<Tag>;
} {
  polyfillPopover();
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  flush(fixture);
  const selectDe = fixture.debugElement.query(By.directive(CngxActionMultiSelect));
  return {
    fixture,
    host: fixture.componentInstance,
    select: selectDe.componentInstance as CngxActionMultiSelect<Tag>,
  };
}

describe('CngxActionMultiSelect - surface + defaults', () => {
  it('renders the inline input with role=combobox and empty values by default', () => {
    const { select, fixture } = setup();
    const input = fixture.debugElement.nativeElement.querySelector('input');
    expect(input?.getAttribute('role')).toBe('combobox');
    expect(select.values()).toEqual([]);
    expect(select.empty()).toBe(true);
  });

  it("defaults closeOnCreate to false (multi-pick UX keeps panel open)", () => {
    const { select } = setup();
    expect(select.closeOnCreate()).toBe(false);
  });

  it('forwards actionPosition through the view-host contract', () => {
    const { fixture, host, select } = setup();
    expect(select.actionPosition()).toBe('bottom');
    host.actionPosition.set('top');
    flush(fixture);
    expect(select.actionPosition()).toBe('top');
  });

  it('clear emits action: clear with the previous values', () => {
    const { fixture, host, select } = setup();
    host.values.set([
      { id: 't1', name: 'Design' },
      { id: 't2', name: 'Dev' },
    ]);
    flush(fixture);
    type WithClearAll = { clearAllCallback: () => void };
    (select as unknown as WithClearAll).clearAllCallback();
    flush(fixture);
    expect(select.values()).toEqual([]);
    const last = host.changeLog[host.changeLog.length - 1];
    expect(last.action).toBe('clear');
    expect(last.removed.length).toBe(2);
    expect(last.added.length).toBe(0);
  });
});

describe('CngxActionMultiSelect - quick-create flow', () => {
  it('appends the new value to values[] on successful sync create', () => {
    const { fixture, host, select } = setup();
    host.values.set([{ id: 't1', name: 'Design' }]);
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.values()).toEqual([
      { id: 't1', name: 'Design' },
      { id: 'p', name: 'Purple' },
    ]);
    expect(host.createdLog).toEqual([
      { value: { id: 'p', name: 'Purple' }, label: 'Purple' },
    ]);
  });

  it("emits selectionChange with action: 'create' + added: [newValue]", () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    const last = host.changeLog[host.changeLog.length - 1];
    expect(last.action).toBe('create');
    expect(last.added).toEqual([{ id: 'p', name: 'Purple' }]);
    expect(last.removed).toEqual([]);
    expect(last.option?.label).toBe('Purple');
  });

  it("keeps the panel open after create when closeOnCreate=false (default)", () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.open();
    flush(fixture);
    expect(select.panelOpen()).toBe(true);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.panelOpen()).toBe(true);
    expect(select.values().length).toBe(1);
  });

  it("closes the panel on create when closeOnCreate=true", () => {
    const { fixture, host, select } = setup();
    host.closeOnCreate.set(true);
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.open();
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.panelOpen()).toBe(false);
  });

  it('two consecutive creates append both values', () => {
    const { fixture, host, select } = setup();
    let counter = 0;
    host.quickCreateAction.set((_t, d) => ({ id: 'id-' + ++counter, name: d.label }));
    flush(fixture);
    select.actionCallbacks().commit({ label: 'First' });
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Second' });
    flush(fixture);
    expect(select.values().map((v) => v.name)).toEqual(['First', 'Second']);
  });

  it('drops commit when draft label is empty (silent no-op)', () => {
    const { fixture, host, select } = setup();
    const spy = vi.fn<CngxSelectCreateAction<Tag>>(() => ({ id: 'x', name: 'x' }));
    host.quickCreateAction.set(spy);
    flush(fixture);
    select.actionCallbacks().commit({ label: '' });
    flush(fixture);
    expect(spy).not.toHaveBeenCalled();
    expect(select.values()).toEqual([]);
  });

  it('drops commit when quickCreateAction is null (no-op)', () => {
    const { fixture, select, host } = setup();
    expect(host.quickCreateAction()).toBeNull();
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.values()).toEqual([]);
  });

  it('local item persists across server refetch via mergeLocalItems', () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.values().some((v) => v.id === 'p')).toBe(true);
    // Server refetches WITHOUT Purple - selection persists because the
    // local buffer still holds it and the selected lookup resolves it.
    host.options.set([...TAGS]);
    flush(fixture);
    expect(select.selected().some((o) => o.label === 'Purple')).toBe(true);
  });
});

describe('CngxActionMultiSelect - async + error flow', () => {
  it('transitions stateChange pending → success over an Observable create', () => {
    const { fixture, host, select } = setup();
    const subject = new Subject<Tag>();
    host.quickCreateAction.set(() => subject);
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(host.stateLog).toEqual(['pending']);
    expect(select.isCommitting()).toBe(true);
    subject.next({ id: 'p', name: 'Purple' });
    subject.complete();
    flush(fixture);
    expect(host.stateLog).toEqual(['pending', 'success']);
    expect(select.values().map((v) => v.id)).toEqual(['p']);
  });

  it('announces a failed quick-create, marks the trigger invalid and describes it', () => {
    const { fixture, host, select } = setup();
    const announce = vi
      .spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce')
      .mockImplementation(() => undefined);
    host.quickCreateAction.set(() => {
      throw new Error('server down');
    });
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement;
    expect(announce.mock.calls.map(([m, p]) => [stripBidiIsolates(m), p])).toContainEqual([
      'Tag: Could not create Purple - server down',
      'assertive',
    ]);
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    const ref = trigger.getAttribute('aria-errormessage');
    expect(ref).not.toBeNull();
    expect(stripBidiIsolates(document.getElementById(ref!)?.textContent ?? '')).toContain(
      'Could not create Purple',
    );

    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-invalid')).toBeNull();
    expect(trigger.getAttribute('aria-errormessage')).toBeNull();
    announce.mockRestore();
  });

  it('clears a failed quick-create once the user picks an option instead', () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => {
      throw new Error('server down');
    });
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement;
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    const ref = trigger.getAttribute('aria-errormessage')!;
    expect(stripBidiIsolates(document.getElementById(ref)?.textContent ?? '')).toContain(
      'Could not create Purple',
    );

    select.open();
    flush(fixture);
    const lb = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxListbox);
    lb.ad.highlightFirst();
    lb.ad.activateCurrent();
    flush(fixture);
    fixture.detectChanges();
    expect(select.values().length).toBe(1);
    expect(trigger.getAttribute('aria-invalid')).toBeNull();
    expect(trigger.getAttribute('aria-errormessage')).toBeNull();
    expect(stripBidiIsolates(document.getElementById(ref)?.textContent ?? '')).not.toContain(
      'Could not create Purple',
    );
  });

  it('drops a quick-create that settles after the select is destroyed', () => {
    const { fixture, host, select } = setup();
    const subject = new Subject<Tag>();
    host.quickCreateAction.set(() => subject);
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    const before = select.values();
    const emit = vi.spyOn(OutputEmitterRef.prototype, 'emit');
    fixture.destroy();
    subject.next({ id: 'p', name: 'Purple' });
    subject.complete();
    // An emit on a destroyed OutputEmitterRef is what Angular reports as NG0953.
    const lateEmits = emit.mock.contexts.filter(
      (ref) => (ref as { readonly destroyed?: boolean }).destroyed === true,
    );
    emit.mockRestore();
    expect(lateEmits).toEqual([]);
    expect(host.createdLog).toEqual([]);
    expect(select.values()).toEqual(before);
  });

  it('surfaces errors via commitError output and leaves values untouched', () => {
    const { fixture, host, select } = setup();
    host.values.set([{ id: 't1', name: 'Design' }]);
    flush(fixture);
    const boom = new Error('server down');
    host.quickCreateAction.set(() => {
      throw boom;
    });
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(host.errorLog).toEqual([boom]);
    expect(select.values()).toEqual([{ id: 't1', name: 'Design' }]);
    expect(host.stateLog[host.stateLog.length - 1]).toBe('error');
  });

  it('commitState surfaces quick-create pending and error through the merged view', () => {
    const { fixture, host, select } = setup();
    const subject = new Subject<Tag>();
    host.quickCreateAction.set(() => subject);
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    // Create runs on the dedicated controller; CNGX_STATEFUL consumers of
    // commitState still see it pending - status counterpart of isCommitting.
    expect(select.commitState.isPending()).toBe(true);
    const boom = new Error('server down');
    subject.error(boom);
    flush(fixture);
    expect(select.commitState.status()).toBe('error');
    expect(select.commitState.error()).toBe(boom);
  });
});

describe('CngxActionMultiSelect - dismiss guard', () => {
  it('blocks click-outside while actionDirty() is true', () => {
    const { fixture, select } = setup();
    select.open();
    flush(fixture);
    expect(select.panelOpen()).toBe(true);
    select.actionCallbacks().setDirty(true);
    flush(fixture);
    type WithGuard = { handleClickOutside(): void };
    (select as unknown as WithGuard).handleClickOutside();
    flush(fixture);
    expect(select.panelOpen()).toBe(true);
  });

  it('cancel() resets dirty', () => {
    const { fixture, select } = setup();
    select.actionCallbacks().setDirty(true);
    flush(fixture);
    expect(select.actionDirty()).toBe(true);
    select.actionCallbacks().cancel();
    flush(fixture);
    expect(select.actionDirty()).toBe(false);
  });

  it('dirty auto-resets after a successful create', () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.actionCallbacks().setDirty(true);
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.actionDirty()).toBe(false);
  });
});

// ── Summary trigger under the touch floor ────────────────────────────

@Component({
  template: `
    <cngx-action-multi-select [label]="'Letters'" [options]="options" [(values)]="values">
      @if (withTriggerLabel()) {
        <ng-template cngxComboboxTriggerLabel let-count="count">
          <span class="trigger-summary">{{ count }} letters</span>
        </ng-template>
      }
    </cngx-action-multi-select>
  `,
  imports: [CngxActionMultiSelect, CngxComboboxTriggerLabel],
})
class SummaryHost {
  readonly options: CngxSelectOptionDef<string>[] = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
  ];
  readonly values = signal<string[]>(['a', 'b', 'c']);
  readonly withTriggerLabel = signal(false);
}

describe('CngxActionMultiSelect - summary trigger under the touch floor', () => {
  let restore: (() => void) | null = null;

  afterEach(() => {
    restore?.();
    restore = null;
  });

  function render(touch: boolean) {
    polyfillPopover();
    if (touch) {
      restore = stubTouchFloor();
    }
    const fixture = TestBed.createComponent(SummaryHost);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input[role="combobox"]') as HTMLInputElement;
    return { fixture, el, input };
  }

  function describedText(el: HTMLElement, input: HTMLInputElement): string[] {
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    return ids.map((id) =>
      stripBidiIsolates(el.querySelector(`[id="${id}"]`)?.textContent?.trim() ?? ''),
    );
  }

  it('shows the first label plus the +N badge in front of the input instead of chips', () => {
    const { el } = render(true);
    expect(el.querySelectorAll('cngx-chip').length).toBe(0);
    const strip = el.querySelector('.cngx-select__chip-list');
    expect(strip?.getAttribute('data-overflow')).toBe('truncate');
    expect(strip?.querySelector('.cngx-select-summary__label')?.textContent?.trim()).toBe('A');
    expect(el.querySelector('.cngx-select__chip-overflow-badge')?.textContent?.trim()).toBe('+2');
    expect(strip?.nextElementSibling?.getAttribute('role')).toBe('combobox');
  });

  it('describes the input with the whole selection, not the group', () => {
    const { el, input } = render(true);
    expect(el.querySelector('cngx-select-summary .cngx-sr-only')).toBeNull();
    expect(describedText(el, input)).toEqual(['3 selected: A, B, and C']);
  });

  it('references the description only while the summary shows a selection', () => {
    const { fixture, el, input } = render(true);
    fixture.componentInstance.values.set(['b']);
    flush(fixture);
    expect(describedText(el, input)).toEqual(['B']);
    fixture.componentInstance.values.set([]);
    flush(fixture);
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(el.querySelector('cngx-select-summary')).toBeNull();
  });

  it('removes and announces the last value on Backspace in an empty input', () => {
    const { fixture, input } = render(true);
    const announce = vi.spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce');
    input.focus();
    flush(fixture);
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['a', 'b']);
    expect(announce).toHaveBeenCalled();
  });

  it('lets a projected trigger-label template win over the summary', () => {
    const { fixture, el, input } = render(true);
    fixture.componentInstance.withTriggerLabel.set(true);
    flush(fixture);
    expect(el.querySelector('cngx-select-summary')).toBeNull();
    expect(el.querySelector('.trigger-summary')?.textContent?.trim()).toBe('3 letters');
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });

  it('keeps the chips and no summary description on a fine pointer', () => {
    const { el, input } = render(false);
    expect(el.querySelector('cngx-select-summary')).toBeNull();
    expect(el.querySelectorAll('cngx-chip').length).toBe(3);
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });
});

describeCommitControllerCascade('CngxActionMultiSelect');

describeFieldSkinHost('CngxActionMultiSelect', CngxActionMultiSelect, 'cngx-action-multi-select', () =>
  createMockField({ name: 'pick' }).accessor,
);

describeFieldAriaHost('CngxActionMultiSelect', CngxActionMultiSelect, 'cngx-action-multi-select', {
  ctx: () => ({
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  }),
  inputs: '[options]="ctx[\'options\']"',
  initial: [],
  userWrite: (cmp) => (cmp as CngxActionMultiSelect<string>).values.set(['a']),
});

describeMobileSheet('CngxActionMultiSelect', CngxActionMultiSelect, 'cngx-action-multi-select', {
  inputs: '[options]="options"',
  optionSelector: '[cngxOption]',
  fill: 'fullscreen',
  showDone: true,
  showInput: true,
  makeField: () => {
    const { accessor, ref } = createMockField<string[]>({ name: 'pick', value: [] });
    return { accessor, touched: () => ref.touched() };
  },
});

describeSelectBehaviourHost('CngxActionMultiSelect', CngxActionMultiSelect, 'cngx-action-multi-select', {
  inputs: '[options]="options"',
  optionSelector: '[cngxOption]',
  readValue: (cmp) => (cmp as { values: () => unknown }).values(),
});

// ── chipOverflow 'truncate' on a fine pointer: hidden values stay reachable ──

const TRUNCATE_OPTIONS = ['A', 'B', 'C', 'D', 'E'].map((label) => ({
  value: label.toLowerCase(),
  label,
}));

@Component({
  template: `
    <cngx-action-multi-select
      [label]="'Letters'"
      [options]="options"
      [(values)]="values"
      chipOverflow="truncate"
      [maxVisibleChips]="3"
    />
  `,
  imports: [CngxActionMultiSelect],
})
class TruncateHost {
  readonly options = TRUNCATE_OPTIONS;
  readonly values = signal<string[]>(['a', 'b', 'c', 'd', 'e']);
}

describe('CngxActionMultiSelect - truncated chips stay reachable for AT', () => {
  function describedTexts(el: HTMLElement): string[] {
    const input = el.querySelector('input[role="combobox"]')!;
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    return ids.map((id) =>
      stripBidiIsolates(el.querySelector(`[id="${id}"]`)?.textContent?.trim() ?? ''),
    );
  }

  it('describes the input with the whole selection while the +N badge hides values', () => {
    const fixture = TestBed.createComponent(TruncateHost);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('cngx-chip').length).toBe(3);
    expect(el.querySelector('.cngx-select__chip-overflow-badge')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(describedTexts(el)).toContain('5 selected: A, B, C, D, and E');
  });

  it('drops the description once nothing is hidden', () => {
    const fixture = TestBed.createComponent(TruncateHost);
    fixture.componentInstance.values.set(['a', 'b']);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    expect(describedTexts(el).some((t) => t.includes('selected:'))).toBe(false);
  });
});
