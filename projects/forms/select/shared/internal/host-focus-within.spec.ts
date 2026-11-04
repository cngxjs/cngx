import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHostFocusWithin, type HostFocusWithin } from './host-focus-within';

const onLeave = vi.fn();
const close = vi.fn();

@Component({
  selector: 'cngx-test-focus-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="owner">Trigger</button>
    <div class="panel cngx-popover--open">
      <input class="search" />
      <span class="header">Header</span>
    </div>
  `,
  host: {
    '(focusin)': 'focus.handleFocusIn()',
    '(focusout)': 'focus.handleFocusOut($event)',
  },
})
class FocusHost {
  readonly focus: HostFocusWithin = createHostFocusWithin({
    onLeave,
    close,
    owner: () => undefined,
    restoreFocus: true,
  });
}

@Component({
  imports: [FocusHost],
  template: `
    <cngx-test-focus-host />
    <button type="button" class="outside">Next</button>
  `,
})
class Page {}

function setup(): { root: HTMLElement; host: HTMLElement; focus: HostFocusWithin } {
  const fixture = TestBed.createComponent(Page);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const host = root.querySelector<HTMLElement>('cngx-test-focus-host')!;
  const focus = fixture.debugElement.children[0].componentInstance as FocusHost;
  return { root, host, focus: focus.focus };
}

function focusOut(from: HTMLElement, to: EventTarget | null): void {
  from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: to }));
}

describe('createHostFocusWithin', () => {
  beforeEach(() => {
    onLeave.mockClear();
    close.mockClear();
  });

  it('runs onLeave and close when focus moves to a control outside the host', () => {
    const { root, host, focus } = setup();
    const owner = host.querySelector<HTMLElement>('.owner')!;
    owner.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focus.focusedWithin()).toBe(true);

    focusOut(owner, root.querySelector('.outside'));
    expect(focus.focusedWithin()).toBe(false);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('keeps focus within when focus moves from the trigger into the panel', () => {
    const { host, focus } = setup();
    const owner = host.querySelector<HTMLElement>('.owner')!;
    owner.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    focusOut(owner, host.querySelector('.search'));
    expect(focus.focusedWithin()).toBe(true);
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('does not treat a click on a non-focusable part of the open panel as a leave', () => {
    const { host, focus } = setup();
    const search = host.querySelector<HTMLElement>('.search')!;
    search.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    focusOut(search, null);
    expect(focus.focusedWithin()).toBe(true);
    expect(onLeave).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('treats focus dropping to nothing from the trigger as a leave without closing', () => {
    const { host, focus } = setup();
    const owner = host.querySelector<HTMLElement>('.owner')!;
    owner.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    focusOut(owner, null);
    expect(focus.focusedWithin()).toBe(false);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
  });

  it('treats Tab out of the panel search to the next control as a leave', () => {
    const { root, host } = setup();
    const search = host.querySelector<HTMLElement>('.search')!;
    search.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    focusOut(search, root.querySelector('.outside'));
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('treats a null-target blur from a closed panel as a leave', () => {
    const { host } = setup();
    const panel = host.querySelector<HTMLElement>('.panel')!;
    panel.classList.remove('cngx-popover--open');
    const search = host.querySelector<HTMLElement>('.search')!;

    focusOut(search, null);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});

@Component({
  selector: 'cngx-test-modal-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="owner">Trigger</button>
    <div class="sheet" role="dialog" aria-modal="true">
      <input class="sheet-search" />
    </div>
  `,
})
class NoRestoreHost {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly focus: HostFocusWithin = createHostFocusWithin({
    onLeave,
    owner: () => this.el.querySelector<HTMLElement>('.owner') ?? undefined,
    restoreFocus: false,
  });
}

describe('createHostFocusWithin - modal sheet close contract', () => {
  function mount(): { host: HTMLElement; focus: HostFocusWithin } {
    const fixture = TestBed.createComponent(NoRestoreHost);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    return { host, focus: fixture.componentInstance.focus };
  }

  it('refocuses the trigger before a modal sheet is removed even under restoreFocus: false', () => {
    const { host, focus } = mount();
    const search = host.querySelector<HTMLElement>('.sheet-search')!;
    search.focus();
    expect(document.activeElement).toBe(search);

    focus.refocusOwnerBeforeRemoval();
    expect(document.activeElement).toBe(host.querySelector('.owner'));
  });

  it('leaves focus in the panel on a non-modal close under restoreFocus: false', () => {
    const { host, focus } = mount();
    const search = host.querySelector<HTMLElement>('.sheet-search')!;
    search.focus();

    focus.refocusOwnerBeforeClose();
    expect(document.activeElement).toBe(search);
  });

  it('never pulls focus in from outside the control', () => {
    const { host, focus } = mount();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      outside.focus();
      focus.refocusOwnerBeforeRemoval();
      expect(document.activeElement).toBe(outside);
      expect(host.contains(document.activeElement)).toBe(false);
    } finally {
      outside.remove();
    }
  });
});

// ── B2 (commit 7): focus leaving the host closes an anchored panel even under
// dismissOn 'escape' - this pins the current behaviour, not a change. ─────────
import { afterEach as afterEachB2 } from 'vitest';
import { provideSelectConfig, withDismissOn } from '../config';
import { KINDS as B2_KINDS, cleanupRoots as b2Cleanup, mount as b2Mount } from '../__test-helpers/review-probe-host';

describe('B2: focus leaving the host closes the anchored panel under dismissOn escape', () => {
  afterEachB2(() => {
    b2Cleanup();
    vi.restoreAllMocks();
  });

  it('closes when focus moves to a control outside the host', () => {
    const m = b2Mount(B2_KINDS['select'], { providers: [provideSelectConfig(withDismissOn('escape'))] });
    const trigger = m.el.querySelector<HTMLElement>('.cngx-field-trigger')!;
    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    m.open();
    expect(m.v.panelOpen()).toBe(true);

    const outside = m.fixture.nativeElement.querySelector('.outside-btn') as HTMLElement;
    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
    m.settle();
    expect(m.v.panelOpen()).toBe(false);
  });
});
