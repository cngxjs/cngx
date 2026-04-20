import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Subject, type Observable } from 'rxjs';

import { CngxListbox } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { CNGX_STATEFUL } from '@cngx/core/utils';
import { CNGX_FORM_FIELD_CONTROL, CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';

import { CngxSelect, type CngxSelectChange } from './select.component';
import { injectSelectConfig, injectSelectAnnouncer } from '../shared/inject-helpers';
import { CngxSelectAnnouncer } from '../shared/announcer';
import {
  CNGX_SELECT_CONFIG,
  provideSelectConfig,
  provideSelectConfigAt,
  withPanelWidth,
  withLoadingVariant,
} from '../shared/config';
import type { CngxSelectOptionDef, CngxSelectOptionsInput } from '../shared/option.model';
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

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Rot' },
  { value: 'green', label: 'Grün' },
  { value: 'blue', label: 'Blau', disabled: true },
];

const GROUPED_OPTIONS: CngxSelectOptionsInput<string> = [
  {
    label: 'Warm',
    children: [
      { value: 'red', label: 'Rot' },
      { value: 'orange', label: 'Orange' },
    ],
  },
  {
    label: 'Cold',
    children: [
      { value: 'blue', label: 'Blau' },
      { value: 'teal', label: 'Türkis' },
    ],
  },
];

@Component({
  template: `
    <cngx-select
      [label]="'Farbe'"
      [options]="options"
      [(value)]="value"
      [placeholder]="placeholder"
      (selectionChange)="lastChange.set($event)"
      (openedChange)="openedLog.set($event)"
    />
  `,
  imports: [CngxSelect],
})
class StandaloneHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
  readonly placeholder = 'Bitte wählen';
  readonly lastChange = signal<CngxSelectChange<string> | null>(null);
  readonly openedLog = signal<boolean | null>(null);
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-select [label]="'Farbe'" [options]="options" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxSelect],
})
class FormFieldHost {
  readonly options = OPTIONS;
  readonly _mock = createMockField<string>({ name: 'color', value: 'red', required: true });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string> = this._mock.ref;
}

@Component({
  template: `
    <cngx-select
      [label]="'Color'"
      [options]="options"
      aria-label="Choose color"
      [required]="true"
      [clearable]="true"
      [(value)]="value"
      (selectionChange)="lastChange.set($event)"
    />
  `,
  imports: [CngxSelect],
})
class StandaloneA11yHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>('red');
  readonly lastChange = signal<CngxSelectChange<string> | null>(null);
}

@Component({
  template: `
    <cngx-select [label]="'G'" [options]="grouped" [(value)]="value" />
  `,
  imports: [CngxSelect],
})
class GroupedHost {
  readonly grouped = GROUPED_OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}


