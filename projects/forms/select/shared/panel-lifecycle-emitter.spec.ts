import { Component, ElementRef, output, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY,
  createPanelLifecycleEmitter,
} from './panel-lifecycle-emitter';

function drainMicrotasks(): Promise<void> {
  return Promise.resolve();
}

@Component({ selector: 'lifecycle-probe', template: '', standalone: true })
class LifecycleProbe {
  readonly panelOpen: WritableSignal<boolean> = signal(false);
  readonly target = signal<ElementRef<HTMLElement> | undefined>(undefined);
  readonly restoreFocus = signal(true);

  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  readonly openedChangeLog: boolean[] = [];
  readonly openedLog: number[] = [];
  readonly closedLog: number[] = [];
  readonly restoringLog: boolean[] = [];

  constructor() {
    this.openedChange.subscribe((v) => this.openedChangeLog.push(v));
    this.opened.subscribe(() => this.openedLog.push(1));
    this.closed.subscribe(() => this.closedLog.push(1));
    createPanelLifecycleEmitter({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.target,
      restoreFocus: true,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
      restoringFocus: (active) => this.restoringLog.push(active),
    });
  }
}

@Component({ selector: 'no-restore-probe', template: '', standalone: true })
class NoRestoreProbe {
  readonly panelOpen: WritableSignal<boolean> = signal(true);
  readonly target = signal<ElementRef<HTMLElement> | undefined>(undefined);
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly restoringLog: boolean[] = [];

  constructor() {
    createPanelLifecycleEmitter({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.target,
      restoreFocus: false,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
      restoringFocus: (active) => this.restoringLog.push(active),
    });
  }
}

describe('createPanelLifecycleEmitter', () => {
  it('emits openedChange(true) and opened on an open flip', () => {
    const fixture = TestBed.createComponent(LifecycleProbe);
    fixture.detectChanges();
    TestBed.flushEffects();
    const c = fixture.componentInstance;
    c.openedChangeLog.length = 0;
    c.openedLog.length = 0;

    c.panelOpen.set(true);
    TestBed.flushEffects();

    expect(c.openedChangeLog).toEqual([true]);
    expect(c.openedLog).toEqual([1]);
  });

  it('emits openedChange(false) and closed on a close flip and restores focus to the trigger', async () => {
    const fixture = TestBed.createComponent(LifecycleProbe);
    const c = fixture.componentInstance;
    const button = document.createElement('button');
    let focusCalls = 0;
    button.focus = (): void => {
      focusCalls++;
    };
    c.target.set(new ElementRef(button));

    c.panelOpen.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    c.openedChangeLog.length = 0;
    c.closedLog.length = 0;
    c.restoringLog.length = 0;

    c.panelOpen.set(false);
    TestBed.flushEffects();
    expect(c.openedChangeLog).toEqual([false]);
    expect(c.closedLog).toEqual([1]);

    // Focus restore is deferred a microtask past the popover DOM teardown.
    await drainMicrotasks();
    expect(focusCalls).toBe(1);
    // Suppression window brackets the programmatic focus call.
    expect(c.restoringLog).toEqual([true, false]);
  });

  it('does not restore focus when restoreFocus is false', async () => {
    const fixture = TestBed.createComponent(NoRestoreProbe);
    const c = fixture.componentInstance;
    const button = document.createElement('button');
    let focusCalls = 0;
    button.focus = (): void => {
      focusCalls++;
    };
    c.target.set(new ElementRef(button));
    fixture.detectChanges();
    TestBed.flushEffects();

    c.panelOpen.set(false);
    TestBed.flushEffects();
    await drainMicrotasks();
    expect(focusCalls).toBe(0);
    expect(c.restoringLog).toEqual([]);
  });
});

describe('CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('defaults to createPanelLifecycleEmitter', () => {
    expect(TestBed.inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)).toBe(
      createPanelLifecycleEmitter,
    );
  });
});
