import { Component, signal, type TemplateRef, viewChild, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CngxListbox } from '@cngx/common/interactive';
import {
  CngxPopover,
  CngxPopoverSheet,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationRequest,
} from '@cngx/common/popover';
import { CNGX_FORM_FIELD_HOST, type CngxFormFieldHostContract } from '@cngx/core/tokens';
import { describe, expect, it, vi } from 'vitest';

import {
  CNGX_SELECT_SHEET_HEADER_HOST,
  type CngxSelectSheetHeaderHost,
} from '../../sheet-header-host';
import type { CngxSelectSheetHandleContext } from '../../template-slots';
import type { CngxResolvedSelectAriaLabels } from '../resolve-labels';
import { CngxSelectSheetHeader } from './sheet-header.component';

interface Harness {
  readonly panelVisible: WritableSignal<boolean>;
  readonly closeBlocked: WritableSignal<boolean>;
  readonly showDone: WritableSignal<boolean>;
  readonly showInput: WritableSignal<boolean>;
  readonly sheetLabel: WritableSignal<string | undefined>;
  readonly label: WritableSignal<string>;
  readonly handleTpl: WritableSignal<TemplateRef<CngxSelectSheetHandleContext> | null>;
  readonly close: ReturnType<typeof vi.fn>;
  readonly host: CngxSelectSheetHeaderHost;
}

function createHarness(): Harness {
  const panelVisible = signal(false);
  const closeBlocked = signal(false);
  const showDone = signal(true);
  const showInput = signal(false);
  const sheetLabel = signal<string | undefined>(undefined);
  const label = signal('');
  const handleTpl = signal<TemplateRef<CngxSelectSheetHandleContext> | null>(null);
  const close = vi.fn();
  const host: CngxSelectSheetHeaderHost = {
    panelVisible,
    presentation: signal<CngxPopoverPresentation>('sheet'),
    closeBlocked,
    showDone,
    showInput,
    sheetLabel,
    label,
    ariaLabels: signal({
      fieldLabelFallback: 'Selection',
      sheetClose: 'Close',
      sheetDone: 'Done',
    } as CngxResolvedSelectAriaLabels),
    tpl: { sheetHandle: handleTpl },
    searchTerm: signal(''),
    setSearchTerm: vi.fn(),
    listboxRef: signal<CngxListbox | undefined>(undefined),
    panelId: signal('panel-1'),
    close,
    escapeClose: vi.fn(),
  };
  return {
    panelVisible,
    closeBlocked,
    showDone,
    showInput,
    sheetLabel,
    label,
    handleTpl,
    close,
    host,
  };
}

@Component({
  imports: [CngxPopover, CngxPopoverSheet, CngxSelectSheetHeader],
  template: `
    <span id="field-label">Favourite colour</span>
    <div cngxPopover #pop="cngxPopover" [cngxPopoverSheet]="request()">
      <cngx-select-sheet-header />
      <ul tabindex="0">
        <li>Red</li>
      </ul>
    </div>
    <ng-template #handle let-dragging="dragging">
      <i class="custom-grip" [attr.data-dragging]="dragging"></i>
    </ng-template>
  `,
})
class SheetHost {
  readonly request = signal<CngxPopoverPresentationRequest>('sheet');
  readonly pop = viewChild.required(CngxPopover);
  readonly handle = viewChild.required<TemplateRef<CngxSelectSheetHandleContext>>('handle');
}