function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxSelect — standalone', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [StandaloneHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<StandaloneHost>>;
    select: CngxSelect<string>;
    triggerBtn: HTMLElement;
    listbox: CngxListbox;
    popover: CngxPopover;
  } {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    const listboxDe = fixture.debugElement.query(By.directive(CngxListbox));
    const popoverDe = fixture.debugElement.query(By.directive(CngxPopover));
    return {
      fixture,
      select: selectDe.componentInstance as CngxSelect<string>,
      triggerBtn: selectDe.nativeElement.querySelector('.cngx-select__trigger') as HTMLElement,
      listbox: listboxDe.injector.get(CngxListbox),
      popover: popoverDe.injector.get(CngxPopover),
    };
  }

  it('renders the trigger with placeholder when no value is selected', () => {
    const { triggerBtn } = setup();
    expect(triggerBtn.textContent?.trim()).toContain('Bitte wählen');
    expect(triggerBtn.getAttribute('aria-haspopup')).toBe('listbox');
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders one option per entry in options[]', () => {
    const { listbox } = setup();
    expect(listbox.options().length).toBe(3);
  });

  it('trigger label reflects initial value', () => {
    const { fixture, triggerBtn } = setup();
    fixture.componentInstance.value.set('red');
    flush(fixture);
    expect(triggerBtn.textContent?.trim()).toContain('Rot');
  });

  it('clicking the trigger toggles the popover and emits openedChange', () => {
    const { fixture, triggerBtn, popover } = setup();
    triggerBtn.click();
    flush(fixture);
    expect(popover.isVisible()).toBe(true);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.componentInstance.openedLog()).toBe(true);
  });

  it('selecting an option closes the popover and emits selectionChange', () => {
    const { fixture, triggerBtn, popover } = setup();
    triggerBtn.click();
    flush(fixture);
    const secondOption = fixture.debugElement.nativeElement.querySelector(
      '[cngxOption]:nth-of-type(2)',
    ) as HTMLElement;
    secondOption.click();
    flush(fixture);
    expect(fixture.componentInstance.value()).toBe('green');
    expect(popover.isVisible()).toBe(false);
    const change = fixture.componentInstance.lastChange();
    expect(change?.value).toBe('green');
    expect(change?.option?.label).toBe('Grün');
  });

  it('clicking a disabled option does not update value', () => {
    const { fixture, triggerBtn } = setup();
    triggerBtn.click();
    flush(fixture);
    const thirdOption = fixture.debugElement.nativeElement.querySelector(
      '[cngxOption]:nth-of-type(3)',
    ) as HTMLElement;
    thirdOption.click();
    flush(fixture);
    expect(fixture.componentInstance.value()).toBeUndefined();
  });

  it('open() / close() / toggle() / focus() public methods work', () => {
    const { select, popover } = setup();
    select.open();
    expect(popover.isVisible()).toBe(true);
    select.close();
    expect(popover.isVisible()).toBe(false);
    select.toggle();
    expect(popover.isVisible()).toBe(true);
    select.focus();
    // no throw is enough for jsdom
  });

  it('exposes panelOpen / selected / triggerValue / empty / focused as signals', () => {
    const { fixture, select } = setup();
    expect(select.panelOpen()).toBe(false);
    expect(select.selected()).toBeNull();
    expect(select.empty()).toBe(true);
    fixture.componentInstance.value.set('red');
    flush(fixture);
    expect(select.selected()?.label).toBe('Rot');
    expect(select.triggerValue()).toBe('Rot');
    expect(select.empty()).toBe(false);
  });
});

describe('CngxSelect — standalone a11y', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [StandaloneA11yHost] });
  });

  it('honours [aria-label] and [required] when no form-field is present', () => {
    const fixture = TestBed.createComponent(StandaloneA11yHost);
    fixture.detectChanges();
    flush(fixture);
    const trigger = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__trigger',
    ) as HTMLElement;
    expect(trigger.getAttribute('aria-label')).toBe('Choose color');
    expect(trigger.getAttribute('aria-required')).toBe('true');
  });

  it('renders a clear button when [clearable]="true" and clearing resets value', () => {
    const fixture = TestBed.createComponent(StandaloneA11yHost);
    fixture.detectChanges();
    flush(fixture);
    const clear = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__clear',
    ) as HTMLElement;
    expect(clear).toBeTruthy();
    clear.click();
    flush(fixture);
    expect(fixture.componentInstance.value()).toBeUndefined();
  });

  it('clear emits selectionChange with previousValue = prior value', () => {
    const fixture = TestBed.createComponent(StandaloneA11yHost);
    fixture.detectChanges();
    flush(fixture);
    // Prior state: StandaloneA11yHost's default value is 'red'.
    const clear = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__clear',
    ) as HTMLElement;
    clear.click();
    flush(fixture);
    const change = fixture.componentInstance.lastChange();
    expect(change?.value).toBeUndefined();
    expect(change?.previousValue).toBe('red');
  });
});

describe('CngxSelect — grouped options', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [GroupedHost] });
  });

  it('renders optgroup headers and nested options', () => {
    const fixture = TestBed.createComponent(GroupedHost);
    fixture.detectChanges();
    flush(fixture);
    const groupHeaders = fixture.debugElement.nativeElement.querySelectorAll(
      '.cngx-select__group-header',
    );
    expect(groupHeaders.length).toBe(2);
    const options = fixture.debugElement.queryAll(By.directive(CngxListbox))[0];
    const listbox = options.injector.get(CngxListbox);
    expect(listbox.options().length).toBe(4);
  });
});

