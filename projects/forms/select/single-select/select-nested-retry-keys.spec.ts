import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { Subject, type Observable } from 'rxjs';

import { createManualState, type ManualAsyncState } from '@cngx/common/data';

import type { CngxSelectCommitAction } from '../shared/commit-action.types';
import type { CngxSelectOptionDef, CngxSelectOptionsInput } from '../shared/option.model';
import { CngxSelectCommitError } from '../shared/template-slots';
import { CngxSelect } from './select.component';

// jsdom does not implement the Popover API - polyfill so CngxPopover can toggle.
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
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

function press(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

// A focused button the listbox leaves alone gets its native activation:
// the browser turns an un-prevented Enter / Space into a click.
function pressAndActivate(button: HTMLElement, key: string): KeyboardEvent {
  const event = press(button, key);
  if (!event.defaultPrevented) {
    button.click();
  }
  return event;
}

function openFromKeyboard(fixture: ComponentFixture<unknown>, trigger: HTMLElement): void {
  trigger.focus();
  press(trigger, 'ArrowDown');
  flush(fixture);
}

@Component({
  template: `
    <cngx-select
      [label]="'Color'"
      [options]="options"
      [commitAction]="commitAction"
      [commitMode]="'pessimistic'"
      [(value)]="value"
    >
      <ng-template cngxSelectCommitError let-retry="retry">
        <div class="custom-commit-error">
          <button type="button" class="custom-retry" (click)="retry()">Try again</button>
        </div>
      </ng-template>
    </cngx-select>
  `,
  imports: [CngxSelect, CngxSelectCommitError],
})
class CustomCommitErrorHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>('red');
  readonly intents: (string | undefined)[] = [];
  pending: Subject<string | undefined> | null = null;
  readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    this.intents.push(intended);
    const subject = new Subject<string | undefined>();
    this.pending = subject;
    return subject.asObservable() as Observable<string | undefined>;
  };
}

describe('CngxSelect - keyboard Retry in a custom commit-error template', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [CustomCommitErrorHost] });
  });

  function setupFailedCommit() {
    const fixture = TestBed.createComponent(CustomCommitErrorHost);
    fixture.detectChanges();
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    const el = selectDe.nativeElement as HTMLElement;
    const select = selectDe.componentInstance as CngxSelect<string>;
    const host = fixture.componentInstance;
    const trigger = el.querySelector('.cngx-select__trigger') as HTMLElement;

    trigger.click();
    flush(fixture);
    (el.querySelector('[cngxOption]:nth-of-type(2)') as HTMLElement).click();
    flush(fixture);
    host.pending!.error(new Error('boom'));
    flush(fixture);

    if (select.panelOpen()) {
      select.close();
      flush(fixture);
    }
    openFromKeyboard(fixture, trigger);
    expect(select.panelOpen()).toBe(true);
    const retry = el.querySelector('.custom-commit-error .custom-retry') as HTMLElement | null;
    expect(retry).not.toBeNull();
    retry!.focus();
    expect(document.activeElement).toBe(retry);
    return { fixture, host, select, retry: retry! };
  }

  for (const key of ['Enter', ' ']) {
    it(`${key === ' ' ? 'Space' : key} on the custom Retry clicks it and replays the failed commit`, () => {
      const { fixture, host, retry } = setupFailedCommit();
      const before = host.intents.length;

      const event = pressAndActivate(retry, key);
      flush(fixture);

      expect(event.defaultPrevented).toBe(false);
      expect(host.intents.length).toBe(before + 1);
      expect(host.intents.at(-1)).toBe('green');
    });
  }
});

@Component({
  template: `
    <cngx-select [label]="'Color'" [state]="state" [retryFn]="retryFn" [(value)]="value" />
  `,
  imports: [CngxSelect],
})
class RefreshErrorHost {
  readonly state: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
  readonly value = signal<string | undefined>(undefined);
  reloadCalls = 0;
  readonly retryFn = (): void => {
    this.reloadCalls += 1;
  };
}

describe('CngxSelect - keyboard Retry in the inline refresh-error banner', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [RefreshErrorHost] });
  });

  function setupRefreshError() {
    const fixture = TestBed.createComponent(RefreshErrorHost);
    fixture.detectChanges();
    flush(fixture);
    const host = fixture.componentInstance;
    host.state.setSuccess(OPTIONS);
    host.state.setError(new Error('stale'));
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    const el = selectDe.nativeElement as HTMLElement;
    const select = selectDe.componentInstance as CngxSelect<string>;
    const trigger = el.querySelector('.cngx-select__trigger') as HTMLElement;

    openFromKeyboard(fixture, trigger);
    expect(select.panelOpen()).toBe(true);
    const retry = el.querySelector(
      '.cngx-select__error--inline button.cngx-select__error-retry',
    ) as HTMLElement | null;
    expect(retry).not.toBeNull();
    retry!.focus();
    expect(document.activeElement).toBe(retry);
    return { fixture, host, retry: retry! };
  }

  for (const key of ['Enter', ' ']) {
    it(`${key === ' ' ? 'Space' : key} on the Retry reloads instead of picking the active option`, () => {
      const { fixture, host, retry } = setupRefreshError();

      const event = pressAndActivate(retry, key);
      flush(fixture);

      expect(event.defaultPrevented).toBe(false);
      expect(host.reloadCalls).toBe(1);
      expect(host.value()).toBeUndefined();
    });
  }
});