function setup(options: { fieldHost?: boolean } = {}) {
  const harness = createHarness();
  const fieldHost = { labelId: signal('field-label') } as unknown as CngxFormFieldHostContract;
  TestBed.configureTestingModule({
    providers: [
      { provide: CNGX_SELECT_SHEET_HEADER_HOST, useValue: harness.host },
      ...(options.fieldHost === false
        ? []
        : [{ provide: CNGX_FORM_FIELD_HOST, useValue: fieldHost }]),
    ],
  });
  const fixture = TestBed.createComponent(SheetHost);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const open = () => {
    harness.panelVisible.set(true);
    fixture.componentInstance.pop().show();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  const close = () => {
    harness.panelVisible.set(false);
    fixture.componentInstance.pop().hide();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  const title = () => el.querySelector<HTMLElement>('.cngx-select-sheet-header__title')!;
  return { harness, fixture, el, open, close, title };
}

describe('CngxSelectSheetHeader', () => {
  it('reads the field label once per open', () => {
    const { el, open, close, title } = setup();
    open();
    expect(title().textContent?.trim()).toBe('Favourite colour');

    el.querySelector('#field-label')!.textContent = 'Colour';
    TestBed.flushEffects();
    expect(title().textContent?.trim()).toBe('Favourite colour');

    close();
    open();
    expect(title().textContent?.trim()).toBe('Colour');
  });

  it('lets sheetLabel win over the field label', () => {
    const { harness, fixture, open, title } = setup();
    harness.sheetLabel.set('Pick a colour');
    open();
    fixture.detectChanges();
    expect(title().textContent?.trim()).toBe('Pick a colour');
  });

  it('falls back to label, then fieldLabelFallback without a field host', () => {
    const { harness, fixture, open, title } = setup({ fieldHost: false });
    open();
    expect(title().textContent?.trim()).toBe('Selection');
    harness.label.set('Colour');
    fixture.detectChanges();
    expect(title().textContent?.trim()).toBe('Colour');
  });

  it('names the dialog by the in-panel title, never the header root or the field label', () => {
    const { el, open, title } = setup();
    open();
    const panel = el.querySelector<HTMLElement>('[cngxpopover]')!;
    const labelledBy = panel.getAttribute('aria-labelledby');
    expect(labelledBy).toBe(title().id);
    expect(labelledBy).not.toBe('field-label');
    expect(el.querySelector('cngx-select-sheet-header')!.id).not.toBe(labelledBy);
    expect(el.querySelector(`#${labelledBy}`)!.textContent?.trim()).toBe('Favourite colour');
  });

  it('renders X and Done aria-disabled and inert while a close is blocked', () => {
    const { harness, fixture, el, open } = setup();
    open();
    const done = el.querySelector<HTMLButtonElement>('.cngx-select-sheet-header__done')!;
    const x = el.querySelector<HTMLButtonElement>('.cngx-select-sheet-header__close')!;
    expect(x.getAttribute('aria-label')).toBe('Close');
    expect(done.textContent?.trim()).toBe('Done');
    expect(x.hasAttribute('aria-disabled')).toBe(false);

    harness.closeBlocked.set(true);
    fixture.detectChanges();
    expect(x.getAttribute('aria-disabled')).toBe('true');
    expect(done.getAttribute('aria-disabled')).toBe('true');
    x.click();
    done.click();
    expect(harness.close).not.toHaveBeenCalled();

    harness.closeBlocked.set(false);
    fixture.detectChanges();
    x.click();
    expect(harness.close).toHaveBeenCalledTimes(1);
  });

  it('hides Done when the variant does not show it', () => {
    const { harness, fixture, el } = setup();
    harness.showDone.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-select-sheet-header__done')).toBeNull();
  });

  it('renders the decorative handle by default and the slot inside an aria-hidden wrapper', () => {
    const { harness, fixture, el } = setup();
    expect(el.querySelector('[cngxpopoversheethandle]')!.getAttribute('aria-hidden')).toBe('true');

    harness.handleTpl.set(fixture.componentInstance.handle());
    fixture.detectChanges();
    const grip = el.querySelector('.custom-grip')!;
    expect(grip.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(grip.getAttribute('data-dragging')).toBe('false');
    expect(el.querySelector('[cngxpopoversheethandle]')).toBeNull();
  });

  it('renders the header input as a combobox that controls the panel', () => {
    const { harness, fixture, el, title } = setup();
    harness.showInput.set(true);
    fixture.detectChanges();
    const input = el.querySelector<HTMLInputElement>('.cngx-select-sheet-header__input')!;
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe('panel-1');
    expect(input.getAttribute('aria-labelledby')).toBe(title().id);

    input.value = 're';
    input.dispatchEvent(new Event('input'));
    expect(harness.host.setSearchTerm).toHaveBeenCalledWith('re');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(harness.host.escapeClose).not.toHaveBeenCalled();
  });
});
