import { Component, effect, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListbox } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormField,
  adaptFormControl,
} from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';

import { CngxSelectShell, type CngxSelectShellChange } from './select-shell.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxSelectOptgroup } from '../declarative/optgroup.component';
import {
  CngxSelectOptionError,
  CngxSelectOptionPending,
} from '../shared/template-slots';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from '../shared/commit-action.types';

// jsdom does not implement the Popover API — polyfill so CngxPopover can toggle.
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

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

@Component({
  template: `
    <cngx-select-shell [label]="'Farbe'" [(value)]="value">
      <cngx-option [value]="'red'">Rot</cngx-option>
      <cngx-option [value]="'green'" [disabled]="greenDisabled()">Grün</cngx-option>
      <cngx-option [value]="'blue'">Blau</cngx-option>
    </cngx-select-shell>
  `,
  imports: [CngxSelectShell, CngxSelectOption],
})
class FlatHost {
  readonly value = signal<string | undefined>(undefined);
  readonly greenDisabled = signal(false);
}

@Component({
  template: `
    <cngx-select-shell [label]="'Tier'" [(value)]="value">
      <cngx-option [value]="'a'">A</cngx-option>
      <cngx-optgroup label="Group">
        <cngx-option [value]="'b'">B</cngx-option>
        <cngx-option [value]="'c'">C</cngx-option>
      </cngx-optgroup>
      <cngx-option [value]="'d'">D</cngx-option>
    </cngx-select-shell>
  `,
  imports: [CngxSelectShell, CngxSelectOption, CngxSelectOptgroup],
})
class GroupedHost {
  readonly value = signal<string | undefined>(undefined);
}

