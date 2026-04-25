import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CngxSelectAction } from '../shared/template-slots';
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

describe('CngxActionMultiSelect — surface + defaults', () => {
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

describe('CngxActionMultiSelect — quick-create flow', () => {
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
    // Server refetches WITHOUT Purple — selection persists because the
    // local buffer still holds it and the selected lookup resolves it.
    host.options.set([...TAGS]);
    flush(fixture);
    expect(select.selected().some((o) => o.label === 'Purple')).toBe(true);
  });
});

describe('CngxActionMultiSelect — async + error flow', () => {
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
});

describe('CngxActionMultiSelect — dismiss guard', () => {
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