describe('inject helpers', () => {
  it('injectSelectConfig returns a fully populated resolved config', () => {
    TestBed.configureTestingModule({});
    TestBed.runInInjectionContext(() => {
      const config = injectSelectConfig();
      expect(config.panelWidth).toBeDefined();
      expect(config.typeaheadDebounceInterval).toBeTypeOf('number');
      expect(config.announcer.format).toBeTypeOf('function');
    });
  });

  it('injectSelectAnnouncer returns the root-scoped service', () => {
    TestBed.configureTestingModule({});
    TestBed.runInInjectionContext(() => {
      const announcer = injectSelectAnnouncer();
      expect(announcer).toBeDefined();
      expect(typeof announcer.announce).toBe('function');
    });
  });
});

describe('CngxSelect — form-field integration', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [FormFieldHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<FormFieldHost>>;
    select: CngxSelect<string>;
    triggerBtn: HTMLElement;
    ref: MockFieldRef<string>;
  } {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    return {
      fixture,
      select: selectDe.componentInstance as CngxSelect<string>,
      triggerBtn: selectDe.nativeElement.querySelector('.cngx-select__trigger') as HTMLElement,
      ref: fixture.componentInstance.ref,
    };
  }

  it('provides CNGX_FORM_FIELD_CONTROL via the component', () => {
    const { fixture, select } = setup();
    const resolved = fixture.debugElement
      .query(By.directive(CngxSelect))
      .injector.get(CNGX_FORM_FIELD_CONTROL);
    expect(resolved).toBe(select);
  });

  it('syncs initial field value into the select', () => {
    const { select } = setup();
    expect(select.value()).toBe('red');
  });

  it('external field mutation reflects in the select', () => {
    const { fixture, select, ref } = setup();
    ref.value.set('green');
    flush(fixture);
    expect(select.value()).toBe('green');
  });

  it('internal selection pushes into the field', () => {
    const { fixture, triggerBtn, ref } = setup();
    triggerBtn.click();
    flush(fixture);
    const secondOption = fixture.debugElement.nativeElement.querySelector(
      '[cngxOption]:nth-of-type(2)',
    ) as HTMLElement;
    secondOption.click();
    flush(fixture);
    expect(ref.value()).toBe('green');
  });

  it('derives id + ARIA attributes from the presenter', () => {
    const { fixture } = setup();
    const selectHost = fixture.debugElement.query(By.directive(CngxSelect))
      .nativeElement as HTMLElement;
    expect(selectHost.id).toBe('cngx-color-input');
    // aria-describedby belongs on the focusable trigger (AT reads it from
    // the element that has focus, not from the container).
    const triggerBtn = selectHost.querySelector('.cngx-select__trigger') as HTMLElement;
    expect(triggerBtn.getAttribute('aria-describedby')).toContain('cngx-color-hint');
    expect(triggerBtn.getAttribute('aria-describedby')).toContain('cngx-color-error');
  });

  it('errorState reflects presenter.showError (touched && invalid)', () => {
    const { fixture, select, ref } = setup();
    expect(select.errorState()).toBe(false);
    ref.invalid.set(true);
    flush(fixture);
    expect(select.errorState()).toBe(false);
    ref.touched.set(true);
    flush(fixture);
    expect(select.errorState()).toBe(true);
  });
});

// ── [state] consumer ─────────────────────────────────────────────────

@Component({
  selector: 'state-consumer-host',
  template: `
    <cngx-select
      [label]="'Farbe'"
      [state]="state"
      [retryFn]="retryFn"
      [(value)]="value"
      (retry)="retryCount.set(retryCount() + 1)"
    />
  `,
  imports: [CngxSelect],
})
class StateConsumerHost {
  readonly state: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
  readonly value = signal<string | undefined>(undefined);
  readonly retryCount = signal(0);
  reloadCalls = 0;
  readonly retryFn = (): void => {
    this.reloadCalls += 1;
  };
}