@Component({
  template: `
    <cngx-select-shell [label]="'Plan'" [clearable]="clearable()" [(value)]="value">
      <cngx-option [value]="'p'"><b>Premium</b> Service</cngx-option>
      <cngx-option [value]="'b'">Basic</cngx-option>
    </cngx-select-shell>
  `,
  imports: [CngxSelectShell, CngxSelectOption],
})
class RichLabelHost {
  readonly value = signal<string | undefined>(undefined);
  readonly clearable = signal(false);
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-select-shell [label]="'Farbe'">
        <cngx-option [value]="'red'">Rot</cngx-option>
        <cngx-option [value]="'green'">Grün</cngx-option>
      </cngx-select-shell>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxSelectShell, CngxSelectOption],
})
class FormFieldHost {
  readonly _mock = createMockField<string>({ name: 'color', value: 'red' });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string> = this._mock.ref;
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-select-shell [label]="'Farbe'">
        <cngx-option [value]="'red'">Rot</cngx-option>
        <cngx-option [value]="'green'">Grün</cngx-option>
      </cngx-select-shell>
    </cngx-form-field>
  `,
  imports: [
    CngxFormField,
    CngxSelectShell,
    CngxSelectOption,
    ReactiveFormsModule,
  ],
})
class ReactiveFormsHost {
  readonly control = new FormControl<string | null>('red');
  readonly field = adaptFormControl(this.control, 'color');
}

@Component({
  template: `
    <cngx-select-shell
      [label]="'Farbe'"
      [commitAction]="commitAction"
      [commitMode]="mode()"
      [(value)]="value"
      (selectionChange)="changes.push($event)"
      (commitError)="errors.push($event)"
      (stateChange)="statuses.push($event)"
    >
      <ng-template cngxSelectOptionError>
        <span class="commit-error-glyph">!</span>
      </ng-template>
      <ng-template cngxSelectOptionPending>
        <span class="commit-pending-glyph">…</span>
      </ng-template>
      <cngx-option [value]="'red'">Rot</cngx-option>
      <cngx-option [value]="'green'">Grün</cngx-option>
      <cngx-option [value]="'blue'">Blau</cngx-option>
    </cngx-select-shell>
  `,
  imports: [
    CngxSelectShell,
    CngxSelectOption,
    CngxSelectOptionError,
    CngxSelectOptionPending,
  ],
})
class CommitHost {
  readonly value = signal<string | undefined>('red');
  readonly mode = signal<CngxSelectCommitMode>('optimistic');
  readonly changes: CngxSelectShellChange<string>[] = [];
  readonly errors: unknown[] = [];
  readonly statuses: string[] = [];
  pending: Subject<string | undefined> | null = null;
  commitCallCount = 0;
  readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    this.commitCallCount += 1;
    const subject = new Subject<string | undefined>();
    this.pending = subject;
    return subject.asObservable() as Observable<string | undefined>;
    void intended;
  };
}

describe('CngxSelectShell — Phase 5 scaffold', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({});
  });

  it('derivedOptions reflects three flat projected options', () => {
    const fixture = TestBed.createComponent(FlatHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const shell = shellDe.componentInstance as CngxSelectShell<string>;
    const opts = shell.flatOptions();

    expect(opts.length).toBe(3);
    expect(opts[0]).toMatchObject({ value: 'red', label: 'Rot' });
    expect(opts[1]).toMatchObject({ value: 'green', label: 'Grün', disabled: false });
    expect(opts[2]).toMatchObject({ value: 'blue', label: 'Blau' });
  });

  it('toggling [disabled] on a projected option updates derivedOptions', () => {
    const fixture = TestBed.createComponent(FlatHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const shell = shellDe.componentInstance as CngxSelectShell<string>;

    expect(shell.flatOptions()[1].disabled).toBe(false);

    fixture.componentInstance.greenDisabled.set(true);
    flush(fixture);

    expect(shell.flatOptions()[1].disabled).toBe(true);
  });

  it('preserves group hierarchy in the projected option model', () => {
    const fixture = TestBed.createComponent(GroupedHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const shell = shellDe.componentInstance as CngxSelectShell<string>;
    const eff = shell.effectiveOptions();

    expect(eff.length).toBe(3);
    const [first, second, third] = eff;
    // first + third are flat options
    expect((first as { value?: string }).value).toBe('a');
    expect((third as { value?: string }).value).toBe('d');
    // middle entry is a group with two children
    const grp = second as { label: string; children: readonly { value: string }[] };
    expect(grp.label).toBe('Group');
    expect(grp.children.length).toBe(2);
    expect(grp.children.map((o) => o.value)).toEqual(['b', 'c']);
    // flatOptions still flattens to 4
    expect(shell.flatOptions().map((o) => o.value)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('does not re-emit derivedOptions on unrelated input changes (structural equal)', () => {
    const fixture = TestBed.createComponent(RichLabelHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const shell = shellDe.componentInstance as CngxSelectShell<string>;

    let count = 0;
    TestBed.runInInjectionContext(() => {
      effect(() => {
        shell.effectiveOptions();
        count++;
      });
    });
    flush(fixture);
    const baseline = count;

    // Flip an unrelated input — clearable is shell-level state, not part
    // of any option's value/label/disabled. derivedOptions must not
    // re-emit.
    fixture.componentInstance.clearable.set(true);
    flush(fixture);

    expect(count - baseline).toBe(0);
  });

  it('listbox AD reports all projected options as registered items', () => {
    const fixture = TestBed.createComponent(FlatHost);
    fixture.detectChanges();
    flush(fixture);

    const lbDe = fixture.debugElement.query(By.directive(CngxListbox));
    const listbox = lbDe.injector.get(CngxListbox);

    // [items] forwarded via host directive overrides contentChildren —
    // the AD reports the explicit array even though projection scoping
    // would otherwise hide content-projected options.
    expect(listbox.ad.resolvedItems().length).toBe(3);
    expect(listbox.options().length).toBe(3);
  });

  it('renders the trigger label as plain text for rich-content options', () => {
    const fixture = TestBed.createComponent(RichLabelHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const shell = shellDe.componentInstance as CngxSelectShell<string>;
    const labelEl = shellDe.nativeElement.querySelector(
      '.cngx-select-shell__label',
    ) as HTMLElement;

    fixture.componentInstance.value.set('p');
    flush(fixture);

    expect(shell.triggerValue()).toBe('Premium Service');
    expect(labelEl.textContent).toBe('Premium Service');
    // Plain-text trigger guarantee — closed-trigger label region renders
    // text only, even when the underlying option carries `<b>` markup.
    expect(labelEl.querySelectorAll('*').length).toBe(0);
  });

  it('clicking the trigger opens the panel and flips aria-expanded', () => {
    const fixture = TestBed.createComponent(FlatHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const triggerBtn = shellDe.nativeElement.querySelector(
      '.cngx-select-shell__trigger',
    ) as HTMLElement;
    const popoverDe = fixture.debugElement.query(By.directive(CngxPopover));
    const popover = popoverDe.injector.get(CngxPopover);

    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
    expect(popover.isVisible()).toBe(false);

    triggerBtn.click();
    flush(fixture);

    expect(popover.isVisible()).toBe(true);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking a projected <cngx-option> commits the value via shell delegation', () => {
    const fixture = TestBed.createComponent(FlatHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const triggerBtn = shellDe.nativeElement.querySelector(
      '.cngx-select-shell__trigger',
    ) as HTMLElement;

    triggerBtn.click();
    flush(fixture);

    // Click the second projected option (`green`). Content-projection
    // scoping prevents the option's own click handler from reaching the
    // listbox AD; the shell's click delegation routes the activation
    // through the AD directly.
    const greenOption = shellDe.nativeElement.querySelectorAll('cngx-option')[1] as HTMLElement;
    greenOption.click();
    flush(fixture);

    expect(fixture.componentInstance.value()).toBe('green');
  });

  it('hovering a projected <cngx-option> highlights it via shell delegation', () => {
    const fixture = TestBed.createComponent(FlatHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const triggerBtn = shellDe.nativeElement.querySelector(
      '.cngx-select-shell__trigger',
    ) as HTMLElement;
    triggerBtn.click();
    flush(fixture);

    const blueOption = shellDe.nativeElement.querySelectorAll('cngx-option')[2] as HTMLElement;
    const lbDe = fixture.debugElement.query(By.directive(CngxListbox));
    const listbox = lbDe.injector.get(CngxListbox);

    blueOption.dispatchEvent(new Event('pointerover', { bubbles: true }));
    flush(fixture);

    const activeId = listbox.ad.activeId();
    expect(activeId).toBe(blueOption.id);
    // Visual class applied via the shell's highlight-mirror effect —
    // the option's own `isHighlighted` reads its (null) authoring-scope
    // AD and stays false; the shell toggles the DOM class directly.
    expect(blueOption.classList.contains('cngx-option--highlighted')).toBe(true);
  });
});

describe('CngxSelectShell — form-field integration', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({});
  });

  it('provides CNGX_FORM_FIELD_CONTROL via the component', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    flush(fixture);

    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const resolved = shellDe.injector.get(CNGX_FORM_FIELD_CONTROL);
    expect(resolved).toBe(shellDe.componentInstance);
  });

  it('Signal-Forms round-trip: external mutation propagates to value()', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    flush(fixture);

    const shell = fixture.debugElement.query(By.directive(CngxSelectShell))
      .componentInstance as CngxSelectShell<string>;

    expect(shell.value()).toBe('red');

    fixture.componentInstance.ref.value.set('green');
    flush(fixture);

    expect(shell.value()).toBe('green');
  });

  it('Signal-Forms round-trip: internal value writes back into the field', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    flush(fixture);

    const shell = fixture.debugElement.query(By.directive(CngxSelectShell))
      .componentInstance as CngxSelectShell<string>;

    shell.value.set('green');
    flush(fixture);

    expect(fixture.componentInstance.ref.value()).toBe('green');
  });

  it('Reactive-Forms round-trip via adaptFormControl', () => {
    const fixture = TestBed.createComponent(ReactiveFormsHost);
    fixture.detectChanges();
    flush(fixture);

    const shell = fixture.debugElement.query(By.directive(CngxSelectShell))
      .componentInstance as CngxSelectShell<string>;

    expect(shell.value()).toBe('red');

    fixture.componentInstance.control.setValue('green');
    flush(fixture);

    expect(shell.value()).toBe('green');
  });
});

describe('CngxSelectShell — commit action producer', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({});
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<CommitHost>>;
    shell: CngxSelectShell<string>;
    listbox: CngxListbox;
    host: CommitHost;
  } {
    const fixture = TestBed.createComponent(CommitHost);
    fixture.detectChanges();
    flush(fixture);
    const shellDe = fixture.debugElement.query(By.directive(CngxSelectShell));
    const listboxDe = fixture.debugElement.query(By.directive(CngxListbox));
    return {
      fixture,
      shell: shellDe.componentInstance as CngxSelectShell<string>,
      listbox: listboxDe.injector.get(CngxListbox),
      host: fixture.componentInstance,
    };
  }

  function pickValue(listbox: CngxListbox, value: string): void {
    listbox.ad.highlightByValue(value);
    listbox.ad.activateCurrent();
  }

  it('optimistic success: value stays at intended, selectionChange emits on success', () => {
    const { fixture, listbox, host } = setup();

    pickValue(listbox, 'green');
    flush(fixture);

    // Optimistic: value reflects intended immediately, no selectionChange
    // until commit resolves.
    expect(host.value()).toBe('green');
    expect(host.changes.length).toBe(0);
    expect(host.statuses[host.statuses.length - 1]).toBe('pending');

    host.pending!.next('green');
    host.pending!.complete();
    flush(fixture);

    expect(host.value()).toBe('green');
    expect(host.changes.length).toBe(1);
    expect(host.changes[0].value).toBe('green');
    expect(host.changes[0].option?.value).toBe('green');
    expect(host.statuses[host.statuses.length - 1]).toBe('success');
  });

  it('supersede: a second pick aborts the in-flight commit', () => {
    const { fixture, listbox, host } = setup();

    pickValue(listbox, 'green');
    flush(fixture);
    const firstPending = host.pending!;
    const firstCount = host.commitCallCount;

    // Second pick while first is pending — supersedes via commitId.
    pickValue(listbox, 'blue');
    flush(fixture);
    expect(host.commitCallCount).toBeGreaterThan(firstCount);

    // First pending resolves too late — must be ignored by the commit
    // controller's supersede check.
    const statusesBefore = [...host.statuses];
    firstPending.next('green');
    firstPending.complete();
    flush(fixture);
    expect(host.statuses).toEqual(statusesBefore);
  });

  it('pessimistic pending: panel stays open, failed option carries data-status="pending"', () => {
    const { fixture, listbox, host } = setup();
    fixture.componentInstance.mode.set('pessimistic');
    flush(fixture);

    const greenOption = fixture.debugElement.queryAll(By.css('cngx-option'))[1]
      .nativeElement as HTMLElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    const triggerBtn = fixture.debugElement.query(By.directive(CngxSelectShell))
      .nativeElement.querySelector('.cngx-select-shell__trigger') as HTMLElement;

    triggerBtn.click();
    flush(fixture);
    expect(popover.isVisible()).toBe(true);

    pickValue(listbox, 'green');
    flush(fixture);

    // Pessimistic: panel stays open while the commit is pending, the
    // failed option carries data-status="pending", and the glyph
    // template (when projected) renders inside the reserved internal
    // slot. The status-host contract holds even before the commit
    // resolves.
    expect(popover.isVisible()).toBe(true);
    expect(greenOption.getAttribute('data-status')).toBe('pending');
    const slot = greenOption.querySelector('.cngx-option__status');
    expect(slot).not.toBeNull();
    const glyph = slot!.querySelector('.commit-pending-glyph');
    expect(glyph).not.toBeNull();
    expect(glyph!.textContent).toBe('…');

    host.pending!.next('green');
    host.pending!.complete();
    flush(fixture);

    // After success: status clears, panel closes.
    expect(greenOption.getAttribute('data-status')).toBeNull();
  });

  it('optimistic error: value rolls back, status-host renders glyph in option slot', () => {
    const { fixture, listbox, host } = setup();
    const greenOption = fixture.debugElement.queryAll(By.css('cngx-option'))[1]
      .nativeElement as HTMLElement;

    pickValue(listbox, 'green');
    flush(fixture);

    // Optimistic write applied.
    expect(host.value()).toBe('green');

    const err = new Error('server down');
    host.pending!.error(err);
    flush(fixture);

    // Rollback to previous value; commitError emitted.
    expect(host.value()).toBe('red');
    expect(host.errors).toEqual([err]);
    expect(host.statuses[host.statuses.length - 1]).toBe('error');

    // Status-host contract: failed option carries data-status="error" on
    // the host element, and the consumer-projected error glyph renders
    // inside the option's reserved internal slot — never alongside user
    // content. Plan locked decision: the glyph is in `.cngx-option__status`,
    // adjacent to (not inside) the consumer's `<ng-content/>`.
    expect(greenOption.getAttribute('data-status')).toBe('error');
    const slot = greenOption.querySelector('.cngx-option__status');
    expect(slot).not.toBeNull();
    const glyph = slot!.querySelector('.commit-error-glyph');
    expect(glyph).not.toBeNull();
    expect(glyph!.textContent).toBe('!');
  });
});
