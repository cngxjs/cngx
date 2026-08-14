import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideCommands, type CngxCommand } from '@cngx/common/command';
import { CNGX_FORM_FIELD_CONTROL } from '@cngx/forms/field';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxCommandPalette } from './command-palette.component';
import { CngxCommandPaletteTrigger } from './command-palette-trigger.directive';

function cmd(id: string, label: string, extra: Partial<CngxCommand> = {}): CngxCommand {
  return { id, label, run: () => {}, ...extra };
}

// JSDOM/happy-dom does not implement HTMLDialogElement.showModal/show/close.
function stubDialogElement(el: HTMLDialogElement): void {
  el.showModal ??= vi.fn(() => el.setAttribute('open', ''));
  el.show ??= vi.fn(() => el.setAttribute('open', ''));
  const originalClose = el.close?.bind(el);
  el.close = vi.fn(() => {
    el.removeAttribute('open');
    try {
      originalClose?.();
    } catch {
      // JSDOM may throw
    }
  });
  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

@Component({
  standalone: true,
  imports: [CngxCommandPalette, CngxCommandPaletteTrigger],
  template: `
    <button id="trigger" [cngxCommandPaletteTrigger]="palette">Open</button>
    <cngx-command-palette #palette />
  `,
})
class Host {
  readonly palette = viewChild.required(CngxCommandPalette);
}

describe('CngxCommandPalette', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  let dialogEl: HTMLDialogElement;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function configure(commands: CngxCommand[] = []): void {
    TestBed.configureTestingModule({ providers: [provideCommands(commands)] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    stubDialogElement(dialogEl);
  }

  function openFully(): void {
    fixture.componentInstance.palette().open();
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  }

  it('opens via open() and reaches the open lifecycle', () => {
    configure();
    openFully();
    expect(dialogEl.showModal).toHaveBeenCalled();
    expect(fixture.componentInstance.palette().isOpen()).toBe(true);
  });

  it('opens when the trigger is clicked', () => {
    configure();
    (fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement).click();
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    expect(fixture.componentInstance.palette().isOpen()).toBe(true);
  });

  it('restores focus to the trigger on dismiss', () => {
    configure();
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
    trigger.focus();
    openFully();
    fixture.componentInstance.palette().dismiss();
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect((document.activeElement as HTMLElement)?.id).toBe('trigger');
  });

  it('runs the active command on Enter and dismisses', () => {
    const run = vi.fn();
    configure([cmd('save', 'Save', { run })]);
    openFully();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.flushEffects();
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    expect(run).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.palette().isOpen()).toBe(false);
  });

  it('exposes a polite result-count live region', () => {
    configure([cmd('a', 'Alpha')]);
    openFully();
    // CngxDialog appends its own aria-live region, so match on content.
    const regions = Array.from(
      fixture.nativeElement.querySelectorAll('[aria-live="polite"]'),
    ) as HTMLElement[];
    const counts = regions.map((el) => el.textContent ?? '').join(' ');
    expect(counts).toContain('result');
  });

  it('gives the dialog an accessible name', () => {
    configure();
    expect(dialogEl.getAttribute('aria-label')).toBe('Command palette');
  });

  it('provides no CNGX_FORM_FIELD_CONTROL - the demarcation from CngxCombobox', () => {
    configure();
    const paletteDe = fixture.debugElement.query(By.directive(CngxCommandPalette));
    expect(paletteDe.injector.get(CNGX_FORM_FIELD_CONTROL, null)).toBeNull();
  });
});
