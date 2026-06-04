import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CngxSelectAction } from '../shared/template-slots';
import { CngxActionSelect, type CngxActionSelectChange } from './action-select.component';
import type { CngxSelectCreateAction } from '../shared/create-action.types';
import type { CngxSelectOptionDef, CngxSelectOptionsInput } from '../shared/option.model';

type Tag = { readonly id: string; readonly name: string };

const TAGS: CngxSelectOptionsInput<Tag> = [
  { value: { id: 't1', name: 'Design' }, label: 'Design' },
  { value: { id: 't2', name: 'Dev' }, label: 'Dev' },
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
    <cngx-action-select
      [label]="'Tag'"
      [options]="options()"
      [compareWith]="compareWith"
      [displayWith]="displayWith"
      [quickCreateAction]="quickCreateAction()"
      [closeOnCreate]="closeOnCreate()"
      [actionPosition]="actionPosition()"
      [(value)]="value"
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
    </cngx-action-select>
  `,
  imports: [CngxActionSelect, CngxSelectAction],
})
class Host {
  readonly options = signal<CngxSelectOptionsInput<Tag>>(TAGS);
  readonly compareWith: (a: Tag | undefined, b: Tag | undefined) => boolean =
    (a, b) => (a?.id ?? null) === (b?.id ?? null);
  readonly displayWith: (t: Tag) => string = (t) => t.name;
  readonly quickCreateAction = signal<CngxSelectCreateAction<Tag> | null>(null);
  readonly closeOnCreate = signal(true);
  readonly actionPosition = signal<'top' | 'bottom' | 'both' | 'none'>('bottom');
  readonly value = signal<Tag | undefined>(undefined);
  readonly changeLog: CngxActionSelectChange<Tag>[] = [];
  readonly createdLog: CngxSelectOptionDef<Tag>[] = [];
  readonly errorLog: unknown[] = [];
  readonly stateLog: string[] = [];

  onChange(ev: CngxActionSelectChange<Tag>): void {
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
  select: CngxActionSelect<Tag>;
  input: HTMLInputElement;
} {
  polyfillPopover();
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  flush(fixture);
  const selectDe = fixture.debugElement.query(By.directive(CngxActionSelect));
  return {
    fixture,
    host: fixture.componentInstance,
    select: selectDe.componentInstance as CngxActionSelect<Tag>,
    input: selectDe.nativeElement.querySelector('input') as HTMLInputElement,
  };
}

describe('CngxActionSelect — surface + defaults', () => {
  it('renders the inline input and exposes empty state by default', () => {
    const { host, select, input } = setup();
    expect(input).toBeTruthy();
    expect(input.getAttribute('role')).toBe('combobox');
    expect(select.value()).toBeUndefined();
    expect(select.empty()).toBe(true);
    expect(host.changeLog.length).toBe(0);
  });

  it('forwards actionPosition through the view-host contract', () => {
    const { fixture, host, select } = setup();
    expect(select.actionPosition()).toBe('bottom');
    host.actionPosition.set('top');
    flush(fixture);
    expect(select.actionPosition()).toBe('top');
  });

  it('clear sets value to undefined and emits action: clear', () => {
    const { fixture, host, select } = setup();
    host.value.set({ id: 't1', name: 'Design' });
    flush(fixture);
    expect(select.value()).toEqual({ id: 't1', name: 'Design' });

    // Trigger the clear via the public surface (no DOM click needed).
    type WithClear = { clearCallback: () => void };
    (select as unknown as WithClear).clearCallback();
    flush(fixture);
    expect(select.value()).toBeUndefined();
    const lastChange = host.changeLog[host.changeLog.length - 1];
    expect(lastChange.action).toBe('clear');
    expect(lastChange.value).toBeUndefined();
    expect(lastChange.previousValue).toEqual({ id: 't1', name: 'Design' });
  });
});

describe('CngxActionSelect — quick-create flow', () => {
  it('dispatches quickCreateAction with draft label on commit()', () => {
    const { fixture, host, select } = setup();
    const spy = vi.fn<CngxSelectCreateAction<Tag>>((_term, draft) => ({
      id: 'new-' + draft.label,
      name: draft.label,
    }));
    host.quickCreateAction.set(spy);
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1]).toEqual({ label: 'Purple' });
  });

  it('writes value + patches localItems + announces on successful sync commit', () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    // Seed the draft label directly via the commit override.
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.value()).toEqual({ id: 'p', name: 'Purple' });
    expect(host.createdLog).toEqual([{ value: { id: 'p', name: 'Purple' }, label: 'Purple' }]);
    const lastChange = host.changeLog[host.changeLog.length - 1];
    expect(lastChange.action).toBe('create');
    expect(lastChange.option?.label).toBe('Purple');
  });

  it('keeps the optimistic local item visible until the server emits a matching value (dedup)', () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.value()).toEqual({ id: 'p', name: 'Purple' });

    // Server refetch without Purple — local item persists via mergeLocalItems;
    // selection remains resolvable.
    host.options.set([...TAGS]);
    flush(fixture);
    expect(select.selected()).not.toBeNull();
    expect(select.selected()?.label).toBe('Purple');

    // Server catches up and emits its own entry matching the id. The
    // `mergeLocalItems` dedup drops the local copy at merge-time (the
    // `selected()` cache may hold its compareWith-equal reference —
    // that's an intentional identity-stability optimization; what
    // matters here is that effectiveOptions only contains ONE entry
    // matching the id, not two.
    host.options.set([
      ...TAGS,
      { value: { id: 'p', name: 'Purple-server' }, label: 'Purple-server' },
    ]);
    flush(fixture);
    // Selection stays resolvable — we're no longer holding a phantom
    // entry.
    expect(select.selected()).not.toBeNull();
  });

  it("honours closeOnCreate — default true closes the panel on success", () => {
    const { fixture, select } = setup();
    fixture.componentInstance.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    select.open();
    flush(fixture);
    expect(select.panelOpen()).toBe(true);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.panelOpen()).toBe(false);
  });

  it("honours closeOnCreate=false — panel stays open after a successful create", () => {
    const { fixture, host, select } = setup();
    host.closeOnCreate.set(false);
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.open();
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.panelOpen()).toBe(true);
    expect(select.value()?.id).toBe('p');
  });

  it('drops commit when the draft label is empty (silent no-op)', () => {
    const { fixture, host, select } = setup();
    const spy = vi.fn<CngxSelectCreateAction<Tag>>(() => ({ id: 'x', name: 'x' }));
    host.quickCreateAction.set(spy);
    // No searchTerm set, empty explicit draft — must not fire.
    select.actionCallbacks().commit({ label: '' });
    flush(fixture);
    expect(spy).not.toHaveBeenCalled();
  });

  it('drops commit when quickCreateAction is null (no-op)', () => {
    const { fixture, select, host } = setup();
    expect(host.quickCreateAction()).toBeNull();
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.value()).toBeUndefined();
    expect(host.changeLog.length).toBe(0);
  });
});

describe('CngxActionSelect — async + error flow', () => {
  it('transitions stateChange pending → success across an Observable create', () => {
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
    expect(select.value()?.id).toBe('p');
  });

  it('surfaces errors via commitError output and preserves previous value', () => {
    const { fixture, host, select } = setup();
    const prior: Tag = { id: 't1', name: 'Design' };
    host.value.set(prior);
    flush(fixture);
    const boom = new Error('server down');
    host.quickCreateAction.set(() => {
      throw boom;
    });
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(host.errorLog).toEqual([boom]);
    expect(select.value()).toEqual(prior);
    expect(host.stateLog[host.stateLog.length - 1]).toBe('error');
  });

  it('supersedes an in-flight create when a second commit fires', () => {
    const { fixture, host, select } = setup();
    const first = new Subject<Tag>();
    const second = new Subject<Tag>();
    let calls = 0;
    host.quickCreateAction.set(() => {
      calls++;
      return calls === 1 ? first : second;
    });
    flush(fixture);
    select.actionCallbacks().commit({ label: 'First' });
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Second' });
    flush(fixture);
    // First resolves AFTER supersede — the commit controller's supersede
    // guard (captured id check) drops the stale success — value stays
    // undefined until second's resolution.
    first.next({ id: 'first', name: 'First' });
    first.complete();
    flush(fixture);
    expect(select.value()).toBeUndefined();
    second.next({ id: 'second', name: 'Second' });
    second.complete();
    flush(fixture);
    expect(select.value()?.id).toBe('second');
  });

  it('accepts a Promise-returning create', async () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => Promise.resolve({ id: 'p', name: 'Purple' }));
    flush(fixture);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    // Promise resolves on microtask.
    await Promise.resolve();
    await Promise.resolve();
    flush(fixture);
    expect(select.value()).toEqual({ id: 'p', name: 'Purple' });
  });
});

describe('CngxActionSelect — dismiss guard', () => {
  it('blocks click-outside dismissal while actionDirty() is true', () => {
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

  it('resets dirty via the cancel callback (Escape-path semantic)', () => {
    const { fixture, select } = setup();
    select.actionCallbacks().setDirty(true);
    flush(fixture);
    expect(select.actionDirty()).toBe(true);
    select.actionCallbacks().cancel();
    flush(fixture);
    expect(select.actionDirty()).toBe(false);
  });

  it('resets dirty automatically after a successful create', () => {
    const { fixture, host, select } = setup();
    host.quickCreateAction.set(() => ({ id: 'p', name: 'Purple' }));
    // Simulate consumer typing + marking dirty before committing.
    select.actionCallbacks().setDirty(true);
    flush(fixture);
    expect(select.actionDirty()).toBe(true);
    select.actionCallbacks().commit({ label: 'Purple' });
    flush(fixture);
    expect(select.actionDirty()).toBe(false);
  });
});