describe('CngxSelect — async state consumer', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [StateConsumerHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<StateConsumerHost>>;
    select: CngxSelect<string>;
    host: StateConsumerHost;
    panel: () => HTMLElement;
    triggerBtn: HTMLElement;
  } {
    const fixture = TestBed.createComponent(StateConsumerHost);
    fixture.detectChanges();
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    return {
      fixture,
      select: selectDe.componentInstance as CngxSelect<string>,
      host: fixture.componentInstance,
      panel: () => selectDe.nativeElement.querySelector('.cngx-select__panel') as HTMLElement,
      triggerBtn: selectDe.nativeElement.querySelector('.cngx-select__trigger') as HTMLElement,
    };
  }

  it('reads options from state.data() when state is set', () => {
    const { fixture, select, host } = setup();
    host.state.setSuccess(OPTIONS);
    flush(fixture);
    const optionList = select.options();
    // options input is still empty array — the flatOptions must come from state
    expect(optionList.length).toBe(0);
    const flatOptions = (select as unknown as { flatOptions: () => CngxSelectOptionDef<string>[] })
      .flatOptions();
    expect(flatOptions.map((o) => o.value)).toEqual(['red', 'green', 'blue']);
  });

  it('shows spinner (default loading variant) when state is loading (first load)', () => {
    const { fixture, host, panel, triggerBtn } = setup();
    host.state.set('loading');
    triggerBtn.click();
    flush(fixture);
    expect(panel().querySelector('.cngx-select__spinner')).toBeTruthy();
    expect(panel().querySelector('.cngx-select__skeleton')).toBeFalsy();
    expect(panel().querySelector('.cngx-select__option')).toBeFalsy();
  });

  it('respects [skeletonRowCount] input', () => {
    @Component({
      selector: 'skel-count-host',
      template: `
        <cngx-select
          [label]="'X'"
          [state]="state"
          [loadingVariant]="'skeleton'"
          [skeletonRowCount]="7"
          [(value)]="value"
        />
      `,
      imports: [CngxSelect],
    })
    class SkelCountHost {
      readonly state = createManualState<CngxSelectOptionsInput<string>>();
      readonly value = signal<string | undefined>(undefined);
    }
    TestBed.resetTestingModule();
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [SkelCountHost] });
    const fixture = TestBed.createComponent(SkelCountHost);
    fixture.detectChanges();
    flush(fixture);
    fixture.componentInstance.state.set('loading');
    const trigger = fixture.debugElement
      .query(By.directive(CngxSelect))
      .nativeElement.querySelector('.cngx-select__trigger') as HTMLElement;
    trigger.click();
    flush(fixture);
    const panel = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__panel',
    ) as HTMLElement;
    expect(panel.querySelectorAll('.cngx-select__skeleton-row').length).toBe(7);
  });

  it('renders spinner variant when [loadingVariant]="spinner"', () => {
    @Component({
      selector: 'spinner-host',
      template: `
        <cngx-select
          [label]="'X'"
          [state]="state"
          [loadingVariant]="'spinner'"
          [(value)]="value"
        />
      `,
      imports: [CngxSelect],
    })
    class SpinnerHost {
      readonly state = createManualState<CngxSelectOptionsInput<string>>();
      readonly value = signal<string | undefined>(undefined);
    }
    TestBed.resetTestingModule();
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [SpinnerHost] });
    const fixture = TestBed.createComponent(SpinnerHost);
    fixture.detectChanges();
    flush(fixture);
    fixture.componentInstance.state.set('loading');
    const trigger = fixture.debugElement
      .query(By.directive(CngxSelect))
      .nativeElement.querySelector('.cngx-select__trigger') as HTMLElement;
    trigger.click();
    flush(fixture);
    const panel = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__panel',
    ) as HTMLElement;
    expect(panel.querySelector('.cngx-select__spinner')).toBeTruthy();
    expect(panel.querySelector('.cngx-select__skeleton')).toBeFalsy();
  });

  it('shows empty template when state is success with empty data', () => {
    const { fixture, host, panel, triggerBtn } = setup();
    host.state.setSuccess([]);
    triggerBtn.click();
    flush(fixture);
    expect(panel().querySelector('.cngx-select__empty')).toBeTruthy();
  });

  it('shows error panel with retry when state is error (first load)', () => {
    const { fixture, host, panel, triggerBtn } = setup();
    host.state.setError(new Error('network'));
    triggerBtn.click();
    flush(fixture);
    const errorEl = panel().querySelector('.cngx-select__error');
    expect(errorEl).toBeTruthy();
    const retryBtn = errorEl!.querySelector('button.cngx-select__error-retry') as HTMLElement;
    retryBtn.click();
    flush(fixture);
    expect(host.reloadCalls).toBe(1);
    expect(host.retryCount()).toBe(1);
  });

  it('renders options + refresh indicator when state is refreshing', () => {
    const { fixture, host, panel, triggerBtn } = setup();
    host.state.setSuccess(OPTIONS);
    host.state.set('refreshing');
    triggerBtn.click();
    flush(fixture);
    expect(panel().querySelector('.cngx-select__refreshing')).toBeTruthy();
    expect(panel().querySelectorAll('.cngx-select__option').length).toBe(3);
  });

  it('renders spinner refreshing variant when [refreshingVariant]="spinner"', () => {
    @Component({
      selector: 'ref-spinner-host',
      template: `
        <cngx-select
          [label]="'X'"
          [state]="state"
          [refreshingVariant]="'spinner'"
          [(value)]="value"
        />
      `,
      imports: [CngxSelect],
    })
    class RefSpinnerHost {
      readonly state = createManualState<CngxSelectOptionsInput<string>>();
      readonly value = signal<string | undefined>(undefined);
    }
    TestBed.resetTestingModule();
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [RefSpinnerHost] });
    const fixture = TestBed.createComponent(RefSpinnerHost);
    fixture.detectChanges();
    flush(fixture);
    fixture.componentInstance.state.setSuccess(OPTIONS);
    fixture.componentInstance.state.set('refreshing');
    const trigger = fixture.debugElement
      .query(By.directive(CngxSelect))
      .nativeElement.querySelector('.cngx-select__trigger') as HTMLElement;
    trigger.click();
    flush(fixture);
    const panel = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__panel',
    ) as HTMLElement;
    expect(panel.querySelector('.cngx-select__refreshing-spinner')).toBeTruthy();
    expect(panel.querySelector('.cngx-select__refreshing')).toBeFalsy();
    expect(panel.querySelectorAll('.cngx-select__option').length).toBe(3);
  });

  it('[refreshingVariant]="none" suppresses the indicator entirely', () => {
    @Component({
      selector: 'ref-none-host',
      template: `
        <cngx-select
          [label]="'X'"
          [state]="state"
          [refreshingVariant]="'none'"
          [(value)]="value"
        />
      `,
      imports: [CngxSelect],
    })
    class RefNoneHost {
      readonly state = createManualState<CngxSelectOptionsInput<string>>();
      readonly value = signal<string | undefined>(undefined);
    }
    TestBed.resetTestingModule();
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [RefNoneHost] });
    const fixture = TestBed.createComponent(RefNoneHost);
    fixture.detectChanges();
    flush(fixture);
    fixture.componentInstance.state.setSuccess(OPTIONS);
    fixture.componentInstance.state.set('refreshing');
    const trigger = fixture.debugElement
      .query(By.directive(CngxSelect))
      .nativeElement.querySelector('.cngx-select__trigger') as HTMLElement;
    trigger.click();
    flush(fixture);
    const panel = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__panel',
    ) as HTMLElement;
    expect(panel.querySelector('[class*="cngx-select__refreshing"]')).toBeFalsy();
    expect(panel.querySelectorAll('.cngx-select__option').length).toBe(3);
  });

  it('renders options + inline error banner when error hits after a success load', () => {
    const { fixture, host, panel, triggerBtn } = setup();
    host.state.setSuccess(OPTIONS);
    host.state.setError(new Error('stale'));
    triggerBtn.click();
    flush(fixture);
    // Stale options remain visible
    expect(panel().querySelectorAll('.cngx-select__option').length).toBe(3);
    // Error banner sits above them
    const banner = panel().querySelector('.cngx-select__error--inline');
    expect(banner).toBeTruthy();
    const retryBtn = banner!.querySelector('button.cngx-select__error-retry') as HTMLElement;
    retryBtn.click();
    flush(fixture);
    expect(host.reloadCalls).toBe(1);
    expect(host.retryCount()).toBe(1);
  });

  it('falls back to [options] when state is null', () => {
    // Re-render with a host that has no state binding — ensures static array still works.
    @Component({
      selector: 'static-options-host',
      template: `<cngx-select [options]="options" [(value)]="value" />`,
      imports: [CngxSelect],
    })
    class StaticOptionsHost {
      readonly options = OPTIONS;
      readonly value = signal<string | undefined>(undefined);
    }
    TestBed.resetTestingModule();
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [StaticOptionsHost] });
    const fixture = TestBed.createComponent(StaticOptionsHost);
    fixture.detectChanges();
    flush(fixture);
    const listboxDe = fixture.debugElement.query(By.directive(CngxListbox));
    const lb = listboxDe.injector.get(CngxListbox);
    expect(lb.options().length).toBe(3);
  });
});

