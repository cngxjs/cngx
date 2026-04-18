import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListbox } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { CNGX_FORM_FIELD_CONTROL, CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '../../field/src/testing/mock-field';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';

import { CngxSelect, type CngxSelectChange } from './select.component';
import { injectSelectConfig, injectSelectAnnouncer } from './shared/inject-helpers';
import type { CngxSelectOptionDef, CngxSelectOptionsInput } from './shared/option.model';

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
    />
  `,
  imports: [CngxSelect],
})
class StandaloneA11yHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>('red');
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
    triggerBtn: HTMLButtonElement;
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
      triggerBtn: selectDe.nativeElement.querySelector('button.cngx-select__trigger') as HTMLButtonElement,
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
      'button.cngx-select__trigger',
    ) as HTMLButtonElement;
    expect(trigger.getAttribute('aria-label')).toBe('Choose color');
    expect(trigger.getAttribute('aria-required')).toBe('true');
  });

  it('renders a clear button when [clearable]="true" and clearing resets value', () => {
    const fixture = TestBed.createComponent(StandaloneA11yHost);
    fixture.detectChanges();
    flush(fixture);
    const clear = fixture.debugElement.nativeElement.querySelector(
      '.cngx-select__clear',
    ) as HTMLButtonElement;
    expect(clear).toBeTruthy();
    clear.click();
    flush(fixture);
    expect(fixture.componentInstance.value()).toBeUndefined();
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
    triggerBtn: HTMLButtonElement;
    ref: MockFieldRef<string>;
  } {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    return {
      fixture,
      select: selectDe.componentInstance as CngxSelect<string>,
      triggerBtn: selectDe.nativeElement.querySelector('button.cngx-select__trigger') as HTMLButtonElement,
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
    expect(selectHost.getAttribute('aria-describedby')).toContain('cngx-color-hint');
    expect(selectHost.getAttribute('aria-describedby')).toContain('cngx-color-error');
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
    triggerBtn: HTMLButtonElement;
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
      triggerBtn: selectDe.nativeElement.querySelector('button.cngx-select__trigger') as HTMLButtonElement,
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

  it('shows skeleton rows when state is loading (first load)', () => {
    const { fixture, host, panel, triggerBtn } = setup();
    host.state.set('loading');
    triggerBtn.click();
    flush(fixture);
    expect(panel().querySelector('.cngx-select__skeleton')).toBeTruthy();
    expect(panel().querySelectorAll('.cngx-select__skeleton-row').length).toBeGreaterThan(0);
    expect(panel().querySelector('.cngx-select__option')).toBeFalsy();
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
    const retryBtn = errorEl!.querySelector('button.cngx-select__error-retry') as HTMLButtonElement;
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
    const retryBtn = banner!.querySelector('button.cngx-select__error-retry') as HTMLButtonElement;
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
