import {
  Component,
  signal,
  viewChild,
  type EnvironmentProviders,
  type Provider,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideCommands, type CngxCommand } from '@cngx/common/command';
import { parseKeyCombo } from '@cngx/core/utils';
import { CNGX_FORM_FIELD_CONTROL } from '@cngx/forms/field';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideCommandPaletteConfig, withPaletteShortcut } from '../config/command-palette-config';
import { CngxCommandPalette } from './command-palette.component';
import { CngxCommandPaletteTrigger } from './command-palette-trigger.directive';
import {
  CNGX_PALETTE_KEYBINDING_FACTORY,
  createPaletteKeybinding,
  type CngxPaletteKeybindingFactory,
} from './palette-keybinding';

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
    <cngx-command-palette #palette [openShortcut]="shortcut()" />
  `,
})
class Host {
  readonly palette = viewChild.required(CngxCommandPalette);
  readonly shortcut: WritableSignal<string | undefined> = signal(undefined);
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

  function configure(
    commands: CngxCommand[] = [],
    extraProviders: (Provider | EnvironmentProviders)[] = [],
    shortcut?: string,
  ): void {
    TestBed.configureTestingModule({ providers: [provideCommands(commands), ...extraProviders] });
    fixture = TestBed.createComponent(Host);
    if (shortcut !== undefined) {
      fixture.componentInstance.shortcut.set(shortcut);
    }
    fixture.detectChanges();
    TestBed.flushEffects();
    dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    stubDialogElement(dialogEl);
  }

  function optionIds(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="option"]')).map(
      (el) => (el as HTMLElement).id,
    );
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

  it('derives the trigger aria-expanded from the isOpen host seam', () => {
    configure();
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    openFully();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    fixture.componentInstance.palette().dismiss();
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens on the Cmd/Ctrl+K global combo', () => {
    configure();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }),
    );
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    expect(fixture.componentInstance.palette().isOpen()).toBe(true);
  });

  it('moves aria-activedescendant with ArrowDown', () => {
    configure([cmd('save', 'Save'), cmd('reload', 'Reload')]);
    openFully();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const ids = optionIds();
    expect(input.getAttribute('aria-activedescendant')).toBe(ids[0]);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(input.getAttribute('aria-activedescendant')).toBe(ids[1]);
  });

  it('opens via an overridden keybinding factory with zero palette edits', () => {
    const factory: CngxPaletteKeybindingFactory = (_combo, onOpen) =>
      createPaletteKeybinding(parseKeyCombo('f2'), onOpen, false);
    configure([], [{ provide: CNGX_PALETTE_KEYBINDING_FACTORY, useValue: factory }]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }));
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    expect(fixture.componentInstance.palette().isOpen()).toBe(true);
  });

  it('opens on a per-instance [openShortcut] combo', () => {
    configure([], [], 'mod+p');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, metaKey: true }));
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    expect(fixture.componentInstance.palette().isOpen()).toBe(true);
  });

  it('opens on the combo set globally by withPaletteShortcut', () => {
    configure([], [provideCommandPaletteConfig(withPaletteShortcut('mod+j'))]);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true, metaKey: true }));
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    expect(fixture.componentInstance.palette().isOpen()).toBe(true);
  });

  it('per-instance [openShortcut] wins over the config combo', () => {
    configure([], [provideCommandPaletteConfig(withPaletteShortcut('mod+j'))], 'mod+p');
    // The config combo must NOT open it...
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true, metaKey: true }));
    vi.advanceTimersByTime(16);
    fixture.detectChanges();
    expect(fixture.componentInstance.palette().isOpen()).toBe(false);
    // ...the instance combo does.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, metaKey: true }));
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