// ── [commitAction] producer ──────────────────────────────────────────

@Component({
  selector: 'commit-host',
  template: `
    <cngx-select
      [label]="'Color'"
      [options]="options"
      [commitAction]="commitAction"
      [commitMode]="mode()"
      [(value)]="value"
      (commitError)="errors.push($event)"
      (stateChange)="statuses.push($event)"
    />
  `,
  imports: [CngxSelect],
})
class CommitHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>('red');
  readonly mode = signal<CngxSelectCommitMode>('optimistic');
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

describe('CngxSelect — commit action producer', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [CommitHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<CommitHost>>;
    select: CngxSelect<string>;
    host: CommitHost;
    triggerBtn: HTMLElement;
    firstOption: () => HTMLElement;
    secondOption: () => HTMLElement;
  } {
    const fixture = TestBed.createComponent(CommitHost);
    fixture.detectChanges();
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    return {
      fixture,
      select: selectDe.componentInstance as CngxSelect<string>,
      host: fixture.componentInstance,
      triggerBtn: selectDe.nativeElement.querySelector(
        '.cngx-select__trigger',
      ) as HTMLElement,
      firstOption: () =>
        selectDe.nativeElement.querySelector('[cngxOption]:nth-of-type(1)') as HTMLElement,
      secondOption: () =>
        selectDe.nativeElement.querySelector('[cngxOption]:nth-of-type(2)') as HTMLElement,
    };
  }

  it('optimistic success: value stays at intended, selectionChange emits on success', () => {
    const { fixture, host, triggerBtn, secondOption } = setup();
    let lastChange: CngxSelectChange<string> | null = null;
    fixture.debugElement.query(By.directive(CngxSelect)).componentInstance
      .selectionChange.subscribe((c: CngxSelectChange<string>) => (lastChange = c));

    triggerBtn.click();
    flush(fixture);
    secondOption().click();
    flush(fixture);

    // Pending: value reflects intended optimistically, no selectionChange yet
    expect(host.value()).toBe('green');
    expect(lastChange).toBeNull();
    expect(host.statuses[host.statuses.length - 1]).toBe('pending');

    host.pending!.next('green');
    host.pending!.complete();
    flush(fixture);

    expect(host.value()).toBe('green');
    expect(lastChange!.value).toBe('green');
    expect(host.statuses[host.statuses.length - 1]).toBe('success');
  });

  it('optimistic error: value rolls back, commitError emits', () => {
    const { fixture, host, triggerBtn, secondOption } = setup();
    triggerBtn.click();
    flush(fixture);
    secondOption().click();
    flush(fixture);

    expect(host.value()).toBe('green');

    const err = new Error('server down');
    host.pending!.error(err);
    flush(fixture);

    expect(host.value()).toBe('red');
    expect(host.errors).toEqual([err]);
    expect(host.statuses[host.statuses.length - 1]).toBe('error');
  });

  it('pessimistic success: panel stays open during pending, value written on success', () => {
    const { fixture, host, select, triggerBtn, secondOption } = setup();
    host.mode.set('pessimistic');
    flush(fixture);
    triggerBtn.click();
    flush(fixture);
    secondOption().click();
    flush(fixture);

    // Pessimistic semantics: panel stays open, value NOT yet written.
    // The pending spinner on the intended option conveys the attempt.
    expect(select.panelOpen()).toBe(true);
    expect(host.value()).toBe('red');
    expect(select.isCommitting()).toBe(true);

    host.pending!.next('green');
    host.pending!.complete();
    flush(fixture);

    // After success: value settles, panel closes.
    expect(host.value()).toBe('green');
    expect(select.panelOpen()).toBe(false);
    expect(select.isCommitting()).toBe(false);
  });

  it('supersede: a second pick aborts the in-flight commit', () => {
    const { fixture, host, triggerBtn, firstOption, secondOption } = setup();
    triggerBtn.click();
    flush(fixture);
    secondOption().click();
    flush(fixture);
    const firstPending = host.pending!;
    const firstCount = host.commitCallCount;

    // Second pick while first is pending
    triggerBtn.click();
    flush(fixture);
    firstOption().click();
    flush(fixture);
    expect(host.commitCallCount).toBeGreaterThan(firstCount);

    // First pending resolves too late — should be ignored
    const statusesBefore = [...host.statuses];
    firstPending.next('green');
    firstPending.complete();
    flush(fixture);
    expect(host.statuses).toEqual(statusesBefore);
  });

  it('provides CNGX_STATEFUL that resolves to commitState', () => {
    const { fixture, select } = setup();
    const stateful = fixture.debugElement
      .query(By.directive(CngxSelect))
      .injector.get(CNGX_STATEFUL);
    expect(stateful.state).toBe(select.commitState);
  });
});

// ── Announcer + autofocus + config cascade ───────────────────────────

@Component({
  selector: 'announcer-host',
  template: `
    <cngx-select [label]="'Lang'" [options]="options" [(value)]="value" />
  `,
  imports: [CngxSelect],
})
class AnnouncerHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

@Component({
  selector: 'announcer-off-host',
  template: `
    <cngx-select
      [label]="'Lang'"
      [options]="options"
      [(value)]="value"
      [announceChanges]="false"
    />
  `,
  imports: [CngxSelect],
})
class AnnouncerOffHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

describe('CngxSelect — announcer', () => {
  beforeEach(() => polyfillPopover());

  it('announces selection changes via the live region', () => {
    TestBed.configureTestingModule({ imports: [AnnouncerHost] });
    const announcer = TestBed.inject(CngxSelectAnnouncer);
    const spy = vi.spyOn(announcer, 'announce');
    const fixture = TestBed.createComponent(AnnouncerHost);
    fixture.detectChanges();
    flush(fixture);
    const trigger = fixture.debugElement
      .query(By.directive(CngxSelect))
      .nativeElement.querySelector('.cngx-select__trigger') as HTMLElement;
    trigger.click();
    flush(fixture);
    const firstOption = fixture.debugElement.nativeElement.querySelector(
      '[cngxOption]',
    ) as HTMLElement;
    firstOption.click();
    flush(fixture);
    expect(spy).toHaveBeenCalled();
  });

  it('suppresses announcements when [announceChanges]="false"', () => {
    TestBed.configureTestingModule({ imports: [AnnouncerOffHost] });
    const announcer = TestBed.inject(CngxSelectAnnouncer);
    const spy = vi.spyOn(announcer, 'announce');
    const fixture = TestBed.createComponent(AnnouncerOffHost);
    fixture.detectChanges();
    flush(fixture);
    const trigger = fixture.debugElement
      .query(By.directive(CngxSelect))
      .nativeElement.querySelector('.cngx-select__trigger') as HTMLElement;
    trigger.click();
    flush(fixture);
    const firstOption = fixture.debugElement.nativeElement.querySelector(
      '[cngxOption]',
    ) as HTMLElement;
    firstOption.click();
    flush(fixture);
    expect(spy).not.toHaveBeenCalled();
  });
});

@Component({
  selector: 'autofocus-host',
  template: `
    <cngx-select [label]="'Lang'" [options]="options" [(value)]="value" [autofocus]="true" />
  `,
  imports: [CngxSelect],
})
class AutofocusHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

describe('CngxSelect — autofocus', () => {
  beforeEach(() => polyfillPopover());

  it('[autofocus]="true" focuses the trigger after first render', async () => {
    TestBed.configureTestingModule({ imports: [AutofocusHost] });
    const fixture = TestBed.createComponent(AutofocusHost);
    fixture.detectChanges();
    await fixture.whenStable();
    flush(fixture);
    const trigger = fixture.debugElement
      .query(By.directive(CngxSelect))
      .nativeElement.querySelector('.cngx-select__trigger') as HTMLElement;
    expect(document.activeElement).toBe(trigger);
  });
});

@Component({
  selector: 'config-cascade-host',
  template: `<cngx-select [label]="'X'" [options]="options" [(value)]="value" />`,
  imports: [CngxSelect],
})
class ConfigCascadeHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

@Component({
  selector: 'config-cascade-input-host',
  template: `
    <cngx-select [label]="'X'" [options]="options" [(value)]="value" [panelWidth]="'trigger'" />
  `,
  imports: [CngxSelect],
})
class ConfigCascadeInputHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

describe('CngxSelect — config cascade (input > component-scope > app-scope > default)', () => {
  beforeEach(() => polyfillPopover());

  it('app-scope provideSelectConfig sets default panelWidth', () => {
    TestBed.configureTestingModule({
      imports: [ConfigCascadeHost],
      providers: [provideSelectConfig(withPanelWidth(200))],
    });
    const fixture = TestBed.createComponent(ConfigCascadeHost);
    fixture.detectChanges();
    flush(fixture);
    const panel = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__panel',
    ) as HTMLElement;
    expect(panel.style.getPropertyValue('--cngx-select-panel-min-width')).toBe('200px');
  });

  it('per-instance input wins over app-scope config', () => {
    TestBed.configureTestingModule({
      imports: [ConfigCascadeInputHost],
      providers: [provideSelectConfig(withPanelWidth(200))],
    });
    const fixture = TestBed.createComponent(ConfigCascadeInputHost);
    fixture.detectChanges();
    flush(fixture);
    const panel = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__panel',
    ) as HTMLElement;
    expect(panel.style.getPropertyValue('--cngx-select-panel-min-width')).toBe('anchor-size(width)');
  });

  it('component-scope provideSelectConfigAt overrides app-scope', () => {
    @Component({
      selector: 'scoped-host',
      template: `<cngx-select [label]="'X'" [options]="options" [(value)]="value" />`,
      imports: [CngxSelect],
      viewProviders: [...provideSelectConfigAt(withPanelWidth(300))],
    })
    class ScopedHost {
      readonly options = OPTIONS;
      readonly value = signal<string | undefined>(undefined);
    }
    TestBed.configureTestingModule({
      imports: [ScopedHost],
      providers: [provideSelectConfig(withPanelWidth(100))],
    });
    const fixture = TestBed.createComponent(ScopedHost);
    fixture.detectChanges();
    flush(fixture);
    const panel = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__panel',
    ) as HTMLElement;
    expect(panel.style.getPropertyValue('--cngx-select-panel-min-width')).toBe('300px');
  });

  it('loadingVariant config applied across instances', () => {
    @Component({
      selector: 'lv-host',
      template: `
        <cngx-select [label]="'X'" [state]="state" [(value)]="value" />
      `,
      imports: [CngxSelect],
    })
    class LvHost {
      readonly state = createManualState<CngxSelectOptionsInput<string>>();
      readonly value = signal<string | undefined>(undefined);
    }
    TestBed.configureTestingModule({
      imports: [LvHost],
      providers: [provideSelectConfig(withLoadingVariant('bar'))],
    });
    const fixture = TestBed.createComponent(LvHost);
    fixture.detectChanges();
    flush(fixture);
    fixture.componentInstance.state.set('loading');
    const trigger = fixture.debugElement
      .query(By.directive(CngxSelect))
      .nativeElement.querySelector('.cngx-select__trigger') as HTMLElement;
    trigger.click();
    flush(fixture);
    const panel = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__panel',
    ) as HTMLElement;
    expect(panel.querySelector('.cngx-select__loading-bar')).toBeTruthy();
  });

  it('exposes config via injectSelectConfig()', () => {
    @Component({
      selector: 'inject-host',
      template: ``,
      imports: [],
    })
    class InjectHost {
      readonly config = injectSelectConfig();
    }
    TestBed.configureTestingModule({
      imports: [InjectHost],
      providers: [provideSelectConfig(withPanelWidth(250))],
    });
    const fixture = TestBed.createComponent(InjectHost);
    expect(fixture.componentInstance.config.panelWidth).toBe(250);
  });

  it('raw CNGX_SELECT_CONFIG token is populated by provideSelectConfig', () => {
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withPanelWidth(500))],
    });
    const raw = TestBed.inject(CNGX_SELECT_CONFIG);
    expect(raw.panelWidth).toBe(500);
  });
});
